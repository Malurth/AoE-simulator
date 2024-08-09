//TODO: visualize overlaps better
//TODO: --needs better visualization of multiple aoe overlaps
//TODO: enemy movement?
//TODO: general cleanup/refactor and un-GPT-ifying lol

// Get the canvas element and context
const canvas = document.getElementById("demoCanvas");
const ctx = canvas.getContext("2d");

// Set canvas size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let enemyCount = 50;
const beamWidth = 0.2;
const entitySize = 0.4;
const chainRadius = 6;

let enemyColor = "#FF0000";
let mainBeamHitColor = "#00FF00";
let aoeHitColor = "#FF00FF";
let beamColor = "#FFFFFF";
let playerColor = "#61dafb";

let zoomFactor = 30;
let toridBaseAoE = 3;
let aoeOpacity = 0.1;

let baseBeamLength = 40;
let currentBeamLength = baseBeamLength;

// Control Panel
const beamLengthInput = document.getElementById("beamLengthInput");
const zoomFactorInput = document.getElementById("zoomFactorInput");
const enemyCountInput = document.getElementById("enemyCountInput");
const beamLengthValue = document.getElementById("beamLengthValue");
const zoomFactorValue = document.getElementById("zoomFactorValue");
const enemyCountValue = document.getElementById("enemyCountValue");
const resetButton = document.getElementById("resetButton");
const debugElement = document.getElementById("debug");
const toggleCirclesCheckbox = document.getElementById("toggleCircles");
const toggleBeamsCheckbox = document.getElementById("toggleBeams");

let showCircles = toggleCirclesCheckbox.checked;
let showBeams = toggleBeamsCheckbox.checked;

toggleCirclesCheckbox.addEventListener("change", () => {
  showCircles = toggleCirclesCheckbox.checked;
  draw();
});

toggleBeamsCheckbox.addEventListener("change", () => {
  showBeams = toggleBeamsCheckbox.checked;
  draw();
});

resetButton.addEventListener("click", resetGame);

beamLengthInput.addEventListener("input", () => {
  baseBeamLength = parseFloat(beamLengthInput.value);
  beamLengthValue.textContent = baseBeamLength;
  draw();
});

zoomFactorInput.addEventListener("input", () => {
  zoomFactor = parseFloat(zoomFactorInput.value);
  zoomFactorValue.textContent = zoomFactor;
  ctx.setTransform(zoomFactor, 0, 0, zoomFactor, 0, 0);
  resetGame();
  draw();
});

enemyCountInput.addEventListener("input", () => {
  enemyCount = parseFloat(enemyCountInput.value);
  enemyCountValue.textContent = enemyCount;
  resetGame();
  draw();
});

// Initialize control panel values
document.getElementById("beamLengthInput").value = baseBeamLength;
document.getElementById("beamLengthValue").textContent = baseBeamLength;

document.getElementById("zoomFactorInput").value = zoomFactor;
document.getElementById("zoomFactorValue").textContent = zoomFactor;

document.getElementById("enemyCountInput").value = enemyCount;
document.getElementById("enemyCountValue").textContent = enemyCount;

document.getElementById("toggleCircles").checked = showCircles;
document.getElementById("toggleBeams").checked = showBeams;

// Set legend colors dynamically
document.getElementById("enemyColor").style.backgroundColor = enemyColor;
document.getElementById("beamHitColor").style.backgroundColor =
  mainBeamHitColor;
document.getElementById("aoeHitColor").style.backgroundColor = aoeHitColor;
document.getElementById("beamColor").style.backgroundColor = beamColor;
document.getElementById("playerColor").style.backgroundColor = playerColor;

// Add event listeners to color pickers
document.getElementById("enemyColorPicker").value = enemyColor;
document.getElementById("beamHitColorPicker").value = mainBeamHitColor;
document.getElementById("aoeHitColorPicker").value = aoeHitColor;
document.getElementById("beamColorPicker").value = beamColor;
document.getElementById("playerColorPicker").value = playerColor;

