/**
 * 已读/送达状态 + 回执节奏（iMessage 风格）
 * - 用户发消息后显示"已送达"✓
 * - 根据伴侣状态延迟改为"已读"✓✓
 * - 生气/想独处/在忙 → 已读很慢甚至"已读不回"
 * - 开心/想念/黏人 → 秒读
 * - 用 MutationObserver，无需改 core.js
 */
(function () {
    'use strict';

    var processed = new WeakSet();

    // ── 根据伴侣状态决定已读延迟（毫秒），-1 = 不读（已读不回）──
    function getReadDelay() {
        var cur = window.PartnerState ? window.PartnerState.getCurrent() : null;
        if (!cur) return 2000;
        var mood = cur.moodId || (cur.mood && cur.mood.id) || '';
        var tend = cur.tendencyId || (cur.tendency && cur.tendency.id) || '';

        // 在忙 / 想睡觉 → 不读
        if (tend === 'tend_work' || tend === 'tend_sleepy') return -1;
        // 想独处 + 负面情绪 → 已读不回
        if (tend === 'tend_solo' && (mood === 'mood_angry' || mood === 'mood_sad')) return -1;
        // 生气 → 15-40秒
        if (mood === 'mood_angry') return 15000 + Math.random() * 25000;
        // 难过 → 8-20秒
        if (mood === 'mood_sad') return 8000 + Math.random() * 12000;
        // 不舒服 → 5-15秒
        if (mood === 'mood_sick') return 5000 + Math.random() * 10000;
        // 困倦 → 4-10秒
        if (mood === 'mood_tired') return 4000 + Math.random() * 6000;
        // 想念 / 黏人 → 秒读
        if (mood === 'mood_miss' || tend === 'tend_sticky') return 500 + Math.random() * 1500;
        // 开心 / 兴奋 / 害羞 → 快读
        if (mood === 'mood_happy' || mood === 'mood_excited' || mood === 'mood_shy') return 800 + Math.random() * 2000;
        // 平静 / 话多 → 正常
        return 2000 + Math.random() * 3000;
    }

    function escapeHTML(s) {
        return String(s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function addStatus(wrapper) {
        if (!wrapper || processed.has(wrapper)) return;
        if (!wrapper.classList.contains('sent')) return;
        var bubble = wrapper.querySelector('.message, .voice-message-bubble');
        if (!bubble) return;

        processed.add(wrapper);
        bubble.style.position = 'relative';

        // 移除旧 status
        var old = bubble.querySelector('.msg-status');
        if (old) old.remove();

        var status = document.createElement('div');
        status.className = 'msg-status msg-status-sent';
        status.innerHTML = '已送达';
        bubble.appendChild(status);

        // 延迟改为已读
        var delay = getReadDelay();
        if (delay < 0) {
            // 已读不回：保持"已送达"（也可以加个灰色提示）
            return;
        }
        setTimeout(function () {
            if (!document.body.contains(status)) return;
            status.className = 'msg-status msg-status-read';
            status.innerHTML = '已读';
        }, delay);
    }

    function renderAll() {
        document.querySelectorAll('.message-wrapper.sent').forEach(addStatus);
    }

    function observe() {
        var container = document.querySelector('.chat-container, #chat-container');
        if (!container) { setTimeout(observe, 500); return; }
        var obs = new MutationObserver(function (mutations) {
            mutations.forEach(function (m) {
                m.addedNodes.forEach(function (node) {
                    if (node.nodeType !== 1) return;
                    var list = [];
                    if (node.classList && node.classList.contains('message-wrapper') && node.classList.contains('sent')) list.push(node);
                    if (node.querySelectorAll) {
                        node.querySelectorAll('.message-wrapper.sent').forEach(function (w) { list.push(w); });
                    }
                    list.forEach(addStatus);
                });
            });
        });
        obs.observe(container, { childList: true, subtree: true });
    }

    function init() {
        try { observe(); } catch (e) {}
        try { renderAll(); } catch (e) {}
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.MessageStatus = { refresh: renderAll };
})();
