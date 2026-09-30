/* SafePal / BRINKS Live Support
 * Самодостаточный виджет поддержки.
 *
 * ВАЖНО:
 * - Этот файл не требует изменений в index.html.
 * - Совместим с Cloudflare Worker: POST /api/support/send {session,text,cid}, GET /api/support/poll?after=N + X-Support-Token.
 * - Кнопка создаётся независимо от состояния Worker / Telegram / сети.
 * - API:
 *   https://safepal-support.kirillzolottttov.workers.dev
 */

(function () {
  'use strict';

  var API = 'https://safepal-support.kirillzolottttov.workers.dev';
  var MAX = 1000;
  var LS_KEY = 'lsc_session';

  /*
   * Не используем window.__lscLoaded как блокирующий флаг.
   * Если файл загрузился повторно, просто не создаём второй виджет.
   */
  function alreadyLoaded() {
    return !!document.querySelector('.lsc-root');
  }

  function initSupportWidget() {

    if (alreadyLoaded()) {
      return;
    }

    /*
     * ============================================================
     * CSS
     * ============================================================
     */

    var css =
      '.lsc-root{font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}' +

      '.lsc-fab{' +
      'position:fixed;' +
      'right:20px;' +
      'bottom:20px;' +
      'z-index:2147483000;' +
      'display:flex;' +
      'align-items:center;' +
      'justify-content:center;' +
      'gap:8px;' +
      'padding:12px 18px;' +
      'border:1px solid rgba(147,91,234,.35);' +
      'border-radius:999px;' +
      'background:linear-gradient(135deg,#8b5cf6,#6d28d9);' +
      'color:#fff;' +
      'font:600 14px/1 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;' +
      'cursor:pointer;' +
      'box-shadow:0 8px 28px rgba(109,40,217,.45);' +
      'transition:transform .15s,box-shadow .15s;' +
      '}' +

      '.lsc-fab:hover{' +
      'transform:translateY(-2px);' +
      'box-shadow:0 12px 32px rgba(109,40,217,.6)' +
      '}' +

      '.lsc-badge{' +
      'display:none;' +
      'min-width:18px;' +
      'height:18px;' +
      'padding:0 5px;' +
      'border-radius:9px;' +
      'background:#ef4444;' +
      'color:#fff;' +
      'font-size:11px;' +
      'line-height:18px;' +
      'text-align:center;' +
      '}' +

      '.lsc-win{' +
      'position:fixed;' +
      'right:20px;' +
      'bottom:20px;' +
      'z-index:2147483000;' +
      'width:360px;' +
      'height:520px;' +
      'max-height:calc(100vh - 40px);' +
      'display:none;' +
      'flex-direction:column;' +
      'overflow:hidden;' +
      'border:1px solid rgba(147,91,234,.35);' +
      'border-radius:16px;' +
      'background:rgba(13,9,21,.97);' +
      'box-shadow:0 20px 60px rgba(0,0,0,.6);' +
      'color:#fff;' +
      '}' +

      '.lsc-open .lsc-win{' +
      'display:flex' +
      '}' +

      '.lsc-open .lsc-fab{' +
      'display:none' +
      '}' +

      '.lsc-head{' +
      'display:flex;' +
      'align-items:center;' +
      'gap:10px;' +
      'padding:12px 14px;' +
      'border-bottom:1px solid rgba(147,91,234,.12);' +
      'background:rgba(139,92,246,.10);' +
      '}' +

      '.lsc-ava{' +
      'width:34px;' +
      'height:34px;' +
      'flex:0 0 34px;' +
      'border-radius:50%;' +
      'background:linear-gradient(135deg,#8b5cf6,#6d28d9);' +
      'display:flex;' +
      'align-items:center;' +
      'justify-content:center;' +
      'font-size:16px;' +
      '}' +

      '.lsc-ttl{' +
      'flex:1;' +
      'min-width:0' +
      '}' +

      '.lsc-ttl b{' +
      'display:block;' +
      'font-size:15px;' +
      '}' +

      '.lsc-st{' +
      'font-size:12px;' +
      'color:#10b981;' +
      'display:flex;' +
      'align-items:center;' +
      'gap:5px;' +
      '}' +

      '.lsc-st i{' +
      'width:7px;' +
      'height:7px;' +
      'border-radius:50%;' +
      'background:currentColor;' +
      'display:inline-block;' +
      '}' +

      '.lsc-st.off{' +
      'color:#f59e0b' +
      '}' +

      '.lsc-x{' +
      'background:none;' +
      'border:0;' +
      'color:#fff;' +
      'opacity:.7;' +
      'font-size:20px;' +
      'cursor:pointer;' +
      'padding:4px 8px;' +
      'border-radius:8px;' +
      '}' +

      '.lsc-x:hover{' +
      'opacity:1;' +
      'background:rgba(255,255,255,.08)' +
      '}' +

      '.lsc-warn{' +
      'padding:7px 14px;' +
      'font-size:11.5px;' +
      'line-height:1.35;' +
      'color:#fcd34d;' +
      'background:rgba(245,158,11,.08);' +
      'border-bottom:1px solid rgba(245,158,11,.18);' +
      '}' +

      '.lsc-list{' +
      'flex:1;' +
      'overflow-y:auto;' +
      'overscroll-behavior:contain;' +
      'padding:14px;' +
      'display:flex;' +
      'flex-direction:column;' +
      'gap:10px;' +
      '}' +

      '.lsc-m{' +
      'max-width:82%;' +
      'display:flex;' +
      'flex-direction:column;' +
      'gap:3px;' +
      '}' +

      '.lsc-m.c{' +
      'align-self:flex-end;' +
      'align-items:flex-end' +
      '}' +

      '.lsc-m.s{' +
      'align-self:flex-start' +
      '}' +

      '.lsc-who{' +
      'font-size:11px;' +
      'opacity:.6;' +
      'padding:0 4px;' +
      '}' +

      '.lsc-b{' +
      'padding:9px 13px;' +
      'border-radius:14px;' +
      'font-size:14px;' +
      'line-height:1.4;' +
      'white-space:pre-wrap;' +
      'overflow-wrap:anywhere;' +
      '}' +

      '.lsc-m.c .lsc-b{' +
      'background:linear-gradient(135deg,#8b5cf6,#6d28d9);' +
      'border-bottom-right-radius:4px;' +
      '}' +

      '.lsc-m.s .lsc-b{' +
      'background:rgba(8,5,14,.95);' +
      'border:1px solid rgba(147,91,234,.12);' +
      'border-bottom-left-radius:4px;' +
      '}' +

      '.lsc-meta{' +
      'font-size:10.5px;' +
      'opacity:.5;' +
      'padding:0 4px;' +
      '}' +

      '.lsc-m.pend .lsc-b{' +
      'opacity:.6' +
      '}' +

      '.lsc-m.fail .lsc-b{' +
      'border:1px solid #ef4444;' +
      'cursor:pointer' +
      '}' +

      '.lsc-m.fail .lsc-meta{' +
      'color:#f87171;' +
      'opacity:1' +
      '}' +

      '.lsc-sys{' +
      'align-self:center;' +
      'max-width:92%;' +
      'text-align:center;' +
      'font-size:12px;' +
      'color:#fcd34d;' +
      'background:rgba(245,158,11,.08);' +
      'border:1px solid rgba(245,158,11,.2);' +
      'border-radius:10px;' +
      'padding:7px 10px;' +
      '}' +

      '.lsc-form{' +
      'display:flex;' +
      'gap:8px;' +
      'padding:10px;' +
      'border-top:1px solid rgba(147,91,234,.12);' +
      '}' +

      '.lsc-in{' +
      'flex:1;' +
      'min-width:0;' +
      'padding:11px 13px;' +
      'border-radius:12px;' +
      'border:1px solid rgba(147,91,234,.12);' +
      'background:rgba(8,5,14,.95);' +
      'color:#fff;' +
      'font-size:16px;' +
      'outline:none;' +
      '}' +

      '.lsc-in:focus{' +
      'border-color:#8b5cf6' +
      '}' +

      '.lsc-go{' +
      'width:44px;' +
      'border:0;' +
      'border-radius:12px;' +
      'background:linear-gradient(135deg,#8b5cf6,#6d28d9);' +
      'color:#fff;' +
      'font-size:18px;' +
      'cursor:pointer;' +
      '}' +

      '.lsc-go:disabled{' +
      'opacity:.5;' +
      'cursor:default' +
      '}' +

      '@media (max-width:520px){' +
      '.lsc-win{' +
      'left:8px;' +
      'right:8px;' +
      'bottom:8px;' +
      'width:auto;' +
      'height:calc(100vh - 16px);' +
      'height:calc(100dvh - 16px);' +
      'max-height:none;' +
      '}' +

      '.lsc-fab{' +
      'right:14px;' +
      'bottom:calc(14px + env(safe-area-inset-bottom,0px));' +
      '}' +
      '}';

    try {
      var style = document.createElement('style');
      style.setAttribute('data-lsc', 'true');
      style.textContent = css;

      if (document.head) {
        document.head.appendChild(style);
      } else {
        document.documentElement.appendChild(style);
      }
    } catch (e) {
      /*
       * Даже если CSS не добавился, DOM виджета всё равно
       * продолжит создаваться.
       */
    }

    /*
     * ============================================================
     * DOM
     * ============================================================
     */

    function el(tag, cls, txt) {
      var e = document.createElement(tag);

      if (cls) {
        e.className = cls;
      }

      if (txt !== undefined && txt !== null) {
        e.textContent = txt;
      }

      return e;
    }

    var root = el('div', 'lsc-root');

    var fab = el('button', 'lsc-fab', '💬 Support');
    fab.type = 'button';
    fab.setAttribute('aria-label', 'Open support chat');

    var badge = el('span', 'lsc-badge');
    fab.appendChild(badge);

    var win = el('div', 'lsc-win');
    win.setAttribute('role', 'dialog');
    win.setAttribute('aria-label', 'Support chat');

    var head = el('div', 'lsc-head');

    var avatar = el('div', 'lsc-ava', '🎧');

    var title = el('div', 'lsc-ttl');

    var titleText = el('b', '', 'Support');

    var status = el('span', 'lsc-st');
    var statusDot = el('i');
    var statusText = el('span', '', 'Online');

    status.appendChild(statusDot);
    status.appendChild(statusText);

    title.appendChild(titleText);
    title.appendChild(status);

    var closeBtn = el('button', 'lsc-x', '✕');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Close');

    head.appendChild(avatar);
    head.appendChild(title);
    head.appendChild(closeBtn);

    var warning = el(
      'div',
      'lsc-warn',
      'Never send passwords, private keys, seed phrases or card security codes.'
    );

    var list = el('div', 'lsc-list');

    var form = el('form', 'lsc-form');
    form.setAttribute('autocomplete', 'off');

    var input = el('input', 'lsc-in');
    input.type = 'text';
    input.maxLength = MAX;
    input.placeholder = 'Type your message...';
    input.setAttribute('aria-label', 'Message');

    var sendBtn = el('button', 'lsc-go', '➤');
    sendBtn.type = 'submit';
    sendBtn.setAttribute('aria-label', 'Send');

    form.appendChild(input);
    form.appendChild(sendBtn);

    win.appendChild(head);
    win.appendChild(warning);
    win.appendChild(list);
    win.appendChild(form);

    root.appendChild(fab);
    root.appendChild(win);

    /*
     * КЛЮЧЕВОЙ МОМЕНТ:
     * кнопка добавляется в DOM ДО любой работы с сетью,
     * токеном, polling и Worker.
     */
    document.body.appendChild(root);

    /*
     * ============================================================
     * STATE
     * ============================================================
     */

    var TOKEN_RE = /^chat_[a-f0-9]{32}$/;
    var LS_ACTIVE = 'lsc_active'; // "1" — в этой сессии уже была переписка
    var LS_READ = 'lsc_read';     // seq последнего прочитанного сообщения

    var token = null;
    var seen = {};        // seq -> true (дедупликация)
    var lastSeq = 0;      // после какого seq запрашивать poll
    var readSeq = 0;
    var unread = 0;
    var isOpen = false;
    var hasChat = false;
    var sent = {};        // cid -> bubble отправленного сообщения
    var pollRunning = false;
    var wakeSleep = null;

    function lsGet(k) {
      try { return localStorage.getItem(k); } catch (e) { return null; }
    }
    function lsSet(k, v) {
      try { localStorage.setItem(k, v); } catch (e) {}
    }
    function lsDel(k) {
      try { localStorage.removeItem(k); } catch (e) {}
    }

    /*
     * ============================================================
     * SESSION TOKEN  (формат: chat_ + 32 hex — как ждёт Worker)
     * ============================================================
     */

    token = lsGet(LS_KEY);

    if (token && !TOKEN_RE.test(token)) {
      /* Старый токен неверного формата: заменяем на валидный. */
      token = null;
      lsDel(LS_KEY);
      lsDel(LS_ACTIVE);
      lsDel(LS_READ);
    }

    hasChat = lsGet(LS_ACTIVE) === '1';
    readSeq = parseInt(lsGet(LS_READ) || '0', 10) || 0;

    function makeToken() {
      var hex = '';

      try {
        if (window.crypto && window.crypto.getRandomValues) {
          var bytes = new Uint8Array(16);
          window.crypto.getRandomValues(bytes);
          for (var i = 0; i < bytes.length; i++) {
            hex += ('0' + bytes[i].toString(16)).slice(-2);
          }
        }
      } catch (e) {
        hex = '';
      }

      if (hex.length !== 32) {
        hex = '';
        for (var j = 0; j < 32; j++) {
          hex += Math.floor(Math.random() * 16).toString(16);
        }
      }

      return 'chat_' + hex;
    }

    function ensureToken() {
      if (token) {
        return token;
      }
      token = makeToken();
      lsSet(LS_KEY, token);
      return token;
    }

    /*
     * ============================================================
     * UI HELPERS
     * ============================================================
     */

    function fmt(ts) {
      try {
        return new Date(ts).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (e) {
        return '';
      }
    }

    function scrollBottom() {
      try { list.scrollTop = list.scrollHeight; } catch (e) {}
    }

    /*
     * Состояние подключения — отдельно от UI.
     * Никогда не трогает кнопку и окно чата.
     */
    function setStatus(state) {
      if (state === 'ok') {
        status.className = 'lsc-st';
        statusText.textContent = 'Online';
      } else if (state === 'error') {
        status.className = 'lsc-st off';
        statusText.textContent = 'Connection error';
      } else {
        status.className = 'lsc-st off';
        statusText.textContent = 'Reconnecting...';
      }
    }

    function updateBadge() {
      if (unread > 0 && !isOpen) {
        badge.style.display = 'inline-block';
        badge.textContent = unread > 9 ? '9+' : String(unread);
      } else {
        badge.style.display = 'none';
        badge.textContent = '';
      }
    }

    function bubble(from, text, ts) {
      var message = el('div', 'lsc-m ' + (from === 'client' ? 'c' : 's'));

      message.appendChild(
        el('div', 'lsc-who', from === 'client' ? 'Client' : 'Support')
      );
      message.appendChild(el('div', 'lsc-b', text));

      var meta = el('div', 'lsc-meta', fmt(ts));
      message.appendChild(meta);
      message._meta = meta;

      list.appendChild(message);
      scrollBottom();

      return message;
    }

    function systemMessage(text) {
      var message = el('div', 'lsc-sys', text);
      list.appendChild(message);
      scrollBottom();
      return message;
    }

    bubble('support', 'Hello! How can I help you?', Date.now());

    /*
     * ============================================================
     * RENDER СООБЩЕНИЯ С СЕРВЕРА
     * ============================================================
     */

    function markDelivered(bubbleEl, ts) {
      bubbleEl.className = 'lsc-m c';
      bubbleEl.onclick = null;
      bubbleEl.removeAttribute('role');
      if (bubbleEl._meta) {
        bubbleEl._meta.textContent = fmt(ts || Date.now());
      }
    }

    function render(msg) {
      if (!msg || typeof msg !== 'object') {
        return;
      }

      var seq = Number(msg.seq) || 0;

      if (seq) {
        if (seen[seq]) {
          return;
        }
        seen[seq] = true;
        if (seq > lastSeq) {
          lastSeq = seq;
        }
      }

      /* Эхо нашего собственного сообщения (по cid) — пузырь уже есть. */
      if (msg.cid && sent[msg.cid]) {
        markDelivered(sent[msg.cid], msg.ts);
        return;
      }

      var text = msg.text === undefined || msg.text === null
        ? ''
        : String(msg.text);

      if (!text) {
        return;
      }

      var from = msg.from === 'client' ? 'client' : 'support';

      bubble(from, text, msg.ts || Date.now());

      if (from === 'support') {
        if (isOpen) {
          if (seq > readSeq) {
            readSeq = seq;
            lsSet(LS_READ, String(readSeq));
          }
        } else if (seq > readSeq || !seq) {
          unread++;
          updateBadge();
        }
      }
    }

    /*
     * ============================================================
     * POLLING  (один цикл, никогда не умирает, не влияет на UI)
     * ============================================================
     */

    function sleep(ms) {
      return new Promise(function (resolve) {
        var t = setTimeout(done, ms);
        function done() {
          clearTimeout(t);
          if (wakeSleep === done) {
            wakeSleep = null;
          }
          resolve();
        }
        wakeSleep = done;
      });
    }

    function withTimeout(ms) {
      var ctl = typeof AbortController === 'function'
        ? new AbortController()
        : null;
      var timer = setTimeout(function () {
        if (ctl) { ctl.abort(); }
      }, ms);
      return {
        signal: ctl ? ctl.signal : undefined,
        done: function () { clearTimeout(timer); }
      };
    }

    async function pollOnce() {
      var t = withTimeout(35000);

      try {
        var response = await fetch(
          API + '/api/support/poll?after=' + encodeURIComponent(lastSeq),
          {
            method: 'GET',
            headers: { 'X-Support-Token': ensureToken() },
            cache: 'no-store',
            signal: t.signal
          }
        );

        var data = null;

        /* 204 No Content — тела нет, это НЕ ошибка. */
        if (response.status !== 204) {
          try { data = await response.json(); } catch (e) { data = null; }
        }

        return { status: response.status, data: data };
      } finally {
        t.done();
      }
    }

    function idleDelay(elapsed) {
      /* Worker держит запрос долго (long-poll) — можно сразу повторять. */
      if (elapsed >= 5000) { return 300; }
      if (document.hidden) { return 15000; }
      return isOpen ? 2000 : 5000;
    }

    async function pollLoop() {
      if (pollRunning) {
        return;
      }
      pollRunning = true;

      var fails = 0;

      for (;;) {
        var started = Date.now();
        var delay;

        try {
          var r = await pollOnce();
          var s = r.status;

          if (s === 200 || s === 204) {
            fails = 0;
            setStatus('ok');

            if (r.data && Array.isArray(r.data.messages)) {
              r.data.messages.forEach(render);
            }

            delay = idleDelay(Date.now() - started);
          } else if (s === 400 || s === 401 || s === 403 || s === 404) {
            /* Worker ответил, значит он доступен. */
            if (hasChat) {
              setStatus('error');
              delay = 15000;
            } else {
              /* Сессия ещё не создана (нет ни одного сообщения). */
              setStatus('ok');
              delay = 10000;
            }
          } else {
            /* 429, 5xx и прочее — временная проблема, повторяем. */
            fails++;
            setStatus('reconnecting');
            delay = Math.min(2000 * fails, 15000);
          }
        } catch (e) {
          /* Сеть / CORS / timeout. */
          fails++;
          setStatus('reconnecting');
          delay = Math.min(2000 * fails, 15000);
        }

        await sleep(delay);
      }
    }

    function pollNow() {
      if (!pollRunning) {
        pollLoop();
      } else if (wakeSleep) {
        wakeSleep();
      }
    }

    /*
     * ============================================================
     * SEND
     * ============================================================
     */

    function newCid() {
      return 'c' + Date.now().toString(36) +
        Math.random().toString(36).slice(2, 10);
    }

    function send(text, oldBubble) {
      ensureToken();

      if (oldBubble) {
        if (oldBubble._cid) {
          delete sent[oldBubble._cid];
        }
        if (oldBubble.parentNode) {
          oldBubble.parentNode.removeChild(oldBubble);
        }
      }

      var cid = newCid();
      var message = bubble('client', text, Date.now());
      var finished = false;

      message._cid = cid;
      message.className = 'lsc-m c pend';
      message._meta.textContent = 'Sending...';
      sent[cid] = message;

      function fail(reason) {
        if (finished) { return; }
        finished = true;

        message.className = 'lsc-m c fail';
        message._meta.textContent = reason + ' Tap to retry.';
        message.setAttribute('role', 'button');
        message.onclick = function () {
          message.onclick = null;
          send(text, message);
        };
      }

      function delivered(serverMsg) {
        if (finished) { return; }
        finished = true;

        markDelivered(message, serverMsg && serverMsg.ts);

        hasChat = true;
        lsSet(LS_ACTIVE, '1');

        /* Только помечаем seq как виденный; lastSeq не двигаем,
           чтобы не пропустить ответ оператора с меньшим seq. */
        if (serverMsg && typeof serverMsg === 'object' && serverMsg.seq) {
          seen[Number(serverMsg.seq)] = true;
        }

        pollNow();
      }

      var t = withTimeout(20000);

      fetch(API + '/api/support/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session: token, text: text, cid: cid }),
        signal: t.signal
      })
        .then(function (response) {
          if (response.status === 204) {
            return { status: 204, data: null };
          }
          return response.json()
            .catch(function () { return null; })
            .then(function (data) {
              return { status: response.status, data: data };
            });
        })
        .then(function (result) {
          t.done();

          var s = result.status;
          var d = result.data && typeof result.data === 'object'
            ? result.data
            : {};

          if (s >= 200 && s < 300 && d.ok !== false && !d.error) {
            delivered(d.message);
            return;
          }

          if (s === 422) {
            finished = true;
            delete sent[cid];
            if (message.parentNode) {
              message.parentNode.removeChild(message);
            }
            systemMessage(
              (typeof d.message === 'string' && d.message) ||
              'This message was not sent for safety reasons.'
            );
            return;
          }

          if (s === 429) {
            fail('Too many messages.');
            return;
          }

          fail('Not delivered.');
        })
        .catch(function () {
          t.done();
          fail('Support is unreachable.');
        });
    }

    /*
     * ============================================================
     * FORM
     * ============================================================
     */

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var text = input.value.trim();

      if (!text) {
        return;
      }

      input.value = '';
      send(text.slice(0, MAX));

      try { input.focus(); } catch (e) {}
    });

    /*
     * ============================================================
     * OPEN / CLOSE
     * ============================================================
     */

    function openChat() {
      isOpen = true;
      root.classList.add('lsc-open');

      unread = 0;
      readSeq = Math.max(readSeq, lastSeq);
      lsSet(LS_READ, String(readSeq));
      updateBadge();
      scrollBottom();

      setTimeout(function () {
        try { input.focus(); } catch (e) {}
      }, 50);

      /* Проверяем соединение и подтягиваем историю сразу при открытии. */
      pollNow();
    }

    function closeChat() {
      isOpen = false;
      root.classList.remove('lsc-open');
    }

    fab.addEventListener('click', openChat);
    closeBtn.addEventListener('click', closeChat);

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && isOpen) {
        closeChat();
      }
    });

    document.addEventListener('visibilitychange', function () {
      if (!document.hidden && pollRunning) {
        pollNow();
      }
    });

    window.addEventListener('online', function () {
      if (pollRunning) {
        pollNow();
      }
    });

    /*
     * ============================================================
     * START NETWORK
     * ============================================================
     *
     * Кнопка уже в DOM. Сеть стартует после этого и только если
     * в этой сессии уже была переписка (иначе — при первом открытии
     * чата или первой отправке). Любая сетевая ошибка меняет лишь
     * текст статуса, но не кнопку и не окно.
     */

    ensureToken();

    if (hasChat) {
      pollLoop();
    }
  }

  /*
   * ==============================================================
   * START
   * ==============================================================
   *
   * Самое главное:
   * ждём DOM, чтобы document.body гарантированно существовал.
   */

  function start() {

    if (alreadyLoaded()) {
      return;
    }

    try {
      initSupportWidget();
    } catch (error) {

      /*
       * Аварийный fallback.
       *
       * Даже если какая-либо часть основного виджета
       * неожиданно выдаст ошибку, простая кнопка поддержки
       * всё равно должна появиться.
       */

      try {

        if (
          document.querySelector(
            '.lsc-emergency-fab'
          )
        ) {
          return;
        }

        var emergency =
          document.createElement('button');

        emergency.className =
          'lsc-emergency-fab';

        emergency.type = 'button';

        emergency.textContent =
          '💬 Support';

        emergency.style.position =
          'fixed';

        emergency.style.right =
          '20px';

        emergency.style.bottom =
          '20px';

        emergency.style.zIndex =
          '2147483647';

        emergency.style.padding =
          '12px 18px';

        emergency.style.border =
          '1px solid rgba(147,91,234,.35)';

        emergency.style.borderRadius =
          '999px';

        emergency.style.background =
          'linear-gradient(135deg,#8b5cf6,#6d28d9)';

        emergency.style.color =
          '#fff';

        emergency.style.font =
          '600 14px system-ui';

        emergency.style.cursor =
          'pointer';

        emergency.onclick =
          function () {
            alert(
              'Support chat could not be initialized.'
            );
          };

        document.body.appendChild(
          emergency
        );

      } catch (fallbackError) {
        /*
         * Ничего больше не делаем.
         */
      }
    }
  }

  if (
    document.readyState ===
    'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      start,
      {
        once: true
      }
    );

  } else {

    start();
  }

})();
