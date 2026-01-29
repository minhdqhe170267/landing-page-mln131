/**
 * timeline.js - Timeline Page Controller
 * Vietnam Religious Diversity Landing Page
 * 
 * Contains: 
 * - ModalController for accessible modal dialogs
 * - TimelineController for timeline page functionality
 * - PremiumTimelineAnimator for premium scroll-triggered animations
 * 
 * Requirements: 4.5, 4.7, 9.2, 9.3, 9.5, 9.6, 11.7
 */

// ============================================
// MODAL CONTROLLER
// ============================================

/**
 * ModalController - Handles accessible modal dialog functionality
 * 
 * Features:
 * - Open modal with content (title, body, optional image)
 * - Focus trap within modal while open
 * - Close on Escape key press
 * - Close when clicking outside modal content
 * - Return focus to trigger element when closed
 * - Proper ARIA attributes for accessibility
 * 
 * Implements: Requirements 4.5, 4.7, 11.7
 */
const ModalController = (function () {
  'use strict';

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

  // Selector for focusable elements
  const FOCUSABLE_SELECTORS = [
    'button:not([disabled])',
    'a[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(', ');

  /**
   * Create modal DOM structure if it doesn't exist
   */
  function createModalStructure() {
    // Check if modal already exists
    modalElement = document.getElementById('modal');
    if (modalElement) {
      // Modal exists, get references to its parts
      modalOverlay = modalElement.querySelector('.modal__overlay');
      modalContent = modalElement.querySelector('.modal__content');
      modalTitle = modalElement.querySelector('.modal__title');
      modalBody = modalElement.querySelector('.modal__body');
      modalImage = modalElement.querySelector('.modal__image');
      closeButton = modalElement.querySelector('.modal__close');
      return;
    }

    // Create modal structure
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
      </div>
    `;

    document.body.appendChild(modalElement);

    // Get references
    modalOverlay = modalElement.querySelector('.modal__overlay');
    modalContent = modalElement.querySelector('.modal__content');
    modalTitle = modalElement.querySelector('.modal__title');
    modalBody = modalElement.querySelector('.modal__body');
    modalImage = modalElement.querySelector('.modal__image');
    closeButton = modalElement.querySelector('.modal__close');
  }

  /**
   * Initialize the ModalController
   */
  function init() {
    createModalStructure();

    // Bind event handlers
    boundHandleKeydown = handleKeydown.bind(this);
    boundHandleOverlayClick = handleOverlayClick.bind(this);

    // Setup close button click handler
    if (closeButton) {
      closeButton.addEventListener('click', close);
    }

    // Setup overlay click handler
    if (modalOverlay) {
      modalOverlay.addEventListener('click', boundHandleOverlayClick);
    }

    // Setup click handlers for any element with data-modal-close
    modalElement.querySelectorAll('[data-modal-close]').forEach(function (el) {
      if (el !== modalOverlay) {
        el.addEventListener('click', close);
      }
    });
  }

  /**
   * Open modal with content
   * @param {Object} content - Modal content object
   * @param {string} content.title - Modal title
   * @param {string} content.body - Modal body content (can be HTML)
   * @param {string} [content.image] - Optional image URL
   * @param {HTMLElement} [trigger] - Optional trigger element to return focus to
   */
  function open(content, trigger) {
    if (!modalElement) {
      init();
    }

    if (isOpen) {
      return;
    }

    // Store trigger element for focus return
    triggerElement = trigger || document.activeElement;

    // Set content
    if (modalTitle) {
      modalTitle.textContent = content.title || '';
    }

    if (modalBody) {
      // Support both plain text and HTML content
      if (content.body && content.body.includes('<')) {
        modalBody.innerHTML = content.body;
      } else {
        modalBody.textContent = content.body || '';
      }
    }

    // Handle image
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

    // Show modal
    modalElement.classList.add('modal--open');
    modalElement.setAttribute('aria-hidden', 'false');
    isOpen = true;

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    document.body.setAttribute('aria-hidden', 'true');

    // Setup focus trap
    trapFocus();

    // Add keyboard event listener
    document.addEventListener('keydown', boundHandleKeydown);

    // Focus first focusable element or close button
    requestAnimationFrame(function () {
      if (closeButton) {
        closeButton.focus();
      } else if (firstFocusable) {
        firstFocusable.focus();
      }
    });

    // Dispatch custom event
    modalElement.dispatchEvent(new CustomEvent('modal:open', {
      detail: { content: content }
    }));
  }

  /**
   * Close the modal
   */
  function close() {
    if (!modalElement || !isOpen) {
      return;
    }

    // Hide modal
    modalElement.classList.remove('modal--open');
    modalElement.setAttribute('aria-hidden', 'true');
    isOpen = false;

    // Restore body scroll
    document.body.style.overflow = '';
    document.body.removeAttribute('aria-hidden');

    // Remove keyboard event listener
    document.removeEventListener('keydown', boundHandleKeydown);

    // Return focus to trigger element
    returnFocus();

    // Clear focusable elements
    focusableElements = [];
    firstFocusable = null;
    lastFocusable = null;

    // Dispatch custom event
    modalElement.dispatchEvent(new CustomEvent('modal:close'));
  }

  /**
   * Setup focus trap within modal
   * Ensures Tab navigation stays within the modal
   */
  function trapFocus() {
    if (!modalContent) return;

    // Get all focusable elements within modal content
    focusableElements = Array.from(
      modalContent.querySelectorAll(FOCUSABLE_SELECTORS)
    ).filter(function (el) {
      // Filter out hidden elements
      return el.offsetParent !== null &&
        getComputedStyle(el).visibility !== 'hidden';
    });

    if (focusableElements.length === 0) {
      // If no focusable elements, make the modal content focusable
      modalContent.setAttribute('tabindex', '-1');
      focusableElements = [modalContent];
    }

    firstFocusable = focusableElements[0];
    lastFocusable = focusableElements[focusableElements.length - 1];
  }

  /**
   * Handle keydown events for modal
   * @param {KeyboardEvent} event - Keyboard event
   */
  function handleKeydown(event) {
    if (!isOpen) return;

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        close();
        break;

      case 'Tab':
        handleTabKey(event);
        break;
    }
  }

  /**
   * Handle Tab key for focus trapping
   * @param {KeyboardEvent} event - Keyboard event
   */
  function handleTabKey(event) {
    if (focusableElements.length === 0) {
      event.preventDefault();
      return;
    }

    // Refresh focusable elements in case DOM changed
    trapFocus();

    if (focusableElements.length === 1) {
      // Only one focusable element, keep focus there
      event.preventDefault();
      focusableElements[0].focus();
      return;
    }

    if (event.shiftKey) {
      // Shift + Tab: going backwards
      if (document.activeElement === firstFocusable) {
        event.preventDefault();
        lastFocusable.focus();
      }
    } else {
      // Tab: going forwards
      if (document.activeElement === lastFocusable) {
        event.preventDefault();
        firstFocusable.focus();
      }
    }
  }

  /**
   * Handle click on overlay (outside modal content)
   * @param {MouseEvent} event - Click event
   */
  function handleOverlayClick(event) {
    // Only close if clicking directly on overlay, not on content
    if (event.target === modalOverlay) {
      close();
    }
  }

  /**
   * Return focus to the trigger element
   */
  function returnFocus() {
    if (triggerElement && typeof triggerElement.focus === 'function') {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(function () {
        try {
          triggerElement.focus();
        } catch (e) {
          // Element may have been removed from DOM
          console.warn('ModalController: Could not return focus to trigger element');
        }
      });
    }
    triggerElement = null;
  }

  /**
   * Check if modal is currently open
   * @returns {boolean}
   */
  function getIsOpen() {
    return isOpen;
  }

  /**
   * Get the modal element
   * @returns {HTMLElement|null}
   */
  function getModalElement() {
    return modalElement;
  }

  /**
   * Get the trigger element
   * @returns {HTMLElement|null}
   */
  function getTriggerElement() {
    return triggerElement;
  }

  /**
   * Get focusable elements within modal
   * @returns {HTMLElement[]}
   */
  function getFocusableElements() {
    return focusableElements;
  }

  /**
   * Destroy the modal controller and clean up
   */
  function destroy() {
    if (isOpen) {
      close();
    }

    // Remove event listeners
    document.removeEventListener('keydown', boundHandleKeydown);

    if (closeButton) {
      closeButton.removeEventListener('click', close);
    }

    if (modalOverlay) {
      modalOverlay.removeEventListener('click', boundHandleOverlayClick);
    }

    // Remove modal from DOM
    if (modalElement && modalElement.parentNode) {
      modalElement.parentNode.removeChild(modalElement);
    }

    // Reset state
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

  // Public API
  return {
    init: init,
    open: open,
    close: close,
    trapFocus: trapFocus,
    handleKeydown: handleKeydown,
    returnFocus: returnFocus,
    isOpen: getIsOpen,
    getModalElement: getModalElement,
    getTriggerElement: getTriggerElement,
    getFocusableElements: getFocusableElements,
    destroy: destroy
  };
})();

// ============================================
// TIMELINE CONTROLLER
// ============================================

/**
 * TimelineController - Handles timeline page functionality
 * 
 * Features:
 * - Render timeline from data.json
 * - Open modal with period details on click
 * - Update progress indicator on scroll
 * - Scroll animations for timeline items
 * 
 * Implements: Requirements 4.3, 4.4, 4.6
 */
const TimelineController = (function () {
  'use strict';

  // Private state
  let timelineData = [];
  let progressBar = null;
  let progressContainer = null;
  let timelineSection = null;
  let isInitialized = false;
  let boundHandleScroll = null;

  /**
   * Initialize the TimelineController
   */
  function init() {
    if (isInitialized) {
      return;
    }

    // Initialize ModalController first
    ModalController.init();

    // Get DOM references
    progressContainer = document.querySelector('.timeline-progress');
    progressBar = document.querySelector('.timeline-progress__bar');
    timelineSection = document.querySelector('.timeline-section');

    // Bind scroll handler
    boundHandleScroll = handleScroll.bind(this);

    // Setup event listeners
    setupEventListeners();

    // Fetch and render timeline data
    fetchTimelineData();

    // Initialize progress indicator
    updateProgressIndicator();

    isInitialized = true;
  }

  /**
   * Setup event listeners for timeline interactions
   */
  function setupEventListeners() {
    // Scroll event for progress indicator
    window.addEventListener('scroll', boundHandleScroll, { passive: true });

    // Click event delegation for timeline buttons
    const timelineContainer = document.querySelector('.timeline');
    if (timelineContainer) {
      timelineContainer.addEventListener('click', handleTimelineClick);
    }

    // Keyboard event for timeline buttons (Enter/Space)
    if (timelineContainer) {
      timelineContainer.addEventListener('keydown', handleTimelineKeydown);
    }
  }

  /**
   * Fetch timeline data from data.json
   */
  function fetchTimelineData() {
    // Try to use DataFetcher if available (from main.js)
    if (typeof DataFetcher !== 'undefined' && DataFetcher.fetchData) {
      DataFetcher.fetchData('assets/data.json')
        .then(function (data) {
          if (data && data.timeline) {
            timelineData = data.timeline;
            // Timeline items are already in HTML, just store data for modal
          }
        })
        .catch(function (error) {
          console.warn('TimelineController: Could not fetch data, using fallback', error);
          loadFallbackData();
        });
    } else {
      // Fallback: fetch directly
      fetch('assets/data.json')
        .then(function (response) {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .then(function (data) {
          if (data && data.timeline) {
            timelineData = data.timeline;
          }
        })
        .catch(function (error) {
          console.warn('TimelineController: Could not fetch data, using fallback', error);
          loadFallbackData();
        });
    }
  }

  /**
   * Load fallback data when fetch fails
   */
  function loadFallbackData() {
    timelineData = [
      {
        id: 'period-1',
        years: '1945-1954',
        title: 'Thời kỳ kháng chiến chống Pháp',
        summary: 'Chính sách đoàn kết tôn giáo trong kháng chiến chống thực dân Pháp',
        details: 'Ngay sau Cách mạng Tháng Tám 1945, Chủ tịch Hồ Chí Minh đã khẳng định chính sách tự do tín ngưỡng, tôn giáo. Hiến pháp 1946 ghi nhận quyền tự do tín ngưỡng của công dân.'
      },
      {
        id: 'period-2',
        years: '1954-1975',
        title: 'Thời kỳ kháng chiến chống Mỹ',
        summary: 'Tiếp tục chính sách đoàn kết tôn giáo trong cuộc kháng chiến chống Mỹ cứu nước',
        details: 'Ở miền Bắc, chính sách tự do tín ngưỡng được thực hiện nhất quán. Nhiều chức sắc, tín đồ các tôn giáo tham gia kháng chiến.'
      },
      {
        id: 'period-3',
        years: '1975-1986',
        title: 'Thời kỳ thống nhất đất nước',
        summary: 'Xây dựng chính sách tôn giáo trong điều kiện đất nước thống nhất',
        details: 'Sau năm 1975, Đảng và Nhà nước tiếp tục khẳng định chính sách tự do tín ngưỡng, tôn giáo. Hiến pháp 1980 ghi nhận quyền tự do tín ngưỡng.'
      },
      {
        id: 'period-4',
        years: '1986-2000',
        title: 'Thời kỳ Đổi mới',
        summary: 'Đổi mới tư duy và chính sách về tôn giáo',
        details: 'Nghị quyết 24-NQ/TW năm 1990 của Bộ Chính trị đánh dấu bước đổi mới quan trọng trong nhận thức và chính sách tôn giáo.'
      },
      {
        id: 'period-5',
        years: '2000-2016',
        title: 'Hoàn thiện pháp luật tôn giáo',
        summary: 'Xây dựng và hoàn thiện hệ thống pháp luật về tín ngưỡng, tôn giáo',
        details: 'Pháp lệnh Tín ngưỡng, tôn giáo năm 2004 được ban hành, tạo cơ sở pháp lý quan trọng.'
      },
      {
        id: 'period-6',
        years: '2016-nay',
        title: 'Luật Tín ngưỡng, tôn giáo',
        summary: 'Ban hành Luật Tín ngưỡng, tôn giáo - bước tiến quan trọng trong lập pháp',
        details: 'Luật Tín ngưỡng, tôn giáo năm 2016 (có hiệu lực từ 01/01/2018) đánh dấu bước phát triển quan trọng trong lập pháp về tôn giáo.'
      }
    ];
  }

  /**
   * Render timeline items dynamically (optional - HTML already has items)
   * This function can be used to dynamically generate timeline items from data
   * @param {Array} data - Array of TimelinePeriod objects
   */
  function renderTimeline(data) {
    const timelineContainer = document.querySelector('.timeline');
    if (!timelineContainer || !data || data.length === 0) {
      return;
    }

    // Keep the central line
    const centralLine = timelineContainer.querySelector('.timeline__line');

    // Clear existing items except the line
    const existingItems = timelineContainer.querySelectorAll('.timeline__item');
    existingItems.forEach(function (item) {
      item.remove();
    });

    // Render each period
    data.forEach(function (period, index) {
      const isLeft = index % 2 === 0; // Odd items (0, 2, 4) on left, even (1, 3, 5) on right
      const positionClass = isLeft ? 'timeline__item--left' : 'timeline__item--right';

      const article = document.createElement('article');
      article.className = 'timeline__item ' + positionClass + ' animate-on-scroll';
      article.setAttribute('role', 'listitem');
      article.setAttribute('data-period', period.id);

      article.innerHTML =
        '<div class="timeline__dot" aria-hidden="true"></div>' +
        '<div class="timeline__content">' +
        '<span class="timeline__years">' + escapeHtml(period.years) + '</span>' +
        '<h3 class="timeline__title">' + escapeHtml(period.title) + '</h3>' +
        '<p class="timeline__summary">' + escapeHtml(period.summary) + '</p>' +
        '<button ' +
        'class="timeline__btn btn btn-primary btn-sm" ' +
        'type="button" ' +
        'aria-label="Xem chi tiết giai đoạn ' + escapeHtml(period.years) + '" ' +
        'data-period-id="' + escapeHtml(period.id) + '"' +
        '>' +
        'Xem chi tiết' +
        '</button>' +
        '</div>';

      timelineContainer.appendChild(article);
    });

    // Re-initialize scroll animations for new elements
    if (typeof ScrollAnimationController !== 'undefined' && ScrollAnimationController.observeElements) {
      ScrollAnimationController.observeElements('.timeline__item.animate-on-scroll');
    }
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Handle click events on timeline items
   * @param {MouseEvent} event - Click event
   */
  function handleTimelineClick(event) {
    const button = event.target.closest('.timeline__btn');
    if (!button) {
      return;
    }

    const periodId = button.getAttribute('data-period-id');
    if (periodId) {
      openModal(periodId, button);
    }
  }

  /**
   * Handle keyboard events on timeline items
   * @param {KeyboardEvent} event - Keyboard event
   */
  function handleTimelineKeydown(event) {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    const button = event.target.closest('.timeline__btn');
    if (!button) {
      return;
    }

    event.preventDefault();
    const periodId = button.getAttribute('data-period-id');
    if (periodId) {
      openModal(periodId, button);
    }
  }

  /**
   * Open modal with period data
   * @param {string} periodId - ID of the period to display
   * @param {HTMLElement} [triggerElement] - Element that triggered the modal
   */
  function openModal(periodId, triggerElement) {
    // Find period data
    const period = findPeriodById(periodId);

    if (!period) {
      console.warn('TimelineController: Period not found:', periodId);
      // Try to get data from DOM as fallback
      const periodElement = document.querySelector('[data-period="' + periodId + '"]');
      if (periodElement) {
        const title = periodElement.querySelector('.timeline__title');
        const summary = periodElement.querySelector('.timeline__summary');
        const years = periodElement.querySelector('.timeline__years');
        const image = periodElement.querySelector('.timeline__image');

        ModalController.open({
          title: (years ? years.textContent + ' - ' : '') + (title ? title.textContent : 'Chi tiết'),
          body: summary ? summary.textContent : 'Không có thông tin chi tiết.',
          image: image ? image.src : null
        }, triggerElement);
      }
      return;
    }

    // Build modal content
    let imageSrc = period.image;

    // Try to get updated image from DOM (prioritize this as it might be newer)
    const periodElement = document.querySelector('[data-period="' + periodId + '"]');
    if (periodElement) {
      const domImage = periodElement.querySelector('.timeline__image');
      if (domImage) {
        imageSrc = domImage.src;
      }
    }

    const modalContent = {
      title: period.years + ' - ' + period.title,
      body: buildModalBody(period),
      image: imageSrc || null
    };

    // Open modal using ModalController
    ModalController.open(modalContent, triggerElement);
  }

  /**
   * Build modal body HTML from period data
   * @param {Object} period - Period data object
   * @returns {string} HTML string for modal body
   */
  function buildModalBody(period) {
    let html = '';

    // Summary
    if (period.summary) {
      html += '<p class="modal__summary"><strong>' + escapeHtml(period.summary) + '</strong></p>';
    }

    // Details
    if (period.details) {
      // Allow HTML content in details (trusted source)
      html += '<div class="modal__details">' + period.details + '</div>';
    }

    return html;
  }

  /**
   * Find period by ID in timeline data
   * @param {string} periodId - Period ID to find
   * @returns {Object|null} Period object or null if not found
   */
  function findPeriodById(periodId) {
    if (!timelineData || timelineData.length === 0) {
      return null;
    }

    for (let i = 0; i < timelineData.length; i++) {
      if (timelineData[i].id === periodId) {
        return timelineData[i];
      }
    }

    return null;
  }

  /**
   * Close modal (delegates to ModalController)
   */
  function closeModal() {
    ModalController.close();
  }

  /**
   * Handle scroll event
   */
  function handleScroll() {
    updateProgressIndicator();
  }

  /**
   * Update progress indicator based on scroll position
   * Shows how far the user has scrolled through the timeline section
   */
  function updateProgressIndicator() {
    if (!progressBar || !progressContainer) {
      return;
    }

    // Calculate scroll progress
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const documentHeight = document.documentElement.scrollHeight - window.innerHeight;

    // Calculate progress percentage (0-100)
    let progress = 0;
    if (documentHeight > 0) {
      progress = Math.min(100, Math.max(0, (scrollTop / documentHeight) * 100));
    }

    // Update progress bar width
    progressBar.style.width = progress + '%';

    // Update ARIA attributes
    progressContainer.setAttribute('aria-valuenow', Math.round(progress));

    // Show/hide progress bar based on scroll position
    if (scrollTop > 100) {
      progressContainer.classList.add('timeline-progress--visible');
    } else {
      progressContainer.classList.remove('timeline-progress--visible');
    }
  }

  /**
   * Trap focus within modal (delegates to ModalController)
   * @param {HTMLElement} modal - Modal element
   */
  function trapFocus(modal) {
    if (ModalController.trapFocus) {
      ModalController.trapFocus();
    }
  }

  /**
   * Get timeline data
   * @returns {Array} Timeline data array
   */
  function getTimelineData() {
    return timelineData;
  }

  /**
   * Set timeline data (useful for testing)
   * @param {Array} data - Timeline data array
   */
  function setTimelineData(data) {
    timelineData = data || [];
  }

  /**
   * Check if controller is initialized
   * @returns {boolean}
   */
  function getIsInitialized() {
    return isInitialized;
  }

  /**
   * Destroy the controller and clean up
   */
  function destroy() {
    // Remove event listeners
    window.removeEventListener('scroll', boundHandleScroll);

    const timelineContainer = document.querySelector('.timeline');
    if (timelineContainer) {
      timelineContainer.removeEventListener('click', handleTimelineClick);
      timelineContainer.removeEventListener('keydown', handleTimelineKeydown);
    }

    // Reset state
    timelineData = [];
    progressBar = null;
    progressContainer = null;
    timelineSection = null;
    isInitialized = false;
    boundHandleScroll = null;
  }

  // Public API
  return {
    init: init,
    renderTimeline: renderTimeline,
    openModal: openModal,
    closeModal: closeModal,
    updateProgressIndicator: updateProgressIndicator,
    trapFocus: trapFocus,
    getTimelineData: getTimelineData,
    setTimelineData: setTimelineData,
    isInitialized: getIsInitialized,
    destroy: destroy
  };
})();

// ============================================
// PREMIUM TIMELINE ANIMATOR
// ============================================

/**
 * PremiumTimelineAnimator - Handles premium scroll-triggered animations for timeline
 * 
 * Features:
 * - Intersection Observer for scroll-triggered animations
 * - 3D transforms (rotateY) based on item position (left/right)
 * - Progressive reveal with stagger delays
 * - requestAnimationFrame for 60fps performance
 * - Respects prefers-reduced-motion preference
 * 
 * Implements: Requirements 9.2, 9.3, 9.5, 9.6
 */
const PremiumTimelineAnimator = (function () {
  'use strict';

  // Private state
  let observer = null;
  let isInitialized = false;
  let isReducedMotion = false;
  let animatedItems = new Set();
  let pendingAnimations = [];
  let rafId = null;

  // Configuration
  const config = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px',
    staggerDelay: 100, // ms between each item animation
    animationDuration: 600, // ms for animation
    maxRotateY: 10, // degrees for 3D rotation
    translateX: 50 // pixels for initial offset
  };

  /**
   * Check if user prefers reduced motion
   * @returns {boolean}
   * Requirement 9.6 (accessibility)
   */
  function checkReducedMotion() {
    return window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Check if Intersection Observer is supported
   * @returns {boolean}
   */
  function checkSupport() {
    return 'IntersectionObserver' in window &&
      'IntersectionObserverEntry' in window &&
      'intersectionRatio' in window.IntersectionObserverEntry.prototype;
  }

  /**
   * Initialize the PremiumTimelineAnimator
   * Requirement 9.2, 9.3
   */
  function init() {
    if (isInitialized) {
      return;
    }

    // Check for reduced motion preference
    isReducedMotion = checkReducedMotion();

    // Listen for reduced motion preference changes
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      mediaQuery.addEventListener('change', handleReducedMotionChange);
    }

    // If reduced motion is preferred, show all items immediately
    if (isReducedMotion) {
      showAllItemsImmediately();
      isInitialized = true;
      return;
    }

    // Check for Intersection Observer support
    if (!checkSupport()) {
      showAllItemsImmediately();
      isInitialized = true;
      return;
    }

    // Setup Intersection Observer
    setupObserver();

    // Observe premium timeline items
    observeItems();

    isInitialized = true;
  }

  /**
   * Setup Intersection Observer for scroll detection
   * Requirement 9.3 (progressive reveal on scroll)
   */
  function setupObserver() {
    observer = new IntersectionObserver(handleIntersection, {
      threshold: config.threshold,
      rootMargin: config.rootMargin
    });
  }

  /**
   * Handle intersection entries
   * Requirement 9.2, 9.3, 9.5
   * @param {IntersectionObserverEntry[]} entries
   */
  function handleIntersection(entries) {
    const visibleEntries = [];

    entries.forEach(function (entry) {
      if (entry.isIntersecting && !animatedItems.has(entry.target)) {
        visibleEntries.push(entry.target);
        animatedItems.add(entry.target);
        observer.unobserve(entry.target);
      }
    });

    // Queue animations with stagger
    if (visibleEntries.length > 0) {
      queueAnimations(visibleEntries);
    }
  }

  /**
   * Queue animations with stagger delay for 60fps performance
   * Requirement 9.6 (60fps animations)
   * @param {HTMLElement[]} items - Items to animate
   */
  function queueAnimations(items) {
    items.forEach(function (item, index) {
      const delay = index * config.staggerDelay;

      pendingAnimations.push({
        element: item,
        delay: delay,
        startTime: null
      });
    });

    // Start animation loop if not already running
    if (!rafId) {
      rafId = requestAnimationFrame(processAnimations);
    }
  }

  /**
   * Process pending animations using requestAnimationFrame
   * Requirement 9.6 (60fps performance)
   * @param {number} timestamp - Current timestamp from requestAnimationFrame
   */
  function processAnimations(timestamp) {
    if (pendingAnimations.length === 0) {
      rafId = null;
      return;
    }

    const completed = [];

    pendingAnimations.forEach(function (anim, index) {
      // Initialize start time
      if (anim.startTime === null) {
        anim.startTime = timestamp;
      }

      const elapsed = timestamp - anim.startTime;

      // Check if delay has passed
      if (elapsed >= anim.delay) {
        animateItem(anim.element);
        completed.push(index);
      }
    });

    // Remove completed animations (in reverse order to maintain indices)
    for (let i = completed.length - 1; i >= 0; i--) {
      pendingAnimations.splice(completed[i], 1);
    }

    // Continue animation loop if there are pending animations
    if (pendingAnimations.length > 0) {
      rafId = requestAnimationFrame(processAnimations);
    } else {
      rafId = null;
    }
  }

  /**
   * Animate a single timeline item
   * Requirement 9.2 (3D transforms), 9.5 (animate from side with scale)
   * @param {HTMLElement} item - Timeline item to animate
   */
  function animateItem(item) {
    if (!item) return;

    // Add visible class to trigger CSS animation
    item.classList.add('is-visible');

    // Dispatch custom event for external listeners
    item.dispatchEvent(new CustomEvent('timeline:itemVisible', {
      bubbles: true,
      detail: { element: item }
    }));
  }

  /**
   * Observe all premium timeline items
   * Requirement 9.3 (progressive reveal)
   */
  function observeItems() {
    const items = document.querySelectorAll('.timeline--premium .timeline__item');

    if (items.length === 0) {
      return;
    }

    items.forEach(function (item) {
      // Only observe items that haven't been animated yet
      if (!animatedItems.has(item) && !item.classList.contains('is-visible')) {
        // Ensure item has animate-on-scroll class for initial state
        if (!item.classList.contains('animate-on-scroll')) {
          item.classList.add('animate-on-scroll');
        }
        observer.observe(item);
      }
    });
  }

  /**
   * Show all items immediately (for reduced motion or fallback)
   */
  function showAllItemsImmediately() {
    const items = document.querySelectorAll('.timeline--premium .timeline__item');

    items.forEach(function (item) {
      item.classList.add('is-visible');
      item.classList.remove('animate-on-scroll');
      // Reset any transforms
      item.style.transform = 'none';
      item.style.opacity = '1';
      animatedItems.add(item);
    });
  }

  /**
   * Handle reduced motion preference change
   * @param {MediaQueryListEvent} event
   */
  function handleReducedMotionChange(event) {
    isReducedMotion = event.matches;

    if (isReducedMotion) {
      // Cancel any pending animations
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      pendingAnimations = [];

      // Show all items immediately
      showAllItemsImmediately();
    }
  }

  /**
   * Manually trigger animation for a specific item
   * @param {HTMLElement} item - Item to animate
   */
  function triggerAnimation(item) {
    if (!item || animatedItems.has(item)) return;

    if (isReducedMotion) {
      item.classList.add('is-visible');
      item.style.transform = 'none';
      item.style.opacity = '1';
    } else {
      animateItem(item);
    }

    animatedItems.add(item);

    if (observer) {
      observer.unobserve(item);
    }
  }

  /**
   * Reset animation state for an item
   * @param {HTMLElement} item - Item to reset
   */
  function resetItem(item) {
    if (!item) return;

    item.classList.remove('is-visible');
    item.classList.add('animate-on-scroll');
    item.style.transform = '';
    item.style.opacity = '';

    animatedItems.delete(item);

    // Re-observe if observer exists and not reduced motion
    if (observer && !isReducedMotion) {
      observer.observe(item);
    }
  }

  /**
   * Reset all timeline items
   */
  function resetAll() {
    const items = document.querySelectorAll('.timeline--premium .timeline__item');
    items.forEach(resetItem);
  }

  /**
   * Refresh observer (useful after DOM changes)
   */
  function refresh() {
    if (!isInitialized || isReducedMotion) return;

    observeItems();
  }

  /**
   * Get animation configuration
   * @returns {Object} Current configuration
   */
  function getConfig() {
    return Object.assign({}, config);
  }

  /**
   * Update animation configuration
   * @param {Object} newConfig - New configuration values
   */
  function setConfig(newConfig) {
    if (newConfig && typeof newConfig === 'object') {
      Object.assign(config, newConfig);
    }
  }

  /**
   * Check if animator is initialized
   * @returns {boolean}
   */
  function getIsInitialized() {
    return isInitialized;
  }

  /**
   * Check if reduced motion is enabled
   * @returns {boolean}
   */
  function getIsReducedMotion() {
    return isReducedMotion;
  }

  /**
   * Get count of animated items
   * @returns {number}
   */
  function getAnimatedCount() {
    return animatedItems.size;
  }

  /**
   * Destroy the animator and clean up
   */
  function destroy() {
    // Cancel any pending animations
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }

    // Disconnect observer
    if (observer) {
      observer.disconnect();
      observer = null;
    }

    // Remove reduced motion listener
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      mediaQuery.removeEventListener('change', handleReducedMotionChange);
    }

    // Clear state
    pendingAnimations = [];
    animatedItems.clear();
    isInitialized = false;
  }

  // Public API
  return {
    init: init,
    observeItems: observeItems,
    triggerAnimation: triggerAnimation,
    resetItem: resetItem,
    resetAll: resetAll,
    refresh: refresh,
    getConfig: getConfig,
    setConfig: setConfig,
    isInitialized: getIsInitialized,
    isReducedMotion: getIsReducedMotion,
    animatedCount: getAnimatedCount,
    destroy: destroy
  };
})();

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize timeline components when DOM is ready
 */
document.addEventListener('DOMContentLoaded', function () {
  // Check if we're on the timeline page
  const isTimelinePage = document.querySelector('.timeline-section') !== null;
  const isPremiumTimeline = document.querySelector('.timeline--premium') !== null;

  if (isTimelinePage) {
    // Initialize TimelineController (which also initializes ModalController)
    TimelineController.init();

    // Initialize PremiumTimelineAnimator if premium timeline exists
    if (isPremiumTimeline) {
      PremiumTimelineAnimator.init();
    }
  } else {
    // On other pages, just initialize ModalController if needed
    ModalController.init();
  }
});

// Export for module systems (if used)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ModalController, TimelineController, PremiumTimelineAnimator };
}

// Also export to window for browser use
if (typeof window !== 'undefined') {
  window.ModalController = ModalController;
  window.TimelineController = TimelineController;
  window.PremiumTimelineAnimator = PremiumTimelineAnimator;
}
