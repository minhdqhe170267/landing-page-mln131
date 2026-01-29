/**
 * Easing Functions - Animation Timing Functions
 * Provides various easing curves for smooth animations
 * 
 * @module animations/utils/easing
 * 
 * All functions take a progress value t (0-1) and return the eased value (0-1)
 * Reference: https://easings.net/
 */

// Constants for easing calculations
const PI = Math.PI;
const c1 = 1.70158;
const c2 = c1 * 1.525;
const c3 = c1 + 1;
const c4 = (2 * PI) / 3;
const c5 = (2 * PI) / 4.5;

/**
 * Linear - no easing
 * @param {number} t - Progress (0-1)
 * @returns {number} Eased value (0-1)
 */
export function linear(t) {
    return t;
}

// ============================================
// Sine Easing Functions
// ============================================

/**
 * Ease In Sine - slow start
 * @param {number} t - Progress (0-1)
 * @returns {number} Eased value (0-1)
 */
export function easeInSine(t) {
    return 1 - Math.cos((t * PI) / 2);
}

/**
 * Ease Out Sine - slow end
 * @param {number} t - Progress (0-1)
 * @returns {number} Eased value (0-1)
 */
export function easeOutSine(t) {
    return Math.sin((t * PI) / 2);
}

/**
 * Ease In Out Sine - slow start and end
 * @param {number} t - Progress (0-1)
 * @returns {number} Eased value (0-1)
 */
export function easeInOutSine(t) {
    return -(Math.cos(PI * t) - 1) / 2;
}

// ============================================
// Quadratic Easing Functions
// ============================================

/**
 * Ease In Quad - accelerating from zero velocity
 * @param {number} t - Progress (0-1)
 * @returns {number} Eased value (0-1)
 */
export function easeInQuad(t) {
    return t * t;
}

/**
 * Ease Out Quad - decelerating to zero velocity
 * @param {number} t - Progress (0-1)
 * @returns {number} Eased value (0-1)
 */
export function easeOutQuad(t) {
    return 1 - (1 - t) * (1 - t);
}

/**
 * Ease In Out Quad - acceleration until halfway, then deceleration
 * @param {number} t - Progress (0-1)
 * @returns {number} Eased value (0-1)
 */
export function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

// ============================================
// Cubic Easing Functions
// ============================================

/**
 * Ease In Cubic - accelerating from zero velocity (stronger)
 * @param {number} t - Progress (0-1)
 * @returns {number} Eased value (0-1)
 */
export function easeInCubic(t) {
    return t * t * t;
}

/**
 * Ease Out Cubic - decelerating to zero velocity (stronger)
 * @param {number} t - Progress (0-1)
 * @returns {number} Eased value (0-1)
 */
export function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

/**
 * Ease In Out Cubic - acceleration until halfway, then deceleration (stronger)
 * @param {number} t - Progress (0-1)
 * @returns {number} Eased value (0-1)
 */
export function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ============================================
// Quartic Easing Functions
// ============================================

/**
 * Ease In Quart
 * @param {number} t - Progress (0-1)
 * @returns {number} Eased value (0-1)
 */
export function easeInQuart(t) {
    return t * t * t * t;
}

/**
 * Ease Out Quart
 * @param {number} t - Progress (0-1)
 * @returns {number} Eased value (0-1)
 */
export function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
}

/**
 * Ease In Out Quart
 * @param {number} t - Progress (0-1)
 * @returns {number} Eased value (0-1)
 */
export function easeInOutQuart(t) {
    return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
}

// ============================================
// Quintic Easing Functions
// ============================================

/**
 * Ease In Quint
 * @param {number} t - Progress (0-1)
 * @returns {number} Eased value (0-1)
 */
export function easeInQuint(t) {
    return t * t * t * t * t;
}

/**
 * Ease Out Quint
 * @param {number} t - Progress (0-1)
 * @returns {number} Eased value (0-1)
 */
export function easeOutQuint(t) {
    return 1 - Math.pow(1 - t, 5);
}

/**
 * Ease In Out Quint
 * @param {number} t - Progress (0-1)
 * @returns {number} Eased value (0-1)
 */
export function easeInOutQuint(t) {
    return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
}

// ============================================
// Exponential Easing Functions
// ============================================

/**
 * Ease In Expo - exponential acceleration
 * @param {number} t - Progress (0-1)
 * @returns {number} Eased value (0-1)
 */
