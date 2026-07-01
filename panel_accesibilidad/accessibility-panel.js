/**
 * Panel de Accesibilidad — Anteojos Ediciones
 * WCAG 2.2 AA · Español/English · localStorage persistente
 * ================================================= */
(function () {
  "use strict";

  /* ───── Constantes ───── */
  const STORAGE_KEY = "ap_accessibility_prefs";

  const DEFAULT_PREFS = {
    fontSize: 100,
    highContrast: false,
    darkMode: false,
    blueFilter: false,
    lineSpacing: 0,
    letterSpacing: 0,
    highlightLinks: false,
    bigCursor: false,
    pauseAnimations: false,
    ttsEnabled: false,
    colorCorrection: "none", // none | protanopia | deuteranopia | tritanopia | grayscale
    hideImages: false,
    screenReader: false,
  };

  /* ───── Detectar idioma ───── */
  function detectLang() {
    if (window.location.pathname.indexOf("/en/") !== -1) return "en";
    var htmlLang = document.documentElement.lang || "es";
    return htmlLang.startsWith("en") ? "en" : "es";
  }

  const LANG = detectLang();

  /* ───── Textos internacionalizados ───── */
  const i18n = {
    es: {
      panelTitle: "Accesibilidad",
      resetBtn: "Reset",
      resetLabel: "Restaurar configuración por defecto",
      closeLabel: "Cerrar panel de accesibilidad",
      openLabel: "Abrir panel de accesibilidad",
      toggleTitle: "Accesibilidad",
      // Sections
      fontSizeTitle: "Tamaño de texto",
      fontDec: "Reducir tamaño de texto",
      fontInc: "Aumentar tamaño de texto",
      visionTitle: "Visión y pantalla",
      highContrast: "Contraste alto",
      darkMode: "Modo oscuro",
      blueFilter: "Filtro luz azul",
      hideImages: "Ocultar imágenes",
      spacingTitle: "Espaciado",
      lineSpacing: "Interlineado",
      letterSpacing: "Espacio entre letras",
      lineSpacingLabel: "Ajustar interlineado",
      letterSpacingLabel: "Ajustar espacio entre letras",
      normal: "Normal",
      navTitle: "Navegación",
      highlightLinks: "Resaltar enlaces",
      bigCursor: "Cursor grande",
      pauseAnimations: "Pausar animaciones",
      ttsTitle: "Lectura en voz alta",
      ttsEnabled: "Leer en voz alta",
      screenReader: "Lector simplificado",
      colorTitle: "Corrección de color",
      protanopia: "Protanomalía",
      deuteranopia: "Deuteranomalía",
      tritanopia: "Tritanomalía",
      grayscale: "Escala de grises",
      // TTS messages
      panelOpened: "Panel de accesibilidad abierto",
      resetDone: "Configuración restaurada a valores por defecto",
      fontSizeMsg: "Tamaño de texto: {0} por ciento",
      activated: "activado",
      deactivated: "desactivado",
      colorOff: "Corrección de color desactivada",
      lineSpacingMsg: "Interlineado: {0}",
      letterSpacingMsg: "Espacio entre letras: {0}",
      levelPrefix: "nivel ",
    },
    en: {
      panelTitle: "Accessibility",
      resetBtn: "Reset",
      resetLabel: "Reset to default settings",
      closeLabel: "Close accessibility panel",
      openLabel: "Open accessibility panel",
      toggleTitle: "Accessibility",
      // Sections
      fontSizeTitle: "Text Size",
      fontDec: "Decrease text size",
      fontInc: "Increase text size",
      visionTitle: "Vision & Display",
      highContrast: "High Contrast",
      darkMode: "Dark Mode",
      blueFilter: "Blue Light Filter",
      hideImages: "Hide Images",
      spacingTitle: "Spacing",
      lineSpacing: "Line Spacing",
      letterSpacing: "Letter Spacing",
      lineSpacingLabel: "Adjust line spacing",
      letterSpacingLabel: "Adjust letter spacing",
      normal: "Normal",
      navTitle: "Navigation",
      highlightLinks: "Highlight Links",
      bigCursor: "Big Cursor",
      pauseAnimations: "Pause Animations",
      ttsTitle: "Read Aloud",
      ttsEnabled: "Read Aloud",
      screenReader: "Simplified Reader",
      colorTitle: "Color Correction",
      protanopia: "Protanomaly",
      deuteranopia: "Deuteranomaly",
      tritanopia: "Tritanomaly",
      grayscale: "Grayscale",
      // TTS messages
      panelOpened: "Accessibility panel opened",
      resetDone: "Settings reset to defaults",
      fontSizeMsg: "Text size: {0} percent",
      activated: "activated",
      deactivated: "deactivated",
      colorOff: "Color correction disabled",
      lineSpacingMsg: "Line spacing: {0}",
      letterSpacingMsg: "Letter spacing: {0}",
      levelPrefix: "level ",
    },
  };

  const t = i18n[LANG] || i18n.es;

  /* ───── Estado ───── */
  let prefs = loadPrefs();
  let panelOpen = false;
  let ttsUtterance = null;

  /* ───── Utilidades ───── */
  function loadPrefs() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw
        ? { ...DEFAULT_PREFS, ...JSON.parse(raw) }
        : { ...DEFAULT_PREFS };
    } catch {
      return { ...DEFAULT_PREFS };
    }
  }
  function savePrefs() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {}
  }

  /* ───── Síntesis de voz (idioma dinámico) ───── */
  function speak(text) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1;
    u.pitch = 1;

    const voices = window.speechSynthesis.getVoices();

    if (LANG === "en") {
      u.lang = "en-US";
      // Prefer US English, then any English
      let selectedVoice = voices.find((v) => v.lang === "en-US");
      if (!selectedVoice) selectedVoice = voices.find((v) => v.lang === "en-GB");
      if (!selectedVoice) selectedVoice = voices.find((v) => v.lang.startsWith("en"));
      if (selectedVoice) u.voice = selectedVoice;
    } else {
      u.lang = "es-AR";
      // Códigos de idioma para variantes latinoamericanas (orden de preferencia)
      const latamCodes = [
        "es-AR", "es-MX", "es-CO", "es-CL", "es-PE", "es-VE", "es-UY",
        "es-EC", "es-BO", "es-PY", "es-CR", "es-PA", "es-DO", "es-GT",
        "es-HN", "es-SV", "es-NI", "es-CU", "es-PR", "es-419",
      ];

      let selectedVoice = null;
      for (const code of latamCodes) {
        selectedVoice = voices.find((v) => v.lang === code);
        if (selectedVoice) break;
      }
      if (!selectedVoice) selectedVoice = voices.find((v) => v.lang === "es-ES");
      if (!selectedVoice) selectedVoice = voices.find((v) => v.lang.startsWith("es"));
      if (selectedVoice) u.voice = selectedVoice;
    }

    window.speechSynthesis.speak(u);
  }

  /* ───── SVG helpers ───── */
  const ICONS = {
    accessibility: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="4.5" r="2"/><path d="M12 7c-1.1 0-2 .9-2 2v4h-2v2h2v5h2v-5h2v-2h-2V9c0-1.1-.9-2-2-2z"/><path d="M5.5 8.5l1.5 1L9 7.5" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M18.5 8.5l-1.5 1L15 7.5" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>`,
    accessibilityFull: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-2 7v4H7v2h3v7h2v-4h0v4h2v-7h3v-2h-3V9a2 2 0 0 0-2-2h0a2 2 0 0 0-2 2z"/></svg>`,
    fontSize: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 4v3h5v13h3V7h5V4H2zm14 4v3h3v9h3v-9h3V8h-9z"/></svg>`,
    contrast: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 2a10 10 0 0 1 0 20V2z"/></svg>`,
    moon: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
    blueFilter: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 1v2m0 18v2m-9-11h2m18 0h2m-4.22-6.78l-1.42 1.42M5.64 18.36l-1.42 1.42m0-15.56l1.42 1.42m12.72 12.72l1.42 1.42" stroke="currentColor" stroke-width="2"/></svg>`,
    lineSpacing: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 7h12M6 12h12M6 17h12" stroke="currentColor" stroke-width="2" fill="none"/><path d="M3 7v10M21 7v10" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 2" fill="none"/></svg>`,
    letterSpacing: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 4v3h5v13h3V7h5V4H2z"/><path d="M14 20h8m-4-4v4m-4-4v4" stroke="currentColor" stroke-width="2" fill="none"/></svg>`,
    link: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" fill="none" stroke="currentColor" stroke-width="2"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" fill="none" stroke="currentColor" stroke-width="2"/></svg>`,
    cursor: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3l14 8-6 1.5L10 19z"/></svg>`,
    pause: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>`,
    speaker: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07m2.12-9.19a8 8 0 0 1 0 11.31" fill="none" stroke="currentColor" stroke-width="2"/></svg>`,
    eye: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/></svg>`,
    palette: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10c1.38 0 2.5-1.12 2.5-2.5 0-.61-.23-1.2-.64-1.67-.08-.1-.13-.21-.13-.33 0-.28.22-.5.5-.5H16c3.31 0 6-2.69 6-6 0-4.96-4.49-9-10-9zM6.5 13a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3-4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3 4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/></svg>`,
    imageOff: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15V5a2 2 0 0 0-2-2H5m14 12l-3-3-2.29 2.29M3 3l18 18M3 5v14a2 2 0 0 0 2 2h14" fill="none" stroke="currentColor" stroke-width="2"/></svg>`,
    screenReader: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="4" r="2"/><path d="M16 21v-4a4 4 0 0 0-8 0v4m4-10v2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M7 8h10" stroke="currentColor" stroke-width="2" fill="none"/></svg>`,
    reset: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 0 1 15-6.7L21 2v7h-7l2.5-2.5A7 7 0 1 0 19 12" fill="none" stroke="currentColor" stroke-width="2"/></svg>`,
    close: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
  };

  /* ───── Crear SVG filters para daltonismo ───── */
  function injectSVGFilters() {
    if (document.getElementById("ap-svg-filters")) return;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.id = "ap-svg-filters";
    svg.setAttribute("aria-hidden", "true");
    svg.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;";
    svg.innerHTML = `
      <defs>
        <filter id="ap-protanopia-filter">
          <feColorMatrix type="matrix" values="
            0.567 0.433 0     0 0
            0.558 0.442 0     0 0
            0     0.242 0.758 0 0
            0     0     0     1 0"/>
        </filter>
        <filter id="ap-deuteranopia-filter">
          <feColorMatrix type="matrix" values="
            0.625 0.375 0     0 0
            0.7   0.3   0     0 0
            0     0.3   0.7   0 0
            0     0     0     1 0"/>
        </filter>
        <filter id="ap-tritanopia-filter">
          <feColorMatrix type="matrix" values="
            0.95 0.05  0     0 0
            0    0.433 0.567 0 0
            0    0.475 0.525 0 0
            0    0     0     1 0"/>
        </filter>
      </defs>`;
    document.body.appendChild(svg);
  }

  /* ───── Construir HTML del panel ───── */
  function buildPanel() {
    // Toggle button
    const btn = document.createElement("button");
    btn.id = "ap-toggle-btn";
    btn.setAttribute("aria-label", t.openLabel);
    btn.setAttribute("title", t.toggleTitle);
    btn.innerHTML =
      '<img src="/img/accessibility.svg" alt="' + t.toggleTitle + '" width="28" height="28" style="pointer-events:none;" aria-hidden="true">';
    document.body.appendChild(btn);

    // Overlay
    const overlay = document.createElement("div");
    overlay.id = "ap-overlay";
    overlay.setAttribute("aria-hidden", "true");
    document.body.appendChild(overlay);

    // Panel
    const panel = document.createElement("div");
    panel.id = "ap-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", t.panelTitle);
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("tabindex", "-1");

    panel.innerHTML = `
      <div class="ap-header">
        <h2>${ICONS.accessibilityFull} ${t.panelTitle}</h2>
        <div class="ap-header-actions">
          <button id="ap-reset-btn" aria-label="${t.resetLabel}" title="${t.resetLabel}">${ICONS.reset} ${t.resetBtn}</button>
          <button id="ap-close-btn" aria-label="${t.closeLabel}" title="${t.closeLabel}">${ICONS.close}</button>
        </div>
      </div>
      <div class="ap-body">

        <!-- Tamaño de texto / Text Size -->
        <div class="ap-section">
          <div class="ap-section-title">${t.fontSizeTitle}</div>
          <div class="ap-stepper">
            <button id="ap-font-dec" aria-label="${t.fontDec}">A−</button>
            <span class="ap-size-val" id="ap-font-val" aria-live="polite">100%</span>
            <button id="ap-font-inc" aria-label="${t.fontInc}">A+</button>
          </div>
        </div>

        <!-- Visión / Vision -->
        <div class="ap-section">
          <div class="ap-section-title">${t.visionTitle}</div>
          <div class="ap-grid">
            <button class="ap-btn" data-action="highContrast" aria-pressed="false">
              ${ICONS.contrast}
              <span>${t.highContrast}</span>
            </button>
            <button class="ap-btn" data-action="darkMode" aria-pressed="false">
              ${ICONS.moon}
              <span>${t.darkMode}</span>
            </button>
            <button class="ap-btn" data-action="blueFilter" aria-pressed="false">
              ${ICONS.blueFilter}
              <span>${t.blueFilter}</span>
            </button>
            <button class="ap-btn" data-action="hideImages" aria-pressed="false">
              ${ICONS.imageOff}
              <span>${t.hideImages}</span>
            </button>
          </div>
        </div>

        <!-- Espaciado / Spacing -->
        <div class="ap-section">
          <div class="ap-section-title">${t.spacingTitle}</div>
          <div class="ap-slider-group">
            <label class="ap-slider-label" for="ap-line-spacing">
              ${t.lineSpacing}
              <span class="ap-val" id="ap-line-val">${t.normal}</span>
            </label>
            <input type="range" id="ap-line-spacing" min="0" max="5" step="1" value="0"
              aria-label="${t.lineSpacingLabel}" aria-valuemin="0" aria-valuemax="5" aria-valuenow="0">
          </div>
          <div class="ap-slider-group">
            <label class="ap-slider-label" for="ap-letter-spacing">
              ${t.letterSpacing}
              <span class="ap-val" id="ap-letter-val">${t.normal}</span>
            </label>
            <input type="range" id="ap-letter-spacing" min="0" max="5" step="1" value="0"
              aria-label="${t.letterSpacingLabel}" aria-valuemin="0" aria-valuemax="5" aria-valuenow="0">
          </div>
        </div>

        <!-- Navegación / Navigation -->
        <div class="ap-section">
          <div class="ap-section-title">${t.navTitle}</div>
          <div class="ap-grid">
            <button class="ap-btn" data-action="highlightLinks" aria-pressed="false">
              ${ICONS.link}
              <span>${t.highlightLinks}</span>
            </button>
            <button class="ap-btn" data-action="bigCursor" aria-pressed="false">
              ${ICONS.cursor}
              <span>${t.bigCursor}</span>
            </button>
            <button class="ap-btn" data-action="pauseAnimations" aria-pressed="false">
              ${ICONS.pause}
              <span>${t.pauseAnimations}</span>
            </button>
          </div>
        </div>

        <!-- Lectura en voz alta / Read Aloud -->
        <div class="ap-section">
          <div class="ap-section-title">${t.ttsTitle}</div>
          <div class="ap-grid">
            <button class="ap-btn" data-action="ttsEnabled" aria-pressed="false">
              ${ICONS.speaker}
              <span>${t.ttsEnabled}</span>
            </button>
            <button class="ap-btn" data-action="screenReader" aria-pressed="false">
              ${ICONS.screenReader}
              <span>${t.screenReader}</span>
            </button>
          </div>
        </div>

        <!-- Corrección de color / Color Correction -->
        <div class="ap-section">
          <div class="ap-section-title">${t.colorTitle}</div>
          <div class="ap-grid">
            <button class="ap-btn" data-color="protanopia" aria-pressed="false">
              ${ICONS.palette}
              <span>${t.protanopia}</span>
            </button>
            <button class="ap-btn" data-color="deuteranopia" aria-pressed="false">
              ${ICONS.palette}
              <span>${t.deuteranopia}</span>
            </button>
            <button class="ap-btn" data-color="tritanopia" aria-pressed="false">
              ${ICONS.palette}
              <span>${t.tritanopia}</span>
            </button>
            <button class="ap-btn" data-color="grayscale" aria-pressed="false">
              ${ICONS.palette}
              <span>${t.grayscale}</span>
            </button>
          </div>
        </div>

      </div>
    `;

    document.body.appendChild(panel);
  }

  /* ───── Aplicar preferencias al DOM ───── */
  function applyAll() {
    const html = document.documentElement;

    // Tamaño de texto
    html.style.fontSize = prefs.fontSize + "%";
    const fontVal = document.getElementById("ap-font-val");
    if (fontVal) fontVal.textContent = prefs.fontSize + "%";

    // Clases toggle
    const toggleMap = {
      highContrast: "ap-high-contrast",
      darkMode: "ap-dark-mode",
      blueFilter: "ap-blue-filter",
      highlightLinks: "ap-highlight-links",
      bigCursor: "ap-big-cursor",
      pauseAnimations: "ap-pause-animations",
      hideImages: "ap-hide-images",
    };
    for (const [key, cls] of Object.entries(toggleMap)) {
      html.classList.toggle(cls, !!prefs[key]);
    }

    // Espaciado
    const lineValues = [0, 0.15, 0.3, 0.5, 0.75, 1];
    const letterValues = [0, 1, 2, 3, 4, 5];
    document.body.style.lineHeight = prefs.lineSpacing
      ? `calc(1.7 + ${lineValues[prefs.lineSpacing]}em)`
      : "";
    document.body.style.letterSpacing = prefs.letterSpacing
      ? letterValues[prefs.letterSpacing] + "px"
      : "";

    // Slider UI
    const lineSlider = document.getElementById("ap-line-spacing");
    const letterSlider = document.getElementById("ap-letter-spacing");
    const lineLabel = document.getElementById("ap-line-val");
    const letterLabel = document.getElementById("ap-letter-val");
    if (lineSlider) {
      lineSlider.value = prefs.lineSpacing;
      lineSlider.setAttribute("aria-valuenow", prefs.lineSpacing);
    }
    if (letterSlider) {
      letterSlider.value = prefs.letterSpacing;
      letterSlider.setAttribute("aria-valuenow", prefs.letterSpacing);
    }
    if (lineLabel)
      lineLabel.textContent = prefs.lineSpacing
        ? `+${prefs.lineSpacing}`
        : t.normal;
    if (letterLabel)
      letterLabel.textContent = prefs.letterSpacing
        ? `+${prefs.letterSpacing}px`
        : t.normal;

    // Corrección de color
    const colorClasses = [
      "ap-protanopia",
      "ap-deuteranopia",
      "ap-tritanopia",
      "ap-grayscale",
    ];
    colorClasses.forEach((c) => html.classList.remove(c));
    if (prefs.colorCorrection !== "none") {
      html.classList.add("ap-" + prefs.colorCorrection);
    }

    // Actualizar botones aria-pressed
    document.querySelectorAll("#ap-panel .ap-btn[data-action]").forEach((b) => {
      const action = b.dataset.action;
      const active = !!prefs[action];
      b.classList.toggle("ap-active", active);
      b.setAttribute("aria-pressed", String(active));
    });
    document.querySelectorAll("#ap-panel .ap-btn[data-color]").forEach((b) => {
      const active = prefs.colorCorrection === b.dataset.color;
      b.classList.toggle("ap-active", active);
      b.setAttribute("aria-pressed", String(active));
    });

    // Screen reader simplificado
    if (prefs.screenReader) {
      enableScreenReader();
    } else {
      disableScreenReader();
    }

    savePrefs();
  }

  /* ───── Lector de pantalla simplificado ───── */
  let srCleanup = null;
  function enableScreenReader() {
    if (srCleanup) return;
    const handler = (e) => {
      const el = e.target;
      if (el.closest("#ap-panel") || el.closest("#ap-toggle-btn")) return;
      document
        .querySelectorAll(".ap-sr-highlight")
        .forEach((x) => x.classList.remove("ap-sr-highlight"));
      el.classList.add("ap-sr-highlight");
      const text =
        el.getAttribute("aria-label") || el.alt || el.textContent?.trim();
      if (text) speak(text.substring(0, 300));
    };
    document.addEventListener("mouseover", handler, true);
    document.addEventListener("focusin", handler, true);
    srCleanup = () => {
      document.removeEventListener("mouseover", handler, true);
      document.removeEventListener("focusin", handler, true);
      document
        .querySelectorAll(".ap-sr-highlight")
        .forEach((x) => x.classList.remove("ap-sr-highlight"));
    };
  }
  function disableScreenReader() {
    if (srCleanup) {
      srCleanup();
      srCleanup = null;
    }
  }

  /* ───── TTS: leer contenido de la página ───── */
  function toggleTTS() {
    if (prefs.ttsEnabled) {
      const mainContent =
        document.querySelector("main") ||
        document.querySelector(".main-content") ||
        document.body;
      const text = mainContent.innerText.substring(0, 5000);
      speak(text);
    } else {
      window.speechSynthesis.cancel();
    }
  }

  /* ───── Eventos ───── */
  function bindEvents() {
    const toggleBtn = document.getElementById("ap-toggle-btn");
    const panel = document.getElementById("ap-panel");
    const overlay = document.getElementById("ap-overlay");
    const closeBtn = document.getElementById("ap-close-btn");
    const resetBtn = document.getElementById("ap-reset-btn");

    function openPanel() {
      panelOpen = true;
      panel.classList.add("ap-open");
      overlay.classList.add("ap-visible");
      toggleBtn.setAttribute("aria-expanded", "true");
      panel.focus();
      speak(t.panelOpened);
    }
    function closePanel() {
      panelOpen = false;
      panel.classList.remove("ap-open");
      overlay.classList.remove("ap-visible");
      toggleBtn.setAttribute("aria-expanded", "false");
      toggleBtn.focus();
    }

    toggleBtn.addEventListener("click", () =>
      panelOpen ? closePanel() : openPanel(),
    );
    overlay.addEventListener("click", closePanel);
    closeBtn.addEventListener("click", closePanel);

    // Escape to close
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && panelOpen) closePanel();
    });

    // Reset
    resetBtn.addEventListener("click", () => {
      prefs = { ...DEFAULT_PREFS };
      document.documentElement.style.fontSize = "";
      document.body.style.lineHeight = "";
      document.body.style.letterSpacing = "";
      window.speechSynthesis.cancel();
      applyAll();
      speak(t.resetDone);
    });

    // Font size stepper
    document.getElementById("ap-font-dec").addEventListener("click", () => {
      prefs.fontSize = Math.max(70, prefs.fontSize - 10);
      applyAll();
      speak(t.fontSizeMsg.replace("{0}", prefs.fontSize));
    });
    document.getElementById("ap-font-inc").addEventListener("click", () => {
      prefs.fontSize = Math.min(200, prefs.fontSize + 10);
      applyAll();
      speak(t.fontSizeMsg.replace("{0}", prefs.fontSize));
    });

    // Toggle buttons
    document
      .querySelectorAll("#ap-panel .ap-btn[data-action]")
      .forEach((btn) => {
        btn.addEventListener("click", () => {
          const action = btn.dataset.action;
          prefs[action] = !prefs[action];
          applyAll();

          const label = btn.querySelector("span").textContent;
          speak(`${label}: ${prefs[action] ? t.activated : t.deactivated}`);

          if (action === "ttsEnabled") toggleTTS();
        });
      });

    // Color correction buttons
    document
      .querySelectorAll("#ap-panel .ap-btn[data-color]")
      .forEach((btn) => {
        btn.addEventListener("click", () => {
          const color = btn.dataset.color;
          prefs.colorCorrection =
            prefs.colorCorrection === color ? "none" : color;
          applyAll();

          const label = btn.querySelector("span").textContent;
          speak(
            prefs.colorCorrection !== "none"
              ? `${label}: ${t.activated}`
              : t.colorOff,
          );
        });
      });

    // Sliders
    document
      .getElementById("ap-line-spacing")
      .addEventListener("input", (e) => {
        prefs.lineSpacing = parseInt(e.target.value);
        applyAll();
        var val = prefs.lineSpacing === 0 ? t.normal : t.levelPrefix + prefs.lineSpacing;
        speak(t.lineSpacingMsg.replace("{0}", val));
      });
    document
      .getElementById("ap-letter-spacing")
      .addEventListener("input", (e) => {
        prefs.letterSpacing = parseInt(e.target.value);
        applyAll();
        var val = prefs.letterSpacing === 0 ? t.normal : t.levelPrefix + prefs.letterSpacing;
        speak(t.letterSpacingMsg.replace("{0}", val));
      });

    // Keyboard trap inside panel
    panel.addEventListener("keydown", (e) => {
      if (e.key !== "Tab") return;
      const focusable = panel.querySelectorAll(
        'button, input, [tabindex]:not([tabindex="-1"])',
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }

  /* ───── Inicialización ───── */
  function init() {
    injectSVGFilters();
    buildPanel();
    bindEvents();
    applyAll();

    // Pre-load voices
    if ("speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () =>
        window.speechSynthesis.getVoices();
    }
  }

  // Run when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
