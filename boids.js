// Size of canvas. These get updated to fill the whole browser.
let width = 150;
let height = 150;

// const numBoids = 100;
// const numPredatoids = 1;
// const BIRTHS = true;
// const PERCHING = true;
// const DRAW_TRAIL = true;

var boids = [];
var predatoids = [];

var centerOfMass = [width / 2, height / 2];
var averageVelocity = [0, 0];

//const config = require("./config.json");

function initBoids() {
  for (var i = 0; i < config.SETUP.NUM_BOIDS; i += 1) {
    boids.push({
      x: Math.random() * width,
      y: Math.random() * height,
      dx: Math.random() * 10 - 5,
      dy: Math.random() * 10 - 5,
      history: new Array(),
      perching: false,
      perchstart: 0
    });
  }
  for (var i = 0; i < config.SETUP.NUM_PREDATOIDS; i +=1) {
    predatoids.push({
      x: Math.random() * width,
      y: Math.random() * height,
      dx: Math.random() * 10 - 5,
      dy: Math.random() * 10 - 5,
      history: new Array(),
      pregnant: false,
      perching: false,
      perchstart: 0
    });
  }
}

function distance(boid1, boid2) {
  return Math.sqrt(
    (boid1.x - boid2.x) * (boid1.x - boid2.x) +
      (boid1.y - boid2.y) * (boid1.y - boid2.y),
  );
}

// TODO: This is naive and inefficient.
function nClosestBoids(boid, n) {
  // Make a copy
  const sorted = boids.slice();
  // Sort the copy by distance from `boid`
  sorted.sort((a, b) => distance(boid, a) - distance(boid, b));
  // Return the `n` closest
  return sorted.slice(1, n + 1);
}

// Called initially and whenever the window resizes to update the canvas
// size and width/height variables.
function sizeCanvas() {
  const canvas = document.getElementById("boids");
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
}

// global update functions

function updateGlobals() {
  
}


// Constrain a boid to within the window. If it gets too close to an edge,
// nudge it back in and reverse its direction.
function keepWithinBounds(boid) {
  const margin = 200;
  const turnFactor = 1;

  if (Math.abs(boid.y) > height*10 && config.MECHANICS.BIRTHS) {
    boid.dead = true;
  }


  if (boid.x < margin) {
    boid.dx += turnFactor;
  }
  if (boid.x > width - margin) {
    boid.dx -= turnFactor
  }
  if (boid.y < margin) {
    boid.dy += turnFactor;
  }
  if((boid.y > height - margin + 100) && config.MECHANICS.PERCHING && boid.pregnant) {
      boid.perchstart = Date.now();
      boid.perching = true;
      boid.dx = 0;
      boid.dy = -1;
      boid.y = height -100;
      boid.history = [[boid.x,boid.y]];
  }
  if ((boid.y > height - margin + 100) && config.MECHANICS.PERCHING) {
    if(Math.random()>0.98) {
      boid.perchstart = Date.now();
      boid.perching = true;
      boid.dx = 0;
      boid.dy = -1;
      boid.y = height -100;
      boid.history = [[boid.x,boid.y]];
    }
    else {
      boid.dy -= turnFactor;
    }
  }
}

// Find the center of mass of the other boids and adjust velocity slightly to
// point towards the center of mass.
function flyTowardsCenter(boid, entities) {
  const centeringFactor = config.BOIDS.CENTERING_FACTOR; // adjust velocity by this %

  let centerX = 0;
  let centerY = 0;
  let numNeighbors = 0;

  for (let otherBoid of entities) {
    if (distance(boid, otherBoid) < config.MECHANICS.VISUAL_RANGE) {
      centerX += otherBoid.x;
      centerY += otherBoid.y;
      numNeighbors += 1;
    }
  }

  if (numNeighbors) {
    centerX = centerX / numNeighbors;
    centerY = centerY / numNeighbors;

    boid.dx += (centerX - boid.x) * centeringFactor;
    boid.dy += (centerY - boid.y) * centeringFactor;
  }
}

