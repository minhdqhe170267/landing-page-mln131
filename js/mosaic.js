/**
 * mosaic.js - Mosaic Grid Controller
 * Vietnam Religious Diversity Landing Page
 * 
 * Contains: MosaicController for interactive religion tiles
 *           MagneticHoverController for magnetic hover effects
 * 
 * Requirements: 5.3, 5.6, 10.2
 */

// ============================================
// MOSAIC CONTROLLER
// ============================================

/**
 * MagneticHoverController - Handles magnetic hover effects for premium tiles
 * 
 * Features:
 * - Magnetic attraction effect when cursor is near a card
 * - Smooth translation toward cursor position
 * - Respects prefers-reduced-motion preference
 * - Resets card position on mouse leave
 * 
 * Implements: Requirements 10.2
 * Validates: Property 12 (Magnetic Hover Effect)
 */
const MagneticHoverController = (function () {
  'use strict';

  // Private state
  let tiles = [];
  let isReducedMotion = false;
  let isInitialized = false;

  // Configuration
  const config = {
    magneticRange: 50,    // pixels - range within which magnetic effect applies
    maxTranslation: 10,   // pixels - maximum translation distance
    transitionDuration: '0.2s', // smooth transition duration
    transitionEasing: 'ease-out'
  };

  /**
   * Initialize the MagneticHoverController
   */
  function init() {
    if (isInitialized) {
      return;
    }

    // Check for reduced motion preference
    isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Listen for changes to reduced motion preference
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', function (e) {
      isReducedMotion = e.matches;
      if (isReducedMotion) {
        // Reset all tiles when reduced motion is enabled
        tiles.forEach(function (tile) {
          resetCard(tile);
        });
      }
    });

    // Don't initialize magnetic effects if reduced motion is preferred
    if (isReducedMotion) {
      isInitialized = true;
      return;
    }

    // Get all premium tiles
    tiles = Array.from(document.querySelectorAll('.mosaic-tile--premium'));

    // Also check for regular mosaic tiles if no premium tiles found
    if (tiles.length === 0) {
      tiles = Array.from(document.querySelectorAll('.mosaic-tile'));
    }

    if (tiles.length === 0) {
      console.warn('MagneticHoverController: No tiles found');
      isInitialized = true;
      return;
    }

    // Setup magnetic hover for each tile
    tiles.forEach(function (tile) {
      setupMagneticHover(tile);
    });

    isInitialized = true;
  }

  /**
   * Setup magnetic hover effect for a single tile
   * @param {HTMLElement} tile - The tile element
   */
  function setupMagneticHover(tile) {
    if (!tile) return;

    // Add smooth transition for transform
    tile.style.transition = 'transform ' + config.transitionDuration + ' ' + config.transitionEasing;

    // Mouse move handler
    tile.addEventListener('mousemove', function (event) {
      if (isReducedMotion) return;
      handleMouseMove(event, tile);
    });

    // Mouse leave handler - reset the card
    tile.addEventListener('mouseleave', function () {
      resetCard(tile);
    });
  }

  /**
   * Handle mouse move event on a tile
   * @param {MouseEvent} event - The mouse event
   * @param {HTMLElement} tile - The tile element
   */
  function handleMouseMove(event, tile) {
    if (!tile || isReducedMotion) return;

    // Get tile bounding rect
    const rect = tile.getBoundingClientRect();

    // Calculate center of the tile
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Calculate distance from cursor to center
    const dx = event.clientX - centerX;
    const dy = event.clientY - centerY;

    // Apply magnetic effect
    applyMagneticEffect(tile, dx, dy);
  }

  /**
   * Apply magnetic effect to a tile based on cursor distance
   * @param {HTMLElement} tile - The tile element
   * @param {number} dx - Horizontal distance from center
   * @param {number} dy - Vertical distance from center
   */
  function applyMagneticEffect(tile, dx, dy) {
    if (!tile || isReducedMotion) return;

    // Calculate translation proportional to cursor offset
    // The further from center, the more translation (up to maxTranslation)
    const tileWidth = tile.offsetWidth || 1;
    const tileHeight = tile.offsetHeight || 1;

    // Normalize the distance and apply max translation
    const translateX = (dx / (tileWidth / 2)) * config.maxTranslation;
    const translateY = (dy / (tileHeight / 2)) * config.maxTranslation;

    // Clamp values to prevent excessive movement
    const clampedX = Math.max(-config.maxTranslation, Math.min(config.maxTranslation, translateX));
    const clampedY = Math.max(-config.maxTranslation, Math.min(config.maxTranslation, translateY));

    // Apply transform with scale for hover effect - combine magnetic + scale
    tile.style.transform = 'translate(' + clampedX + 'px, ' + clampedY + 'px) scale(1.05)';
  }

  /**
   * Reset card to original position
   * @param {HTMLElement} tile - The tile element
   */
  function resetCard(tile) {
    if (!tile) return;

    // Reset transform - remove inline style to let CSS take over
    tile.style.transform = '';
  }

  /**
   * Get configuration
   * @returns {Object} Current configuration
   */
  function getConfig() {
    return Object.assign({}, config);
  }

  /**
   * Update configuration
   * @param {Object} newConfig - New configuration values
   */
  function setConfig(newConfig) {
    if (newConfig) {
      if (typeof newConfig.magneticRange === 'number') {
        config.magneticRange = newConfig.magneticRange;
      }
      if (typeof newConfig.maxTranslation === 'number') {
        config.maxTranslation = newConfig.maxTranslation;
      }
      if (typeof newConfig.transitionDuration === 'string') {
        config.transitionDuration = newConfig.transitionDuration;
      }
      if (typeof newConfig.transitionEasing === 'string') {
        config.transitionEasing = newConfig.transitionEasing;
      }
    }
  }

  /**
   * Check if reduced motion is enabled
   * @returns {boolean}
   */
  function getIsReducedMotion() {
    return isReducedMotion;
  }

  /**
   * Check if controller is initialized
   * @returns {boolean}
   */
  function getIsInitialized() {
    return isInitialized;
  }

  /**
   * Get all tiles
   * @returns {Array} Array of tile elements
   */
  function getTiles() {
    return tiles;
  }

  /**
   * Destroy the controller and clean up
   */
  function destroy() {
    // Reset all tiles
    tiles.forEach(function (tile) {
      resetCard(tile);
      tile.style.transition = '';
    });

    // Reset state
    tiles = [];
    isInitialized = false;
  }

  // Public API
  return {
    init: init,
    setupMagneticHover: setupMagneticHover,
    applyMagneticEffect: applyMagneticEffect,
    resetCard: resetCard,
    getConfig: getConfig,
    setConfig: setConfig,
    isReducedMotion: getIsReducedMotion,
    isInitialized: getIsInitialized,
    getTiles: getTiles,
    destroy: destroy
  };
})();

