/**
 * ReducedMotionDetector - Accessibility handler for reduced motion preference
 * Detects and responds to user's prefers-reduced-motion media query
 * 
 * Requirements:
 * - 9.1: When user has prefers-reduced-motion: reduce, disable all continuous animations
 * - 9.2: Show content immediately without animation delays when reduced motion enabled
 * - 9.3: Disable continuous animations (particles, floating, etc.)
 * - 9.4: Provide static alternatives for animated content
 * - 9.5: Listen for media query changes and update accordingly
 * 
 * Design Interface:
 * - check(): Check current reduced motion preference
 * - listen(): Listen for media query changes
 * - onChange(callback): Register callback for preference changes
 * - offChange(callback): Unregister callback
 * - Callback handling for preference changes
 * 
 * Usage:
 * Controllers should:
 * 1. Check prefersReducedMotion() in init() to set initial state
 * 2. Implement onReducedMotionChange(isReducedMotion) method
 * 3. Register with AnimationCore OR directly with ReducedMotionDetector
 * 4. Skip continuous animations in update() when isReducedMotion is true
 * 5. Show content immediately without delays when reduced motion is enabled
 */

/**
 * Media query string for reduced motion preference
 */
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * ReducedMotionDetector class
 * Provides methods to check and listen for reduced motion preference changes
 */
class ReducedMotionDetector {
    /**
     * Create a ReducedMotionDetector instance
     */
    constructor() {
        /**
         * MediaQueryList object for reduced motion preference
         * @type {MediaQueryList|null}
         */
        this.mediaQuery = null;
        
        /**
         * Current reduced motion state
         * @type {boolean}
         */
        this.isReducedMotion = false;
        
        /**
         * Array of registered callbacks
         * @type {Function[]}
         */
        this.callbacks = [];
        
        /**
         * Bound handler for media query changes
         * @type {Function}
         */
        this.boundHandler = this._handleChange.bind(this);
        
        /**
         * Whether the detector is currently listening
         * @type {boolean}
         */
        this.isListening = false;
        
        // Initialize media query if available
        this._initMediaQuery();
    }

    /**
     * Initialize the media query object
     * @private
     */
    _initMediaQuery() {
        // Check if window.matchMedia is available (browser environment)
        if (typeof window !== 'undefined' && window.matchMedia) {
            try {
                this.mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
                this.isReducedMotion = this.mediaQuery.matches;
            } catch (error) {
                console.warn('ReducedMotionDetector: Failed to initialize media query', error);
                this.mediaQuery = null;
                this.isReducedMotion = false;
            }
        } else {
            // Non-browser environment or matchMedia not supported
            this.mediaQuery = null;
            this.isReducedMotion = false;
        }
    }

    /**
     * Check current reduced motion preference
     * Returns true if user prefers reduced motion
     * 
     * @returns {boolean} - True if reduced motion is preferred
     * 
     * Validates: Requirements 9.1
     */
    check() {
        // If mediaQuery is available, get current state
        if (this.mediaQuery) {
            this.isReducedMotion = this.mediaQuery.matches;
        }
        
        return this.isReducedMotion;
    }

    /**
     * Start listening for media query changes
     * Calls registered callbacks when preference changes
     * 
     * @returns {boolean} - True if listening started successfully
     * 
     * Validates: Requirements 9.5
     */
    listen() {
        // Already listening
        if (this.isListening) {
            return true;
        }

        // Cannot listen without mediaQuery support
        if (!this.mediaQuery) {
            console.warn('ReducedMotionDetector.listen: MediaQuery not supported');
            return false;
        }

        try {
            // Modern browsers use addEventListener
            if (this.mediaQuery.addEventListener) {
                this.mediaQuery.addEventListener('change', this.boundHandler);
            } 
            // Fallback for older browsers (Safari < 14)
            else if (this.mediaQuery.addListener) {
                this.mediaQuery.addListener(this.boundHandler);
            } else {
                console.warn('ReducedMotionDetector.listen: No listener method available');
                return false;
            }

            this.isListening = true;
            return true;
        } catch (error) {
            console.error('ReducedMotionDetector.listen: Failed to add listener', error);
            return false;
        }
    }

    /**
     * Stop listening for media query changes
     * 
     * @returns {boolean} - True if listening stopped successfully
     */
    unlisten() {
        // Not currently listening
        if (!this.isListening) {
            return true;
        }

        // Cannot unlisten without mediaQuery
        if (!this.mediaQuery) {
            return true;
        }

        try {
            // Modern browsers use removeEventListener
            if (this.mediaQuery.removeEventListener) {
                this.mediaQuery.removeEventListener('change', this.boundHandler);
            }
            // Fallback for older browsers (Safari < 14)
            else if (this.mediaQuery.removeListener) {
                this.mediaQuery.removeListener(this.boundHandler);
            }

            this.isListening = false;
            return true;
        } catch (error) {
            console.error('ReducedMotionDetector.unlisten: Failed to remove listener', error);
            return false;
        }
    }

    /**
     * Register a callback to be called when reduced motion preference changes
     * 
     * @param {Function} callback - Function to call with new preference state (boolean)
     * @returns {boolean} - True if callback was registered
     */
    onChange(callback) {
        if (typeof callback !== 'function') {
            console.warn('ReducedMotionDetector.onChange: Callback must be a function');
            return false;
        }

        // Avoid duplicate callbacks
        if (this.callbacks.includes(callback)) {
            return true;
        }

        this.callbacks.push(callback);
        return true;
    }

