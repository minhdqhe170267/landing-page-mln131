/**
 * Vector Math Utilities
 * Provides 2D and 3D vector operations for particle physics and animations
 * 
 * @module animations/utils/vector
 */

/**
 * 2D Vector class for particle physics and animations
 */
export class Vector2 {
    /**
     * Create a 2D vector
     * @param {number} x - X component
     * @param {number} y - Y component
     */
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    /**
     * Create a copy of this vector
     * @returns {Vector2} New vector with same values
     */
    clone() {
        return new Vector2(this.x, this.y);
    }

    /**
     * Set vector components
     * @param {number} x - X component
     * @param {number} y - Y component
     * @returns {Vector2} This vector for chaining
     */
    set(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }

    /**
     * Add another vector to this vector
     * @param {Vector2} v - Vector to add
     * @returns {Vector2} This vector for chaining
     */
    add(v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }

    /**
     * Subtract another vector from this vector
     * @param {Vector2} v - Vector to subtract
     * @returns {Vector2} This vector for chaining
     */
    sub(v) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }

    /**
     * Multiply this vector by a scalar
     * @param {number} scalar - Scalar value
     * @returns {Vector2} This vector for chaining
     */
    multiply(scalar) {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }

    /**
     * Divide this vector by a scalar
     * @param {number} scalar - Scalar value
     * @returns {Vector2} This vector for chaining
     */
    divide(scalar) {
        if (scalar !== 0) {
            this.x /= scalar;
            this.y /= scalar;
        }
        return this;
    }

    /**
     * Get the magnitude (length) of this vector
     * @returns {number} Magnitude
     */
    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    /**
     * Get the squared magnitude (faster than magnitude)
     * @returns {number} Squared magnitude
     */
    magnitudeSquared() {
        return this.x * this.x + this.y * this.y;
    }

    /**
     * Normalize this vector (make it unit length)
     * @returns {Vector2} This vector for chaining
     */
    normalize() {
        const mag = this.magnitude();
        if (mag > 0) {
            this.divide(mag);
        }
        return this;
    }

    /**
     * Limit the magnitude of this vector
     * @param {number} max - Maximum magnitude
     * @returns {Vector2} This vector for chaining
     */
    limit(max) {
        const magSq = this.magnitudeSquared();
        if (magSq > max * max) {
            this.divide(Math.sqrt(magSq)).multiply(max);
        }
        return this;
    }

    /**
     * Set the magnitude of this vector
     * @param {number} mag - New magnitude
     * @returns {Vector2} This vector for chaining
     */
    setMagnitude(mag) {
        return this.normalize().multiply(mag);
    }

    /**
     * Calculate dot product with another vector
     * @param {Vector2} v - Other vector
     * @returns {number} Dot product
     */
    dot(v) {
        return this.x * v.x + this.y * v.y;
    }

    /**
     * Calculate cross product with another vector (returns scalar for 2D)
     * @param {Vector2} v - Other vector
     * @returns {number} Cross product (z component)
     */
    cross(v) {
        return this.x * v.y - this.y * v.x;
    }

    /**
     * Calculate distance to another vector
     * @param {Vector2} v - Other vector
     * @returns {number} Distance
     */
    distanceTo(v) {
        const dx = this.x - v.x;
        const dy = this.y - v.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Calculate squared distance to another vector (faster)
     * @param {Vector2} v - Other vector
     * @returns {number} Squared distance
     */
    distanceToSquared(v) {
        const dx = this.x - v.x;
        const dy = this.y - v.y;
        return dx * dx + dy * dy;
    }

    /**
     * Get the angle of this vector in radians
     * @returns {number} Angle in radians
     */
    angle() {
        return Math.atan2(this.y, this.x);
    }

    /**
     * Rotate this vector by an angle
     * @param {number} angle - Angle in radians
     * @returns {Vector2} This vector for chaining
     */
    rotate(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const x = this.x * cos - this.y * sin;
        const y = this.x * sin + this.y * cos;
        this.x = x;
        this.y = y;
        return this;
    }

    /**
     * Linear interpolation to another vector
     * @param {Vector2} v - Target vector
     * @param {number} t - Interpolation factor (0-1)
     * @returns {Vector2} This vector for chaining
     */
    lerp(v, t) {
        this.x += (v.x - this.x) * t;
        this.y += (v.y - this.y) * t;
        return this;
    }

    /**
     * Convert to array
     * @returns {number[]} [x, y]
     */
    toArray() {
        return [this.x, this.y];
    }

    /**
     * Convert to object
     * @returns {{x: number, y: number}} Object with x and y
     */
    toObject() {
        return { x: this.x, y: this.y };
    }

    // Static methods

    /**
     * Create vector from angle and magnitude
     * @param {number} angle - Angle in radians
     * @param {number} magnitude - Magnitude
     * @returns {Vector2} New vector
     */
    static fromAngle(angle, magnitude = 1) {
        return new Vector2(
            Math.cos(angle) * magnitude,
            Math.sin(angle) * magnitude
        );
    }

    /**
     * Create random vector with given magnitude
     * @param {number} magnitude - Magnitude (default 1)
     * @returns {Vector2} New random vector
     */
    static random(magnitude = 1) {
        const angle = Math.random() * Math.PI * 2;
        return Vector2.fromAngle(angle, magnitude);
    }

    /**
     * Add two vectors and return new vector
     * @param {Vector2} a - First vector
     * @param {Vector2} b - Second vector
     * @returns {Vector2} New vector
     */
    static add(a, b) {
        return new Vector2(a.x + b.x, a.y + b.y);
    }

    /**
     * Subtract two vectors and return new vector
     * @param {Vector2} a - First vector
     * @param {Vector2} b - Second vector
     * @returns {Vector2} New vector
     */
    static sub(a, b) {
        return new Vector2(a.x - b.x, a.y - b.y);
    }

    /**
     * Calculate distance between two vectors
     * @param {Vector2} a - First vector
     * @param {Vector2} b - Second vector
     * @returns {number} Distance
     */
    static distance(a, b) {
        return a.distanceTo(b);
    }

    /**
     * Linear interpolation between two vectors
     * @param {Vector2} a - Start vector
     * @param {Vector2} b - End vector
     * @param {number} t - Interpolation factor (0-1)
     * @returns {Vector2} New interpolated vector
     */
    static lerp(a, b, t) {
        return new Vector2(
            a.x + (b.x - a.x) * t,
            a.y + (b.y - a.y) * t
        );
    }
}

