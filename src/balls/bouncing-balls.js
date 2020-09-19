/*
forked from https://github.com/MTrajK/bouncing-balls
by Meto Trajkovski
licensed MIT
*/

import Vector2D from "./vector2d";
import Balls from "./balls";

/**************
 ** CONSTANTS **
 ***************/
const fps = 60; // Note: if you change this, you'll need to addapt gravity and resistance logic in ball.js
const intervalMs = 1000 / fps;
const localDimensions = {
  width: 100, // 1 localDimensions.width is 1 local unit
  height: 100 * (2 / 3), // the canvas ratio is always 3:2
};
const ballProperties = {
  radius: 1.2, // local units
  startAngle: 0,
  endAngle: 2 * Math.PI,
  color: "#000000",
};
const aimProperties = {
  shrink: 0.6,
  maxSpeed: 30, // local units
  headPart: 0.2,
  strokeAngle: Math.PI / 5,
  color: "#000000",
};

/******************************************************************************************
 ** PROPERTIES USED FOR COMUNICATION BETWEEN HELPERS, EVENTS, UPDATE AND PUBLIC FUNCTIONS **
 *******************************************************************************************/
let updateInterval;

let canvas;
let context;
let canvasDimensions;
let isAiming;
let balls;
let ballType;
let enabledCollisions;
let mousePosition;
let newBallPosition;
let newBallDirection;

/************
 ** HELPERS **
 *************/
function getCanvasDimensions() {
  return {
    width: canvasDimensions.offsetWidth,
    height: canvasDimensions.offsetHeight,
    top: canvasDimensions.offsetTop,
    left: canvasDimensions.offsetLeft,
    scaleRatio: canvasDimensions.offsetWidth / localDimensions.width,
  };
}

function addNewBall() {
  isAiming = false;

  // save the new ball
  const newBall = new ballType(
    newBallPosition.clone(),
    newBallDirection.clone(),
    ballProperties.radius,
    localDimensions
  );
  balls.push(newBall);

  // reset values
  newBallDirection = Vector2D.zero();
  newBallPosition = new Vector2D();
}

function addBallWithColorAndPosition(position, color) {
  const dimensions = getCanvasDimensions();
  const scaledPosition = position.div(dimensions.scaleRatio);

  // save the new ball
  const newBall = new ballType(
    scaledPosition.clone(),
    Vector2D.zero(),
    ballProperties.radius,
    localDimensions,
    color
  );
  balls.push(newBall);
}

/************
 ** DRAWING **
 *************/
function drawCanvasBorder({ width, height }) {
  context.strokeStyle = "#000000";
  context.strokeRect(0, 0, width, height);
}

function drawBall(ballCoords, scaleRatio, color = "#000000") {
  const scaledCoords = ballCoords.mult(scaleRatio); // convert the coordinates in CANVAS size

  context.beginPath();
  context.arc(
    scaledCoords.X,
    scaledCoords.Y,
    ballProperties.radius * scaleRatio, // convert the radius too
    ballProperties.startAngle,
    ballProperties.endAngle
  );
  context.closePath();

  context.fillStyle = color;
  context.fill();
  context.lineWidth = 1;
  context.strokeStyle = '#FFFFFF';
  context.stroke();
}

function drawAim(scaleRatio) {
  if (newBallDirection.isNearZero()) return; // no direction, the mouse is in the start position

  const directionLength = newBallDirection.length();
  const radiusRatio = ballProperties.radius / directionLength;
  const scaledShrink = aimProperties.shrink * scaleRatio;

  // convert start and end points in CANVAS coordinates (using scaleRatio)
  // move the start point on the ball border (using the ball direction)
  // and adjust end point (using the start point)
  const startPoint = newBallPosition
    .add(newBallDirection.mult(radiusRatio))
    .mult(scaleRatio);
  const endPoint = startPoint.add(newBallDirection.mult(scaledShrink));

  // calculate head strokes angle
  const headLength = directionLength * scaledShrink * aimProperties.headPart;
  const arrowAngle = newBallDirection.angle(); // angle between Y axis and the arrow direction
  const leftStrokeAngle = arrowAngle - aimProperties.strokeAngle;
  const rightStrokeAngle = arrowAngle + aimProperties.strokeAngle;

  context.beginPath();
  // draw the body
  context.moveTo(startPoint.X, startPoint.Y);
  context.lineTo(endPoint.X, endPoint.Y);
  // draw the head strokes
  context.lineTo(
    endPoint.X - headLength * Math.sin(leftStrokeAngle),
    endPoint.Y - headLength * Math.cos(leftStrokeAngle)
  );
  context.moveTo(endPoint.X, endPoint.Y);
  context.lineTo(
    endPoint.X - headLength * Math.sin(rightStrokeAngle),
    endPoint.Y - headLength * Math.cos(rightStrokeAngle)
  );

  context.strokeStyle = aimProperties.color;
  context.stroke();
}

/********************
 ** EVENT LISTENERS **
 *********************/
