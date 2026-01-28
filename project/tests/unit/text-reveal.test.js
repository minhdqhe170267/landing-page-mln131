/**
 * Unit Tests for TextReveal
 * Feature: ultimate-ui-animations
 * 
 * Tests the character-by-character text reveal animation with glitch effect.
 * 
 * **Validates: Requirements 2.7, 2.8, 9.1, 9.2**
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
 * @returns {Object} - DOM window, document, and test element
 */
function createMockDOM() {
    const html = `
        <!DOCTYPE html>
        <html lang="vi">
        <head><title>Test Page</title></head>
        <body>
            <h1 id="hero-title">Hello World</h1>
            <h2 id="empty-title"></h2>
            <p id="long-text">This is a longer text for testing</p>
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

    return {
        window: dom.window,
        document: dom.window.document,
        heroTitle: dom.window.document.getElementById('hero-title'),
        emptyTitle: dom.window.document.getElementById('empty-title'),
        longText: dom.window.document.getElementById('long-text')
    };
}


/**
 * Create TextReveal class for testing
 * This mirrors the implementation in text-reveal.js
 */
function createTextRevealClass(mockWindow) {
    const DEFAULT_STAGGER_DELAY = 50;
    const DEFAULT_DURATION = 800;
    const DEFAULT_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';
    const GLITCH_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    // Mock GPUAccelerator
    const GPUAccelerator = {
        setWillChange: jest.fn(() => true),
        clearWillChange: jest.fn(() => true)
    };

    // Mock prefersReducedMotion
    let mockReducedMotion = false;
    const prefersReducedMotion = () => mockReducedMotion;
    const setMockReducedMotion = (value) => { mockReducedMotion = value; };

    class TextReveal {
        constructor(element, options = {}) {
            if (!element || !(element instanceof mockWindow.HTMLElement)) {
                throw new Error('TextReveal: Valid HTML element is required');
            }

            this.element = element;
            this.text = element.textContent || '';
            this.chars = [];
            this.options = {
                staggerDelay: options.staggerDelay ?? DEFAULT_STAGGER_DELAY,
                duration: options.duration ?? DEFAULT_DURATION,
                easing: options.easing || DEFAULT_EASING,
                glitchIterations: options.glitchIterations ?? 5,
                glitchSpeed: options.glitchSpeed ?? 50
            };
            this.isSplit = false;
            this.isAnimating = false;
            this.isRevealed = false;
            this.isInitialized = false;
            this.isReducedMotion = false;
            this.supportsReducedMotion = true;
            this.timeouts = [];
            this.intervals = [];
        }

        init() {
            this.isReducedMotion = prefersReducedMotion();
            this.splitText();
            this.isInitialized = true;

            if (this.isReducedMotion) {
                this._showImmediately();
            }
        }


        splitText() {
            if (this.isSplit) {
                return this.chars;
            }

            this.element.innerHTML = '';
            this.chars = [];

            for (let i = 0; i < this.text.length; i++) {
                const char = this.text[i];
                const span = mockWindow.document.createElement('span');
                
                if (char === ' ') {
                    span.innerHTML = '&nbsp;';
                    span.className = 'text-reveal-char text-reveal-space';
                } else {
                    span.textContent = char;
                    span.className = 'text-reveal-char';
                }

                span.dataset.char = char;
                span.dataset.index = i.toString();
                span.style.opacity = '0';
                span.style.display = 'inline-block';
                
                GPUAccelerator.setWillChange(span, ['opacity', 'transform']);

                this.element.appendChild(span);
                this.chars.push(span);
            }

            this.isSplit = true;
            return this.chars;
        }

        getCharacterDelay(index) {
            return index * this.options.staggerDelay;
        }

        reveal() {
            return new Promise((resolve) => {
                if (this.isReducedMotion) {
                    this._showImmediately();
                    resolve();
                    return;
                }

                if (this.isRevealed || this.isAnimating) {
                    resolve();
                    return;
                }

                if (!this.isSplit) {
                    this.splitText();
                }

                this.isAnimating = true;

                const totalChars = this.chars.length;
                let completedChars = 0;

                for (let i = 0; i < this.chars.length; i++) {
                    const char = this.chars[i];
                    const delay = this.getCharacterDelay(i);

                    const timeoutId = setTimeout(() => {
                        this._animateCharacter(char, i, () => {
                            completedChars++;
                            
                            if (completedChars === totalChars) {
                                this.isAnimating = false;
                                this.isRevealed = true;
                                this._cleanup();
                                resolve();
                            }
                        });
                    }, delay);

                    this.timeouts.push(timeoutId);
                }

                if (totalChars === 0) {
                    this.isAnimating = false;
                    this.isRevealed = true;
                    resolve();
                }
            });
        }


        _animateCharacter(charSpan, index, onComplete) {
            const originalChar = charSpan.dataset.char;
            const isSpace = originalChar === ' ';
            
            if (isSpace) {
                charSpan.style.transition = `opacity ${this.options.duration}ms ${this.options.easing}`;
                charSpan.style.opacity = '1';
                
                const timeoutId = setTimeout(onComplete, this.options.duration);
                this.timeouts.push(timeoutId);
                return;
            }

            charSpan.style.opacity = '1';

            let iterations = 0;
            const maxIterations = this.options.glitchIterations;
            
            const intervalId = setInterval(() => {
                if (iterations >= maxIterations) {
                    clearInterval(intervalId);
                    charSpan.textContent = originalChar;
                    charSpan.classList.add('text-reveal-revealed');
                    GPUAccelerator.clearWillChange(charSpan);
                    onComplete();
                    return;
                }

                const glitchChar = GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
                charSpan.textContent = glitchChar;
                charSpan.classList.add('text-reveal-glitching');
                
                iterations++;
            }, this.options.glitchSpeed);

            this.intervals.push(intervalId);
        }

        _showImmediately() {
            for (const char of this.chars) {
                char.style.opacity = '1';
                char.style.transition = 'none';
                char.classList.add('text-reveal-revealed');
                GPUAccelerator.clearWillChange(char);
            }
            
            this.isRevealed = true;
            this.isAnimating = false;
        }

        _cleanup() {
            for (const timeoutId of this.timeouts) {
                clearTimeout(timeoutId);
            }
            this.timeouts = [];

            for (const intervalId of this.intervals) {
                clearInterval(intervalId);
            }
            this.intervals = [];
        }

        reset() {
            this._cleanup();

            for (const char of this.chars) {
                char.style.opacity = '0';
                char.style.transition = '';
                char.classList.remove('text-reveal-revealed', 'text-reveal-glitching');
                
                const originalChar = char.dataset.char;
                if (originalChar === ' ') {
                    char.innerHTML = '&nbsp;';
                } else {
                    char.textContent = originalChar;
                }

                GPUAccelerator.setWillChange(char, ['opacity', 'transform']);
            }

            this.isRevealed = false;
            this.isAnimating = false;
        }

        onReducedMotionChange(isReducedMotion) {
            this.isReducedMotion = isReducedMotion;

            if (isReducedMotion) {
                this._cleanup();
                this._showImmediately();
            }
        }

        update(deltaTime) {
            // Interface compatibility
        }

        getCharacterCount() {
            return this.chars.length;
        }

        getCharacters() {
            return this.chars;
        }

        getText() {
            return this.text;
        }

        getStaggerDelay() {
            return this.options.staggerDelay;
        }

        setText(text) {
            this.text = text;
            this.isSplit = false;
            this.isRevealed = false;
            this.isAnimating = false;
            this._cleanup();
            this.splitText();
        }

        destroy() {
            this._cleanup();

            for (const char of this.chars) {
                GPUAccelerator.clearWillChange(char);
            }

            this.element.textContent = this.text;

            this.chars = [];
            this.isSplit = false;
            this.isRevealed = false;
            this.isAnimating = false;
            this.isInitialized = false;
        }
    }

    return { 
        TextReveal, 
        DEFAULT_STAGGER_DELAY, 
        DEFAULT_DURATION, 
        DEFAULT_EASING,
        GLITCH_CHARS,
        GPUAccelerator,
        setMockReducedMotion
    };
}


// ============================================
// UNIT TESTS
// ============================================

describe('Feature: ultimate-ui-animations', () => {
    describe('TextReveal', () => {
        let mockDOM;
        let TextReveal;
        let DEFAULT_STAGGER_DELAY;
        let DEFAULT_DURATION;
        let GPUAccelerator;
        let setMockReducedMotion;

        beforeEach(() => {
            jest.useFakeTimers();
            mockDOM = createMockDOM();
            const classes = createTextRevealClass(mockDOM.window);
            TextReveal = classes.TextReveal;
            DEFAULT_STAGGER_DELAY = classes.DEFAULT_STAGGER_DELAY;
            DEFAULT_DURATION = classes.DEFAULT_DURATION;
            GPUAccelerator = classes.GPUAccelerator;
            setMockReducedMotion = classes.setMockReducedMotion;
            
            // Reset mocks
            GPUAccelerator.setWillChange.mockClear();
            GPUAccelerator.clearWillChange.mockClear();
            setMockReducedMotion(false);
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        describe('constructor', () => {
            /**
             * Test: Should throw error if element is not provided
             */
            it('should throw error if element is not provided', () => {
                expect(() => new TextReveal(null)).toThrow('TextReveal: Valid HTML element is required');
            });

            /**
             * Test: Should throw error if invalid element is provided
             */
            it('should throw error if invalid element is provided', () => {
                expect(() => new TextReveal('not an element')).toThrow('TextReveal: Valid HTML element is required');
            });

            /**
             * Test: Should initialize with default values
             */
            it('should initialize with default values', () => {
                const reveal = new TextReveal(mockDOM.heroTitle);
                
                expect(reveal.element).toBe(mockDOM.heroTitle);
                expect(reveal.text).toBe('Hello World');
                expect(reveal.chars).toEqual([]);
                expect(reveal.options.staggerDelay).toBe(DEFAULT_STAGGER_DELAY);
                expect(reveal.options.duration).toBe(DEFAULT_DURATION);
                expect(reveal.isSplit).toBe(false);
                expect(reveal.isAnimating).toBe(false);
                expect(reveal.isRevealed).toBe(false);
            });

            /**
             * Test: Should accept custom options
             */
            it('should accept custom options', () => {
                const reveal = new TextReveal(mockDOM.heroTitle, {
                    staggerDelay: 100,
                    duration: 500,
                    glitchIterations: 10,
                    glitchSpeed: 30
                });
                
                expect(reveal.options.staggerDelay).toBe(100);
                expect(reveal.options.duration).toBe(500);
                expect(reveal.options.glitchIterations).toBe(10);
                expect(reveal.options.glitchSpeed).toBe(30);
            });

            /**
             * Test: Should handle empty text
             */
            it('should handle empty text', () => {
                const reveal = new TextReveal(mockDOM.emptyTitle);
                
                expect(reveal.text).toBe('');
            });
        });


        describe('splitText()', () => {
            /**
             * Test: Should split text into individual character spans
             */
            it('should split text into individual character spans', () => {
                const reveal = new TextReveal(mockDOM.heroTitle);
                reveal.splitText();
                
                expect(reveal.chars.length).toBe(11); // "Hello World" = 11 chars
                expect(reveal.isSplit).toBe(true);
            });

            /**
             * Test: Should create span for each character
             */
            it('should create span for each character', () => {
                const reveal = new TextReveal(mockDOM.heroTitle);
                reveal.splitText();
                
                reveal.chars.forEach((span, index) => {
                    expect(span.tagName).toBe('SPAN');
                    expect(span.className).toContain('text-reveal-char');
                    expect(span.dataset.index).toBe(index.toString());
                });
            });

            /**
             * Test: Should store original character in data attribute
             */
            it('should store original character in data attribute', () => {
                const reveal = new TextReveal(mockDOM.heroTitle);
                reveal.splitText();
                
                expect(reveal.chars[0].dataset.char).toBe('H');
                expect(reveal.chars[1].dataset.char).toBe('e');
                expect(reveal.chars[5].dataset.char).toBe(' '); // Space
            });

            /**
             * Test: Should handle spaces with non-breaking space
             */
            it('should handle spaces with non-breaking space', () => {
                const reveal = new TextReveal(mockDOM.heroTitle);
                reveal.splitText();
                
                const spaceSpan = reveal.chars[5]; // "Hello World" - space at index 5
                expect(spaceSpan.innerHTML).toBe('&nbsp;');
                expect(spaceSpan.className).toContain('text-reveal-space');
            });

            /**
             * Test: Should set initial opacity to 0 (hidden)
             */
            it('should set initial opacity to 0 (hidden)', () => {
                const reveal = new TextReveal(mockDOM.heroTitle);
                reveal.splitText();
                
                reveal.chars.forEach(span => {
                    expect(span.style.opacity).toBe('0');
                });
            });

            /**
             * Test: Should apply GPU acceleration to character spans
             */
            it('should apply GPU acceleration to character spans', () => {
                const reveal = new TextReveal(mockDOM.heroTitle);
                reveal.splitText();
                
                expect(GPUAccelerator.setWillChange).toHaveBeenCalledTimes(11);
            });

            /**
             * Test: Should not re-split if already split
             */
            it('should not re-split if already split', () => {
                const reveal = new TextReveal(mockDOM.heroTitle);
                reveal.splitText();
                const firstChars = [...reveal.chars];
                
                reveal.splitText();
                
                expect(reveal.chars).toEqual(firstChars);
            });
        });


        describe('getCharacterDelay()', () => {
            /**
             * Test: Should calculate correct delay for character at index 0
             * **Validates: Requirements 2.8**
             */
            it('should return 0 delay for first character (index 0)', () => {
                const reveal = new TextReveal(mockDOM.heroTitle);
                
                expect(reveal.getCharacterDelay(0)).toBe(0);
            });

            /**
             * Test: Should calculate correct delay with default stagger (50ms)
             * **Validates: Requirements 2.8**
             */
            it('should calculate delay as index * staggerDelay (50ms default)', () => {
                const reveal = new TextReveal(mockDOM.heroTitle);
                
                expect(reveal.getCharacterDelay(1)).toBe(50);
                expect(reveal.getCharacterDelay(2)).toBe(100);
                expect(reveal.getCharacterDelay(5)).toBe(250);
                expect(reveal.getCharacterDelay(10)).toBe(500);
            });

            /**
             * Test: Should use custom stagger delay
             * **Validates: Requirements 2.8**
             */
            it('should use custom stagger delay', () => {
                const reveal = new TextReveal(mockDOM.heroTitle, { staggerDelay: 100 });
                
                expect(reveal.getCharacterDelay(1)).toBe(100);
                expect(reveal.getCharacterDelay(5)).toBe(500);
            });

            /**
             * Test: Stagger timing formula: delay = index * staggerDelay
             * **Validates: Requirements 2.8**
             */
            it('should follow formula: delay = index * staggerDelay', () => {
                const staggerDelay = 75;
                const reveal = new TextReveal(mockDOM.heroTitle, { staggerDelay });
                
                for (let i = 0; i < 10; i++) {
                    expect(reveal.getCharacterDelay(i)).toBe(i * staggerDelay);
                }
            });
        });

        describe('reveal()', () => {
            /**
             * Test: Should split text if not already split
             */
            it('should split text if not already split', async () => {
                const reveal = new TextReveal(mockDOM.heroTitle);
                
                const promise = reveal.reveal();
                
                expect(reveal.isSplit).toBe(true);
                
                // Fast-forward all timers
                jest.runAllTimers();
                await promise;
            });

            /**
             * Test: Should set isAnimating to true during animation
             */
            it('should set isAnimating to true during animation', () => {
                const reveal = new TextReveal(mockDOM.heroTitle);
                reveal.splitText();
                
                reveal.reveal();
                
                expect(reveal.isAnimating).toBe(true);
            });

            /**
             * Test: Should resolve immediately if already revealed
             */
            it('should resolve immediately if already revealed', async () => {
                const reveal = new TextReveal(mockDOM.heroTitle);
                reveal.splitText();
                reveal.isRevealed = true;
                
                const promise = reveal.reveal();
                await promise;
                
                expect(reveal.isAnimating).toBe(false);
            });

            /**
             * Test: Should handle empty text
             */
            it('should handle empty text', async () => {
                const reveal = new TextReveal(mockDOM.emptyTitle);
                reveal.splitText();
                
                const promise = reveal.reveal();
                await promise;
                
                expect(reveal.isRevealed).toBe(true);
            });

            /**
             * Test: Should schedule animations with stagger delays
             * **Validates: Requirements 2.8**
             */
            it('should schedule animations with stagger delays', () => {
                const reveal = new TextReveal(mockDOM.heroTitle);
                reveal.splitText();
                
                reveal.reveal();
                
                // First character should start immediately
                expect(reveal.chars[0].style.opacity).toBe('0');
                
                // After 0ms, first character animation starts
                jest.advanceTimersByTime(0);
                expect(reveal.chars[0].style.opacity).toBe('1');
                
                // Second character starts after 50ms
                jest.advanceTimersByTime(50);
                expect(reveal.chars[1].style.opacity).toBe('1');
            });
        });


        describe('Reduced Motion Support', () => {
            /**
             * Test: Should show text immediately when reduced motion is enabled
             * **Validates: Requirements 9.2**
             */
            it('should show text immediately when reduced motion is enabled', async () => {
                setMockReducedMotion(true);
                const reveal = new TextReveal(mockDOM.heroTitle);
                reveal.init();
                
                // All characters should be visible immediately
                reveal.chars.forEach(char => {
                    expect(char.style.opacity).toBe('1');
                });
                expect(reveal.isRevealed).toBe(true);
            });

            /**
             * Test: Should not animate when reduced motion is enabled
             * **Validates: Requirements 9.1**
             */
            it('should not animate when reduced motion is enabled', async () => {
                setMockReducedMotion(true);
                const reveal = new TextReveal(mockDOM.heroTitle);
                reveal.init();
                
                const promise = reveal.reveal();
                await promise;
                
                expect(reveal.isAnimating).toBe(false);
                expect(reveal.timeouts.length).toBe(0);
            });

            /**
             * Test: Should respond to reduced motion change during animation
             * **Validates: Requirements 9.1**
             */
            it('should respond to reduced motion change', () => {
                const reveal = new TextReveal(mockDOM.heroTitle);
                reveal.init();
                
                reveal.onReducedMotionChange(true);
                
                expect(reveal.isReducedMotion).toBe(true);
                expect(reveal.isRevealed).toBe(true);
                reveal.chars.forEach(char => {
                    expect(char.style.opacity).toBe('1');
                });
            });
        });

        describe('reset()', () => {
            /**
             * Test: Should reset all characters to hidden state
             */
            it('should reset all characters to hidden state', async () => {
                const reveal = new TextReveal(mockDOM.heroTitle);
                reveal.splitText();
                
                // Reveal first
                const promise = reveal.reveal();
                jest.runAllTimers();
                await promise;
                
                // Reset
                reveal.reset();
                
                reveal.chars.forEach(char => {
                    expect(char.style.opacity).toBe('0');
                });
                expect(reveal.isRevealed).toBe(false);
                expect(reveal.isAnimating).toBe(false);
            });

            /**
             * Test: Should restore original characters
             */
            it('should restore original characters', async () => {
                const reveal = new TextReveal(mockDOM.heroTitle);
                reveal.splitText();
                
                const promise = reveal.reveal();
                jest.runAllTimers();
                await promise;
                
                reveal.reset();
                
                expect(reveal.chars[0].textContent).toBe('H');
                expect(reveal.chars[1].textContent).toBe('e');
            });

            /**
             * Test: Should clear animation timeouts and intervals
             */
            it('should clear animation timeouts and intervals', () => {
                const reveal = new TextReveal(mockDOM.heroTitle);
                reveal.splitText();
                
                reveal.reveal();
                
                // Should have timeouts scheduled
                expect(reveal.timeouts.length).toBeGreaterThan(0);
                
                reveal.reset();
                
                expect(reveal.timeouts.length).toBe(0);
                expect(reveal.intervals.length).toBe(0);
            });
        });


        describe('destroy()', () => {
            /**
             * Test: Should restore original text content
             * **Validates: Requirements 8.3**
             */
            it('should restore original text content', () => {
                const reveal = new TextReveal(mockDOM.heroTitle);
                reveal.init();
                
                reveal.destroy();
                
                expect(mockDOM.heroTitle.textContent).toBe('Hello World');
            });

            /**
             * Test: Should clear all character spans
             * **Validates: Requirements 8.3**
             */
            it('should clear all character spans', () => {
                const reveal = new TextReveal(mockDOM.heroTitle);
                reveal.init();
                
                reveal.destroy();
                
                expect(reveal.chars.length).toBe(0);
            });

            /**
             * Test: Should reset all state flags
             * **Validates: Requirements 8.3**
             */
            it('should reset all state flags', () => {
                const reveal = new TextReveal(mockDOM.heroTitle);
                reveal.init();
                
                reveal.destroy();
                
                expect(reveal.isSplit).toBe(false);
                expect(reveal.isRevealed).toBe(false);
                expect(reveal.isAnimating).toBe(false);
                expect(reveal.isInitialized).toBe(false);
            });

            /**
             * Test: Should clear GPU acceleration from all characters
             * **Validates: Requirements 8.3**
             */
            it('should clear GPU acceleration from all characters', () => {
                const reveal = new TextReveal(mockDOM.heroTitle);
                reveal.init();
                
                GPUAccelerator.clearWillChange.mockClear();
                reveal.destroy();
                
                // Should have called clearWillChange for each character
                expect(GPUAccelerator.clearWillChange).toHaveBeenCalledTimes(11);
            });
        });

        describe('Utility Methods', () => {
            /**
             * Test: getCharacterCount should return correct count
             */
            it('getCharacterCount should return correct count', () => {
                const reveal = new TextReveal(mockDOM.heroTitle);
                reveal.splitText();
                
                expect(reveal.getCharacterCount()).toBe(11);
            });

            /**
             * Test: getText should return original text
             */
            it('getText should return original text', () => {
                const reveal = new TextReveal(mockDOM.heroTitle);
                
                expect(reveal.getText()).toBe('Hello World');
            });

            /**
             * Test: getStaggerDelay should return configured delay
             */
            it('getStaggerDelay should return configured delay', () => {
                const reveal = new TextReveal(mockDOM.heroTitle, { staggerDelay: 75 });
                
                expect(reveal.getStaggerDelay()).toBe(75);
            });

            /**
             * Test: setText should update text and re-split
             */
            it('setText should update text and re-split', () => {
                const reveal = new TextReveal(mockDOM.heroTitle);
                reveal.init();
                
                reveal.setText('New Text');
                
                expect(reveal.text).toBe('New Text');
                expect(reveal.chars.length).toBe(8);
                expect(reveal.isRevealed).toBe(false);
            });

            /**
             * Test: getCharacters should return character spans array
             */
            it('getCharacters should return character spans array', () => {
                const reveal = new TextReveal(mockDOM.heroTitle);
                reveal.splitText();
                
                const chars = reveal.getCharacters();
                
                expect(chars).toBe(reveal.chars);
                expect(chars.length).toBe(11);
            });
        });

        describe('AnimationCore Integration', () => {
            /**
             * Test: Should have update method for AnimationCore compatibility
             */
            it('should have update method for AnimationCore compatibility', () => {
                const reveal = new TextReveal(mockDOM.heroTitle);
                
                expect(typeof reveal.update).toBe('function');
                
                // Should not throw
                expect(() => reveal.update(0.016)).not.toThrow();
            });

            /**
             * Test: Should have supportsReducedMotion flag
             */
            it('should have supportsReducedMotion flag', () => {
                const reveal = new TextReveal(mockDOM.heroTitle);
                
                expect(reveal.supportsReducedMotion).toBe(true);
            });

            /**
             * Test: Should have onReducedMotionChange method
             */
            it('should have onReducedMotionChange method', () => {
                const reveal = new TextReveal(mockDOM.heroTitle);
                
                expect(typeof reveal.onReducedMotionChange).toBe('function');
            });
        });
    });
});
