/**
 * scroll-effects.js - Scroll Animation Controller
 * Vietnam Religious Diversity Landing Page
 * 
 * Implements Intersection Observer for scroll-triggered animations
 * with fallback for browsers that don't support it.
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 9.1, 9.2, 9.5, 13.4
 */

/**
 * ScrollAnimationController
 * Manages scroll-triggered animations using Intersection Observer API
 */
const ScrollAnimationController = (function() {
  'use strict';

  // Private state
  let observer = null;
  let isInitialized = false;
  let supportsIntersectionObserver = false;

  // Default options for Intersection Observer
  const defaultOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  // Animation types mapping to CSS classes
  const animationTypes = {
    'fade-in': 'fade-in',
    'slide-up': 'slide-up',
    'slide-left': 'slide-left',
    'slide-right': 'slide-right',
    'scale-in': 'scale-in'
  };

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
   * Check if user prefers reduced motion
   * @returns {boolean}
   */
  function prefersReducedMotion() {
    return window.matchMedia && 
           window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Handle intersection entries
   * Supports stagger animation for grouped elements
   * @param {IntersectionObserverEntry[]} entries
   * Requirements: 8.1, 8.2, 8.3
   */
  function handleIntersection(entries) {
    // Group entries by their stagger-group for coordinated animations
    const staggerGroups = new Map();
    
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        const element = entry.target;
        const staggerGroup = element.dataset.staggerGroup;
        
        if (staggerGroup) {
          // Collect elements in the same stagger group
          if (!staggerGroups.has(staggerGroup)) {
            staggerGroups.set(staggerGroup, []);
          }
          staggerGroups.get(staggerGroup).push(element);
        } else {
          // No stagger group - animate immediately
          const animationType = element.dataset.animation || 'fade-in';
          applyAnimation(element, animationType);
          
          // Stop observing this element (animate only once)
          if (observer) {
            observer.unobserve(element);
          }
        }
      }
    });
    
    // Apply stagger animations to grouped elements
    staggerGroups.forEach(function(elements, groupName) {
      applyStaggerAnimation(elements);
    });
  }

  /**
   * Apply stagger animation to a group of elements
   * Each element gets an incremental delay of 100ms
   * @param {HTMLElement[]} elements - Array of elements to animate with stagger
   * Requirements: 8.2
   */
  function applyStaggerAnimation(elements) {
    if (!elements || elements.length === 0) return;
    
    // If user prefers reduced motion, animate all at once without delay
    if (prefersReducedMotion()) {
      elements.forEach(function(element) {
        element.classList.add('is-visible');
        element.style.opacity = '1';
        element.style.transform = 'none';
        if (observer) {
          observer.unobserve(element);
        }
      });
      return;
    }
    
    // Sort elements by their data-stagger-index if available, otherwise use DOM order
    const sortedElements = elements.slice().sort(function(a, b) {
      const indexA = parseInt(a.dataset.staggerIndex, 10) || 0;
      const indexB = parseInt(b.dataset.staggerIndex, 10) || 0;
      return indexA - indexB;
    });
    
    // Apply stagger delay to each element (100ms increment)
    sortedElements.forEach(function(element, index) {
      const baseDelay = parseInt(element.dataset.staggerDelay, 10) || 100;
      const delay = index * baseDelay;
      
      // Set animation delay
      element.style.animationDelay = delay + 'ms';
      element.style.transitionDelay = delay + 'ms';
      
      // Get animation type
      const animationType = element.dataset.animation || 'fade-in';
      
      // Apply animation after a small timeout to ensure delay is applied
      setTimeout(function() {
        applyAnimation(element, animationType);
      }, 10);
      
      // Stop observing this element
      if (observer) {
        observer.unobserve(element);
      }
    });
  }

  /**
   * Apply animation to an element
   * @param {HTMLElement} element - The element to animate
   * @param {string} animationType - Type of animation to apply
   */
  function applyAnimation(element, animationType) {
    // If user prefers reduced motion, just make visible without animation
    if (prefersReducedMotion()) {
      element.classList.add('is-visible');
      element.style.opacity = '1';
      element.style.transform = 'none';
      return;
    }

    // Add the animation type class if it's a valid type
    if (animationTypes[animationType]) {
      element.classList.add(animationTypes[animationType]);
    }

    // Add visible class to trigger the animation
    element.classList.add('is-visible');
  }

  /**
   * Apply fallback for browsers without Intersection Observer support
   * Makes all animated elements visible immediately
   */
  function applyFallback() {
    const elements = document.querySelectorAll('.animate-on-scroll');
    
    elements.forEach(function(element) {
      element.classList.add('is-visible');
      element.style.opacity = '1';
      element.style.transform = 'none';
    });

    console.warn('ScrollAnimationController: Intersection Observer not supported. Fallback applied.');
  }

  /**
   * Initialize the ScrollAnimationController
   */
  function init() {
    if (isInitialized) {
      console.warn('ScrollAnimationController: Already initialized');
      return;
    }

    supportsIntersectionObserver = checkSupport();

    if (!supportsIntersectionObserver) {
      applyFallback();
      isInitialized = true;
      return;
    }

    // Create Intersection Observer
    observer = new IntersectionObserver(handleIntersection, defaultOptions);

    // Observe all elements with animate-on-scroll class
    observeElements('.animate-on-scroll');

    isInitialized = true;
  }

  /**
   * Observe elements matching a selector
   * @param {string} selector - CSS selector for elements to observe
   * @param {Object} options - Optional Intersection Observer options
   */
  function observeElements(selector, options) {
    if (!supportsIntersectionObserver) {
      // If no support, apply fallback to these elements
      const elements = document.querySelectorAll(selector);
      elements.forEach(function(element) {
        element.classList.add('is-visible');
        element.style.opacity = '1';
        element.style.transform = 'none';
      });
      return;
    }

    // If custom options provided, create a new observer
    let targetObserver = observer;
    
    if (options) {
      const mergedOptions = Object.assign({}, defaultOptions, options);
      targetObserver = new IntersectionObserver(handleIntersection, mergedOptions);
    }

    // If observer doesn't exist yet, create with default options
    if (!targetObserver) {
      targetObserver = new IntersectionObserver(handleIntersection, defaultOptions);
      observer = targetObserver;
    }

    // Find and observe elements
    const elements = document.querySelectorAll(selector);
    
    elements.forEach(function(element) {
      // Only observe if not already visible
      if (!element.classList.contains('is-visible')) {
        targetObserver.observe(element);
      }
    });
  }

  /**
   * Manually trigger animation on an element
   * @param {HTMLElement} element - Element to animate
   * @param {string} animationType - Type of animation
   */
  function triggerAnimation(element, animationType) {
    if (!element) return;
    
    applyAnimation(element, animationType || element.dataset.animation || 'fade-in');
    
    // Stop observing if being observed
    if (observer) {
      observer.unobserve(element);
    }
  }

  /**
   * Reset an element's animation state
   * @param {HTMLElement} element - Element to reset
   */
  function resetAnimation(element) {
    if (!element) return;

    element.classList.remove('is-visible');
    
    // Remove all animation type classes
    Object.values(animationTypes).forEach(function(className) {
      element.classList.remove(className);
    });

    // Reset inline styles
    element.style.opacity = '';
    element.style.transform = '';

    // Re-observe the element if observer exists
    if (observer && supportsIntersectionObserver) {
      observer.observe(element);
    }
  }

  /**
   * Destroy the controller and clean up
   */
  function destroy() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    isInitialized = false;
  }

  /**
   * Check if controller is initialized
   * @returns {boolean}
   */
  function getIsInitialized() {
    return isInitialized;
  }

  /**
   * Check if Intersection Observer is supported
   * @returns {boolean}
   */
  function getSupportsIntersectionObserver() {
    return supportsIntersectionObserver;
  }

  // Public API
  return {
    init: init,
    observeElements: observeElements,
    handleIntersection: handleIntersection,
    applyAnimation: applyAnimation,
    applyStaggerAnimation: applyStaggerAnimation,
    triggerAnimation: triggerAnimation,
    resetAnimation: resetAnimation,
    destroy: destroy,
    isInitialized: getIsInitialized,
    supportsIntersectionObserver: getSupportsIntersectionObserver
  };
})();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  ScrollAnimationController.init();
});

