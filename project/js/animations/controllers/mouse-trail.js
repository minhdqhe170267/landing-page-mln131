/**
 * MouseTrailController - Mouse trail with particles
 * Creates colorful particle trail following cursor with hue rotation
 * 
 * Requirements:
 * - 7.1: Create mouse trail with particles when user moves mouse
 * - 7.2: Maximum 30 particles with hue rotation
 * - 7.3: Animate particles with life decay and velocity
 * - 7.4: Remove particle from DOM when life <= 0
 * - 9.4: Do not operate when reduced motion is enabled
 * 
 * Design Interface:
 * - bind(): Bind mouse events
 * - addParticle(x, y): Add particle at position
 * - update(): Update particles (called by AnimationCore)
 * - destroy(): Cleanup
 * 
 * Property 18: Mouse Trail Lifecycle
 * - Adding a particle when count >= maxParticles SHALL remove the oldest particle first
 * - Each update SHALL decrease particle.life by decay amount
 * - Particles with life <= 0 SHALL be removed from DOM and particles array
 * 
 * @module animations/controllers/mouse-trail
 */

import { GPUAccelerator } from '../core/gpu-accelerator.js';
import { randomRange, constrain } from '../utils/vector.js';

/**
 * Default maximum number of trail particles
 * Validates: Requirements 7.2
 */
const DEFAULT_MAX_PARTICLES = 30;

/**
 * Default particle life decay rate per update
 * Validates: Requirements 7.3
 */
const DEFAULT_DECAY = 0.02;

/**
 * Default minimum particle size in pixels
 */
const DEFAULT_MIN_SIZE = 5;

/**
 * Default maximum particle size in pixels
 */
const DEFAULT_MAX_SIZE = 15;

/**
 * Hue rotation increment per particle
 * Validates: Requirements 7.2
 */
const HUE_INCREMENT = 10;

/**
 * TrailParticle class representing a single trail particle
 */
class TrailParticle {
    /**
     * Create a trail particle
     * @param {HTMLElement} element - DOM element for the particle
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} size - Particle size in pixels
     * @param {number} hue - HSL hue value (0-360)
     * @param {number} life - Initial life value (0-1)
     */
    constructor(element, x, y, size, hue, life = 1) {
        /**
         * DOM element for the particle
         * @type {HTMLElement}
         */
        this.element = element;

        /**
         * X position
         * @type {number}
         */
        this.x = x;

        /**
         * Y position
         * @type {number}
         */
        this.y = y;

        /**
         * Particle size in pixels
         * @type {number}
         */
        this.size = size;

        /**
         * HSL hue value (0-360)
         * @type {number}
         */
        this.hue = hue;

        /**
         * Current life value (0-1), decreases over time
         * Validates: Requirements 7.3
         * @type {number}
         */
        this.life = life;

        /**
         * Velocity X (slight random drift)
         * @type {number}
         */
        this.vx = randomRange(-0.5, 0.5);

        /**
         * Velocity Y (slight upward drift)
         * @type {number}
         */
        this.vy = randomRange(-1, -0.5);
    }
}

/**
 * MouseTrailController class
 * Creates colorful particle trail following cursor
 */
class MouseTrailController {
    /**
     * Create a MouseTrailController instance
     * @param {Object} [options] - Configuration options
     * @param {number} [options.maxParticles=30] - Maximum number of trail particles
     * @param {number} [options.minSize=5] - Minimum particle size in pixels
     * @param {number} [options.maxSize=15] - Maximum particle size in pixels
     * @param {number} [options.decay=0.02] - Life decay rate per update
     */
    constructor(options = {}) {
        /**
         * Array of trail particles
         * @type {TrailParticle[]}
         */
        this.particles = [];

        /**
         * Current hue value for color rotation
         * Validates: Requirements 7.2
         * @type {number}
         */
        this.hue = 0;

        /**
         * Configuration options
         * @type {Object}
         */
        this.options = {
            maxParticles: options.maxParticles || DEFAULT_MAX_PARTICLES,
            minSize: options.minSize || DEFAULT_MIN_SIZE,
            maxSize: options.maxSize || DEFAULT_MAX_SIZE,
            decay: options.decay || DEFAULT_DECAY
        };

        /**
         * Whether the controller has been initialized
         * @type {boolean}
         */
        this.isInitialized = false;

        /**
         * Whether reduced motion is enabled
         * Validates: Requirements 9.4
         * @type {boolean}
         */
        this.isReducedMotion = false;

        /**
         * Whether this controller supports reduced motion
         * @type {boolean}
         */
        this.supportsReducedMotion = false;

        /**
         * Container element for particles
         * @type {HTMLElement|null}
         */
        this.container = null;

        /**
         * Bound event handlers
         * @type {Object}
         */
        this.boundHandlers = {
            onMouseMove: this._handleMouseMove.bind(this)
        };

        /**
         * Last mouse position for throttling
         * @type {{x: number, y: number}}
         */
        this.lastMousePos = { x: 0, y: 0 };

        /**
         * Minimum distance between particles
         * @type {number}
         */
        this.minDistance = 5;
    }

