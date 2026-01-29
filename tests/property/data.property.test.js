/**
 * Property-Based Tests for Data Fetch and Render
 * Feature: vietnam-religious-diversity-landing
 * Property 13: Data Fetch and Render Consistency
 * 
 * **Validates: Requirements 13.2, 13.3, 13.4**
 */

const fc = require('fast-check');
const { DataFetcher } = require('../../js/main.js');

// ============================================
// ARBITRARIES (Test Data Generators)
// ============================================

/**
 * Generate valid site data
 */
const siteArbitrary = fc.record({
  title: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.string({ minLength: 1, maxLength: 500 })
});

/**
 * Generate valid stat item
 */
const statArbitrary = fc.record({
  id: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-z0-9-]+$/.test(s)),
  value: fc.integer({ min: 0, max: 1000000 }),
  label: fc.string({ minLength: 1, maxLength: 100 }),
  suffix: fc.string({ maxLength: 10 })
});

/**
 * Generate valid hex color
 */
const hexColorArbitrary = fc.hexaString({ minLength: 6, maxLength: 6 }).map(s => `#${s.toUpperCase()}`);

/**
 * Generate valid timeline period
 */
const timelinePeriodArbitrary = fc.record({
  id: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-z0-9-]+$/.test(s)),
  years: fc.string({ minLength: 1, maxLength: 20 }),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  summary: fc.string({ minLength: 1, maxLength: 300 }),
  details: fc.string({ minLength: 1, maxLength: 1000 }),
  image: fc.option(fc.string({ minLength: 0, maxLength: 200 }), { nil: '' })
});

/**
 * Generate valid religion tile
 */
const religionArbitrary = fc.record({
  id: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-z0-9-]+$/.test(s)),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  color: hexColorArbitrary,
  icon: fc.option(fc.string({ minLength: 0, maxLength: 200 }), { nil: '' }),
  followers: fc.string({ minLength: 1, maxLength: 50 }),
  description: fc.string({ minLength: 1, maxLength: 500 })
});

/**
 * Generate valid principle
 */
const principleArbitrary = fc.record({
  id: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-z0-9-]+$/.test(s)),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  icon: fc.option(fc.string({ minLength: 0, maxLength: 200 }), { nil: '' }),
  description: fc.string({ minLength: 1, maxLength: 500 })
});

/**
 * Generate valid guideline
 */
const guidelineArbitrary = fc.record({
  id: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-z0-9-]+$/.test(s)),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  content: fc.string({ minLength: 1, maxLength: 1000 })
});

/**
 * Generate valid testimonial
 */
const testimonialArbitrary = fc.record({
  id: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-z0-9-]+$/.test(s)),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  major: fc.string({ minLength: 1, maxLength: 100 }),
  quote: fc.string({ minLength: 1, maxLength: 500 }),
  avatar: fc.option(fc.string({ minLength: 0, maxLength: 200 }), { nil: '' })
});

/**
 * Generate valid reference
 */
const referenceArbitrary = fc.record({
  id: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-z0-9-]+$/.test(s)),
  title: fc.string({ minLength: 1, maxLength: 200 }),
  source: fc.string({ minLength: 1, maxLength: 200 }),
  year: fc.string({ minLength: 4, maxLength: 4 }).filter(s => /^\d{4}$/.test(s)),
  url: fc.option(fc.string({ minLength: 0, maxLength: 500 }), { nil: '' })
});

/**
 * Generate complete valid SiteData
 */
const validSiteDataArbitrary = fc.record({
  site: siteArbitrary,
  stats: fc.array(statArbitrary, { minLength: 1, maxLength: 10 }),
  timeline: fc.array(timelinePeriodArbitrary, { minLength: 1, maxLength: 10 }),
  religions: fc.array(religionArbitrary, { minLength: 1, maxLength: 10 }),
  principles: fc.array(principleArbitrary, { minLength: 1, maxLength: 10 }),
  guidelines: fc.array(guidelineArbitrary, { minLength: 1, maxLength: 10 }),
  testimonials: fc.array(testimonialArbitrary, { minLength: 1, maxLength: 10 }),
  references: fc.array(referenceArbitrary, { minLength: 1, maxLength: 10 })
});

/**
 * Generate invalid data (missing required properties)
 */
