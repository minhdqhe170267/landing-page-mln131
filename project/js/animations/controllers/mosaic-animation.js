/**
 * MosaicAnimationController - Mosaic grid animations
 * Handles 3D tilt, neighbor push, gradient borders, inner glow, and floating animation
 * 
 * Requirements:
 * - 6.1: 3D tilt effect on hover based on mouse position
 * - 6.2: rotateX/rotateY calculation from cursor position relative to tile center
 * - 6.3: Push neighboring tiles away with force calculation
 * - 6.6: Inner glow effect using CSS custom properties (--mouse-x, --mouse-y)
 * - 6.7: Subtle floating animation for non-hovered tiles
 * 
 * Properties:
 * - Property 14: Mosaic 3D Tilt - rotateX proportional to (my - cy) / tileHeight, 
 *                rotateY proportional to (cx - mx) / tileWidth, clamped to maxTiltAngle
 * - Property 15: Mosaic Neighbor Push - push force proportional to (1 - d/pushRadius),
 *                direction away from hovered tile
 * - Property 16: Mosaic Inner Glow - --mouse-x and --mouse-y set to (x/width)*100% and (y/height)*100%
 * - Property 17: Mosaic Floating - floatY = sin(t + i * offset) * amplitude,
 *                floatRotate = sin(t * 0.5 + i * offset) * rotateAmplitude
 * 
 * @module animations/controllers/mosaic-animation
 */

import { lerp, clamp } from '../utils/lerp.js';
import { GPUAccelerator } from '../core/gpu-accelerator.js';
import { prefersReducedMotion } from '../core/reduced-motion.js';

/**
 * Default configuration for mosaic animations
 */
const DEFAULT_CONFIG = {
    // Selectors for finding elements
    selectors: {
        container: '.mosaic-grid',
        tiles: '.mosaic-tile',
        tileContent: '.mosaic-tile__content'
    },
    
    // 3D Tilt settings (Requirements 6.1, 6.2)
    tilt: {
        maxAngle: 15,           // Maximum tilt angle in degrees
        perspective: 1000,      // Perspective value in pixels
        scale: 1.05,            // Scale on hover
        transitionDuration: 300 // Transition duration in ms
    },
    
    // Neighbor push settings (Requirement 6.3)
    push: {
        radius: 200,            // Push effect radius in pixels
        maxForce: 30,           // Maximum push distance in pixels
        easing: 0.15            // Lerp easing for smooth push
    },
    
    // Inner glow settings (Requirement 6.6)
    glow: {
        enabled: true,
        intensity: 0.6          // Glow intensity (0-1)
    },
    
    // Floating animation settings (Requirement 6.7)
    floating: {
        amplitude: 8,           // Float Y amplitude in pixels
        rotateAmplitude: 2,     // Float rotation amplitude in degrees
        speed: 0.001,           // Animation speed multiplier
        offset: 0.5             // Phase offset between tiles
    }
};

/**
 * MosaicTile interface
 * @typedef {Object} MosaicTile
 * @property {HTMLElement} element - The tile DOM element
 * @property {DOMRect} bounds - Cached bounding rectangle
 * @property {boolean} isHovering - Whether tile is being hovered
 * @property {number} floatOffset - Phase offset for floating animation
 * @property {number} tiltX - Current tilt X angle
 * @property {number} tiltY - Current tilt Y angle
 * @property {number} pushX - Current push X offset
 * @property {number} pushY - Current push Y offset
 * @property {number} targetPushX - Target push X offset
 * @property {number} targetPushY - Target push Y offset
 * @property {number} index - Tile index in the grid
 */

/**
 * MosaicAnimationController class
 * Manages mosaic grid animations including 3D tilt, neighbor push, and floating effects
 */
