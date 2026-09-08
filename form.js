(function () {
  'use strict';

  var FORM_ENDPOINT =
    'https://script.google.com/macros/s/AKfycbwppaumxbZ9qEaNbZPZgmY96-EaXyJVpGn29BNZurPSMoWqzD3Ey8evs_vj2fnUDyw6Rw/exec';
  var PAGE_NAME = 'ОСНОВА с Ириной Шик — osnovashik.ru';
  var ATTR_KEY = 'osnovashik_attribution';
  var ATTR_FIELDS = [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_content',
    'utm_term',
    'yclid',
    'gclid'
  ];
  function readStoredAttribution() {
    try {
      var raw = sessionStorage.getItem(ATTR_KEY);
      if (!raw) return {};
      var parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (e) {
      return {};
    }
  }

  function captureAttribution() {
    var stored = readStoredAttribution();
    var params = new URLSearchParams(window.location.search);
    var next = {};
    var i;
    var key;
    var value;

    for (i = 0; i < ATTR_FIELDS.length; i++) {
      key = ATTR_FIELDS[i];
      next[key] = stored[key] || '';
      value = params.get(key);
      if (value) next[key] = value;
    }

    try {
      sessionStorage.setItem(ATTR_KEY, JSON.stringify(next));
    } catch (e) {}

    return next;
  }

  function fmtPhone(raw, prev) {
    var d = (raw || '').replace(/\D/g, '');
    if (d.indexOf('8') === 0) d = '7' + d.slice(1);
    else if (d.indexOf('9') === 0) d = '7' + d;
    else if (d && d[0] !== '7') d = '7' + d;
    d = d.slice(0, 11);
    if (prev != null && (raw || '').length < prev.length) {
      var pd = prev.replace(/\D/g, '');
      if (pd === d) d = d.slice(0, -1);
    }
    var r = d.slice(1);
    if (r.length === 0) return '';
    var out = '+7 (' + r.slice(0, 3);
    if (r.length >= 3) out += ')';
    if (r.length > 3) out += ' ' + r.slice(3, 6);
    if (r.length > 6) out += '-' + r.slice(6, 8);
    if (r.length > 8) out += '-' + r.slice(8, 10);
    return out;
  }

  function validPhone(v) {
    var d = (v || '').replace(/\D/g, '');
    return d.length === 11 && d[0] === '7';
  }

  function validAge(v) {
    if (!v) return false;
    var n = parseInt(v, 10);
    return !isNaN(n) && n >= 5 && n <= 14;
  }

  function leadKey(name, phone, age) {
    return [name, phone, age].join('|');
  }

  function showFieldError(field, message) {
    var wrap = document.querySelector('[data-field="' + field + '"]');
    var err = document.querySelector('[data-error-for="' + field + '"]');
    if (err) {
      err.textContent = message || '';
      if (message) err.removeAttribute('hidden');
      else err.setAttribute('hidden', '');
    }
    if (wrap) {
      var control = wrap.querySelector('input, select, textarea');
      if (control) control.setAttribute('aria-invalid', message ? 'true' : 'false');
    }
  }

  function clearFieldErrors() {
    showFieldError('name', '');
    showFieldError('phone', '');
    showFieldError('age', '');
  }

  var attribution = captureAttribution();

  var form = document.getElementById('lead-form');
  var nameEl = document.getElementById('f_name');
  var phoneEl = document.getElementById('f_phone');
  var ageEl = document.getElementById('f_age');
  var taskEl = document.getElementById('f_task');
  var commentEl = document.getElementById('f_comment');
  var websiteEl = document.getElementById('f_website');
  var btn = document.getElementById('f_submit');
  var status = document.getElementById('form-status');
  var prevPhone = '';
  var busy = false;
  var lastSentKey = '';
  var formStarted = false;

  function setStatus(text, kind) {
    if (!status) return;
    status.textContent = text || '';
    status.className = 'form-status' + (kind ? ' ' + kind : '');
  }

  function goal(name) {
    if (typeof ym === 'function') ym(110489022, 'reachGoal', name);
  }

  if (form) {
    form.addEventListener(
      'focusin',
      function () {
        if (formStarted) return;
        formStarted = true;
        goal('lead_form_start');
      },
      true
    );
  }

  if (phoneEl) {
    phoneEl.addEventListener('input', function () {
      var v = fmtPhone(phoneEl.value, prevPhone);
      phoneEl.value = v;
      prevPhone = v;
      showFieldError('phone', '');
    });
  }

  if (nameEl) {
    nameEl.addEventListener('input', function () {
      showFieldError('name', '');
    });
  }

  if (ageEl) {
    ageEl.addEventListener('change', function () {
      showFieldError('age', '');
    });
  }

  if (!form || !btn) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (busy || btn.disabled) return;

    setStatus('', '');
    clearFieldErrors();

    var name = ((nameEl && nameEl.value) || '').trim();
    var phone = ((phoneEl && phoneEl.value) || '').trim();
    var age = ((ageEl && ageEl.value) || '').trim();
    var task = ((taskEl && taskEl.value) || '').trim();
    var comment = ((commentEl && commentEl.value) || '').trim();
    var website = ((websiteEl && websiteEl.value) || '').trim();
    var extra = [task, comment].filter(Boolean).join(' — ');
    var key = leadKey(name, phone, age);

    if (!name) {
      showFieldError('name', 'Пожалуйста, укажите имя.');
      setStatus('Пожалуйста, укажите имя.', 'err');
      if (nameEl) nameEl.focus();
      return;
    }
    if (!validPhone(phone)) {
      showFieldError('phone', 'Введите корректный российский номер: +7 и 10 цифр.');
      setStatus('Введите корректный российский номер: +7 и 10 цифр.', 'err');
      if (phoneEl) phoneEl.focus();
      return;
    }
    if (!validAge(age)) {
      showFieldError('age', 'Выберите возраст ребёнка — от 5 до 14 лет.');
      setStatus('Выберите возраст ребёнка — от 5 до 14 лет.', 'err');
      if (ageEl) ageEl.focus();
      return;
    }
    if (key && key === lastSentKey) {
      setStatus('Заявка уже отправлена. Мы свяжемся с вами в ближайшее время.', 'ok');
      return;
    }

    attribution = captureAttribution();

    var body = new URLSearchParams();
    body.append('name', name);
    body.append('phone', phone);
    body.append('age', age);
    body.append('comment', extra);
    body.append('page_name', extra ? PAGE_NAME + ' | ' + extra : PAGE_NAME);
    body.append('page_url', window.location.href);
    body.append('referrer', document.referrer || '');
    body.append('utm_source', attribution.utm_source || '');
    body.append('utm_medium', attribution.utm_medium || '');
    body.append('utm_campaign', attribution.utm_campaign || '');
    body.append('utm_content', attribution.utm_content || '');
    body.append('utm_term', attribution.utm_term || '');
    body.append('yclid', attribution.yclid || '');
    body.append('gclid', attribution.gclid || '');
    body.append('website', website);

    busy = true;
    var orig = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Отправляем…';
    setStatus('', '');

    function leadOk(data) {
      if (!data || data.error) return false;
      if (data.health === true) return false;
      if (data.message && data.saved !== true && data.duplicate !== true) return false;
      return data.ok === true || data.success === true;
    }

    function onLeadOk() {
      lastSentKey = key;
      goal('lead_form_submit');
      setStatus('Заявка отправлена. Мы свяжемся с вами по указанному номеру.', 'ok');
      if (nameEl) nameEl.value = '';
      if (phoneEl) phoneEl.value = '';
      if (ageEl) ageEl.selectedIndex = 0;
      if (taskEl) taskEl.selectedIndex = 0;
      if (commentEl) commentEl.value = '';
      if (websiteEl) websiteEl.value = '';
      prevPhone = '';
      clearFieldErrors();
    }

    var qs = body.toString();
    fetch(FORM_ENDPOINT + (FORM_ENDPOINT.indexOf('?') >= 0 ? '&' : '?') + qs, { method: 'GET' })
      .then(function (res) {
        return res.text().then(function (text) {
          var data = null;
          try { data = text ? JSON.parse(text) : null; } catch (err) { data = null; }
          if (res.ok && leadOk(data)) return data;
          throw new Error('bad_response');
        });
      })
      .catch(function () {
        return fetch(FORM_ENDPOINT, {
          method: 'POST',
          body: body
        }).then(function (res) {
          return res.text().then(function (text) {
            var data = null;
            try { data = text ? JSON.parse(text) : null; } catch (err) { data = null; }
            if (res.ok && leadOk(data)) return data;
            throw new Error('bad_response');
          });
        });
      })
      .then(onLeadOk)
      .catch(function (err) {
        console.error(err);
        setStatus('Не удалось отправить заявку. Попробуйте ещё раз.', 'err');
      })
      .then(function () {
        busy = false;
        btn.disabled = false;
        btn.textContent = orig;
      });
  });
})();
