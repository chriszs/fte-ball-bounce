import Vector2D from "./balls/vector2d";
import BouncingBalls from "./balls/bouncing-balls";

const tryInterval = 500;

function init() {
  const toplineChart = document.getElementById("housetopline-chart");
  const circles = [...toplineChart.querySelectorAll(".svg circle")];

  if (
    typeof circles === "undefined" ||
    !circles ||
    circles.length === 0 ||
    typeof getComputedStyle(circles[0]).fill !== 'string' ||
    !getComputedStyle(circles[0]).fill
  ) {
    setTimeout(tryInit, tryInterval);
    return;
  }

  const container = document.createElement("div");
  const canvas = document.createElement("canvas");

  canvas.id = "ballpit";
  container.id = "ballpit-container";

  toplineChart.appendChild(container);
  container.appendChild(canvas);

  BouncingBalls.init("ballpit", "housetopline-chart", true, true);

  circles.forEach((circle) => {
    const x = circle.getAttribute("cx");
    const y = circle.getAttribute("cy");
    const color = getComputedStyle(circle).fill;

    BouncingBalls.addBallWithColorAndPosition(new Vector2D(x, y), color);
  });
}

function tryInit() {
  try {
    init();
  } catch (e) {
    console.error(e);
    setTimeout(tryInit, tryInterval);
  }
}

setTimeout(tryInit, tryInterval);
