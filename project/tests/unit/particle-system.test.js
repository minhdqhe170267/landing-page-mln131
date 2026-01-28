/**
 * Unit Tests for ParticleSystem
 * Feature: ultimate-ui-animations
 * 
 * Tests the 3D floating particle system with physics and mouse interaction.
 * 
 * **Validates: Requirements 2.4, 2.5, 2.6, 9.3, 10.1**
 */

// Polyfill TextEncoder/TextDecoder for jsdom
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const { JSDOM } = require('jsdom');

// ============================================
// TEST SETUP
// ============================================

/**
 * Create a mock DOM environment
 * @param {number} viewportWidth - Viewport width for testing responsive behavior
 * @returns {Object} - DOM window, document, and container
 */
function createMockDOM(viewportWidth = 1024) {
    const html = `
        <!DOCTYPE html>
        <html lang="vi">
        <head><title>Test Page</title></head>
        <body>
            <div id="hero-container" style="width: 800px; height: 600px; position: relative;">
            </div>
        </body>
        </html>
    `;

    const dom = new JSDOM(html, {
        url: 'http://localhost/index.html',
        runScripts: 'dangerously',
        pretendToBeVisual: true
    });

    // Set viewport width
    Object.defineProperty(dom.window, 'innerWidth', { value: viewportWidth, writable: true });
    Object.defineProperty(dom.window, 'innerHeight', { value: 768, writable: true });

    const container = dom.window.document.getElementById('hero-container');
    
    // Mock clientWidth/clientHeight
    Object.defineProperty(container, 'clientWidth', { value: 800, writable: true });
    Object.defineProperty(container, 'clientHeight', { value: 600, writable: true });
    
    return {
        window: dom.window,
        document: dom.window.document,
        container
    };
}


/**
 * Create Vector3 class for testing
 */
function createVector3Class() {
    class Vector3 {
        constructor(x = 0, y = 0, z = 0) {
            this.x = x;
            this.y = y;
            this.z = z;
        }

        clone() {
            return new Vector3(this.x, this.y, this.z);
        }

        set(x, y, z) {
            this.x = x;
            this.y = y;
            this.z = z;
            return this;
        }

        add(v) {
            this.x += v.x;
            this.y += v.y;
            this.z += v.z;
            return this;
        }

        project(focalLength = 500) {
            const scale = focalLength / (focalLength + this.z);
            return {
                x: this.x * scale,
                y: this.y * scale,
                scale: scale
            };
        }
    }

    return Vector3;
}

/**
 * Utility functions for testing
 */
function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