class MosaicAnimationController {
    /**
     * Create a MosaicAnimationController instance
     * @param {HTMLElement} container - The mosaic container element
     * @param {Object} [options] - Configuration options
     */
    constructor(container, options = {}) {
        /**
         * Mosaic container element
         * @type {HTMLElement}
         */
        this.container = container;
        
        /**
         * Array of tile configurations
         * @type {MosaicTile[]}
         */
        this.tiles = [];
        
        /**
         * Currently active (hovered) tile
         * @type {MosaicTile|null}
         */
        this.activeTile = null;
        
        /**
         * Configuration options (merged with defaults)
         * @type {Object}
         */
        this.config = this._mergeConfig(DEFAULT_CONFIG, options);
        
        /**
         * Whether the controller is initialized
         * @type {boolean}
         */
        this.isInitialized = false;
        
        /**
         * Whether reduced motion is enabled
         * @type {boolean}
         */
        this.isReducedMotion = false;
        
        /**
         * Whether device is touch-only (Requirement 10.2)
         * @type {boolean}
         */
        this.isTouchDevice = false;
        
        /**
         * RAF ID for animation loop
         * @type {number|null}
         */
        this.rafId = null;
        
        /**
         * Whether animation loop is running
         * @type {boolean}
         */
        this.isRunning = false;
        
        /**
         * Current timestamp for floating animation
         * @type {number}
         */
        this.timestamp = 0;
        
        /**
         * Bound event handlers
         * @type {Object}
         */
        this.boundHandlers = {
            onResize: this._onResize.bind(this)
        };
    }

    /**
     * Deep merge configuration objects
     * @private
     * @param {Object} defaults - Default configuration
     * @param {Object} overrides - Override configuration
     * @returns {Object} Merged configuration
     */
    _mergeConfig(defaults, overrides) {
        const result = { ...defaults };
        
        for (const key of Object.keys(overrides)) {
            if (overrides[key] && typeof overrides[key] === 'object' && !Array.isArray(overrides[key])) {
                result[key] = this._mergeConfig(defaults[key] || {}, overrides[key]);
            } else if (overrides[key] !== undefined) {
                result[key] = overrides[key];
            }
        }
        
        return result;
    }

    /**
     * Detect if device is touch-only
     * @private
     * @returns {boolean} True if touch device
     * 
     * Validates: Requirements 10.2
     */
    _detectTouchDevice() {
        return ('ontouchstart' in window) || 
               (navigator.maxTouchPoints > 0) ||
               (navigator.msMaxTouchPoints > 0);
    }

    /**
     * Initialize the mosaic animation controller
     * Sets up tiles, event listeners, and starts animation loop
     * 
     * @returns {boolean} - True if initialization was successful
     * 
     * Validates: Requirements 6.1, 6.2, 6.3, 6.6, 6.7
     */
    init() {
        if (this.isInitialized) {
            return true;
        }
        
        if (!this.container) {
            console.warn('MosaicAnimationController: No container provided');
            return false;
        }
        
        // Check for reduced motion preference
        this.isReducedMotion = prefersReducedMotion();
        
        // Detect touch device (Requirement 10.2)
        this.isTouchDevice = this._detectTouchDevice();
        
        // Setup tiles
        this._setupTiles();
        
        // Bind resize event
        window.addEventListener('resize', this.boundHandlers.onResize, { passive: true });
        
        this.isInitialized = true;
        
        // Start animation loop if not reduced motion
        if (!this.isReducedMotion) {
            this.start();
        } else {
            // Show all tiles immediately for reduced motion
            this._showAllTilesImmediately();
        }
        
        return true;
    }

    /**
     * Setup mosaic tiles
     * Finds tiles, applies GPU acceleration, and binds events
     * @private
     */
    _setupTiles() {
        // Find all tiles
        const tileElements = this.container.querySelectorAll(this.config.selectors.tiles);
        
        this.tiles = [];
        
        tileElements.forEach((element, index) => {
            // Apply GPU acceleration
            GPUAccelerator.accelerate(element);
            GPUAccelerator.setWillChange(element, ['transform', 'opacity']);
            
            // Get initial bounds
            const bounds = element.getBoundingClientRect();
            
            // Create tile configuration
            const tile = {
                element,
                bounds,
                isHovering: false,
                floatOffset: index * this.config.floating.offset,
                tiltX: 0,
                tiltY: 0,
                pushX: 0,
                pushY: 0,
                targetPushX: 0,
                targetPushY: 0,
                index
            };
            
            this.tiles.push(tile);
            
            // Bind tile events
            this.bindTile(tile);
        });
    }