document.getElementById("enemyColor").addEventListener("click", () => {
  document.getElementById("enemyColorPicker").click();
});

document.getElementById("beamHitColor").addEventListener("click", () => {
  document.getElementById("beamHitColorPicker").click();
});

document.getElementById("aoeHitColor").addEventListener("click", () => {
  document.getElementById("aoeHitColorPicker").click();
});

document.getElementById("beamColor").addEventListener("click", () => {
  document.getElementById("beamColorPicker").click();
});

document.getElementById("playerColor").addEventListener("click", () => {
  document.getElementById("playerColorPicker").click();
});

document
  .getElementById("enemyColorPicker")
  .addEventListener("input", (event) => {
    enemyColor = event.target.value;
    document.getElementById("enemyColor").style.backgroundColor = enemyColor;
    draw();
  });

document
  .getElementById("beamHitColorPicker")
  .addEventListener("input", (event) => {
    mainBeamHitColor = event.target.value;
    document.getElementById("beamHitColor").style.backgroundColor =
      mainBeamHitColor;
    draw();
  });

document
  .getElementById("aoeHitColorPicker")
  .addEventListener("input", (event) => {
    aoeHitColor = event.target.value;
    document.getElementById("aoeHitColor").style.backgroundColor = aoeHitColor;
    draw();
  });

document
  .getElementById("beamColorPicker")
  .addEventListener("input", (event) => {
    beamColor = event.target.value;
    document.getElementById("beamColor").style.backgroundColor = beamColor;
    draw();
  });

document
  .getElementById("playerColorPicker")
  .addEventListener("input", (event) => {
    playerColor = event.target.value;
    document.getElementById("playerColor").style.backgroundColor = playerColor;
    player.color = playerColor; // Update player color
    draw();
  });

// Apply zoom to the canvas context
ctx.scale(zoomFactor, zoomFactor);

class Entity {
  constructor(x, y, color) {
    this.x = x / zoomFactor;
    this.y = y / zoomFactor;
    this.color = color;
    this.radius = entitySize;
    this.sortedEnemies = [];
  }

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

class Player extends Entity {
  constructor(x, y) {
    super(x, y, playerColor);
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

class Enemy extends Entity {
  constructor(x, y) {
    super(x, y, enemyColor); // Red color for enemies
    this.isHit = false; // Initialize as not hit
    this.aoeHit = false;
  }

  draw(ctx) {
    // Determine the color based on hit status
    this.color = this.isHit
      ? this.aoeHit
        ? mainBeamHitColor
        : mainBeamHitColor
      : this.aoeHit
      ? aoeHitColor
      : enemyColor;

    // Draw the main circle
    super.draw(ctx);

    // Draw the smaller inner circle if hit by both
    if (this.isHit && this.aoeHit) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, entitySize / 2, 0, Math.PI * 2);
      ctx.fillStyle = aoeHitColor; // Purple for the inner circle
      ctx.fill();
    }

    if (showCircles) {
      if (this.isHit) {
        this.drawHitRing(mainBeamHitColor, ctx); // Draw the ring if hit
      }
      if (this.aoeHit) {
        this.drawHitRing(aoeHitColor, ctx); // Draw the ring if hit
      }
    }
  }

  drawHitRing(color, ctx) {
    ctx.globalAlpha = aoeOpacity; // Set transparency level (0.0 to 1.0)
    ctx.beginPath();
    ctx.arc(this.x, this.y, 6, 0, Math.PI * 2);
    ctx.strokeStyle = color; // Color of the ring
    ctx.lineWidth = 2 / zoomFactor; // Adjust line width
    ctx.stroke();

    // Fill the circle with a transparent color
    ctx.fillStyle = color; // Use the same color as the ring
    ctx.fill();
    ctx.globalAlpha = 1.0; // Reset transparency to default
  }

