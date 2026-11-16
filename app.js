/* Сайт «Масла Опт». Без библиотек — страница лёгкая. */
(function () {
  'use strict';

  /* ===== Настройки: меняются здесь ===== */
  // Номер собран из частей, чтобы его не нашли роботы-сборщики в коде страницы.
  var PHONE = ['992', '00', '110', '77', '83'];
  // Реквизиты показываются в подвале. Российский номер и почта из реквизитов на сайт не выводятся.
  // Тексты на языке страницы приходят из window.I18N (их задаёт сборка build.py из src/lang/*.json).
  var T = window.I18N || {};
  var REQUISITES = {
    name: T.name || 'TICHORATI IMRON LLC',
    tin: '020045392',
    inn: '9909777753',
    addr: T.addr || ''
  };

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ===== Год и реквизиты ===== */
  $('#yr').textContent = new Date().getFullYear();
  Object.keys(REQUISITES).forEach(function (k) {
    var el = $('[data-req="' + k + '"]');
    if (el && REQUISITES[k]) el.textContent = REQUISITES[k];
  });

  /* ===== Почта в подвале ===== */
  var ml = $('#mail-link');
  if (ml && T.mail) { ml.textContent = T.mail; ml.href = 'mailto:' + T.mail; ml.hidden = false; }

  /* ===== Телефон: показывается только по клику ===== */
  var dlg = $('#phone');
  function digits() { return PHONE.join(''); }
  function pretty() { return '+' + PHONE[0] + ' ' + PHONE[1] + ' ' + PHONE[2] + ' ' + PHONE[3] + ' ' + PHONE[4]; }
  function openPhone() {
    var d = digits();
    $('#ph-num').textContent = pretty();
    $('#ph-num').href = 'tel:+' + d;
    $('#ph-call').href = 'tel:+' + d;
    $('#ph-wa').href = 'https://wa.me/' + d;
    $('#ph-tg').href = 'https://t.me/+' + d;
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
  }
  $$('[data-phone]').forEach(function (b) { b.addEventListener('click', openPhone); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });

  /* ===== Меню языков: закрывается по клику вне и по Esc ===== */
  var langBox = $('.lang');
  if (langBox) {
    document.addEventListener('click', function (e) { if (!langBox.contains(e.target)) langBox.open = false; });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') langBox.open = false; });
  }

  /* ===== Появление блоков при прокрутке ===== */
  var rv = $$('.rv');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    rv.forEach(function (el, i) {
      el.style.transitionDelay = (i % 4) * 70 + 'ms';
      io.observe(el);
    });
  } else {
    rv.forEach(function (el) { el.classList.add('in'); });
  }

  /* ===== Кольцо брендов: крутится само и ускоряется от прокрутки ===== */
  var ring = $('#ring'), stage = $('#stage');
  if (ring && stage) {
    var faces = $$('.face', ring);
    var rot = 0, last = 0, visible = false, running = false, lastY = window.scrollY, boost = 0;

    function paint() {
      ring.style.transform = 'rotateX(-4deg) rotateY(' + (-rot) + 'deg)';
      for (var i = 0; i < faces.length; i++) {
        var a = (i * 90 - rot) * Math.PI / 180;
        var depth = Math.cos(a);                // 1 — спереди, -1 — сзади
        faces[i].style.opacity = (.18 + .82 * Math.max(0, (depth + .25) / 1.25)).toFixed(3);
      }
    }
    function tick(t) {
      if (!visible || document.hidden) { running = false; return; }
      var dt = Math.min(48, t - last); last = t;
      var y = window.scrollY;
      boost = boost * .92 + (y - lastY) * .12;  // скролл подкручивает кольцо
      lastY = y;
      rot += dt * 0.012 + boost * .35;
      paint();
      requestAnimationFrame(tick);
    }
    function start() {
      if (running || reduce) return;
      running = true; last = performance.now(); requestAnimationFrame(tick);
    }
    paint();
    if (reduce) {
      // без движения: ставим кольцо боком и показываем всё статично
      faces.forEach(function (f) { f.style.opacity = 1; });
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        visible = es[0].isIntersecting;
        if (visible) start();
      }, { threshold: 0 }).observe(stage);
    } else { visible = true; start(); }
    document.addEventListener('visibilitychange', function () { if (!document.hidden && visible) start(); });
  }

  /* ===== Форма заявки ===== */
  var form = $('#form'), status = $('#status'), tField = $('#f-t');
  var opened = Date.now();
  tField.value = String(opened);

  function setStatus(html, cls) { status.className = 'form-status ' + (cls || ''); status.innerHTML = html; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function waText(fd) {
    var interest = fd.getAll('interest[]').join(', ') || '—';
    return T.wa_title + '\n' + T.wa_name + ': ' + fd.get('name') + '\n' + T.wa_phone + ': ' + fd.get('phone') +
      '\n' + T.wa_interest + ': ' + interest + '\n' + T.wa_comment + ': ' + (fd.get('message') || '—');
  }

  form.addEventListener('input', function (e) {
    if (e.target.getAttribute && e.target.getAttribute('aria-invalid') === 'true') e.target.setAttribute('aria-invalid', 'false');
    if (status.classList.contains('err')) setStatus('');
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = form.elements.name, phone = form.elements.phone, ok = true;
    [name, phone].forEach(function (f) {
      var bad = !f.value.trim() || (f === phone && f.value.replace(/\D/g, '').length < 7);
      f.setAttribute('aria-invalid', bad ? 'true' : 'false');
      if (bad && ok) { f.focus(); ok = false; }
    });
    if (!ok) { setStatus(esc(T.invalid), 'err'); return; }

    // Демо на github.io: почты там нет, честно говорим об этом
    if (/(^|\.)github\.io$/.test(location.hostname)) { setStatus(esc(T.demo), 'ok'); return; }

    var fd = new FormData(form);
    var btn = $('.btn-submit', form);
    btn.disabled = true; setStatus(esc(T.sending));

    fetch(form.action, { method: 'POST', body: fd, headers: { 'Accept': 'application/json' } })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok && j.ok, j: j }; }); })
      .then(function (res) {
        if (!res.ok) throw new Error('send');
        form.reset(); tField.value = String(Date.now());
        setStatus(esc(T.ok), 'ok');
      })
      .catch(function () {
        var wa = 'https://wa.me/' + digits() + '?text=' + encodeURIComponent(waText(fd));
        setStatus(esc(T.fail_pre) + ' <a href="' + esc(wa) + '" target="_blank" rel="noopener">' + esc(T.fail_link) + '</a>', 'err');
      })
      .then(function () { btn.disabled = false; });
  });
})();
