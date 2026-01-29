/**
 * Main JavaScript Module
 * Vietnam Religious Diversity Landing Page
 * 
 * Contains: Data Fetcher, Navigation Controller, Accordion, Carousel utilities
 */

// ============================================
// DATA FETCHER
// ============================================

/**
 * DataFetcher - Handles fetching and validating data from data.json
 * Implements: Requirements 13.2, 13.3, 13.4
 */
const DataFetcher = {
  /**
   * Fetch data from the specified URL
   * @param {string} url - URL to fetch data from
   * @returns {Promise<Object>} - Parsed JSON data
   */
  async fetchData(url) {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Validate the data structure
      if (!this.validateData(data)) {
        throw new Error('Data validation failed: Invalid data structure');
      }
      
      return data;
    } catch (error) {
      this.handleError(error);
      return this.getFallbackData();
    }
  },

  /**
   * Handle fetch errors gracefully
   * @param {Error} error - The error that occurred
   */
  handleError(error) {
    console.error('DataFetcher Error:', error.message);
    // Could also dispatch a custom event for error tracking
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dataFetchError', { 
        detail: { error: error.message } 
      }));
    }
  },

  /**
   * Validate the data structure against expected schema
   * @param {Object} data - Data to validate
   * @returns {boolean} - True if valid, false otherwise
   */
  validateData(data) {
    // Check if data is an object
    if (!data || typeof data !== 'object') {
      return false;
    }

    // Required top-level properties
    const requiredProps = ['site', 'stats', 'timeline', 'religions', 'principles', 'guidelines', 'testimonials', 'references'];
    
    for (const prop of requiredProps) {
      if (!(prop in data)) {
        console.warn(`Missing required property: ${prop}`);
        return false;
      }
    }

    // Validate site object
    if (!data.site || typeof data.site.title !== 'string' || typeof data.site.description !== 'string') {
      console.warn('Invalid site structure');
      return false;
    }

    // Validate arrays
    const arrayProps = ['stats', 'timeline', 'religions', 'principles', 'guidelines', 'testimonials', 'references'];
    for (const prop of arrayProps) {
      if (!Array.isArray(data[prop])) {
        console.warn(`${prop} should be an array`);
        return false;
      }
    }

    // Validate timeline items structure
    if (data.timeline.length > 0) {
      for (const item of data.timeline) {
        if (!this.validateTimelineItem(item)) {
          return false;
        }
      }
    }

    // Validate religion items structure
    if (data.religions.length > 0) {
      for (const item of data.religions) {
        if (!this.validateReligionItem(item)) {
          return false;
        }
      }
    }

    // Validate stats items structure
    if (data.stats.length > 0) {
      for (const item of data.stats) {
        if (!this.validateStatItem(item)) {
          return false;
        }
      }
    }

    return true;
  },

  /**
   * Validate a timeline item
   * @param {Object} item - Timeline item to validate
   * @returns {boolean} - True if valid
   */
  validateTimelineItem(item) {
    const required = ['id', 'years', 'title', 'summary', 'details'];
    for (const prop of required) {
      if (typeof item[prop] !== 'string') {
        console.warn(`Timeline item missing or invalid ${prop}`);
        return false;
      }
    }
    return true;
  },

  /**
   * Validate a religion item
   * @param {Object} item - Religion item to validate
   * @returns {boolean} - True if valid
   */
  validateReligionItem(item) {
    const required = ['id', 'name', 'color', 'followers', 'description'];
    for (const prop of required) {
      if (typeof item[prop] !== 'string') {
        console.warn(`Religion item missing or invalid ${prop}`);
        return false;
      }
    }
    // Validate color format (hex color)
    if (!/^#[0-9A-Fa-f]{6}$/.test(item.color)) {
      console.warn(`Invalid color format for religion: ${item.id}`);
      return false;
    }
    return true;
  },

  /**
   * Validate a stat item
   * @param {Object} item - Stat item to validate
   * @returns {boolean} - True if valid
   */
  validateStatItem(item) {
    if (typeof item.id !== 'string' || typeof item.label !== 'string') {
      console.warn('Stat item missing id or label');
      return false;
    }
    if (typeof item.value !== 'number') {
      console.warn('Stat item value must be a number');
      return false;
    }
    return true;
  },

  /**
   * Get fallback data when fetch fails
   * @returns {Object} - Fallback data structure
   */
  getFallbackData() {
    return {
      site: {
        title: "Đa Dạng Tôn Giáo Việt Nam",
        description: "Landing page về đa dạng tôn giáo và chính sách tôn giáo Việt Nam"
      },
      stats: [
        { id: "stat-religions", value: 16, label: "Tôn giáo được công nhận", suffix: "" },
        { id: "stat-followers", value: 27, label: "Triệu tín đồ", suffix: "+" },
        { id: "stat-facilities", value: 29000, label: "Cơ sở thờ tự", suffix: "+" },
        { id: "stat-organizations", value: 43, label: "Tổ chức tôn giáo", suffix: "" }
      ],
      timeline: [
        {
          id: "period-1",
          years: "1945-1954",
          title: "Thời kỳ kháng chiến chống Pháp",
          summary: "Chính sách đoàn kết tôn giáo trong kháng chiến",
          details: "Ngay sau Cách mạng Tháng Tám 1945, chính sách tự do tín ngưỡng được khẳng định.",
          image: ""
        }
      ],
      religions: [
        {
          id: "buddhism",
          name: "Phật giáo",
          color: "#FFD700",
          icon: "",
          followers: "14 triệu",
          description: "Tôn giáo lớn nhất Việt Nam"
        }
      ],
      principles: [
        {
          id: "respect",
          title: "Tôn trọng",
          icon: "",
          description: "Tôn trọng quyền tự do tín ngưỡng của mọi người"
        }
      ],
      guidelines: [
        {
          id: "guideline-1",
          title: "Trong lớp học",
          content: "Tôn trọng thời gian cầu nguyện của bạn học có đạo."
        }
      ],
      testimonials: [
        {
          id: "testimonial-1",
          name: "Sinh viên FPT",
          major: "Công nghệ thông tin",
          quote: "Môi trường FPT giúp tôi hiểu và tôn trọng sự đa dạng tôn giáo.",
          avatar: ""
        }
      ],
      references: [
        {
          id: "ref-1",
          title: "Luật Tín ngưỡng, tôn giáo năm 2016",
          source: "Quốc hội Việt Nam",
          year: "2016",
          url: ""
        }
      ]
    };
  }
};

