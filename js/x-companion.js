/* X陪伴 — 治愈陪伴空间
 * 搬自 SHE.X 陪伴页：4 种氛围背景（纯 CSS，夜晚含星空）+ 3 种音景（Web Audio 现场生成，离线无文件）
 * + 自定义音频上传 + 番茄钟倒计时 + 隐藏 UI。全屏自包含，不联网。
 */
(function () {
  'use strict';

  var STYLE_ID = 'zy-xcompanion-style';

  /* ========== 背景主题 ========== */
  var THEMES = [
    { id: 'moon', name: '月光浅紫' },
    { id: 'rain', name: '雨后雾蓝' },
    { id: 'forest', name: '森林晨光' },
    { id: 'galaxy', name: '夜晚星河' }
  ];

  /* ========== 音频 ========== */
  var audioCtx = null;
  var activeNodes = [];   // 当前音景节点，stop 时释放
  var masterGain = null;
  var customAudio = null; // 自定义 <audio>
  var currentSound = null;

  function ensureCtx() {
    if (!audioCtx) {
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = audioCtx.createGain();
        masterGain.gain.value = 0.6;
        masterGain.connect(audioCtx.destination);
      } catch (e) { audioCtx = null; }
    }
    if (audioCtx && audioCtx.state === 'suspended') { audioCtx.resume(); }
    return audioCtx;
  }
  function makeNoiseBuffer(type) {
    var ctx = audioCtx;
    var len = ctx.sampleRate * 4;
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var data = buf.getChannelData(0);
    var last = 0;
    for (var i = 0; i < len; i++) {
      var white = Math.random() * 2 - 1;
      if (type === 'brown') { last = (last + 0.02 * white) / 1.02; data[i] = last * 3.2; }
      else if (type === 'pink') { data[i] = white * 0.6; } // 简化粉噪
      else { data[i] = white; }
    }
    return buf;
  }
  function startSound(id) {
    stopSound();
    var ctx = ensureCtx();
    if (!ctx) return;
    currentSound = id;

    if (id === 'custom') {
      if (customAudio) { customAudio.loop = true; customAudio.volume = 0.8; customAudio.play(); }
      return;
    }

    if (id === 'waves') {
      var src = ctx.createBufferSource(); src.buffer = makeNoiseBuffer('brown'); src.loop = true;
      var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520;
      var g = ctx.createGain(); g.gain.value = 0.55;
      // LFO 制造海浪起伏
      var lfo = ctx.createOscillator(); lfo.frequency.value = 0.12;
      var lfoGain = ctx.createGain(); lfoGain.gain.value = 0.32;
      lfo.connect(lfoGain); lfoGain.connect(g.gain);
      src.connect(lp); lp.connect(g); g.connect(masterGain);
      src.start(); lfo.start();
      activeNodes = [src, lfo];
    } else if (id === 'rain') {
      var src1 = ctx.createBufferSource(); src1.buffer = makeNoiseBuffer('white'); src1.loop = true;
      var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1600; bp.Q.value = 0.6;
      var g1 = ctx.createGain(); g1.gain.value = 0.22;
      var src2 = ctx.createBufferSource(); src2.buffer = makeNoiseBuffer('white'); src2.loop = true;
      var hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3800;
      var g2 = ctx.createGain(); g2.gain.value = 0.07;
      src1.connect(bp); bp.connect(g1); g1.connect(masterGain);
      src2.connect(hp); hp.connect(g2); g2.connect(masterGain);
      src1.start(); src2.start();
      activeNodes = [src1, src2];
    } else { // white
      var src0 = ctx.createBufferSource(); src0.buffer = makeNoiseBuffer('white'); src0.loop = true;
      var g0 = ctx.createGain(); g0.gain.value = 0.12;
      src0.connect(g0); g0.connect(masterGain);
      src0.start();
      activeNodes = [src0];
    }
  }
  function stopSound() {
    currentSound = null;
    if (customAudio) { try { customAudio.pause(); customAudio.currentTime = 0; } catch (e) {} }
    activeNodes.forEach(function (n) { try { n.stop(); } catch (e) {} try { n.disconnect(); } catch (e) {} });
    activeNodes = [];
  }
  function setVolume(v) {
    if (masterGain) masterGain.gain.value = v;
    if (customAudio) customAudio.volume = Math.min(1, v * 1.3);
  }
  function playChime() {
    var ctx = ensureCtx(); if (!ctx) return;
    var osc = ctx.createOscillator(); var g = ctx.createGain();
    osc.frequency.value = 880; osc.type = 'sine';
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.4);
    osc.connect(g); g.connect(masterGain);
    osc.start(); osc.stop(ctx.currentTime + 1.5);
  }

  /* ========== 番茄钟 ========== */
  var timer = { remain: 25 * 60, total: 25 * 60, running: false, handle: null };
  function fmt(sec) {
    var m = Math.floor(sec / 60), s = sec % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }
  function tick() {
    if (!timer.running) return;
    timer.remain--;
    if (timer.remain <= 0) {
      timer.remain = 0; timer.running = false;
      clearInterval(timer.handle); timer.handle = null;
      playChime();
      notify('番茄钟结束啦，休息一下吧 🌙');
    }
    renderTimer();
  }
  function startTimer() {
    if (timer.running) { timer.running = false; clearInterval(timer.handle); timer.handle = null; }
    else {
      if (timer.remain <= 0) timer.remain = timer.total;
      timer.running = true;
      timer.handle = setInterval(tick, 1000);
    }
    renderTimer();
  }
  function resetTimer() { timer.running = false; clearInterval(timer.handle); timer.handle = null; timer.remain = timer.total; renderTimer(); }

  /* ========== UI ========== */
  var root = null;
  var curTheme = 'moon';
  var uiHidden = false;

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var css = [
      '#zy-xcompanion{position:fixed;inset:0;z-index:99990;display:none;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;color:#fff;transition:background .8s ease;}',
      '#zy-xcompanion.show{display:block;}',
      '#zy-xcompanion.theme-moon{background:radial-gradient(120% 80% at 20% 10%,#3b2a6b 0%,#241a47 55%,#15102e 100%);}',
      '#zy-xcompanion.theme-rain{background:radial-gradient(120% 80% at 30% 20%,#4a6c8c 0%,#2e4a66 55%,#1b2c3e 100%);}',
      '#zy-xcompanion.theme-forest{background:radial-gradient(120% 80% at 25% 15%,#5a8a5a 0%,#3a6648 55%,#1f3a2a 100%);}',
      '#zy-xcompanion.theme-galaxy{background:radial-gradient(120% 90% at 70% 15%,#2a1f5e 0%,#120a2e 60%,#05030f 100%);}',
      '#zy-xcompanion #xcp-stars{position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity .8s;}',
      '#zy-xcompanion.theme-galaxy #xcp-stars{opacity:1;}',
      '#zy-xcompanion .xcp-glow{position:absolute;border-radius:50%;filter:blur(60px);opacity:.35;pointer-events:none;}',
      '#zy-xcompanion.theme-moon .xcp-glow{width:340px;height:340px;background:#b49aff;top:-80px;right:-60px;}',
      '#zy-xcompanion.theme-rain .xcp-glow{width:380px;height:380px;background:#7fb4d8;top:-100px;left:-80px;}',
      '#zy-xcompanion.theme-forest .xcp-glow{width:360px;height:360px;background:#c8e6a0;bottom:-90px;right:-70px;}',
      '#zy-xcompanion.theme-galaxy .xcp-glow{width:300px;height:300px;background:#9b7bff;top:10%;left:60%;}',
      '#zy-xcompanion .xcp-top{position:relative;z-index:3;display:flex;align-items:center;padding:14px;gap:8px;}',
      '#zy-xcompanion .xcp-btn{border:none;background:rgba(255,255,255,.14);color:#fff;font-size:13px;padding:8px 14px;border-radius:18px;cursor:pointer;backdrop-filter:blur(8px);}',
      '#zy-xcompanion .xcp-title{flex:1;text-align:center;font-size:15px;font-weight:600;letter-spacing:1px;opacity:.95;}',
      '#zy-xcompanion .xcp-center{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;justify-content:center;height:calc(100% - 60px);padding:0 20px;text-align:center;}',
      '#zy-xcompanion .xcp-quote{font-size:18px;line-height:1.8;font-weight:300;max-width:420px;opacity:.92;letter-spacing:.5px;}',
      '#zy-xcompanion .xcp-quote small{display:block;font-size:12px;margin-top:14px;opacity:.6;letter-spacing:2px;}',
      '#zy-xcompanion .xcp-panel{position:absolute;left:50%;bottom:20px;transform:translateX(-50%);width:calc(100% - 32px);max-width:440px;z-index:3;background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.14);border-radius:20px;padding:14px;backdrop-filter:blur(12px);transition:opacity .35s,transform .35s;}',
      '#zy-xcompanion.ui-hidden .xcp-panel,#zy-xcompanion.ui-hidden .xcp-top{opacity:0;pointer-events:none;}',
      '#zy-xcompanion.ui-hidden .xcp-center{cursor:pointer;}',
      '#zy-xcompanion .xcp-sec{margin-bottom:12px;}',
      '#zy-xcompanion .xcp-sec:last-child{margin-bottom:0;}',
      '#zy-xcompanion .xcp-sec-label{font-size:11px;opacity:.65;margin-bottom:7px;letter-spacing:1px;}',
      '#zy-xcompanion .xcp-chips{display:flex;gap:6px;flex-wrap:wrap;}',
      '#zy-xcompanion .xcp-chip{border:1px solid rgba(255,255,255,.22);background:transparent;color:#fff;font-size:12px;padding:6px 12px;border-radius:14px;cursor:pointer;}',
      '#zy-xcompanion .xcp-chip.on{background:rgba(255,255,255,.24);border-color:rgba(255,255,255,.55);}',
      '#zy-xcompanion .xcp-timer-row{display:flex;align-items:center;gap:12px;}',
      '#zy-xcompanion .xcp-time{font-size:34px;font-weight:200;letter-spacing:3px;font-variant-numeric:tabular-nums;min-width:108px;}',
      '#zy-xcompanion .xcp-timer-ctrl{display:flex;gap:6px;flex:1;}',
      '#zy-xcompanion .xcp-timer-ctrl button{flex:1;}',
      '#zy-xcompanion .xcp-vol{display:flex;align-items:center;gap:8px;margin-top:8px;}',
      '#zy-xcompanion .xcp-vol input[type=range]{flex:1;accent-color:#fff;}',
      '#zy-xcompanion .xcp-custom{font-size:11px;opacity:.7;cursor:pointer;text-decoration:underline;}'
    ].join('');
    var s = document.createElement('style');
    s.id = STYLE_ID; s.textContent = css;
    document.head.appendChild(s);
  }

  var QUOTES = [
    '什么都不用做，就这样待一会儿也很好。',
    '你不用一直坚强，我在这里陪着你。',
    '慢一点没关系，我等你。',
    '今天辛苦啦，靠过来休息一下吧。',
    '把呼吸放慢，世界也会跟着安静下来。',
    '你已经做得很好了，真的。'
  ];

  function buildRoot() {
    injectStyle();
    root = document.createElement('div');
    root.id = 'zy-xcompanion';
    root.innerHTML =
      '<canvas id="xcp-stars"></canvas>' +
      '<div class="xcp-glow"></div>' +
      '<div class="xcp-top">' +
        '<button class="xcp-btn" id="xcp-close">‹ 返回</button>' +
        '<div class="xcp-title">X 陪伴空间</div>' +
        '<button class="xcp-btn" id="xcp-hide">隐藏</button>' +
      '</div>' +
      '<div class="xcp-center" id="xcp-center">' +
        '<div class="xcp-quote" id="xcp-quote"></div>' +
      '</div>' +
      '<div class="xcp-panel">' +
        '<div class="xcp-sec">' +
          '<div class="xcp-sec-label">氛围背景</div>' +
          '<div class="xcp-chips" id="xcp-themes"></div>' +
        '</div>' +
        '<div class="xcp-sec">' +
          '<div class="xcp-sec-label">陪伴音景</div>' +
          '<div class="xcp-chips" id="xcp-sounds">' +
            '<button class="xcp-chip" data-snd="waves">🌊 海浪</button>' +
            '<button class="xcp-chip" data-snd="rain">🌧 雨天</button>' +
            '<button class="xcp-chip" data-snd="white">🤍 白噪音</button>' +
            '<button class="xcp-chip" data-snd="custom">🎵 自定义</button>' +
            '<input type="file" id="xcp-file" accept="audio/*" style="display:none">' +
          '</div>' +
          '<div class="xcp-vol"><span style="font-size:11px;opacity:.6">音量</span><input type="range" id="xcp-vol" min="0" max="100" value="60"></div>' +
        '</div>' +
        '<div class="xcp-sec">' +
          '<div class="xcp-sec-label">番茄钟</div>' +
          '<div class="xcp-timer-row">' +
            '<div class="xcp-time" id="xcp-time">25:00</div>' +
            '<div class="xcp-timer-ctrl">' +
              '<button class="xcp-btn" id="xcp-minus">−5</button>' +
              '<button class="xcp-btn" id="xcp-start">开始</button>' +
              '<button class="xcp-btn" id="xcp-reset">重置</button>' +
              '<button class="xcp-btn" id="xcp-plus">+5</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(root);

    root.querySelector('#xcp-close').addEventListener('click', close);
    root.querySelector('#xcp-hide').addEventListener('click', function () { uiHidden = !uiHidden; root.classList.toggle('ui-hidden', uiHidden); });
    root.querySelector('#xcp-center').addEventListener('click', function () { if (uiHidden) { uiHidden = false; root.classList.remove('ui-hidden'); } });

    // themes
    var themeWrap = root.querySelector('#xcp-themes');
    THEMES.forEach(function (t) {
      var b = document.createElement('button');
      b.className = 'xcp-chip' + (t.id === curTheme ? ' on' : '');
      b.textContent = t.name; b.setAttribute('data-theme', t.id);
      b.addEventListener('click', function () { setTheme(t.id); });
      themeWrap.appendChild(b);
    });
    // sounds
    root.querySelectorAll('[data-snd]').forEach(function (b) {
      b.addEventListener('click', function () {
        var s = b.getAttribute('data-snd');
        if (s === 'custom') { root.querySelector('#xcp-file').click(); return; }
        toggleSound(s, b);
      });
    });
    root.querySelector('#xcp-file').addEventListener('change', function (e) {
      var f = e.target.files && e.target.files[0];
      if (!f) return;
      loadCustom(f);
    });
    root.querySelector('#xcp-vol').addEventListener('input', function (e) { setVolume(e.target.value / 100); });
    // timer
    root.querySelector('#xcp-start').addEventListener('click', startTimer);
    root.querySelector('#xcp-reset').addEventListener('click', resetTimer);
    root.querySelector('#xcp-plus').addEventListener('click', function () { adjustTimer(5); });
    root.querySelector('#xcp-minus').addEventListener('click', function () { adjustTimer(-5); });
  }

  function setTheme(id) {
    curTheme = id;
    if (!root) return;
    THEMES.forEach(function (t) { root.classList.toggle('theme-' + t.id, t.id === id); });
    root.querySelectorAll('[data-theme]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-theme') === id); });
    drawStars();
  }
  function toggleSound(id, btn) {
    var wasOn = currentSound === id && activeNodes.length;
    stopSound();
    root.querySelectorAll('[data-snd]').forEach(function (b) { b.classList.remove('on'); });
    if (!wasOn) { startSound(id); if (btn) btn.classList.add('on'); }
  }
  function loadCustom(file) {
    stopSound();
    if (customAudio) { customAudio.src = ''; }
    var url = URL.createObjectURL(file);
    customAudio = new Audio(url);
    customAudio.loop = true;
    startSound('custom');
    root.querySelectorAll('[data-snd]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-snd') === 'custom'); });
    notify('已加载自定义音景：' + (file.name || '音频'));
  }
  function adjustTimer(delta) {
    var m = Math.max(1, Math.min(120, Math.round(timer.total / 60) + delta));
    timer.total = m * 60; timer.remain = timer.total; timer.running = false;
    clearInterval(timer.handle); timer.handle = null;
    renderTimer();
  }
  function renderTimer() {
    if (!root) return;
    var el = root.querySelector('#xcp-time');
    if (el) el.textContent = fmt(timer.remain);
    var btn = root.querySelector('#xcp-start');
    if (btn) btn.textContent = timer.running ? '暂停' : '开始';
  }

  function drawStars() {
    var c = root.querySelector('#xcp-stars');
    if (!c) return;
    var w = c.width = window.innerWidth;
    var h = c.height = window.innerHeight;
    var ctx = c.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    for (var i = 0; i < 140; i++) {
      var x = Math.random() * w, y = Math.random() * h * 0.85;
      var r = Math.random() * 1.6 + 0.3;
      ctx.globalAlpha = Math.random() * 0.8 + 0.2;
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function notify(msg) {
    if (window.showNotification) { window.showNotification(msg, 'info'); return; }
    try { console.log('[XCompanion]', msg); } catch (e) {}
  }

  function open() {
    if (!root) buildRoot();
    root.className = '';
    root.classList.add('show', 'theme-' + curTheme);
    uiHidden = false;
    document.body.style.overflow = 'hidden';
    var q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    root.querySelector('#xcp-quote').innerHTML = q + '<small>— 一直都在 —</small>';
    renderTimer();
    drawStars();
  }
  function close() {
    if (!root) return;
    stopSound();
    timer.running = false; clearInterval(timer.handle); timer.handle = null;
    root.classList.remove('show');
    document.body.style.overflow = '';
  }

  window.addEventListener('resize', function () { if (root && root.classList.contains('show')) drawStars(); });

  window.XCompanion = { open: open, close: close };
})();
