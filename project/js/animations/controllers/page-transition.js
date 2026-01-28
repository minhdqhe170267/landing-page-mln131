/**
 * PageTransitionController - Page transition manager
 * Handles liquid wipe and curtain reveal transitions between pages
 * 
 * Requirements:
 * - 3.1: Display liquid wipe effect with clip-path animation when clicking internal links
 * - 3.2: Duration SHALL be 800ms with easing cubic-bezier(0.77, 0, 0.175, 1)
 * - 3.3: Use gradient background from primary colors
 * - 3.4: Navigate to new URL when transition completes
 * - 3.5: Have alternative curtain reveal effect that can be switched
 * 
 * Design Interface:
 * - createOverlay(): Create overlay element
 * - bindLinks(): Bind link click events
 * - transition(url): Execute transition
 * - liquidWipe(): Liquid wipe animation
 * - curtainReveal(): Curtain reveal animation
 * 
 * Property 8: Page Transition Configuration
 * - Duration SHALL be 800ms
 * - Easing SHALL be 'cubic-bezier(0.77, 0, 0.175, 1)'
 * 
 * @module animations/controllers/page-transition
 */

import { GPUAccelerator } from '../core/gpu-accelerator.js';
import { prefersReducedMotion, getReducedMotionDetector } from '../core/reduced-motion.js';

/**
 * Default configuration for PageTransitionController
 * Property 8: Duration SHALL be 800ms, Easing SHALL be 'cubic-bezier(0.77, 0, 0.175, 1)'
 */
const DEFAULT_CONFIG = {
    /** @type {'liquid' | 'curtain'} Transition type */
    type: 'liquid',
    /** @type {number} Transition duration in ms - Requirement 3.2 */
    duration: 800,
    /** @type {string} CSS easing function - Requirement 3.2 */
    easing: 'cubic-bezier(0.77, 0, 0.175, 1)',
    /** @type {string[]} Gradient colors for overlay - Requirement 3.3 */
    colors: [
        '#667eea',  // Primary blue
        '#764ba2',  // Purple
        '#f093fb',  // Pink
        '#fa709a'   // Coral
    ],
    /** @type {string} CSS selector for internal links */
    linkSelector: 'a[href^="/"]:not([target="_blank"]), a[href^="./"]:not([target="_blank"]), a[href^="../"]:not([target="_blank"]), a:not([href^="http"]):not([href^="#"]):not([target="_blank"])',
    /** @type {string} CSS class for overlay element */
    overlayClass: 'page-transition-overlay',
    /** @type {string} CSS class when transition is active */
    activeClass: 'page-transition-active',
    /** @type {number} Number of curtain panels */
    curtainPanels: 5,
    /** @type {number} Stagger delay between curtain panels in ms */
    curtainStagger: 50
};

/**
 * PageTransitionController class
 * Manages page transitions with liquid wipe and curtain reveal effects
 */
class PageTransitionController {
    /**
     * Create a PageTransitionController instance
     * @param {Object} [options] - Configuration options
     * @param {string} [options.type='liquid'] - Transition type: 'liquid' or 'curtain'
     * @param {number} [options.duration=800] - Transition duration in ms
     * @param {string} [options.easing='cubic-bezier(0.77, 0, 0.175, 1)'] - CSS easing function
     * @param {string[]} [options.colors] - Gradient colors for overlay
     * @param {string} [options.linkSelector] - CSS selector for internal links
     * @param {string} [options.overlayClass] - CSS class for overlay element
     * @param {string} [options.activeClass] - CSS class when transition is active
     * @param {number} [options.curtainPanels=5] - Number of curtain panels
     * @param {number} [options.curtainStagger=50] - Stagger delay between curtain panels
     */
    constructor(options = {}) {
        /**
         * Overlay element for transitions
         * @type {HTMLElement|null}
         */
        this.overlay = null;

        /**
         * Curtain panel elements (for curtain reveal)
         * @type {HTMLElement[]}
         */
        this.curtainPanels = [];

        /**
         * Configuration options (merged with defaults)
         * @type {Object}
         */
        this.config = { ...DEFAULT_CONFIG, ...options };

        // Ensure duration and easing match Property 8 requirements
        // These are the required values per the specification
        if (this.config.duration !== 800) {
            console.warn('PageTransitionController: Duration should be 800ms per Property 8');
        }
        if (this.config.easing !== 'cubic-bezier(0.77, 0, 0.175, 1)') {
            console.warn('PageTransitionController: Easing should be cubic-bezier(0.77, 0, 0.175, 1) per Property 8');
        }

        /**
         * Whether the controller has been initialized
         * @type {boolean}
         */
        this.isInitialized = false;

        /**
         * Whether a transition is currently in progress
         * @type {boolean}
         */
        this.isTransitioning = false;

        /**
         * Whether reduced motion is enabled
         * @type {boolean}
         */
        this.isReducedMotion = false;

        /**
         * Whether this controller supports reduced motion
         * @type {boolean}
         */
        this.supportsReducedMotion = true;

        /**
         * Bound event handlers for cleanup
         * @type {Object}
         */
        this.boundHandlers = {
            onLinkClick: this._handleLinkClick.bind(this),
            onReducedMotionChange: this._handleReducedMotionChange.bind(this)
        };

        /**
         * ReducedMotionDetector instance
         * @type {ReducedMotionDetector}
         */
        this.reducedMotionDetector = getReducedMotionDetector();

        /**
         * Pending navigation URL
         * @type {string|null}
         */
        this.pendingUrl = null;

        /**
         * Animation frame ID for cleanup
         * @type {number|null}
         */
        this.rafId = null;
    }