    /**
     * Unregister a callback
     * 
     * @param {Function} callback - The callback to remove
     * @returns {boolean} - True if callback was removed
     */
    offChange(callback) {
        const index = this.callbacks.indexOf(callback);
        if (index === -1) {
            return false;
        }

        this.callbacks.splice(index, 1);
        return true;
    }

    /**
     * Handle media query change event
     * @private
     * @param {MediaQueryListEvent} event - The change event
     */
    _handleChange(event) {
        const newValue = event.matches;
        
        // Only notify if value actually changed
        if (newValue !== this.isReducedMotion) {
            this.isReducedMotion = newValue;
            this._notifyCallbacks(newValue);
        }
    }

    /**
     * Notify all registered callbacks of the new state
     * @private
     * @param {boolean} isReducedMotion - The new reduced motion state
     */
    _notifyCallbacks(isReducedMotion) {
        for (const callback of this.callbacks) {
            try {
                callback(isReducedMotion);
            } catch (error) {
                console.error('ReducedMotionDetector: Callback error', error);
            }
        }
    }

    /**
     * Get the number of registered callbacks
     * 
     * @returns {number} - Number of registered callbacks
     */
    getCallbackCount() {
        return this.callbacks.length;
    }

    /**
     * Clear all registered callbacks
     */
    clearCallbacks() {
        this.callbacks = [];
    }

    /**
     * Cleanup and destroy the detector
     * Removes all listeners and callbacks
     */
    destroy() {
        this.unlisten();
        this.clearCallbacks();
        this.mediaQuery = null;
        this.isReducedMotion = false;
    }
}

/**
 * Singleton instance for global use
 * Most applications only need one detector
 */
let singletonInstance = null;

/**
 * Get the singleton ReducedMotionDetector instance
 * Creates one if it doesn't exist
 * 
 * @returns {ReducedMotionDetector} - The singleton instance
 */
function getReducedMotionDetector() {
    if (!singletonInstance) {
        singletonInstance = new ReducedMotionDetector();
    }
    return singletonInstance;
}

/**
 * Quick check for reduced motion preference
 * Uses singleton instance
 * 
 * @returns {boolean} - True if reduced motion is preferred
 */
function prefersReducedMotion() {
    return getReducedMotionDetector().check();
}

/**
 * Register a controller to receive reduced motion change notifications
 * This is a convenience function for controllers that aren't registered with AnimationCore
 * 
 * @param {Object} controller - Controller with onReducedMotionChange method
 * @returns {Function} - Unsubscribe function to remove the listener
 * 
 * Usage:
 * const unsubscribe = registerForReducedMotionChanges(myController);
 * // Later, to unsubscribe:
 * unsubscribe();
 * 
 * Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5
 */
function registerForReducedMotionChanges(controller) {
    if (!controller || typeof controller.onReducedMotionChange !== 'function') {
        console.warn('registerForReducedMotionChanges: Controller must have onReducedMotionChange method');
        return () => {};
    }
    
    const detector = getReducedMotionDetector();
    
    // Create a wrapper callback that calls the controller's method
    const callback = (isReducedMotion) => {
        controller.onReducedMotionChange(isReducedMotion);
    };
    
    // Register the callback
    detector.onChange(callback);
    
    // Start listening if not already
    detector.listen();
    
    // Return unsubscribe function
    return () => {
        detector.offChange(callback);
    };
}

/**
 * Apply reduced motion styles to an element immediately
 * Shows content without animation delays
 * 
 * @param {HTMLElement} element - Element to apply styles to
 * 
 * Validates: Requirements 9.2, 9.4
 */
function applyReducedMotionStyles(element) {
    if (!element) return;
    
    // Remove any animation delays
    element.style.animationDelay = '0s';
    element.style.transitionDelay = '0s';
    
    // Show content immediately
    element.style.opacity = '1';
    element.style.visibility = 'visible';
    
    // Remove transforms that might hide content
    element.style.transform = 'none';
}

/**
 * Check if reduced motion is enabled and apply appropriate behavior
 * Convenience function that combines check and action
 * 
 * @param {Object} options - Options for handling reduced motion
 * @param {Function} [options.onEnabled] - Callback when reduced motion is enabled
 * @param {Function} [options.onDisabled] - Callback when reduced motion is disabled
 * @returns {boolean} - Current reduced motion state
 * 
 * Validates: Requirements 9.1, 9.2, 9.3, 9.4
 */
function handleReducedMotion(options = {}) {
    const isEnabled = prefersReducedMotion();
    
    if (isEnabled && typeof options.onEnabled === 'function') {
        options.onEnabled();
    } else if (!isEnabled && typeof options.onDisabled === 'function') {
        options.onDisabled();
    }
    
    return isEnabled;
}

// Export for ES modules
export { 
    ReducedMotionDetector, 
    getReducedMotionDetector, 
    prefersReducedMotion,
    registerForReducedMotionChanges,
    applyReducedMotionStyles,
    handleReducedMotion,
    REDUCED_MOTION_QUERY 
};

// Also export as default
export default ReducedMotionDetector;
