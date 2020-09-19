/*
forked from https://github.com/MTrajK/bouncing-balls
by Meto Trajkovski
licensed MIT
*/

import Vector2D from './vector2d';

/*********************************************************
    Notes about the physics in the simulations:
    The balls are equally hard (and have equal weight), so they don't lose energy when bouncing between themself.
    In the horizontal simulation, a ball loses energy when bouncing from a wall (the wall is harder and stationary) and air resistence.
    The ball also loses energy from the air resistence, hitting the ground, rolling on the ground and gravity in the vertical simulation
    (but not from spinning and some other 3d things possible in billiard and basketball).

    Known issue:
    In "vertical" space/direction when the bottom is full with balls (when there is no space for a new ball)
    adding a new ball will make all balls go crazy (jumping randomly). This is because the balls will always
    collide and won't lose energy from colliding (I'm not sure how to solve this).
*********************************************************/

/**************
 * Ball class *
 ***************/
class Ball {
    constructor(position, velocity, radius, {height, width}, color="#000000") {
      // base constructor
      this.position = position;
      this.velocity = velocity;
      this.radius = radius;
      this._borderCoords = {
        top: radius,
        bottom: height - radius,
        left: radius,
        right: width - radius,
      };
      this.color = color;
    }
  
    collision(ball) {
      if (this.position.distance(ball.position) <= ball.radius + this.radius) {
        moveBallsOutOfCollision(this, ball);
  
        const positionSub = this.position.sub(ball.position);
        const distance = positionSub.length();
  
        /*********************************************************
                    The formula could be found here: https://en.wikipedia.org/wiki/Elastic_collision
                    velocityA -= (dot(velocityAB_sub, positionAB_sub) / distance^2) * positionAB_sub
                    velocityB -= (dot(velocityBA_sub, positionBA_sub) / distance^2) * positionBA_sub
                    but this thing (dot(velocityAB_sub, positionAB_sub) / distance^2) is same for 2 velocities
                    because dot and length methods are commutative properties, and velocityAB_sub = -velocityBA_sub, same for positionSub
                *********************************************************/
        const coeff =
          this.velocity.sub(ball.velocity).dot(positionSub) / (distance * distance);
        this.velocity = this.velocity.sub(positionSub.mult(coeff));
        ball.velocity = ball.velocity.sub(positionSub.opposite().mult(coeff));
      }
    }
  }
  
  function moveBallsOutOfCollision(ball1, ball2) {
    /*********************************************************
              Find the positions of the balls when the collision occurred.
              (because right they have collided - they're overlapping)
  
              old ball1.position = ball1.position - T * ball1.velocity
              old ball2.position = ball2.position - T * ball2.velocity
  
              In this moment T is unknown. Solve this equation to find T:
              distance(old ball1.position, old ball2.position) = (ball1.radius + ball2.radius)
  
              This can be solved using the Quadratic formula, because after simplifying
              the left side of the equation we'll get something like: a*(T^2) + b*T + c = 0
          *********************************************************/
    const v = ball1.velocity.sub(ball2.velocity);
    const p = ball1.position.sub(ball2.position);
    const r = ball1.radius + ball2.radius;
  
    // quadratic formula coeficients
    const a = v.X * v.X + v.Y * v.Y;
    const b = -2 * (p.X * v.X + p.Y * v.Y);
    const c = p.X * p.X + p.Y * p.Y - r * r;
  
    // quadratic formula discriminant
    const d = b * b - 4 * a * c;
  
    // t1 and t2 from the quadratic formula (need only the positive solution)
    let t = (-b - Math.sqrt(d)) / (2 * a);
    if (t < 0) t = (-b + Math.sqrt(d)) / (2 * a);
  
    // calculate the old positions (positions when the collision occurred)
    const oldPosition1 = ball1.position.sub(ball1.velocity.mult(t));
    const oldPosition2 = ball2.position.sub(ball2.velocity.mult(t));
  
    const maxChange = ball1.radius * 3;
  
    if (
      a == 0 ||
      d < 0 ||
      oldPosition1.distance(ball1.position) > maxChange ||
      oldPosition2.distance(ball2.position) > maxChange
    ) {
      // 1) if 'a' is zero then both balls have equal velocities, no solution
      // 2) the discriminant shouldn't be negative in this simulation, but just in case check it
      // 3) the chages are too big, something is wrong
  
      if (ball1.position.distance(ball2.position) == 0) {
        // move only one ball up
        ball1.position = ball1.position.add(new Vector2D(0, -r));
      } else {
        // move both balls using the vector between these positions
        const diff = (r - ball1.position.distance(ball2.position)) / 2;
        ball1.position = ball1.position.add(
          ball1.position
            .sub(ball2.position)
            .tryNormalize()
            .mult(diff)
        );
        ball2.position = ball2.position.add(
          ball2.position
            .sub(ball1.position)
            .tryNormalize()
            .mult(diff)
        );
      }
    } else {
      // use the old positions
      ball1.position = oldPosition1;
      ball2.position = oldPosition2;
    }
  }
  
  /************************
   * HorizontalBall class *
   *************************/
  const horizontalMovementProperties = {
    airResistance: 0.99, // slows down the speed in each frame
    hitResistance: 0.8, // slows down the speed when a wall is hitted
    velocityFactor: 0.2, // velocity factor (converts vector from the mouse dragging to this environment)
  };
  
  class HorizontalBall extends Ball {
    constructor(position, velocity, radius, localDimensions, color) {
      // HorizontalBall constructor
      // call the base constructor
      super(
        position,
        velocity.mult(horizontalMovementProperties.velocityFactor),
        radius,
        localDimensions,
        color
      );
    }
  
    move() {
      if (this.velocity.isNearZero() && !this.velocity.isZero())
        this.velocity = Vector2D.zero(); // the ball is staying in place
  
      // move the ball using the velocity
      this.position = this.position.add(this.velocity);
  
      if (
        this.position.X <= this._borderCoords.left ||
        this.position.X >= this._borderCoords.right
      ) {
        // move ball inside the borders
        this.position.X =
          this.position.X <= this._borderCoords.left
            ? this._borderCoords.left
            : this._borderCoords.right;
  
        // apply hit resistance
        this.velocity = this.velocity.mult(
          horizontalMovementProperties.hitResistance
        );
  
        // reflection angle is an inverse angle to the perpendicular axis to the wall (in this case the wall is Y axis)
        this.velocity.X = -this.velocity.X;
      }
      if (
        this.position.Y <= this._borderCoords.top ||
        this.position.Y >= this._borderCoords.bottom
      ) {
        // move ball inside the borders
        this.position.Y =
          this.position.Y <= this._borderCoords.top
            ? this._borderCoords.top
            : this._borderCoords.bottom;
  
        // apply hit resistance
        this.velocity = this.velocity.mult(
          horizontalMovementProperties.hitResistance
        );
  
        // reflection angle is an inverse angle to the perpendicular axis to the wall (in this case the wall is X axis)
        this.velocity.Y = -this.velocity.Y;
      }
  
      // apply air resistance
      this.velocity = this.velocity.mult(
        horizontalMovementProperties.airResistance
      );
    }
  }
  
  /**********************
   * VerticalBall class *
   ***********************/
  const verticalMovementProperties = {
    airResistance: 0.995, // slows down the speed in each frame
    hitResistance: 0.8, // slows down the Y speed when the surface is hitted
    rollingResistance: 0.98, // slows down the X speed when rolling on the ground
    gravity: 0.05, // pulls the ball to the ground in each frame
    velocityFactor: 0.07, // velocity factor (converts vector from the mouse dragging to this environment)
  };
  
  class VerticalBall extends Ball {
    constructor(position, velocity, radius, localDimensions, color) {
      // VerticalBall constructor
      // call the base constructor
      super(
        position,
        velocity.mult(verticalMovementProperties.velocityFactor),
        radius,
        localDimensions,
        color
      );
    }
  
    move() {
      if (
        this.velocity.isNearZero() &&
        this.position.Y == this._borderCoords.bottom &&
        !this.velocity.isZero()
      )
        this.velocity = Vector2D.zero(); // the ball is staying in place
  
      // move the ball using the velocity
      this.position = this.position.add(this.velocity);
  
      if (
        this.position.X <= this._borderCoords.left ||
        this.position.X >= this._borderCoords.right
      ) {
        // move ball inside the borders
        this.position.X =
          this.position.X <= this._borderCoords.left
            ? this._borderCoords.left
            : this._borderCoords.right;
  
        // reflection
        this.velocity.X = -this.velocity.X;
      }
      if (
        this.position.Y <= this._borderCoords.top ||
        this.position.Y >= this._borderCoords.bottom
      ) {
        // move ball inside the borders
        this.position.Y =
          this.position.Y <= this._borderCoords.top
            ? this._borderCoords.top
            : this._borderCoords.bottom;
  
        if (this.position.Y == this._borderCoords.bottom) {
          // when ball is on the ground, update resistances
          this.velocity.Y *= verticalMovementProperties.hitResistance;
          this.velocity.X *= verticalMovementProperties.rollingResistance;
        }
  
        // reflection
        this.velocity.Y = -this.velocity.Y;
      }
  
      // apply air resistance
      this.velocity = this.velocity.mult(verticalMovementProperties.airResistance);
  
      if (
        this.position.Y == this._borderCoords.bottom &&
        Math.abs(this.velocity.Y) <= Vector2D.NEAR_ZERO
      )
        // the ball isn't falling or jumping
        this.velocity.Y = 0;
      // apply gravity if falling or jumping
      else this.velocity.Y += verticalMovementProperties.gravity;
    }
  }
  
  /* Save these classes as global */
  const Balls = {
    HorizontalBall,
    VerticalBall,
  };
  
  export default Balls;
  
  