    /**
     * Get the transition duration
     * Property 8: Duration SHALL be 800ms
     * @returns {number} Duration in milliseconds
     */
    getDuration() {
        return this.config.duration;
    }

    /**
     * Get the transition easing
     * Property 8: Easing SHALL be 'cubic-bezier(0.77, 0, 0.175, 1)'
     * @returns {string} CSS easing function
     */
    getEasing() {
        return this.config.easing;
    }

    /**
     * Get the transition type
     * @returns {string} 'liquid' or 'curtain'
     */
    getType() {
        return this.config.type;
    }

    /**
     * Set the transition type
     * @param {string} type - 'liquid' or 'curtain'
     */
    setType(type) {
        if (type !== 'liquid' && type !== 'curtain') {
            console.warn('PageTransitionController: Invalid type. Use "liquid" or "curtain"');
            return;
        }
        this.config.type = type;
        
        // Recreate overlay if already initialized
        if (this.isInitialized) {
            this._removeOverlay();
            this.createOverlay();
        }
    }

    /**
     * Initialize the controller
     * Creates overlay and binds link events
     */
    init() {
        // Check reduced motion preference
        this.isReducedMotion = prefersReducedMotion();

        // Create overlay element
        this.createOverlay();

        // Bind link click events
        this.bindLinks();

        // Listen for reduced motion changes
        this.reducedMotionDetector.onChange(this.boundHandlers.onReducedMotionChange);
        this.reducedMotionDetector.listen();

        this.isInitialized = true;
    }

    /**
     * Create overlay element for transitions
     * Creates either liquid wipe or curtain reveal overlay based on type
     * 
     * Validates: Requirements 3.1, 3.3, 3.5
     */
    createOverlay() {
        // Remove existing overlay if any
        this._removeOverlay();

        if (this.config.type === 'liquid') {
            this._createLiquidOverlay();
        } else {
            this._createCurtainOverlay();
        }
    }

    /**
     * Create liquid wipe overlay
     * @private
     * 
     * Validates: Requirements 3.1, 3.3
     */
    _createLiquidOverlay() {
        const overlay = document.createElement('div');
        overlay.className = `${this.config.overlayClass} ${this.config.overlayClass}--liquid`;
        
        // Apply gradient background - Requirement 3.3
        const colors = this.config.colors;
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 25%, ${colors[2]} 75%, ${colors[3]} 100%);
            z-index: 9999;
            pointer-events: none;
            clip-path: circle(0% at 50% 50%);
            transition: clip-path ${this.config.duration}ms ${this.config.easing};
        `;

        // Apply GPU acceleration
        GPUAccelerator.accelerate(overlay);
        GPUAccelerator.setWillChange(overlay, ['transform', 'opacity']);

        document.body.appendChild(overlay);
        this.overlay = overlay;
    }

    /**
     * Create curtain reveal overlay
     * @private
     * 
     * Validates: Requirements 3.3, 3.5
     */
    _createCurtainOverlay() {
        const container = document.createElement('div');
        container.className = `${this.config.overlayClass} ${this.config.overlayClass}--curtain`;
        
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 9999;
            pointer-events: none;
            display: flex;
        `;

        // Create curtain panels
        const panelCount = this.config.curtainPanels;
        const panelWidth = 100 / panelCount;
        const colors = this.config.colors;

        this.curtainPanels = [];

