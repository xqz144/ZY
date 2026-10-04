/**
 * 手写涂鸦消息（iMessage 风格）
 * - 画布弹窗：手写/手绘
 * - 工具：颜色、笔粗细、橡皮、清空、撤销、发送
 * - 画完转 data URL，作为图片消息发送
 */
(function () {
    'use strict';

    var canvas = null;
    var ctx = null;
    var drawing = false;
    var lastX = 0, lastY = 0;
    var history = []; // 撤销栈
    var color = '#E91E63';
    var lineWidth = 4;
    var isEraser = false;

    function ensureCanvas() {
        if (canvas) return;
        canvas = document.getElementById('hw-canvas');
        if (!canvas) return;
        ctx = canvas.getContext('2d');
        resizeCanvas();
        // 触摸事件
        canvas.addEventListener('touchstart', startDraw, { passive: false });
        canvas.addEventListener('touchmove', draw, { passive: false });
        canvas.addEventListener('touchend', endDraw);
        // 鼠标事件
        canvas.addEventListener('mousedown', startDraw);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', endDraw);
        canvas.addEventListener('mouseleave', endDraw);
        clearCanvas();
    }

    function resizeCanvas() {
        if (!canvas) return;
        var rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * (window.devicePixelRatio || 1);
        canvas.height = rect.height * (window.devicePixelRatio || 1);
        ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    }

    function getPos(e) {
        var rect = canvas.getBoundingClientRect();
        var t = e.touches ? e.touches[0] : e;
        return {
            x: t.clientX - rect.left,
            y: t.clientY - rect.top
        };
    }

    function startDraw(e) {
        e.preventDefault();
        if (!ctx) return;
        drawing = true;
        var p = getPos(e);
        lastX = p.x; lastY = p.y;
        // 保存历史用于撤销
        try { history.push(canvas.toDataURL()); if (history.length > 20) history.shift(); } catch (err) {}
        // 画一个点
        ctx.beginPath();
        ctx.fillStyle = isEraser ? '#ffffff' : color;
        ctx.arc(p.x, p.y, lineWidth / 2, 0, Math.PI * 2);
        ctx.fill();
    }

    function draw(e) {
        if (!drawing || !ctx) return;
        e.preventDefault();
        var p = getPos(e);
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = isEraser ? '#ffffff' : color;
        ctx.lineWidth = isEraser ? lineWidth * 3 : lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
        lastX = p.x; lastY = p.y;
    }

    function endDraw(e) {
        drawing = false;
    }

    function clearCanvas() {
        if (!ctx || !canvas) return;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        history = [];
    }

    function undo() {
        if (history.length === 0 || !ctx) return;
        var last = history.pop();
        var img = new Image();
        img.onload = function () {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1));
        };
        img.src = last;
    }

    function send() {
        if (!canvas) return;
        // 检查画布是否为空（全白）
        var dataUrl = canvas.toDataURL('image/png');
        // 关闭弹窗
        var modal = document.getElementById('handwriting-modal');
        if (modal && typeof window.hideModal === 'function') window.hideModal(modal);
        // 发送为图片消息
        try {
            if (typeof addMessage === 'function') {
                addMessage({
                    id: Date.now(),
                    image: dataUrl,
                    sender: 'user',
                    timestamp: new Date(),
                    type: 'image'
                });
            }
        } catch (e) { console.error('[手写] 发送失败:', e); }
        // 清空画布
        clearCanvas();
    }

    function openModal() {
        ensureCanvas();
        var modal = document.getElementById('handwriting-modal');
        if (modal && typeof window.showModal === 'function') {
            window.showModal(modal);
            setTimeout(function () { ensureCanvas(); clearCanvas(); }, 100);
        }
    }

    // ── 事件委托 ──
    var _bound = false;
    function bind() {
        if (_bound) return;
        _bound = true;

        // 入口点击
        document.addEventListener('click', function (e) {
            var entry = e.target.closest && e.target.closest('#handwriting-entry');
            if (entry) { openModal(); return; }

            var clearBtn = e.target.closest && e.target.closest('#hw-clear');
            if (clearBtn) { clearCanvas(); return; }

            var undoBtn = e.target.closest && e.target.closest('#hw-undo');
            if (undoBtn) { undo(); return; }

            var sendBtn = e.target.closest && e.target.closest('#hw-send');
            if (sendBtn) { send(); return; }

            var colorBtn = e.target.closest && e.target.closest('.hw-color');
            if (colorBtn) {
                color = colorBtn.dataset.color;
                isEraser = false;
                document.querySelectorAll('.hw-color').forEach(function (b) { b.classList.remove('active'); });
                colorBtn.classList.add('active');
                var eraserBtn = document.getElementById('hw-eraser');
                if (eraserBtn) eraserBtn.classList.remove('active');
                return;
            }

            var eraserBtn = e.target.closest && e.target.closest('#hw-eraser');
            if (eraserBtn) {
                isEraser = !isEraser;
                eraserBtn.classList.toggle('active', isEraser);
                document.querySelectorAll('.hw-color').forEach(function (b) { b.classList.remove('active'); });
                if (!isEraser) {
                    // 恢复当前色
                    var cur = document.querySelector('.hw-color[data-color="' + color + '"]');
                    if (cur) cur.classList.add('active');
                }
                return;
            }
        });

        // 笔粗细
        document.addEventListener('input', function (e) {
            var slider = e.target.closest && e.target.closest('#hw-size');
            if (slider) {
                lineWidth = parseInt(slider.value, 10) || 4;
                var valEl = document.getElementById('hw-size-val');
                if (valEl) valEl.textContent = lineWidth;
            }
        });

        // 窗口大小变化
        window.addEventListener('resize', function () {
            if (canvas && canvas.offsetParent) {
                var data = canvas.toDataURL();
                resizeCanvas();
                clearCanvas();
                var img = new Image();
                img.onload = function () { ctx.drawImage(img, 0, 0, canvas.width, canvas.height); };
                img.src = data;
            }
        });
    }

    function init() {
        try { bind(); } catch (e) { console.error('[手写] 绑定失败:', e); }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