function onMouseMove(event) {
  if (isAiming) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // convert mouse coordinates to local coordinates
    const dimensions = getCanvasDimensions();
    mousePosition = new Vector2D(x, y).div(dimensions.scaleRatio);
    if (newBallPosition.isUndefined()) newBallPosition = mousePosition.clone(); // start aiming

    // check where the pointer is located
    if (
      mousePosition.X <= 0 ||
      mousePosition.X >= localDimensions.width ||
      mousePosition.Y <= 0 ||
      mousePosition.Y >= localDimensions.height
    ) {
      addNewBall();
    } else {
      // calculate aim direction
      newBallDirection = mousePosition.direction(newBallPosition);

      // directionLength shoud be smaller or equal to aimProperties.maxSpeed
      const directionLength = newBallDirection.length();
      if (directionLength > aimProperties.maxSpeed)
        newBallDirection = newBallDirection.mult(
          aimProperties.maxSpeed / directionLength
        );
    }
  }
}

function onMouseDown(event) {
  // button=0 is left mouse click, button=1 is middle mouse click, button=2 is right mouse click
  if (event.button == 0) {
    isAiming = true;
    onMouseMove(event); // calculate the start position
  } else if (isAiming) {
    addNewBall();
  }
}

function onMouseUp() {
  if (isAiming) addNewBall();
}

function onTouchMove({ touches }) {
  // isAiming will be true ONLY if 1 finger touches the screen
  onMouseMove(touches[0]);
}

function onTouchStart(event) {
  if (event.touches.length == 1) {
    event.touches[0].button = 0; // imitate a left mouse button click
    onMouseDown(event.touches[0]);
  } else {
    onMouseUp();
  }
  event.preventDefault();
}

function onTouchEnd() {
  onMouseUp();
  event.preventDefault();
}

/******************
 ** MAIN FUNCTION **
 *******************/
function update() {
  // check dimensions and clear canvas
  // the canvas is cleared when a new value is attached to dimensions (no matter if a same value)
  const dimensions = getCanvasDimensions();
  context.clearRect(0, 0, canvas.width, canvas.height);
  //canvas.width = dimensions.width;
  //canvas.height = dimensions.height;

  // draw canvas border
  // drawCanvasBorder(dimensions);

  // aiming mode
  if (isAiming) {
    // draw new ball
    drawBall(newBallPosition, dimensions.scaleRatio);
    // draw aim
    drawAim(dimensions.scaleRatio);
  }

  if (enabledCollisions)
    // check collisions and update positions & velocities
    // O(N^2) but this can be much faster, O(N*LogN) searching in quadtree structure, (or sort the points and check the closest O(N*LogN))
    for (var i = 0; i < balls.length; i++)
      for (let j = i + 1; j < balls.length; j++) balls[i].collision(balls[j]);

  // update ball position & velocity
  for (var i = 0; i < balls.length; i++) balls[i].move();

  // draw updated balls
  for (var i = 0; i < balls.length; i++)
    drawBall(balls[i].position, dimensions.scaleRatio, balls[i].color);
}

/*********************
 ** PUBLIC FUNCTIONS **
 **********************/
function init(canvasId, dimensionsId, horizontal, collisions) {
  // default values
  horizontal = typeof horizontal != "boolean" ? true : horizontal;
  enabledCollisions = typeof collisions != "boolean" ? true : collisions;

  // init parameters
  canvas = document.getElementById(canvasId);
  // https://www.html5rocks.com/en/tutorials/canvas/hidpi/
  // Get the device pixel ratio, falling back to 1.
  const dpr = window.devicePixelRatio || 1;
  // Get the size of the canvas in CSS pixels.
  const rect = canvas.getBoundingClientRect();
  // Give the canvas pixel dimensions of their CSS
  // size * the device pixel ratio.
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  context = canvas.getContext('2d');
  // Scale all drawing operations by the dpr, so you
  // don't have to worry about the difference.
  context.scale(dpr, dpr);
  canvasDimensions = document.getElementById(dimensionsId);
  isAiming = false;
  mousePosition = new Vector2D(); // X & Y should be represented with local coordinates
  newBallPosition = new Vector2D(); // X & Y should be represented with local coordinates
  newBallDirection = Vector2D.zero();
  ballType = horizontal ? Balls.HorizontalBall : Balls.VerticalBall;
  balls = [];

  // add mouse event listeners
  canvas.addEventListener("mouseup", onMouseUp);
  document.addEventListener("mousemove", onMouseMove);
  canvas.addEventListener("mousedown", onMouseDown);

  // add touch event listeners
  canvas.addEventListener("touchstart", onTouchStart);
  document.addEventListener("touchmove", onTouchMove);
  canvas.addEventListener("touchend", onTouchEnd);

  // set interval
  updateInterval = setInterval(update, intervalMs);
}

function clear() {
  // remove mouse event listeners
  canvas.removeEventListener("mousedown", onMouseDown);
  document.removeEventListener("mousemove", onMouseMove);
  canvas.removeEventListener("mouseup", onMouseUp);

  // remove touch event listeners
  canvas.removeEventListener("touchstart", onTouchStart);
  document.removeEventListener("touchmove", onTouchMove);
  canvas.removeEventListener("touchend", onTouchEnd);

  // clear interval
  clearInterval(updateInterval);

  // clear canvas
  // canvas.width = canvas.height = 0;
  context.clearRect(0, 0, canvas.width, canvas.height);
}

export default {
  init,
  clear,
  addBallWithColorAndPosition,
};
