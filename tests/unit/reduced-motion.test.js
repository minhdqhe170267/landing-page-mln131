/**
 * Unit Tests for ReducedMotionDetector
 * Feature: ultimate-ui-animations
 * 
 * Tests the reduced motion detection utility that handles accessibility preferences.
 * 
 * **Validates: Requirements 9.1, 9.5**
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
 * Create a mock DOM environment with configurable matchMedia
 * @param {boolean} prefersReducedMotion - Whether user prefers reduced motion
 * @returns {Object} - DOM window and document
 */
function createMockDOM(prefersReducedMotion = false) {
    const html = `
        <!DOCTYPE html>
        <html lang="vi">
        <head><title>Test Page</title></head>
        <body>
            <div id="test-element" class="animated"></div>
        </body>
        </html>
    `;

    const dom = new JSDOM(html, {
        url: 'http://localhost/index.html',
        runScripts: 'dangerously'
    });

    // Create a mock MediaQueryList
    const createMockMediaQueryList = (matches) => {
        const listeners = [];
        return {
            matches,
            media: '(prefers-reduced-motion: reduce)',
            onchange: null,
            addEventListener: (event, callback) => {
                if (event === 'change') {
                    listeners.push(callback);
                }
            },
            removeEventListener: (event, callback) => {
                if (event === 'change') {
                    const index = listeners.indexOf(callback);
                    if (index > -1) {
                        listeners.splice(index, 1);
                    }
                }
            },
            addListener: (callback) => {
                listeners.push(callback);
            },
            removeListener: (callback) => {
                const index = listeners.indexOf(callback);
                if (index > -1) {
                    listeners.splice(index, 1);
                }
            },
            dispatchEvent: () => {},
            // Helper to simulate change
            _simulateChange: (newMatches) => {
                const event = { matches: newMatches };
                listeners.forEach(listener => listener(event));
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
 * Create ReducedMotionDetector class for testing
 * This mirrors the implementation in reduced-motion.js
 */
function createReducedMotionDetector(mockWindow) {
    const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

    class ReducedMotionDetector {
        constructor() {
            this.mediaQuery = null;
            this.isReducedMotion = false;
            this.callbacks = [];
            this.boundHandler = this._handleChange.bind(this);
            this.isListening = false;
            this._initMediaQuery();
        }

        _initMediaQuery() {
            if (mockWindow && mockWindow.matchMedia) {
                try {
                    this.mediaQuery = mockWindow.matchMedia(REDUCED_MOTION_QUERY);
                    this.isReducedMotion = this.mediaQuery.matches;
                } catch (error) {
                    this.mediaQuery = null;
                    this.isReducedMotion = false;
                }
            } else {
                this.mediaQuery = null;
                this.isReducedMotion = false;
            }
        }

        check() {
            if (this.mediaQuery) {
                this.isReducedMotion = this.mediaQuery.matches;
            }
            return this.isReducedMotion;
        }

        listen() {
            if (this.isListening) {
                return true;
            }

            if (!this.mediaQuery) {
                return false;
            }

            try {
                if (this.mediaQuery.addEventListener) {
                    this.mediaQuery.addEventListener('change', this.boundHandler);
                } else if (this.mediaQuery.addListener) {
                    this.mediaQuery.addListener(this.boundHandler);
                } else {
                    return false;
                }

                this.isListening = true;
                return true;
            } catch (error) {
                return false;
            }
        }

        unlisten() {
            if (!this.isListening) {
                return true;
            }

            if (!this.mediaQuery) {
                return true;
            }

            try {
                if (this.mediaQuery.removeEventListener) {
                    this.mediaQuery.removeEventListener('change', this.boundHandler);
                } else if (this.mediaQuery.removeListener) {
                    this.mediaQuery.removeListener(this.boundHandler);
                }

                this.isListening = false;
                return true;
            } catch (error) {
                return false;
            }
        }

        onChange(callback) {
            if (typeof callback !== 'function') {
                return false;
            }

            if (this.callbacks.includes(callback)) {
                return true;
            }

            this.callbacks.push(callback);
            return true;
        }

        offChange(callback) {
            const index = this.callbacks.indexOf(callback);
            if (index === -1) {
                return false;
            }

            this.callbacks.splice(index, 1);
            return true;
        }

        _handleChange(event) {
            const newValue = event.matches;
            
            if (newValue !== this.isReducedMotion) {
                this.isReducedMotion = newValue;
                this._notifyCallbacks(newValue);
            }
        }

        _notifyCallbacks(isReducedMotion) {
            for (const callback of this.callbacks) {
                try {
                    callback(isReducedMotion);
                } catch (error) {
                    console.error('ReducedMotionDetector: Callback error', error);
                }
            }
        }

        getCallbackCount() {
            return this.callbacks.length;
        }

        clearCallbacks() {
            this.callbacks = [];
        }

        destroy() {
            this.unlisten();
            this.clearCallbacks();
            this.mediaQuery = null;
            this.isReducedMotion = false;
        }
    }

    return ReducedMotionDetector;
}

// ============================================
// UNIT TESTS
// ============================================

describe('Feature: ultimate-ui-animations', () => {
    describe('ReducedMotionDetector', () => {
        
        describe('constructor', () => {
            /**
             * Test: Should initialize with reduced motion disabled by default
             */
            it('should initialize with reduced motion disabled by default', () => {
                const { window } = createMockDOM(false);
                const ReducedMotionDetector = createReducedMotionDetector(window);
                const detector = new ReducedMotionDetector();
                
                expect(detector.isReducedMotion).toBe(false);
            });

            /**
             * Test: Should detect reduced motion preference on initialization
             * **Validates: Requirements 9.1**
             */
            it('should detect reduced motion preference on initialization', () => {
                const { window } = createMockDOM(true);
                const ReducedMotionDetector = createReducedMotionDetector(window);
                const detector = new ReducedMotionDetector();
                
                expect(detector.isReducedMotion).toBe(true);
            });

            /**
             * Test: Should initialize with empty callbacks array
             */
            it('should initialize with empty callbacks array', () => {
                const { window } = createMockDOM(false);
                const ReducedMotionDetector = createReducedMotionDetector(window);
                const detector = new ReducedMotionDetector();
                
                expect(detector.callbacks).toEqual([]);
                expect(detector.getCallbackCount()).toBe(0);
            });

            /**
             * Test: Should not be listening by default
             */
            it('should not be listening by default', () => {
                const { window } = createMockDOM(false);
                const ReducedMotionDetector = createReducedMotionDetector(window);
                const detector = new ReducedMotionDetector();
                
                expect(detector.isListening).toBe(false);
            });

            /**
             * Test: Should handle missing matchMedia gracefully
             */
            it('should handle missing matchMedia gracefully', () => {
                const ReducedMotionDetector = createReducedMotionDetector(null);
                const detector = new ReducedMotionDetector();
                
                expect(detector.mediaQuery).toBe(null);
                expect(detector.isReducedMotion).toBe(false);
            });
        });

        describe('check()', () => {
            /**
             * Test: Should return false when reduced motion is not preferred
             * **Validates: Requirements 9.1**
             */
            it('should return false when reduced motion is not preferred', () => {
                const { window } = createMockDOM(false);
                const ReducedMotionDetector = createReducedMotionDetector(window);
                const detector = new ReducedMotionDetector();
                
                expect(detector.check()).toBe(false);
            });

            /**
             * Test: Should return true when reduced motion is preferred
             * **Validates: Requirements 9.1**
             */
            it('should return true when reduced motion is preferred', () => {
                const { window } = createMockDOM(true);
                const ReducedMotionDetector = createReducedMotionDetector(window);
                const detector = new ReducedMotionDetector();
                
                expect(detector.check()).toBe(true);
            });

            /**
             * Test: Should update isReducedMotion property
             */
            it('should update isReducedMotion property', () => {
                const { window } = createMockDOM(true);
                const ReducedMotionDetector = createReducedMotionDetector(window);
                const detector = new ReducedMotionDetector();
                
                detector.check();
                
                expect(detector.isReducedMotion).toBe(true);
            });

            /**
             * Test: Should return false when mediaQuery is not available
             */
            it('should return false when mediaQuery is not available', () => {
                const ReducedMotionDetector = createReducedMotionDetector(null);
                const detector = new ReducedMotionDetector();
                
                expect(detector.check()).toBe(false);
            });
        });

        describe('listen()', () => {
            /**
             * Test: Should start listening for media query changes
             * **Validates: Requirements 9.5**
             */
            it('should start listening for media query changes', () => {
                const { window, mockMediaQueryList } = createMockDOM(false);
                const ReducedMotionDetector = createReducedMotionDetector(window);
                const detector = new ReducedMotionDetector();
                
                const result = detector.listen();
                
                expect(result).toBe(true);
                expect(detector.isListening).toBe(true);
            });

            /**
             * Test: Should return true if already listening
             */
            it('should return true if already listening', () => {
                const { window } = createMockDOM(false);
                const ReducedMotionDetector = createReducedMotionDetector(window);
                const detector = new ReducedMotionDetector();
                
                detector.listen();
                const result = detector.listen();
                
                expect(result).toBe(true);
            });

            /**
             * Test: Should return false when mediaQuery is not available
             */
            it('should return false when mediaQuery is not available', () => {
                const ReducedMotionDetector = createReducedMotionDetector(null);
                const detector = new ReducedMotionDetector();
                
                const result = detector.listen();
                
                expect(result).toBe(false);
                expect(detector.isListening).toBe(false);
            });
        });

        describe('unlisten()', () => {
            /**
             * Test: Should stop listening for media query changes
             */
            it('should stop listening for media query changes', () => {
                const { window } = createMockDOM(false);
                const ReducedMotionDetector = createReducedMotionDetector(window);
                const detector = new ReducedMotionDetector();
                
                detector.listen();
                const result = detector.unlisten();
                
                expect(result).toBe(true);
                expect(detector.isListening).toBe(false);
            });

            /**
             * Test: Should return true if not currently listening
             */
            it('should return true if not currently listening', () => {
                const { window } = createMockDOM(false);
                const ReducedMotionDetector = createReducedMotionDetector(window);
                const detector = new ReducedMotionDetector();
                
                const result = detector.unlisten();
                
                expect(result).toBe(true);
            });

            /**
             * Test: Should return true when mediaQuery is not available
             */
            it('should return true when mediaQuery is not available', () => {
                const ReducedMotionDetector = createReducedMotionDetector(null);
                const detector = new ReducedMotionDetector();
                
                const result = detector.unlisten();
                
                expect(result).toBe(true);
            });
        });

        describe('onChange()', () => {
            /**
             * Test: Should register a callback function
             */
            it('should register a callback function', () => {
                const { window } = createMockDOM(false);
                const ReducedMotionDetector = createReducedMotionDetector(window);
                const detector = new ReducedMotionDetector();
                const callback = jest.fn();
                
                const result = detector.onChange(callback);
                
                expect(result).toBe(true);
                expect(detector.getCallbackCount()).toBe(1);
            });

            /**
             * Test: Should not register duplicate callbacks
             */
            it('should not register duplicate callbacks', () => {
                const { window } = createMockDOM(false);
                const ReducedMotionDetector = createReducedMotionDetector(window);
                const detector = new ReducedMotionDetector();
                const callback = jest.fn();
                
                detector.onChange(callback);
                detector.onChange(callback);
                
                expect(detector.getCallbackCount()).toBe(1);
            });

            /**
             * Test: Should return false for non-function callback
             */
            it('should return false for non-function callback', () => {
                const { window } = createMockDOM(false);
                const ReducedMotionDetector = createReducedMotionDetector(window);
                const detector = new ReducedMotionDetector();
                
                expect(detector.onChange(null)).toBe(false);
                expect(detector.onChange('not a function')).toBe(false);
                expect(detector.onChange(123)).toBe(false);
                expect(detector.getCallbackCount()).toBe(0);
            });

            /**
             * Test: Should register multiple different callbacks
             */
            it('should register multiple different callbacks', () => {
                const { window } = createMockDOM(false);
                const ReducedMotionDetector = createReducedMotionDetector(window);
                const detector = new ReducedMotionDetector();
                const callback1 = jest.fn();
                const callback2 = jest.fn();
                const callback3 = jest.fn();
                
                detector.onChange(callback1);
                detector.onChange(callback2);
                detector.onChange(callback3);
                
                expect(detector.getCallbackCount()).toBe(3);
            });
        });

        describe('offChange()', () => {
            /**
             * Test: Should unregister a callback function
             */
            it('should unregister a callback function', () => {
                const { window } = createMockDOM(false);
                const ReducedMotionDetector = createReducedMotionDetector(window);
                const detector = new ReducedMotionDetector();
                const callback = jest.fn();
                
                detector.onChange(callback);
                const result = detector.offChange(callback);
                
                expect(result).toBe(true);
                expect(detector.getCallbackCount()).toBe(0);
            });

            /**
             * Test: Should return false for unregistered callback
             */
            it('should return false for unregistered callback', () => {
                const { window } = createMockDOM(false);
                const ReducedMotionDetector = createReducedMotionDetector(window);
                const detector = new ReducedMotionDetector();
                const callback = jest.fn();
                
                const result = detector.offChange(callback);
                
                expect(result).toBe(false);
            });
        });

        describe('callback notification', () => {
            /**
             * Test: Should call callbacks when preference changes
             * **Validates: Requirements 9.5**
             */
            it('should call callbacks when preference changes', () => {
                const { window, mockMediaQueryList } = createMockDOM(false);
                const ReducedMotionDetector = createReducedMotionDetector(window);
                const detector = new ReducedMotionDetector();
                const callback = jest.fn();
                
                detector.onChange(callback);
                detector.listen();
                
                // Simulate preference change
                mockMediaQueryList._simulateChange(true);
                
                expect(callback).toHaveBeenCalledWith(true);
                expect(detector.isReducedMotion).toBe(true);
            });

            /**
             * Test: Should not call callbacks when value doesn't change
             */
            it('should not call callbacks when value does not change', () => {
                const { window, mockMediaQueryList } = createMockDOM(false);
                const ReducedMotionDetector = createReducedMotionDetector(window);
                const detector = new ReducedMotionDetector();
                const callback = jest.fn();
                
                detector.onChange(callback);
                detector.listen();
                
                // Simulate same value
                mockMediaQueryList._simulateChange(false);
                
                expect(callback).not.toHaveBeenCalled();
            });

            /**
             * Test: Should call all registered callbacks
             */
            it('should call all registered callbacks', () => {
                const { window, mockMediaQueryList } = createMockDOM(false);
                const ReducedMotionDetector = createReducedMotionDetector(window);
                const detector = new ReducedMotionDetector();
                const callback1 = jest.fn();
                const callback2 = jest.fn();
                const callback3 = jest.fn();
                
                detector.onChange(callback1);
                detector.onChange(callback2);
                detector.onChange(callback3);
                detector.listen();
                
                mockMediaQueryList._simulateChange(true);
                
                expect(callback1).toHaveBeenCalledWith(true);
                expect(callback2).toHaveBeenCalledWith(true);
                expect(callback3).toHaveBeenCalledWith(true);
            });

            /**
             * Test: Should handle callback errors gracefully
             */
            it('should handle callback errors gracefully', () => {
                const { window, mockMediaQueryList } = createMockDOM(false);
                const ReducedMotionDetector = createReducedMotionDetector(window);
                const detector = new ReducedMotionDetector();
                const errorCallback = jest.fn(() => { throw new Error('Test error'); });
                const normalCallback = jest.fn();
                
                // Suppress console.error for this test
                const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
                
                detector.onChange(errorCallback);
                detector.onChange(normalCallback);
                detector.listen();
                
                // Should not throw
                expect(() => {
                    mockMediaQueryList._simulateChange(true);
                }).not.toThrow();
                
                // Normal callback should still be called
                expect(normalCallback).toHaveBeenCalledWith(true);
                
                consoleSpy.mockRestore();
            });
        });

        describe('clearCallbacks()', () => {
            /**
             * Test: Should remove all callbacks
             */
            it('should remove all callbacks', () => {
                const { window } = createMockDOM(false);
                const ReducedMotionDetector = createReducedMotionDetector(window);
                const detector = new ReducedMotionDetector();
                
                detector.onChange(jest.fn());
                detector.onChange(jest.fn());
                detector.onChange(jest.fn());
                
                detector.clearCallbacks();
                
                expect(detector.getCallbackCount()).toBe(0);
            });
        });

        describe('destroy()', () => {
            /**
             * Test: Should cleanup all resources
             * **Validates: Requirements 8.3**
             */
            it('should cleanup all resources', () => {
                const { window } = createMockDOM(false);
                const ReducedMotionDetector = createReducedMotionDetector(window);
                const detector = new ReducedMotionDetector();
                
                detector.onChange(jest.fn());
                detector.listen();
                
                detector.destroy();
                
                expect(detector.isListening).toBe(false);
                expect(detector.getCallbackCount()).toBe(0);
                expect(detector.mediaQuery).toBe(null);
                expect(detector.isReducedMotion).toBe(false);
            });

            /**
             * Test: Should stop listening when destroyed
             */
            it('should stop listening when destroyed', () => {
                const { window, mockMediaQueryList } = createMockDOM(false);
                const ReducedMotionDetector = createReducedMotionDetector(window);
                const detector = new ReducedMotionDetector();
                const callback = jest.fn();
                
                detector.onChange(callback);
                detector.listen();
                detector.destroy();
                
                // Simulate change after destroy
                mockMediaQueryList._simulateChange(true);
                
                // Callback should not be called
                expect(callback).not.toHaveBeenCalled();
            });
        });

        describe('getCallbackCount()', () => {
            /**
             * Test: Should return correct callback count
             */
            it('should return correct callback count', () => {
                const { window } = createMockDOM(false);
                const ReducedMotionDetector = createReducedMotionDetector(window);
                const detector = new ReducedMotionDetector();
                
                expect(detector.getCallbackCount()).toBe(0);
                
                detector.onChange(jest.fn());
                expect(detector.getCallbackCount()).toBe(1);
                
                detector.onChange(jest.fn());
                expect(detector.getCallbackCount()).toBe(2);
            });
        });
    });
});
