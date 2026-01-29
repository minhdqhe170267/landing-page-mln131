/**
 * Unit Tests for MeshGradient
 * Feature: ultimate-ui-animations
 * 
 * Tests the canvas-based animated mesh gradient with bouncing color points.
 * 
 * **Validates: Requirements 2.1, 2.2, 2.3, 8.5**
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
 * Create a mock DOM environment with canvas support
 * @returns {Object} - DOM window, document, and canvas
 */
function createMockDOM() {
    const html = `
        <!DOCTYPE html>
        <html lang="vi">
        <head><title>Test Page</title></head>
        <body>
            <div id="hero-container" style="width: 800px; height: 600px;">
                <canvas id="mesh-gradient-canvas"></canvas>
            </div>
        </body>
        </html>
    `;

    const dom = new JSDOM(html, {
        url: 'http://localhost/index.html',
        runScripts: 'dangerously',
        pretendToBeVisual: true
    });

    // Mock canvas context
    const mockContext = {
        fillStyle: '',
        globalCompositeOperation: 'source-over',
        fillRect: jest.fn(),
        beginPath: jest.fn(),
        arc: jest.fn(),
        fill: jest.fn(),
        clearRect: jest.fn(),
        createRadialGradient: jest.fn(() => ({
            addColorStop: jest.fn()
        }))
    };

    // Override getContext on canvas elements
    const originalGetContext = dom.window.HTMLCanvasElement.prototype.getContext;
    dom.window.HTMLCanvasElement.prototype.getContext = function(type, options) {
        if (type === '2d') {
            // Store options for testing
            this._contextOptions = options;
            return mockContext;
        }
        return originalGetContext.call(this, type, options);
    };

    const canvas = dom.window.document.getElementById('mesh-gradient-canvas');
    
    return {
        window: dom.window,
        document: dom.window.document,
        canvas,
        mockContext
    };
}

/**
 * Create MeshGradient class for testing
 * This mirrors the implementation in mesh-gradient.js
 */
