/**
 * Property-Based Tests for Carousel Component
 * Feature: vietnam-religious-diversity-landing
 * Property 10: Carousel Navigation
 * 
 * **Validates: Requirements 6.6**
 * 
 * Property Definition:
 * For any carousel navigation action:
 * - Clicking next SHALL advance to the next slide (or wrap to first)
 * - Clicking prev SHALL go to previous slide (or wrap to last)
 * - Current slide indicator SHALL match the displayed slide index
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
 * Create a mock DOM with carousel structure
 * @param {number} slideCount - Number of slides to create
 * @param {number} initialSlideIndex - Index of initially active slide
 * @returns {Object} - DOM window, document
 */
function createMockDOM(slideCount = 3, initialSlideIndex = 0) {
  const slidesHtml = Array.from({ length: slideCount }, (_, i) => {
    const isActive = i === initialSlideIndex;
    return `
      <div class="carousel__slide ${isActive ? 'carousel__slide--active' : ''}" 
           aria-hidden="${!isActive}"
           data-index="${i}">
        <div class="testimonial">
          <p class="testimonial__quote">"Testimonial ${i + 1} content"</p>
          <p class="testimonial__author">Author ${i + 1}</p>
        </div>
      </div>
    `;
  }).join('\n');

  const dotsHtml = Array.from({ length: slideCount }, (_, i) => {
    const isActive = i === initialSlideIndex;
    return `<button class="carousel__dot ${isActive ? 'carousel__dot--active' : ''}" 
                    aria-label="Go to slide ${i + 1}"
                    aria-current="${isActive ? 'true' : 'false'}"></button>`;
  }).join('\n');

  const html = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <title>Test Page</title>
      <style>
        .carousel__slide { display: none; }
        .carousel__slide--active { display: block; }
        .carousel__dot--active { background-color: #667eea; }
      </style>
    </head>
    <body>
      <main id="main-content">
        <div class="carousel" id="test-carousel" tabindex="0">
          <div class="carousel__container">
            ${slidesHtml}
          </div>
          <button class="carousel__prev" aria-label="Previous slide">‹</button>
          <button class="carousel__next" aria-label="Next slide">›</button>
          <div class="carousel__dots">
            ${dotsHtml}
          </div>
        </div>
      </main>
    </body>
    </html>
  `;

  const dom = new JSDOM(html, {
    url: 'http://localhost/fpt-students.html',
    runScripts: 'dangerously'
  });

  return {
    window: dom.window,
    document: dom.window.document
  };
}

/**
 * Create CarouselController instance for testing
 * @param {Document} document - DOM document
 * @param {Window} window - DOM window
 * @returns {Object} - CarouselController instance
 */
function createCarouselController(document, window) {
  const CarouselController = {
    container: null,
    slides: [],
    currentIndex: 0,
    autoplayInterval: null,
    touchStartX: 0,
    touchEndX: 0,

    /**
     * Initialize carousel
     * @param {HTMLElement} container - Carousel container
     */
    init(container) {
      if (!container) return;
      
      this.container = container;
      this.slides = container.querySelectorAll('.carousel__slide');
      this.currentIndex = 0;

      // Setup navigation buttons
      const prevBtn = container.querySelector('.carousel__prev');
      const nextBtn = container.querySelector('.carousel__next');
      
      if (prevBtn) prevBtn.addEventListener('click', () => this.prevSlide());
      if (nextBtn) nextBtn.addEventListener('click', () => this.nextSlide());

      // Setup dot indicators
      this.setupDots();

      // Keyboard navigation
      container.addEventListener('keydown', (e) => this.handleKeydown(e));

      // Touch/swipe support
      container.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
      container.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: true });

      // Initialize first slide
      this.goToSlide(0);
    },

    /**
     * Setup dot indicators
     */
    setupDots() {
      const dotsContainer = this.container?.querySelector('.carousel__dots');
      if (!dotsContainer) return;

      // Clear existing dots and recreate
      dotsContainer.innerHTML = '';
      this.slides.forEach((_, index) => {
        const dot = document.createElement('button');
        dot.className = 'carousel__dot';
        dot.setAttribute('aria-label', `Go to slide ${index + 1}`);
        dot.addEventListener('click', () => this.goToSlide(index));
        dotsContainer.appendChild(dot);
      });
    },

    /**
     * Go to specific slide
     * @param {number} index - Slide index
     */
    goToSlide(index) {
      if (this.slides.length === 0) return;

      // Wrap around
      if (index < 0) index = this.slides.length - 1;
      if (index >= this.slides.length) index = 0;

      this.currentIndex = index;

      // Update slides visibility
      this.slides.forEach((slide, i) => {
        slide.classList.toggle('carousel__slide--active', i === index);
        slide.setAttribute('aria-hidden', i !== index);
      });

      // Update dots
      const dots = this.container?.querySelectorAll('.carousel__dot');
      dots?.forEach((dot, i) => {
        dot.classList.toggle('carousel__dot--active', i === index);
        dot.setAttribute('aria-current', i === index ? 'true' : 'false');
      });
    },

    /**
     * Go to next slide
     */
    nextSlide() {
      this.goToSlide(this.currentIndex + 1);
    },

    /**
     * Go to previous slide
     */
    prevSlide() {
      this.goToSlide(this.currentIndex - 1);
    },

    /**
     * Get current slide index
     * @returns {number} - Current slide index
     */
    getCurrentIndex() {
      return this.currentIndex;
    },

    /**
     * Get total number of slides
     * @returns {number} - Total slides
     */
    getSlideCount() {
      return this.slides.length;
    },

    /**
     * Get the currently active slide element
     * @returns {HTMLElement|null} - Active slide element
     */
    getActiveSlide() {
      return this.container?.querySelector('.carousel__slide--active');
    },

    /**
     * Get the currently active dot element
     * @returns {HTMLElement|null} - Active dot element
     */
    getActiveDot() {
      return this.container?.querySelector('.carousel__dot--active');
    },

    /**
     * Get all dots
     * @returns {NodeList} - All dot elements
     */
    getDots() {
      return this.container?.querySelectorAll('.carousel__dot') || [];
    },

    /**
     * Start autoplay
     * @param {number} interval - Interval in milliseconds
     */
    startAutoplay(interval = 5000) {
      this.stopAutoplay();
      this.autoplayInterval = setInterval(() => this.nextSlide(), interval);
    },

    /**
     * Stop autoplay
     */
    stopAutoplay() {
      if (this.autoplayInterval) {
        clearInterval(this.autoplayInterval);
        this.autoplayInterval = null;
      }
    },

    /**
     * Handle keyboard navigation
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleKeydown(event) {
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          this.prevSlide();
          break;
        case 'ArrowRight':
          event.preventDefault();
          this.nextSlide();
          break;
      }
    },

    /**
     * Handle touch start
     * @param {TouchEvent} event - Touch event
     */
    handleTouchStart(event) {
      this.touchStartX = event.changedTouches[0].screenX;
    },

    /**
     * Handle touch end
     * @param {TouchEvent} event - Touch event
     */
    handleTouchEnd(event) {
      this.touchEndX = event.changedTouches[0].screenX;
      this.handleSwipe();
    },

    /**
     * Handle swipe gesture
     */
    handleSwipe() {
      const swipeThreshold = 50;
      const diff = this.touchStartX - this.touchEndX;

      if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
          this.nextSlide();
        } else {
          this.prevSlide();
        }
      }
    },

    /**
     * Simulate keyboard event
     * @param {string} key - Key to simulate
     */
    simulateKeydown(key) {
      const event = {
        key: key,
        preventDefault: () => {}
      };
      this.handleKeydown(event);
    },

    /**
     * Simulate swipe gesture
     * @param {number} startX - Start X position
     * @param {number} endX - End X position
     */
    simulateSwipe(startX, endX) {
      this.touchStartX = startX;
      this.touchEndX = endX;
      this.handleSwipe();
    }
  };

  return CarouselController;
}

// ============================================
// ARBITRARIES (Test Data Generators)
// ============================================

/**
 * Generate number of carousel slides (1-10)
 */
const slideCountArbitrary = fc.integer({ min: 1, max: 10 });

/**
 * Generate valid slide index for a given slide count
 * @param {number} slideCount - Number of slides
 */
const slideIndexArbitrary = (slideCount) => 
  fc.integer({ min: 0, max: slideCount - 1 });

/**
 * Generate sequence of navigation actions
 */
const navigationActionArbitrary = fc.constantFrom('next', 'prev', 'goTo');

/**
 * Generate sequence of navigation actions with parameters
 */
const navigationSequenceArbitrary = fc.array(
  fc.record({
    action: navigationActionArbitrary,
    targetIndex: fc.integer({ min: 0, max: 9 })
  }),
  { minLength: 1, maxLength: 30 }
);

/**
 * Generate keyboard navigation keys
 */
const keyboardKeyArbitrary = fc.constantFrom('ArrowLeft', 'ArrowRight');

/**
 * Generate sequence of keyboard actions
 */
const keyboardSequenceArbitrary = fc.array(keyboardKeyArbitrary, { minLength: 1, maxLength: 20 });

/**
 * Generate swipe gesture parameters
 */
const swipeArbitrary = fc.record({
  startX: fc.integer({ min: 0, max: 500 }),
  endX: fc.integer({ min: 0, max: 500 })
});

/**
 * Generate sequence of swipe gestures
 */
const swipeSequenceArbitrary = fc.array(swipeArbitrary, { minLength: 1, maxLength: 15 });

// ============================================
// PROPERTY TESTS
// ============================================

describe('Feature: vietnam-religious-diversity-landing', () => {
  describe('Property 10: Carousel Navigation', () => {
    
    /**
     * Property 10.1: Clicking next SHALL advance to the next slide (or wrap to first)
     * **Validates: Requirements 6.6**
     */
    it('should advance to next slide when next is clicked, wrapping to first', () => {
      fc.assert(
        fc.property(
          slideCountArbitrary,
          fc.integer({ min: 0, max: 9 }),
          (slideCount, startIndex) => {
            const validStartIndex = startIndex % slideCount;
            
            const { document, window } = createMockDOM(slideCount, validStartIndex);
            const carousel = createCarouselController(document, window);
            const container = document.querySelector('.carousel');
            carousel.init(container);

            // Go to start index
            carousel.goToSlide(validStartIndex);
            expect(carousel.getCurrentIndex()).toBe(validStartIndex);

            // Click next
            carousel.nextSlide();

            // Expected index with wrap-around
            const expectedIndex = (validStartIndex + 1) % slideCount;
            expect(carousel.getCurrentIndex()).toBe(expectedIndex);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 10.2: Clicking prev SHALL go to previous slide (or wrap to last)
     * **Validates: Requirements 6.6**
     */
    it('should go to previous slide when prev is clicked, wrapping to last', () => {
      fc.assert(
        fc.property(
          slideCountArbitrary,
          fc.integer({ min: 0, max: 9 }),
          (slideCount, startIndex) => {
            const validStartIndex = startIndex % slideCount;
            
            const { document, window } = createMockDOM(slideCount, validStartIndex);
            const carousel = createCarouselController(document, window);
            const container = document.querySelector('.carousel');
            carousel.init(container);

            // Go to start index
            carousel.goToSlide(validStartIndex);
            expect(carousel.getCurrentIndex()).toBe(validStartIndex);

            // Click prev
            carousel.prevSlide();

            // Expected index with wrap-around
            const expectedIndex = (validStartIndex - 1 + slideCount) % slideCount;
            expect(carousel.getCurrentIndex()).toBe(expectedIndex);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 10.3: Current slide indicator SHALL match the displayed slide index
     * **Validates: Requirements 6.6**
     */
    it('should have dot indicator matching the current slide index', () => {
      fc.assert(
        fc.property(
          slideCountArbitrary,
          navigationSequenceArbitrary,
          (slideCount, navigationSequence) => {
            const { document, window } = createMockDOM(slideCount);
            const carousel = createCarouselController(document, window);
            const container = document.querySelector('.carousel');
            carousel.init(container);

            // Perform navigation sequence
            navigationSequence.forEach(({ action, targetIndex }) => {
              switch (action) {
                case 'next':
                  carousel.nextSlide();
                  break;
                case 'prev':
                  carousel.prevSlide();
                  break;
                case 'goTo':
                  carousel.goToSlide(targetIndex % slideCount);
                  break;
              }

              // Verify dot indicator matches current index
              const currentIndex = carousel.getCurrentIndex();
              const dots = carousel.getDots();
              
              dots.forEach((dot, i) => {
                const isActive = dot.classList.contains('carousel__dot--active');
                const ariaCurrent = dot.getAttribute('aria-current');
                
                if (i === currentIndex) {
                  expect(isActive).toBe(true);
                  expect(ariaCurrent).toBe('true');
                } else {
                  expect(isActive).toBe(false);
                  expect(ariaCurrent).toBe('false');
                }
              });
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 10.4: goToSlide SHALL navigate to the correct slide with wrap-around
     * **Validates: Requirements 6.6**
     */
    it('should navigate to correct slide with wrap-around for any index', () => {
      fc.assert(
        fc.property(
          slideCountArbitrary,
          fc.integer({ min: -20, max: 30 }),
          (slideCount, targetIndex) => {
            const { document, window } = createMockDOM(slideCount);
            const carousel = createCarouselController(document, window);
            const container = document.querySelector('.carousel');
            carousel.init(container);

            // Navigate to target index
            carousel.goToSlide(targetIndex);

            // Calculate expected index with wrap-around
            let expectedIndex;
            if (targetIndex < 0) {
              expectedIndex = slideCount - 1;
            } else if (targetIndex >= slideCount) {
              expectedIndex = 0;
            } else {
              expectedIndex = targetIndex;
            }

            expect(carousel.getCurrentIndex()).toBe(expectedIndex);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 10.5: Only one slide SHALL be active at any time
     * **Validates: Requirements 6.6**
     */
    it('should have exactly one active slide at any time', () => {
      fc.assert(
        fc.property(
          slideCountArbitrary,
          navigationSequenceArbitrary,
          (slideCount, navigationSequence) => {
            const { document, window } = createMockDOM(slideCount);
            const carousel = createCarouselController(document, window);
            const container = document.querySelector('.carousel');
            carousel.init(container);

            // Perform navigation sequence
            navigationSequence.forEach(({ action, targetIndex }) => {
              switch (action) {
                case 'next':
                  carousel.nextSlide();
                  break;
                case 'prev':
                  carousel.prevSlide();
                  break;
                case 'goTo':
                  carousel.goToSlide(targetIndex % slideCount);
                  break;
              }

              // Count active slides
              const activeSlides = container.querySelectorAll('.carousel__slide--active');
              expect(activeSlides.length).toBe(1);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 10.6: Active slide SHALL have aria-hidden="false", others "true"
     * **Validates: Requirements 6.6**
     */
    it('should have correct aria-hidden attributes on slides', () => {
      fc.assert(
        fc.property(
          slideCountArbitrary,
          fc.integer({ min: 0, max: 9 }),
          (slideCount, targetIndex) => {
            const validIndex = targetIndex % slideCount;
            
            const { document, window } = createMockDOM(slideCount);
            const carousel = createCarouselController(document, window);
            const container = document.querySelector('.carousel');
            carousel.init(container);

            // Navigate to target
            carousel.goToSlide(validIndex);

            // Verify aria-hidden attributes
            const slides = container.querySelectorAll('.carousel__slide');
            slides.forEach((slide, i) => {
              const ariaHidden = slide.getAttribute('aria-hidden');
              if (i === validIndex) {
                expect(ariaHidden).toBe('false');
              } else {
                expect(ariaHidden).toBe('true');
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 10.7: Keyboard ArrowRight SHALL advance to next slide
     * **Validates: Requirements 6.6**
     */
    it('should advance to next slide on ArrowRight key', () => {
      fc.assert(
        fc.property(
          slideCountArbitrary,
          fc.integer({ min: 0, max: 9 }),
          (slideCount, startIndex) => {
            const validStartIndex = startIndex % slideCount;
            
            const { document, window } = createMockDOM(slideCount);
            const carousel = createCarouselController(document, window);
            const container = document.querySelector('.carousel');
            carousel.init(container);

            carousel.goToSlide(validStartIndex);
            carousel.simulateKeydown('ArrowRight');

            const expectedIndex = (validStartIndex + 1) % slideCount;
            expect(carousel.getCurrentIndex()).toBe(expectedIndex);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 10.8: Keyboard ArrowLeft SHALL go to previous slide
     * **Validates: Requirements 6.6**
     */
    it('should go to previous slide on ArrowLeft key', () => {
      fc.assert(
        fc.property(
          slideCountArbitrary,
          fc.integer({ min: 0, max: 9 }),
          (slideCount, startIndex) => {
            const validStartIndex = startIndex % slideCount;
            
            const { document, window } = createMockDOM(slideCount);
            const carousel = createCarouselController(document, window);
            const container = document.querySelector('.carousel');
            carousel.init(container);

            carousel.goToSlide(validStartIndex);
            carousel.simulateKeydown('ArrowLeft');

            const expectedIndex = (validStartIndex - 1 + slideCount) % slideCount;
            expect(carousel.getCurrentIndex()).toBe(expectedIndex);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 10.9: Swipe left (positive diff) SHALL advance to next slide
     * **Validates: Requirements 6.6**
     */
    it('should advance to next slide on swipe left', () => {
      fc.assert(
        fc.property(
          slideCountArbitrary,
          fc.integer({ min: 0, max: 9 }),
          fc.integer({ min: 51, max: 300 }),
          (slideCount, startIndex, swipeDistance) => {
            const validStartIndex = startIndex % slideCount;
            
            const { document, window } = createMockDOM(slideCount);
            const carousel = createCarouselController(document, window);
            const container = document.querySelector('.carousel');
            carousel.init(container);

            carousel.goToSlide(validStartIndex);
            
            // Swipe left: startX > endX (positive diff > threshold)
            carousel.simulateSwipe(200, 200 - swipeDistance);

            const expectedIndex = (validStartIndex + 1) % slideCount;
            expect(carousel.getCurrentIndex()).toBe(expectedIndex);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 10.10: Swipe right (negative diff) SHALL go to previous slide
     * **Validates: Requirements 6.6**
     */
    it('should go to previous slide on swipe right', () => {
      fc.assert(
        fc.property(
          slideCountArbitrary,
          fc.integer({ min: 0, max: 9 }),
          fc.integer({ min: 51, max: 300 }),
          (slideCount, startIndex, swipeDistance) => {
            const validStartIndex = startIndex % slideCount;
            
            const { document, window } = createMockDOM(slideCount);
            const carousel = createCarouselController(document, window);
            const container = document.querySelector('.carousel');
            carousel.init(container);

            carousel.goToSlide(validStartIndex);
            
            // Swipe right: endX > startX (negative diff < -threshold)
            carousel.simulateSwipe(200, 200 + swipeDistance);

            const expectedIndex = (validStartIndex - 1 + slideCount) % slideCount;
            expect(carousel.getCurrentIndex()).toBe(expectedIndex);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 10.11: Small swipes (below threshold) SHALL NOT change slide
     * **Validates: Requirements 6.6**
     */
    it('should not change slide on small swipes below threshold', () => {
      fc.assert(
        fc.property(
          slideCountArbitrary,
          fc.integer({ min: 0, max: 9 }),
          fc.integer({ min: 0, max: 49 }),
          fc.boolean(),
          (slideCount, startIndex, swipeDistance, swipeLeft) => {
            const validStartIndex = startIndex % slideCount;
            
            const { document, window } = createMockDOM(slideCount);
            const carousel = createCarouselController(document, window);
            const container = document.querySelector('.carousel');
            carousel.init(container);

            carousel.goToSlide(validStartIndex);
            
            // Small swipe below threshold
            const startX = 200;
            const endX = swipeLeft ? startX - swipeDistance : startX + swipeDistance;
            carousel.simulateSwipe(startX, endX);

            // Should remain on same slide
            expect(carousel.getCurrentIndex()).toBe(validStartIndex);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 10.12: Navigating N times next then N times prev SHALL return to original slide
     * **Validates: Requirements 6.6**
     */
    it('should return to original slide after equal next and prev navigations', () => {
      fc.assert(
        fc.property(
          slideCountArbitrary,
          fc.integer({ min: 0, max: 9 }),
          fc.integer({ min: 1, max: 20 }),
          (slideCount, startIndex, navigationCount) => {
            const validStartIndex = startIndex % slideCount;
            
            const { document, window } = createMockDOM(slideCount);
            const carousel = createCarouselController(document, window);
            const container = document.querySelector('.carousel');
            carousel.init(container);

            carousel.goToSlide(validStartIndex);

            // Navigate forward N times
            for (let i = 0; i < navigationCount; i++) {
              carousel.nextSlide();
            }

            // Navigate backward N times
            for (let i = 0; i < navigationCount; i++) {
              carousel.prevSlide();
            }

            // Should be back at original slide
            expect(carousel.getCurrentIndex()).toBe(validStartIndex);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 10.13: Navigating slideCount times next SHALL return to original slide
     * **Validates: Requirements 6.6**
     */
    it('should return to original slide after full cycle of next navigations', () => {
      fc.assert(
        fc.property(
          slideCountArbitrary,
          fc.integer({ min: 0, max: 9 }),
          (slideCount, startIndex) => {
            const validStartIndex = startIndex % slideCount;
            
            const { document, window } = createMockDOM(slideCount);
            const carousel = createCarouselController(document, window);
            const container = document.querySelector('.carousel');
            carousel.init(container);

            carousel.goToSlide(validStartIndex);

            // Navigate forward slideCount times (full cycle)
            for (let i = 0; i < slideCount; i++) {
              carousel.nextSlide();
            }

            // Should be back at original slide
            expect(carousel.getCurrentIndex()).toBe(validStartIndex);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 10.14: State consistency SHALL be maintained through random navigation sequences
     * **Validates: Requirements 6.6**
     */
    it('should maintain state consistency through random navigation sequences', () => {
      fc.assert(
        fc.property(
          slideCountArbitrary,
          navigationSequenceArbitrary,
          (slideCount, navigationSequence) => {
            const { document, window } = createMockDOM(slideCount);
            const carousel = createCarouselController(document, window);
            const container = document.querySelector('.carousel');
            carousel.init(container);

            // Perform random navigation sequence
            navigationSequence.forEach(({ action, targetIndex }) => {
              switch (action) {
                case 'next':
                  carousel.nextSlide();
                  break;
                case 'prev':
                  carousel.prevSlide();
                  break;
                case 'goTo':
                  carousel.goToSlide(targetIndex % slideCount);
                  break;
              }

              // After each action, verify state consistency
              const currentIndex = carousel.getCurrentIndex();
              const slides = container.querySelectorAll('.carousel__slide');
              const dots = carousel.getDots();

              // Verify currentIndex is valid
              expect(currentIndex).toBeGreaterThanOrEqual(0);
              expect(currentIndex).toBeLessThan(slideCount);

              // Verify exactly one slide is active
              const activeSlides = container.querySelectorAll('.carousel__slide--active');
              expect(activeSlides.length).toBe(1);

              // Verify active slide matches currentIndex
              slides.forEach((slide, i) => {
                const isActive = slide.classList.contains('carousel__slide--active');
                expect(isActive).toBe(i === currentIndex);
              });

              // Verify exactly one dot is active
              const activeDots = container.querySelectorAll('.carousel__dot--active');
              expect(activeDots.length).toBe(1);

              // Verify active dot matches currentIndex
              dots.forEach((dot, i) => {
                const isActive = dot.classList.contains('carousel__dot--active');
                expect(isActive).toBe(i === currentIndex);
              });
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 10.15: Keyboard navigation sequence SHALL maintain state consistency
     * **Validates: Requirements 6.6**
     */
    it('should maintain state consistency through keyboard navigation', () => {
      fc.assert(
        fc.property(
          slideCountArbitrary,
          keyboardSequenceArbitrary,
          (slideCount, keySequence) => {
            const { document, window } = createMockDOM(slideCount);
            const carousel = createCarouselController(document, window);
            const container = document.querySelector('.carousel');
            carousel.init(container);

            // Perform keyboard navigation sequence
            keySequence.forEach(key => {
              carousel.simulateKeydown(key);

              // Verify state consistency
              const currentIndex = carousel.getCurrentIndex();
              
              // Verify currentIndex is valid
              expect(currentIndex).toBeGreaterThanOrEqual(0);
              expect(currentIndex).toBeLessThan(slideCount);

              // Verify exactly one slide is active
              const activeSlides = container.querySelectorAll('.carousel__slide--active');
              expect(activeSlides.length).toBe(1);

              // Verify exactly one dot is active
              const activeDots = container.querySelectorAll('.carousel__dot--active');
              expect(activeDots.length).toBe(1);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 10.16: Initial state SHALL have first slide active
     * **Validates: Requirements 6.6**
     */
    it('should start with first slide active', () => {
      fc.assert(
        fc.property(
          slideCountArbitrary,
          (slideCount) => {
            const { document, window } = createMockDOM(slideCount);
            const carousel = createCarouselController(document, window);
            const container = document.querySelector('.carousel');
            carousel.init(container);

            // First slide should be active
            expect(carousel.getCurrentIndex()).toBe(0);
            
            const slides = container.querySelectorAll('.carousel__slide');
            expect(slides[0].classList.contains('carousel__slide--active')).toBe(true);
            
            const dots = carousel.getDots();
            if (dots.length > 0) {
              expect(dots[0].classList.contains('carousel__dot--active')).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
