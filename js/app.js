(() => {
  "use strict";

  const STORAGE_KEY = "multiport-counter.counters";
  const HAPTICS_KEY = "multiport-counter.haptics";
  const ACCENT_KEY = "multiport-counter.accent";
  const WALLPAPER_KEY = "multiport-counter.wallpaper";
  const REDUCE_TRANSPARENCY_KEY = "multiport-counter.reduceTransparency";

  const COLORS = [
    { name: "blue", value: "#007AFF" },
    { name: "red", value: "#FF3B30" },
    { name: "green", value: "#34C759" },
    { name: "orange", value: "#FF9500" },
    { name: "yellow", value: "#FFCC00" },
    { name: "purple", value: "#AF52DE" },
    { name: "pink", value: "#FF2D55" },
    { name: "teal", value: "#5AC8FA" },
    { name: "indigo", value: "#5856D6" },
  ];

  const ICONS = ["💪", "🏃", "💧", "☕️", "📚", "🎯", "🔥", "⭐️", "🧘", "🚭", "🍺", "🛒", "🎮", "😴", "🧹", "🐾", "✅", "💊", "📞", "🎉"];

  const WALLPAPERS = [
    { id: "mono", label: "Mono" },
    { id: "aurora", label: "Aurora" },
    { id: "sunset", label: "Sunset" },
    { id: "ocean", label: "Ocean" },
    { id: "candy", label: "Candy" },
    { id: "midnight", label: "Midnight" },
  ];

  const el = (id) => document.getElementById(id);

  const appEl = el("app");
  const counterList = el("counterList");
  const emptyState = el("emptyState");
  const addBtn = el("addBtn");
  const editBtn = el("editBtn");
  const settingsBtn = el("settingsBtn");

  const sheetOverlay = el("sheetOverlay");
  const sheetTitle = el("sheetTitle");
  const nameInput = el("counterNameInput");
  const stepPicker = el("stepPicker");
  const colorPicker = el("colorPicker");
  const iconPicker = el("iconPicker");
  const saveCounterBtn = el("saveCounterBtn");
  const deleteCounterBtn = el("deleteCounterBtn");

  const settingsOverlay = el("settingsOverlay");
  const accentPicker = el("accentPicker");
  const wallpaperPicker = el("wallpaperPicker");
  const hapticsToggle = el("hapticsToggle");
  const reduceTransparencyToggle = el("reduceTransparencyToggle");
  const resetAllBtn = el("resetAllBtn");
  const deleteAllBtn = el("deleteAllBtn");
  const closeSettingsBtn = el("closeSettingsBtn");

  let state = {
    counters: [],
    editMode: false,
  };

  let editingCounterId = null;
  let sheetStep = 1;
  let sheetColor = COLORS[0].value;
  let sheetIcon = null;

  let hapticsEnabled = true;

  // ---------- Persistence ----------
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      state.counters = raw ? JSON.parse(raw) : [];
    } catch (e) {
      state.counters = [];
    }
    hapticsEnabled = localStorage.getItem(HAPTICS_KEY) !== "off";
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.counters));
  }

  function haptic(strength = 10) {
    if (hapticsEnabled && navigator.vibrate) {
      navigator.vibrate(strength);
    }
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  // ---------- Appearance (accent / wallpaper / transparency) ----------
  function hexToRgb(hex) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!m) return "10, 132, 255";
    return `${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}`;
  }

  function applyAccent(hex) {
    document.documentElement.style.setProperty("--accent", hex);
    document.documentElement.style.setProperty("--accent-rgb", hexToRgb(hex));
  }

  function setAccent(hex, persist = true) {
    applyAccent(hex);
    if (persist) localStorage.setItem(ACCENT_KEY, hex);
    refreshAccentSelection(hex);
  }

  function applyWallpaper(id) {
    document.body.dataset.wallpaper = id;
  }

  function setWallpaper(id, persist = true) {
    applyWallpaper(id);
    if (persist) localStorage.setItem(WALLPAPER_KEY, id);
    refreshWallpaperSelection(id);
  }

  function setReduceTransparency(on, persist = true) {
    appEl.classList.toggle("no-glass", on);
    reduceTransparencyToggle.checked = on;
    if (persist) localStorage.setItem(REDUCE_TRANSPARENCY_KEY, on ? "on" : "off");
  }

  function buildAccentPicker() {
    accentPicker.innerHTML = "";
    COLORS.forEach((c) => {
      const btn = document.createElement("button");
      btn.className = "color-swatch-btn";
      btn.style.background = c.value;
      btn.dataset.color = c.value;
      btn.setAttribute("aria-label", `${c.name} accent`);
      btn.addEventListener("click", () => {
        haptic(8);
        setAccent(c.value);
      });
      accentPicker.appendChild(btn);
    });
  }

  function refreshAccentSelection(hex) {
    [...accentPicker.children].forEach((btn) => {
      btn.classList.toggle("selected", btn.dataset.color.toLowerCase() === hex.toLowerCase());
    });
  }

  function buildWallpaperPicker() {
    wallpaperPicker.innerHTML = "";
    WALLPAPERS.forEach((w) => {
      const btn = document.createElement("button");
      btn.className = "wallpaper-swatch";
      btn.dataset.wallpaper = w.id;
      btn.setAttribute("aria-label", `${w.label} wallpaper`);
      btn.addEventListener("click", () => {
        haptic(8);
        setWallpaper(w.id);
      });
      wallpaperPicker.appendChild(btn);
    });
  }

  function refreshWallpaperSelection(id) {
    [...wallpaperPicker.children].forEach((btn) => {
      btn.classList.toggle("selected", btn.dataset.wallpaper === id);
    });
  }

  // ---------- Rendering ----------
  function render() {
    counterList.innerHTML = "";
    emptyState.classList.toggle("visible", state.counters.length === 0);

    state.counters.forEach((counter, index) => {
      counterList.appendChild(buildCounterCard(counter, index));
    });
  }

  function buildCounterCard(counter, index) {
    const card = document.createElement("div");
    card.className = "counter-card";
    card.dataset.id = counter.id;
    card.style.setProperty("--card-index", index);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "counter-swipe-delete";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => {
      haptic(20);
      removeCounter(counter.id);
    });

    const content = document.createElement("div");
    content.className = "counter-card-content";
    content.style.setProperty("--counter-color", counter.color);

    let swatch;
    if (counter.icon) {
      swatch = document.createElement("div");
      swatch.className = "icon-badge";
      swatch.style.setProperty("--badge-color", counter.color);
      swatch.textContent = counter.icon;
    } else {
      swatch = document.createElement("div");
      swatch.className = "counter-swatch";
      swatch.style.background = counter.color;
    }

    const info = document.createElement("div");
    info.className = "counter-info";
    const nameEl = document.createElement("div");
    nameEl.className = "counter-name";
    nameEl.textContent = counter.name;
    const stepEl = document.createElement("div");
    stepEl.className = "counter-step";
    stepEl.textContent = `Step ${counter.step}`;
    info.appendChild(nameEl);
    info.appendChild(stepEl);

    const countEl = document.createElement("div");
    countEl.className = "counter-count" + (counter.count < 0 ? " negative" : "");
    countEl.textContent = counter.count;

    let pressTimer = null;
    countEl.addEventListener("pointerdown", () => {
      pressTimer = setTimeout(() => {
        haptic(25);
        counter.count = 0;
        save();
        render();
      }, 550);
    });
    ["pointerup", "pointerleave", "pointercancel"].forEach((evt) => {
      countEl.addEventListener(evt, () => clearTimeout(pressTimer));
    });

    const controls = document.createElement("div");
    controls.className = "counter-controls";

    const minusBtn = document.createElement("button");
    minusBtn.className = "stepper-btn minus";
    minusBtn.textContent = "−";
    minusBtn.setAttribute("aria-label", `Decrease ${counter.name}`);
    minusBtn.addEventListener("click", () => bump(counter, -counter.step, countEl));

    const plusBtn = document.createElement("button");
    plusBtn.className = "stepper-btn plus";
    plusBtn.textContent = "+";
    plusBtn.setAttribute("aria-label", `Increase ${counter.name}`);
    plusBtn.addEventListener("click", () => bump(counter, counter.step, countEl));

    controls.appendChild(minusBtn);
    controls.appendChild(plusBtn);

    content.appendChild(swatch);
    content.appendChild(info);
    content.appendChild(countEl);
    content.appendChild(controls);

    content.addEventListener("click", (e) => {
      if (e.target === countEl || e.target === minusBtn || e.target === plusBtn) return;
      openEditSheet(counter);
    });

    card.appendChild(content);
    card.appendChild(deleteBtn);

    attachSwipe(card, content);

    return card;
  }

  function bump(counter, delta, countEl) {
    counter.count += delta;
    save();
    countEl.textContent = counter.count;
    countEl.classList.toggle("negative", counter.count < 0);
    countEl.classList.remove("pulse");
    void countEl.offsetWidth;
    countEl.classList.add("pulse");
    haptic(8);
  }

  function removeCounter(id) {
    state.counters = state.counters.filter((c) => c.id !== id);
    save();
    render();
  }

  // ---------- Swipe to delete ----------
  const SWIPE_THRESHOLD = 6; // px of movement before a tap counts as a drag

  function attachSwipe(card, content) {
    let startX = 0;
    let currentX = 0;
    let dragging = false;
    let pastThreshold = false;

    content.addEventListener("pointerdown", (e) => {
      startX = e.clientX;
      dragging = true;
      pastThreshold = false;
      card.style.transition = "none";
    });

    content.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      currentX = e.clientX - startX;
      if (!pastThreshold && Math.abs(currentX) > SWIPE_THRESHOLD) {
        pastThreshold = true;
        card.classList.add("dragging");
      }
      if (pastThreshold && currentX < 0 && currentX > -100) {
        content.style.transform = `translateX(${currentX}px)`;
      }
    });

    function endDrag() {
      if (!dragging) return;
      dragging = false;
      card.classList.remove("dragging");
      card.style.transition = "";
      content.style.transition = "transform 0.25s cubic-bezier(.25,.9,.35,1)";
      if (pastThreshold) {
        if (currentX < -44) {
          content.style.transform = "translateX(-88px)";
          card.classList.add("swiped");
        } else {
          content.style.transform = "translateX(0)";
          card.classList.remove("swiped");
        }
      }
      currentX = 0;
    }

    content.addEventListener("pointerup", endDrag);
    content.addEventListener("pointercancel", endDrag);
  }

  // ---------- Add / Edit sheet ----------
  function buildColorPicker() {
    colorPicker.innerHTML = "";
    COLORS.forEach((c) => {
      const btn = document.createElement("button");
      btn.className = "color-swatch-btn";
      btn.style.background = c.value;
      btn.dataset.color = c.value;
      btn.addEventListener("click", () => {
        sheetColor = c.value;
        refreshColorSelection();
      });
      colorPicker.appendChild(btn);
    });
  }

  function refreshColorSelection() {
    [...colorPicker.children].forEach((btn) => {
      btn.classList.toggle("selected", btn.dataset.color === sheetColor);
    });
  }

  function buildIconPicker() {
    iconPicker.innerHTML = "";

    const noneBtn = document.createElement("button");
    noneBtn.className = "icon-swatch-btn none-option";
    noneBtn.textContent = "None";
    noneBtn.dataset.icon = "";
    noneBtn.addEventListener("click", () => {
      sheetIcon = null;
      refreshIconSelection();
    });
    iconPicker.appendChild(noneBtn);

    ICONS.forEach((icon) => {
      const btn = document.createElement("button");
      btn.className = "icon-swatch-btn";
      btn.textContent = icon;
      btn.dataset.icon = icon;
      btn.addEventListener("click", () => {
        sheetIcon = icon;
        refreshIconSelection();
      });
      iconPicker.appendChild(btn);
    });
  }

  function refreshIconSelection() {
    [...iconPicker.children].forEach((btn) => {
      const isSelected = sheetIcon ? btn.dataset.icon === sheetIcon : btn.dataset.icon === "";
      btn.classList.toggle("selected", isSelected);
    });
  }

  function refreshStepSelection() {
    [...stepPicker.children].forEach((btn) => {
      btn.classList.toggle("selected", Number(btn.dataset.step) === sheetStep);
    });
  }

  stepPicker.addEventListener("click", (e) => {
    const btn = e.target.closest(".step-chip");
    if (!btn) return;
    sheetStep = Number(btn.dataset.step);
    refreshStepSelection();
  });

  function openAddSheet() {
    editingCounterId = null;
    sheetTitle.textContent = "New Counter";
    nameInput.value = "";
    sheetStep = 1;
    sheetColor = COLORS[Math.floor(Math.random() * COLORS.length)].value;
    sheetIcon = null;
    refreshStepSelection();
    refreshColorSelection();
    refreshIconSelection();
    deleteCounterBtn.classList.remove("visible");
    openSheet(sheetOverlay);
    setTimeout(() => nameInput.focus(), 300);
  }

  function openEditSheet(counter) {
    editingCounterId = counter.id;
    sheetTitle.textContent = "Edit Counter";
    nameInput.value = counter.name;
    sheetStep = counter.step;
    sheetColor = counter.color;
    sheetIcon = counter.icon || null;
    refreshStepSelection();
    refreshColorSelection();
    refreshIconSelection();
    deleteCounterBtn.classList.add("visible");
    openSheet(sheetOverlay);
  }

  function openSheet(overlay) {
    overlay.classList.add("open");
  }

  function closeSheet(overlay) {
    overlay.classList.remove("open");
  }

  saveCounterBtn.addEventListener("click", () => {
    const name = nameInput.value.trim() || "Untitled";
    if (editingCounterId) {
      const c = state.counters.find((x) => x.id === editingCounterId);
      if (c) {
        c.name = name;
        c.step = sheetStep;
        c.color = sheetColor;
        c.icon = sheetIcon;
      }
    } else {
      state.counters.push({
        id: uid(),
        name,
        count: 0,
        step: sheetStep,
        color: sheetColor,
        icon: sheetIcon,
      });
    }
    save();
    render();
    haptic(12);
    closeSheet(sheetOverlay);
  });

  deleteCounterBtn.addEventListener("click", () => {
    if (editingCounterId) {
      removeCounter(editingCounterId);
      haptic(20);
    }
    closeSheet(sheetOverlay);
  });

  addBtn.addEventListener("click", () => {
    haptic(10);
    openAddSheet();
  });

  // ---------- Settings sheet ----------
  settingsBtn.addEventListener("click", () => openSheet(settingsOverlay));
  closeSettingsBtn.addEventListener("click", () => closeSheet(settingsOverlay));

  hapticsToggle.addEventListener("change", () => {
    hapticsEnabled = hapticsToggle.checked;
    localStorage.setItem(HAPTICS_KEY, hapticsEnabled ? "on" : "off");
    haptic(10);
  });

  reduceTransparencyToggle.addEventListener("change", () => {
    setReduceTransparency(reduceTransparencyToggle.checked);
    haptic(10);
  });

  resetAllBtn.addEventListener("click", () => {
    state.counters.forEach((c) => (c.count = 0));
    save();
    render();
    haptic(15);
  });

  deleteAllBtn.addEventListener("click", () => {
    state.counters = [];
    save();
    render();
    haptic(20);
    closeSheet(settingsOverlay);
  });

  // ---------- Edit mode (toggle delete swipe affordance) ----------
  editBtn.addEventListener("click", () => {
    state.editMode = !state.editMode;
    editBtn.textContent = state.editMode ? "Done" : "Edit";
    document.querySelectorAll(".counter-card").forEach((card) => {
      card.classList.toggle("swiped", state.editMode);
    });
  });

  // ---------- Close sheets on backdrop tap ----------
  [sheetOverlay, settingsOverlay].forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeSheet(overlay);
    });
  });

  // ---------- Init ----------
  function init() {
    load();

    buildColorPicker();
    buildIconPicker();
    buildAccentPicker();
    buildWallpaperPicker();

    setAccent(localStorage.getItem(ACCENT_KEY) || COLORS[0].value, false);
    setWallpaper(localStorage.getItem(WALLPAPER_KEY) || "mono", false);
    setReduceTransparency(localStorage.getItem(REDUCE_TRANSPARENCY_KEY) === "on", false);

    hapticsToggle.checked = hapticsEnabled;
    render();
  }

  init();
})();
