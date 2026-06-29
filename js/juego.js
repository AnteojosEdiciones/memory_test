"use strict";

// juego memory LSC - logica principal
// los assets (img/audio/lsc) los meto despues, por ahora hay catchs para que no rompa

const CONCEPTOS = [
  { id: "casa", palabra: "Casa", pareja: 1 },
  { id: "familia", palabra: "Familia", pareja: 1 },
  { id: "biblioteca", palabra: "Biblioteca", pareja: 2 },
  { id: "libro", palabra: "Libro", pareja: 2 },
  { id: "parque", palabra: "Parque", pareja: 3 },
  { id: "jugar", palabra: "Jugar", pareja: 3 },
  { id: "mercado", palabra: "Mercado", pareja: 4 },
  { id: "fruta", palabra: "Fruta", pareja: 4 },
  { id: "colegio", palabra: "Colegio", pareja: 5 },
  { id: "maleta", palabra: "Maleta", pareja: 5 },
  { id: "rio", palabra: "Río", pareja: 6 },
  { id: "agua", palabra: "Agua", pareja: 6 },
];

// frase + audio de cada pareja (key = nro de pareja)
const PAREJAS_INFO = {
  1: { frase: "La familia está en casa.", audio: "audio/familia_casa.mp3" },
  2: {
    frase: "El libro está en la biblioteca.",
    audio: "audio/libro_biblioteca.mp3",
  },
  3: { frase: "En el parque podemos jugar.", audio: "audio/jugar_parque.mp3" },
  4: {
    frase: "En el mercado encontramos fruta.",
    audio: "audio/fruta_mercado.mp3",
  },
  5: {
    frase: "Llevo mi maleta al colegio.",
    audio: "audio/maleta_colegio.mp3",
  },
  6: { frase: "El agua corre por el río.", audio: "audio/agua_rio.mp3" },
};

const RUTA_IMG = "img/";
const RUTA_AUDIO = "audio/";
const RUTA_VIDEO = "lsc/";
const DORSO = RUTA_IMG + "dorso_carta.png";
const TOTAL = 6;

// estado de la partida
const estado = {
  primera: null,
  segunda: null,
  bloqueado: false,
  parejas: 0,
  movs: 0,
};

