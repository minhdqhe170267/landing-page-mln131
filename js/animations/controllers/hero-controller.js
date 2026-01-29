/**
 * HeroController - Hero section animation manager
 * Central manager for all hero section animations including:
 * - MeshGradient: Canvas-based animated gradient background
 * - ParticleSystem: 3D floating particles with physics
 * - TextReveal: Character-by-character text reveal with glitch effect
 * - MagneticButton: Magnetic hover effect for CTA buttons
 * 
 * Requirements:
 * - 2.1: Display animated mesh gradient background using canvas
 * - 2.2: Have at least 4 color points moving with random velocity
 * - 2.3: Bounce points when they hit canvas edges
 * - 2.4: Display 3D floating particles with physics simulation
 * - 2.5: Particles respond to mouse position
 * - 2.6: At least 50 particles with depth (Z-axis) on desktop
 * - 2.7: Apply "Glitch to Solid" text reveal effect
 * - 2.8: Animate each character with stagger delay of 50ms
 * - 2.9: Apply magnetic effect that pulls button toward cursor on hover
 * - 9.1-9.4: Support reduced motion preference
 * - 10.1: Reduce particle count on mobile
 * - 10.4: Handle canvas resize
 * 
 * Design Interface:
 * - init(): Initialize all hero animations
 * - update(deltaTime): Update loop (called by AnimationCore)
 * - destroy(): Cleanup all sub-controllers
 * 
 * @module animations/controllers/hero-controller
 */

import { MeshGradient } from './mesh-gradient.js';
import { ParticleSystem } from './particle-system.js';
import { TextReveal } from './text-reveal.js';
import { MagneticButton } from './magnetic-button.js';
import { prefersReducedMotion, getReducedMotionDetector } from '../core/reduced-motion.js';
import { GPUAccelerator } from '../core/gpu-accelerator.js';

/**
 * Default configuration for HeroController
 */
const DEFAULT_CONFIG = {
    // MeshGradient options
    meshGradient: {
        pointCount: 5,
        speed: 1,
        colors: [
            { r: 102, g: 126, b: 234 },  // Primary blue
            { r: 118, g: 75, b: 162 },   // Purple
            { r: 240, g: 147, b: 251 },  // Pink
            { r: 250, g: 112, b: 154 }   // Coral
        ]
    },
    // ParticleSystem options
    particles: {
        count: 100,
        minSize: 2,
        maxSize: 6,
        maxDepth: 1000,
        mouseInfluence: 0.1
    },
    // TextReveal options
    textReveal: {
        staggerDelay: 50,
        duration: 800
    },
    // MagneticButton options
    magneticButton: {
        strength: 0.3,
        scale: 1.1
    },
    // Selectors for finding elements
    selectors: {
        canvas: '.hero-canvas',
        particleContainer: '.hero-particles',
        title: '.hero-title',
        magneticButtons: '.hero-cta, .magnetic-button'
    }
};

/**
 * HeroController class
 * Central manager for hero section animations
 */
class HeroController {
    /**
     * Create a HeroController instance
     * @param {HTMLElement} container - The hero section container element
     * @param {Object} [options] - Configuration options
     * @param {Object} [options.meshGradient] - MeshGradient configuration
     * @param {Object} [options.particles] - ParticleSystem configuration
     * @param {Object} [options.textReveal] - TextReveal configuration
     * @param {Object} [options.magneticButton] - MagneticButton configuration
     * @param {Object} [options.selectors] - CSS selectors for finding elements
     */
    constructor(container, options = {}) {
        if (!container || !(container instanceof HTMLElement)) {
            throw new Error('HeroController: Valid container element is required');
        }

        /**
         * Hero section container element
         * @type {HTMLElement}
         */
        this.container = container;

        /**
         * MeshGradient instance for animated background
         * @type {MeshGradient|null}
         */
        this.meshGradient = null;

        /**
         * ParticleSystem instance for 3D floating particles
         * @type {ParticleSystem|null}
         */
        this.particleSystem = null;

        /**
         * TextReveal instance for hero title animation
         * @type {TextReveal|null}
         */
        this.textReveal = null;

        /**
         * Array of MagneticButton instances for CTA buttons
         * @type {MagneticButton[]}
         */
        this.magneticButtons = [];

        /**
         * Configuration options (merged with defaults)
         * @type {Object}
         */
        this.config = this._mergeConfig(DEFAULT_CONFIG, options);

        /**
         * Whether the controller has been initialized
         * @type {boolean}
         */
        this.isInitialized = false;

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
            onResize: this._handleResize.bind(this),
            onReducedMotionChange: this._handleReducedMotionChange.bind(this)
        };