const invalidDataArbitrary = fc.oneof(
  // Missing site
  fc.record({
    stats: fc.array(statArbitrary),
    timeline: fc.array(timelinePeriodArbitrary),
    religions: fc.array(religionArbitrary),
    principles: fc.array(principleArbitrary),
    guidelines: fc.array(guidelineArbitrary),
    testimonials: fc.array(testimonialArbitrary),
    references: fc.array(referenceArbitrary)
  }),
  // Invalid site structure
  fc.record({
    site: fc.constant({ title: 123 }), // Invalid type
    stats: fc.array(statArbitrary),
    timeline: fc.array(timelinePeriodArbitrary),
    religions: fc.array(religionArbitrary),
    principles: fc.array(principleArbitrary),
    guidelines: fc.array(guidelineArbitrary),
    testimonials: fc.array(testimonialArbitrary),
    references: fc.array(referenceArbitrary)
  }),
  // Non-array timeline
  fc.record({
    site: siteArbitrary,
    stats: fc.array(statArbitrary),
    timeline: fc.constant('not an array'),
    religions: fc.array(religionArbitrary),
    principles: fc.array(principleArbitrary),
    guidelines: fc.array(guidelineArbitrary),
    testimonials: fc.array(testimonialArbitrary),
    references: fc.array(referenceArbitrary)
  }),
  // Null data
  fc.constant(null),
  // Non-object data
  fc.constant('string data'),
  fc.constant(123)
);

// ============================================
// PROPERTY TESTS
// ============================================

