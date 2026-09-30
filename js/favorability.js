/**
 * 好感度系统
 * - 只管字卡门槛，不直接影响回复风格
 * - 数值 0-100，分 5 个阶段
 * - 存储在 localStorage，key: favorability
 */
(function () {
    'use strict';

    var STORAGE_KEY = 'favorability';
    var DAILY_GAIN_CAP = 15;       // 每天好感度增长上限
    var HISTORY_DAYS = 30;         // 历史记录保留天数

    // 阶段定义
    var STAGES = [
        { min: 0,  max: 20, name: '陌生人', color: '#9E9E9E' },
        { min: 21, max: 40, name: '认识',   color: '#64B5F6' },
        { min: 41, max: 60, name: '熟悉',   color: '#4FC3F7' },
        { min: 61, max: 80, name: '暧昧',   color: '#F48FB1' },
        { min: 81, max: 100, name: '恋人',   color: '#E91E63' }
    ];

    // ── 数据读写 ──
    function loadData() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (raw) return JSON.parse(raw);
        } catch (e) { console.warn('[好感度] 读取失败:', e); }
        return defaultData();
    }

    function defaultData() {
        return {
            value: 0,
            lastChatDate: null,
            streakDays: 0,
            dailyGain: 0,
            dailyGainDate: null,
            history: [],
            milestonesClaimed: [],
            lastReadNoReplyCheck: null   // 已读不回检查锚点（幂等）
        };
    }

    function saveData(data) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) { console.warn('[好感度] 保存失败:', e); }
    }

    // ── 工具函数 ──
    function todayStr() {
        var d = new Date();
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    }
    function pad(n) { return n < 10 ? '0' + n : '' + n; }

    function getStage(value) {
        for (var i = STAGES.length - 1; i >= 0; i--) {
            if (value >= STAGES[i].min) return STAGES[i];
        }
        return STAGES[0];
    }

    // ── 字卡门槛 map（key=字卡文本, value=门槛0-100）──
    var GATE_KEY = 'card_favor_gates';
    function loadGateMap() {
        try {
            var raw = localStorage.getItem(GATE_KEY);
            if (raw) return JSON.parse(raw) || {};
        } catch (e) {}
        return {};
    }
    function saveGateMap(map) {
        try { localStorage.setItem(GATE_KEY, JSON.stringify(map)); } catch (e) {}
    }
    // 取某张卡的门槛（对象卡用 favorGate 字段；字符串卡查 map）
    function getCardGate(c, gates) {
        gates = gates || loadGateMap();
        if (typeof c === 'string') {
            return typeof gates[c] === 'number' ? gates[c] : 0;
        }
        if (c && typeof c === 'object') {
            return typeof c.favorGate === 'number' ? c.favorGate : 0;
        }
        return 0;
    }

    // 重置每日增长计数（跨天自动重置）
    function ensureDailyReset(data) {
        var today = todayStr();
        if (data.dailyGainDate !== today) {
            data.dailyGainDate = today;
            data.dailyGain = 0;
        }
    }

    // 更新连续天数
    function updateStreak(data) {
        var today = todayStr();
        if (data.lastChatDate === today) return; // 今天已聊过
        if (data.lastChatDate) {
            var last = new Date(data.lastChatDate);
            var diff = Math.round((new Date(today) - last) / 86400000);
            if (diff === 1) {
                data.streakDays = (data.streakDays || 0) + 1;
            } else if (diff > 1) {
                data.streakDays = 1; // 断了重新算
            }
        } else {
            data.streakDays = 1;
        }
        data.lastChatDate = today;
    }

    // 记录历史
    function pushHistory(data) {
        var today = todayStr();
        var last = data.history && data.history.length ? data.history[data.history.length - 1] : null;
        if (last && last.date === today) {
            last.value = data.value;
        } else {
            data.history.push({ date: today, value: data.value });
            if (data.history.length > HISTORY_DAYS) data.history.shift();
        }
    }

    // ── 核心：增减好感度 ──
    function change(delta, reason) {
        var data = loadData();
        ensureDailyReset(data);

        // 增长受每日上限约束（减少不受限）
        if (delta > 0) {
            var remaining = DAILY_GAIN_CAP - data.dailyGain;
            if (remaining <= 0) return data; // 今日已满
            delta = Math.min(delta, remaining);
            data.dailyGain += delta;
        }

        var oldValue = data.value;
        var oldStage = getStage(oldValue);

        // 减少时不低于当前阶段下限
        if (delta < 0) {
            var floor = oldStage.min;
            data.value = Math.max(floor, data.value + delta);
        } else {
            data.value = Math.min(100, data.value + delta);
        }

        var newStage = getStage(data.value);
        var leveledUp = newStage.min > oldStage.min;

        updateStreak(data);
        pushHistory(data);
        saveData(data);

        // 触发 UI 更新事件
        try {
            window.dispatchEvent(new CustomEvent('favorability:changed', {
                detail: { value: data.value, delta: delta, reason: reason, leveledUp: leveledUp, stage: newStage.name }
            }));
        } catch (e) {}

        return data;
    }

    // ── 公开 API ──
    window.Favorability = {
        STAGES: STAGES,

        get: function () { return loadData(); },

        getStage: function () { return getStage(loadData().value); },

        getValue: function () { return loadData().value; },

        /** 用户发消息时调用 */
        onUserMessage: function (text) {
            var data = loadData();
            ensureDailyReset(data);

            var delta = 1; // 基础 +1
            if (text && text.length > 20) delta += 1; // 长消息额外 +1

            // 关键词检测
            if (text) {
                var t = text;
                if (/(晚安|睡了|安~?)/.test(t)) { this._markDailySpecial(data, 'goodnight'); delta += 3; }
                else if (/(早安|早啊?|早上好)/.test(t)) { this._markDailySpecial(data, 'goodmorning'); delta += 3; }
                else if (/(想你|想念|想你了)/.test(t)) { this._markDailySpecial(data, 'missyou'); delta += 3; }
            }

            change(delta, 'user_message');

            // 连续 7 天奖励
            if (data.streakDays > 0 && data.streakDays % 7 === 0) {
                this._claimStreakBonus(data);
            }

            return this.getValue();
        },

        // 每日特殊关键词只触发一次
        _dailySpecials: {},
        _markDailySpecial: function (data, key) {
            var today = todayStr();
            var k = today + ':' + key;
            if (this._dailySpecials[k]) return false;
            this._dailySpecials[k] = true;
            return true;
        },

        _streakBonusClaimed: {},
        _claimStreakBonus: function (data) {
            var today = todayStr();
            var k = today + ':streak' + data.streakDays;
            if (this._streakBonusClaimed[k]) return;
            this._streakBonusClaimed[k] = true;
            change(5, 'streak_bonus');
        },

        /** 手动设置好感度（控剧情/测试用） */
        setValue: function (value) {
            var data = loadData();
            data.value = Math.max(0, Math.min(100, Math.round(value)));
            pushHistory(data);
            saveData(data);
            try {
                window.dispatchEvent(new CustomEvent('favorability:changed', {
                    detail: { value: data.value, delta: 0, reason: 'manual', leveledUp: false, stage: getStage(data.value).name }
                }));
            } catch (e) {}
            return data.value;
        },

        /** 每日衰减检查（3天没聊每天-2），应在启动时调用一次 */
        checkDailyDecay: function () {
            var data = loadData();
            if (!data.lastChatDate) return;
            var diff = Math.round((new Date(todayStr()) - new Date(data.lastChatDate)) / 86400000);
            if (diff > 3) {
                var days = diff - 3; // 超过3天后开始扣
                change(-2 * days, 'inactive_decay');
            }
        },

        /** 字卡门槛过滤：只返回门槛 <= 当前好感度的卡 */
        filterCards: function (cards) {
            var fav = this.getValue();
            if (!Array.isArray(cards)) return [];
            var gates = loadGateMap();
            return cards.filter(function (c) {
                var gate = getCardGate(c, gates);
                return gate <= fav;
            });
        },

        /** 从卡对象/字符串中提取纯文本 */
        cardText: function (c) {
            if (typeof c === 'string') return c;
            if (c && typeof c === 'object') return c.text || '';
            return '';
        },

        // ── 字卡门槛管理 ──
        getGate: function (text) {
            var gates = loadGateMap();
            return getCardGate(text, gates);
        },
        setGate: function (text, gate) {
            if (!text) return;
            var gates = loadGateMap();
            var g = Math.max(0, Math.min(100, parseInt(gate, 10) || 0));
            if (g === 0) {
                delete gates[text]; // 0 门槛直接删除记录，节省空间
            } else {
                gates[text] = g;
            }
            saveGateMap(gates);
            return g;
        },
        removeGate: function (text) {
            var gates = loadGateMap();
            delete gates[text];
            saveGateMap(gates);
        },
        getAllGates: function () { return loadGateMap(); },
        /** 门槛对应的阶段名 */
        gateStage: function (gate) {
            var s = getStage(gate);
            return s.name;
        }
    };

    // 启动时检查衰减 + 渲染 + 绑定入口
    function init() {
        try { window.Favorability.checkDailyDecay(); } catch (e) {}
        try { renderFavorabilityUI(); } catch (e) {}
        try { bindFavorabilityEntry(); } catch (e) {}
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ── UI 渲染 ──
    function renderFavorabilityUI() {
        var data = loadData();
        var fill = document.getElementById('fav-fill');
        var num = document.getElementById('fav-num');
        if (fill) fill.style.width = data.value + '%';
        if (num) num.textContent = data.value;
    }

    function showFavFloat(delta) {
        if (!delta) return;
        var bar = document.getElementById('favorability-bar');
        if (!bar) return;
        var rect = bar.getBoundingClientRect();
        var el = document.createElement('div');
        el.className = 'fav-float';
        el.textContent = (delta > 0 ? '+' : '') + delta;
        el.style.color = delta > 0 ? '#E91E63' : '#757575';
        el.style.left = (rect.left + rect.width / 2 - 10) + 'px';
        el.style.top = (rect.top - 5) + 'px';
        document.body.appendChild(el);
        setTimeout(function () { el.remove(); }, 1200);
    }

    var LEVELUP_MESSAGES = {
        '认识': '……跟你聊天还挺有意思的。',
        '熟悉': '哼，才不是特意等你消息呢。',
        '暧昧': '……跟你待久了，居然有点习惯了。',
        '恋人': '以后，只能是我。'
    };

    function showLevelUp(stageName) {
        if (document.querySelector('.fav-levelup-overlay')) return;
        var overlay = document.createElement('div');
        overlay.className = 'fav-levelup-overlay';
        var msg = LEVELUP_MESSAGES[stageName] || '好感度提升了。';
        overlay.innerHTML =
            '<div class="fav-levelup-card">' +
            '<div class="fav-stage-title">💕 ' + stageName + '</div>' +
            '<div class="fav-stage-sub">' + msg + '</div>' +
            '</div>';
        document.body.appendChild(overlay);
        overlay.addEventListener('click', function () { overlay.remove(); });
        setTimeout(function () { overlay.remove(); }, 3000);
    }

    // 监听好感度变化
    window.addEventListener('favorability:changed', function (e) {
        try {
            renderFavorabilityUI();
            if (e.detail && e.detail.delta) showFavFloat(e.detail.delta);
            if (e.detail && e.detail.leveledUp) showLevelUp(e.detail.stage);
        } catch (err) {}
    });

    // 暴露 UI 刷新方法
    window.Favorability.refreshUI = renderFavorabilityUI;

    // ── 设置入口绑定（事件委托，避免被其他模块的 cloneNode 覆盖） ──
    var _entryBound = false;
    var _sliderBound = false;
    var _applyBound = false;

    function bindFavorabilityEntry() {
        if (!_entryBound) {
            _entryBound = true;
            document.addEventListener('click', function (e) {
                var entry = e.target.closest && e.target.closest('#favorability-entry');
                if (!entry) return;
                console.log('[好感度] 入口被点击');
                try {
                    var sm = document.getElementById('settings-modal');
                    var fm = document.getElementById('favorability-modal');
                    if (sm && typeof window.hideModal === 'function') window.hideModal(sm);
                    if (fm && typeof window.showModal === 'function') window.showModal(fm);
                    renderFavorabilityDetail();
                } catch (err) { console.error('[好感度] 打开详情失败:', err); }
            });
        }

        // 手动滑块（事件委托）
        if (!_sliderBound) {
            _sliderBound = true;
            document.addEventListener('input', function (e) {
                var slider = e.target;
                if (slider && slider.id === 'fav-manual-slider') {
                    var valEl = document.getElementById('fav-manual-val');
                    if (valEl) valEl.textContent = slider.value;
                }
            });
        }
        if (!_applyBound) {
            _applyBound = true;
            document.addEventListener('click', function (e) {
                var applyBtn = e.target.closest && e.target.closest('#fav-manual-apply');
                if (!applyBtn) return;
                var slider = document.getElementById('fav-manual-slider');
                if (!slider) return;
                var v = parseInt(slider.value, 10);
                if (!isNaN(v)) {
                    window.Favorability.setValue(v);
                    renderFavorabilityDetail();
                    if (typeof window.showNotification === 'function') {
                        window.showNotification('好感度已调整为 ' + v, 'info', 1500);
                    }
                }
            });
        }

        // 顶栏小条点击 → 打开详情
        if (!window._favBarBound) {
            window._favBarBound = true;
            document.addEventListener('click', function (e) {
                var bar = e.target.closest && e.target.closest('#favorability-bar');
                if (!bar) return;
                try {
                    var fm = document.getElementById('favorability-modal');
                    if (fm && typeof window.showModal === 'function') {
                        window.showModal(fm);
                        renderFavorabilityDetail();
                    }
                } catch (err) {}
            });
        }
    }

    function renderFavorabilityDetail() {
        var data = loadData();
        var stage = getStage(data.value);
        var nextStage = null;
        for (var i = 0; i < STAGES.length; i++) {
            if (STAGES[i].min > data.value) { nextStage = STAGES[i]; break; }
        }
        var toNext = nextStage ? (nextStage.min - data.value) : 0;
        var detail = document.getElementById('favorability-detail');
        if (!detail) return;

        // 历史曲线（简单柱状）
        var historyHTML = '';
        if (data.history && data.history.length > 0) {
            var max = 100;
            historyHTML = '<div style="display:flex;align-items:flex-end;gap:2px;height:50px;margin-top:10px;">';
            data.history.forEach(function (h) {
                var h2 = Math.max(2, (h.value / max) * 50);
                historyHTML += '<div style="flex:1;max-width:10px;background:var(--accent-color);border-radius:2px 2px 0 0;height:' + h2 + 'px;" title="' + h.date + ': ' + h.value + '"></div>';
            });
            historyHTML += '</div>';
        }

        detail.innerHTML =
            '<div style="text-align:center;padding:10px 0 16px;">' +
            '<div style="font-size:42px;font-weight:700;color:' + stage.color + ';">' + data.value + '</div>' +
            '<div style="font-size:14px;color:var(--text-secondary);margin-top:2px;">当前阶段：' + stage.name + '</div>' +
            (nextStage ? '<div style="font-size:12px;color:var(--text-secondary);margin-top:6px;">距 ' + nextStage.name + ' 还差 ' + toNext + ' 点</div>' : '<div style="font-size:12px;color:#E91E63;margin-top:6px;">已达最高阶段 💕</div>') +
            '</div>' +
            '<div style="padding:10px 12px;background:var(--secondary-bg);border-radius:10px;font-size:12px;color:var(--text-secondary);line-height:1.8;">' +
            '<div>连续聊天：<span style="color:var(--text-primary);font-weight:600;">' + (data.streakDays || 0) + ' 天</span></div>' +
            '<div>今日已获得：<span style="color:var(--text-primary);font-weight:600;">' + (data.dailyGain || 0) + ' / 15 点</span></div>' +
            '</div>' +
            '<div style="margin-top:14px;">' +
            '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:4px;">近 30 天变化</div>' +
            historyHTML +
            '</div>';

        // 同步手动滑块
        var slider = document.getElementById('fav-manual-slider');
        var valEl = document.getElementById('fav-manual-val');
        if (slider) slider.value = data.value;
        if (valEl) valEl.textContent = data.value;
    }

    window.Favorability.renderDetail = renderFavorabilityDetail;
})();