// ============================================
// NAVIGATION CONTROLLER
// ============================================

/**
 * NavigationController - Handles navigation functionality
 * Implements: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */
const NavigationController = {
  mobileMenuOpen: false,
  navElement: null,
  hamburgerBtn: null,
  mobileMenu: null,
  navLinks: null,

  /**
   * Initialize navigation
   */
  init() {
    this.navElement = document.querySelector('.nav');
    this.hamburgerBtn = document.querySelector('.nav__hamburger');
    this.mobileMenu = document.querySelector('.nav__menu');
    this.navLinks = document.querySelectorAll('.nav__link');

    if (this.hamburgerBtn) {
      // Click handler
      this.hamburgerBtn.addEventListener('click', () => this.toggleMobileMenu());
      
      // Keyboard handler for hamburger button (Enter/Space)
      this.hamburgerBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.toggleMobileMenu();
        }
      });
    }

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (this.mobileMenuOpen && 
          !this.mobileMenu?.contains(e.target) && 
          !this.hamburgerBtn?.contains(e.target)) {
        this.closeMobileMenu();
      }
    });

    // Global keyboard navigation
    document.addEventListener('keydown', (e) => this.handleKeyboardNav(e));

    // Add keyboard handlers to nav links
    this.navLinks.forEach((link, index) => {
      link.addEventListener('keydown', (e) => this.handleNavLinkKeydown(e, index));
    });

    // Set active link
    this.setActiveLink(window.location.pathname);
  },

  /**
   * Toggle mobile menu visibility
   */
  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
    
    if (this.mobileMenu) {
      this.mobileMenu.classList.toggle('nav__menu--open', this.mobileMenuOpen);
    }
    
    if (this.hamburgerBtn) {
      this.hamburgerBtn.setAttribute('aria-expanded', this.mobileMenuOpen.toString());
      
      // Update aria-label based on state
      const label = this.mobileMenuOpen ? 'Đóng menu điều hướng' : 'Mở menu điều hướng';
      this.hamburgerBtn.setAttribute('aria-label', label);
    }

    // Focus first link when menu opens
    if (this.mobileMenuOpen && this.navLinks.length > 0) {
      this.navLinks[0].focus();
    }
  },

  /**
   * Close mobile menu
   */
  closeMobileMenu() {
    this.mobileMenuOpen = false;
    
    if (this.mobileMenu) {
      this.mobileMenu.classList.remove('nav__menu--open');
    }
    
    if (this.hamburgerBtn) {
      this.hamburgerBtn.setAttribute('aria-expanded', 'false');
      this.hamburgerBtn.setAttribute('aria-label', 'Mở menu điều hướng');
    }
  },

  /**
   * Open mobile menu
   */
  openMobileMenu() {
    this.mobileMenuOpen = true;
    
    if (this.mobileMenu) {
      this.mobileMenu.classList.add('nav__menu--open');
    }
    
    if (this.hamburgerBtn) {
      this.hamburgerBtn.setAttribute('aria-expanded', 'true');
      this.hamburgerBtn.setAttribute('aria-label', 'Đóng menu điều hướng');
    }
  },

  /**
   * Check if mobile menu is currently open
   * @returns {boolean} - True if menu is open
   */
  isMenuOpen() {
    return this.mobileMenuOpen;
  },

  /**
   * Set active navigation link based on current path
   * @param {string} path - Current page path
   */
  setActiveLink(path) {
    const navLinks = document.querySelectorAll('.nav__link');
    
    // Normalize path
    let currentPage = path.split('/').pop() || 'index.html';
    if (currentPage === '' || currentPage === '/') {
      currentPage = 'index.html';
    }
    // Handle clean URLs (without .html)
    if (!currentPage.includes('.html')) {
      currentPage = currentPage + '.html';
    }
    // Handle query strings
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
        // Handle query strings in href
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

  /**
   * Get the currently active link
   * @returns {HTMLElement|null} - The active link element or null
   */
  getActiveLink() {
    return document.querySelector('.nav__link--active');
  },

  /**
   * Get all navigation links
   * @returns {NodeList} - All navigation link elements
   */
  getNavLinks() {
    return document.querySelectorAll('.nav__link');
  },

  /**
   * Handle keyboard navigation for nav links
   * @param {KeyboardEvent} event - Keyboard event
   * @param {number} currentIndex - Current link index
   */
  handleNavLinkKeydown(event, currentIndex) {
    const links = Array.from(this.navLinks);
    let newIndex = currentIndex;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        newIndex = (currentIndex + 1) % links.length;
        links[newIndex].focus();
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        newIndex = (currentIndex - 1 + links.length) % links.length;
        links[newIndex].focus();
        break;
      case 'Home':
        event.preventDefault();
        links[0].focus();
        break;
      case 'End':
        event.preventDefault();
        links[links.length - 1].focus();
        break;
      case 'Enter':
      case ' ':
        // Allow default behavior for Enter (navigate)
        // For Space, prevent scroll and trigger click
        if (event.key === ' ') {
          event.preventDefault();
          event.target.click();
        }
        break;
      case 'Tab':
        // Close menu when tabbing out of the last link (mobile)
        if (this.mobileMenuOpen && !event.shiftKey && currentIndex === links.length - 1) {
          this.closeMobileMenu();
        }
        // Close menu when shift-tabbing out of the first link (mobile)
        if (this.mobileMenuOpen && event.shiftKey && currentIndex === 0) {
          this.closeMobileMenu();
        }
        break;
    }
  },

  /**
   * Handle global keyboard navigation
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleKeyboardNav(event) {
    // Close menu on Escape
    if (event.key === 'Escape' && this.mobileMenuOpen) {
      this.closeMobileMenu();
      this.hamburgerBtn?.focus();
    }
  }
};

// ============================================
// ACCORDION CONTROLLER
// ============================================

/**
 * AccordionController - Handles accordion functionality
 * Implements: Requirements 6.4, 6.8
 * 
 * Features:
 * - Single expand mode (collapse others when one opens)
 * - Smooth height transition support
 * - Arrow key navigation between headers
 * - Full ARIA support (aria-expanded, aria-controls)
 */
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
  }
};

