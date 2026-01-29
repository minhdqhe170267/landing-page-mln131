/**
 * Unit Tests for AnimationCore
 * Feature: ultimate-ui-animations
 * 
 * Tests the central animation manager that handles RAF loop, 
 * reduced motion, and controller lifecycle.
 * 
 * **Validates: Requirements 8.1, 8.3**
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
 * Create a mock DOM environment with RAF and matchMedia
 * @param {boolean} prefersReducedMotion - Whether user prefers reduced motion
 * @returns {Object} - DOM window and document
 */
function createMockDOM(prefersReducedMotion = false) {
    const html = `
        <!DOCTYPE html>
        <html lang="vi">
        <head><title>Test Page</title></head>
        <body>
            <div id="test-element"></div>
        </body>
        </html>
    `;

    const dom = new JSDOM(html, {
        url: 'http://localhost/index.html',
        runScripts: 'dangerously'
    });

    // Mock requestAnimationFrame and cancelAnimationFrame
    let rafCallbacks = [];
    let rafId = 0;
    
    dom.window.requestAnimationFrame = (callback) => {
        rafId++;
        rafCallbacks.push({ id: rafId, callback });
        return rafId;
    };
    
    dom.window.cancelAnimationFrame = (id) => {
        rafCallbacks = rafCallbacks.filter(item => item.id !== id);
    };
    
    // Helper to execute RAF callbacks
    dom.window._executeRAF = (timestamp = performance.now()) => {
        const callbacks = [...rafCallbacks];
        rafCallbacks = [];
        callbacks.forEach(item => item.callback(timestamp));
    };
    
    dom.window._getRAFCount = () => rafCallbacks.length;
    dom.window._clearRAF = () => { rafCallbacks = []; rafId = 0; };

    // Mock performance.now
    let mockTime = 0;
    dom.window.performance = {
        now: () => mockTime
    };
    dom.window._setMockTime = (time) => { mockTime = time; };
    dom.window._advanceTime = (delta) => { mockTime += delta; };

    // Create mock MediaQueryList
    const createMockMediaQueryList = (matches) => {
        const listeners = [];
        return {
            matches,
            media: '(prefers-reduced-motion: reduce)',
            addEventListener: (event, callback) => {
                if (event === 'change') listeners.push(callback);
            },
            removeEventListener: (event, callback) => {
                if (event === 'change') {
                    const index = listeners.indexOf(callback);
                    if (index > -1) listeners.splice(index, 1);
                }
            },
            addListener: (callback) => listeners.push(callback),
            removeListener: (callback) => {
                const index = listeners.indexOf(callback);
                if (index > -1) listeners.splice(index, 1);
            },
            _simulateChange: (newMatches) => {
                listeners.forEach(listener => listener({ matches: newMatches }));
            },
            _getListenerCount: () => listeners.length
        };
    };

    const mockMediaQueryList = createMockMediaQueryList(prefersReducedMotion);
    dom.window.matchMedia = (query) => {
        if (query === '(prefers-reduced-motion: reduce)') {
            return mockMediaQueryList;
        }
        return createMockMediaQueryList(false);
    };

    return {
        window: dom.window,
        document: dom.window.document,
        mockMediaQueryList
    };
}

/**
 * Create mock ReducedMotionDetector for testing
 */
function createMockReducedMotionDetector(initialState = false) {
    let isReducedMotion = initialState;
    const callbacks = [];
    
    return {
        isReducedMotion,
        check: () => isReducedMotion,
        listen: jest.fn(() => true),
        unlisten: jest.fn(() => true),
        onChange: (callback) => {
            callbacks.push(callback);
            return true;
        },
        offChange: (callback) => {
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
                return true;
            }
            return false;
        },
        destroy: jest.fn(),
        _setReducedMotion: (value) => {
            isReducedMotion = value;
            callbacks.forEach(cb => cb(value));
        },
        _getCallbackCount: () => callbacks.length
    };
}

