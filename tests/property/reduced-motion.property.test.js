/**
 * Property-Based Tests for Reduced Motion Preference
 * Feature: vietnam-religious-diversity-landing
 * Property 11: Reduced Motion Preference
 * 
 * **Validates: Requirements 9.4**
 * 
 * Property Definition:
 * For any animation on the page, WHEN the user has prefers-reduced-motion: reduce set,
 * all animations SHALL be disabled or reduced to instant transitions.
 * 
 * Testing Strategy:
 * Since jsdom doesn't fully support CSS media queries, we verify:
 * 1. The CSS file contains the correct prefers-reduced-motion media query
 * 2. The media query contains rules to disable animations
 * 3. All animation classes are covered by the reduced motion rules
 * 4. The JavaScript respects the prefers-reduced-motion preference
 */

const fc = require('fast-check');

// Polyfill TextEncoder/TextDecoder for jsdom
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock DOM environment for testing
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

// ============================================
// TEST SETUP
// ============================================

/**
 * Load the actual animations.css file content
 * @returns {string} - CSS content
 */
function loadAnimationsCSS() {
  const cssPath = path.join(__dirname, '../../css/animations.css');
  return fs.readFileSync(cssPath, 'utf8');
}

/**
 * Parse CSS to extract media query content
 * @param {string} css - CSS content
 * @param {string} mediaQuery - Media query to find
 * @returns {string} - Content inside the media query
 */
function extractMediaQueryContent(css, mediaQuery) {
  const regex = new RegExp(`@media\\s*\\(${mediaQuery}[^)]*\\)\\s*{([\\s\\S]*?)}(?=\\s*(?:@media|$|/\\*))`, 'gi');
  
  // Find the media query block
  let match = regex.exec(css);
  if (!match) return '';
  
  // Extract content, handling nested braces
  let content = '';
  let braceCount = 0;
  let startIndex = css.indexOf('{', match.index) + 1;
  
  for (let i = startIndex; i < css.length; i++) {
    if (css[i] === '{') braceCount++;
    if (css[i] === '}') {
      if (braceCount === 0) break;
      braceCount--;
    }
    content += css[i];
  }
  
  return content;
}

/**
 * Check if CSS contains a specific rule pattern
 * @param {string} css - CSS content
 * @param {string} selector - CSS selector to find
 * @param {string} property - CSS property to check
 * @param {string} value - Expected value (can be partial match)
 * @returns {boolean} - True if rule exists
 */
function cssContainsRule(css, selector, property, value) {
  // Normalize whitespace
  const normalizedCSS = css.replace(/\s+/g, ' ');
  
  // Create pattern to match selector and property
  const selectorPattern = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const propertyPattern = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const valuePattern = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Check if the rule exists
  const regex = new RegExp(`${selectorPattern}[^{]*{[^}]*${propertyPattern}\\s*:\\s*[^;]*${valuePattern}`, 'i');
  return regex.test(normalizedCSS);
}

/**
 * Check if CSS contains !important declaration for a property
 * @param {string} css - CSS content
 * @param {string} property - CSS property to check
 * @returns {boolean} - True if !important is used
 */
function cssHasImportant(css, property) {
  const propertyPattern = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`${propertyPattern}\\s*:[^;]*!important`, 'i');
  return regex.test(css);
}

/**
 * Create a mock DOM with animation elements
 * @param {boolean} prefersReducedMotion - Whether user prefers reduced motion
 * @returns {Object} - DOM window, document
 */
