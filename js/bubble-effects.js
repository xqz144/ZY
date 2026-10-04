/**
 * 气泡动效（iMessage 风格消息出现动画）
 * - slide 滑入（默认）
 * - pop 砰一下
 * - shake 震动
 * - grow 放大
 * 用 MutationObserver 监听新消息，无需改 core.js
 * 伴侣消息有概率随机加 pop 效果，增加趣味
 */
(function () {
    'use strict';

    var _observer = null;
    var _bound = false;

    // 已处理过的 wrapper（避免重复加动画）
    var processed = new WeakSet();

    function applyEffect(bubble, effect) {
        if (!bubble) return;
        // 移除旧动画 class
        bubble.classList.remove('fx-bubble-slide', 'fx-bubble-pop', 'fx-bubble-shake', 'fx-bubble-grow');
        // 强制重排，重启动画
        void bubble.offsetWidth;
        bubble.classList.add('fx-bubble-' + effect);
    }

    function handleNewWrapper(wrapper) {
        if (!wrapper || processed.has(wrapper)) return;
        processed.add(wrapper);

        var bubble = wrapper.querySelector('.message, .voice-message-bubble');
        if (!bubble) return;

        var isSent = wrapper.classList.contains('sent');
        var isReceived = wrapper.classList.contains('received');

        // 1. 默认：滑入
        applyEffect(bubble, 'slide');

        // 2. 伴侣消息：15% 概率 pop（增加惊喜感）
        if (isReceived && Math.random() < 0.15) {
            setTimeout(function () { applyEffect(bubble, 'pop'); }, 50);
        }

        // 3. 如果消息带 data-fx 属性（外部指定），用指定效果
        var fx = wrapper.getAttribute('data-fx');
        if (fx) {
            setTimeout(function () { applyEffect(bubble, fx); }, 50);
        }
    }

    function init() {
        if (_bound) return;

        var container = document.querySelector('.chat-container, #chat-container');
        if (!container) {
            // 容器还没出现，延迟重试（不要设 _bound，否则永远绑不上）
            setTimeout(init, 500);
            return;
        }
        _bound = true;

        _observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (m) {
                m.addedNodes.forEach(function (node) {
                    if (node.nodeType !== 1) return;
                    // 直接是 wrapper
                    if (node.classList && node.classList.contains('message-wrapper')) {
                        handleNewWrapper(node);
                    }
                    // 内部包含 wrapper
                    var wrappers = node.querySelectorAll ? node.querySelectorAll('.message-wrapper') : [];
                    wrappers.forEach(function (w) { handleNewWrapper(w); });
                });
            });
        });

        _observer.observe(container, { childList: true, subtree: true });
    }

    // 暴露 API（外部可手动调用，比如戳一拍回复时加 shake）
    window.BubbleFX = {
        apply: function (wrapperOrBubble, effect) {
            var wrapper = wrapperOrBubble.classList && wrapperOrBubble.classList.contains('message-wrapper')
                ? wrapperOrBubble
                : (wrapperOrBubble.closest ? wrapperOrBubble.closest('.message-wrapper') : null);
            if (wrapper) {
                var bubble = wrapper.querySelector('.message, .voice-message-bubble');
                applyEffect(bubble, effect);
            } else {
                // 直接是 bubble
                applyEffect(wrapperOrBubble, effect);
            }
        },
        slide: function (w) { this.apply(w, 'slide'); },
        pop: function (w) { this.apply(w, 'pop'); },
        shake: function (w) { this.apply(w, 'shake'); },
        grow: function (w) { this.apply(w, 'grow'); }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
