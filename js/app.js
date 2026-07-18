(() => {
  "use strict";

  const STORAGE_KEY = "multiport-counter.counters";
  const HAPTICS_KEY = "multiport-counter.haptics";

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

  const el = (id) => document.getElementById(id);

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
  const saveCounterBtn = el("saveCounterBtn");
  const deleteCounterBtn = el("deleteCounterBtn");

  const settingsOverlay = el("settingsOverlay");
  const hapticsToggle = el("hapticsToggle");
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

  let hapticsEnabled = true;

  function haptic(strength = 10) {
    if (hapticsEnabled && navigator.vibrate) {
      navigator.vibrate(strength);
    }
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  // ---------- Rendering ----------
  function render() {
    counterList.innerHTML = "";
    emptyState.classList.toggle("visible", state.counters.length === 0);

    state.counters.forEach((counter) => {
      counterList.appendChild(buildCounterCard(counter));
    });
  }

  function buildCounterCard(counter) {
    const card = document.createElement("div");
    card.className = "counter-card";
    card.dataset.id = counter.id;

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

    const swatch = document.createElement("div");
    swatch.className = "counter-swatch";
    swatch.style.background = counter.color;

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
  function attachSwipe(card, content) {
    let startX = 0;
    let currentX = 0;
    let dragging = false;

    content.addEventListener("pointerdown", (e) => {
      startX = e.clientX;
      dragging = true;
      card.style.transition = "none";
    });

    content.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      currentX = e.clientX - startX;
      if (currentX < 0 && currentX > -100) {
        content.style.transform = `translateX(${currentX}px)`;
      }
    });

    function endDrag() {
      if (!dragging) return;
      dragging = false;
      card.style.transition = "";
      content.style.transition = "transform 0.25s cubic-bezier(.25,.9,.35,1)";
      if (currentX < -44) {
        content.style.transform = "translateX(-88px)";
        card.classList.add("swiped");
      } else {
        content.style.transform = "translateX(0)";
        card.classList.remove("swiped");
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
    refreshStepSelection();
    refreshColorSelection();
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
    refreshStepSelection();
    refreshColorSelection();
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
      }
    } else {
      state.counters.push({
        id: uid(),
        name,
        count: 0,
        step: sheetStep,
        color: sheetColor,
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

  // ---------- Seed data for first run ----------
  function seedIfEmpty() {
    if (state.counters.length > 0) return;
    if (localStorage.getItem(STORAGE_KEY) !== null) return; // user cleared intentionally
    state.counters = [
      { id: uid(), name: "Reps", count: 0, step: 1, color: COLORS[0].value },
      { id: uid(), name: "Water", count: 0, step: 1, color: COLORS[7].value },
    ];
    save();
  }

  // ---------- Init ----------
  function init() {
    load();
    seedIfEmpty();
    buildColorPicker();
    hapticsToggle.checked = hapticsEnabled;
    render();
  }

  init();
})();
