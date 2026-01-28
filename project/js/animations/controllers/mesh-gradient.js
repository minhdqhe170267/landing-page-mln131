/**
 * MeshGradient - Animated mesh gradient using Canvas
 * Creates smooth, flowing gradient background with bouncing color points
 * 
 * Requirements:
 * - 2.1: Display animated mesh gradient background using canvas
 * - 2.2: Have at least 4 color points moving with random velocity
 * - 2.3: Bounce points when they hit canvas edges (negate velocity)
 * - 8.5: Use { alpha: false } context option for performance
 * 
 * Design Interface:
 * - initPoints(count): Initialize gradient points
 * - update(): Update point positions (called by AnimationCore)
 * - render(): Render gradient to canvas
 * - resize(): Handle canvas resize
 * 
 * @module animations/controllers/mesh-gradient
 */

/**
 * Default colors for the mesh gradient
 * Based on design document specifications
 */
const DEFAULT_COLORS = [
    { r: 102, g: 126, b: 234 },  // Primary blue
    { r: 118, g: 75, b: 162 },   // Purple
    { r: 240, g: 147, b: 251 },  // Pink
    { r: 250, g: 112, b: 154 }   // Coral
];

/**
 * Minimum number of gradient points required
 * Validates: Requirements 2.2
 */
const MIN_POINT_COUNT = 4;

/**
 * GradientPoint class representing a single color point in the mesh
 */
class GradientPoint {
    /**
     * Create a gradient point
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} vx - X velocity
     * @param {number} vy - Y velocity
     * @param {number} radius - Point radius for gradient
     * @param {{r: number, g: number, b: number}} color - RGB color
     */
    constructor(x, y, vx, vy, radius, color) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = radius;
        this.color = color;
    }
}

/**
 * MeshGradient class
 * Canvas-based animated gradient with bouncing color points
 */
class MeshGradient {
    /**
     * Create a MeshGradient instance
     * @param {HTMLCanvasElement} canvas - The canvas element to render to
     * @param {Object} [options] - Configuration options
     * @param {Array<{r: number, g: number, b: number}>} [options.colors] - Array of RGB colors
     * @param {number} [options.pointCount] - Number of gradient points (minimum 4)
     * @param {number} [options.speed] - Movement speed multiplier
     * @param {number} [options.minRadius] - Minimum point radius
     * @param {number} [options.maxRadius] - Maximum point radius
     */
    constructor(canvas, options = {}) {
        if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
            throw new Error('MeshGradient: Valid canvas element is required');
        }

        /**
         * Canvas element
         * @type {HTMLCanvasElement}
         */
        this.canvas = canvas;

        /**
         * Canvas 2D rendering context
         * Using { alpha: false } for performance optimization
         * Validates: Requirements 8.5
         * @type {CanvasRenderingContext2D}
         */
        this.ctx = canvas.getContext('2d', { alpha: false });

        /**
         * Array of gradient points
         * @type {GradientPoint[]}
         */
        this.points = [];

        /**
         * Colors for gradient points
         * @type {Array<{r: number, g: number, b: number}>}
         */
        this.colors = options.colors || [...DEFAULT_COLORS];

        /**
         * Movement speed multiplier
         * @type {number}
         */
        this.speed = options.speed || 1;

        /**
         * Minimum point radius
         * @type {number}
         */
        this.minRadius = options.minRadius || 200;

        /**
         * Maximum point radius
         * @type {number}
         */
        this.maxRadius = options.maxRadius || 400;

        /**
         * Number of points to create
         * @type {number}
         */
        this.pointCount = Math.max(options.pointCount || MIN_POINT_COUNT, MIN_POINT_COUNT);

        /**
         * Whether the gradient has been initialized
         * @type {boolean}
         */
        this.isInitialized = false;

        /**
         * Background color for the canvas
         * @type {string}
         */
        this.backgroundColor = options.backgroundColor || '#1a1a2e';

        /**
         * Whether this controller supports reduced motion
         * When reduced motion is enabled, the gradient will be static
         * @type {boolean}
         */
        this.supportsReducedMotion = true;

