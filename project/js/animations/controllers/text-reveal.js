/**
 * TextReveal - Character-by-character text reveal animation
 * Creates "glitch to solid" effect with stagger delay
 * 
 * Requirements:
 * - 2.7: Apply "Glitch to Solid" text reveal effect
 * - 2.8: Animate each character with stagger delay of 50ms
 * - 9.1, 9.2: Support reduced motion (show text immediately)
 * 
 * Design Interface:
 * - splitText(): Split text into individual character spans
 * - reveal(): Animate reveal (integrates with AnimationCore)
 * - reset(): Reset to initial state
 * 
 * @module animations/controllers/text-reveal
 */

import { GPUAccelerator } from '../core/gpu-accelerator.js';
import { prefersReducedMotion } from '../core/reduced-motion.js';

/**
 * Default stagger delay between characters in milliseconds
 * Validates: Requirements 2.8
 */
const DEFAULT_STAGGER_DELAY = 50;

/**
 * Default animation duration per character in milliseconds
 */
const DEFAULT_DURATION = 800;

/**
 * Default easing function for the animation
 */
const DEFAULT_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';

/**
 * Glitch characters used for the glitch effect
 */
const GLITCH_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/**
 * TextReveal class
 * Animates text character-by-character with glitch-to-solid effect
 */
class TextReveal {
    /**
     * Create a TextReveal instance
     * @param {HTMLElement} element - The text element to animate
     * @param {Object} [options] - Configuration options
     * @param {number} [options.staggerDelay=50] - Delay between characters in ms
     * @param {number} [options.duration=800] - Animation duration per character in ms
     * @param {string} [options.easing] - CSS easing function
     * @param {number} [options.glitchIterations=5] - Number of glitch iterations before settling
     * @param {number} [options.glitchSpeed=50] - Speed of glitch character changes in ms
     */
    constructor(element, options = {}) {
        if (!element || !(element instanceof HTMLElement)) {
            throw new Error('TextReveal: Valid HTML element is required');
        }

        /**
         * The target element containing text
         * @type {HTMLElement}
         */
        this.element = element;

        /**
         * Original text content
         * @type {string}
         */
        this.text = element.textContent || '';

        /**
         * Array of character span elements
         * @type {HTMLSpanElement[]}
         */
        this.chars = [];

        /**
         * Configuration options
         * @type {Object}
         */
        this.options = {
            staggerDelay: options.staggerDelay ?? DEFAULT_STAGGER_DELAY,
            duration: options.duration ?? DEFAULT_DURATION,
            easing: options.easing || DEFAULT_EASING,
            glitchIterations: options.glitchIterations ?? 5,
            glitchSpeed: options.glitchSpeed ?? 50
        };

        /**
         * Whether the text has been split into characters
         * @type {boolean}
         */
        this.isSplit = false;

        /**
         * Whether the reveal animation is in progress
         * @type {boolean}
         */
        this.isAnimating = false;

        /**
         * Whether the reveal animation has completed
         * @type {boolean}
         */
        this.isRevealed = false;

        /**
         * Whether this controller has been initialized
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
        this.supportsReducedMotion = true;

        /**
         * Array of active animation timeouts (for cleanup)
         * @type {number[]}
         */
        this.timeouts = [];

        /**
         * Array of active animation intervals (for cleanup)
         * @type {number[]}
         */
        this.intervals = [];
    }

    /**
     * Initialize the text reveal
     * Splits text and prepares for animation
     */
    init() {
        // Check reduced motion preference
        this.isReducedMotion = prefersReducedMotion();

        // Split text into character spans
        this.splitText();

        this.isInitialized = true;

        // If reduced motion, show text immediately
        if (this.isReducedMotion) {
            this._showImmediately();
        }
    }