        /**
         * ReducedMotionDetector instance
         * @type {ReducedMotionDetector}
         */
        this.reducedMotionDetector = getReducedMotionDetector();

        /**
         * Canvas element for mesh gradient
         * @type {HTMLCanvasElement|null}
         */
        this.canvas = null;

        /**
         * Particle container element
         * @type {HTMLElement|null}
         */
        this.particleContainer = null;

        /**
         * Title element for text reveal
         * @type {HTMLElement|null}
         */
        this.titleElement = null;
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
     * Initialize all hero animations
     * Sets up MeshGradient, ParticleSystem, TextReveal, and MagneticButtons
     * 
     * Validates: Requirements 2.1-2.9, 9.1-9.4
     */
    init() {
        // Check reduced motion preference first
        this.isReducedMotion = prefersReducedMotion();

        // Apply GPU acceleration to container
        GPUAccelerator.accelerate(this.container);

        // Find and setup elements
        this._findElements();

        // Initialize sub-controllers
        this._initMeshGradient();
        this._initParticleSystem();
        this._initTextReveal();
        this._initMagneticButtons();

        // Bind event listeners
        this._bindEvents();

        // Start listening for reduced motion changes
        this.reducedMotionDetector.onChange(this.boundHandlers.onReducedMotionChange);
        this.reducedMotionDetector.listen();

        this.isInitialized = true;

        // Trigger initial text reveal animation (if not reduced motion)
        if (!this.isReducedMotion && this.textReveal) {
            // Delay text reveal slightly for dramatic effect
            setTimeout(() => {
                this.textReveal.reveal();
            }, 500);
        }
    }

    /**
     * Find and cache DOM elements
     * @private
     */
    _findElements() {
        const { selectors } = this.config;

        // Find canvas for mesh gradient
        this.canvas = this.container.querySelector(selectors.canvas);
        
        // Find particle container
        this.particleContainer = this.container.querySelector(selectors.particleContainer);
        
        // If no particle container, use the main container
        if (!this.particleContainer) {
            this.particleContainer = this.container;
        }

        // Find title element for text reveal
        this.titleElement = this.container.querySelector(selectors.title);
    }

    /**
     * Initialize MeshGradient for animated background
     * @private
     * 
     * Validates: Requirements 2.1, 2.2, 2.3
     */
    _initMeshGradient() {
        // Skip if no canvas element found
        if (!this.canvas) {
            console.warn('HeroController: No canvas element found for MeshGradient');
            return;
        }

        try {
            const { meshGradient: config } = this.config;
            
            this.meshGradient = new MeshGradient(this.canvas, {
                pointCount: config.pointCount,
                speed: config.speed,
                colors: config.colors
            });

            // Set reduced motion state
            this.meshGradient.isReducedMotion = this.isReducedMotion;

            // Initialize the gradient
            this.meshGradient.init();
        } catch (error) {
            console.error('HeroController: Failed to initialize MeshGradient', error);
            this.meshGradient = null;
        }
    }

