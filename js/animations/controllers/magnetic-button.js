/**
 * MagneticButton - Magnetic hover effect for buttons
 * Button follows cursor within bounds, creating a "magnetic pull" effect
 * 
 * Requirements:
 * - 2.9: Apply magnetic effect that pulls button toward cursor on hover
 * - 9.1, 9.2: Support reduced motion (disable effect when enabled)
 * - 1.1, 1.2: Use GPU-accelerated transforms
 * 
 * Design Interface:
 * - bind(): Bind mouse events to element
 * - onMouseMove(e): Handle mouse movement
 * - onMouseLeave(): Handle mouse leave
 * - destroy(): Cleanup event listeners
 * 
 * @module animations/controllers/magnetic-button
 */

import { GPUAccelerator } from '../core/gpu-accelerator.js';
import { prefersReducedMotion } from '../core/reduced-motion.js';

/**
 * Default magnetic strength (0-1)
 * Higher values = stronger pull toward cursor
 */
const DEFAULT_STRENGTH = 0.3;

/**
 * Default scale factor on hover
 */
const DEFAULT_SCALE = 1.1;

/**
 * Default transition duration in milliseconds
 */
const DEFAULT_TRANSITION_DURATION = 200;

/**
 * Default easing function for transitions
 */
const DEFAULT_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';

/**
 * MagneticButton class
 * Creates a magnetic hover effect where the button follows the cursor within bounds
 */
class MagneticButton {
    /**
     * Create a MagneticButton instance
     * @param {HTMLElement} element - The button element to apply effect to
     * @param {Object} [options] - Configuration options
     * @param {number} [options.strength=0.3] - Magnetic strength (0-1)
     * @param {number} [options.scale=1.1] - Scale factor on hover
     * @param {number} [options.transitionDuration=200] - Transition duration in ms
     * @param {string} [options.easing] - CSS easing function
     */
    constructor(element, options = {}) {
        if (!element || !(element instanceof HTMLElement)) {
            throw new Error('MagneticButton: Valid HTML element is required');
        }

        /**
         * The target button element
         * @type {HTMLElement}
         */
        this.element = element;

        /**
         * Element bounding rect (cached, updated on resize)
         * @type {DOMRect|null}
         */
        this.bounds = null;

        /**
         * Configuration options
         * @type {Object}
         */
        this.options = {
            strength: this._clamp(options.strength ?? DEFAULT_STRENGTH, 0, 1),
            scale: options.scale ?? DEFAULT_SCALE,
            transitionDuration: options.transitionDuration ?? DEFAULT_TRANSITION_DURATION,
            easing: options.easing || DEFAULT_EASING
        };

        /**
         * Whether the mouse is currently over the element
         * @type {boolean}
         */
        this.isHovering = false;

        /**
         * Whether this controller has been initialized
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
         * Current transform values
         * @type {{x: number, y: number, scale: number}}
         */
        this.currentTransform = { x: 0, y: 0, scale: 1 };

        /**
         * Bound event handlers (for cleanup)
         * @type {Object}
         */
        this.boundHandlers = {
            mouseMove: this._onMouseMove.bind(this),
            mouseEnter: this._onMouseEnter.bind(this),
            mouseLeave: this._onMouseLeave.bind(this),
            resize: this._onResize.bind(this)
        };
    }

    /**
     * Initialize the magnetic button
     * Sets up GPU acceleration and checks reduced motion
     */
    init() {
        // Check reduced motion preference
        this.isReducedMotion = prefersReducedMotion();

        // Apply GPU acceleration for smooth transforms
        GPUAccelerator.accelerate(this.element);
        GPUAccelerator.setWillChange(this.element, ['transform']);

        // Set initial transition
        this._setTransition();

        // Cache bounds
        this._updateBounds();

        this.isInitialized = true;
    }

    /**
     * Bind mouse events to the element
     * Integrates with AnimationCore via this method
     * 
     * @returns {boolean} True if binding was successful
     * 
     * Validates: Requirements 2.9
     */
    bind() {
        if (!this.isInitialized) {
            this.init();
        }

        // If reduced motion, don't bind events
        if (this.isReducedMotion) {
            return false;
        }

        // Bind mouse events
        this.element.addEventListener('mouseenter', this.boundHandlers.mouseEnter);
        this.element.addEventListener('mousemove', this.boundHandlers.mouseMove);
        this.element.addEventListener('mouseleave', this.boundHandlers.mouseLeave);

        // Bind resize event to update bounds
        window.addEventListener('resize', this.boundHandlers.resize, { passive: true });

        return true;
    }

    /**
     * Unbind mouse events from the element
     * 
     * @returns {boolean} True if unbinding was successful
     */
    unbind() {
        this.element.removeEventListener('mouseenter', this.boundHandlers.mouseEnter);
        this.element.removeEventListener('mousemove', this.boundHandlers.mouseMove);
        this.element.removeEventListener('mouseleave', this.boundHandlers.mouseLeave);
        window.removeEventListener('resize', this.boundHandlers.resize);

        return true;
    }

    /**
     * Handle mouse enter event
     * @private
     * @param {MouseEvent} e - Mouse event
     */
    _onMouseEnter(e) {
        if (this.isReducedMotion) return;

        this.isHovering = true;
        this._updateBounds();
    }