// ============================================
// CAROUSEL CONTROLLER
// ============================================

/**
 * CarouselController - Handles carousel/slider functionality
 * Implements: Requirements 6.5, 6.6
 */
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

    // Pause autoplay on hover
    container.addEventListener('mouseenter', () => this.stopAutoplay());
    container.addEventListener('mouseleave', () => this.startAutoplay(5000));

    // Initialize first slide
    this.goToSlide(0);
  },

  /**
   * Setup dot indicators
   */
  setupDots() {
    const dotsContainer = this.container?.querySelector('.carousel__dots');
    if (!dotsContainer) return;

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
  }
};

// ============================================
// LAZY LOADING CONTROLLER
// ============================================

/**
 * LazyLoadController - Handles lazy loading of images
 * Implements: Requirements 10.4
 * 
 * Features:
 * - Native loading="lazy" attribute support
 * - Intersection Observer fallback for older browsers
 * - Skips images above the fold (hero section)
 */
const LazyLoadController = {
  observer: null,
  
  /**
   * Initialize lazy loading
   */
  init() {
    // Check if native lazy loading is supported
    if ('loading' in HTMLImageElement.prototype) {
      // Native lazy loading is supported
      // Just ensure all below-the-fold images have loading="lazy"
      this.applyNativeLazyLoading();
    } else {
      // Fallback to Intersection Observer for older browsers
      this.initIntersectionObserver();
    }
  },

  /**
   * Apply native lazy loading to images below the fold
   * Images in hero sections should NOT be lazy loaded
   */
  applyNativeLazyLoading() {
    const images = document.querySelectorAll('img');
    
    images.forEach(img => {
      // Skip images that are above the fold (in hero sections)
      if (this.isAboveTheFold(img)) {
        // Remove lazy loading for above-the-fold images
        img.removeAttribute('loading');
        return;
      }
      
      // Add lazy loading for below-the-fold images
      if (!img.hasAttribute('loading')) {
        img.setAttribute('loading', 'lazy');
      }
    });
  },

  /**
   * Initialize Intersection Observer fallback for browsers without native lazy loading
   */
  initIntersectionObserver() {
    // Check if Intersection Observer is supported
    if (!('IntersectionObserver' in window)) {
      // Fallback: load all images immediately
      this.loadAllImages();
      return;
    }

    // Create observer with options
    const options = {
      root: null, // viewport
      rootMargin: '50px 0px', // Start loading 50px before entering viewport
      threshold: 0.01 // Trigger when 1% of image is visible
    };

    this.observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          this.loadImage(img);
          observer.unobserve(img);
        }
      });
    }, options);

    // Observe all images that should be lazy loaded
    this.observeImages();
  },

  /**
   * Observe images for lazy loading
   */
  observeImages() {
    const images = document.querySelectorAll('img[data-src]');
    
    images.forEach(img => {
      // Skip images above the fold
      if (this.isAboveTheFold(img)) {
        this.loadImage(img);
        return;
      }
      
      this.observer.observe(img);
    });
  },

  /**
   * Load a single image
   * @param {HTMLImageElement} img - Image element to load
   */
  loadImage(img) {
    const src = img.dataset.src;
    if (src) {
      img.src = src;
      img.removeAttribute('data-src');
    }
    img.classList.add('lazy-loaded');
  },

  /**
   * Load all images immediately (fallback when no lazy loading support)
   */
  loadAllImages() {
    const images = document.querySelectorAll('img[data-src]');
    images.forEach(img => this.loadImage(img));
  },

  /**
   * Check if an image is above the fold (in hero section)
   * @param {HTMLImageElement} img - Image element to check
   * @returns {boolean} - True if image is above the fold
   */
  isAboveTheFold(img) {
    // Check if image is inside a hero section
    const heroSelectors = [
      '.hero',
      '.fpt-hero',
      '.page-header',
      '[class*="hero"]'
    ];
    
    for (const selector of heroSelectors) {
      if (img.closest(selector)) {
        return true;
      }
    }
    
    // Also check by position - if image is in the first viewport height
    const rect = img.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    
    // Consider image above the fold if its top is within the first viewport
    return rect.top < viewportHeight && rect.top >= 0;
  },

  /**
   * Manually trigger lazy loading for dynamically added images
   * @param {HTMLElement} container - Container with new images
   */
  refresh(container = document) {
    if ('loading' in HTMLImageElement.prototype) {
      // For native lazy loading, just ensure attributes are set
      const images = container.querySelectorAll('img');
      images.forEach(img => {
        if (!this.isAboveTheFold(img) && !img.hasAttribute('loading')) {
          img.setAttribute('loading', 'lazy');
        }
      });
    } else if (this.observer) {
      // For Intersection Observer fallback
      const images = container.querySelectorAll('img[data-src]');
      images.forEach(img => {
        if (!this.isAboveTheFold(img)) {
          this.observer.observe(img);
        } else {
          this.loadImage(img);
        }
      });
    }
  },

  /**
   * Destroy the observer (cleanup)
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Debounce utility function
 * Creates a debounced version of a function that delays execution
 * until after the specified wait time has elapsed since the last call.
 * 
 * Implements: Requirement 13.4 - Debounce scroll event listeners
 * 
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ============================================
// NAVIGATION SCROLL CONTROLLER
// ============================================

/**
 * NavigationScrollController - Handles navigation scroll behavior
 * Implements: Requirements 3.4, 13.4
 * 
 * Features:
 * - Adds 'scrolled' class to .nav--premium when user scrolls down
 * - Removes 'scrolled' class when at top of page
 * - Uses debounced scroll handler for performance
 */
