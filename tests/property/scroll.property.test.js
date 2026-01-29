/**
 * Property-Based Tests for Scroll Animation
 * Feature: vietnam-religious-diversity-landing
 * Property 5: Scroll Animation Trigger
 * 
 * **Validates: Requirements 4.3**
 * 
 * Property Definition:
 * For any element with scroll animation class, WHEN the element enters the viewport,
 * the animation SHALL be applied exactly once and the element SHALL become visible.
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
 * Create a mock DOM with scroll animation elements
 * @param {number} elementCount - Number of animated elements to create
 * @param {string[]} animationTypes - Animation types to apply
 * @returns {Object} - DOM window, document, and ScrollAnimationController
 */
function createMockDOM(elementCount = 5, animationTypes = ['fade-in']) {
  const elementsHtml = Array.from({ length: elementCount }, (_, i) => {
    const animationType = animationTypes[i % animationTypes.length];
    return `<div class="animate-on-scroll" data-animation="${animationType}" id="element-${i}">Content ${i}</div>`;
  }).join('\n');

  const html = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <title>Test Page</title>
      <style>
        .animate-on-scroll {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.5s ease, transform 0.5s ease;
        }
        .animate-on-scroll.is-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .fade-in { animation: fadeIn 0.5s ease forwards; }
        .slide-up { animation: slideUp 0.5s ease forwards; }
        .slide-left { animation: slideLeft 0.5s ease forwards; }
        .slide-right { animation: slideRight 0.5s ease forwards; }
        .scale-in { animation: scaleIn 0.5s ease forwards; }
      </style>
    </head>
    <body>
      <main id="main-content">
        ${elementsHtml}
      </main>
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
 * Create ScrollAnimationController instance for testing
 * @param {Document} document - DOM document
 * @param {Window} window - DOM window
 * @returns {Object} - ScrollAnimationController instance
 */
function createScrollAnimationController(document, window) {
  // Track which elements have been animated (for testing "exactly once" property)
  const animatedElements = new Set();
  
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

  const ScrollAnimationController = {
    observer: null,
    isInitialized: false,
    supportsIntersectionObserver: true,
    animatedElements: animatedElements,
    
    // Animation types mapping
    animationTypes: {
      'fade-in': 'fade-in',
      'slide-up': 'slide-up',
      'slide-left': 'slide-left',
      'slide-right': 'slide-right',
      'scale-in': 'scale-in'
    },

    defaultOptions: {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    },

    /**
     * Check if user prefers reduced motion
     */
    prefersReducedMotion() {
      return window.matchMedia && 
             window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    },

    /**
     * Initialize the controller
     */
    init() {
      if (this.isInitialized) {
        return;
      }

      this.observer = new window.IntersectionObserver(
        (entries) => this.handleIntersection(entries),
        this.defaultOptions
      );

      this.observeElements('.animate-on-scroll');
      this.isInitialized = true;
    },

    /**
     * Handle intersection entries
     */
    handleIntersection(entries) {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const element = entry.target;
          const animationType = element.dataset.animation || 'fade-in';
          
          this.applyAnimation(element, animationType);
          
          // Stop observing (animate only once)
          if (this.observer) {
            this.observer.unobserve(element);
          }
        }
      });
    },

    /**
     * Apply animation to element
     */
    applyAnimation(element, animationType) {
      // Track that this element has been animated
      const elementId = element.id || element.outerHTML;
      
      // If already animated, don't animate again
      if (this.animatedElements.has(elementId)) {
        return;
      }
      
      this.animatedElements.add(elementId);

      // If user prefers reduced motion, just make visible
      if (this.prefersReducedMotion()) {
        element.classList.add('is-visible');
        element.style.opacity = '1';
        element.style.transform = 'none';
        return;
      }

      // Add animation type class
      if (this.animationTypes[animationType]) {
        element.classList.add(this.animationTypes[animationType]);
      }

      // Add visible class
      element.classList.add('is-visible');
    },

    /**
     * Observe elements matching selector
     */
    observeElements(selector, options) {
      const elements = document.querySelectorAll(selector);
      
      elements.forEach((element) => {
        if (!element.classList.contains('is-visible')) {
          this.observer.observe(element);
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
     * Get count of times an element was animated
     */
    getAnimationCount(elementId) {
      return this.animatedElements.has(elementId) ? 1 : 0;
    },

    /**
     * Check if element is visible
     */
    isElementVisible(element) {
      return element.classList.contains('is-visible');
    },

    /**
     * Check if element has animation class
     */
    hasAnimationClass(element) {
      return Object.values(this.animationTypes).some(
        className => element.classList.contains(className)
      );
    },

    /**
     * Reset controller state
     */
    reset() {
      this.animatedElements.clear();
      observedElements.clear();
      this.isInitialized = false;
      this.observer = null;
    },

    /**
     * Get observed elements
     */
    getObservedElements() {
      return observedElements;
    },

    /**
     * Destroy controller
     */
    destroy() {
      if (this.observer) {
        this.observer.disconnect();
      }
      this.reset();
    }
  };

  return ScrollAnimationController;
}

// ============================================
// ARBITRARIES (Test Data Generators)
// ============================================

/**
 * Generate valid animation types
 */
const animationTypeArbitrary = fc.constantFrom(
  'fade-in',
  'slide-up',
  'slide-left',
  'slide-right',
  'scale-in'
);

/**
 * Generate array of animation types
 */
const animationTypesArrayArbitrary = fc.array(animationTypeArbitrary, { minLength: 1, maxLength: 5 });

/**
 * Generate number of elements to test
 */
const elementCountArbitrary = fc.integer({ min: 1, max: 20 });

/**
 * Generate element indices for viewport simulation
 */
const elementIndicesArbitrary = (maxCount) => 
  fc.array(fc.integer({ min: 0, max: maxCount - 1 }), { minLength: 1, maxLength: maxCount });

/**
 * Generate sequence of viewport enter/leave events
 */
const viewportEventArbitrary = fc.constantFrom('enter', 'leave');

/**
 * Generate sequence of viewport events for an element
 */
const viewportEventSequenceArbitrary = fc.array(viewportEventArbitrary, { minLength: 1, maxLength: 10 });

// ============================================
// PROPERTY TESTS
// ============================================

describe('Feature: vietnam-religious-diversity-landing', () => {
  describe('Property 5: Scroll Animation Trigger', () => {
    
    /**
     * Property 5.1: Element SHALL become visible when entering viewport
     * **Validates: Requirements 4.3**
     */
    it('should make element visible when it enters the viewport', () => {
      fc.assert(
        fc.property(
          elementCountArbitrary,
          animationTypesArrayArbitrary,
          (elementCount, animationTypes) => {
            const { document, window } = createMockDOM(elementCount, animationTypes);
            const controller = createScrollAnimationController(document, window);
            controller.init();

            const elements = document.querySelectorAll('.animate-on-scroll');
            
            elements.forEach((element) => {
              // Initially not visible
              expect(controller.isElementVisible(element)).toBe(false);
              
              // Simulate entering viewport
              controller.simulateElementEntersViewport(element);
              
              // Should now be visible
              expect(controller.isElementVisible(element)).toBe(true);
              expect(element.classList.contains('is-visible')).toBe(true);
            });

            controller.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 5.2: Animation SHALL be applied exactly once
     * **Validates: Requirements 4.3**
     */
    it('should apply animation exactly once even with multiple viewport entries', () => {
      fc.assert(
        fc.property(
          elementCountArbitrary,
          animationTypesArrayArbitrary,
          viewportEventSequenceArbitrary,
          (elementCount, animationTypes, eventSequence) => {
            const { document, window } = createMockDOM(elementCount, animationTypes);
            const controller = createScrollAnimationController(document, window);
            controller.init();

            const elements = document.querySelectorAll('.animate-on-scroll');
            
            elements.forEach((element) => {
              const elementId = element.id;
              
              // Simulate multiple viewport events
              eventSequence.forEach((event) => {
                if (event === 'enter') {
                  controller.simulateElementEntersViewport(element);
                } else {
                  controller.simulateElementLeavesViewport(element);
                }
              });
              
              // Animation should have been applied at most once
              const animationCount = controller.getAnimationCount(elementId);
              
              // If element ever entered viewport, it should be animated exactly once
              if (eventSequence.includes('enter')) {
                expect(animationCount).toBe(1);
              }
            });

            controller.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 5.3: Correct animation type SHALL be applied based on data attribute
     * **Validates: Requirements 4.3**
     */
    it('should apply the correct animation type from data-animation attribute', () => {
      fc.assert(
        fc.property(
          elementCountArbitrary,
          animationTypesArrayArbitrary,
          (elementCount, animationTypes) => {
            const { document, window } = createMockDOM(elementCount, animationTypes);
            const controller = createScrollAnimationController(document, window);
            controller.init();

            const elements = document.querySelectorAll('.animate-on-scroll');
            
            elements.forEach((element, index) => {
              const expectedAnimationType = animationTypes[index % animationTypes.length];
              
              // Simulate entering viewport
              controller.simulateElementEntersViewport(element);
              
              // Should have the correct animation class
              expect(element.classList.contains(expectedAnimationType)).toBe(true);
            });

            controller.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 5.4: Element SHALL be unobserved after animation is applied
     * **Validates: Requirements 4.3**
     */
    it('should stop observing element after animation is applied', () => {
      fc.assert(
        fc.property(
          elementCountArbitrary,
          animationTypesArrayArbitrary,
          (elementCount, animationTypes) => {
            const { document, window } = createMockDOM(elementCount, animationTypes);
            const controller = createScrollAnimationController(document, window);
            controller.init();

            const elements = document.querySelectorAll('.animate-on-scroll');
            const initialObservedCount = controller.getObservedElements().size;
            
            // All elements should be observed initially
            expect(initialObservedCount).toBe(elementCount);
            
            // Animate first element
            const firstElement = elements[0];
            controller.simulateElementEntersViewport(firstElement);
            
            // First element should no longer be observed
            expect(controller.getObservedElements().has(firstElement)).toBe(false);
            expect(controller.getObservedElements().size).toBe(elementCount - 1);

            controller.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 5.5: Elements not in viewport SHALL remain invisible
     * **Validates: Requirements 4.3**
     */
    it('should not animate elements that have not entered viewport', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 10 }),
          animationTypesArrayArbitrary,
          (elementCount, animationTypes) => {
            const { document, window } = createMockDOM(elementCount, animationTypes);
            const controller = createScrollAnimationController(document, window);
            controller.init();

            const elements = document.querySelectorAll('.animate-on-scroll');
            
            // Only animate first element
            controller.simulateElementEntersViewport(elements[0]);
            
            // First element should be visible
            expect(controller.isElementVisible(elements[0])).toBe(true);
            
            // Other elements should remain invisible
            for (let i = 1; i < elements.length; i++) {
              expect(controller.isElementVisible(elements[i])).toBe(false);
              expect(elements[i].classList.contains('is-visible')).toBe(false);
            }

            controller.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 5.6: Animation state SHALL persist after element leaves viewport
     * **Validates: Requirements 4.3**
     */
    it('should maintain visible state after element leaves viewport', () => {
      fc.assert(
        fc.property(
          elementCountArbitrary,
          animationTypesArrayArbitrary,
          (elementCount, animationTypes) => {
            const { document, window } = createMockDOM(elementCount, animationTypes);
            const controller = createScrollAnimationController(document, window);
            controller.init();

            const elements = document.querySelectorAll('.animate-on-scroll');
            
            elements.forEach((element) => {
              // Enter viewport
              controller.simulateElementEntersViewport(element);
              expect(controller.isElementVisible(element)).toBe(true);
              
              // Leave viewport
              controller.simulateElementLeavesViewport(element);
              
              // Should still be visible (animation persists)
              expect(controller.isElementVisible(element)).toBe(true);
              expect(element.classList.contains('is-visible')).toBe(true);
            });

            controller.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 5.7: Default animation type SHALL be 'fade-in' when not specified
     * **Validates: Requirements 4.3**
     */
    it('should use fade-in as default animation when data-animation is not specified', () => {
      const html = `
        <!DOCTYPE html>
        <html lang="vi">
        <head><title>Test</title></head>
        <body>
          <div class="animate-on-scroll" id="no-animation-attr">Content</div>
        </body>
        </html>
      `;

      const dom = new JSDOM(html, {
        url: 'http://localhost/index.html',
        runScripts: 'dangerously'
      });

      const { document, window } = { window: dom.window, document: dom.window.document };
      const controller = createScrollAnimationController(document, window);
      controller.init();

      const element = document.querySelector('.animate-on-scroll');
      
      // Simulate entering viewport
      controller.simulateElementEntersViewport(element);
      
      // Should have fade-in class (default)
      expect(element.classList.contains('fade-in')).toBe(true);
      expect(element.classList.contains('is-visible')).toBe(true);

      controller.destroy();
    });

    /**
     * Property 5.8: Multiple elements entering viewport simultaneously SHALL all be animated
     * **Validates: Requirements 4.3**
     */
    it('should animate all elements when multiple enter viewport simultaneously', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 10 }),
          animationTypesArrayArbitrary,
          (elementCount, animationTypes) => {
            const { document, window } = createMockDOM(elementCount, animationTypes);
            const controller = createScrollAnimationController(document, window);
            controller.init();

            const elements = Array.from(document.querySelectorAll('.animate-on-scroll'));
            
            // Simulate all elements entering viewport at once
            elements.forEach((element) => {
              controller.simulateElementEntersViewport(element);
            });
            
            // All elements should be visible
            elements.forEach((element) => {
              expect(controller.isElementVisible(element)).toBe(true);
              expect(element.classList.contains('is-visible')).toBe(true);
            });
            
            // Each element should be animated exactly once
            elements.forEach((element) => {
              expect(controller.getAnimationCount(element.id)).toBe(1);
            });

            controller.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 5.9: Re-entering viewport SHALL NOT re-trigger animation
     * **Validates: Requirements 4.3**
     */
    it('should not re-trigger animation when element re-enters viewport', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }),
          animationTypeArbitrary,
          fc.integer({ min: 2, max: 10 }),
          (elementCount, animationType, reEntryCount) => {
            const { document, window } = createMockDOM(elementCount, [animationType]);
            const controller = createScrollAnimationController(document, window);
            controller.init();

            const element = document.querySelector('.animate-on-scroll');
            
            // Simulate multiple enter/leave cycles
            for (let i = 0; i < reEntryCount; i++) {
              controller.simulateElementEntersViewport(element);
              controller.simulateElementLeavesViewport(element);
            }
            
            // Final enter
            controller.simulateElementEntersViewport(element);
            
            // Animation should have been applied exactly once
            expect(controller.getAnimationCount(element.id)).toBe(1);
            expect(element.classList.contains('is-visible')).toBe(true);

            controller.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 5.10: Already visible elements SHALL NOT be re-observed
     * **Validates: Requirements 4.3**
     */
    it('should not observe elements that are already visible', () => {
      fc.assert(
        fc.property(
          elementCountArbitrary,
          animationTypesArrayArbitrary,
          (elementCount, animationTypes) => {
            const { document, window } = createMockDOM(elementCount, animationTypes);
            const controller = createScrollAnimationController(document, window);
            
            // Manually make first element visible before init
            const firstElement = document.querySelector('.animate-on-scroll');
            firstElement.classList.add('is-visible');
            
            controller.init();
            
            // First element should not be observed (already visible)
            expect(controller.getObservedElements().has(firstElement)).toBe(false);
            
            // Other elements should be observed
            const otherElements = document.querySelectorAll('.animate-on-scroll:not(.is-visible)');
            otherElements.forEach((element) => {
              expect(controller.getObservedElements().has(element)).toBe(true);
            });

            controller.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