    /**
     * Bind events to a tile
     * Sets up mousemove, mouseenter, and mouseleave handlers
     * 
     * @param {MosaicTile} tile - The tile to bind events to
     */
    bindTile(tile) {
        const { element } = tile;
        
        // Store bound handlers on tile for cleanup
        tile.handlers = {
            mouseenter: (e) => this._onTileMouseEnter(tile, e),
            mousemove: (e) => this._onTileMouseMove(tile, e),
            mouseleave: (e) => this._onTileMouseLeave(tile, e)
        };
        
        // Bind events
        element.addEventListener('mouseenter', tile.handlers.mouseenter);
        element.addEventListener('mousemove', tile.handlers.mousemove);
        element.addEventListener('mouseleave', tile.handlers.mouseleave);
    }

    /**
     * Handle tile mouse enter
     * @private
     * @param {MosaicTile} tile - The tile
     * @param {MouseEvent} e - Mouse event
     */
    _onTileMouseEnter(tile, e) {
        if (this.isReducedMotion) return;
        
        tile.isHovering = true;
        this.activeTile = tile;
        
        // Update bounds on hover (in case of scroll/resize)
        tile.bounds = tile.element.getBoundingClientRect();
        
        // Add hover class
        tile.element.classList.add('mosaic-tile--hovering');
    }

    /**
     * Handle tile mouse move
     * Applies 3D tilt and inner glow effects
     * @private
     * @param {MosaicTile} tile - The tile
     * @param {MouseEvent} e - Mouse event
     */
    _onTileMouseMove(tile, e) {
        if (this.isReducedMotion) return;
        
        // Skip 3D tilt on touch devices (Requirement 10.2)
        if (!this.isTouchDevice) {
            // Apply 3D tilt effect (Requirements 6.1, 6.2)
            this.applyTilt(tile, e.clientX, e.clientY);
        }
        
        // Apply inner glow effect (Requirement 6.6)
        this.applyInnerGlow(tile, e.clientX, e.clientY);
        
        // Push neighboring tiles (Requirement 6.3)
        this.pushNeighbors(tile);
    }

    /**
     * Handle tile mouse leave
     * @private
     * @param {MosaicTile} tile - The tile
     * @param {MouseEvent} e - Mouse event
     */
    _onTileMouseLeave(tile, e) {
        tile.isHovering = false;
        
        if (this.activeTile === tile) {
            this.activeTile = null;
        }
        
        // Remove hover class
        tile.element.classList.remove('mosaic-tile--hovering');
        
        // Reset tilt
        this._resetTilt(tile);
        
        // Reset inner glow
        this._resetInnerGlow(tile);
        
        // Reset neighbors
        this.resetNeighbors();
    }

    /**
     * Apply 3D tilt effect to a tile based on mouse position
     * Property 14: rotateX proportional to (my - cy) / tileHeight,
     *              rotateY proportional to (cx - mx) / tileWidth,
     *              clamped to maxTiltAngle
     * 
     * @param {MosaicTile} tile - The tile to apply tilt to
     * @param {number} mouseX - Mouse X position (client coordinates)
     * @param {number} mouseY - Mouse Y position (client coordinates)
     * 
     * Validates: Requirements 6.1, 6.2
     */
    applyTilt(tile, mouseX, mouseY) {
        if (this.isReducedMotion || this.isTouchDevice) return;
        
        const { bounds } = tile;
        const { maxAngle, perspective, scale } = this.config.tilt;
        
        // Calculate tile center (cx, cy)
        const cx = bounds.left + bounds.width / 2;
        const cy = bounds.top + bounds.height / 2;
        
        // Calculate mouse position relative to center
        const mx = mouseX;
        const my = mouseY;
        
        // Property 14: Calculate tilt angles
        // rotateX is proportional to (my - cy) / tileHeight
        // rotateY is proportional to (cx - mx) / tileWidth
        const rawRotateX = ((my - cy) / bounds.height) * maxAngle;
        const rawRotateY = ((cx - mx) / bounds.width) * maxAngle;
        
        // Clamp to maxTiltAngle
        const rotateX = clamp(rawRotateX, -maxAngle, maxAngle);
        const rotateY = clamp(rawRotateY, -maxAngle, maxAngle);
        
        // Store tilt values
        tile.tiltX = rotateX;
        tile.tiltY = rotateY;
        
        // Apply transform with GPU-accelerated properties
        tile.element.style.transform = `
            perspective(${perspective}px)
            rotateX(${rotateX}deg)
            rotateY(${rotateY}deg)
            scale3d(${scale}, ${scale}, 1)
        `;
    }

