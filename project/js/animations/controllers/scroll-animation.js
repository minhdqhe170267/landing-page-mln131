/**
 * ScrollAnimationController - Enhanced scroll animations
 * Uses Lerp for smooth parallax and IntersectionObserver for reveals
 * 
 * Requirements:
 * - 4.1: Use Lerp for smooth scroll position interpolation
 * - 4.2: Parallax effect with data-parallax attribute
 * - 4.3: IntersectionObserver with multiple thresholds [0, 0.25, 0.5, 0.75, 1]
 * - 4.4: Reveal animations triggered at configurable threshold
 * - 4.5: Support fade-up, scale, rotate, slide-left, slide-right
 * - 4.6: Opacity and transform based on intersection ratio
 * 
 * Properties:
 * - Property 9: lerp(start, end, factor) SHALL return start + (end - start) * factor
 * - Property 10: transform SHALL be translate3d(0, -scrollY * parallaxSpeed, 0)
 * - Property 11: Scroll reveal animations based on intersection ratio
 * 
 * @module animations/controllers/scroll-animation
 */

import { lerp, clamp } from '../utils/lerp.js';
import { GPUAccelerator } from '../core/gpu-accelerator.js';
import { prefersReducedMotion } from '../core/reduced-motion.js';

/**
 * Default configuration for scroll animations
 */
const DEFAULT_CONFIG = {
    // Lerp ease factor for smooth scrolling (Requirement 4.1)
    ease: 0.1,
    
    // Default parallax speed multiplier
    defaultParallaxSpeed: 0.5,
    
    // IntersectionObserver thresholds (Requirement 4.3)
    thresholds: [0, 0.25, 0.5, 0.75, 1],
    
    // Root margin for IntersectionObserver
    rootMargin: '0px',
    
    // Supported reveal types (Requirement 4.5)
    revealTypes: ['fade-up', 'scale', 'rotate', 'slide-left', 'slide-right'],
    
    // Animation durations
    revealDuration: 600,
    
    // Easing for CSS transitions
    revealEasing: 'cubic-bezier(0.4, 0, 0.2, 1)'
};

/**
 * ScrollAnimationController class
 * Manages scroll-triggered animations with smooth parallax and reveal effects
 */
class ScrollAnimationController {
    /**
     * Create a ScrollAnimationController instance
     * @param {Object} options - Configuration options
     * @param {number} [options.ease=0.1] - Lerp ease factor
     * @param {number} [options.defaultParallaxSpeed=0.5] - Default parallax speed
     * @param {number[]} [options.thresholds] - IntersectionObserver thresholds
     * @param {string} [options.rootMargin='0px'] - IntersectionObserver root margin
     */
    constructor(options = {}) {
        /**
         * Current scroll Y position (target)
         * @type {number}
         */
        this.scrollY = 0;
        
        /**
         * Interpolated scroll Y position (current)
         * @type {number}
         */
        this.currentY = 0;
        
        /**
         * Lerp ease factor (Requirement 4.1)
         * @type {number}
         */
        this.ease = options.ease || DEFAULT_CONFIG.ease;
        
        /**
         * Default parallax speed multiplier
         * @type {number}
         */
        this.defaultParallaxSpeed = options.defaultParallaxSpeed || DEFAULT_CONFIG.defaultParallaxSpeed;
        
        /**
         * Array of parallax elements with their configurations
         * @type {Array<{element: HTMLElement, speed: number}>}
         */
        this.parallaxElements = [];
        
        /**
         * IntersectionObserver for reveal animations
         * @type {IntersectionObserver|null}
         */
        this.revealObserver = null;
        
        /**
         * IntersectionObserver thresholds (Requirement 4.3)
         * @type {number[]}
         */
        this.thresholds = options.thresholds || DEFAULT_CONFIG.thresholds;
        
        /**
         * Root margin for IntersectionObserver
         * @type {string}
         */
        this.rootMargin = options.rootMargin || DEFAULT_CONFIG.rootMargin;
        
        /**
         * Map of reveal elements and their configurations
         * @type {Map<HTMLElement, {type: string, revealed: boolean}>}
         */
        this.revealElements = new Map();
        
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
         * Bound scroll handler
         * @type {Function}
         */
        this.boundScrollHandler = this._onScroll.bind(this);
        
        /**
         * Bound resize handler
         * @type {Function}
         */
        this.boundResizeHandler = this._onResize.bind(this);
        
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
    }