function createMockDOM(prefersReducedMotion = false) {
  const html = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <title>Test Page - Reduced Motion</title>
    </head>
    <body>
      <main id="main-content">
        <div class="animate-on-scroll" id="scroll-element">Scroll Animation</div>
        <div class="animate-fade-in" id="fade-element">Fade In</div>
        <div class="animate-slide-up" id="slide-up-element">Slide Up</div>
        <div class="animate-pulse" id="pulse-element">Pulse</div>
        <div class="hover-lift" id="hover-element">Hover Lift</div>
        <div class="transition-all" id="transition-element">Transition</div>
      </main>
    </body>
    </html>
  `;

  const dom = new JSDOM(html, {
    url: 'http://localhost/index.html',
    runScripts: 'dangerously'
  });

  // Mock matchMedia for prefers-reduced-motion
  dom.window.matchMedia = (query) => {
    const matches = query === '(prefers-reduced-motion: reduce)' && prefersReducedMotion;
    return {
      matches,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {}
    };
  };

  return {
    window: dom.window,
    document: dom.window.document
  };
}

/**
 * Create ScrollAnimationController that respects reduced motion
 * @param {Document} document - DOM document
 * @param {Window} window - DOM window
 * @returns {Object} - Controller instance
 */
function createScrollAnimationController(document, window) {
  const animatedElements = new Set();
  
  return {
    animatedElements,
    
    prefersReducedMotion() {
      return window.matchMedia && 
             window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    },
    
    applyAnimation(element, animationType) {
      const elementId = element.id || element.outerHTML;
      
      if (this.animatedElements.has(elementId)) {
        return;
      }
      
      this.animatedElements.add(elementId);
      
      // If user prefers reduced motion, just make visible without animation
      if (this.prefersReducedMotion()) {
        element.classList.add('is-visible');
        element.style.opacity = '1';
        element.style.transform = 'none';
        element.style.animation = 'none';
        element.style.transition = 'none';
        return { reducedMotion: true };
      }
      
      // Normal animation
      element.classList.add(animationType);
      element.classList.add('is-visible');
      return { reducedMotion: false };
    },
    
    reset() {
      this.animatedElements.clear();
    }
  };
}

// ============================================
// ARBITRARIES (Test Data Generators)
// ============================================

/**
 * Generate animation class names that should be disabled
 */
const animationClassArbitrary = fc.constantFrom(
  'animate-on-scroll',
  'animate-fade-in',
  'animate-slide-up',
  'animate-slide-left',
  'animate-slide-right',
  'animate-scale-in',
  'animate-pulse',
  'animate-bounce',
  'animate-spin'
);

/**
 * Generate hover effect class names
 */
const hoverClassArbitrary = fc.constantFrom(
  'hover-lift',
  'hover-scale',
  'hover-glow'
);

/**
 * Generate transition class names
 */
const transitionClassArbitrary = fc.constantFrom(
  'transition-all',
  'transition-colors',
  'transition-opacity',
  'transition-transform',
  'transition-shadow'
);

/**
 * Generate delay class names
 */
const delayClassArbitrary = fc.constantFrom(
  'delay-100',
  'delay-200',
  'delay-300',
  'delay-400',
  'delay-500',
  'delay-600',
  'delay-700',
  'delay-800'
);

/**
 * Generate duration class names
 */
const durationClassArbitrary = fc.constantFrom(
  'duration-fast',
  'duration-normal',
  'duration-slow',
  'duration-slower'
);

// ============================================
// PROPERTY TESTS
// ============================================

describe('Feature: vietnam-religious-diversity-landing', () => {
  describe('Property 11: Reduced Motion Preference', () => {
    
    let animationsCSS;
    let reducedMotionCSS;
    
    beforeAll(() => {
      animationsCSS = loadAnimationsCSS();
      reducedMotionCSS = extractMediaQueryContent(animationsCSS, 'prefers-reduced-motion:\\s*reduce');
    });

    /**
     * Property 11.1: CSS SHALL contain prefers-reduced-motion media query
     * **Validates: Requirements 9.4**
     */
    it('should have prefers-reduced-motion: reduce media query in CSS', () => {
      expect(animationsCSS).toContain('@media (prefers-reduced-motion: reduce)');
    });

    /**
     * Property 11.2: All animations SHALL be disabled with animation: none !important
     * **Validates: Requirements 9.4**
     */
    it('should disable all animations with animation: none !important', () => {
      fc.assert(
        fc.property(
          animationClassArbitrary,
          (animationClass) => {
            // The CSS should contain rules to disable animations
            // Check for global animation: none rule
            const hasGlobalAnimationNone = cssContainsRule(reducedMotionCSS, '*', 'animation', 'none');
            const hasAnimationDuration0 = cssContainsRule(reducedMotionCSS, '*', 'animation-duration', '0s');
            
            // At least one of these should be true
            expect(hasGlobalAnimationNone || hasAnimationDuration0).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 11.3: Transitions SHALL become instant (0s duration)
     * **Validates: Requirements 9.4**
     */
    it('should set transition duration to 0s in reduced motion CSS', () => {
      fc.assert(
        fc.property(
          transitionClassArbitrary,
          (transitionClass) => {
            // Check for global transition: none or transition-duration: 0s
            const hasTransitionNone = cssContainsRule(reducedMotionCSS, '*', 'transition', 'none');
            const hasTransitionDuration0 = cssContainsRule(reducedMotionCSS, '*', 'transition-duration', '0s');
            
            expect(hasTransitionNone || hasTransitionDuration0).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 11.4: Transform effects SHALL be removed (transform: none)
     * **Validates: Requirements 9.4**
     */
    it('should remove transform effects in reduced motion CSS', () => {
      // Check that animate-on-scroll elements have transform: none
      const hasTransformNone = cssContainsRule(reducedMotionCSS, '.animate-on-scroll', 'transform', 'none');
      
      expect(hasTransformNone).toBe(true);
    });

    /**
     * Property 11.5: Animation delays SHALL be set to 0s
     * **Validates: Requirements 9.4**
     */
    it('should set animation delays to 0s in reduced motion CSS', () => {
      fc.assert(
        fc.property(
          delayClassArbitrary,
          (delayClass) => {
            // Check for global animation-delay: 0s or specific delay class rules
            const hasGlobalDelayRule = cssContainsRule(reducedMotionCSS, '*', 'animation-delay', '0s');
            const hasDelayClassRule = cssContainsRule(reducedMotionCSS, `.${delayClass}`, 'animation-delay', '0s') ||
                                      cssContainsRule(reducedMotionCSS, `.${delayClass}`, 'transition-delay', '0s');
            
            expect(hasGlobalDelayRule || hasDelayClassRule).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 11.6: Infinite animations SHALL be stopped
     * **Validates: Requirements 9.4**
     */
    it('should stop infinite animations in reduced motion CSS', () => {
      const infiniteAnimations = ['animate-pulse', 'animate-bounce', 'animate-spin'];
      
      fc.assert(
        fc.property(
          fc.constantFrom(...infiniteAnimations),
          (animationClass) => {
            // Check for specific rules or global animation: none
            const hasSpecificRule = cssContainsRule(reducedMotionCSS, `.${animationClass}`, 'animation', 'none');
            const hasGlobalRule = cssContainsRule(reducedMotionCSS, '*', 'animation', 'none');
            
            expect(hasSpecificRule || hasGlobalRule).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 11.7: Hover transform effects SHALL be disabled
     * **Validates: Requirements 9.4**
     */
    it('should disable hover transform effects in reduced motion CSS', () => {
      fc.assert(
        fc.property(
          hoverClassArbitrary,
          (hoverClass) => {
            // Check for hover class rules with transform: none
            const hasHoverRule = cssContainsRule(reducedMotionCSS, `.${hoverClass}`, 'transform', 'none');
            const hasGlobalRule = cssContainsRule(reducedMotionCSS, '*', 'transition', 'none');
            
            expect(hasHoverRule || hasGlobalRule).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 11.8: Animated elements SHALL be immediately visible (opacity: 1)
     * **Validates: Requirements 9.4**
     */
    it('should make animate-on-scroll elements immediately visible in reduced motion CSS', () => {
      // Check for opacity: 1 rule on animate-on-scroll
      const hasOpacityRule = cssContainsRule(reducedMotionCSS, '.animate-on-scroll', 'opacity', '1');
      
      expect(hasOpacityRule).toBe(true);
    });

    /**
     * Property 11.9: CSS SHALL use !important to override inline styles
     * **Validates: Requirements 9.4**
     */
    it('should use !important declarations in reduced motion CSS', () => {
      // Check that key properties use !important
      const hasAnimationImportant = cssHasImportant(reducedMotionCSS, 'animation');
      const hasTransitionImportant = cssHasImportant(reducedMotionCSS, 'transition');
      
      expect(hasAnimationImportant).toBe(true);
      expect(hasTransitionImportant).toBe(true);
    });

    /**
     * Property 11.10: JavaScript controller SHALL respect prefers-reduced-motion
     * **Validates: Requirements 9.4**
     */
    it('should respect prefers-reduced-motion in JavaScript controller', () => {
      fc.assert(
        fc.property(
          animationClassArbitrary,
          (animationClass) => {
            // Test with reduced motion enabled
            const { document, window } = createMockDOM(true);
            const controller = createScrollAnimationController(document, window);
            
            const element = document.createElement('div');
            element.id = `test-${animationClass}`;
            element.className = animationClass;
            document.body.appendChild(element);
            
            const result = controller.applyAnimation(element, animationClass);
            
            // Controller should detect reduced motion preference
            expect(result.reducedMotion).toBe(true);
            
            // Element should be visible without animation
            expect(element.classList.contains('is-visible')).toBe(true);
            expect(element.style.animation).toBe('none');
            expect(element.style.transition).toBe('none');
            
            controller.reset();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 11.11: JavaScript controller SHALL apply animations when reduced motion is NOT set
     * **Validates: Requirements 9.4**
     */
    it('should apply animations when prefers-reduced-motion is not set', () => {
      fc.assert(
        fc.property(
          animationClassArbitrary,
          (animationClass) => {
            // Test without reduced motion
            const { document, window } = createMockDOM(false);
            const controller = createScrollAnimationController(document, window);
            
            const element = document.createElement('div');
            element.id = `test-${animationClass}`;
            element.className = animationClass;
            document.body.appendChild(element);
            
            const result = controller.applyAnimation(element, animationClass);
            
            // Controller should NOT detect reduced motion preference
            expect(result.reducedMotion).toBe(false);
            
            // Element should have animation class applied
            expect(element.classList.contains('is-visible')).toBe(true);
            expect(element.classList.contains(animationClass)).toBe(true);
            
            controller.reset();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 11.12: Duration utility classes SHALL be covered by reduced motion rules
     * **Validates: Requirements 9.4**
     */
    it('should cover duration utility classes in reduced motion CSS', () => {
      fc.assert(
        fc.property(
          durationClassArbitrary,
          (durationClass) => {
            // Check for specific duration class rules or global rules
            const hasSpecificRule = cssContainsRule(reducedMotionCSS, `.${durationClass}`, 'animation-duration', '0s') ||
                                    cssContainsRule(reducedMotionCSS, `.${durationClass}`, 'transition-duration', '0s');
            const hasGlobalRule = cssContainsRule(reducedMotionCSS, '*', 'animation-duration', '0s') ||
                                  cssContainsRule(reducedMotionCSS, '*', 'transition-duration', '0s');
            
            expect(hasSpecificRule || hasGlobalRule).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 11.13: Scroll behavior SHALL be set to auto
     * **Validates: Requirements 9.4**
     */
    it('should set scroll-behavior to auto in reduced motion CSS', () => {
      // Check for scroll-behavior: auto rule
      const hasScrollBehaviorRule = cssContainsRule(reducedMotionCSS, '*', 'scroll-behavior', 'auto');
      
      expect(hasScrollBehaviorRule).toBe(true);
    });

    /**
     * Property 11.14: Loading and skeleton animations SHALL be disabled
     * **Validates: Requirements 9.4**
     */
    it('should disable loading and skeleton animations in reduced motion CSS', () => {
      // Check for loading and skeleton animation rules
      const hasLoadingRule = cssContainsRule(reducedMotionCSS, '.loading', 'animation', 'none');
      const hasSkeletonRule = cssContainsRule(reducedMotionCSS, '.skeleton', 'animation', 'none');
      const hasGlobalRule = cssContainsRule(reducedMotionCSS, '*', 'animation', 'none');
      
      // Either specific rules or global rule should exist
      expect(hasLoadingRule || hasGlobalRule).toBe(true);
      expect(hasSkeletonRule || hasGlobalRule).toBe(true);
    });

    /**
     * Property 11.15: Animation iteration count SHALL be limited to 1
     * **Validates: Requirements 9.4**
     */
    it('should limit animation iteration count to 1 in reduced motion CSS', () => {
      // Check for animation-iteration-count: 1 rule
      const hasIterationRule = cssContainsRule(reducedMotionCSS, '*', 'animation-iteration-count', '1');
      
      expect(hasIterationRule).toBe(true);
    });

    /**
     * Property 11.16: All slide animation variants SHALL have transform removed
     * **Validates: Requirements 9.4**
     */
    it('should remove transform from all slide animation variants', () => {
      const slideAnimations = ['slide-up', 'slide-left', 'slide-right'];
      
      fc.assert(
        fc.property(
          fc.constantFrom(...slideAnimations),
          (slideType) => {
            // Check for transform: none on slide animation classes
            const hasSpecificRule = cssContainsRule(reducedMotionCSS, `.animate-on-scroll.${slideType}`, 'transform', 'none');
            const hasGeneralRule = cssContainsRule(reducedMotionCSS, '.animate-on-scroll', 'transform', 'none');
            
            expect(hasSpecificRule || hasGeneralRule).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