export function easeInExpo(t) {
    return t === 0 ? 0 : Math.pow(2, 10 * t - 10);
}

/**
 * Ease Out Expo - exponential deceleration
 * @param {number} t - Progress (0-1)
 * @returns {number} Eased value (0-1)
 */
export function easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

/**
 * Ease In Out Expo
 * @param {number} t - Progress (0-1)
 * @returns {number} Eased value (0-1)
 */
export function easeInOutExpo(t) {
    return t === 0
        ? 0
        : t === 1
        ? 1
        : t < 0.5
        ? Math.pow(2, 20 * t - 10) / 2
        : (2 - Math.pow(2, -20 * t + 10)) / 2;
}

// ============================================
// Circular Easing Functions
// ============================================

/**
 * Ease In Circ - circular acceleration
 * @param {number} t - Progress (0-1)
 * @returns {number} Eased value (0-1)
 */
export function easeInCirc(t) {
    return 1 - Math.sqrt(1 - Math.pow(t, 2));
}

/**
 * Ease Out Circ - circular deceleration
 * @param {number} t - Progress (0-1)
 * @returns {number} Eased value (0-1)
 */
export function easeOutCirc(t) {
    return Math.sqrt(1 - Math.pow(t - 1, 2));
}

/**
 * Ease In Out Circ
 * @param {number} t - Progress (0-1)
 * @returns {number} Eased value (0-1)
 */