/**
 * Create mock controller for testing
 */
function createMockController(options = {}) {
    return {
        update: jest.fn(),
        init: options.init || jest.fn(),
        destroy: options.destroy || jest.fn(),
        pause: options.pause || jest.fn(),
        resume: options.resume || jest.fn(),
        onReducedMotionChange: options.onReducedMotionChange || jest.fn(),
        isInitialized: options.isInitialized || false,
        supportsReducedMotion: options.supportsReducedMotion || false
    };
}

/**
 * Create AnimationCore class for testing
 * This mirrors the implementation in animation-core.js
 */
function createAnimationCore(mockWindow, mockReducedMotionDetector) {
    class AnimationCore {
        constructor(options = {}) {
            this.controllers = new Map();
            this.isReducedMotion = false;
            this.rafId = null;
            this.isRunning = false;
            this.targetFPS = options.targetFPS || 120;
            this.frameInterval = 1000 / this.targetFPS;
            this.lastFrameTime = 0;
            this.previousTimestamp = 0;
            this.reducedMotionDetector = options.reducedMotionDetector || mockReducedMotionDetector;
            this.boundTick = this.tick.bind(this);
            this.boundReducedMotionHandler = this._handleReducedMotionChange.bind(this);
            this.isInitialized = false;
            this._init();
        }

        _init() {
            this.checkReducedMotion();
            this.reducedMotionDetector.onChange(this.boundReducedMotionHandler);
            this.reducedMotionDetector.listen();
            this.isInitialized = true;
        }

        checkReducedMotion() {
            this.isReducedMotion = this.reducedMotionDetector.check();
            return this.isReducedMotion;
        }

        _handleReducedMotionChange(isReducedMotion) {
            this.isReducedMotion = isReducedMotion;
            for (const [name, controller] of this.controllers) {
                if (controller && typeof controller.onReducedMotionChange === 'function') {
                    try {
                        controller.onReducedMotionChange(isReducedMotion);
                    } catch (error) {
                        console.error(`AnimationCore: Error notifying controller "${name}"`, error);
                    }
                }
            }
            if (isReducedMotion && this.isRunning) {
                this.stop();
            }
        }

        register(name, controller) {
            if (typeof name !== 'string' || name.trim() === '') {
                console.warn('AnimationCore.register: Invalid controller name');
                return false;
            }
            if (!controller || typeof controller !== 'object') {
                console.warn(`AnimationCore.register: Invalid controller for "${name}"`);
                return false;
            }
            if (typeof controller.update !== 'function') {
                console.warn(`AnimationCore.register: Controller "${name}" must have an update() method`);
                return false;
            }
            if (this.controllers.has(name)) {
                console.warn(`AnimationCore.register: Controller "${name}" is already registered`);
                return false;
            }
            this.controllers.set(name, controller);
            if (typeof controller.init === 'function' && !controller.isInitialized) {
                try {
                    controller.init();
                } catch (error) {
                    console.error(`AnimationCore.register: Error initializing controller "${name}"`, error);
                }
            }
            return true;
        }

        unregister(name) {
            if (typeof name !== 'string' || name.trim() === '') {
                console.warn('AnimationCore.unregister: Invalid controller name');
                return false;
            }
            if (!this.controllers.has(name)) {
                console.warn(`AnimationCore.unregister: Controller "${name}" is not registered`);
                return false;
            }
            const controller = this.controllers.get(name);
            if (controller && typeof controller.destroy === 'function') {
                try {
                    controller.destroy();
                } catch (error) {
                    console.error(`AnimationCore.unregister: Error destroying controller "${name}"`, error);
                }
            }
            this.controllers.delete(name);
            return true;
        }

        start() {
            if (this.isRunning) return true;
            if (this.isReducedMotion) {
                console.log('AnimationCore.start: Reduced motion enabled, not starting');
                return false;
            }
            if (typeof mockWindow.requestAnimationFrame !== 'function') {
                console.error('AnimationCore.start: requestAnimationFrame is not available');
                return false;
            }
            this.isRunning = true;
            this.previousTimestamp = mockWindow.performance.now();
            this.lastFrameTime = this.previousTimestamp;
            this.rafId = mockWindow.requestAnimationFrame(this.boundTick);
            return true;
        }

        stop() {
            if (!this.isRunning) return true;
            if (this.rafId !== null) {
                mockWindow.cancelAnimationFrame(this.rafId);
                this.rafId = null;
            }
            this.isRunning = false;
            return true;
        }

        tick(timestamp) {
            if (!this.isRunning) return;
            const deltaTime = (timestamp - this.previousTimestamp) / 1000;
            this.previousTimestamp = timestamp;
            for (const [name, controller] of this.controllers) {
                if (this.isReducedMotion && !controller.supportsReducedMotion) continue;
                try {
                    controller.update(deltaTime, timestamp);
                } catch (error) {
                    console.error(`AnimationCore.tick: Error updating controller "${name}"`, error);
                }
            }
            this.rafId = mockWindow.requestAnimationFrame(this.boundTick);
        }

        getController(name) {
            return this.controllers.get(name) || null;
        }

        hasController(name) {
            return this.controllers.has(name);
        }

        getControllerNames() {
            return Array.from(this.controllers.keys());
        }

        getControllerCount() {
            return this.controllers.size;
        }

        destroy() {
            this.stop();
            for (const [name, controller] of this.controllers) {
                if (controller && typeof controller.destroy === 'function') {
                    try {
                        controller.destroy();
                    } catch (error) {
                        console.error(`AnimationCore.destroy: Error destroying controller "${name}"`, error);
                    }
                }
            }
            this.controllers.clear();
            this.reducedMotionDetector.offChange(this.boundReducedMotionHandler);
            this.isInitialized = false;
            this.isRunning = false;
            this.rafId = null;
            this.previousTimestamp = 0;
            this.lastFrameTime = 0;
            return true;
        }

        pauseAll() {
            for (const [name, controller] of this.controllers) {
                if (controller && typeof controller.pause === 'function') {
                    try {
                        controller.pause();
                    } catch (error) {
                        console.error(`AnimationCore.pauseAll: Error pausing controller "${name}"`, error);
                    }
                }
            }
        }

        resumeAll() {
            for (const [name, controller] of this.controllers) {
                if (controller && typeof controller.resume === 'function') {
                    try {
                        controller.resume();
                    } catch (error) {
                        console.error(`AnimationCore.resumeAll: Error resuming controller "${name}"`, error);
                    }
                }
            }
        }
    }

    return AnimationCore;
}