/**
 * ParallaxController
 * Handles parallax scrolling effects for background elements
 * Uses debounced scroll listener for performance
 * 
 * Requirements: 8.4, 8.5, 13.4
 */
const ParallaxController = (function() {
  'use strict';

  // Private state
  let elements = [];
  let isInitialized = false;
  let isReducedMotion = false;
  let scrollHandler = null;
  let ticking = false;

  /**
   * Check if user prefers reduced motion
   * @returns {boolean}
   * Requirements: 8.5
   */
  function prefersReducedMotion() {
    return window.matchMedia && 
           window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Debounce function for scroll performance
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} - Debounced function
   * Requirements: 13.4
   */
  function debounce(func, wait) {
    let timeout;
    return function() {
      const context = this;
      const args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(function() {
        func.apply(context, args);
      }, wait);
    };
  }

  /**
   * Handle scroll event with requestAnimationFrame for smooth updates
   * Requirements: 8.4, 13.1
   */
  function handleScroll() {
    if (!ticking) {
      window.requestAnimationFrame(function() {
        updateParallax();
        ticking = false;
      });
      ticking = true;
    }
  }

  /**
   * Update parallax positions for all elements
   * Requirements: 8.4
   */
  function updateParallax() {
    if (isReducedMotion || elements.length === 0) return;

    const scrollY = window.scrollY || window.pageYOffset;
    const windowHeight = window.innerHeight;

    elements.forEach(function(item) {
      const element = item.element;
      const speed = item.speed;
      const direction = item.direction;
      
      // Get element's position relative to viewport
      const rect = element.getBoundingClientRect();
      const elementTop = rect.top + scrollY;
      const elementHeight = rect.height;
      
      // Calculate how far the element is from the center of the viewport
      const elementCenter = elementTop + elementHeight / 2;
      const viewportCenter = scrollY + windowHeight / 2;
      const distanceFromCenter = elementCenter - viewportCenter;
      
      // Calculate parallax offset based on scroll position and speed
      let yPos = distanceFromCenter * speed * -1;
      
      // Apply direction modifier
      if (direction === 'down') {
        yPos = -yPos;
      }
      
      // Apply transform using GPU-accelerated property
      element.style.transform = 'translate3d(0, ' + yPos + 'px, 0)';
    });
  }

  /**
   * Initialize the ParallaxController
   * @param {string} selector - CSS selector for parallax elements (default: '[data-parallax]')
   * Requirements: 8.4, 8.5, 13.4
   */
  function init(selector) {
    if (isInitialized) {
      console.warn('ParallaxController: Already initialized');
      return;
    }

    // Check for reduced motion preference
    isReducedMotion = prefersReducedMotion();
    
    if (isReducedMotion) {
      console.log('ParallaxController: Reduced motion preference detected. Parallax disabled.');
      isInitialized = true;
      return;
    }

    // Find all parallax elements
    const targetSelector = selector || '[data-parallax]';
    const parallaxElements = document.querySelectorAll(targetSelector);
    
    if (parallaxElements.length === 0) {
      console.log('ParallaxController: No parallax elements found.');
      isInitialized = true;
      return;
    }

    // Parse parallax elements and their settings
    parallaxElements.forEach(function(element) {
      const speed = parseFloat(element.dataset.parallax) || 0.5;
      const direction = element.dataset.parallaxDirection || 'up';
      
      // Clamp speed between -1 and 1 for reasonable effect
      const clampedSpeed = Math.max(-1, Math.min(1, speed));
      
      elements.push({
        element: element,
        speed: clampedSpeed,
        direction: direction
      });
      
      // Add will-change for GPU optimization (use sparingly)
      element.style.willChange = 'transform';
    });

    // Create debounced scroll handler
    // Using a small debounce (10ms) combined with requestAnimationFrame for smooth updates
    scrollHandler = debounce(handleScroll, 10);
    
    // Add scroll listener with passive option for better performance
    window.addEventListener('scroll', scrollHandler, { passive: true });
    
    // Listen for reduced motion preference changes
    if (window.matchMedia) {
      window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', function(e) {
        isReducedMotion = e.matches;
        if (isReducedMotion) {
          // Reset all transforms when reduced motion is enabled
          elements.forEach(function(item) {
            item.element.style.transform = '';
            item.element.style.willChange = '';
          });
        }
      });
    }

    // Initial parallax update
    updateParallax();

    isInitialized = true;
    console.log('ParallaxController: Initialized with ' + elements.length + ' elements');
  }

  /**
   * Add a new element to parallax tracking
   * @param {HTMLElement} element - Element to add
   * @param {number} speed - Parallax speed (0-1)
   * @param {string} direction - Direction ('up' or 'down')
   */
  function addElement(element, speed, direction) {
    if (!element || isReducedMotion) return;
    
    const clampedSpeed = Math.max(-1, Math.min(1, speed || 0.5));
    
    elements.push({
      element: element,
      speed: clampedSpeed,
      direction: direction || 'up'
    });
    
    element.style.willChange = 'transform';
  }

  /**
   * Remove an element from parallax tracking
   * @param {HTMLElement} element - Element to remove
   */
  function removeElement(element) {
    if (!element) return;
    
    elements = elements.filter(function(item) {
      if (item.element === element) {
        element.style.transform = '';
        element.style.willChange = '';
        return false;
      }
      return true;
    });
  }

  /**
   * Manually trigger parallax update
   */
  function update() {
    updateParallax();
  }

  /**
   * Destroy the ParallaxController and clean up
   */
  function destroy() {
    if (scrollHandler) {
      window.removeEventListener('scroll', scrollHandler);
      scrollHandler = null;
    }
    
    // Reset all element transforms
    elements.forEach(function(item) {
      item.element.style.transform = '';
      item.element.style.willChange = '';
    });
    
    elements = [];
    isInitialized = false;
    ticking = false;
  }

  /**
   * Check if ParallaxController is initialized
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
   * Get the number of tracked elements
   * @returns {number}
   */
  function getElementCount() {
    return elements.length;
  }

  // Public API
  return {
    init: init,
    addElement: addElement,
    removeElement: removeElement,
    update: update,
    destroy: destroy,
    isInitialized: getIsInitialized,
    isReducedMotion: getIsReducedMotion,
    elementCount: getElementCount
  };
})();

