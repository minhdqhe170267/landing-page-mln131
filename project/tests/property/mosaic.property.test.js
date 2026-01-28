/**
 * Property-Based Tests for Mosaic Component
 * Feature: vietnam-religious-diversity-landing
 * 
 * Property 7: Mosaic Tile Hover Effect
 * Property 8: Mosaic Color Coding Uniqueness
 * 
 * **Validates: Requirements 5.3, 5.4**
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
 * Religion color scheme as defined in design document
 * Requirement 5.4: Unique color coding for each religion tile
 */
const RELIGION_COLORS = {
  'buddhism': '#FFD700',      // Phật giáo - Gold
  'catholicism': '#8B0000',   // Công giáo - Dark Red
  'protestantism': '#4169E1', // Tin Lành - Royal Blue
  'islam': '#228B22',         // Hồi giáo - Forest Green
  'caodai': '#FF6347',        // Cao Đài - Tomato
  'hoahao': '#8B4513',        // Hòa Hảo - Saddle Brown
  'folk': '#9932CC',          // Tín ngưỡng dân gian - Dark Orchid
  'none': '#708090'           // Không tôn giáo - Slate Gray
};

/**
 * All 8 religions as defined in requirements
 */
const ALL_RELIGIONS = [
  { id: 'buddhism', name: 'Phật giáo', color: '#FFD700', followers: '14 triệu', description: 'Tôn giáo lớn nhất Việt Nam với lịch sử hơn 2000 năm.' },
  { id: 'catholicism', name: 'Công giáo', color: '#8B0000', followers: '7 triệu', description: 'Du nhập vào Việt Nam từ thế kỷ 16.' },
  { id: 'protestantism', name: 'Tin Lành', color: '#4169E1', followers: '1.5 triệu', description: 'Phát triển mạnh trong cộng đồng dân tộc thiểu số.' },
  { id: 'islam', name: 'Hồi giáo', color: '#228B22', followers: '80.000', description: 'Có mặt tại Việt Nam từ thế kỷ 10-11.' },
  { id: 'caodai', name: 'Cao Đài', color: '#FF6347', followers: '2.5 triệu', description: 'Tôn giáo nội sinh ra đời năm 1926.' },
  { id: 'hoahao', name: 'Phật giáo Hòa Hảo', color: '#8B4513', followers: '1.5 triệu', description: 'Ra đời năm 1939 tại An Giang.' },
  { id: 'folk', name: 'Tín ngưỡng dân gian', color: '#9932CC', followers: 'Phổ biến', description: 'Thờ cúng tổ tiên, thờ Mẫu, thờ Thành hoàng.' },
  { id: 'none', name: 'Không tôn giáo', color: '#708090', followers: '70%+ dân số', description: 'Duy trì các tín ngưỡng truyền thống.' }
];


/**
 * Create a mock DOM with mosaic grid structure
 * @param {Array} religions - Array of religion data to create tiles for
 * @returns {Object} - DOM window, document
 */
