/* Masáže Layla v3 */
const EN = document.documentElement.lang === "en";
const L = (sk, en) => (EN ? en : sk);
(() => {
  const root = document.documentElement;
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // hlavička a spodná lišta
  const header = document.querySelector("[data-header]");
  const onScroll = () => { header.classList.toggle("scrolled", scrollY > 30); root.classList.toggle("docked", scrollY > 320); };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // menu na mobile
  const burger = document.querySelector(".burger");
  const setMenu = open => { root.classList.toggle("menu-open", open); burger.setAttribute("aria-expanded", open); burger.setAttribute("aria-label", open ? L("Zavrieť menu", "Close menu") : L("Otvoriť menu", "Open menu")); };
  burger.addEventListener("click", () => setMenu(!root.classList.contains("menu-open")));
  $$(".nav a").forEach(a => a.addEventListener("click", () => setMenu(false)));
  addEventListener("keydown", e => { if (e.key === "Escape") setMenu(false); });

  // postupné objavenie textu v hero
  $$(".hero [data-rise]").forEach((el, i) => el.style.setProperty("--n", i));

  // objavenie pri scrolle: skryjú sa len prvky pod prvou obrazovkou
  const reveals = $$("[data-reveal]");
  if (!reduce && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(entries => entries.filter(e => e.isIntersecting).forEach((e, i) => {
      e.target.style.transitionDelay = i * 0.08 + "s"; e.target.classList.remove("pre"); io.unobserve(e.target);
    }), { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
    reveals.forEach(el => { if (el.getBoundingClientRect().top > innerHeight * 0.92) { el.classList.add("pre"); io.observe(el); } });
  }
})();

/* Rezervácia v krokoch: kategória → procedúra → dĺžka → Booqme s konkrétnou službou.
   Tlačidlá s data-book otvoria to isté v okne; data-book="bankovanie" rovno predvyberie kategóriu. */
(() => {
  const src = document.getElementById("bk-data");
  if (!src) return;
  let data;
  try { data = JSON.parse(src.textContent); } catch (e) { return; }
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const arrow = '<svg class="i i-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h15M13 6l6 6-6 6"/></svg>';

  // Kalendár Booqme priamo v stránke (len na vlastnej doméne a localhoste; náhľad cudzie stránky vložiť nedovolí).
  // Booqme si údaje zákazníka pamätá aj vo vloženom okne a predvyplní ich po výbere času; vypnúť: EMBED = false.
  const EMBED = true;
  const embedOk = EMBED && /(^|\.)masazelayla\.sk$|\.github\.io$|^localhost$|^127\.0\.0\.1$/.test(location.hostname);

  const mount = (el, preset) => {
    const body = el.querySelector(".bk-body"), steps = [...el.querySelectorAll(".bk-steps li")];
    const st = { cat: null, item: null, opt: null, sent: false };
    const pick = key => {
      st.cat = data.cats.find(c => c.key === key) || null; st.item = null; st.opt = null; st.sent = false;
      if (st.cat && st.cat.items.length === 1) st.item = st.cat.items[0];
    };
    const pills = (list, cur, kind, label) => list.map((x, i) =>
      `<button type="button" class="pill" data-k="${kind}" data-i="${i}" aria-pressed="${x === cur}">${label(x)}</button>`).join("");
    const draw = () => {
      el.classList.toggle("bk-cal", !!(st.sent && embedOk));
      if (st.sent && embedOk) {
        body.innerHTML = `<div class="bk-back"><p class="bk-sum">${esc(st.item.name)}<small>${st.opt.min} ${L("minút", "min")} · ${st.opt.price} €</small></p>
          <button type="button" class="link" data-bk-back>${L("Zmeniť výber", "Change")}</button></div>
          <iframe class="bk-frame" src="${esc(st.opt.url)}&embed=1" title="${L("Výber dňa a času", "Choose day and time")}: ${esc(st.item.name)}" loading="lazy"></iframe>
          <p class="bk-after">${L("Kalendár sa nenačítal?", "Calendar not loading?")} <a href="${esc(st.opt.url)}" target="_blank" rel="noopener">${L("Otvoriť rezerváciu v novom okne", "Open the booking in a new window")}</a> ${L("alebo zavolajte", "or call")} <a href="${esc(data.phoneHref)}">${esc(data.phone)}</a>.</p>`;
        steps.forEach((li, i) => { li.classList.toggle("on", i === 2); li.classList.toggle("done", i < 2); });
        return;
      }
      let h = `<div><p class="bk-q">${L("Čo to bude?", "What would you like?")}</p><div class="pills">${pills(data.cats, st.cat, "cat", c => esc(c.name))}</div></div>`;
      if (st.cat && st.cat.items.length > 1)
        h += `<div><p class="bk-q">${L("Ktorá procedúra?", "Which treatment?")}</p><div class="pills">${pills(st.cat.items, st.item, "item", x => esc(x.name))}</div></div>`;
      if (st.item)
        h += `<div><p class="bk-q">${L("Na ako dlho?", "How long?")}</p><div class="pills">${pills(st.item.opts, st.opt, "opt", o => `${o.min} min <small>${o.price} €</small>`)}</div></div>`;
      if (st.opt)
        h += `<div class="bk-final"><p class="bk-sum">${esc(st.item.name)}<small>${st.opt.min} ${L("minút", "min")} · ${st.opt.price} €</small></p>
          <a class="btn" href="${esc(st.opt.url)}" target="_blank" rel="noopener" data-bk-go>${L("Vybrať deň a čas", "Choose day and time")} ${arrow}</a></div>`;
      if (st.sent)
        h += `<p class="bk-after">${L("Rezervácia sa otvorila v novom okne, stačí vybrať deň a čas. Nepodarilo sa? Zavolajte", "The booking opened in a new window – just pick a day and time. Didn’t work? Call")} <a href="${esc(data.phoneHref)}">${esc(data.phone)}</a> ${L("a termín dohodneme hneď.", "and we will arrange a time right away.")}</p>`;
      body.innerHTML = h;
      const at = st.opt ? 2 : st.item ? 1 : 0;
      steps.forEach((li, i) => { li.classList.toggle("on", i === at); li.classList.toggle("done", i < at); });
    };
    body.addEventListener("click", e => {
      const b = e.target.closest(".pill");
      if (b) {
        const i = +b.dataset.i;
        if (b.dataset.k === "cat") pick(data.cats[i].key);
        if (b.dataset.k === "item") { st.item = st.cat.items[i]; st.opt = null; st.sent = false; }
        if (b.dataset.k === "opt") { st.opt = st.item.opts[i]; st.sent = false; }
        draw();
        const next = body.querySelector(".bk-final .btn") || [...body.querySelectorAll(".pills")].pop().querySelector(".pill");
        if (next && b.dataset.k === "opt") { next.focus({ preventScroll: true }); next.closest(".bk-final").scrollIntoView({ block: "center", behavior: "smooth" }); }
        return;
      }
      if (e.target.closest("[data-bk-back]")) { st.sent = false; draw(); return; }
      if (e.target.closest("[data-bk-go]")) {
        (window.dataLayer = window.dataLayer || []).push({ event: "rezervacia_vyber", procedura: st.item.name, minuty: st.opt.min, cena: st.opt.price });
        if (embedOk) { e.preventDefault(); st.sent = true; draw(); }
        else setTimeout(() => { st.sent = true; draw(); }, 400);
      }
    });
    el.bkSet = key => { pick(key); draw(); };
    // priamy odkaz na konkrétnu službu (cenník, karta služieb): rovno kalendár
    el.bkOpen = url => {
      for (const c of data.cats) for (const it of c.items) for (const o of it.opts) if (o.url === url) {
        st.cat = c; st.item = it; st.opt = o; st.sent = true;
        (window.dataLayer = window.dataLayer || []).push({ event: "rezervacia_vyber", procedura: it.name, minuty: o.min, cena: o.price });
        draw(); return true;
      }
      return false;
    };
    pick(preset || null); draw();
  };

  document.querySelectorAll("[data-bk]").forEach(el => { if (!el.closest("dialog")) mount(el); });

  const dlg = document.getElementById("bk-dialog");
  if (!dlg || !dlg.showModal) return;
  const inDlg = dlg.querySelector("[data-bk]");
  mount(inDlg);
  // s JS tlačidlá nevedú priamo do Booqme (inak by sa popri okne otvorila aj nová karta), len otvárajú výber
  document.querySelectorAll("a[data-book]").forEach(a => {
    a.removeAttribute("href"); a.removeAttribute("target"); a.removeAttribute("rel");
    a.setAttribute("role", "button"); a.tabIndex = 0;
    a.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); a.click(); } });
  });
  document.addEventListener("click", e => {
    const direct = embedOk && !e.target.closest("[data-bk]") && e.target.closest('a[href*="booqme.app"][href*="service="]');
    if (direct && inDlg.bkOpen(direct.getAttribute("href"))) { e.preventDefault(); dlg.showModal(); return; }
    const t = e.target.closest("[data-book]");
    if (!t) return;
    e.preventDefault();
    inDlg.bkSet(t.dataset.book || null);
    dlg.showModal();
  });
  dlg.addEventListener("click", e => { if (e.target === dlg || e.target.closest("[data-bk-close]")) dlg.close(); });
})();