    /**
     * Calculate tilt angles for a tile (for testing/external use)
     * Property 14: Returns calculated rotateX and rotateY values
     * 
     * @param {MosaicTile} tile - The tile
     * @param {number} mouseX - Mouse X position
     * @param {number} mouseY - Mouse Y position
     * @returns {{rotateX: number, rotateY: number}} Calculated tilt angles
     */
    calculateTilt(tile, mouseX, mouseY) {
        const { bounds } = tile;
        const { maxAngle } = this.config.tilt;
        
        // Calculate tile center
        const cx = bounds.left + bounds.width / 2;
        const cy = bounds.top + bounds.height / 2;
        
        // Property 14: Calculate tilt angles
        const rawRotateX = ((mouseY - cy) / bounds.height) * maxAngle;
        const rawRotateY = ((cx - mouseX) / bounds.width) * maxAngle;
        
        // Clamp to maxTiltAngle
        const rotateX = clamp(rawRotateX, -maxAngle, maxAngle);
        const rotateY = clamp(rawRotateY, -maxAngle, maxAngle);
        
        return { rotateX, rotateY };
    }

    /**
     * Reset tilt effect on a tile
     * @private
     * @param {MosaicTile} tile - The tile to reset
     */
    _resetTilt(tile) {
        tile.tiltX = 0;
        tile.tiltY = 0;
        
        const { transitionDuration } = this.config.tilt;
        
        // Apply smooth transition back to normal
        tile.element.style.transition = `transform ${transitionDuration}ms ease-out`;
        tile.element.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        
        // Clear transition after animation
        setTimeout(() => {
            if (!tile.isHovering) {
                tile.element.style.transition = '';
            }
        }, transitionDuration);
    }

    /**
     * Apply inner glow effect based on mouse position
     * Property 16: --mouse-x and --mouse-y set to (x/width)*100% and (y/height)*100%
     * 
     * @param {MosaicTile} tile - The tile to apply glow to
     * @param {number} mouseX - Mouse X position (client coordinates)
     * @param {number} mouseY - Mouse Y position (client coordinates)
     * 
     * Validates: Requirements 6.6
     */
    applyInnerGlow(tile, mouseX, mouseY) {
        if (!this.config.glow.enabled) return;
        
        const { bounds, element } = tile;
        
        // Calculate mouse position relative to tile (0-1)
        const x = mouseX - bounds.left;
        const y = mouseY - bounds.top;
        
        // Property 16: Convert to percentage
        const mouseXPercent = (x / bounds.width) * 100;
        const mouseYPercent = (y / bounds.height) * 100;
        
        // Clamp to 0-100%
        const clampedX = clamp(mouseXPercent, 0, 100);
        const clampedY = clamp(mouseYPercent, 0, 100);
        
        // Set CSS custom properties for inner glow
        element.style.setProperty('--mouse-x', `${clampedX}%`);
        element.style.setProperty('--mouse-y', `${clampedY}%`);
    }

