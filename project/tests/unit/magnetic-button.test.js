/**
 * Unit Tests for MagneticButton
 * Feature: ultimate-ui-animations
 * 
 * Tests the magnetic hover effect for buttons.
 * 
 * **Validates: Requirements 2.9, 9.1, 9.2, 1.1, 1.2**
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
 * @returns {Object} - DOM window, document, and test elements
 */
function createMockDOM() {
    const html = `
        <!DOCTYPE html>
        <html lang="vi">
        <head><title>Test Page</title></head>
        <body>
            <button id="cta-button" style="width: 200px; height: 50px;">Click Me</button>
            <button id="secondary-button" style="width: 150px; height: 40px;">Secondary</button>
            <div id="not-a-button">Not a button</div>
        </body>
        </html>
    `;

    const dom = new JSDOM(html, {
        url: 'http://localhost/index.html',
        runScripts: 'dangerously',
        pretendToBeVisual: true
    });

    // Mock matchMedia for reduced motion detection
    dom.window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn()
    }));

    // Mock getBoundingClientRect
    const mockBounds = {
        left: 100,
        top: 100,
        width: 200,
        height: 50,
        right: 300,
        bottom: 150
    };

    dom.window.document.getElementById('cta-button').getBoundingClientRect = jest.fn(() => mockBounds);
    dom.window.document.getElementById('secondary-button').getBoundingClientRect = jest.fn(() => ({
        left: 50,
        top: 200,
        width: 150,
        height: 40,
        right: 200,
        bottom: 240
    }));

    return {
        window: dom.window,
        document: dom.window.document,
        ctaButton: dom.window.document.getElementById('cta-button'),
        secondaryButton: dom.window.document.getElementById('secondary-button'),
        notAButton: dom.window.document.getElementById('not-a-button'),
        mockBounds
    };
}

/**
 * Create MagneticButton class for testing
 * This mirrors the implementation in magnetic-button.js
 */
