const canvas = document.getElementById("simCanvas");
const ctx = canvas.getContext("2d");

const initialInput = document.getElementById("initialPosition");
const velocityInput = document.getElementById("velocity");
const velocityUnitSelect = document.getElementById("velocityUnit");
const initialHeightInput = document.getElementById("initialHeight");
const initialVerticalVelocityInput = document.getElementById("initialVerticalVelocity");
const movementModeSelect = document.getElementById("movementMode");
const horizontalPositionField = document.getElementById("horizontalPositionField");
const freeFallHeightField = document.getElementById("freeFallHeightField");
const horizontalVelocityField = document.getElementById("horizontalVelocityField");
const freeFallVelocityField = document.getElementById("freeFallVelocityField");
const accelerationField = document.getElementById("accelerationField");
const accelerationInput = document.getElementById("acceleration");
const gravityField = document.getElementById("gravityField");
const positionMetricLabel = document.getElementById("positionMetricLabel");
const accelerationMetricLabel = document.getElementById("accelerationMetricLabel");
const motionTitle = document.getElementById("motionTitle");
const vehicleSelect = document.getElementById("vehicleSelect");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");
const timeValue = document.getElementById("timeValue");
const positionValue = document.getElementById("positionValue");
const currentVelocityValue = document.getElementById("currentVelocityValue");
const accelerationValue = document.getElementById("accelerationValue");
const accelerationMetric = document.getElementById("accelerationMetric");

const state = {
  running: false,
  elapsedTime: 0,
  lastTimestamp: 0,
  x0: 0,
  v0: 0,
  acceleration: 0,
  gravity: 9.8,
  currentPosition: 0,
  currentVelocity: 0,
  vehicle: "car",
  velocityUnit: "mps",
  movementMode: "mru",
};

function readConfiguration() {
  state.movementMode = movementModeSelect.value;
  const isFreeFall = state.movementMode === "freefall";
  state.x0 = Number(isFreeFall ? initialHeightInput.value : initialInput.value) || 0;
  state.velocityUnit = isFreeFall ? "mps" : velocityUnitSelect.value;
  const rawVelocity = Number(isFreeFall ? initialVerticalVelocityInput.value : velocityInput.value) || 0;
  state.v0 = window.MRUPhysics.convertirVelocidadAVelocidadBase(rawVelocity, state.velocityUnit);
  state.acceleration = state.movementMode === "mrua" ? Number(accelerationInput.value) || 0 : 0;
  state.gravity = 9.8;
  state.vehicle = vehicleSelect.value;
}

function updateMetrics() {
  timeValue.textContent = `${state.elapsedTime.toFixed(2)} s`;
  positionValue.textContent = `${state.currentPosition.toFixed(2)} m`;
  const displayedVelocity = state.velocityUnit === "kmh" ? state.currentVelocity * 3.6 : state.currentVelocity;
  currentVelocityValue.textContent = `${displayedVelocity.toFixed(2)} ${getVelocityLabel()}`;
  const isFreeFall = state.movementMode === "freefall";
  accelerationValue.textContent = `${(isFreeFall ? state.gravity : state.acceleration).toFixed(2)} m/s²`;
  accelerationMetric.hidden = state.movementMode === "mru";
}

function getVelocityLabel() {
  if (state.movementMode === "freefall") return "m/s";
  return state.velocityUnit === "kmh" ? "km/h" : "m/s";
}

function worldToPixel(x) {
  const margin = 52;
  const width = canvas.width;
  const height = canvas.height;
  const minX = Math.min(0, state.x0, state.currentPosition) - 10;
  const maxX = Math.max(0, state.x0, state.currentPosition) + 10;
  const range = maxX - minX || 1;

  return {
    x: margin + ((x - minX) / range) * (width - margin * 2),
    y: height - 50,
    scaleY: height - 90,
  };
}