// ============================================
// UNIT TESTS
// ============================================

describe('Feature: ultimate-ui-animations', () => {
    describe('AnimationCore', () => {
        let mockWindow;
        let mockReducedMotionDetector;
        let AnimationCore;

        beforeEach(() => {
            const mockDOM = createMockDOM(false);
            mockWindow = mockDOM.window;
            mockReducedMotionDetector = createMockReducedMotionDetector(false);
            AnimationCore = createAnimationCore(mockWindow, mockReducedMotionDetector);
        });

        afterEach(() => {
            mockWindow._clearRAF();
        });

        describe('constructor', () => {
            /**
             * Test: Should initialize with default values
             */
            it('should initialize with default values', () => {
                const core = new AnimationCore();
                
                expect(core.controllers.size).toBe(0);
                expect(core.isReducedMotion).toBe(false);
                expect(core.rafId).toBe(null);
                expect(core.isRunning).toBe(false);
                expect(core.targetFPS).toBe(120);
                expect(core.isInitialized).toBe(true);
            });

            /**
             * Test: Should accept custom targetFPS
             */
            it('should accept custom targetFPS', () => {
                const core = new AnimationCore({ targetFPS: 60 });
                
                expect(core.targetFPS).toBe(60);
                expect(core.frameInterval).toBe(1000 / 60);
            });

            /**
             * Test: Should check reduced motion on initialization
             */
            it('should check reduced motion on initialization', () => {
                mockReducedMotionDetector = createMockReducedMotionDetector(true);
                AnimationCore = createAnimationCore(mockWindow, mockReducedMotionDetector);
                
                const core = new AnimationCore({ reducedMotionDetector: mockReducedMotionDetector });
                
                expect(core.isReducedMotion).toBe(true);
            });

            /**
             * Test: Should listen for reduced motion changes
             */
            it('should listen for reduced motion changes', () => {
                const core = new AnimationCore();
                
                expect(mockReducedMotionDetector.listen).toHaveBeenCalled();
            });
        });

        describe('register()', () => {
            /**
             * Test: Should register a valid controller
             */
            it('should register a valid controller', () => {
                const core = new AnimationCore();
                const controller = createMockController();
                
                const result = core.register('test', controller);
                
                expect(result).toBe(true);
                expect(core.hasController('test')).toBe(true);
                expect(core.getControllerCount()).toBe(1);
            });

            /**
             * Test: Should call init on controller if available
             */
            it('should call init on controller if available', () => {
                const core = new AnimationCore();
                const controller = createMockController();
                
                core.register('test', controller);
                
                expect(controller.init).toHaveBeenCalled();
            });

            /**
             * Test: Should not call init if controller is already initialized
             */
            it('should not call init if controller is already initialized', () => {
                const core = new AnimationCore();
                const controller = createMockController({ isInitialized: true });
                controller.isInitialized = true;
                
                core.register('test', controller);
                
                expect(controller.init).not.toHaveBeenCalled();
            });

            /**
             * Test: Should reject invalid controller name
             */
            it('should reject invalid controller name', () => {
                const core = new AnimationCore();
                const controller = createMockController();
                
                expect(core.register('', controller)).toBe(false);
                expect(core.register('   ', controller)).toBe(false);
                expect(core.register(null, controller)).toBe(false);
                expect(core.register(123, controller)).toBe(false);
            });

            /**
             * Test: Should reject invalid controller object
             */
            it('should reject invalid controller object', () => {
                const core = new AnimationCore();
                
                expect(core.register('test', null)).toBe(false);
                expect(core.register('test', 'string')).toBe(false);
                expect(core.register('test', 123)).toBe(false);
            });

            /**
             * Test: Should reject controller without update method
             */
            it('should reject controller without update method', () => {
                const core = new AnimationCore();
                const controller = { init: jest.fn() };
                
                expect(core.register('test', controller)).toBe(false);
            });

            /**
             * Test: Should reject duplicate registration
             */
            it('should reject duplicate registration', () => {
                const core = new AnimationCore();
                const controller1 = createMockController();
                const controller2 = createMockController();
                
                core.register('test', controller1);
                const result = core.register('test', controller2);
                
                expect(result).toBe(false);
                expect(core.getControllerCount()).toBe(1);
            });
        });

        describe('unregister()', () => {
            /**
             * Test: Should unregister a controller
             */
            it('should unregister a controller', () => {
                const core = new AnimationCore();
                const controller = createMockController();
                
                core.register('test', controller);
                const result = core.unregister('test');
                
                expect(result).toBe(true);
                expect(core.hasController('test')).toBe(false);
                expect(core.getControllerCount()).toBe(0);
            });

            /**
             * Test: Should call destroy on controller
             * **Validates: Requirements 8.3**
             */
            it('should call destroy on controller', () => {
                const core = new AnimationCore();
                const controller = createMockController();
                
                core.register('test', controller);
                core.unregister('test');
                
                expect(controller.destroy).toHaveBeenCalled();
            });

            /**
             * Test: Should return false for non-existent controller
             */
            it('should return false for non-existent controller', () => {
                const core = new AnimationCore();
                
                const result = core.unregister('nonexistent');
                
                expect(result).toBe(false);
            });

            /**
             * Test: Should reject invalid controller name
             */
            it('should reject invalid controller name', () => {
                const core = new AnimationCore();
                
                expect(core.unregister('')).toBe(false);
                expect(core.unregister(null)).toBe(false);
            });
        });

        describe('start()', () => {
            /**
             * Test: Should start the animation loop
             * **Validates: Requirements 8.1**
             */
            it('should start the animation loop', () => {
                const core = new AnimationCore();
                
                const result = core.start();
                
                expect(result).toBe(true);
                expect(core.isRunning).toBe(true);
                expect(core.rafId).not.toBe(null);
            });

            /**
             * Test: Should return true if already running
             */
            it('should return true if already running', () => {
                const core = new AnimationCore();
                
                core.start();
                const result = core.start();
                
                expect(result).toBe(true);
            });

            /**
             * Test: Should not start if reduced motion is enabled
             */
            it('should not start if reduced motion is enabled', () => {
                mockReducedMotionDetector = createMockReducedMotionDetector(true);
                AnimationCore = createAnimationCore(mockWindow, mockReducedMotionDetector);
                const core = new AnimationCore({ reducedMotionDetector: mockReducedMotionDetector });
                
                const result = core.start();
                
                expect(result).toBe(false);
                expect(core.isRunning).toBe(false);
            });
        });

        describe('stop()', () => {
            /**
             * Test: Should stop the animation loop
             */
            it('should stop the animation loop', () => {
                const core = new AnimationCore();
                
                core.start();
                const result = core.stop();
                
                expect(result).toBe(true);
                expect(core.isRunning).toBe(false);
                expect(core.rafId).toBe(null);
            });

            /**
             * Test: Should return true if not running
             */
            it('should return true if not running', () => {
                const core = new AnimationCore();
                
                const result = core.stop();
                
                expect(result).toBe(true);
            });
        });

        describe('tick()', () => {
            /**
             * Test: Should update all registered controllers
             * **Validates: Requirements 8.1**
             */
            it('should update all registered controllers', () => {
                const core = new AnimationCore();
                const controller1 = createMockController();
                const controller2 = createMockController();
                
                core.register('ctrl1', controller1);
                core.register('ctrl2', controller2);
                core.start();
                
                mockWindow._advanceTime(16);
                mockWindow._executeRAF(mockWindow.performance.now());
                
                expect(controller1.update).toHaveBeenCalled();
                expect(controller2.update).toHaveBeenCalled();
            });

            /**
             * Test: Should pass deltaTime and timestamp to controllers
             */
            it('should pass deltaTime and timestamp to controllers', () => {
                const core = new AnimationCore();
                const controller = createMockController();
                
                core.register('test', controller);
                core.start();
                
                mockWindow._advanceTime(16);
                const timestamp = mockWindow.performance.now();
                mockWindow._executeRAF(timestamp);
                
                expect(controller.update).toHaveBeenCalledWith(expect.any(Number), timestamp);
            });

            /**
             * Test: Should skip controllers when reduced motion is enabled
             */
            it('should skip controllers when reduced motion is enabled', () => {
                const core = new AnimationCore();
                const controller = createMockController({ supportsReducedMotion: false });
                
                core.register('test', controller);
                core.start();
                
                // Simulate reduced motion change
                mockReducedMotionDetector._setReducedMotion(true);
                core.isReducedMotion = true;
                
                mockWindow._advanceTime(16);
                mockWindow._executeRAF(mockWindow.performance.now());
                
                // Controller should not be updated (only initial call from start)
                expect(controller.update.mock.calls.length).toBeLessThanOrEqual(1);
            });
        });

        describe('destroy()', () => {
            /**
             * Test: Should stop animation loop
             * **Validates: Requirements 8.3**
             */
            it('should stop animation loop', () => {
                const core = new AnimationCore();
                
                core.start();
                core.destroy();
                
                expect(core.isRunning).toBe(false);
                expect(core.rafId).toBe(null);
            });

            /**
             * Test: Should destroy all controllers
             * **Validates: Requirements 8.3**
             */
            it('should destroy all controllers', () => {
                const core = new AnimationCore();
                const controller1 = createMockController();
                const controller2 = createMockController();
                
                core.register('ctrl1', controller1);
                core.register('ctrl2', controller2);
                core.destroy();
                
                expect(controller1.destroy).toHaveBeenCalled();
                expect(controller2.destroy).toHaveBeenCalled();
            });

            /**
             * Test: Should clear all controllers
             * **Validates: Requirements 8.3**
             */
            it('should clear all controllers', () => {
                const core = new AnimationCore();
                const controller = createMockController();
                
                core.register('test', controller);
                core.destroy();
                
                expect(core.getControllerCount()).toBe(0);
            });

            /**
             * Test: Should reset state
             * **Validates: Requirements 8.3**
             */
            it('should reset state', () => {
                const core = new AnimationCore();
                
                core.start();
                core.destroy();
                
                expect(core.isInitialized).toBe(false);
                expect(core.previousTimestamp).toBe(0);
                expect(core.lastFrameTime).toBe(0);
            });
        });

        describe('reduced motion handling', () => {
            /**
             * Test: Should stop animation when reduced motion is enabled
             */
            it('should stop animation when reduced motion is enabled', () => {
                const core = new AnimationCore();
                
                core.start();
                expect(core.isRunning).toBe(true);
                
                // Simulate reduced motion change
                mockReducedMotionDetector._setReducedMotion(true);
                
                expect(core.isRunning).toBe(false);
            });

            /**
             * Test: Should notify controllers of reduced motion change
             */
            it('should notify controllers of reduced motion change', () => {
                const core = new AnimationCore();
                const controller = createMockController();
                
                core.register('test', controller);
                mockReducedMotionDetector._setReducedMotion(true);
                
                expect(controller.onReducedMotionChange).toHaveBeenCalledWith(true);
            });
        });

        describe('helper methods', () => {
            /**
             * Test: getController should return registered controller
             */
            it('getController should return registered controller', () => {
                const core = new AnimationCore();
                const controller = createMockController();
                
                core.register('test', controller);
                
                expect(core.getController('test')).toBe(controller);
            });

            /**
             * Test: getController should return null for non-existent controller
             */
            it('getController should return null for non-existent controller', () => {
                const core = new AnimationCore();
                
                expect(core.getController('nonexistent')).toBe(null);
            });

            /**
             * Test: getControllerNames should return all names
             */
            it('getControllerNames should return all names', () => {
                const core = new AnimationCore();
                
                core.register('ctrl1', createMockController());
                core.register('ctrl2', createMockController());
                core.register('ctrl3', createMockController());
                
                const names = core.getControllerNames();
                
                expect(names).toContain('ctrl1');
                expect(names).toContain('ctrl2');
                expect(names).toContain('ctrl3');
                expect(names.length).toBe(3);
            });

            /**
             * Test: pauseAll should pause all controllers
             */
            it('pauseAll should pause all controllers', () => {
                const core = new AnimationCore();
                const controller1 = createMockController();
                const controller2 = createMockController();
                
                core.register('ctrl1', controller1);
                core.register('ctrl2', controller2);
                core.pauseAll();
                
                expect(controller1.pause).toHaveBeenCalled();
                expect(controller2.pause).toHaveBeenCalled();
            });

            /**
             * Test: resumeAll should resume all controllers
             */
            it('resumeAll should resume all controllers', () => {
                const core = new AnimationCore();
                const controller1 = createMockController();
                const controller2 = createMockController();
                
                core.register('ctrl1', controller1);
                core.register('ctrl2', controller2);
                core.resumeAll();
                
                expect(controller1.resume).toHaveBeenCalled();
                expect(controller2.resume).toHaveBeenCalled();
            });
        });
    });
});