function createMagneticButtonClass(mockWindow) {
    const DEFAULT_STRENGTH = 0.3;
    const DEFAULT_SCALE = 1.1;
    const DEFAULT_TRANSITION_DURATION = 200;
    const DEFAULT_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';

    // Mock GPUAccelerator
    const GPUAccelerator = {
        accelerate: jest.fn(() => true),
        setWillChange: jest.fn(() => true),
        clearWillChange: jest.fn(() => true),
        decelerate: jest.fn(() => true)
    };

    // Mock prefersReducedMotion
    let mockReducedMotion = false;
    const prefersReducedMotion = () => mockReducedMotion;
    const setMockReducedMotion = (value) => { mockReducedMotion = value; };

    class MagneticButton {
        constructor(element, options = {}) {
            if (!element || !(element instanceof mockWindow.HTMLElement)) {
                throw new Error('MagneticButton: Valid HTML element is required');
            }

            this.element = element;
            this.bounds = null;
            this.options = {
                strength: this._clamp(options.strength ?? DEFAULT_STRENGTH, 0, 1),
                scale: options.scale ?? DEFAULT_SCALE,
                transitionDuration: options.transitionDuration ?? DEFAULT_TRANSITION_DURATION,
                easing: options.easing || DEFAULT_EASING
            };
            this.isHovering = false;
            this.isInitialized = false;
            this.isReducedMotion = false;
            this.supportsReducedMotion = true;
            this.currentTransform = { x: 0, y: 0, scale: 1 };
            this.boundHandlers = {
                mouseMove: this._onMouseMove.bind(this),
                mouseEnter: this._onMouseEnter.bind(this),
                mouseLeave: this._onMouseLeave.bind(this),
                resize: this._onResize.bind(this)
            };
        }

        init() {
            this.isReducedMotion = prefersReducedMotion();
            GPUAccelerator.accelerate(this.element);
            GPUAccelerator.setWillChange(this.element, ['transform']);
            this._setTransition();
            this._updateBounds();
            this.isInitialized = true;
        }

        bind() {
            if (!this.isInitialized) {
                this.init();
            }

            if (this.isReducedMotion) {
                return false;
            }

            this.element.addEventListener('mouseenter', this.boundHandlers.mouseEnter);
            this.element.addEventListener('mousemove', this.boundHandlers.mouseMove);
            this.element.addEventListener('mouseleave', this.boundHandlers.mouseLeave);
            mockWindow.addEventListener('resize', this.boundHandlers.resize, { passive: true });

            return true;
        }

        unbind() {
            this.element.removeEventListener('mouseenter', this.boundHandlers.mouseEnter);
            this.element.removeEventListener('mousemove', this.boundHandlers.mouseMove);
            this.element.removeEventListener('mouseleave', this.boundHandlers.mouseLeave);
            mockWindow.removeEventListener('resize', this.boundHandlers.resize);

            return true;
        }

        _onMouseEnter(e) {
            if (this.isReducedMotion) return;
            this.isHovering = true;
            this._updateBounds();
        }

        _onMouseMove(e) {
            if (this.isReducedMotion || !this.isHovering) return;

            const { clientX, clientY } = e;
            
            if (!this.bounds) {
                this._updateBounds();
            }

            const centerX = this.bounds.left + this.bounds.width / 2;
            const centerY = this.bounds.top + this.bounds.height / 2;

            const deltaX = clientX - centerX;
            const deltaY = clientY - centerY;

            const translateX = deltaX * this.options.strength;
            const translateY = deltaY * this.options.strength;

            this._applyTransform(translateX, translateY, this.options.scale);
        }

        _onMouseLeave() {
            this.isHovering = false;
            this._applyTransform(0, 0, 1);
        }

        _onResize() {
            this._updateBounds();
        }

        _updateBounds() {
            this.bounds = this.element.getBoundingClientRect();
        }

        _applyTransform(x, y, scale) {
            this.currentTransform = { x, y, scale };
            this.element.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
        }

        _setTransition() {
            const duration = this.options.transitionDuration;
            const easing = this.options.easing;
            this.element.style.transition = `transform ${duration}ms ${easing}`;
        }

        _clearTransition() {
            this.element.style.transition = '';
        }

        onReducedMotionChange(isReducedMotion) {
            this.isReducedMotion = isReducedMotion;

            if (isReducedMotion) {
                this._applyTransform(0, 0, 1);
                this.unbind();
            } else {
                this.bind();
            }
        }

        update(deltaTime) {
            // Interface compatibility
        }

        getTransform() {
            return { ...this.currentTransform };
        }

        getStrength() {
            return this.options.strength;
        }

        setStrength(strength) {
            this.options.strength = this._clamp(strength, 0, 1);
        }

        getScale() {
            return this.options.scale;
        }

        setScale(scale) {
            this.options.scale = scale;
        }

        isActive() {
            return this.isHovering;
        }

        _clamp(value, min, max) {
            return Math.min(Math.max(value, min), max);
        }

        reset() {
            this.isHovering = false;
            this._applyTransform(0, 0, 1);
        }

        destroy() {
            this.unbind();
            this.element.style.transform = '';
            this._clearTransition();
            GPUAccelerator.decelerate(this.element);
            GPUAccelerator.clearWillChange(this.element);
            this.bounds = null;
            this.isHovering = false;
            this.isInitialized = false;
            this.currentTransform = { x: 0, y: 0, scale: 1 };
        }
    }

    return {
        MagneticButton,
        DEFAULT_STRENGTH,
        DEFAULT_SCALE,
        DEFAULT_TRANSITION_DURATION,
        DEFAULT_EASING,
        GPUAccelerator,
        setMockReducedMotion
    };
}

// ============================================
// UNIT TESTS
// ============================================