/* Cookie lišta: voľba sa uloží do localStorage (layla-suhlas) a pošle do Google Consent Mode.
   Kým človek nič nezvolí, platí predvolené „odmietnuté“ z hlavičky stránky. */
(() => {
  const box = document.getElementById("cookie");
  if (!box) return;
  const KEY = "layla-suhlas", a = box.querySelector("#cookie-a"), m = box.querySelector("#cookie-m"), opts = box.querySelector(".cookie-opts");
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { return null; } };
  const send = c => {
    const g = v => (v ? "granted" : "denied");
    window.dataLayer = window.dataLayer || [];
    if (typeof window.gtag === "function") window.gtag("consent", "update", { analytics_storage: g(c.a), ad_storage: g(c.m), ad_user_data: g(c.m), ad_personalization: g(c.m) });
    window.dataLayer.push({ event: "suhlas_cookies", suhlas_analyticke: c.a, suhlas_marketing: c.m });
  };
  const save = c => { c.t = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {} send(c); box.hidden = true; };
  const open = settings => {
    const c = read() || { a: false, m: false };
    a.checked = !!c.a; m.checked = !!c.m; opts.hidden = !settings; box.hidden = false;
    box.querySelector('[data-cookie="none"]').hidden = !settings;
    box.querySelector('[data-cookie="more"]').textContent = settings ? L("Uložiť výber", "Save choice") : L("Nastavenia", "Settings");
  };
  box.addEventListener("click", e => {
    const k = e.target.dataset && e.target.dataset.cookie;
    if (k === "all") save({ a: true, m: true });
    if (k === "none") save({ a: false, m: false });
    if (k === "more") { if (opts.hidden) open(true); else save({ a: a.checked, m: m.checked }); }
  });
  document.addEventListener("click", e => { if (e.target.closest("[data-cookie-open]")) open(true); });
  if (!read()) open(false);
})();