        /**
         * Whether reduced motion is currently enabled
         * @type {boolean}
         */
        this.isReducedMotion = false;
    }

    /**
     * Initialize the mesh gradient
     * Sets up canvas size and creates gradient points
     */
    init() {
        this.resize();
        this.initPoints(this.pointCount);
        this.isInitialized = true;
        
        // Initial render
        this.render();
    }

    /**
     * Initialize gradient points with random positions and velocities
     * Ensures at least MIN_POINT_COUNT (4) points are created
     * 
     * @param {number} [count=5] - Number of points to create
     * 
     * Validates: Requirements 2.2
     */
    initPoints(count = 5) {
        // Ensure minimum point count
        const pointCount = Math.max(count, MIN_POINT_COUNT);
        
        this.points = [];
        
        const width = this.canvas.width;
        const height = this.canvas.height;

        for (let i = 0; i < pointCount; i++) {
            // Random position within canvas
            const x = Math.random() * width;
            const y = Math.random() * height;
            
            // Random velocity (can be negative for direction)
            // Speed range: -2 to 2, multiplied by speed option
            const vx = (Math.random() * 4 - 2) * this.speed;
            const vy = (Math.random() * 4 - 2) * this.speed;
            
            // Random radius within bounds
            const radius = this.minRadius + Math.random() * (this.maxRadius - this.minRadius);
            
            // Cycle through colors
            const color = this.colors[i % this.colors.length];
            
            this.points.push(new GradientPoint(x, y, vx, vy, radius, color));
        }
    }

    /**
     * Update point positions with bounce physics
     * Called by AnimationCore on each frame
     * 
     * @param {number} [deltaTime] - Time since last frame in seconds (optional)
     * 
     * Validates: Requirements 2.3
     */
    update(deltaTime) {
        // Skip update if reduced motion is enabled
        if (this.isReducedMotion) {
            return;
        }

        const width = this.canvas.width;
        const height = this.canvas.height;

        for (const point of this.points) {
            this.updatePoint(point, width, height);
        }

        // Render after updating positions
        this.render();
    }

    /**
     * Update a single point's position with bounce physics
     * When point hits edge, velocity is negated (bounced)
     * 
     * @param {GradientPoint} point - The point to update
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     * 
     * Validates: Requirements 2.3
     */
    updatePoint(point, width, height) {
        // Update position based on velocity
        point.x += point.vx;
        point.y += point.vy;

        // Bounce off left edge (x <= 0)
        if (point.x <= 0) {
            point.x = 0;
            point.vx = -point.vx; // Negate velocity
        }
        
        // Bounce off right edge (x >= width)
        if (point.x >= width) {
            point.x = width;
            point.vx = -point.vx; // Negate velocity
        }

        // Bounce off top edge (y <= 0)
        if (point.y <= 0) {
            point.y = 0;
            point.vy = -point.vy; // Negate velocity
        }
        
        // Bounce off bottom edge (y >= height)
        if (point.y >= height) {
            point.y = height;
            point.vy = -point.vy; // Negate velocity
        }
    }

    /**
     * Render the mesh gradient to canvas
     * Uses radial gradients for each point blended together
     */
    render() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Clear canvas with background color
        ctx.fillStyle = this.backgroundColor;
        ctx.fillRect(0, 0, width, height);

        // Set composite operation for blending
        ctx.globalCompositeOperation = 'lighter';

        // Draw each gradient point
        for (const point of this.points) {
            this.renderPoint(point);
        }

        // Reset composite operation
        ctx.globalCompositeOperation = 'source-over';
    }

    /**
     * Render a single gradient point
     * Creates a radial gradient from the point's position
     * 
     * @param {GradientPoint} point - The point to render
     */
    renderPoint(point) {
        const ctx = this.ctx;
        const { x, y, radius, color } = point;

        // Create radial gradient
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        
        // Add color stops with transparency for smooth blending
        gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, 0.8)`);
        gradient.addColorStop(0.5, `rgba(${color.r}, ${color.g}, ${color.b}, 0.4)`);
        gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);

        // Draw the gradient circle
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Handle canvas resize
     * Updates canvas dimensions to match container/viewport
     * 
     * Validates: Requirements 10.4
     */
    resize() {
        // Get the parent element or use window dimensions
        const parent = this.canvas.parentElement;
        
        if (parent) {
            this.canvas.width = parent.clientWidth || window.innerWidth;
            this.canvas.height = parent.clientHeight || window.innerHeight;
        } else {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }

        // Re-render after resize
        if (this.isInitialized) {
            this.render();
        }
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
        
        // Render static gradient when reduced motion is enabled
        if (isReducedMotion) {
            this.render();
        }
    }

    /**
     * Get the current number of gradient points
     * 
     * @returns {number} Number of points
     */
    getPointCount() {
        return this.points.length;
    }

    /**
     * Get all gradient points
     * 
     * @returns {GradientPoint[]} Array of gradient points
     */
    getPoints() {
        return this.points;
    }

    /**
     * Set new colors for the gradient
     * 
     * @param {Array<{r: number, g: number, b: number}>} colors - New colors
     */
    setColors(colors) {
        if (Array.isArray(colors) && colors.length > 0) {
            this.colors = colors;
            
            // Update existing points with new colors
            for (let i = 0; i < this.points.length; i++) {
                this.points[i].color = this.colors[i % this.colors.length];
            }
            
            this.render();
        }
    }

    /**
     * Set movement speed
     * 
     * @param {number} speed - New speed multiplier
     */
    setSpeed(speed) {
        const ratio = speed / this.speed;
        this.speed = speed;
        
        // Adjust existing velocities
        for (const point of this.points) {
            point.vx *= ratio;
            point.vy *= ratio;
        }
    }

    /**
     * Pause the animation (alias for reduced motion)
     */
    pause() {
        this.isReducedMotion = true;
    }

    /**
     * Resume the animation
     */
    resume() {
        this.isReducedMotion = false;
    }

    /**
     * Cleanup and destroy the mesh gradient
     * Clears canvas, resets state, and releases resources
     * 
     * Validates: Requirements 8.3
     * Property 19: Animation Cleanup
     * - Remove all event listeners (N/A - no event listeners)
     * - Clear all animation frames (N/A - uses AnimationCore RAF)
     * - Reset all element styles to initial state
     * - Set isInitialized to false
     * - Clear any arrays/maps of elements
     */
    destroy() {
        // Clear the canvas
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            // Reset composite operation to default
            this.ctx.globalCompositeOperation = 'source-over';
        }

        // Clear points array
        this.points = [];

        // Reset canvas dimensions to release memory
        if (this.canvas) {
            this.canvas.width = 0;
            this.canvas.height = 0;
        }

        // Nullify context reference
        this.ctx = null;

        // Reset state
        this.isInitialized = false;
        this.isReducedMotion = false;
    }
}

// Export for ES modules
export { MeshGradient, GradientPoint, DEFAULT_COLORS, MIN_POINT_COUNT };

// Also export as default
export default MeshGradient;
