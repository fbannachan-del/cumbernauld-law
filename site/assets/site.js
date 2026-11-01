/* The Cumbernauld Law Practice - site behaviour
   Vanilla JS, no dependencies. Everything degrades: content is in the HTML.
*/
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ---------- Header: transparent over the hero, solid afterwards ---------- */
  var header = $('.site-header');
  var hero = $('.hero');
  function updateHeader() {
    if (!header || header.classList.contains('is-static')) return;
    var threshold = hero ? hero.offsetHeight - header.offsetHeight - 8 : 10;
    header.classList.toggle('is-solid', window.scrollY > threshold);
  }
  if (header && !header.classList.contains('is-static')) {
    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });
    window.addEventListener('resize', updateHeader);
  }

  /* ---------- Mobile menu ---------- */
  var menuToggle = $('.menu-toggle');
  var mobileMenu = $('.mobile-menu');
  function setMenu(open) {
    if (!menuToggle || !mobileMenu) return;
    menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    mobileMenu.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
    $$('main, footer, .call-bar').forEach(function (el) { if (open) el.setAttribute('inert', ''); else el.removeAttribute('inert'); });
    if (open) { header.classList.add('is-solid'); var first = $('a', mobileMenu); if (first) first.focus(); }
    else { updateHeader(); menuToggle.focus(); }
  }
  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', function () {
      setMenu(menuToggle.getAttribute('aria-expanded') !== 'true');
    });
    $$('a', mobileMenu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileMenu.classList.contains('is-open')) setMenu(false);
    });
    window.addEventListener('resize', function () { if (window.innerWidth > 900 && mobileMenu.classList.contains('is-open')) setMenu(false); });
  }

  /* ---------- Scroll-spy with a sliding indicator ---------- */
  var navLinks = $$('.site-nav__links a[href^="#"]');
  var indicator = $('.site-nav__indicator');
  var navList = $('.site-nav__links');
  function moveIndicator(link) {
    if (!indicator || !navList) return;
    if (!link) { indicator.classList.remove('is-visible'); return; }
    var l = link.getBoundingClientRect(), n = navList.getBoundingClientRect();
    indicator.style.width = l.width + 'px';
    indicator.style.transform = 'translateX(' + (l.left - n.left) + 'px)';
    indicator.classList.add('is-visible');
  }
  if (navLinks.length && 'IntersectionObserver' in window) {
    var sections = navLinks.map(function (a) { return $(a.getAttribute('href')); }).filter(Boolean);
    var current = null;
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) current = en.target;
      });
      // pick the section nearest the top of the viewport among intersecting ones
      var best = null, bestTop = Infinity;
      sections.forEach(function (s) {
        var r = s.getBoundingClientRect();
        if (r.top <= window.innerHeight * 0.45 && r.bottom > window.innerHeight * 0.25) {
          if (Math.abs(r.top) < bestTop) { bestTop = Math.abs(r.top); best = s; }
        }
      });
      navLinks.forEach(function (a) {
        var on = best && a.getAttribute('href') === '#' + best.id;
        if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      });
      moveIndicator(best ? navLinks.filter(function (a) { return a.getAttribute('href') === '#' + best.id; })[0] : null);
    }, { rootMargin: '-20% 0px -40% 0px', threshold: [0, 0.1, 0.5, 1] });
    sections.forEach(function (s) { spy.observe(s); });
    window.addEventListener('resize', function () {
      var on = $('.site-nav__links a[aria-current="true"]');
      moveIndicator(on);
    });
    navLinks.forEach(function (a) {
      a.addEventListener('mouseenter', function () { moveIndicator(a); });
      a.addEventListener('mouseleave', function () { moveIndicator($('.site-nav__links a[aria-current="true"]')); });
    });
  }

  /* ---------- Smooth anchor focus: move keyboard focus to the target ---------- */
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function () {
      var t = $(a.getAttribute('href'));
      if (!t) return;
      t.setAttribute('tabindex', '-1');
      setTimeout(function () { t.focus({ preventScroll: true }); }, reduceMotion.matches ? 0 : 450);
    });
  });

  /* ---------- Hero tile field ----------
     A canvas grid of plum, magenta and silver tiles, built from the firm's 2x2 mark.
     Tiles warm toward orchid and white near the pointer and ring outward on tap. */
  var canvas = $('.hero__field');
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext('2d');
    var cells = [], cols = 0, rows = 0, size = 64, gap = 5, dpr = 1, W = 0, H = 0;
    var pointer = { x: -9999, y: -9999, active: false };
    var ripples = [];
    var running = false, last = 0, raf = 0;
    var visible = true;
    var hovered = false;

    var palette = {
      plum:    { base: [105, 38, 90],  hot: [199, 123, 201] },
      plum2:   { base: [125, 47, 108], hot: [228, 189, 229] },
      magenta: { base: [146, 59, 127], hot: [228, 189, 229] },
      silver:  { base: [203, 199, 202], hot: [246, 241, 246] },
      silver2: { base: [215, 213, 215], hot: [250, 246, 250] }
    };
    var types = ['plum', 'plum', 'plum', 'plum2', 'plum2', 'magenta', 'magenta', 'silver', 'silver2'];

    function seeded(n) { var x = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); }

    function build() {
      var rect = hero.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.round(rect.width); H = Math.round(rect.height);
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      size = W < 700 ? 44 : (W < 1100 ? 56 : 64);
      gap = W < 700 ? 4 : 5;
      cols = Math.ceil(W / (size + gap)) + 1;
      rows = Math.ceil(H / (size + gap)) + 1;
      cells = [];
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          var i = r * cols + c;
          var t = types[Math.floor(seeded(i * 7 + 1) * types.length)];
          // echo the mark: a 2x2 checker reads through faintly on the diagonal
          if (((r + c) % 2 === 0) && seeded(i * 3 + 5) < 0.18) t = 'silver';
          cells.push({ r: r, c: c, x: c * (size + gap), y: r * (size + gap), t: t, heat: 0, phase: seeded(i * 11 + 3) * Math.PI * 2 });
        }
      }
      drawFrame(0, 0);
    }

    function lerp(a, b, k) { return a + (b - a) * k; }
    function rgb(col) { return 'rgb(' + (col[0] | 0) + ',' + (col[1] | 0) + ',' + (col[2] | 0) + ')'; }

    function drawFrame(t, dt) {
      ctx.clearRect(0, 0, W, H);
      var idle = reduceMotion.matches ? 0 : 1;
      var px = pointer.x, py = pointer.y, pr = size * 3.8;
      var decay = Math.pow(0.1, dt / 900);
      for (var i = 0; i < cells.length; i++) {
        var cell = cells[i];
        var cx = cell.x + size / 2, cy = cell.y + size / 2;
        // pointer warmth
        if (pointer.active) {
          var dx = cx - px, dy = cy - py, d = Math.sqrt(dx * dx + dy * dy);
          if (d < pr) { var k = 1 - d / pr; cell.heat = Math.min(1, cell.heat + k * k * 0.3); }
        }
        // ripples
        for (var j = 0; j < ripples.length; j++) {
          var rp = ripples[j];
          var age = (t - rp.t0) / 1000;
          var radius = age * 520;
          var ddx = cx - rp.x, ddy = cy - rp.y, dd = Math.sqrt(ddx * ddx + ddy * ddy);
          var band = Math.abs(dd - radius);
          if (band < size * 1.1) cell.heat = Math.min(1, cell.heat + (1 - band / (size * 1.1)) * 0.35 * Math.max(0, 1 - age / 2.2));
        }
        cell.heat *= decay;
        var wave = idle * 0.10 * (0.5 + 0.5 * Math.sin(t / 1400 + (cell.c * 0.55 + cell.r * 0.35) + cell.phase * 0.3));
        var pal = palette[cell.t];
        var k2 = Math.min(1, cell.heat + wave);
        var col = [lerp(pal.base[0], pal.hot[0], k2), lerp(pal.base[1], pal.hot[1], k2), lerp(pal.base[2], pal.hot[2], k2)];
        var grow = cell.heat * size * 0.16;
        var x = cell.x - grow / 2, y = cell.y - grow / 2, s = size + grow;
        ctx.fillStyle = rgb(col);
        ctx.fillRect(x, y, s, s);
        // diagonal sheen, like the tiles in the mark
        ctx.fillStyle = 'rgba(255,255,255,' + (0.05 + cell.heat * 0.10).toFixed(3) + ')';
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + s, y); ctx.lineTo(x, y + s); ctx.closePath(); ctx.fill();
      }
      ripples = ripples.filter(function (rp) { return t - rp.t0 < 2400; });
    }

    function loop(now) {
      if (!running) return;
      var dt = last ? Math.min(50, now - last) : 16;
      last = now;
      drawFrame(now, dt);
      // keep animating while something is warm, a ripple is live, the pointer is over, or idle motion is on
      var warm = hovered || ripples.length || !reduceMotion.matches;
      if (!warm) { for (var i = 0; i < cells.length; i++) if (cells[i].heat > 0.01) { warm = true; break; } }
      if (warm && visible) raf = requestAnimationFrame(loop); else { running = false; last = 0; }
    }
    function start() { if (!running && visible) { running = true; raf = requestAnimationFrame(loop); } }

    hero.addEventListener('pointermove', function (e) {
      var r = canvas.getBoundingClientRect();
      pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top; pointer.active = true; hovered = true; start();
    });
    hero.addEventListener('pointerleave', function () { pointer.active = false; hovered = false; start(); });
    hero.addEventListener('pointerdown', function (e) {
      if (e.target.closest('a, button, input')) return;
      var r = canvas.getBoundingClientRect();
      if (ripples.length < 4) ripples.push({ x: e.clientX - r.left, y: e.clientY - r.top, t0: performance.now() });
      start();
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) start(); else { running = false; cancelAnimationFrame(raf); } }).observe(hero);
    }
    var ro;
    if ('ResizeObserver' in window) { ro = new ResizeObserver(function () { build(); start(); }); ro.observe(hero); }
    else window.addEventListener('resize', function () { build(); start(); });
    build();
    // opening moment: one ripple from the headline
    setTimeout(function () {
      if (reduceMotion.matches) return;
      var r = canvas.getBoundingClientRect();
      ripples.push({ x: r.width * 0.28, y: r.height * 0.5, t0: performance.now() });
      start();
    }, 350);
    start();
  }

  /* ---------- Expanding panels (services and people) ----------
     The panel is moved into the grid directly after the row that was tapped,
     so the detail opens next to the thing you chose rather than far below it. */
  function setupPanelGroup(groupSel) {
    var group = $(groupSel);
    if (!group) return;
    var panel = $('.panel', group);
    var home = panel.parentNode;
    var homeNext = panel.nextSibling;
    var inner = $('.panel__card', group);
    var triggers = $$('[data-panel-source]', group);
    var openId = null;
    var parkTimer = 0;
    function park() { if (panel.parentNode !== home) home.insertBefore(panel, homeNext); }
    function placeAfterRow(btn) {
      var grid = btn.parentNode;
      var siblings = $$('[data-panel-source]', grid);
      var top = btn.offsetTop, lastInRow = btn;
      siblings.forEach(function (el) { if (el.offsetTop === top) lastInRow = el; });
      if (lastInRow.nextSibling !== panel) grid.insertBefore(panel, lastInRow.nextSibling);
    }
    function close() {
      triggers.forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
      panel.classList.remove('is-open');
      openId = null;
      clearTimeout(parkTimer);
      parkTimer = setTimeout(park, reduceMotion.matches ? 0 : 520);
    }
    function open(btn) {
      var src = $(btn.getAttribute('data-panel-source'));
      if (!src) return;
      if (openId === btn.id) { close(); return; }
      clearTimeout(parkTimer);
      var wasOpen = panel.classList.contains('is-open');
      triggers.forEach(function (b) { b.setAttribute('aria-expanded', b === btn ? 'true' : 'false'); });
      inner.innerHTML = src.innerHTML;
      var closeBtn = $('.panel__close', inner);
      if (closeBtn) closeBtn.addEventListener('click', function () { close(); btn.focus(); });
      if (wasOpen) { panel.classList.remove('is-open'); }
      placeAfterRow(btn);
      // force a layout so the open transition runs from the new position
      void panel.offsetHeight;
      panel.classList.add('is-open');
      openId = btn.id;
      var heading = $('h3', inner);
      if (heading) heading.setAttribute('tabindex', '-1');
      setTimeout(function () {
        var r = panel.getBoundingClientRect();
        if (r.top > window.innerHeight * 0.7 || r.top < 90) {
          var y = window.scrollY + r.top - 100;
          window.scrollTo({ top: y, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
        }
        if (heading) heading.focus({ preventScroll: true });
      }, 60);
    }
    triggers.forEach(function (b) {
      b.setAttribute('aria-expanded', 'false');
      b.addEventListener('click', function () { open(b); });
    });
    group.addEventListener('keydown', function (e) { if (e.key === 'Escape' && openId) { var b = document.getElementById(openId); close(); if (b) b.focus(); } });
    window.addEventListener('resize', function () { if (openId) placeAfterRow(document.getElementById(openId)); });
    group._closePanel = close;
  }
  setupPanelGroup('#services');
  setupPanelGroup('#people');

  /* ---------- People tabs ---------- */
  var tabs = $$('.tab');
  if (tabs.length) {
    function selectTab(tab) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.setAttribute('tabindex', on ? '0' : '-1');
        var p = document.getElementById(t.getAttribute('aria-controls'));
        if (p) p.hidden = !on;
      });
      var people = $('#people');
      if (people && people._closePanel) people._closePanel();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { selectTab(t); });
      t.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
        if (e.key === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
        if (e.key === 'Home') n = tabs[0];
        if (e.key === 'End') n = tabs[tabs.length - 1];
        if (n) { e.preventDefault(); selectTab(n); n.focus(); }
      });
    });
  }

  /* ---------- Map: loaded only when asked, so no third-party cookies by default ---------- */
  var mapBtn = $('[data-map-load]');
  if (mapBtn) {
    mapBtn.addEventListener('click', function () {
      var map = mapBtn.closest('.map');
      var q = encodeURIComponent(mapBtn.getAttribute('data-map-query'));
      var frame = document.createElement('iframe');
      frame.src = 'https://www.google.com/maps?q=' + q + '&z=16&output=embed';
      frame.title = 'Map showing 30 Ettrick Walk, Cumbernauld';
      frame.loading = 'lazy';
      frame.referrerPolicy = 'no-referrer-when-downgrade';
      var ph = $('.map__placeholder', map);
      map.insertBefore(frame, ph);
      ph.remove();
    });
  }

  /* ---------- Enquiry form ---------- */
  var form = $('#enquiry-form');
  if (form) {
    var status = $('.form__status', form);
    var message = $('#message', form);
    var counter = $('.field__count', form);
    function countWords() {
      var n = wordCount(message.value);
      counter.textContent = n + ' of 100 words';
      counter.classList.toggle('is-over', n > 100);
    }
    if (message && counter) { message.addEventListener('input', countWords); countWords(); }

    function showStatus(kind, html) {
      status.className = 'form__status ' + (kind === 'ok' ? 'is-ok' : 'is-warn');
      status.innerHTML = html;
      status.focus();
    }
    function wordCount(v) { return v.trim() ? v.trim().split(/\s+/).length : 0; }
    function validate() {
      var ok = true;
      $$('.field', form).forEach(function (f) {
        var input = $('input, textarea', f);
        var err = $('.field__error', f);
        if (!input || !err) return;
        var bad = input.required && !input.value.trim();
        var msg = err.getAttribute('data-required') || err.textContent;
        if (!bad && input.type === 'email' && input.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) bad = true;
        if (!bad && input.id === 'message' && wordCount(input.value) > 100) { bad = true; msg = 'Please keep your message to 100 words. You can tell us more when we speak.'; }
        err.textContent = msg;
        f.classList.toggle('is-invalid', bad);
        input.setAttribute('aria-invalid', bad ? 'true' : 'false');
        var desc = (input.getAttribute('data-describedby') || '').split(' ').filter(Boolean);
        if (bad) desc.unshift(err.id);
        if (desc.length) input.setAttribute('aria-describedby', desc.join(' ')); else input.removeAttribute('aria-describedby');
        if (bad && ok) { input.focus(); ok = false; }
      });
      return ok;
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate()) return;
      var endpoint = form.getAttribute('data-endpoint') || '';
      var button = $('button[type="submit"]', form);
      if (!endpoint) {
        showStatus('warn', '<p><strong>Online enquiries are not switched on in this preview.</strong></p><p>Please call <a href="tel:+441236731911">01236 731911</a> during office hours and we will be glad to help.</p>');
        return;
      }
      button.disabled = true; button.textContent = 'Sending';
      var data = new FormData(form);
      fetch(endpoint, { method: 'POST', body: data, headers: { 'Accept': 'application/json' } })
        .then(function (r) { if (!r.ok) throw new Error('bad'); form.reset(); countWords();
          showStatus('ok', '<p><strong>Thank you. Your enquiry has been sent.</strong></p><p>We will be in touch during office hours.</p>'); })
        .catch(function () {
          showStatus('warn', '<p><strong>Your message could not be sent just now.</strong></p><p>Please call <a href="tel:+441236731911">01236 731911</a> or try again shortly.</p>');
        })
        .finally(function () { button.disabled = false; button.textContent = 'Send enquiry'; });
    });
  }

  /* ---------- Mobile call bar: shows once the hero's own buttons have scrolled away ---------- */
  var callBar = $('.call-bar');
  if (callBar && hero) {
    var contact = $('#contact');
    function updateCallBar() {
      var pastHero = window.scrollY > hero.offsetHeight - 120;
      var inContact = contact && contact.getBoundingClientRect().top < window.innerHeight * 0.6;
      callBar.classList.toggle('is-visible', pastHero && !inContact);
    }
    window.addEventListener('scroll', updateCallBar, { passive: true });
    updateCallBar();
  }
})();