/* Zber e-mailov so zľavou. S adresou v data-endpoint sa e-mail odošle do Google formulára (tabuľka v Laurinom účte)
   a kód sa ukáže po odoslaní; bez nej je to ukážka (nič sa neukladá a stránka to povie). */
(() => {
  const form = document.getElementById("lead-form");
  if (!form) return;
  const msg = document.getElementById("lead-msg"), done = document.getElementById("lead-done"), note = document.getElementById("lead-note");
  const email = form.querySelector("#lead-email"), ok = form.querySelector("#lead-ok"), btn = form.querySelector("button");
  const show = preview => {
    form.hidden = true; done.hidden = false; note.hidden = !preview;
    (window.dataLayer = window.dataLayer || []).push({ event: "email_prihlasenie", ukazka: !!preview });
  };
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const v = email.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { msg.textContent = L("Zadajte, prosím, platný e-mail.", "Please enter a valid e-mail."); email.focus(); return; }
    if (!ok.checked) { msg.textContent = L("Bez súhlasu vám e-maily posielať nemôžem. Zaškrtnite, prosím, súhlas.", "I can’t send e-mails without your consent. Please tick the box."); ok.focus(); return; }
    const url = form.dataset.endpoint;
    // v náhľade (mimo ostrej domény) sa nič neodosiela, len sa ukáže, ako to vyzerá
    const live = /(^|\.)masazelayla\.sk$|\.github\.io$|^localhost$|^127\.0\.0\.1$/.test(location.hostname);
    if (!url || !live) { show(true); return; }
    btn.disabled = true; msg.textContent = "Odosielam…";
    try {
      // Google formulár: odpoveď sa nedá prečítať (iná doména), úspech = požiadavka odišla bez chyby siete
      const body = new URLSearchParams();
      body.set(form.dataset.fEmail, v);
      body.set(form.dataset.fNote, "súhlas s novinkami: áno; stránka: " + (document.documentElement.dataset.page || location.pathname));
      await fetch(url, { method: "POST", mode: "no-cors", body });
      show(false);
    } catch (err) {
      btn.disabled = false;
      msg.textContent = L("Nepodarilo sa to odoslať. Skúste to o chvíľu znova alebo mi napíšte na masazelayla@gmail.com.", "Sending failed. Please try again shortly or write to masazelayla@gmail.com.");
    }
  });
})();

