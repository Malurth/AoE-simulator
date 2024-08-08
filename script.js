// Get the canvas element and context
const canvas = document.getElementById("demoCanvas");
const ctx = canvas.getContext("2d");

// Set canvas size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Zoom factor: Controls how much the canvas is zoomed in
let zoomFactor = 20;
const beamWidth = 4;

// Maximum beam length in pixels
let baseBeamLength = 40; // Represents 40 meters
let currentBeamLength = baseBeamLength; // Initialize current length with base length

// Control Panel
const beamLengthInput = document.getElementById("beamLengthInput");
const zoomFactorInput = document.getElementById("zoomFactorInput");
const beamLengthValue = document.getElementById("beamLengthValue");
const zoomFactorValue = document.getElementById("zoomFactorValue");
const debugElement = document.getElementById("debug");

beamLengthInput.addEventListener("input", () => {
  baseBeamLength = parseFloat(beamLengthInput.value);
  beamLengthValue.textContent = baseBeamLength;
  draw(); // Redraw the canvas to reflect the new beam length
});

zoomFactorInput.addEventListener("input", () => {
  zoomFactor = parseFloat(zoomFactorInput.value);
  zoomFactorValue.textContent = zoomFactor;
  ctx.setTransform(zoomFactor, 0, 0, zoomFactor, 0, 0);
  draw();
});

// Apply zoom to the canvas context
ctx.scale(zoomFactor, zoomFactor);

// Base class for all entities (player and enemies)
class Entity {
  constructor(x, y, color) {
    this.x = x / zoomFactor;
    this.y = y / zoomFactor;
    this.color = color;
    this.radius = 0.5;
    this.sortedEnemies = []; // Initialize the sorted list
  }