    /**
     * Split text into individual character spans
     * Each character gets its own span for individual animation
     * 
     * @returns {HTMLSpanElement[]} Array of character span elements
     */
    splitText() {
        if (this.isSplit) {
            return this.chars;
        }

        // Clear existing content
        this.element.innerHTML = '';
        this.chars = [];

        // Create a span for each character
        for (let i = 0; i < this.text.length; i++) {
            const char = this.text[i];
            const span = document.createElement('span');
            
            // Handle whitespace - preserve it but make it non-breaking
            if (char === ' ') {
                span.innerHTML = '&nbsp;';
                span.className = 'text-reveal-char text-reveal-space';
            } else {
                span.textContent = char;
                span.className = 'text-reveal-char';
            }

            // Store original character as data attribute
            span.dataset.char = char;
            span.dataset.index = i.toString();

            // Initial state: hidden
            span.style.opacity = '0';
            span.style.display = 'inline-block';
            
            // Apply GPU acceleration for smooth animation
            GPUAccelerator.setWillChange(span, ['opacity', 'transform']);

            this.element.appendChild(span);
            this.chars.push(span);
        }

        this.isSplit = true;
        return this.chars;
    }

    /**
     * Calculate the animation delay for a character at given index
     * 
     * @param {number} index - Character index
     * @returns {number} Delay in milliseconds
     * 
     * Validates: Requirements 2.8 - stagger delay of 50ms per character
     */
    getCharacterDelay(index) {
        return index * this.options.staggerDelay;
    }

