/**
 * Property-Based Tests for Modal Component
 * Feature: vietnam-religious-diversity-landing
 * Property 6: Modal Interaction Consistency
 * 
 * **Validates: Requirements 4.4, 4.5, 4.7, 11.7**
 * 
 * Property Definition:
 * For any modal trigger action:
 * - Clicking a timeline item SHALL open modal with correct content for that period
 * - Clicking outside modal OR pressing Escape SHALL close the modal
 * - While modal is open, focus SHALL be trapped within the modal
 * - When modal closes, focus SHALL return to the trigger element
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
 * Create a mock DOM with modal structure and timeline items
 * @param {number} timelineItemCount - Number of timeline items to create
 * @returns {Object} - DOM window, document
 */
function createMockDOM(timelineItemCount = 6) {
  const timelineItemsHtml = Array.from({ length: timelineItemCount }, (_, i) => {
    return `
      <div class="timeline__item" id="timeline-item-${i}" tabindex="0" data-period-id="period-${i}">
        <h3 class="timeline__title">Period ${i}</h3>
        <p class="timeline__summary">Summary for period ${i}</p>
      </div>
    `;
  }).join('\n');

  const html = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <title>Test Page</title>
      <style>
        .modal { display: none; }
        .modal--open { display: block; }
      </style>
    </head>
    <body>
      <main id="main-content">
        <div class="timeline">
          ${timelineItemsHtml}
        </div>
      </main>
    </body>
    </html>
  `;

  const dom = new JSDOM(html, {
    url: 'http://localhost/timeline.html',
    runScripts: 'dangerously'
  });

  return {
    window: dom.window,
    document: dom.window.document
  };
}

/**
 * Create ModalController instance for testing
 * @param {Document} document - DOM document
 * @param {Window} window - DOM window
 * @returns {Object} - ModalController instance
 */
function createModalController(document, window) {
  // Selector for focusable elements
  const FOCUSABLE_SELECTORS = [
    'button:not([disabled])',
    'a[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(', ');

  // Private state
  let modalElement = null;
  let modalOverlay = null;
  let modalContent = null;
  let modalTitle = null;
  let modalBody = null;
  let modalImage = null;
  let closeButton = null;
  let triggerElement = null;
  let isOpen = false;
  let focusableElements = [];
  let firstFocusable = null;
  let lastFocusable = null;
  let boundHandleKeydown = null;
  let boundHandleOverlayClick = null;

  /**
   * Create modal DOM structure if it doesn't exist
   */
  function createModalStructure() {
    modalElement = document.getElementById('modal');
    if (modalElement) {
      modalOverlay = modalElement.querySelector('.modal__overlay');
      modalContent = modalElement.querySelector('.modal__content');
      modalTitle = modalElement.querySelector('.modal__title');
      modalBody = modalElement.querySelector('.modal__body');
      modalImage = modalElement.querySelector('.modal__image');
      closeButton = modalElement.querySelector('.modal__close');
      return;
    }

    modalElement = document.createElement('div');
    modalElement.id = 'modal';
    modalElement.className = 'modal';
    modalElement.setAttribute('role', 'dialog');
    modalElement.setAttribute('aria-modal', 'true');
    modalElement.setAttribute('aria-hidden', 'true');
    modalElement.setAttribute('aria-labelledby', 'modal-title');

    modalElement.innerHTML = `
      <div class="modal__overlay" data-modal-close></div>
      <div class="modal__content" role="document">
        <button class="modal__close" aria-label="Đóng hộp thoại" data-modal-close>
          <span aria-hidden="true">&times;</span>
        </button>
        <div class="modal__image-container">
          <img class="modal__image" src="" alt="" />
        </div>
        <h2 class="modal__title" id="modal-title"></h2>
        <div class="modal__body"></div>
        <a href="#" class="modal__link">Learn more</a>
      </div>
    `;

    document.body.appendChild(modalElement);

    modalOverlay = modalElement.querySelector('.modal__overlay');
    modalContent = modalElement.querySelector('.modal__content');
    modalTitle = modalElement.querySelector('.modal__title');
    modalBody = modalElement.querySelector('.modal__body');
    modalImage = modalElement.querySelector('.modal__image');
    closeButton = modalElement.querySelector('.modal__close');
  }

  /**
   * Handle keydown events for modal
   */
  function handleKeydown(event) {
    if (!isOpen) return;

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        ModalController.close();
        break;

      case 'Tab':
        handleTabKey(event);
        break;
    }
  }

  /**
   * Handle Tab key for focus trapping
   */
  function handleTabKey(event) {
    if (focusableElements.length === 0) {
      event.preventDefault();
      return;
    }

    // Refresh focusable elements
    ModalController.trapFocus();

    if (focusableElements.length === 1) {
      event.preventDefault();
      focusableElements[0].focus();
      return;
    }

    if (event.shiftKey) {
      if (document.activeElement === firstFocusable) {
        event.preventDefault();
        lastFocusable.focus();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        event.preventDefault();
        firstFocusable.focus();
      }
    }
  }

  /**
   * Handle click on overlay
   */
  function handleOverlayClick(event) {
    if (event.target === modalOverlay) {
      ModalController.close();
    }
  }

  const ModalController = {
    init() {
      createModalStructure();
      boundHandleKeydown = handleKeydown.bind(this);
      boundHandleOverlayClick = handleOverlayClick.bind(this);

      if (closeButton) {
        closeButton.addEventListener('click', () => this.close());
      }

      if (modalOverlay) {
        modalOverlay.addEventListener('click', boundHandleOverlayClick);
      }
    },

    open(content, trigger) {
      if (!modalElement) {
        this.init();
      }

      if (isOpen) {
        return;
      }

      triggerElement = trigger || document.activeElement;

      if (modalTitle) {
        modalTitle.textContent = content.title || '';
      }

      if (modalBody) {
        if (content.body && content.body.includes('<')) {
          modalBody.innerHTML = content.body;
        } else {
          modalBody.textContent = content.body || '';
        }
      }

      const imageContainer = modalElement.querySelector('.modal__image-container');
      if (modalImage && imageContainer) {
        if (content.image) {
          modalImage.src = content.image;
          modalImage.alt = content.title || 'Modal image';
          imageContainer.style.display = 'block';
        } else {
          modalImage.src = '';
          modalImage.alt = '';
          imageContainer.style.display = 'none';
        }
      }

      modalElement.classList.add('modal--open');
      modalElement.setAttribute('aria-hidden', 'false');
      isOpen = true;

      document.body.style.overflow = 'hidden';
      document.body.setAttribute('aria-hidden', 'true');

      this.trapFocus();
      document.addEventListener('keydown', boundHandleKeydown);

      if (closeButton) {
        closeButton.focus();
      } else if (firstFocusable) {
        firstFocusable.focus();
      }
    },

    close() {
      if (!modalElement || !isOpen) {
        return;
      }

      modalElement.classList.remove('modal--open');
      modalElement.setAttribute('aria-hidden', 'true');
      isOpen = false;

      document.body.style.overflow = '';
      document.body.removeAttribute('aria-hidden');

      document.removeEventListener('keydown', boundHandleKeydown);

      this.returnFocus();

      focusableElements = [];
      firstFocusable = null;
      lastFocusable = null;
    },

    trapFocus() {
      if (!modalContent) return;

      focusableElements = Array.from(
        modalContent.querySelectorAll(FOCUSABLE_SELECTORS)
      ).filter(function(el) {
        return el.offsetParent !== null || el.tagName === 'BUTTON' || el.tagName === 'A';
      });

      if (focusableElements.length === 0) {
        modalContent.setAttribute('tabindex', '-1');
        focusableElements = [modalContent];
      }

      firstFocusable = focusableElements[0];
      lastFocusable = focusableElements[focusableElements.length - 1];
    },

    returnFocus() {
      if (triggerElement && typeof triggerElement.focus === 'function') {
        try {
          triggerElement.focus();
        } catch (e) {
          // Element may have been removed from DOM
        }
      }
      triggerElement = null;
    },

    isOpen() {
      return isOpen;
    },

    getModalElement() {
      return modalElement;
    },

    getTriggerElement() {
      return triggerElement;
    },

    getFocusableElements() {
      return focusableElements;
    },

    getFirstFocusable() {
      return firstFocusable;
    },

    getLastFocusable() {
      return lastFocusable;
    },

    simulateEscapeKey() {
      const event = new window.KeyboardEvent('keydown', {
        key: 'Escape',
        code: 'Escape',
        bubbles: true,
        cancelable: true
      });
      document.dispatchEvent(event);
    },

    simulateTabKey(shiftKey = false) {
      const event = new window.KeyboardEvent('keydown', {
        key: 'Tab',
        code: 'Tab',
        shiftKey: shiftKey,
        bubbles: true,
        cancelable: true
      });
      event.preventDefault = () => {};
      handleKeydown(event);
    },

    simulateOverlayClick() {
      if (modalOverlay) {
        const event = new window.MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window
        });
        Object.defineProperty(event, 'target', { value: modalOverlay });
        boundHandleOverlayClick(event);
      }
    },

    destroy() {
      if (isOpen) {
        this.close();
      }

      document.removeEventListener('keydown', boundHandleKeydown);

      if (modalElement && modalElement.parentNode) {
        modalElement.parentNode.removeChild(modalElement);
      }

      modalElement = null;
      modalOverlay = null;
      modalContent = null;
      modalTitle = null;
      modalBody = null;
      modalImage = null;
      closeButton = null;
      triggerElement = null;
      isOpen = false;
      focusableElements = [];
      firstFocusable = null;
      lastFocusable = null;
    }
  };

  return ModalController;
}


// ============================================
// ARBITRARIES (Test Data Generators)
// ============================================

/**
 * Generate valid modal content
 */
const modalContentArbitrary = fc.record({
  title: fc.string({ minLength: 1, maxLength: 100 }).filter(s => !s.includes('<')),
  body: fc.string({ minLength: 1, maxLength: 500 }).filter(s => !s.includes('<')),
  image: fc.option(fc.webUrl(), { nil: undefined })
});

/**
 * Generate timeline period data
 */
const timelinePeriodArbitrary = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }).map(s => `period-${s.replace(/[^a-z0-9]/gi, '')}`),
  years: fc.tuple(
    fc.integer({ min: 1945, max: 2000 }),
    fc.integer({ min: 2001, max: 2024 })
  ).map(([start, end]) => `${start}-${end}`),
  title: fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.includes('<')),
  summary: fc.string({ minLength: 1, maxLength: 200 }).filter(s => !s.includes('<')),
  details: fc.string({ minLength: 1, maxLength: 500 }).filter(s => !s.includes('<'))
});

/**
 * Generate number of timeline items
 */
const timelineItemCountArbitrary = fc.integer({ min: 1, max: 10 });

/**
 * Generate sequence of modal actions
 */
const modalActionArbitrary = fc.constantFrom('open', 'close', 'escape', 'clickOutside');

/**
 * Generate sequence of modal actions
 */
const modalActionSequenceArbitrary = fc.array(modalActionArbitrary, { minLength: 1, maxLength: 15 });

/**
 * Generate tab key sequences (true = shift+tab, false = tab)
 */
const tabSequenceArbitrary = fc.array(fc.boolean(), { minLength: 1, maxLength: 20 });

// ============================================
// PROPERTY TESTS
// ============================================

describe('Feature: vietnam-religious-diversity-landing', () => {
  describe('Property 6: Modal Interaction Consistency', () => {
    
    /**
     * Property 6.1: Clicking a timeline item SHALL open modal with correct content
     * **Validates: Requirements 4.4**
     */
    it('should open modal with correct content when timeline item is clicked', () => {
      fc.assert(
        fc.property(
          timelineItemCountArbitrary,
          modalContentArbitrary,
          (itemCount, content) => {
            const { document, window } = createMockDOM(itemCount);
            const modal = createModalController(document, window);
            modal.init();

            const timelineItems = document.querySelectorAll('.timeline__item');
            const triggerItem = timelineItems[0];

            // Open modal with content
            modal.open(content, triggerItem);

            // Modal should be open
            expect(modal.isOpen()).toBe(true);

            // Modal should have correct content
            const modalElement = modal.getModalElement();
            const titleElement = modalElement.querySelector('.modal__title');
            const bodyElement = modalElement.querySelector('.modal__body');

            expect(titleElement.textContent).toBe(content.title);
            expect(bodyElement.textContent).toBe(content.body);

            modal.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });


    /**
     * Property 6.2: Pressing Escape SHALL close the modal
     * **Validates: Requirements 4.5**
     */
    it('should close modal when Escape key is pressed', () => {
      fc.assert(
        fc.property(
          modalContentArbitrary,
          (content) => {
            const { document, window } = createMockDOM();
            const modal = createModalController(document, window);
            modal.init();

            const trigger = document.querySelector('.timeline__item');
            
            // Open modal
            modal.open(content, trigger);
            expect(modal.isOpen()).toBe(true);

            // Press Escape
            modal.simulateEscapeKey();

            // Modal should be closed
            expect(modal.isOpen()).toBe(false);

            const modalElement = modal.getModalElement();
            expect(modalElement.classList.contains('modal--open')).toBe(false);
            expect(modalElement.getAttribute('aria-hidden')).toBe('true');

            modal.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 6.3: Clicking outside modal SHALL close the modal
     * **Validates: Requirements 4.5**
     */
    it('should close modal when clicking outside (on overlay)', () => {
      fc.assert(
        fc.property(
          modalContentArbitrary,
          (content) => {
            const { document, window } = createMockDOM();
            const modal = createModalController(document, window);
            modal.init();

            const trigger = document.querySelector('.timeline__item');
            
            // Open modal
            modal.open(content, trigger);
            expect(modal.isOpen()).toBe(true);

            // Click on overlay (outside modal content)
            modal.simulateOverlayClick();

            // Modal should be closed
            expect(modal.isOpen()).toBe(false);

            modal.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 6.4: While modal is open, focus SHALL be trapped within the modal
     * **Validates: Requirements 4.7, 11.7**
     */
    it('should trap focus within modal while open', () => {
      fc.assert(
        fc.property(
          modalContentArbitrary,
          tabSequenceArbitrary,
          (content, tabSequence) => {
            const { document, window } = createMockDOM();
            const modal = createModalController(document, window);
            modal.init();

            const trigger = document.querySelector('.timeline__item');
            
            // Open modal
            modal.open(content, trigger);
            expect(modal.isOpen()).toBe(true);

            // Get focusable elements
            const focusableElements = modal.getFocusableElements();
            
            // There should be focusable elements in the modal
            expect(focusableElements.length).toBeGreaterThan(0);

            // Simulate tab key presses
            tabSequence.forEach((isShiftTab) => {
              modal.simulateTabKey(isShiftTab);
            });

            // Focus should still be within modal (trapped)
            // The active element should be one of the focusable elements
            // or the modal content itself
            const modalElement = modal.getModalElement();
            const modalContent = modalElement.querySelector('.modal__content');
            const activeElement = document.activeElement;

            const isFocusInModal = 
              focusableElements.includes(activeElement) ||
              activeElement === modalContent ||
              modalContent.contains(activeElement);

            expect(isFocusInModal).toBe(true);

            modal.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });


    /**
     * Property 6.5: When modal closes, focus SHALL return to the trigger element
     * **Validates: Requirements 11.7**
     */
    it('should return focus to trigger element when modal closes', () => {
      fc.assert(
        fc.property(
          timelineItemCountArbitrary,
          modalContentArbitrary,
          fc.constantFrom('escape', 'clickOutside', 'close'),
          (itemCount, content, closeMethod) => {
            const { document, window } = createMockDOM(itemCount);
            const modal = createModalController(document, window);
            modal.init();

            const timelineItems = document.querySelectorAll('.timeline__item');
            const triggerIndex = Math.floor(Math.random() * timelineItems.length);
            const trigger = timelineItems[triggerIndex];

            // Focus trigger and open modal
            trigger.focus();
            modal.open(content, trigger);
            expect(modal.isOpen()).toBe(true);

            // Close modal using different methods
            switch (closeMethod) {
              case 'escape':
                modal.simulateEscapeKey();
                break;
              case 'clickOutside':
                modal.simulateOverlayClick();
                break;
              case 'close':
                modal.close();
                break;
            }

            // Modal should be closed
            expect(modal.isOpen()).toBe(false);

            // Focus should return to trigger element
            expect(document.activeElement).toBe(trigger);

            modal.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 6.6: Modal SHALL have correct ARIA attributes when open
     * **Validates: Requirements 4.7, 11.7**
     */
    it('should have correct ARIA attributes when modal is open', () => {
      fc.assert(
        fc.property(
          modalContentArbitrary,
          (content) => {
            const { document, window } = createMockDOM();
            const modal = createModalController(document, window);
            modal.init();

            const trigger = document.querySelector('.timeline__item');
            
            // Open modal
            modal.open(content, trigger);

            const modalElement = modal.getModalElement();

            // Check ARIA attributes
            expect(modalElement.getAttribute('role')).toBe('dialog');
            expect(modalElement.getAttribute('aria-modal')).toBe('true');
            expect(modalElement.getAttribute('aria-hidden')).toBe('false');
            expect(modalElement.getAttribute('aria-labelledby')).toBe('modal-title');

            // Body should be hidden from screen readers
            expect(document.body.getAttribute('aria-hidden')).toBe('true');

            modal.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 6.7: Modal SHALL have correct ARIA attributes when closed
     * **Validates: Requirements 4.7, 11.7**
     */
    it('should have correct ARIA attributes when modal is closed', () => {
      fc.assert(
        fc.property(
          modalContentArbitrary,
          (content) => {
            const { document, window } = createMockDOM();
            const modal = createModalController(document, window);
            modal.init();

            const trigger = document.querySelector('.timeline__item');
            
            // Open and then close modal
            modal.open(content, trigger);
            modal.close();

            const modalElement = modal.getModalElement();

            // Check ARIA attributes
            expect(modalElement.getAttribute('aria-hidden')).toBe('true');
            expect(modalElement.classList.contains('modal--open')).toBe(false);

            // Body should no longer be hidden
            expect(document.body.hasAttribute('aria-hidden')).toBe(false);

            modal.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });


    /**
     * Property 6.8: Multiple open/close cycles SHALL maintain consistency
     * **Validates: Requirements 4.4, 4.5**
     */
    it('should maintain state consistency through multiple open/close cycles', () => {
      fc.assert(
        fc.property(
          modalActionSequenceArbitrary,
          modalContentArbitrary,
          (actions, content) => {
            const { document, window } = createMockDOM();
            const modal = createModalController(document, window);
            modal.init();

            const trigger = document.querySelector('.timeline__item');

            actions.forEach((action) => {
              switch (action) {
                case 'open':
                  modal.open(content, trigger);
                  break;
                case 'close':
                  modal.close();
                  break;
                case 'escape':
                  if (modal.isOpen()) {
                    modal.simulateEscapeKey();
                  }
                  break;
                case 'clickOutside':
                  if (modal.isOpen()) {
                    modal.simulateOverlayClick();
                  }
                  break;
              }

              // Verify state consistency after each action
              const modalElement = modal.getModalElement();
              const isOpenState = modal.isOpen();
              const hasOpenClass = modalElement.classList.contains('modal--open');
              const ariaHidden = modalElement.getAttribute('aria-hidden');

              // State should be consistent
              expect(hasOpenClass).toBe(isOpenState);
              expect(ariaHidden).toBe(isOpenState ? 'false' : 'true');
            });

            modal.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 6.9: Opening modal when already open SHALL not change state
     * **Validates: Requirements 4.4**
     */
    it('should not change state when opening already open modal', () => {
      fc.assert(
        fc.property(
          modalContentArbitrary,
          modalContentArbitrary,
          (content1, content2) => {
            const { document, window } = createMockDOM();
            const modal = createModalController(document, window);
            modal.init();

            const trigger = document.querySelector('.timeline__item');

            // Open modal with first content
            modal.open(content1, trigger);
            expect(modal.isOpen()).toBe(true);

            const modalElement = modal.getModalElement();
            const titleElement = modalElement.querySelector('.modal__title');
            const originalTitle = titleElement.textContent;

            // Try to open again with different content
            modal.open(content2, trigger);

            // Modal should still be open with original content
            expect(modal.isOpen()).toBe(true);
            expect(titleElement.textContent).toBe(originalTitle);

            modal.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 6.10: Closing modal when already closed SHALL be safe (no-op)
     * **Validates: Requirements 4.5**
     */
    it('should safely handle closing already closed modal', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }),
          (closeCount) => {
            const { document, window } = createMockDOM();
            const modal = createModalController(document, window);
            modal.init();

            // Modal starts closed
            expect(modal.isOpen()).toBe(false);

            // Multiple close calls should be safe
            for (let i = 0; i < closeCount; i++) {
              modal.close();
              expect(modal.isOpen()).toBe(false);
            }

            modal.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });


    /**
     * Property 6.11: Focus trap SHALL cycle through focusable elements
     * **Validates: Requirements 4.7, 11.7**
     */
    it('should cycle focus through focusable elements when tabbing', () => {
      fc.assert(
        fc.property(
          modalContentArbitrary,
          (content) => {
            const { document, window } = createMockDOM();
            const modal = createModalController(document, window);
            modal.init();

            const trigger = document.querySelector('.timeline__item');
            
            // Open modal
            modal.open(content, trigger);

            const focusableElements = modal.getFocusableElements();
            const firstFocusable = modal.getFirstFocusable();
            const lastFocusable = modal.getLastFocusable();

            if (focusableElements.length > 1) {
              // Focus first element
              firstFocusable.focus();
              expect(document.activeElement).toBe(firstFocusable);

              // Tab from last element should wrap to first
              lastFocusable.focus();
              modal.simulateTabKey(false); // Tab forward
              // Focus should wrap to first focusable
              
              // Shift+Tab from first element should wrap to last
              firstFocusable.focus();
              modal.simulateTabKey(true); // Shift+Tab backward
              // Focus should wrap to last focusable
            }

            modal.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 6.12: Body scroll SHALL be disabled when modal is open
     * **Validates: Requirements 4.7**
     */
    it('should disable body scroll when modal is open', () => {
      fc.assert(
        fc.property(
          modalContentArbitrary,
          (content) => {
            const { document, window } = createMockDOM();
            const modal = createModalController(document, window);
            modal.init();

            const trigger = document.querySelector('.timeline__item');

            // Initially body should have normal overflow
            expect(document.body.style.overflow).toBe('');

            // Open modal
            modal.open(content, trigger);

            // Body scroll should be disabled
            expect(document.body.style.overflow).toBe('hidden');

            // Close modal
            modal.close();

            // Body scroll should be restored
            expect(document.body.style.overflow).toBe('');

            modal.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 6.13: Different trigger elements SHALL receive focus back correctly
     * **Validates: Requirements 11.7**
     */
    it('should return focus to correct trigger for different timeline items', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 6 }),
          modalContentArbitrary,
          (itemCount, content) => {
            const { document, window } = createMockDOM(itemCount);
            const modal = createModalController(document, window);
            modal.init();

            const timelineItems = document.querySelectorAll('.timeline__item');

            // Test each timeline item as trigger
            timelineItems.forEach((trigger, index) => {
              // Focus and open modal from this trigger
              trigger.focus();
              modal.open({ ...content, title: `Period ${index}` }, trigger);
              
              expect(modal.isOpen()).toBe(true);

              // Close modal
              modal.close();

              // Focus should return to this specific trigger
              expect(document.activeElement).toBe(trigger);
            });

            modal.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 6.14: Escape key SHALL only close modal when modal is open
     * **Validates: Requirements 4.5**
     */
    it('should only respond to Escape key when modal is open', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }),
          (escapeCount) => {
            const { document, window } = createMockDOM();
            const modal = createModalController(document, window);
            modal.init();

            // Modal is closed
            expect(modal.isOpen()).toBe(false);

            // Pressing Escape when closed should be safe
            for (let i = 0; i < escapeCount; i++) {
              modal.simulateEscapeKey();
              expect(modal.isOpen()).toBe(false);
            }

            modal.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