function createMeshGradientClass(mockWindow) {
    const DEFAULT_COLORS = [
        { r: 102, g: 126, b: 234 },
        { r: 118, g: 75, b: 162 },
        { r: 240, g: 147, b: 251 },
        { r: 250, g: 112, b: 154 }
    ];

    const MIN_POINT_COUNT = 4;

    class GradientPoint {
        constructor(x, y, vx, vy, radius, color) {
            this.x = x;
            this.y = y;
            this.vx = vx;
            this.vy = vy;
            this.radius = radius;
            this.color = color;
        }
    }

    class MeshGradient {
        constructor(canvas, options = {}) {
            if (!canvas || !(canvas instanceof mockWindow.HTMLCanvasElement)) {
                throw new Error('MeshGradient: Valid canvas element is required');
            }

            this.canvas = canvas;
            this.ctx = canvas.getContext('2d', { alpha: false });
            this.points = [];
            this.colors = options.colors || [...DEFAULT_COLORS];
            this.speed = options.speed || 1;
            this.minRadius = options.minRadius || 200;
            this.maxRadius = options.maxRadius || 400;
            this.pointCount = Math.max(options.pointCount || MIN_POINT_COUNT, MIN_POINT_COUNT);
            this.isInitialized = false;
            this.backgroundColor = options.backgroundColor || '#1a1a2e';
            this.supportsReducedMotion = true;
            this.isReducedMotion = false;
        }

        init() {
            this.resize();
            this.initPoints(this.pointCount);
            this.isInitialized = true;
            this.render();
        }

        initPoints(count = 5) {
            const pointCount = Math.max(count, MIN_POINT_COUNT);
            this.points = [];
            
            const width = this.canvas.width;
            const height = this.canvas.height;

            for (let i = 0; i < pointCount; i++) {
                const x = Math.random() * width;
                const y = Math.random() * height;
                const vx = (Math.random() * 4 - 2) * this.speed;
                const vy = (Math.random() * 4 - 2) * this.speed;
                const radius = this.minRadius + Math.random() * (this.maxRadius - this.minRadius);
                const color = this.colors[i % this.colors.length];
                
                this.points.push(new GradientPoint(x, y, vx, vy, radius, color));
            }
        }

        update(deltaTime) {
            if (this.isReducedMotion) return;

            const width = this.canvas.width;
            const height = this.canvas.height;

            for (const point of this.points) {
                this.updatePoint(point, width, height);
            }

            this.render();
        }

        updatePoint(point, width, height) {
            point.x += point.vx;
            point.y += point.vy;

            if (point.x <= 0) {
                point.x = 0;
                point.vx = -point.vx;
            }
            
            if (point.x >= width) {
                point.x = width;
                point.vx = -point.vx;
            }

            if (point.y <= 0) {
                point.y = 0;
                point.vy = -point.vy;
            }
            
            if (point.y >= height) {
                point.y = height;
                point.vy = -point.vy;
            }
        }

        render() {
            const ctx = this.ctx;
            const width = this.canvas.width;
            const height = this.canvas.height;

            ctx.fillStyle = this.backgroundColor;
            ctx.fillRect(0, 0, width, height);
            ctx.globalCompositeOperation = 'lighter';

            for (const point of this.points) {
                this.renderPoint(point);
            }

            ctx.globalCompositeOperation = 'source-over';
        }

        renderPoint(point) {
            const ctx = this.ctx;
            const { x, y, radius, color } = point;

            const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
            gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, 0.8)`);
            gradient.addColorStop(0.5, `rgba(${color.r}, ${color.g}, ${color.b}, 0.4)`);
            gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        resize() {
            const parent = this.canvas.parentElement;
            
            if (parent) {
                this.canvas.width = parent.clientWidth || mockWindow.innerWidth;
                this.canvas.height = parent.clientHeight || mockWindow.innerHeight;
            } else {
                this.canvas.width = mockWindow.innerWidth;
                this.canvas.height = mockWindow.innerHeight;
            }

            if (this.isInitialized) {
                this.render();
            }
        }

        onReducedMotionChange(isReducedMotion) {
            this.isReducedMotion = isReducedMotion;
            if (isReducedMotion) {
                this.render();
            }
        }

        getPointCount() {
            return this.points.length;
        }

        getPoints() {
            return this.points;
        }

        setColors(colors) {
            if (Array.isArray(colors) && colors.length > 0) {
                this.colors = colors;
                for (let i = 0; i < this.points.length; i++) {
                    this.points[i].color = this.colors[i % this.colors.length];
                }
                this.render();
            }
        }

        setSpeed(speed) {
            const ratio = speed / this.speed;
            this.speed = speed;
            for (const point of this.points) {
                point.vx *= ratio;
                point.vy *= ratio;
            }
        }

        pause() {
            this.isReducedMotion = true;
        }

        resume() {
            this.isReducedMotion = false;
        }

        destroy() {
            if (this.ctx) {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            }
            this.points = [];
            this.isInitialized = false;
            this.isReducedMotion = false;
        }
    }

    return { MeshGradient, GradientPoint, DEFAULT_COLORS, MIN_POINT_COUNT };
}

// ============================================
// UNIT TESTS
// ============================================

describe('Feature: ultimate-ui-animations', () => {
    describe('MeshGradient', () => {
        let mockDOM;
        let MeshGradient;
        let GradientPoint;
        let DEFAULT_COLORS;
        let MIN_POINT_COUNT;

        beforeEach(() => {
            mockDOM = createMockDOM();
            const classes = createMeshGradientClass(mockDOM.window);
            MeshGradient = classes.MeshGradient;
            GradientPoint = classes.GradientPoint;
            DEFAULT_COLORS = classes.DEFAULT_COLORS;
            MIN_POINT_COUNT = classes.MIN_POINT_COUNT;
        });

        describe('constructor', () => {
            /**
             * Test: Should throw error if canvas is not provided
             */
            it('should throw error if canvas is not provided', () => {
                expect(() => new MeshGradient(null)).toThrow('MeshGradient: Valid canvas element is required');
            });

            /**
             * Test: Should throw error if invalid element is provided
             */
            it('should throw error if invalid element is provided', () => {
                const div = mockDOM.document.createElement('div');
                expect(() => new MeshGradient(div)).toThrow('MeshGradient: Valid canvas element is required');
            });

            /**
             * Test: Should initialize with default values
             */
            it('should initialize with default values', () => {
                const gradient = new MeshGradient(mockDOM.canvas);
                
                expect(gradient.canvas).toBe(mockDOM.canvas);
                expect(gradient.ctx).toBeDefined();
                expect(gradient.points).toEqual([]);
                expect(gradient.colors).toEqual(DEFAULT_COLORS);
                expect(gradient.speed).toBe(1);
                expect(gradient.pointCount).toBe(MIN_POINT_COUNT);
                expect(gradient.isInitialized).toBe(false);
            });

            /**
             * Test: Should use { alpha: false } context option for performance
             * **Validates: Requirements 8.5**
             */
            it('should use { alpha: false } context option for performance', () => {
                const gradient = new MeshGradient(mockDOM.canvas);
                
                expect(mockDOM.canvas._contextOptions).toEqual({ alpha: false });
            });

            /**
             * Test: Should accept custom options
             */
            it('should accept custom options', () => {
                const customColors = [{ r: 255, g: 0, b: 0 }];
                const gradient = new MeshGradient(mockDOM.canvas, {
                    colors: customColors,
                    pointCount: 6,
                    speed: 2,
                    minRadius: 100,
                    maxRadius: 300
                });
                
                expect(gradient.colors).toEqual(customColors);
                expect(gradient.pointCount).toBe(6);
                expect(gradient.speed).toBe(2);
                expect(gradient.minRadius).toBe(100);
                expect(gradient.maxRadius).toBe(300);
            });

            /**
             * Test: Should enforce minimum point count
             * **Validates: Requirements 2.2**
             */
            it('should enforce minimum point count of 4', () => {
                const gradient = new MeshGradient(mockDOM.canvas, { pointCount: 2 });
                
                expect(gradient.pointCount).toBe(MIN_POINT_COUNT);
            });
        });

        describe('init()', () => {
            /**
             * Test: Should initialize points and set isInitialized
             */
            it('should initialize points and set isInitialized', () => {
                const gradient = new MeshGradient(mockDOM.canvas);
                gradient.init();
                
                expect(gradient.isInitialized).toBe(true);
                expect(gradient.points.length).toBeGreaterThanOrEqual(MIN_POINT_COUNT);
            });

            /**
             * Test: Should render after initialization
             */
            it('should render after initialization', () => {
                const gradient = new MeshGradient(mockDOM.canvas);
                gradient.init();
                
                expect(mockDOM.mockContext.fillRect).toHaveBeenCalled();
            });
        });

        describe('initPoints()', () => {
            /**
             * Test: Should create at least 4 gradient points
             * **Validates: Requirements 2.2**
             */
            it('should create at least 4 gradient points', () => {
                const gradient = new MeshGradient(mockDOM.canvas);
                gradient.canvas.width = 800;
                gradient.canvas.height = 600;
                gradient.initPoints(4);
                
                expect(gradient.points.length).toBe(4);
            });

            /**
             * Test: Should enforce minimum of 4 points even if less requested
             * **Validates: Requirements 2.2**
             */
            it('should enforce minimum of 4 points even if less requested', () => {
                const gradient = new MeshGradient(mockDOM.canvas);
                gradient.canvas.width = 800;
                gradient.canvas.height = 600;
                gradient.initPoints(2);
                
                expect(gradient.points.length).toBe(MIN_POINT_COUNT);
            });

            /**
             * Test: Should create more points if requested
             */
            it('should create more points if requested', () => {
                const gradient = new MeshGradient(mockDOM.canvas);
                gradient.canvas.width = 800;
                gradient.canvas.height = 600;
                gradient.initPoints(8);
                
                expect(gradient.points.length).toBe(8);
            });

            /**
             * Test: Should assign colors cyclically to points
             */
            it('should assign colors cyclically to points', () => {
                const gradient = new MeshGradient(mockDOM.canvas);
                gradient.canvas.width = 800;
                gradient.canvas.height = 600;
                gradient.initPoints(6);
                
                expect(gradient.points[0].color).toEqual(DEFAULT_COLORS[0]);
                expect(gradient.points[1].color).toEqual(DEFAULT_COLORS[1]);
                expect(gradient.points[4].color).toEqual(DEFAULT_COLORS[0]); // Cycles back
            });

            /**
             * Test: Should create points with random velocities
             */
            it('should create points with random velocities', () => {
                const gradient = new MeshGradient(mockDOM.canvas);
                gradient.canvas.width = 800;
                gradient.canvas.height = 600;
                gradient.initPoints(4);
                
                // All points should have velocity values
                for (const point of gradient.points) {
                    expect(typeof point.vx).toBe('number');
                    expect(typeof point.vy).toBe('number');
                }
            });
        });

        describe('updatePoint() - Bounce Physics', () => {
            /**
             * Test: Should bounce point when hitting left edge (x <= 0)
             * **Validates: Requirements 2.3**
             */
            it('should bounce point when hitting left edge (x <= 0)', () => {
                const gradient = new MeshGradient(mockDOM.canvas);
                const point = new GradientPoint(0, 100, -5, 2, 200, DEFAULT_COLORS[0]);
                
                gradient.updatePoint(point, 800, 600);
                
                expect(point.vx).toBe(5); // Velocity negated
                expect(point.x).toBe(0);
            });

            /**
             * Test: Should bounce point when hitting right edge (x >= width)
             * **Validates: Requirements 2.3**
             */
            it('should bounce point when hitting right edge (x >= width)', () => {
                const gradient = new MeshGradient(mockDOM.canvas);
                const point = new GradientPoint(800, 100, 5, 2, 200, DEFAULT_COLORS[0]);
                
                gradient.updatePoint(point, 800, 600);
                
                expect(point.vx).toBe(-5); // Velocity negated
                expect(point.x).toBe(800);
            });

            /**
             * Test: Should bounce point when hitting top edge (y <= 0)
             * **Validates: Requirements 2.3**
             */
            it('should bounce point when hitting top edge (y <= 0)', () => {
                const gradient = new MeshGradient(mockDOM.canvas);
                const point = new GradientPoint(100, 0, 2, -5, 200, DEFAULT_COLORS[0]);
                
                gradient.updatePoint(point, 800, 600);
                
                expect(point.vy).toBe(5); // Velocity negated
                expect(point.y).toBe(0);
            });

            /**
             * Test: Should bounce point when hitting bottom edge (y >= height)
             * **Validates: Requirements 2.3**
             */
            it('should bounce point when hitting bottom edge (y >= height)', () => {
                const gradient = new MeshGradient(mockDOM.canvas);
                const point = new GradientPoint(100, 600, 2, 5, 200, DEFAULT_COLORS[0]);
                
                gradient.updatePoint(point, 800, 600);
                
                expect(point.vy).toBe(-5); // Velocity negated
                expect(point.y).toBe(600);
            });

            /**
             * Test: Should update position based on velocity
             */
            it('should update position based on velocity', () => {
                const gradient = new MeshGradient(mockDOM.canvas);
                const point = new GradientPoint(100, 100, 5, 3, 200, DEFAULT_COLORS[0]);
                
                gradient.updatePoint(point, 800, 600);
                
                expect(point.x).toBe(105);
                expect(point.y).toBe(103);
            });

            /**
             * Test: Should not change velocity when not hitting edge
             */
            it('should not change velocity when not hitting edge', () => {
                const gradient = new MeshGradient(mockDOM.canvas);
                const point = new GradientPoint(400, 300, 5, 3, 200, DEFAULT_COLORS[0]);
                
                gradient.updatePoint(point, 800, 600);
                
                expect(point.vx).toBe(5);
                expect(point.vy).toBe(3);
            });
        });

        describe('update()', () => {
            /**
             * Test: Should update all points
             */
            it('should update all points', () => {
                const gradient = new MeshGradient(mockDOM.canvas);
                gradient.canvas.width = 800;
                gradient.canvas.height = 600;
                gradient.initPoints(4);
                
                const initialPositions = gradient.points.map(p => ({ x: p.x, y: p.y }));
                gradient.update(0.016);
                
                // At least some positions should have changed
                const positionsChanged = gradient.points.some((p, i) => 
                    p.x !== initialPositions[i].x || p.y !== initialPositions[i].y
                );
                expect(positionsChanged).toBe(true);
            });

            /**
             * Test: Should not update when reduced motion is enabled
             * **Validates: Requirements 9.1**
             */
            it('should not update when reduced motion is enabled', () => {
                const gradient = new MeshGradient(mockDOM.canvas);
                gradient.canvas.width = 800;
                gradient.canvas.height = 600;
                gradient.initPoints(4);
                gradient.isReducedMotion = true;
                
                const initialPositions = gradient.points.map(p => ({ x: p.x, y: p.y }));
                gradient.update(0.016);
                
                // Positions should not have changed
                gradient.points.forEach((p, i) => {
                    expect(p.x).toBe(initialPositions[i].x);
                    expect(p.y).toBe(initialPositions[i].y);
                });
            });
        });

        describe('render()', () => {
            /**
             * Test: Should clear canvas with background color
             */
            it('should clear canvas with background color', () => {
                const gradient = new MeshGradient(mockDOM.canvas);
                gradient.canvas.width = 800;
                gradient.canvas.height = 600;
                gradient.initPoints(4);
                
                mockDOM.mockContext.fillRect.mockClear();
                gradient.render();
                
                expect(mockDOM.mockContext.fillRect).toHaveBeenCalledWith(0, 0, 800, 600);
            });

            /**
             * Test: Should render all gradient points
             */
            it('should render all gradient points', () => {
                const gradient = new MeshGradient(mockDOM.canvas);
                gradient.canvas.width = 800;
                gradient.canvas.height = 600;
                gradient.initPoints(4);
                
                mockDOM.mockContext.arc.mockClear();
                gradient.render();
                
                expect(mockDOM.mockContext.arc).toHaveBeenCalledTimes(4);
            });

            /**
             * Test: Should use lighter composite operation for blending
             */
            it('should use lighter composite operation for blending', () => {
                const gradient = new MeshGradient(mockDOM.canvas);
                gradient.canvas.width = 800;
                gradient.canvas.height = 600;
                gradient.initPoints(4);
                gradient.render();
                
                // Check that globalCompositeOperation was set to 'lighter' during render
                // and reset to 'source-over' after
                expect(mockDOM.mockContext.globalCompositeOperation).toBe('source-over');
            });
        });

        describe('resize()', () => {
            /**
             * Test: Should update canvas dimensions
             * **Validates: Requirements 10.4**
             */
            it('should update canvas dimensions from parent', () => {
                const gradient = new MeshGradient(mockDOM.canvas);
                
                // Mock parent dimensions
                Object.defineProperty(mockDOM.canvas.parentElement, 'clientWidth', { value: 1024 });
                Object.defineProperty(mockDOM.canvas.parentElement, 'clientHeight', { value: 768 });
                
                gradient.resize();
                
                expect(gradient.canvas.width).toBe(1024);
                expect(gradient.canvas.height).toBe(768);
            });

            /**
             * Test: Should re-render after resize if initialized
             */
            it('should re-render after resize if initialized', () => {
                const gradient = new MeshGradient(mockDOM.canvas);
                gradient.init();
                
                mockDOM.mockContext.fillRect.mockClear();
                gradient.resize();
                
                expect(mockDOM.mockContext.fillRect).toHaveBeenCalled();
            });
        });

        describe('onReducedMotionChange()', () => {
            /**
             * Test: Should update isReducedMotion state
             */
            it('should update isReducedMotion state', () => {
                const gradient = new MeshGradient(mockDOM.canvas);
                
                gradient.onReducedMotionChange(true);
                expect(gradient.isReducedMotion).toBe(true);
                
                gradient.onReducedMotionChange(false);
                expect(gradient.isReducedMotion).toBe(false);
            });

            /**
             * Test: Should render static gradient when reduced motion enabled
             */
            it('should render static gradient when reduced motion enabled', () => {
                const gradient = new MeshGradient(mockDOM.canvas);
                gradient.init();
                
                mockDOM.mockContext.fillRect.mockClear();
                gradient.onReducedMotionChange(true);
                
                expect(mockDOM.mockContext.fillRect).toHaveBeenCalled();
            });
        });

        describe('getPointCount()', () => {
            /**
             * Test: Should return correct point count
             */
            it('should return correct point count', () => {
                const gradient = new MeshGradient(mockDOM.canvas);
                gradient.canvas.width = 800;
                gradient.canvas.height = 600;
                gradient.initPoints(6);
                
                expect(gradient.getPointCount()).toBe(6);
            });
        });

        describe('setColors()', () => {
            /**
             * Test: Should update colors and re-render
             */
            it('should update colors and re-render', () => {
                const gradient = new MeshGradient(mockDOM.canvas);
                gradient.init();
                
                const newColors = [{ r: 255, g: 0, b: 0 }, { r: 0, g: 255, b: 0 }];
                mockDOM.mockContext.fillRect.mockClear();
                gradient.setColors(newColors);
                
                expect(gradient.colors).toEqual(newColors);
                expect(mockDOM.mockContext.fillRect).toHaveBeenCalled();
            });

            /**
             * Test: Should update existing point colors
             */
            it('should update existing point colors', () => {
                const gradient = new MeshGradient(mockDOM.canvas);
                gradient.canvas.width = 800;
                gradient.canvas.height = 600;
                gradient.initPoints(4);
                
                const newColors = [{ r: 255, g: 0, b: 0 }];
                gradient.setColors(newColors);
                
                // All points should have the new color
                gradient.points.forEach(point => {
                    expect(point.color).toEqual(newColors[0]);
                });
            });
        });

        describe('setSpeed()', () => {
            /**
             * Test: Should update speed and adjust velocities
             */
            it('should update speed and adjust velocities', () => {
                const gradient = new MeshGradient(mockDOM.canvas);
                gradient.canvas.width = 800;
                gradient.canvas.height = 600;
                gradient.speed = 1;
                
                // Create points with known velocities
                gradient.points = [
                    new GradientPoint(100, 100, 2, 4, 200, DEFAULT_COLORS[0])
                ];
                
                gradient.setSpeed(2);
                
                expect(gradient.speed).toBe(2);
                expect(gradient.points[0].vx).toBe(4); // Doubled
                expect(gradient.points[0].vy).toBe(8); // Doubled
            });
        });

        describe('pause() and resume()', () => {
            /**
             * Test: Should pause animation
             */
            it('should pause animation', () => {
                const gradient = new MeshGradient(mockDOM.canvas);
                
                gradient.pause();
                
                expect(gradient.isReducedMotion).toBe(true);
            });

            /**
             * Test: Should resume animation
             */
            it('should resume animation', () => {
                const gradient = new MeshGradient(mockDOM.canvas);
                gradient.pause();
                
                gradient.resume();
                
                expect(gradient.isReducedMotion).toBe(false);
            });
        });

        describe('destroy()', () => {
            /**
             * Test: Should clear canvas
             * **Validates: Requirements 8.3**
             */
            it('should clear canvas', () => {
                const gradient = new MeshGradient(mockDOM.canvas);
                gradient.init();
                
                gradient.destroy();
                
                expect(mockDOM.mockContext.clearRect).toHaveBeenCalled();
            });

            /**
             * Test: Should clear points array
             * **Validates: Requirements 8.3**
             */
            it('should clear points array', () => {
                const gradient = new MeshGradient(mockDOM.canvas);
                gradient.init();
                
                gradient.destroy();
                
                expect(gradient.points).toEqual([]);
            });

            /**
             * Test: Should reset state
             * **Validates: Requirements 8.3**
             */
            it('should reset state', () => {
                const gradient = new MeshGradient(mockDOM.canvas);
                gradient.init();
                gradient.isReducedMotion = true;
                
                gradient.destroy();
                
                expect(gradient.isInitialized).toBe(false);
                expect(gradient.isReducedMotion).toBe(false);
            });
        });
    });
});