const NavigationScrollController = {
  nav: null,
  scrollHandler: null,

  /**
   * Initialize navigation scroll behavior
   */
  init() {
    this.nav = document.querySelector('.nav--premium');
    
    if (!this.nav) {
      // No premium navigation found, skip initialization
      return;
    }

    // Create debounced scroll handler for performance (Requirement 13.4)
    this.scrollHandler = debounce(() => this.handleScroll(), 10);

    // Add scroll event listener with passive option for better performance
    window.addEventListener('scroll', this.scrollHandler, { passive: true });

    // Check initial scroll position on page load
    this.handleScroll();
  },

  /**
   * Handle scroll event
   * Adds/removes 'scrolled' class based on scroll position
   * Implements: Requirement 3.4
   */
  handleScroll() {
    if (!this.nav) return;

    if (window.scrollY > 0) {
      this.nav.classList.add('scrolled');
    } else {
      this.nav.classList.remove('scrolled');
    }
  },

  /**
   * Check if navigation is in scrolled state
   * @returns {boolean} - True if scrolled class is applied
   */
  isScrolled() {
    return this.nav ? this.nav.classList.contains('scrolled') : false;
  },

  /**
   * Get the navigation element
   * @returns {HTMLElement|null} - The navigation element
   */
  getNavElement() {
    return this.nav;
  },

  /**
   * Destroy the scroll listener (cleanup)
   */
  destroy() {
    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler);
      this.scrollHandler = null;
    }
    this.nav = null;
  }
};

// ============================================
// PARTICLES CONTROLLER
// ============================================

/**
 * ParticlesController - Handles canvas-based particle background effect
 * Implements: Requirements 4.2, 4.6, 13.3
 * 
 * Features:
 * - Canvas-based particle system for hero section
 * - Uses requestAnimationFrame for 60fps animation
 * - Particle movement with wrap-around edges
 * - Respects prefers-reduced-motion preference
 * - Handles canvas resize on window resize
 */