const dom = {
  tablero: document.getElementById("tablero"),
  contadorParejas: document.getElementById("contador-parejas"),
  contadorMovimientos: document.getElementById("contador-movimientos"),
  pantallaFelicitacion: document.getElementById("pantalla-felicitacion"),
  resumenMovimientos: document.getElementById("resumen-movimientos"),
  btnReiniciar: document.getElementById("btn-reiniciar"),
  btnDescargar: document.getElementById("btn-descargar"),
  estadoDescarga: document.getElementById("estado-descarga"),
  modalVideo: document.getElementById("modal-video"),
  videoLsc: document.getElementById("video-lsc"),
  btnCerrarModal: document.getElementById("btn-cerrar-modal"),
  modalTitulo: document.getElementById("modal-titulo"),
  audioPalabra: document.getElementById("audio-palabra"),
  audioFrase: document.getElementById("audio-frase"),
  anuncioAccesible: document.getElementById("anuncio-accesible"),
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function play(el, ruta) {
  el.src = ruta;
  el.currentTime = 0;
  const p = el.play();
  if (p) p.catch(() => {}); // todavia no estan los mp3
}

// ---- efectos de sonido generados con Web Audio (sin archivos) ----
let audioCtx = null;
const sinSonido =
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function ctxAudio() {
  if (sinSonido) return null;
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

// reproduce un tono simple (frecuencia en Hz, duracion en s)
function tono(freq, inicio, dur, tipo = "sine", volumen = 0.18) {
  const ctx = ctxAudio();
  if (!ctx) return;
  const t0 = ctx.currentTime + inicio;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = tipo;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(volumen, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur);
}

function sonidoVoltear() {
  tono(420, 0, 0.12, "triangle");
}

function sonidoAcierto() {
  // dos notas ascendentes alegres
  tono(523.25, 0, 0.15, "sine"); // do
  tono(783.99, 0.13, 0.22, "sine"); // sol
}

function sonidoVictoria() {
  // arpegio do - mi - sol - do agudo
  const notas = [523.25, 659.25, 783.99, 1046.5];
  notas.forEach((f, i) => tono(f, i * 0.18, 0.3, "triangle", 0.2));
}

function anunciar(txt) {
  dom.anuncioAccesible.textContent = txt;
}

function crearCarta(c) {
  const carta = document.createElement("button");
  carta.className = "carta";
  carta.type = "button";
  carta.setAttribute("role", "gridcell");
  carta.dataset.id = c.id;
  carta.dataset.pareja = String(c.pareja);
  carta.dataset.palabra = c.palabra;
  carta.setAttribute("aria-label", "Carta oculta. Pulsa para voltear.");

  const interior = document.createElement("span");
  interior.className = "carta__interior";

  const dorso = document.createElement("span");
  dorso.className = "carta__cara carta__cara--dorso";
  const imgDorso = document.createElement("img");
  imgDorso.src = DORSO;
  imgDorso.alt = "";
  imgDorso.setAttribute("aria-hidden", "true");
  dorso.appendChild(imgDorso);

  const frente = document.createElement("span");
  frente.className = "carta__cara carta__cara--frente";
  const img = document.createElement("img");
  img.src = RUTA_IMG + c.id + ".svg";
  img.alt = c.palabra;
  frente.appendChild(img);
  const pal = document.createElement("span");
  pal.className = "carta__palabra";
  pal.textContent = c.palabra;
  frente.appendChild(pal);

  interior.appendChild(dorso);
  interior.appendChild(frente);
  carta.appendChild(interior);

  carta.addEventListener("click", () => alVoltear(carta));
  return carta;
}

function construirTablero() {
  dom.tablero.innerHTML = "";
  shuffle(CONCEPTOS).forEach((c) => dom.tablero.appendChild(crearCarta(c)));
}

function alVoltear(carta) {
  if (estado.bloqueado) return;
  if (carta === estado.primera) return;
  if (carta.classList.contains("emparejada")) return;

  voltear(carta);

  if (!estado.primera) {
    estado.primera = carta;
    return;
  }

  estado.segunda = carta;
  estado.movs++;
  dom.contadorMovimientos.textContent = String(estado.movs);
  comprobar();
}

function voltear(carta) {
  carta.classList.add("volteada");
  carta.setAttribute("aria-label", "Carta " + carta.dataset.palabra + ".");
  sonidoVoltear();
  play(dom.audioPalabra, RUTA_AUDIO + carta.dataset.id + ".mp3");
}

function comprobar() {
  if (estado.primera.dataset.pareja === estado.segunda.dataset.pareja) {
    acierto();
  } else {
    fallo();
  }
}

function acierto() {
  const np = estado.primera.dataset.pareja;
  const info = PAREJAS_INFO[np];

  [estado.primera, estado.segunda].forEach((c) => {
    c.classList.add("emparejada");
    c.setAttribute("aria-disabled", "true");
  });

  estado.parejas++;
  dom.contadorParejas.textContent = String(estado.parejas);

  sonidoAcierto();
  play(dom.audioFrase, info.audio);
  anunciar("¡Pareja encontrada! " + info.frase);
  mostrarFrase(estado.primera, estado.segunda, info.frase);
  resetSeleccion();

  if (estado.parejas === TOTAL) {
    setTimeout(mostrarFelicitacion, 800); // dar tiempo a ver la ultima
  }
}

function fallo() {
  estado.bloqueado = true;
  anunciar("No coinciden. Intenta de nuevo.");
  setTimeout(() => {
    [estado.primera, estado.segunda].forEach((c) => {
      c.classList.remove("volteada");
      c.setAttribute("aria-label", "Carta oculta. Pulsa para voltear.");
    });
    resetSeleccion();
  }, 1000);
}

function resetSeleccion() {
  estado.primera = null;
  estado.segunda = null;
  estado.bloqueado = false;
}

// muestra la frase de la pareja + botones para ver el video de cada palabra
function mostrarFrase(c1, c2, frase) {
  let cont = document.getElementById("frases-encontradas");
  if (!cont) {
    cont = document.createElement("section");
    cont.id = "frases-encontradas";
    cont.className = "frases";
    cont.setAttribute("aria-label", "Frases descubiertas");
    dom.tablero.insertAdjacentElement("afterend", cont);
  }

  // solo se muestra el cartel del ultimo par encontrado
  cont.innerHTML = "";

  const tarjeta = document.createElement("div");
  tarjeta.className = "frase";

  const t = document.createElement("p");
  t.className = "frase__texto";
  t.textContent = "✅ " + frase;
  tarjeta.appendChild(t);

  const grupo = document.createElement("div");
  grupo.className = "frase__botones";
  [c1, c2].forEach((c) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "boton boton--lsc";
    b.textContent = "👐 Ver seña: " + c.dataset.palabra;
    b.setAttribute(
      "aria-label",
      "Ver video en Lengua de Señas de la palabra " + c.dataset.palabra,
    );
    b.addEventListener("click", () =>
      abrirModal(c.dataset.id, c.dataset.palabra),
    );
    grupo.appendChild(b);
  });
  tarjeta.appendChild(grupo);
  cont.appendChild(tarjeta);
}

let focoPrevio = null;

function abrirModal(id, palabra) {
  focoPrevio = document.activeElement;
  dom.modalTitulo.textContent = "Seña en LSC: " + palabra;
  dom.videoLsc.src = RUTA_VIDEO + id + ".mp4";
  dom.modalVideo.classList.remove("oculto");
  const p = dom.videoLsc.play();
  if (p) p.catch(() => {});
  dom.btnCerrarModal.focus();
}

function cerrarModal() {
  dom.modalVideo.classList.add("oculto");
  dom.videoLsc.pause();
  dom.videoLsc.removeAttribute("src");
  dom.videoLsc.load();
  if (focoPrevio && focoPrevio.focus) focoPrevio.focus();
}

function mostrarFelicitacion() {
  dom.resumenMovimientos.textContent = String(estado.movs);
  dom.pantallaFelicitacion.classList.remove("oculto");
  sonidoVictoria();
  anunciar(
    "¡Felicidades! Completaste el juego en " + estado.movs + " movimientos.",
  );
  dom.btnReiniciar.focus();
}

function reiniciar() {
  estado.primera = null;
  estado.segunda = null;
  estado.bloqueado = false;
  estado.parejas = 0;
  estado.movs = 0;
  dom.contadorParejas.textContent = "0";
  dom.contadorMovimientos.textContent = "0";
  dom.pantallaFelicitacion.classList.add("oculto");
  const f = document.getElementById("frases-encontradas");
  if (f) f.remove();
  construirTablero();
  anunciar("Juego reiniciado. ¡A jugar!");
}

async function activarOffline() {
  if (!("serviceWorker" in navigator)) {
    dom.estadoDescarga.textContent =
      "⚠️ Tu navegador no admite el modo sin conexión.";
    return;
  }
  try {
    dom.estadoDescarga.textContent = "Descargando recursos...";
    await navigator.serviceWorker.register("service-worker.js");
    dom.estadoDescarga.textContent = "✅ ¡Listo! Ya puedes jugar sin conexión.";
  } catch (e) {
    console.log("sw error", e);
    dom.estadoDescarga.textContent =
      "⚠️ No se pudo activar el modo sin conexión.";
  }
}

function init() {
  dom.btnReiniciar.addEventListener("click", reiniciar);
  dom.btnDescargar.addEventListener("click", activarOffline);

  dom.modalVideo.addEventListener("click", (e) => {
    if (e.target.hasAttribute("data-cerrar-modal")) cerrarModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !dom.modalVideo.classList.contains("oculto"))
      cerrarModal();
  });

  construirTablero();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
