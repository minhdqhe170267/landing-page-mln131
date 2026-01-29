/**
 * ParticleSystem - 3D floating particles with physics
 * Responds to mouse movement for interactive effect
 * 
 * Requirements:
 * - 2.4: Display 3D floating particles with physics simulation
 * - 2.5: Particles respond to mouse position
 * - 2.6: At least 50 particles with depth (Z-axis) on desktop
 * - 10.1: Reduce particle count to 30 on mobile (viewport < 768px)
 * - 9.3: Do not initialize when reduced motion is enabled
 * 
 * Design Interface:
 * - init(): Create particles
 * - update(): Update particle positions (called by AnimationCore)
 * - onMouseMove(x, y): Handle mouse movement
 * - destroy(): Cleanup
 * 
 * @module animations/controllers/particle-system
 */

import { Vector3, randomRange, constrain, mapRange } from '../utils/vector.js';
import { GPUAccelerator } from '../core/gpu-accelerator.js';

/**
 * Minimum particle count for desktop (viewport >= 768px)
 * Validates: Requirements 2.6
 */
const MIN_DESKTOP_PARTICLES = 50;

/**
 * Minimum particle count for mobile (viewport < 768px)
 * Validates: Requirements 10.1
 */
const MIN_MOBILE_PARTICLES = 30;

/**
 * Mobile breakpoint in pixels
 */
const MOBILE_BREAKPOINT = 768;

/**
 * Particle class representing a single 3D particle
 */
class Particle {
    /**
     * Create a particle
     * @param {HTMLElement} element - DOM element for the particle
     * @param {Vector3} position - 3D position
     * @param {Vector3} velocity - 3D velocity
     * @param {number} size - Particle size in pixels
     * @param {number} opacity - Particle opacity (0-1)
     */
    constructor(element, position, velocity, size, opacity) {
        /**
         * DOM element for the particle
         * @type {HTMLElement}
         */
        this.element = element;
        
        /**
         * 3D position (x, y, z)
         * @type {Vector3}
         */
        this.position = position;
        
        /**
         * Base position for oscillation
         * @type {Vector3}
         */
        this.basePosition = position.clone();
        
        /**
         * 3D velocity
         * @type {Vector3}
         */
        this.velocity = velocity;
        
        /**
         * Particle size in pixels
         * @type {number}
         */
        this.size = size;
        
        /**
         * Base opacity
         * @type {number}
         */
        this.baseOpacity = opacity;
        
        /**
         * Current opacity
         * @type {number}
         */
        this.opacity = opacity;
        
        /**
         * Phase offset for oscillation (unique per particle)
         * @type {number}
         */
        this.phaseOffset = Math.random() * Math.PI * 2;
        
        /**
         * Oscillation speed
         * @type {number}
         */
        this.oscillationSpeed = randomRange(0.5, 1.5);
        
        /**
         * Oscillation amplitude
         * @type {number}
         */
        this.oscillationAmplitude = randomRange(10, 30);
    }
}

/**
 * ParticleSystem class
 * 3D particle system with physics and mouse interaction
 */
class ParticleSystem {
    /**
     * Create a ParticleSystem instance
     * @param {HTMLElement} container - Container element for particles
     * @param {Object} [options] - Configuration options
     * @param {number} [options.count] - Number of particles (auto-adjusted for viewport)
     * @param {number} [options.minSize=2] - Minimum particle size in pixels
     * @param {number} [options.maxSize=6] - Maximum particle size in pixels
     * @param {number} [options.maxDepth=1000] - Maximum Z depth
     * @param {number} [options.mouseInfluence=0.1] - Mouse influence factor (0-1)
     * @param {number} [options.focalLength=500] - Focal length for perspective projection
     */
    constructor(container, options = {}) {
        if (!container || !(container instanceof HTMLElement)) {
            throw new Error('ParticleSystem: Valid container element is required');
        }

        /**
         * Container element
         * @type {HTMLElement}
         */
        this.container = container;

        /**
         * Array of particles
         * @type {Particle[]}
         */
        this.particles = [];

        /**
         * Current mouse position
         * @type {{x: number, y: number}}
         */
        this.mouse = { x: 0, y: 0 };

        /**
         * Target mouse position (for smooth interpolation)
         * @type {{x: number, y: number}}
         */
        this.targetMouse = { x: 0, y: 0 };

        /**
         * Whether mouse is inside container
         * @type {boolean}
         */
        this.isMouseInside = false;

        /**
         * Configuration options
         * @type {Object}
         */
        this.options = {
            count: options.count || this._getDefaultParticleCount(),
            minSize: options.minSize || 2,
            maxSize: options.maxSize || 6,
            maxDepth: options.maxDepth || 1000,
            mouseInfluence: options.mouseInfluence || 0.1,
            focalLength: options.focalLength || 500
        };

        /**
         * Container dimensions
         * @type {{width: number, height: number}}
         */
        this.dimensions = {
            width: container.clientWidth || window.innerWidth,
            height: container.clientHeight || window.innerHeight
        };

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
         * Whether this controller supports reduced motion
         * @type {boolean}
         */
        this.supportsReducedMotion = false;

        /**
         * Bound event handlers
         * @type {Object}
         */
        this.boundHandlers = {
            onMouseMove: this._handleMouseMove.bind(this),
            onMouseEnter: this._handleMouseEnter.bind(this),
            onMouseLeave: this._handleMouseLeave.bind(this),
            onResize: this._handleResize.bind(this)
        };

        /**
         * Elapsed time for animations
         * @type {number}
         */
        this.elapsedTime = 0;

        /**
         * Particle wrapper element
         * @type {HTMLElement|null}
         */
        this.wrapper = null;
    }