/**
 * MosaicController - Handles mosaic grid functionality
 * 
 * Features:
 * - Render tiles from data.json (or use existing HTML)
 * - Hover effect handlers with JS enhancements
 * - Keyboard navigation between tiles (Arrow keys, Tab, Enter/Space)
 * - Focus management for accessibility
 * 
 * Implements: Requirements 5.3, 5.6
 */
const MosaicController = (function () {
  'use strict';

  // Private state
  let religionsData = [];
  let mosaicGrid = null;
  let tiles = [];
  let currentFocusIndex = -1;
  let isInitialized = false;
  let boundHandleKeydown = null;
  let boundHandleTileKeydown = null;

  /**
   * Initialize the MosaicController
   */
  function init() {
    if (isInitialized) {
      return;
    }

    // Get DOM references
    mosaicGrid = document.querySelector('.mosaic-grid');

    if (!mosaicGrid) {
      console.warn('MosaicController: Mosaic grid not found');
      return;
    }

    // Get all tiles
    tiles = Array.from(mosaicGrid.querySelectorAll('.mosaic-tile'));

    // Bind event handlers
    boundHandleKeydown = handleGridKeydown.bind(this);
    boundHandleTileKeydown = handleTileKeydown.bind(this);

    // Setup event listeners
    setupEventListeners();

    // Fetch religion data
    fetchReligionsData();

    // Make tiles focusable and add ARIA attributes
    setupTileAccessibility();

    isInitialized = true;
  }

  /**
   * Setup event listeners for mosaic interactions
   */
  function setupEventListeners() {
    if (!mosaicGrid) return;

    // Keyboard navigation on the grid
    mosaicGrid.addEventListener('keydown', boundHandleKeydown);

    // Setup hover and focus handlers for each tile
    tiles.forEach(function (tile, index) {
      // Hover handlers
      tile.addEventListener('mouseenter', function () {
        handleTileHover(tile, true);
      });

      tile.addEventListener('mouseleave', function () {
        handleTileHover(tile, false);
      });

      // Focus handlers
      tile.addEventListener('focus', function () {
        handleTileFocus(tile, index);
      });

      tile.addEventListener('blur', function () {
        handleTileBlur(tile);
      });

      // Click handler for tile activation
      tile.addEventListener('click', function () {
        handleTileActivate(tile);
      });

      // Keydown handler for individual tile
      tile.addEventListener('keydown', boundHandleTileKeydown);
    });
  }

  /**
   * Setup accessibility attributes for tiles
   */
  function setupTileAccessibility() {
    tiles.forEach(function (tile, index) {
      // Make tile focusable
      if (!tile.hasAttribute('tabindex')) {
        tile.setAttribute('tabindex', '0');
      }

      // Add ARIA attributes
      const name = tile.querySelector('.mosaic-tile__name');
      const description = tile.querySelector('.mosaic-tile__description');

      if (name) {
        const labelId = 'tile-label-' + index;
        name.id = labelId;
        tile.setAttribute('aria-labelledby', labelId);
      }

      if (description) {
        const descId = 'tile-desc-' + index;
        description.id = descId;
        tile.setAttribute('aria-describedby', descId);
      }

      // Add role for better screen reader support
      tile.setAttribute('role', 'button');
    });
  }

  /**
   * Fetch religions data from data.json
   */
  function fetchReligionsData() {
    // Try to use DataFetcher if available (from main.js)
    if (typeof DataFetcher !== 'undefined' && DataFetcher.fetchData) {
      DataFetcher.fetchData('assets/data.json')
        .then(function (data) {
          if (data && data.religions) {
            religionsData = data.religions;
            // Tiles are already in HTML, data is stored for potential dynamic use
          }
        })
        .catch(function (error) {
          console.warn('MosaicController: Could not fetch data, using fallback', error);
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
          if (data && data.religions) {
            religionsData = data.religions;
          }
        })
        .catch(function (error) {
          console.warn('MosaicController: Could not fetch data, using fallback', error);
          loadFallbackData();
        });
    }
  }

  /**
   * Load fallback data when fetch fails
   */
  function loadFallbackData() {
    religionsData = [
      {
        id: 'buddhism',
        name: 'Phật giáo',
        color: '#FFD700',
        followers: '14 triệu',
        description: 'Tôn giáo lớn nhất Việt Nam với lịch sử hơn 2000 năm.'
      },
      {
        id: 'catholicism',
        name: 'Công giáo',
        color: '#8B0000',
        followers: '7 triệu',
        description: 'Du nhập vào Việt Nam từ thế kỷ 16.'
      },
      {
        id: 'protestantism',
        name: 'Tin Lành',
        color: '#4169E1',
        followers: '1.5 triệu',
        description: 'Phát triển mạnh trong cộng đồng dân tộc thiểu số.'
      },
      {
        id: 'islam',
        name: 'Hồi giáo',
        color: '#228B22',
        followers: '80.000',
        description: 'Có mặt tại Việt Nam từ thế kỷ 10-11.'
      },
      {
        id: 'caodaism',
        name: 'Cao Đài',
        color: '#FF6347',
        followers: '2.5 triệu',
        description: 'Tôn giáo nội sinh ra đời năm 1926.'
      },
      {
        id: 'hoahao',
        name: 'Phật giáo Hòa Hảo',
        color: '#8B4513',
        followers: '1.5 triệu',
        description: 'Ra đời năm 1939 tại An Giang.'
      },
      {
        id: 'folk-beliefs',
        name: 'Tín ngưỡng dân gian',
        color: '#9932CC',
        followers: 'Phổ biến',
        description: 'Thờ cúng tổ tiên, thờ Mẫu, thờ Thành hoàng.'
      },
      {
        id: 'non-religious',
        name: 'Không tôn giáo',
        color: '#708090',
        followers: '70%+ dân số',
        description: 'Duy trì các tín ngưỡng truyền thống.'
      }
    ];
  }

  /**
   * Render tiles dynamically from data
   * This function can be used to dynamically generate tiles from data
   * @param {Array} data - Array of ReligionTile objects
   */
  function renderTiles(data) {
    if (!mosaicGrid || !data || data.length === 0) {
      return;
    }

    // Clear existing tiles
    mosaicGrid.innerHTML = '';

    // Icon mapping for religions
    const iconMap = {
      'buddhism': '☸️',
      'catholicism': '✝️',
      'protestantism': '✟',
      'islam': '☪️',
      'caodaism': '👁️',
      'hoahao': '🪷',
      'folk-beliefs': '🏮',
      'folk': '🏮',
      'non-religious': '🌐',
      'none': '🌐'
    };

    // Render each religion tile
    data.forEach(function (religion, index) {
      const icon = iconMap[religion.id] || '🔹';

      const article = document.createElement('article');
      article.className = 'mosaic-tile animate-on-scroll';
      article.setAttribute('role', 'listitem');
      article.setAttribute('data-religion', religion.id);
      article.style.setProperty('--tile-color', religion.color);
      article.setAttribute('tabindex', '0');

      article.innerHTML =
        '<div class="mosaic-tile__inner">' +
        '<div class="mosaic-tile__front">' +
        '<span class="mosaic-tile__icon" aria-hidden="true">' + icon + '</span>' +
        '<h3 class="mosaic-tile__name" id="tile-label-' + index + '">' + escapeHtml(religion.name) + '</h3>' +
        '<p class="mosaic-tile__followers">' + escapeHtml(religion.followers) + '</p>' +
        '</div>' +
        '<div class="mosaic-tile__overlay">' +
        '<h3 class="mosaic-tile__name">' + escapeHtml(religion.name) + '</h3>' +
        '<p class="mosaic-tile__followers">' + escapeHtml(religion.followers) + '</p>' +
        '<div class="mosaic-tile__description" id="tile-desc-' + index + '">' + religion.description + '</div>' +
        '</div>' +
        '</div>';

      mosaicGrid.appendChild(article);
    });

    // Update tiles array
    tiles = Array.from(mosaicGrid.querySelectorAll('.mosaic-tile'));

    // Re-setup event listeners for new tiles
    setupEventListeners();
    setupTileAccessibility();

    // Re-initialize scroll animations for new elements
    if (typeof ScrollAnimationController !== 'undefined' && ScrollAnimationController.observeElements) {
      ScrollAnimationController.observeElements('.mosaic-tile.animate-on-scroll');
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
   * Handle tile hover effect
   * CSS handles most of the visual effects, this adds JS enhancements
   * @param {HTMLElement} tile - The tile element
   * @param {boolean} isHovering - Whether mouse is entering or leaving
   */
  function handleTileHover(tile, isHovering) {
    if (!tile) return;

    if (isHovering) {
      // Add hover class for additional JS-controlled effects
      tile.classList.add('mosaic-tile--hover');

      // Announce to screen readers (optional enhancement)
      const name = tile.querySelector('.mosaic-tile__name');
      if (name) {
        tile.setAttribute('aria-expanded', 'true');
      }
    } else {
      tile.classList.remove('mosaic-tile--hover');
      tile.setAttribute('aria-expanded', 'false');
    }
  }

  /**
   * Handle tile focus
   * @param {HTMLElement} tile - The tile element
   * @param {number} index - Index of the tile
   */
  function handleTileFocus(tile, index) {
    if (!tile) return;

    currentFocusIndex = index;

    // Add focus class for visual feedback
    tile.classList.add('mosaic-tile--focused');

    // Show overlay on focus (same as hover)
    tile.classList.add('mosaic-tile--hover');
    tile.setAttribute('aria-expanded', 'true');
  }

  /**
   * Handle tile blur
   * @param {HTMLElement} tile - The tile element
   */
  function handleTileBlur(tile) {
    if (!tile) return;

    tile.classList.remove('mosaic-tile--focused');
    tile.classList.remove('mosaic-tile--hover');
    tile.setAttribute('aria-expanded', 'false');
  }

  /**
   * Handle tile activation (click or Enter/Space)
   * @param {HTMLElement} tile - The tile element
   */
  function handleTileActivate(tile) {
    if (!tile) return;

    // Get religion ID
    const religionId = tile.getAttribute('data-religion');

    // Dispatch custom event for potential external handling
    tile.dispatchEvent(new CustomEvent('tile:activate', {
      bubbles: true,
      detail: {
        religionId: religionId,
        tile: tile
      }
    }));

    // Toggle expanded state for more info
    const isExpanded = tile.classList.contains('mosaic-tile--expanded');

    // Collapse all other tiles first
    tiles.forEach(function (t) {
      t.classList.remove('mosaic-tile--expanded');
    });

    if (!isExpanded) {
      tile.classList.add('mosaic-tile--expanded');
    }
  }

  /**
   * Handle keyboard navigation on the grid
   * @param {KeyboardEvent} event - Keyboard event
   */
  function handleGridKeydown(event) {
    // Only handle arrow keys at grid level
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      return;
    }

    // Get current focused tile
    const focusedTile = document.activeElement;
    if (!focusedTile || !focusedTile.classList.contains('mosaic-tile')) {
      return;
    }

    const currentIndex = tiles.indexOf(focusedTile);
    if (currentIndex === -1) return;

    event.preventDefault();

    // Calculate grid dimensions
    const gridStyle = window.getComputedStyle(mosaicGrid);
    const gridColumns = gridStyle.gridTemplateColumns.split(' ').length;

    let newIndex = currentIndex;

    switch (event.key) {
      case 'ArrowRight':
        newIndex = Math.min(currentIndex + 1, tiles.length - 1);
        break;
      case 'ArrowLeft':
        newIndex = Math.max(currentIndex - 1, 0);
        break;
      case 'ArrowDown':
        newIndex = Math.min(currentIndex + gridColumns, tiles.length - 1);
        break;
      case 'ArrowUp':
        newIndex = Math.max(currentIndex - gridColumns, 0);
        break;
    }

    // Focus the new tile
    if (newIndex !== currentIndex && tiles[newIndex]) {
      tiles[newIndex].focus();
    }
  }

  /**
   * Handle keyboard events on individual tiles
   * @param {KeyboardEvent} event - Keyboard event
   */
  function handleTileKeydown(event) {
    const tile = event.currentTarget;

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        handleTileActivate(tile);
        break;
      case 'Escape':
        // Collapse expanded tile
        tile.classList.remove('mosaic-tile--expanded');
        break;
    }
  }

  /**
   * Handle keyboard navigation (public method for external use)
   * @param {KeyboardEvent} event - Keyboard event
   */
  function handleKeyboardNav(event) {
    handleGridKeydown(event);
  }

  /**
   * Focus a specific tile by index
   * @param {number} index - Index of the tile to focus
   */
  function focusTile(index) {
    if (index >= 0 && index < tiles.length) {
      tiles[index].focus();
    }
  }

  /**
   * Get religions data
   * @returns {Array} Religions data array
   */
  function getReligionsData() {
    return religionsData;
  }

  /**
   * Set religions data (useful for testing)
   * @param {Array} data - Religions data array
   */
  function setReligionsData(data) {
    religionsData = data || [];
  }

  /**
   * Get all tiles
   * @returns {Array} Array of tile elements
   */
  function getTiles() {
    return tiles;
  }

  /**
   * Get current focus index
   * @returns {number} Current focus index
   */
  function getCurrentFocusIndex() {
    return currentFocusIndex;
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
    if (mosaicGrid) {
      mosaicGrid.removeEventListener('keydown', boundHandleKeydown);
    }

    tiles.forEach(function (tile) {
      tile.removeEventListener('keydown', boundHandleTileKeydown);
    });

    // Reset state
    religionsData = [];
    mosaicGrid = null;
    tiles = [];
    currentFocusIndex = -1;
    isInitialized = false;
    boundHandleKeydown = null;
    boundHandleTileKeydown = null;
  }

  // Public API
  return {
    init: init,
    renderTiles: renderTiles,
    handleTileHover: handleTileHover,
    handleKeyboardNav: handleKeyboardNav,
    focusTile: focusTile,
    getReligionsData: getReligionsData,
    setReligionsData: setReligionsData,
    getTiles: getTiles,
    getCurrentFocusIndex: getCurrentFocusIndex,
    isInitialized: getIsInitialized,
    destroy: destroy
  };
})();

