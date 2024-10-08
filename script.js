//TODO: fix UI so it works well with any dimension window
//TODO: cool little ui popup or tooltip or something explaining features
//TODO: general cleanup/refactor and un-GPT-ifying lol
//TODO: enemy spawn controls?
//TODO: expand scope to saryn spore/miasma simulation?
//TODO: fix instructions not appearing good on mobile

const canvas = document.getElementById("demoCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const beamWidth = 0.2;
const playerSpeed = 5;

let enemyColor = "#FF0000";
let mainBeamHitColor = "#00FF00";
let aoeHitColor = "#FF00FF";
let beamColor = "#FFFFFF";
let playerColor = "#61dafb";

let multishot = 300;
let enemySpeed = 0.1;
let entitySize = 0.5;
let zoomFactor = isSmallScreen() ? 30 : 50;
let enemyCount = isSmallScreen() ? 25 : 50;
let toridBaseAoE = 3;
let aoeOpacity = 0.05;
let baseBeamLength = 40;
let maxChainDepth = 5;
let chainRadius = 6;
let currentBeamLength = baseBeamLength;

// #region UI
const beamLengthInput = document.getElementById("beamLengthInput");
const zoomFactorInput = document.getElementById("zoomFactorInput");
const enemyCountInput = document.getElementById("enemyCountInput");
const enemySpeedInput = document.getElementById("enemySpeedInput");
const maxChainDepthInput = document.getElementById("maxChainDepthInput");
const chainRadiusInput = document.getElementById("chainRadiusInput");
const entitySizeInput = document.getElementById("entitySizeInput");
const beamLengthValue = document.getElementById("beamLengthValue");
const zoomFactorValue = document.getElementById("zoomFactorValue");
const enemyCountValue = document.getElementById("enemyCountValue");
const enemySpeedValue = document.getElementById("enemySpeedValue");
const maxChainDepthValue = document.getElementById("maxChainDepthValue");
const chainRadiusValue = document.getElementById("chainRadiusValue");
const entitySizeValue = document.getElementById("entitySizeValue");
const resetButton = document.getElementById("resetButton");
const debugElement = document.getElementById("debug");
const toggleCirclesCheckbox = document.getElementById("toggleCircles");
const toggleBeamsCheckbox = document.getElementById("toggleBeams");
const toggleEnemyMovementCheckbox = document.getElementById("toggleEnemyMovement");
const toggleDamageNumbersCheckbox = document.getElementById("toggleDamageNumbers");
const toggleStatusChanceCheckbox = document.getElementById("toggleStatusChance");
const useMultishotCheckbox = document.getElementById("useMultishot");
const useMultishotAs100PercentCheckbox = document.getElementById("useMultishotAs100Percent");
const multishotCountInput = document.getElementById("multishotCountInput");
const uiContainer = document.getElementById("ui-container");
const hideUIButton = document.getElementById("hideUIButton");
const showUIButton = document.getElementById("showUIButton");
const firestormToggle = document.getElementById("firestormToggle");

let showCircles = toggleCirclesCheckbox.dataset.state;
let showBeams = toggleBeamsCheckbox.checked;
let enemyMovementEnabled = toggleEnemyMovementCheckbox.checked;
let showDamageNumbers = toggleDamageNumbersCheckbox.checked;
let showStatusChance = false;
let useMultishot = useMultishotCheckbox.checked;
let useMultishotAs100Percent = useMultishotAs100PercentCheckbox.checked;
let isPrimedFirestormActive = false;

if (showCircles === "full") {
  toggleCirclesCheckbox.nextElementSibling.style.backgroundColor = "green";
} else if (showCircles === "partial") {
  toggleCirclesCheckbox.nextElementSibling.style.backgroundColor = "orange";
} else {
  toggleCirclesCheckbox.nextElementSibling.style.backgroundColor = "red";
}

const circleStates = ["full", "partial", "off"];
const circleColors = {
  full: "green",
  partial: "orange",
  off: "red",
};

toggleCirclesCheckbox.addEventListener("change", () => {
  const currentState = toggleCirclesCheckbox.dataset.state;
  const nextState = circleStates[(circleStates.indexOf(currentState) + 1) % circleStates.length];
  toggleCirclesCheckbox.dataset.state = nextState;
  toggleCirclesCheckbox.nextElementSibling.style.backgroundColor = circleColors[nextState];
  showCircles = nextState;
  draw();
});

toggleBeamsCheckbox.addEventListener("change", () => {
  showBeams = toggleBeamsCheckbox.checked;
  draw();
});

toggleDamageNumbersCheckbox.addEventListener("change", () => {
  showDamageNumbers = toggleDamageNumbersCheckbox.checked;
  draw();
});

toggleStatusChanceCheckbox.addEventListener("change", () => {
  showStatusChance = toggleStatusChanceCheckbox.checked;
  draw();
});

toggleEnemyMovementCheckbox.addEventListener("change", () => {
  enemyMovementEnabled = toggleEnemyMovementCheckbox.checked;
});

enemySpeedInput.addEventListener("input", () => {
  enemySpeed = parseFloat(enemySpeedInput.value);
  enemySpeedValue.textContent = enemySpeed;
  enemies.forEach((enemy) => enemy.updateVelocity());
});

entitySizeInput.addEventListener("input", () => {
  entitySize = parseFloat(entitySizeInput.value);
  entitySizeValue.textContent = entitySize;
  enemies.forEach((enemy) => (enemy.radius = entitySize));
  player.radius = entitySize;
  draw();
});

useMultishotCheckbox.addEventListener("change", () => {
  useMultishot = useMultishotCheckbox.checked;
  useMultishotAs100PercentCheckbox.disabled = !useMultishot;
  document.getElementById("useMultishotAs100PercentLabel").style.opacity = useMultishot ? "1" : "0.5";
  draw();
});

useMultishotAs100PercentCheckbox.addEventListener("change", () => {
  useMultishotAs100Percent = useMultishotAs100PercentCheckbox.checked;
  draw();
});

multishotCountInput.addEventListener("input", () => {
  const value = parseInt(multishotCountInput.value);
  if (!isNaN(value) && value >= 100 && value <= 1000) {
    multishot = value;
    draw();
  }
});

resetButton.addEventListener("click", resetToridVariables);
showUIButton.addEventListener("click", showUI);
hideUIButton.addEventListener("click", hideUI);

beamLengthInput.addEventListener("input", () => {
  baseBeamLength = parseFloat(beamLengthInput.value);
  beamLengthValue.textContent = baseBeamLength;
  draw();
});

maxChainDepthInput.addEventListener("input", () => {
  maxChainDepth = parseFloat(maxChainDepthInput.value);
  maxChainDepthValue.textContent = maxChainDepth;
  draw();
});

chainRadiusInput.addEventListener("input", () => {
  chainRadius = parseFloat(chainRadiusInput.value);
  chainRadiusValue.textContent = chainRadius;
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

firestormToggle.addEventListener("change", () => {
  isPrimedFirestormActive = firestormToggle.checked;
  toridBaseAoE = isPrimedFirestormActive ? 4.32 : 3;
  draw();
});

// Initialize control panel values
document.getElementById("beamLengthInput").value = baseBeamLength;
document.getElementById("beamLengthValue").textContent = baseBeamLength;

document.getElementById("entitySizeInput").value = entitySize;
document.getElementById("entitySizeValue").textContent = entitySize;

document.getElementById("zoomFactorInput").value = zoomFactor;
document.getElementById("zoomFactorValue").textContent = zoomFactor;

document.getElementById("enemyCountInput").value = enemyCount;
document.getElementById("enemyCountValue").textContent = enemyCount;

document.getElementById("maxChainDepthInput").value = maxChainDepth;
document.getElementById("maxChainDepthValue").textContent = maxChainDepth;

document.getElementById("chainRadiusInput").value = chainRadius;
document.getElementById("chainRadiusValue").textContent = chainRadius;

document.getElementById("toggleCircles").checked = showCircles;
document.getElementById("toggleBeams").checked = showBeams;
document.getElementById("toggleEnemyMovement").checked = enemyMovementEnabled;
document.getElementById("toggleDamageNumbers").checked = showDamageNumbers;
document.getElementById("toggleStatusChance").checked = false;
document.getElementById("useMultishot").checked = useMultishot;
document.getElementById("useMultishotAs100Percent").checked = useMultishotAs100Percent;
document.getElementById("useMultishotAs100Percent").disabled = !useMultishot;
document.getElementById("useMultishotAs100PercentLabel").style.opacity = useMultishot ? "1" : "0.5";
document.getElementById("multishotCountInput").value = multishot;

document.getElementById("enemySpeedInput").value = enemySpeed;
document.getElementById("enemySpeedValue").textContent = enemySpeed;

firestormToggle.checked = isPrimedFirestormActive;
// #endregion

// #region Color Picker / Legend

// Set legend colors dynamically
document.getElementById("enemyColor").style.backgroundColor = enemyColor;
document.getElementById("beamHitColor").style.backgroundColor = mainBeamHitColor;
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

document.getElementById("enemyColorPicker").addEventListener("input", (event) => {
  enemyColor = event.target.value;
  document.getElementById("enemyColor").style.backgroundColor = enemyColor;
  draw();
});

document.getElementById("beamHitColorPicker").addEventListener("input", (event) => {
  mainBeamHitColor = event.target.value;
  document.getElementById("beamHitColor").style.backgroundColor = mainBeamHitColor;
  draw();
});

document.getElementById("aoeHitColorPicker").addEventListener("input", (event) => {
  aoeHitColor = event.target.value;
  document.getElementById("aoeHitColor").style.backgroundColor = aoeHitColor;
  draw();
});

document.getElementById("beamColorPicker").addEventListener("input", (event) => {
  beamColor = event.target.value;
  document.getElementById("beamColor").style.backgroundColor = beamColor;
  draw();
});

document.getElementById("playerColorPicker").addEventListener("input", (event) => {
  playerColor = event.target.value;
  document.getElementById("playerColor").style.backgroundColor = playerColor;
  player.color = playerColor;
  draw();
});

//#endregion

showUIButton.style.display = "none";

function showUI() {
  uiContainer.style.display = "flex";
  showUIButton.style.display = "none";
}

function hideUI() {
  uiContainer.style.display = "none";
  showUIButton.style.display = "block";
}

// Apply zoom to the canvas context
ctx.scale(zoomFactor, zoomFactor);

class Entity {
  constructor(x, y, color) {
    this.x = x / zoomFactor;
    this.y = y / zoomFactor;
    this.color = color;
    this.radius = entitySize;
    this.sortedEnemies = [];
    this.velocityX = 0;
    this.velocityY = 0;
  }

  updateSortedEnemies(enemies) {
    this.sortedEnemies = [...enemies].sort((a, b) => {
      const distA = calculateDistance(this.x, this.y, a.x, a.y);
      const distB = calculateDistance(this.x, this.y, b.x, b.y);
      return distA - distB; // Ascending distance
    });
  }

  draw(ctx) {
    ctx.beginPath(); //outline
    ctx.fillStyle = this.color;
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 0.02;
    ctx.strokeStyle = "#000000";
    ctx.stroke();
  }

  updatePosition(dx, dy) {
    this.x += dx;
    this.y += dy;

    // Ensure the entity stays within the canvas boundaries
    if (this.x < this.radius) this.x = this.radius;
    if (this.x > canvas.width / zoomFactor - this.radius) this.x = canvas.width / zoomFactor - this.radius;
    if (this.y < this.radius) this.y = this.radius;
    if (this.y > canvas.height / zoomFactor - this.radius) this.y = canvas.height / zoomFactor - this.radius;
  }
}

class Player extends Entity {
  constructor(x, y) {
    super(x, y, playerColor);
    this.speed = playerSpeed / zoomFactor;
  }
}

class Enemy extends Entity {
  constructor(x, y) {
    super(x, y, enemyColor);
    this.isHit = false;
    this.aoeHit = false;
    this.isPrimaryMainBeamTarget = false;
    this.isPrimaryAoETarget = false;
    this.velocityX = ((Math.random() - 0.5) * enemySpeed) / zoomFactor;
    this.velocityY = ((Math.random() - 0.5) * enemySpeed) / zoomFactor;
    this.initialDirection = { x: this.velocityX, y: this.velocityY };
    this.chains = [];
  }

  addChainInfo(chain, depth) {
    this.chains.push({ chain, depth });
  }

  clearChainInfo() {
    this.chains = [];
  }

  calculateTotalDamageAndStatus() {
    let totalMainBeamDamage = 0;
    let totalAoeDamage = 0;
    let statusChance = 0;

    if (this.isPrimaryMainBeamTarget) {
      totalMainBeamDamage += useMultishot ? multishot : 100;
      statusChance += useMultishot ? multishot : 100;
    }

    let mainBeamChainDepth = this.chains.filter((c) => c.chain.isMainBeam).reduce((min, c) => Math.min(min, c.depth), Infinity);
    if (mainBeamChainDepth !== Infinity) {
      totalMainBeamDamage += 100 * Math.pow(0.75, mainBeamChainDepth) * (useMultishot ? multishot / 100 : 1);
      statusChance += useMultishot ? multishot : 100;
    }

    if (this.isPrimaryAoETarget) {
      totalAoeDamage += 100;
      statusChance += 100;
    }

    this.chains
      .filter((c) => !c.chain.isMainBeam)
      .forEach((c) => {
        totalAoeDamage += 100 * Math.pow(0.75, c.depth);
        statusChance += 100;
      });

    let totalDamage = totalMainBeamDamage + totalAoeDamage;

    if (useMultishot && useMultishotAs100Percent) {
      totalDamage /= multishot / 100;
      totalMainBeamDamage /= multishot / 100;
      totalAoeDamage /= multishot / 100;
      statusChance /= multishot / 100;
    }

    return {
      totalDamage,
      mainBeamDamage: totalMainBeamDamage,
      aoeDamage: totalAoeDamage,
      statusChance,
    };
  }

  draw(ctx) {
    this.color = this.isHit ? (this.aoeHit ? mainBeamHitColor : mainBeamHitColor) : this.aoeHit ? aoeHitColor : enemyColor;

    // Draw the main circle
    super.draw(ctx);

    // Draw the smaller inner circle if hit by both
    if (this.isHit && this.aoeHit) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, entitySize / 2, 0, Math.PI * 2);
      ctx.fillStyle = aoeHitColor; // Purple for the inner circle
      ctx.fill();
    }

    if (showCircles !== "off") {
      if (this.isHit) {
        this.drawHitRing(mainBeamHitColor, ctx);
      }
      if (this.aoeHit) {
        this.drawHitRing(aoeHitColor, ctx);
      }
    }

    // Draw the number of chains above the enemy in bold
    ctx.font = `bold ${0.8 * entitySize}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 0.05;
    ctx.fillStyle = "#000000";
    ctx.fillText(this.chains.length, this.x, this.y + entitySize / 15);

    // Calculate and draw the total damage percentage and status chance above the enemy
    if (showDamageNumbers || showStatusChance) {
      let partialScaleFactor = 1 + Math.log(100 / zoomFactor);
      let fontSize = 0.3 * partialScaleFactor;
      ctx.font = `${fontSize}px Arial`;
      const { totalDamage, mainBeamDamage, aoeDamage, statusChance } = this.calculateTotalDamageAndStatus();
      ctx.strokeStyle = "#000000";
      ctx.fillStyle = "#FFFFFF";

      let yOffset = -this.radius - 0.1 * partialScaleFactor;

      if (showDamageNumbers && totalDamage > 0) {
        ctx.strokeText(`${totalDamage.toFixed(2)}%`, this.x, this.y + yOffset);
        ctx.fillText(`${totalDamage.toFixed(2)}%`, this.x, this.y + yOffset);
        yOffset -= 0.3 * partialScaleFactor;
      }

      if (showStatusChance && statusChance > 0) {
        ctx.fillStyle = "#FFFF00";
        ctx.strokeText(`${statusChance.toFixed(2)}%`, this.x, this.y + yOffset);
        ctx.fillText(`${statusChance.toFixed(2)}%`, this.x, this.y + yOffset);
      }

      if (showDamageNumbers && mainBeamDamage > 0 && aoeDamage > 0) {
        yOffset = this.radius + 0.3 * partialScaleFactor;

        ctx.fillStyle = mainBeamHitColor;
        ctx.strokeText(`${mainBeamDamage.toFixed(2)}%`, this.x, this.y + yOffset);
        ctx.fillText(`${mainBeamDamage.toFixed(2)}%`, this.x, this.y + yOffset);
        yOffset += 0.3 * partialScaleFactor;

        ctx.fillStyle = aoeHitColor;
        ctx.strokeText(`${aoeDamage.toFixed(2)}%`, this.x, this.y + yOffset);
        ctx.fillText(`${aoeDamage.toFixed(2)}%`, this.x, this.y + yOffset);
      }
    }
  }

  drawHitRing(color, ctx) {
    ctx.globalAlpha = aoeOpacity;
    ctx.beginPath();
    ctx.arc(this.x, this.y, chainRadius, 0, Math.PI * 2);
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2 / zoomFactor;
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.fill();
    ctx.globalAlpha = 1.0;
  }

  hitWithTorid(isMainBeam, enemies, ctx) {
    if (isMainBeam) {
      this.isHit = true;
      this.isPrimaryMainBeamTarget = true;
    } else {
      this.aoeHit = true;
      this.isPrimaryAoETarget = true;
    }
    this.updateSortedEnemies(enemies);
    const chain = new Chain(this, this.sortedEnemies, maxChainDepth, isMainBeam);
    chain.drawChainLinks(ctx);
  }

  updateVelocity() {
    const directionMagnitude = Math.sqrt(this.initialDirection.x ** 2 + this.initialDirection.y ** 2);
    const newVelocityMagnitude = enemySpeed / zoomFactor;
    const scale = newVelocityMagnitude / directionMagnitude;
    this.velocityX = this.initialDirection.x * scale;
    this.velocityY = this.initialDirection.y * scale;
  }

  updatePosition() {
    if (enemyMovementEnabled) {
      super.updatePosition(this.velocityX, this.velocityY);

      // Bounce off the edges
      if (this.x <= this.radius || this.x >= canvas.width / zoomFactor - this.radius) {
        this.velocityX = -this.velocityX;
        this.initialDirection.x = -this.initialDirection.x;
      }
      if (this.y <= this.radius || this.y >= canvas.height / zoomFactor - this.radius) {
        this.velocityY = -this.velocityY;
        this.initialDirection.y = -this.initialDirection.y;
      }
    }
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
    this.chainHits(startEnemy, maxChains, 0);
  }

  chainHits(currentEnemy, remainingChains, depth) {
    if (remainingChains <= 0) return;

    currentEnemy.updateSortedEnemies(this.enemies);

    for (let enemy of currentEnemy.sortedEnemies) {
      if (this.chainedEnemies.has(enemy)) continue;

      const distance = calculateDistance(currentEnemy.x, currentEnemy.y, enemy.x, enemy.y);

      if (distance <= chainRadius) {
        this.chainedEnemies.add(enemy);
        this.chainLinks.push({ from: currentEnemy, to: enemy });

        if (this.isMainBeam) {
          enemy.isHit = true;
        } else {
          enemy.aoeHit = true;
          if (showCircles === "full") {
            enemy.drawHitRing(aoeHitColor, ctx); //there can be multiple AoE chains, stacking transparent circles makes it easier to visualize effect
          }
        }

        enemy.addChainInfo(this, depth + 1);
        this.chainHits(enemy, remainingChains - 1, depth + 1);
        break;
      }
    }
  }

  drawChainLinks(ctx) {
    if (!showBeams) return;

    ctx.globalAlpha = 0.3;

    for (let link of this.chainLinks) {
      const linkWidth = 0.2;
      const outlineWidth = 0.05;

      // outline
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = linkWidth + outlineWidth;
      ctx.beginPath();
      ctx.moveTo(link.from.x, link.from.y);
      ctx.lineTo(link.to.x, link.to.y);
      ctx.stroke();

      // Set composite operation to 'destination-out' to cut out the inner part
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = linkWidth;
      ctx.beginPath();
      ctx.moveTo(link.from.x, link.from.y);
      ctx.lineTo(link.to.x, link.to.y);
      ctx.stroke();

      // Reset composite operation to default
      ctx.globalCompositeOperation = "source-over";

      // Draw the transparent colored line on top
      this.isMainBeam ? (ctx.strokeStyle = mainBeamHitColor) : (ctx.strokeStyle = aoeHitColor);
      ctx.lineWidth = linkWidth;
      ctx.beginPath();
      ctx.moveTo(link.from.x, link.from.y);
      ctx.lineTo(link.to.x, link.to.y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1.0;
  }
}

const player = new Player(canvas.width / 2, canvas.height / 2);

const enemies = [];
for (let i = 0; i < enemyCount; i++) {
  const x = (Math.random() * 0.8 + 0.1) * canvas.width;
  const y = (Math.random() * 0.8 + 0.1) * canvas.height;
  enemies.push(new Enemy(x, y));
}

let mouseX = canvas.width / 2 / zoomFactor;
let mouseY = canvas.height / 2 / zoomFactor;

function isSmallScreen() {
  return window.innerWidth < 768 || window.innerHeight < 600;
}

function calculateDistance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function checkBeamCollision(startX, startY, endX, endY) {
  let intersection = false;

  player.updateSortedEnemies(enemies);

  for (let enemy of player.sortedEnemies) {
    // Calculate beam segment vector
    const beamDX = endX - startX;
    const beamDY = endY - startY;
    const beamLength = Math.sqrt(beamDX * beamDX + beamDY * beamDY);

    if (beamLength === 0) {
      const distance = calculateDistance(startX, startY, enemy.x, enemy.y);
      if (distance <= enemy.radius && !enemy.isHit) {
        enemy.hitWithTorid(true, enemies, ctx);
        return {
          intersected: true,
          endX: enemy.x,
          endY: enemy.y,
          enemyHit: enemy,
        };
      }
      continue;
    }

    // Project the enemy point onto the beam segment
    const projection = ((enemy.x - startX) * beamDX + (enemy.y - startY) * beamDY) / (beamLength * beamLength);
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

    const closestDistance = calculateDistance(closestX, closestY, enemy.x, enemy.y);

    if (closestDistance <= enemy.radius) {
      isEnemyHit = true;
      enemy.hitWithTorid(true, enemies, ctx);
      return {
        intersected: true,
        endX: closestX,
        endY: closestY,
        enemyHit: enemy,
      };
    }
  }

  return {
    intersected: intersection,
    endX,
    endY,
    enemyHit: null,
  };
}

function draw() {
  ctx.clearRect(0, 0, canvas.width / zoomFactor, canvas.height / zoomFactor);

  // Reset hit status and chain information for all enemies
  for (let enemy of enemies) {
    enemy.isHit = false;
    enemy.aoeHit = false;
    enemy.isPrimaryMainBeamTarget = false;
    enemy.isPrimaryAoETarget = false;
    enemy.clearChainInfo();
  }

  const distance = calculateDistance(player.x, player.y, mouseX, mouseY);

  let beamEndX = mouseX;
  let beamEndY = mouseY;

  if (distance > baseBeamLength) {
    const ratio = baseBeamLength / distance;
    beamEndX = player.x + (mouseX - player.x) * ratio;
    beamEndY = player.y + (mouseY - player.y) * ratio;
  }

  // Check for beam collision with enemies and adjust endpoint if needed
  const collisionResult = checkBeamCollision(player.x, player.y, beamEndX, beamEndY);

  currentBeamLength = calculateDistance(player.x, player.y, collisionResult.endX, collisionResult.endY);

  // Draw the line from the player to the calculated beam endpoint
  ctx.beginPath();
  ctx.moveTo(player.x, player.y);
  ctx.lineTo(collisionResult.endX, collisionResult.endY);
  ctx.strokeStyle = beamColor;
  ctx.lineWidth = beamWidth;
  ctx.stroke();

  player.draw(ctx);

  // Variables to count hits
  let mainBeamDirectHits = 0;
  let totalMainBeamHits = 0;
  let aoeDirectHits = 0;
  let totalAoeHits = 0;

  if (collisionResult.enemyHit) {
    mainBeamDirectHits++;
  }
  ctx.beginPath();
  ctx.arc(collisionResult.endX, collisionResult.endY, toridBaseAoE, 0, Math.PI * 2);
  ctx.strokeStyle = beamColor;
  ctx.lineWidth = 1 / zoomFactor;
  ctx.stroke();

  ctx.globalAlpha = aoeOpacity;
  ctx.fillStyle = beamColor;
  ctx.fill();
  ctx.globalAlpha = 1.0;

  // Check for enemies within the smaller AoE
  for (let enemy of enemies) {
    // Exclude the enemy directly hit by the main beam
    if (enemy === collisionResult.enemyHit) continue;

    const distanceToAoE = calculateDistance(collisionResult.endX, collisionResult.endY, enemy.x, enemy.y);
    if (distanceToAoE <= toridBaseAoE) {
      enemy.hitWithTorid(false, enemies, ctx);
      aoeDirectHits++;
    }
  }

  for (let enemy of enemies) {
    if (enemy.isHit) {
      totalMainBeamHits++;
    }
    if (enemy.aoeHit) {
      totalAoeHits++;
    }
  }

  enemies.forEach((enemy) => enemy.draw(ctx));

  // Display debugging information
  debugElement.innerHTML = `
    Player Position: (${player.x.toFixed(2)}, ${player.y.toFixed(2)})<br>
    Mouse Position: (${mouseX.toFixed(2)}, ${mouseY.toFixed(2)})<br>
    Base Beam Length: ${baseBeamLength.toFixed(2)}<br>
    Current Beam Length: ${currentBeamLength.toFixed(2)}<br>
    Beam Endpoint: (${collisionResult.endX.toFixed(2)}, ${collisionResult.endY.toFixed(2)})<br>
    Beam Collision: ${collisionResult.intersected}<br>
    Main Beam Hits (w/ chain): ${totalMainBeamHits}<br>
    AoE Hits (w/ chains): ${totalAoeHits}<br>
    Main Beam Direct Hits: ${mainBeamDirectHits}<br>
    AoE Direct Hits: ${aoeDirectHits}<br>
  `;
}

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

  player.updatePosition(dx, dy);
  enemies.forEach((enemy) => enemy.updatePosition());
  draw();
  requestAnimationFrame(update);
}

canvas.addEventListener("mousemove", (event) => {
  const rect = canvas.getBoundingClientRect();
  mouseX = (event.clientX - rect.left) / zoomFactor;
  mouseY = (event.clientY - rect.top) / zoomFactor;
  draw();
});

canvas.addEventListener("mousedown", (event) => {
  if (event.button === 0) {
    isPrimedFirestormActive = true;
    firestormToggle.checked = true;
    toridBaseAoE = 4.32; // primed firestorm
    draw();
  }
});

canvas.addEventListener("mouseup", (event) => {
  if (event.button === 0) {
    isPrimedFirestormActive = false;
    firestormToggle.checked = false;
    toridBaseAoE = 3; // regular
    draw();
  }
});

function resetToridVariables() {
  maxChainDepth = 5;
  chainRadius = 6;
  beamLength = 40;
  //update the values on the screen
  document.getElementById("maxChainDepthValue").textContent = maxChainDepth;
  document.getElementById("chainRadiusValue").textContent = chainRadius;
  document.getElementById("beamLengthValue").textContent = beamLength;
  //update the values in the sliders
  document.getElementById("maxChainDepthInput").value = maxChainDepth;
  document.getElementById("chainRadiusInput").value = chainRadius;
  document.getElementById("beamLengthInput").value = beamLength;
  //man I should go back to svelte lmao this is ass
}

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
  draw();
}

// Initial draw and start the update loop
draw();
update();

window.addEventListener("resize", handleResize);

function handleResize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx.scale(zoomFactor, zoomFactor);
  resetGame();
}
