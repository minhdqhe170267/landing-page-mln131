/**
 * AnimationCore - Central animation manager
 * Manages RAF loop, reduced motion, and controller lifecycle
 * 
 * Requirements:
 * - 8.1: Use requestAnimationFrame for all continuous animations
 * - 8.3: Cleanup animations and event listeners when not needed
 * - 9.1: Disable all continuous animations when reduced motion is enabled
 * - 9.2: Show content immediately without animation delays
 * - 9.3: Disable continuous animations (particles, floating, etc.)
 * - 9.4: Provide static alternatives for animated content
 * 
 * Design Interface:
 * - register(name, controller): Register a controller
 * - unregister(name): Unregister a controller
 * - start(): Start animation loop
 * - stop(): Stop animation loop
 * - tick(timestamp): Main animation loop
 * - destroy(): Cleanup all controllers
 * 
 * Reduced Motion Support:
 * - Automatically checks reduced motion preference on init
 * - Broadcasts changes to all registered controllers via onReducedMotionChange()
 * - Stops animation loop when reduced motion is enabled
 * - Controllers should implement onReducedMotionChange(isReducedMotion) method
 */

import { ReducedMotionDetector, getReducedMotionDetector } from './reduced-motion.js';

/**
 * AnimationCore class
 * Central manager for all animations in the system
 */
class AnimationCore {
    /**
     * Create an AnimationCore instance
     * @param {Object} options - Configuration options
     * @param {number} [options.targetFPS=120] - Target frames per second
     * @param {ReducedMotionDetector} [options.reducedMotionDetector] - Custom detector instance
     */
    constructor(options = {}) {
        /**
         * Map of registered animation controllers
         * @type {Map<string, Object>}
         */
        this.controllers = new Map();
        
        /**
         * Whether reduced motion is enabled
         * @type {boolean}
         */
        this.isReducedMotion = false;
        
        /**
         * Current requestAnimationFrame ID
         * @type {number|null}
         */
        this.rafId = null;
        
        /**
         * Whether the animation loop is running
         * @type {boolean}
         */
        this.isRunning = false;
        
        /**
         * Target FPS for animations
         * @type {number}
         */
        this.targetFPS = options.targetFPS || 120;
        
        /**
         * Frame interval in milliseconds (for FPS limiting if needed)
         * @type {number}
         */
        this.frameInterval = 1000 / this.targetFPS;
        
        /**
         * Last frame timestamp
         * @type {number}
         */
        this.lastFrameTime = 0;
        
        /**
         * Previous tick timestamp for delta calculation
         * @type {number}
         */
        this.previousTimestamp = 0;
        
        /**
         * ReducedMotionDetector instance
         * @type {ReducedMotionDetector}
         */
        this.reducedMotionDetector = options.reducedMotionDetector || getReducedMotionDetector();
        
        /**
         * Bound tick function for RAF
         * @type {Function}
         */
        this.boundTick = this.tick.bind(this);
        
        /**
         * Bound handler for reduced motion changes
         * @type {Function}
         */
        this.boundReducedMotionHandler = this._handleReducedMotionChange.bind(this);
        
        /**
         * Whether the core has been initialized
         * @type {boolean}
         */
        this.isInitialized = false;
        
        // Initialize
        this._init();
    }

    /**
     * Initialize the animation core
     * @private
     */
    _init() {
        // Check initial reduced motion state
        this.checkReducedMotion();
        
        // Listen for reduced motion changes
        this.reducedMotionDetector.onChange(this.boundReducedMotionHandler);
        this.reducedMotionDetector.listen();
        
        this.isInitialized = true;
    }

    /**
     * Check reduced motion preference
     * Updates internal state based on user preference
     * 
     * @returns {boolean} - True if reduced motion is preferred
     */
    checkReducedMotion() {
        this.isReducedMotion = this.reducedMotionDetector.check();
        return this.isReducedMotion;
    }