    /**
     * Animate the text reveal with glitch-to-solid effect
     * Integrates with AnimationCore via this method
     * 
     * @returns {Promise<void>} Resolves when animation completes
     * 
     * Validates: Requirements 2.7, 2.8
     */
    reveal() {
        return new Promise((resolve) => {
            // If reduced motion, show immediately
            if (this.isReducedMotion) {
                this._showImmediately();
                resolve();
                return;
            }

            // If already revealed or animating, resolve immediately
            if (this.isRevealed || this.isAnimating) {
                resolve();
                return;
            }

            // Ensure text is split
            if (!this.isSplit) {
                this.splitText();
            }

            this.isAnimating = true;

            // Animate each character with stagger
            const totalChars = this.chars.length;
            let completedChars = 0;

            for (let i = 0; i < this.chars.length; i++) {
                const char = this.chars[i];
                const delay = this.getCharacterDelay(i);

                // Schedule the glitch animation for this character
                const timeoutId = setTimeout(() => {
                    this._animateCharacter(char, i, () => {
                        completedChars++;
                        
                        // Check if all characters are done
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

            // Handle empty text case
            if (totalChars === 0) {
                this.isAnimating = false;
                this.isRevealed = true;
                resolve();
            }
        });
    }

    /**
     * Animate a single character with glitch effect
     * @private
     * @param {HTMLSpanElement} charSpan - The character span element
     * @param {number} index - Character index
     * @param {Function} onComplete - Callback when animation completes
     */
    _animateCharacter(charSpan, index, onComplete) {
        const originalChar = charSpan.dataset.char;
        const isSpace = originalChar === ' ';
        
        // For spaces, just fade in
        if (isSpace) {
            charSpan.style.transition = `opacity ${this.options.duration}ms ${this.options.easing}`;
            charSpan.style.opacity = '1';
            
            const timeoutId = setTimeout(onComplete, this.options.duration);
            this.timeouts.push(timeoutId);
            return;
        }

        // Show the character (start glitching)
        charSpan.style.opacity = '1';

        // Glitch phase: rapidly change characters
        let iterations = 0;
        const maxIterations = this.options.glitchIterations;
        
        const intervalId = setInterval(() => {
            if (iterations >= maxIterations) {
                // Final state: show original character
                clearInterval(intervalId);
                charSpan.textContent = originalChar;
                charSpan.classList.add('text-reveal-revealed');
                
                // Clear will-change after animation
                GPUAccelerator.clearWillChange(charSpan);
                
                onComplete();
                return;
            }

            // Random glitch character
            const glitchChar = GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
            charSpan.textContent = glitchChar;
            charSpan.classList.add('text-reveal-glitching');
            
            iterations++;
        }, this.options.glitchSpeed);

        this.intervals.push(intervalId);
    }

    /**
     * Show text immediately without animation (for reduced motion)
     * @private
     * 
     * Validates: Requirements 9.2
     */
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

    /**
     * Cleanup animation resources
     * @private
     */
    _cleanup() {
        // Clear all timeouts
        for (const timeoutId of this.timeouts) {
            clearTimeout(timeoutId);
        }
        this.timeouts = [];

        // Clear all intervals
        for (const intervalId of this.intervals) {
            clearInterval(intervalId);
        }
        this.intervals = [];
    }

    /**
     * Reset to initial state (hidden)
     * Allows re-playing the animation
     */
    reset() {
        // Stop any ongoing animation
        this._cleanup();

        // Reset all characters to hidden state
        for (const char of this.chars) {
            char.style.opacity = '0';
            char.style.transition = '';
            char.classList.remove('text-reveal-revealed', 'text-reveal-glitching');
            
            // Restore original character
            const originalChar = char.dataset.char;
            if (originalChar === ' ') {
                char.innerHTML = '&nbsp;';
            } else {
                char.textContent = originalChar;
            }

            // Re-apply will-change for next animation
            GPUAccelerator.setWillChange(char, ['opacity', 'transform']);
        }

        this.isRevealed = false;
        this.isAnimating = false;
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

        if (isReducedMotion) {
            // Stop any ongoing animation and show immediately
            this._cleanup();
            this._showImmediately();
        }
    }

    /**
     * Update method (for AnimationCore compatibility)
     * TextReveal doesn't need continuous updates, but provides this for interface compliance
     * 
     * @param {number} deltaTime - Time since last frame
     */
    update(deltaTime) {
        // TextReveal uses setTimeout/setInterval for animation
        // This method exists for AnimationCore interface compatibility
    }

    /**
     * Get the number of characters
     * 
     * @returns {number} Number of characters
     */
    getCharacterCount() {
        return this.chars.length;
    }

    /**
     * Get all character spans
     * 
     * @returns {HTMLSpanElement[]} Array of character span elements
     */
    getCharacters() {
        return this.chars;
    }

    /**
     * Get the original text
     * 
     * @returns {string} Original text content
     */
    getText() {
        return this.text;
    }

    /**
     * Get the stagger delay setting
     * 
     * @returns {number} Stagger delay in milliseconds
     */
    getStaggerDelay() {
        return this.options.staggerDelay;
    }

    /**
     * Set new text content
     * Resets and re-splits the text
     * 
     * @param {string} text - New text content
     */
    setText(text) {
        this.text = text;
        this.isSplit = false;
        this.isRevealed = false;
        this.isAnimating = false;
        this._cleanup();
        
        // Re-split with new text
        this.splitText();
    }

    /**
     * Cleanup and destroy the text reveal
     * Restores original text content
     * 
     * Validates: Requirements 8.3
     * Property 19: Animation Cleanup
     * - Remove all event listeners (N/A - uses timeouts/intervals)
     * - Clear all animation frames (clears timeouts/intervals)
     * - Reset all element styles to initial state
     * - Set isInitialized to false
     * - Clear any arrays/maps of elements
     */
    destroy() {
        // Stop any ongoing animation (clears timeouts and intervals)
        this._cleanup();

        // Clear will-change from all characters
        for (const char of this.chars) {
            GPUAccelerator.clearWillChange(char);
        }

        // Restore original text content
        this.element.textContent = this.text;

        // Reset state
        this.chars = [];
        this.isSplit = false;
        this.isRevealed = false;
        this.isAnimating = false;
        this.isInitialized = false;
        this.isReducedMotion = false;
        this.timeouts = [];
        this.intervals = [];
    }
}

// Export for ES modules
export { 
    TextReveal, 
    DEFAULT_STAGGER_DELAY, 
    DEFAULT_DURATION, 
    DEFAULT_EASING,
    GLITCH_CHARS 
};

// Also export as default
export default TextReveal;
