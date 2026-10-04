/**
 * 戳一拍升级（iMessage 风格）
 * - 监听 system 消息含"拍一拍/戳" → 触发特效
 * - 屏幕震动 + 伴侣最近消息 shake 动效 + 振动反馈
 * - 伴侣被戳后会"反应"：根据情绪显示对应 emoji 气泡
 * 不改动 features.js / core.js
 */
(function () {
    'use strict';

    var processed = new WeakSet();
    var lastReactTime = 0;

    // 根据伴侣情绪选反应 emoji
    function pickReactionEmoji() {
        var cur = window.PartnerState ? window.PartnerState.getCurrent() : null;
        var mood = cur && cur.mood ? cur.mood.id : '';
        var map = {
            mood_happy: ['😊', '嘿', 'variant1'],
            mood_excited: ['🤩', '哇', 'variant1'],
            mood_shy: ['😳', '别…', 'variant1'],
            mood_angry: ['😤', '哼', 'variant1'],
            mood_sad: ['😢', '…', 'variant1'],
            mood_miss: ['🥺', '你终于理我了', 'variant1'],
            mood_tired: ['😴', '困…', 'variant1'],
            mood_calm: ['😌', '嗯？', 'variant1'],
            mood_sick: ['🤒', '不舒服…', 'variant1']
        };
        // 简化：直接返回 emoji
        var emojiMap = {
            mood_happy: '😊',
            mood_excited: '🤩',
            mood_shy: '😳',
            mood_angry: '😤',
            mood_sad: '😢',
            mood_miss: '🥺',
            mood_tired: '😴',
            mood_calm: '😌',
            mood_sick: '🤒'
        };
        return emojiMap[mood] || '✨';
    }

    function handlePokeSystem(wrapper) {
        if (!wrapper || processed.has(wrapper)) return;
        processed.add(wrapper);

        var text = '';
        var bubble = wrapper.querySelector('.message-bubble, .voice-message-bubble');
        if (bubble) text = bubble.textContent || '';
        if (!/拍一拍|拍了拍|戳一戳|戳了戳|戳/.test(text)) return;

        // 1. 屏幕震动
        if (window.ScreenFX) window.ScreenFX.shake();
        // 2. 振动反馈
        if (navigator.vibrate) navigator.vibrate([30, 40, 60]);
        // 3. 给伴侣最近一条消息加 shake
        var received = document.querySelectorAll('.message-wrapper.received');
        if (received.length > 0 && window.BubbleFX) {
            var last = received[received.length - 1];
            window.BubbleFX.shake(last);
        }

        // 4. 伴侣反应（避免太频繁）
        var now = Date.now();
        if (now - lastReactTime < 1500) return;
        lastReactTime = now;

        setTimeout(function () {
            showReactionBubble(wrapper);
        }, 400 + Math.random() * 600);
    }

    function showReactionBubble(pokeWrapper) {
        // 在拍一拍 system 消息后插入一个伴侣反应气泡
        var emoji = pickReactionEmoji();
        var reaction = document.createElement('div');
        reaction.className = 'message-wrapper received poke-reaction';
        reaction.style.cssText = 'display:flex;justify-content:flex-start;padding:4px 12px;';
        reaction.innerHTML =
            '<div class="message-bubble" style="background:var(--message-received-bg);font-size:24px;padding:6px 12px;border-radius:18px;animation:fxBubblePop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;">' +
            emoji +
            '</div>';
        // 插入到 poke 消息后
        if (pokeWrapper.parentNode) {
            pokeWrapper.parentNode.insertBefore(reaction, pokeWrapper.nextSibling);
        }
        // 3秒后淡出消失
        setTimeout(function () {
            reaction.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            reaction.style.opacity = '0';
            reaction.style.transform = 'translateY(-10px) scale(0.8)';
            setTimeout(function () { if (reaction.parentNode) reaction.parentNode.removeChild(reaction); }, 500);
        }, 2500);
    }

    function observe() {
        var container = document.querySelector('.chat-container, #chat-container');
        if (!container) { setTimeout(observe, 500); return; }
        var obs = new MutationObserver(function (mutations) {
            mutations.forEach(function (m) {
                m.addedNodes.forEach(function (node) {
                    if (node.nodeType !== 1) return;
                    var list = [];
                    if (node.classList && node.classList.contains('message-wrapper') && node.classList.contains('message-system')) list.push(node);
                    // system 消息可能没有 message-system 类，用文本判断
                    if (node.classList && node.classList.contains('message-wrapper')) list.push(node);
                    if (node.querySelectorAll) {
                        node.querySelectorAll('.message-wrapper').forEach(function (w) { list.push(w); });
                    }
                    list.forEach(handlePokeSystem);
                });
            });
        });
        obs.observe(container, { childList: true, subtree: true });
    }

    function init() {
        try { observe(); } catch (e) { console.error('[戳一拍升级] 失败:', e); }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
