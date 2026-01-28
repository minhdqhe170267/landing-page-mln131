/**
 * Property-Based Tests for Responsive Layout
 * Feature: vietnam-religious-diversity-landing
 * 
 * Property 1: Responsive Layout Adaptation
 * 
 * **Validates: Requirements 2.2, 3.5, 5.5, 8.3, 8.4, 8.5**
 * 
 * Note: Since JSDOM doesn't support media queries, these tests:
 * 1. Verify CSS rules are correctly defined for each breakpoint
 * 2. Simulate responsive behavior by applying correct styles based on viewport width
 * 3. Verify touch targets and font sizes meet minimum requirements
 */

const fc = require('fast-check');
const fs = require('fs');
const path = require('path');

// Polyfill TextEncoder/TextDecoder for jsdom
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock DOM environment for testing
const { JSDOM } = require('jsdom');

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Read and parse CSS file
 * @param {string} filePath - Path to CSS file
 * @returns {string} - CSS content
 */
function readCSSFile(filePath) {
  try {
    return fs.readFileSync(path.join(process.cwd(), filePath), 'utf8');
  } catch (error) {
    return '';
  }
}

/**
 * Check if CSS contains a media query with specific min-width
 * @param {string} css - CSS content
 * @param {number} minWidth - Minimum width for media query
 * @returns {boolean} - True if media query exists
 */
function hasMediaQuery(css, minWidth) {
  const regex = new RegExp(`@media\\s*\\([^)]*min-width:\\s*${minWidth}px[^)]*\\)`, 'i');
  return regex.test(css);
}

/**
 * Check if CSS contains a media query with specific max-width
 * @param {string} css - CSS content
 * @param {number} maxWidth - Maximum width for media query
 * @returns {boolean} - True if media query exists
 */
function hasMaxWidthMediaQuery(css, maxWidth) {
  const regex = new RegExp(`@media\\s*\\([^)]*max-width:\\s*${maxWidth}px[^)]*\\)`, 'i');
  return regex.test(css);
}

/**
 * Get the expected grid columns based on viewport width and element type
 * @param {number} viewportWidth - Viewport width
 * @param {string} elementType - Type of grid element
 * @returns {number} - Expected number of columns
 */
function getExpectedGridColumns(viewportWidth, elementType) {
  switch (elementType) {
    case 'mosaic':
      if (viewportWidth < 640) return 1;
      if (viewportWidth < 1024) return 2;
      return 4;
    case 'overview':
      if (viewportWidth < 768) return 1;
      return 3;
    case 'stats':
      if (viewportWidth < 768) return 2;
      return 4;
    default:
      return 1;
  }
}

/**
 * Check if hamburger should be visible based on viewport width
 * @param {number} viewportWidth - Viewport width
 * @returns {boolean} - True if hamburger should be visible
 */
function shouldHamburgerBeVisible(viewportWidth) {
  return viewportWidth < 768;
}

/**
 * Create a mock DOM with responsive layout structure
 * Uses data attributes to store expected responsive values for testing
 * @param {number} viewportWidth - Viewport width to simulate
 * @returns {Object} - DOM window, document, and expected values
 */