    /**
     * Initialize ParticleSystem for 3D floating particles
     * @private
     * 
     * Validates: Requirements 2.4, 2.5, 2.6, 9.3, 10.1
     */
    _initParticleSystem() {
        // Skip if reduced motion is enabled (Requirement 9.3)
        if (this.isReducedMotion) {
            console.log('HeroController: Reduced motion enabled, skipping ParticleSystem');
            return;
        }

        try {
            const { particles: config } = this.config;
            
            this.particleSystem = new ParticleSystem(this.particleContainer, {
                count: config.count,
                minSize: config.minSize,
                maxSize: config.maxSize,
                maxDepth: config.maxDepth,
                mouseInfluence: config.mouseInfluence
            });

            // Initialize the particle system
            this.particleSystem.init();
        } catch (error) {
            console.error('HeroController: Failed to initialize ParticleSystem', error);
            this.particleSystem = null;
        }
    }

    /**
     * Initialize TextReveal for hero title animation
     * @private
     * 
     * Validates: Requirements 2.7, 2.8
     */
    _initTextReveal() {
        // Skip if no title element found
        if (!this.titleElement) {
            console.warn('HeroController: No title element found for TextReveal');
            return;
        }

        try {
            const { textReveal: config } = this.config;
            
            this.textReveal = new TextReveal(this.titleElement, {
                staggerDelay: config.staggerDelay,
                duration: config.duration
            });

            // Set reduced motion state
            this.textReveal.isReducedMotion = this.isReducedMotion;

            // Initialize (splits text into characters)
            this.textReveal.init();
        } catch (error) {
            console.error('HeroController: Failed to initialize TextReveal', error);
            this.textReveal = null;
        }
    }

    /**
     * Initialize MagneticButtons for CTA buttons
     * @private
     * 
     * Validates: Requirements 2.9
     */
    _initMagneticButtons() {
        const { selectors, magneticButton: config } = this.config;
        
        // Find all magnetic button elements
        const buttonElements = this.container.querySelectorAll(selectors.magneticButtons);
        
        if (buttonElements.length === 0) {
            console.warn('HeroController: No magnetic button elements found');
            return;
        }

        // Create MagneticButton instance for each element
        for (const element of buttonElements) {
            try {
                const magneticButton = new MagneticButton(element, {
                    strength: config.strength,
                    scale: config.scale
                });

                // Set reduced motion state
                magneticButton.isReducedMotion = this.isReducedMotion;

                // Initialize and bind events
                magneticButton.init();
                
                // Only bind if not reduced motion
                if (!this.isReducedMotion) {
                    magneticButton.bind();
                }

                this.magneticButtons.push(magneticButton);
            } catch (error) {
                console.error('HeroController: Failed to initialize MagneticButton', error);
            }
        }
    }

    /**
     * Bind event listeners
     * @private
     */
    _bindEvents() {
        // Resize event for canvas
        window.addEventListener('resize', this.boundHandlers.onResize, { passive: true });
    }

    /**
     * Unbind event listeners
     * @private
     */
    _unbindEvents() {
        window.removeEventListener('resize', this.boundHandlers.onResize);
        
        // Stop listening for reduced motion changes
        this.reducedMotionDetector.offChange(this.boundHandlers.onReducedMotionChange);
    }

    /**
     * Handle window resize event
     * @private
     * 
     * Validates: Requirements 10.4
     */
    _handleResize() {
        // Resize mesh gradient canvas
        if (this.meshGradient) {
            this.meshGradient.resize();
        }
    }

    /**
     * Handle reduced motion preference change
     * @private
     * @param {boolean} isReducedMotion - Whether reduced motion is enabled
     * 
     * Validates: Requirements 9.1, 9.2, 9.3, 9.4
     */
    _handleReducedMotionChange(isReducedMotion) {
        this.isReducedMotion = isReducedMotion;

        // Update MeshGradient
        if (this.meshGradient) {
            this.meshGradient.onReducedMotionChange(isReducedMotion);
        }

        // Update ParticleSystem
        if (this.particleSystem) {
            this.particleSystem.onReducedMotionChange(isReducedMotion);
        } else if (!isReducedMotion) {
            // Initialize particle system if it wasn't created due to reduced motion
            this._initParticleSystem();
        }

        // Update TextReveal
        if (this.textReveal) {
            this.textReveal.onReducedMotionChange(isReducedMotion);
        }

        // Update MagneticButtons
        for (const button of this.magneticButtons) {
            button.onReducedMotionChange(isReducedMotion);
        }
    }

