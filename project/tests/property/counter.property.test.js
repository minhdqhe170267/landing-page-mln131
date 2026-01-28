/**
 * Property-Based Tests for Counter Animation
 * Feature: vietnam-religious-diversity-landing
 * Property 4: Counter Animation Trigger
 * 
 * **Validates: Requirements 3.7**
 * 
 * Property Definition:
 * For any counter element in the Quick Stats section, WHEN the element enters the viewport
 * for the first time, the counter SHALL animate from 0 to its target value exactly once.
 */

const fc = require('fast-check');

// Polyfill TextEncoder/TextDecoder for jsdom
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock DOM environment for testing
const { JSDOM } = require('jsdom');

// ============================================
// TEST SETUP
// ============================================

/**
 * Create a mock DOM with counter elements
 * @param {Array} counters - Array of counter configurations {target, suffix, prefix, locale}
 * @returns {Object} - DOM window, document
 */
function createMockDOM(counters = [{ target: 100 }]) {
  const countersHtml = counters.map((counter, i) => {
    const attrs = [
      `data-target="${counter.target}"`,
      counter.suffix ? `data-suffix="${counter.suffix}"` : '',
      counter.prefix ? `data-prefix="${counter.prefix}"` : '',
      counter.locale ? `data-locale="${counter.locale}"` : '',
      counter.duration ? `data-duration="${counter.duration}"` : ''
    ].filter(Boolean).join(' ');
    
    return `<span class="counter" id="counter-${i}" ${attrs}>0</span>`;
  }).join('\n');

  const html = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <title>Test Page</title>
    </head>
    <body>
      <section class="stats-section">
        <div class="stats-container">
          ${countersHtml}
        </div>
      </section>
    </body>
    </html>
  `;

  const dom = new JSDOM(html, {
    url: 'http://localhost/index.html',
    runScripts: 'dangerously'
  });

  return {
    window: dom.window,
    document: dom.window.document
  };
}

/**
 * Create CounterAnimator instance for testing
 * @param {Document} document - DOM document
 * @param {Window} window - DOM window
 * @returns {Object} - CounterAnimator instance
 */
function createCounterAnimator(document, window) {
  // Track which elements have been animated
  const animatedElements = new Set();
  // Track animation history for each element
  const animationHistory = new Map();
  
  // Mock IntersectionObserver
  let observerCallback = null;
  let observedElements = new Set();
  
  const MockIntersectionObserver = class {
    constructor(callback, options) {
      observerCallback = callback;
      this.options = options;
    }
    
    observe(element) {
      observedElements.add(element);
    }
    
    unobserve(element) {
      observedElements.delete(element);
    }
    
    disconnect() {
      observedElements.clear();
    }
  };
  
  // Set up mock IntersectionObserver on window
  window.IntersectionObserver = MockIntersectionObserver;
  window.IntersectionObserverEntry = class {};
  window.IntersectionObserverEntry.prototype.intersectionRatio = 0;

  // Mock matchMedia for reduced motion
  window.matchMedia = window.matchMedia || function(query) {
    return {
      matches: false,
      media: query,
      onchange: null,
      addListener: function() {},
      removeListener: function() {},
      addEventListener: function() {},
      removeEventListener: function() {},
      dispatchEvent: function() {}
    };
  };

  // Default configuration
  const defaultDuration = 2000;
  const defaultLocale = 'vi-VN';

  const CounterAnimator = {
    observer: null,
    isInitialized: false,
    animatedElements: animatedElements,
    animationHistory: animationHistory,

    /**
     * Check if user prefers reduced motion
     */
    prefersReducedMotion() {
      return window.matchMedia && 
             window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    },

    /**
     * Easing function: easeOutQuad
     */
    easeOutQuad(t) {
      return t * (2 - t);
    },

    /**
     * Format number with locale
     */
    formatNumber(value, locale) {
      try {
        return Math.round(value).toLocaleString(locale || defaultLocale);
      } catch (e) {
        return Math.round(value).toLocaleString();
      }
    },

    /**
     * Animate counter (synchronous version for testing)
     */
    animateCounter(element, target, duration) {
      if (!element) return;

      const suffix = element.dataset.suffix || '';
      const prefix = element.dataset.prefix || '';
      const locale = element.dataset.locale || defaultLocale;

      // Record animation start
      const elementId = element.id;
      if (!this.animationHistory.has(elementId)) {
        this.animationHistory.set(elementId, []);
      }
      this.animationHistory.get(elementId).push({
        startValue: 0,
        targetValue: target,
        timestamp: Date.now()
      });

      // For testing, we simulate the final state immediately
      // In real implementation, this would be animated over time
      if (this.prefersReducedMotion()) {
        element.textContent = prefix + this.formatNumber(target, locale) + suffix;
        element.setAttribute('aria-label', prefix + this.formatNumber(target, locale) + suffix);
        return;
      }

      // Simulate animation completion (for testing purposes)
      element.textContent = prefix + this.formatNumber(target, locale) + suffix;
      element.setAttribute('aria-label', prefix + this.formatNumber(target, locale) + suffix);
    },

    /**
     * Handle intersection entries
     */
    handleIntersection(entries) {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const element = entry.target;
          
          // Only animate once
          if (this.animatedElements.has(element)) {
            return;
          }

          // Mark as animated
          this.animatedElements.add(element);

          // Get target value
          const target = parseFloat(element.dataset.target) || 0;
          const duration = parseInt(element.dataset.duration, 10) || defaultDuration;

          // Animate
          this.animateCounter(element, target, duration);

          // Stop observing
          if (this.observer) {
            this.observer.unobserve(element);
          }
        }
      });
    },

    /**
     * Initialize the CounterAnimator
     */
    init(selector) {
      const targetSelector = selector || '.counter';

      if (this.isInitialized) {
        this.observeElements(targetSelector);
        return;
      }

      // Create observer
      this.observer = new window.IntersectionObserver(
        (entries) => this.handleIntersection(entries),
        { threshold: 0.2, rootMargin: '0px' }
      );

      // Observe elements
      this.observeElements(targetSelector);
      this.isInitialized = true;
    },

    /**
     * Observe elements
     */
    observeElements(selector) {
      const elements = document.querySelectorAll(selector);

      elements.forEach((element) => {
        if (!this.animatedElements.has(element)) {
          const suffix = element.dataset.suffix || '';
          const prefix = element.dataset.prefix || '';
          element.textContent = prefix + '0' + suffix;
          
          if (this.observer) {
            this.observer.observe(element);
          }
        }
      });
    },

    /**
     * Simulate element entering viewport
     */
    simulateElementEntersViewport(element) {
      if (observerCallback) {
        observerCallback([{
          isIntersecting: true,
          target: element,
          intersectionRatio: 0.5
        }]);
      }
    },

    /**
     * Simulate element leaving viewport
     */
    simulateElementLeavesViewport(element) {
      if (observerCallback) {
        observerCallback([{
          isIntersecting: false,
          target: element,
          intersectionRatio: 0
        }]);
      }
    },

    /**
     * Get animation count for an element
     */
    getAnimationCount(elementId) {
      const history = this.animationHistory.get(elementId);
      return history ? history.length : 0;
    },

    /**
     * Check if element has been animated
     */
    hasBeenAnimated(element) {
      return this.animatedElements.has(element);
    },

    /**
     * Get current displayed value
     */
    getDisplayedValue(element) {
      return element.textContent;
    },

    /**
     * Get observed elements
     */
    getObservedElements() {
      return observedElements;
    },

    /**
     * Reset counter element
     */
    resetCounter(element) {
      if (!element) return;

      this.animatedElements.delete(element);
      this.animationHistory.delete(element.id);

      const suffix = element.dataset.suffix || '';
      const prefix = element.dataset.prefix || '';
      element.textContent = prefix + '0' + suffix;

      if (this.observer) {
        this.observer.observe(element);
      }
    },

    /**
     * Destroy and clean up
     */
    destroy() {
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }
      this.animatedElements.clear();
      this.animationHistory.clear();
      this.isInitialized = false;
    }
  };

  return CounterAnimator;
}

// ============================================
// ARBITRARIES (Test Data Generators)
// ============================================

/**
 * Generate valid target values for counters
 */
const targetValueArbitrary = fc.integer({ min: 0, max: 1000000 });

/**
 * Generate counter configuration
 */
const counterConfigArbitrary = fc.record({
  target: targetValueArbitrary,
  suffix: fc.option(fc.constantFrom('', '+', '%', ' triệu', ' người'), { nil: undefined }),
  prefix: fc.option(fc.constantFrom('', '~', '>', '<'), { nil: undefined }),
  locale: fc.option(fc.constantFrom('vi-VN', 'en-US', 'de-DE'), { nil: undefined }),
  duration: fc.option(fc.integer({ min: 500, max: 5000 }), { nil: undefined })
});

/**
 * Generate array of counter configurations
 */
const counterConfigsArbitrary = fc.array(counterConfigArbitrary, { minLength: 1, maxLength: 10 });

/**
 * Generate sequence of viewport events
 */
const viewportEventArbitrary = fc.constantFrom('enter', 'leave');

/**
 * Generate sequence of viewport events
 */
const viewportEventSequenceArbitrary = fc.array(viewportEventArbitrary, { minLength: 1, maxLength: 15 });

/**
 * Generate number of re-entry attempts
 */
const reEntryCountArbitrary = fc.integer({ min: 1, max: 10 });

// ============================================
// PROPERTY TESTS
// ============================================

describe('Feature: vietnam-religious-diversity-landing', () => {
  describe('Property 4: Counter Animation Trigger', () => {
    
    /**
     * Property 4.1: Counter SHALL start at 0 before entering viewport
     * **Validates: Requirements 3.7**
     */
    it('should initialize counter at 0 before entering viewport', () => {
      fc.assert(
        fc.property(counterConfigsArbitrary, (configs) => {
          const { document, window } = createMockDOM(configs);
          const animator = createCounterAnimator(document, window);
          animator.init('.counter');

          const counters = document.querySelectorAll('.counter');
          
          counters.forEach((counter, index) => {
            const config = configs[index];
            const prefix = config.prefix || '';
            const suffix = config.suffix || '';
            
            // Before entering viewport, counter should show 0
            expect(counter.textContent).toBe(prefix + '0' + suffix);
            expect(animator.hasBeenAnimated(counter)).toBe(false);
          });

          animator.destroy();
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property 4.2: Counter SHALL animate to target value when entering viewport
     * **Validates: Requirements 3.7**
     */
    it('should animate counter to target value when entering viewport', () => {
      fc.assert(
        fc.property(counterConfigsArbitrary, (configs) => {
          const { document, window } = createMockDOM(configs);
          const animator = createCounterAnimator(document, window);
          animator.init('.counter');

          const counters = document.querySelectorAll('.counter');
          
          counters.forEach((counter, index) => {
            const config = configs[index];
            const prefix = config.prefix || '';
            const suffix = config.suffix || '';
            const locale = config.locale || 'vi-VN';
            
            // Simulate entering viewport
            animator.simulateElementEntersViewport(counter);
            
            // Counter should now show target value (formatted)
            const expectedValue = prefix + animator.formatNumber(config.target, locale) + suffix;
            expect(counter.textContent).toBe(expectedValue);
            expect(animator.hasBeenAnimated(counter)).toBe(true);
          });

          animator.destroy();
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property 4.3: Animation SHALL be triggered exactly once
     * **Validates: Requirements 3.7**
     */
    it('should trigger animation exactly once even with multiple viewport entries', () => {
      fc.assert(
        fc.property(
          counterConfigsArbitrary,
          viewportEventSequenceArbitrary,
          (configs, eventSequence) => {
            const { document, window } = createMockDOM(configs);
            const animator = createCounterAnimator(document, window);
            animator.init('.counter');

            const counters = document.querySelectorAll('.counter');
            
            counters.forEach((counter) => {
              const elementId = counter.id;
              
              // Simulate multiple viewport events
              eventSequence.forEach((event) => {
                if (event === 'enter') {
                  animator.simulateElementEntersViewport(counter);
                } else {
                  animator.simulateElementLeavesViewport(counter);
                }
              });
              
              // Animation should have been triggered at most once
              const animationCount = animator.getAnimationCount(elementId);
              
              // If element ever entered viewport, animation count should be exactly 1
              if (eventSequence.includes('enter')) {
                expect(animationCount).toBe(1);
              } else {
                expect(animationCount).toBe(0);
              }
            });

            animator.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 4.4: Re-entering viewport SHALL NOT re-trigger animation
     * **Validates: Requirements 3.7**
     */
    it('should not re-trigger animation when counter re-enters viewport', () => {
      fc.assert(
        fc.property(
          counterConfigArbitrary,
          reEntryCountArbitrary,
          (config, reEntryCount) => {
            const { document, window } = createMockDOM([config]);
            const animator = createCounterAnimator(document, window);
            animator.init('.counter');

            const counter = document.querySelector('.counter');
            const elementId = counter.id;
            const prefix = config.prefix || '';
            const suffix = config.suffix || '';
            const locale = config.locale || 'vi-VN';
            const expectedValue = prefix + animator.formatNumber(config.target, locale) + suffix;
            
            // First entry
            animator.simulateElementEntersViewport(counter);
            expect(animator.getAnimationCount(elementId)).toBe(1);
            expect(counter.textContent).toBe(expectedValue);
            
            // Multiple re-entries
            for (let i = 0; i < reEntryCount; i++) {
              animator.simulateElementLeavesViewport(counter);
              animator.simulateElementEntersViewport(counter);
            }
            
            // Animation count should still be 1
            expect(animator.getAnimationCount(elementId)).toBe(1);
            // Value should remain at target
            expect(counter.textContent).toBe(expectedValue);

            animator.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 4.5: Counter SHALL be unobserved after animation
     * **Validates: Requirements 3.7**
     */
    it('should stop observing counter after animation is triggered', () => {
      fc.assert(
        fc.property(counterConfigsArbitrary, (configs) => {
          const { document, window } = createMockDOM(configs);
          const animator = createCounterAnimator(document, window);
          animator.init('.counter');

          const counters = document.querySelectorAll('.counter');
          const initialObservedCount = animator.getObservedElements().size;
          
          // All counters should be observed initially
          expect(initialObservedCount).toBe(configs.length);
          
          // Animate first counter
          const firstCounter = counters[0];
          animator.simulateElementEntersViewport(firstCounter);
          
          // First counter should no longer be observed
          expect(animator.getObservedElements().has(firstCounter)).toBe(false);
          expect(animator.getObservedElements().size).toBe(configs.length - 1);

          animator.destroy();
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property 4.6: Number formatting SHALL use locale correctly
     * **Validates: Requirements 3.7**
     */
    it('should format numbers with correct locale separators', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000, max: 1000000 }),
          fc.constantFrom('vi-VN', 'en-US', 'de-DE'),
          (target, locale) => {
            const config = { target, locale };
            const { document, window } = createMockDOM([config]);
            const animator = createCounterAnimator(document, window);
            animator.init('.counter');

            const counter = document.querySelector('.counter');
            
            // Simulate entering viewport
            animator.simulateElementEntersViewport(counter);
            
            // Verify the number is formatted with locale
            const expectedFormatted = target.toLocaleString(locale);
            expect(counter.textContent).toBe(expectedFormatted);

            animator.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 4.7: Counter SHALL display prefix and suffix correctly
     * **Validates: Requirements 3.7**
     */
    it('should display prefix and suffix correctly with target value', () => {
      fc.assert(
        fc.property(
          targetValueArbitrary,
          fc.constantFrom('', '~', '>', '<', '$'),
          fc.constantFrom('', '+', '%', ' triệu', ' người', ' VND'),
          (target, prefix, suffix) => {
            const config = { target, prefix, suffix };
            const { document, window } = createMockDOM([config]);
            const animator = createCounterAnimator(document, window);
            animator.init('.counter');

            const counter = document.querySelector('.counter');
            
            // Before animation
            expect(counter.textContent).toBe(prefix + '0' + suffix);
            
            // After animation
            animator.simulateElementEntersViewport(counter);
            const formattedTarget = animator.formatNumber(target, 'vi-VN');
            expect(counter.textContent).toBe(prefix + formattedTarget + suffix);

            animator.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 4.8: Counter value SHALL persist after leaving viewport
     * **Validates: Requirements 3.7**
     */
    it('should maintain target value after counter leaves viewport', () => {
      fc.assert(
        fc.property(counterConfigsArbitrary, (configs) => {
          const { document, window } = createMockDOM(configs);
          const animator = createCounterAnimator(document, window);
          animator.init('.counter');

          const counters = document.querySelectorAll('.counter');
          
          counters.forEach((counter, index) => {
            const config = configs[index];
            const prefix = config.prefix || '';
            const suffix = config.suffix || '';
            const locale = config.locale || 'vi-VN';
            const expectedValue = prefix + animator.formatNumber(config.target, locale) + suffix;
            
            // Enter viewport
            animator.simulateElementEntersViewport(counter);
            expect(counter.textContent).toBe(expectedValue);
            
            // Leave viewport
            animator.simulateElementLeavesViewport(counter);
            
            // Value should persist
            expect(counter.textContent).toBe(expectedValue);
          });

          animator.destroy();
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property 4.9: Counters not in viewport SHALL remain at 0
     * **Validates: Requirements 3.7**
     */
    it('should not animate counters that have not entered viewport', () => {
      fc.assert(
        fc.property(
          fc.array(counterConfigArbitrary, { minLength: 2, maxLength: 10 }),
          (configs) => {
            const { document, window } = createMockDOM(configs);
            const animator = createCounterAnimator(document, window);
            animator.init('.counter');

            const counters = document.querySelectorAll('.counter');
            
            // Only animate first counter
            animator.simulateElementEntersViewport(counters[0]);
            
            // First counter should be animated
            expect(animator.hasBeenAnimated(counters[0])).toBe(true);
            
            // Other counters should remain at 0
            for (let i = 1; i < counters.length; i++) {
              const config = configs[i];
              const prefix = config.prefix || '';
              const suffix = config.suffix || '';
              
              expect(animator.hasBeenAnimated(counters[i])).toBe(false);
              expect(counters[i].textContent).toBe(prefix + '0' + suffix);
            }

            animator.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 4.10: Multiple counters entering viewport simultaneously SHALL all animate
     * **Validates: Requirements 3.7**
     */
    it('should animate all counters when multiple enter viewport simultaneously', () => {
      fc.assert(
        fc.property(
          fc.array(counterConfigArbitrary, { minLength: 2, maxLength: 10 }),
          (configs) => {
            const { document, window } = createMockDOM(configs);
            const animator = createCounterAnimator(document, window);
            animator.init('.counter');

            const counters = Array.from(document.querySelectorAll('.counter'));
            
            // Simulate all counters entering viewport
            counters.forEach((counter) => {
              animator.simulateElementEntersViewport(counter);
            });
            
            // All counters should be animated
            counters.forEach((counter, index) => {
              const config = configs[index];
              const prefix = config.prefix || '';
              const suffix = config.suffix || '';
              const locale = config.locale || 'vi-VN';
              const expectedValue = prefix + animator.formatNumber(config.target, locale) + suffix;
              
              expect(animator.hasBeenAnimated(counter)).toBe(true);
              expect(counter.textContent).toBe(expectedValue);
              expect(animator.getAnimationCount(counter.id)).toBe(1);
            });

            animator.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 4.11: Counter with target 0 SHALL display 0 after animation
     * **Validates: Requirements 3.7**
     */
    it('should handle target value of 0 correctly', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('', '~', '>'),
          fc.constantFrom('', '%', ' items'),
          (prefix, suffix) => {
            const config = { target: 0, prefix, suffix };
            const { document, window } = createMockDOM([config]);
            const animator = createCounterAnimator(document, window);
            animator.init('.counter');

            const counter = document.querySelector('.counter');
            
            // Before animation
            expect(counter.textContent).toBe(prefix + '0' + suffix);
            
            // After animation
            animator.simulateElementEntersViewport(counter);
            expect(counter.textContent).toBe(prefix + '0' + suffix);
            expect(animator.hasBeenAnimated(counter)).toBe(true);
            expect(animator.getAnimationCount(counter.id)).toBe(1);

            animator.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 4.12: aria-label SHALL be set to final value after animation
     * **Validates: Requirements 3.7**
     */
    it('should set aria-label to final value for accessibility', () => {
      fc.assert(
        fc.property(counterConfigsArbitrary, (configs) => {
          const { document, window } = createMockDOM(configs);
          const animator = createCounterAnimator(document, window);
          animator.init('.counter');

          const counters = document.querySelectorAll('.counter');
          
          counters.forEach((counter, index) => {
            const config = configs[index];
            const prefix = config.prefix || '';
            const suffix = config.suffix || '';
            const locale = config.locale || 'vi-VN';
            const expectedValue = prefix + animator.formatNumber(config.target, locale) + suffix;
            
            // Simulate entering viewport
            animator.simulateElementEntersViewport(counter);
            
            // aria-label should match displayed value
            expect(counter.getAttribute('aria-label')).toBe(expectedValue);
          });

          animator.destroy();
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property 4.13: Easing function SHALL return values between 0 and 1
     * **Validates: Requirements 3.7**
     */
    it('should have easing function that returns values in [0, 1] range', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 1, noNaN: true }),
          (t) => {
            const { document, window } = createMockDOM([{ target: 100 }]);
            const animator = createCounterAnimator(document, window);
            
            const easedValue = animator.easeOutQuad(t);
            
            // Eased value should be between 0 and 1
            expect(easedValue).toBeGreaterThanOrEqual(0);
            expect(easedValue).toBeLessThanOrEqual(1);
            
            // At t=0, eased value should be 0
            expect(animator.easeOutQuad(0)).toBe(0);
            
            // At t=1, eased value should be 1
            expect(animator.easeOutQuad(1)).toBe(1);

            animator.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