const ParticlesController = {
  canvas: null,
  ctx: null,
  particles: [],
  animationId: null,
  isReducedMotion: false,
  resizeHandler: null,

  /**
   * Initialize the particles system
   */
  init() {
    this.canvas = document.getElementById('particles-canvas');
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    if (!this.ctx) return;

    // Check for reduced motion preference (Requirement 8.5, 14.3)
    this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Listen for changes to reduced motion preference
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      this.isReducedMotion = e.matches;
      if (this.isReducedMotion) {
        this.stop();
      } else {
        this.start();
      }
    });

    // Initial setup
    this.resize();
    this.createParticles();

    // Create debounced resize handler for performance
    this.resizeHandler = debounce(() => this.resize(), 100);
    window.addEventListener('resize', this.resizeHandler, { passive: true });

    // Start animation if reduced motion is not preferred
    if (!this.isReducedMotion) {
      this.start();
    } else {
      // Draw static particles for reduced motion
      this.drawStaticParticles();
    }
  },

  /**
   * Resize canvas to match container dimensions
   */
  resize() {
    if (!this.canvas) return;

    // Get the actual display size
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width || this.canvas.offsetWidth;
    this.canvas.height = rect.height || this.canvas.offsetHeight;

    // Recreate particles for new dimensions
    this.createParticles();

    // Redraw if in reduced motion mode
    if (this.isReducedMotion) {
      this.drawStaticParticles();
    }
  },

  /**
   * Create particles based on canvas size
   * Particle count is proportional to canvas area
   */
  createParticles() {
    if (!this.canvas) return;

    // Calculate particle count based on canvas area (1 particle per 15000 pixels)
    const count = Math.floor((this.canvas.width * this.canvas.height) / 15000);
    // Clamp between 20 and 150 particles for performance
    const particleCount = Math.max(20, Math.min(150, count));

    this.particles = [];

    for (let i = 0; i < particleCount; i++) {
      this.particles.push(this.createParticle());
    }
  },

  /**
   * Create a single particle with random properties
   * @returns {Object} - Particle object with position, size, speed, and opacity
   */
  createParticle() {
    return {
      x: Math.random() * this.canvas.width,
      y: Math.random() * this.canvas.height,
      size: Math.random() * 2 + 1, // Size between 1-3 pixels
      speedX: (Math.random() - 0.5) * 0.5, // Speed between -0.25 and 0.25
      speedY: (Math.random() - 0.5) * 0.5,
      opacity: Math.random() * 0.5 + 0.2, // Opacity between 0.2 and 0.7
      // Add fade direction for subtle pulsing effect
      fadeDirection: Math.random() > 0.5 ? 1 : -1,
      fadeSpeed: Math.random() * 0.005 + 0.002 // Fade speed between 0.002 and 0.007
    };
  },

  /**
   * Start the animation loop
   * Uses requestAnimationFrame for 60fps (Requirement 13.3)
   */
  start() {
    if (this.animationId) return; // Already running
    if (this.isReducedMotion) return; // Don't animate if reduced motion

    this.animate();
  },

  /**
   * Stop the animation loop
   */
  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  },

  /**
   * Main animation loop
   * Implements: Requirement 4.6 - 60fps animation performance
   */
  animate() {
    if (!this.ctx || !this.canvas) return;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Update and draw each particle
    this.particles.forEach(particle => {
      // Update position
      particle.x += particle.speedX;
      particle.y += particle.speedY;

      // Update opacity for fade effect
      particle.opacity += particle.fadeDirection * particle.fadeSpeed;
      
      // Reverse fade direction at bounds
      if (particle.opacity >= 0.7) {
        particle.opacity = 0.7;
        particle.fadeDirection = -1;
      } else if (particle.opacity <= 0.1) {
        particle.opacity = 0.1;
        particle.fadeDirection = 1;
      }

      // Wrap around edges
      if (particle.x < 0) particle.x = this.canvas.width;
      if (particle.x > this.canvas.width) particle.x = 0;
      if (particle.y < 0) particle.y = this.canvas.height;
      if (particle.y > this.canvas.height) particle.y = 0;

      // Draw particle
      this.drawParticle(particle);
    });

    // Continue animation loop using requestAnimationFrame (Requirement 13.3)
    this.animationId = requestAnimationFrame(() => this.animate());
  },

  /**
   * Draw a single particle
   * @param {Object} particle - Particle to draw
   */
  drawParticle(particle) {
    this.ctx.beginPath();
    this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    this.ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`;
    this.ctx.fill();
  },

  /**
   * Draw static particles (for reduced motion mode)
   */
  drawStaticParticles() {
    if (!this.ctx || !this.canvas) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.particles.forEach(particle => {
      this.drawParticle(particle);
    });
  },

  /**
   * Get current particle count
   * @returns {number} - Number of particles
   */
  getParticleCount() {
    return this.particles.length;
  },

  /**
   * Check if animation is currently running
   * @returns {boolean} - True if animation is running
   */
  isAnimating() {
    return this.animationId !== null;
  },

  /**
   * Check if reduced motion is enabled
   * @returns {boolean} - True if reduced motion is preferred
   */
  hasReducedMotion() {
    return this.isReducedMotion;
  },

  /**
   * Destroy the particles controller (cleanup)
   */
  destroy() {
    this.stop();
    
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }

    this.particles = [];
    this.canvas = null;
    this.ctx = null;
  }
};

// ============================================
// CARD TILT CONTROLLER
// ============================================

/**
 * CardTiltController - Handles 3D tilt effect for glassmorphism cards
 * Implements: Requirement 5.4
 * 
 * Features:
 * - Mouse tracking relative to card center
 * - 3D tilt effect with perspective transform
 * - Maximum tilt angle of 15 degrees
 * - Smooth reset on mouse leave
 * - Respects prefers-reduced-motion preference
 */
const CardTiltController = {
  cards: [],
  isReducedMotion: false,
  maxTilt: 15, // Maximum tilt angle in degrees
  perspective: 1000, // Perspective value in pixels

  /**
   * Initialize the card tilt controller
   * Finds all cards with .card--glass or .card--tilt class
   */
  init() {
    // Check for reduced motion preference (Requirement 14.3)
    this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Listen for changes to reduced motion preference
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      this.isReducedMotion = e.matches;
      if (this.isReducedMotion) {
        // Reset all cards when reduced motion is enabled
        this.cards.forEach(card => this.resetTilt(card));
      }
    });

    // Don't setup tilt effect if reduced motion is preferred
    if (this.isReducedMotion) return;

    // Find all cards that should have tilt effect
    this.cards = document.querySelectorAll('.card--glass, .card--tilt');
    this.cards.forEach(card => this.setupCard(card));
  },

  /**
   * Setup tilt effect for a single card
   * @param {HTMLElement} card - Card element to setup
   */
  setupCard(card) {
    // Set transform style for 3D effect
    card.style.transformStyle = 'preserve-3d';
    card.style.transition = 'transform 0.1s ease-out';

    // Add event listeners
    card.addEventListener('mousemove', (e) => this.handleMouseMove(e, card));
    card.addEventListener('mouseleave', () => this.resetTilt(card));
    card.addEventListener('mouseenter', () => {
      // Remove transition on enter for immediate response
      card.style.transition = 'transform 0.1s ease-out';
    });
  },

  /**
   * Handle mouse move event on card
   * Calculates tilt based on cursor position relative to card center
   * @param {MouseEvent} event - Mouse event
   * @param {HTMLElement} card - Card element
   */
  handleMouseMove(event, card) {
    // Skip if reduced motion is preferred
    if (this.isReducedMotion) return;

    const rect = card.getBoundingClientRect();
    
    // Calculate center of the card
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Calculate mouse position relative to center
    const mouseX = event.clientX - centerX;
    const mouseY = event.clientY - centerY;

    // Calculate tilt angles (inverted for natural feel)
    // mouseY controls X rotation (tilting forward/backward)
    // mouseX controls Y rotation (tilting left/right)
    const tiltX = (mouseY / (rect.height / 2)) * -this.maxTilt;
    const tiltY = (mouseX / (rect.width / 2)) * this.maxTilt;

    this.apply3DTilt(card, tiltX, tiltY);
  },

  /**
   * Apply 3D tilt transform to card
   * @param {HTMLElement} card - Card element
   * @param {number} tiltX - X-axis rotation in degrees
   * @param {number} tiltY - Y-axis rotation in degrees
   */
  apply3DTilt(card, tiltX, tiltY) {
    // Clamp tilt values to maximum
    tiltX = Math.max(-this.maxTilt, Math.min(this.maxTilt, tiltX));
    tiltY = Math.max(-this.maxTilt, Math.min(this.maxTilt, tiltY));

    // Apply CSS transform with perspective
    card.style.transform = `perspective(${this.perspective}px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
  },

  /**
   * Reset card tilt to neutral position
   * @param {HTMLElement} card - Card element to reset
   */
  resetTilt(card) {
    // Add smooth transition for reset
    card.style.transition = 'transform 0.3s ease-out';
    card.style.transform = `perspective(${this.perspective}px) rotateX(0deg) rotateY(0deg)`;
  },

  /**
   * Get the maximum tilt angle
   * @returns {number} - Maximum tilt angle in degrees
   */
  getMaxTilt() {
    return this.maxTilt;
  },

  /**
   * Get the perspective value
   * @returns {number} - Perspective value in pixels
   */
  getPerspective() {
    return this.perspective;
  },

  /**
   * Check if reduced motion is enabled
   * @returns {boolean} - True if reduced motion is preferred
   */
  hasReducedMotion() {
    return this.isReducedMotion;
  },

  /**
   * Get all initialized cards
   * @returns {NodeList} - All card elements with tilt effect
   */
  getCards() {
    return this.cards;
  },

  /**
   * Calculate tilt values for a given position (for testing)
   * @param {HTMLElement} card - Card element
   * @param {number} clientX - Mouse X position
   * @param {number} clientY - Mouse Y position
   * @returns {Object} - Object with tiltX and tiltY values
   */
  calculateTilt(card, clientX, clientY) {
    const rect = card.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const mouseX = clientX - centerX;
    const mouseY = clientY - centerY;

    let tiltX = (mouseY / (rect.height / 2)) * -this.maxTilt;
    let tiltY = (mouseX / (rect.width / 2)) * this.maxTilt;

    // Clamp values
    tiltX = Math.max(-this.maxTilt, Math.min(this.maxTilt, tiltX));
    tiltY = Math.max(-this.maxTilt, Math.min(this.maxTilt, tiltY));

    return { tiltX, tiltY };
  },

  /**
   * Manually initialize a card (for dynamically added cards)
   * @param {HTMLElement} card - Card element to initialize
   */
  addCard(card) {
    if (this.isReducedMotion) return;
    
    this.setupCard(card);
    // Add to cards collection if it's a NodeList, convert to array first
    if (this.cards instanceof NodeList) {
      this.cards = Array.from(this.cards);
    }
    if (Array.isArray(this.cards)) {
      this.cards.push(card);
    }
  },

  /**
   * Destroy the controller (cleanup)
   */
  destroy() {
    this.cards.forEach(card => {
      card.style.transform = '';
      card.style.transformStyle = '';
      card.style.transition = '';
    });
    this.cards = [];
  }
};

