function convertirVelocidadAVelocidadBase(valor, unidad) {
  if (unidad === "kmh") {
    return valor / 3.6;
  }

  return valor;
}

function calcularPosicionMRU(x0, v, t) {
  return x0 + v * t;
}

function calcularEstadoMRUA(x0, v0, a, t) {
  return {
    position: x0 + v0 * t + 0.5 * a * t ** 2,
    velocity: v0 + a * t,
  };
}

function calcularCaidaLibre(y0, v0, g, t) {
  return {
    height: y0 + v0 * t - 0.5 * g * t ** 2,
    velocity: v0 - g * t,
  };
}

window.MRUPhysics = {
  convertirVelocidadAVelocidadBase,
  calcularPosicionMRU,
  calcularEstadoMRUA,
  calcularCaidaLibre,
};