// Move away from other boids that are too close to avoid colliding
function avoidOthers(boid, entities) {
  const minDistance = 20; // The distance to stay away from other boids
  const avoidFactor = 0.05; // Adjust velocity by this %
  let moveX = 0;
  let moveY = 0;
  let predmoveX = 0;
  let predmoveY = 0;
  for (let otherBoid of entities) {
    if (otherBoid !== boid) {
      if (distance(boid, otherBoid) < minDistance) {
        moveX += boid.x - otherBoid.x;
        moveY += boid.y - otherBoid.y;
      }
    }
  }
  for (let predator of predatoids) {
    //Check collisions with predator
    if(detectCollision(predator,boid)) {
        if(Math.random() < 0.5) {
          boid.dead = true;
        }
        if (config.MECHANICS.BIRTHS && Math.random() <= 0.35) {
          predator.pregnant = true;
        }
    }
    if (distance(boid, predator) < minDistance) {
      predmoveX += boid.x - predator.x;
      predmoveY += boid.y - predator.y;
    }
  }
  boid.dx += moveX * avoidFactor;
  boid.dy += moveY * avoidFactor;
  boid.dx += predmoveX * 5 * avoidFactor;
  boid.dy += predmoveY * 5 * avoidFactor;
}

function avoidPredOthers(boid) {
  const minDistance = 20; // The distance to stay away from other boids
  const avoidFactor = 0.05; // Adjust velocity by this %
  let moveX = 0;
  let moveY = 0;
  let predmoveX = 0;
  let predmoveY = 0;
  for (let otherBoid of boids) {
    if (otherBoid !== boid) {
      if (distance(boid, predatoids) < minDistance) {
        moveX += boid.x - otherBoid.x;
        moveY += boid.y - otherBoid.y;
      }
    }
  }
  boid.dx += moveX * 5* avoidFactor;
  boid.dy += moveY * 5 * avoidFactor;
}

// Find the average velocity (speed and direction) of the other boids and
// adjust velocity slightly to match.
function matchVelocity(boid) {
  const matchingFactor = 0.05; // Adjust by this % of average velocity

  let avgDX = 0;
  let avgDY = 0;
  let numNeighbors = 0;

  for (let otherBoid of boids) {
    if (distance(boid, otherBoid) < config.MECHANICS.VISUAL_RANGE) {
      avgDX += otherBoid.dx;
      avgDY += otherBoid.dy;
      numNeighbors += 1;
    }
  }

  if (numNeighbors) {
    avgDX = avgDX / numNeighbors;
    avgDY = avgDY / numNeighbors;

    boid.dx += (avgDX - boid.dx) * matchingFactor;
    boid.dy += (avgDY - boid.dy) * matchingFactor;
  }
}

//This function and the predatoid equivalent deal with the perching mechanic
function checkPerching(boid) {
  if((Date.now() - boid.perchstart) > 1500){
      if ((config.MECHANICS.BIRTHS = true) && (Math.random() < selectBirthCoefficient())) {
        boids.push({
          x: boid.x + 5,
          y: boid.y,
          dx: 0,
          dy: -1,
          history: [[boid.x,boid.y]],
          perching: true,
          perchstart: boid.perchstart + 5,
        });
      }
      boid.perching = false;
      perchstart = 0;
      boid.dy = -100;
    }
    else  {
      boid.dy = -1;
      boid.dx = 0;
    }
}

function selectBirthCoefficient() {
  if (boids.length < predatoids.length) {
    return .8;
  }
  
  if (boids.length > 1000) {
    return 0.1;
  }
  return 0.25;
}

function checkPredPerching(predator) {
  if(predator.pregnant) {
    predator.dy += 500;
  }
  
  if((Date.now() - predator.perchstart) > 1500){
      if (predator.pregnant && predator.perching) {
        predatoids.push({
          x: predator.x + 5,
          y: predator.y,
          dx: 0,
          dy: -1,
          history: [[predator.x,predator.y]],
          pregnant: false,
          perching: true,
          perchstart: predator.perchstart,
        });
      }
      if ((Math.random() < 0.1) && predatoids.length > 1) {
        console.log("predator death")
        predator.dead = true;
      }
      predator.perching = false;
      perchstart = 0;
      predator.dy = -10;
    }
    else  {
      predator.dy = -1;
      predator.dx = 0;
    }
}

// Speed will naturally vary in flocking behavior, but real animals can't go
// arbitrarily fast.
function limitSpeed(boid) {
  const speedLimit = 13;

  const speed = Math.sqrt(boid.dx * boid.dx + boid.dy * boid.dy);
  if (speed > speedLimit) {
    boid.dx = (boid.dx / speed) * speedLimit;
    boid.dy = (boid.dy / speed) * speedLimit;
  }
}