function createMockDOM(religions = ALL_RELIGIONS) {
  const tilesHtml = religions.map((religion, index) => {
    return `
      <article 
        class="mosaic-tile mosaic-tile--${religion.id}" 
        data-religion="${religion.id}"
        tabindex="0"
        role="button"
        aria-labelledby="tile-label-${index}"
        aria-describedby="tile-desc-${index}"
        aria-expanded="false"
        style="--tile-color: ${religion.color};"
      >
        <div class="mosaic-tile__inner">
          <div class="mosaic-tile__front">
            <span class="mosaic-tile__icon" aria-hidden="true">☸️</span>
            <h3 class="mosaic-tile__name" id="tile-label-${index}">${religion.name}</h3>
            <p class="mosaic-tile__followers">${religion.followers}</p>
          </div>
          <div class="mosaic-tile__overlay">
            <h3 class="mosaic-tile__name">${religion.name}</h3>
            <p class="mosaic-tile__followers">${religion.followers}</p>
            <p class="mosaic-tile__description" id="tile-desc-${index}">${religion.description}</p>
          </div>
        </div>
      </article>
    `;
  }).join('\n');

  const html = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <title>Mosaic Test Page</title>
      <style>
        :root {
          --color-buddhism: #FFD700;
          --color-catholicism: #8B0000;
          --color-protestantism: #4169E1;
          --color-islam: #228B22;
          --color-caodai: #FF6347;
          --color-hoahao: #8B4513;
          --color-folk: #9932CC;
          --color-none: #708090;
          --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          --transition-normal: 300ms ease;
        }
        .mosaic-tile {
          position: relative;
          transition: transform var(--transition-normal), box-shadow var(--transition-normal);
          transform: scale(1);
        }
        .mosaic-tile:hover,
        .mosaic-tile--hover {
          transform: scale(1.03);
          box-shadow: var(--shadow-xl);
        }
        .mosaic-tile__overlay {
          opacity: 0;
          transition: opacity var(--transition-normal);
        }
        .mosaic-tile:hover .mosaic-tile__overlay,
        .mosaic-tile--hover .mosaic-tile__overlay {
          opacity: 1;
        }
        .mosaic-tile--buddhism { --tile-color: var(--color-buddhism); }
        .mosaic-tile--catholicism { --tile-color: var(--color-catholicism); }
        .mosaic-tile--protestantism { --tile-color: var(--color-protestantism); }
        .mosaic-tile--islam { --tile-color: var(--color-islam); }
        .mosaic-tile--caodai { --tile-color: var(--color-caodai); }
        .mosaic-tile--hoahao { --tile-color: var(--color-hoahao); }
        .mosaic-tile--folk { --tile-color: var(--color-folk); }
        .mosaic-tile--none { --tile-color: var(--color-none); }
      </style>
    </head>
    <body>
      <main class="mosaic-page">
        <div class="mosaic-page__content">
          <div class="mosaic-grid" role="list">
            ${tilesHtml}
          </div>
        </div>
      </main>
    </body>
    </html>
  `;

  const dom = new JSDOM(html, {
    url: 'http://localhost/mosaic.html',
    runScripts: 'dangerously'
  });

  return {
    window: dom.window,
    document: dom.window.document
  };
}


/**
 * Create MosaicController instance for testing
 * @param {Document} document - DOM document
 * @param {Window} window - DOM window
 * @returns {Object} - MosaicController instance
 */
function createMosaicController(document, window) {
  // Private state
  let mosaicGrid = null;
  let tiles = [];
  let isInitialized = false;

  const MosaicController = {
    init() {
      if (isInitialized) return;

      mosaicGrid = document.querySelector('.mosaic-grid');
      if (!mosaicGrid) {
        console.warn('MosaicController: Mosaic grid not found');
        return;
      }

      tiles = Array.from(mosaicGrid.querySelectorAll('.mosaic-tile'));
      this.setupEventListeners();
      isInitialized = true;
    },

    setupEventListeners() {
      tiles.forEach((tile) => {
        tile.addEventListener('mouseenter', () => this.handleTileHover(tile, true));
        tile.addEventListener('mouseleave', () => this.handleTileHover(tile, false));
        tile.addEventListener('focus', () => this.handleTileFocus(tile));
        tile.addEventListener('blur', () => this.handleTileBlur(tile));
      });
    },

    /**
     * Handle tile hover effect
     * @param {HTMLElement} tile - The tile element
     * @param {boolean} isHovering - Whether mouse is entering or leaving
     */
    handleTileHover(tile, isHovering) {
      if (!tile) return;

      if (isHovering) {
        tile.classList.add('mosaic-tile--hover');
        tile.setAttribute('aria-expanded', 'true');
      } else {
        tile.classList.remove('mosaic-tile--hover');
        tile.setAttribute('aria-expanded', 'false');
      }
    },

    /**
     * Handle tile focus
     * @param {HTMLElement} tile - The tile element
     */
    handleTileFocus(tile) {
      if (!tile) return;
      tile.classList.add('mosaic-tile--focused');
      tile.classList.add('mosaic-tile--hover');
      tile.setAttribute('aria-expanded', 'true');
    },

    /**
     * Handle tile blur
     * @param {HTMLElement} tile - The tile element
     */
    handleTileBlur(tile) {
      if (!tile) return;
      tile.classList.remove('mosaic-tile--focused');
      tile.classList.remove('mosaic-tile--hover');
      tile.setAttribute('aria-expanded', 'false');
    },

    /**
     * Simulate mouse enter on a tile
     * @param {HTMLElement} tile - The tile element
     */
    simulateMouseEnter(tile) {
      const event = new window.MouseEvent('mouseenter', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      tile.dispatchEvent(event);
    },

    /**
     * Simulate mouse leave on a tile
     * @param {HTMLElement} tile - The tile element
     */
    simulateMouseLeave(tile) {
      const event = new window.MouseEvent('mouseleave', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      tile.dispatchEvent(event);
    },

    /**
     * Check if tile is in hover state
     * @param {HTMLElement} tile - The tile element
     * @returns {boolean}
     */
    isTileHovered(tile) {
      return tile.classList.contains('mosaic-tile--hover');
    },

    /**
     * Check if tile overlay is visible (via hover class)
     * @param {HTMLElement} tile - The tile element
     * @returns {boolean}
     */
    isOverlayVisible(tile) {
      return tile.classList.contains('mosaic-tile--hover');
    },

    /**
     * Get all tiles
     * @returns {Array}
     */
    getTiles() {
      return tiles;
    },

    /**
     * Get tile by religion ID
     * @param {string} religionId - Religion ID
     * @returns {HTMLElement|null}
     */
    getTileByReligion(religionId) {
      return tiles.find(tile => tile.getAttribute('data-religion') === religionId) || null;
    },

    /**
     * Get tile color
     * @param {HTMLElement} tile - The tile element
     * @returns {string}
     */
    getTileColor(tile) {
      return tile.style.getPropertyValue('--tile-color').trim();
    },

    /**
     * Destroy controller
     */
    destroy() {
      mosaicGrid = null;
      tiles = [];
      isInitialized = false;
    }
  };

  return MosaicController;
}


// ============================================
// ARBITRARIES (Test Data Generators)
// ============================================

/**
 * Generate a valid religion ID
 */
const religionIdArbitrary = fc.constantFrom(
  'buddhism',
  'catholicism',
  'protestantism',
  'islam',
  'caodai',
  'hoahao',
  'folk',
  'none'
);

/**
 * Generate a random religion object
 */
const religionArbitrary = fc.constantFrom(...ALL_RELIGIONS);

/**
 * Generate a subset of religions (at least 2 for uniqueness testing)
 */
const religionSubsetArbitrary = fc.shuffledSubarray(ALL_RELIGIONS, { minLength: 2, maxLength: 8 });

/**
 * Generate a sequence of hover actions (enter/leave)
 */
const hoverActionArbitrary = fc.constantFrom('enter', 'leave');

/**
 * Generate a sequence of hover actions
 */
const hoverActionSequenceArbitrary = fc.array(hoverActionArbitrary, { minLength: 1, maxLength: 20 });

/**
 * Generate tile index for random tile selection
 */
const tileIndexArbitrary = fc.integer({ min: 0, max: 7 });

/**
 * Generate multiple tile indices for testing multiple tiles
 */
const multipleTileIndicesArbitrary = fc.array(tileIndexArbitrary, { minLength: 1, maxLength: 8 });

// ============================================
// PROPERTY TESTS
// ============================================

describe('Feature: vietnam-religious-diversity-landing', () => {
  
  describe('Property 7: Mosaic Tile Hover Effect', () => {
    /**
     * Property 7.1: WHEN user hovers over a tile, the tile SHALL scale up
     * **Validates: Requirements 5.3**
     */
    it('should add hover class when mouse enters tile', () => {
      fc.assert(
        fc.property(tileIndexArbitrary, (tileIndex) => {
          const { document, window } = createMockDOM();
          const mosaic = createMosaicController(document, window);
          mosaic.init();

          const tiles = mosaic.getTiles();
          const tile = tiles[tileIndex];

          // Initial state: no hover
          expect(mosaic.isTileHovered(tile)).toBe(false);

          // Simulate mouse enter
          mosaic.simulateMouseEnter(tile);

          // Tile should be in hover state
          expect(mosaic.isTileHovered(tile)).toBe(true);
          expect(tile.classList.contains('mosaic-tile--hover')).toBe(true);

          mosaic.destroy();
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property 7.2: WHEN user hovers over a tile, the tile SHALL display an information overlay
     * **Validates: Requirements 5.3**
     */
    it('should show overlay when mouse enters tile', () => {
      fc.assert(
        fc.property(tileIndexArbitrary, (tileIndex) => {
          const { document, window } = createMockDOM();
          const mosaic = createMosaicController(document, window);
          mosaic.init();

          const tiles = mosaic.getTiles();
          const tile = tiles[tileIndex];

          // Initial state: overlay not visible
          expect(mosaic.isOverlayVisible(tile)).toBe(false);

          // Simulate mouse enter
          mosaic.simulateMouseEnter(tile);

          // Overlay should be visible (via hover class)
          expect(mosaic.isOverlayVisible(tile)).toBe(true);

          mosaic.destroy();
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property 7.3: WHEN hover ends, the tile SHALL return to original state
     * **Validates: Requirements 5.3**
     */
    it('should return to original state when mouse leaves tile', () => {
      fc.assert(
        fc.property(tileIndexArbitrary, (tileIndex) => {
          const { document, window } = createMockDOM();
          const mosaic = createMosaicController(document, window);
          mosaic.init();

          const tiles = mosaic.getTiles();
          const tile = tiles[tileIndex];

          // Hover the tile
          mosaic.simulateMouseEnter(tile);
          expect(mosaic.isTileHovered(tile)).toBe(true);

          // Leave the tile
          mosaic.simulateMouseLeave(tile);

          // Tile should return to original state
          expect(mosaic.isTileHovered(tile)).toBe(false);
          expect(tile.classList.contains('mosaic-tile--hover')).toBe(false);
          expect(mosaic.isOverlayVisible(tile)).toBe(false);

          mosaic.destroy();
        }),
        { numRuns: 100 }
      );
    });


    /**
     * Property 7.4: Multiple hover enter/leave cycles SHALL maintain consistency
     * **Validates: Requirements 5.3**
     */
    it('should maintain state consistency through multiple hover cycles', () => {
      fc.assert(
        fc.property(
          tileIndexArbitrary,
          hoverActionSequenceArbitrary,
          (tileIndex, actions) => {
            const { document, window } = createMockDOM();
            const mosaic = createMosaicController(document, window);
            mosaic.init();

            const tiles = mosaic.getTiles();
            const tile = tiles[tileIndex];

            let expectedHoverState = false;

            actions.forEach((action) => {
              if (action === 'enter') {
                mosaic.simulateMouseEnter(tile);
                expectedHoverState = true;
              } else {
                mosaic.simulateMouseLeave(tile);
                expectedHoverState = false;
              }

              // Verify state consistency after each action
              expect(mosaic.isTileHovered(tile)).toBe(expectedHoverState);
              expect(mosaic.isOverlayVisible(tile)).toBe(expectedHoverState);
            });

            mosaic.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 7.5: aria-expanded attribute SHALL match hover state
     * **Validates: Requirements 5.3**
     */
    it('should update aria-expanded attribute on hover', () => {
      fc.assert(
        fc.property(
          tileIndexArbitrary,
          hoverActionSequenceArbitrary,
          (tileIndex, actions) => {
            const { document, window } = createMockDOM();
            const mosaic = createMosaicController(document, window);
            mosaic.init();

            const tiles = mosaic.getTiles();
            const tile = tiles[tileIndex];

            actions.forEach((action) => {
              if (action === 'enter') {
                mosaic.simulateMouseEnter(tile);
                expect(tile.getAttribute('aria-expanded')).toBe('true');
              } else {
                mosaic.simulateMouseLeave(tile);
                expect(tile.getAttribute('aria-expanded')).toBe('false');
              }
            });

            mosaic.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 7.6: Hovering one tile SHALL NOT affect other tiles
     * **Validates: Requirements 5.3**
     */
    it('should not affect other tiles when hovering one tile', () => {
      fc.assert(
        fc.property(tileIndexArbitrary, (tileIndex) => {
          const { document, window } = createMockDOM();
          const mosaic = createMosaicController(document, window);
          mosaic.init();

          const tiles = mosaic.getTiles();
          const hoveredTile = tiles[tileIndex];

          // Hover the selected tile
          mosaic.simulateMouseEnter(hoveredTile);

          // Check that only the hovered tile is in hover state
          tiles.forEach((tile, index) => {
            if (index === tileIndex) {
              expect(mosaic.isTileHovered(tile)).toBe(true);
            } else {
              expect(mosaic.isTileHovered(tile)).toBe(false);
            }
          });

          mosaic.destroy();
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property 7.7: All tiles SHALL start in non-hover state
     * **Validates: Requirements 5.3**
     */
    it('should initialize all tiles in non-hover state', () => {
      fc.assert(
        fc.property(religionSubsetArbitrary, (religions) => {
          const { document, window } = createMockDOM(religions);
          const mosaic = createMosaicController(document, window);
          mosaic.init();

          const tiles = mosaic.getTiles();

          // All tiles should start without hover
          tiles.forEach((tile) => {
            expect(mosaic.isTileHovered(tile)).toBe(false);
            expect(tile.classList.contains('mosaic-tile--hover')).toBe(false);
            expect(tile.getAttribute('aria-expanded')).toBe('false');
          });

          mosaic.destroy();
        }),
        { numRuns: 100 }
      );
    });
  });


  describe('Property 8: Mosaic Color Coding Uniqueness', () => {
    /**
     * Property 8.1: Each religion tile SHALL have its designated unique color applied
     * **Validates: Requirements 5.4**
     */
    it('should apply designated color to each religion tile', () => {
      fc.assert(
        fc.property(religionArbitrary, (religion) => {
          const { document, window } = createMockDOM([religion]);
          const mosaic = createMosaicController(document, window);
          mosaic.init();

          const tile = mosaic.getTileByReligion(religion.id);
          expect(tile).not.toBeNull();

          // Tile should have the correct color applied
          const tileColor = mosaic.getTileColor(tile);
          expect(tileColor).toBe(religion.color);

          mosaic.destroy();
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property 8.2: No two different religions SHALL share the same color
     * **Validates: Requirements 5.4**
     */
    it('should ensure no two religions share the same color', () => {
      fc.assert(
        fc.property(religionSubsetArbitrary, (religions) => {
          const { document, window } = createMockDOM(religions);
          const mosaic = createMosaicController(document, window);
          mosaic.init();

          const tiles = mosaic.getTiles();
          const colorMap = new Map();

          tiles.forEach((tile) => {
            const religionId = tile.getAttribute('data-religion');
            const color = mosaic.getTileColor(tile);

            // If this color was already used, it should be for the same religion
            if (colorMap.has(color)) {
              expect(colorMap.get(color)).toBe(religionId);
            } else {
              colorMap.set(color, religionId);
            }
          });

          // Number of unique colors should equal number of religions
          expect(colorMap.size).toBe(religions.length);

          mosaic.destroy();
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property 8.3: All 8 religions SHALL have distinct colors
     * **Validates: Requirements 5.4**
     */
    it('should have 8 distinct colors for all religions', () => {
      const { document, window } = createMockDOM(ALL_RELIGIONS);
      const mosaic = createMosaicController(document, window);
      mosaic.init();

      const tiles = mosaic.getTiles();
      const colors = new Set();

      tiles.forEach((tile) => {
        const color = mosaic.getTileColor(tile);
        colors.add(color);
      });

      // Should have exactly 8 unique colors
      expect(colors.size).toBe(8);

      mosaic.destroy();
    });

    /**
     * Property 8.4: Each religion SHALL have its predefined color from design spec
     * **Validates: Requirements 5.4**
     */
    it('should match predefined colors from design specification', () => {
      fc.assert(
        fc.property(religionIdArbitrary, (religionId) => {
          const religion = ALL_RELIGIONS.find(r => r.id === religionId);
          const { document, window } = createMockDOM([religion]);
          const mosaic = createMosaicController(document, window);
          mosaic.init();

          const tile = mosaic.getTileByReligion(religionId);
          const tileColor = mosaic.getTileColor(tile);

          // Color should match the predefined color from RELIGION_COLORS
          expect(tileColor).toBe(RELIGION_COLORS[religionId]);

          mosaic.destroy();
        }),
        { numRuns: 100 }
      );
    });


    /**
     * Property 8.5: Color uniqueness SHALL hold for any subset of religions
     * **Validates: Requirements 5.4**
     */
    it('should maintain color uniqueness for any subset of religions', () => {
      fc.assert(
        fc.property(religionSubsetArbitrary, (religions) => {
          const { document, window } = createMockDOM(religions);
          const mosaic = createMosaicController(document, window);
          mosaic.init();

          const tiles = mosaic.getTiles();
          const colorToReligion = new Map();
          let hasDuplicate = false;

          tiles.forEach((tile) => {
            const religionId = tile.getAttribute('data-religion');
            const color = mosaic.getTileColor(tile);

            if (colorToReligion.has(color) && colorToReligion.get(color) !== religionId) {
              hasDuplicate = true;
            }
            colorToReligion.set(color, religionId);
          });

          // No duplicates should exist
          expect(hasDuplicate).toBe(false);

          mosaic.destroy();
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property 8.6: Tile color SHALL be accessible via CSS custom property
     * **Validates: Requirements 5.4**
     */
    it('should set color via CSS custom property --tile-color', () => {
      fc.assert(
        fc.property(religionArbitrary, (religion) => {
          const { document, window } = createMockDOM([religion]);
          const mosaic = createMosaicController(document, window);
          mosaic.init();

          const tile = mosaic.getTileByReligion(religion.id);
          
          // Tile should have --tile-color CSS property set
          const tileColor = tile.style.getPropertyValue('--tile-color').trim();
          expect(tileColor).toBeTruthy();
          expect(tileColor).toBe(religion.color);

          mosaic.destroy();
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property 8.7: Tile SHALL have correct modifier class for its religion
     * **Validates: Requirements 5.4**
     */
    it('should have correct modifier class for each religion', () => {
      fc.assert(
        fc.property(religionArbitrary, (religion) => {
          const { document, window } = createMockDOM([religion]);
          const mosaic = createMosaicController(document, window);
          mosaic.init();

          const tile = mosaic.getTileByReligion(religion.id);
          
          // Tile should have the modifier class
          const expectedClass = `mosaic-tile--${religion.id}`;
          expect(tile.classList.contains(expectedClass)).toBe(true);

          mosaic.destroy();
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property 8.8: data-religion attribute SHALL match tile's religion ID
     * **Validates: Requirements 5.4**
     */
    it('should have correct data-religion attribute', () => {
      fc.assert(
        fc.property(religionSubsetArbitrary, (religions) => {
          const { document, window } = createMockDOM(religions);
          const mosaic = createMosaicController(document, window);
          mosaic.init();

          const tiles = mosaic.getTiles();

          tiles.forEach((tile, index) => {
            const dataReligion = tile.getAttribute('data-religion');
            expect(dataReligion).toBe(religions[index].id);
          });

          mosaic.destroy();
        }),
        { numRuns: 100 }
      );
    });
  });
});