/* Úvod: rýchla rezervácia v lište (procedúra → dĺžka → Booqme), prepínač služieb, bodky panelov, posuvný pás fotiek. */
(() => {
  const src = document.getElementById("bk-data");
  let data = null;
  try { data = JSON.parse(src.textContent); } catch (e) {}
  const q = document.querySelector("[data-quick]");
  if (q && data) {
    const items = {};
    data.cats.forEach(c => c.items.forEach(it => (items[it.key] = it)));
    const sel = q.querySelector("select"), box = q.querySelector(".q-opts"), go = q.querySelector(".q-go");
    let cur = null;
    const draw = () => {
      const it = items[sel.value];
      if (!cur || !it.opts.includes(cur)) cur = it.opts.find(o => o.min === 60) || it.opts[0];
      box.innerHTML = it.opts.map((o, i) => `<button type="button" class="q-opt" data-i="${i}" aria-pressed="${o === cur}">${o.min} min<small>${o.price} €</small></button>`).join("");
      go.href = cur.url;
    };
    sel.addEventListener("change", () => { cur = null; draw(); });
    box.addEventListener("click", e => { const b = e.target.closest(".q-opt"); if (b) { cur = items[sel.value].opts[+b.dataset.i]; draw(); } });
    go.addEventListener("click", () => (window.dataLayer = window.dataLayer || []).push({ event: "rezervacia_vyber", procedura: items[sel.value].name, minuty: cur.min, cena: cur.price }));
    q.addEventListener("submit", e => e.preventDefault());
    draw();
  }

  const sx = document.querySelector("[data-sx-root]");
  if (sx) {
    const tabs = [...sx.querySelectorAll(".sx-tab")], cards = [...sx.querySelectorAll(".sx-card")], bgs = [...sx.querySelectorAll(".sx-bg img")];
    const set = i => { [tabs, cards, bgs].forEach(l => l.forEach((el, k) => el.classList.toggle("on", k === i))); tabs.forEach((t, k) => t.setAttribute("aria-pressed", k === i)); };
    // výber procedúry v karte: dĺžky a ceny sa prekreslia podľa zvolenej procedúry
    if (data) {
      const items = {};
      data.cats.forEach(c => c.items.forEach(it => (items[it.key] = it)));
      sx.querySelectorAll("[data-sx-proc]").forEach(sel => {
        const box = sel.closest(".sx-card").querySelector(".sx-len");
        sel.addEventListener("change", () => {
          const it = items[sel.value];
          box.innerHTML = it.opts.map(o => `<a href="${o.url}" target="_blank" rel="noopener" aria-label="${L("Rezervovať", "Book")}: ${it.name}, ${o.min} min ${L("za", "for")} ${o.price} €"><small>${o.min} min</small><b>${o.price} €</b></a>`).join("");
        });
      });
    }
    tabs.forEach((t, i) => { t.addEventListener("click", () => set(i)); t.addEventListener("mouseenter", () => { if (matchMedia("(hover:hover)").matches) set(i); }); });
  }

  const panels = [...document.querySelectorAll("[data-panel]")];
  if (panels.length > 1 && "IntersectionObserver" in window) {
    const nav = document.createElement("nav");
    nav.className = "dots"; nav.setAttribute("aria-label", L("Časti stránky", "Page sections"));
    panels.forEach(p => { const b = document.createElement("button"); b.type = "button"; b.innerHTML = `<span>${p.dataset.panel}</span>`; b.setAttribute("aria-label", p.dataset.panel); b.addEventListener("click", () => p.scrollIntoView({ behavior: "smooth" })); nav.appendChild(b); });
    document.body.appendChild(nav);
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) [...nav.children].forEach((b, i) => b.classList.toggle("on", panels[i] === e.target)); }), { threshold: 0.5 });
    panels.forEach(p => io.observe(p));
  }

  const rail = document.querySelector("[data-rail]");
  if (rail) {
    let down = false, x0 = 0, s0 = 0;
    rail.addEventListener("pointerdown", e => { if (e.pointerType !== "mouse") return; down = true; x0 = e.clientX; s0 = rail.scrollLeft; rail.style.scrollSnapType = "none"; rail.style.cursor = "grabbing"; });
    addEventListener("pointermove", e => { if (down) rail.scrollLeft = s0 - (e.clientX - x0); });
    addEventListener("pointerup", () => { if (down) { down = false; rail.style.scrollSnapType = ""; rail.style.cursor = ""; } });
  }
})();

