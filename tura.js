/* Живой слой «Туры»: пузырьки, появление блоков, цифры, статус «открыто», карточки услуг ↔ форма записи, просмотр фото, карта Яндекса.
   Подключается после style.js. Форму записи и отправку в мессенджеры ведёт style.js, здесь их только слушаем. */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasIO = "IntersectionObserver" in window;

  // ---------- появление блоков при прокрутке
  const rvs = $$(".t-rv");
  if (rvs.length) {
    if (hasIO && !reduce) {
      const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }), { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
      rvs.forEach((el) => io.observe(el));
    } else rvs.forEach((el) => el.classList.add("is-in"));
  }

  // ---------- цифры: считаем от нуля, когда блок появился
  const fmtNum = (v, dec) => v.toLocaleString("ru-RU", { minimumFractionDigits: dec, maximumFractionDigits: dec });
  const counters = $$("[data-count]");
  if (counters.length && hasIO && !reduce) {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return; io.unobserve(e.target);
      const el = e.target, to = +el.dataset.count, dec = +el.dataset.dec || 0, t0 = performance.now(), dur = 1400;
      const step = (t) => { const k = Math.min(1, (t - t0) / dur), v = to * (1 - Math.pow(1 - k, 3)); el.textContent = fmtNum(k < 1 ? v : to, dec); if (k < 1) requestAnimationFrame(step); };
      el.textContent = fmtNum(0, dec); requestAnimationFrame(step);
    }), { threshold: 0.6 });
    counters.forEach((el) => io.observe(el));
  }

  // ---------- «сейчас открыто» по времени Тюмени
  $$("[data-t-status]").forEach((el) => {
    try {
      const o = +el.dataset.open, c = +el.dataset.close;
      const parts = new Intl.DateTimeFormat("ru-RU", { timeZone: el.dataset.tz, hour: "numeric", minute: "numeric", hour12: false }).formatToParts(new Date());
      const t = (+parts.find((p) => p.type === "hour").value % 24) + +parts.find((p) => p.type === "minute").value / 60;
      const open = t >= o && t < c;
      el.classList.add(open ? "is-open" : "is-closed");
      $("b", el).textContent = open ? (c - t <= 1 ? "Скоро закрываемся · до " + c + ":00" : "Сейчас открыто · до " + c + ":00") : "Сейчас закрыто · откроемся " + (t < o ? "" : "завтра ") + "в " + o + ":00";
    } catch (_) { /* остаётся текст «ежедневно 9:00–22:00» */ }
  });

  // ---------- блик за курсором на первом экране и на карточках
  if (matchMedia("(hover: hover)").matches && !reduce) {
    const hero = $(".t-hero");
    if (hero) {
      hero.addEventListener("pointermove", (e) => { const r = hero.getBoundingClientRect(); hero.style.setProperty("--mx", e.clientX - r.left + "px"); hero.style.setProperty("--my", e.clientY - r.top + "px"); hero.classList.add("is-hover"); }, { passive: true });
      hero.addEventListener("pointerleave", () => hero.classList.remove("is-hover"));
    }
    $$(".t-card").forEach((c) => c.addEventListener("pointermove", (e) => { const r = c.getBoundingClientRect(); c.style.setProperty("--mx", e.clientX - r.left + "px"); c.style.setProperty("--my", e.clientY - r.top + "px"); }, { passive: true }));
  }

  // ---------- пузырьки на первом экране: стоят, когда экран не виден
  const cv = $("[data-t-bubbles]");
  if (cv && cv.getContext && !reduce) {
    const ctx = cv.getContext("2d"); let W = 0, H = 0, list = [], raf = 0, vis = true, last = 0;
    const mk = (init) => ({ x: W * (0.16 + 0.84 * Math.random()), y: init ? Math.random() * H : H + 20 + Math.random() * 80, r: 3 + Math.pow(Math.random(), 2) * 15, v: 14 + Math.random() * 34, ph: Math.random() * 6.28, sw: 8 + Math.random() * 22, a: 0.35 + Math.random() * 0.4 });
    const size = () => {
      const b = cv.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2); W = b.width; H = b.height;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(32, Math.max(10, W / 50))); while (list.length < n) list.push(mk(true)); list.length = n;
    };
    const draw = (t) => {
      const dt = Math.min(0.05, (t - last) / 1000 || 0.016); last = t; ctx.clearRect(0, 0, W, H);
      for (const b of list) {
        b.y -= b.v * dt; b.ph += dt; if (b.y < -b.r * 2) Object.assign(b, mk(false));
        const x = b.x + Math.sin(b.ph * 1.1) * b.sw, g = ctx.createRadialGradient(x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.1, x, b.y, b.r);
        g.addColorStop(0, "rgba(255,255,255," + b.a * 0.55 + ")"); g.addColorStop(0.6, "rgba(150,225,245," + b.a * 0.12 + ")"); g.addColorStop(1, "rgba(190,240,255," + b.a * 0.38 + ")");
        ctx.beginPath(); ctx.arc(x, b.y, b.r, 0, 6.2832); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = "rgba(200,244,255," + b.a * 0.7 + ")"; ctx.stroke();
        ctx.beginPath(); ctx.arc(x - b.r * 0.38, b.y - b.r * 0.38, Math.max(0.8, b.r * 0.16), 0, 6.2832); ctx.fillStyle = "rgba(255,255,255," + Math.min(0.9, b.a + 0.3) + ")"; ctx.fill();
      }
      raf = vis && !document.hidden ? requestAnimationFrame(draw) : 0;
    };
    const run = () => { if (!raf && vis && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(draw); } };
    size(); run();
    if ("ResizeObserver" in window) { let t = 0; new ResizeObserver(() => { clearTimeout(t); t = setTimeout(size, 150); }).observe(cv); } else addEventListener("resize", size);
    if (hasIO) new IntersectionObserver((es) => { vis = es[0].isIntersecting; run(); }).observe(cv);
    document.addEventListener("visibilitychange", run);
  }

  // ---------- карточки услуг и форма записи: одно состояние
  const booking = $("[data-s-booking]");
  if (booking) {
    const btns = $$("[data-t-svc]"), pill = $("[data-t-pill]"), pillN = $("[data-t-pill-n]"), dock = $("[data-t-dock]"), widget = $("#widget");
    const dockText = dock ? dock.textContent : ""; let widgetVisible = true;
    const box = (n) => booking.querySelector('input[name=svc][value="' + n + '"]');
    const refresh = () => {
      const on = $$("input[name=svc]:checked", booking).length;
      btns.forEach((b) => { const x = box(b.dataset.tSvc), v = !!(x && x.checked); b.setAttribute("aria-pressed", v ? "true" : "false"); const card = b.closest("[data-t-card]"); if (card) card.classList.toggle("is-picked", v); });
      if (pillN) pillN.textContent = on;
      if (pill) pill.classList.toggle("is-on", on > 0 && !widgetVisible);
      if (dock) dock.textContent = on ? "Записаться: " + on + " усл." : dockText;
    };
    btns.forEach((b) => b.addEventListener("click", () => { const x = box(b.dataset.tSvc); if (!x) return; x.checked = !x.checked; x.dispatchEvent(new Event("change", { bubbles: true })); }));
    booking.addEventListener("change", refresh);
    booking.addEventListener("click", (e) => { if (e.target.closest("[data-s-all],[data-s-none]")) refresh(); });
    if (widget && hasIO) new IntersectionObserver((es) => { widgetVisible = es[0].isIntersecting; refresh(); }).observe(widget);
    refresh();
  }

  // ---------- просмотр фото
  const lb = $("[data-t-lb]"), shots = $$("[data-lb]");
  if (lb && shots.length && lb.showModal) {
    const img = $("img", lb), cap = $("figcaption", lb); let cur = 0;
    const show = (k) => { cur = (k + shots.length) % shots.length; const im = $("img", shots[cur]); img.src = im.currentSrc || im.src; img.alt = im.alt; cap.textContent = $("span", shots[cur]).textContent; };
    shots.forEach((b, k) => b.addEventListener("click", () => { show(k); lb.showModal(); }));
    $("[data-lb-close]", lb).addEventListener("click", () => lb.close());
    $("[data-lb-prev]", lb).addEventListener("click", () => show(cur - 1));
    $("[data-lb-next]", lb).addEventListener("click", () => show(cur + 1));
    lb.addEventListener("click", (e) => { if (e.target === lb) lb.close(); });
    lb.addEventListener("keydown", (e) => { if (e.key === "ArrowLeft") show(cur - 1); if (e.key === "ArrowRight") show(cur + 1); });
  }

  // ---------- карта Яндекса: грузим при подходе к блоку; при сбое остаётся заглушка со ссылками
  const map = $("[data-t-map]");
  if (map) {
    const frame = $("iframe", map), msg = $("[data-t-map-msg]"); let started = false, timer = 0;
    const fail = () => { clearTimeout(timer); if (map.classList.contains("is-loaded")) return; map.classList.add("is-failed"); if (msg) msg.hidden = false; };
    // заблокированный виджет (расширение, фильтр сети) тоже даёт iframe событие load со страницей ошибки,
    // поэтому сначала проверяем, что адрес виджета достижим
    const reachable = () => {
      if (!window.fetch) return Promise.resolve();
      const ac = window.AbortController ? new AbortController() : null, t = setTimeout(() => ac && ac.abort(), 10000);
      return fetch(frame.dataset.src, { mode: "no-cors", cache: "no-store", signal: ac ? ac.signal : undefined })
        .catch((e) => { if (e && e.name === "AbortError") return; throw e; }).finally(() => clearTimeout(t));
    };
    const start = () => {
      if (started) return; started = true;
      if (navigator.onLine === false) return fail();
      reachable().then(() => {
        frame.addEventListener("load", () => { clearTimeout(timer); map.classList.remove("is-failed"); map.classList.add("is-loaded"); if (msg) msg.hidden = true; });
        frame.addEventListener("error", fail);
        timer = setTimeout(fail, 12000);
        frame.src = frame.dataset.src;
      }, fail);
    };
    if (hasIO) { const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { start(); io.disconnect(); } }, { rootMargin: "500px 0px" }); io.observe(map); } else start();
    addEventListener("offline", fail);
  }
})();
