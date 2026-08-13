(function () {

  if (!window.lightdm) {
    const listeners = {};
    const emit = (sig, ...args) => (listeners[sig] || []).forEach(fn => fn(...args));
    window.lightdm = {
      users: [{ name: "user", real_name: "User", display_name: "User", image: "", session: "cinnamon" }],
      sessions: [
        { key: "cinnamon", name: "Cinnamon", comment: "" },
        { key: "gnome", name: "GNOME", comment: "" }
      ],
      default_session: { key: "cinnamon", name: "Cinnamon" },
      battery_data: { name: "BAT0", level: 78, status: "Discharging", ac_status: false, capacity: 78, time: 0, watt: 0 },
      can_access_battery: true,
      can_suspend: true,
      can_restart: true,
      can_shutdown: true,
      in_authentication: false,
      is_authenticated: false,
      authenticate(username) {
        this.in_authentication = true;
        setTimeout(() => emit("show_prompt", "Password:", 1), 150);
      },
      respond(value) {
        setTimeout(() => {
          if (value === "1234") {
            this.is_authenticated = true;
            this.in_authentication = false;
            emit("authentication_complete");
          } else {
            emit("show_message", "Incorrect password", 1);
            emit("authentication_complete");
          }
        }, 300);
      },
      start_session(key) { console.log("start_session (mock)", key); },
      cancel_authentication() { this.in_authentication = false; },
      suspend() { console.log("suspend (mock)"); },
      restart() { console.log("restart (mock)"); },
      shutdown() { console.log("shutdown (mock)"); },
      show_prompt: { connect: fn => (listeners.show_prompt = listeners.show_prompt || []).push(fn) },
      show_message: { connect: fn => (listeners.show_message = listeners.show_message || []).push(fn) },
      authentication_complete: { connect: fn => (listeners.authentication_complete = listeners.authentication_complete || []).push(fn) },
      battery_update: { connect: fn => (listeners.battery_update = listeners.battery_update || []).push(fn) }
    };
    setInterval(() => {
      const b = window.lightdm.battery_data;
      b.level = Math.max(0, b.level - (b.status === "Discharging" ? 1 : -1));
      if (b.level <= 0) b.status = "Charging";
      if (b.level >= 100) b.status = "Discharging";
      emit("battery_update", b);
    }, 8000);
  }
  const lightdm = window.lightdm;

  // ---------- Clock ----------
  const CX = 130, CY = 130, SIZE = 230;
  const svgNS = "http://www.w3.org/2000/svg";

  function scallopedFacePath() {
    const amplitude = SIZE / 35;
    const radius = SIZE / 2 - amplitude;
    let d = "";
    for (let i = 0; i <= 360; i++) {
      const angle = (i / 360) * 2 * Math.PI;
      const rotatedAngle = angle * 12 + Math.PI / 2;
      const wave = Math.sin(rotatedAngle) * amplitude;
      const x = Math.cos(angle) * (radius + wave) + CX;
      const y = Math.sin(angle) * (radius + wave) + CY;
      d += (i === 0 ? "M" : "L") + x.toFixed(2) + "," + y.toFixed(2) + " ";
    }
    return d + "Z";
  }
  document.getElementById("facePath").setAttribute("d", scallopedFacePath());

  const ticksG = document.getElementById("ticksG");
  const faceEdgeR = SIZE / 2;
  function addTick(angleDeg, w, h, cls) {
    const r = faceEdgeR - 12 - h / 2;
    const angle = (angleDeg - 90) * Math.PI / 180;
    const x = CX + r * Math.cos(angle);
    const y = CY + r * Math.sin(angle);
    const rect = document.createElementNS(svgNS, "rect");
    rect.setAttribute("x", -w / 2); rect.setAttribute("y", -h / 2);
    rect.setAttribute("width", w); rect.setAttribute("height", h);
    rect.setAttribute("rx", h / 2);
    rect.setAttribute("class", cls);
    rect.setAttribute("transform", `translate(${x} ${y}) rotate(${angleDeg})`);
    ticksG.appendChild(rect);
  }
  for (let m = 0; m < 60; m++) {
    const angleDeg = m * 6;
    if (m % 5 === 0) addTick(angleDeg, 4, 18, "tick-hour");
    else addTick(angleDeg, 2, 7, "tick-min");
  }

  const dayBubble = document.getElementById("dayBubble");
  function roundedPolygonPath(cx, cy, r, sides, cornerRadius, rotationDeg) {
    const pts = [];
    for (let i = 0; i < sides; i++) {
      const a = (rotationDeg + i * 360 / sides) * Math.PI / 180;
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
    let d = "";
    for (let i = 0; i < sides; i++) {
      const prev = pts[(i - 1 + sides) % sides];
      const cur = pts[i];
      const next = pts[(i + 1) % sides];
      const toPrev = norm([prev[0] - cur[0], prev[1] - cur[1]]);
      const toNext = norm([next[0] - cur[0], next[1] - cur[1]]);
      const p1 = [cur[0] + toPrev[0] * cornerRadius, cur[1] + toPrev[1] * cornerRadius];
      const p2 = [cur[0] + toNext[0] * cornerRadius, cur[1] + toNext[1] * cornerRadius];
      d += (i === 0 ? `M${p1[0]},${p1[1]} ` : `L${p1[0]},${p1[1]} `);
      d += `Q${cur[0]},${cur[1]} ${p2[0]},${p2[1]} `;
    }
    return d + "Z";
    function norm(v) { const l = Math.hypot(v[0], v[1]); return [v[0] / l, v[1] / l]; }
  }
  dayBubble.setAttribute("d", roundedPolygonPath(42, 42, 34, 5, 8, -90));

  const digitalHH = document.getElementById("digitalHH");
  const digitalMM = document.getElementById("digitalMM");
  const hourHand = document.getElementById("handHour");
  const minHand = document.getElementById("handMin");
  const secondHand = document.getElementById("handSec");
  const dayText = document.getElementById("dayText");
  const monthText = document.getElementById("monthText");

  let hourAngle = null, minAngle = null, secAngle = null;
  function tickClock() {
    const now = new Date();
    const h = now.getHours(), m = now.getMinutes(), h12 = h % 12;
    const s = now.getSeconds() + now.getMilliseconds() / 1000;
    const targetHour = -90 + 30 * (h12 + m / 60 + s / 3600);
    const targetMin = -90 + 6 * (m + s / 60);
    const targetSec = -90 + 6 * s;
    if (hourAngle === null) {
      hourAngle = targetHour; minAngle = targetMin; secAngle = targetSec;
    } else {
      let dh = targetHour - hourAngle; if (dh < -180) dh += 360; hourAngle += dh;
      let dm = targetMin - minAngle; if (dm < -180) dm += 360; minAngle += dm;
      let ds = targetSec - secAngle; if (ds < -180) ds += 360; secAngle += ds;
    }
    hourHand.setAttribute("transform", `translate(${CX} ${CY}) rotate(${hourAngle})`);
    minHand.setAttribute("transform", `translate(${CX} ${CY}) rotate(${minAngle})`);
    secondHand.setAttribute("transform", `translate(${CX} ${CY}) rotate(${secAngle})`);
    digitalHH.textContent = String(h).padStart(2, "0");
    digitalMM.textContent = String(m).padStart(2, "0");
    dayText.textContent = now.getDate();
    monthText.textContent = String(now.getMonth() + 1).padStart(2, "0");
  }
  tickClock();
  (function loop() {
    tickClock();
    requestAnimationFrame(loop);
  })();

  // ---------- Login / auth ----------
  const usernameEl = document.getElementById("username");
  const avatarEl = document.getElementById("avatar");
  const pwPill = document.getElementById("pwPill");
  const pwInput = document.getElementById("pwInput");
  const pwPlaceholder = document.getElementById("pwPlaceholder");
  const shapesEl = document.getElementById("shapes");

  const SHAPE_GLYPHS = ["star_rate", "favorite", "pentagon", "hexagon", "change_history", "circle", "square"];

  const currentUser = (lightdm.users && lightdm.users[0]) || { display_name: "User", image: "" };
  usernameEl.textContent = currentUser.display_name || currentUser.real_name || currentUser.username || currentUser.name;
  function showPersonIcon() {
    avatarEl.style.backgroundImage = "";
    avatarEl.innerHTML = '<span class="material sym">person</span>';
  }
  const userImage = currentUser && currentUser.image;
  if (userImage && !userImage.startsWith("file://")) {
    const img = new Image();
    img.onload = () => { avatarEl.style.backgroundImage = `url("${encodeURI(userImage)}")`; };
    img.onerror = showPersonIcon;
    img.src = userImage;
  } else {
    showPersonIcon();
  }

  let authing = false;
  let promptReady = false;
  let pendingSubmit = null;
  let authWatchdog = null;
  function getDefaultSessionKey() {
    const ds = lightdm.default_session;
    if (!ds) return null;
    return typeof ds === "string" ? ds : (ds.key || ds.name || null);
  }
  function beginAuth() {
    if (authing) return;
    const name = (currentUser && (currentUser.username || currentUser.name)) || (lightdm.users && lightdm.users[0] && (lightdm.users[0].username || lightdm.users[0].name));
    if (!name) return;
    authing = true;
    promptReady = false;
    if (typeof lightdm.cancel_authentication === "function") lightdm.cancel_authentication();
    lightdm.authenticate(name);
    if (authWatchdog) clearTimeout(authWatchdog);
    authWatchdog = setTimeout(() => {
      authWatchdog = null;
      pendingSubmit = null;
      if (authing && !promptReady) {
        if (typeof lightdm.cancel_authentication === "function") lightdm.cancel_authentication();
        authing = false;
      }
    }, 15000);
  }
  pwPill.addEventListener("click", () => { pwInput.focus(); beginAuth(); });
  pwInput.addEventListener("focus", beginAuth);

  lightdm.show_prompt.connect((message, type) => {
    if (authWatchdog) { clearTimeout(authWatchdog); authWatchdog = null; }
    promptReady = true;
    pwInput.focus();
    if (authing && pendingSubmit !== null) {
      const v = pendingSubmit;
      pendingSubmit = null;
      promptReady = false;
      lightdm.respond(v);
    }
  });

  function clearShapes() {
    clearDeleteSpacers();
    shapesEl.innerHTML = "";
  }

  let activeSpacer = null;
  let settleTimer = null;
  function clearDeleteSpacers() {
    if (settleTimer) { clearTimeout(settleTimer); settleTimer = null; }
    if (activeSpacer) {
      activeSpacer.remove();
      activeSpacer = null;
    }
  }
  function scheduleSpacerSettle(targetLeft) {
    if (settleTimer) clearTimeout(settleTimer);
    const checkSettle = () => {
      if (!activeSpacer) return;
      const current = shapesEl.scrollLeft;
      const diff = Math.abs(current - targetLeft);
      if (diff <= 1 || current === 0) {
        clearDeleteSpacers();
      } else {
        settleTimer = setTimeout(checkSettle, 50);
      }
    };
    settleTimer = setTimeout(checkSettle, 200);
  }
  function deleteShapesSmooth(count) {
    const shapes = shapesEl.querySelectorAll(".shape");
    if (!shapes.length) return;
    let delta = 0;
    const toRemove = [];
    for (let i = shapes.length - 1; i >= shapes.length - count && i >= 0; i--) {
      delta += shapes[i].getBoundingClientRect().width + 1;
      toRemove.push(shapes[i]);
    }
    if (delta <= 0) return;

    if (!activeSpacer || !shapesEl.contains(activeSpacer)) {
      activeSpacer = document.createElement("span");
      activeSpacer.className = "delete-spacer";
      activeSpacer.style.display = "inline-block";
      activeSpacer.style.flexShrink = "0";
      activeSpacer.style.height = "1px";
      activeSpacer.style.width = "0px";
      shapesEl.appendChild(activeSpacer);
    }

    const currentSpacerWidth = parseFloat(activeSpacer.style.width) || 0;
    const newSpacerWidth = currentSpacerWidth + delta;
    activeSpacer.style.width = newSpacerWidth + "px";

    toRemove.forEach(s => s.remove());

    const targetLeft = Math.max(0, shapesEl.scrollWidth - newSpacerWidth - shapesEl.clientWidth);
    shapesEl.scrollTo({
      left: targetLeft,
      behavior: "smooth"
    });
    scheduleSpacerSettle(targetLeft);
  }

  pwInput.addEventListener("input", () => {
    if (errorTimer) {
      clearTimeout(errorTimer);
      errorTimer = null;
      pwPill.classList.remove("shake");
      pwPlaceholder.classList.remove("error");
    }
    const len = pwInput.value.length;
    const shapeCount = shapesEl.querySelectorAll(".shape").length;
    if (len < shapeCount) {
      deleteShapesSmooth(shapeCount - len);
    } else {
      clearDeleteSpacers();
      for (let i = shapeCount; i < len; i++) {
        const s = document.createElement("span");
        s.className = "material sym shape";
        s.textContent = SHAPE_GLYPHS[i % SHAPE_GLYPHS.length];
        shapesEl.appendChild(s);
      }
      shapesEl.scrollTo({ left: shapesEl.scrollWidth, behavior: "smooth" });
    }
    pwPlaceholder.classList.toggle("hidden", len > 0);
  });

  pwInput.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" || pwInput.value.length === 0) return;
    if (!authing) {
      pendingSubmit = pwInput.value;
      beginAuth();
      return;
    }
    if (!promptReady) {
      pendingSubmit = pwInput.value;
      return;
    }
    pendingSubmit = null;
    promptReady = false;
    lightdm.respond(pwInput.value);
  });

  let errorTimer = null;
  lightdm.show_message.connect((message, type) => {
    pwPill.classList.add("shake");
    pwPlaceholder.textContent = message || "Incorrect password";
    pwPlaceholder.classList.add("error");
    pwPlaceholder.classList.remove("hidden");
    pwInput.value = "";
    clearShapes();
    pendingSubmit = null;
    if (errorTimer) clearTimeout(errorTimer);
    errorTimer = setTimeout(() => {
      pwPill.classList.remove("shake");
      pwPlaceholder.textContent = "Enter password";
      pwPlaceholder.classList.remove("error");
      errorTimer = null;
    }, 2000);
  });

  lightdm.authentication_complete.connect(() => {
    if (authWatchdog) { clearTimeout(authWatchdog); authWatchdog = null; }
    const wasPrompted = promptReady;
    authing = false;
    promptReady = false;
    pendingSubmit = null;
    if (lightdm.is_authenticated) {
      transitionIcon.textContent = "lock_open";
      transitionEl.classList.remove("hidden", "done");
      transitionEl.classList.add("out");
      stageEl.classList.remove("cards-in");
      stageEl.classList.add("out");
      setTimeout(() => {
        try {
          lightdm.start_session((selectedSession && selectedSession.key) || getDefaultSessionKey());
        } catch (err) {
          console.error("start_session failed:", err);
        }
      }, 650);
    } else if (wasPrompted) {
      beginAuth();
    }
  });

  // ---------- Battery ----------
  const batteryRow = document.getElementById("batteryRow");
  const batteryIcon = document.getElementById("batteryIcon");
  const batteryPct = document.getElementById("batteryPct");

  function renderBattery(b) {
    if (!b || !Number.isFinite(b.level) || b.level < 0) {
      batteryRow.style.display = "none";
      return;
    }
    batteryRow.style.display = "flex";
    batteryPct.textContent = `${Math.round(b.level)}%`;
    batteryIcon.textContent = b.status === "Charging" ? "bolt" : "battery_android_full";
  }
  if (lightdm.can_access_battery) {
    renderBattery(lightdm.battery_data);
    lightdm.battery_update.connect(renderBattery);
  }

  // ---------- Session selector ----------
  const sessionBtn = document.getElementById("sessionBtn");
  const sessionName = document.getElementById("sessionName");
  const sessions = lightdm.sessions || [];
  let sessionIdx = Math.max(0, sessions.findIndex(s => s.key === getDefaultSessionKey()));
  let selectedSession = sessions[sessionIdx] || sessions[0];
  function renderSession() {
    sessionName.textContent = selectedSession ? selectedSession.name : "Session";
  }
  renderSession();
  sessionBtn.addEventListener("click", () => {
    if (!sessions.length) return;
    sessionIdx = (sessionIdx + 1) % sessions.length;
    selectedSession = sessions[sessionIdx];
    renderSession();
  });

  // ---------- Power buttons ----------
  if (!lightdm.can_suspend) document.getElementById("suspendBtn").style.display = "none";
  if (!lightdm.can_restart) document.getElementById("restartBtn").style.display = "none";
  if (!lightdm.can_shutdown) document.getElementById("shutdownBtn").style.display = "none";
  document.getElementById("suspendBtn").addEventListener("click", () => {
    if (lightdm.can_suspend) lightdm.suspend();
  });
  document.getElementById("restartBtn").addEventListener("click", () => {
    if (lightdm.can_restart) lightdm.restart();
  });
  document.getElementById("shutdownBtn").addEventListener("click", () => {
    if (lightdm.can_shutdown) lightdm.shutdown();
  });

  // ---------- Keyboard layout (cycles real lightdm.layouts; 1.6.2 has no set_layout, so visual only) ----------
  const layoutBtn = document.getElementById("layoutBtn");
  const layoutName = document.getElementById("layoutName");
  const layouts = lightdm.layouts || [];
  let layoutIdx = 0;
  if (layouts.length) {
    const active = lightdm.layout && (lightdm.layout.name || lightdm.layout);
    const found = layouts.findIndex(l => l.name === active);
    if (found !== -1) layoutIdx = found;
    const label = l => (l && (l.short_description || l.name)) || "";
    layoutName.textContent = label(layouts[layoutIdx]);
    layoutBtn.addEventListener("click", () => {
      layoutIdx = (layoutIdx + 1) % layouts.length;
      layoutName.textContent = label(layouts[layoutIdx]);
    });
  } else {
    layoutBtn.style.display = "none";
  }

  // ---------- Entrance / outro transitions ----------
  const stageEl = document.querySelector(".stage");
  const transitionEl = document.getElementById("transition");
  const transitionIcon = transitionEl.querySelector(".material");
  setTimeout(() => {
    stageEl.classList.add("cards-in");
    transitionEl.classList.remove("in");
    transitionEl.classList.add("done");
  }, 560);
  setTimeout(() => transitionEl.classList.add("hidden"), 800);

  pwInput.focus();
  beginAuth();

})();