    /**
     * Get default particle count based on viewport size
     * @private
     * @returns {number} Default particle count
     * 
     * Validates: Requirements 2.6, 10.1
     */
    _getDefaultParticleCount() {
        const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
        return isMobile ? MIN_MOBILE_PARTICLES : MIN_DESKTOP_PARTICLES;
    }

    /**
     * Get minimum particle count based on viewport size
     * @returns {number} Minimum particle count
     * 
     * Validates: Requirements 2.6, 10.1
     */
    getMinParticleCount() {
        const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
        return isMobile ? MIN_MOBILE_PARTICLES : MIN_DESKTOP_PARTICLES;
    }

    /**
     * Initialize the particle system
     * Creates particles and binds event listeners
     * 
     * Validates: Requirements 9.3
     */
    init() {
        // Don't initialize if reduced motion is enabled
        if (this.isReducedMotion) {
            console.log('ParticleSystem: Reduced motion enabled, skipping initialization');
            return;
        }

        // Create wrapper element for particles
        this._createWrapper();

        // Create particles
        this._createParticles();

        // Bind event listeners
        this._bindEvents();

        this.isInitialized = true;
    }

    /**
     * Create wrapper element for particles
     * @private
     */
    _createWrapper() {
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'particle-system-wrapper';
        this.wrapper.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            pointer-events: none;
            z-index: 1;
        `;
        this.container.appendChild(this.wrapper);
    }

    /**
     * Create particles
     * @private
     * 
     * Validates: Requirements 2.4, 2.6, 10.1
     */
    _createParticles() {
        // Ensure minimum particle count based on viewport
        const minCount = this.getMinParticleCount();
        const count = Math.max(this.options.count, minCount);

        const { width, height } = this.dimensions;
        const { minSize, maxSize, maxDepth } = this.options;

        for (let i = 0; i < count; i++) {
            // Create particle element
            const element = document.createElement('div');
            element.className = 'particle';
            
            // Random size
            const size = randomRange(minSize, maxSize);
            
            // Random 3D position
            // X and Y centered around container center
            const x = randomRange(-width / 2, width / 2);
            const y = randomRange(-height / 2, height / 2);
            const z = randomRange(0, maxDepth);
            
            const position = new Vector3(x, y, z);
            
            // Random velocity (slow floating motion)
            const vx = randomRange(-0.5, 0.5);
            const vy = randomRange(-0.5, 0.5);
            const vz = randomRange(-0.3, 0.3);
            
            const velocity = new Vector3(vx, vy, vz);
            
            // Opacity based on depth (farther = more transparent)
            const opacity = mapRange(z, 0, maxDepth, 0.8, 0.2);
            
            // Apply initial styles
            element.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                border-radius: 50%;
                background: radial-gradient(circle, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.3) 70%, transparent 100%);
                pointer-events: none;
                will-change: transform, opacity;
            `;
            
            // Apply GPU acceleration
            GPUAccelerator.accelerate(element);
            
            // Create particle object
            const particle = new Particle(element, position, velocity, size, opacity);
            
            // Add to wrapper
            this.wrapper.appendChild(element);
            
            // Add to particles array
            this.particles.push(particle);
        }