function drawAxis() {
  const width = canvas.width;
  const height = canvas.height;
  const origin = worldToPixel(0);

  drawCanvasBackground();

  ctx.strokeStyle = "#137f70";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(20, origin.y);
  ctx.lineTo(width - 20, origin.y);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(width - 30, origin.y);
  ctx.lineTo(width - 42, origin.y - 6);
  ctx.moveTo(width - 30, origin.y);
  ctx.lineTo(width - 42, origin.y + 6);
  ctx.stroke();

  const minX = Math.min(0, state.x0, state.currentPosition) - 10;
  const maxX = Math.max(0, state.x0, state.currentPosition) + 10;
  const step = (maxX - minX) / 8;

  for (let i = 0; i <= 8; i += 1) {
    const value = minX + i * step;
    const px = worldToPixel(value).x;

    ctx.strokeStyle = "#9aaea8";
    ctx.beginPath();
    ctx.moveTo(px, origin.y - 5);
    ctx.lineTo(px, origin.y + 5);
    ctx.stroke();

    ctx.fillStyle = "#526963";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${value.toFixed(0)} m`, px - 12, origin.y + 22);
  }
}

function drawObject() {
  const pos = worldToPixel(state.currentPosition);
  drawVehicle(pos.x, pos.y - 12, state.currentVelocity >= 0 ? 1 : -1, false);
}

function getFreeFallScale() {
  const top = 36;
  const bottom = canvas.height - 42;
  const peakHeight = state.x0 + Math.max(0, state.v0) ** 2 / (2 * state.gravity);
  const maxHeight = Math.max(10, peakHeight * 1.1);

  return { top, bottom, maxHeight };
}

function drawFreeFallScene() {
  const width = canvas.width;
  const height = canvas.height;
  const centerX = width / 2;
  const scale = getFreeFallScale();
  const scaleHeight = scale.bottom - scale.top;
  const tickCount = 8;

  drawCanvasBackground();

  ctx.strokeStyle = "#137f70";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(centerX, scale.top);
  ctx.lineTo(centerX, scale.bottom);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(centerX, scale.bottom);
  ctx.lineTo(centerX - 6, scale.bottom - 12);
  ctx.moveTo(centerX, scale.bottom);
  ctx.lineTo(centerX + 6, scale.bottom - 12);
  ctx.stroke();

  for (let index = 0; index <= tickCount; index += 1) {
    const value = (scale.maxHeight * index) / tickCount;
    const pixelY = scale.bottom - (value / scale.maxHeight) * scaleHeight;

    ctx.strokeStyle = "#9aaea8";
    ctx.beginPath();
    ctx.moveTo(centerX - 6, pixelY);
    ctx.lineTo(centerX + 6, pixelY);
    ctx.stroke();

    ctx.fillStyle = "#526963";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(`${value.toFixed(1)} m`, centerX + 14, pixelY);
  }

  const objectY = scale.bottom - (state.currentPosition / scale.maxHeight) * scaleHeight;
  drawVehicle(centerX, objectY, state.currentVelocity <= 0 ? 1 : -1, true);
}

function drawCanvasBackground() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#f8fbf8";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "rgba(19, 127, 112, 0.07)";
  ctx.lineWidth = 1;

  for (let x = 24; x < canvas.width; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  for (let y = 24; y < canvas.height; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

function drawWheel(x, y, radius = 6) {
  ctx.fillStyle = "#203531";
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#d8e6df";
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.42, 0, Math.PI * 2);
  ctx.fill();
}

function drawCar() {
  ctx.fillStyle = "#168a78";
  ctx.strokeStyle = "#0b6157";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-29, 5);
  ctx.lineTo(-26, -3);
  ctx.lineTo(-16, -6);
  ctx.lineTo(-9, -15);
  ctx.lineTo(11, -15);
  ctx.lineTo(20, -6);
  ctx.lineTo(27, -3);
  ctx.lineTo(30, 5);
  ctx.lineTo(30, 9);
  ctx.lineTo(-29, 9);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#c8ece3";
  ctx.beginPath();
  ctx.moveTo(-12, -6);
  ctx.lineTo(-7, -12);
  ctx.lineTo(2, -12);
  ctx.lineTo(2, -6);
  ctx.closePath();
  ctx.moveTo(5, -12);
  ctx.lineTo(10, -12);
  ctx.lineTo(16, -6);
  ctx.lineTo(5, -6);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#f2a08a";
  ctx.fillRect(25, 0, 4, 3);
  drawWheel(-17, 8);
  drawWheel(18, 8);
}

function drawMotorcycle() {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#168a78";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-19, 5);
  ctx.lineTo(-5, 1);
  ctx.lineTo(7, 5);
  ctx.lineTo(16, -5);
  ctx.lineTo(21, -4);
  ctx.moveTo(-5, 1);
  ctx.lineTo(1, -6);
  ctx.lineTo(10, -6);
  ctx.stroke();

  ctx.fillStyle = "#e87961";
  ctx.beginPath();
  ctx.moveTo(-7, -3);
  ctx.lineTo(6, -8);
  ctx.lineTo(13, -5);
  ctx.lineTo(9, 0);
  ctx.lineTo(-2, 1);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#203531";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(13, -5);
  ctx.lineTo(18, -10);
  ctx.lineTo(24, -10);
  ctx.moveTo(-8, -4);
  ctx.lineTo(-13, -8);
  ctx.stroke();
  drawWheel(-19, 7, 6);
  drawWheel(19, 7, 6);
}

function drawBicycle() {
  const wheelLeft = -17;
  const wheelRight = 17;
  const wheelY = 7;

  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#e87961";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(wheelLeft, wheelY);
  ctx.lineTo(-3, -6);
  ctx.lineTo(2, wheelY);
  ctx.lineTo(wheelLeft, wheelY);
  ctx.moveTo(-3, -6);
  ctx.lineTo(wheelRight, wheelY);
  ctx.lineTo(2, wheelY);
  ctx.moveTo(-3, -6);
  ctx.lineTo(-8, -7);
  ctx.moveTo(-5, -8);
  ctx.lineTo(1, -8);
  ctx.moveTo(wheelRight, wheelY);
  ctx.lineTo(21, -8);
  ctx.lineTo(25, -8);
  ctx.stroke();

  ctx.strokeStyle = "#168a78";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(wheelLeft, wheelY, 8, 0, Math.PI * 2);
  ctx.arc(wheelRight, wheelY, 8, 0, Math.PI * 2);
  ctx.stroke();
}

function drawPlane() {
  ctx.fillStyle = "#168a78";
  ctx.strokeStyle = "#0b6157";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(30, 0);
  ctx.lineTo(7, -4);
  ctx.lineTo(-5, -15);
  ctx.lineTo(-11, -15);
  ctx.lineTo(-8, -4);
  ctx.lineTo(-23, -7);
  ctx.lineTo(-29, -12);
  ctx.lineTo(-32, -11);
  ctx.lineTo(-27, -1);
  ctx.lineTo(-32, 7);
  ctx.lineTo(-29, 8);
  ctx.lineTo(-23, 3);
  ctx.lineTo(-8, 2);
  ctx.lineTo(-11, 12);
  ctx.lineTo(-5, 12);
  ctx.lineTo(7, 3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawVehicle(pixelX, pixelY, direction, vertical) {
  ctx.save();
  ctx.translate(pixelX, pixelY);
  if (vertical) {
    ctx.rotate(direction > 0 ? Math.PI / 2 : -Math.PI / 2);
  } else {
    ctx.scale(direction, 1);
  }

  if (state.vehicle === "motorcycle") {
    drawMotorcycle();
  } else if (state.vehicle === "bicycle") {
    drawBicycle();
  } else if (state.vehicle === "plane") {
    drawPlane();
  } else {
    drawCar();
  }

  ctx.restore();
}

function render() {
  if (state.movementMode === "freefall") {
    drawFreeFallScene();
  } else {
    drawAxis();
    drawObject();
  }
  updateMetrics();
}

function animateFrame(timestamp) {
  if (!state.running) return;

  if (!state.lastTimestamp) {
    state.lastTimestamp = timestamp;
  }

  const delta = (timestamp - state.lastTimestamp) / 1000;
  state.lastTimestamp = timestamp;
  state.elapsedTime += delta;

  if (state.movementMode === "freefall") {
    const motion = window.MRUPhysics.calcularCaidaLibre(
      state.x0,
      state.v0,
      state.gravity,
      state.elapsedTime,
    );
    state.currentPosition = Math.max(0, motion.height);
    state.currentVelocity = motion.velocity;
    if (motion.height <= 0) state.running = false;
  } else if (state.movementMode === "mrua") {
    const motion = window.MRUPhysics.calcularEstadoMRUA(
      state.x0,
      state.v0,
      state.acceleration,
      state.elapsedTime,
    );
    state.currentPosition = motion.position;
    state.currentVelocity = motion.velocity;
  } else {
    state.currentPosition = window.MRUPhysics.calcularPosicionMRU(state.x0, state.v0, state.elapsedTime);
    state.currentVelocity = state.v0;
  }

  render();
  if (state.running) requestAnimationFrame(animateFrame);
}

function startSimulation() {
  if (state.running) return;
  readConfiguration();
  state.currentPosition = state.x0;
  state.currentVelocity = state.v0;
  state.running = true;
  state.lastTimestamp = 0;
  requestAnimationFrame(animateFrame);
}

function pauseSimulation() {
  state.running = false;
  state.lastTimestamp = 0;
}

function resetSimulation() {
  state.running = false;
  state.elapsedTime = 0;
  state.lastTimestamp = 0;
  readConfiguration();
  state.currentPosition = state.x0;
  state.currentVelocity = state.v0;
  render();
}

function handleConfigurationChange() {
  readConfiguration();
  if (!state.running) {
    state.currentPosition = state.x0;
    state.currentVelocity = state.v0;
  }
  render();
}

function updateMovementMode() {
  state.running = false;
  state.elapsedTime = 0;
  state.lastTimestamp = 0;
  readConfiguration();
  const isAccelerated = state.movementMode === "mrua";
  const isFreeFall = state.movementMode === "freefall";
  horizontalPositionField.hidden = isFreeFall;
  freeFallHeightField.hidden = !isFreeFall;
  horizontalVelocityField.hidden = isFreeFall;
  freeFallVelocityField.hidden = !isFreeFall;
  accelerationField.hidden = !isAccelerated;
  accelerationInput.disabled = !isAccelerated;
  gravityField.hidden = !isFreeFall;
  positionMetricLabel.textContent = isFreeFall ? "Altura actual (y)" : "Posición actual";
  accelerationMetricLabel.textContent = isFreeFall ? "Gravedad" : "Aceleración";
  motionTitle.textContent = isFreeFall
    ? "Caída libre"
    : state.movementMode === "mrua"
      ? "Movimiento rectilíneo uniformemente acelerado"
      : "Movimiento rectilíneo uniforme";
  state.currentPosition = state.x0;
  state.currentVelocity = state.v0;
  render();
}

startBtn.addEventListener("click", startSimulation);
pauseBtn.addEventListener("click", pauseSimulation);
resetBtn.addEventListener("click", resetSimulation);

initialInput.addEventListener("input", () => {
  handleConfigurationChange();
});

initialHeightInput.addEventListener("input", handleConfigurationChange);
initialVerticalVelocityInput.addEventListener("input", handleConfigurationChange);

velocityInput.addEventListener("input", () => {
  handleConfigurationChange();
});

velocityUnitSelect.addEventListener("change", () => {
  handleConfigurationChange();
});

movementModeSelect.addEventListener("change", updateMovementMode);

accelerationInput.addEventListener("input", () => {
  handleConfigurationChange();
});

vehicleSelect.addEventListener("change", () => {
  handleConfigurationChange();
});

readConfiguration();
state.currentPosition = state.x0;
state.currentVelocity = state.v0;
updateMovementMode();
render();
