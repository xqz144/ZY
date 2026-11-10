/**
 * 梦角回涂鸦 —— 程序化生成手写风格涂鸦
 * 风格参考：蓝紫渐变背景 + 白色手写情话 + 右下角签名
 * 使用 Google Fonts 手写中文字体（Liu Jian Mao Cao / Long Cang / Ma Shan Zheng）
 * 字体未加载时 fallback 到 serif，仍可正常生成
 */
(function () {
    'use strict';

    // ── 情话库（随机抽取一句） ──
    var PHRASES = [
        '想你了',
        '今天也很喜欢你',
        '你是我的小确幸',
        '晚安，梦里见',
        '早安，今天也要开心',
        '你笑起来真好看',
        '有你在真好',
        '想抱抱你',
        '你是我的唯一',
        '遇见你是我最大的幸运',
        '心里满满都是你',
        '想和你一起看星星',
        '你就是我的全世界',
        '爱你三千遍',
        '你是我的软肋也是铠甲',
        '想牵你的手',
        '今天的风也像你一样温柔',
        '你是我所有的期待',
        '想你的每一天都是情人节',
        '你是我藏在心底的温柔',
        '愿得一人心，白首不相离',
        '余生请多指教',
        '你是我的星辰大海',
        '想你的夜，月光都是甜的',
        '你是我最想留住的幸运',
        '喜欢你，没道理',
        '你是我的小太阳',
        '想和你一起慢慢变老',
        '你是我心里的白月光',
        '爱你如初',
        '你是我所有浪漫的缘由',
        '见你所见，爱你所爱',
        '你是我遥遥万里最牵挂的人'
    ];

    // ── 渐变背景预设（参考用户字迹图的蓝紫风格） ──
    var GRADIENTS = [
        ['#667eea', '#764ba2'],   // 经典蓝紫
        ['#5b86e5', '#36d1dc'],   // 青蓝
        ['#8e2de2', '#4a00e0'],   // 深紫
        ['#f093fb', '#f5576c'],   // 粉紫
        ['#4facfe', '#00f2fe'],   // 天蓝
        ['#a18cd1', '#fbc2eb'],   // 淡粉紫
        ['#6a11cb', '#2575fc'],   // 蓝紫渐变
        ['#ee9ca7', '#ffdde1']    // 淡粉
    ];

    // 手写字体（按喜好顺序）
    var FONTS = ['"Liu Jian Mao Cao"', '"Long Cang"', '"Ma Shan Zheng"'];

    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    // 等待手写字体加载完成（canvas 需要字体就绪才能正确渲染）
    function waitForFont() {
        if (document.fonts && document.fonts.ready) {
            // 主动触发字体加载，避免首次使用时 fallback
            var loadPromise = document.fonts.load('40px "Liu Jian Mao Cao"').catch(function () {});
            return Promise.all([document.fonts.ready, loadPromise]);
        }
        return Promise.resolve();
    }

    // 中文逐字换行
    function wrapText(ctx, text, maxWidth) {
        var lines = [];
        var current = '';
        for (var i = 0; i < text.length; i++) {
            var test = current + text[i];
            if (ctx.measureText(test).width > maxWidth && current) {
                lines.push(current);
                current = text[i];
            } else {
                current = test;
            }
        }
        if (current) lines.push(current);
        return lines;
    }

    // 画装饰：随机小光点 + 小星星
    function drawDecorations(ctx, W, H) {
        ctx.save();
        for (var i = 0; i < 18; i++) {
            var x = Math.random() * W;
            var y = Math.random() * H;
            var r = Math.random() * 1.5 + 0.5;
            ctx.fillStyle = 'rgba(255,255,255,' + (Math.random() * 0.4 + 0.15) + ')';
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }
        var starCount = Math.floor(Math.random() * 3) + 3;
        for (var j = 0; j < starCount; j++) {
            drawStar(ctx, Math.random() * W, Math.random() * H, Math.random() * 4 + 3, 'rgba(255,255,255,0.7)');
        }
        ctx.restore();
    }

    function drawStar(ctx, cx, cy, r, color) {
        ctx.save();
        ctx.fillStyle = color;
        ctx.beginPath();
        for (var i = 0; i < 5; i++) {
            var angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
            var x = cx + Math.cos(angle) * r;
            var y = cy + Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    /**
     * 生成一张手写涂鸦 dataURL
     * @param {string} [signature] 签名文字（对方名字），默认"梦角"
     * @returns {Promise<string>} PNG dataURL
     */
    function generateDoodle(signature) {
        return waitForFont().then(function () {
            var W = 400, H = 500;
            var canvas = document.createElement('canvas');
            canvas.width = W;
            canvas.height = H;
            var ctx = canvas.getContext('2d');

            // 1. 渐变背景
            var grad = ctx.createLinearGradient(0, 0, W, H);
            var colors = pick(GRADIENTS);
            grad.addColorStop(0, colors[0]);
            grad.addColorStop(1, colors[1]);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, H);

            // 2. 装饰（小光点/星星）
            drawDecorations(ctx, W, H);

            // 3. 手写情话（居中，白色，带轻微阴影）
            var phrase = pick(PHRASES);
            var font = pick(FONTS);
            var fontSize = 38;
            ctx.font = fontSize + 'px ' + font + ', serif';
            ctx.fillStyle = '#ffffff';
            ctx.textBaseline = 'middle';

            var lines = wrapText(ctx, phrase, W - 80);
            var lineHeight = fontSize * 1.5;
            var totalH = lines.length * lineHeight;
            var startY = (H - totalH) / 2 - 40; // 偏上，留签名空间

            ctx.shadowColor = 'rgba(0,0,0,0.18)';
            ctx.shadowBlur = 3;
            ctx.shadowOffsetY = 1;

            lines.forEach(function (line, i) {
                var metrics = ctx.measureText(line);
                var x = (W - metrics.width) / 2;
                var y = startY + i * lineHeight + lineHeight / 2;
                ctx.fillText(line, x, y);
            });

            ctx.shadowColor = 'transparent';

            // 4. 签名（右下角，略小）
            var sig = signature || '梦角';
            var sigSize = 30;
            ctx.font = sigSize + 'px ' + font + ', serif';
            var sigMetrics = ctx.measureText(sig);
            ctx.fillStyle = 'rgba(255,255,255,0.92)';
            ctx.fillText(sig, W - sigMetrics.width - 40, H - 55);

            return canvas.toDataURL('image/png');
        });
    }

    window.generateDoodle = generateDoodle;
})();