    /**
     * Handle reduced motion preference change
     * Notifies all registered controllers and manages animation loop
     * @private
     * @param {boolean} isReducedMotion - New reduced motion state
     * 
     * Validates: Requirements 9.1, 9.2, 9.3, 9.4
     */
    _handleReducedMotionChange(isReducedMotion) {
        this.isReducedMotion = isReducedMotion;
        
        // Notify all controllers of the change
        // Controllers should implement onReducedMotionChange(isReducedMotion) method
        for (const [name, controller] of this.controllers) {
            if (controller && typeof controller.onReducedMotionChange === 'function') {
                try {
                    controller.onReducedMotionChange(isReducedMotion);
                } catch (error) {
                    console.error(`AnimationCore: Error notifying controller "${name}" of reduced motion change`, error);
                }
            }
            
            // Also set isReducedMotion property directly if it exists
            if (controller && 'isReducedMotion' in controller) {
                controller.isReducedMotion = isReducedMotion;
            }
        }
        
        // If reduced motion is enabled, stop continuous animations (Requirement 9.3)
        if (isReducedMotion && this.isRunning) {
            this.stop();
            console.log('AnimationCore: Reduced motion enabled, stopping animation loop');
        }
        // If reduced motion is disabled and we have controllers, restart
        else if (!isReducedMotion && !this.isRunning && this.controllers.size > 0) {
            this.start();
            console.log('AnimationCore: Reduced motion disabled, restarting animation loop');
        }
    }

    /**
     * Register an animation controller
     * 
     * @param {string} name - Unique name for the controller
     * @param {Object} controller - Controller object with update() method
     * @returns {boolean} - True if registration was successful
     */
    register(name, controller) {
        // Validate name
        if (typeof name !== 'string' || name.trim() === '') {
            console.warn('AnimationCore.register: Invalid controller name');
            return false;
        }
        
        // Validate controller
        if (!controller || typeof controller !== 'object') {
            console.warn(`AnimationCore.register: Invalid controller for "${name}"`);
            return false;
        }
        
        // Check for update method (required for animation loop)
        if (typeof controller.update !== 'function') {
            console.warn(`AnimationCore.register: Controller "${name}" must have an update() method`);
            return false;
        }
        
        // Check if already registered
        if (this.controllers.has(name)) {
            console.warn(`AnimationCore.register: Controller "${name}" is already registered`);
            return false;
        }
        
        // Register the controller
        this.controllers.set(name, controller);
        
        // Initialize controller if it has init method and core is running
        if (typeof controller.init === 'function' && !controller.isInitialized) {
            try {
                controller.init();
            } catch (error) {
                console.error(`AnimationCore.register: Error initializing controller "${name}"`, error);
            }
        }
        
        return true;
    }

    /**
     * Unregister an animation controller
     * 
     * @param {string} name - Name of the controller to unregister
     * @returns {boolean} - True if unregistration was successful
     */
    unregister(name) {
        // Validate name
        if (typeof name !== 'string' || name.trim() === '') {
            console.warn('AnimationCore.unregister: Invalid controller name');
            return false;
        }
        
        // Check if controller exists
        if (!this.controllers.has(name)) {
            console.warn(`AnimationCore.unregister: Controller "${name}" is not registered`);
            return false;
        }
        
        // Get controller and call destroy if available
        const controller = this.controllers.get(name);
        if (controller && typeof controller.destroy === 'function') {
            try {
                controller.destroy();
            } catch (error) {
                console.error(`AnimationCore.unregister: Error destroying controller "${name}"`, error);
            }
        }
        
        // Remove from map
        this.controllers.delete(name);
        
        return true;
    }

    /**
     * Start the animation loop
     * Uses requestAnimationFrame for smooth animations
     * 
     * @returns {boolean} - True if animation loop started
     * 
     * Validates: Requirements 8.1
     */
    start() {
        // Already running
        if (this.isRunning) {
            return true;
        }
        
        // Don't start if reduced motion is enabled
        if (this.isReducedMotion) {
            console.log('AnimationCore.start: Reduced motion enabled, not starting animation loop');
            return false;
        }
        
        // Check if requestAnimationFrame is available
        if (typeof requestAnimationFrame !== 'function') {
            console.error('AnimationCore.start: requestAnimationFrame is not available');
            return false;
        }
        
        this.isRunning = true;
        this.previousTimestamp = performance.now();
        this.lastFrameTime = this.previousTimestamp;
        
        // Start the animation loop
        this.rafId = requestAnimationFrame(this.boundTick);
        
        return true;
    }

    /**
     * Stop the animation loop
     * 
     * @returns {boolean} - True if animation loop stopped
     */
    stop() {
        // Not running
        if (!this.isRunning) {
            return true;
        }
        
        // Cancel the animation frame
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        
        this.isRunning = false;
        
        return true;
    }