  hitWithTorid(isMainBeam, enemies, ctx) {
    if (isMainBeam) {
      this.isHit = true;
    } else {
      this.aoeHit = true;
    }
    this.updateSortedEnemies(enemies);
    const chain = new Chain(this, this.sortedEnemies, 5, isMainBeam);
    chain.drawChainLinks(ctx); // Draw the chain links
  }
}

class Chain {
  constructor(startEnemy, enemies, maxChains, isMainBeam) {
    this.startEnemy = startEnemy;
    this.enemies = enemies;
    this.maxChains = maxChains;
    this.isMainBeam = isMainBeam;
    this.chainedEnemies = new Set([startEnemy]);
    this.chainLinks = [];
    this.chainHits(startEnemy, maxChains);
  }

  chainHits(currentEnemy, remainingChains) {
    if (remainingChains <= 0) return;

    currentEnemy.updateSortedEnemies(this.enemies);

    for (let enemy of currentEnemy.sortedEnemies) {
      if (this.chainedEnemies.has(enemy)) continue; // Skip already chained enemies

      const distance = calculateDistance(
        currentEnemy.x,
        currentEnemy.y,
        enemy.x,
        enemy.y
      );

      if (distance <= chainRadius) {
        this.chainedEnemies.add(enemy);
        this.chainLinks.push({ from: currentEnemy, to: enemy }); // Add the link

        if (this.isMainBeam) {
          enemy.isHit = true;
        } else {
          enemy.aoeHit = true;
        }

        // Chain to the next enemy
        this.chainHits(enemy, remainingChains - 1);
        break;
      }
    }
  }