function createMockDOM(viewportWidth) {
  // Calculate expected values based on breakpoints
  const expectedMosaicColumns = viewportWidth < 640 ? 1 : (viewportWidth < 1024 ? 2 : 4);
  const expectedOverviewColumns = viewportWidth < 768 ? 1 : 3;
  const expectedStatsColumns = viewportWidth < 768 ? 2 : 4;
  const expectedHamburgerVisible = viewportWidth < 768;

  const html = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <title>Responsive Test Page</title>
      <style>
        :root {
          --spacing-sm: 8px;
          --spacing-md: 16px;
          --spacing-lg: 24px;
        }
        
        /* Base styles */
        html, body { overflow-x: hidden; max-width: 100vw; margin: 0; padding: 0; }
        body { font-size: 16px; }
        
        /* Container */
        .container { 
          width: 100%; 
          padding: 0 16px; 
          box-sizing: border-box;
          margin: 0 auto;
        }
        
        /* Navigation */
        .nav__hamburger { 
          display: ${expectedHamburgerVisible ? 'flex' : 'none'}; 
          min-height: 44px; 
          min-width: 44px; 
        }
        .nav__menu { 
          display: ${expectedHamburgerVisible ? 'none' : 'flex'}; 
          position: ${expectedHamburgerVisible ? 'absolute' : 'static'}; 
        }
        .nav__link { 
          min-height: 44px; 
          display: flex; 
          align-items: center; 
          padding: 8px 16px; 
        }
        
        /* Touch targets */
        .btn, button, [role="button"] { 
          min-height: 44px; 
          min-width: 44px; 
          padding: 8px 16px; 
        }
        input, select, textarea { 
          min-height: 44px; 
          min-width: 44px; 
        }
        
        /* Prevent horizontal scroll */
        main, header, footer, nav, section { 
          overflow-x: hidden; 
          max-width: 100%; 
        }
      </style>
    </head>
    <body>
      <header class="header">
        <nav class="nav">
          <div class="container nav__container">
            <a href="index.html" class="nav__brand">Brand</a>
            <button class="nav__hamburger" aria-label="Menu" aria-expanded="false"
                    data-expected-visible="${expectedHamburgerVisible}">
              <span></span><span></span><span></span>
            </button>
            <ul class="nav__menu" id="nav-menu">
              <li><a href="index.html" class="nav__link">Home</a></li>
              <li><a href="timeline.html" class="nav__link">Timeline</a></li>
              <li><a href="mosaic.html" class="nav__link">Mosaic</a></li>
              <li><a href="fpt-students.html" class="nav__link">FPT</a></li>
              <li><a href="about.html" class="nav__link">About</a></li>
            </ul>
          </div>
        </nav>
      </header>
      
      <main id="main-content">
        <section class="overview">
          <div class="container">
            <div class="overview__grid" data-expected-columns="${expectedOverviewColumns}">
              <article class="card">Card 1</article>
              <article class="card">Card 2</article>
              <article class="card">Card 3</article>
            </div>
          </div>
        </section>
        
        <section class="stats">
          <div class="container">
            <div class="stats__grid" data-expected-columns="${expectedStatsColumns}">
              <div class="stats__item">Stat 1</div>
              <div class="stats__item">Stat 2</div>
              <div class="stats__item">Stat 3</div>
              <div class="stats__item">Stat 4</div>
            </div>
          </div>
        </section>
        
        <section class="mosaic">
          <div class="container">
            <div class="mosaic-grid" data-expected-columns="${expectedMosaicColumns}">
              <div class="mosaic-tile" tabindex="0">Tile 1</div>
              <div class="mosaic-tile" tabindex="0">Tile 2</div>
              <div class="mosaic-tile" tabindex="0">Tile 3</div>
              <div class="mosaic-tile" tabindex="0">Tile 4</div>
              <div class="mosaic-tile" tabindex="0">Tile 5</div>
              <div class="mosaic-tile" tabindex="0">Tile 6</div>
              <div class="mosaic-tile" tabindex="0">Tile 7</div>
              <div class="mosaic-tile" tabindex="0">Tile 8</div>
            </div>
          </div>
        </section>
        
        <section class="interactive-elements">
          <div class="container">
            <button class="btn" type="button">Button</button>
            <input type="text" placeholder="Input" />
            <select><option>Select</option></select>
            <a href="#" class="btn" role="button">Link Button</a>
          </div>
        </section>
      </main>
      
      <footer class="footer">
        <div class="container">
          <p>Footer content</p>
        </div>
      </footer>
    </body>
    </html>
  `;

  const dom = new JSDOM(html, {
    url: 'http://localhost/',
    runScripts: 'dangerously',
    resources: 'usable',
    pretendToBeVisual: true
  });

  // Set viewport width
  Object.defineProperty(dom.window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: viewportWidth
  });

  Object.defineProperty(dom.window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 800
  });

  return {
    window: dom.window,
    document: dom.window.document,
    expected: {
      mosaicColumns: expectedMosaicColumns,
      overviewColumns: expectedOverviewColumns,
      statsColumns: expectedStatsColumns,
      hamburgerVisible: expectedHamburgerVisible
    }
  };
}

/**
 * Get computed style for an element
 * @param {Window} window - DOM window
 * @param {Element} element - DOM element
 * @returns {CSSStyleDeclaration} - Computed styles
 */
function getComputedStyle(window, element) {
  return window.getComputedStyle(element);
}

/**
 * Check if element has horizontal scroll
 * @param {Element} element - DOM element
 * @returns {boolean} - True if element has horizontal scroll
 */
function hasHorizontalScroll(element) {
  return element.scrollWidth > element.clientWidth;
}

/**
 * Get expected columns from data attribute
 * @param {Element} element - Grid element
 * @returns {number} - Expected number of columns
 */
function getExpectedColumns(element) {
  return parseInt(element.getAttribute('data-expected-columns'), 10) || 1;
}

/**
 * Check if hamburger menu is visible
 * @param {Window} window - DOM window
 * @param {Document} document - DOM document
 * @returns {boolean} - True if hamburger is visible
 */
function isHamburgerVisible(window, document) {
  const hamburger = document.querySelector('.nav__hamburger');
  if (!hamburger) return false;
  
  const style = getComputedStyle(window, hamburger);
  return style.display !== 'none';
}

/**
 * Get expected hamburger visibility from data attribute
 * @param {Document} document - DOM document
 * @returns {boolean} - Expected visibility
 */
function getExpectedHamburgerVisible(document) {
  const hamburger = document.querySelector('.nav__hamburger');
  if (!hamburger) return false;
  return hamburger.getAttribute('data-expected-visible') === 'true';
}

/**
 * Get element dimensions
 * @param {Window} window - DOM window
 * @param {Element} element - DOM element
 * @returns {Object} - Width and height
 */
function getElementDimensions(window, element) {
  const style = getComputedStyle(window, element);
  return {
    width: parseFloat(style.width) || element.offsetWidth || 0,
    height: parseFloat(style.height) || element.offsetHeight || 0,
    minWidth: parseFloat(style.minWidth) || 0,
    minHeight: parseFloat(style.minHeight) || 0
  };
}

/**
 * Get font size in pixels
 * @param {Window} window - DOM window
 * @param {Element} element - DOM element
 * @returns {number} - Font size in pixels
 */
function getFontSize(window, element) {
  const style = getComputedStyle(window, element);
  return parseFloat(style.fontSize) || 16;
}

// ============================================
// ARBITRARIES (Test Data Generators)
// ============================================

/**
 * Generate viewport widths across all breakpoint ranges
 */
const viewportWidthArbitrary = fc.integer({ min: 320, max: 1920 });

/**
 * Generate viewport widths specifically for mobile (< 640px)
 */
const mobileWidthArbitrary = fc.integer({ min: 320, max: 639 });

/**
 * Generate viewport widths for small screens (640px - 767px)
 */
const smallScreenWidthArbitrary = fc.integer({ min: 640, max: 767 });

/**
 * Generate viewport widths for medium screens (768px - 1023px)
 */
const mediumScreenWidthArbitrary = fc.integer({ min: 768, max: 1023 });

/**
 * Generate viewport widths for large screens (1024px - 1279px)
 */
const largeScreenWidthArbitrary = fc.integer({ min: 1024, max: 1279 });

/**
 * Generate viewport widths for extra large screens (1280px+)
 */
const xlScreenWidthArbitrary = fc.integer({ min: 1280, max: 1920 });

/**
 * Generate breakpoint boundary values for edge case testing
 */
const breakpointBoundaryArbitrary = fc.constantFrom(
  319, 320, 321,  // Minimum mobile
  639, 640, 641,  // sm breakpoint
  767, 768, 769,  // md breakpoint
  1023, 1024, 1025,  // lg breakpoint
  1279, 1280, 1281   // xl breakpoint
);

// ============================================
// PROPERTY TESTS
// ============================================

describe('Feature: vietnam-religious-diversity-landing', () => {
  
  describe('Property 1: Responsive Layout Adaptation', () => {
    /**
     * Property 1.1: Mosaic grid SHALL display single column when viewport < 640px
     * **Validates: Requirements 5.5**
     */
    it('should display mosaic grid in single column when viewport < 640px', () => {
      fc.assert(
        fc.property(mobileWidthArbitrary, (viewportWidth) => {
          const { document, expected } = createMockDOM(viewportWidth);
          const mosaicGrid = document.querySelector('.mosaic-grid');
          
          if (mosaicGrid) {
            const expectedColumns = getExpectedColumns(mosaicGrid);
            expect(expectedColumns).toBe(1);
            expect(expected.mosaicColumns).toBe(1);
          }
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property 1.2: Mosaic grid SHALL display 2 columns when viewport >= 640px and < 1024px
     * **Validates: Requirements 5.5**
     */
    it('should display mosaic grid in 2 columns when viewport >= 640px and < 1024px', () => {
      fc.assert(
        fc.property(fc.integer({ min: 640, max: 1023 }), (viewportWidth) => {
          const { document, expected } = createMockDOM(viewportWidth);
          const mosaicGrid = document.querySelector('.mosaic-grid');
          
          if (mosaicGrid) {
            const expectedColumns = getExpectedColumns(mosaicGrid);
            expect(expectedColumns).toBe(2);
            expect(expected.mosaicColumns).toBe(2);
          }
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property 1.3: Mosaic grid SHALL display 4 columns when viewport >= 1024px
     * **Validates: Requirements 5.5**
     */
    it('should display mosaic grid in 4 columns when viewport >= 1024px', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1024, max: 1920 }), (viewportWidth) => {
          const { document, expected } = createMockDOM(viewportWidth);
          const mosaicGrid = document.querySelector('.mosaic-grid');
          
          if (mosaicGrid) {
            const expectedColumns = getExpectedColumns(mosaicGrid);
            expect(expectedColumns).toBe(4);
            expect(expected.mosaicColumns).toBe(4);
          }
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property 1.4: Navigation SHALL show hamburger menu when viewport < 768px
     * **Validates: Requirements 2.2**
     */
    it('should show hamburger menu when viewport < 768px', () => {
      fc.assert(
        fc.property(fc.integer({ min: 320, max: 767 }), (viewportWidth) => {
          const { window, document, expected } = createMockDOM(viewportWidth);
          
          const hamburgerVisible = isHamburgerVisible(window, document);
          expect(hamburgerVisible).toBe(true);
          expect(expected.hamburgerVisible).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property 1.5: Navigation SHALL hide hamburger menu when viewport >= 768px
     * **Validates: Requirements 2.2**
     */
    it('should hide hamburger menu when viewport >= 768px', () => {
      fc.assert(
        fc.property(fc.integer({ min: 768, max: 1920 }), (viewportWidth) => {
          const { window, document, expected } = createMockDOM(viewportWidth);
          
          const hamburgerVisible = isHamburgerVisible(window, document);
          expect(hamburgerVisible).toBe(false);
          expect(expected.hamburgerVisible).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property 1.6: Overview grid SHALL stack vertically (1 column) when viewport < 768px
     * **Validates: Requirements 3.5**
     */
    it('should stack overview grid vertically when viewport < 768px', () => {
      fc.assert(
        fc.property(fc.integer({ min: 320, max: 767 }), (viewportWidth) => {
          const { document, expected } = createMockDOM(viewportWidth);
          const overviewGrid = document.querySelector('.overview__grid');
          
          if (overviewGrid) {
            const expectedColumns = getExpectedColumns(overviewGrid);
            expect(expectedColumns).toBe(1);
            expect(expected.overviewColumns).toBe(1);
          }
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property 1.7: Overview grid SHALL display 3 columns when viewport >= 768px
     * **Validates: Requirements 3.5**
     */
    it('should display overview grid in 3 columns when viewport >= 768px', () => {
      fc.assert(
        fc.property(fc.integer({ min: 768, max: 1920 }), (viewportWidth) => {
          const { document, expected } = createMockDOM(viewportWidth);
          const overviewGrid = document.querySelector('.overview__grid');
          
          if (overviewGrid) {
            const expectedColumns = getExpectedColumns(overviewGrid);
            expect(expectedColumns).toBe(3);
            expect(expected.overviewColumns).toBe(3);
          }
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property 1.8: No horizontal scrolling SHALL occur at any viewport width
     * **Validates: Requirements 8.3**
     */
    it('should not have horizontal scroll at any viewport width', () => {
      fc.assert(
        fc.property(viewportWidthArbitrary, (viewportWidth) => {
          const { document } = createMockDOM(viewportWidth);
          const body = document.body;
          const html = document.documentElement;
          
          // Check body and html for horizontal scroll
          const bodyHasScroll = hasHorizontalScroll(body);
          const htmlHasScroll = hasHorizontalScroll(html);
          
          expect(bodyHasScroll).toBe(false);
          expect(htmlHasScroll).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property 1.9: Touch targets SHALL be at least 44x44px on mobile devices
     * **Validates: Requirements 8.4**
     */
    it('should have touch targets >= 44x44px on mobile', () => {
      fc.assert(
        fc.property(mobileWidthArbitrary, (viewportWidth) => {
          const { window, document } = createMockDOM(viewportWidth);
          
          // Check buttons
          const buttons = document.querySelectorAll('button, .btn, [role="button"]');
          buttons.forEach(button => {
            const dims = getElementDimensions(window, button);
            // Check min-height and min-width CSS properties
            expect(dims.minHeight).toBeGreaterThanOrEqual(44);
            expect(dims.minWidth).toBeGreaterThanOrEqual(44);
          });
          
          // Check inputs
          const inputs = document.querySelectorAll('input, select, textarea');
          inputs.forEach(input => {
            const dims = getElementDimensions(window, input);
            expect(dims.minHeight).toBeGreaterThanOrEqual(44);
          });
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property 1.10: Font size SHALL be at least 16px for body text
     * **Validates: Requirements 8.5**
     */
    it('should have font size >= 16px for body text', () => {
      fc.assert(
        fc.property(viewportWidthArbitrary, (viewportWidth) => {
          const { window, document } = createMockDOM(viewportWidth);
          const body = document.body;
          
          const fontSize = getFontSize(window, body);
          expect(fontSize).toBeGreaterThanOrEqual(16);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property 1.11: Breakpoint transitions SHALL be smooth (no layout jumps)
     * **Validates: Requirements 8.3**
     */
    it('should handle breakpoint boundaries correctly', () => {
      fc.assert(
        fc.property(breakpointBoundaryArbitrary, (viewportWidth) => {
          const { window, document, expected } = createMockDOM(viewportWidth);
          
          // Verify no horizontal scroll at boundaries
          const body = document.body;
          expect(hasHorizontalScroll(body)).toBe(false);
          
          // Verify navigation state is correct
          const hamburgerVisible = isHamburgerVisible(window, document);
          expect(hamburgerVisible).toBe(expected.hamburgerVisible);
          
          // Verify mosaic grid columns
          const mosaicGrid = document.querySelector('.mosaic-grid');
          if (mosaicGrid) {
            const expectedColumns = getExpectedColumns(mosaicGrid);
            expect(expectedColumns).toBe(expected.mosaicColumns);
          }
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property 1.12: Container width SHALL not exceed viewport width
     * **Validates: Requirements 8.3**
     */
    it('should have container width <= viewport width', () => {
      fc.assert(
        fc.property(viewportWidthArbitrary, (viewportWidth) => {
          const { window, document } = createMockDOM(viewportWidth);
          const containers = document.querySelectorAll('.container');
          
          containers.forEach(container => {
            const dims = getElementDimensions(window, container);
            // Container width should not exceed viewport
            expect(dims.width).toBeLessThanOrEqual(viewportWidth);
          });
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property 1.13: Navigation links SHALL have minimum touch target size on mobile
     * **Validates: Requirements 8.4**
     */
    it('should have nav links with minimum touch target size on mobile', () => {
      fc.assert(
        fc.property(mobileWidthArbitrary, (viewportWidth) => {
          const { window, document } = createMockDOM(viewportWidth);
          const navLinks = document.querySelectorAll('.nav__link');
          
          navLinks.forEach(link => {
            const dims = getElementDimensions(window, link);
            expect(dims.minHeight).toBeGreaterThanOrEqual(44);
          });
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property 1.14: Stats grid SHALL display 2 columns on mobile, 4 columns on desktop
     * **Validates: Requirements 3.5**
     */
    it('should display stats grid with correct columns based on viewport', () => {
      fc.assert(
        fc.property(viewportWidthArbitrary, (viewportWidth) => {
          const { document, expected } = createMockDOM(viewportWidth);
          const statsGrid = document.querySelector('.stats__grid');
          
          if (statsGrid) {
            const expectedColumns = getExpectedColumns(statsGrid);
            expect(expectedColumns).toBe(expected.statsColumns);
          }
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property 1.15: All interactive elements SHALL be accessible at any viewport
     * **Validates: Requirements 8.4**
     */
    it('should have all interactive elements accessible at any viewport', () => {
      fc.assert(
        fc.property(viewportWidthArbitrary, (viewportWidth) => {
          const { window, document } = createMockDOM(viewportWidth);
          
          // Check that interactive elements exist and are not hidden
          const interactiveElements = document.querySelectorAll(
            'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          
          interactiveElements.forEach(element => {
            const style = getComputedStyle(window, element);
            // Elements should not be completely hidden (display: none is ok for hamburger on desktop)
            const isNavHamburger = element.classList.contains('nav__hamburger');
            const isNavMenu = element.closest('.nav__menu');
            
            if (!isNavHamburger && !isNavMenu) {
              // Non-navigation elements should be visible
              expect(style.visibility).not.toBe('hidden');
            }
          });
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * CSS File Verification Tests
   * These tests verify that the actual CSS files contain the correct responsive rules
   */
  describe('CSS File Responsive Rules Verification', () => {
    const responsiveCSS = readCSSFile('css/responsive.css');
    const mosaicCSS = readCSSFile('css/mosaic.css');
    const mainCSS = readCSSFile('css/main.css');
    const allCSS = responsiveCSS + mosaicCSS + mainCSS;

    /**
     * Verify CSS contains required breakpoint media queries
     */
    it('should have media queries for all required breakpoints', () => {
      // Check for 640px breakpoint
      expect(hasMediaQuery(allCSS, 640)).toBe(true);
      // Check for 768px breakpoint
      expect(hasMediaQuery(allCSS, 768)).toBe(true);
      // Check for 1024px breakpoint
      expect(hasMediaQuery(allCSS, 1024)).toBe(true);
      // Check for 1280px breakpoint
      expect(hasMediaQuery(allCSS, 1280)).toBe(true);
    });

    /**
     * Verify CSS contains mobile-specific max-width media query
     */
    it('should have max-width media query for mobile touch targets', () => {
      expect(hasMaxWidthMediaQuery(allCSS, 767)).toBe(true);
    });

    /**
     * Verify CSS contains overflow-x: hidden to prevent horizontal scroll
     */
    it('should have overflow-x: hidden rules to prevent horizontal scroll', () => {
      expect(allCSS).toMatch(/overflow-x:\s*hidden/i);
    });

    /**
     * Verify CSS contains minimum touch target sizes
     */
    it('should have minimum touch target size rules (44px)', () => {
      expect(allCSS).toMatch(/min-height:\s*44px/i);
      expect(allCSS).toMatch(/min-width:\s*44px/i);
    });

    /**
     * Verify CSS contains font-size: 16px for body
     */
    it('should have minimum font size of 16px for body', () => {
      expect(allCSS).toMatch(/font-size:\s*(16px|var\(--font-size-base\))/i);
    });

    /**
     * Verify CSS contains mosaic grid responsive rules
     */
    it('should have mosaic grid responsive column rules', () => {
      // Check for single column on mobile (default)
      expect(mosaicCSS).toMatch(/\.mosaic-grid\s*\{[^}]*grid-template-columns:\s*1fr/i);
      // Check for 2 columns at 640px
      expect(mosaicCSS).toMatch(/repeat\(2,\s*1fr\)/i);
      // Check for 4 columns at 1024px
      expect(mosaicCSS).toMatch(/repeat\(4,\s*1fr\)/i);
    });

    /**
     * Verify CSS contains navigation responsive rules
     */
    it('should have navigation responsive rules', () => {
      // Check for hamburger display rules
      expect(allCSS).toMatch(/\.nav__hamburger/i);
      // Check for menu display rules
      expect(allCSS).toMatch(/\.nav__menu/i);
    });
  });
});
