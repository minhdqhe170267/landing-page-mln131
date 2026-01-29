/**
 * CinematicAnimations - Main entry point for the animation system
 * Initializes AnimationCore and all animation controllers
 * 
 * Requirements:
 * - 8.1: Use requestAnimationFrame for all continuous animations
 * - 8.3: Cleanup animations and event listeners when not needed
 * 
 * This module:
 * 1. Imports AnimationCore and all controllers
 * 2. Initializes the animation system
 * 3. Registers all controllers with AnimationCore
 * 4. Exports a public API for external use
 * 5. Handles page-specific initialization (hero, timeline, mosaic pages)
 * 
 * @module cinematic-animations
 */

// Core imports
import { AnimationCore, getAnimationCore, resetAnimationCore } from './animations/core/animation-core.js';
import { prefersReducedMotion, getReducedMotionDetector } from './animations/core/reduced-motion.js';
import { GPUAccelerator } from './animations/core/gpu-accelerator.js';

// Controller imports
import { HeroController } from './animations/controllers/hero-controller.js';
import { PageTransitionController } from './animations/controllers/page-transition.js';
import { ScrollAnimationController } from './animations/controllers/scroll-animation.js';
import { TimelineAnimationController } from './animations/controllers/timeline-animation.js';
import { MosaicAnimationController } from './animations/controllers/mosaic-animation.js';
import { MouseTrailController } from './animations/controllers/mouse-trail.js';

/**
 * Page types for auto-detection
 * @enum {string}
 */
const PageType = {
    HERO: 'hero',
    TIMELINE: 'timeline',
    MOSAIC: 'mosaic',
    GENERIC: 'generic'
};

/**
 * Default configuration for CinematicAnimations
 */
const DEFAULT_CONFIG = {
    // Auto-detect page type based on DOM elements
    autoDetect: true,
    
    // Enable specific features
    features: {
        hero: true,
        pageTransitions: true,
        scrollAnimations: true,
        timeline: true,
        mosaic: true,
        mouseTrail: true
    },
    
    // Page transition settings
    pageTransition: {
        type: 'liquid',
        duration: 800,
        easing: 'cubic-bezier(0.77, 0, 0.175, 1)'
    },
    
    // Selectors for page type detection
    selectors: {
        hero: '.hero, .hero-section, [data-hero]',
        timeline: '.timeline, .timeline-section, [data-timeline]',
        mosaic: '.mosaic-grid, .mosaic-section, [data-mosaic]'
    }
};

/**
 * CinematicAnimations class
 * Main entry point for the animation system
 */