        // Initial render
        this._renderParticles();
    }

    /**
     * Bind event listeners
     * @private
     */
    _bindEvents() {
        // Mouse events on container
        this.container.addEventListener('mousemove', this.boundHandlers.onMouseMove, { passive: true });
        this.container.addEventListener('mouseenter', this.boundHandlers.onMouseEnter, { passive: true });
        this.container.addEventListener('mouseleave', this.boundHandlers.onMouseLeave, { passive: true });
        
        // Resize event
        window.addEventListener('resize', this.boundHandlers.onResize, { passive: true });
    }

    /**
     * Unbind event listeners
     * @private
     */
    _unbindEvents() {
        this.container.removeEventListener('mousemove', this.boundHandlers.onMouseMove);
        this.container.removeEventListener('mouseenter', this.boundHandlers.onMouseEnter);
        this.container.removeEventListener('mouseleave', this.boundHandlers.onMouseLeave);
        window.removeEventListener('resize', this.boundHandlers.onResize);
    }

    /**
     * Handle mouse move event
     * @private
     * @param {MouseEvent} event - Mouse event
     */
    _handleMouseMove(event) {
        const rect = this.container.getBoundingClientRect();
        
        // Calculate mouse position relative to container center
        this.targetMouse.x = event.clientX - rect.left - rect.width / 2;
        this.targetMouse.y = event.clientY - rect.top - rect.height / 2;
    }

    /**
     * Handle mouse enter event
     * @private
     */
    _handleMouseEnter() {
        this.isMouseInside = true;
    }

    /**
     * Handle mouse leave event
     * @private
     */
    _handleMouseLeave() {
        this.isMouseInside = false;
        // Gradually return mouse influence to center
        this.targetMouse.x = 0;
        this.targetMouse.y = 0;
    }

    /**
     * Handle resize event
     * @private
     * 
     * Validates: Requirements 10.4
     */
    _handleResize() {
        this.dimensions.width = this.container.clientWidth || window.innerWidth;
        this.dimensions.height = this.container.clientHeight || window.innerHeight;
        
        // Check if we need to adjust particle count
        const minCount = this.getMinParticleCount();
        if (this.particles.length < minCount) {
            // Add more particles if needed
            this._addParticles(minCount - this.particles.length);
        }
    }

    /**
     * Add additional particles
     * @private
     * @param {number} count - Number of particles to add
     */
    _addParticles(count) {
        const { width, height } = this.dimensions;
        const { minSize, maxSize, maxDepth } = this.options;

        for (let i = 0; i < count; i++) {
            const element = document.createElement('div');
            element.className = 'particle';
            
            const size = randomRange(minSize, maxSize);
            const x = randomRange(-width / 2, width / 2);
            const y = randomRange(-height / 2, height / 2);
            const z = randomRange(0, maxDepth);
            
            const position = new Vector3(x, y, z);
            const velocity = new Vector3(
                randomRange(-0.5, 0.5),
                randomRange(-0.5, 0.5),
                randomRange(-0.3, 0.3)
            );
            
            const opacity = mapRange(z, 0, maxDepth, 0.8, 0.2);
            
            element.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                border-radius: 50%;
                background: radial-gradient(circle, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.3) 70%, transparent 100%);
                pointer-events: none;
                will-change: transform, opacity;
            `;
            
            GPUAccelerator.accelerate(element);
            
            const particle = new Particle(element, position, velocity, size, opacity);
            
            this.wrapper.appendChild(element);
            this.particles.push(particle);
        }
    }

    /**
     * Handle mouse movement - public API for external calls
     * @param {number} x - Mouse X position (relative to container center)
     * @param {number} y - Mouse Y position (relative to container center)
     * 
     * Validates: Requirements 2.5
     */
    onMouseMove(x, y) {
        this.targetMouse.x = x;
        this.targetMouse.y = y;
        this.isMouseInside = true;
    }

    /**
     * Update particle positions
     * Called by AnimationCore on each frame
     * 
     * @param {number} deltaTime - Time since last frame in seconds
     * @param {number} timestamp - Current timestamp
     * 
     * Validates: Requirements 2.4, 2.5
     */
    update(deltaTime, timestamp) {
        if (!this.isInitialized || this.isReducedMotion) {
            return;
        }

        this.elapsedTime += deltaTime;

        // Smooth mouse interpolation
        const mouseEase = 0.1;
        this.mouse.x += (this.targetMouse.x - this.mouse.x) * mouseEase;
        this.mouse.y += (this.targetMouse.y - this.mouse.y) * mouseEase;

        // Update each particle
        for (const particle of this.particles) {
            this._updateParticle(particle, deltaTime);
        }

        // Render particles
        this._renderParticles();
    }

    /**
     * Update a single particle
     * @private
     * @param {Particle} particle - Particle to update
     * @param {number} deltaTime - Time since last frame
     * 
     * Validates: Requirements 2.4, 2.5
     */
    _updateParticle(particle, deltaTime) {
        const { maxDepth, mouseInfluence } = this.options;
        const { width, height } = this.dimensions;

        // Oscillation animation
        const oscillation = Math.sin(this.elapsedTime * particle.oscillationSpeed + particle.phaseOffset);
        
        // Update position with velocity
        particle.position.x += particle.velocity.x;
        particle.position.y += particle.velocity.y + oscillation * 0.5;
        particle.position.z += particle.velocity.z;

        // Mouse influence - particles are pushed/pulled by mouse
        // Influence is proportional to mouseInfluence factor
        // Validates: Requirements 2.5
        if (this.isMouseInside) {
            // Calculate distance factor based on Z depth (closer particles are more affected)
            const depthFactor = 1 - (particle.position.z / maxDepth);
            const influence = mouseInfluence * depthFactor;
            
            // Apply mouse influence to position
            particle.position.x += (this.mouse.x * influence - particle.position.x * 0.01);
            particle.position.y += (this.mouse.y * influence - particle.position.y * 0.01);
        }

        // Boundary wrapping for X
        const halfWidth = width / 2;
        if (particle.position.x < -halfWidth) {
            particle.position.x = halfWidth;
        } else if (particle.position.x > halfWidth) {
            particle.position.x = -halfWidth;
        }

        // Boundary wrapping for Y
        const halfHeight = height / 2;
        if (particle.position.y < -halfHeight) {
            particle.position.y = halfHeight;
        } else if (particle.position.y > halfHeight) {
            particle.position.y = -halfHeight;
        }

        // Boundary wrapping for Z
        if (particle.position.z < 0) {
            particle.position.z = maxDepth;
        } else if (particle.position.z > maxDepth) {
            particle.position.z = 0;
        }

        // Update opacity based on depth
        particle.opacity = mapRange(particle.position.z, 0, maxDepth, 0.8, 0.2);
    }

    /**
     * Render all particles
     * @private
     */
    _renderParticles() {
        const { focalLength } = this.options;
        const { width, height } = this.dimensions;
        const centerX = width / 2;
        const centerY = height / 2;

        for (const particle of this.particles) {
            // Apply perspective projection
            const projected = particle.position.project(focalLength);
            
            // Calculate screen position
            const screenX = centerX + projected.x;
            const screenY = centerY + projected.y;
            
            // Scale based on depth
            const scale = projected.scale;
            
            // Apply transform using GPU-accelerated properties
            particle.element.style.transform = `translate3d(${screenX}px, ${screenY}px, 0) scale(${scale})`;
            particle.element.style.opacity = particle.opacity * scale;
        }
    }

    /**
     * Handle reduced motion preference change
     * @param {boolean} isReducedMotion - Whether reduced motion is enabled
     * 
     * Validates: Requirements 9.3
     */
    onReducedMotionChange(isReducedMotion) {
        this.isReducedMotion = isReducedMotion;
        
        if (isReducedMotion) {
            // Hide all particles when reduced motion is enabled
            if (this.wrapper) {
                this.wrapper.style.display = 'none';
            }
        } else {
            // Show particles when reduced motion is disabled
            if (this.wrapper) {
                this.wrapper.style.display = 'block';
            }
            
            // Initialize if not already done
            if (!this.isInitialized) {
                this.init();
            }
        }
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
     * @returns {Particle[]} Array of particles
     */
    getParticles() {
        return this.particles;
    }

    /**
     * Get current mouse position
     * @returns {{x: number, y: number}} Mouse position
     */
    getMousePosition() {
        return { ...this.mouse };
    }

    /**
     * Set mouse influence factor
     * @param {number} influence - Mouse influence factor (0-1)
     */
    setMouseInfluence(influence) {
        this.options.mouseInfluence = constrain(influence, 0, 1);
    }

    /**
     * Pause the particle system
     */
    pause() {
        this.isReducedMotion = true;
    }

    /**
     * Resume the particle system
     */
    resume() {
        this.isReducedMotion = false;
    }

    /**
     * Cleanup and destroy the particle system
     * Removes all particles, event listeners, and resets state
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
        // Unbind event listeners
        this._unbindEvents();

        // Remove all particle elements and clear GPU acceleration
        for (const particle of this.particles) {
            if (particle.element) {
                // Clear will-change before removing
                particle.element.style.willChange = '';
                particle.element.style.transform = '';
                particle.element.style.opacity = '';
                
                if (particle.element.parentNode) {
                    particle.element.parentNode.removeChild(particle.element);
                }
            }
        }

        // Clear particles array
        this.particles = [];

        // Remove wrapper
        if (this.wrapper && this.wrapper.parentNode) {
            this.wrapper.parentNode.removeChild(this.wrapper);
        }
        this.wrapper = null;

        // Reset state
        this.isInitialized = false;
        this.isReducedMotion = false;
        this.isMouseInside = false;
        this.mouse = { x: 0, y: 0 };
        this.targetMouse = { x: 0, y: 0 };
        this.elapsedTime = 0;
        this.dimensions = { width: 0, height: 0 };
    }
}

// Export for ES modules
export { 
    ParticleSystem, 
    Particle, 
    MIN_DESKTOP_PARTICLES, 
    MIN_MOBILE_PARTICLES, 
    MOBILE_BREAKPOINT 
};

// Also export as default
export default ParticleSystem;
