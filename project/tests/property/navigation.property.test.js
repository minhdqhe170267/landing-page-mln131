/**
 * Property-Based Tests for Navigation System
 * Feature: vietnam-religious-diversity-landing
 * 
 * Property 2: Navigation Active State Consistency
 * Property 3: Navigation Menu Toggle
 * 
 * **Validates: Requirements 2.3, 2.4, 2.5**
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
 * Create a mock DOM with navigation structure
 * @param {string} currentPage - The current page path
 * @returns {Object} - DOM window and document
 */
function createMockDOM(currentPage = 'index.html') {
  const html = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <title>Test Page</title>
    </head>
    <body>
      <header class="header">
        <nav class="nav" role="navigation" aria-label="Main navigation">
          <div class="container nav__container">
            <a href="index.html" class="nav__brand">Brand</a>
            
            <button 
              class="nav__hamburger" 
              type="button"
              aria-label="Mở menu điều hướng"
              aria-expanded="false"
              aria-controls="nav-menu"
            >
              <span class="nav__hamburger-line"></span>
              <span class="nav__hamburger-line"></span>
              <span class="nav__hamburger-line"></span>
            </button>

            <ul class="nav__menu" id="nav-menu" role="menubar">
              <li class="nav__item" role="none">
                <a href="index.html" class="nav__link" role="menuitem">Trang Chủ</a>
              </li>
              <li class="nav__item" role="none">
                <a href="timeline.html" class="nav__link" role="menuitem">Lịch Sử</a>
              </li>
              <li class="nav__item" role="none">
                <a href="mosaic.html" class="nav__link" role="menuitem">Tôn Giáo</a>
              </li>
              <li class="nav__item" role="none">
                <a href="fpt-students.html" class="nav__link" role="menuitem">Sinh Viên FPT</a>
              </li>
              <li class="nav__item" role="none">
                <a href="about.html" class="nav__link" role="menuitem">Giới Thiệu</a>
              </li>
            </ul>
          </div>
        </nav>
      </header>
      <main id="main-content">
        <h1>Test Content</h1>
      </main>
    </body>
    </html>
  `;

  const dom = new JSDOM(html, {
    url: `http://localhost/${currentPage}`,
    runScripts: 'dangerously'
  });

  return {
    window: dom.window,
    document: dom.window.document
  };
}

/**
 * Create NavigationController instance for testing
 * @param {Document} document - DOM document
 * @param {Window} window - DOM window
 * @returns {Object} - NavigationController instance
 */
function createNavigationController(document, window) {
  const NavigationController = {
    mobileMenuOpen: false,
    navElement: null,
    hamburgerBtn: null,
    mobileMenu: null,
    navLinks: null,

    init() {
      this.navElement = document.querySelector('.nav');
      this.hamburgerBtn = document.querySelector('.nav__hamburger');
      this.mobileMenu = document.querySelector('.nav__menu');
      this.navLinks = document.querySelectorAll('.nav__link');

      if (this.hamburgerBtn) {
        this.hamburgerBtn.addEventListener('click', () => this.toggleMobileMenu());
      }

      document.addEventListener('click', (e) => {
        if (this.mobileMenuOpen && 
            !this.mobileMenu?.contains(e.target) && 
            !this.hamburgerBtn?.contains(e.target)) {
          this.closeMobileMenu();
        }
      });

      this.setActiveLink(window.location.pathname);
    },

    toggleMobileMenu() {
      this.mobileMenuOpen = !this.mobileMenuOpen;
      
      if (this.mobileMenu) {
        this.mobileMenu.classList.toggle('nav__menu--open', this.mobileMenuOpen);
      }
      
      if (this.hamburgerBtn) {
        this.hamburgerBtn.setAttribute('aria-expanded', this.mobileMenuOpen.toString());
      }
    },

    closeMobileMenu() {
      this.mobileMenuOpen = false;
      
      if (this.mobileMenu) {
        this.mobileMenu.classList.remove('nav__menu--open');
      }
      
      if (this.hamburgerBtn) {
        this.hamburgerBtn.setAttribute('aria-expanded', 'false');
      }
    },

    openMobileMenu() {
      this.mobileMenuOpen = true;
      
      if (this.mobileMenu) {
        this.mobileMenu.classList.add('nav__menu--open');
      }
      
      if (this.hamburgerBtn) {
        this.hamburgerBtn.setAttribute('aria-expanded', 'true');
      }
    },

    isMenuOpen() {
      return this.mobileMenuOpen;
    },

    setActiveLink(path) {
      const navLinks = document.querySelectorAll('.nav__link');
      
      let currentPage = path.split('/').pop() || 'index.html';
      if (currentPage === '' || currentPage === '/') {
        currentPage = 'index.html';
      }
      if (!currentPage.includes('.html')) {
        currentPage = currentPage + '.html';
      }
      if (currentPage.includes('?')) {
        currentPage = currentPage.split('?')[0];
      }

      let activeCount = 0;
      navLinks.forEach(link => {
        link.classList.remove('nav__link--active');
        link.removeAttribute('aria-current');
        const href = link.getAttribute('href');
        
        if (href) {
          let linkPage = href.split('/').pop();
          if (linkPage.includes('?')) {
            linkPage = linkPage.split('?')[0];
          }
          
          if (linkPage === currentPage || 
              (currentPage === 'index.html' && (linkPage === '' || linkPage === '/' || linkPage === 'index.html'))) {
            link.classList.add('nav__link--active');
            link.setAttribute('aria-current', 'page');
            activeCount++;
          }
        }
      });

      return activeCount;
    },

    getActiveLink() {
      return document.querySelector('.nav__link--active');
    },

    getNavLinks() {
      return document.querySelectorAll('.nav__link');
    }
  };

  return NavigationController;
}

