/**
 * TimelineAnimationController - Timeline page animations
 * Handles SVG progress line and node animations with cinematic effects
 * 
 * Requirements:
 * - 5.1: SVG progress line that fills as user scrolls
 * - 5.2: stroke-dashoffset animation based on scroll progress
 * - 5.3: Pulsing nodes with ripple effect animation
 * - 5.4: 3D transforms for timeline items with rotateY and scale
 * - 5.5: Alternating rotateY for even/odd items
 * - 5.6: 'fully-visible' class when progress > 0.8
 * 
 * Properties:
 * - Property 12: stroke-dashoffset SHALL be pathLength - (pathLength * p)
 * - Property 13: Timeline items animation based on progress
 * 
 * @module animations/controllers/timeline-animation
 */

import { lerp, clamp } from '../utils/lerp.js';
import { GPUAccelerator } from '../core/gpu-accelerator.js';
import { prefersReducedMotion } from '../core/reduced-motion.js';

/**
 * Default configuration for timeline animations
 */
const DEFAULT_CONFIG = {
    // Selectors for finding elements
    selectors: {
        container: '.timeline',
        line: '.timeline__line',
        items: '.timeline__item',
        nodes: '.timeline__dot',
        content: '.timeline__content'
    },
    
    // Animation settings
    animation: {
        // Lerp ease factor for smooth progress
        ease: 0.1,
        
        // 3D transform settings (Requirement 5.4, 5.5)
        rotateYAngle: 15, // degrees for rotateY
        scaleMin: 0.85,   // minimum scale when not visible
        scaleMax: 1,      // maximum scale when fully visible
        
        // Threshold for 'fully-visible' class (Requirement 5.6)
        fullyVisibleThreshold: 0.8,
        
        // Node ripple settings (Requirement 5.3)
        rippleDuration: 600,
        rippleScale: 2.5,
        
        // Stagger delay between items
        staggerDelay: 100
    },
    
    // SVG progress line settings (Requirement 5.1, 5.2)
    progressLine: {
        strokeWidth: 4,
        strokeColor: 'url(#timeline-gradient)',
        backgroundColor: 'rgba(255, 255, 255, 0.1)'
    }
};

/**
 * TimelineAnimationController class
 * Manages timeline page animations including SVG progress line and node animations
 */
