/**
 * Tapback 表情反应 + 长按菜单（iMessage 风格）
 * - 长按消息（500ms）/ 右键 → 弹出菜单
 * - 菜单：反应行（❤️👍👎😂‼️❓）+ 操作行（复制/引用/收藏）
 * - 反应显示在消息角落小圆气泡
 * - localStorage 持久化（key: msg_reactions, subkey: msgId）
 * - 伴侣会随机给用户消息加反应（增加互动感）
 */
(function () {
    'use strict';

    var STORAGE_KEY = 'msg_reactions';
    var REACTIONS = [
        { id: 'love',     emoji: '❤️', label: '爱心' },
        { id: 'like',     emoji: '👍', label: '赞' },
        { id: 'dislike',  emoji: '👎', label: '踩' },
        { id: 'laugh',    emoji: '😂', label: '哈哈' },
        { id: 'exclaim',  emoji: '‼️', label: '强调' },
        { id: 'question', emoji: '❓', label: '疑问' }
    ];

    var menu = null;
    var longPressTimer = null;
    var currentWrapper = null;

    // ── 存储 ──
    function loadReactions() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (raw) return JSON.parse(raw) || {};
        } catch (e) {}
        return {};
    }
    function saveReactions(map) {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(map)); } catch (e) {}
    }
    function getReaction(msgId) {
        var map = loadReactions();
        return map[msgId] || null;
    }
    function setReaction(msgId, reactionId) {
        var map = loadReactions();
        if (reactionId) map[msgId] = reactionId;
        else delete map[msgId];
        saveReactions(map);
    }

    function findReactionById(id) {
        for (var i = 0; i < REACTIONS.length; i++) {
            if (REACTIONS[i].id === id) return REACTIONS[i];
        }
        return null;
    }

    // ── 渲染反应气泡到消息上 ──
    function renderReactionOnWrapper(wrapper) {
        if (!wrapper) return;
        var msgId = wrapper.dataset.msgId;
        if (!msgId) return;

        var rid = getReaction(msgId);
        // 移除旧反应节点
        var old = wrapper.querySelector('.tapback-badge');
        if (old) old.remove();

        if (!rid) return;
        var r = findReactionById(rid);
        if (!r) return;

        var badge = document.createElement('div');
        badge.className = 'tapback-badge';
        var isSent = wrapper.classList.contains('sent');
        badge.classList.add(isSent ? 'tapback-sent' : 'tapback-received');
        badge.textContent = r.emoji;
        badge.title = r.label;
        // 插入到 bubble 内部右下角
        var bubble = wrapper.querySelector('.message-bubble, .voice-message-bubble');
        if (bubble) {
            bubble.style.position = 'relative';
            bubble.appendChild(badge);
        }
    }

    // 给所有消息渲染反应
    function renderAllReactions() {
        document.querySelectorAll('.message-wrapper').forEach(renderReactionOnWrapper);
    }

    // ── 菜单 ──
    function ensureMenu() {
        if (menu) return;
        menu = document.createElement('div');
        menu.className = 'tapback-menu';
        menu.style.display = 'none';
        document.body.appendChild(menu);

        // 反应行
        var reactRow = document.createElement('div');
        reactRow.className = 'tapback-react-row';
        REACTIONS.forEach(function (r) {
            var btn = document.createElement('button');
            btn.className = 'tapback-react-btn';
            btn.dataset.reaction = r.id;
            btn.innerHTML = '<span class="tapback-react-emoji">' + r.emoji + '</span>';
            btn.title = r.label;
            reactRow.appendChild(btn);
        });
        menu.appendChild(reactRow);

        var divider = document.createElement('div');
        divider.className = 'tapback-divider';
        menu.appendChild(divider);

        // 操作行
        var actionRow = document.createElement('div');
        actionRow.className = 'tapback-action-row';
        [
            { id: 'copy', icon: '📋', label: '复制' },
            { id: 'quote', icon: '💬', label: '引用' },
            { id: 'favorite', icon: '⭐', label: '收藏' }
        ].forEach(function (a) {
            var btn = document.createElement('button');
            btn.className = 'tapback-action-btn';
            btn.dataset.action = a.id;
            btn.innerHTML = '<span class="tapback-action-icon">' + a.icon + '</span><span>' + a.label + '</span>';
            actionRow.appendChild(btn);
        });
        menu.appendChild(actionRow);

        // 点击外部关闭
        document.addEventListener('click', function (e) {
            if (menu.style.display === 'none') return;
            if (!menu.contains(e.target) && !e.target.closest('.message-bubble, .voice-message-bubble')) {
                hideMenu();
            }
        });
        // 滚动关闭
        document.querySelector('.chat-container, #chat-container')?.addEventListener('scroll', hideMenu, true);
    }

    function showMenu(wrapper, x, y) {
        ensureMenu();
        currentWrapper = wrapper;

        // 标记当前反应
        var msgId = wrapper.dataset.msgId;
        var cur = getReaction(msgId);
        menu.querySelectorAll('.tapback-react-btn').forEach(function (btn) {
            btn.classList.toggle('active', btn.dataset.reaction === cur);
        });

        menu.style.display = 'block';
        // 定位：避免超出屏幕
        var rect = wrapper.getBoundingClientRect();
        var menuRect = menu.getBoundingClientRect();
        var left = x ? x : rect.left + rect.width / 2 - menuRect.width / 2;
        left = Math.max(8, Math.min(left, window.innerWidth - menuRect.width - 8));
        var top = rect.top - menuRect.height - 8;
        if (top < 8) top = rect.bottom + 8; // 下方放不下就放上方
        menu.style.left = left + 'px';
        menu.style.top = top + 'px';
        menu.classList.add('tapback-menu-show');
    }

    function hideMenu() {
        if (!menu) return;
        menu.classList.remove('tapback-menu-show');
        setTimeout(function () { if (menu) menu.style.display = 'none'; }, 150);
        currentWrapper = null;
    }

    // ── 获取消息纯文本 ──
    function getWrapperText(wrapper) {
        var bubble = wrapper.querySelector('.message-bubble, .voice-message-bubble');
        if (!bubble) return '';
        // 优先取 data 属性，再取 textContent
        return (bubble.dataset.text || bubble.textContent || '').trim();
    }

    // ── 绑定长按 + 菜单点击（事件委托）──
    function bind() {
        // 长按 / 右键
        var pressTarget = document.querySelector('.chat-container, #chat-container') || document;
        // 用 mousedown/touchstart 计时
        function startPress(e) {
            var wrapper = e.target.closest('.message-wrapper');
            if (!wrapper) return;
            var x = e.touches ? e.touches[0].clientX : e.clientX;
            var y = e.touches ? e.touches[0].clientY : e.clientY;
            clearTimeout(longPressTimer);
            longPressTimer = setTimeout(function () {
                showMenu(wrapper, x, y);
                // 触发振动反馈
                if (navigator.vibrate) navigator.vibrate(15);
            }, 450);
        }
        function cancelPress() { clearTimeout(longPressTimer); }

        pressTarget.addEventListener('touchstart', startPress, { passive: true });
        pressTarget.addEventListener('touchend', cancelPress);
        pressTarget.addEventListener('touchmove', cancelPress);
        pressTarget.addEventListener('mousedown', startPress);
        pressTarget.addEventListener('mouseup', cancelPress);
        pressTarget.addEventListener('mouseleave', cancelPress);
        // 右键
        pressTarget.addEventListener('contextmenu', function (e) {
            var wrapper = e.target.closest('.message-wrapper');
            if (!wrapper) return;
            e.preventDefault();
            showMenu(wrapper, e.clientX, e.clientY);
        });

        // 菜单点击
        document.addEventListener('click', function (e) {
            if (!menu || menu.style.display === 'none') return;
            // 反应
            var reactBtn = e.target.closest('.tapback-react-btn');
            if (reactBtn) {
                var rid = reactBtn.dataset.reaction;
                var msgId = currentWrapper ? currentWrapper.dataset.msgId : null;
                if (!msgId) return;
                var cur = getReaction(msgId);
                // 再次点同反应 → 取消
                if (cur === rid) {
                    setReaction(msgId, null);
                } else {
                    setReaction(msgId, rid);
                    if (navigator.vibrate) navigator.vibrate(20);
                }
                renderReactionOnWrapper(currentWrapper);
                hideMenu();
                return;
            }
            // 操作
            var actBtn = e.target.closest('.tapback-action-btn');
            if (actBtn) {
                var action = actBtn.dataset.action;
                handleAction(action, currentWrapper);
                hideMenu();
                return;
            }
        });
    }

    // ── 操作处理 ──
    function handleAction(action, wrapper) {
        if (!wrapper) return;
        var text = getWrapperText(wrapper);
        if (action === 'copy') {
            if (navigator.clipboard && text) {
                navigator.clipboard.writeText(text).then(function () {
                    if (typeof showNotification === 'function') showNotification('已复制', 'info', 1000);
                });
            }
        } else if (action === 'quote') {
            // 引用回复：填到输入框
            var input = document.getElementById('message-input') || document.querySelector('textarea, input[type="text"]');
            if (input && text) {
                var quote = '「' + (text.length > 30 ? text.slice(0, 30) + '…' : text) + '」';
                input.value = quote + '\n' + (input.value || '');
                input.focus();
                if (typeof showNotification === 'function') showNotification('已引用，可继续输入', 'info', 1200);
            }
        } else if (action === 'favorite') {
            // 复用现有收藏功能（如果存在）
            if (typeof window.toggleFavorite === 'function') {
                window.toggleFavorite(wrapper.dataset.msgId);
            } else if (typeof showNotification === 'function') {
                showNotification('收藏功能开发中', 'info', 1000);
            }
        }
    }

    // ── 伴侣自动给用户消息加反应 ──
    function maybeAutoReact(wrapper) {
        if (!wrapper) return;
        if (!wrapper.classList.contains('sent')) return; // 只给用户消息加
        var msgId = wrapper.dataset.msgId;
        if (!msgId) return;
        // 已有反应的不重复加
        if (getReaction(msgId)) return;
        // 15% 概率加反应
        if (Math.random() > 0.15) return;
        // 根据消息内容选反应
        var text = getWrapperText(wrapper);
        var pick = 'like';
        if (/想你|喜欢|爱你|么么|亲/.test(text)) pick = 'love';
        else if (/哈哈|笑|搞笑|666|牛逼/.test(text)) pick = 'laugh';
        else if (/什么|为什么|怎么|？|\?$/.test(text)) pick = 'question';
        else if (/!!|！$|厉害|牛/.test(text)) pick = 'exclaim';
        else if (/讨厌|烦|差/.test(text)) pick = 'dislike';
        setReaction(msgId, pick);
        // 延迟显示，模拟"对方正在反应"
        setTimeout(function () { renderReactionOnWrapper(wrapper); }, rand(800, 2500));
    }

    function rand(min, max) { return min + Math.random() * (max - min); }

    // ── MutationObserver：新消息渲染反应 + 伴侣自动反应 ──
    function observe() {
        var container = document.querySelector('.chat-container, #chat-container');
        if (!container) { setTimeout(observe, 500); return; }
        var obs = new MutationObserver(function (mutations) {
            mutations.forEach(function (m) {
                m.addedNodes.forEach(function (node) {
                    if (node.nodeType !== 1) return;
                    var wrappers = [];
                    if (node.classList && node.classList.contains('message-wrapper')) wrappers.push(node);
                    if (node.querySelectorAll) {
                        node.querySelectorAll('.message-wrapper').forEach(function (w) { wrappers.push(w); });
                    }
                    wrappers.forEach(function (w) {
                        renderReactionOnWrapper(w);
                        maybeAutoReact(w);
                    });
                });
            });
        });
        obs.observe(container, { childList: true, subtree: true });
    }

    // ── 初始化 ──
    function init() {
        try { bind(); } catch (e) { console.error('[Tapback] 绑定失败:', e); }
        try { observe(); } catch (e) {}
        try { renderAllReactions(); } catch (e) {}
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // 暴露
    window.Tapback = {
        renderAll: renderAllReactions,
        setReaction: function (msgId, rid) {
            setReaction(msgId, rid);
            var w = document.querySelector('.message-wrapper[data-msg-id="' + msgId + '"]');
            renderReactionOnWrapper(w);
        }
    };
})();