// ============================================
// ARBITRARIES (Test Data Generators)
// ============================================

/**
 * Generate valid page names from the website
 */
const pageArbitrary = fc.constantFrom(
  'index.html',
  'timeline.html',
  'mosaic.html',
  'fpt-students.html',
  'about.html'
);

/**
 * Generate page paths with various formats
 */
const pagePathArbitrary = fc.oneof(
  // Standard paths
  pageArbitrary,
  // Paths with leading slash
  pageArbitrary.map(page => `/${page}`),
  // Paths with directory
  pageArbitrary.map(page => `/pages/${page}`),
  // Clean URLs (without .html)
  pageArbitrary.map(page => page.replace('.html', '')),
  // Root path for index
  fc.constant('/'),
  fc.constant('')
);

/**
 * Generate sequence of menu toggle actions
 */
const menuActionArbitrary = fc.constantFrom('toggle', 'open', 'close');

/**
 * Generate sequence of menu actions
 */
const menuActionSequenceArbitrary = fc.array(menuActionArbitrary, { minLength: 1, maxLength: 20 });

/**
 * Generate click locations (inside menu, outside menu, on hamburger)
 */
const clickLocationArbitrary = fc.constantFrom('hamburger', 'inside-menu', 'outside-menu', 'nav-link');

// ============================================
// PROPERTY TESTS
// ============================================