    /**
     * Calculate inner glow position (for testing/external use)
     * Property 16: Returns calculated --mouse-x and --mouse-y values
     * 
     * @param {MosaicTile} tile - The tile
     * @param {number} mouseX - Mouse X position
     * @param {number} mouseY - Mouse Y position
     * @returns {{mouseXPercent: number, mouseYPercent: number}} Calculated glow position
     */
    calculateInnerGlow(tile, mouseX, mouseY) {
        const { bounds } = tile;
        
        // Calculate mouse position relative to tile
        const x = mouseX - bounds.left;
        const y = mouseY - bounds.top;
        
        // Property 16: Convert to percentage
        const mouseXPercent = (x / bounds.width) * 100;
        const mouseYPercent = (y / bounds.height) * 100;
        
        return { mouseXPercent, mouseYPercent };
    }

    /**
     * Reset inner glow effect on a tile
     * @private
     * @param {MosaicTile} tile - The tile to reset
     */
    _resetInnerGlow(tile) {
        // Reset to center
        tile.element.style.setProperty('--mouse-x', '50%');
        tile.element.style.setProperty('--mouse-y', '50%');
    }

    /**
     * Push neighboring tiles away from the active tile
     * Property 15: Push force proportional to (1 - d/pushRadius),
     *              direction away from hovered tile center
     * 
     * @param {MosaicTile} activeTile - The currently hovered tile
     * 
     * Validates: Requirements 6.3
     */
    pushNeighbors(activeTile) {
        if (this.isReducedMotion) return;
        
        const { radius, maxForce } = this.config.push;
        
        // Get active tile center
        const activeBounds = activeTile.bounds;
        const activeCenterX = activeBounds.left + activeBounds.width / 2;
        const activeCenterY = activeBounds.top + activeBounds.height / 2;
        
        for (const tile of this.tiles) {
            // Skip the active tile
            if (tile === activeTile) {
                tile.targetPushX = 0;
                tile.targetPushY = 0;
                continue;
            }
            
            // Get neighbor tile center
            const neighborBounds = tile.bounds;
            const neighborCenterX = neighborBounds.left + neighborBounds.width / 2;
            const neighborCenterY = neighborBounds.top + neighborBounds.height / 2;
            
            // Calculate distance between centers
            const dx = neighborCenterX - activeCenterX;
            const dy = neighborCenterY - activeCenterY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Property 15: Only affect tiles within pushRadius
            if (distance > radius || distance === 0) {
                tile.targetPushX = 0;
                tile.targetPushY = 0;
                continue;
            }
            
            // Property 15: Push force proportional to (1 - d/pushRadius)
            const force = (1 - distance / radius) * maxForce;
            
            // Normalize direction vector
            const dirX = dx / distance;
            const dirY = dy / distance;
            
            // Calculate push offset (direction away from active tile)
            tile.targetPushX = dirX * force;
            tile.targetPushY = dirY * force;
        }
    }

    /**
     * Calculate push force for a neighbor tile (for testing/external use)
     * Property 15: Returns calculated push force and direction
     * 
     * @param {MosaicTile} activeTile - The hovered tile
     * @param {MosaicTile} neighborTile - The neighbor tile
     * @returns {{force: number, pushX: number, pushY: number, distance: number}} Push calculation
     */
    calculatePushForce(activeTile, neighborTile) {
        const { radius, maxForce } = this.config.push;
        
        // Get centers
        const activeBounds = activeTile.bounds;
        const activeCenterX = activeBounds.left + activeBounds.width / 2;
        const activeCenterY = activeBounds.top + activeBounds.height / 2;
        
        const neighborBounds = neighborTile.bounds;
        const neighborCenterX = neighborBounds.left + neighborBounds.width / 2;
        const neighborCenterY = neighborBounds.top + neighborBounds.height / 2;
        
        // Calculate distance
        const dx = neighborCenterX - activeCenterX;
        const dy = neighborCenterY - activeCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Property 15: Check if within radius
        if (distance > radius || distance === 0) {
            return { force: 0, pushX: 0, pushY: 0, distance };
        }
        
        // Property 15: Calculate force
        const force = (1 - distance / radius) * maxForce;
        
        // Normalize and apply force
        const dirX = dx / distance;
        const dirY = dy / distance;
        
        return {
            force,
            pushX: dirX * force,
            pushY: dirY * force,
            distance
        };
    }