class TimelineAnimationController {
    /**
     * Create a TimelineAnimationController instance
     * @param {HTMLElement} container - The timeline container element
     * @param {Object} [options] - Configuration options
     */
    constructor(container, options = {}) {
        /**
         * Timeline container element
         * @type {HTMLElement}
         */
        this.container = container;
        
        /**
         * SVG path element for progress line
         * @type {SVGPathElement|null}
         */
        this.path = null;
        
        /**
         * Total length of the SVG path
         * @type {number}
         */
        this.pathLength = 0;
        
        /**
         * Array of timeline node elements
         * @type {HTMLElement[]}
         */
        this.nodes = [];
        
        /**
         * Array of timeline item configurations
         * @type {Array<{element: HTMLElement, node: HTMLElement, index: number, isLeft: boolean, isVisible: boolean, progress: number}>}
         */
        this.items = [];
        
        /**
         * Configuration options (merged with defaults)
         * @type {Object}
         */
        this.config = this._mergeConfig(DEFAULT_CONFIG, options);
        
        /**
         * Current scroll progress (0-1)
         * @type {number}
         */
        this.scrollProgress = 0;
        
        /**
         * Target scroll progress for lerp
         * @type {number}
         */
        this.targetProgress = 0;
        
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
         * SVG element for progress line
         * @type {SVGSVGElement|null}
         */
        this.svg = null;
        
        /**
         * IntersectionObserver for items
         * @type {IntersectionObserver|null}
         */
        this.observer = null;
        
        /**
         * Bound event handlers
         * @type {Object}
         */
        this.boundHandlers = {
            onScroll: this._onScroll.bind(this),
            onResize: this._onResize.bind(this)
        };
        
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
         * Container bounds for calculations
         * @type {DOMRect|null}
         */
        this.containerBounds = null;
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
     * Initialize the timeline animation controller
     * Sets up SVG progress line, nodes, and event listeners
     * 
     * @returns {boolean} - True if initialization was successful
     * 
     * Validates: Requirements 5.1, 5.2, 5.3
     */
    init() {
        if (this.isInitialized) {
            return true;
        }
        
        if (!this.container) {
            console.warn('TimelineAnimationController: No container provided');
            return false;
        }
        
        // Check for reduced motion preference
        this.isReducedMotion = prefersReducedMotion();
        
        // Get container bounds
        this.containerBounds = this.container.getBoundingClientRect();
        
        // Setup SVG progress line (Requirement 5.1)
        this._setupProgressLine();
        
        // Setup timeline items and nodes
        this._setupItems();
        
        // Setup IntersectionObserver for items
        this._setupObserver();
        
        // Bind event listeners
        window.addEventListener('scroll', this.boundHandlers.onScroll, { passive: true });
        window.addEventListener('resize', this.boundHandlers.onResize, { passive: true });
        
        this.isInitialized = true;
        
        // Start animation loop if not reduced motion
        if (!this.isReducedMotion) {
            this.start();
        } else {
            // Show all items immediately for reduced motion
            this._showAllItemsImmediately();
        }
        
        // Initial update
        this._onScroll();
        
        return true;
    }

    /**
     * Setup SVG progress line
     * Creates an SVG element with a path that follows the timeline
     * @private
     * 
     * Validates: Requirements 5.1, 5.2
     */
    _setupProgressLine() {
        // Find existing timeline line element
        const lineElement = this.container.querySelector(this.config.selectors.line);
        
        if (!lineElement) {
            console.warn('TimelineAnimationController: No timeline line element found');
            return;
        }
        
        // Get line dimensions
        const lineRect = lineElement.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();
        
        // Calculate line position relative to container
        const lineX = lineRect.left - containerRect.left + lineRect.width / 2;
        const lineTop = lineRect.top - containerRect.top;
        const lineHeight = lineRect.height;
        
        // Create SVG element
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('class', 'timeline-progress-svg');
        this.svg.setAttribute('width', '100%');
        this.svg.setAttribute('height', '100%');
        this.svg.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
        `;
        
        // Create gradient definition
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        gradient.setAttribute('id', 'timeline-gradient');
        gradient.setAttribute('x1', '0%');
        gradient.setAttribute('y1', '0%');
        gradient.setAttribute('x2', '0%');
        gradient.setAttribute('y2', '100%');
        
        const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop1.setAttribute('offset', '0%');
        stop1.setAttribute('stop-color', '#667eea');
        
        const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop2.setAttribute('offset', '50%');
        stop2.setAttribute('stop-color', '#764ba2');
        
        const stop3 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop3.setAttribute('offset', '100%');
        stop3.setAttribute('stop-color', '#f093fb');
        
        gradient.appendChild(stop1);
        gradient.appendChild(stop2);
        gradient.appendChild(stop3);
        defs.appendChild(gradient);
        this.svg.appendChild(defs);
        
        // Create path element for progress line
        this.path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        
        // Create a simple vertical line path
        const pathD = `M ${lineX} ${lineTop} L ${lineX} ${lineTop + lineHeight}`;
        this.path.setAttribute('d', pathD);
        this.path.setAttribute('stroke', this.config.progressLine.strokeColor);
        this.path.setAttribute('stroke-width', this.config.progressLine.strokeWidth.toString());
        this.path.setAttribute('fill', 'none');
        this.path.setAttribute('stroke-linecap', 'round');
        
        // Get path length for stroke-dasharray animation
        this.svg.appendChild(this.path);
        
        // Ensure container has relative positioning
        const containerStyle = window.getComputedStyle(this.container);
        if (containerStyle.position === 'static') {
            this.container.style.position = 'relative';
        }
        
        // Insert SVG into container
        this.container.insertBefore(this.svg, this.container.firstChild);
        
        // Get path length after adding to DOM
        this.pathLength = this.path.getTotalLength();
        
        // Set initial stroke-dasharray and stroke-dashoffset (Requirement 5.2)
        this.path.style.strokeDasharray = `${this.pathLength}`;
        this.path.style.strokeDashoffset = `${this.pathLength}`;
        
        // Apply GPU acceleration
        GPUAccelerator.setWillChange(this.path, 'stroke-dashoffset');
    }

    /**
     * Setup timeline items and nodes
     * @private
     * 
     * Validates: Requirements 5.3, 5.4, 5.5
     */
    _setupItems() {
        // Find all timeline items
        const itemElements = this.container.querySelectorAll(this.config.selectors.items);
        
        this.items = [];
        this.nodes = [];
        
        itemElements.forEach((element, index) => {
            // Find the node (dot) for this item
            const node = element.querySelector(this.config.selectors.nodes);
            
            // Determine if item is on left or right (for alternating rotateY)
            const isLeft = element.classList.contains('timeline__item--left');
            
            // Apply GPU acceleration to item
            GPUAccelerator.accelerate(element);
            GPUAccelerator.setWillChange(element, ['transform', 'opacity']);
            
            // Store item configuration
            this.items.push({
                element,
                node,
                index,
                isLeft,
                isVisible: false,
                progress: 0
            });
            
            if (node) {
                this.nodes.push(node);
                
                // Apply GPU acceleration to node
                GPUAccelerator.accelerate(node);
            }
            
            // Set initial state (hidden with 3D transform)
            if (!this.isReducedMotion) {
                this._setItemInitialState(element, isLeft);
            }
        });
    }

    /**
     * Set initial state for a timeline item
     * @private
     * @param {HTMLElement} element - The item element
     * @param {boolean} isLeft - Whether the item is on the left side
     */
    _setItemInitialState(element, isLeft) {
        const { rotateYAngle, scaleMin } = this.config.animation;
        
        // Property 13: Even index (right) has negative rotateY, odd index (left) has positive
        // Note: isLeft corresponds to odd items in the alternating layout
        const rotateY = isLeft ? rotateYAngle : -rotateYAngle;
        
        element.style.opacity = '0';
        element.style.transform = `perspective(1000px) rotateY(${rotateY}deg) scale(${scaleMin})`;
    }

    /**
     * Setup IntersectionObserver for timeline items
     * @private
     */
    _setupObserver() {
        if (typeof IntersectionObserver === 'undefined') {
            console.warn('TimelineAnimationController: IntersectionObserver not supported');
            return;
        }
        
        this.observer = new IntersectionObserver(
            (entries) => this._handleIntersection(entries),
            {
                root: null,
                rootMargin: '0px',
                threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]
            }
        );
        
        // Observe all items
        for (const item of this.items) {
            this.observer.observe(item.element);
        }
    }

    /**
     * Handle intersection observer entries
     * @private
     * @param {IntersectionObserverEntry[]} entries
     */
    _handleIntersection(entries) {
        for (const entry of entries) {
            const item = this.items.find(i => i.element === entry.target);
            if (item) {
                item.isVisible = entry.isIntersecting;
                item.progress = entry.intersectionRatio;
            }
        }
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
     * Animation loop
     * @private
     */
    _animate() {
        if (!this.isRunning) {
            return;
        }
        
        this.update();
        
        this.rafId = requestAnimationFrame(() => this._animate());
    }

    /**
     * Update timeline animations on scroll
     * Called by animation loop or AnimationCore
     * 
     * @param {number} [deltaTime] - Time since last frame
     * @param {number} [timestamp] - Current timestamp
     */
    update(deltaTime, timestamp) {
        if (this.isReducedMotion) {
            return;
        }
        
        // Lerp scroll progress for smooth animation
        this.scrollProgress = lerp(
            this.scrollProgress,
            this.targetProgress,
            this.config.animation.ease
        );
        
        // Animate progress line
        this.animateProgressLine(this.scrollProgress);
        
        // Animate timeline items
        this.animateItems(this.scrollProgress);
    }

    /**
     * Animate the SVG progress line based on scroll progress
     * Property 12: stroke-dashoffset SHALL be pathLength - (pathLength * p)
     * 
     * @param {number} progress - Scroll progress (0-1)
     * 
     * Validates: Requirements 5.1, 5.2
     */
    animateProgressLine(progress) {
        if (!this.path || this.pathLength === 0) {
            return;
        }
        
        // Clamp progress to 0-1
        const p = clamp(progress, 0, 1);
        
        // Property 12: stroke-dashoffset = pathLength - (pathLength * p)
        const dashOffset = this.pathLength - (this.pathLength * p);
        
        this.path.style.strokeDashoffset = `${dashOffset}`;
    }

    /**
     * Animate timeline items based on their individual progress
     * Property 13: opacity = p, rotateY based on even/odd, 'fully-visible' when p > 0.8
     * 
     * @param {number} scrollProgress - Overall scroll progress (0-1)
     * 
     * Validates: Requirements 5.4, 5.5, 5.6
     */
    animateItems(scrollProgress) {
        const { rotateYAngle, scaleMin, scaleMax, fullyVisibleThreshold } = this.config.animation;
        
        for (const item of this.items) {
            const { element, node, isLeft, progress: p } = item;
            
            // Clamp progress
            const progress = clamp(p, 0, 1);
            
            // Property 13: opacity = p
            const opacity = progress;
            
            // Property 13: rotateY based on even/odd index
            // Even index (right side, !isLeft) has negative angle
            // Odd index (left side, isLeft) has positive angle
            const baseRotateY = isLeft ? rotateYAngle : -rotateYAngle;
            const rotateY = baseRotateY * (1 - progress);
            
            // Scale from scaleMin to scaleMax based on progress
            const scale = scaleMin + (scaleMax - scaleMin) * progress;
            
            // Apply transform using GPU-accelerated properties
            element.style.opacity = `${opacity}`;
            element.style.transform = `perspective(1000px) rotateY(${rotateY}deg) scale(${scale})`;
            
            // Property 13: 'fully-visible' class when p > 0.8 (Requirement 5.6)
            if (progress > fullyVisibleThreshold) {
                if (!element.classList.contains('fully-visible')) {
                    element.classList.add('fully-visible');
                    
                    // Activate node with ripple effect when item becomes fully visible
                    if (node) {
                        this.activateNode(node);
                    }
                }
            } else {
                element.classList.remove('fully-visible');
            }
        }
    }

    /**
     * Activate a timeline node with ripple effect
     * Creates a pulsing ripple animation on the node
     * 
     * @param {HTMLElement} node - The node element to activate
     * 
     * Validates: Requirements 5.3
     */
    activateNode(node) {
        if (!node || this.isReducedMotion) {
            return;
        }
        
        // Check if node already has active ripple
        if (node.classList.contains('node-active')) {
            return;
        }
        
        // Add active class
        node.classList.add('node-active');
        
        // Create ripple element
        const ripple = document.createElement('span');
        ripple.className = 'timeline-node-ripple';
        
        // Style the ripple
        const { rippleDuration, rippleScale } = this.config.animation;
        ripple.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: rgba(102, 126, 234, 0.4);
            transform: translate(-50%, -50%) scale(0);
            animation: nodeRipple ${rippleDuration}ms ease-out forwards;
            pointer-events: none;
        `;
        
        // Ensure node has relative positioning
        const nodeStyle = window.getComputedStyle(node);
        if (nodeStyle.position === 'static') {
            node.style.position = 'relative';
        }
        
        // Add ripple to node
        node.appendChild(ripple);
        
        // Remove ripple after animation
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, rippleDuration);
        
        // Add pulse-glow effect (Requirement 5.4)
        node.style.boxShadow = '0 0 20px rgba(102, 126, 234, 0.6), 0 0 40px rgba(102, 126, 234, 0.3)';
    }