// Initialize ParallaxController when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  ParallaxController.init();
});

/**
 * CounterAnimator
 * Animates counter numbers when they enter the viewport
 * 
 * Requirements: 3.7
 */
const CounterAnimator = (function() {
  'use strict';

  // Private state
  let observer = null;
  let isInitialized = false;
  let animatedElements = new Set(); // Track elements that have been animated

  // Default configuration
  const defaultDuration = 2000; // 2 seconds
  const defaultLocale = 'vi-VN'; // Vietnamese locale for number formatting

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
   * Check if user prefers reduced motion
   * @returns {boolean}
   */
  function prefersReducedMotion() {
    return window.matchMedia && 
           window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Easing function: easeOutQuad
   * Provides smooth deceleration effect
   * @param {number} t - Progress value between 0 and 1
   * @returns {number} - Eased value between 0 and 1
   */
  function easeOutQuad(t) {
    return t * (2 - t);
  }

  /**
   * Format number with locale (adds thousand separators)
   * @param {number} value - Number to format
   * @param {string} locale - Locale string for formatting
   * @returns {string} - Formatted number string
   */
  function formatNumber(value, locale) {
    try {
      return Math.round(value).toLocaleString(locale || defaultLocale);
    } catch (e) {
      // Fallback if locale is not supported
      return Math.round(value).toLocaleString();
    }
  }

  /**
   * Animate a counter element from 0 to target value
   * @param {HTMLElement} element - The counter element to animate
   * @param {number} target - Target number to count to
   * @param {number} duration - Animation duration in milliseconds
   */
  function animateCounter(element, target, duration) {
    if (!element) return;

    const animDuration = duration || defaultDuration;
    const startTime = performance.now();
    const suffix = element.dataset.suffix || '';
    const prefix = element.dataset.prefix || '';
    const locale = element.dataset.locale || defaultLocale;

    // If user prefers reduced motion, show final value immediately
    if (prefersReducedMotion()) {
      element.textContent = prefix + formatNumber(target, locale) + suffix;
      element.setAttribute('aria-label', prefix + formatNumber(target, locale) + suffix);
      return;
    }

    /**
     * Animation frame callback
     * @param {number} currentTime - Current timestamp from requestAnimationFrame
     */
    function updateCounter(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / animDuration, 1);
      
      // Apply easing
      const easedProgress = easeOutQuad(progress);
      
      // Calculate current value
      const currentValue = easedProgress * target;
      
      // Update element text with formatted number
      element.textContent = prefix + formatNumber(currentValue, locale) + suffix;

      // Continue animation if not complete
      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        // Ensure final value is exact
        element.textContent = prefix + formatNumber(target, locale) + suffix;
        element.setAttribute('aria-label', prefix + formatNumber(target, locale) + suffix);
      }
    }

    // Start animation
    requestAnimationFrame(updateCounter);
  }

  /**
   * Handle intersection entries for counter elements
   * @param {IntersectionObserverEntry[]} entries
   */
  function handleIntersection(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        const element = entry.target;
        
        // Only animate once
        if (animatedElements.has(element)) {
          return;
        }

        // Mark as animated
        animatedElements.add(element);

        // Get target value from data attribute
        const target = parseFloat(element.dataset.target) || 0;
        const duration = parseInt(element.dataset.duration, 10) || defaultDuration;

        // Animate the counter
        animateCounter(element, target, duration);

        // Stop observing this element
        if (observer) {
          observer.unobserve(element);
        }
      }
    });
  }

  /**
   * Apply fallback for browsers without Intersection Observer support
   * Shows final values immediately
   * @param {string} selector - CSS selector for counter elements
   */
  function applyFallback(selector) {
    const elements = document.querySelectorAll(selector);
    
    elements.forEach(function(element) {
      const target = parseFloat(element.dataset.target) || 0;
      const suffix = element.dataset.suffix || '';
      const prefix = element.dataset.prefix || '';
      const locale = element.dataset.locale || defaultLocale;

      element.textContent = prefix + formatNumber(target, locale) + suffix;
      element.setAttribute('aria-label', prefix + formatNumber(target, locale) + suffix);
      animatedElements.add(element);
    });

    console.warn('CounterAnimator: Intersection Observer not supported. Fallback applied.');
  }

  /**
   * Initialize the CounterAnimator
   * @param {string} selector - CSS selector for counter elements (default: '.counter')
   */
  function init(selector) {
    const targetSelector = selector || '.counter';

    if (isInitialized) {
      // If already initialized, just observe new elements
      observeElements(targetSelector);
      return;
    }

    if (!checkSupport()) {
      applyFallback(targetSelector);
      isInitialized = true;
      return;
    }

    // Create Intersection Observer with options
    const observerOptions = {
      threshold: 0.2, // Trigger when 20% of element is visible
      rootMargin: '0px'
    };

    observer = new IntersectionObserver(handleIntersection, observerOptions);

    // Observe counter elements
    observeElements(targetSelector);

    isInitialized = true;
  }

  /**
   * Observe elements matching a selector
   * @param {string} selector - CSS selector for elements to observe
   */
  function observeElements(selector) {
    const elements = document.querySelectorAll(selector);

    if (!checkSupport()) {
      applyFallback(selector);
      return;
    }

    elements.forEach(function(element) {
      // Only observe if not already animated
      if (!animatedElements.has(element)) {
        // Initialize with 0 value
        const suffix = element.dataset.suffix || '';
        const prefix = element.dataset.prefix || '';
        element.textContent = prefix + '0' + suffix;
        
        if (observer) {
          observer.observe(element);
        }
      }
    });
  }

  /**
   * Manually trigger counter animation on an element
   * @param {HTMLElement} element - Element to animate
   * @param {number} target - Target value (optional, uses data-target if not provided)
   * @param {number} duration - Duration in ms (optional)
   */
  function triggerCounter(element, target, duration) {
    if (!element) return;

    const targetValue = target !== undefined ? target : (parseFloat(element.dataset.target) || 0);
    const animDuration = duration || parseInt(element.dataset.duration, 10) || defaultDuration;

    animateCounter(element, targetValue, animDuration);
    animatedElements.add(element);

    // Stop observing if being observed
    if (observer) {
      observer.unobserve(element);
    }
  }

  /**
   * Reset a counter element to allow re-animation
   * @param {HTMLElement} element - Element to reset
   */
  function resetCounter(element) {
    if (!element) return;

    // Remove from animated set
    animatedElements.delete(element);

    // Reset to 0
    const suffix = element.dataset.suffix || '';
    const prefix = element.dataset.prefix || '';
    element.textContent = prefix + '0' + suffix;

    // Re-observe the element if observer exists
    if (observer && checkSupport()) {
      observer.observe(element);
    }
  }

  /**
   * Destroy the CounterAnimator and clean up
   */
  function destroy() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    animatedElements.clear();
    isInitialized = false;
  }

  /**
   * Check if CounterAnimator is initialized
   * @returns {boolean}
   */
  function getIsInitialized() {
    return isInitialized;
  }

  // Public API
  return {
    init: init,
    animateCounter: animateCounter,
    easeOutQuad: easeOutQuad,
    observeElements: observeElements,
    triggerCounter: triggerCounter,
    resetCounter: resetCounter,
    destroy: destroy,
    isInitialized: getIsInitialized
  };
})();

// Initialize CounterAnimator when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  CounterAnimator.init('.counter');
});

// Export for module systems (if used)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ScrollAnimationController, ParallaxController, CounterAnimator };
}