    /**
     * Main animation loop tick
     * Called by requestAnimationFrame
     * 
     * @param {number} timestamp - Current timestamp from RAF
     * 
     * Validates: Requirements 8.1
     */
    tick(timestamp) {
        // Safety check - stop if not running
        if (!this.isRunning) {
            return;
        }
        
        // Calculate delta time in seconds
        const deltaTime = (timestamp - this.previousTimestamp) / 1000;
        this.previousTimestamp = timestamp;
        
        // Update all registered controllers
        for (const [name, controller] of this.controllers) {
            // Skip if reduced motion and controller doesn't support it
            if (this.isReducedMotion && !controller.supportsReducedMotion) {
                continue;
            }
            
            try {
                controller.update(deltaTime, timestamp);
            } catch (error) {
                console.error(`AnimationCore.tick: Error updating controller "${name}"`, error);
            }
        }
        
        // Schedule next frame
        this.rafId = requestAnimationFrame(this.boundTick);
    }

    /**
     * Get a registered controller by name
     * 
     * @param {string} name - Name of the controller
     * @returns {Object|null} - The controller or null if not found
     */
    getController(name) {
        return this.controllers.get(name) || null;
    }

    /**
     * Check if a controller is registered
     * 
     * @param {string} name - Name of the controller
     * @returns {boolean} - True if controller is registered
     */
    hasController(name) {
        return this.controllers.has(name);
    }

    /**
     * Get all registered controller names
     * 
     * @returns {string[]} - Array of controller names
     */
    getControllerNames() {
        return Array.from(this.controllers.keys());
    }

    /**
     * Get the number of registered controllers
     * 
     * @returns {number} - Number of registered controllers
     */
    getControllerCount() {
        return this.controllers.size;
    }

    /**
     * Cleanup and destroy the animation core
     * Stops animation loop, destroys all controllers, removes listeners
     * 
     * @returns {boolean} - True if destruction was successful
     * 
     * Validates: Requirements 8.3
     * Property 19: Animation Cleanup
     * - Remove all event listeners
     * - Clear all animation frames (cancelAnimationFrame)
     * - Reset all element styles to initial state (delegated to controllers)
     * - Set isInitialized to false
     * - Clear any arrays/maps of elements
     */
    destroy() {
        // Stop the animation loop (clears RAF)
        this.stop();
        
        // Destroy all controllers
        for (const [name, controller] of this.controllers) {
            if (controller && typeof controller.destroy === 'function') {
                try {
                    controller.destroy();
                } catch (error) {
                    console.error(`AnimationCore.destroy: Error destroying controller "${name}"`, error);
                }
            }
        }
        
        // Clear controllers map
        this.controllers.clear();
        
        // Remove reduced motion listener
        this.reducedMotionDetector.offChange(this.boundReducedMotionHandler);
        
        // Reset state
        this.isInitialized = false;
        this.isRunning = false;
        this.isReducedMotion = false;
        this.rafId = null;
        this.previousTimestamp = 0;
        this.lastFrameTime = 0;
        
        return true;
    }

    /**
     * Pause all controllers that support pausing
     */
    pauseAll() {
        for (const [name, controller] of this.controllers) {
            if (controller && typeof controller.pause === 'function') {
                try {
                    controller.pause();
                } catch (error) {
                    console.error(`AnimationCore.pauseAll: Error pausing controller "${name}"`, error);
                }
            }
        }
    }

    /**
     * Resume all controllers that support resuming
     */
    resumeAll() {
        for (const [name, controller] of this.controllers) {
            if (controller && typeof controller.resume === 'function') {
                try {
                    controller.resume();
                } catch (error) {
                    console.error(`AnimationCore.resumeAll: Error resuming controller "${name}"`, error);
                }
            }
        }
    }
}

/**
 * Singleton instance for global use
 */
let singletonInstance = null;

/**
 * Get the singleton AnimationCore instance
 * Creates one if it doesn't exist
 * 
 * @param {Object} [options] - Options for creating new instance
 * @returns {AnimationCore} - The singleton instance
 */
function getAnimationCore(options = {}) {
    if (!singletonInstance) {
        singletonInstance = new AnimationCore(options);
    }
    return singletonInstance;
}

/**
 * Reset the singleton instance (useful for testing)
 */
function resetAnimationCore() {
    if (singletonInstance) {
        singletonInstance.destroy();
        singletonInstance = null;
    }
}

// Export for ES modules
export { 
    AnimationCore, 
    getAnimationCore, 
    resetAnimationCore 
};

// Also export as default
export default AnimationCore;
