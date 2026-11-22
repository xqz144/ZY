/* 拼豆工坊 — 图纸生成 + 一起拼豆小游戏
 * 搬自「一个木函」拼豆图纸生成（原生实现，此处按标准算法在网页端复刻）：
 *   选图 → 缩放裁剪 → 自动取色量化 → 48×48 像素图纸（带色号/材料表/改色/导出）
 *   再进入「和梦角一起拼豆」：逐颗放豆 → 梦角代拼 → 熨烫融合 → 冷却出成品
 * 全部本地运行：不联网、不依赖云端。
 */
(function () {
  'use strict';

  var STYLE_ID = 'zy-bead-style';
  var LB_WORKS = 'zy_bead_works';
  var LS_OPTS = 'zy_bead_opts';

  /* ========== 通用工具 ========== */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function notify(msg) {
    if (window.showNotification) { window.showNotification(msg, 'info'); return; }
    try { console.log('[Bead]', msg); } catch (e) {}
  }
  function partnerName() {
    return (window.settings && window.settings.partnerName) || '梦角';
  }
  function uid() { return 'b' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36); }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function safeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function safeSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }

  function rgb2hex(r, g, b) {
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
  function hex2rgb(h) {
    h = String(h || '#000000').replace('#', '');
    if (h.length === 3) { h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]; }
    return { r: parseInt(h.slice(0, 2), 16) || 0, g: parseInt(h.slice(2, 4), 16) || 0, b: parseInt(h.slice(4, 6), 16) || 0 };
  }
  function dist2(a, b) {
    var dr = a.r - b.r, dg = a.g - b.g, db = a.b - b.b;
    return dr * dr + dg * dg + db * db;
  }

  /* ========== 状态 ========== */
  var root = null;
  var cvCrop = null, ctxCrop = null;     // 裁剪预览
  var cv = null, ctx = null;             // 图纸 / 游戏画布
  var CELL = 16;                         // 画布每格逻辑像素

  var st = {
    screen: 'home',
    img: null, imgSrc: '',
    gridW: 48, gridH: 48,
    colorCount: 16,
    palette: [],       // [hex]
    counts: [],        // 每色数量
    cells: [],         // 每格 palette 索引
    zoom: 0,           // 裁剪缩放
    ox: 0, oy: 0,      // 裁剪偏移
    selectedColor: -1, // 图纸改色时选中的色索引
    showNumbers: false,
    showGrid: true,
    playing: false,
    placed: null,      // Uint8Array
    placedCount: 0,
    helper: true,
    helperTimer: null,
    anim: {},          // 放置动画 {idx: startTime}
    rafId: 0,
    works: [],
    previewDataUrl: '' // 导出预览
  };

  /* ========== 样式 ========== */
  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var css = [
      '#zy-bead{position:fixed;inset:0;z-index:99990;display:none;flex-direction:column;background:linear-gradient(165deg,#2b1a3d 0%,#3d2050 42%,#1b1030 100%);color:#f6edff;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;}',
      '#zy-bead.show{display:flex;}',
      '#zy-bead .bd-shell{width:100%;max-width:600px;margin:0 auto;flex:1;min-height:0;display:flex;flex-direction:column;}',
      '#zy-bead .bd-head{height:50px;flex-shrink:0;display:flex;align-items:center;gap:8px;padding:0 10px;}',
      '#zy-bead .bd-back{width:36px;height:36px;border:none;background:transparent;color:#f6edff;font-size:22px;cursor:pointer;line-height:1;}',
      '#zy-bead .bd-title{flex:1;font-size:17px;font-weight:600;}',
      '#zy-bead .bd-hbtn{border:none;background:rgba(255,255,255,.13);color:#fff;font-size:13px;padding:7px 12px;border-radius:16px;cursor:pointer;}',
      '#zy-bead .bd-body{flex:1;min-height:0;overflow-y:auto;padding:10px 16px 26px;}',
      '#zy-bead .bd-hero{text-align:center;padding:26px 8px 14px;}',
      '#zy-bead .bd-hero .big{font-size:24px;font-weight:700;letter-spacing:1px;margin-bottom:8px;}',
      '#zy-bead .bd-hero .sub{font-size:13px;line-height:1.8;color:#d7c6e8;}',
      '#zy-bead .bd-cta{display:block;width:100%;max-width:280px;margin:20px auto 0;border:none;background:linear-gradient(135deg,#ff8fc0,#a97bff);color:#fff;font-size:16px;font-weight:600;padding:14px;border-radius:24px;cursor:pointer;box-shadow:0 6px 20px rgba(169,123,255,.42);}',
      '#zy-bead .bd-cta.ghost{background:rgba(255,255,255,.12);box-shadow:none;font-weight:500;}',
      '#zy-bead .bd-tile{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:16px;padding:14px;margin-bottom:12px;}',
      '#zy-bead .bd-tile h4{margin:0 0 10px;font-size:14px;color:#fff;}',
      '#zy-bead .bd-row{display:flex;align-items:center;gap:10px;margin-bottom:10px;}',
      '#zy-bead .bd-row:last-child{margin-bottom:0;}',
      '#zy-bead .bd-lbl{font-size:12px;color:#cbb8e0;min-width:62px;}',
      '#zy-bead .bd-row input[type=range]{flex:1;accent-color:#ff9ec7;}',
      '#zy-bead .bd-val{font-size:12px;color:#fff;min-width:38px;text-align:right;}',
      '#zy-bead .bd-chips{display:flex;flex-wrap:wrap;gap:7px;}',
      '#zy-bead .bd-chip{border:1px solid rgba(255,255,255,.2);background:transparent;color:#e8dbf5;font-size:13px;padding:7px 13px;border-radius:15px;cursor:pointer;}',
      '#zy-bead .bd-chip.on{background:linear-gradient(135deg,rgba(255,143,192,.32),rgba(169,123,255,.32));border-color:#ff9ec7;color:#fff;}',
      '#zy-bead .bd-cvwrap{flex:1;min-height:0;overflow:auto;-webkit-overflow-scrolling:touch;display:flex;align-items:flex-start;justify-content:center;padding:6px 0;}',
      '#zy-bead .bd-cvwrap canvas{border-radius:12px;background:#fff;box-shadow:0 8px 26px rgba(0,0,0,.35);touch-action:none;max-width:100%;height:auto;}',
      '#zy-bead .bd-cvwrap.zoom canvas{max-width:none;width:auto;}',
      '#zy-bead .bd-palette{display:flex;flex-wrap:wrap;gap:6px;padding:8px 0 4px;}',
      '#zy-bead .bd-sw{width:30px;height:30px;border-radius:8px;border:2px solid transparent;cursor:pointer;position:relative;}',
      '#zy-bead .bd-sw.on{border-color:#fff;box-shadow:0 0 0 2px rgba(255,158,199,.9);}',
      '#zy-bead .bd-sw i{position:absolute;right:-3px;bottom:-3px;font-size:9px;background:rgba(0,0,0,.6);color:#fff;border-radius:6px;padding:0 3px;font-style:normal;line-height:12px;}',
      '#zy-bead .bd-bar{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;padding:6px 0 2px;}',
      '#zy-bead .bd-btn{border:none;background:linear-gradient(135deg,#ff8fc0,#a97bff);color:#fff;font-size:13px;font-weight:600;padding:10px 18px;border-radius:19px;cursor:pointer;}',
      '#zy-bead .bd-btn.ghost{background:rgba(255,255,255,.13);font-weight:500;}',
      '#zy-bead .bd-btn:disabled{opacity:.45;}',
      '#zy-bead .bd-prog{height:8px;border-radius:4px;background:rgba(255,255,255,.14);overflow:hidden;margin:6px 0 10px;}',
      '#zy-bead .bd-prog i{display:block;height:100%;width:0;background:linear-gradient(90deg,#ff8fc0,#a97bff);transition:width .25s;}',
      '#zy-bead .bd-bubble{display:flex;gap:8px;align-items:flex-start;background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:10px 12px;margin-bottom:10px;font-size:13px;line-height:1.6;}',
      '#zy-bead .bd-bubble .av{width:26px;height:26px;border-radius:50%;flex-shrink:0;background:linear-gradient(135deg,#ff9ec7,#a97bff);display:flex;align-items:center;justify-content:center;font-size:13px;}',
      '#zy-bead .bd-sheet{position:absolute;inset:0;background:rgba(0,0,0,.62);display:flex;align-items:flex-end;justify-content:center;z-index:3;}',
      '#zy-bead .bd-sheet-in{width:100%;max-width:600px;max-height:78%;overflow-y:auto;background:#241536;border-radius:20px 20px 0 0;padding:16px 16px 26px;}',
      '#zy-bead .bd-sheet-in h3{margin:0 0 12px;font-size:16px;}',
      '#zy-bead .bd-mat-row{display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.08);font-size:13px;}',
      '#zy-bead .bd-mat-row:last-child{border-bottom:none;}',
      '#zy-bead .bd-dot{width:22px;height:22px;border-radius:6px;flex-shrink:0;border:1px solid rgba(255,255,255,.25);}',
      '#zy-bead .bd-mat-name{flex:1;font-family:ui-monospace,Menlo,monospace;font-size:12px;color:#e2d3f2;}',
      '#zy-bead .bd-mat-num{font-weight:600;color:#fff;}',
      '#zy-bead .bd-preview{width:100%;border-radius:12px;background:#fff;display:block;}',
      '#zy-bead .bd-works{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}',
      '#zy-bead .bd-works .it{position:relative;border-radius:10px;overflow:hidden;background:#fff;aspect-ratio:1;cursor:pointer;}',
      '#zy-bead .bd-works .it img{width:100%;height:100%;object-fit:cover;display:block;}',
      '#zy-bead .bd-works .it span{position:absolute;left:0;right:0;bottom:0;font-size:10px;color:#fff;background:rgba(0,0,0,.45);padding:2px 4px;text-align:center;}',
      '#zy-bead .bd-iron{position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:2;}',
      '#zy-bead .bd-iron .beam{position:absolute;top:0;bottom:0;width:34%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.35),transparent);animation:bdsweep 2.6s linear forwards;}',
      '@keyframes bdsweep{from{left:-40%}to{left:106%}}',
      '#zy-bead .bd-iron .ir{position:absolute;top:50%;font-size:34px;transform:translate(-50%,-50%);animation:bdmove 2.6s linear forwards;}',
      '@keyframes bdmove{from{left:0}to{left:100%}}',
      '#zy-bead .bd-center{text-align:center;padding:40px 10px;font-size:14px;color:#d7c6e8;}',
      '#zy-bead .bd-big{font-size:20px;font-weight:600;color:#fff;margin-bottom:6px;}'
    ].join('');
    var s = document.createElement('style');
    s.id = STYLE_ID; s.textContent = css;
    document.head.appendChild(s);
  }

  /* ========== 音效 ========== */
  var audioCtx = null;
  function ensureCtx() {
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { audioCtx = null; }
    }
    if (audioCtx && audioCtx.state === 'suspended') { try { audioCtx.resume(); } catch (e) {} }
    return audioCtx;
  }
  function popSound(freq) {
    var ctx2 = ensureCtx(); if (!ctx2) return;
    try {
      var o = ctx2.createOscillator(), g = ctx2.createGain();
      o.type = 'triangle';
      o.frequency.value = freq || 720;
      g.gain.setValueAtTime(0.0001, ctx2.currentTime);
      g.gain.exponentialRampToValueAtTime(0.16, ctx2.currentTime + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx2.currentTime + 0.11);
      o.connect(g); g.connect(ctx2.destination);
      o.start(); o.stop(ctx2.currentTime + 0.12);
    } catch (e) {}
  }

  /* ========== DOM 构建 ========== */
  function buildRoot() {
    injectStyle();
    root = document.createElement('div');
    root.id = 'zy-bead';
    root.innerHTML =
      '<div class="bd-shell">' +
        '<div class="bd-head">' +
          '<button class="bd-back" type="button" aria-label="返回">‹</button>' +
          '<div class="bd-title" id="bd-title">拼豆工坊</div>' +
          '<button class="bd-hbtn" id="bd-help" type="button" style="display:none">说明</button>' +
        '</div>' +
        '<div class="bd-body" id="bd-body"></div>' +
      '</div>' +
      '<input type="file" id="bd-file" accept="image/*" style="display:none">';
    document.body.appendChild(root);

    cvCrop = document.createElement('canvas');
    ctxCrop = cvCrop.getContext('2d');
    cv = document.createElement('canvas');
    ctx = cv.getContext('2d');

    root.querySelector('.bd-back').addEventListener('click', onBack);
    root.querySelector('#bd-file').addEventListener('change', onFilePicked);
  }

  function body() { return root.querySelector('#bd-body'); }
  function setTitle(t) { root.querySelector('#bd-title').textContent = t; }

  function onBack() {
    if (st.screen === 'home') { close(); return; }
    if (st.screen === 'crop') { go('home'); return; }
    if (st.screen === 'grid') { go('crop'); return; }
    if (st.screen === 'play') { if (confirmExitPlay()) go('grid'); return; }
    if (st.screen === 'iron') { return; }
    if (st.screen === 'done') { go('home'); return; }
  }
  function confirmExitPlay() {
    if (st.placedCount === 0) return true;
    return window.confirm('拼豆还没拼完，确定要离开吗？');
  }

  function go(screen) {
    st.screen = screen;
    stopHelper();
    render();
  }

  /* ========== 渲染分发 ========== */
  function render() {
    if (!root) return;
    var b = body();
    b.innerHTML = '';
    if (st.screen === 'home') renderHome(b);
    else if (st.screen === 'crop') renderCrop(b);
    else if (st.screen === 'grid') renderGrid(b);
    else if (st.screen === 'play') renderPlay(b);
    else if (st.screen === 'iron') renderIron(b);
    else if (st.screen === 'done') renderDone(b);
  }

  /* ---------- 首页 ---------- */
  function renderHome(b) {
    setTitle('拼豆工坊');
    var name = partnerName();
    var worksHtml = '';
    if (st.works.length) {
      worksHtml =
        '<div class="bd-tile"><h4>我的作品</h4><div class="bd-works" id="bd-works">' +
        st.works.slice(0, 9).map(function (w) {
          return '<div class="it" data-id="' + w.id + '"><img src="' + w.thumb + '"><span>' + esc(w.date || '') + '</span></div>';
        }).join('') +
        '</div></div>';
    }
    b.innerHTML =
      '<div class="bd-hero">' +
        '<div class="big">🧩 拼豆工坊</div>' +
        '<div class="sub">把一张图片变成可以真的拼出来的拼豆图纸，<br>再和 ' + esc(name) + ' 一起一颗一颗把它拼出来。</div>' +
        '<button class="bd-cta" id="bd-pick" type="button">上传图片做图纸</button>' +
        '<button class="bd-cta ghost" id="bd-demo" type="button">先看看示例图纸</button>' +
      '</div>' +
      worksHtml;
    b.querySelector('#bd-pick').addEventListener('click', function () { root.querySelector('#bd-file').click(); });
    b.querySelector('#bd-demo').addEventListener('click', makeDemo);
    var worksEl = b.querySelector('#bd-works');
    if (worksEl) {
      worksEl.querySelectorAll('.it').forEach(function (el) {
        el.addEventListener('click', function () { openWork(el.getAttribute('data-id')); });
      });
    }
  }

  /* ---------- 选图回调 ---------- */
  function onFilePicked(e) {
    var f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f) return;
    if (!/^image\//.test(f.type)) { notify('请选择图片文件'); return; }
    var reader = new FileReader();
    reader.onload = function () {
      var img = new Image();
      img.onload = function () {
        st.img = img;
        st.imgSrc = reader.result;
        // 初始缩放：cover 填满正方形
        st.zoom = 1;
        st.ox = 0; st.oy = 0;
        go('crop');
      };
      img.onerror = function () { notify('图片读取失败'); };
      img.src = reader.result;
    };
    reader.readAsDataURL(f);
  }

  /* ---------- 裁剪页 ---------- */
  function renderCrop(b) {
    setTitle('调整画面');
    b.innerHTML =
      '<div class="bd-tile" style="padding:10px;">' +
        '<div class="bd-cvwrap" id="bd-cropwrap"></div>' +
        '<div class="bd-row" style="margin-top:10px"><span class="bd-lbl">缩放</span>' +
          '<input type="range" id="bd-zoom" min="100" max="320" value="' + Math.round(st.zoom * 100) + '">' +
          '<span class="bd-val" id="bd-zoomv">' + Math.round(st.zoom * 100) + '%</span></div>' +
      '</div>' +
      '<div class="bd-tile">' +
        '<div class="bd-row"><span class="bd-lbl">网格</span><div class="bd-chips" id="bd-sizes">' +
          [24, 32, 48, 64, 80].map(function (n) {
            return '<button class="bd-chip' + (st.gridW === n ? ' on' : '') + '" data-n="' + n + '" type="button">' + n + '×' + n + '</button>';
          }).join('') +
        '</div></div>' +
        '<div class="bd-row"><span class="bd-lbl">颜色数</span><div class="bd-chips" id="bd-cnts">' +
          [8, 12, 16, 24, 32].map(function (n) {
            return '<button class="bd-chip' + (st.colorCount === n ? ' on' : '') + '" data-n="' + n + '" type="button">' + n + ' 色</button>';
          }).join('') +
        '</div></div>' +
      '</div>' +
      '<div class="bd-bar"><button class="bd-btn" id="bd-gen" type="button">生成图纸</button></div>' +
      '<div style="text-align:center;font-size:11px;color:#b9a4ce;margin-top:8px;">拖动画面可以移动位置</div>';

    var wrap = b.querySelector('#bd-cropwrap');
    wrap.appendChild(cvCrop);
    cvCrop.style.maxWidth = '100%';

    var zoomInput = b.querySelector('#bd-zoom');
    zoomInput.addEventListener('input', function () {
      st.zoom = parseInt(zoomInput.value, 10) / 100;
      b.querySelector('#bd-zoomv').textContent = zoomInput.value + '%';
      drawCrop();
    });
    b.querySelectorAll('#bd-sizes .bd-chip').forEach(function (c) {
      c.addEventListener('click', function () {
        st.gridW = st.gridH = parseInt(c.getAttribute('data-n'), 10);
        b.querySelectorAll('#bd-sizes .bd-chip').forEach(function (x) { x.classList.remove('on'); });
        c.classList.add('on');
      });
    });
    b.querySelectorAll('#bd-cnts .bd-chip').forEach(function (c) {
      c.addEventListener('click', function () {
        st.colorCount = parseInt(c.getAttribute('data-n'), 10);
        b.querySelectorAll('#bd-cnts .bd-chip').forEach(function (x) { x.classList.remove('on'); });
        c.classList.add('on');
      });
    });
    b.querySelector('#bd-gen').addEventListener('click', generateGrid);

    setupCropDrag();
    drawCrop();
  }

  var cropDrag = { on: false, lx: 0, ly: 0 };
  function setupCropDrag() {
    cvCrop.addEventListener('pointerdown', function (e) {
      cropDrag.on = true; cropDrag.lx = e.clientX; cropDrag.ly = e.clientY;
      try { cvCrop.setPointerCapture(e.pointerId); } catch (er) {}
    });
    cvCrop.addEventListener('pointermove', function (e) {
      if (!cropDrag.on) return;
      var dx = e.clientX - cropDrag.lx, dy = e.clientY - cropDrag.ly;
      cropDrag.lx = e.clientX; cropDrag.ly = e.clientY;
      var rect = cvCrop.getBoundingClientRect();
      var k = cvCrop.width / (rect.width || 1);
      st.ox += dx * k; st.oy += dy * k;
      drawCrop();
    });
    cvCrop.addEventListener('pointerup', function () { cropDrag.on = false; });
    cvCrop.addEventListener('pointercancel', function () { cropDrag.on = false; });
  }

  function drawCrop() {
    if (!st.img || !cvCrop) return;
    var size = 360;
    cvCrop.width = size; cvCrop.height = size;
    var img = st.img;
    var base = Math.max(size / img.width, size / img.height); // cover
    var sc = base * st.zoom;
    var dw = img.width * sc, dh = img.height * sc;
    var dx = (size - dw) / 2 + st.ox;
    var dy = (size - dh) / 2 + st.oy;
    // 边界约束：保证不留白
    if (dw <= size) dx = (size - dw) / 2; else dx = clamp(dx, size - dw, 0);
    if (dh <= size) dy = (size - dh) / 2; else dy = clamp(dy, size - dh, 0);
    st.ox = dx - (size - dw) / 2;
    st.oy = dy - (size - dh) / 2;
    ctxCrop.clearRect(0, 0, size, size);
    ctxCrop.fillStyle = '#ffffff';
    ctxCrop.fillRect(0, 0, size, size);
    ctxCrop.imageSmoothingQuality = 'high';
    ctxCrop.drawImage(img, dx, dy, dw, dh);
  }

  /* ---------- 生成图纸 ---------- */
  function generateGrid() {
    if (!st.img) { notify('请先上传图片'); return; }
    var W = st.gridW, H = st.gridH;
    // 把裁剪结果缩放到 W×H，浏览器插值≈区域平均
    var tmp = document.createElement('canvas');
    tmp.width = W; tmp.height = H;
    var tctx = tmp.getContext('2d');
    tctx.imageSmoothingEnabled = true;
    tctx.imageSmoothingQuality = 'high';
    tctx.drawImage(cvCrop, 0, 0, cvCrop.width, cvCrop.height, 0, 0, W, H);
    var data = tctx.getImageData(0, 0, W, H).data;

    var samples = [];
    for (var i = 0; i < W * H; i++) {
      samples.push({ r: data[i * 4], g: data[i * 4 + 1], b: data[i * 4 + 2] });
    }
    var k = Math.min(st.colorCount, W * H);
    var centers = kmeans(samples, k);
    // 色板按使用量排序
    var idxMap = new Array(W * H);
    var used = new Array(centers.length).fill(0);
    for (var j = 0; j < samples.length; j++) {
      var best = 0, bd = Infinity;
      for (var c = 0; c < centers.length; c++) {
        var d = dist2(samples[j], centers[c]);
        if (d < bd) { bd = d; best = c; }
      }
      idxMap[j] = best;
      used[best]++;
    }
    var order = [];
    for (var q = 0; q < centers.length; q++) order.push(q);
    order.sort(function (a, b) { return used[b] - used[a]; });
    var remap = new Array(centers.length);
    var palette = [], counts = [];
    order.forEach(function (oldIdx, newIdx) {
      remap[oldIdx] = newIdx;
      palette.push(rgb2hex(centers[oldIdx].r, centers[oldIdx].g, centers[oldIdx].b));
      counts.push(used[oldIdx]);
    });
    var cells = new Array(W * H);
    for (var z = 0; z < W * H; z++) cells[z] = remap[idxMap[z]];

    st.gridW = W; st.gridH = H;
    st.palette = palette; st.counts = counts; st.cells = cells;
    st.selectedColor = -1;
    st.placed = null; st.placedCount = 0;
    go('grid');
  }

  function kmeans(samples, k) {
    // 最远点初始化
    var centers = [];
    centers.push({ r: samples[0].r, g: samples[0].g, b: samples[0].b });
    while (centers.length < k) {
      var bestI = 0, bestD = -1;
      for (var i = 0; i < samples.length; i += Math.max(1, Math.floor(samples.length / 1200))) {
        var minD = Infinity;
        for (var c = 0; c < centers.length; c++) {
          var d = dist2(samples[i], centers[c]);
          if (d < minD) minD = d;
        }
        if (minD > bestD) { bestD = minD; bestI = i; }
      }
      centers.push({ r: samples[bestI].r, g: samples[bestI].g, b: samples[bestI].b });
    }
    // 迭代
    for (var iter = 0; iter < 8; iter++) {
      var sums = [];
      for (var ci = 0; ci < k; ci++) sums.push({ r: 0, g: 0, b: 0, n: 0 });
      for (var si = 0; si < samples.length; si++) {
        var mi = 0, md = Infinity;
        for (var cj = 0; cj < k; cj++) {
          var dj = dist2(samples[si], centers[cj]);
          if (dj < md) { md = dj; mi = cj; }
        }
        sums[mi].r += samples[si].r; sums[mi].g += samples[si].g; sums[mi].b += samples[si].b; sums[mi].n++;
      }
      for (var cu = 0; cu < k; cu++) {
        if (sums[cu].n > 0) {
          centers[cu] = {
            r: Math.round(sums[cu].r / sums[cu].n),
            g: Math.round(sums[cu].g / sums[cu].n),
            b: Math.round(sums[cu].b / sums[cu].n)
          };
        }
      }
    }
    return centers;
  }

  /* ---------- 图纸页 ---------- */
  function renderGrid(b) {
    setTitle('拼豆图纸');
    var W = st.gridW, H = st.gridH;
    cv.width = W * CELL; cv.height = H * CELL;
    drawGrid();
    var wrap = document.createElement('div');
    wrap.className = 'bd-cvwrap';
    wrap.id = 'bd-gridwrap';
    wrap.appendChild(cv);
    b.appendChild(wrap);

    var pal = document.createElement('div');
    pal.className = 'bd-palette';
    pal.id = 'bd-pal';
    st.palette.forEach(function (hex, i) {
      var sw = document.createElement('button');
      sw.className = 'bd-sw' + (st.selectedColor === i ? ' on' : '');
      sw.type = 'button';
      sw.style.background = hex;
      sw.title = hex + ' · ' + st.counts[i] + ' 颗';
      sw.setAttribute('data-i', i);
      sw.innerHTML = '<i>' + st.counts[i] + '</i>';
      pal.appendChild(sw);
    });
    b.appendChild(pal);

    var bar = document.createElement('div');
    bar.className = 'bd-bar';
    bar.innerHTML =
      '<button class="bd-btn" id="bd-play" type="button">和' + esc(partnerName()) + '一起拼</button>' +
      '<button class="bd-btn ghost" id="bd-mat" type="button">材料清单</button>' +
      '<button class="bd-btn ghost" id="bd-export" type="button">导出图纸</button>' +
      '<button class="bd-btn ghost" id="bd-num" type="button">' + (st.showNumbers ? '隐藏编号' : '显示编号') + '</button>' +
      '<button class="bd-btn ghost" id="bd-zoombtn" type="button">放大查看</button>';
    b.appendChild(bar);

    b.querySelectorAll('#bd-pal .bd-sw').forEach(function (sw) {
      sw.addEventListener('click', function () {
        var i = parseInt(sw.getAttribute('data-i'), 10);
        st.selectedColor = (st.selectedColor === i) ? -1 : i;
        b.querySelectorAll('#bd-pal .bd-sw').forEach(function (x) { x.classList.remove('on'); });
        if (st.selectedColor >= 0) sw.classList.add('on');
      });
    });
    cv.addEventListener('pointerdown', onGridPointerDown);
    b.querySelector('#bd-play').addEventListener('click', startPlay);
    b.querySelector('#bd-mat').addEventListener('click', showMaterials);
    b.querySelector('#bd-export').addEventListener('click', exportGrid);
    b.querySelector('#bd-num').addEventListener('click', function () { st.showNumbers = !st.showNumbers; drawGrid(); render(); });
    b.querySelector('#bd-zoombtn').addEventListener('click', function () {
      var wp = b.querySelector('#bd-gridwrap');
      wp.classList.toggle('zoom');
    });
  }

  function onGridPointerDown(e) {
    var hit = hitTest(e, cv);
    if (!hit) return;
    var idx = hit.row * st.gridW + hit.col;
    if (st.selectedColor < 0) { notify('先在下方选一个颜色，再点格子改色'); return; }
    if (st.cells[idx] === st.selectedColor) return;
    var old = st.cells[idx];
    st.cells[idx] = st.selectedColor;
    st.counts[old] = Math.max(0, st.counts[old] - 1);
    st.counts[st.selectedColor]++;
    drawGrid();
    refreshPaletteCounts();
  }

  function refreshPaletteCounts() {
    var pal = root.querySelector('#bd-pal');
    if (!pal) return;
    pal.querySelectorAll('.bd-sw').forEach(function (sw) {
      var i = parseInt(sw.getAttribute('data-i'), 10);
      sw.innerHTML = '<i>' + st.counts[i] + '</i>';
    });
  }

  function drawGrid() {
    var W = st.gridW, H = st.gridH;
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, cv.width, cv.height);
    for (var y = 0; y < H; y++) {
      for (var x = 0; x < W; x++) {
        var i = y * W + x;
        ctx.fillStyle = st.palette[st.cells[i]] || '#ffffff';
        ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
      }
    }
    if (st.showGrid) {
      ctx.strokeStyle = 'rgba(0,0,0,.13)';
      ctx.lineWidth = 1;
      for (var gx = 0; gx <= W; gx++) {
        ctx.beginPath(); ctx.moveTo(gx * CELL + .5, 0); ctx.lineTo(gx * CELL + .5, cv.height); ctx.stroke();
      }
      for (var gy = 0; gy <= H; gy++) {
        ctx.beginPath(); ctx.moveTo(0, gy * CELL + .5); ctx.lineTo(cv.width, gy * CELL + .5); ctx.stroke();
      }
    }
    if (st.showNumbers) {
      ctx.font = Math.round(CELL * 0.52) + 'px ui-monospace,monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (var ny = 0; ny < H; ny++) {
        for (var nx = 0; nx < W; nx++) {
          var ni = ny * W + nx;
          var hex = st.palette[st.cells[ni]];
          var rgb = hex2rgb(hex);
          var lum = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
          ctx.fillStyle = lum > 150 ? 'rgba(0,0,0,.55)' : 'rgba(255,255,255,.85)';
          ctx.fillText(String(st.cells[ni] + 1), nx * CELL + CELL / 2, ny * CELL + CELL / 2);
        }
      }
    }
  }

  function hitTest(e, canvas) {
    var rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    var x = (e.clientX - rect.left) * (canvas.width / rect.width);
    var y = (e.clientY - rect.top) * (canvas.height / rect.height);
    var col = Math.floor(x / CELL), row = Math.floor(y / CELL);
    if (col < 0 || row < 0 || col >= st.gridW || row >= st.gridH) return null;
    return { col: col, row: row };
  }

  /* ---------- 材料清单 ---------- */
  function showMaterials() {
    var total = 0;
    st.counts.forEach(function (c) { total += c; });
    var rows = st.palette.map(function (hex, i) {
      return '<div class="bd-mat-row"><span class="bd-dot" style="background:' + hex + '"></span>' +
        '<span class="bd-mat-name">' + (i + 1) + ' · ' + hex.toUpperCase() + '</span>' +
        '<span class="bd-mat-num">' + st.counts[i] + ' 颗</span></div>';
    }).join('');
    openSheet('材料清单（共 ' + total + ' 颗 / ' + st.palette.length + ' 色）', rows);
  }

  function openSheet(title, innerHtml) {
    var old = root.querySelector('.bd-sheet');
    if (old) old.remove();
    var sh = document.createElement('div');
    sh.className = 'bd-sheet';
    sh.innerHTML = '<div class="bd-sheet-in"><h3>' + esc(title) + '</h3>' + innerHtml +
      '<div class="bd-bar" style="margin-top:14px"><button class="bd-btn ghost" type="button" id="bd-close-sheet">关闭</button></div></div>';
    root.appendChild(sh);
    sh.addEventListener('click', function (e) { if (e.target === sh) sh.remove(); });
    sh.querySelector('#bd-close-sheet').addEventListener('click', function () { sh.remove(); });
    return sh;
  }

  /* ---------- 导出图纸 ---------- */
  function exportGrid() {
    var W = st.gridW, H = st.gridH;
    var px = 22, pad = 28, legendH = 0;
    var cols = Math.min(st.palette.length, 6);
    var rowsL = Math.ceil(st.palette.length / cols);
    var legendItemW = 132, legendItemH = 30;
    legendH = 62 + rowsL * legendItemH;
    var cw = Math.max(W * px + pad * 2, cols * legendItemW + pad * 2);
    var ch = H * px + pad * 2 + legendH;

    var out = document.createElement('canvas');
    out.width = cw; out.height = ch;
    var o = out.getContext('2d');
    o.fillStyle = '#ffffff';
    o.fillRect(0, 0, cw, ch);

    // 标题
    o.fillStyle = '#2b1a3d';
    o.font = 'bold 22px -apple-system,"PingFang SC","Microsoft YaHei",sans-serif';
    o.textAlign = 'left'; o.textBaseline = 'alphabetic';
    o.fillText('拼豆图纸 · ' + W + '×' + H + ' · ' + st.palette.length + ' 色', pad, 34);

    // 网格
    var ox = Math.round((cw - W * px) / 2);
    var oy = pad + 18;
    for (var y = 0; y < H; y++) {
      for (var x = 0; x < W; x++) {
        var i = y * W + x;
        o.fillStyle = st.palette[st.cells[i]] || '#fff';
        o.fillRect(ox + x * px, oy + y * px, px, px);
      }
    }
    o.strokeStyle = 'rgba(0,0,0,.18)';
    o.lineWidth = 1;
    for (var gx = 0; gx <= W; gx++) {
      o.beginPath(); o.moveTo(ox + gx * px + .5, oy); o.lineTo(ox + gx * px + .5, oy + H * px); o.stroke();
    }
    for (var gy = 0; gy <= H; gy++) {
      o.beginPath(); o.moveTo(ox, oy + gy * px + .5); o.lineTo(ox + W * px, oy + gy * px + .5); o.stroke();
    }
    // 编号
    o.font = Math.round(px * 0.46) + 'px ui-monospace,monospace';
    o.textAlign = 'center'; o.textBaseline = 'middle';
    for (var ny = 0; ny < H; ny++) {
      for (var nx = 0; nx < W; nx++) {
        var ni = ny * W + nx;
        var rgb = hex2rgb(st.palette[st.cells[ni]]);
        var lum = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
        o.fillStyle = lum > 150 ? 'rgba(0,0,0,.5)' : 'rgba(255,255,255,.9)';
        o.fillText(String(st.cells[ni] + 1), ox + nx * px + px / 2, oy + ny * px + px / 2);
      }
    }

    // 图例
    var ly = oy + H * px + 34;
    o.textAlign = 'left'; o.textBaseline = 'middle';
    o.fillStyle = '#2b1a3d';
    o.font = 'bold 15px -apple-system,"PingFang SC",sans-serif';
    o.fillText('材料清单', pad, ly - 12);
    var total = 0; st.counts.forEach(function (c) { total += c; });
    o.font = '13px -apple-system,"PingFang SC",sans-serif';
    o.fillStyle = '#666';
    o.textAlign = 'right';
    o.fillText('共 ' + total + ' 颗', cw - pad, ly - 12);
    o.textAlign = 'left';
    st.palette.forEach(function (hex, i) {
      var col = i % cols, row = Math.floor(i / cols);
      var lx = pad + col * legendItemW;
      var lyy = ly + 12 + row * legendItemH;
      o.fillStyle = hex;
      o.fillRect(lx, lyy, 18, 18);
      o.strokeStyle = 'rgba(0,0,0,.18)';
      o.lineWidth = 1;
      o.strokeRect(lx + .5, lyy + .5, 18, 18);
      o.fillStyle = '#333';
      o.font = '12px ui-monospace,monospace';
      o.textBaseline = 'middle';
      o.fillText((i + 1) + '  ' + st.counts[i] + '颗', lx + 24, lyy + 9);
    });

    // 水印
    o.fillStyle = 'rgba(120,90,150,.75)';
    o.font = '12px -apple-system,"PingFang SC",sans-serif';
    o.textAlign = 'center';
    o.textBaseline = 'alphabetic';
    o.fillText('梦角 · 拼豆工坊', cw / 2, ch - 10);

    st.previewDataUrl = out.toDataURL('image/png');
    var sh = openSheet('图纸已生成', '<img class="bd-preview" src="' + st.previewDataUrl + '">' +
      '<div style="font-size:12px;color:#cbb8e0;text-align:center;margin-top:10px;">长按图片可保存到相册</div>' +
      '<div class="bd-bar" style="margin-top:12px"><button class="bd-btn" id="bd-share-img" type="button">分享</button>' +
      '<button class="bd-btn ghost" id="bd-print" type="button">打印</button></div>');
    var shareBtn = sh.querySelector('#bd-share-img');
    if (shareBtn) {
      shareBtn.addEventListener('click', function () { shareImage(st.previewDataUrl); });
    }
    sh.querySelector('#bd-print').addEventListener('click', function () {
      var w = window.open('', '_blank');
      if (!w) { notify('长按图片保存后打印也可以'); return; }
      w.document.write('<html><head><title>拼豆图纸</title><style>body{margin:0}img{width:100%}</style></head><body><img src="' + st.previewDataUrl + '"><script>window.onload=function(){setTimeout(function(){window.print()},300)}<\/script></body></html>');
      w.document.close();
    });
  }

  function shareImage(dataUrl) {
    try {
      if (navigator.share) {
        var arr = dataUrl.split(',');
        var mime = arr[0].match(/:(.*?);/)[1];
        var bin = atob(arr[1]);
        var u8 = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
        var blob = new Blob([u8], { type: mime });
        var file = new File([blob], '拼豆图纸.png', { type: mime });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          navigator.share({ files: [file], title: '拼豆图纸' });
          return;
        }
      }
      notify('长按图片可以保存或分享');
    } catch (e) { notify('长按图片可以保存或分享'); }
  }

  /* ---------- 一起拼豆：开始 ---------- */
  function startPlay() {
    var W = st.gridW, H = st.gridH;
    st.placed = new Uint8Array(W * H);
    st.placedCount = 0;
    st.anim = {};
    cv.width = W * CELL; cv.height = H * CELL;
    go('play');
  }

  function totalCells() { return st.gridW * st.gridH; }

  function renderPlay(b) {
    setTitle('和' + partnerName() + '一起拼豆');
    var name = partnerName();
    b.innerHTML =
      '<div class="bd-bubble"><div class="av">🌙</div><div id="bd-say">' + esc(name) + '：我们一起把这幅拼完吧，我先帮你放几颗～</div></div>' +
      '<div class="bd-row" style="justify-content:space-between"><span class="bd-lbl" style="min-width:0">进度</span>' +
        '<span class="bd-val" id="bd-progtxt" style="min-width:0">0 / ' + totalCells() + '</span></div>' +
      '<div class="bd-prog"><i id="bd-progbar"></i></div>';
    var wrap = document.createElement('div');
    wrap.className = 'bd-cvwrap';
    wrap.id = 'bd-playwrap';
    wrap.appendChild(cv);
    b.appendChild(wrap);
    var bar = document.createElement('div');
    bar.className = 'bd-bar';
    bar.innerHTML =
      '<button class="bd-btn" id="bd-helper" type="button">' + (st.helper ? '梦角正在帮你拼' : '让梦角帮我拼') + '</button>' +
      '<button class="bd-btn ghost" id="bd-autofill" type="button">一键拼完</button>' +
      '<button class="bd-btn ghost" id="bd-ironbtn" type="button">我去熨烫</button>';
    b.appendChild(bar);

    cv.addEventListener('pointerdown', onPlayPointerDown);
    cv.addEventListener('pointermove', onPlayPointerMove);

    b.querySelector('#bd-helper').addEventListener('click', function () {
      st.helper = !st.helper;
      var btn = b.querySelector('#bd-helper');
      btn.textContent = st.helper ? '梦角正在帮你拼' : '让梦角帮我拼';
      if (st.helper) startHelper(); else stopHelper();
    });
    b.querySelector('#bd-autofill').addEventListener('click', autoFill);
    b.querySelector('#bd-ironbtn').addEventListener('click', goIron);

    drawPlay(0);
    if (st.helper) startHelper();
  }

  var playDrag = { on: false };
  function onPlayPointerDown(e) {
    playDrag.on = true;
    placeByEvent(e);
  }
  function onPlayPointerMove(e) {
    if (!playDrag.on) return;
    placeByEvent(e);
  }
  function placeByEvent(e) {
    var hit = hitTest(e, cv);
    if (!hit) return;
    placeCell(hit.col, hit.row, true);
  }
  document.addEventListener('pointerup', function () { playDrag.on = false; });

  function placeCell(col, row, byUser) {
    if (!st.placed) return;
    var idx = row * st.gridW + col;
    if (st.placed[idx]) return;
    st.placed[idx] = 1;
    st.placedCount++;
    st.anim[idx] = performance.now();
    popSound(560 + Math.random() * 260);
    updateProg();
    drawPlay(performance.now());
    if (st.placedCount >= totalCells()) {
      stopHelper();
      setTimeout(goIron, 420);
    }
  }

  function updateProg() {
    var t = root.querySelector('#bd-progtxt');
    if (t) t.textContent = st.placedCount + ' / ' + totalCells();
    var bar = root.querySelector('#bd-progbar');
    if (bar) bar.style.width = (st.placedCount / totalCells() * 100).toFixed(1) + '%';
  }

  function drawPlay(now) {
    if (!st.placed) return;
    var W = st.gridW, H = st.gridH;
    ctx.clearRect(0, 0, cv.width, cv.height);
    // 底：淡色提示
    for (var y = 0; y < H; y++) {
      for (var x = 0; x < W; x++) {
        var i = y * W + x;
        var hex = st.palette[st.cells[i]];
        var rgb = hex2rgb(hex);
        ctx.fillStyle = 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',0.16)';
        ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
      }
    }
    // 网格
    ctx.strokeStyle = 'rgba(120,90,150,.10)';
    ctx.lineWidth = 1;
    for (var gx = 0; gx <= W; gx++) { ctx.beginPath(); ctx.moveTo(gx * CELL + .5, 0); ctx.lineTo(gx * CELL + .5, cv.height); ctx.stroke(); }
    for (var gy = 0; gy <= H; gy++) { ctx.beginPath(); ctx.moveTo(0, gy * CELL + .5); ctx.lineTo(cv.width, gy * CELL + .5); ctx.stroke(); }
    // 已放豆子
    for (var py = 0; py < H; py++) {
      for (var px = 0; px < W; px++) {
        var pi = py * W + px;
        if (!st.placed[pi]) continue;
        var scale = 1;
        var t0 = st.anim[pi];
        if (t0) {
          var el = (now - t0) / 220;
          if (el < 1) scale = 1.25 - 0.25 * el;
          else delete st.anim[pi];
        }
        drawBead(px * CELL, py * CELL, st.palette[st.cells[pi]], scale);
      }
    }
    // 有动画时继续帧
    var hasAnim = false;
    for (var key in st.anim) { if (st.anim.hasOwnProperty(key)) { hasAnim = true; break; } }
    if (hasAnim && st.screen === 'play') {
      cancelAnimationFrame(st.rafId);
      st.rafId = requestAnimationFrame(drawPlay);
    }
  }

  function drawBead(x, y, hex, scale) {
    scale = scale || 1;
    var rgb = hex2rgb(hex);
    var cx = x + CELL / 2, cy = y + CELL / 2;
    var r = (CELL / 2 - 1.2) * scale;
    // 主体
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgb(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ')';
    ctx.fill();
    // 中央孔
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(1, r * 0.22), 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    ctx.fill();
    // 高光
    ctx.beginPath();
    ctx.arc(cx - r * 0.28, cy - r * 0.28, Math.max(0.8, r * 0.26), 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,.45)';
    ctx.fill();
  }

  /* 梦角代拼 */
  function startHelper() {
    stopHelper();
    var empty = [];
    for (var i = 0; i < totalCells(); i++) if (!st.placed[i]) empty.push(i);
    if (!empty.length) return;
    st.helperTimer = setInterval(function () {
      if (st.screen !== 'play') { stopHelper(); return; }
      var todo = [];
      for (var j = 0; j < totalCells(); j++) if (!st.placed[j]) todo.push(j);
      if (!todo.length) { stopHelper(); return; }
      var pick = todo[Math.floor(Math.random() * todo.length)];
      var col = pick % st.gridW, row = Math.floor(pick / st.gridW);
      placeCell(col, row, false);
      sayHelper();
    }, 900);
  }
  function stopHelper() {
    if (st.helperTimer) { clearInterval(st.helperTimer); st.helperTimer = null; }
  }
  var HELPER_LINES = [
    '我帮你放这颗～', '这里放这个颜色对不对？', '一起拼好快呀', '这颗我来，你歇一下',
    '我们配合得真好', '快拼完啦，加油', '这个颜色好好看', '拼完想把它带回家'
  ];
  function sayHelper() {
    var el = root.querySelector('#bd-say');
    if (!el) return;
    if (Math.random() < 0.45) {
      el.textContent = partnerName() + '：' + HELPER_LINES[Math.floor(Math.random() * HELPER_LINES.length)];
    }
  }

  function autoFill() {
    if (!window.confirm('直接拼完剩下的格子吗？')) return;
    stopHelper();
    for (var i = 0; i < totalCells(); i++) {
      if (!st.placed[i]) {
        st.placed[i] = 1;
        st.placedCount++;
      }
    }
    updateProg();
    drawPlay(0);
    setTimeout(goIron, 400);
  }

  /* ---------- 熨烫 ---------- */
  function goIron() {
    if (!st.palette.length) { go('home'); return; }
    st.screen = 'iron';
    stopHelper();
    render();
  }

  function renderIron(b) {
    setTitle('熨烫中');
    if (!st.placed) { st.placed = new Uint8Array(totalCells()); for (var i = 0; i < totalCells(); i++) st.placed[i] = 1; }
    cv.width = st.gridW * CELL; cv.height = st.gridH * CELL;
    var wrap = document.createElement('div');
    wrap.className = 'bd-cvwrap';
    wrap.style.position = 'relative';
    wrap.appendChild(cv);
    var fx = document.createElement('div');
    fx.className = 'bd-iron';
    fx.innerHTML = '<div class="beam"></div><div class="ir">🔥</div>';
    wrap.appendChild(fx);
    b.appendChild(wrap);
    var tip = document.createElement('div');
    tip.className = 'bd-center';
    tip.innerHTML = '<div class="bd-big">正在熨烫…</div>把豆子熨平后就会融成一体啦';
    b.appendChild(tip);

    // 逐帧：扫过处融化
    var start = performance.now();
    var dur = 2600;
    (function frame() {
      var t = clamp((performance.now() - start) / dur, 0, 1);
      drawMelt(t);
      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        tip.innerHTML = '<div class="bd-big">冷却中…</div>马上就好';
        setTimeout(function () { finishWork(); }, 900);
      }
    })();
  }

  function drawMelt(t) {
    var W = st.gridW, H = st.gridH;
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, cv.width, cv.height);
    var sweepX = t * W;
    for (var y = 0; y < H; y++) {
      for (var x = 0; x < W; x++) {
        var i = y * W + x;
        var rgb = hex2rgb(st.palette[st.cells[i]]);
        var melted = x <= sweepX ? clamp((sweepX - x) / 3, 0, 1) : 0;
        // 融化后：整格铺满、圆角变小、颜色变亮一点
        var inset = (1 - melted) * 1.2;
        var rr = Math.round(rgb.r + (255 - rgb.r) * 0.12 * melted);
        var gg = Math.round(rgb.g + (255 - rgb.g) * 0.12 * melted);
        var bb = Math.round(rgb.b + (255 - rgb.b) * 0.12 * melted);
        ctx.fillStyle = 'rgb(' + rr + ',' + gg + ',' + bb + ')';
        ctx.fillRect(x * CELL + inset, y * CELL + inset, CELL - inset * 2, CELL - inset * 2);
        // 未融化的豆子加高光孔
        if (melted < 0.5) {
          ctx.beginPath();
          ctx.arc(x * CELL + CELL / 2, y * CELL + CELL / 2, CELL * 0.12, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,255,255,.5)';
          ctx.fill();
        }
      }
    }
    // 冷光
    if (t > 0.92) {
      ctx.fillStyle = 'rgba(255,255,255,' + ((t - 0.92) / 0.08 * 0.18) + ')';
      ctx.fillRect(0, 0, cv.width, cv.height);
    }
  }

  /* ---------- 成品 ---------- */
  function finishWork() {
    var thumb = cv.toDataURL('image/png');
    var work = {
      id: uid(),
      date: new Date().toLocaleDateString('zh-CN'),
      w: st.gridW, h: st.gridH,
      colors: st.palette.length,
      total: totalCells(),
      thumb: thumb,
      palette: st.palette.slice(),
      cells: st.cells.slice()
    };
    st.works.unshift(work);
    st.works = st.works.slice(0, 24);
    saveWorks();
    st.currentWork = work;
    go('done');
  }

  function renderDone(b) {
    setTitle('成品出炉');
    var w = st.currentWork || (st.works[0] || null);
    if (!w) { b.innerHTML = '<div class="bd-center">还没有成品</div>'; return; }
    b.innerHTML =
      '<div class="bd-hero" style="padding:18px 8px 8px">' +
        '<div class="big">✨ 拼好啦</div>' +
        '<div class="sub">' + w.w + '×' + w.h + ' · ' + w.colors + ' 色 · ' + w.total + ' 颗豆子</div>' +
      '</div>' +
      '<div class="bd-tile" style="padding:10px;"><img class="bd-preview" src="' + w.thumb + '"></div>' +
      '<div class="bd-bar">' +
        '<button class="bd-btn" id="bd-save" type="button">保存成品</button>' +
        '<button class="bd-btn ghost" id="bd-share2" type="button">分享</button>' +
        '<button class="bd-btn ghost" id="bd-again" type="button">再做一张</button>' +
      '</div>' +
      '<div style="text-align:center;font-size:12px;color:#b9a4ce;margin-top:10px;">长按图片可保存到相册</div>';
    b.querySelector('#bd-save').addEventListener('click', function () { downloadDataUrl(w.thumb, '拼豆成品.png'); });
    b.querySelector('#bd-share2').addEventListener('click', function () { shareImage(w.thumb); });
    b.querySelector('#bd-again').addEventListener('click', function () { go('home'); });
  }

  function downloadDataUrl(dataUrl, filename) {
    try {
      var a = document.createElement('a');
      a.href = dataUrl; a.download = filename || 'mengjiao.png';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      notify('已保存到下载目录');
    } catch (e) { notify('长按图片可保存到相册'); }
  }

  /* ---------- 作品存储 ---------- */
  function loadWorks() {
    if (typeof localforage === 'undefined') return Promise.resolve();
    return localforage.getItem(LB_WORKS).then(function (arr) {
      st.works = Array.isArray(arr) ? arr : [];
    }).catch(function () { st.works = []; });
  }
  function saveWorks() {
    if (typeof localforage === 'undefined') return;
    localforage.setItem(LB_WORKS, st.works).catch(function () {});
  }
  function openWork(id) {
    var w = null;
    st.works.forEach(function (it) { if (it.id === id) w = it; });
    if (!w) return;
    st.gridW = w.w; st.gridH = w.h;
    st.palette = w.palette.slice(); st.cells = w.cells.slice();
    st.counts = new Array(st.palette.length).fill(0);
    st.cells.forEach(function (ci) { st.counts[ci] = (st.counts[ci] || 0) + 1; });
    st.currentWork = w;
    go('done');
  }

  /* ---------- 示例图纸 ---------- */
  function makeDemo() {
    var W = 48, H = 48;
    var palette = ['#ff8fb1', '#ffd166', '#8ecae6', '#a97bff', '#ffffff'];
    var cells = new Array(W * H);
    for (var y = 0; y < H; y++) {
      for (var x = 0; x < W; x++) {
        var dx = x - W / 2, dy = y - H / 2;
        var d = Math.sqrt(dx * dx + dy * dy);
        var idx;
        if (d < 9) idx = 0;
        else if (d < 13) idx = 1;
        else if (d < 16) idx = 2;
        else if (d < 19) idx = 3;
        else idx = 4;
        cells[y * W + x] = idx;
      }
    }
    st.gridW = W; st.gridH = H;
    st.palette = palette; st.cells = cells;
    st.counts = new Array(palette.length).fill(0);
    cells.forEach(function (ci) { st.counts[ci]++; });
    st.placed = null; st.placedCount = 0; st.selectedColor = -1;
    go('grid');
  }

  /* ---------- 打开 / 关闭 ---------- */
  function open() {
    if (!root) {
      try { buildRoot(); } catch (e) { console.error('[Bead] buildRoot failed:', e); return; }
    }
    st.screen = 'home';
    root.classList.add('show');
    document.body.style.overflow = 'hidden';
    loadWorks().then(function () {
      try { render(); } catch (e) {
        console.error('[Bead] render failed:', e);
        body().innerHTML = '<div class="bd-center">加载出错了，请退出重进 App 再试一次</div>';
      }
    }).catch(function () {
      try { render(); } catch (e) {}
    });
  }
  function close() {
    if (!root) return;
    stopHelper();
    cancelAnimationFrame(st.rafId);
    root.classList.remove('show');
    document.body.style.overflow = '';
  }

  window.XBead = { open: open, close: close };
})();