/**
 * 3D Vector class for particle physics with depth
 */
export class Vector3 {
    /**
     * Create a 3D vector
     * @param {number} x - X component
     * @param {number} y - Y component
     * @param {number} z - Z component
     */
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    /**
     * Create a copy of this vector
     * @returns {Vector3} New vector with same values
     */
    clone() {
        return new Vector3(this.x, this.y, this.z);
    }

    /**
     * Set vector components
     * @param {number} x - X component
     * @param {number} y - Y component
     * @param {number} z - Z component
     * @returns {Vector3} This vector for chaining
     */
    set(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        return this;
    }

    /**
     * Add another vector to this vector
     * @param {Vector3} v - Vector to add
     * @returns {Vector3} This vector for chaining
     */
    add(v) {
        this.x += v.x;
        this.y += v.y;
        this.z += v.z;
        return this;
    }

    /**
     * Subtract another vector from this vector
     * @param {Vector3} v - Vector to subtract
     * @returns {Vector3} This vector for chaining
     */
    sub(v) {
        this.x -= v.x;
        this.y -= v.y;
        this.z -= v.z;
        return this;
    }

    /**
     * Multiply this vector by a scalar
     * @param {number} scalar - Scalar value
     * @returns {Vector3} This vector for chaining
     */
    multiply(scalar) {
        this.x *= scalar;
        this.y *= scalar;
        this.z *= scalar;
        return this;
    }

    /**
     * Divide this vector by a scalar
     * @param {number} scalar - Scalar value
     * @returns {Vector3} This vector for chaining
     */
    divide(scalar) {
        if (scalar !== 0) {
            this.x /= scalar;
            this.y /= scalar;
            this.z /= scalar;
        }
        return this;
    }