    /**
     * Reset all neighbor tiles to their original positions
     * 
     * Validates: Requirements 6.3
     */
    resetNeighbors() {
        for (const tile of this.tiles) {
            tile.targetPushX = 0;
            tile.targetPushY = 0;
        }
    }

    /**
     * Update floating animation for all non-hovered tiles
     * Property 17: floatY = sin(t + i * offset) * amplitude,
     *              floatRotate = sin(t * 0.5 + i * offset) * rotateAmplitude
     * 
     * @param {number} timestamp - Current animation timestamp
     * 
     * Validates: Requirements 6.7
     */
    updateFloating(timestamp) {
        if (this.isReducedMotion) return;
        
        const { amplitude, rotateAmplitude, speed, offset } = this.config.floating;
        const { easing } = this.config.push;
        
        // Convert timestamp to animation time
        const t = timestamp * speed;
        
        for (const tile of this.tiles) {
            // Lerp push values for smooth movement
            tile.pushX = lerp(tile.pushX, tile.targetPushX, easing);
            tile.pushY = lerp(tile.pushY, tile.targetPushY, easing);
            
            // Skip floating animation for hovered tile
            if (tile.isHovering) {
                continue;
            }
            
            // Property 17: Calculate floating values
            const i = tile.index;
            const floatY = Math.sin(t + i * offset) * amplitude;
            const floatRotate = Math.sin(t * 0.5 + i * offset) * rotateAmplitude;
            
            // Combine floating with push offset
            const totalTranslateX = tile.pushX;
            const totalTranslateY = floatY + tile.pushY;
            
            // Apply transform
            tile.element.style.transform = `
                perspective(1000px)
                translate3d(${totalTranslateX}px, ${totalTranslateY}px, 0)
                rotate(${floatRotate}deg)
            `;
        }
    }

    /**
     * Calculate floating values for a tile (for testing/external use)
     * Property 17: Returns calculated floatY and floatRotate values
     * 
     * @param {number} timestamp - Animation timestamp
     * @param {number} tileIndex - Index of the tile
     * @returns {{floatY: number, floatRotate: number}} Calculated floating values
     */
    calculateFloating(timestamp, tileIndex) {
        const { amplitude, rotateAmplitude, speed, offset } = this.config.floating;
        
        // Convert timestamp to animation time
        const t = timestamp * speed;
        const i = tileIndex;
        
        // Property 17: Calculate floating values
        const floatY = Math.sin(t + i * offset) * amplitude;
        const floatRotate = Math.sin(t * 0.5 + i * offset) * rotateAmplitude;
        
        return { floatY, floatRotate };
    }

    /**
     * Start the animation loop
     * @returns {boolean} - True if started successfully
     */
    start() {
        if (this.isRunning) {
            return true;
        }
        
        if (this.isReducedMotion) {
            return false;
        }
        
        this.isRunning = true;
        this._animate(performance.now());
        return true;
    }

    /**
     * Stop the animation loop
     * @returns {boolean} - True if stopped successfully
     */
    stop() {
        if (!this.isRunning) {
            return true;
        }
        
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        
        this.isRunning = false;
        return true;
    }

    /**
     * Animation loop
     * @private
     * @param {number} timestamp - Current timestamp from requestAnimationFrame
     */
    _animate(timestamp) {
        if (!this.isRunning) {
            return;
        }
        
        this.timestamp = timestamp;
        
        // Update floating animation
        this.updateFloating(timestamp);
        
        // Schedule next frame
        this.rafId = requestAnimationFrame((ts) => this._animate(ts));
    }

    /**
     * Update method called by AnimationCore
     * 
     * @param {number} deltaTime - Time since last frame in seconds
     * @param {number} timestamp - Current timestamp
     */
    update(deltaTime, timestamp) {
        if (!this.isReducedMotion) {
            this.updateFloating(timestamp);
        }
    }