class CinematicAnimations {
    /**
     * Create a CinematicAnimations instance
     * @param {Object} [options] - Configuration options
     * @param {boolean} [options.autoDetect=true] - Auto-detect page type
     * @param {Object} [options.features] - Enable/disable specific features
     * @param {Object} [options.pageTransition] - Page transition settings
     * @param {Object} [options.selectors] - CSS selectors for page detection
     */
    constructor(options = {}) {
        /**
         * Configuration options (merged with defaults)
         * @type {Object}
         */
        this.config = this._mergeConfig(DEFAULT_CONFIG, options);
        
        /**
         * AnimationCore instance
         * @type {AnimationCore|null}
         */
        this.core = null;
        
        /**
         * HeroController instance
         * @type {HeroController|null}
         */
        this.heroController = null;
        
        /**
         * PageTransitionController instance
         * @type {PageTransitionController|null}
         */
        this.pageTransitionController = null;
        
        /**
         * ScrollAnimationController instance
         * @type {ScrollAnimationController|null}
         */
        this.scrollAnimationController = null;
        
        /**
         * TimelineAnimationController instance
         * @type {TimelineAnimationController|null}
         */
        this.timelineAnimationController = null;
        
        /**
         * MosaicAnimationController instance
         * @type {MosaicAnimationController|null}
         */
        this.mosaicAnimationController = null;
        
        /**
         * MouseTrailController instance
         * @type {MouseTrailController|null}
         */
        this.mouseTrailController = null;
        
        /**
         * Detected page type
         * @type {string}
         */
        this.pageType = PageType.GENERIC;
        
        /**
         * Whether the system has been initialized
         * @type {boolean}
         */
        this.isInitialized = false;
        
        /**
         * Whether reduced motion is enabled
         * @type {boolean}
         */
        this.isReducedMotion = false;
        
        /**
         * Whether the system is paused
         * @type {boolean}
         */
        this.isPaused = false;
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
     * Detect the current page type based on DOM elements
     * @private
     * @returns {string} Detected page type
     */
    _detectPageType() {
        const { selectors } = this.config;
        
        // Check for hero section (index page)
        if (document.querySelector(selectors.hero)) {
            return PageType.HERO;
        }
        
        // Check for timeline section
        if (document.querySelector(selectors.timeline)) {
            return PageType.TIMELINE;
        }
        
        // Check for mosaic section
        if (document.querySelector(selectors.mosaic)) {
            return PageType.MOSAIC;
        }
        
        return PageType.GENERIC;
    }

    /**
     * Initialize the animation system
     * Sets up AnimationCore and all relevant controllers based on page type
     * 
     * @returns {CinematicAnimations} This instance for chaining
     * 
     * Validates: Requirements 8.1
     */
    init() {
        if (this.isInitialized) {
            console.warn('CinematicAnimations: Already initialized');
            return this;
        }

        // Check reduced motion preference
        this.isReducedMotion = prefersReducedMotion();

        // Detect page type if auto-detect is enabled
        if (this.config.autoDetect) {
            this.pageType = this._detectPageType();
        }

        console.log(`CinematicAnimations: Initializing for page type "${this.pageType}"`);

        // Initialize AnimationCore
        this.core = getAnimationCore();

        // Initialize controllers based on page type and features
        this._initControllers();

        // Start the animation system
        if (!this.isReducedMotion) {
            this.core.start();
        }

        this.isInitialized = true;

        console.log('CinematicAnimations: Initialization complete');

        return this;
    }

    /**
     * Initialize controllers based on page type and enabled features
     * @private
     */
    _initControllers() {
        const { features } = this.config;

        // Always initialize page transitions if enabled
        if (features.pageTransitions) {
            this._initPageTransitions();
        }

        // Always initialize scroll animations if enabled
        if (features.scrollAnimations) {
            this._initScrollAnimations();
        }

        // Always initialize mouse trail if enabled (and not reduced motion)
        if (features.mouseTrail && !this.isReducedMotion) {
            this._initMouseTrail();
        }

        // Initialize page-specific controllers
        switch (this.pageType) {
            case PageType.HERO:
                if (features.hero) {
                    this._initHero();
                }
                break;

            case PageType.TIMELINE:
                if (features.timeline) {
                    this._initTimeline();
                }
                break;

            case PageType.MOSAIC:
                if (features.mosaic) {
                    this._initMosaic();
                }
                break;

            default:
                // Generic page - check for any available sections
                if (features.hero && document.querySelector(this.config.selectors.hero)) {
                    this._initHero();
                }
                if (features.timeline && document.querySelector(this.config.selectors.timeline)) {
                    this._initTimeline();
                }
                if (features.mosaic && document.querySelector(this.config.selectors.mosaic)) {
                    this._initMosaic();
                }
                break;
        }
    }

    /**
     * Initialize HeroController
     * @private
     */
    _initHero() {
        const heroElement = document.querySelector(this.config.selectors.hero);
        
        if (!heroElement) {
            console.warn('CinematicAnimations: Hero element not found');
            return;
        }

        try {
            this.heroController = new HeroController(heroElement);
            this.heroController.init();
            
            // Register with AnimationCore
            this.core.register('hero', this.heroController);
            
            console.log('CinematicAnimations: HeroController initialized');
        } catch (error) {
            console.error('CinematicAnimations: Failed to initialize HeroController', error);
        }
    }

    /**
     * Initialize PageTransitionController
     * @private
     */
    _initPageTransitions() {
        try {
            this.pageTransitionController = new PageTransitionController(this.config.pageTransition);
            this.pageTransitionController.init();
            
            // Register with AnimationCore
            this.core.register('pageTransition', this.pageTransitionController);
            
            console.log('CinematicAnimations: PageTransitionController initialized');
        } catch (error) {
            console.error('CinematicAnimations: Failed to initialize PageTransitionController', error);
        }
    }

    /**
     * Initialize ScrollAnimationController
     * @private
     */
    _initScrollAnimations() {
        try {
            this.scrollAnimationController = new ScrollAnimationController();
            this.scrollAnimationController.init();
            
            // Register with AnimationCore
            this.core.register('scrollAnimation', this.scrollAnimationController);
            
            console.log('CinematicAnimations: ScrollAnimationController initialized');
        } catch (error) {
            console.error('CinematicAnimations: Failed to initialize ScrollAnimationController', error);
        }
    }

    /**
     * Initialize TimelineAnimationController
     * @private
     */
    _initTimeline() {
        const timelineElement = document.querySelector(this.config.selectors.timeline);
        
        if (!timelineElement) {
            console.warn('CinematicAnimations: Timeline element not found');
            return;
        }

        try {
            this.timelineAnimationController = new TimelineAnimationController(timelineElement);
            this.timelineAnimationController.init();
            
            // Register with AnimationCore
            this.core.register('timeline', this.timelineAnimationController);
            
            console.log('CinematicAnimations: TimelineAnimationController initialized');
        } catch (error) {
            console.error('CinematicAnimations: Failed to initialize TimelineAnimationController', error);
        }
    }

    /**
     * Initialize MosaicAnimationController
     * @private
     */
    _initMosaic() {
        const mosaicElement = document.querySelector(this.config.selectors.mosaic);
        
        if (!mosaicElement) {
            console.warn('CinematicAnimations: Mosaic element not found');
            return;
        }

        try {
            this.mosaicAnimationController = new MosaicAnimationController(mosaicElement);
            this.mosaicAnimationController.init();
            
            // Register with AnimationCore
            this.core.register('mosaic', this.mosaicAnimationController);
            
            console.log('CinematicAnimations: MosaicAnimationController initialized');
        } catch (error) {
            console.error('CinematicAnimations: Failed to initialize MosaicAnimationController', error);
        }
    }

    /**
     * Initialize MouseTrailController
     * @private
     */
    _initMouseTrail() {
        try {
            this.mouseTrailController = new MouseTrailController();
            this.mouseTrailController.bind();
            
            // Register with AnimationCore
            this.core.register('mouseTrail', this.mouseTrailController);
            
            console.log('CinematicAnimations: MouseTrailController initialized');
        } catch (error) {
            console.error('CinematicAnimations: Failed to initialize MouseTrailController', error);
        }
    }

    /**
     * Pause all animations
     * Stops the animation loop and pauses all controllers
     * 
     * @returns {CinematicAnimations} This instance for chaining
     */
    pause() {
        if (!this.isInitialized || this.isPaused) {
            return this;
        }

        // Stop AnimationCore
        if (this.core) {
            this.core.stop();
            this.core.pauseAll();
        }

        this.isPaused = true;
        console.log('CinematicAnimations: Paused');

        return this;
    }

    /**
     * Resume all animations
     * Restarts the animation loop and resumes all controllers
     * 
     * @returns {CinematicAnimations} This instance for chaining
     */
    resume() {
        if (!this.isInitialized || !this.isPaused) {
            return this;
        }

        // Don't resume if reduced motion is enabled
        if (this.isReducedMotion) {
            console.log('CinematicAnimations: Cannot resume - reduced motion enabled');
            return this;
        }

        // Resume AnimationCore
        if (this.core) {
            this.core.resumeAll();
            this.core.start();
        }

        this.isPaused = false;
        console.log('CinematicAnimations: Resumed');

        return this;
    }

    /**
     * Destroy the animation system
     * Cleans up all controllers, removes event listeners, and resets state
     * 
     * @returns {CinematicAnimations} This instance for chaining
     * 
     * Validates: Requirements 8.3
     */
    destroy() {
        if (!this.isInitialized) {
            return this;
        }

        console.log('CinematicAnimations: Destroying...');

        // Destroy AnimationCore (this will destroy all registered controllers)
        if (this.core) {
            this.core.destroy();
        }

        // Reset singleton
        resetAnimationCore();

        // Clear references
        this.core = null;
        this.heroController = null;
        this.pageTransitionController = null;
        this.scrollAnimationController = null;
        this.timelineAnimationController = null;
        this.mosaicAnimationController = null;
        this.mouseTrailController = null;

        // Reset state
        this.isInitialized = false;
        this.isPaused = false;

        console.log('CinematicAnimations: Destroyed');

        return this;
    }

    /**
     * Get the AnimationCore instance
     * @returns {AnimationCore|null}
     */
    getCore() {
        return this.core;
    }

    /**
     * Get the HeroController instance
     * @returns {HeroController|null}
     */
    getHeroController() {
        return this.heroController;
    }

    /**
     * Get the PageTransitionController instance
     * @returns {PageTransitionController|null}
     */
    getPageTransitionController() {
        return this.pageTransitionController;
    }

    /**
     * Get the ScrollAnimationController instance
     * @returns {ScrollAnimationController|null}
     */
    getScrollAnimationController() {
        return this.scrollAnimationController;
    }

    /**
     * Get the TimelineAnimationController instance
     * @returns {TimelineAnimationController|null}
     */
    getTimelineAnimationController() {
        return this.timelineAnimationController;
    }

    /**
     * Get the MosaicAnimationController instance
     * @returns {MosaicAnimationController|null}
     */
    getMosaicAnimationController() {
        return this.mosaicAnimationController;
    }

    /**
     * Get the MouseTrailController instance
     * @returns {MouseTrailController|null}
     */
    getMouseTrailController() {
        return this.mouseTrailController;
    }

    /**
     * Get the detected page type
     * @returns {string}
     */
    getPageType() {
        return this.pageType;
    }

    /**
     * Check if the system is initialized
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
     * Check if the system is paused
     * @returns {boolean}
     */
    getIsPaused() {
        return this.isPaused;
    }

    /**
     * Set page transition type
     * @param {string} type - 'liquid' or 'curtain'
     * @returns {CinematicAnimations} This instance for chaining
     */
    setPageTransitionType(type) {
        if (this.pageTransitionController) {
            this.pageTransitionController.setType(type);
        }
        return this;
    }

    /**
     * Trigger a page transition manually
     * @param {string} url - URL to navigate to
     * @returns {Promise<void>}
     */
    async triggerPageTransition(url) {
        if (this.pageTransitionController) {
            await this.pageTransitionController.transition(url);
        }
    }

    /**
     * Trigger hero text reveal animation
     * @returns {Promise<void>}
     */
    async triggerHeroTextReveal() {
        if (this.heroController) {
            await this.heroController.revealText();
        }
    }
}

/**
 * Singleton instance for global use
 * @type {CinematicAnimations|null}
 */
let singletonInstance = null;

/**
 * Get or create the singleton CinematicAnimations instance
 * @param {Object} [options] - Configuration options
 * @returns {CinematicAnimations}
 */
function getCinematicAnimations(options = {}) {
    if (!singletonInstance) {
        singletonInstance = new CinematicAnimations(options);
    }
    return singletonInstance;
}

/**
 * Reset the singleton instance (useful for testing)
 */
function resetCinematicAnimations() {
    if (singletonInstance) {
        singletonInstance.destroy();
        singletonInstance = null;
    }
}

/**
 * Auto-initialize on DOMContentLoaded if data-cinematic-auto attribute is present
 */
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        // Check for auto-init attribute on body or script tag
        const autoInit = document.body.hasAttribute('data-cinematic-auto') ||
                        document.querySelector('script[data-cinematic-auto]');
        
        if (autoInit) {
            const animations = getCinematicAnimations();
            animations.init();
            
            // Expose to window for debugging
            window.cinematicAnimations = animations;
        }
    });
}

// Export for ES modules
export {
    CinematicAnimations,
    getCinematicAnimations,
    resetCinematicAnimations,
    PageType,
    DEFAULT_CONFIG
};

// Also export as default
export default CinematicAnimations;