    /**
     * Bind mouse events and initialize the controller
     * Creates container element and starts listening for mouse movement
     * 
     * Validates: Requirements 7.1, 9.4
     */
    bind() {
        // Don't initialize if reduced motion is enabled
        if (this.isReducedMotion) {
            console.log('MouseTrailController: Reduced motion enabled, skipping initialization');
            return;
        }

        // Create container for trail particles
        this._createContainer();

        // Bind mouse move event
        document.addEventListener('mousemove', this.boundHandlers.onMouseMove, { passive: true });

        this.isInitialized = true;
    }

    /**
     * Create container element for trail particles
     * @private
     */
    _createContainer() {
        this.container = document.createElement('div');
        this.container.className = 'mouse-trail-container';
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            pointer-events: none;
            z-index: 9999;
        `;
        document.body.appendChild(this.container);
    }

    /**
     * Handle mouse move event
     * @private
     * @param {MouseEvent} event - Mouse event
     * 
     * Validates: Requirements 7.1
     */
    _handleMouseMove(event) {
        if (this.isReducedMotion || !this.isInitialized) {
            return;
        }

        const x = event.clientX;
        const y = event.clientY;

        // Throttle particle creation based on distance moved
        const dx = x - this.lastMousePos.x;
        const dy = y - this.lastMousePos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance >= this.minDistance) {
            this.addParticle(x, y);
            this.lastMousePos.x = x;
            this.lastMousePos.y = y;
        }
    }

    /**
     * Add a particle at the specified position
     * If particle count >= maxParticles, removes the oldest particle first
     * 
     * @param {number} x - X position
     * @param {number} y - Y position
     * 
     * Validates: Requirements 7.1, 7.2
     * Property 18: Adding a particle when count >= maxParticles SHALL remove the oldest particle first
     */
    addParticle(x, y) {
        if (this.isReducedMotion || !this.container) {
            return;
        }

        // Remove oldest particle if at max capacity
        // Property 18: Adding a particle when count >= maxParticles SHALL remove the oldest particle first
        if (this.particles.length >= this.options.maxParticles) {
            this._removeOldestParticle();
        }

        // Create particle element
        const element = document.createElement('div');
        element.className = 'trail-particle';

        // Random size within range
        const size = randomRange(this.options.minSize, this.options.maxSize);

        // Apply styles with current hue
        // Validates: Requirements 7.2 - hue rotation for colorful particles
        element.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            background: radial-gradient(circle, 
                hsla(${this.hue}, 100%, 70%, 1) 0%, 
                hsla(${this.hue}, 100%, 50%, 0.8) 40%, 
                hsla(${this.hue}, 100%, 40%, 0) 100%);
            box-shadow: 0 0 ${size}px hsla(${this.hue}, 100%, 60%, 0.5);
            pointer-events: none;
            will-change: transform, opacity;
        `;

        // Apply GPU acceleration
        GPUAccelerator.accelerate(element);

        // Position the particle (centered on cursor)
        element.style.transform = `translate3d(${x - size / 2}px, ${y - size / 2}px, 0)`;

        // Create particle object
        const particle = new TrailParticle(element, x, y, size, this.hue, 1);

        // Add to container
        this.container.appendChild(element);

        // Add to particles array
        this.particles.push(particle);

        // Rotate hue for next particle
        // Validates: Requirements 7.2 - hue rotation
        this.hue = (this.hue + HUE_INCREMENT) % 360;
    }

    /**
     * Remove the oldest particle from the array and DOM
     * @private
     * 
     * Property 18: Adding a particle when count >= maxParticles SHALL remove the oldest particle first
     */
    _removeOldestParticle() {
        if (this.particles.length === 0) {
            return;
        }

        // Remove the first (oldest) particle
        const oldestParticle = this.particles.shift();
        this._removeParticleElement(oldestParticle);
    }

    /**
     * Remove a particle element from the DOM
     * @private
     * @param {TrailParticle} particle - Particle to remove
     * 
     * Validates: Requirements 7.4
     */
    _removeParticleElement(particle) {
        if (particle.element && particle.element.parentNode) {
            particle.element.parentNode.removeChild(particle.element);
        }
    }

    /**
     * Update all particles
     * Decreases life, applies velocity, and removes dead particles
     * Called by AnimationCore on each frame
     * 
     * @param {number} [deltaTime] - Time since last frame in seconds (optional)
     * @param {number} [timestamp] - Current timestamp (optional)
     * 
     * Validates: Requirements 7.3, 7.4
     * Property 18: 
     * - Each update SHALL decrease particle.life by decay amount
     * - Particles with life <= 0 SHALL be removed from DOM and particles array
     */
    update(deltaTime, timestamp) {
        if (!this.isInitialized || this.isReducedMotion) {
            return;
        }

        // Array to track particles that need to be removed
        const particlesToRemove = [];

        // Update each particle
        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];