// ============================================
// PAGE LOAD STAGGER ANIMATION CONTROLLER
// ============================================

/**
 * PageLoadStaggerController - Handles stagger animation on page load
 * 
 * Features:
 * - Triggers stagger animation for tiles visible on page load
 * - Uses requestAnimationFrame for smooth animation
 * - Respects prefers-reduced-motion preference
 * 
 * Implements: Requirements 10.5
 * Validates: Property 9 (Stagger Animation Delay Increment)
 */
const PageLoadStaggerController = (function () {
  'use strict';

  // Private state
  let isInitialized = false;
  let isReducedMotion = false;

  // Configuration
  const config = {
    staggerDelay: 100,  // milliseconds between each tile animation
    initialDelay: 100   // initial delay before first tile animates
  };

  /**
   * Check if user prefers reduced motion
   * @returns {boolean}
   */
  function prefersReducedMotion() {
    return window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Initialize the PageLoadStaggerController
   * Triggers stagger animation for mosaic tiles on page load
   */
  function init() {
    if (isInitialized) {
      return;
    }

    // Check for reduced motion preference
    isReducedMotion = prefersReducedMotion();

    // Get all mosaic tiles with animate-on-scroll class
    const tiles = document.querySelectorAll('.mosaic-tile.animate-on-scroll');

    if (tiles.length === 0) {
      isInitialized = true;
      return;
    }

    // If reduced motion is preferred, show all tiles immediately without animation
    if (isReducedMotion) {
      tiles.forEach(function (tile) {
        tile.classList.add('is-visible');
        tile.style.opacity = '1';
        tile.style.transform = 'none';
      });
      isInitialized = true;
      return;
    }

    // Trigger stagger animation on page load
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(function () {
      triggerStaggerAnimation(tiles);
    });

    isInitialized = true;
  }

  /**
   * Trigger stagger animation for a collection of tiles
   * @param {NodeList|Array} tiles - Collection of tile elements
   */
  function triggerStaggerAnimation(tiles) {
    if (!tiles || tiles.length === 0) return;

    // Convert NodeList to Array for easier manipulation
    const tilesArray = Array.from(tiles);

    // Apply stagger animation with delays
    tilesArray.forEach(function (tile, index) {
      // Calculate delay based on index (100ms increment per tile)
      const delay = config.initialDelay + (index * config.staggerDelay);

      // Use setTimeout to trigger animation with stagger delay
      setTimeout(function () {
        // Add is-visible class to trigger CSS transition
        tile.classList.add('is-visible');
      }, delay);
    });
  }

  /**
   * Get configuration
   * @returns {Object} Current configuration
   */
  function getConfig() {
    return Object.assign({}, config);
  }

  /**
   * Update configuration
   * @param {Object} newConfig - New configuration values
   */
  function setConfig(newConfig) {
    if (newConfig) {
      if (typeof newConfig.staggerDelay === 'number') {
        config.staggerDelay = newConfig.staggerDelay;
      }
      if (typeof newConfig.initialDelay === 'number') {
        config.initialDelay = newConfig.initialDelay;
      }
    }
  }

  /**
   * Check if reduced motion is enabled
   * @returns {boolean}
   */
  function getIsReducedMotion() {
    return isReducedMotion;
  }

  /**
   * Check if controller is initialized
   * @returns {boolean}
   */
  function getIsInitialized() {
    return isInitialized;
  }

  /**
   * Reset the controller (useful for testing)
   */
  function reset() {
    isInitialized = false;
    isReducedMotion = false;
  }

  // Public API
  return {
    init: init,
    triggerStaggerAnimation: triggerStaggerAnimation,
    getConfig: getConfig,
    setConfig: setConfig,
    isReducedMotion: getIsReducedMotion,
    isInitialized: getIsInitialized,
    reset: reset
  };
})();

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize mosaic components when DOM is ready
 */
document.addEventListener('DOMContentLoaded', function () {
  // Check if we're on the mosaic page
  const isMosaicPage = document.querySelector('.mosaic-grid') !== null;

  if (isMosaicPage) {
    // Initialize MosaicController
    MosaicController.init();

    // Initialize MagneticHoverController for premium hover effects
    MagneticHoverController.init();

    // Initialize PageLoadStaggerController for entrance animation
    // This ensures tiles animate with stagger effect on page load
    // Requirement 10.5: Animate cards with stagger effect on page load
    PageLoadStaggerController.init();
  }
});

// Export for module systems (if used)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MosaicController, MagneticHoverController, PageLoadStaggerController };
}

// Also export to window for browser use
if (typeof window !== 'undefined') {
  window.MosaicController = MosaicController;
  window.MagneticHoverController = MagneticHoverController;
  window.PageLoadStaggerController = PageLoadStaggerController;
}