  drawChainLinks(ctx) {
    if (!showBeams) return; // Skip drawing if beams are toggled off

    this.isMainBeam
      ? (ctx.strokeStyle = mainBeamHitColor)
      : (ctx.strokeStyle = aoeHitColor);
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = 0.2;
    for (let link of this.chainLinks) {
      ctx.beginPath();
      ctx.moveTo(link.from.x, link.from.y);
      ctx.lineTo(link.to.x, link.to.y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1.0;
  }
}

// Create a player at the center of the screen
const player = new Player(canvas.width / 2, canvas.height / 2);

// Create enemies at random positions
const enemies = [];
for (let i = 0; i < enemyCount; i++) {
  const x = (Math.random() * 0.8 + 0.1) * canvas.width;
  const y = (Math.random() * 0.8 + 0.1) * canvas.height;
  enemies.push(new Enemy(x, y));
}

let mouseX = canvas.width / 2 / zoomFactor;
let mouseY = canvas.height / 2 / zoomFactor;

function calculateDistance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function checkBeamCollision(startX, startY, endX, endY) {
  let intersection = false;
  let isEnemyHit = false; // Track if an enemy is hit by the main beam

  player.updateSortedEnemies(enemies);

  // Reset isHit and aoeHit
  for (let enemy of player.sortedEnemies) {
    enemy.isHit = false;
    enemy.aoeHit = false;
  }

  for (let enemy of player.sortedEnemies) {
    // Calculate beam segment vector
    const beamDX = endX - startX;
    const beamDY = endY - startY;
    const beamLength = Math.sqrt(beamDX * beamDX + beamDY * beamDY);

    if (beamLength === 0) {
      const distance = calculateDistance(startX, startY, enemy.x, enemy.y);
      if (distance <= enemy.radius && !enemy.isHit) {
        isEnemyHit = true; // Mark enemy as hit by the main beam
        enemy.hitWithTorid(true, enemies, ctx); // Chain hit to nearby enemies
        return {
          intersected: true,
          endX: enemy.x,
          endY: enemy.y,
          enemyHit: enemy, // Return enemy hit status
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
      isEnemyHit = true; // Mark enemy as hit by the main beam
      enemy.hitWithTorid(true, enemies, ctx); // Chain hit to nearby enemies
      return {
        intersected: true,
        endX: closestX,
        endY: closestY,
        enemyHit: enemy, // Return enemy hit status
      };
    }
  }

  return {
    intersected: intersection,
    endX,
    endY,
    enemyHit: null, // Return enemy hit status
  };
}

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
  ctx.strokeStyle = beamColor;
  ctx.lineWidth = beamWidth;
  ctx.stroke();

  // Draw the player
  player.draw(ctx);

  // Variables to count hits
  let mainBeamDirectHits = 0;
  let totalMainBeamHits = 0;
  let aoeDirectHits = 0;
  let totalAoeHits = 0;

  if (collisionResult.enemyHit) {
    mainBeamDirectHits++;
  }
  // Draw the beam AoE if LMB is held down or an enemy is hit
  ctx.beginPath();
  ctx.arc(
    collisionResult.endX,
    collisionResult.endY,
    toridBaseAoE,
    0,
    Math.PI * 2
  );
  ctx.strokeStyle = beamColor; // Color of the circle
  ctx.lineWidth = 1 / zoomFactor; // Adjust line width
  ctx.stroke();

  // Fill the circle with a transparent color
  ctx.globalAlpha = aoeOpacity; // Set transparency level (0.0 to 1.0)
  ctx.fillStyle = beamColor; // Use the same color as the beam
  ctx.fill();
  ctx.globalAlpha = 1.0; // Reset transparency to default

  // Check for enemies within the smaller AoE
  for (let enemy of enemies) {
    // Exclude the enemy directly hit by the main beam
    if (enemy === collisionResult.enemyHit) continue;

    const distanceToAoE = calculateDistance(
      collisionResult.endX,
      collisionResult.endY,
      enemy.x,
      enemy.y
    );
    if (distanceToAoE <= toridBaseAoE) {
      enemy.hitWithTorid(false, enemies, ctx);
      aoeDirectHits++;
    }
  }

  // Count main beam hits
  for (let enemy of enemies) {
    if (enemy.isHit) {
      totalMainBeamHits++;
    }
    if (enemy.aoeHit) {
      totalAoeHits++;
    }
  }

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
    Main Beam Hits (w/ chain): ${totalMainBeamHits}<br>
    AoE Hits (w/ chains): ${totalAoeHits}<br>
    Main Beam Direct Hits (w/ chain): ${mainBeamDirectHits}<br>
    AoE Direct Hits: ${aoeDirectHits}<br>
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

  // Normalize diagonal movement because I'll be GODDAMNED if I'm gonna let anyone go faster by moving diagonally
  if (dx !== 0 && dy !== 0) {
    dx *= Math.SQRT1_2;
    dy *= Math.SQRT1_2;
  }

  // Update player position based on keys pressed
  player.updatePosition(dx, dy);

  // Redraw the canvas
  draw();

  // Call update again on the next animation frame
  requestAnimationFrame(update);
}

// Update mouse position and LMB state
canvas.addEventListener("mousemove", (event) => {
  mouseX = event.clientX / zoomFactor;
  mouseY = event.clientY / zoomFactor;
  draw();
});

canvas.addEventListener("mousedown", (event) => {
  if (event.button === 0) {
    toridBaseAoE = 4.32; // primed firestorm
    draw();
  }
});

canvas.addEventListener("mouseup", (event) => {
  if (event.button === 0) {
    toridBaseAoE = 3; // regular
    draw();
  }
});

function resetGame() {
  // Reset player position to the center of the screen
  player.x = canvas.width / 2 / zoomFactor;
  player.y = canvas.height / 2 / zoomFactor;

  // Clear and repopulate enemies
  enemies.length = 0;
  for (let i = 0; i < enemyCount; i++) {
    const x = (Math.random() * 0.8 + 0.1) * canvas.width;
    const y = (Math.random() * 0.8 + 0.1) * canvas.height;
    enemies.push(new Enemy(x, y));
  }

  // Redraw the canvas
  draw();
}

// Initial draw and start the update loop
draw();
update();