    /**
     * Handle scroll event
     * @private
     */
    _onScroll() {
        // Calculate scroll progress based on container position
        const scrollY = window.scrollY || window.pageYOffset;
        const windowHeight = window.innerHeight;
        
        // Update container bounds
        this.containerBounds = this.container.getBoundingClientRect();
        
        // Calculate progress based on how much of the timeline is scrolled through
        const containerTop = this.containerBounds.top + scrollY;
        const containerHeight = this.containerBounds.height;
        
        // Start progress when container enters viewport
        // End progress when container bottom reaches viewport top
        const scrollStart = containerTop - windowHeight;
        const scrollEnd = containerTop + containerHeight;
        const scrollRange = scrollEnd - scrollStart;
        
        // Calculate target progress
        this.targetProgress = clamp((scrollY - scrollStart) / scrollRange, 0, 1);
    }

    /**
     * Handle resize event
     * @private
     */
    _onResize() {
        // Update container bounds
        this.containerBounds = this.container.getBoundingClientRect();
        
        // Rebuild SVG progress line
        if (this.svg) {
            this.svg.remove();
            this._setupProgressLine();
        }
        
        // Recalculate scroll progress
        this._onScroll();
    }

    /**
     * Show all items immediately (for reduced motion)
     * @private
     */
    _showAllItemsImmediately() {
        for (const item of this.items) {
            item.element.style.opacity = '1';
            item.element.style.transform = 'none';
            item.element.classList.add('fully-visible');
        }
        
        // Show full progress line
        if (this.path) {
            this.path.style.strokeDashoffset = '0';
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
            this._showAllItemsImmediately();
        } else {
            // Reset items to initial state and restart
            for (const item of this.items) {
                this._setItemInitialState(item.element, item.isLeft);
                item.element.classList.remove('fully-visible');
            }
            
            // Reset progress line
            if (this.path) {
                this.path.style.strokeDashoffset = `${this.pathLength}`;
            }
            
            this.scrollProgress = 0;
            this.targetProgress = 0;
            this._onScroll();
            this.start();
        }
    }