  // Method to update the sorted list of enemies
  updateSortedEnemies(enemies) {
    this.sortedEnemies = [...enemies].sort((a, b) => {
      const distA = calculateDistance(this.x, this.y, a.x, a.y);
      const distB = calculateDistance(this.x, this.y, b.x, b.y);
      return distA - distB; // Ascending distance
    });
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// In the Player class or anywhere where the enemies are available
function updateEntities() {
  enemies.forEach((enemy) => {
    enemy.updateSortedEnemies(enemies);
  });
  player.updateSortedEnemies(enemies);
}

// Player class, inherits from Entity
class Player extends Entity {
  constructor(x, y) {
    super(x, y, "#61dafb"); // Light blue color
    this.speed = 5 / zoomFactor; // Adjust speed for zoom
  }

  updatePosition(dx, dy) {
    this.x += dx;
    this.y += dy;

    // Ensure the player stays within the canvas boundaries
    if (this.x < 0) this.x = 0;
    if (this.x > canvas.width / zoomFactor) this.x = canvas.width / zoomFactor;
    if (this.y < 0) this.y = 0;
    if (this.y > canvas.height / zoomFactor)
      this.y = canvas.height / zoomFactor;
  }
}

// Enemy class, inherits from Entity
class Enemy extends Entity {
  constructor(x, y) {
    super(x, y, "#ff0000"); // Red color for enemies
    this.isHit = false; // Initialize as not hit
  }

  draw(ctx) {
    this.color = this.isHit ? "#00ff00" : "#ff0000";
    super.draw(ctx); // Draw the enemy as before

    if (this.isHit) {
      this.drawHitRing(ctx); // Draw the ring if hit
    }
  }

  drawHitRing(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, 6, 0, Math.PI * 2);
    ctx.strokeStyle = "#00ff00"; // Color of the ring
    ctx.lineWidth = 2 / zoomFactor; // Adjust line width
    ctx.stroke();
  }
}

// Create a player at the center of the screen
const player = new Player(canvas.width / 2, canvas.height / 2);

// Create enemies at random positions closer to the center
const enemies = [];
for (let i = 0; i < 12; i++) {
  const x = Math.random() * (canvas.width / 2) + canvas.width / 4;
  const y = Math.random() * (canvas.height / 2) + canvas.height / 4;
  enemies.push(new Enemy(x, y));
}

// Variables to store mouse position
let mouseX = canvas.width / 2 / zoomFactor;
let mouseY = canvas.height / 2 / zoomFactor;

// Calculate the distance between two points
function calculateDistance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function checkBeamCollision(startX, startY, endX, endY) {
  let closestPoint = { x: endX, y: endY };
  let intersection = false;

  player.updateSortedEnemies(enemies);

  // Reset isHit
  for (let enemy of player.sortedEnemies) {
    enemy.isHit = false;
  }

  for (let enemy of player.sortedEnemies) {
    // Calculate beam segment vector
    const beamDX = endX - startX;
    const beamDY = endY - startY;
    const beamLength = Math.sqrt(beamDX * beamDX + beamDY * beamDY);

    if (beamLength === 0) {
      const distance = calculateDistance(startX, startY, enemy.x, enemy.y);
      if (distance <= enemy.radius && !enemy.isHit) {
        enemy.isHit = true;
        return {
          intersected: true,
          endX: enemy.x,
          endY: enemy.y,
        };
      }
      continue;
    }

    // Project the enemy point onto the beam segment
    const projection =
      ((enemy.x - startX) * beamDX + (enemy.y - startY) * beamDY) /
      (beamLength * beamLength);
    let closestX = startX + projection * beamDX;
    let closestY = startY + projection * beamDY;

    // Check if the closest point is within the beam segment
    if (projection < 0) {
      closestX = startX;
      closestY = startY;
    } else if (projection > 1) {
      closestX = endX;
      closestY = endY;
    }

    // Calculate distance from the enemy to the closest point
    const closestDistance = calculateDistance(
      closestX,
      closestY,
      enemy.x,
      enemy.y
    );

    if (closestDistance <= enemy.radius) {
      enemy.isHit = true;
      return {
        intersected: true,
        endX: closestX,
        endY: closestY,
      };
    }
  }

  return {
    intersected: intersection,
    endX,
    endY,
  };
}

// Draw the player, enemies, and the line to the mouse
function draw() {
  ctx.clearRect(0, 0, canvas.width / zoomFactor, canvas.height / zoomFactor);

  const distance = calculateDistance(player.x, player.y, mouseX, mouseY);

  let beamEndX = mouseX;
  let beamEndY = mouseY;

  if (distance > baseBeamLength) {
    const ratio = baseBeamLength / distance;
    beamEndX = player.x + (mouseX - player.x) * ratio;
    beamEndY = player.y + (mouseY - player.y) * ratio;
  }

  // Check for beam collision with enemies and adjust endpoint if needed
  const collisionResult = checkBeamCollision(
    player.x,
    player.y,
    beamEndX,
    beamEndY
  );

  // Update current beam length
  currentBeamLength = calculateDistance(
    player.x,
    player.y,
    collisionResult.endX,
    collisionResult.endY
  );

  // Draw the line from the player to the calculated beam endpoint
  ctx.beginPath();
  ctx.moveTo(player.x, player.y);
  ctx.lineTo(collisionResult.endX, collisionResult.endY);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = beamWidth / zoomFactor;
  ctx.stroke();

  // Draw the player
  player.draw(ctx);

  // Draw all enemies
  enemies.forEach((enemy) => enemy.draw(ctx));

  // Display debugging information
  debugElement.innerHTML = `
    Player Position: (${player.x.toFixed(2)}, ${player.y.toFixed(2)})<br>
    Mouse Position: (${mouseX.toFixed(2)}, ${mouseY.toFixed(2)})<br>
    Base Beam Length: ${baseBeamLength.toFixed(2)}<br>
    Current Beam Length: ${currentBeamLength.toFixed(2)}<br>
    Beam Endpoint: (${collisionResult.endX.toFixed(
      2
    )}, ${collisionResult.endY.toFixed(2)})<br>
    Collision Detected: ${collisionResult.intersected}<br>
  `;
}

// Handle keypresses
let keys = {};

window.addEventListener("keydown", (event) => {
  keys[event.key] = true;
});

window.addEventListener("keyup", (event) => {
  keys[event.key] = false;
});

function update() {
  let dx = 0;
  let dy = 0;

  // WASD controls
  if (keys["w"] || keys["ArrowUp"]) {
    dy = -player.speed;
  }
  if (keys["s"] || keys["ArrowDown"]) {
    dy = player.speed;
  }
  if (keys["a"] || keys["ArrowLeft"]) {
    dx = -player.speed;
  }
  if (keys["d"] || keys["ArrowRight"]) {
    dx = player.speed;
  }

  // Update player position based on keys pressed
  player.updatePosition(dx, dy);

  // Redraw the canvas
  draw();

  // Call update again on the next animation frame
  requestAnimationFrame(update);
}

// Update mouse position
canvas.addEventListener("mousemove", (event) => {
  mouseX = event.clientX / zoomFactor;
  mouseY = event.clientY / zoomFactor;
  draw();
});

// Initial draw and start the update loop
draw();
update();