    /**
     * Get the magnitude (length) of this vector
     * @returns {number} Magnitude
     */
    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }

    /**
     * Get the squared magnitude (faster than magnitude)
     * @returns {number} Squared magnitude
     */
    magnitudeSquared() {
        return this.x * this.x + this.y * this.y + this.z * this.z;
    }

    /**
     * Normalize this vector (make it unit length)
     * @returns {Vector3} This vector for chaining
     */
    normalize() {
        const mag = this.magnitude();
        if (mag > 0) {
            this.divide(mag);
        }
        return this;
    }

    /**
     * Limit the magnitude of this vector
     * @param {number} max - Maximum magnitude
     * @returns {Vector3} This vector for chaining
     */
    limit(max) {
        const magSq = this.magnitudeSquared();
        if (magSq > max * max) {
            this.divide(Math.sqrt(magSq)).multiply(max);
        }
        return this;
    }

    /**
     * Set the magnitude of this vector
     * @param {number} mag - New magnitude
     * @returns {Vector3} This vector for chaining
     */
    setMagnitude(mag) {
        return this.normalize().multiply(mag);
    }

    /**
     * Calculate dot product with another vector
     * @param {Vector3} v - Other vector
     * @returns {number} Dot product
     */
    dot(v) {
        return this.x * v.x + this.y * v.y + this.z * v.z;
    }

    /**
     * Calculate cross product with another vector
     * @param {Vector3} v - Other vector
     * @returns {Vector3} New vector (cross product)
     */
    cross(v) {
        return new Vector3(
            this.y * v.z - this.z * v.y,
            this.z * v.x - this.x * v.z,
            this.x * v.y - this.y * v.x
        );
    }

    /**
     * Calculate distance to another vector
     * @param {Vector3} v - Other vector
     * @returns {number} Distance
     */
    distanceTo(v) {
        const dx = this.x - v.x;
        const dy = this.y - v.y;
        const dz = this.z - v.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    /**
     * Calculate squared distance to another vector (faster)
     * @param {Vector3} v - Other vector
     * @returns {number} Squared distance
     */
    distanceToSquared(v) {
        const dx = this.x - v.x;
        const dy = this.y - v.y;
        const dz = this.z - v.z;
        return dx * dx + dy * dy + dz * dz;
    }

    /**
     * Linear interpolation to another vector
     * @param {Vector3} v - Target vector
     * @param {number} t - Interpolation factor (0-1)
     * @returns {Vector3} This vector for chaining
     */
    lerp(v, t) {
        this.x += (v.x - this.x) * t;
        this.y += (v.y - this.y) * t;
        this.z += (v.z - this.z) * t;
        return this;
    }

    /**
     * Apply perspective projection (for 3D to 2D)
     * @param {number} focalLength - Focal length for perspective
     * @returns {{x: number, y: number, scale: number}} Projected coordinates and scale
     */
    project(focalLength = 500) {
        const scale = focalLength / (focalLength + this.z);
        return {
            x: this.x * scale,
            y: this.y * scale,
            scale: scale
        };
    }

    /**
     * Convert to array
     * @returns {number[]} [x, y, z]
     */
    toArray() {
        return [this.x, this.y, this.z];
    }

    /**
     * Convert to object
     * @returns {{x: number, y: number, z: number}} Object with x, y, z
     */
    toObject() {
        return { x: this.x, y: this.y, z: this.z };
    }

    // Static methods

    /**
     * Create random vector within bounds
     * @param {number} maxX - Max X value
     * @param {number} maxY - Max Y value
     * @param {number} maxZ - Max Z value
     * @returns {Vector3} New random vector
     */
    static random(maxX = 1, maxY = 1, maxZ = 1) {
        return new Vector3(
            (Math.random() - 0.5) * 2 * maxX,
            (Math.random() - 0.5) * 2 * maxY,
            (Math.random() - 0.5) * 2 * maxZ
        );
    }

    /**
     * Add two vectors and return new vector
     * @param {Vector3} a - First vector
     * @param {Vector3} b - Second vector
     * @returns {Vector3} New vector
     */
    static add(a, b) {
        return new Vector3(a.x + b.x, a.y + b.y, a.z + b.z);
    }

    /**
     * Subtract two vectors and return new vector
     * @param {Vector3} a - First vector
     * @param {Vector3} b - Second vector
     * @returns {Vector3} New vector
     */
    static sub(a, b) {
        return new Vector3(a.x - b.x, a.y - b.y, a.z - b.z);
    }

    /**
     * Calculate distance between two vectors
     * @param {Vector3} a - First vector
     * @param {Vector3} b - Second vector
     * @returns {number} Distance
     */
    static distance(a, b) {
        return a.distanceTo(b);
    }

    /**
     * Linear interpolation between two vectors
     * @param {Vector3} a - Start vector
     * @param {Vector3} b - End vector
     * @param {number} t - Interpolation factor (0-1)
     * @returns {Vector3} New interpolated vector
     */
    static lerp(a, b, t) {
        return new Vector3(
            a.x + (b.x - a.x) * t,
            a.y + (b.y - a.y) * t,
            a.z + (b.z - a.z) * t
        );
    }
}

// ============================================
// Utility Functions
// ============================================

/**
 * Calculate angle between two points
 * @param {number} x1 - First point X
 * @param {number} y1 - First point Y
 * @param {number} x2 - Second point X
 * @param {number} y2 - Second point Y
 * @returns {number} Angle in radians
 */
export function angleBetween(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
}

/**
 * Calculate distance between two points
 * @param {number} x1 - First point X
 * @param {number} y1 - First point Y
 * @param {number} x2 - Second point X
 * @param {number} y2 - Second point Y
 * @returns {number} Distance
 */
export function distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate squared distance between two points (faster)
 * @param {number} x1 - First point X
 * @param {number} y1 - First point Y
 * @param {number} x2 - Second point X
 * @param {number} y2 - Second point Y
 * @returns {number} Squared distance
 */
export function distanceSquared(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return dx * dx + dy * dy;
}

/**
 * Map a value from one range to another
 * @param {number} value - Value to map
 * @param {number} inMin - Input range minimum
 * @param {number} inMax - Input range maximum
 * @param {number} outMin - Output range minimum
 * @param {number} outMax - Output range maximum
 * @returns {number} Mapped value
 */
export function mapRange(value, inMin, inMax, outMin, outMax) {
    return ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;
}

/**
 * Constrain a value between min and max
 * @param {number} value - Value to constrain
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Constrained value
 */
export function constrain(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * Convert degrees to radians
 * @param {number} degrees - Angle in degrees
 * @returns {number} Angle in radians
 */
export function degToRad(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 * @param {number} radians - Angle in radians
 * @returns {number} Angle in degrees
 */
export function radToDeg(radians) {
    return radians * (180 / Math.PI);
}

/**
 * Generate random number between min and max
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random number
 */
export function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Generate random integer between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random integer
 */
export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default {
    Vector2,
    Vector3,
    angleBetween,
    distance,
    distanceSquared,
    mapRange,
    constrain,
    degToRad,
    radToDeg,
    randomRange,
    randomInt
};