describe('Feature: vietnam-religious-diversity-landing', () => {
  
  describe('Property 2: Navigation Active State Consistency', () => {
    /**
     * Property 2.1: For any page, exactly one navigation link SHALL have the active class
     * **Validates: Requirements 2.5**
     */
    it('should have exactly one active link for any valid page', () => {
      fc.assert(
        fc.property(pageArbitrary, (page) => {
          const { document, window } = createMockDOM(page);
          const nav = createNavigationController(document, window);
          nav.init();

          const activeLinks = document.querySelectorAll('.nav__link--active');
          
          // Exactly one link should be active
          expect(activeLinks.length).toBe(1);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property 2.2: The active link SHALL correspond to the current page
     * **Validates: Requirements 2.5**
     */
    it('should mark the correct link as active based on current page', () => {
      fc.assert(
        fc.property(pageArbitrary, (page) => {
          const { document, window } = createMockDOM(page);
          const nav = createNavigationController(document, window);
          nav.init();

          const activeLink = document.querySelector('.nav__link--active');
          
          expect(activeLink).not.toBeNull();
          
          const href = activeLink.getAttribute('href');
          expect(href).toBe(page);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property 2.3: No other links SHALL have the active class
     * **Validates: Requirements 2.5**
     */
    it('should not have active class on non-current page links', () => {
      fc.assert(
        fc.property(pageArbitrary, (page) => {
          const { document, window } = createMockDOM(page);
          const nav = createNavigationController(document, window);
          nav.init();

          const allLinks = document.querySelectorAll('.nav__link');
          const activeLinks = document.querySelectorAll('.nav__link--active');
          
          // Count links that should NOT be active
          let nonActiveCount = 0;
          allLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href !== page) {
              expect(link.classList.contains('nav__link--active')).toBe(false);
              nonActiveCount++;
            }
          });
          
          // Should have exactly (total - 1) non-active links
          expect(nonActiveCount).toBe(allLinks.length - 1);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property 2.4: Active link SHALL have aria-current="page" attribute
     * **Validates: Requirements 2.5**
     */
    it('should set aria-current="page" on active link', () => {
      fc.assert(
        fc.property(pageArbitrary, (page) => {
          const { document, window } = createMockDOM(page);
          const nav = createNavigationController(document, window);
          nav.init();

          const activeLink = document.querySelector('.nav__link--active');
          
          expect(activeLink).not.toBeNull();
          expect(activeLink.getAttribute('aria-current')).toBe('page');
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property 2.5: Non-active links SHALL NOT have aria-current attribute
     * **Validates: Requirements 2.5**
     */
    it('should not have aria-current on non-active links', () => {
      fc.assert(
        fc.property(pageArbitrary, (page) => {
          const { document, window } = createMockDOM(page);
          const nav = createNavigationController(document, window);
          nav.init();

          const allLinks = document.querySelectorAll('.nav__link');
          
          allLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href !== page) {
              expect(link.hasAttribute('aria-current')).toBe(false);
            }
          });
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property 2.6: setActiveLink should handle various path formats consistently
     * **Validates: Requirements 2.5**
     */
    it('should handle various path formats and set correct active link', () => {
      const pathToExpectedPage = {
        'index.html': 'index.html',
        '/index.html': 'index.html',
        '/': 'index.html',
        '': 'index.html',
        'index': 'index.html',
        'timeline.html': 'timeline.html',
        '/timeline.html': 'timeline.html',
        'timeline': 'timeline.html',
        'mosaic.html': 'mosaic.html',
        'fpt-students.html': 'fpt-students.html',
        'about.html': 'about.html'
      };

      Object.entries(pathToExpectedPage).forEach(([path, expectedPage]) => {
        const { document, window } = createMockDOM('index.html');
        const nav = createNavigationController(document, window);
        nav.init();
        
        // Manually set active link with different path format
        nav.setActiveLink(path);
        
        const activeLink = document.querySelector('.nav__link--active');
        expect(activeLink).not.toBeNull();
        expect(activeLink.getAttribute('href')).toBe(expectedPage);
      });
    });
  });

  describe('Property 3: Navigation Menu Toggle', () => {
    /**
     * Property 3.1: Clicking hamburger icon SHALL toggle menu visibility
     * **Validates: Requirements 2.3**
     */
    it('should toggle menu visibility when hamburger is clicked', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 10 }), (clickCount) => {
          const { document, window } = createMockDOM('index.html');
          const nav = createNavigationController(document, window);
          nav.init();

          // Initial state: menu closed
          expect(nav.isMenuOpen()).toBe(false);
          expect(nav.mobileMenu.classList.contains('nav__menu--open')).toBe(false);

          // Perform clicks and verify toggle behavior
          for (let i = 0; i < clickCount; i++) {
            const wasOpen = nav.isMenuOpen();
            nav.toggleMobileMenu();
            
            // State should be toggled
            expect(nav.isMenuOpen()).toBe(!wasOpen);
            expect(nav.mobileMenu.classList.contains('nav__menu--open')).toBe(!wasOpen);
          }
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property 3.2: Menu state SHALL be consistent with aria-expanded attribute
     * **Validates: Requirements 2.3**
     */
    it('should keep aria-expanded consistent with menu state', () => {
      fc.assert(
        fc.property(menuActionSequenceArbitrary, (actions) => {
          const { document, window } = createMockDOM('index.html');
          const nav = createNavigationController(document, window);
          nav.init();

          actions.forEach(action => {
            switch (action) {
              case 'toggle':
                nav.toggleMobileMenu();
                break;
              case 'open':
                nav.openMobileMenu();
                break;
              case 'close':
                nav.closeMobileMenu();
                break;
            }

            // Verify consistency after each action
            const isOpen = nav.isMenuOpen();
            const ariaExpanded = nav.hamburgerBtn.getAttribute('aria-expanded');
            const hasOpenClass = nav.mobileMenu.classList.contains('nav__menu--open');

            expect(ariaExpanded).toBe(isOpen.toString());
            expect(hasOpenClass).toBe(isOpen);
          });
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property 3.3: Clicking outside expanded menu SHALL close the menu
     * **Validates: Requirements 2.4**
     */
    it('should close menu when clicking outside', () => {
      fc.assert(
        fc.property(fc.boolean(), (startOpen) => {
          const { document, window } = createMockDOM('index.html');
          const nav = createNavigationController(document, window);
          nav.init();

          // Set initial state
          if (startOpen) {
            nav.openMobileMenu();
          }

          // Simulate click outside
          const outsideElement = document.querySelector('main');
          const clickEvent = new window.MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
          });
          
          // If menu was open, clicking outside should close it
          if (startOpen) {
            outsideElement.dispatchEvent(clickEvent);
            expect(nav.isMenuOpen()).toBe(false);
            expect(nav.hamburgerBtn.getAttribute('aria-expanded')).toBe('false');
          }
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property 3.4: Clicking inside menu SHALL NOT close the menu
     * **Validates: Requirements 2.3, 2.4**
     */
    it('should not close menu when clicking inside menu', () => {
      const { document, window } = createMockDOM('index.html');
      const nav = createNavigationController(document, window);
      nav.init();

      // Open menu
      nav.openMobileMenu();
      expect(nav.isMenuOpen()).toBe(true);

      // Simulate click inside menu
      const menuElement = document.querySelector('.nav__menu');
      const clickEvent = new window.MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      
      menuElement.dispatchEvent(clickEvent);
      
      // Menu should still be open
      expect(nav.isMenuOpen()).toBe(true);
    });

    /**
     * Property 3.5: Clicking hamburger when menu is open SHALL close the menu
     * **Validates: Requirements 2.3**
     */
    it('should close menu when hamburger is clicked while menu is open', () => {
      const { document, window } = createMockDOM('index.html');
      const nav = createNavigationController(document, window);
      nav.init();

      // Open menu
      nav.openMobileMenu();
      expect(nav.isMenuOpen()).toBe(true);

      // Toggle (should close)
      nav.toggleMobileMenu();
      expect(nav.isMenuOpen()).toBe(false);
      expect(nav.hamburgerBtn.getAttribute('aria-expanded')).toBe('false');
    });

    /**
     * Property 3.6: Multiple toggle operations SHALL maintain consistency
     * **Validates: Requirements 2.3**
     */
    it('should maintain state consistency through multiple toggles', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 50 }), (toggleCount) => {
          const { document, window } = createMockDOM('index.html');
          const nav = createNavigationController(document, window);
          nav.init();

          for (let i = 0; i < toggleCount; i++) {
            nav.toggleMobileMenu();
          }

          // After even number of toggles, menu should be closed
          // After odd number of toggles, menu should be open
          const expectedState = toggleCount % 2 === 1;
          
          expect(nav.isMenuOpen()).toBe(expectedState);
          expect(nav.hamburgerBtn.getAttribute('aria-expanded')).toBe(expectedState.toString());
          expect(nav.mobileMenu.classList.contains('nav__menu--open')).toBe(expectedState);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property 3.7: closeMobileMenu SHALL always result in closed state
     * **Validates: Requirements 2.4**
     */
    it('should always close menu when closeMobileMenu is called', () => {
      fc.assert(
        fc.property(fc.boolean(), (startOpen) => {
          const { document, window } = createMockDOM('index.html');
          const nav = createNavigationController(document, window);
          nav.init();

          // Set initial state
          if (startOpen) {
            nav.openMobileMenu();
          }

          // Close menu
          nav.closeMobileMenu();

          // Should always be closed
          expect(nav.isMenuOpen()).toBe(false);
          expect(nav.hamburgerBtn.getAttribute('aria-expanded')).toBe('false');
          expect(nav.mobileMenu.classList.contains('nav__menu--open')).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property 3.8: openMobileMenu SHALL always result in open state
     * **Validates: Requirements 2.3**
     */
    it('should always open menu when openMobileMenu is called', () => {
      fc.assert(
        fc.property(fc.boolean(), (startOpen) => {
          const { document, window } = createMockDOM('index.html');
          const nav = createNavigationController(document, window);
          nav.init();

          // Set initial state
          if (startOpen) {
            nav.openMobileMenu();
          } else {
            nav.closeMobileMenu();
          }

          // Open menu
          nav.openMobileMenu();

          // Should always be open
          expect(nav.isMenuOpen()).toBe(true);
          expect(nav.hamburgerBtn.getAttribute('aria-expanded')).toBe('true');
          expect(nav.mobileMenu.classList.contains('nav__menu--open')).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property 3.9: Initial state SHALL be closed
     * **Validates: Requirements 2.3**
     */
    it('should start with menu closed', () => {
      fc.assert(
        fc.property(pageArbitrary, (page) => {
          const { document, window } = createMockDOM(page);
          const nav = createNavigationController(document, window);
          nav.init();

          expect(nav.isMenuOpen()).toBe(false);
          expect(nav.hamburgerBtn.getAttribute('aria-expanded')).toBe('false');
          expect(nav.mobileMenu.classList.contains('nav__menu--open')).toBe(false);
        }),
        { numRuns: 100 }
      );
    });
  });
});
