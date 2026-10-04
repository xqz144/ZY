/**
 * 伴侣状态系统（全自动版）
 * - 情绪状态 + 互动倾向 两个维度
 * - 不影响回复逻辑，仅展示
 * - 完全自动驱动：聊天驱动 + 好感度联动 + 随机微抖动
 * - localStorage 持久化，key: partner_state
 */
(function () {
    'use strict';

    var STORAGE_KEY = 'partner_state';

    // ── 系统预设 ──
    var PRESET_MOODS = [
        { id: 'mood_happy',    emoji: '😊', text: '开心', color: '#FFD54F' },
        { id: 'mood_calm',     emoji: '😌', text: '平静', color: '#90CAF9' },
        { id: 'mood_sad',      emoji: '😢', text: '难过', color: '#90A4AE' },
        { id: 'mood_angry',    emoji: '😤', text: '生气', color: '#EF9A9A' },
        { id: 'mood_miss',     emoji: '🥺', text: '想念', color: '#CE93D8' },
        { id: 'mood_shy',      emoji: '😳', text: '害羞', color: '#F48FB1' },
        { id: 'mood_tired',    emoji: '😴', text: '困倦', color: '#B0BEC5' },
        { id: 'mood_excited',  emoji: '🤩', text: '兴奋', color: '#FF8A65' },
        { id: 'mood_sick',     emoji: '🤒', text: '不舒服', color: '#A1887F' }
    ];

    var PRESET_TENDENCIES = [
        { id: 'tend_talkative', emoji: '💬', text: '话多' },
        { id: 'tend_quiet',     emoji: '🤫', text: '话少' },
        { id: 'tend_sticky',    emoji: '🫶', text: '想黏人' },
        { id: 'tend_solo',      emoji: '🧊', text: '想独处' },
        { id: 'tend_playful',   emoji: '😜', text: '想皮一下' },
        { id: 'tend_sweet',     emoji: '🍯', text: '想撒糖' },
        { id: 'tend_sleepy',    emoji: '🌙', text: '想睡觉' },
        { id: 'tend_work',      emoji: '💼', text: '在忙' }
    ];

    // ── 情绪相近池（用于随机微抖动，避免跳到毫不相关的情绪）──
    var MOOD_NEIGHBORS = {
        mood_happy:   ['mood_excited', 'mood_calm', 'mood_shy'],
        mood_calm:    ['mood_happy', 'mood_tired', 'mood_calm'],
        mood_sad:     ['mood_miss', 'mood_tired', 'mood_angry'],
        mood_angry:   ['mood_sad', 'mood_miss', 'mood_calm'],
        mood_miss:    ['mood_sad', 'mood_shy', 'mood_happy'],
        mood_shy:     ['mood_happy', 'mood_miss', 'mood_calm'],
        mood_tired:   ['mood_calm', 'mood_sleepy', 'mood_sad'],
        mood_excited: ['mood_happy', 'mood_playful', 'mood_shy'],
        mood_sick:    ['mood_tired', 'mood_sad', 'mood_calm']
    };

    // ── 关键词触发规则（聊天驱动）──
    // 命中关键词 → 设置对应情绪，附带 reason
    var KEYWORD_RULES = [
        { keys: ['想你', '想你了', '好想', '怀念', '惦记'], mood: 'mood_miss',  reason: '你说想我了' },
        { keys: ['早安', '早上好', '起床', '醒了'],         mood: 'mood_happy', reason: '你跟我说了早安' },
        { keys: ['晚安', '睡觉', '睡了', '休息'],           mood: 'mood_tired', reason: '你说要睡觉了' },
        { keys: ['对不起', '抱歉', '不好意思'],             mood: 'mood_sad',   reason: '你跟我道歉了' },
        { keys: ['生气', '气死', '烦死', '讨厌'],           mood: 'mood_angry', reason: '你好像在生气' },
        { keys: ['生病', '难受', '不舒服', '感冒'],         mood: 'mood_sick',  reason: '你说你不舒服' },
        { keys: ['兴奋', '太棒了', '开心', '好耶'],         mood: 'mood_excited', reason: '你听起来很兴奋' },
        { keys: ['害羞', '脸红', '不好意思说'],             mood: 'mood_shy',  reason: '你害羞了' },
        { keys: ['忙', '工作', '加班', '开会'],             tendency: 'tend_work', reason: '你说在忙' }
    ];

    // ── 好感度阶段 → 倾向映射 ──
    var FAV_STAGE_TENDENCY = [
        { max: 20,  tendency: 'tend_solo',     reason: '我们还不熟，先各自待着' },     // 陌生人
        { max: 40,  tendency: 'tend_quiet',    reason: '刚认识，话还不多' },            // 认识
        { max: 60,  tendency: 'tend_talkative',reason: '我们越来越熟了' },             // 熟悉
        { max: 80,  tendency: 'tend_sticky',   reason: '好感度到暧昧阶段了，想黏着你' }, // 暧昧
        { max: 100, tendency: 'tend_sweet',    reason: '已经是恋人了，想撒糖' }        // 恋人
    ];

    // ── 数据读写 ──
    function defaultData() {
        return {
            current: { mood: 'mood_calm', tendency: 'tend_quiet' }, // 默认平静+话少
            reason: { mood: '刚开始，先静一静', tendency: '刚认识，话还不多' },
            lastUpdate: Date.now(),
            lastUserMessage: 0,  // 上次用户发消息时间戳，0 表示从未
            messageCount: 0       // 本次会话累计消息数
        };
    }

    function loadData() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                var parsed = JSON.parse(raw);
                if (parsed && typeof parsed === 'object') {
                    var merged = defaultData();
                    merged.current = Object.assign(merged.current, parsed.current || {});
                    merged.reason = Object.assign(merged.reason, parsed.reason || {});
                    merged.lastUpdate = parsed.lastUpdate || Date.now();
                    merged.lastUserMessage = parsed.lastUserMessage || 0;
                    merged.messageCount = parsed.messageCount || 0;
                    return merged;
                }
            }
        } catch (e) { console.warn('[伴侣状态] 读取失败:', e); }
        return defaultData();
    }

    function saveData(data) {
        try {
            data.lastUpdate = Date.now();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) { console.warn('[伴侣状态] 保存失败:', e); }
    }

    // ── 工具 ──
    function findMood(id) {
        for (var i = 0; i < PRESET_MOODS.length; i++) {
            if (PRESET_MOODS[i].id === id) return PRESET_MOODS[i];
        }
        return null;
    }
    function findTendency(id) {
        for (var i = 0; i < PRESET_TENDENCIES.length; i++) {
            if (PRESET_TENDENCIES[i].id === id) return PRESET_TENDENCIES[i];
        }
        return null;
    }

    // ── 触发 UI 更新事件 ──
    function emitChange(data) {
        try {
            window.dispatchEvent(new CustomEvent('partner-state:changed', {
                detail: {
                    mood: findMood(data.current.mood),
                    tendency: findTendency(data.current.tendency),
                    moodId: data.current.mood,
                    tendencyId: data.current.tendency,
                    reason: data.reason,
                    lastUpdate: data.lastUpdate,
                    lastUserMessage: data.lastUserMessage
                }
            }));
        } catch (e) {}
    }

    // ── 内部：强制设置状态（自动模式用，不触发取消逻辑）──
    function _setMood(data, id, reason) {
        if (!findMood(id)) return;
        data.current.mood = id;
        data.reason = data.reason || {};
        data.reason.mood = reason || '';
    }
    function _setTendency(data, id, reason) {
        if (!findTendency(id)) return;
        data.current.tendency = id;
        data.reason = data.reason || {};
        data.reason.tendency = reason || '';
    }

    // ════════════════════════════════════════════
    //   AutoState 自动驱动引擎
    // ════════════════════════════════════════════

    var AutoState = {
        // 聊天驱动：用户发消息时调用
        onUserMessage: function (text) {
            var data = loadData();
            var now = Date.now();
            data.lastUserMessage = now;
            data.messageCount = (data.messageCount || 0) + 1;

            // 1. 关键词触发优先
            var hit = null;
            text = String(text || '');
            for (var i = 0; i < KEYWORD_RULES.length; i++) {
                var rule = KEYWORD_RULES[i];
                for (var j = 0; j < rule.keys.length; j++) {
                    if (text.indexOf(rule.keys[j]) >= 0) { hit = rule; break; }
                }
                if (hit) break;
            }
            if (hit) {
                if (hit.mood) _setMood(data, hit.mood, hit.reason);
                if (hit.tendency) _setTendency(data, hit.tendency, hit.reason);
                saveData(data);
                emitChange(data);
                return;
            }

            // 2. 默认：用户发消息 → 开心
            // 但如果当前已经是 happy/excited/shy，不重复切换（避免每次发消息都"重置"）
            var cur = data.current.mood;
            if (cur !== 'mood_happy' && cur !== 'mood_excited' && cur !== 'mood_shy') {
                _setMood(data, 'mood_happy', '你刚给我发了消息');
            }

            // 3. 倾向：用户连续发多条 → 话多；否则保持当前
            if (data.messageCount >= 3 && data.current.tendency !== 'tend_talkative') {
                _setTendency(data, 'tend_talkative', '你连续说了好多话');
            }

            saveData(data);
            emitChange(data);
        },

        // 好感度联动：好感度变化时调用
        onFavorabilityChange: function (fav) {
            var data = loadData();
            // 找到当前好感度对应的倾向
            var stage = FAV_STAGE_TENDENCY[0];
            for (var i = 0; i < FAV_STAGE_TENDENCY.length; i++) {
                if (fav <= FAV_STAGE_TENDENCY[i].max) { stage = FAV_STAGE_TENDENCY[i]; break; }
            }
            // 只有倾向变化时才更新（避免每次好感度+1都触发）
            if (data.current.tendency !== stage.tendency) {
                _setTendency(data, stage.tendency, stage.reason);
                saveData(data);
                emitChange(data);
            }
        },

        // 随机微抖动：定时检查，30% 概率切换到相近情绪
        tick: function () {
            var data = loadData();
            var now = Date.now();

            // ── 检查长时间未聊天 → 想念/生气 ──
            if (data.lastUserMessage > 0) {
                var silenceMin = (now - data.lastUserMessage) / 60000;
                if (silenceMin >= 60 && data.current.mood !== 'mood_miss' && data.current.mood !== 'mood_angry') {
                    // 超过 1 小时没聊 → 70% 想念，30% 生气
                    if (Math.random() < 0.7) {
                        _setMood(data, 'mood_miss', '你一个小时没理我了……');
                        _setTendency(data, 'tend_sticky', '想让你来找我');
                    } else {
                        _setMood(data, 'mood_angry', '你怎么这么久都不理我！');
                    }
                    saveData(data);
                    emitChange(data);
                    return;
                }
                if (silenceMin >= 30 && silenceMin < 60 && data.current.mood === 'mood_happy') {
                    // 30-60 分钟：从开心转为想念
                    _setMood(data, 'mood_miss', '你有一会儿没说话了');
                    saveData(data);
                    emitChange(data);
                    return;
                }
            }

            // ── 时段感知：深夜 → 困倦 ──
            var hour = new Date().getHours();
            if ((hour >= 0 && hour < 6) && data.current.mood !== 'mood_tired' && data.current.mood !== 'mood_sleepy' && data.current.mood !== 'mood_sick') {
                if (Math.random() < 0.5) {
                    _setMood(data, 'mood_tired', '夜深了，有点困');
                    _setTendency(data, 'tend_sleepy', '想睡觉了');
                    saveData(data);
                    emitChange(data);
                    return;
                }
            }

            // ── 随机微抖动：30% 概率切换到相近情绪 ──
            // 但要求距离上次更新 > 30 分钟，避免频繁跳
            var sinceUpdateMin = (now - (data.lastUpdate || 0)) / 60000;
            if (sinceUpdateMin >= 30 && Math.random() < 0.3) {
                var neighbors = MOOD_NEIGHBORS[data.current.mood] || ['mood_calm'];
                var next = neighbors[Math.floor(Math.random() * neighbors.length)];
                if (next !== data.current.mood) {
                    var m = findMood(next);
                    _setMood(data, next, '心情有些小波动');
                    saveData(data);
                    emitChange(data);
                }
            }
        },

        // 重置会话计数（页面刷新时调用，避免 messageCount 跨会话累积）
        resetSession: function () {
            var data = loadData();
            data.messageCount = 0;
            saveData(data);
        }
    };

    // ── 公开 API ──
    window.PartnerState = {
        PRESET_MOODS: PRESET_MOODS,
        PRESET_TENDENCIES: PRESET_TENDENCIES,

        get: function () { return loadData(); },

        getCurrent: function () {
            var data = loadData();
            return {
                mood: findMood(data.current.mood),
                tendency: findTendency(data.current.tendency),
                reason: data.reason,
                lastUpdate: data.lastUpdate,
                lastUserMessage: data.lastUserMessage
            };
        },

        // 暴露给 core.js 调用
        onUserMessage: AutoState.onUserMessage,
        onFavorabilityChange: AutoState.onFavorabilityChange,
        tick: AutoState.tick
    };

    // ── 启动 ──
    var _tickTimer = null;
    function init() {
        try {
            // 1. 触发一次 UI 渲染
            var cur = window.PartnerState.getCurrent();
            window.dispatchEvent(new CustomEvent('partner-state:changed', {
                detail: { mood: cur.mood, tendency: cur.tendency, reason: cur.reason, init: true }
            }));
        } catch (e) {}
        try { bindPartnerStateUI(); } catch (e) { console.error('[伴侣状态] 绑定失败:', e); }

        // 2. 启动时跑一次 tick（处理长时间未聊天的状态）
        try { AutoState.tick(); } catch (e) {}

        // 3. 监听好感度变化 → 联动倾向
        try {
            window.addEventListener('favorability:changed', function (e) {
                try {
                    var fav = (e.detail && typeof e.detail.value === 'number') ? e.detail.value : 0;
                    AutoState.onFavorabilityChange(fav);
                } catch (err) {}
            });
        } catch (e) {}

        // 4. 定时器：每 10 分钟跑一次 tick（检查沉默/时段/微抖动）
        try {
            if (_tickTimer) clearInterval(_tickTimer);
            _tickTimer = setInterval(function () {
                try { AutoState.tick(); } catch (e) {}
            }, 10 * 60 * 1000);
        } catch (e) {}
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ────────────────────────────────────────────
    //   UI 层：顶栏胶囊 + 详情弹窗（只读查看）
    // ────────────────────────────────────────────

    function escapeHTML(s) {
        return String(s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function timeAgo(ts) {
        if (!ts) return '从未';
        var sec = Math.floor((Date.now() - ts) / 1000);
        if (sec < 60) return '刚刚';
        if (sec < 3600) return Math.floor(sec / 60) + ' 分钟前';
        if (sec < 86400) return Math.floor(sec / 3600) + ' 小时前';
        return Math.floor(sec / 86400) + ' 天前';
    }

    function renderChips() {
        var cur = window.PartnerState.getCurrent();
        var moodEmoji = document.getElementById('ps-mood-emoji');
        var moodText = document.getElementById('ps-mood-text');
        var tendEmoji = document.getElementById('ps-tend-emoji');
        var tendText = document.getElementById('ps-tend-text');
        var moodChip = document.getElementById('ps-mood-chip');
        var tendChip = document.getElementById('ps-tend-chip');

        if (cur.mood) {
            if (moodEmoji) moodEmoji.textContent = cur.mood.emoji;
            if (moodText) moodText.textContent = cur.mood.text;
            if (moodChip) moodChip.style.setProperty('--chip-color', cur.mood.color || '#BDBDBD');
            if (moodChip) moodChip.classList.add('ps-chip-active');
        }
        if (cur.tendency) {
            if (tendEmoji) tendEmoji.textContent = cur.tendency.emoji;
            if (tendText) tendText.textContent = cur.tendency.text;
            if (tendChip) tendChip.classList.add('ps-chip-active');
        }

        applyAvatarRing();
    }

    function applyAvatarRing() {
        var avatar = document.getElementById('partner-avatar');
        if (!avatar) return;
        var cur = window.PartnerState.getCurrent();
        var color = '#E91E63';
        if (cur.mood && cur.mood.color) color = cur.mood.color;
        avatar.style.setProperty('--state-ring-color', color);
        if (cur.mood || cur.tendency) {
            avatar.classList.add('has-state-ring');
        } else {
            avatar.classList.remove('has-state-ring');
        }
    }

    // ── 详情弹窗：只读查看当前状态 + 驱动原因 ──
    function renderDetail() {
        var root = document.getElementById('ps-detail');
        if (!root) return;
        var cur = window.PartnerState.getCurrent();
        var data = loadData();

        var mood = cur.mood || { emoji: '—', text: '—', color: '#BDBDBD' };
        var tend = cur.tendency || { emoji: '—', text: '—' };

        var html = '';
        // 当前状态卡片
        html += '<div class="ps-now-card">';
        html += '<div class="ps-now-row" style="--state-color:' + (mood.color || '#BDBDBD') + ';">';
        html += '<div class="ps-now-emoji">' + (mood.emoji || '—') + '</div>';
        html += '<div class="ps-now-info">';
        html += '<div class="ps-now-label">情绪状态</div>';
        html += '<div class="ps-now-value">' + escapeHTML(mood.text || '—') + '</div>';
        html += '<div class="ps-now-reason">' + escapeHTML((cur.reason && cur.reason.mood) || '—') + '</div>';
        html += '</div></div>';

        html += '<div class="ps-now-row">';
        html += '<div class="ps-now-emoji">' + (tend.emoji || '—') + '</div>';
        html += '<div class="ps-now-info">';
        html += '<div class="ps-now-label">互动倾向</div>';
        html += '<div class="ps-now-value">' + escapeHTML(tend.text || '—') + '</div>';
        html += '<div class="ps-now-reason">' + escapeHTML((cur.reason && cur.reason.tendency) || '—') + '</div>';
        html += '</div></div>';
        html += '</div>';

        // 驱动机制说明
        html += '<div class="ps-auto-explain">';
        html += '<div class="ps-auto-title">状态自动驱动机制</div>';
        html += '<ul class="ps-auto-list">';
        html += '<li><b>聊天驱动</b>：你发消息时，根据内容和频率自动调整情绪</li>';
        html += '<li><b>好感度联动</b>：好感度阶段决定互动倾向（陌生→独处，暧昧→黏人）</li>';
        html += '<li><b>沉默感知</b>：长时间没聊天，会变得想念或闹小情绪</li>';
        html += '<li><b>随机微抖动</b>：心情会有小波动，不会一直不变</li>';
        html += '</ul>';
        html += '</div>';

        // 时间信息
        html += '<div class="ps-time-info">';
        html += '<div>状态更新：' + timeAgo(data.lastUpdate) + '</div>';
        html += '<div>上次你发消息：' + timeAgo(data.lastUserMessage) + '</div>';
        html += '</div>';

        root.innerHTML = html;
    }

    // ── 事件委托 ──
    var _bound = false;
    function bindPartnerStateUI() {
        if (_bound) return;
        _bound = true;

        // 1. 顶栏胶囊 / 设置入口点击 → 打开详情（只读）
        document.addEventListener('click', function (e) {
            var chip = e.target.closest && e.target.closest('#partner-state-chips .ps-chip, #partner-state-entry');
            if (!chip) return;
            try {
                var sm = document.getElementById('settings-modal');
                var fm = document.getElementById('partner-state-modal');
                if (sm && typeof window.hideModal === 'function') window.hideModal(sm);
                if (fm && typeof window.showModal === 'function') window.showModal(fm);
                renderDetail();
            } catch (err) { console.error('[伴侣状态] 打开失败:', err); }
        });

        // 2. 监听状态变化 → 更新顶栏胶囊 + 详情（如果开着）
        window.addEventListener('partner-state:changed', function () {
            renderChips();
            // 如果详情弹窗开着，刷新内容
            var fm = document.getElementById('partner-state-modal');
            if (fm && fm.style.display === 'flex') renderDetail();
        });

        renderChips();
    }

    window.PartnerState.renderChips = renderChips;
    window.PartnerState.renderDetail = renderDetail;
})();
