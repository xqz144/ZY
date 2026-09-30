/**
 * 字卡门槛编辑器（可视化所见即所得）
 * - 从 customReplies 读取所有字卡
 * - 每张卡可设置好感度门槛（0-100）
 * - 门槛存到 favorability.js 的 gate map
 * - 支持按分组筛选
 * - 不改动 reply-library.js 的字卡存储逻辑
 */
(function () {
    'use strict';

    var _bound = false;
    var _filter = '';          // 文本筛选
    var _groupFilter = '__all__'; // 分组筛选

    function escapeHTML(s) {
        return String(s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    // 获取所有字卡（字符串数组）
    function getAllCards() {
        try {
            if (typeof customReplies !== 'undefined' && Array.isArray(customReplies)) {
                return customReplies.slice();
            }
        } catch (e) {}
        return [];
    }

    // 获取分组
    function getGroups() {
        try {
            return window.customReplyGroups || [];
        } catch (e) {}
        return [];
    }

    // 字卡所属分组名
    function cardGroupName(text, groups) {
        for (var i = 0; i < groups.length; i++) {
            var g = groups[i];
            if (g && Array.isArray(g.items) && g.items.indexOf(text) >= 0) {
                return g.name || '未命名分组';
            }
        }
        return '未分组';
    }

    // 阶段名映射
    function stageName(gate) {
        if (typeof window.Favorability === 'object' && window.Favorability.gateStage) {
            return window.Favorability.gateStage(gate);
        }
        if (gate <= 20) return '陌生人';
        if (gate <= 40) return '认识';
        if (gate <= 60) return '熟悉';
        if (gate <= 80) return '暧昧';
        return '恋人';
    }

    // 渲染编辑器
    function render() {
        var root = document.getElementById('card-editor-list');
        if (!root) return;

        var groups = getGroups();
        var allCards = getAllCards();
        var fav = window.Favorability ? window.Favorability.getValue() : 0;
        var gates = window.Favorability ? window.Favorability.getAllGates() : {};

        // 顶部好感度提示
        var hint = document.getElementById('card-editor-fav-hint');
        if (hint) {
            var stage = window.Favorability ? window.Favorability.getStage() : null;
            hint.innerHTML = '当前好感度：<b style="color:var(--accent-color)">' + fav + '</b>' +
                (stage ? '（' + stage.name + '）' : '') +
                ' · 共 <b>' + allCards.length + '</b> 张字卡';
        }

        // 分组下拉
        var groupSel = document.getElementById('card-editor-group-sel');
        if (groupSel) {
            var cur = _groupFilter;
            var opts = '<option value="__all__">全部字卡</option>' +
                '<option value="__ungrouped__">未分组</option>';
            groups.forEach(function (g) {
                opts += '<option value="' + escapeHTML(g.name || '') + '">' +
                    escapeHTML(g.name || '未命名分组') + '</option>';
            });
            groupSel.innerHTML = opts;
            groupSel.value = cur;
        }

        // 过滤
        var filtered = allCards.filter(function (text) {
            if (_filter && text.indexOf(_filter) < 0) return false;
            if (_groupFilter === '__all__') return true;
            if (_groupFilter === '__ungrouped__') {
                return cardGroupName(text, groups) === '未分组';
            }
            return cardGroupName(text, groups) === _groupFilter;
        });

        // 渲染卡片
        if (filtered.length === 0) {
            root.innerHTML = '<div style="padding:30px 10px;text-align:center;color:var(--text-secondary);font-size:13px;">' +
                (allCards.length === 0 ? '字卡库为空，请先在「字卡」中添加' : '没有匹配的字卡') +
                '</div>';
            return;
        }

        var html = '<div class="ce-grid">';
        filtered.forEach(function (text) {
            var gate = typeof gates[text] === 'number' ? gates[text] : 0;
            var locked = gate > fav;
            var stage = stageName(gate);
            var groupName = cardGroupName(text, groups);
            var lockedTag = locked
                ? '<span class="ce-card-locked">🔒 需 ' + stage + ' (' + gate + ')</span>'
                : (gate > 0 ? '<span class="ce-card-open">已解锁</span>' : '');
            html += '<div class="ce-card' + (locked ? ' ce-card-locked-bg' : '') + '" data-text="' + escapeHTML(text) + '">' +
                '<div class="ce-card-text">' + escapeHTML(text) + '</div>' +
                '<div class="ce-card-meta">' +
                '<span class="ce-card-group">' + escapeHTML(groupName) + '</span>' +
                lockedTag +
                '</div>' +
                '<div class="ce-card-gate">' +
                '<label>门槛</label>' +
                '<input type="range" min="0" max="100" step="1" value="' + gate + '" data-gate-input="' + escapeHTML(text) + '">' +
                '<span class="ce-card-gate-val" data-gate-val="' + escapeHTML(text) + '">' + gate + '</span>' +
                '<span class="ce-card-gate-stage">' + stage + '</span>' +
                '</div>' +
                '</div>';
        });
        html += '</div>';
        root.innerHTML = html;
    }

    // 绑定（事件委托）
    function bind() {
        if (_bound) return;
        _bound = true;

        // 1. 入口点击 → 打开弹窗
        document.addEventListener('click', function (e) {
            var entry = e.target.closest && e.target.closest('#card-editor-entry');
            if (!entry) return;
            try {
                var sm = document.getElementById('settings-modal');
                var fm = document.getElementById('card-editor-modal');
                if (sm && typeof window.hideModal === 'function') window.hideModal(sm);
                if (fm && typeof window.showModal === 'function') window.showModal(fm);
                render();
            } catch (err) { console.error('[字卡编辑器] 打开失败:', err); }
        });

        // 2. 滑块变化 → 实时更新
        document.addEventListener('input', function (e) {
            var slider = e.target.closest && e.target.closest('[data-gate-input]');
            if (!slider) return;
            var text = slider.dataset.gateInput;
            var val = parseInt(slider.value, 10) || 0;
            var valEl = document.querySelector('[data-gate-val="' + CSS.escape(text) + '"]');
            if (valEl) valEl.textContent = val;
            // 阶段名更新
            var stageEl = slider.parentElement.querySelector('.ce-card-gate-stage');
            if (stageEl) stageEl.textContent = stageName(val);
            window.Favorability.setGate(text, val);
            // 锁定状态更新
            updateCardLockState(text, val);
        });

        // 3. 文本筛选
        document.addEventListener('input', function (e) {
            var inp = e.target.closest && e.target.closest('#card-editor-search');
            if (!inp) return;
            _filter = inp.value.trim();
            render();
        });

        // 4. 分组筛选
        document.addEventListener('change', function (e) {
            var sel = e.target.closest && e.target.closest('#card-editor-group-sel');
            if (!sel) return;
            _groupFilter = sel.value;
            render();
        });

        // 5. 一键清除所有门槛
        document.addEventListener('click', function (e) {
            var clr = e.target.closest && e.target.closest('#card-editor-clear-all');
            if (!clr) return;
            if (!confirm('确定清除所有字卡的好感度门槛吗？此操作不可撤销。')) return;
            try {
                localStorage.removeItem('card_favor_gates');
            } catch (err) {}
            render();
            if (typeof window.showNotification === 'function') {
                window.showNotification('已清除所有门槛', 'info', 1500);
            }
        });
    }

    function updateCardLockState(text, gate) {
        var card = document.querySelector('.ce-card[data-text="' + CSS.escape(text) + '"]');
        if (!card) return;
        var fav = window.Favorability ? window.Favorability.getValue() : 0;
        var locked = gate > fav;
        card.classList.toggle('ce-card-locked-bg', locked);
        // 更新 meta 标签
        var meta = card.querySelector('.ce-card-meta');
        if (meta) {
            var old = meta.querySelector('.ce-card-locked, .ce-card-open');
            if (old) old.remove();
            var tag = document.createElement('span');
            if (locked) {
                tag.className = 'ce-card-locked';
                tag.textContent = '🔒 需 ' + stageName(gate) + ' (' + gate + ')';
            } else if (gate > 0) {
                tag.className = 'ce-card-open';
                tag.textContent = '已解锁';
            } else {
                tag = null;
            }
            if (tag) meta.appendChild(tag);
        }
    }

    function init() {
        try { bind(); } catch (e) { console.error('[字卡编辑器] 绑定失败:', e); }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // 暴露
    window.CardEditor = { render: render, refresh: render };
})();