    /**
     * Initialize the scroll animation controller
     * Sets up event listeners and IntersectionObserver
     * 
     * @returns {boolean} - True if initialization was successful
     */
    init() {
        if (this.isInitialized) {
            return true;
        }
        
        // Check for reduced motion preference
        this.isReducedMotion = prefersReducedMotion();
        
        // Get initial scroll position
        this.scrollY = window.scrollY || window.pageYOffset || 0;
        this.currentY = this.scrollY;
        
        // Find and setup parallax elements
        this._setupParallaxElements();
        
        // Setup IntersectionObserver for reveal animations
        this._setupRevealObserver();
        
        // Find and observe reveal elements
        this._setupRevealElements();
        
        // Add event listeners with passive option for performance (Requirement 10.5)
        window.addEventListener('scroll', this.boundScrollHandler, { passive: true });
        window.addEventListener('resize', this.boundResizeHandler, { passive: true });
        
        this.isInitialized = true;
        
        // Start animation loop if not reduced motion
        if (!this.isReducedMotion) {
            this.start();
        }
        
        return true;
    }

    /**
     * Linear interpolation function
     * Property 9: lerp(start, end, factor) SHALL return start + (end - start) * factor
     * 
     * @param {number} start - Starting value
     * @param {number} end - Ending value
     * @param {number} factor - Interpolation factor (0-1)
     * @returns {number} - Interpolated value
     * 
     * Validates: Requirements 4.1
     */
    lerp(start, end, factor) {
        return start + (end - start) * factor;
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
        this._animate();
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
     * Animation loop using requestAnimationFrame
     * @private
     */
    _animate() {
        if (!this.isRunning) {
            return;
        }
        
        // Update parallax with lerp
        this.updateParallax();
        
        // Schedule next frame
        this.rafId = requestAnimationFrame(() => this._animate());
    }

    /**
     * Update parallax positions using Lerp for smooth movement
     * Property 10: transform SHALL be translate3d(0, -scrollY * parallaxSpeed, 0)
     * 
     * Validates: Requirements 4.1, 4.2
     */
    updateParallax() {
        // Skip if reduced motion
        if (this.isReducedMotion) {
            return;
        }
        
        // Lerp current position towards target (Requirement 4.1)
        this.currentY = this.lerp(this.currentY, this.scrollY, this.ease);
        
        // Check if we've essentially reached the target (optimization)
        const diff = Math.abs(this.scrollY - this.currentY);
        if (diff < 0.1) {
            this.currentY = this.scrollY;
        }
        
        // Update each parallax element (Requirement 4.2)
        for (const item of this.parallaxElements) {
            const { element, speed } = item;
            
            // Property 10: transform = translate3d(0, -scrollY * parallaxSpeed, 0)
            const translateY = -this.currentY * speed;
            element.style.transform = `translate3d(0, ${translateY}px, 0)`;
        }
    }

    /**
     * Handle reveal intersection
     * Called by IntersectionObserver when elements enter/exit viewport
     * 
     * @param {IntersectionObserverEntry[]} entries - Intersection entries
     * 
     * Validates: Requirements 4.3, 4.4, 4.6
     */
    handleReveal(entries) {
        for (const entry of entries) {
            const element = entry.target;
            const config = this.revealElements.get(element);
            
            if (!config) {
                continue;
            }
            
            const ratio = entry.intersectionRatio;
            const type = config.type;
            
            // Apply reveal animation based on type and ratio (Requirement 4.6)
            this.applyReveal(element, type, ratio);
            
            // Mark as revealed when fully visible
            if (ratio >= 0.75 && !config.revealed) {
                config.revealed = true;
                element.classList.add('revealed');
            }
        }
    }

    /**
     * Apply reveal animation based on type
     * Property 11: Animations based on intersection ratio
     * 
     * @param {HTMLElement} element - The element to animate
     * @param {string} type - Reveal type (fade-up, scale, rotate, slide-left, slide-right)
     * @param {number} ratio - Intersection ratio (0-1)
     * 
     * Validates: Requirements 4.4, 4.5, 4.6
     */
    applyReveal(element, type, ratio) {
        // Skip if reduced motion - show immediately
        if (this.isReducedMotion) {
            element.style.opacity = '1';
            element.style.transform = 'none';
            return;
        }
        
        // Clamp ratio to 0-1
        const r = clamp(ratio, 0, 1);
        
        // Calculate opacity based on ratio (Requirement 4.6)
        const opacity = r;
        
        // Calculate transform based on type (Requirement 4.5)
        let transform = '';
        
        switch (type) {
            case 'fade-up':
                // Property 11: fade-up: opacity = r, translateY = (1-r) * 50px
                const translateY = (1 - r) * 50;
                transform = `translate3d(0, ${translateY}px, 0)`;
                break;
                
            case 'scale':
                // Property 11: scale: opacity = r, scale = 0.8 + r * 0.2
                const scale = 0.8 + r * 0.2;
                transform = `scale3d(${scale}, ${scale}, 1)`;
                break;
                
            case 'rotate':
                // Property 11: rotate: opacity = r, rotate3d = (1-r) * 45deg
                const rotateAngle = (1 - r) * 45;
                transform = `rotate3d(0, 0, 1, ${rotateAngle}deg)`;
                break;
                
            case 'slide-left':
                // Property 11: slide-left: opacity = r, translateX = (1-r) * -100px
                const slideLeftX = (1 - r) * -100;
                transform = `translate3d(${slideLeftX}px, 0, 0)`;
                break;
                
            case 'slide-right':
                // Property 11: slide-right: opacity = r, translateX = (1-r) * 100px
                const slideRightX = (1 - r) * 100;
                transform = `translate3d(${slideRightX}px, 0, 0)`;
                break;
                
            default:
                // Default to fade-up
                const defaultY = (1 - r) * 50;
                transform = `translate3d(0, ${defaultY}px, 0)`;
                break;
        }
        
        // Apply styles using GPU-accelerated properties
        element.style.opacity = opacity.toString();
        element.style.transform = transform;
    }

    /**
     * Handle scroll event
     * @private
     */
    _onScroll() {
        this.scrollY = window.scrollY || window.pageYOffset || 0;
    }

    /**
     * Handle resize event
     * @private
     */
    _onResize() {
        // Re-calculate element positions if needed
        this._updateElementBounds();
    }

    /**
     * Setup parallax elements from DOM
     * Finds elements with data-parallax attribute
     * @private
     * 
     * Validates: Requirements 4.2
     */
    _setupParallaxElements() {
        // Clear existing
        this.parallaxElements = [];
        
        // Find all elements with data-parallax attribute
        const elements = document.querySelectorAll('[data-parallax]');
        
        for (const element of elements) {
            // Get parallax speed from attribute (default to defaultParallaxSpeed)
            const speedAttr = element.getAttribute('data-parallax');
            const speed = speedAttr ? parseFloat(speedAttr) : this.defaultParallaxSpeed;
            
            // Skip invalid speeds
            if (isNaN(speed)) {
                console.warn('ScrollAnimationController: Invalid parallax speed for element', element);
                continue;
            }
            
            // Apply GPU acceleration
            GPUAccelerator.accelerate(element);
            GPUAccelerator.setWillChange(element, 'transform');
            
            // Add to parallax elements array
            this.parallaxElements.push({
                element,
                speed
            });
        }
    }

    /**
     * Setup IntersectionObserver for reveal animations
     * @private
     * 
     * Validates: Requirements 4.3
     */
    _setupRevealObserver() {
        // Check if IntersectionObserver is supported
        if (typeof IntersectionObserver === 'undefined') {
            console.warn('ScrollAnimationController: IntersectionObserver not supported');
            return;
        }
        
        // Create observer with multiple thresholds (Requirement 4.3)
        this.revealObserver = new IntersectionObserver(
            (entries) => this.handleReveal(entries),
            {
                root: null, // viewport
                rootMargin: this.rootMargin,
                threshold: this.thresholds // [0, 0.25, 0.5, 0.75, 1]
            }
        );
    }

    /**
     * Setup reveal elements from DOM
     * Finds elements with data-reveal attribute
     * @private
     * 
     * Validates: Requirements 4.4, 4.5
     */
    _setupRevealElements() {
        if (!this.revealObserver) {
            return;
        }
        
        // Clear existing
        this.revealElements.clear();
        
        // Find all elements with data-reveal attribute
        const elements = document.querySelectorAll('[data-reveal]');
        
        for (const element of elements) {
            // Get reveal type from attribute
            const type = element.getAttribute('data-reveal') || 'fade-up';
            
            // Validate reveal type
            if (!DEFAULT_CONFIG.revealTypes.includes(type)) {
                console.warn(`ScrollAnimationController: Unknown reveal type "${type}", using fade-up`);
            }
            
            // Apply GPU acceleration
            GPUAccelerator.accelerate(element);
            GPUAccelerator.setWillChange(element, ['transform', 'opacity']);
            
            // Set initial state (hidden)
            if (!this.isReducedMotion) {
                element.style.opacity = '0';
                this.applyReveal(element, type, 0);
            }
            
            // Add CSS transition for smooth animation
            element.style.transition = `opacity ${DEFAULT_CONFIG.revealDuration}ms ${DEFAULT_CONFIG.revealEasing}, transform ${DEFAULT_CONFIG.revealDuration}ms ${DEFAULT_CONFIG.revealEasing}`;
            
            // Store configuration
            this.revealElements.set(element, {
                type: DEFAULT_CONFIG.revealTypes.includes(type) ? type : 'fade-up',
                revealed: false
            });
            
            // Start observing
            this.revealObserver.observe(element);
        }
    }

    /**
     * Update element bounds (called on resize)
     * @private
     */
    _updateElementBounds() {
        // Re-setup elements if needed
        // This is a lightweight operation that just updates cached bounds
    }

    /**
     * Add a parallax element programmatically
     * 
     * @param {HTMLElement} element - Element to add parallax effect to
     * @param {number} [speed] - Parallax speed multiplier
     * @returns {boolean} - True if element was added
     */
    addParallaxElement(element, speed = this.defaultParallaxSpeed) {
        if (!element || !(element instanceof HTMLElement)) {
            return false;
        }
        
        // Check if already added
        const exists = this.parallaxElements.some(item => item.element === element);
        if (exists) {
            return false;
        }
        
        // Apply GPU acceleration
        GPUAccelerator.accelerate(element);
        GPUAccelerator.setWillChange(element, 'transform');
        
        // Add to array
        this.parallaxElements.push({ element, speed });
        
        return true;
    }

    /**
     * Remove a parallax element
     * 
     * @param {HTMLElement} element - Element to remove
     * @returns {boolean} - True if element was removed
     */
    removeParallaxElement(element) {
        const index = this.parallaxElements.findIndex(item => item.element === element);
        if (index === -1) {
            return false;
        }
        
        // Clear GPU acceleration
        GPUAccelerator.decelerate(element);
        
        // Remove from array
        this.parallaxElements.splice(index, 1);
        
        return true;
    }

    /**
     * Add a reveal element programmatically
     * 
     * @param {HTMLElement} element - Element to add reveal effect to
     * @param {string} [type='fade-up'] - Reveal type
     * @returns {boolean} - True if element was added
     */
    addRevealElement(element, type = 'fade-up') {
        if (!element || !(element instanceof HTMLElement)) {
            return false;
        }
        
        if (!this.revealObserver) {
            return false;
        }
        
        // Check if already added
        if (this.revealElements.has(element)) {
            return false;
        }
        
        // Validate type
        const validType = DEFAULT_CONFIG.revealTypes.includes(type) ? type : 'fade-up';
        
        // Apply GPU acceleration
        GPUAccelerator.accelerate(element);
        GPUAccelerator.setWillChange(element, ['transform', 'opacity']);
        
        // Set initial state
        if (!this.isReducedMotion) {
            element.style.opacity = '0';
            this.applyReveal(element, validType, 0);
        }
        
        // Add transition
        element.style.transition = `opacity ${DEFAULT_CONFIG.revealDuration}ms ${DEFAULT_CONFIG.revealEasing}, transform ${DEFAULT_CONFIG.revealDuration}ms ${DEFAULT_CONFIG.revealEasing}`;
        
        // Store and observe
        this.revealElements.set(element, { type: validType, revealed: false });
        this.revealObserver.observe(element);
        
        return true;
    }

    /**
     * Remove a reveal element
     * 
     * @param {HTMLElement} element - Element to remove
     * @returns {boolean} - True if element was removed
     */
    removeRevealElement(element) {
        if (!this.revealElements.has(element)) {
            return false;
        }
        
        // Stop observing
        if (this.revealObserver) {
            this.revealObserver.unobserve(element);
        }
        
        // Clear styles
        GPUAccelerator.decelerate(element);
        element.style.opacity = '';
        element.style.transition = '';
        
        // Remove from map
        this.revealElements.delete(element);
        
        return true;
    }

    /**
     * Handle reduced motion preference change
     * 
     * @param {boolean} isReducedMotion - New reduced motion state
     */
    onReducedMotionChange(isReducedMotion) {
        this.isReducedMotion = isReducedMotion;
        
        if (isReducedMotion) {
            // Stop animation loop
            this.stop();
            
            // Show all elements immediately
            for (const [element] of this.revealElements) {
                element.style.opacity = '1';
                element.style.transform = 'none';
                element.style.transition = 'none';
            }
            
            // Reset parallax elements
            for (const item of this.parallaxElements) {
                item.element.style.transform = 'none';
            }
        } else {
            // Restart animation loop
            this.start();
        }
    }

    /**
     * Update method called by AnimationCore
     * 
     * @param {number} deltaTime - Time since last frame in seconds
     * @param {number} timestamp - Current timestamp
     */
    update(deltaTime, timestamp) {
        // This is called by AnimationCore if registered
        // We handle our own RAF loop, but this provides integration point
        if (!this.isReducedMotion) {
            this.updateParallax();
        }
    }

    /**
     * Get current scroll position (lerped)
     * 
     * @returns {number} - Current interpolated scroll position
     */
    getCurrentScrollY() {
        return this.currentY;
    }

    /**
     * Get target scroll position
     * 
     * @returns {number} - Target scroll position
     */
    getTargetScrollY() {
        return this.scrollY;
    }

    /**
     * Get parallax element count
     * 
     * @returns {number} - Number of parallax elements
     */
    getParallaxElementCount() {
        return this.parallaxElements.length;
    }

    /**
     * Get reveal element count
     * 
     * @returns {number} - Number of reveal elements
     */
    getRevealElementCount() {
        return this.revealElements.size;
    }

    /**
     * Cleanup and destroy the controller
     * Removes all event listeners, observers, and resets element styles
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
        
        // Remove event listeners
        window.removeEventListener('scroll', this.boundScrollHandler);
        window.removeEventListener('resize', this.boundResizeHandler);
        
        // Disconnect IntersectionObserver
        if (this.revealObserver) {
            this.revealObserver.disconnect();
            this.revealObserver = null;
        }
        
        // Reset parallax elements
        for (const item of this.parallaxElements) {
            GPUAccelerator.decelerate(item.element);
            item.element.style.transform = '';
            item.element.style.willChange = '';
        }
        this.parallaxElements = [];
        
        // Reset reveal elements
        for (const [element] of this.revealElements) {
            GPUAccelerator.decelerate(element);
            element.style.opacity = '';
            element.style.transform = '';
            element.style.transition = '';
            element.style.willChange = '';
            element.classList.remove('revealed');
        }
        this.revealElements.clear();
        
        // Reset state
        this.scrollY = 0;
        this.currentY = 0;
        this.isInitialized = false;
        this.isRunning = false;
        this.isReducedMotion = false;
        this.rafId = null;
    }
}

// Export for ES modules
export { ScrollAnimationController, DEFAULT_CONFIG };

// Also export as default
export default ScrollAnimationController;
