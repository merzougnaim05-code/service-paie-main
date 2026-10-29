/* ═══════════ حيّز الاتصال بالمطوّر — بوابة التطبيقات المدرسية ═══════════
   رمز واحد يوضع في كل تطبيق: <script src="./contact-widget.js"></script>
   الإيميل لا يظهر في الواجهة إطلاقًا — الإرسال عبر وسيطين بالتدوير:
   1) SilentForms (المفضل: يخفي البريد حتى داخل الشفرة عبر مفتاح)
   2) FormSubmit (احتياط شفاف)
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ─── إعدادات عامة (عدل هنا فقط) ─── */
  var PHONE = '0673261442';
  var EMAIL = 'merzougnaim8@gmail.com';
  var SILENT_KEY = '';            // ضع هنا مفتاح SilentForms عند التفعيل (يجعله فارغًا يعطل محاولته)
  var FORMSUBMIT_ON = true;      // احتياط: عند فشل SilentForms تجري المحاولة عبر FormSubmit

  function transports(msg, meta) {
    var chain = [];
    if (SILENT_KEY) {
      chain.push(function () {
        return fetch('https://silentforms.com/api/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            accessKey: SILENT_KEY,
            message: msg,
            'التطبيق': meta.app,
            'العنوان': meta.url,
            'التاريخ': meta.when
          })
        }).then(function (r) {
          if (!r.ok) throw 0;
          return r.json();
        }).then(function (j) { if (j && j.success === false) throw 0; });
      });
    }
    if (FORMSUBMIT_ON) {
      chain.push(function () {
        return fetch('https://formsubmit.co/ajax/' + EMAIL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            _subject: 'إبلاغ من: ' + meta.app,
            _template: 'table',
            'الرسالة': msg,
            'التطبيق': meta.app,
            'العنوان': meta.url,
            'التاريخ': meta.when
          })
        }).then(function (r) { if (!r.ok) throw 0; });
      });
    }
    return chain;
  }

  /* ─── من هنا فصاعدًا: الواجهة (لا حاجة للتعديل) ─── */
  if (!document.querySelector('link[href*="fonts.googleapis"]')) {
    var f = document.createElement('link');
    f.rel = 'stylesheet';
    f.href = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap';
    document.head.appendChild(f);
  }

  var svg = function (p) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>';
  };
  var IC = {
    headset: '<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/><path d="M21 16v2a4 4 0 0 1-4 4h-5"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>',
    send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>'
  };

  var st = document.createElement('style');
  st.textContent =
    '.cw{font-family:"IBM Plex Sans Arabic","Cairo",Tahoma,sans-serif;direction:rtl;z-index:99999}' +

    '.cw-fab{position:fixed;bottom:18px;left:18px;width:62px;height:62px;border:0;border-radius:20px;cursor:pointer;pointer-events:auto;position:fixed;' +
    'background:linear-gradient(145deg,#10b981,#047857 55%,#065f46);border:2px solid rgba(251,191,36,.95);color:#fff;' +
    'display:grid;place-items:center;box-shadow:0 6px 0 #022c22,0 14px 28px rgba(2,44,34,.35),inset 0 2px 0 rgba(255,255,255,.3);' +
    'transition:transform .15s ease,box-shadow .15s ease}' +
    '.cw-fab svg{width:30px;height:30px;filter:drop-shadow(0 2px 2px rgba(2,44,34,.45))}' +
    '.cw-fab:hover{transform:translateY(-4px);box-shadow:0 10px 0 #022c22,0 20px 34px rgba(2,44,34,.4),inset 0 2px 0 rgba(255,255,255,.3)}' +
    '.cw-fab:active{transform:translateY(3px);box-shadow:0 2px 0 #022c22,0 6px 12px rgba(2,44,34,.35),inset 0 2px 0 rgba(255,255,255,.3)}' +
    '.cw-fab .cw-ring{position:absolute;inset:-6px;border-radius:24px;border:2px solid rgba(16,185,129,.55);animation:cw-ping 2.4s ease-out infinite;pointer-events:none}' +
    '@keyframes cw-ping{0%{transform:scale(.85);opacity:1}70%,100%{transform:scale(1.18);opacity:0}}' +
    '.cw-fab .cw-tip{position:absolute;left:110%;white-space:nowrap;top:50%;transform:translateY(-50%);' +
    'background:#065f46;color:#fff;font-size:.75rem;font-weight:700;padding:.3rem .7rem;border-radius:999px;' +
    'border:1px solid rgba(251,191,36,.7);opacity:0;transition:opacity .18s;pointer-events:none;box-shadow:0 4px 10px rgba(0,0,0,.2)}' +
    '.cw-fab:hover .cw-tip{opacity:1}' +

    '.cw-bezel{position:fixed;bottom:92px;left:14px;width:min(92vw,340px);border-radius:20px;padding:4px;' +
    'background:linear-gradient(135deg,#f59e0b,#059669 45%,#f59e0b);' +
    'box-shadow:0 24px 48px -12px rgba(2,44,34,.45),0 10px 0 rgba(2,44,34,.12);' +
    'transform-origin:bottom left;transform:scale(.8) translateY(14px);opacity:0;visibility:hidden;' +
    'transition:transform .22s cubic-bezier(.34,1.3,.5,1),opacity .18s,visibility .18s}' +
    '.cw-bezel.open{transform:scale(1) translateY(0);opacity:1;visibility:visible}' +
    '.cw-card{background:rgba(255,255,255,.98);border-radius:16px;overflow:hidden}' +

    '.cw-head{background:linear-gradient(90deg,#064e3b,#065f46,#134e4a);color:#fff;border-bottom:3px solid #f59e0b;' +
    'padding:.8rem .9rem;display:flex;align-items:center;gap:.65rem}' +
    '.cw-head .cw-ic{width:36px;height:36px;flex-shrink:0;border-radius:11px;background:rgba(251,191,36,.18);border:1px solid rgba(251,191,36,.4);' +
    'display:grid;place-items:center;color:#fbbf24;box-shadow:inset 0 2px 0 rgba(255,255,255,.15)}' +
    '.cw-head .cw-ic svg{width:19px;height:19px}' +
    '.cw-head .cw-t1{font-size:.92rem;font-weight:700;line-height:1.3}' +
    '.cw-head .cw-t2{font-size:.66rem;font-weight:500;color:#a7f3d0}' +
    '.cw-x{margin-inline-start:auto;background:rgba(255,255,255,.15);border:0;color:#fff;width:26px;height:26px;border-radius:50%;' +
    'cursor:pointer;font-size:12px;line-height:1;transition:background .15s}' +
    '.cw-x:hover{background:rgba(239,68,68,.55)}' +

    '.cw-body{padding:.85rem .9rem .95rem;display:flex;flex-direction:column;gap:.6rem}' +
    '.cw-phone{display:flex;align-items:center;gap:.6rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:.9rem;padding:.5rem .7rem;' +
    'box-shadow:inset 0 -2px 4px rgba(15,23,42,.05)}' +
    '.cw-phone .cw-pi{width:30px;height:30px;flex-shrink:0;border-radius:.6rem;background:linear-gradient(145deg,#fbbf24,#d97706);color:#020617;' +
    'display:grid;place-items:center;box-shadow:0 2px 0 #b45309,0 4px 8px rgba(245,158,11,.25)}' +
    '.cw-phone .cw-pi svg{width:15px;height:15px}' +
    '.cw-phone b{font-size:.98rem;letter-spacing:.04em;color:#065f46}' +
    '.cw-call{margin-inline-start:auto;text-decoration:none;font-size:.75rem;font-weight:700;color:#fff;' +
    'background:linear-gradient(145deg,#10b981,#059669);border-radius:999px;padding:.28rem .8rem;' +
    'box-shadow:0 3px 0 #047857;transition:transform .12s,box-shadow .12s}' +
    '.cw-call:active{transform:translateY(2px);box-shadow:0 1px 0 #047857}' +

    '.cw-ta{width:100%;min-height:88px;resize:vertical;border:1.5px solid #e2e8f0;border-radius:.9rem;padding:.6rem .75rem;' +
    'font:inherit;font-size:.85rem;color:#1e293b;background:#fff;outline:none;line-height:1.7;' +
    'transition:border .15s,box-shadow .15s}' +
    '.cw-ta:focus{border-color:#10b981;box-shadow:0 0 0 3px rgba(16,185,129,.18)}' +
    '.cw-ta.cw-err{border-color:#f87171;box-shadow:0 0 0 3px rgba(248,113,113,.18);animation:cw-shake .3s}' +
    '@keyframes cw-shake{25%{transform:translateX(5px)}75%{transform:translateX(-5px)}}' +
    '.cw-send{border:0;cursor:pointer;color:#020617;font:inherit;font-size:.88rem;font-weight:800;border-radius:.75rem;padding:.7rem;' +
    'display:flex;align-items:center;justify-content:center;gap:.5rem;width:100%;' +
    'background:linear-gradient(135deg,#fbbf24,#f59e0b);box-shadow:0 4px 0 #b45309,0 10px 18px rgba(245,158,11,.3),inset 0 2px 0 rgba(255,255,255,.4);' +
    'transition:transform .12s,box-shadow .12s,background .2s}' +
    '.cw-send:hover{filter:brightness(1.05)}' +
    '.cw-send:active{transform:translateY(3px);box-shadow:0 1px 0 #b45309}' +
    '.cw-send svg{width:17px;height:17px}' +
    '.cw-send.cw-ok{background:linear-gradient(135deg,#34d399,#059669);color:#fff;box-shadow:0 4px 0 #047857,inset 0 2px 0 rgba(255,255,255,.3)}' +
    '.cw-send:disabled{cursor:default;opacity:.85}' +
    '.cw-status{font-size:.75rem;text-align:center;min-height:1rem;line-height:1.7}' +
    '.cw-status.ok{color:#047857;font-weight:700}.cw-status.err{color:#dc2626;font-weight:600}';

  document.head.appendChild(st);

  var box = document.createElement('div');
  box.className = 'cw';
  box.innerHTML =
    '<button class="cw-fab" id="cwFab" title="فتح حيّز الاتصال بالمطوّر">' +
      '<span class="cw-ring"></span>' + svg(IC.headset) + '<span class="cw-tip">اتصل بالمطوّر</span>' +
    '</button>' +
    '<div class="cw-bezel" id="cwPanel">' +
      '<div class="cw-card">' +
        '<div class="cw-head">' +
          '<span class="cw-ic">' + svg(IC.headset) + '</span>' +
          '<span><span class="cw-t1">الدعم الفني</span><br><span class="cw-t2">الإبلاغ عن مشكلة — مباشرة إلى المطوّر</span></span>' +
          '<button class="cw-x" id="cwClose" title="إغلاق">✕</button>' +
        '</div>' +
        '<div class="cw-body">' +
          '<div class="cw-phone">' +
            '<span class="cw-pi">' + svg(IC.phone) + '</span>' +
            '<b dir="ltr">' + PHONE + '</b>' +
            '<a class="cw-call" href="tel:' + PHONE + '">اتصال</a>' +
          '</div>' +
          '<textarea class="cw-ta" id="cwTa" placeholder="اكتب مشكلتك هنا باختصار…"></textarea>' +
          '<button class="cw-send" id="cwSend">' + svg(IC.send) + '<span>إرسال</span></button>' +
          '<div class="cw-status" id="cwStatus"></div>' +
        '</div>' +
      '</div>' +
    '</div>';

  document.body.appendChild(box);

  var panel = box.querySelector('#cwPanel'), ta = box.querySelector('#cwTa'),
      send = box.querySelector('#cwSend'), status = box.querySelector('#cwStatus'),
      fab = box.querySelector('#cwFab');

  function toggle(open) { panel.classList.toggle('open', open); if (open) setTimeout(function () { ta.focus(); }, 230); }
  fab.addEventListener('click', function () { toggle(!panel.classList.contains('open')); });
  box.querySelector('#cwClose').addEventListener('click', function () { toggle(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') toggle(false); });
  ta.addEventListener('input', function () { ta.classList.remove('cw-err'); });

  function sendViaChain(chain, done, fail) {
    var i = 0;
    function next() {
      if (i >= chain.length) return fail();
      chain[i++]().then(done, next);
    }
    next();
  }

  var sending = false;
  send.addEventListener('click', function () {
    if (sending) return;
    var msg = (ta.value || '').trim();
    if (msg.length < 3) {
      ta.classList.add('cw-err'); ta.focus();
      status.className = 'cw-status err'; status.textContent = 'اكتب المشكلة أولًا';
      return;
    }
    sending = true;
    send.disabled = true;
    send.querySelector('span').textContent = 'جارٍ الإرسال…';
    status.className = 'cw-status'; status.textContent = '';

    var d = new Date();
    var meta = {
      app: document.title,
      url: location.href,
      when: d.toLocaleDateString('ar-DZ') + ' ' + d.toLocaleTimeString('ar-DZ')
    };
    var chain = transports(msg, meta);
    if (!chain.length) {
      sending = false; send.disabled = false;
      send.querySelector('span').textContent = 'إرسال';
      status.className = 'cw-status err'; status.textContent = 'الإرسال غير مضبوط بعد — اتصل هاتفيًا ' + PHONE;
      return;
    }
    sendViaChain(chain, function () {
      send.classList.add('cw-ok');
      send.querySelector('span').textContent = '✓ وصل الإبلاغ بنجاح';
      status.className = 'cw-status ok'; status.textContent = 'شكرًا لك — سيتولى المطوّر المتابعة';
      ta.value = '';
      setTimeout(function () {
        toggle(false);
        send.classList.remove('cw-ok');
        send.querySelector('span').textContent = 'إرسال';
        status.textContent = '';
        send.disabled = false; sending = false;
      }, 2200);
    }, function () {
      sending = false; send.disabled = false;
      send.querySelector('span').textContent = 'إرسال';
      status.className = 'cw-status err'; status.textContent = 'تعذّر الإرسال — اتصل هاتفيًا ' + PHONE;
    });
  });
})();
