/*
forked from https://github.com/MTrajK/bouncing-balls
by Meto Trajkovski
licensed MIT
*/

class Vector2D {
    constructor(x, y) {
        // constructor for 2 dimensional vector
        this.X = x;
        this.Y = y;
    }

    length() {
        // lenght of this vector (Pythagorean theorem)
        return Math.sqrt(this.X*this.X + this.Y*this.Y);
    }

    distance(v) {
        // distance from this to 'v' vector (Euclidean distance formula)
        return this.sub(v).length();
    }

    angle() {
        // angle between X axis and this vector measured counter-clockwise
        return Math.atan2(this.X, this.Y);
    }

    tryNormalize() {
        // convert to unit vector, vector with length of 1 (distance between origin and this vector)
        // if zero vector, returns zero vector
        const length = this.length();
        return length == 0 ? Vector2D.zero() : this.div(length);
    }

    convertToLocal({left, top, scaleRatio}) {
        // convert coordinates to local units
        return new Vector2D(
            this.X - left,
            this.Y - top
        ).div(scaleRatio);
    }

    mult(factor) {
        // multiply this vector by constant 'factor'
        return new Vector2D(
            this.X * factor,
            this.Y * factor
        );
    }

    div(factor) {
        // divide this vector by constant 'factor'
        return new Vector2D(
            this.X / factor,
            this.Y / factor
        );
    }

    add({X, Y}) {
        // add 'v' to this vector
        return new Vector2D(
            X + this.X,
            Y + this.Y
        );
    }

    sub({X, Y}) {
        // substract 'v' from this vector (direction from this to 'v' vector)
        return new Vector2D(
            this.X - X,
            this.Y - Y
        );
    }

    dot({X, Y}) {
        // dot product between this and 'v' vector
        return this.X * X + this.Y * Y;
    }

    opposite() {
        // opposite from this vector
        return new Vector2D(
            -this.X,
            -this.Y
        );
    }

    direction(v) {
        // direction from this to 'v' vector
        return v.sub(this);
    }

    isZero() {
        // check if zero vector
        return this.X == 0 && this.Y == 0;
    }

    isNearZero() {
        // check if near zero vector
        return this.length() < Vector2D.NEAR_ZERO;
    }

    isUndefined() {
        // check if undefined vector
        return typeof this.X == 'undefined' || typeof this.Y == 'undefined';
    }

    clone() {
        // clone this vector
        return new Vector2D(this.X, this.Y);
    }
}

Vector2D.zero = () => // static function for a zero vector
new Vector2D(0, 0)

Vector2D.random = () => // static function for a random vector
new Vector2D(Math.random(), Math.random())

Vector2D.NEAR_ZERO = 0.01; // a small value used to detect stationary balls (non eye-catchable moving)

export default Vector2D;
