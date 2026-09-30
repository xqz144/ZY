/**
 * 伴侣状态系统（纯展示型）
 * - 情绪状态 + 互动倾向 两个维度
 * - 不影响回复逻辑，仅展示
 * - 系统预设 + 用户自定义增删
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

    // ── 数据读写 ──
    function defaultData() {
        return {
            current: { mood: null, tendency: null }, // 默认不选中
            customMoods: [],
            customTendencies: []
        };
    }

    function loadData() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                var parsed = JSON.parse(raw);
                if (parsed && typeof parsed === 'object') {
                    var merged = defaultData();
                    merged.current = Object.assign({ mood: null, tendency: null }, parsed.current || {});
                    merged.customMoods = Array.isArray(parsed.customMoods) ? parsed.customMoods : [];
                    merged.customTendencies = Array.isArray(parsed.customTendencies) ? parsed.customTendencies : [];
                    return merged;
                }
            }
        } catch (e) { console.warn('[伴侣状态] 读取失败:', e); }
        return defaultData();
    }

    function saveData(data) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) { console.warn('[伴侣状态] 保存失败:', e); }
    }

    // ── 工具 ──
    function genId(prefix) {
        return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
    }

    function findMood(data, id) {
        var list = getAllMoods(data);
        for (var i = 0; i < list.length; i++) {
            if (list[i].id === id) return list[i];
        }
        return null;
    }

    function findTendency(data, id) {
        var list = getAllTendencies(data);
        for (var i = 0; i < list.length; i++) {
            if (list[i].id === id) return list[i];
        }
        return null;
    }

    function getAllMoods(data) {
        return (PRESET_MOODS || []).concat(data.customMoods || []);
    }

    function getAllTendencies(data) {
        return (PRESET_TENDENCIES || []).concat(data.customTendencies || []);
    }

    function isPresetMood(id) {
        return PRESET_MOODS.some(function (m) { return m.id === id; });
    }
    function isPresetTendency(id) {
        return PRESET_TENDENCIES.some(function (t) { return t.id === id; });
    }

    // ── 触发 UI 更新事件 ──
    function emitChange(data) {
        try {
            var mood = findMood(data, data.current.mood) || null;
            var tend = findTendency(data, data.current.tendency) || null;
            window.dispatchEvent(new CustomEvent('partner-state:changed', {
                detail: {
                    mood: mood,
                    tendency: tend,
                    moodId: data.current.mood,
                    tendencyId: data.current.tendency
                }
            }));
        } catch (e) {}
    }

    // ── 公开 API ──
    window.PartnerState = {
        PRESET_MOODS: PRESET_MOODS,
        PRESET_TENDENCIES: PRESET_TENDENCIES,

        get: function () { return loadData(); },

        getCurrent: function () {
            var data = loadData();
            return {
                mood: findMood(data, data.current.mood) || null,
                tendency: findTendency(data, data.current.tendency) || null
            };
        },

        getAllMoods: function () { return getAllMoods(loadData()); },
        getAllTendencies: function () { return getAllTendencies(loadData()); },

        setMood: function (id) {
            var data = loadData();
            // 切换：再次点击同项 → 取消选中
            data.current.mood = (data.current.mood === id) ? null : id;
            saveData(data);
            emitChange(data);
            return data.current.mood;
        },

        setTendency: function (id) {
            var data = loadData();
            data.current.tendency = (data.current.tendency === id) ? null : id;
            saveData(data);
            emitChange(data);
            return data.current.tendency;
        },

        addMood: function (emoji, text, color) {
            var data = loadData();
            var item = { id: genId('mood'), emoji: emoji || '✨', text: (text || '').trim() || '自定义', color: color || '#BDBDBD' };
            data.customMoods = data.customMoods || [];
            data.customMoods.push(item);
            saveData(data);
            emitChange(data);
            return item;
        },

        removeMood: function (id) {
            var data = loadData();
            if (isPresetMood(id)) return false; // 预设不可删
            data.customMoods = (data.customMoods || []).filter(function (m) { return m.id !== id; });
            if (data.current.mood === id) data.current.mood = null;
            saveData(data);
            emitChange(data);
            return true;
        },

        addTendency: function (emoji, text) {
            var data = loadData();
            var item = { id: genId('tend'), emoji: emoji || '✨', text: (text || '').trim() || '自定义' };
            data.customTendencies = data.customTendencies || [];
            data.customTendencies.push(item);
            saveData(data);
            emitChange(data);
            return item;
        },

        removeTendency: function (id) {
            var data = loadData();
            if (isPresetTendency(id)) return false;
            data.customTendencies = (data.customTendencies || []).filter(function (t) { return t.id !== id; });
            if (data.current.tendency === id) data.current.tendency = null;
            saveData(data);
            emitChange(data);
            return true;
        },

        isPresetMood: isPresetMood,
        isPresetTendency: isPresetTendency
    };

    // ── 启动时触发一次 UI 渲染 ──
    function init() {
        try {
            var cur = window.PartnerState.getCurrent();
            window.dispatchEvent(new CustomEvent('partner-state:changed', {
                detail: { mood: cur.mood, tendency: cur.tendency, init: true }
            }));
        } catch (e) {}
        try { bindPartnerStateUI(); } catch (e) { console.error('[伴侣状态] 绑定失败:', e); }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ────────────────────────────────────────────
    //   UI 层：顶栏胶囊渲染 + 详情弹窗渲染 + 事件委托
    // ────────────────────────────────────────────

    // 当前打开的 tab（默认 mood）
    var _currentTab = 'mood';

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
        } else {
            if (moodEmoji) moodEmoji.textContent = '—';
            if (moodText) moodText.textContent = '情绪';
            if (moodChip) moodChip.classList.remove('ps-chip-active');
        }

        if (cur.tendency) {
            if (tendEmoji) tendEmoji.textContent = cur.tendency.emoji;
            if (tendText) tendText.textContent = cur.tendency.text;
            if (tendChip) tendChip.classList.add('ps-chip-active');
        } else {
            if (tendEmoji) tendEmoji.textContent = '—';
            if (tendText) tendText.textContent = '倾向';
            if (tendChip) tendChip.classList.remove('ps-chip-active');
        }

        // 头像呼吸圈：有任一选中时显示
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

    // ── 详情弹窗网格渲染 ──
    function renderGrid() {
        var grid = document.getElementById('ps-grid');
        if (!grid) return;
        var data = loadData();
        var list = (_currentTab === 'mood') ? getAllMoods(data) : getAllTendencies(data);
        var currentId = (_currentTab === 'mood') ? data.current.mood : data.current.tendency;
        var isPresetFn = (_currentTab === 'mood') ? isPresetMood : isPresetTendency;

        var html = '<div class="ps-grid-inner">';
        list.forEach(function (item) {
            var active = (item.id === currentId) ? ' ps-item-active' : '';
            var colorStyle = (_currentTab === 'mood' && item.color)
                ? ('style="--item-color:' + item.color + ';"')
                : '';
            var delBtn = isPresetFn(item.id)
                ? ''
                : '<span class="ps-item-del" data-del-id="' + item.id + '" title="删除">×</span>';
            html += '<div class="ps-item' + active + '" ' + colorStyle +
                ' data-id="' + item.id + '" data-type="' + _currentTab + '">' +
                '<span class="ps-item-emoji">' + (item.emoji || '✨') + '</span>' +
                '<span class="ps-item-text">' + escapeHTML(item.text || '') + '</span>' +
                delBtn +
                '</div>';
        });
        html += '</div>';
        grid.innerHTML = html;
    }

    function escapeHTML(s) {
        return String(s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function switchTab(tab) {
        _currentTab = tab;
        document.querySelectorAll('.ps-tab').forEach(function (btn) {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        // 颜色选择器仅情绪有意义
        var colorInput = document.getElementById('ps-add-color');
        if (colorInput) colorInput.style.display = (tab === 'mood') ? '' : 'none';
        renderGrid();
    }

    // ── 事件委托（避免被 cloneNode 覆盖） ──
    var _bound = false;
    function bindPartnerStateUI() {
        if (_bound) return;
        _bound = true;

        // 1. 顶栏胶囊点击 → 打开详情
        document.addEventListener('click', function (e) {
            var chip = e.target.closest && e.target.closest('#partner-state-chips .ps-chip, #partner-state-entry');
            if (!chip) return;
            try {
                var sm = document.getElementById('settings-modal');
                var fm = document.getElementById('partner-state-modal');
                if (sm && typeof window.hideModal === 'function') window.hideModal(sm);
                if (fm && typeof window.showModal === 'function') window.showModal(fm);
                renderGrid();
            } catch (err) { console.error('[伴侣状态] 打开失败:', err); }
        });

        // 2. Tab 切换
        document.addEventListener('click', function (e) {
            var tab = e.target.closest && e.target.closest('.ps-tab');
            if (!tab) return;
            switchTab(tab.dataset.tab);
        });

        // 3. 状态项点击：切换 / 删除
        document.addEventListener('click', function (e) {
            var del = e.target.closest && e.target.closest('.ps-item-del');
            if (del) {
                // 删除自定义
                var delId = del.dataset.delId;
                if (_currentTab === 'mood') window.PartnerState.removeMood(delId);
                else window.PartnerState.removeTendency(delId);
                renderGrid();
                renderChips();
                if (typeof window.showNotification === 'function') {
                    window.showNotification('已删除', 'info', 1200);
                }
                return;
            }
            var item = e.target.closest && e.target.closest('.ps-item');
            if (!item) return;
            var id = item.dataset.id;
            var type = item.dataset.type;
            if (!id || !type) return;
            if (type === 'mood') window.PartnerState.setMood(id);
            else window.PartnerState.setTendency(id);
            renderGrid();
            renderChips();
        });

        // 4. 添加自定义
        document.addEventListener('click', function (e) {
            var addBtn = e.target.closest && e.target.closest('#ps-add-btn');
            if (!addBtn) return;
            var emojiEl = document.getElementById('ps-add-emoji');
            var textEl = document.getElementById('ps-add-text');
            var colorEl = document.getElementById('ps-add-color');
            var emoji = emojiEl ? emojiEl.value.trim() : '';
            var text = textEl ? textEl.value.trim() : '';
            var color = colorEl ? colorEl.value : '#BDBDBD';
            if (!text) {
                if (typeof window.showNotification === 'function') {
                    window.showNotification('请输入状态文字', 'warning', 1500);
                }
                return;
            }
            if (_currentTab === 'mood') {
                window.PartnerState.addMood(emoji, text, color);
            } else {
                window.PartnerState.addTendency(emoji, text);
            }
            if (emojiEl) emojiEl.value = '';
            if (textEl) textEl.value = '';
            renderGrid();
            renderChips();
            if (typeof window.showNotification === 'function') {
                window.showNotification('已添加', 'success', 1200);
            }
        });

        // 5. 监听状态变化 → 更新顶栏胶囊
        window.addEventListener('partner-state:changed', function () {
            renderChips();
        });

        // 初始渲染
        renderChips();
    }

    // 暴露渲染方法（调试/外部调用）
    window.PartnerState.renderChips = renderChips;
    window.PartnerState.renderGrid = renderGrid;
    window.PartnerState.switchTab = switchTab;
})();