            // Decrease life by decay amount
            // Property 18: Each update SHALL decrease particle.life by decay amount
            particle.life -= this.options.decay;

            // Check if particle should be removed
            // Property 18: Particles with life <= 0 SHALL be removed from DOM and particles array
            if (particle.life <= 0) {
                particlesToRemove.push(i);
                continue;
            }

            // Apply velocity (slight drift)
            particle.x += particle.vx;
            particle.y += particle.vy;

            // Update visual properties based on life
            const scale = particle.life;
            const opacity = particle.life;

            // Apply transform and opacity using GPU-accelerated properties
            particle.element.style.transform = `translate3d(${particle.x - particle.size / 2}px, ${particle.y - particle.size / 2}px, 0) scale(${scale})`;
            particle.element.style.opacity = opacity;
        }

        // Remove dead particles (iterate in reverse to maintain indices)
        // Property 18: Particles with life <= 0 SHALL be removed from DOM and particles array
        for (let i = particlesToRemove.length - 1; i >= 0; i--) {
            const index = particlesToRemove[i];
            const particle = this.particles[index];
            
            // Remove from DOM
            this._removeParticleElement(particle);
            
            // Remove from array
            this.particles.splice(index, 1);
        }
    }

    /**
     * Handle reduced motion preference change
     * @param {boolean} isReducedMotion - Whether reduced motion is enabled
     * 
     * Validates: Requirements 9.4
     */
    onReducedMotionChange(isReducedMotion) {
        this.isReducedMotion = isReducedMotion;

        if (isReducedMotion) {
            // Hide container and clear particles when reduced motion is enabled
            if (this.container) {
                this.container.style.display = 'none';
            }
            this._clearAllParticles();
        } else {
            // Show container when reduced motion is disabled
            if (this.container) {
                this.container.style.display = 'block';
            }

            // Initialize if not already done
            if (!this.isInitialized) {
                this.bind();
            }
        }
    }

    /**
     * Clear all particles from the array and DOM
     * @private
     */
    _clearAllParticles() {
        for (const particle of this.particles) {
            this._removeParticleElement(particle);
        }
        this.particles = [];
    }

    /**
     * Get current particle count
     * @returns {number} Number of particles
     */
    getParticleCount() {
        return this.particles.length;
    }

    /**
     * Get all particles
     * @returns {TrailParticle[]} Array of particles
     */
    getParticles() {
        return this.particles;
    }

    /**
     * Get current hue value
     * @returns {number} Current hue (0-360)
     */
    getHue() {
        return this.hue;
    }

    /**
     * Set decay rate
     * @param {number} decay - New decay rate (0-1)
     */
    setDecay(decay) {
        this.options.decay = constrain(decay, 0.001, 1);
    }

    /**
     * Set maximum particles
     * @param {number} maxParticles - New maximum particle count
     */
    setMaxParticles(maxParticles) {
        this.options.maxParticles = Math.max(1, Math.floor(maxParticles));
        
        // Remove excess particles if needed
        while (this.particles.length > this.options.maxParticles) {
            this._removeOldestParticle();
        }
    }

    /**
     * Pause the mouse trail
     */
    pause() {
        this.isReducedMotion = true;
    }

    /**
     * Resume the mouse trail
     */
    resume() {
        this.isReducedMotion = false;
    }

    /**
     * Cleanup and destroy the mouse trail controller
     * Removes all particles, event listeners, and container
     * 
     * Validates: Requirements 8.3
     * Property 19: Animation Cleanup
     * - Remove all event listeners
     * - Clear all animation frames (N/A - uses AnimationCore RAF)
     * - Reset all element styles to initial state
     * - Set isInitialized to false
     * - Clear any arrays/maps of elements
     */
    destroy() {
        // Remove mouse move event listener
        document.removeEventListener('mousemove', this.boundHandlers.onMouseMove);

        // Clear all particles (removes from DOM)
        this._clearAllParticles();

        // Remove container
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.container = null;

        // Reset state
        this.isInitialized = false;
        this.isReducedMotion = false;
        this.hue = 0;
        this.lastMousePos = { x: 0, y: 0 };
        this.particles = [];
    }
}

// Export for ES modules
export { 
    MouseTrailController, 
    TrailParticle, 
    DEFAULT_MAX_PARTICLES, 
    DEFAULT_DECAY,
    DEFAULT_MIN_SIZE,
    DEFAULT_MAX_SIZE,
    HUE_INCREMENT
};

// Also export as default
export default MouseTrailController;
