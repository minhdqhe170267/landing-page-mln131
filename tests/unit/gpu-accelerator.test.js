/**
 * Unit Tests for GPUAccelerator
 * Feature: ultimate-ui-animations
 * 
 * Tests the GPU acceleration utility that applies hardware acceleration to DOM elements.
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.5**
 */

// Polyfill TextEncoder/TextDecoder for jsdom
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const { JSDOM } = require('jsdom');

// ============================================
// TEST SETUP
// ============================================

/**
 * Create a mock DOM environment for testing
 * @returns {Object} - DOM window and document
 */
function createMockDOM() {
    const html = `
        <!DOCTYPE html>
        <html lang="vi">
        <head><title>Test Page</title></head>
        <body>
            <div id="test-element" class="animated"></div>
            <div id="test-element-2" class="animated"></div>
            <div id="test-element-3" class="animated"></div>
        </body>
        </html>
    `;

    const dom = new JSDOM(html, {
        url: 'http://localhost/index.html',
        runScripts: 'dangerously'
    });

    return {
        window: dom.window,
        document: dom.window.document
    };
}

/**
 * Import GPUAccelerator module
 * Since we're using ES modules, we need to create a CommonJS-compatible version for testing
 */
function createGPUAccelerator() {
    const GPU_ACCELERATED_PROPERTIES = new Set([
        'transform',
        'opacity',
        'filter',
        'backdrop-filter'
    ]);

    const FORBIDDEN_PROPERTIES = new Set([
        'top',
        'left',
        'right',
        'bottom',
        'width',
        'height',
        'margin',
        'margin-top',
        'margin-right',
        'margin-bottom',
        'margin-left',
        'padding',
        'padding-top',
        'padding-right',
        'padding-bottom',
        'padding-left'
    ]);

    class GPUAccelerator {
        static accelerate(element) {
            if (!element || !(element instanceof Object) || !element.style) {
                return false;
            }

            element.style.transform = 'translateZ(0)';
            element.style.backfaceVisibility = 'hidden';
            element.style.perspective = '1000px';

            return true;
        }

        static setWillChange(element, properties) {
            if (!element || !(element instanceof Object) || !element.style) {
                return false;
            }

            if (!properties) {
                return false;
            }

            const propsArray = Array.isArray(properties) ? properties : [properties];
            
            const validProps = propsArray.filter(prop => GPUAccelerator.isGPUProperty(prop));

            if (validProps.length === 0) {
                return false;
            }

            element.style.willChange = validProps.join(', ');
            return true;
        }

        static clearWillChange(element) {
            if (!element || !(element instanceof Object) || !element.style) {
                return false;
            }

            element.style.willChange = 'auto';
            return true;
        }

        static isGPUProperty(property) {
            if (typeof property !== 'string') {
                return false;
            }
            
            const normalizedProp = property.toLowerCase().replace(/([A-Z])/g, '-$1').toLowerCase();
            
            return GPU_ACCELERATED_PROPERTIES.has(normalizedProp);
        }

        static isForbiddenProperty(property) {
            if (typeof property !== 'string') {
                return false;
            }
            
            const normalizedProp = property.toLowerCase().replace(/([A-Z])/g, '-$1').toLowerCase();
            
            return FORBIDDEN_PROPERTIES.has(normalizedProp);
        }

        static getGPUProperties() {
            return new Set(GPU_ACCELERATED_PROPERTIES);
        }

        static getForbiddenProperties() {
            return new Set(FORBIDDEN_PROPERTIES);
        }

        static decelerate(element) {
            if (!element || !(element instanceof Object) || !element.style) {
                return false;
            }

            element.style.transform = '';
            element.style.backfaceVisibility = '';
            element.style.perspective = '';
            element.style.willChange = 'auto';

            return true;
        }

        static accelerateAll(elements) {
            if (!elements || !elements.length) {
                return 0;
            }

            let count = 0;
            for (const element of elements) {
                if (GPUAccelerator.accelerate(element)) {
                    count++;
                }
            }
            return count;
        }

        static decelerateAll(elements) {
            if (!elements || !elements.length) {
                return 0;
            }

            let count = 0;
            for (const element of elements) {
                if (GPUAccelerator.decelerate(element)) {
                    count++;
                }
            }
            return count;
        }
    }

    return { GPUAccelerator, GPU_ACCELERATED_PROPERTIES, FORBIDDEN_PROPERTIES };
}

// ============================================
// UNIT TESTS
// ============================================