        for (let i = 0; i < panelCount; i++) {
            const panel = document.createElement('div');
            panel.className = `${this.config.overlayClass}__panel`;
            
            // Interpolate color based on panel position
            const colorIndex = Math.floor((i / panelCount) * colors.length);
            const nextColorIndex = Math.min(colorIndex + 1, colors.length - 1);
            const colorProgress = (i / panelCount) * colors.length - colorIndex;
            
            // Use gradient for each panel
            panel.style.cssText = `
                width: ${panelWidth}%;
                height: 100%;
                background: linear-gradient(180deg, ${colors[colorIndex]} 0%, ${colors[nextColorIndex]} 100%);
                transform: scaleY(0);
                transform-origin: top;
                transition: transform ${this.config.duration}ms ${this.config.easing};
                transition-delay: ${i * this.config.curtainStagger}ms;
            `;

            // Apply GPU acceleration
            GPUAccelerator.accelerate(panel);
            GPUAccelerator.setWillChange(panel, ['transform']);

            container.appendChild(panel);
            this.curtainPanels.push(panel);
        }

        document.body.appendChild(container);
        this.overlay = container;
    }

    /**
     * Remove overlay element
     * @private
     */
    _removeOverlay() {
        if (this.overlay) {
            // Clear will-change before removing
            if (this.config.type === 'liquid') {
                GPUAccelerator.clearWillChange(this.overlay);
            } else {
                for (const panel of this.curtainPanels) {
                    GPUAccelerator.clearWillChange(panel);
                }
            }
            
            this.overlay.remove();
            this.overlay = null;
            this.curtainPanels = [];
        }
    }

    /**
     * Bind link click events to internal links
     * 
     * Validates: Requirements 3.1, 3.4
     */
    bindLinks() {
        // Find all internal links
        const links = document.querySelectorAll(this.config.linkSelector);
        
        for (const link of links) {
            // Skip links that already have transition bound
            if (link.dataset.transitionBound) {
                continue;
            }
            
            link.addEventListener('click', this.boundHandlers.onLinkClick);
            link.dataset.transitionBound = 'true';
        }
    }

    /**
     * Unbind link click events
     * @private
     */
    _unbindLinks() {
        const links = document.querySelectorAll('[data-transition-bound="true"]');
        
        for (const link of links) {
            link.removeEventListener('click', this.boundHandlers.onLinkClick);
            delete link.dataset.transitionBound;
        }
    }

    /**
     * Handle link click event
     * @private
     * @param {MouseEvent} event - Click event
     */
    _handleLinkClick(event) {
        // Skip if modifier keys are pressed (allow opening in new tab)
        if (event.metaKey || event.ctrlKey || event.shiftKey) {
            return;
        }

        // Skip if already transitioning
        if (this.isTransitioning) {
            event.preventDefault();
            return;
        }

        const link = event.currentTarget;
        const url = link.href;

        // Skip if same page anchor
        if (url === window.location.href || url.startsWith('#')) {
            return;
        }

        // Prevent default navigation
        event.preventDefault();

        // Execute transition
        this.transition(url);
    }

    /**
     * Execute page transition
     * @param {string} url - URL to navigate to
     * @returns {Promise<void>} Resolves when transition completes
     * 
     * Validates: Requirements 3.1, 3.4, 3.5
     */
    async transition(url) {
        // Skip if already transitioning
        if (this.isTransitioning) {
            return;
        }

        this.isTransitioning = true;
        this.pendingUrl = url;

        // Add active class to body
        document.body.classList.add(this.config.activeClass);

        // If reduced motion, navigate immediately
        if (this.isReducedMotion) {
            this._navigate(url);
            return;
        }

        try {
            // Execute appropriate transition
            if (this.config.type === 'liquid') {
                await this.liquidWipe();
            } else {
                await this.curtainReveal();
            }

            // Navigate to new URL - Requirement 3.4
            this._navigate(url);
        } catch (error) {
            console.error('PageTransitionController: Transition failed', error);
            // Navigate anyway on error
            this._navigate(url);
        }
    }

    /**
     * Navigate to URL
     * @private
     * @param {string} url - URL to navigate to
     * 
     * Validates: Requirements 3.4
     */
    _navigate(url) {
        window.location.href = url;
    }

    /**
     * Execute liquid wipe animation
     * Uses clip-path circle animation for smooth wipe effect
     * @returns {Promise<void>} Resolves when animation completes
     * 
     * Validates: Requirements 3.1, 3.2
     */
    liquidWipe() {
        return new Promise((resolve) => {
            if (!this.overlay) {
                resolve();
                return;
            }

            // Ensure overlay is visible
            this.overlay.style.pointerEvents = 'all';

            // Force reflow to ensure transition works
            void this.overlay.offsetHeight;

            // Animate clip-path from 0% to 150% (to cover corners)
            this.overlay.style.clipPath = 'circle(150% at 50% 50%)';

            // Wait for transition to complete
            const onTransitionEnd = () => {
                this.overlay.removeEventListener('transitionend', onTransitionEnd);
                resolve();
            };

            this.overlay.addEventListener('transitionend', onTransitionEnd);

            // Fallback timeout in case transitionend doesn't fire
            setTimeout(() => {
                this.overlay.removeEventListener('transitionend', onTransitionEnd);
                resolve();
            }, this.config.duration + 100);
        });
    }

    /**
     * Execute curtain reveal animation
     * Uses multiple panels that scale down from top
     * @returns {Promise<void>} Resolves when animation completes
     * 
     * Validates: Requirements 3.2, 3.5
     */
    curtainReveal() {
        return new Promise((resolve) => {
            if (!this.overlay || this.curtainPanels.length === 0) {
                resolve();
                return;
            }

            // Ensure overlay is visible
            this.overlay.style.pointerEvents = 'all';

            // Force reflow
            void this.overlay.offsetHeight;

            // Animate all panels
            for (const panel of this.curtainPanels) {
                panel.style.transform = 'scaleY(1)';
            }

            // Calculate total animation time including stagger
            const totalDuration = this.config.duration + 
                (this.curtainPanels.length - 1) * this.config.curtainStagger;

            // Wait for all panels to complete
            setTimeout(resolve, totalDuration + 100);
        });
    }

    /**
     * Reset transition state
     * Called when navigating back or canceling transition
     */
    reset() {
        this.isTransitioning = false;
        this.pendingUrl = null;

        // Remove active class
        document.body.classList.remove(this.config.activeClass);

        // Reset overlay
        if (this.overlay) {
            if (this.config.type === 'liquid') {
                this.overlay.style.clipPath = 'circle(0% at 50% 50%)';
                this.overlay.style.pointerEvents = 'none';
            } else {
                for (const panel of this.curtainPanels) {
                    panel.style.transform = 'scaleY(0)';
                }
                this.overlay.style.pointerEvents = 'none';
            }
        }
    }

    /**
     * Handle reduced motion preference change
     * @private
     * @param {boolean} isReducedMotion - Whether reduced motion is enabled
     */
    _handleReducedMotionChange(isReducedMotion) {
        this.isReducedMotion = isReducedMotion;

        // If transitioning and reduced motion enabled, navigate immediately
        if (isReducedMotion && this.isTransitioning && this.pendingUrl) {
            this._navigate(this.pendingUrl);
        }
    }

    /**
     * Handle reduced motion change (public interface for AnimationCore)
     * @param {boolean} isReducedMotion - Whether reduced motion is enabled
     */
    onReducedMotionChange(isReducedMotion) {
        this._handleReducedMotionChange(isReducedMotion);
    }

    /**
     * Update method (called by AnimationCore)
     * PageTransitionController doesn't need continuous updates
     * @param {number} deltaTime - Time since last frame
     * @param {number} timestamp - Current timestamp
     */
    update(deltaTime, timestamp) {
        // No continuous updates needed for page transitions
        // Transitions are event-driven
    }

    /**
     * Check if controller is initialized
     * @returns {boolean}
     */
    getIsInitialized() {
        return this.isInitialized;
    }

    /**
     * Check if transition is in progress
     * @returns {boolean}
     */
    getIsTransitioning() {
        return this.isTransitioning;
    }

    /**
     * Check if reduced motion is enabled
     * @returns {boolean}
     */
    getIsReducedMotion() {
        return this.isReducedMotion;
    }

    /**
     * Pause transitions (disable link binding)
     */
    pause() {
        this._unbindLinks();
    }

    /**
     * Resume transitions (re-enable link binding)
     */
    resume() {
        this.bindLinks();
    }

    /**
     * Cleanup and destroy the controller
     * Removes overlay, unbinds events, and resets state
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
        // Cancel any pending animation frame
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }

        // Unbind link events
        this._unbindLinks();

        // Stop listening for reduced motion changes
        this.reducedMotionDetector.offChange(this.boundHandlers.onReducedMotionChange);

        // Remove overlay (also clears will-change)
        this._removeOverlay();

        // Remove active class from body
        document.body.classList.remove(this.config.activeClass);

        // Reset state
        this.isInitialized = false;
        this.isTransitioning = false;
        this.isReducedMotion = false;
        this.pendingUrl = null;
        this.curtainPanels = [];
    }
}

// Export for ES modules
export { PageTransitionController, DEFAULT_CONFIG };

// Also export as default
export default PageTransitionController;
