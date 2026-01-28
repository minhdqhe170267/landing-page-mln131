/**
 * Lerp Utility - Linear Interpolation
 * Provides smooth interpolation between values for animations
 * 
 * @module animations/utils/lerp
 * @requires Requirements 4.1
 */

/**
 * Linear interpolation between two values
 * Formula: start + (end - start) * factor
 * 
 * @param {number} start - Starting value
 * @param {number} end - Ending value
 * @param {number} factor - Interpolation factor (0-1)
 * @returns {number} Interpolated value
 * 
 * @example
 * lerp(0, 100, 0.5) // Returns 50
 * lerp(10, 20, 0.25) // Returns 12.5
 */
export function lerp(start, end, factor) {
    return start + (end - start) * factor;
}

/**
 * Inverse lerp - find the factor given start, end, and value
 * 
 * @param {number} start - Starting value
 * @param {number} end - Ending value
 * @param {number} value - Value to find factor for
 * @returns {number} Factor (0-1) representing position between start and end
 * 
 * @example
 * inverseLerp(0, 100, 50) // Returns 0.5
 * inverseLerp(10, 20, 15) // Returns 0.5
 */
export function inverseLerp(start, end, value) {
    if (start === end) return 0;
    return (value - start) / (end - start);
}

/**
 * Clamp a value between min and max
 * 
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 * 
 * @example
 * clamp(150, 0, 100) // Returns 100
 * clamp(-10, 0, 100) // Returns 0
 */
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * Clamped lerp - lerp with factor clamped to 0-1
 * 
 * @param {number} start - Starting value
 * @param {number} end - Ending value
 * @param {number} factor - Interpolation factor (will be clamped to 0-1)
 * @returns {number} Interpolated value
 */
export function clampedLerp(start, end, factor) {
    return lerp(start, end, clamp(factor, 0, 1));
}

/**
 * Remap a value from one range to another
 * 
 * @param {number} value - Value to remap
 * @param {number} inMin - Input range minimum
 * @param {number} inMax - Input range maximum
 * @param {number} outMin - Output range minimum
 * @param {number} outMax - Output range maximum
 * @returns {number} Remapped value
 * 
 * @example
 * remap(50, 0, 100, 0, 1) // Returns 0.5
 * remap(0.5, 0, 1, 0, 255) // Returns 127.5
 */
export function remap(value, inMin, inMax, outMin, outMax) {
    const factor = inverseLerp(inMin, inMax, value);
    return lerp(outMin, outMax, factor);
}

/**
 * Smooth step interpolation (Hermite interpolation)
 * Provides smoother transitions than linear lerp
 * 
 * @param {number} start - Starting value
 * @param {number} end - Ending value
 * @param {number} factor - Interpolation factor (0-1)
 * @returns {number} Smoothly interpolated value
 */
export function smoothStep(start, end, factor) {
    const t = clamp(factor, 0, 1);
    const smoothT = t * t * (3 - 2 * t);
    return lerp(start, end, smoothT);
}

/**
 * Smoother step interpolation (Ken Perlin's improved version)
 * Even smoother than smoothStep
 * 
 * @param {number} start - Starting value
 * @param {number} end - Ending value
 * @param {number} factor - Interpolation factor (0-1)
 * @returns {number} Very smoothly interpolated value
 */
export function smootherStep(start, end, factor) {
    const t = clamp(factor, 0, 1);
    const smootherT = t * t * t * (t * (t * 6 - 15) + 10);
    return lerp(start, end, smootherT);
}

/**
 * Lerp with damping - useful for smooth following animations
 * 
 * @param {number} current - Current value
 * @param {number} target - Target value
 * @param {number} damping - Damping factor (0-1, lower = smoother)
 * @param {number} deltaTime - Time since last frame (in seconds)
 * @returns {number} New current value
 */
export function damp(current, target, damping, deltaTime) {
    return lerp(current, target, 1 - Math.exp(-damping * deltaTime));
}

export default {
    lerp,
    inverseLerp,
    clamp,
    clampedLerp,
    remap,
    smoothStep,
    smootherStep,
    damp
};
