/**
 * 屏幕特效引擎（iMessage 风格全屏粒子动画）
 * - 爱心雨 hearts
 * - 气球 balloons
 * - 烟花 fireworks
 * - 流星/星光 stars
 * - 彩纸 confetti
 * - 震动 shake（轻量，非粒子）
 * 独立 canvas 层，不影响聊天交互
 */
(function () {
    'use strict';

    var canvas = null;
    var ctx = null;
    var particles = [];
    var rafId = null;
    var running = false;

    // ── 初始化 canvas ──
    function ensureCanvas() {
        if (canvas) return;
        canvas = document.createElement('canvas');
        canvas.id = 'screen-fx-canvas';
        canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;';
        document.body.appendChild(canvas);
        ctx = canvas.getContext('2d');
        resize();
        window.addEventListener('resize', resize);
    }

    function resize() {
        if (!canvas) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    // ── 粒子工厂 ──
    function rand(min, max) { return min + Math.random() * (max - min); }

    // 爱心
    function makeHeart() {
        return {
            type: 'heart',
            x: rand(0, canvas.width),
            y: canvas.height + rand(0, 100),
            vx: rand(-0.3, 0.3),
            vy: -rand(1.2, 2.8),
            size: rand(14, 28),
            rot: rand(-0.3, 0.3),
            vrot: rand(-0.02, 0.02),
            life: 1,
            color: ['#FF6B9D', '#FF8FAB', '#FFB3C6', '#E91E63', '#F48FB1'][Math.floor(rand(0, 5))]
        };
    }

    // 气球
    function makeBalloon() {
        var colors = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#FF6B9D', '#9B59B6'];
        return {
            type: 'balloon',
            x: rand(0, canvas.width),
            y: canvas.height + rand(0, 200),
            vx: rand(-0.4, 0.4),
            vy: -rand(0.8, 1.8),
            size: rand(20, 38),
            sway: rand(0, Math.PI * 2),
            swaySpeed: rand(0.02, 0.05),
            life: 1,
            color: colors[Math.floor(rand(0, colors.length))]
        };
    }

    // 烟花（爆炸粒子簇）
    function makeFirework() {
        var cx = rand(canvas.width * 0.2, canvas.width * 0.8);
        var cy = rand(canvas.height * 0.2, canvas.height * 0.6);
        var color = ['#FFD700', '#FF6B6B', '#FF8FAB', '#6BCB77', '#4D96FF', '#E91E63'][Math.floor(rand(0, 6))];
        var count = Math.floor(rand(30, 50));
        var arr = [];
        for (var i = 0; i < count; i++) {
            var angle = (Math.PI * 2 * i) / count + rand(-0.1, 0.1);
            var speed = rand(2, 5);
            arr.push({
                type: 'spark',
                x: cx,
                y: cy,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: rand(2, 4),
                life: 1,
                decay: rand(0.008, 0.018),
                color: color,
                gravity: 0.06
            });
        }
        return arr;
    }

    // 流星
    function makeStar() {
        return {
            type: 'star',
            x: rand(0, canvas.width),
            y: rand(-50, canvas.height * 0.3),
            vx: rand(0.5, 2.5),
            vy: rand(2, 5),
            size: rand(1, 3),
            life: 1,
            decay: 0.004,
            color: ['#FFFFFF', '#FFD700', '#B0BEC5'][Math.floor(rand(0, 3))],
            trail: []
        };
    }

    // 彩纸
    function makeConfetti() {
        var colors = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#FF6B9D', '#9B59B6', '#FFA500'];
        return {
            type: 'confetti',
            x: rand(0, canvas.width),
            y: -rand(0, 50),
            vx: rand(-1, 1),
            vy: rand(2, 5),
            size: rand(6, 12),
            rot: rand(0, Math.PI * 2),
            vrot: rand(-0.2, 0.2),
            life: 1,
            color: colors[Math.floor(rand(0, colors.length))]
        };
    }

    // ── 绘制 ──
    function drawHeart(p) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.scale(p.size / 30, p.size / 30);
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        // 心形路径
        ctx.moveTo(0, -10);
        ctx.bezierCurveTo(-10, -20, -25, -10, 0, 12);
        ctx.bezierCurveTo(25, -10, 10, -20, 0, -10);
        ctx.fill();
        ctx.restore();
    }

    function drawBalloon(p) {
        ctx.save();
        ctx.globalAlpha = p.life;
        // 气球本体
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(p.x + Math.sin(p.sway) * 8, p.y, p.size * 0.5, p.size * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        // 绳子
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p.x + Math.sin(p.sway) * 8, p.y + p.size * 0.6);
        ctx.quadraticCurveTo(p.x, p.y + p.size * 0.9, p.x + Math.sin(p.sway + 1) * 4, p.y + p.size * 1.1);
        ctx.stroke();
        // 高光
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath();
        ctx.ellipse(p.x + Math.sin(p.sway) * 8 - p.size * 0.15, p.y - p.size * 0.2, p.size * 0.1, p.size * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    function drawSpark(p) {
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    function drawStar(p) {
        // 拖尾
        for (var i = 0; i < p.trail.length; i++) {
            var t = p.trail[i];
            ctx.save();
            ctx.globalAlpha = (i / p.trail.length) * p.life * 0.6;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(t.x, t.y, p.size * (i / p.trail.length), 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    function drawConfetti(p) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
    }

    // ── 更新 ──
    function update(p) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.type === 'heart') {
            p.rot += p.vrot;
            if (p.y < -50) p.life = 0;
        } else if (p.type === 'balloon') {
            p.sway += p.swaySpeed;
            if (p.y < -80) p.life = 0;
        } else if (p.type === 'spark') {
            p.vy += p.gravity;
            p.life -= p.decay;
            if (p.life <= 0) p.life = 0;
        } else if (p.type === 'star') {
            p.trail.push({ x: p.x, y: p.y });
            if (p.trail.length > 8) p.trail.shift();
            p.life -= p.decay;
            if (p.y > canvas.height + 50) p.life = 0;
        } else if (p.type === 'confetti') {
            p.rot += p.vrot;
            p.vy += 0.05; // 重力
            if (p.y > canvas.height + 50) p.life = 0;
        }
    }

    function draw(p) {
        if (p.type === 'heart') drawHeart(p);
        else if (p.type === 'balloon') drawBalloon(p);
        else if (p.type === 'spark') drawSpark(p);
        else if (p.type === 'star') drawStar(p);
        else if (p.type === 'confetti') drawConfetti(p);
    }

    // ── 主循环 ──
    function loop() {
        if (!running) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // 更新+绘制
        for (var i = particles.length - 1; i >= 0; i--) {
            var p = particles[i];
            update(p);
            if (p.life <= 0) {
                particles.splice(i, 1);
                continue;
            }
            draw(p);
        }
        // 全空 → 停止
        if (particles.length === 0) {
            stop();
            return;
        }
        rafId = requestAnimationFrame(loop);
    }

    function start() {
        if (running) return;
        running = true;
        rafId = requestAnimationFrame(loop);
    }

    function stop() {
        running = false;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;
        if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // ── 公开 API ──
    var DURATION = 4000; // 默认持续 4 秒
    var stopTimer = null;

    function trigger(type, opts) {
        opts = opts || {};
        ensureCanvas();
        var count = opts.count || 30;
        var duration = opts.duration || DURATION;

        if (type === 'hearts') {
            for (var i = 0; i < count; i++) particles.push(makeHeart());
        } else if (type === 'balloons') {
            for (var j = 0; j < count; j++) particles.push(makeBalloon());
        } else if (type === 'fireworks') {
            var bursts = opts.bursts || 3;
            for (var b = 0; b < bursts; b++) {
                var fw = makeFirework();
                for (var k = 0; k < fw.length; k++) particles.push(fw[k]);
            }
        } else if (type === 'stars') {
            for (var s = 0; s < count; s++) particles.push(makeStar());
        } else if (type === 'confetti') {
            for (var c = 0; c < count; c++) particles.push(makeConfetti());
        } else if (type === 'shake') {
            // 屏幕震动（CSS 抖动）
            var target = document.querySelector('.phone-container') || document.body;
            target.classList.add('fx-shake');
            setTimeout(function () { target.classList.remove('fx-shake'); }, 500);
            return;
        } else if (type === 'clear') {
            particles = [];
            stop();
            return;
        }

        start();
        if (stopTimer) clearTimeout(stopTimer);
        // 持续生成一段时间（爱心/气球/流星/彩纸是连续的）
        if (type === 'hearts' || type === 'balloons' || type === 'stars' || type === 'confetti') {
            var genTimer = setInterval(function () {
                for (var n = 0; n < 5; n++) {
                    if (type === 'hearts') particles.push(makeHeart());
                    else if (type === 'balloons') particles.push(makeBalloon());
                    else if (type === 'stars') particles.push(makeStar());
                    else if (type === 'confetti') particles.push(makeConfetti());
                }
            }, 200);
            stopTimer = setTimeout(function () {
                clearInterval(genTimer);
                // 让现有粒子自然消亡
                setTimeout(stop, 2500);
            }, duration);
        } else if (type === 'fireworks') {
            // 烟花：自动停止
            stopTimer = setTimeout(stop, duration + 1500);
        }
    }

    window.ScreenFX = {
        trigger: trigger,
        stop: stop,
        hearts: function (o) { trigger('hearts', o); },
        balloons: function (o) { trigger('balloons', o); },
        fireworks: function (o) { trigger('fireworks', o); },
        stars: function (o) { trigger('stars', o); },
        confetti: function (o) { trigger('confetti', o); },
        shake: function () { trigger('shake'); }
    };
})();