// ============================================
// CURSOR TRAIL CONTROLLER
// ============================================

/**
 * CursorTrailController - Handles custom cursor trail effect
 * Implements: Requirements 7.1, 7.4, 7.5, 7.6
 * 
 * Features:
 * - Pool of trail elements for smooth animation
 * - Uses requestAnimationFrame for 60fps performance
 * - Detects touch devices and disables effect
 * - Uses pointer-events: none to not interfere with clicks
 * - Respects prefers-reduced-motion preference
 */
const CursorTrailController = {
  trailElements: [],
  trailLength: 20,
  mouseX: 0,
  mouseY: 0,
  enabled: true,
  animationId: null,
  container: null,
  isReducedMotion: false,
  isTouchDevice: false,

  /**
   * Initialize the cursor trail controller
   * Implements: Requirements 7.4, 7.6
   */
  init() {
    // Check for touch device (Requirement 7.4)
    this.isTouchDevice = this.detectTouchDevice();
    if (this.isTouchDevice) {
      this.enabled = false;
      return;
    }

    // Check for reduced motion preference (Requirement 8.5, 14.3)
    this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (this.isReducedMotion) {
      this.enabled = false;
      return;
    }

    // Listen for changes to reduced motion preference
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      this.isReducedMotion = e.matches;
      if (this.isReducedMotion) {
        this.destroy();
        this.enabled = false;
      } else if (!this.isTouchDevice) {
        this.enabled = true;
        this.createTrailElements();
        this.animate();
      }
    });

    // Create trail elements
    this.createTrailElements();

    // Add mouse move listener
    document.addEventListener('mousemove', (e) => this.handleMouseMove(e));

    // Start animation loop
    this.animate();
  },

  /**
   * Detect if the device is a touch device
   * Implements: Requirement 7.4
   * @returns {boolean} - True if touch device
   */
  detectTouchDevice() {
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0
    );
  },

  /**
   * Create pool of trail elements
   * Implements: Requirements 7.2, 7.3, 7.5
   */
  createTrailElements() {
    // Create container for trail elements
    this.container = document.createElement('div');
    this.container.className = 'cursor-trail-container';
    this.container.setAttribute('aria-hidden', 'true'); // Accessibility: hide from screen readers

    // Create trail elements pool
    for (let i = 0; i < this.trailLength; i++) {
      const el = document.createElement('div');
      el.className = 'cursor-trail';
      
      // Set opacity based on position in trail (fades out toward end)
      // Requirement 7.3: fade out smoothly
      el.style.opacity = 1 - (i / this.trailLength);
      
      // Center the element on its position
      el.style.transform = 'translate(-50%, -50%)';
      
      this.container.appendChild(el);
      
      this.trailElements.push({
        el,
        x: 0,
        y: 0
      });
    }

    document.body.appendChild(this.container);
  },

  /**
   * Handle mouse move event
   * Implements: Requirement 7.1
   * @param {MouseEvent} event - Mouse event
   */
  handleMouseMove(event) {
    this.mouseX = event.clientX;
    this.mouseY = event.clientY;
  },

  /**
   * Update trail positions
   * Called by animate() to update each trail element position
   * Implements: Requirement 7.1
   * @param {number} x - Target X position
   * @param {number} y - Target Y position
   */
  updateTrailPosition(x, y) {
    let currentX = x;
    let currentY = y;

    this.trailElements.forEach((trail, index) => {
      // Calculate smooth follow with easing
      // Each element follows the previous one with a delay
      const ease = 0.3 - (index * 0.01); // Decreasing ease for trailing effect
      
      trail.x += (currentX - trail.x) * Math.max(0.1, ease);
      trail.y += (currentY - trail.y) * Math.max(0.1, ease);

      // Update element position using transform for GPU acceleration
      trail.el.style.left = trail.x + 'px';
      trail.el.style.top = trail.y + 'px';

      // Pass current position to next element in chain
      currentX = trail.x;
      currentY = trail.y;
    });
  },

  /**
   * Animation loop using requestAnimationFrame
   * Implements: Requirement 7.6 - 60fps performance
   */
  animate() {
    if (!this.enabled) return;

    // Update trail positions
    this.updateTrailPosition(this.mouseX, this.mouseY);

    // Continue animation loop using requestAnimationFrame (Requirement 13.3)
    this.animationId = requestAnimationFrame(() => this.animate());
  },

  /**
   * Check if cursor trail is enabled
   * @returns {boolean} - True if enabled
   */
  isEnabled() {
    return this.enabled;
  },

  /**
   * Check if device is touch device
   * @returns {boolean} - True if touch device
   */
  isTouchDeviceDetected() {
    return this.isTouchDevice;
  },

  /**
   * Check if reduced motion is preferred
   * @returns {boolean} - True if reduced motion
   */
  hasReducedMotion() {
    return this.isReducedMotion;
  },

  /**
   * Get trail elements
   * @returns {Array} - Array of trail element objects
   */
  getTrailElements() {
    return this.trailElements;
  },

  /**
   * Get current mouse position
   * @returns {Object} - Object with x and y coordinates
   */
  getMousePosition() {
    return { x: this.mouseX, y: this.mouseY };
  },

  /**
   * Destroy the cursor trail controller (cleanup)
   */
  destroy() {
    // Stop animation
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    // Remove container from DOM
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }

    // Clear trail elements array
    this.trailElements = [];
    this.container = null;
  }
};