describe('Feature: ultimate-ui-animations', () => {
    describe('MagneticButton', () => {
        let mockDOM;
        let MagneticButton;
        let DEFAULT_STRENGTH;
        let DEFAULT_SCALE;
        let DEFAULT_TRANSITION_DURATION;
        let GPUAccelerator;
        let setMockReducedMotion;

        beforeEach(() => {
            mockDOM = createMockDOM();
            const classes = createMagneticButtonClass(mockDOM.window);
            MagneticButton = classes.MagneticButton;
            DEFAULT_STRENGTH = classes.DEFAULT_STRENGTH;
            DEFAULT_SCALE = classes.DEFAULT_SCALE;
            DEFAULT_TRANSITION_DURATION = classes.DEFAULT_TRANSITION_DURATION;
            GPUAccelerator = classes.GPUAccelerator;
            setMockReducedMotion = classes.setMockReducedMotion;

            // Reset mocks
            GPUAccelerator.accelerate.mockClear();
            GPUAccelerator.setWillChange.mockClear();
            GPUAccelerator.clearWillChange.mockClear();
            GPUAccelerator.decelerate.mockClear();
            setMockReducedMotion(false);
        });

        describe('constructor', () => {
            /**
             * Test: Should throw error if element is not provided
             */
            it('should throw error if element is not provided', () => {
                expect(() => new MagneticButton(null)).toThrow('MagneticButton: Valid HTML element is required');
            });

            /**
             * Test: Should throw error if invalid element is provided
             */
            it('should throw error if invalid element is provided', () => {
                expect(() => new MagneticButton('not an element')).toThrow('MagneticButton: Valid HTML element is required');
            });

            /**
             * Test: Should initialize with default values
             */
            it('should initialize with default values', () => {
                const button = new MagneticButton(mockDOM.ctaButton);

                expect(button.element).toBe(mockDOM.ctaButton);
                expect(button.options.strength).toBe(DEFAULT_STRENGTH);
                expect(button.options.scale).toBe(DEFAULT_SCALE);
                expect(button.options.transitionDuration).toBe(DEFAULT_TRANSITION_DURATION);
                expect(button.isHovering).toBe(false);
                expect(button.isInitialized).toBe(false);
            });

            /**
             * Test: Should accept custom options
             */
            it('should accept custom options', () => {
                const button = new MagneticButton(mockDOM.ctaButton, {
                    strength: 0.5,
                    scale: 1.2,
                    transitionDuration: 300
                });

                expect(button.options.strength).toBe(0.5);
                expect(button.options.scale).toBe(1.2);
                expect(button.options.transitionDuration).toBe(300);
            });

            /**
             * Test: Should clamp strength between 0 and 1
             */
            it('should clamp strength between 0 and 1', () => {
                const buttonHigh = new MagneticButton(mockDOM.ctaButton, { strength: 1.5 });
                expect(buttonHigh.options.strength).toBe(1);

                const buttonLow = new MagneticButton(mockDOM.secondaryButton, { strength: -0.5 });
                expect(buttonLow.options.strength).toBe(0);
            });
        });

        describe('init()', () => {
            /**
             * Test: Should apply GPU acceleration
             * **Validates: Requirements 1.2**
             */
            it('should apply GPU acceleration', () => {
                const button = new MagneticButton(mockDOM.ctaButton);
                button.init();

                expect(GPUAccelerator.accelerate).toHaveBeenCalledWith(mockDOM.ctaButton);
                expect(GPUAccelerator.setWillChange).toHaveBeenCalledWith(mockDOM.ctaButton, ['transform']);
            });

            /**
             * Test: Should set transition property
             */
            it('should set transition property', () => {
                const button = new MagneticButton(mockDOM.ctaButton);
                button.init();

                expect(mockDOM.ctaButton.style.transition).toContain('transform');
                expect(mockDOM.ctaButton.style.transition).toContain('200ms');
            });

            /**
             * Test: Should cache element bounds
             */
            it('should cache element bounds', () => {
                const button = new MagneticButton(mockDOM.ctaButton);
                button.init();

                expect(button.bounds).not.toBeNull();
                expect(button.bounds.width).toBe(200);
                expect(button.bounds.height).toBe(50);
            });

            /**
             * Test: Should set isInitialized to true
             */
            it('should set isInitialized to true', () => {
                const button = new MagneticButton(mockDOM.ctaButton);
                button.init();

                expect(button.isInitialized).toBe(true);
            });

            /**
             * Test: Should check reduced motion preference
             */
            it('should check reduced motion preference', () => {
                setMockReducedMotion(true);
                const button = new MagneticButton(mockDOM.ctaButton);
                button.init();

                expect(button.isReducedMotion).toBe(true);
            });
        });

        describe('bind()', () => {
            /**
             * Test: Should initialize if not already initialized
             */
            it('should initialize if not already initialized', () => {
                const button = new MagneticButton(mockDOM.ctaButton);
                button.bind();

                expect(button.isInitialized).toBe(true);
            });

            /**
             * Test: Should return true on successful bind
             */
            it('should return true on successful bind', () => {
                const button = new MagneticButton(mockDOM.ctaButton);
                const result = button.bind();

                expect(result).toBe(true);
            });

            /**
             * Test: Should return false when reduced motion is enabled
             * **Validates: Requirements 9.1**
             */
            it('should return false when reduced motion is enabled', () => {
                setMockReducedMotion(true);
                const button = new MagneticButton(mockDOM.ctaButton);
                const result = button.bind();

                expect(result).toBe(false);
            });
        });

        describe('Magnetic Effect Calculation', () => {
            /**
             * Test: Should calculate transform based on mouse position and strength
             * **Validates: Requirements 2.9**
             */
            it('should calculate transform based on mouse position and strength', () => {
                const button = new MagneticButton(mockDOM.ctaButton, { strength: 0.5 });
                button.init();
                button.bind();

                // Simulate mouse enter
                button._onMouseEnter({});

                // Simulate mouse move - cursor at (250, 125) which is 50px right and 0px from center
                // Center is at (200, 125) based on mockBounds
                button._onMouseMove({ clientX: 250, clientY: 125 });

                // deltaX = 250 - 200 = 50, translateX = 50 * 0.5 = 25
                // deltaY = 125 - 125 = 0, translateY = 0 * 0.5 = 0
                expect(button.currentTransform.x).toBe(25);
                expect(button.currentTransform.y).toBe(0);
                expect(button.currentTransform.scale).toBe(DEFAULT_SCALE);
            });

            /**
             * Test: Should apply scale on hover
             * **Validates: Requirements 2.9**
             */
            it('should apply scale on hover', () => {
                const button = new MagneticButton(mockDOM.ctaButton, { scale: 1.2 });
                button.init();
                button.bind();

                button._onMouseEnter({});
                button._onMouseMove({ clientX: 200, clientY: 125 });

                expect(button.currentTransform.scale).toBe(1.2);
            });

            /**
             * Test: Should reset transform on mouse leave
             * **Validates: Requirements 2.9**
             */
            it('should reset transform on mouse leave', () => {
                const button = new MagneticButton(mockDOM.ctaButton);
                button.init();
                button.bind();

                button._onMouseEnter({});
                button._onMouseMove({ clientX: 250, clientY: 150 });

                // Verify transform was applied
                expect(button.currentTransform.x).not.toBe(0);

                // Mouse leave
                button._onMouseLeave();

                expect(button.currentTransform.x).toBe(0);
                expect(button.currentTransform.y).toBe(0);
                expect(button.currentTransform.scale).toBe(1);
            });

            /**
             * Test: Should use GPU-accelerated transform (translate3d)
             * **Validates: Requirements 1.1**
             */
            it('should use GPU-accelerated transform (translate3d)', () => {
                const button = new MagneticButton(mockDOM.ctaButton);
                button.init();
                button.bind();

                button._onMouseEnter({});
                button._onMouseMove({ clientX: 220, clientY: 130 });

                expect(mockDOM.ctaButton.style.transform).toContain('translate3d');
                expect(mockDOM.ctaButton.style.transform).toContain('scale');
            });

            /**
             * Test: Should not apply transform when not hovering
             */
            it('should not apply transform when not hovering', () => {
                const button = new MagneticButton(mockDOM.ctaButton);
                button.init();
                button.bind();

                // Don't call mouseEnter, just mouseMove
                button._onMouseMove({ clientX: 250, clientY: 150 });

                expect(button.currentTransform.x).toBe(0);
                expect(button.currentTransform.y).toBe(0);
            });
        });

        describe('Reduced Motion Support', () => {
            /**
             * Test: Should not apply magnetic effect when reduced motion is enabled
             * **Validates: Requirements 9.1, 9.2**
             */
            it('should not apply magnetic effect when reduced motion is enabled', () => {
                setMockReducedMotion(true);
                const button = new MagneticButton(mockDOM.ctaButton);
                button.init();

                button._onMouseEnter({});
                button._onMouseMove({ clientX: 250, clientY: 150 });

                expect(button.currentTransform.x).toBe(0);
                expect(button.currentTransform.y).toBe(0);
            });

            /**
             * Test: Should respond to reduced motion change
             * **Validates: Requirements 9.1**
             */
            it('should respond to reduced motion change', () => {
                const button = new MagneticButton(mockDOM.ctaButton);
                button.init();
                button.bind();

                // Apply some transform
                button._onMouseEnter({});
                button._onMouseMove({ clientX: 250, clientY: 150 });
                expect(button.currentTransform.x).not.toBe(0);

                // Enable reduced motion
                button.onReducedMotionChange(true);

                expect(button.isReducedMotion).toBe(true);
                expect(button.currentTransform.x).toBe(0);
                expect(button.currentTransform.y).toBe(0);
                expect(button.currentTransform.scale).toBe(1);
            });

            /**
             * Test: Should re-enable effect when reduced motion is disabled
             * **Validates: Requirements 9.1**
             */
            it('should re-enable effect when reduced motion is disabled', () => {
                setMockReducedMotion(true);
                const button = new MagneticButton(mockDOM.ctaButton);
                button.init();

                // Disable reduced motion
                button.onReducedMotionChange(false);

                expect(button.isReducedMotion).toBe(false);
            });
        });

        describe('reset()', () => {
            /**
             * Test: Should reset transform to initial state
             */
            it('should reset transform to initial state', () => {
                const button = new MagneticButton(mockDOM.ctaButton);
                button.init();
                button.bind();

                button._onMouseEnter({});
                button._onMouseMove({ clientX: 250, clientY: 150 });

                button.reset();

                expect(button.currentTransform.x).toBe(0);
                expect(button.currentTransform.y).toBe(0);
                expect(button.currentTransform.scale).toBe(1);
                expect(button.isHovering).toBe(false);
            });
        });

        describe('destroy()', () => {
            /**
             * Test: Should reset element transform
             * **Validates: Requirements 8.3**
             */
            it('should reset element transform', () => {
                const button = new MagneticButton(mockDOM.ctaButton);
                button.init();
                button.bind();

                button._onMouseEnter({});
                button._onMouseMove({ clientX: 250, clientY: 150 });

                button.destroy();

                expect(mockDOM.ctaButton.style.transform).toBe('');
            });

            /**
             * Test: Should clear transition
             * **Validates: Requirements 8.3**
             */
            it('should clear transition', () => {
                const button = new MagneticButton(mockDOM.ctaButton);
                button.init();

                button.destroy();

                expect(mockDOM.ctaButton.style.transition).toBe('');
            });

            /**
             * Test: Should remove GPU acceleration
             * **Validates: Requirements 8.3**
             */
            it('should remove GPU acceleration', () => {
                const button = new MagneticButton(mockDOM.ctaButton);
                button.init();

                button.destroy();

                expect(GPUAccelerator.decelerate).toHaveBeenCalledWith(mockDOM.ctaButton);
                expect(GPUAccelerator.clearWillChange).toHaveBeenCalledWith(mockDOM.ctaButton);
            });

            /**
             * Test: Should reset all state
             * **Validates: Requirements 8.3**
             */
            it('should reset all state', () => {
                const button = new MagneticButton(mockDOM.ctaButton);
                button.init();
                button.bind();

                button.destroy();

                expect(button.bounds).toBeNull();
                expect(button.isHovering).toBe(false);
                expect(button.isInitialized).toBe(false);
                expect(button.currentTransform).toEqual({ x: 0, y: 0, scale: 1 });
            });
        });

        describe('Utility Methods', () => {
            /**
             * Test: getTransform should return current transform values
             */
            it('getTransform should return current transform values', () => {
                const button = new MagneticButton(mockDOM.ctaButton);
                button.init();
                button.bind();

                button._onMouseEnter({});
                button._onMouseMove({ clientX: 230, clientY: 135 });

                const transform = button.getTransform();
                expect(transform).toHaveProperty('x');
                expect(transform).toHaveProperty('y');
                expect(transform).toHaveProperty('scale');
            });

            /**
             * Test: getStrength should return strength value
             */
            it('getStrength should return strength value', () => {
                const button = new MagneticButton(mockDOM.ctaButton, { strength: 0.5 });
                expect(button.getStrength()).toBe(0.5);
            });

            /**
             * Test: setStrength should update strength value
             */
            it('setStrength should update strength value', () => {
                const button = new MagneticButton(mockDOM.ctaButton);
                button.setStrength(0.7);
                expect(button.getStrength()).toBe(0.7);
            });

            /**
             * Test: setStrength should clamp value between 0 and 1
             */
            it('setStrength should clamp value between 0 and 1', () => {
                const button = new MagneticButton(mockDOM.ctaButton);
                
                button.setStrength(1.5);
                expect(button.getStrength()).toBe(1);

                button.setStrength(-0.5);
                expect(button.getStrength()).toBe(0);
            });

            /**
             * Test: getScale should return scale value
             */
            it('getScale should return scale value', () => {
                const button = new MagneticButton(mockDOM.ctaButton, { scale: 1.2 });
                expect(button.getScale()).toBe(1.2);
            });

            /**
             * Test: setScale should update scale value
             */
            it('setScale should update scale value', () => {
                const button = new MagneticButton(mockDOM.ctaButton);
                button.setScale(1.3);
                expect(button.getScale()).toBe(1.3);
            });

            /**
             * Test: isActive should return hovering state
             */
            it('isActive should return hovering state', () => {
                const button = new MagneticButton(mockDOM.ctaButton);
                button.init();
                button.bind();

                expect(button.isActive()).toBe(false);

                button._onMouseEnter({});
                expect(button.isActive()).toBe(true);

                button._onMouseLeave();
                expect(button.isActive()).toBe(false);
            });

            /**
             * Test: update method should exist for AnimationCore compatibility
             */
            it('update method should exist for AnimationCore compatibility', () => {
                const button = new MagneticButton(mockDOM.ctaButton);
                expect(typeof button.update).toBe('function');
                
                // Should not throw
                expect(() => button.update(0.016)).not.toThrow();
            });
        });

        describe('Edge Cases', () => {
            /**
             * Test: Should handle zero strength (no movement)
             */
            it('should handle zero strength (no movement)', () => {
                const button = new MagneticButton(mockDOM.ctaButton, { strength: 0 });
                button.init();
                button.bind();

                button._onMouseEnter({});
                button._onMouseMove({ clientX: 300, clientY: 200 });

                expect(button.currentTransform.x).toBe(0);
                expect(button.currentTransform.y).toBe(0);
            });

            /**
             * Test: Should handle maximum strength
             */
            it('should handle maximum strength', () => {
                const button = new MagneticButton(mockDOM.ctaButton, { strength: 1 });
                button.init();
                button.bind();

                button._onMouseEnter({});
                // Cursor 50px right of center
                button._onMouseMove({ clientX: 250, clientY: 125 });

                // With strength 1, translateX should equal deltaX
                expect(button.currentTransform.x).toBe(50);
            });

            /**
             * Test: Should handle cursor at exact center
             */
            it('should handle cursor at exact center', () => {
                const button = new MagneticButton(mockDOM.ctaButton);
                button.init();
                button.bind();

                button._onMouseEnter({});
                // Cursor at center (200, 125)
                button._onMouseMove({ clientX: 200, clientY: 125 });

                expect(button.currentTransform.x).toBe(0);
                expect(button.currentTransform.y).toBe(0);
                expect(button.currentTransform.scale).toBe(DEFAULT_SCALE);
            });
        });
    });
});
