/**
 * GPUAccelerator - GPU optimization utilities
 * Applies hardware acceleration to elements
 * 
 * Requirements:
 * - 1.1: Only use GPU-accelerated properties: transform, opacity, filter, backdrop-filter
 * - 1.2: Apply hardware acceleration with translateZ(0), will-change, backface-visibility: hidden
 * - 1.3: Add perspective: 1000px for 3D transforms
 * - 1.5: NOT use lag-causing properties: top, left, width, height, margin, padding
 */

/**
 * Set of GPU-accelerated CSS properties that are safe to animate
 * These properties are composited on the GPU and don't trigger layout/paint
 */
const GPU_ACCELERATED_PROPERTIES = new Set([
    'transform',
    'opacity',
    'filter',
    'backdrop-filter'
]);

/**
 * Set of properties that cause layout thrashing and should be avoided
 * These properties trigger expensive layout recalculations
 */
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

/**
 * GPUAccelerator class - Utility for GPU optimization
 * Provides static methods to apply hardware acceleration to DOM elements
 */
class GPUAccelerator {
    /**
     * Apply GPU acceleration to an element
     * Adds translateZ(0), backface-visibility: hidden, and perspective: 1000px
     * 
     * @param {HTMLElement} element - The DOM element to accelerate
     * @returns {boolean} - True if acceleration was applied, false if element is invalid
     * 
     * Validates: Requirements 1.2, 1.3
     */
    static accelerate(element) {
        if (!element || !(element instanceof HTMLElement)) {
            console.warn('GPUAccelerator.accelerate: Invalid element provided');
            return false;
        }

        // Apply translateZ(0) to force GPU layer creation
        // This creates a new compositor layer for the element
        element.style.transform = 'translateZ(0)';
        
        // Hide backface for better 3D performance
        element.style.backfaceVisibility = 'hidden';
        
        // Add perspective for 3D transforms
        element.style.perspective = '1000px';

        return true;
    }

    /**
     * Set will-change property for specific CSS properties
     * Only allows GPU-accelerated properties to be set
     * 
     * @param {HTMLElement} element - The DOM element
     * @param {string|string[]} properties - Property or array of properties to hint
     * @returns {boolean} - True if will-change was set, false otherwise
     * 
     * Validates: Requirements 1.1, 8.2
     */
    static setWillChange(element, properties) {
        if (!element || !(element instanceof HTMLElement)) {
            console.warn('GPUAccelerator.setWillChange: Invalid element provided');
            return false;
        }

        if (!properties) {
            console.warn('GPUAccelerator.setWillChange: No properties provided');
            return false;
        }

        // Normalize to array
        const propsArray = Array.isArray(properties) ? properties : [properties];
        
        // Filter to only GPU-accelerated properties
        const validProps = propsArray.filter(prop => {
            const isValid = GPUAccelerator.isGPUProperty(prop);
            if (!isValid) {
                console.warn(`GPUAccelerator.setWillChange: Property "${prop}" is not GPU-accelerated, skipping`);
            }
            return isValid;
        });

        if (validProps.length === 0) {
            console.warn('GPUAccelerator.setWillChange: No valid GPU properties provided');
            return false;
        }

        element.style.willChange = validProps.join(', ');
        return true;
    }

    /**
     * Clear will-change property from an element
     * Should be called after animations complete to free GPU memory
     * 
     * @param {HTMLElement} element - The DOM element
     * @returns {boolean} - True if will-change was cleared, false otherwise
     * 
     * Validates: Requirements 8.2, 8.3
     */
    static clearWillChange(element) {
        if (!element || !(element instanceof HTMLElement)) {
            console.warn('GPUAccelerator.clearWillChange: Invalid element provided');
            return false;
        }

        element.style.willChange = 'auto';
        return true;
    }

    /**
     * Check if a CSS property is GPU-accelerated
     * 
     * @param {string} property - The CSS property name to check
     * @returns {boolean} - True if the property is GPU-accelerated
     * 
     * Validates: Requirements 1.1, 1.5
     */
    static isGPUProperty(property) {
        if (typeof property !== 'string') {
            return false;
        }
        
        // Normalize property name (handle camelCase and kebab-case)
        const normalizedProp = property.toLowerCase().replace(/([A-Z])/g, '-$1').toLowerCase();
        
        return GPU_ACCELERATED_PROPERTIES.has(normalizedProp);
    }

    /**
     * Check if a CSS property is forbidden (causes layout thrashing)
     * 
     * @param {string} property - The CSS property name to check
     * @returns {boolean} - True if the property is forbidden
     * 
     * Validates: Requirements 1.5
     */
    static isForbiddenProperty(property) {
        if (typeof property !== 'string') {
            return false;
        }
        
        // Normalize property name
        const normalizedProp = property.toLowerCase().replace(/([A-Z])/g, '-$1').toLowerCase();
        
        return FORBIDDEN_PROPERTIES.has(normalizedProp);
    }

    /**
     * Get the set of GPU-accelerated properties
     * 
     * @returns {Set<string>} - Set of GPU-accelerated property names
     */
    static getGPUProperties() {
        return new Set(GPU_ACCELERATED_PROPERTIES);
    }

    /**
     * Get the set of forbidden properties
     * 
     * @returns {Set<string>} - Set of forbidden property names
     */
    static getForbiddenProperties() {
        return new Set(FORBIDDEN_PROPERTIES);
    }

    /**
     * Remove GPU acceleration from an element
     * Resets transform, backface-visibility, and perspective to initial values
     * 
     * @param {HTMLElement} element - The DOM element
     * @returns {boolean} - True if deceleration was applied, false otherwise
     * 
     * Validates: Requirements 8.3
     */
    static decelerate(element) {
        if (!element || !(element instanceof HTMLElement)) {
            console.warn('GPUAccelerator.decelerate: Invalid element provided');
            return false;
        }

        // Reset to initial values
        element.style.transform = '';
        element.style.backfaceVisibility = '';
        element.style.perspective = '';
        element.style.willChange = 'auto';

        return true;
    }

    /**
     * Apply GPU acceleration to multiple elements
     * 
     * @param {HTMLElement[]|NodeList} elements - Array or NodeList of elements
     * @returns {number} - Number of elements successfully accelerated
     */
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

    /**
     * Remove GPU acceleration from multiple elements
     * 
     * @param {HTMLElement[]|NodeList} elements - Array or NodeList of elements
     * @returns {number} - Number of elements successfully decelerated
     */
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

// Export for ES modules
export { GPUAccelerator, GPU_ACCELERATED_PROPERTIES, FORBIDDEN_PROPERTIES };

// Also export as default
export default GPUAccelerator;