// ============================================
// PAGE TRANSITION CONTROLLER
// ============================================

/**
 * PageTransitionController - Handles smooth page transitions
 * Implements: Requirements 11.1, 11.4
 * 
 * Features:
 * - Smooth fade transition on internal link clicks (200-400ms)
 * - Respects prefers-reduced-motion preference
 * - Does not block user interaction during animation
 * - Only applies to internal navigation links
 */
const PageTransitionController = {
  transitionDuration: 300, // Duration in ms (within 200-400ms range per Requirement 11.1)
  isReducedMotion: false,
  isTransitioning: false,

  /**
   * Initialize the page transition controller
   */
  init() {
    // Check for reduced motion preference (Requirement 11.4)
    this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Listen for changes to reduced motion preference
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      this.isReducedMotion = e.matches;
    });

    // Setup click listeners on internal navigation links
    this.setupLinkListeners();

    // Apply entrance animation on page load
    this.applyEntranceAnimation();
  },

  /**
   * Setup click listeners on internal navigation links
   * Only intercepts links to same-origin pages
   */
  setupLinkListeners() {
    // Get all internal links (same origin, not hash links, not external)
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      
      if (!link) return;
      
      // Check if this is an internal link we should handle
      if (!this.shouldHandleLink(link)) return;

      // Prevent default navigation
      e.preventDefault();

      // Get the target URL
      const targetUrl = link.href;

      // Apply exit transition and navigate
      this.navigateWithTransition(targetUrl);
    });
  },

  /**
   * Check if a link should be handled by the transition controller
   * @param {HTMLAnchorElement} link - The link element to check
   * @returns {boolean} - True if the link should be handled
   */
  shouldHandleLink(link) {
    // Must have href
    if (!link.href) return false;

    // Skip if link opens in new tab/window
    if (link.target === '_blank') return false;

    // Skip if link has download attribute
    if (link.hasAttribute('download')) return false;

    // Skip if link has rel="external"
    if (link.rel && link.rel.includes('external')) return false;

    // Skip hash-only links (same page anchors)
    if (link.getAttribute('href').startsWith('#')) return false;

    // Skip javascript: links
    if (link.href.startsWith('javascript:')) return false;

    // Skip mailto: and tel: links
    if (link.href.startsWith('mailto:') || link.href.startsWith('tel:')) return false;

    // Check if same origin
    try {
      const linkUrl = new URL(link.href);
      const currentUrl = new URL(window.location.href);
      
      // Only handle same-origin links
      if (linkUrl.origin !== currentUrl.origin) return false;
    } catch (e) {
      // Invalid URL, skip
      return false;
    }

    return true;
  },

  /**
   * Navigate to a URL with exit transition
   * @param {string} url - The URL to navigate to
   */
  navigateWithTransition(url) {
    // Prevent multiple transitions
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    // If reduced motion is preferred, navigate immediately (Requirement 11.4)
    if (this.isReducedMotion) {
      window.location.href = url;
      return;
    }

    // Apply exit transition classes
    document.body.classList.add('page-exit');
    
    // Use requestAnimationFrame to ensure class is applied before adding active class
    requestAnimationFrame(() => {
      document.body.classList.add('page-exit-active');
    });

    // Navigate after transition completes
    // Using setTimeout to not block user interaction (Requirement 11.3)
    setTimeout(() => {
      window.location.href = url;
    }, this.transitionDuration);
  },

  /**
   * Apply entrance animation when page loads
   */
  applyEntranceAnimation() {
    // Skip if reduced motion is preferred (Requirement 11.4)
    if (this.isReducedMotion) return;

    // Add entrance classes
    document.body.classList.add('page-enter');
    
    // Use requestAnimationFrame to ensure class is applied before adding active class
    requestAnimationFrame(() => {
      document.body.classList.add('page-enter-active');
      
      // Remove entrance classes after animation completes
      setTimeout(() => {
        document.body.classList.remove('page-enter', 'page-enter-active');
      }, this.transitionDuration);
    });
  },

  /**
   * Get the transition duration
   * @returns {number} - Transition duration in milliseconds
   */
  getTransitionDuration() {
    return this.transitionDuration;
  },

  /**
   * Check if reduced motion is enabled
   * @returns {boolean} - True if reduced motion is preferred
   */
  hasReducedMotion() {
    return this.isReducedMotion;
  },

  /**
   * Check if a transition is currently in progress
   * @returns {boolean} - True if transitioning
   */
  isInTransition() {
    return this.isTransitioning;
  },

  /**
   * Manually trigger a page transition to a URL
   * Useful for programmatic navigation
   * @param {string} url - The URL to navigate to
   */
  transitionTo(url) {
    this.navigateWithTransition(url);
  },

  /**
   * Reset transition state (useful for testing)
   */
  reset() {
    this.isTransitioning = false;
    document.body.classList.remove('page-enter', 'page-enter-active', 'page-exit', 'page-exit-active');
  }
};

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize all components when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Navigation
  NavigationController.init();

  // Initialize Navigation Scroll Behavior (Premium UI)
  NavigationScrollController.init();

  // Initialize Particles Background (Premium UI)
  ParticlesController.init();

  // Initialize Card Tilt Effect (Premium UI)
  CardTiltController.init();

  // Initialize Cursor Trail Effect (Premium UI)
  CursorTrailController.init();

  // Initialize Page Transition Controller (Premium UI)
  PageTransitionController.init();

  // Initialize Accordions
  document.querySelectorAll('.accordion').forEach(accordion => {
    AccordionController.init(accordion);
  });

  // Initialize Carousels
  document.querySelectorAll('.carousel').forEach(carousel => {
    CarouselController.init(carousel);
  });

  // Initialize Lazy Loading
  LazyLoadController.init();
});

// Export for testing and external use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DataFetcher,
    NavigationController,
    NavigationScrollController,
    AccordionController,
    CarouselController,
    LazyLoadController,
    ParticlesController,
    CardTiltController,
    CursorTrailController,
    PageTransitionController,
    debounce
  };
}

// Also export to window for browser use
if (typeof window !== 'undefined') {
  window.DataFetcher = DataFetcher;
  window.NavigationController = NavigationController;
  window.NavigationScrollController = NavigationScrollController;
  window.AccordionController = AccordionController;
  window.CarouselController = CarouselController;
  window.LazyLoadController = LazyLoadController;
  window.ParticlesController = ParticlesController;
  window.CardTiltController = CardTiltController;
  window.CursorTrailController = CursorTrailController;
  window.PageTransitionController = PageTransitionController;
  window.debounce = debounce;
}