export function easeInOutCirc(t) {
    return t < 0.5
        ? (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2
        : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2;
}

// ============================================
// Back Easing Functions (Overshoot)
// ============================================

/**
 * Ease In Back - slight overshoot at start
 * @param {number} t - Progress (0-1)
 * @returns {number} Eased value (0-1)
 */
export function easeInBack(t) {
    return c3 * t * t * t - c1 * t * t;
}

/**
 * Ease Out Back - slight overshoot at end
 * @param {number} t - Progress (0-1)
 * @returns {number} Eased value (0-1)
 */
export function easeOutBack(t) {
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

/**
 * Ease In Out Back - slight overshoot at both ends
 * @param {number} t - Progress (0-1)
 * @returns {number} Eased value (0-1)
 */
export function easeInOutBack(t) {
    return t < 0.5
        ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
        : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
}

// ============================================
// Elastic Easing Functions
// ============================================

/**
 * Ease In Elastic - elastic effect at start
 * @param {number} t - Progress (0-1)
 * @returns {number} Eased value (0-1)
 */
export function easeInElastic(t) {
    return t === 0
        ? 0
        : t === 1
        ? 1
        : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
}

/**
 * Ease Out Elastic - elastic effect at end
 * @param {number} t - Progress (0-1)
 * @returns {number} Eased value (0-1)
 */
export function easeOutElastic(t) {
    return t === 0
        ? 0
        : t === 1
        ? 1
        : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
}

/**
 * Ease In Out Elastic
 * @param {number} t - Progress (0-1)
 * @returns {number} Eased value (0-1)
 */
export function easeInOutElastic(t) {
    return t === 0
        ? 0
        : t === 1
        ? 1
        : t < 0.5
        ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
        : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
}

// ============================================
// Bounce Easing Functions
// ============================================

/**
 * Ease Out Bounce - bouncing effect at end
 * @param {number} t - Progress (0-1)
 * @returns {number} Eased value (0-1)
 */
export function easeOutBounce(t) {
    const n1 = 7.5625;
    const d1 = 2.75;

    if (t < 1 / d1) {
        return n1 * t * t;
    } else if (t < 2 / d1) {
        return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
        return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
        return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
}

/**
 * Ease In Bounce - bouncing effect at start
 * @param {number} t - Progress (0-1)
 * @returns {number} Eased value (0-1)
 */
export function easeInBounce(t) {
    return 1 - easeOutBounce(1 - t);
}

/**
 * Ease In Out Bounce
 * @param {number} t - Progress (0-1)
 * @returns {number} Eased value (0-1)
 */
export function easeInOutBounce(t) {
    return t < 0.5
        ? (1 - easeOutBounce(1 - 2 * t)) / 2
        : (1 + easeOutBounce(2 * t - 1)) / 2;
}

// ============================================
// Custom Easing - Page Transition
// ============================================

/**
 * Page transition easing - cubic-bezier(0.77, 0, 0.175, 1)
 * Used for page transitions as specified in Requirements 3.2
 * @param {number} t - Progress (0-1)
 * @returns {number} Eased value (0-1)
 */
export function pageTransitionEase(t) {
    // Approximation of cubic-bezier(0.77, 0, 0.175, 1)
    // This is a strong ease-in-out curve
    return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ============================================
// Utility Functions
// ============================================

/**
 * Get easing function by name
 * @param {string} name - Name of the easing function
 * @returns {Function} Easing function
 */
export function getEasing(name) {
    const easings = {
        linear,
        easeInSine,
        easeOutSine,
        easeInOutSine,
        easeInQuad,
        easeOutQuad,
        easeInOutQuad,
        easeInCubic,
        easeOutCubic,
        easeInOutCubic,
        easeInQuart,
        easeOutQuart,
        easeInOutQuart,
        easeInQuint,
        easeOutQuint,
        easeInOutQuint,
        easeInExpo,
        easeOutExpo,
        easeInOutExpo,
        easeInCirc,
        easeOutCirc,
        easeInOutCirc,
        easeInBack,
        easeOutBack,
        easeInOutBack,
        easeInElastic,
        easeOutElastic,
        easeInOutElastic,
        easeInBounce,
        easeOutBounce,
        easeInOutBounce,
        pageTransitionEase
    };
    
    return easings[name] || linear;
}

/**
 * Create a custom cubic bezier easing function
 * @param {number} x1 - First control point X
 * @param {number} y1 - First control point Y
 * @param {number} x2 - Second control point X
 * @param {number} y2 - Second control point Y
 * @returns {Function} Custom easing function
 */
export function cubicBezier(x1, y1, x2, y2) {
    // Newton-Raphson iteration to find t for given x
    const NEWTON_ITERATIONS = 4;
    const NEWTON_MIN_SLOPE = 0.001;
    const SUBDIVISION_PRECISION = 0.0000001;
    const SUBDIVISION_MAX_ITERATIONS = 10;

    const ax = 3 * x1 - 3 * x2 + 1;
    const bx = 3 * x2 - 6 * x1;
    const cx = 3 * x1;

    const ay = 3 * y1 - 3 * y2 + 1;
    const by = 3 * y2 - 6 * y1;
    const cy = 3 * y1;

    function sampleCurveX(t) {
        return ((ax * t + bx) * t + cx) * t;
    }

    function sampleCurveY(t) {
        return ((ay * t + by) * t + cy) * t;
    }

    function sampleCurveDerivativeX(t) {
        return (3 * ax * t + 2 * bx) * t + cx;
    }

    function solveCurveX(x) {
        let t2 = x;
        let derivative;
        let x2;

        // Newton-Raphson iteration
        for (let i = 0; i < NEWTON_ITERATIONS; i++) {
            x2 = sampleCurveX(t2) - x;
            derivative = sampleCurveDerivativeX(t2);
            if (Math.abs(derivative) < NEWTON_MIN_SLOPE) break;
            t2 -= x2 / derivative;
        }

        // Fall back to bisection
        let t0 = 0;
        let t1 = 1;
        t2 = x;

        while (t0 < t1) {
            x2 = sampleCurveX(t2);
            if (Math.abs(x2 - x) < SUBDIVISION_PRECISION) return t2;
            if (x > x2) {
                t0 = t2;
            } else {
                t1 = t2;
            }
            t2 = (t1 - t0) * 0.5 + t0;
        }

        return t2;
    }

    return function(t) {
        if (t === 0 || t === 1) return t;
        return sampleCurveY(solveCurveX(t));
    };
}

export default {
    linear,
    easeInSine,
    easeOutSine,
    easeInOutSine,
    easeInQuad,
    easeOutQuad,
    easeInOutQuad,
    easeInCubic,
    easeOutCubic,
    easeInOutCubic,
    easeInQuart,
    easeOutQuart,
    easeInOutQuart,
    easeInQuint,
    easeOutQuint,
    easeInOutQuint,
    easeInExpo,
    easeOutExpo,
    easeInOutExpo,
    easeInCirc,
    easeOutCirc,
    easeInOutCirc,
    easeInBack,
    easeOutBack,
    easeInOutBack,
    easeInElastic,
    easeOutElastic,
    easeInOutElastic,
    easeInBounce,
    easeOutBounce,
    easeInOutBounce,
    pageTransitionEase,
    getEasing,
    cubicBezier
};