describe('Feature: vietnam-religious-diversity-landing', () => {
  describe('Property 13: Data Fetch and Render Consistency', () => {
    
    /**
     * Property 13.1: Valid data SHALL be validated successfully
     * **Validates: Requirements 13.4**
     */
    it('should validate valid data structures correctly', () => {
      fc.assert(
        fc.property(validSiteDataArbitrary, (validData) => {
          const result = DataFetcher.validateData(validData);
          expect(result).toBe(true);
        }),
        { numRuns: 10 }
      );
    });

    /**
     * Property 13.2: Invalid data SHALL fail validation
     * **Validates: Requirements 13.4**
     */
    it('should reject invalid data structures', () => {
      fc.assert(
        fc.property(invalidDataArbitrary, (invalidData) => {
          // Suppress console warnings during test
          const originalWarn = console.warn;
          console.warn = jest.fn();
          
          const result = DataFetcher.validateData(invalidData);
          
          console.warn = originalWarn;
          expect(result).toBe(false);
        }),
        { numRuns: 10 }
      );
    });

    /**
     * Property 13.3: Fallback data SHALL always be valid
     * **Validates: Requirements 13.3**
     */
    it('should always return valid fallback data', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const fallbackData = DataFetcher.getFallbackData();
          
          // Fallback data should pass validation
          expect(DataFetcher.validateData(fallbackData)).toBe(true);
          
          // Fallback data should have all required properties
          expect(fallbackData).toHaveProperty('site');
          expect(fallbackData).toHaveProperty('stats');
          expect(fallbackData).toHaveProperty('timeline');
          expect(fallbackData).toHaveProperty('religions');
          expect(fallbackData).toHaveProperty('principles');
          expect(fallbackData).toHaveProperty('guidelines');
          expect(fallbackData).toHaveProperty('testimonials');
          expect(fallbackData).toHaveProperty('references');
          
          // Arrays should not be empty
          expect(fallbackData.stats.length).toBeGreaterThan(0);
          expect(fallbackData.timeline.length).toBeGreaterThan(0);
          expect(fallbackData.religions.length).toBeGreaterThan(0);
        }),
        { numRuns: 5 }
      );
    });

    /**
     * Property 13.4: Timeline items SHALL have required fields
     * **Validates: Requirements 13.4**
     */
    it('should validate timeline items have all required fields', () => {
      fc.assert(
        fc.property(timelinePeriodArbitrary, (timelineItem) => {
          const result = DataFetcher.validateTimelineItem(timelineItem);
          expect(result).toBe(true);
          
          // Verify required fields exist
          expect(typeof timelineItem.id).toBe('string');
          expect(typeof timelineItem.years).toBe('string');
          expect(typeof timelineItem.title).toBe('string');
          expect(typeof timelineItem.summary).toBe('string');
          expect(typeof timelineItem.details).toBe('string');
        }),
        { numRuns: 10 }
      );
    });

    /**
     * Property 13.5: Religion items SHALL have valid color format
     * **Validates: Requirements 13.4**
     */
    it('should validate religion items have valid hex color format', () => {
      fc.assert(
        fc.property(religionArbitrary, (religionItem) => {
          const result = DataFetcher.validateReligionItem(religionItem);
          expect(result).toBe(true);
          
          // Verify color is valid hex format
          expect(religionItem.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
        }),
        { numRuns: 10 }
      );
    });

    /**
     * Property 13.6: Stat items SHALL have numeric values
     * **Validates: Requirements 13.4**
     */
    it('should validate stat items have numeric values', () => {
      fc.assert(
        fc.property(statArbitrary, (statItem) => {
          const result = DataFetcher.validateStatItem(statItem);
          expect(result).toBe(true);
          
          // Verify value is a number
          expect(typeof statItem.value).toBe('number');
          expect(typeof statItem.id).toBe('string');
          expect(typeof statItem.label).toBe('string');
        }),
        { numRuns: 10 }
      );
    });

    /**
     * Property 13.7: Invalid timeline items SHALL fail validation
     * **Validates: Requirements 13.4**
     */
    it('should reject timeline items with missing required fields', () => {
      const invalidTimelineItems = [
        { id: 'test' }, // Missing years, title, summary, details
        { id: 'test', years: '2020' }, // Missing title, summary, details
        { id: 123, years: '2020', title: 'Test', summary: 'Sum', details: 'Det' }, // Invalid id type
        { id: 'test', years: 2020, title: 'Test', summary: 'Sum', details: 'Det' }, // Invalid years type
      ];

      // Suppress console warnings during test
      const originalWarn = console.warn;
      console.warn = jest.fn();

      invalidTimelineItems.forEach(item => {
        expect(DataFetcher.validateTimelineItem(item)).toBe(false);
      });

      console.warn = originalWarn;
    });

    /**
     * Property 13.8: Invalid religion items SHALL fail validation
     * **Validates: Requirements 13.4**
     */
    it('should reject religion items with invalid color format', () => {
      const invalidReligionItems = [
        { id: 'test', name: 'Test', color: 'red', followers: '100', description: 'Desc' }, // Invalid color
        { id: 'test', name: 'Test', color: '#FFF', followers: '100', description: 'Desc' }, // Short hex
        { id: 'test', name: 'Test', color: '#GGGGGG', followers: '100', description: 'Desc' }, // Invalid hex chars
        { id: 'test', name: 'Test', color: 'FFD700', followers: '100', description: 'Desc' }, // Missing #
      ];

      // Suppress console warnings during test
      const originalWarn = console.warn;
      console.warn = jest.fn();

      invalidReligionItems.forEach(item => {
        expect(DataFetcher.validateReligionItem(item)).toBe(false);
      });

      console.warn = originalWarn;
    });

    /**
     * Property 13.9: Data with empty arrays SHALL still be valid
     * **Validates: Requirements 13.4**
     */
    it('should accept data with empty arrays', () => {
      const dataWithEmptyArrays = {
        site: { title: 'Test', description: 'Test description' },
        stats: [],
        timeline: [],
        religions: [],
        principles: [],
        guidelines: [],
        testimonials: [],
        references: []
      };

      expect(DataFetcher.validateData(dataWithEmptyArrays)).toBe(true);
    });

    /**
     * Property 13.10: Error handler SHALL be called on fetch failure
     * **Validates: Requirements 13.3**
     */
    it('should call error handler and return fallback on fetch failure', async () => {
      // Mock fetch to fail
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
      
      const errorSpy = jest.spyOn(DataFetcher, 'handleError');
      const fallbackSpy = jest.spyOn(DataFetcher, 'getFallbackData');
      
      const result = await DataFetcher.fetchData('http://invalid-url.com/data.json');
      
      expect(errorSpy).toHaveBeenCalled();
      expect(fallbackSpy).toHaveBeenCalled();
      expect(DataFetcher.validateData(result)).toBe(true);
      
      errorSpy.mockRestore();
      fallbackSpy.mockRestore();
    });

    /**
     * Property 13.11: Successful fetch SHALL return validated data
     * **Validates: Requirements 13.2, 13.4**
     */
    it('should return fetched data when fetch succeeds with valid data', async () => {
      fc.assert(
        fc.asyncProperty(validSiteDataArbitrary, async (validData) => {
          // Mock successful fetch
          global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(validData)
          });
          
          const result = await DataFetcher.fetchData('http://test.com/data.json');
          
          expect(result).toEqual(validData);
          expect(DataFetcher.validateData(result)).toBe(true);
        }),
        { numRuns: 5 }
      );
    });

    /**
     * Property 13.12: HTTP error SHALL trigger fallback
     * **Validates: Requirements 13.3**
     */
    it('should return fallback data on HTTP error', async () => {
      const httpErrors = [400, 401, 403, 404, 500, 502, 503];
      
      for (const status of httpErrors) {
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: status
        });
        
        // Suppress console errors during test
        const originalError = console.error;
        console.error = jest.fn();
        
        const result = await DataFetcher.fetchData('http://test.com/data.json');
        
        console.error = originalError;
        
        expect(DataFetcher.validateData(result)).toBe(true);
        expect(result).toEqual(DataFetcher.getFallbackData());
      }
    });

    /**
     * Property 13.13: Invalid JSON response SHALL trigger fallback
     * **Validates: Requirements 13.3, 13.4**
     */
    it('should return fallback data when response contains invalid data', async () => {
      fc.assert(
        fc.asyncProperty(invalidDataArbitrary, async (invalidData) => {
          global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(invalidData)
          });
          
          // Suppress console warnings/errors during test
          const originalWarn = console.warn;
          const originalError = console.error;
          console.warn = jest.fn();
          console.error = jest.fn();
          
          const result = await DataFetcher.fetchData('http://test.com/data.json');
          
          console.warn = originalWarn;
          console.error = originalError;
          
          // Should return fallback data
          expect(DataFetcher.validateData(result)).toBe(true);
        }),
        { numRuns: 5 }
      );
    });
  });
});
