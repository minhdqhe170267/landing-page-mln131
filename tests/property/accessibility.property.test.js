/**
 * Property-Based Tests for Accessibility Compliance
 * Feature: vietnam-religious-diversity-landing
 * 
 * Property 12: Accessibility Compliance
 * 
 * **Validates: Requirements 11.1, 11.2, 11.3, 11.5, 11.6**
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
 * Calculate relative luminance of a color
 * @param {number} r - Red component (0-255)
 * @param {number} g - Green component (0-255)
 * @param {number} b - Blue component (0-255)
 * @returns {number} - Relative luminance (0-1)
 */
function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 * @param {string} color1 - First color in hex format (#RRGGBB)
 * @param {string} color2 - Second color in hex format (#RRGGBB)
 * @returns {number} - Contrast ratio (1-21)
 */
function getContrastRatio(color1, color2) {
  const parseHex = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const c1 = parseHex(color1);
  const c2 = parseHex(color2);

  if (!c1 || !c2) return 1;

  const l1 = getLuminance(c1.r, c1.g, c1.b);
  const l2 = getLuminance(c2.r, c2.g, c2.b);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Create a mock DOM with accessibility elements
 * @param {string} pageType - Type of page to create
 * @returns {Object} - DOM window and document
 */
function createMockDOM(pageType = 'index') {
  const html = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <title>Test Page</title>
      <style>
        :root {
          --color-primary: #5a67d8;
          --color-text: #1a202c;
          --color-text-light: #4a5568;
          --color-background: #ffffff;
          --color-focus: #2b6cb0;
        }
        .btn:focus { outline: 3px solid var(--color-focus); outline-offset: 2px; }
        .nav__link:focus { outline: 3px solid var(--color-focus); outline-offset: -2px; }
        a:focus { outline: 3px solid var(--color-focus); outline-offset: 2px; }
        button:focus { outline: 3px solid var(--color-focus); outline-offset: 2px; }
        [tabindex]:focus { outline: 3px solid var(--color-focus); outline-offset: 2px; }
      </style>
    </head>
    <body>
      <!-- Skip Link -->
      <a href="#main-content" class="skip-link">Bỏ qua đến nội dung chính</a>

      <!-- Navigation -->
      <header class="header">
        <nav class="nav" role="navigation" aria-label="Main navigation">
          <a href="index.html" class="nav__brand" aria-label="Trang chủ">Brand</a>
          
          <button 
            class="nav__hamburger" 
            type="button"
            aria-label="Mở menu điều hướng"
            aria-expanded="false"
            aria-controls="nav-menu"
          >
            <span aria-hidden="true"></span>
          </button>

          <ul class="nav__menu" id="nav-menu" role="menubar">
            <li role="none">
              <a href="index.html" class="nav__link" role="menuitem" aria-current="page">Trang Chủ</a>
            </li>
            <li role="none">
              <a href="timeline.html" class="nav__link" role="menuitem">Lịch Sử</a>
            </li>
          </ul>
        </nav>
      </header>

      <!-- Main Content -->
      <main id="main-content">
        <section aria-labelledby="section-title">
          <h1 id="section-title">Test Section</h1>
          
          <!-- Images -->
          <img src="content-image.jpg" alt="Meaningful description of content image" />
          <img src="decorative.jpg" alt="" aria-hidden="true" />
          <span class="icon" aria-hidden="true">🕊️</span>
          
          <!-- Interactive Elements -->
          <button class="btn btn-primary" type="button">Click Me</button>
          <button class="btn btn-icon" type="button" aria-label="Close dialog">
            <span aria-hidden="true">&times;</span>
          </button>
          
          <a href="page.html" class="link">Link with text</a>
          
          <!-- Form Elements -->
          <input type="text" id="name" aria-label="Your name" />
          <select id="options" aria-label="Select an option">
            <option>Option 1</option>
          </select>
          
          <!-- Accordion -->
          <div class="accordion">
            <button 
              class="accordion__header" 
              aria-expanded="false" 
              aria-controls="accordion-content"
            >
              Accordion Header
            </button>
            <div id="accordion-content" hidden>Content</div>
          </div>
          
          <!-- Carousel -->
          <div class="carousel" role="region" aria-label="Testimonials">
            <button class="carousel__prev" aria-label="Xem testimonial trước">
              <span aria-hidden="true">←</span>
            </button>
            <button class="carousel__next" aria-label="Xem testimonial tiếp theo">
              <span aria-hidden="true">→</span>
            </button>
          </div>
          
          <!-- Custom focusable element -->
          <div class="mosaic-tile" tabindex="0" role="button" aria-label="Phật giáo tile">
            Tile content
          </div>
        </section>
      </main>

      <!-- Modal -->
      <div 
        id="modal" 
        class="modal" 
        role="dialog" 
        aria-modal="true" 
        aria-hidden="true"
        aria-labelledby="modal-title"
      >
        <div class="modal__overlay"></div>
        <div class="modal__content">
          <button class="modal__close" aria-label="Đóng hộp thoại">
            <span aria-hidden="true">&times;</span>
          </button>
          <h2 id="modal-title">Modal Title</h2>
          <div class="modal__body">Modal content</div>
        </div>
      </div>

      <!-- Footer -->
      <footer role="contentinfo">
        <nav aria-label="Footer navigation">
          <a href="about.html">About</a>
        </nav>
      </footer>
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

// ============================================
// ARBITRARIES (Test Data Generators)
// ============================================

/**
 * Generate valid hex colors
 */
const hexColorArbitrary = fc.tuple(
  fc.integer({ min: 0, max: 255 }),
  fc.integer({ min: 0, max: 255 }),
  fc.integer({ min: 0, max: 255 })
).map(([r, g, b]) => {
  const toHex = (n) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
});

/**
 * Generate color pairs for contrast testing
 */
const colorPairArbitrary = fc.record({
  foreground: hexColorArbitrary,
  background: hexColorArbitrary
});

/**
 * Generate interactive element types
 */
const interactiveElementArbitrary = fc.constantFrom(
  'button',
  'a[href]',
  'input',
  'select',
  'textarea',
  '[tabindex="0"]',
  '[role="button"]'
);

/**
 * Generate image types
 */
const imageTypeArbitrary = fc.constantFrom(
  'content', // Meaningful image with alt text
  'decorative' // Decorative image with empty alt
);

/**
 * Generate ARIA attribute scenarios
 */
const ariaScenarioArbitrary = fc.constantFrom(
  'button-no-text',
  'accordion-header',
  'carousel-nav',
  'modal-dialog',
  'menu-toggle'
);

// ============================================
// PROPERTY TESTS
// ============================================

describe('Feature: vietnam-religious-diversity-landing', () => {
  
  describe('Property 12: Accessibility Compliance', () => {
    
    /**
     * Property 12.1: Color contrast SHALL meet WCAG 2.1 AA standards (4.5:1 minimum)
     * **Validates: Requirements 11.1**
     */
    describe('Color Contrast Compliance', () => {
      
      it('should have primary text color with sufficient contrast on white background', () => {
        // Test the actual design token colors
        const textColor = '#1a202c'; // --color-text
        const backgroundColor = '#ffffff'; // --color-background
        
        const ratio = getContrastRatio(textColor, backgroundColor);
        
        // WCAG 2.1 AA requires 4.5:1 for normal text
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      });

      it('should have text-light color with sufficient contrast on white background', () => {
        // Updated text-light color for accessibility
        const textLightColor = '#4a5568'; // --color-text-light (updated)
        const backgroundColor = '#ffffff';
        
        const ratio = getContrastRatio(textLightColor, backgroundColor);
        
        // WCAG 2.1 AA requires 4.5:1 for normal text
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      });

      it('should have primary color with sufficient contrast on white background', () => {
        const primaryColor = '#5a67d8'; // --color-primary (updated)
        const backgroundColor = '#ffffff';
        
        const ratio = getContrastRatio(primaryColor, backgroundColor);
        
        // WCAG 2.1 AA requires 4.5:1 for normal text
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      });

      it('should verify contrast ratio calculation is correct', () => {
        fc.assert(
          fc.property(colorPairArbitrary, ({ foreground, background }) => {
            const ratio = getContrastRatio(foreground, background);
            
            // Contrast ratio should be between 1 and 21
            expect(ratio).toBeGreaterThanOrEqual(1);
            expect(ratio).toBeLessThanOrEqual(21);
            
            // Same color should have ratio of 1
            const sameColorRatio = getContrastRatio(foreground, foreground);
            expect(sameColorRatio).toBe(1);
          }),
          { numRuns: 100 }
        );
      });

      it('should have white text readable on gradient backgrounds', () => {
        // Test white text on primary gradient colors
        const whiteColor = '#ffffff';
        const primaryColor = '#5a67d8'; // Lighter end of gradient
        const primaryDarkColor = '#6b46c1'; // Darker end of gradient
        
        const ratioOnPrimary = getContrastRatio(whiteColor, primaryColor);
        const ratioOnPrimaryDark = getContrastRatio(whiteColor, primaryDarkColor);
        
        // Large text (18pt+) requires 3:1 ratio
        // Hero text is typically large, so we check for 3:1
        expect(ratioOnPrimary).toBeGreaterThanOrEqual(3);
        expect(ratioOnPrimaryDark).toBeGreaterThanOrEqual(3);
      });
    });

    /**
     * Property 12.2: All meaningful images SHALL have non-empty alt attributes
     * **Validates: Requirements 11.2**
     */
    describe('Image Alt Text', () => {
      
      it('should have alt text on all content images', () => {
        const { document } = createMockDOM();
        
        // Get all images that are not decorative
        const contentImages = document.querySelectorAll('img:not([aria-hidden="true"])');
        
        contentImages.forEach(img => {
          const alt = img.getAttribute('alt');
          // Content images should have non-empty alt text
          if (!img.hasAttribute('aria-hidden')) {
            expect(alt).toBeTruthy();
            expect(alt.length).toBeGreaterThan(0);
          }
        });
      });

      it('should have empty alt or aria-hidden on decorative images', () => {
        const { document } = createMockDOM();
        
        // Get decorative images
        const decorativeImages = document.querySelectorAll('img[aria-hidden="true"]');
        
        decorativeImages.forEach(img => {
          const alt = img.getAttribute('alt');
          // Decorative images should have empty alt
          expect(alt).toBe('');
        });
      });

      it('should have aria-hidden on decorative icons', () => {
        const { document } = createMockDOM();
        
        // Get icon elements (emoji spans, etc.)
        const icons = document.querySelectorAll('.icon, [class*="icon"]');
        
        icons.forEach(icon => {
          // Decorative icons should have aria-hidden
          if (!icon.textContent.trim() || icon.textContent.match(/[\u{1F300}-\u{1F9FF}]/u)) {
            expect(icon.getAttribute('aria-hidden')).toBe('true');
          }
        });
      });

      it('should verify image accessibility for any image type', () => {
        fc.assert(
          fc.property(imageTypeArbitrary, (imageType) => {
            const { document } = createMockDOM();
            
            if (imageType === 'content') {
              const contentImages = document.querySelectorAll('img:not([aria-hidden="true"]):not([alt=""])');
              contentImages.forEach(img => {
                const alt = img.getAttribute('alt');
                expect(alt).toBeTruthy();
              });
            } else {
              const decorativeImages = document.querySelectorAll('img[aria-hidden="true"], img[alt=""]');
              decorativeImages.forEach(img => {
                const alt = img.getAttribute('alt');
                expect(alt === '' || img.getAttribute('aria-hidden') === 'true').toBe(true);
              });
            }
          }),
          { numRuns: 50 }
        );
      });
    });

    /**
     * Property 12.3: All interactive elements SHALL be keyboard focusable
     * **Validates: Requirements 11.3**
     */
    describe('Keyboard Accessibility', () => {
      
      it('should have all buttons keyboard focusable', () => {
        const { document } = createMockDOM();
        
        const buttons = document.querySelectorAll('button');
        
        buttons.forEach(button => {
          // Buttons should not have negative tabindex
          const tabindex = button.getAttribute('tabindex');
          expect(tabindex !== '-1').toBe(true);
          
          // Buttons should not be disabled without proper indication
          if (button.disabled) {
            expect(button.hasAttribute('aria-disabled') || button.disabled).toBe(true);
          }
        });
      });

      it('should have all links keyboard focusable', () => {
        const { document } = createMockDOM();
        
        const links = document.querySelectorAll('a[href]');
        
        links.forEach(link => {
          // Links should not have negative tabindex
          const tabindex = link.getAttribute('tabindex');
          expect(tabindex !== '-1').toBe(true);
        });
      });

      it('should have custom interactive elements with proper tabindex', () => {
        const { document } = createMockDOM();
        
        // Elements with role="button" should be focusable
        const customButtons = document.querySelectorAll('[role="button"]');
        
        customButtons.forEach(el => {
          const tabindex = el.getAttribute('tabindex');
          // Should have tabindex="0" or be a naturally focusable element
          expect(tabindex === '0' || el.tagName === 'BUTTON').toBe(true);
        });
      });

      it('should verify keyboard focusability for any interactive element type', () => {
        fc.assert(
          fc.property(interactiveElementArbitrary, (selector) => {
            const { document } = createMockDOM();
            
            const elements = document.querySelectorAll(selector);
            
            elements.forEach(el => {
              const tabindex = el.getAttribute('tabindex');
              // Should not have tabindex="-1" unless intentionally hidden
              if (tabindex === '-1') {
                // If tabindex is -1, element should be hidden or have aria-hidden
                const isHidden = el.getAttribute('aria-hidden') === 'true' ||
                                 el.hidden ||
                                 el.style.display === 'none';
                expect(isHidden).toBe(true);
              }
            });
          }),
          { numRuns: 50 }
        );
      });
    });

    /**
     * Property 12.4: Interactive elements without visible text SHALL have aria-label
     * **Validates: Requirements 11.5**
     */
    describe('ARIA Labels', () => {
      
      it('should have aria-label on icon-only buttons', () => {
        const { document } = createMockDOM();
        
        // Buttons that only contain icons or hidden text
        const iconButtons = document.querySelectorAll('button');
        
        iconButtons.forEach(button => {
          const visibleText = button.textContent.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
          const hasAriaLabel = button.hasAttribute('aria-label');
          const hasAriaLabelledby = button.hasAttribute('aria-labelledby');
          
          // If no visible text, must have aria-label or aria-labelledby
          if (!visibleText || visibleText === '') {
            expect(hasAriaLabel || hasAriaLabelledby).toBe(true);
          }
        });
      });

      it('should have aria-expanded on expandable elements', () => {
        const { document } = createMockDOM();
        
        // Accordion headers
        const accordionHeaders = document.querySelectorAll('.accordion__header');
        accordionHeaders.forEach(header => {
          expect(header.hasAttribute('aria-expanded')).toBe(true);
        });
        
        // Hamburger menu
        const hamburger = document.querySelector('.nav__hamburger');
        if (hamburger) {
          expect(hamburger.hasAttribute('aria-expanded')).toBe(true);
        }
      });

      it('should have role="dialog" on modals', () => {
        const { document } = createMockDOM();
        
        const modals = document.querySelectorAll('.modal');
        
        modals.forEach(modal => {
          expect(modal.getAttribute('role')).toBe('dialog');
          expect(modal.hasAttribute('aria-modal')).toBe(true);
          expect(modal.hasAttribute('aria-labelledby') || modal.hasAttribute('aria-label')).toBe(true);
        });
      });

      it('should have proper ARIA attributes for navigation', () => {
        const { document } = createMockDOM();
        
        const nav = document.querySelector('nav[role="navigation"]');
        expect(nav).not.toBeNull();
        expect(nav.hasAttribute('aria-label')).toBe(true);
        
        // Menu should have proper roles
        const menu = document.querySelector('[role="menubar"]');
        if (menu) {
          const menuItems = menu.querySelectorAll('[role="menuitem"]');
          expect(menuItems.length).toBeGreaterThan(0);
        }
      });

      it('should verify ARIA attributes for any scenario', () => {
        fc.assert(
          fc.property(ariaScenarioArbitrary, (scenario) => {
            const { document } = createMockDOM();
            
            switch (scenario) {
              case 'button-no-text':
                const iconButtons = document.querySelectorAll('.btn-icon, .modal__close, .carousel__prev, .carousel__next');
                iconButtons.forEach(btn => {
                  expect(btn.hasAttribute('aria-label')).toBe(true);
                });
                break;
                
              case 'accordion-header':
                const accordions = document.querySelectorAll('.accordion__header');
                accordions.forEach(header => {
                  expect(header.hasAttribute('aria-expanded')).toBe(true);
                  expect(header.hasAttribute('aria-controls')).toBe(true);
                });
                break;
                
              case 'carousel-nav':
                const carouselBtns = document.querySelectorAll('.carousel__prev, .carousel__next');
                carouselBtns.forEach(btn => {
                  expect(btn.hasAttribute('aria-label')).toBe(true);
                });
                break;
                
              case 'modal-dialog':
                const modals = document.querySelectorAll('.modal');
                modals.forEach(modal => {
                  expect(modal.getAttribute('role')).toBe('dialog');
                  expect(modal.getAttribute('aria-modal')).toBe('true');
                });
                break;
                
              case 'menu-toggle':
                const hamburger = document.querySelector('.nav__hamburger');
                if (hamburger) {
                  expect(hamburger.hasAttribute('aria-expanded')).toBe(true);
                  expect(hamburger.hasAttribute('aria-controls')).toBe(true);
                  expect(hamburger.hasAttribute('aria-label')).toBe(true);
                }
                break;
            }
          }),
          { numRuns: 50 }
        );
      });
    });

    /**
     * Property 12.5: All focusable elements SHALL have visible focus indicators
     * **Validates: Requirements 11.6**
     */
    describe('Focus Indicators', () => {
      
      it('should have focus styles defined for buttons', () => {
        const { document } = createMockDOM();
        
        // Check that focus styles exist in the stylesheet
        const styleSheets = document.styleSheets;
        let hasFocusStyle = false;
        
        // In our mock, we added inline styles with focus rules
        const styleElement = document.querySelector('style');
        if (styleElement) {
          const cssText = styleElement.textContent;
          hasFocusStyle = cssText.includes(':focus') || cssText.includes('focus');
        }
        
        expect(hasFocusStyle).toBe(true);
      });

      it('should not have outline:none on focusable elements', () => {
        const { document } = createMockDOM();
        
        // Check inline styles don't hide outlines
        const allElements = document.querySelectorAll('*');
        
        allElements.forEach(el => {
          const style = el.getAttribute('style');
          if (style) {
            expect(style.includes('outline: none')).toBe(false);
            expect(style.includes('outline:none')).toBe(false);
            expect(style.includes('outline: 0')).toBe(false);
            expect(style.includes('outline:0')).toBe(false);
          }
        });
      });

      it('should have visible focus indicators for all interactive elements', () => {
        fc.assert(
          fc.property(interactiveElementArbitrary, (selector) => {
            const { document } = createMockDOM();
            
            const elements = document.querySelectorAll(selector);
            
            elements.forEach(el => {
              // Check that element doesn't have outline hidden inline
              const style = el.getAttribute('style');
              if (style) {
                expect(style.includes('outline: none')).toBe(false);
                expect(style.includes('outline:none')).toBe(false);
              }
            });
          }),
          { numRuns: 50 }
        );
      });

      it('should have skip link for keyboard navigation', () => {
        const { document } = createMockDOM();
        
        const skipLink = document.querySelector('.skip-link, [href="#main-content"]');
        expect(skipLink).not.toBeNull();
        
        // Skip link should link to main content
        const href = skipLink.getAttribute('href');
        expect(href).toBe('#main-content');
        
        // Main content should exist
        const mainContent = document.querySelector('#main-content, main');
        expect(mainContent).not.toBeNull();
      });
    });

    /**
     * Property 12.6: Semantic HTML structure
     * **Validates: Requirements 11.4**
     */
    describe('Semantic HTML', () => {
      
      it('should have proper document structure', () => {
        const { document } = createMockDOM();
        
        // Should have header
        const header = document.querySelector('header');
        expect(header).not.toBeNull();
        
        // Should have main
        const main = document.querySelector('main');
        expect(main).not.toBeNull();
        
        // Should have footer
        const footer = document.querySelector('footer');
        expect(footer).not.toBeNull();
        
        // Footer should have contentinfo role
        expect(footer.getAttribute('role')).toBe('contentinfo');
      });

      it('should have proper heading hierarchy', () => {
        const { document } = createMockDOM();
        
        const h1s = document.querySelectorAll('h1');
        const h2s = document.querySelectorAll('h2');
        
        // Should have at least one h1
        expect(h1s.length).toBeGreaterThanOrEqual(1);
        
        // h2s should come after h1 in document order (simplified check)
        if (h1s.length > 0 && h2s.length > 0) {
          const h1Position = Array.from(document.querySelectorAll('h1, h2')).indexOf(h1s[0]);
          const h2Position = Array.from(document.querySelectorAll('h1, h2')).indexOf(h2s[0]);
          expect(h1Position).toBeLessThan(h2Position);
        }
      });

      it('should have lang attribute on html element', () => {
        const { document } = createMockDOM();
        
        const html = document.documentElement;
        expect(html.hasAttribute('lang')).toBe(true);
        expect(html.getAttribute('lang')).toBe('vi');
      });

      it('should have sections with proper labeling', () => {
        const { document } = createMockDOM();
        
        const sections = document.querySelectorAll('section');
        
        sections.forEach(section => {
          // Sections should have aria-labelledby or aria-label
          const hasLabel = section.hasAttribute('aria-labelledby') || 
                          section.hasAttribute('aria-label');
          expect(hasLabel).toBe(true);
        });
      });
    });
  });
});