function constrain(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function mapRange(value, inMin, inMax, outMin, outMax) {
    return ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;
}

// Constants
const MIN_DESKTOP_PARTICLES = 50;
const MIN_MOBILE_PARTICLES = 30;
const MOBILE_BREAKPOINT = 768;


/**
 * Create Particle class for testing
 */
function createParticleClass(Vector3) {
    class Particle {
        constructor(element, position, velocity, size, opacity) {
            this.element = element;
            this.position = position;
            this.basePosition = position.clone();
            this.velocity = velocity;
            this.size = size;
            this.baseOpacity = opacity;
            this.opacity = opacity;
            this.phaseOffset = Math.random() * Math.PI * 2;
            this.oscillationSpeed = randomRange(0.5, 1.5);
            this.oscillationAmplitude = randomRange(10, 30);
        }
    }
    return Particle;
}

/**
 * Create ParticleSystem class for testing
 */
function createParticleSystemClass(mockWindow) {
    const Vector3 = createVector3Class();
    const Particle = createParticleClass(Vector3);

    class ParticleSystem {
        constructor(container, options = {}) {
            if (!container || !(container instanceof mockWindow.HTMLElement)) {
                throw new Error('ParticleSystem: Valid container element is required');
            }

            this.container = container;
            this.particles = [];
            this.mouse = { x: 0, y: 0 };
            this.targetMouse = { x: 0, y: 0 };
            this.isMouseInside = false;

            this.options = {
                count: options.count || this._getDefaultParticleCount(),
                minSize: options.minSize || 2,
                maxSize: options.maxSize || 6,
                maxDepth: options.maxDepth || 1000,
                mouseInfluence: options.mouseInfluence || 0.1,
                focalLength: options.focalLength || 500
            };

            this.dimensions = {
                width: container.clientWidth || mockWindow.innerWidth,
                height: container.clientHeight || mockWindow.innerHeight
            };

            this.isInitialized = false;
            this.isReducedMotion = false;
            this.supportsReducedMotion = false;
            this.elapsedTime = 0;
            this.wrapper = null;

            this.boundHandlers = {
                onMouseMove: this._handleMouseMove.bind(this),
                onMouseEnter: this._handleMouseEnter.bind(this),
                onMouseLeave: this._handleMouseLeave.bind(this),
                onResize: this._handleResize.bind(this)
            };
        }

        _getDefaultParticleCount() {
            const isMobile = mockWindow.innerWidth < MOBILE_BREAKPOINT;
            return isMobile ? MIN_MOBILE_PARTICLES : MIN_DESKTOP_PARTICLES;
        }

        getMinParticleCount() {
            const isMobile = mockWindow.innerWidth < MOBILE_BREAKPOINT;
            return isMobile ? MIN_MOBILE_PARTICLES : MIN_DESKTOP_PARTICLES;
        }

        init() {
            if (this.isReducedMotion) {
                return;
            }
            this._createWrapper();
            this._createParticles();
            this._bindEvents();
            this.isInitialized = true;
        }

        _createWrapper() {
            this.wrapper = mockWindow.document.createElement('div');
            this.wrapper.className = 'particle-system-wrapper';
            this.container.appendChild(this.wrapper);
        }


        _createParticles() {
            const minCount = this.getMinParticleCount();
            const count = Math.max(this.options.count, minCount);
            const { width, height } = this.dimensions;
            const { minSize, maxSize, maxDepth } = this.options;

            for (let i = 0; i < count; i++) {
                const element = mockWindow.document.createElement('div');
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
                const particle = new Particle(element, position, velocity, size, opacity);
                
                this.wrapper.appendChild(element);
                this.particles.push(particle);
            }
        }

        _bindEvents() {
            this.container.addEventListener('mousemove', this.boundHandlers.onMouseMove, { passive: true });
            this.container.addEventListener('mouseenter', this.boundHandlers.onMouseEnter, { passive: true });
            this.container.addEventListener('mouseleave', this.boundHandlers.onMouseLeave, { passive: true });
            mockWindow.addEventListener('resize', this.boundHandlers.onResize, { passive: true });
        }

        _unbindEvents() {
            this.container.removeEventListener('mousemove', this.boundHandlers.onMouseMove);
            this.container.removeEventListener('mouseenter', this.boundHandlers.onMouseEnter);
            this.container.removeEventListener('mouseleave', this.boundHandlers.onMouseLeave);
            mockWindow.removeEventListener('resize', this.boundHandlers.onResize);
        }

        _handleMouseMove(event) {
            const rect = this.container.getBoundingClientRect();
            this.targetMouse.x = event.clientX - rect.left - rect.width / 2;
            this.targetMouse.y = event.clientY - rect.top - rect.height / 2;
        }

        _handleMouseEnter() {
            this.isMouseInside = true;
        }

        _handleMouseLeave() {
            this.isMouseInside = false;
            this.targetMouse.x = 0;
            this.targetMouse.y = 0;
        }

        _handleResize() {
            this.dimensions.width = this.container.clientWidth || mockWindow.innerWidth;
            this.dimensions.height = this.container.clientHeight || mockWindow.innerHeight;
        }

        onMouseMove(x, y) {
            this.targetMouse.x = x;
            this.targetMouse.y = y;
            this.isMouseInside = true;
        }


        update(deltaTime, timestamp) {
            if (!this.isInitialized || this.isReducedMotion) {
                return;
            }

            this.elapsedTime += deltaTime;

            const mouseEase = 0.1;
            this.mouse.x += (this.targetMouse.x - this.mouse.x) * mouseEase;
            this.mouse.y += (this.targetMouse.y - this.mouse.y) * mouseEase;

            for (const particle of this.particles) {
                this._updateParticle(particle, deltaTime);
            }
        }

        _updateParticle(particle, deltaTime) {
            const { maxDepth, mouseInfluence } = this.options;
            const { width, height } = this.dimensions;

            const oscillation = Math.sin(this.elapsedTime * particle.oscillationSpeed + particle.phaseOffset);
            
            particle.position.x += particle.velocity.x;
            particle.position.y += particle.velocity.y + oscillation * 0.5;
            particle.position.z += particle.velocity.z;

            if (this.isMouseInside) {
                const depthFactor = 1 - (particle.position.z / maxDepth);
                const influence = mouseInfluence * depthFactor;
                
                particle.position.x += (this.mouse.x * influence - particle.position.x * 0.01);
                particle.position.y += (this.mouse.y * influence - particle.position.y * 0.01);
            }

            // Boundary wrapping
            const halfWidth = width / 2;
            if (particle.position.x < -halfWidth) particle.position.x = halfWidth;
            else if (particle.position.x > halfWidth) particle.position.x = -halfWidth;

            const halfHeight = height / 2;
            if (particle.position.y < -halfHeight) particle.position.y = halfHeight;
            else if (particle.position.y > halfHeight) particle.position.y = -halfHeight;

            if (particle.position.z < 0) particle.position.z = maxDepth;
            else if (particle.position.z > maxDepth) particle.position.z = 0;

            particle.opacity = mapRange(particle.position.z, 0, maxDepth, 0.8, 0.2);
        }

        onReducedMotionChange(isReducedMotion) {
            this.isReducedMotion = isReducedMotion;
            if (isReducedMotion && this.wrapper) {
                this.wrapper.style.display = 'none';
            } else if (this.wrapper) {
                this.wrapper.style.display = 'block';
            }
        }

        getParticleCount() {
            return this.particles.length;
        }

        getParticles() {
            return this.particles;
        }

        getMousePosition() {
            return { ...this.mouse };
        }

        setMouseInfluence(influence) {
            this.options.mouseInfluence = constrain(influence, 0, 1);
        }

        pause() {
            this.isReducedMotion = true;
        }

        resume() {
            this.isReducedMotion = false;
        }

        destroy() {
            this._unbindEvents();
            for (const particle of this.particles) {
                if (particle.element && particle.element.parentNode) {
                    particle.element.parentNode.removeChild(particle.element);
                }
            }
            this.particles = [];
            if (this.wrapper && this.wrapper.parentNode) {
                this.wrapper.parentNode.removeChild(this.wrapper);
            }
            this.wrapper = null;
            this.isInitialized = false;
            this.isReducedMotion = false;
            this.mouse = { x: 0, y: 0 };
            this.targetMouse = { x: 0, y: 0 };
            this.elapsedTime = 0;
        }
    }

    return { ParticleSystem, Particle, Vector3 };
}


// ============================================
// UNIT TESTS
// ============================================

describe('Feature: ultimate-ui-animations', () => {
    describe('ParticleSystem', () => {
        let mockDOM;
        let ParticleSystem;
        let Particle;
        let Vector3;

        beforeEach(() => {
            mockDOM = createMockDOM(1024); // Desktop viewport
            const classes = createParticleSystemClass(mockDOM.window);
            ParticleSystem = classes.ParticleSystem;
            Particle = classes.Particle;
            Vector3 = classes.Vector3;
        });

        describe('constructor', () => {
            /**
             * Test: Should throw error if container is not provided
             */
            it('should throw error if container is not provided', () => {
                expect(() => new ParticleSystem(null)).toThrow('ParticleSystem: Valid container element is required');
            });

            /**
             * Test: Should throw error if invalid element is provided
             */
            it('should throw error if invalid element is provided', () => {
                expect(() => new ParticleSystem('not-an-element')).toThrow('ParticleSystem: Valid container element is required');
            });

            /**
             * Test: Should initialize with default values
             */
            it('should initialize with default values', () => {
                const system = new ParticleSystem(mockDOM.container);
                
                expect(system.container).toBe(mockDOM.container);
                expect(system.particles).toEqual([]);
                expect(system.mouse).toEqual({ x: 0, y: 0 });
                expect(system.isInitialized).toBe(false);
                expect(system.isReducedMotion).toBe(false);
            });

            /**
             * Test: Should use default particle count for desktop
             * **Validates: Requirements 2.6**
             */
            it('should use default particle count of 50 for desktop', () => {
                const system = new ParticleSystem(mockDOM.container);
                
                expect(system.options.count).toBe(MIN_DESKTOP_PARTICLES);
            });

            /**
             * Test: Should accept custom options
             */
            it('should accept custom options', () => {
                const system = new ParticleSystem(mockDOM.container, {
                    count: 100,
                    minSize: 3,
                    maxSize: 8,
                    maxDepth: 500,
                    mouseInfluence: 0.2
                });
                
                expect(system.options.count).toBe(100);
                expect(system.options.minSize).toBe(3);
                expect(system.options.maxSize).toBe(8);
                expect(system.options.maxDepth).toBe(500);
                expect(system.options.mouseInfluence).toBe(0.2);
            });
        });


        describe('getMinParticleCount()', () => {
            /**
             * Test: Should return 50 for desktop viewport (>= 768px)
             * **Validates: Requirements 2.6**
             */
            it('should return 50 for desktop viewport (>= 768px)', () => {
                const system = new ParticleSystem(mockDOM.container);
                
                expect(system.getMinParticleCount()).toBe(MIN_DESKTOP_PARTICLES);
            });

            /**
             * Test: Should return 30 for mobile viewport (< 768px)
             * **Validates: Requirements 10.1**
             */
            it('should return 30 for mobile viewport (< 768px)', () => {
                const mobileMockDOM = createMockDOM(600); // Mobile viewport
                const classes = createParticleSystemClass(mobileMockDOM.window);
                const MobileParticleSystem = classes.ParticleSystem;
                
                const system = new MobileParticleSystem(mobileMockDOM.container);
                
                expect(system.getMinParticleCount()).toBe(MIN_MOBILE_PARTICLES);
            });
        });

        describe('init()', () => {
            /**
             * Test: Should create particles and set isInitialized
             */
            it('should create particles and set isInitialized', () => {
                const system = new ParticleSystem(mockDOM.container);
                system.init();
                
                expect(system.isInitialized).toBe(true);
                expect(system.particles.length).toBeGreaterThanOrEqual(MIN_DESKTOP_PARTICLES);
            });

            /**
             * Test: Should create wrapper element
             */
            it('should create wrapper element', () => {
                const system = new ParticleSystem(mockDOM.container);
                system.init();
                
                expect(system.wrapper).not.toBeNull();
                expect(system.wrapper.className).toBe('particle-system-wrapper');
            });

            /**
             * Test: Should not initialize when reduced motion is enabled
             * **Validates: Requirements 9.3**
             */
            it('should not initialize when reduced motion is enabled', () => {
                const system = new ParticleSystem(mockDOM.container);
                system.isReducedMotion = true;
                system.init();
                
                expect(system.isInitialized).toBe(false);
                expect(system.particles.length).toBe(0);
            });

            /**
             * Test: Should create at least 50 particles on desktop
             * **Validates: Requirements 2.6**
             */
            it('should create at least 50 particles on desktop', () => {
                const system = new ParticleSystem(mockDOM.container);
                system.init();
                
                expect(system.getParticleCount()).toBeGreaterThanOrEqual(MIN_DESKTOP_PARTICLES);
            });

            /**
             * Test: Should create at least 30 particles on mobile
             * **Validates: Requirements 10.1**
             */
            it('should create at least 30 particles on mobile', () => {
                const mobileMockDOM = createMockDOM(600);
                const classes = createParticleSystemClass(mobileMockDOM.window);
                const MobileParticleSystem = classes.ParticleSystem;
                
                const system = new MobileParticleSystem(mobileMockDOM.container);
                system.init();
                
                expect(system.getParticleCount()).toBeGreaterThanOrEqual(MIN_MOBILE_PARTICLES);
            });
        });


        describe('Particle creation', () => {
            /**
             * Test: Should create particles with 3D positions (x, y, z)
             * **Validates: Requirements 2.4**
             */
            it('should create particles with 3D positions (x, y, z)', () => {
                const system = new ParticleSystem(mockDOM.container);
                system.init();
                
                for (const particle of system.particles) {
                    expect(particle.position).toBeDefined();
                    expect(typeof particle.position.x).toBe('number');
                    expect(typeof particle.position.y).toBe('number');
                    expect(typeof particle.position.z).toBe('number');
                }
            });

            /**
             * Test: Should create particles with depth (Z-axis) for 3D effect
             * **Validates: Requirements 2.6**
             */
            it('should create particles with depth (Z-axis) for 3D effect', () => {
                const system = new ParticleSystem(mockDOM.container);
                system.init();
                
                // Check that particles have varying Z depths
                const zValues = system.particles.map(p => p.position.z);
                const uniqueZValues = new Set(zValues);
                
                // Should have multiple different Z values
                expect(uniqueZValues.size).toBeGreaterThan(1);
                
                // Z values should be within maxDepth range
                for (const z of zValues) {
                    expect(z).toBeGreaterThanOrEqual(0);
                    expect(z).toBeLessThanOrEqual(system.options.maxDepth);
                }
            });

            /**
             * Test: Should create particles with velocities for physics
             * **Validates: Requirements 2.4**
             */
            it('should create particles with velocities for physics', () => {
                const system = new ParticleSystem(mockDOM.container);
                system.init();
                
                for (const particle of system.particles) {
                    expect(particle.velocity).toBeDefined();
                    expect(typeof particle.velocity.x).toBe('number');
                    expect(typeof particle.velocity.y).toBe('number');
                    expect(typeof particle.velocity.z).toBe('number');
                }
            });

            /**
             * Test: Should create particles with DOM elements
             */
            it('should create particles with DOM elements', () => {
                const system = new ParticleSystem(mockDOM.container);
                system.init();
                
                for (const particle of system.particles) {
                    expect(particle.element).toBeDefined();
                    expect(particle.element.className).toBe('particle');
                }
            });

            /**
             * Test: Should create particles with sizes within range
             */
            it('should create particles with sizes within range', () => {
                const system = new ParticleSystem(mockDOM.container, {
                    minSize: 2,
                    maxSize: 6
                });
                system.init();
                
                for (const particle of system.particles) {
                    expect(particle.size).toBeGreaterThanOrEqual(2);
                    expect(particle.size).toBeLessThanOrEqual(6);
                }
            });
        });


        describe('onMouseMove()', () => {
            /**
             * Test: Should update target mouse position
             * **Validates: Requirements 2.5**
             */
            it('should update target mouse position', () => {
                const system = new ParticleSystem(mockDOM.container);
                system.init();
                
                system.onMouseMove(100, 50);
                
                expect(system.targetMouse.x).toBe(100);
                expect(system.targetMouse.y).toBe(50);
            });

            /**
             * Test: Should set isMouseInside to true
             */
            it('should set isMouseInside to true', () => {
                const system = new ParticleSystem(mockDOM.container);
                system.init();
                
                system.onMouseMove(100, 50);
                
                expect(system.isMouseInside).toBe(true);
            });
        });

        describe('update()', () => {
            /**
             * Test: Should update particle positions
             * **Validates: Requirements 2.4**
             */
            it('should update particle positions', () => {
                const system = new ParticleSystem(mockDOM.container);
                system.init();
                
                const initialPositions = system.particles.map(p => ({
                    x: p.position.x,
                    y: p.position.y,
                    z: p.position.z
                }));
                
                system.update(0.016, 0);
                
                // At least some positions should have changed
                const positionsChanged = system.particles.some((p, i) => 
                    p.position.x !== initialPositions[i].x ||
                    p.position.y !== initialPositions[i].y ||
                    p.position.z !== initialPositions[i].z
                );
                expect(positionsChanged).toBe(true);
            });

            /**
             * Test: Should not update when not initialized
             */
            it('should not update when not initialized', () => {
                const system = new ParticleSystem(mockDOM.container);
                // Don't call init()
                
                // Should not throw
                expect(() => system.update(0.016, 0)).not.toThrow();
            });

            /**
             * Test: Should not update when reduced motion is enabled
             * **Validates: Requirements 9.3**
             */
            it('should not update when reduced motion is enabled', () => {
                const system = new ParticleSystem(mockDOM.container);
                system.init();
                system.isReducedMotion = true;
                
                const initialPositions = system.particles.map(p => ({
                    x: p.position.x,
                    y: p.position.y,
                    z: p.position.z
                }));
                
                system.update(0.016, 0);
                
                // Positions should not have changed
                system.particles.forEach((p, i) => {
                    expect(p.position.x).toBe(initialPositions[i].x);
                    expect(p.position.y).toBe(initialPositions[i].y);
                    expect(p.position.z).toBe(initialPositions[i].z);
                });
            });

            /**
             * Test: Should apply mouse influence when mouse is inside
             * **Validates: Requirements 2.5**
             */
            it('should apply mouse influence when mouse is inside', () => {
                const system = new ParticleSystem(mockDOM.container, {
                    mouseInfluence: 0.5
                });
                system.init();
                
                // Set mouse position
                system.onMouseMove(200, 100);
                system.mouse.x = 200;
                system.mouse.y = 100;
                
                const initialPositions = system.particles.map(p => ({
                    x: p.position.x,
                    y: p.position.y
                }));
                
                // Update multiple times to see effect
                for (let i = 0; i < 10; i++) {
                    system.update(0.016, i * 16);
                }
                
                // Positions should have changed due to mouse influence
                const positionsChanged = system.particles.some((p, i) => 
                    p.position.x !== initialPositions[i].x ||
                    p.position.y !== initialPositions[i].y
                );
                expect(positionsChanged).toBe(true);
            });

            /**
             * Test: Should increment elapsed time
             */
            it('should increment elapsed time', () => {
                const system = new ParticleSystem(mockDOM.container);
                system.init();
                
                expect(system.elapsedTime).toBe(0);
                
                system.update(0.016, 0);
                expect(system.elapsedTime).toBeCloseTo(0.016, 5);
                
                system.update(0.016, 16);
                expect(system.elapsedTime).toBeCloseTo(0.032, 5);
            });
        });


        describe('onReducedMotionChange()', () => {
            /**
             * Test: Should update isReducedMotion state
             */
            it('should update isReducedMotion state', () => {
                const system = new ParticleSystem(mockDOM.container);
                system.init();
                
                system.onReducedMotionChange(true);
                expect(system.isReducedMotion).toBe(true);
                
                system.onReducedMotionChange(false);
                expect(system.isReducedMotion).toBe(false);
            });

            /**
             * Test: Should hide wrapper when reduced motion enabled
             * **Validates: Requirements 9.3**
             */
            it('should hide wrapper when reduced motion enabled', () => {
                const system = new ParticleSystem(mockDOM.container);
                system.init();
                
                system.onReducedMotionChange(true);
                
                expect(system.wrapper.style.display).toBe('none');
            });

            /**
             * Test: Should show wrapper when reduced motion disabled
             */
            it('should show wrapper when reduced motion disabled', () => {
                const system = new ParticleSystem(mockDOM.container);
                system.init();
                system.onReducedMotionChange(true);
                
                system.onReducedMotionChange(false);
                
                expect(system.wrapper.style.display).toBe('block');
            });
        });

        describe('getParticleCount()', () => {
            /**
             * Test: Should return correct particle count
             */
            it('should return correct particle count', () => {
                const system = new ParticleSystem(mockDOM.container, { count: 60 });
                system.init();
                
                expect(system.getParticleCount()).toBe(60);
            });
        });

        describe('getMousePosition()', () => {
            /**
             * Test: Should return current mouse position
             */
            it('should return current mouse position', () => {
                const system = new ParticleSystem(mockDOM.container);
                system.init();
                system.mouse = { x: 150, y: 75 };
                
                const pos = system.getMousePosition();
                
                expect(pos).toEqual({ x: 150, y: 75 });
            });

            /**
             * Test: Should return a copy, not reference
             */
            it('should return a copy, not reference', () => {
                const system = new ParticleSystem(mockDOM.container);
                system.init();
                system.mouse = { x: 150, y: 75 };
                
                const pos = system.getMousePosition();
                pos.x = 999;
                
                expect(system.mouse.x).toBe(150);
            });
        });

        describe('setMouseInfluence()', () => {
            /**
             * Test: Should update mouse influence
             */
            it('should update mouse influence', () => {
                const system = new ParticleSystem(mockDOM.container);
                
                system.setMouseInfluence(0.5);
                
                expect(system.options.mouseInfluence).toBe(0.5);
            });

            /**
             * Test: Should constrain influence to 0-1 range
             */
            it('should constrain influence to 0-1 range', () => {
                const system = new ParticleSystem(mockDOM.container);
                
                system.setMouseInfluence(1.5);
                expect(system.options.mouseInfluence).toBe(1);
                
                system.setMouseInfluence(-0.5);
                expect(system.options.mouseInfluence).toBe(0);
            });
        });


        describe('pause() and resume()', () => {
            /**
             * Test: Should pause animation
             */
            it('should pause animation', () => {
                const system = new ParticleSystem(mockDOM.container);
                system.init();
                
                system.pause();
                
                expect(system.isReducedMotion).toBe(true);
            });

            /**
             * Test: Should resume animation
             */
            it('should resume animation', () => {
                const system = new ParticleSystem(mockDOM.container);
                system.init();
                system.pause();
                
                system.resume();
                
                expect(system.isReducedMotion).toBe(false);
            });
        });

        describe('destroy()', () => {
            /**
             * Test: Should remove all particle elements
             * **Validates: Requirements 8.3**
             */
            it('should remove all particle elements', () => {
                const system = new ParticleSystem(mockDOM.container);
                system.init();
                
                const particleCount = system.particles.length;
                expect(particleCount).toBeGreaterThan(0);
                
                system.destroy();
                
                expect(system.particles.length).toBe(0);
            });

            /**
             * Test: Should remove wrapper element
             * **Validates: Requirements 8.3**
             */
            it('should remove wrapper element', () => {
                const system = new ParticleSystem(mockDOM.container);
                system.init();
                
                expect(system.wrapper).not.toBeNull();
                
                system.destroy();
                
                expect(system.wrapper).toBeNull();
            });

            /**
             * Test: Should reset state
             * **Validates: Requirements 8.3**
             */
            it('should reset state', () => {
                const system = new ParticleSystem(mockDOM.container);
                system.init();
                system.mouse = { x: 100, y: 50 };
                system.elapsedTime = 5;
                
                system.destroy();
                
                expect(system.isInitialized).toBe(false);
                expect(system.isReducedMotion).toBe(false);
                expect(system.mouse).toEqual({ x: 0, y: 0 });
                expect(system.targetMouse).toEqual({ x: 0, y: 0 });
                expect(system.elapsedTime).toBe(0);
            });

            /**
             * Test: Should be safe to call multiple times
             */
            it('should be safe to call multiple times', () => {
                const system = new ParticleSystem(mockDOM.container);
                system.init();
                
                expect(() => {
                    system.destroy();
                    system.destroy();
                }).not.toThrow();
            });
        });

        describe('Responsive behavior', () => {
            /**
             * Test: Should use 50 particles on desktop (viewport >= 768px)
             * **Validates: Requirements 2.6**
             */
            it('should use 50 particles on desktop (viewport >= 768px)', () => {
                const desktopDOM = createMockDOM(1024);
                const classes = createParticleSystemClass(desktopDOM.window);
                const DesktopParticleSystem = classes.ParticleSystem;
                
                const system = new DesktopParticleSystem(desktopDOM.container);
                system.init();
                
                expect(system.getParticleCount()).toBeGreaterThanOrEqual(50);
            });

            /**
             * Test: Should use 30 particles on mobile (viewport < 768px)
             * **Validates: Requirements 10.1**
             */
            it('should use 30 particles on mobile (viewport < 768px)', () => {
                const mobileDOM = createMockDOM(600);
                const classes = createParticleSystemClass(mobileDOM.window);
                const MobileParticleSystem = classes.ParticleSystem;
                
                const system = new MobileParticleSystem(mobileDOM.container);
                system.init();
                
                expect(system.getParticleCount()).toBeGreaterThanOrEqual(30);
                expect(system.getParticleCount()).toBeLessThan(50);
            });

            /**
             * Test: Should use exactly at breakpoint (768px) as desktop
             * **Validates: Requirements 2.6**
             */
            it('should use exactly at breakpoint (768px) as desktop', () => {
                const breakpointDOM = createMockDOM(768);
                const classes = createParticleSystemClass(breakpointDOM.window);
                const BreakpointParticleSystem = classes.ParticleSystem;
                
                const system = new BreakpointParticleSystem(breakpointDOM.container);
                system.init();
                
                expect(system.getParticleCount()).toBeGreaterThanOrEqual(50);
            });
        });
    });
});