    /**
     * Handle mouse move event
     * Calculates and applies magnetic pull effect
     * @private
     * @param {MouseEvent} e - Mouse event
     * 
     * Validates: Requirements 2.9
     */
    _onMouseMove(e) {
        if (this.isReducedMotion || !this.isHovering) return;

        // Get mouse position relative to element center
        const { clientX, clientY } = e;
        
        // Ensure bounds are up to date
        if (!this.bounds) {
            this._updateBounds();
        }

        // Calculate element center
        const centerX = this.bounds.left + this.bounds.width / 2;
        const centerY = this.bounds.top + this.bounds.height / 2;

        // Calculate distance from center
        const deltaX = clientX - centerX;
        const deltaY = clientY - centerY;

        // Apply magnetic strength to calculate transform
        // The button moves toward the cursor proportionally to the strength
        const translateX = deltaX * this.options.strength;
        const translateY = deltaY * this.options.strength;

        // Apply transform with scale
        this._applyTransform(translateX, translateY, this.options.scale);
    }

    /**
     * Handle mouse leave event
     * Resets button to original position
     * @private
     * 
     * Validates: Requirements 2.9
     */
    _onMouseLeave() {
        this.isHovering = false;

        // Reset to original position
        this._applyTransform(0, 0, 1);
    }

    /**
     * Handle window resize event
     * Updates cached bounds
     * @private
     */
    _onResize() {
        this._updateBounds();
    }

    /**
     * Update cached element bounds
     * @private
     */
    _updateBounds() {
        this.bounds = this.element.getBoundingClientRect();
    }

    /**
     * Apply transform to the element using GPU-accelerated properties
     * @private
     * @param {number} x - X translation in pixels
     * @param {number} y - Y translation in pixels
     * @param {number} scale - Scale factor
     * 
     * Validates: Requirements 1.1, 1.2 (GPU-accelerated transforms)
     */
    _applyTransform(x, y, scale) {
        // Store current transform values
        this.currentTransform = { x, y, scale };

        // Use translate3d for GPU acceleration (includes Z for layer promotion)
        this.element.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
    }

    /**
     * Set transition property for smooth animations
     * @private
     */
    _setTransition() {
        const duration = this.options.transitionDuration;
        const easing = this.options.easing;
        this.element.style.transition = `transform ${duration}ms ${easing}`;
    }

    /**
     * Clear transition property
     * @private
     */
    _clearTransition() {
        this.element.style.transition = '';
    }

    /**
     * Handle reduced motion preference change
     * 
     * @param {boolean} isReducedMotion - Whether reduced motion is enabled
     * 
     * Validates: Requirements 9.1, 9.2
     */
    onReducedMotionChange(isReducedMotion) {
        this.isReducedMotion = isReducedMotion;

        if (isReducedMotion) {
            // Reset to original position and unbind events
            this._applyTransform(0, 0, 1);
            this.unbind();
        } else {
            // Re-bind events
            this.bind();
        }
    }

    /**
     * Update method (for AnimationCore compatibility)
     * MagneticButton uses event-driven updates, but provides this for interface compliance
     * 
     * @param {number} deltaTime - Time since last frame
     */
    update(deltaTime) {
        // MagneticButton uses mouse events for updates
        // This method exists for AnimationCore interface compatibility
    }

    /**
     * Get current transform values
     * 
     * @returns {{x: number, y: number, scale: number}} Current transform
     */
    getTransform() {
        return { ...this.currentTransform };
    }

    /**
     * Get magnetic strength setting
     * 
     * @returns {number} Magnetic strength (0-1)
     */
    getStrength() {
        return this.options.strength;
    }

    /**
     * Set magnetic strength
     * 
     * @param {number} strength - New strength value (0-1)
     */
    setStrength(strength) {
        this.options.strength = this._clamp(strength, 0, 1);
    }

    /**
     * Get scale factor setting
     * 
     * @returns {number} Scale factor
     */
    getScale() {
        return this.options.scale;
    }

    /**
     * Set scale factor
     * 
     * @param {number} scale - New scale value
     */
    setScale(scale) {
        this.options.scale = scale;
    }

    /**
     * Check if the button is currently being hovered
     * 
     * @returns {boolean} True if hovering
     */
    isActive() {
        return this.isHovering;
    }

    /**
     * Clamp a value between min and max
     * @private
     * @param {number} value - Value to clamp
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Clamped value
     */
    _clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    /**
     * Reset the button to its original state
     */
    reset() {
        this.isHovering = false;
        this._applyTransform(0, 0, 1);
    }

    /**
     * Cleanup and destroy the magnetic button
     * Removes event listeners and resets styles
     * 
     * Validates: Requirements 8.3
     * Property 19: Animation Cleanup
     * - Remove all event listeners
     * - Clear all animation frames (N/A - event-driven)
     * - Reset all element styles to initial state
     * - Set isInitialized to false
     * - Clear any arrays/maps of elements (N/A)
     */
    destroy() {
        // Unbind all events
        this.unbind();

        // Reset transform
        this.element.style.transform = '';
        
        // Clear transition
        this._clearTransition();

        // Remove GPU acceleration and will-change
        GPUAccelerator.decelerate(this.element);
        GPUAccelerator.clearWillChange(this.element);

        // Reset state
        this.bounds = null;
        this.isHovering = false;
        this.isInitialized = false;
        this.isReducedMotion = false;
        this.currentTransform = { x: 0, y: 0, scale: 1 };
    }
}

// Export for ES modules
export { 
    MagneticButton, 
    DEFAULT_STRENGTH, 
    DEFAULT_SCALE, 
    DEFAULT_TRANSITION_DURATION,
    DEFAULT_EASING 
};

// Also export as default
export default MagneticButton;