function drawBoid(ctx, boid) {
  const angle = Math.atan2(boid.dy, boid.dx);
  ctx.translate(boid.x, boid.y);
  ctx.rotate(angle);
  ctx.translate(-boid.x, -boid.y);
  ctx.fillStyle = "#558cf4";
  ctx.beginPath();
  ctx.moveTo(boid.x, boid.y);
  ctx.lineTo(boid.x - 15, boid.y + 5);
  ctx.lineTo(boid.x - 15, boid.y - 5);
  ctx.lineTo(boid.x, boid.y);
  ctx.fill();
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  if (config.SETUP.DRAW_TRAIL) {
    ctx.strokeStyle = "#558cf466";
    ctx.beginPath();
    ctx.moveTo(boid.history[0][0], boid.history[0][1]);
    for (const point of boid.history) {
      ctx.lineTo(point[0], point[1]);
    }
    ctx.stroke();
  }
}

function detectCollision(boid1,boid2) {
  if(distance(boid1, boid2) < 7.6) {
    return true;
  }
}

function drawPredator(ctx, boid) {
  const angle = Math.atan2(boid.dy, boid.dx);
  ctx.translate(boid.x, boid.y);
  ctx.rotate(angle);
  ctx.translate(-boid.x, -boid.y);
  ctx.fillStyle = "#eb1a1a";
  ctx.beginPath();
  ctx.moveTo(boid.x, boid.y);
  ctx.lineTo(boid.x - 15, boid.y + 5);
  ctx.lineTo(boid.x - 15, boid.y - 5);
  ctx.lineTo(boid.x, boid.y);
  ctx.fill();
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  if (config.SETUP.DRAW_TRAIL && !boid.perching) {
    ctx.strokeStyle = "#eb1a1a66";
    ctx.beginPath();

    ctx.moveTo(boid.history[0][0], boid.history[0][1]);
    for (const point of boid.history) {
      ctx.lineTo(point[0], point[1]);
    }
    ctx.stroke();
  }
}

// Main animation loop
function animationLoop() {
  //Reds cannot go extinct
  if (predatoids.length < 1) {
    predatoids.push({
      x: Math.random() * width,
      y: Math.random() * height,
      dx: Math.random() * 10 - 5,
      dy: Math.random() * 10 - 5,
      history: [[0,0]],
      pregnant: false,
      perching: false,
      perchstart: 0
    });
  }

  // Update each boid
  for (let boid of boids) {


    // Update the velocities according to each rule
    if (boid.perching) {
      checkPerching(boid);
    }
    else {
      flyTowardsCenter(boid,boids);
      avoidOthers(boid,boids);
      matchVelocity(boid);
      limitSpeed(boid);
      keepWithinBounds(boid);


      // Update the position based on the current velocity
      boid.x += boid.dx;
      boid.y += boid.dy;
      boid.history.push([boid.x, boid.y])
      boid.history = boid.history.slice(-50);
    }
  }

  //Weights the predatoids centering factor heavily and slows them down slightly
  for (let predator of predatoids) {
    for(var i =0; i<7;i++) {
      flyTowardsCenter(predator,boids)
    }
    keepWithinBounds(predator);
    limitSpeed(predator);
    avoidPredOthers(predator);
    if (!predator.perching) {
      predator.dx = predator.dx / 1.1;
      predator.dy = predator.dy / 1.1;
      predator.x += predator.dx;
      predator.y += predator.dy;
      predator.history.push([predator.x, predator.y]);
      predator.history = predator.history.slice(-50);

    }
    else if (config.MECHANICS.PERCHING) {
      checkPredPerching(predator);
    }
  }

  boids = boids.filter((boid) => !boid.dead);
  predatoids = predatoids.filter((boid => !boid.dead));

  //Everythign above this line needs to go into update i think


  // Clear the canvas and redraw all the boids in their current positions
  const ctx = document.getElementById("boids").getContext("2d");
  ctx.clearRect(0, 0, width, height);
  for (let boid of boids) {
    drawBoid(ctx, boid);
  }
  for (let predator of predatoids) {
    drawPredator(ctx,predator);
  }

  // Schedule the next frame
  window.requestAnimationFrame(animationLoop);
}

window.onload = () => {
  // Make sure the canvas always fills the whole window
  window.addEventListener("resize", sizeCanvas, false);
  sizeCanvas();

  // Randomly distribute the boids to start
  initBoids();

  // Schedule the main animation loop
  window.requestAnimationFrame(animationLoop);
};