    /**
     * Update all hero animations
     * Called by AnimationCore on each frame
     * 
     * @param {number} deltaTime - Time since last frame in seconds
     * @param {number} [timestamp] - Current timestamp
     */
    update(deltaTime, timestamp) {
        if (!this.isInitialized) {
            return;
        }

        // Skip updates if reduced motion is enabled
        if (this.isReducedMotion) {
            return;
        }

        // Update MeshGradient
        if (this.meshGradient) {
            this.meshGradient.update(deltaTime);
        }

        // Update ParticleSystem
        if (this.particleSystem) {
            this.particleSystem.update(deltaTime, timestamp);
        }

        // TextReveal and MagneticButtons use event-driven updates
        // They don't need continuous update calls
    }

    /**
     * Trigger the text reveal animation manually
     * @returns {Promise<void>} Resolves when animation completes
     */
    revealText() {
        if (this.textReveal) {
            return this.textReveal.reveal();
        }
        return Promise.resolve();
    }

    /**
     * Reset the text reveal animation
     */
    resetTextReveal() {
        if (this.textReveal) {
            this.textReveal.reset();
        }
    }

    /**
     * Get the MeshGradient instance
     * @returns {MeshGradient|null}
     */
    getMeshGradient() {
        return this.meshGradient;
    }

    /**
     * Get the ParticleSystem instance
     * @returns {ParticleSystem|null}
     */
    getParticleSystem() {
        return this.particleSystem;
    }

    /**
     * Get the TextReveal instance
     * @returns {TextReveal|null}
     */
    getTextReveal() {
        return this.textReveal;
    }

    /**
     * Get all MagneticButton instances
     * @returns {MagneticButton[]}
     */
    getMagneticButtons() {
        return this.magneticButtons;
    }

    /**
     * Check if the controller is initialized
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
     * Pause all animations
     */
    pause() {
        if (this.meshGradient) {
            this.meshGradient.pause();
        }
        if (this.particleSystem) {
            this.particleSystem.pause();
        }
    }

    /**
     * Resume all animations
     */
    resume() {
        if (!this.isReducedMotion) {
            if (this.meshGradient) {
                this.meshGradient.resume();
            }
            if (this.particleSystem) {
                this.particleSystem.resume();
            }
        }
    }

    /**
     * Cleanup and destroy all hero animations
     * Removes event listeners, destroys sub-controllers, and resets state
     * 
     * Validates: Requirements 8.3
     * Property 19: Animation Cleanup
     * - Remove all event listeners
     * - Clear all animation frames (delegated to sub-controllers)
     * - Reset all element styles to initial state
     * - Set isInitialized to false
     * - Clear any arrays/maps of elements
     */
    destroy() {
        // Unbind event listeners (resize, reduced motion)
        this._unbindEvents();

        // Destroy MeshGradient
        if (this.meshGradient) {
            this.meshGradient.destroy();
            this.meshGradient = null;
        }

        // Destroy ParticleSystem
        if (this.particleSystem) {
            this.particleSystem.destroy();
            this.particleSystem = null;
        }

        // Destroy TextReveal
        if (this.textReveal) {
            this.textReveal.destroy();
            this.textReveal = null;
        }

        // Destroy all MagneticButtons
        for (const button of this.magneticButtons) {
            button.destroy();
        }
        this.magneticButtons = [];

        // Remove GPU acceleration from container
        GPUAccelerator.decelerate(this.container);

        // Clear element references
        this.canvas = null;
        this.particleContainer = null;
        this.titleElement = null;

        // Reset state
        this.isInitialized = false;
        this.isReducedMotion = false;
    }
}

// Export for ES modules
export { HeroController, DEFAULT_CONFIG };

// Also export as default
export default HeroController;