/* Úvod po paneloch: jeden pohyb kolieskom alebo šípkou = plynulý presun o celý panel, s efektom príchodu obsahu.
   Na dotykových zariadeniach to robí prehliadač sám (povinné prichytenie panelov v CSS). */
(() => {
  const root = document.documentElement;
  const panels = [...document.querySelectorAll("[data-panel]")];
  if (panels.length < 2) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // efekt: obsah panelu príde zdola, pozadie sa jemne oddiali
  if (!reduce && "IntersectionObserver" in window) {
    root.classList.add("js-fx");
    panels.forEach(p => p.querySelectorAll(".sx-tabs,.sx-cards,.about-copy,.p-head,.rail,.rail-hint,.lead-card,.duo-faq,.cta-in").forEach((el, i) => { el.classList.add("fx"); el.style.setProperty("--fx", i); }));
    const io = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle("is-in", e.isIntersecting)), { threshold: 0.35 });
    panels.forEach(p => io.observe(p));
  }

  const fine = matchMedia("(hover:hover) and (pointer:fine)");   // myš/touchpad pri každej šírke okna; dotyk necháva CSS prichytenie
  if (reduce || !fine.matches) return;
  root.classList.add("js-slides");            // vypne CSS prichytenie a plynulé rolovanie, riadi to skript

  // zastávky: panely + na úzkej šírke aj polovice dvojpanelu (každá má výšku obrazovky)
  const halves = [...document.querySelectorAll(".panel-duo .duo > *")];
  // poloha v rozložení stránky bez posunov z animácií (efekt príchodu obsahu element dočasne posúva)
  const topOf = el => { let y = 0; for (let n = el; n; n = n.offsetParent) y += n.offsetTop; return Math.round(y); };
  let lastStop = 0;
  const stops = () => {
    const els = panels.concat(halves.filter(h => getComputedStyle(h).scrollSnapAlign.includes("start")));
    const t = [...new Set(els.map(topOf))].sort((a, b) => a - b);
    lastStop = t[t.length - 1];
    const max = root.scrollHeight - innerHeight; if (max > lastStop + 4) t.push(max); return t;
  };
  const nearest = () => { const t = stops(); let k = 0; t.forEach((y, i) => { if (Math.abs(y - scrollY) < Math.abs(t[k] - scrollY)) k = i; }); return k; };
  const ease = x => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  let busy = false, lastWheel = 0, wait = false;
  const go = i => {
    const t = stops(); i = Math.max(0, Math.min(t.length - 1, i));
    const from = scrollY, to = t[i], dist = to - from;
    if (Math.abs(dist) < 2) return;
    busy = true;
    const dur = Math.min(1100, 700 + Math.abs(dist) * 0.25), t0 = performance.now();
    const step = now => {
      const k = Math.min(1, (now - t0) / dur);
      scrollTo(0, from + dist * ease(k));
      if (k < 1) requestAnimationFrame(step); else { busy = false; wait = true; rest = to; }
    };
    requestAnimationFrame(step);
  };
  window.laylaGo = go;

  // dotiahnutie: ak sa stránka posunie inak než kolieskom (posuvník, touchpad, klávesnica), po zastavení dôjde na celý panel
  let rest = scrollY, idle = 0;
  addEventListener("scroll", () => {
    clearTimeout(idle);
    if (busy) return;
    idle = setTimeout(() => {
      if (busy || document.querySelector("dialog[open]")) return;
      const t = stops();
      if (scrollY > lastStop + 4) { rest = scrollY; return; }           // pätička sa posúva voľne
      let base = 0; t.forEach((y, i) => { if (Math.abs(y - rest) < Math.abs(t[base] - rest)) base = i; });
      const moved = scrollY - t[base];
      if (Math.abs(moved) < 2) { rest = scrollY; return; }
      const far = Math.abs(moved) > innerHeight * 0.1;
      const steps = Math.max(1, Math.round(Math.abs(moved) / innerHeight));
      go(far ? base + Math.sign(moved) * steps : base);
    }, 170);
  }, { passive: true });

  addEventListener("wheel", e => {
    if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    if (document.querySelector("dialog[open]") || root.classList.contains("menu-open")) return;
    e.preventDefault();
    const now = e.timeStamp || performance.now(), gap = now - lastWheel; lastWheel = now;   // čas vzniku udalosti, nie spracovania
    if (busy) return;
    if (wait) { if (gap < 140) return; wait = false; }      // dobiehajúce koliesko/touchpad nespustí ďalší presun
    if (Math.abs(e.deltaY) < 4) return;
    go(nearest() + (e.deltaY > 0 ? 1 : -1));
  }, { passive: false });

  addEventListener("keydown", e => {
    if (e.target.closest("input,textarea,select,dialog") || e.altKey || e.ctrlKey || e.metaKey) return;
    const d = { ArrowDown: 1, PageDown: 1, " ": 1, ArrowUp: -1, PageUp: -1 }[e.key];
    if (!d || busy) return;
    e.preventDefault(); go(nearest() + d);
  });

  document.addEventListener("click", e => {
    const b = e.target.closest(".dots button, .rhome-scroll");
    if (!b) return;
    e.preventDefault(); e.stopImmediatePropagation();
    if (b.matches(".rhome-scroll")) return go(1);
    const el = panels[[...b.parentNode.children].indexOf(b)];
    if (el) go(stops().indexOf(topOf(el)));
  }, true);
})();

/* Cenník: zvýraznenie kategórie podľa toho, ktorá časť je práve na obrazovke */
(() => {
  const tabs = [...document.querySelectorAll(".pc-tabs a")];
  if (!tabs.length || !("IntersectionObserver" in window)) return;
  const set = id => tabs.forEach(a => a.getAttribute("href") === "#" + id ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current"));
  tabs.forEach(a => a.addEventListener("click", () => set(a.getAttribute("href").slice(1))));
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) set(e.target.id); }), { rootMargin: "-30% 0px -55% 0px" });
  document.querySelectorAll(".pc-sec").forEach(s => io.observe(s));
})();

/* Prepínač jazyka: po kliknutí mimo sa zavrie */
document.addEventListener("click", e => {
  document.querySelectorAll("details.lang[open]").forEach(d => { if (!d.contains(e.target)) d.open = false; });
});
