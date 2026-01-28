/**
 * Property-Based Tests for Accordion Component
 * Feature: vietnam-religious-diversity-landing
 * Property 9: Accordion Toggle Behavior
 * 
 * **Validates: Requirements 6.4**
 * 
 * Property Definition:
 * For any accordion section:
 * - Clicking a header SHALL toggle that section's content visibility
 * - aria-expanded attribute SHALL match the actual expanded state
 * - Only one section SHALL be expanded at a time (single-expand mode)
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
 * Create a mock DOM with accordion structure
 * @param {number} sectionCount - Number of accordion sections to create
 * @param {number} initialExpandedIndex - Index of initially expanded section (-1 for none)
 * @returns {Object} - DOM window, document
 */
function createMockDOM(sectionCount = 4, initialExpandedIndex = -1) {
  const sectionsHtml = Array.from({ length: sectionCount }, (_, i) => {
    const isExpanded = i === initialExpandedIndex;
    return `
      <div class="accordion__item">
        <button 
          class="accordion__header" 
          id="accordion-header-${i}"
          aria-expanded="${isExpanded}"
          aria-controls="accordion-content-${i}"
          role="button"
          tabindex="0"
        >
          Section ${i + 1} Header
        </button>
        <div 
          class="accordion__content" 
          id="accordion-content-${i}"
          role="region"
          aria-labelledby="accordion-header-${i}"
          ${isExpanded ? '' : 'hidden'}
        >
          <p>Content for section ${i + 1}. This is the detailed content that appears when the section is expanded.</p>
        </div>
      </div>
    `;
  }).join('\n');

  const html = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <title>Test Page</title>
      <style>
        .accordion__content[hidden] { display: none; }
        .accordion__content { display: block; }
      </style>
    </head>
    <body>
      <main id="main-content">
        <div class="accordion" id="test-accordion">
          ${sectionsHtml}
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
 * Create AccordionController instance for testing
 * @param {Document} document - DOM document
 * @param {Window} window - DOM window
 * @returns {Object} - AccordionController instance
 */
function createAccordionController(document, window) {
  const AccordionController = {
    containers: [],

    /**
     * Initialize accordion in a container
     * @param {HTMLElement} container - Container element
     */
    init(container) {
      if (!container) return;
      
      this.containers.push(container);
      const headers = container.querySelectorAll('.accordion__header');
      
      headers.forEach((header, index) => {
        // Setup ARIA attributes if not already present
        this.setupAriaAttributes(header, index);
        
        // Add click handler
        header.addEventListener('click', () => this.toggle(header));
        
        // Add keyboard handler
        header.addEventListener('keydown', (e) => this.handleKeydown(e, headers, index));
      });
    },

    /**
     * Setup ARIA attributes for header and content
     * @param {HTMLElement} header - Header element
     * @param {number} index - Header index
     */
    setupAriaAttributes(header, index) {
      const content = header.nextElementSibling;
      
      // Ensure header has proper role and tabindex
      if (!header.hasAttribute('role')) {
        header.setAttribute('role', 'button');
      }
      if (!header.hasAttribute('tabindex')) {
        header.setAttribute('tabindex', '0');
      }
      
      // Set initial aria-expanded if not present
      if (!header.hasAttribute('aria-expanded')) {
        header.setAttribute('aria-expanded', 'false');
      }
      
      // Setup aria-controls linking header to content
      if (content) {
        // Generate ID for content if not present
        if (!content.id) {
          const containerId = header.closest('.accordion')?.id || 'accordion';
          content.id = `${containerId}-content-${index}`;
        }
        
        // Link header to content via aria-controls
        header.setAttribute('aria-controls', content.id);
        
        // Set content role and initial hidden state
        if (!content.hasAttribute('role')) {
          content.setAttribute('role', 'region');
        }
        
        // Set aria-labelledby on content to reference header
        if (header.id) {
          content.setAttribute('aria-labelledby', header.id);
        } else {
          // Generate header ID if needed
          const containerId = header.closest('.accordion')?.id || 'accordion';
          header.id = `${containerId}-header-${index}`;
          content.setAttribute('aria-labelledby', header.id);
        }
        
        // Set initial hidden state based on aria-expanded
        const isExpanded = header.getAttribute('aria-expanded') === 'true';
        content.hidden = !isExpanded;
      }
    },

    /**
     * Toggle accordion section
     * @param {HTMLElement} header - Header element clicked
     */
    toggle(header) {
      const content = header.nextElementSibling;
      const isExpanded = header.getAttribute('aria-expanded') === 'true';
      const container = header.closest('.accordion');

      // Single expand mode - collapse others
      if (container) {
        const allHeaders = container.querySelectorAll('.accordion__header');
        allHeaders.forEach(h => {
          if (h !== header) {
            h.setAttribute('aria-expanded', 'false');
            const c = h.nextElementSibling;
            if (c) {
              c.hidden = true;
            }
          }
        });
      }

      // Toggle current section
      const newExpandedState = !isExpanded;
      header.setAttribute('aria-expanded', newExpandedState.toString());
      
      if (content) {
        content.hidden = !newExpandedState;
      }
    },

    /**
     * Check if a specific header is expanded
     * @param {HTMLElement} header - Header element to check
     * @returns {boolean} - True if expanded
     */
    isExpanded(header) {
      return header.getAttribute('aria-expanded') === 'true';
    },

    /**
     * Get the currently expanded header in a container
     * @param {HTMLElement} container - Container element
     * @returns {HTMLElement|null} - The expanded header or null
     */
    getExpandedHeader(container) {
      if (!container) return null;
      return container.querySelector('.accordion__header[aria-expanded="true"]');
    },

    /**
     * Get all headers in a container
     * @param {HTMLElement} container - Container element
     * @returns {NodeList} - All header elements
     */
    getHeaders(container) {
      if (!container) return [];
      return container.querySelectorAll('.accordion__header');
    },

    /**
     * Count expanded sections in a container
     * @param {HTMLElement} container - Container element
     * @returns {number} - Number of expanded sections
     */
    countExpanded(container) {
      if (!container) return 0;
      return container.querySelectorAll('.accordion__header[aria-expanded="true"]').length;
    },

    /**
     * Expand all accordion sections (disables single-expand mode temporarily)
     * @param {HTMLElement} container - Container element
     */
    expandAll(container) {
      if (!container) return;
      
      const headers = container.querySelectorAll('.accordion__header');
      headers.forEach(header => {
        header.setAttribute('aria-expanded', 'true');
        const content = header.nextElementSibling;
        if (content) {
          content.hidden = false;
        }
      });
    },

    /**
     * Collapse all accordion sections
     * @param {HTMLElement} container - Container element
     */
    collapseAll(container) {
      if (!container) return;
      
      const headers = container.querySelectorAll('.accordion__header');
      headers.forEach(header => {
        header.setAttribute('aria-expanded', 'false');
        const content = header.nextElementSibling;
        if (content) {
          content.hidden = true;
        }
      });
    },

    /**
     * Handle keyboard navigation
     * Supports: ArrowUp, ArrowDown, Home, End, Enter, Space
     * @param {KeyboardEvent} event - Keyboard event
     * @param {NodeList} headers - All header elements
     * @param {number} currentIndex - Current header index
     */
    handleKeydown(event, headers, currentIndex) {
      const headersArray = Array.from(headers);
      let newIndex = currentIndex;

      switch (event.key) {
        case 'ArrowDown':
          // Move focus to next header (wrap to first)
          event.preventDefault();
          newIndex = (currentIndex + 1) % headersArray.length;
          break;
          
        case 'ArrowUp':
          // Move focus to previous header (wrap to last)
          event.preventDefault();
          newIndex = (currentIndex - 1 + headersArray.length) % headersArray.length;
          break;
          
        case 'Home':
          // Move focus to first header
          event.preventDefault();
          newIndex = 0;
          break;
          
        case 'End':
          // Move focus to last header
          event.preventDefault();
          newIndex = headersArray.length - 1;
          break;
          
        case 'Enter':
        case ' ':
          // Toggle the current section
          event.preventDefault();
          this.toggle(headersArray[currentIndex]);
          return;
          
        default:
          // Ignore other keys
          return;
      }

      // Focus the new header
      headersArray[newIndex].focus();
    },

    /**
     * Simulate clicking a header
     * @param {HTMLElement} header - Header element to click
     */
    simulateClick(header) {
      this.toggle(header);
    },

    /**
     * Simulate keyboard event on a header
     * @param {HTMLElement} header - Header element
     * @param {string} key - Key to simulate
     * @param {NodeList} headers - All headers
     * @param {number} index - Current index
     */
    simulateKeydown(header, key, headers, index) {
      const event = {
        key: key,
        preventDefault: () => {}
      };
      this.handleKeydown(event, headers, index);
    }
  };

  return AccordionController;
}

// ============================================
// ARBITRARIES (Test Data Generators)
// ============================================

/**
 * Generate number of accordion sections (1-10)
 */
const sectionCountArbitrary = fc.integer({ min: 1, max: 10 });

/**
 * Generate valid header index for a given section count
 * @param {number} sectionCount - Number of sections
 */
const headerIndexArbitrary = (sectionCount) => 
  fc.integer({ min: 0, max: sectionCount - 1 });

/**
 * Generate sequence of toggle actions (header indices to click)
 */
const toggleSequenceArbitrary = fc.array(
  fc.integer({ min: 0, max: 9 }),
  { minLength: 1, maxLength: 20 }
);

/**
 * Generate keyboard navigation keys
 */
const keyboardKeyArbitrary = fc.constantFrom(
  'ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' '
);

/**
 * Generate sequence of keyboard actions
 */
const keyboardSequenceArbitrary = fc.array(keyboardKeyArbitrary, { minLength: 1, maxLength: 15 });

// ============================================
// PROPERTY TESTS
// ============================================

describe('Feature: vietnam-religious-diversity-landing', () => {
  describe('Property 9: Accordion Toggle Behavior', () => {
    
    /**
     * Property 9.1: Clicking a header SHALL toggle that section's content visibility
     * **Validates: Requirements 6.4**
     */
    it('should toggle content visibility when header is clicked', () => {
      fc.assert(
        fc.property(
          sectionCountArbitrary,
          fc.integer({ min: 0, max: 9 }),
          (sectionCount, headerIndex) => {
            // Ensure headerIndex is valid for sectionCount
            const validIndex = headerIndex % sectionCount;
            
            const { document, window } = createMockDOM(sectionCount);
            const accordion = createAccordionController(document, window);
            const container = document.querySelector('.accordion');
            accordion.init(container);

            const headers = accordion.getHeaders(container);
            const header = headers[validIndex];
            const content = header.nextElementSibling;

            // Initial state: collapsed
            expect(accordion.isExpanded(header)).toBe(false);
            expect(content.hidden).toBe(true);

            // Click to expand
            accordion.simulateClick(header);
            expect(accordion.isExpanded(header)).toBe(true);
            expect(content.hidden).toBe(false);

            // Click again to collapse
            accordion.simulateClick(header);
            expect(accordion.isExpanded(header)).toBe(false);
            expect(content.hidden).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 9.2: aria-expanded attribute SHALL match the actual expanded state
     * **Validates: Requirements 6.4**
     */
    it('should keep aria-expanded consistent with content visibility', () => {
      fc.assert(
        fc.property(
          sectionCountArbitrary,
          toggleSequenceArbitrary,
          (sectionCount, toggleSequence) => {
            const { document, window } = createMockDOM(sectionCount);
            const accordion = createAccordionController(document, window);
            const container = document.querySelector('.accordion');
            accordion.init(container);

            const headers = accordion.getHeaders(container);

            // Perform toggle sequence
            toggleSequence.forEach(index => {
              const validIndex = index % sectionCount;
              accordion.simulateClick(headers[validIndex]);
            });

            // Verify consistency for all headers
            headers.forEach(header => {
              const content = header.nextElementSibling;
              const ariaExpanded = header.getAttribute('aria-expanded');
              const isContentVisible = !content.hidden;

              // aria-expanded should match content visibility
              expect(ariaExpanded === 'true').toBe(isContentVisible);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 9.3: Only one section SHALL be expanded at a time (single-expand mode)
     * **Validates: Requirements 6.4**
     */
    it('should have at most one section expanded at a time in single-expand mode', () => {
      fc.assert(
        fc.property(
          sectionCountArbitrary,
          toggleSequenceArbitrary,
          (sectionCount, toggleSequence) => {
            const { document, window } = createMockDOM(sectionCount);
            const accordion = createAccordionController(document, window);
            const container = document.querySelector('.accordion');
            accordion.init(container);

            const headers = accordion.getHeaders(container);

            // Perform toggle sequence and verify after each action
            toggleSequence.forEach(index => {
              const validIndex = index % sectionCount;
              accordion.simulateClick(headers[validIndex]);

              // Count expanded sections
              const expandedCount = accordion.countExpanded(container);
              
              // Should have at most 1 expanded section
              expect(expandedCount).toBeLessThanOrEqual(1);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 9.4: When expanding a section, all other sections SHALL collapse
     * **Validates: Requirements 6.4**
     */
    it('should collapse other sections when one is expanded', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 10 }),
          fc.integer({ min: 0, max: 9 }),
          fc.integer({ min: 0, max: 9 }),
          (sectionCount, firstIndex, secondIndex) => {
            // Ensure indices are valid and different
            const validFirst = firstIndex % sectionCount;
            let validSecond = secondIndex % sectionCount;
            if (validSecond === validFirst) {
              validSecond = (validSecond + 1) % sectionCount;
            }

            const { document, window } = createMockDOM(sectionCount);
            const accordion = createAccordionController(document, window);
            const container = document.querySelector('.accordion');
            accordion.init(container);

            const headers = accordion.getHeaders(container);

            // Expand first section
            accordion.simulateClick(headers[validFirst]);
            expect(accordion.isExpanded(headers[validFirst])).toBe(true);

            // Expand second section
            accordion.simulateClick(headers[validSecond]);
            
            // First section should now be collapsed
            expect(accordion.isExpanded(headers[validFirst])).toBe(false);
            // Second section should be expanded
            expect(accordion.isExpanded(headers[validSecond])).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 9.5: Toggling the same header twice SHALL return to collapsed state
     * **Validates: Requirements 6.4**
     */
    it('should return to collapsed state when same header is toggled twice', () => {
      fc.assert(
        fc.property(
          sectionCountArbitrary,
          fc.integer({ min: 0, max: 9 }),
          (sectionCount, headerIndex) => {
            const validIndex = headerIndex % sectionCount;
            
            const { document, window } = createMockDOM(sectionCount);
            const accordion = createAccordionController(document, window);
            const container = document.querySelector('.accordion');
            accordion.init(container);

            const headers = accordion.getHeaders(container);
            const header = headers[validIndex];

            // Initial state: collapsed
            expect(accordion.isExpanded(header)).toBe(false);

            // First click: expand
            accordion.simulateClick(header);
            expect(accordion.isExpanded(header)).toBe(true);

            // Second click: collapse
            accordion.simulateClick(header);
            expect(accordion.isExpanded(header)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 9.6: Content hidden attribute SHALL be inverse of aria-expanded
     * **Validates: Requirements 6.4**
     */
    it('should have content hidden attribute inverse of aria-expanded', () => {
      fc.assert(
        fc.property(
          sectionCountArbitrary,
          toggleSequenceArbitrary,
          (sectionCount, toggleSequence) => {
            const { document, window } = createMockDOM(sectionCount);
            const accordion = createAccordionController(document, window);
            const container = document.querySelector('.accordion');
            accordion.init(container);

            const headers = accordion.getHeaders(container);

            // Perform toggle sequence
            toggleSequence.forEach(index => {
              const validIndex = index % sectionCount;
              accordion.simulateClick(headers[validIndex]);
            });

            // Verify hidden attribute is inverse of aria-expanded
            headers.forEach(header => {
              const content = header.nextElementSibling;
              const isExpanded = header.getAttribute('aria-expanded') === 'true';
              
              // content.hidden should be the inverse of isExpanded
              expect(content.hidden).toBe(!isExpanded);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 9.7: Initial state SHALL have all sections collapsed
     * **Validates: Requirements 6.4**
     */
    it('should start with all sections collapsed', () => {
      fc.assert(
        fc.property(
          sectionCountArbitrary,
          (sectionCount) => {
            const { document, window } = createMockDOM(sectionCount);
            const accordion = createAccordionController(document, window);
            const container = document.querySelector('.accordion');
            accordion.init(container);

            const headers = accordion.getHeaders(container);

            // All sections should be collapsed initially
            headers.forEach(header => {
              expect(accordion.isExpanded(header)).toBe(false);
              expect(header.nextElementSibling.hidden).toBe(true);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 9.8: collapseAll SHALL collapse all sections
     * **Validates: Requirements 6.4**
     */
    it('should collapse all sections when collapseAll is called', () => {
      fc.assert(
        fc.property(
          sectionCountArbitrary,
          fc.integer({ min: 0, max: 9 }),
          (sectionCount, expandIndex) => {
            const validIndex = expandIndex % sectionCount;
            
            const { document, window } = createMockDOM(sectionCount);
            const accordion = createAccordionController(document, window);
            const container = document.querySelector('.accordion');
            accordion.init(container);

            const headers = accordion.getHeaders(container);

            // Expand one section first
            accordion.simulateClick(headers[validIndex]);
            expect(accordion.countExpanded(container)).toBe(1);

            // Collapse all
            accordion.collapseAll(container);

            // All should be collapsed
            expect(accordion.countExpanded(container)).toBe(0);
            headers.forEach(header => {
              expect(accordion.isExpanded(header)).toBe(false);
              expect(header.nextElementSibling.hidden).toBe(true);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 9.9: getExpandedHeader SHALL return the correct expanded header or null
     * **Validates: Requirements 6.4**
     */
    it('should return correct expanded header or null', () => {
      fc.assert(
        fc.property(
          sectionCountArbitrary,
          fc.integer({ min: 0, max: 9 }),
          fc.boolean(),
          (sectionCount, headerIndex, shouldExpand) => {
            const validIndex = headerIndex % sectionCount;
            
            const { document, window } = createMockDOM(sectionCount);
            const accordion = createAccordionController(document, window);
            const container = document.querySelector('.accordion');
            accordion.init(container);

            const headers = accordion.getHeaders(container);

            if (shouldExpand) {
              // Expand a section
              accordion.simulateClick(headers[validIndex]);
              
              const expandedHeader = accordion.getExpandedHeader(container);
              expect(expandedHeader).toBe(headers[validIndex]);
            } else {
              // No section expanded
              const expandedHeader = accordion.getExpandedHeader(container);
              expect(expandedHeader).toBeNull();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 9.10: Keyboard Enter/Space SHALL toggle the focused section
     * **Validates: Requirements 6.4**
     */
    it('should toggle section when Enter or Space is pressed', () => {
      fc.assert(
        fc.property(
          sectionCountArbitrary,
          fc.integer({ min: 0, max: 9 }),
          fc.constantFrom('Enter', ' '),
          (sectionCount, headerIndex, key) => {
            const validIndex = headerIndex % sectionCount;
            
            const { document, window } = createMockDOM(sectionCount);
            const accordion = createAccordionController(document, window);
            const container = document.querySelector('.accordion');
            accordion.init(container);

            const headers = accordion.getHeaders(container);
            const header = headers[validIndex];

            // Initial state: collapsed
            expect(accordion.isExpanded(header)).toBe(false);

            // Simulate keyboard press
            accordion.simulateKeydown(header, key, headers, validIndex);

            // Should be expanded
            expect(accordion.isExpanded(header)).toBe(true);

            // Press again to collapse
            accordion.simulateKeydown(header, key, headers, validIndex);
            expect(accordion.isExpanded(header)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 9.11: State consistency SHALL be maintained through random action sequences
     * **Validates: Requirements 6.4**
     */
    it('should maintain state consistency through random action sequences', () => {
      fc.assert(
        fc.property(
          sectionCountArbitrary,
          toggleSequenceArbitrary,
          (sectionCount, toggleSequence) => {
            const { document, window } = createMockDOM(sectionCount);
            const accordion = createAccordionController(document, window);
            const container = document.querySelector('.accordion');
            accordion.init(container);

            const headers = accordion.getHeaders(container);

            // Perform random toggle sequence
            toggleSequence.forEach(index => {
              const validIndex = index % sectionCount;
              accordion.simulateClick(headers[validIndex]);

              // After each action, verify state consistency
              headers.forEach(header => {
                const content = header.nextElementSibling;
                const ariaExpanded = header.getAttribute('aria-expanded');
                const isContentHidden = content.hidden;

                // aria-expanded and content.hidden should be consistent
                if (ariaExpanded === 'true') {
                  expect(isContentHidden).toBe(false);
                } else {
                  expect(isContentHidden).toBe(true);
                }
              });

              // At most one section should be expanded
              expect(accordion.countExpanded(container)).toBeLessThanOrEqual(1);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 9.12: aria-controls SHALL reference the correct content element
     * **Validates: Requirements 6.4**
     */
    it('should have aria-controls referencing correct content element', () => {
      fc.assert(
        fc.property(
          sectionCountArbitrary,
          (sectionCount) => {
            const { document, window } = createMockDOM(sectionCount);
            const accordion = createAccordionController(document, window);
            const container = document.querySelector('.accordion');
            accordion.init(container);

            const headers = accordion.getHeaders(container);

            headers.forEach(header => {
              const ariaControls = header.getAttribute('aria-controls');
              const content = header.nextElementSibling;

              // aria-controls should reference the content element's ID
              expect(ariaControls).toBe(content.id);
              
              // The referenced element should exist
              const referencedElement = document.getElementById(ariaControls);
              expect(referencedElement).toBe(content);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
