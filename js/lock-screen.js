/**
 * 仿手机锁屏 —— 数字密码 / 手势九宫格 双模式
 * 特性：
 *  - 锁屏界面：大时间 + 日期 + 上滑解锁
 *  - 数字密码（4/6 位可选）、手势九宫格（3x3）
 *  - 首次使用引导设置密码 + 密保问题
 *  - 连续输错 5 次 → 密保问题找回 → 重设密码
 *  - 锁屏设置：切换解锁方式 / 修改密码 / 关闭锁屏
 * 数据保存在 localStorage，覆盖安装不丢
 */
(function () {
    'use strict';

    var CFG_KEY = 'zy_lock_config_v1';
    var BG_KEY = 'zy_lock_bg_v1';
    var MAX_FAIL = 5;
    var RELOCK_AFTER = 60 * 1000; // 切后台超过 60 秒后重新锁屏

    var cfg = readCfg();
    var root = null;
    var mainEl = null;
    var panelEl = null;
    var sheetEl = null;
    var clockTimer = null;

    var failCount = 0;
    var pinInput = '';
    var patternPath = [];
    var drawing = false;
    var pendingAction = 'unlock'; // unlock | settings
    var setupData = null;
    var isUnlocked = false;
    var hiddenAt = 0;

    // ────────── 存储 ──────────
    function readCfg() {
        try {
            var raw = localStorage.getItem(CFG_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) { return null; }
    }
    function writeCfg() {
        try { localStorage.setItem(CFG_KEY, JSON.stringify(cfg)); } catch (e) {}
    }

    // ────────── 工具 ──────────
    function el(tag, cls, html) {
        var n = document.createElement(tag);
        if (cls) n.className = cls;
        if (html != null) n.innerHTML = html;
        return n;
    }
    function pad2(n) { return n < 10 ? '0' + n : '' + n; }
    function timeText() {
        var d = new Date();
        return pad2(d.getHours()) + ':' + pad2(d.getMinutes());
    }
    function dateText() {
        var d = new Date();
        var week = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()];
        return (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + week;
    }

    // 农历日期（基于浏览器内置中国农历日历，失败则不显示）
    function lunarText() {
        try {
            var fmt = new Intl.DateTimeFormat('zh-CN-u-ca-chinese', {
                month: 'long',
                day: 'numeric'
            });
            var parts = fmt.formatToParts(new Date());
            var month = '', day = '';
            for (var i = 0; i < parts.length; i++) {
                if (parts[i].type === 'month') month = parts[i].value;
                if (parts[i].type === 'day') day = parts[i].value;
            }
            if (!month || !day) return '';
            return '农历' + month + day;
        } catch (e) {
            return '';
        }
    }

    // 应用自定义锁屏背景
    function applyBg() {
        var data = null;
        try { data = localStorage.getItem(BG_KEY); } catch (e) {}
        if (data) {
            root.style.backgroundImage = 'url(' + data + ')';
            root.style.backgroundSize = 'cover';
            root.style.backgroundPosition = 'center';
            root.classList.add('ls-has-bg');
        } else {
            root.style.backgroundImage = '';
            root.classList.remove('ls-has-bg');
        }
    }

    // 图片压缩后返回 dataURL（避免 localStorage 撑爆）
    function compressImage(file, maxW, quality) {
        return new Promise(function (resolve, reject) {
            var reader = new FileReader();
            reader.onload = function () {
                var img = new Image();
                img.onload = function () {
                    var scale = Math.min(1, maxW / img.width);
                    var w = Math.round(img.width * scale);
                    var h = Math.round(img.height * scale);
                    var canvas = document.createElement('canvas');
                    canvas.width = w;
                    canvas.height = h;
                    var ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, w, h);
                    resolve(canvas.toDataURL('image/jpeg', quality || 0.72));
                };
                img.onerror = reject;
                img.src = reader.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // ────────── 构建 DOM ──────────
    function buildRoot() {
        root = el('div');
        root.id = 'zy-lock-screen';
        root.innerHTML =
            '<div class="ls-glow ls-glow-1"></div>' +
            '<div class="ls-glow ls-glow-2"></div>' +
            '<div class="ls-main" id="lsMain">' +
            '  <div class="ls-lock-icon"><svg viewBox="0 0 24 24"><rect x="4" y="10" width="16" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg></div>' +
            '  <div class="ls-time" id="lsTime">09:41</div>' +
            '  <div class="ls-date" id="lsDate">1月1日 周一</div>' +
            '  <div class="ls-lunar" id="lsLunar"></div>' +
            '  <div class="ls-hint"><svg viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7"/></svg><span>上滑解锁</span></div>' +
            '</div>' +
            '<div class="ls-panel" id="lsPanel"></div>' +
            '<div class="ls-sheet" id="lsSheet"></div>';
        document.body.insertBefore(root, document.body.firstChild);

        mainEl = root.querySelector('#lsMain');
        panelEl = root.querySelector('#lsPanel');
        sheetEl = root.querySelector('#lsSheet');
    }

    // ────────── 主界面 ──────────
    function startClock() {
        var t = root.querySelector('#lsTime');
        var d = root.querySelector('#lsDate');
        var l = root.querySelector('#lsLunar');
        function tick() {
            if (t) t.textContent = timeText();
            if (d) d.textContent = dateText();
            if (l) l.textContent = lunarText();
        }
        tick();
        clockTimer = setInterval(tick, 1000);
    }

    function bindSwipe() {
        var startY = 0;
        var moved = 0;
        mainEl.addEventListener('touchstart', function (e) {
            startY = e.touches[0].clientY;
            moved = 0;
        }, { passive: true });
        mainEl.addEventListener('touchmove', function (e) {
            moved = e.touches[0].clientY - startY;
            if (moved < 0) {
                var shift = Math.max(moved, -120);
                mainEl.style.transform = 'translateY(' + (shift * 0.35) + 'px)';
            }
        }, { passive: true });
        mainEl.addEventListener('touchend', function () {
            mainEl.style.transform = '';
            if (moved < -60) {
                openUnlockPanel();
            }
        });
        // 点击也可进入
        mainEl.addEventListener('click', function () {
            openUnlockPanel();
        });
    }

    // ────────── 解锁面板 ──────────
    function openUnlockPanel() {
        mainEl.classList.add('ls-swiped-up');
        panelEl.classList.add('ls-active');
        failCount = 0;
        if (!cfg) {
            renderSetupWelcome();
            return;
        }
        if (cfg.type === 'pattern') renderPatternPanel();
        else renderPinPanel();
    }

    function closeUnlockPanel() {
        panelEl.classList.remove('ls-active');
        mainEl.classList.remove('ls-swiped-up');
        pinInput = '';
        patternPath = [];
    }

    function panelHeader(title) {
        var time = el('div', 'ls-panel-time', timeText());
        var hint = el('div', 'ls-panel-hint', title || '');
        hint.id = 'lsPanelHint';
        return { time: time, hint: hint };
    }

    // ───── 数字密码 ─────
    function renderPinPanel() {
        panelEl.innerHTML = '';
        var len = (cfg && cfg.pinLen) || 4;
        pinInput = '';

        var h = panelHeader(cfg && cfg.type === 'pin' ? '输入密码' : '输入数字密码');
        panelEl.appendChild(h.time);

        var dots = el('div', 'ls-pin-dots');
        dots.id = 'lsPinDots';
        for (var i = 0; i < len; i++) dots.appendChild(el('span', 'ls-pin-dot'));
        panelEl.appendChild(dots);
        panelEl.appendChild(h.hint);

        var keypad = el('div', 'ls-keypad');
        var keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];
        keys.forEach(function (k) {
            var btn = el('button', 'ls-key');
            if (k === '') {
                btn.className += ' ls-key-empty';
            } else if (k === 'del') {
                btn.className += ' ls-key-icon';
                btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M20 5H9l-7 7 7 7h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z"/><path d="M15 9l-6 6M9 9l6 6"/></svg>';
                btn.onclick = function () { onPinKey('del'); };
            } else {
                btn.textContent = k;
                btn.onclick = function () { onPinKey(k); };
            }
            keypad.appendChild(btn);
        });
        panelEl.appendChild(keypad);
        panelEl.appendChild(makeSettingsLink());
        panelEl.appendChild(makeForgotLink());
    }

    function onPinKey(key) {
        var len = (cfg && cfg.pinLen) || 4;
        var dots = panelEl.querySelector('#lsPinDots');
        if (!dots) return;
        if (key === 'del') {
            pinInput = pinInput.slice(0, -1);
        } else if (pinInput.length < len) {
            pinInput += key;
        }
        var items = dots.children;
        for (var i = 0; i < items.length; i++) {
            items[i].classList.toggle('filled', i < pinInput.length);
        }
        if (pinInput.length === len) {
            setTimeout(function () { submitPin(pinInput, dots); }, 120);
        }
    }

    function submitPin(value, dotsEl) {
        if (verify(value)) {
            handleVerified();
        } else {
            dotsEl.classList.add('ls-shake');
            setTimeout(function () { dotsEl.classList.remove('ls-shake'); }, 450);
            shakeHint();
            pinInput = '';
            var items = dotsEl.children;
            for (var i = 0; i < items.length; i++) items[i].classList.remove('filled');
            registerFail();
        }
    }

    // ───── 手势九宫格 ─────
    function renderPatternPanel() {
        panelEl.innerHTML = '';
        patternPath = [];

        var h = panelHeader('绘制解锁图案');
        panelEl.appendChild(h.time);

        var wrap = el('div', 'ls-pattern');
        wrap.id = 'lsPattern';
        var size = 250;
        var gap = (size - 58) / 2;
        for (var i = 0; i < 9; i++) {
            var row = Math.floor(i / 3);
            var col = i % 3;
            var dot = el('div', 'ls-dot');
            dot.dataset.idx = i;
            dot.style.left = (col * gap) + 'px';
            dot.style.top = (row * gap) + 'px';
            wrap.appendChild(dot);
        }
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'ls-pattern-svg');
        svg.setAttribute('viewBox', '0 0 250 250');
        var poly = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
        poly.setAttribute('points', '');
        svg.appendChild(poly);
        wrap.appendChild(svg);
        panelEl.appendChild(wrap);
        panelEl.appendChild(h.hint);

        bindPatternEvents(wrap, poly);
        panelEl.appendChild(makeSettingsLink());
        panelEl.appendChild(makeForgotLink());
    }

    function bindPatternEvents(wrap, poly) {
        function pointFromTouch(t) {
            var rect = wrap.getBoundingClientRect();
            return { x: t.clientX - rect.left, y: t.clientY - rect.top };
        }
        function dotAt(p) {
            var dotSize = 58;
            for (var i = 0; i < 9; i++) {
                var row = Math.floor(i / 3), col = i % 3;
                var gap = (250 - dotSize) / 2;
                var cx = col * gap + dotSize / 2;
                var cy = row * gap + dotSize / 2;
                var dist = Math.sqrt(Math.pow(p.x - cx, 2) + Math.pow(p.y - cy, 2));
                if (dist <= dotSize / 2 + 10) return i;
            }
            return -1;
        }
        function addPoint(idx) {
            if (patternPath.indexOf(idx) !== -1) return;
            patternPath.push(idx);
            var dots = wrap.querySelectorAll('.ls-dot');
            if (dots[idx]) dots[idx].classList.add('active');
            updatePolyline(poly);
        }
        function updatePolyline(poly) {
            var pts = patternPath.map(function (i) {
                var row = Math.floor(i / 3), col = i % 3;
                var gap = (250 - 58) / 2;
                return (col * gap + 29) + ',' + (row * gap + 29);
            });
            poly.setAttribute('points', pts.join(' '));
        }
        wrap.addEventListener('touchstart', function (e) {
            e.preventDefault();
            drawing = true;
            patternPath = [];
            wrap.querySelectorAll('.ls-dot').forEach(function (d) { d.classList.remove('active'); });
            var idx = dotAt(pointFromTouch(e.touches[0]));
            if (idx >= 0) addPoint(idx);
        }, { passive: false });
        wrap.addEventListener('touchmove', function (e) {
            if (!drawing) return;
            e.preventDefault();
            var idx = dotAt(pointFromTouch(e.touches[0]));
            if (idx >= 0) addPoint(idx);
        }, { passive: false });
        wrap.addEventListener('touchend', function (e) {
            if (!drawing) return;
            drawing = false;
            e.preventDefault();
            submitPattern(wrap);
        }, { passive: false });
    }

    function submitPattern(wrap) {
        var value = patternPath.join(',');
        if (value.length === 0) return;
        if (verify(value)) {
            handleVerified();
        } else {
            wrap.classList.add('ls-shake');
            setTimeout(function () { wrap.classList.remove('ls-shake'); }, 450);
            shakeHint();
            wrap.querySelectorAll('.ls-dot').forEach(function (d) { d.classList.remove('active'); });
            var poly = wrap.querySelector('polyline');
            if (poly) poly.setAttribute('points', '');
            patternPath = [];
            registerFail();
        }
    }

    // ────────── 校验 ──────────
    function verify(value) {
        if (!cfg) return false;
        if (cfg.type === 'pattern') return value === cfg.pattern;
        return value === cfg.pin;
    }

    function shakeHint() {
        var hint = panelEl.querySelector('#lsPanelHint');
        if (!hint) return;
        hint.classList.add('ls-error');
        hint.textContent = '密码错误，请重试';
        setTimeout(function () {
            if (hint) { hint.classList.remove('ls-error'); hint.textContent = '输入密码'; }
        }, 1400);
    }

    function registerFail() {
        failCount++;
        if (failCount >= MAX_FAIL) {
            var link = panelEl.querySelector('.ls-forgot-link');
            if (link) link.classList.add('ls-show');
        }
    }

    function makeSettingsLink() {
        var btn = el('button', 'ls-settings-link', '锁屏设置');
        btn.onclick = function () {
            pendingAction = 'settings';
            var hint = panelEl.querySelector('#lsPanelHint');
            if (hint) hint.textContent = '请先验证当前密码';
        };
        return btn;
    }

    // 连续输错后才显示的「忘记密码」入口
    function makeForgotLink() {
        var btn = el('button', 'ls-forgot-link', '忘记密码？');
        btn.onclick = function () {
            renderRecover();
        };
        return btn;
    }

    function handleVerified() {
        if (pendingAction === 'settings') {
            pendingAction = 'unlock';
            renderSettingsSheet();
            return;
        }
        unlockSuccess();
    }

    function unlockSuccess() {
        var mark = el('div', 'ls-success-mark ls-show',
            '<svg viewBox="0 0 24 24"><path d="M4 12.5l5.2 5.2L20 7"/></svg>');
        root.appendChild(mark);
        failCount = 0;
        setTimeout(function () {
            root.classList.add('ls-unlocking');
            isUnlocked = true;
            setTimeout(function () {
                root.classList.add('ls-hidden');
                if (clockTimer) { clearInterval(clockTimer); clockTimer = null; }
                if (typeof window.__zyOnUnlock === 'function') {
                    try { window.__zyOnUnlock(); } catch (e) {}
                }
            }, 430);
        }, 260);
    }

    // ────────── 引导设置 ──────────
    function showSheet(html) {
        sheetEl.innerHTML = html;
        sheetEl.classList.remove('ls-sheet-center');
        sheetEl.classList.add('ls-active');
        panelEl.classList.remove('ls-active');
    }
    function hideSheet(restore) {
        sheetEl.classList.remove('ls-active');
        sheetEl.innerHTML = '';
        // 取消类操作返回解锁界面
        if (restore && !isUnlocked) {
            if (cfg && cfg.type) {
                panelEl.classList.add('ls-active');
                if (cfg.type === 'pattern') renderPatternPanel();
                else renderPinPanel();
            }
        }
    }

    function renderSetupWelcome() {
        showSheet(
            '<div class="ls-sheet-title">设置锁屏</div>' +
            '<div class="ls-sheet-desc">给你的手机加一层锁屏，打开 App 时先看到时间和日期，输入密码才能进入。<br>密码只保存在本机，忘记可用密保问题找回。</div>' +
            '<button class="ls-btn-primary" id="lsSetupStart">开始设置</button>' +
            '<button class="ls-btn-ghost" id="lsSetupSkip">暂不设置</button>'
        );
        sheetEl.querySelector('#lsSetupStart').onclick = function () {
            setupData = {};
            renderSetupType();
        };
        sheetEl.querySelector('#lsSetupSkip').onclick = function () {
            cfg = { enabled: false };
            writeCfg();
            hideSheet();
            unlockSuccess();
        };
    }

    function renderSetupType() {
        showSheet(
            '<div class="ls-sheet-title">选择解锁方式</div>' +
            '<div class="ls-sheet-desc">之后可以在「锁屏设置」里随时切换。</div>' +
            '<button class="ls-option" data-t="pin"><span>数字密码<div class="ls-option-sub">4 位或 6 位数字，像真机一样</div></span><span class="ls-option-arrow">›</span></button>' +
            '<button class="ls-option" data-t="pattern"><span>手势图案<div class="ls-option-sub">九宫格连线，老安卓的手感</div></span><span class="ls-option-arrow">›</span></button>'
        );
        sheetEl.querySelectorAll('.ls-option').forEach(function (btn) {
            btn.onclick = function () {
                setupData.type = btn.dataset.t;
                if (setupData.type === 'pin') renderSetupPinLength();
                else renderSetupPattern(1);
            };
        });
    }

    function renderSetupPinLength() {
        showSheet(
            '<div class="ls-sheet-title">密码位数</div>' +
            '<div class="ls-sheet-desc">选择要用几位数字作为密码。</div>' +
            '<button class="ls-option" data-len="4"><span>4 位数字</span><span class="ls-option-arrow">›</span></button>' +
            '<button class="ls-option" data-len="6"><span>6 位数字</span><span class="ls-option-arrow">›</span></button>'
        );
        sheetEl.querySelectorAll('.ls-option').forEach(function (btn) {
            btn.onclick = function () {
                setupData.pinLen = parseInt(btn.dataset.len, 10);
                renderSetupPinInput(1, '', 0);
            };
        });
    }

    // 数字密码设置（step 1=首次输入, 2=确认输入, 3=重设）
    function renderSetupPinInput(step, firstValue, len) {
        var pinLen = len || setupData.pinLen || 4;
        var temp = '';
        var stage = step;

        sheetEl.innerHTML = '';
        sheetEl.classList.add('ls-active', 'ls-sheet-center');
        panelEl.classList.remove('ls-active');

        var title = el('div', 'ls-sheet-title', stage === 1 ? '设置密码' : '再次输入确认');
        var dots = el('div', 'ls-pin-dots');
        dots.style.marginTop = '24px';
        dots.style.marginBottom = '20px';
        var hint = el('div', 'ls-sheet-desc');
        hint.style.textAlign = 'center';
        hint.style.minHeight = '22px';
        var keypad = el('div', 'ls-keypad');
        keypad.style.marginTop = 'auto';
        keypad.style.marginBottom = '40px';

        ['1','2','3','4','5','6','7','8','9','','0','del'].forEach(function (k) {
            var b = el('button', 'ls-key');
            if (k === '') { b.className += ' ls-key-empty'; }
            else if (k === 'del') {
                b.className += ' ls-key-icon';
                b.innerHTML = '<svg viewBox="0 0 24 24"><path d="M20 5H9l-7 7 7 7h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z"/><path d="M15 9l-6 6M9 9l6 6"/></svg>';
                b.onclick = function () { temp = temp.slice(0, -1); paint(); };
            } else {
                b.textContent = k;
                b.onclick = function () {
                    if (temp.length < pinLen) temp += k;
                    paint();
                    if (temp.length === pinLen) setTimeout(function () { next(); }, 120);
                };
            }
            keypad.appendChild(b);
        });

        function paint() {
            dots.innerHTML = '';
            for (var i = 0; i < pinLen; i++) {
                var d = el('span', 'ls-pin-dot' + (i < temp.length ? ' filled' : ''));
                dots.appendChild(d);
            }
        }
        function next() {
            if (stage === 1) {
                renderSetupPinInput(2, temp, pinLen);
            } else {
                if (temp !== firstValue) {
                    hint.textContent = '两次输入不一致，请重新设置';
                    hint.style.color = '#ff7b7b';
                    setTimeout(function () { renderSetupPinInput(1, '', pinLen); }, 900);
                } else {
                    setupData.pin = temp;
                    setupData.pinLen = pinLen;
                    renderSetupSecurity();
                }
            }
        }

        paint();
        sheetEl.appendChild(title);
        sheetEl.appendChild(dots);
        sheetEl.appendChild(hint);
        sheetEl.appendChild(keypad);
    }

    // 手势设置
    function renderSetupPattern(step, firstValue) {
        var stage = step;
        var path = [];

        sheetEl.innerHTML = '';
        sheetEl.classList.add('ls-active', 'ls-sheet-center');
        panelEl.classList.remove('ls-active');

        var title = el('div', 'ls-sheet-title', stage === 1 ? '绘制解锁图案' : '再次绘制确认');
        title.style.marginBottom = '6px';
        var hint = el('div', 'ls-sheet-desc', '至少连接 4 个点');
        var wrap = el('div', 'ls-pattern');
        wrap.style.margin = 'auto';
        for (var i = 0; i < 9; i++) {
            var row = Math.floor(i / 3), col = i % 3;
            var gap = (250 - 58) / 2;
            var dot = el('div', 'ls-dot');
            dot.style.left = (col * gap) + 'px';
            dot.style.top = (row * gap) + 'px';
            wrap.appendChild(dot);
        }
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'ls-pattern-svg');
        svg.setAttribute('viewBox', '0 0 250 250');
        var poly = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
        svg.appendChild(poly);
        wrap.appendChild(svg);

        sheetEl.appendChild(title);
        sheetEl.appendChild(hint);
        sheetEl.appendChild(wrap);

        // 复用绘图交互
        var localDrawing = false;
        function pointFromTouch(t) {
            var rect = wrap.getBoundingClientRect();
            return { x: t.clientX - rect.left, y: t.clientY - rect.top };
        }
        function dotAt(p) {
            for (var i = 0; i < 9; i++) {
                var row = Math.floor(i / 3), col = i % 3;
                var gap = (250 - 58) / 2;
                var cx = col * gap + 29, cy = row * gap + 29;
                if (Math.sqrt(Math.pow(p.x - cx, 2) + Math.pow(p.y - cy, 2)) <= 39) return i;
            }
            return -1;
        }
        function add(idx) {
            if (path.indexOf(idx) !== -1) return;
            path.push(idx);
            var dots = wrap.querySelectorAll('.ls-dot');
            if (dots[idx]) dots[idx].classList.add('active');
            poly.setAttribute('points', path.map(function (i) {
                var row = Math.floor(i / 3), col = i % 3;
                var gap = (250 - 58) / 2;
                return (col * gap + 29) + ',' + (row * gap + 29);
            }).join(' '));
        }
        wrap.addEventListener('touchstart', function (e) {
            e.preventDefault();
            localDrawing = true;
            path = [];
            wrap.querySelectorAll('.ls-dot').forEach(function (d) { d.classList.remove('active'); });
            var idx = dotAt(pointFromTouch(e.touches[0]));
            if (idx >= 0) add(idx);
        }, { passive: false });
        wrap.addEventListener('touchmove', function (e) {
            if (!localDrawing) return;
            e.preventDefault();
            var idx = dotAt(pointFromTouch(e.touches[0]));
            if (idx >= 0) add(idx);
        }, { passive: false });
        wrap.addEventListener('touchend', function (e) {
            if (!localDrawing) return;
            localDrawing = false;
            e.preventDefault();
            if (path.length < 4) {
                hint.textContent = '至少连接 4 个点，请重画';
                hint.style.color = '#ff7b7b';
                wrap.querySelectorAll('.ls-dot').forEach(function (d) { d.classList.remove('active'); });
                poly.setAttribute('points', '');
                path = [];
                return;
            }
            var value = path.join(',');
            if (stage === 1) {
                renderSetupPattern(2, value);
            } else {
                if (value !== firstValue) {
                    hint.textContent = '两次绘制不一致，请重新设置';
                    hint.style.color = '#ff7b7b';
                    setTimeout(function () { renderSetupPattern(1); }, 900);
                } else {
                    setupData.pattern = value;
                    renderSetupSecurity();
                }
            }
        }, { passive: false });
    }

    // 把 setupData 保存为正式配置（保留旧密保）
    function saveCfgFromSetup(keepSecurity) {
        cfg = {
            enabled: true,
            type: setupData.type,
            pin: setupData.pin || '',
            pinLen: setupData.pinLen || 4,
            pattern: setupData.pattern || '',
            question: keepSecurity.question,
            answer: keepSecurity.answer,
            createdAt: (cfg && cfg.createdAt) || Date.now()
        };
        writeCfg();
        setupData = null;
        hideSheet();
        closeUnlockPanel();
        if (typeof window.showNotification === 'function') {
            window.showNotification('锁屏设置已更新', 'success');
        }
    }

    // 密保问题设置
    function renderSetupSecurity() {
        // 修改密码 / 切换解锁方式时，沿用原密保问题直接保存
        if (setupData && setupData.keepSecurity && setupData.keepSecurity.question) {
            saveCfgFromSetup(setupData.keepSecurity);
            return;
        }
        var questions = [
            '你最喜欢的人是谁？',
            '你们在一起的日子是哪天？',
            '你最喜欢的食物是什么？',
            '你最喜欢的一本书是？'
        ];
        var html = '<div class="ls-sheet-title">设置密保问题</div>' +
            '<div class="ls-sheet-desc">忘记密码时，答对这个问题就能重设密码。</div>';
        questions.forEach(function (q, i) {
            html += '<button class="ls-option" data-q="' + i + '"><span>' + q + '</span><span class="ls-option-arrow">›</span></button>';
        });
        showSheet(html);
        sheetEl.querySelectorAll('.ls-option').forEach(function (btn) {
            btn.onclick = function () {
                setupData.question = questions[parseInt(btn.dataset.q, 10)];
                renderSetupAnswer();
            };
        });
    }

    function renderSetupAnswer() {
        showSheet(
            '<div class="ls-sheet-title">填写答案</div>' +
            '<div class="ls-sheet-desc">' + setupData.question + '</div>' +
            '<input class="ls-input" id="lsAnswerInput" placeholder="输入答案" autocomplete="off">' +
            '<button class="ls-btn-primary" id="lsAnswerSave" disabled>完成设置</button>'
        );
        var input = sheetEl.querySelector('#lsAnswerInput');
        var save = sheetEl.querySelector('#lsAnswerSave');
        input.addEventListener('input', function () {
            save.disabled = input.value.trim().length === 0;
        });
        save.onclick = function () {
            var answer = input.value.trim();
            if (!answer) return;
            cfg = {
                enabled: true,
                type: setupData.type,
                pin: setupData.pin || '',
                pinLen: setupData.pinLen || 4,
                pattern: setupData.pattern || '',
                question: setupData.question,
                answer: answer.toLowerCase(),
                createdAt: Date.now()
            };
            writeCfg();
            setupData = null;
            hideSheet();
            unlockSuccess();
        };
    }

    // ────────── 找回密码 ──────────
    function renderRecover() {
        if (!cfg || !cfg.question) {
            showSheet(
                '<div class="ls-sheet-title">无法找回</div>' +
                '<div class="ls-sheet-desc">没有设置密保问题，无法找回密码。</div>' +
                '<button class="ls-btn-primary" id="lsRecoverBack">返回</button>'
            );
            sheetEl.querySelector('#lsRecoverBack').onclick = function () { hideSheet(true); };
            return;
        }
        showSheet(
            '<div class="ls-sheet-title">找回密码</div>' +
            '<div class="ls-sheet-desc">' + cfg.question + '</div>' +
            '<input class="ls-input" id="lsRecoverInput" placeholder="输入你的答案" autocomplete="off">' +
            '<button class="ls-btn-primary" id="lsRecoverNext" disabled>验证</button>' +
            '<button class="ls-btn-ghost" id="lsRecoverCancel">取消</button>'
        );
        var input = sheetEl.querySelector('#lsRecoverInput');
        var next = sheetEl.querySelector('#lsRecoverNext');
        input.addEventListener('input', function () {
            next.disabled = input.value.trim().length === 0;
        });
        next.onclick = function () {
            var val = input.value.trim().toLowerCase();
            if (val === cfg.answer) {
                // 验证通过 → 重设密码
                setupData = { recover: true };
                renderSetupType();
            } else {
                input.style.boxShadow = 'inset 0 0 0 1.5px #ff6b6b';
                input.value = '';
                input.placeholder = '答案不对，再想想';
            }
        };
        sheetEl.querySelector('#lsRecoverCancel').onclick = function () { hideSheet(true); };
    }

    // ────────── 锁屏设置 ──────────
    function renderSettingsSheet() {
        var typeText = cfg && cfg.type === 'pattern' ? '手势图案' : ('数字密码（' + ((cfg && cfg.pinLen) || 4) + ' 位）');
        showSheet(
            '<div class="ls-sheet-title">锁屏设置</div>' +
            '<div class="ls-sheet-desc">当前解锁方式：' + typeText + '</div>' +
            '<button class="ls-option" id="lsChangeBg"><span>更换锁屏背景<div class="ls-option-sub">从相册选一张图片</div></span><span class="ls-option-arrow">›</span></button>' +
            '<button class="ls-option" id="lsResetBg"><span>恢复默认背景<div class="ls-option-sub">使用默认渐变</div></span><span class="ls-option-arrow">›</span></button>' +
            '<button class="ls-option" id="lsChangeType"><span>切换解锁方式<div class="ls-option-sub">数字密码 / 手势图案</div></span><span class="ls-option-arrow">›</span></button>' +
            '<button class="ls-option" id="lsChangePin"><span>修改密码</span><span class="ls-option-arrow">›</span></button>' +
            '<button class="ls-option" id="lsChangeSecurity"><span>修改密保问题<div class="ls-option-sub">' + (cfg && cfg.question ? '已设置' : '未设置') + '</div></span><span class="ls-option-arrow">›</span></button>' +
            '<button class="ls-option" id="lsDisable"><span>关闭锁屏</span><span class="ls-option-arrow">›</span></button>' +
            '<button class="ls-btn-ghost" id="lsSettingsClose">完成</button>'
        );
        sheetEl.querySelector('#lsSettingsClose').onclick = function () {
            hideSheet(true);
        };
        sheetEl.querySelector('#lsChangeBg').onclick = function () {
            var input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.style.display = 'none';
            document.body.appendChild(input);
            input.onchange = function () {
                var file = input.files && input.files[0];
                if (!file) { input.remove(); return; }
                compressImage(file, 1080, 0.72).then(function (dataUrl) {
                    try {
                        localStorage.setItem(BG_KEY, dataUrl);
                    } catch (e) {
                        alert('图片太大，请换一张稍小的图片');
                    }
                    applyBg();
                    input.remove();
                }).catch(function () {
                    alert('图片读取失败，请重试');
                    input.remove();
                });
            };
            input.click();
        };

        sheetEl.querySelector('#lsResetBg').onclick = function () {
            try { localStorage.removeItem(BG_KEY); } catch (e) {}
            applyBg();
        };

        sheetEl.querySelector('#lsChangeType').onclick = function () {
            setupData = { editing: true };
            var keep = { question: cfg.question, answer: cfg.answer };
            renderSetupType();
            // 设置完成后需要保留密保
            setupData.keepSecurity = keep;
        };
        sheetEl.querySelector('#lsChangePin').onclick = function () {
            setupData = { editing: true, type: cfg.type, pinLen: cfg.pinLen, keepSecurity: { question: cfg.question, answer: cfg.answer } };
            if (cfg.type === 'pin') renderSetupPinInput(1, '', cfg.pinLen || 4);
            else renderSetupPattern(1);
        };
        sheetEl.querySelector('#lsChangeSecurity').onclick = function () {
            setupData = { editing: true, type: cfg.type, pin: cfg.pin, pinLen: cfg.pinLen, pattern: cfg.pattern };
            renderSetupSecurity();
        };
        sheetEl.querySelector('#lsDisable').onclick = function () {
            showSheet(
                '<div class="ls-sheet-title">关闭锁屏？</div>' +
                '<div class="ls-sheet-desc">关闭后打开 App 将直接进入主页，不再显示锁屏。</div>' +
                '<button class="ls-btn-primary" id="lsDisableOk">确认关闭</button>' +
                '<button class="ls-btn-ghost" id="lsDisableCancel">再想想</button>'
            );
            sheetEl.querySelector('#lsDisableOk').onclick = function () {
                cfg = { enabled: false };
                writeCfg();
                hideSheet();
                unlockSuccess();
            };
            sheetEl.querySelector('#lsDisableCancel').onclick = function () { renderSettingsSheet(); };
        };
    }

    // ────────── 生命周期 ──────────
    function lockAgain() {
        if (!cfg || !cfg.enabled) return;
        isUnlocked = false;
        root.classList.remove('ls-unlocking', 'ls-hidden');
        root.style.opacity = '';
        root.style.transform = '';
        var mark = root.querySelector('.ls-success-mark');
        if (mark) mark.remove();
        closeUnlockPanel();
        startClock();
    }

    function bindVisibility() {
        document.addEventListener('visibilitychange', function () {
            if (document.hidden) {
                hiddenAt = Date.now();
            } else {
                if (isUnlocked && hiddenAt && (Date.now() - hiddenAt > RELOCK_AFTER)) {
                    lockAgain();
                }
                hiddenAt = 0;
            }
        });
    }

    // ────────── 启动 ──────────
    function init() {
        buildRoot();
        applyBg();
        startClock();
        bindSwipe();
        bindVisibility();

        if (!cfg) {
            // 首次使用：不自动锁定，等用户点击后进入设置引导
            return;
        }
        if (cfg.enabled === false) {
            root.classList.add('ls-hidden');
            return;
        }
        // 已启用锁屏：默认锁定，等待上滑
    }

    if (document.body) {
        init();
    } else {
        document.addEventListener('DOMContentLoaded', init);
    }

    // 对外接口（供主页设置调用）
    window.ZyLock = {
        isEnabled: function () { return !!(cfg && cfg.enabled); },
        openSettings: function () {
            // 确保锁屏层可见
            isUnlocked = false;
            root.classList.remove('ls-hidden', 'ls-unlocking');
            root.style.opacity = '';
            root.style.transform = '';
            var mark = root.querySelector('.ls-success-mark');
            if (mark) mark.remove();
            if (!cfg || !cfg.enabled) {
                mainEl.classList.add('ls-swiped-up');
                renderSetupWelcome();
                return;
            }
            pendingAction = 'settings';
            closeUnlockPanel();
            renderSettingsSheet();
        },
        reset: function () {
            cfg = null;
            localStorage.removeItem(CFG_KEY);
        }
    };
})();