    /**
     * Handle resize event
     * @private
     */
    _onResize() {
        // Update all tile bounds
        for (const tile of this.tiles) {
            tile.bounds = tile.element.getBoundingClientRect();
        }
    }

    /**
     * Show all tiles immediately (for reduced motion)
     * @private
     */
    _showAllTilesImmediately() {
        for (const tile of this.tiles) {
            tile.element.style.transform = 'none';
            tile.element.style.opacity = '1';
        }
    }

    /**
     * Handle reduced motion preference change
     * @param {boolean} isReducedMotion - Whether reduced motion is enabled
     */
    onReducedMotionChange(isReducedMotion) {
        this.isReducedMotion = isReducedMotion;
        
        if (isReducedMotion) {
            this.stop();
            this._showAllTilesImmediately();
        } else {
            // Reset tiles and restart
            for (const tile of this.tiles) {
                tile.tiltX = 0;
                tile.tiltY = 0;
                tile.pushX = 0;
                tile.pushY = 0;
                tile.targetPushX = 0;
                tile.targetPushY = 0;
            }
            this.start();
        }
    }

    /**
     * Get all tiles
     * @returns {MosaicTile[]} - Array of tile configurations
     */
    getTiles() {
        return this.tiles;
    }

    /**
     * Get active tile
     * @returns {MosaicTile|null} - Currently hovered tile or null
     */
    getActiveTile() {
        return this.activeTile;
    }

    /**
     * Get configuration
     * @returns {Object} - Current configuration
     */
    getConfig() {
        return this.config;
    }

    /**
     * Check if controller is initialized
     * @returns {boolean}
     */
    getIsInitialized() {
        return this.isInitialized;
    }

    /**
     * Check if reduced motion is enabled
     * @returns {boolean}
     */
    getIsReducedMotion() {
        return this.isReducedMotion;
    }

    /**
     * Check if device is touch-only
     * @returns {boolean}
     */
    getIsTouchDevice() {
        return this.isTouchDevice;
    }

    /**
     * Check if animation loop is running
     * @returns {boolean}
     */
    getIsRunning() {
        return this.isRunning;
    }

    /**
     * Cleanup and destroy the controller
     * Removes event listeners, clears RAF, and resets element styles
     * 
     * Validates: Requirements 8.3
     * Property 19: Animation Cleanup
     * - Remove all event listeners
     * - Clear all animation frames (cancelAnimationFrame)
     * - Reset all element styles to initial state
     * - Set isInitialized to false
     * - Clear any arrays/maps of elements
     */
    destroy() {
        // Stop animation loop (clears RAF)
        this.stop();
        
        // Remove resize event listener
        window.removeEventListener('resize', this.boundHandlers.onResize);
        
        // Cleanup tiles
        for (const tile of this.tiles) {
            // Remove event listeners
            if (tile.handlers) {
                tile.element.removeEventListener('mouseenter', tile.handlers.mouseenter);
                tile.element.removeEventListener('mousemove', tile.handlers.mousemove);
                tile.element.removeEventListener('mouseleave', tile.handlers.mouseleave);
                tile.handlers = null;
            }
            
            // Remove GPU acceleration
            GPUAccelerator.decelerate(tile.element);
            
            // Reset styles
            tile.element.style.transform = '';
            tile.element.style.opacity = '';
            tile.element.style.transition = '';
            tile.element.style.willChange = '';
            tile.element.style.removeProperty('--mouse-x');
            tile.element.style.removeProperty('--mouse-y');
            
            // Remove classes
            tile.element.classList.remove('mosaic-tile--hovering');
        }
        
        // Clear arrays and state
        this.tiles = [];
        this.activeTile = null;
        this.isInitialized = false;
        this.isRunning = false;
        this.isReducedMotion = false;
        this.timestamp = 0;
        this.rafId = null;
    }
}

// Export for ES modules
export { MosaicAnimationController, DEFAULT_CONFIG };

// Also export as default
export default MosaicAnimationController;