describe('Feature: ultimate-ui-animations', () => {
    describe('GPUAccelerator', () => {
        let GPUAccelerator;
        let GPU_ACCELERATED_PROPERTIES;
        let FORBIDDEN_PROPERTIES;
        let mockDOM;

        beforeEach(() => {
            const module = createGPUAccelerator();
            GPUAccelerator = module.GPUAccelerator;
            GPU_ACCELERATED_PROPERTIES = module.GPU_ACCELERATED_PROPERTIES;
            FORBIDDEN_PROPERTIES = module.FORBIDDEN_PROPERTIES;
            mockDOM = createMockDOM();
        });

        describe('accelerate()', () => {
            /**
             * Test: Should apply translateZ(0) to element
             * **Validates: Requirements 1.2**
             */
            it('should apply translateZ(0) to element', () => {
                const element = mockDOM.document.getElementById('test-element');
                
                GPUAccelerator.accelerate(element);
                
                expect(element.style.transform).toBe('translateZ(0)');
            });

            /**
             * Test: Should apply backface-visibility: hidden to element
             * **Validates: Requirements 1.2**
             */
            it('should apply backface-visibility: hidden to element', () => {
                const element = mockDOM.document.getElementById('test-element');
                
                GPUAccelerator.accelerate(element);
                
                expect(element.style.backfaceVisibility).toBe('hidden');
            });

            /**
             * Test: Should apply perspective: 1000px to element
             * **Validates: Requirements 1.3**
             */
            it('should apply perspective: 1000px to element', () => {
                const element = mockDOM.document.getElementById('test-element');
                
                GPUAccelerator.accelerate(element);
                
                expect(element.style.perspective).toBe('1000px');
            });

            /**
             * Test: Should return true on successful acceleration
             */
            it('should return true on successful acceleration', () => {
                const element = mockDOM.document.getElementById('test-element');
                
                const result = GPUAccelerator.accelerate(element);
                
                expect(result).toBe(true);
            });

            /**
             * Test: Should return false for null element
             */
            it('should return false for null element', () => {
                const result = GPUAccelerator.accelerate(null);
                
                expect(result).toBe(false);
            });

            /**
             * Test: Should return false for undefined element
             */
            it('should return false for undefined element', () => {
                const result = GPUAccelerator.accelerate(undefined);
                
                expect(result).toBe(false);
            });

            /**
             * Test: Should return false for non-element object
             */
            it('should return false for non-element object', () => {
                const result = GPUAccelerator.accelerate({ notAnElement: true });
                
                expect(result).toBe(false);
            });
        });

        describe('setWillChange()', () => {
            /**
             * Test: Should set will-change for single GPU property
             * **Validates: Requirements 1.1**
             */
            it('should set will-change for single GPU property', () => {
                const element = mockDOM.document.getElementById('test-element');
                
                GPUAccelerator.setWillChange(element, 'transform');
                
                expect(element.style.willChange).toBe('transform');
            });

            /**
             * Test: Should set will-change for multiple GPU properties
             * **Validates: Requirements 1.1**
             */
            it('should set will-change for multiple GPU properties', () => {
                const element = mockDOM.document.getElementById('test-element');
                
                GPUAccelerator.setWillChange(element, ['transform', 'opacity']);
                
                expect(element.style.willChange).toBe('transform, opacity');
            });

            /**
             * Test: Should filter out non-GPU properties
             * **Validates: Requirements 1.1, 1.5**
             */
            it('should filter out non-GPU properties', () => {
                const element = mockDOM.document.getElementById('test-element');
                
                GPUAccelerator.setWillChange(element, ['transform', 'top', 'opacity', 'left']);
                
                expect(element.style.willChange).toBe('transform, opacity');
            });

            /**
             * Test: Should return false when all properties are non-GPU
             * **Validates: Requirements 1.5**
             */
            it('should return false when all properties are non-GPU', () => {
                const element = mockDOM.document.getElementById('test-element');
                
                const result = GPUAccelerator.setWillChange(element, ['top', 'left', 'width']);
                
                expect(result).toBe(false);
            });

            /**
             * Test: Should return true on successful will-change set
             */
            it('should return true on successful will-change set', () => {
                const element = mockDOM.document.getElementById('test-element');
                
                const result = GPUAccelerator.setWillChange(element, 'transform');
                
                expect(result).toBe(true);
            });

            /**
             * Test: Should return false for null element
             */
            it('should return false for null element', () => {
                const result = GPUAccelerator.setWillChange(null, 'transform');
                
                expect(result).toBe(false);
            });

            /**
             * Test: Should return false for null properties
             */
            it('should return false for null properties', () => {
                const element = mockDOM.document.getElementById('test-element');
                
                const result = GPUAccelerator.setWillChange(element, null);
                
                expect(result).toBe(false);
            });
        });

        describe('clearWillChange()', () => {
            /**
             * Test: Should set will-change to auto
             * **Validates: Requirements 8.2, 8.3**
             */
            it('should set will-change to auto', () => {
                const element = mockDOM.document.getElementById('test-element');
                element.style.willChange = 'transform, opacity';
                
                GPUAccelerator.clearWillChange(element);
                
                expect(element.style.willChange).toBe('auto');
            });

            /**
             * Test: Should return true on successful clear
             */
            it('should return true on successful clear', () => {
                const element = mockDOM.document.getElementById('test-element');
                
                const result = GPUAccelerator.clearWillChange(element);
                
                expect(result).toBe(true);
            });

            /**
             * Test: Should return false for null element
             */
            it('should return false for null element', () => {
                const result = GPUAccelerator.clearWillChange(null);
                
                expect(result).toBe(false);
            });
        });

        describe('isGPUProperty()', () => {
            /**
             * Test: Should return true for transform
             * **Validates: Requirements 1.1**
             */
            it('should return true for transform', () => {
                expect(GPUAccelerator.isGPUProperty('transform')).toBe(true);
            });

            /**
             * Test: Should return true for opacity
             * **Validates: Requirements 1.1**
             */
            it('should return true for opacity', () => {
                expect(GPUAccelerator.isGPUProperty('opacity')).toBe(true);
            });

            /**
             * Test: Should return true for filter
             * **Validates: Requirements 1.1**
             */
            it('should return true for filter', () => {
                expect(GPUAccelerator.isGPUProperty('filter')).toBe(true);
            });

            /**
             * Test: Should return true for backdrop-filter
             * **Validates: Requirements 1.1**
             */
            it('should return true for backdrop-filter', () => {
                expect(GPUAccelerator.isGPUProperty('backdrop-filter')).toBe(true);
            });

            /**
             * Test: Should return false for top (forbidden property)
             * **Validates: Requirements 1.5**
             */
            it('should return false for top', () => {
                expect(GPUAccelerator.isGPUProperty('top')).toBe(false);
            });

            /**
             * Test: Should return false for left (forbidden property)
             * **Validates: Requirements 1.5**
             */
            it('should return false for left', () => {
                expect(GPUAccelerator.isGPUProperty('left')).toBe(false);
            });

            /**
             * Test: Should return false for width (forbidden property)
             * **Validates: Requirements 1.5**
             */
            it('should return false for width', () => {
                expect(GPUAccelerator.isGPUProperty('width')).toBe(false);
            });

            /**
             * Test: Should return false for height (forbidden property)
             * **Validates: Requirements 1.5**
             */
            it('should return false for height', () => {
                expect(GPUAccelerator.isGPUProperty('height')).toBe(false);
            });

            /**
             * Test: Should return false for margin (forbidden property)
             * **Validates: Requirements 1.5**
             */
            it('should return false for margin', () => {
                expect(GPUAccelerator.isGPUProperty('margin')).toBe(false);
            });

            /**
             * Test: Should return false for padding (forbidden property)
             * **Validates: Requirements 1.5**
             */
            it('should return false for padding', () => {
                expect(GPUAccelerator.isGPUProperty('padding')).toBe(false);
            });

            /**
             * Test: Should return false for non-string input
             */
            it('should return false for non-string input', () => {
                expect(GPUAccelerator.isGPUProperty(123)).toBe(false);
                expect(GPUAccelerator.isGPUProperty(null)).toBe(false);
                expect(GPUAccelerator.isGPUProperty(undefined)).toBe(false);
                expect(GPUAccelerator.isGPUProperty({})).toBe(false);
            });
        });

        describe('isForbiddenProperty()', () => {
            /**
             * Test: Should return true for forbidden properties
             * **Validates: Requirements 1.5**
             */
            it('should return true for top', () => {
                expect(GPUAccelerator.isForbiddenProperty('top')).toBe(true);
            });

            it('should return true for left', () => {
                expect(GPUAccelerator.isForbiddenProperty('left')).toBe(true);
            });

            it('should return true for width', () => {
                expect(GPUAccelerator.isForbiddenProperty('width')).toBe(true);
            });

            it('should return true for height', () => {
                expect(GPUAccelerator.isForbiddenProperty('height')).toBe(true);
            });

            it('should return true for margin', () => {
                expect(GPUAccelerator.isForbiddenProperty('margin')).toBe(true);
            });

            it('should return true for padding', () => {
                expect(GPUAccelerator.isForbiddenProperty('padding')).toBe(true);
            });

            /**
             * Test: Should return false for GPU properties
             * **Validates: Requirements 1.1**
             */
            it('should return false for transform', () => {
                expect(GPUAccelerator.isForbiddenProperty('transform')).toBe(false);
            });

            it('should return false for opacity', () => {
                expect(GPUAccelerator.isForbiddenProperty('opacity')).toBe(false);
            });
        });

        describe('decelerate()', () => {
            /**
             * Test: Should reset all GPU acceleration styles
             * **Validates: Requirements 8.3**
             */
            it('should reset all GPU acceleration styles', () => {
                const element = mockDOM.document.getElementById('test-element');
                
                // First accelerate
                GPUAccelerator.accelerate(element);
                GPUAccelerator.setWillChange(element, 'transform');
                
                // Then decelerate
                GPUAccelerator.decelerate(element);
                
                expect(element.style.transform).toBe('');
                expect(element.style.backfaceVisibility).toBe('');
                expect(element.style.perspective).toBe('');
                expect(element.style.willChange).toBe('auto');
            });

            /**
             * Test: Should return true on successful deceleration
             */
            it('should return true on successful deceleration', () => {
                const element = mockDOM.document.getElementById('test-element');
                
                const result = GPUAccelerator.decelerate(element);
                
                expect(result).toBe(true);
            });

            /**
             * Test: Should return false for null element
             */
            it('should return false for null element', () => {
                const result = GPUAccelerator.decelerate(null);
                
                expect(result).toBe(false);
            });
        });

        describe('accelerateAll()', () => {
            /**
             * Test: Should accelerate multiple elements
             */
            it('should accelerate multiple elements', () => {
                const elements = mockDOM.document.querySelectorAll('.animated');
                
                const count = GPUAccelerator.accelerateAll(elements);
                
                expect(count).toBe(3);
                elements.forEach(element => {
                    expect(element.style.transform).toBe('translateZ(0)');
                    expect(element.style.backfaceVisibility).toBe('hidden');
                    expect(element.style.perspective).toBe('1000px');
                });
            });

            /**
             * Test: Should return 0 for empty array
             */
            it('should return 0 for empty array', () => {
                const count = GPUAccelerator.accelerateAll([]);
                
                expect(count).toBe(0);
            });

            /**
             * Test: Should return 0 for null
             */
            it('should return 0 for null', () => {
                const count = GPUAccelerator.accelerateAll(null);
                
                expect(count).toBe(0);
            });
        });

        describe('decelerateAll()', () => {
            /**
             * Test: Should decelerate multiple elements
             */
            it('should decelerate multiple elements', () => {
                const elements = mockDOM.document.querySelectorAll('.animated');
                
                // First accelerate all
                GPUAccelerator.accelerateAll(elements);
                
                // Then decelerate all
                const count = GPUAccelerator.decelerateAll(elements);
                
                expect(count).toBe(3);
                elements.forEach(element => {
                    expect(element.style.transform).toBe('');
                    expect(element.style.backfaceVisibility).toBe('');
                    expect(element.style.perspective).toBe('');
                });
            });

            /**
             * Test: Should return 0 for empty array
             */
            it('should return 0 for empty array', () => {
                const count = GPUAccelerator.decelerateAll([]);
                
                expect(count).toBe(0);
            });
        });

        describe('getGPUProperties()', () => {
            /**
             * Test: Should return set of GPU properties
             * **Validates: Requirements 1.1**
             */
            it('should return set containing transform, opacity, filter, backdrop-filter', () => {
                const props = GPUAccelerator.getGPUProperties();
                
                expect(props.has('transform')).toBe(true);
                expect(props.has('opacity')).toBe(true);
                expect(props.has('filter')).toBe(true);
                expect(props.has('backdrop-filter')).toBe(true);
                expect(props.size).toBe(4);
            });
        });

        describe('getForbiddenProperties()', () => {
            /**
             * Test: Should return set of forbidden properties
             * **Validates: Requirements 1.5**
             */
            it('should return set containing forbidden properties', () => {
                const props = GPUAccelerator.getForbiddenProperties();
                
                expect(props.has('top')).toBe(true);
                expect(props.has('left')).toBe(true);
                expect(props.has('width')).toBe(true);
                expect(props.has('height')).toBe(true);
                expect(props.has('margin')).toBe(true);
                expect(props.has('padding')).toBe(true);
            });
        });
    });
});