    /**
     * Get current scroll progress
     * @returns {number} - Current scroll progress (0-1)
     */
    getScrollProgress() {
        return this.scrollProgress;
    }

    /**
     * Get path length
     * @returns {number} - Total path length
     */
    getPathLength() {
        return this.pathLength;
    }

    /**
     * Get current stroke-dashoffset
     * @returns {number} - Current stroke-dashoffset value
     */
    getStrokeDashoffset() {
        if (!this.path) {
            return 0;
        }
        return parseFloat(this.path.style.strokeDashoffset) || 0;
    }

    /**
     * Get timeline items
     * @returns {Array} - Array of timeline item configurations
     */
    getItems() {
        return this.items;
    }

    /**
     * Get timeline nodes
     * @returns {HTMLElement[]} - Array of node elements
     */
    getNodes() {
        return this.nodes;
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
     * Cleanup and destroy the controller
     * Removes event listeners, observers, and resets element styles
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
        window.removeEventListener('scroll', this.boundHandlers.onScroll);
        window.removeEventListener('resize', this.boundHandlers.onResize);
        
        // Disconnect IntersectionObserver
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        
        // Remove SVG element
        if (this.svg && this.svg.parentNode) {
            this.svg.parentNode.removeChild(this.svg);
        }
        this.svg = null;
        this.path = null;
        this.pathLength = 0;
        
        // Reset timeline items
        for (const item of this.items) {
            GPUAccelerator.decelerate(item.element);
            item.element.style.opacity = '';
            item.element.style.transform = '';
            item.element.style.willChange = '';
            item.element.classList.remove('fully-visible');
            
            // Remove any ripple elements from nodes
            if (item.node) {
                GPUAccelerator.decelerate(item.node);
                item.node.classList.remove('node-active');
                item.node.style.boxShadow = '';
                item.node.style.position = '';
                
                const ripples = item.node.querySelectorAll('.timeline-node-ripple');
                ripples.forEach(ripple => ripple.remove());
            }
        }
        
        // Clear arrays
        this.items = [];
        this.nodes = [];
        
        // Reset state
        this.scrollProgress = 0;
        this.targetProgress = 0;
        this.isInitialized = false;
        this.isRunning = false;
        this.isReducedMotion = false;
        this.containerBounds = null;
        this.rafId = null;
    }
}

// Export for ES modules
export { TimelineAnimationController, DEFAULT_CONFIG };

// Also export as default
export default TimelineAnimationController;
