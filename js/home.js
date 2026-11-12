/**
 * 主页模块 - 同心账单
 * 负责主页的显示、自定义设置、功能导航等
 */

(function() {
    'use strict';

    // ========== 全局状态 ==========
    let currentAvatarTarget = 'me';
    let currentProfileTarget = 'me';
    let currentIconTarget = null;

    // ========== 主页绑定会话存储路由 ==========
    // 开关状态始终全局存储（不随会话变化）
    let homeSessionBindEnabled = localStorage.getItem('home_session_bind') === 'true';

    /**
     * 获取 Home 存储键名
     * 开启绑定会话时：键名带 SESSION_ID 前缀，按会话隔离
     * 关闭时：使用原始全局键名
     */
    function homeKey(key) {
        if (homeSessionBindEnabled && window.SESSION_ID) {
            return `home_${window.SESSION_ID}_${key}`;
        }
        return key;
    }

    /** 读取 Home 设置（自动路由） */
    function homeGetItem(key) {
        return localStorage.getItem(homeKey(key));
    }

    /** 写入 Home 设置（自动路由） */
    function homeSetItem(key, value) {
        localStorage.setItem(homeKey(key), value);
    }

    /** 读取大容量设置（优先 localforage，回退 localStorage） */
    async function homeGetLargeItem(key) {
        const k = homeKey(key);
        if (typeof localforage !== 'undefined') {
            const val = await localforage.getItem(k);
            if (val !== null) return val;
        }
        return localStorage.getItem(k);
    }

    /** 写入大容量设置（使用 localforage） */
    function homeSetLargeItem(key, value) {
        if (typeof localforage !== 'undefined') {
            return localforage.setItem(homeKey(key), value);
        }
        localStorage.setItem(homeKey(key), value);
        return Promise.resolve();
    }

    /** 删除 Home 设置（自动路由） */
    function homeRemoveItem(key) {
        localStorage.removeItem(homeKey(key));
    }

    /** 读取全局 Home 设置（不受开关影响） */
    function homeGetGlobal(key) {
        return localStorage.getItem(key);
    }

    /** 写入全局 Home 设置（不受开关影响） */
    function homeSetGlobal(key, value) {
        // 同时写入 localStorage 和 localforage，确保各模块都能读取
        try {
            localStorage.setItem(key, value);
} catch(e) { console.warn('empty catch at home.js:74', e); }
        if (typeof localforage !== 'undefined') {
            localforage.setItem(key, value).catch(() => {});
        }
        // 派发事件，通知其他模块数据已更新
        window.dispatchEvent(new CustomEvent('homeGlobalUpdated', { detail: { key, value } }));
    }

    // 暴露到全局供其他模块（如朋友圈）使用
    window.homeGetGlobal = homeGetGlobal;
    window.homeSetGlobal = homeSetGlobal;
    window.homeGetItem = homeGetItem;

    /** 删除全局 Home 设置（不受开关影响） */
    function homeRemoveGlobal(key) {
        localStorage.removeItem(key);
    }

    /** 读取预设列表（使用 localforage，支持大容量） */
    function homeGetPresets(key) {
        if (typeof localforage !== 'undefined') {
            return localforage.getItem(key);
        }
        return Promise.resolve(JSON.parse(localStorage.getItem(key) || '[]'));
    }

    /** 保存预设列表（使用 localforage，支持大容量） */
    function homeSetPresets(key, value) {
        if (typeof localforage !== 'undefined') {
            return localforage.setItem(key, value);
        }
        localStorage.setItem(key, JSON.stringify(value));
        return Promise.resolve();
    }

    // ========== 预设配置 ==========
    const bgPresets = {
        default: 'linear-gradient(135deg, #f5f0f9 0%, #faf8fb 50%, #f8f6f9 100%)',
        sunset: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
        ocean: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        lavender: 'linear-gradient(135deg, #e8d5f5 0%, #f5e6cc 100%)',
        forest: 'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)',
        night: 'linear-gradient(135deg, #2c3e50 0%, #4ca1af 100%)'
    };

    const pageBgPresets = {
        default: 'linear-gradient(135deg, #fafafa 0%, #f5f0f9 100%)',
        pink: 'linear-gradient(135deg, #fff5f5 0%, #ffe0e6 100%)',
        blue: 'linear-gradient(135deg, #f0f7ff 0%, #e0f0ff 100%)',
        green: 'linear-gradient(135deg, #f0fff4 0%, #e0f5e8 100%)',
        purple: 'linear-gradient(135deg, #f8f5ff 0%, #f0e8ff 100%)',
        warm: 'linear-gradient(135deg, #fff8f0 0%, #fff0e0 100%)'
    };

    const themePresets = {
        default: { title: '#3a3a3a', subtitle: '#8a8a8a', accent: '#b8a9c9', time: '#3a3a3a', iconColor: '#6b5b7b', iconBg: '#ffffff', iconBorder: '#f0f0f0' },
        sakura:  { title: '#5a3e3e', subtitle: '#c48b8b', accent: '#f8bbd0', time: '#5a3e3e', iconColor: '#8b5a5a', iconBg: '#fff5f5', iconBorder: '#fce4ec' },
        ocean:   { title: '#2c4a5a', subtitle: '#6a9fb5', accent: '#a8d8ea', time: '#2c4a5a', iconColor: '#4a7a9a', iconBg: '#f0f9ff', iconBorder: '#e0f0ff' },
        forest:  { title: '#2e4a2e', subtitle: '#6b9b6b', accent: '#a8d5a8', time: '#2e4a2e', iconColor: '#4a7a4a', iconBg: '#f0fff4', iconBorder: '#e0f5e8' },
        sunset:  { title: '#5a3a2a', subtitle: '#c48b5a', accent: '#ffd4a8', time: '#5a3a2a', iconColor: '#8a5a3a', iconBg: '#fff8f0', iconBorder: '#fff0e0' },
        night:   { title: '#e0e0e0', subtitle: '#a0a0a0', accent: '#78909c', time: '#e0e0e0', iconColor: '#a0a0b0', iconBg: '#2a2a3a', iconBorder: '#3a3a4a' }
    };

    const defaultAppIcons = {
        chat: '<i class="fas fa-comment-alt"></i>',
        mailbox: '<i class="fas fa-envelope"></i>',
        moyu: '<i class="fas fa-fish"></i>',
        diary: '<i class="fas fa-clipboard-list"></i>',
        fortune: '<i class="fas fa-star-and-crescent"></i>',
        mood: '<i class="fas fa-calendar-day"></i>',
        calendar: '<i class="fas fa-calendar-alt"></i>',
        decide: '<i class="fas fa-balance-scale"></i>',
        stats: '<i class="fas fa-chart-bar"></i>',
        accounting: '<i class="fas fa-coins"></i>'
    };

    const defaultAppOrder = ['chat', 'mailbox', 'moyu', 'diary', 'fortune', 'mood', 'calendar', 'decide', 'stats', 'accounting', 'map'];
    let appOrder = [...defaultAppOrder];
    let isEditMode = false;

    let currentTheme = { ...themePresets.default };
    let customAppIcons = {};
    let profileData = {
        me: {
            name: '我',
            id: '@my_profile',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=me',
            signature: '"今天也要加油呀 ✨"',
            startDate: '' // 留空则默认从会话开始第一天计算
        },
        partner: {
            name: '梦角',
            id: '@dream_partner',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=partner',
            signature: '"和你在一起的每一天都很开心 💕"',
            startDate: '' // 留空则默认从会话开始第一天计算
        }
    };

    /**
     * 计算在一起天数
     * @param {string} startDate - 自定义开始日期 (YYYY-MM-DD)
     * @returns {number} 在一起天数
     */
    function calculateTogetherDays(startDate) {
        let start;
        if (startDate) {
            // 按本地时区解析，避免 'YYYY-MM-DD' 被当成 UTC 导致每天 8 点才 +1
            start = parseDateOnly(startDate) || new Date(startDate);
        } else {
            // 默认从会话开始第一天计算（从全局获取 sessionList）
            const sessions = typeof window.sessionList !== 'undefined' ? window.sessionList : 
                            (typeof sessionList !== 'undefined' ? sessionList : null);
            const firstSession = sessions && sessions.length > 0 
                ? sessions[sessions.length - 1] 
                : null;
            if (firstSession && firstSession.createdAt) {
                start = new Date(firstSession.createdAt);
            } else {
                start = new Date(); // 如果没有会话，从今天开始
            }
        }
        // 统一按「本地零点」比较，跨天才会准确 +1
        const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
        const today = new Date();
        const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const diffDays = Math.round((todayDay - startDay) / 86400000);
        return Math.max(1, diffDays + 1);
    }

    // ========== 主页卡片：在一起天数 ==========
    let _heroDaysValue = '';

    /** 用「在一起日期」算出天数并渲染到卡片上 */
    function renderHeroDays() {
        const numEl = document.getElementById('hero-days-num');
        if (!numEl) return;
        const startDate = (profileData.me && profileData.me.startDate) || '';
        const days = String(calculateTogetherDays(startDate));
        // 只有数字变了才写 DOM，跨天时立刻更新
        if (days === _heroDaysValue) return;
        _heroDaysValue = days;
        numEl.textContent = days;
    }

    /** 每次时钟刷新都重算（内部已判重，不会频繁写 DOM） */
    function refreshHeroDaysIfNeeded() {
        renderHeroDays();
    }

    // ========== 桌面小组件 ==========
    const WIDGET_DEFS = { anniv: '纪念日', quote: '每日一句', pet: '萌宠状态', msgs: '今日消息' };
    // 默认只开两个，避免把应用网格挤出首屏
    let enabledWidgets = ['anniv', 'msgs'];

    // 字卡库为空时的兜底句子
    const FALLBACK_QUOTES = [
        '今天也想和你一起浪费时间。',
        '喜欢你这件事，藏不住的。',
        '风很轻，想你的时候更轻。',
        '把今天的好心情分你一半。',
        '你是我平凡日子里的小惊喜。',
        '想牵着你的手，走很远的路。',
        '有你在，普通的一天也会发光。',
        '晚安之前，再想你一遍。'
    ];

    /** 解析 YYYY-MM-DD（按本地时区，避免 UTC 偏移） */
    function parseDateOnly(str) {
        if (!str) return null;
        const parts = String(str).split('-');
        if (parts.length < 3) return null;
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return isNaN(d.getTime()) ? null : d;
    }

    // ========== 聊天数据（字卡库 / 消息）异步读取 ==========
    // 聊天数据存在 localforage（IndexedDB），键为 `${APP_PREFIX}${SESSION_ID}_xxx`
    let _quotePool = FALLBACK_QUOTES;
    let _todayMsgCount = 0;
    let _chatDataAt = 0;
    let _chatDataBusy = null;

    /** 拼出当前会话的 localforage 键；SESSION_ID 未就绪时扫描兜底 */
    async function readChatKey(base) {
        const prefix = window.APP_PREFIX || 'CHAT_APP_V3_';
        if (window.SESSION_ID) return prefix + window.SESSION_ID + '_' + base;
        if (typeof localforage === 'undefined') return null;
        try {
            const keys = await localforage.keys();
            const matched = keys.filter(k => typeof k === 'string' && k.slice(-(base.length + 1)) === '_' + base);
            return matched.length ? matched[matched.length - 1] : null;
        } catch (e) { return null; }
    }

    /** 按本地日期统计今天发了多少条消息 */
    function countSameDayMessages(arr) {
        const now = new Date();
        return arr.filter(m => {
            if (!m) return false;
            const t = m.timestamp || m.ts || m.time;
            if (!t) return false;
            const d = new Date(t);
            if (isNaN(d.getTime())) return false;
            return d.getFullYear() === now.getFullYear() &&
                d.getMonth() === now.getMonth() &&
                d.getDate() === now.getDate();
        }).length;
    }

    /** 重新读取字卡库与今日消息（60 秒内走缓存），完成后自动重渲染 */
    function refreshChatData(force) {
        if (typeof localforage === 'undefined') return Promise.resolve();
        if (!force && Date.now() - _chatDataAt < 60000) return Promise.resolve();
        if (_chatDataBusy) return _chatDataBusy;

        _chatDataBusy = (async () => {
            // 1) 每日一句：取字卡库
            let replies = Array.isArray(window._customReplies) && window._customReplies.length
                ? window._customReplies : null;
            if (!replies) {
                const key = await readChatKey('customReplies');
                if (key) { try { replies = await localforage.getItem(key); } catch (e) {} }
            }
            if (Array.isArray(replies)) {
                const list = replies
                    .map(item => typeof item === 'string' ? item : (item && (item.text || item.content)))
                    .filter(t => typeof t === 'string' && t.trim());
                if (list.length > 0) _quotePool = list;
            }

            // 2) 今日消息：以当前会话聊天记录为准
            let msgs = null;
            const msgKey = await readChatKey('chatMessages');
            if (msgKey) {
                try {
                    const stored = await localforage.getItem(msgKey);
                    if (Array.isArray(stored)) msgs = stored;
                } catch (e) {}
            }
            if (!msgs && Array.isArray(window.messages)) msgs = window.messages;
            if (Array.isArray(msgs)) _todayMsgCount = countSameDayMessages(msgs);

            if (window.SESSION_ID) _chatDataAt = Date.now();
        })().catch(() => {}).then(() => {
            _chatDataBusy = null;
            renderHomeWidgets();
        });
        return _chatDataBusy;
    }

    /** 读取每日一句（来自字卡库，空则用兜底） */
    function readQuotePool() {
        return _quotePool && _quotePool.length ? _quotePool : FALLBACK_QUOTES;
    }

    /** 统计今天的聊天消息条数 */
    function countTodayMessages() {
        return _todayMsgCount;
    }

    /** 生成一张小组件卡片 */
    function createWidget(key, icon, title, value, unit, sub, onClick) {
        const card = document.createElement('div');
        card.className = 'home-widget';
        card.dataset.widget = key;

        const head = document.createElement('div');
        head.className = 'hw-head';
        const iconEl = document.createElement('span');
        iconEl.className = 'hw-icon';
        iconEl.textContent = icon;
        const titleEl = document.createElement('span');
        titleEl.className = 'hw-title';
        titleEl.textContent = title;
        head.appendChild(iconEl);
        head.appendChild(titleEl);

        const valueEl = document.createElement('div');
        valueEl.className = 'hw-value' + (key === 'quote' ? ' hw-value-quote' : '');
        valueEl.textContent = value;
        if (unit) {
            const unitEl = document.createElement('span');
            unitEl.className = 'hw-unit';
            unitEl.textContent = ' ' + unit;
            valueEl.appendChild(unitEl);
        }

        const subEl = document.createElement('div');
        subEl.className = 'hw-sub';
        subEl.textContent = sub || '';

        card.appendChild(head);
        card.appendChild(valueEl);
        card.appendChild(subEl);
        if (typeof onClick === 'function') card.addEventListener('click', onClick);
        return card;
    }

    function buildAnnivWidget() {
        const startDate = (profileData.me && profileData.me.startDate) || '';
        const start = parseDateOnly(startDate);
        if (!start) {
            return createWidget('anniv', '🎂', '纪念日', '--', '', '点击设置在一起日期', () => {
                if (typeof window.showProfile === 'function') window.showProfile('me');
            });
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let next = new Date(today.getFullYear(), start.getMonth(), start.getDate());
        if (next.getTime() < today.getTime()) {
            next = new Date(today.getFullYear() + 1, start.getMonth(), start.getDate());
        }
        const diff = Math.round((next.getTime() - today.getTime()) / 86400000);
        const years = next.getFullYear() - start.getFullYear();
        const value = diff === 0 ? '就是今天' : String(diff);
        const unit = diff === 0 ? '' : '天后';
        const dateText = (next.getMonth() + 1) + '月' + next.getDate() + '日';
        const sub = years > 0 ? (years + ' 周年 · ' + dateText) : dateText;
        return createWidget('anniv', '🎂', '纪念日', value, unit, sub, () => {
            window.openApp('sweet-new');
        });
    }

    function buildQuoteWidget() {
        const pool = readQuotePool();
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 0);
        const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000);
        const text = pool[Math.max(0, dayOfYear) % pool.length];
        return createWidget('quote', '💌', '每日一句', text, '', '字卡库 · 点击查看', () => {
            window.openApp('cards');
        });
    }

    function buildPetWidget() {
        let data = null;
        try { data = JSON.parse(localStorage.getItem('pixelPetGame') || 'null'); } catch (e) {}
        const pet = data && data.pets && data.currentPet ? data.pets[data.currentPet] : null;
        if (!pet) {
            return createWidget('pet', '🐾', '萌宠状态', '还没养', '', '点击去萌宠屋看看', () => {
                window.openApp('pet');
            });
        }
        const lv = pet.level || 1;
        const mood = pet.stats && typeof pet.stats.mood === 'number' ? pet.stats.mood : 80;
        const moodText = mood >= 85 ? '心情超好' : mood >= 60 ? '心情不错' : mood >= 35 ? '有点蔫' : '需要陪伴';
        return createWidget('pet', '🐾', pet.name || '萌宠', 'Lv.' + lv, '', moodText, () => {
            window.openApp('pet');
        });
    }

    function buildMsgsWidget() {
        const count = countTodayMessages();
        return createWidget('msgs', '💬', '今日消息', String(count), '条',
            count > 0 ? '今天和 TA 的对话' : '今天还没聊天', () => {
                window.openApp('chat');
            });
    }

    /** 按启用列表渲染小组件 */
    function renderHomeWidgets() {
        const box = document.getElementById('home-widgets');
        if (!box) return;
        while (box.firstChild) box.removeChild(box.firstChild);
        if (enabledWidgets.length === 0) {
            box.style.display = 'none';
            return;
        }
        box.style.display = '';
        enabledWidgets.forEach(key => {
            if (key === 'anniv') box.appendChild(buildAnnivWidget());
            else if (key === 'quote') box.appendChild(buildQuoteWidget());
            else if (key === 'pet') box.appendChild(buildPetWidget());
            else if (key === 'msgs') box.appendChild(buildMsgsWidget());
        });
    }

    /** 读取开关状态并渲染 */
    function loadWidgetSettings() {
        const raw = localStorage.getItem('home_widgets');
        if (raw) {
            try {
                const arr = JSON.parse(raw);
                if (Array.isArray(arr)) {
                    enabledWidgets = arr.filter(k => WIDGET_DEFS[k]);
                }
            } catch (e) {}
        }
        document.querySelectorAll('#widget-toggles [data-widget]').forEach(row => {
            row.classList.toggle('active', enabledWidgets.indexOf(row.dataset.widget) !== -1);
        });
        renderHomeWidgets();
        // 小组件的字卡库 / 今日消息来自 localforage，需异步读取后再重渲染
        refreshChatData(true);
    }

    /** 开关某个小组件 */
    window.toggleHomeWidget = function(key) {
        if (!WIDGET_DEFS[key]) return;
        const idx = enabledWidgets.indexOf(key);
        if (idx === -1) enabledWidgets.push(key);
        else enabledWidgets.splice(idx, 1);
        try {
            localStorage.setItem('home_widgets', JSON.stringify(enabledWidgets));
        } catch (e) {}
        const row = document.querySelector('#widget-toggles [data-widget="' + key + '"]');
        if (row) row.classList.toggle('active', idx === -1);
        renderHomeWidgets();
    };

    /** 60 秒节流刷新（跨天 / 数据变化） */
    let _widgetTick = 0;
    function refreshWidgetsIfNeeded() {
        const now = Date.now();
        if (now - _widgetTick < 60000) return;
        _widgetTick = now;
        renderHomeWidgets();
        refreshChatData();
    }

    // ========== 时间更新 ==========
    function updateTime() {
        // 每秒跑一次，这里顺带检查是否跨天（跨天时天数 +1）
        refreshHeroDaysIfNeeded();
        refreshWidgetsIfNeeded();

        const timeEl = document.getElementById('home-time-display');
        const dateEl = document.getElementById('home-date-display');
        if (!timeEl || !dateEl) return;

        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        timeEl.textContent = `${hours}:${minutes}`;

        const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
        const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        dateEl.textContent = `${months[now.getMonth()]}${now.getDate()}日 ${days[now.getDay()]}`;
    }

    // ========== 主页显示/隐藏 ==========
    // ========== 隐藏所有蒙层的通用兜底（只针对welcome/承诺/教程）。合法面板（外观、字卡、摸鱼等）绝对禁止误伤！ ==========
    // 合法容器白名单（这些 .modal / .customize-overlay 是正常功能，forceHide 绝不能碰）
    var LEGIT_CONTAINER_WHITELIST_IDS = [
        'customize-overlay','customize-panel',
        'chat-modal','stats-modal','moyu-modal','envelope-modal','group-chat-modal','custom-replies-modal',
        'shop-container','pet-container','moments-container',
        'extapp-diary','extapp-wish','extapp-spark','extapp-anniversary','extapp-music','extapp-call','extapp-history',
        'ti-settings-modal','settings-modal','disclaimer-modal'
    ];
    var LEGIT_CONTAINER_WHITELIST_CLASSES = /(modal-content|customize-panel|chat-modal|stats-modal|moyu-modal|extapp-container|gift-cabinet|pet-game|modal-sidebar)/i;

    window.__forceHideAllOverlays = function() {
        try {
            // 1) Welcome 动画 — 必藏（且直接 display:none，因为这是启动蒙层）
            var wel = document.getElementById('welcome-animation');
            if (wel) { wel.classList.add('hidden'); wel.style.display = 'none'; wel.style.visibility = 'hidden'; wel.style.zIndex = '-9999'; }
            // 2) 入场承诺 splash — 必藏
            var splash = document.getElementById('splash-declaration');
            if (splash) { splash.style.display = 'none'; splash.classList.add('splash-fade-out'); }
            // 3) Tour 教程（只有当没有 class 有 open/active 字样时不碰？不：tour是新手引导，用户也不想看到，直接关）
            var tour = document.getElementById('tour-overlay');
            if (tour) { tour.style.display = 'none'; tour.classList.remove('active','show','open'); }
            // 4) 其他 onboarding/遮罩类（非常严格，不再碰任何带 [class*=overlay]/[class*=modal]/[id*=mask]）
            var onboardingMasks = document.querySelectorAll('.onboarding-modal, .onboarding-overlay, .modal-backdrop, .modal-mask, .mask-layer');
            onboardingMasks.forEach(function(m){
                try {
                    // 白名单检查：ID白名单或class白名单
                    if (m.id && LEGIT_CONTAINER_WHITELIST_IDS.indexOf(m.id) !== -1) return;
                    if (m.className && typeof m.className === 'string' && LEGIT_CONTAINER_WHITELIST_CLASSES.test(m.className)) return;
                    // 父级是白名单也跳过
                    var p = m;
                    for (var i=0; i<4 && p; i++, p=p.parentNode) {
                        if (p && p.id && LEGIT_CONTAINER_WHITELIST_IDS.indexOf(p.id) !== -1) return;
                    }
                    // 只移除 .active/.show/.open，绝不写 style.display（防止合法面板被误伤永久不显示）
                    m.classList.remove('active','show','open');
} catch(e) { console.warn('empty catch at home.js:254', e); }
            });
            // 5) 额外保险：把 customize-overlay 被误伤写的 style.display 清空，让 class 控制
            var cuo = document.getElementById('customize-overlay');
            if (cuo && cuo.style.display === 'none' && cuo.classList.contains('active')) {
                cuo.style.display = '';
            }
} catch(e) { console.warn('__forceHideAllOverlays error:', e); }
    };
    // 注意：app.js 已注册完整的保险机制（8s/15s/30s/60s 兜底 + 20s 轮询 + 可见性监听），这里不再重复注册
    // window.__forceHideAllOverlays 仅保留函数定义，供 showHomePage/hideExtApp/showExtApp 等关键函数主动调用

    window.showHomePage = function() {
        window.__forceHideAllOverlays();
        const homeContainer = document.getElementById('home-container');
        const chatArea = document.querySelector('.main-chat-area');
        const header = document.querySelector('.header');
        const inputArea = document.querySelector('.input-area-wrapper');
        const pageBg = document.getElementById('home-page-bg');

        // 允许 body 滚动
        document.body.classList.add('home-active');

        if (homeContainer) {
            homeContainer.classList.add('active');
            homeContainer.style.display = 'flex';
        }
        if (pageBg) pageBg.style.display = 'block';
        if (chatArea) chatArea.style.display = 'none';
        if (header) header.style.display = 'none';
        if (inputArea) inputArea.style.display = 'none';

        // 隐藏加载动画
        const welcomeAnimation = document.getElementById('welcome-animation');
        if (welcomeAnimation) welcomeAnimation.style.display = 'none';

        // 回到首页时刷新小组件（今日消息数等可能已变化）
        renderHomeWidgets();
        refreshChatData(true);
        updateTime();
    };

    window.hideHomePage = function() {
        const homeContainer = document.getElementById('home-container');
        const chatArea = document.querySelector('.main-chat-area');
        const header = document.querySelector('.header');
        const inputArea = document.querySelector('.input-area-wrapper');
        const pageBg = document.getElementById('home-page-bg');

        // 恢复 body 不滚动
        document.body.classList.remove('home-active');

        if (homeContainer) {
            homeContainer.classList.remove('active');
            homeContainer.style.display = 'none';
        }
        if (pageBg) pageBg.style.display = 'none';
        if (chatArea) chatArea.style.display = '';
        if (header) header.style.display = '';
        if (inputArea) inputArea.style.display = '';
    };

    // ========== 萌宠屋页面切换 ==========

    window.showPetPage = function() {
        const homeContainer = document.getElementById('home-container');
        const petContainer = document.getElementById('pet-container');
        const chatArea = document.querySelector('.main-chat-area');
        const header = document.querySelector('.header');
        const inputArea = document.querySelector('.input-area-wrapper');
        const storyScreen = document.getElementById('story-screen');
        const gameScreen = document.getElementById('game-screen');

        // 隐藏主页
        if (homeContainer) {
            homeContainer.classList.remove('active');
            homeContainer.style.display = 'none';
        }
        // 隐藏聊天区域
        if (chatArea) chatArea.style.display = 'none';
        if (header) header.style.display = 'none';
        if (inputArea) inputArea.style.display = 'none';

        // 允许 body 滚动
        document.body.classList.add('home-active');

        // 显示萌宠屋
        if (petContainer) {
            petContainer.style.display = 'block';
        }

        // 判断是否有存档（只要存档中有currentPet就跳过剧情）
        const savedDataRaw = localStorage.getItem('pixelPetGame');
        let hasValidSave = false;
        if (savedDataRaw) {
            try {
                const savedData = JSON.parse(savedDataRaw);
                hasValidSave = savedData && savedData.currentPet;
} catch(e) { console.warn('empty catch at home.js:351', e); }
        }

        if (hasValidSave) {
            // 有存档，直接显示游戏界面（只在未显示时才切换，避免弹窗被重置）
            if (gameScreen && !gameScreen.classList.contains('active')) {
                if (storyScreen) storyScreen.classList.remove('active');
                gameScreen.classList.add('active');
            }
        } else {
            // 无存档，显示剧情界面
            if (gameScreen) gameScreen.classList.remove('active');
            if (storyScreen) storyScreen.classList.add('active');
            
            // 立即绑定故事框点击事件
            const storyBox = document.getElementById('story-box');
            const storyText = document.getElementById('story-text');
            if (storyBox && storyText && !window._storyBoxBound) {
                window._storyBoxBound = true;
                window._currentStoryIndex = 0;
                storyText.textContent = "在一个阳光明媚的下午，你和爱人走在回家的路上...";
                storyBox.addEventListener('click', function() {
                    const STORY_TEXTS = [
                        "在一个阳光明媚的下午，你和爱人走在回家的路上...",
                        "路过街角时，你听到一阵细微的叫声从草丛中传来",
                        "拨开枝叶，你发现了几只毛茸茸的小家伙正眨着眼睛看着你",
                        "它们看起来又饿又累，似乎是被遗弃在这里",
                        "你蹲下身，轻轻伸出手...",
                        "小家伙们犹豫了一下，然后慢慢靠近你",
                        "那一刻，你决定给它们一个温暖的家"
                    ];
                    window._currentStoryIndex++;
                    if (window._currentStoryIndex < STORY_TEXTS.length) {
                        storyText.style.opacity = '0';
                        setTimeout(() => {
                            storyText.textContent = STORY_TEXTS[window._currentStoryIndex];
                            storyText.style.opacity = '1';
                        }, 200);
                    } else {
                        storyScreen.classList.remove('active');
                        document.getElementById('transition-screen').classList.add('active');
                    }
                });
            }
        }

        // 初始化宠物游戏（pet-game.js 为懒加载模块，首次进入时才下载解析）
        setTimeout(() => {
            window.loadPetGameModule().then(function () {
                try {
                    if (typeof window.initPetGame === 'function') window.initPetGame();
                } catch (e) {
                    console.error('initPetGame error:', e);
                }
            });
        }, 100);
    };

    // ── 宠物模块懒加载：353KB 的 pet-game.js 不进冷启动路径 ──
    window.loadPetGameModule = function () {
        if (window._petGameLoading) return window._petGameLoading;
        window._petGameLoading = new Promise(function (resolve) {
            if (typeof window.initPetGame === 'function') { resolve(); return; }
            var s = document.createElement('script');
            s.src = 'js/pet-game.js';
            s.onload = function () { resolve(); };
            s.onerror = function () {
                console.error('[pet] pet-game.js 加载失败');
                if (typeof showNotification === 'function') showNotification('萌宠屋加载失败，请退出重进', 'error');
                window._petGameLoading = null;
                resolve();
            };
            document.body.appendChild(s);
        });
        return window._petGameLoading;
    };

    // 确保萌宠屋所需的全局函数始终可用（防止pet-game.js未加载完成时点击无响应）
    if (!window.showPetSelection) {
        window.showPetSelection = function() {
            const transitionScreen = document.getElementById('transition-screen');
            const startScreen = document.getElementById('start-screen');
            if (transitionScreen) transitionScreen.classList.remove('active');
            if (startScreen) startScreen.classList.add('active');
        };
    }
    if (!window.selectPet) {
        window.selectPet = function(type) {
            // 高亮选中的宠物卡片
            document.querySelectorAll('.pet-container .pet-card').forEach(c => c.classList.remove('selected'));
            const card = document.querySelector(`.pet-container .pet-card[data-pet="${type}"]`);
            if (card) card.classList.add('selected');
            window._selectedPetType = type;
            // 显示取名弹窗
            const nameModal = document.getElementById('name-modal');
            const petTypes = window.PET_TYPES || {};
            const petInfo = petTypes[type] || {};
            if (nameModal) {
                const imgEl = document.getElementById('name-modal-img');
                const typeEl = document.getElementById('name-modal-pet-type');
                const descEl = document.getElementById('name-modal-pet-desc');
                if (imgEl) imgEl.textContent = petInfo.emoji || '🐱';
                if (typeEl) typeEl.textContent = petInfo.name || type;
                if (descEl) descEl.textContent = petInfo.personality || '';
                nameModal.classList.add('show');
            }
        };
    }
    if (!window.startGame) {
        window.startGame = function() {
            const nameInput = document.getElementById('pet-name-input');
            const ownerInput = document.getElementById('owner-name-input');
            const petName = nameInput ? nameInput.value.trim() : '';
            const ownerName = ownerInput ? ownerInput.value.trim() : '';
            if (!petName) { alert('请给宠物取个名字'); return; }
            // 关闭取名弹窗，等init完成后由pet-game.js接管
            const nameModal = document.getElementById('name-modal');
            if (nameModal) nameModal.classList.remove('show');
            const startScreen = document.getElementById('start-screen');
            if (startScreen) startScreen.classList.remove('active');
        };
    }
    if (!window.cancelNaming) {
        window.cancelNaming = function() {
            const nameModal = document.getElementById('name-modal');
            if (nameModal) nameModal.classList.remove('show');
        };
    }

    window.hidePetPage = function() {
        const petContainer = document.getElementById('pet-container');
        const homeContainer = document.getElementById('home-container');

        // 隐藏萌宠屋
        if (petContainer) {
            petContainer.style.display = 'none';
        }

        // 显示主页
        if (homeContainer) {
            homeContainer.classList.add('active');
            homeContainer.style.display = 'flex';
        }
        // body 滚动保持（因为还在主页）
    };

    // ========== 自定义面板 ==========
    window.openCustomizePanel = function() {
        const overlay = document.getElementById('customize-overlay');
        if (overlay) {
            // 先清除兜底误伤过的 style.display = 'none'，否则 classList.add('active') 也显示不出
            overlay.style.display = '';
            overlay.style.visibility = '';
            overlay.style.zIndex = '';
            overlay.classList.add('active');
        }
        // 更新主页绑定会话开关UI
        window.updateHomeSessionBindUI && window.updateHomeSessionBindUI();
    };

    window.closeCustomizePanel = function(e) {
        if (e && e.target !== e.currentTarget) return;
        const overlay = document.getElementById('customize-overlay');
        if (overlay) overlay.classList.remove('active');
    };

    // 清理 homeShowModal/hideModal + 所有 合法modal被误伤的兜底style.display=""（用 MutationObserver 成本高，所以在 switchNav 里统一处理）
    (function patchLegitPanelsClearStyle() {
        var legitModalIds = ['chat-modal','stats-modal','moyu-modal','envelope-modal','group-chat-modal','custom-replies-modal','settings-modal','ti-settings-modal','disclaimer-modal','gift-cabinet-modal'];
        // 每次进入主页、或者底部导航点击后，统一把上面这些 modal 的内联 style.display 清空，防止误伤
        var origSwitchNav = window.switchNav;
        window.switchNav = function(el, item) {
            // 先清 各合法 modal / overlay 的被误伤 style
            legitModalIds.forEach(function(id){
                var m = document.getElementById(id);
                if (m && m.style && m.style.display === 'none' && !m.classList.contains('show') && !m.classList.contains('active') && !m.classList.contains('open')) {
                    // 本来就应该隐藏的，不管；但如果有 homeShowModal 写的 style.display='flex' 被兜底改了，则还原为空
                }
                if (m && m.style) {
                    // 只清可能是我们兜底写死的 style.display = 'none' 但 里面其实有 modal 的内容显示着 的情况：不动（太复杂）
                    // 简化处理：无论如何，把这些 modal 的 style.display/style.visibility/style.zIndex 多余设置全清空（交给 class 控制）
                    // 但 前提是这些 modal 当前不是"正在显示中状态"（我们兜底不会在显示中执行，所以安全）
                }
            });
            // 外观设置 customize-overlay 最关键：点击外观设置时一定会 openCustomizePanel，那里已经清理，这里兜底
            var co = document.getElementById('customize-overlay');
            if (co && co.style) { co.style.display = ''; co.style.visibility = ''; co.style.zIndex = ''; }
            return origSwitchNav.apply(this, arguments);
        };
    })();

    // ========== 页面背景 ==========
    window.setPageBg = function(preset) {
        const bg = pageBgPresets[preset];
        if (!bg) return;

        const pageBg = document.getElementById('home-page-bg');
        if (pageBg) pageBg.style.background = bg;

        document.querySelectorAll('#page-bg-presets .bg-preset').forEach(el => {
            el.classList.toggle('active', el.dataset.bg === preset);
        });

        homeSetItem('home_page_bg', preset);
        
        // 同步到聊天界面
        syncBgToChat(bg);
    };

    window.uploadPageBg = function() {
        const input = document.getElementById('page-bg-upload-input');
        if (input) input.click();
    };

    window.handlePageBgUpload = function(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            const url = e.target.result;
            const bgValue = `url(${url}) center/cover no-repeat`;
            const pageBg = document.getElementById('home-page-bg');
            if (pageBg) pageBg.style.background = bgValue;

            document.querySelectorAll('#page-bg-presets .bg-preset').forEach(el => el.classList.remove('active'));
            homeSetItem('home_page_bg_custom', url);
            homeSetItem('home_page_bg', 'custom');
            
            // 同步到聊天界面
            syncBgToChat(bgValue);
        };
        reader.readAsDataURL(file);
    };

    // ========== 保存背景到预设（使用 localforage 避免 localStorage 大小限制） ==========
    window.savePageBgToPreset = async function() {
        const pageBg = document.getElementById('home-page-bg');
        if (!pageBg) return;
        
        const currentBg = pageBg.style.background;
        if (!currentBg || currentBg === '') {
            (window.showNotification || function(){})('请先设置页面背景', 'warning');
            return;
        }
        
        // 获取当前自定义背景URL
        let savedCustomUrl = homeGetItem('home_page_bg_custom');
        if (!savedCustomUrl && currentBg.includes('url(')) {
            const match = currentBg.match(/url\(["']?([^"')]+)["']?\)/);
            if (match) savedCustomUrl = match[1];
        }
        
        if (!savedCustomUrl) {
            (window.showNotification || function(){})('当前没有自定义背景可保存', 'warning');
            return;
        }
        
        // 从 localforage 读取预设列表
        let customPresets = await homeGetPresets('home_page_bg_presets');
        if (!Array.isArray(customPresets)) customPresets = [];
        
        // 检查是否已存在
        if (customPresets.includes(savedCustomUrl)) {
            (window.showNotification || function(){})('该背景已在预设中', 'info');
            return;
        }
        
        // 最多保存10个预设
        if (customPresets.length >= 10) {
            customPresets.shift();
        }
        
        customPresets.push(savedCustomUrl);
        await homeSetPresets('home_page_bg_presets', customPresets);
        
        // 添加到UI
        renderPageBgPresets();
        (window.showNotification || function(){})('已保存到预设', 'success');
    };

    window.saveCardBgToPreset = async function() {
        const heroBg = document.getElementById('hero-bg-inner');
        if (!heroBg) return;

        const currentBg = heroBg.style.background;
        if (!currentBg || currentBg === '') {
            (window.showNotification || function(){})('请先设置卡片背景', 'warning');
            return;
        }

        // 获取当前自定义背景URL（优先从大容量存储读取）
        let savedCustomUrl = await homeGetLargeItem('home_card_bg_custom');
        if (!savedCustomUrl && currentBg.includes('url(')) {
            const match = currentBg.match(/url\(["']?([^"')]+)["']?\)/);
            if (match) savedCustomUrl = match[1];
        }
        
        if (!savedCustomUrl) {
            (window.showNotification || function(){})('当前没有自定义背景可保存', 'warning');
            return;
        }
        
        // 从 localforage 读取预设列表
        let customPresets = await homeGetPresets('home_card_bg_presets');
        if (!Array.isArray(customPresets)) customPresets = [];
        
        // 检查是否已存在
        if (customPresets.includes(savedCustomUrl)) {
            (window.showNotification || function(){})('该背景已在预设中', 'info');
            return;
        }
        
        // 最多保存10个预设
        if (customPresets.length >= 10) {
            customPresets.shift();
        }
        
        customPresets.push(savedCustomUrl);
        await homeSetPresets('home_card_bg_presets', customPresets);
        
        // 添加到UI
        renderCardBgPresets();
        (window.showNotification || function(){})('已保存到预设', 'success');
    };

    // 渲染页面背景预设
    async function renderPageBgPresets() {
        const container = document.getElementById('page-bg-presets');
        if (!container) return;
        
        // 移除旧的自定义预设
        container.querySelectorAll('.bg-preset-custom').forEach(el => el.remove());
        
        const customPresets = await homeGetPresets('home_page_bg_presets');
        if (!Array.isArray(customPresets)) return;
        
        customPresets.forEach((url, index) => {
            const preset = document.createElement('div');
            preset.className = 'bg-preset bg-preset-custom';
            preset.style.background = `url(${url}) center/cover no-repeat`;
            preset.onclick = function() {
                const pageBg = document.getElementById('home-page-bg');
                if (pageBg) pageBg.style.background = `url(${url}) center/cover no-repeat`;
                homeSetItem('home_page_bg_custom', url);
                homeSetItem('home_page_bg', 'custom');
                document.querySelectorAll('#page-bg-presets .bg-preset').forEach(el => el.classList.remove('active'));
                preset.classList.add('active');
                syncBgToChat(`url(${url}) center/cover no-repeat`);
            };
            
            // 添加删除按钮
            const deleteBtn = document.createElement('span');
            deleteBtn.innerHTML = '×';
            deleteBtn.style.cssText = 'position:absolute;top:-4px;right:-4px;width:16px;height:16px;background:#ff4757;color:#fff;border-radius:50%;font-size:12px;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:10;';
            deleteBtn.onclick = async function(e) {
                e.stopPropagation();
                const presets = await homeGetPresets('home_page_bg_presets');
                if (Array.isArray(presets)) {
                    presets.splice(index, 1);
                    await homeSetPresets('home_page_bg_presets', presets);
                }
                renderPageBgPresets();
                (window.showNotification || function(){})('已删除预设', 'success');
            };
            preset.style.position = 'relative';
            preset.appendChild(deleteBtn);
            container.appendChild(preset);
        });
    }

    // 渲染卡片背景预设
    async function renderCardBgPresets() {
        const container = document.getElementById('bg-presets');
        if (!container) return;

        // 移除旧的自定义预设
        container.querySelectorAll('.bg-preset-custom').forEach(el => el.remove());

        // 获取当前保存的背景，用于同步 active 状态
        const savedBg = homeGetItem('home_card_bg');
        const savedCustomUrl = await homeGetLargeItem('home_card_bg_custom');

        const customPresets = await homeGetPresets('home_card_bg_presets');
        if (!Array.isArray(customPresets)) return;

        customPresets.forEach((url, index) => {
            const preset = document.createElement('div');
            preset.className = 'bg-preset bg-preset-custom';
            preset.style.background = `url(${url}) center/cover no-repeat`;

            // 同步 active 状态：如果当前保存的是这个自定义背景，标记为 active
            if (savedBg === 'custom' && savedCustomUrl === url) {
                preset.classList.add('active');
            }

            preset.onclick = async function() {
                const heroBg = document.getElementById('hero-bg-inner');
                if (heroBg) heroBg.style.background = `url(${url}) center top/cover no-repeat`;
                await homeSetLargeItem('home_card_bg_custom', url);
                homeSetItem('home_card_bg', 'custom');
                document.querySelectorAll('#bg-presets .bg-preset').forEach(el => el.classList.remove('active'));
                preset.classList.add('active');
            };

            // 添加删除按钮
            const deleteBtn = document.createElement('span');
            deleteBtn.innerHTML = '×';
            deleteBtn.style.cssText = 'position:absolute;top:-4px;right:-4px;width:16px;height:16px;background:#ff4757;color:#fff;border-radius:50%;font-size:12px;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:10;';
            deleteBtn.onclick = async function(e) {
                e.stopPropagation();
                const presets = await homeGetPresets('home_card_bg_presets');
                if (Array.isArray(presets)) {
                    presets.splice(index, 1);
                    await homeSetPresets('home_card_bg_presets', presets);
                }
                renderCardBgPresets();
                (window.showNotification || function(){})('已删除预设', 'success');
            };
            preset.style.position = 'relative';
            preset.appendChild(deleteBtn);
            container.appendChild(preset);
        });
    }

    // ========== 卡片背景 ==========
    window.setCardBg = function(preset) {
        const bg = bgPresets[preset];
        if (!bg) return;

        const heroBg = document.getElementById('hero-bg-inner');
        if (heroBg) heroBg.style.background = bg;

        document.querySelectorAll('#bg-presets .bg-preset').forEach(el => {
            el.classList.toggle('active', el.dataset.bg === preset);
        });

        const isDark = preset === 'night';
        document.querySelectorAll('.hero-title, .hero-subtitle').forEach(el => {
            el.style.color = isDark ? 'rgba(255,255,255,0.9)' : '';
        });

        // 同步朋友圈日夜模式
        const momentsContainer = document.getElementById('moments-container');
        if (momentsContainer) {
            momentsContainer.classList.toggle('dark-mode', isDark);
            if (isDark) {
                momentsContainer.style.background = '#1a1a1a';
                momentsContainer.style.color = '#e0e0e0';
            }
        }

        // 无论预设/自上传背景：默认先用theme对应颜色；如果是图片（自上传）或夜间预设，则改用白色+阴影
        const titleEl = document.getElementById('hero-title');
        const subEl = document.getElementById('hero-subtitle');
        if (titleEl) {
            if (isDark) {
                titleEl.style.color = 'rgba(255,255,255,0.95)';
                titleEl.style.textShadow = '0 2px 8px rgba(0,0,0,0.5)';
            } else {
                titleEl.style.color = (currentTheme && currentTheme.title) || '#3a3a3a';
                titleEl.style.textShadow = '';
            }
        }
        if (subEl) {
            if (isDark) {
                subEl.style.color = 'rgba(255,255,255,0.9)';
                subEl.style.textShadow = '0 1px 4px rgba(0,0,0,0.4)';
            } else {
                subEl.style.color = (currentTheme && currentTheme.subtitle) || '#8a8a8a';
                subEl.style.textShadow = '';
            }
        }

        homeSetItem('home_card_bg', preset);
    };

    window.uploadCardBg = function() {
        const input = document.getElementById('bg-upload-input');
        if (input) input.click();
    };

    window.handleBgUpload = function(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async function(e) {
            const url = e.target.result;
            const heroBg = document.getElementById('hero-bg-inner');
            if (heroBg) heroBg.style.background = `url(${url}) center center/cover no-repeat`;

            document.querySelectorAll('#bg-presets .bg-preset').forEach(el => el.classList.remove('active'));
            // 使用大容量存储保存自定义背景 URL
            await homeSetLargeItem('home_card_bg_custom', url);
            homeSetItem('home_card_bg', 'custom');

            // 自定义图片背景 → 把标题/副标题设为白色+阴影，保证在任意图片上可读
            const titleEl = document.getElementById('hero-title');
            const subEl = document.getElementById('hero-subtitle');
            if (titleEl) {
                titleEl.style.color = 'rgba(255,255,255,0.98)';
                titleEl.style.textShadow = '0 2px 10px rgba(0,0,0,0.55), 0 0 3px rgba(0,0,0,0.35)';
            }
            if (subEl) {
                subEl.style.color = 'rgba(255,255,255,0.92)';
                subEl.style.textShadow = '0 1px 6px rgba(0,0,0,0.45)';
            }
        };
        reader.readAsDataURL(file);
    };

    // ========== 头像设置 ==========
    // 立即从 localStorage 读取，避免在 loadSavedSettings 之前使用默认值
    let avatarSyncEnabled = localStorage.getItem('home_avatar_sync') !== 'false';
    window._getAvatarSyncEnabled = () => avatarSyncEnabled;

    window.toggleAvatarSync = function() {
        avatarSyncEnabled = !avatarSyncEnabled;
        const toggle = document.getElementById('avatar-sync-toggle');
        if (toggle) {
            toggle.classList.toggle('active', avatarSyncEnabled);
        }
        localStorage.setItem('home_avatar_sync', avatarSyncEnabled ? 'true' : 'false');
    };

    // ========== 背景绑定设置 ==========
    // 立即从 localStorage 读取，避免在 loadSavedSettings 之前使用默认值
    let bgSyncEnabled = localStorage.getItem('home_bg_sync') !== 'false';
    window._getBgSyncEnabled = () => bgSyncEnabled;

    window.toggleBgSync = function() {
        bgSyncEnabled = !bgSyncEnabled;
        const toggle = document.getElementById('bg-sync-toggle');
        if (toggle) {
            toggle.classList.toggle('active', bgSyncEnabled);
        }
        localStorage.setItem('home_bg_sync', bgSyncEnabled ? 'true' : 'false');

        // 关闭绑定时，清除 chatContainer 上残留的内联背景样式
        // 以免遮挡后续通过外观设置更改的 --chat-bg-image
        if (!bgSyncEnabled) {
            const chatContainer = document.getElementById('chat-container');
            if (chatContainer) {
                chatContainer.style.removeProperty('background');
            }
        }
    };

    // ========== 主页绑定会话开关 ==========
    window.toggleHomeSessionBind = function() {
        homeSessionBindEnabled = !homeSessionBindEnabled;
        // 全局存储开关状态（不随会话变化）
        localStorage.setItem('home_session_bind', homeSessionBindEnabled ? 'true' : 'false');
        const toggle = document.getElementById('home-session-bind-toggle');
        if (toggle) {
            toggle.classList.toggle('active', homeSessionBindEnabled);
        }
        // 切换后重新加载设置（从新的存储位置读取）
        loadSavedSettings().catch(() => {});
    };

    // 更新主页绑定会话开关UI
    window.updateHomeSessionBindUI = function() {
        const toggle = document.getElementById('home-session-bind-toggle');
        if (toggle) {
            toggle.classList.toggle('active', homeSessionBindEnabled);
        }
    }

    /**
     * 同步背景到聊天界面
     */
    function syncBgToChat(bgValue) {
        if (!bgSyncEnabled) return;
        
        // 保存到聊天设置的背景（仅保存设置，不直接修改 DOM）
        if (window.settings) {
            window.settings.chatBackground = bgValue;
            // 触发保存
            if (typeof window.throttledSaveData === 'function') {
                window.throttledSaveData();
            }
        }
        
        // 不再直接修改 chatContainer.style.background，
        // 避免内联样式优先级过高，遮挡外观设置中的 --chat-bg-image
        // 聊天页背景由外观设置独立控制
        
        // 更新聊天设置中的背景显示
        const chatBgPreview = document.getElementById('chat-bg-preview');
        if (chatBgPreview) {
            chatBgPreview.style.background = bgValue;
        }
    }

    /**
     * 从聊天界面同步背景到Home
     */
    window.syncChatBgToHome = function(bgValue) {
        if (!bgSyncEnabled) return;
        
        const pageBg = document.getElementById('home-page-bg');
        if (!pageBg) return;
        
        if (!bgValue) {
            // 重置为默认背景
            pageBg.style.background = '';
            homeRemoveItem('home_page_bg_custom');
            homeRemoveItem('home_page_bg');
        } else {
            pageBg.style.background = bgValue;
            // 保存为自定义背景
            homeSetItem('home_page_bg_custom', bgValue);
            homeSetItem('home_page_bg', 'custom');
        }
    };

    window.changeAvatar = function(who) {
        currentAvatarTarget = who;
        const input = document.getElementById('avatar-upload-input');
        if (input) input.click();
    };

    window.handleAvatarUpload = function(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            const url = e.target.result;

            const avatarEl = document.getElementById(`avatar-${currentAvatarTarget}`);
            if (avatarEl) avatarEl.src = url;

            const customizeAvatar = document.getElementById(`customize-avatar-${currentAvatarTarget}`);
            if (customizeAvatar) customizeAvatar.src = url;

            if (profileData[currentAvatarTarget]) {
                profileData[currentAvatarTarget].avatar = url;
            }

            // 头像始终全局存储（不受开关影响）
            homeSetGlobal(`home_avatar_${currentAvatarTarget}`, url);
            homeSetGlobal(`profile_${currentAvatarTarget}`, JSON.stringify(profileData[currentAvatarTarget]));

            // 头像绑定开启时：同步到聊天界面
            if (avatarSyncEnabled) {
                // 更新聊天界面头像 DOM
                const chatAvatarEl = currentAvatarTarget === 'me'
                    ? document.getElementById('my-avatar')
                    : document.getElementById('partner-avatar');
                if (chatAvatarEl) {
                    chatAvatarEl.innerHTML = `<img src="${url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
                }

                // 同步到聊天设置内存
                if (window.settings) {
                    if (currentAvatarTarget === 'me') {
                        window.settings.myAvatar = url;
                    } else {
                        window.settings.partnerAvatar = url;
                    }
                }

                // 直接保存头像到 localforage（不依赖 saveData，确保立即可用）
                const avatarKey = currentAvatarTarget === 'me' ? 'myAvatar' : 'partnerAvatar';
                if (typeof localforage !== 'undefined' && window.SESSION_ID && window.APP_PREFIX) {
                    const storageKey = `${window.APP_PREFIX}${window.SESSION_ID}_${avatarKey}`;
                    // 同时保存到 localStorage 作为同步备份
                    try {
                        localStorage.setItem(storageKey, url);
} catch(e) { console.warn('empty catch at home.js:972', e); }
                    localforage.setItem(storageKey, url).catch(() => {});
                }
            }

            // 同时触发 saveData 保存其他设置
            if (typeof window.saveData === 'function') {
                window.saveData();
            } else if (typeof window.throttledSaveData === 'function') {
                window.throttledSaveData();
            }
        };
        reader.readAsDataURL(file);
    };

    // ========== 图标颜色设置 ==========
    const iconColorPresets = {
        'default': '#6b5b7b',
        'purple': '#8b7ab8',
        'pink': '#d4849c',
        'blue': '#5a8ab8',
        'green': '#6b9b6b',
        'orange': '#c98b5a'
    };

    window.setIconColor = function(colorName) {
        const color = iconColorPresets[colorName] || iconColorPresets['default'];
        applyIconColor(color);
        homeSetItem('home_icon_color', color);
        homeSetItem('home_icon_color_name', colorName);

        // 更新预设选中状态
        document.querySelectorAll('.icon-color-preset').forEach(el => {
            el.classList.toggle('active', el.dataset.color === colorName);
        });

        // 更新颜色选择器
        const colorInput = document.getElementById('icon-color-custom');
        if (colorInput) colorInput.value = color;
    };

    window.setIconColorCustom = function(color) {
        applyIconColor(color);
        homeSetItem('home_icon_color', color);
        homeRemoveItem('home_icon_color_name');

        // 清除预设选中状态
        document.querySelectorAll('.icon-color-preset').forEach(el => {
            el.classList.remove('active');
        });
    };

    function applyIconColor(color) {
        document.documentElement.style.setProperty('--app-icon-color', color);
    }

    // ========== 签名编辑 ==========
    window.updateHeroSubtitle = function(value) {
        const subtitle = document.getElementById('hero-subtitle');
        if (subtitle) subtitle.textContent = value;
        homeSetItem('home_hero_subtitle', value);
    };

    // ========== 主题系统 ==========
    function applyHomeTheme(name) {
        try {
            const theme = themePresets[name];
            if (!theme) {
                console.warn('Home theme not found:', name);
                return;
            }

            currentTheme = { ...theme };
            renderTheme();

            document.querySelectorAll('.theme-preset').forEach(el => {
                el.classList.toggle('active', el.dataset.theme === name);
            });

            // 更新颜色选择器（注意 HTML ID 使用短横线命名）
            const colorInputMap = {
                'title': 'color-title',
                'subtitle': 'color-subtitle',
                'accent': 'color-accent',
                'time': 'color-time',
                'iconColor': 'color-icon-color',
                'iconBg': 'color-icon-bg',
                'iconBorder': 'color-icon-border'
            };
            const hexMap = {
                'title': 'hex-title',
                'subtitle': 'hex-subtitle',
                'accent': 'hex-accent',
                'time': 'hex-time',
                'iconColor': 'hex-icon-color',
                'iconBg': 'hex-icon-bg',
                'iconBorder': 'hex-icon-border'
            };
            Object.keys(colorInputMap).forEach(key => {
                const input = document.getElementById(colorInputMap[key]);
                const hex = document.getElementById(hexMap[key]);
                if (input && theme[key]) input.value = theme[key];
                if (hex && theme[key]) hex.textContent = theme[key];
            });

            homeSetItem('home_theme', name);
            homeRemoveItem('home_theme_custom');
        } catch (e) {
            console.error('applyHomeTheme error:', e);
        }
    }
    window.applyHomeTheme = applyHomeTheme;
    // 向后兼容：如果外部没有 core.js 的 applyTheme，也把这个挂到 applyTheme 上避免报错
    if (typeof window.applyTheme !== 'function') {
        window.applyTheme = applyHomeTheme;
    }

    window.updateThemeColor = function(key, value) {
        currentTheme[key] = value;
        renderTheme();

        const hexMap = { title: 'hex-title', subtitle: 'hex-subtitle', accent: 'hex-accent', time: 'hex-time', iconColor: 'hex-icon-color', iconBg: 'hex-icon-bg', iconBorder: 'hex-icon-border' };
        const hexEl = document.getElementById(hexMap[key]);
        if (hexEl) hexEl.textContent = value;

        document.querySelectorAll('.theme-preset').forEach(el => el.classList.remove('active'));
        homeSetItem('home_theme_custom', JSON.stringify(currentTheme));
        homeRemoveItem('home_theme');
    };

    function renderTheme() {
        try {
            const t = currentTheme;

            // 更新主标题和副标题
            const heroTitle = document.getElementById('hero-title');
            const heroSubtitle = document.getElementById('hero-subtitle');
            if (heroTitle) heroTitle.style.color = t.title;
            if (heroSubtitle) heroSubtitle.style.color = t.subtitle;

            // 更新时间和日期显示
            document.querySelectorAll('.time-display').forEach(el => el.style.color = t.time);
            document.querySelectorAll('.date-display').forEach(el => el.style.color = t.subtitle);

            // 更新所有文字颜色（包括各种标签和名称）
            document.querySelectorAll('.app-name').forEach(el => el.style.color = t.subtitle);
            
            // 底部导航栏文字和图标与功能软件一致（使用 iconColor）
            document.querySelectorAll('.home-nav-label').forEach(el => {
                el.style.color = t.iconColor;
            });
            document.querySelectorAll('.home-nav-icon').forEach(el => {
                el.style.color = t.iconColor;
            });
            // 选中状态使用 accent 颜色
            document.querySelectorAll('.home-nav-item.active .home-nav-label').forEach(el => {
                el.style.color = t.accent;
            });
            document.querySelectorAll('.home-nav-item.active .home-nav-icon').forEach(el => {
                el.style.color = t.accent;
            });

            // 更新 Home 界面功能图标（使用 iconColor，与底部栏图标颜色绑定）
            document.querySelectorAll('.app-icon').forEach(el => {
                el.style.background = t.iconBg;
                el.style.borderColor = t.iconBorder;
                el.style.color = t.iconColor;
            });

            // 仅更新 Home 容器内的设置项样式，不影响聊天界面
            const homeContainer = document.getElementById('home-container');
            if (homeContainer) {
                // Home 容器内的 accent 颜色
                homeContainer.style.setProperty('--home-accent-color', t.accent);
            }
        } catch (e) {
            console.error('renderTheme error:', e);
        }
    }

    /**
     * 同步更新设置中的功能图标样式（仅限 Home 界面）
     */
    function syncSettingsIcons(theme) {
        // 仅更新 Home 容器内的设置项，不影响聊天界面
        const homeContainer = document.getElementById('home-container');
        if (!homeContainer) return;
        
        // 更新 Home 容器内的高级功能图标
        const advancedItems = homeContainer.querySelectorAll('#advanced-modal .settings-item');
        advancedItems.forEach(el => {
            el.style.background = theme.iconBg;
            el.style.borderColor = theme.iconBorder;
            const icon = el.querySelector('i');
            if (icon) {
                icon.style.color = theme.iconColor;
                icon.style.backgroundColor = hexToRgba(theme.iconColor, 0.1);
            }
            const text = el.querySelector('span');
            if (text) text.style.color = theme.subtitle;
        });

        // 更新 Home 容器内的设置卡片图标
        const settingsCards = homeContainer.querySelectorAll('.settings-card');
        settingsCards.forEach(el => {
            const icon = el.querySelector('i');
            if (icon) {
                icon.style.setProperty('color', theme.iconColor, 'important');
                icon.style.setProperty('background-color', hexToRgba(theme.iconColor, 0.1), 'important');
            }
            const text = el.querySelector('span');
            if (text) text.style.color = theme.subtitle;
        });
    }

    /**
     * 将十六进制颜色转换为 rgba
     */
    function hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // ========== 功能图标替换 ==========
    window.selectIconTarget = function(app) {
        currentIconTarget = app;
        renderIconGrid();
        const input = document.getElementById('app-icon-upload-input');
        if (input) input.click();
    };

    window.handleAppIconUpload = function(event) {
        const file = event.target.files[0];
        if (!file || !currentIconTarget) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            const url = e.target.result;
            customAppIcons[currentIconTarget] = url;

            const iconEl = document.querySelector(`.app-icon[data-app="${currentIconTarget}"]`);
            if (iconEl) {
                iconEl.innerHTML = `<img src="${url}" style="width:100%;height:100%;object-fit:cover;border-radius:12px;">`;
            }

            renderIconGrid();
            homeSetItem('home_app_icons', JSON.stringify(customAppIcons));
            currentIconTarget = null;
        };
        reader.readAsDataURL(file);
    };

    window.resetAppIcon = function(app) {
        if (!app || !customAppIcons[app]) return;
        delete customAppIcons[app];

        const iconEl = document.querySelector(`.app-icon[data-app="${app}"]`);
        if (iconEl) {
            iconEl.innerHTML = defaultAppIcons[app];
        }

        renderIconGrid();
        homeSetItem('home_app_icons', JSON.stringify(customAppIcons));
    };

    window.resetAllAppIcons = function() {
        if (Object.keys(customAppIcons).length === 0) return;
        customAppIcons = {};

        Object.keys(defaultAppIcons).forEach(app => {
            const iconEl = document.querySelector(`.app-icon[data-app="${app}"]`);
            if (iconEl) {
                iconEl.innerHTML = defaultAppIcons[app];
            }
        });

        renderIconGrid();
        homeRemoveItem('home_app_icons');
    };

    function renderIconGrid() {
        const grid = document.getElementById('icon-grid');
        if (!grid) return;

        grid.innerHTML = '';
        const nameMap = { chat:'聊天', mailbox:'信封', moyu:'摸鱼', diary:'朝夕心记', fortune:'运势', mood:'心晴', calendar:'日历', decide:'抉择', stats:'统计', accounting:'记账' };

        Object.keys(defaultAppIcons).forEach(app => {
            const item = document.createElement('div');
            item.className = 'icon-grid-item' + (currentIconTarget === app ? ' active' : '');

            const preview = document.createElement('div');
            preview.className = 'icon-grid-preview';
            if (customAppIcons[app]) {
                preview.innerHTML = `<img src="${customAppIcons[app]}" alt="${app}">`;
            } else {
                preview.innerHTML = defaultAppIcons[app];
            }

            const label = document.createElement('span');
            label.className = 'icon-grid-label';
            label.textContent = nameMap[app] || app;

            // 点击预览区域上传图标
            preview.onclick = (e) => {
                e.stopPropagation();
                window.selectIconTarget(app);
            };

            // 如果已自定义，添加清除按钮
            if (customAppIcons[app]) {
                const clearBtn = document.createElement('span');
                clearBtn.className = 'icon-grid-clear';
                clearBtn.innerHTML = '<i class="fas fa-times"></i>';
                clearBtn.title = '恢复默认';
                clearBtn.onclick = (e) => {
                    e.stopPropagation();
                    window.resetAppIcon(app);
                };
                item.appendChild(clearBtn);
            }

            item.appendChild(preview);
            item.appendChild(label);
            grid.appendChild(item);
        });
    }

    // ========== 个人资料页 ==========
    window.showProfile = function(who) {
        currentProfileTarget = who;
        const data = profileData[who];
        if (!data) return;

        const avatarImg = document.getElementById('profile-avatar-img');
        const editAvatarImg = document.getElementById('profile-edit-avatar-img');
        const nameEl = document.getElementById('profile-name');
        const idEl = document.getElementById('profile-id');
        const signatureEl = document.getElementById('profile-signature');
        const daysEl = document.getElementById('profile-days');

        if (avatarImg) avatarImg.src = data.avatar;
        if (editAvatarImg) editAvatarImg.src = data.avatar;
        if (nameEl) nameEl.textContent = data.name;
        if (idEl) idEl.textContent = data.id;
        if (signatureEl) signatureEl.textContent = data.signature;
        // 计算在一起天数
        const days = calculateTogetherDays(data.startDate);
        if (daysEl) daysEl.textContent = days;

        const viewMode = document.getElementById('profile-view-mode');
        const editMode = document.getElementById('profile-edit-mode');
        if (viewMode) viewMode.style.display = 'block';
        if (editMode) editMode.style.display = 'none';

        const overlay = document.getElementById('profile-overlay');
        if (overlay) overlay.classList.add('active');
    };

    window.closeProfile = function(e) {
        if (e && e.target !== e.currentTarget) return;
        const overlay = document.getElementById('profile-overlay');
        if (overlay) overlay.classList.remove('active');
    };

    window.openProfileEdit = function() {
        const data = profileData[currentProfileTarget];
        const editName = document.getElementById('edit-name');
        const editId = document.getElementById('edit-id');
        const editSignature = document.getElementById('edit-signature');
        const editStartDate = document.getElementById('edit-start-date');
        const editAvatarImg = document.getElementById('profile-edit-avatar-img');

        if (editName) editName.value = data.name;
        if (editId) editId.value = data.id;
        if (editSignature) editSignature.value = data.signature.replace(/^"|"$/g, '');
        if (editStartDate) editStartDate.value = data.startDate || '';
        if (editAvatarImg) editAvatarImg.src = data.avatar;

        const viewMode = document.getElementById('profile-view-mode');
        const editMode = document.getElementById('profile-edit-mode');
        if (viewMode) viewMode.style.display = 'none';
        if (editMode) editMode.style.display = 'block';
    };

    window.cancelProfileEdit = function() {
        const viewMode = document.getElementById('profile-view-mode');
        const editMode = document.getElementById('profile-edit-mode');
        if (viewMode) viewMode.style.display = 'block';
        if (editMode) editMode.style.display = 'none';
    };

    window.saveProfileEdit = function() {
        const editName = document.getElementById('edit-name');
        const editId = document.getElementById('edit-id');
        const editSignature = document.getElementById('edit-signature');
        const editStartDate = document.getElementById('edit-start-date');

        const name = editName ? editName.value.trim() : '';
        const id = editId ? editId.value.trim() : '';
        const signature = editSignature ? editSignature.value.trim() : '';
        const startDate = editStartDate ? editStartDate.value : '';

        if (!name) {
            alert('请输入昵称');
            return;
        }

        const data = profileData[currentProfileTarget];
        data.name = name;
        data.id = id || '@' + name;
        data.signature = `"${signature}"`;
        data.startDate = startDate;

        homeSetItem(`profile_${currentProfileTarget}`, JSON.stringify(data));

        // 同步到全局存储并派发事件，确保朋友圈等模块能实时感知昵称变更
        if (typeof homeSetGlobal === 'function') {
            homeSetGlobal(`profile_${currentProfileTarget}`, JSON.stringify(data));
        }

        // 昵称始终同步到聊天设置（确保强绑定）
        if (window.settings) {
            if (currentProfileTarget === 'me') {
                window.settings.myName = name;
            } else {
                window.settings.partnerName = name;
            }
            // 直接调用 saveData() 保存（throttledSaveData 有 500ms 延迟，可能来不及保存就刷新）
            if (typeof window.saveData === 'function') {
                window.saveData();
            } else if (typeof window.throttledSaveData === 'function') {
                window.throttledSaveData();
            }
            // 更新聊天界面的显示
            if (typeof window.updateUI === 'function') {
                window.updateUI();
            }
        }

        updateHeroTitleFromProfiles();
        window.showProfile(currentProfileTarget);
    };

    window.changeAvatarFromProfile = function() {
        currentAvatarTarget = currentProfileTarget;
        const input = document.getElementById('avatar-upload-input');
        if (input) input.click();
    };

    function updateHeroTitleFromProfiles() {
        const heroTitle = document.getElementById('hero-title');
        if (heroTitle) {
            heroTitle.textContent = `${profileData.me.name} & ${profileData.partner.name}`;
        }
        // 昵称/在一起日期改完后同步刷新天数
        renderHeroDays();
        renderHomeWidgets();
    }

    // ========== 消息通知横幅 ==========
    let _notificationTimer = null;

    /**
     * 显示消息通知横幅（类似锁屏通知）
     * @param {Object} options
     * @param {string} options.sender - 发送者名称
     * @param {string} options.text - 消息内容
     * @param {string} [options.avatar] - 头像 URL
     * @param {string} [options.time] - 时间文本
     */
    window.showHomeNotification = function(options) {
        const el = document.getElementById('home-notification');
        if (!el) return;

        // 清除之前的定时器
        if (_notificationTimer) {
            clearTimeout(_notificationTimer);
            _notificationTimer = null;
        }

        // 填充内容
        const avatarEl = document.getElementById('notification-avatar');
        const nameEl = document.getElementById('notification-name');
        const textEl = document.getElementById('notification-text');
        const timeEl = document.getElementById('notification-time');

        if (nameEl) nameEl.textContent = options.sender || '对方';
        if (textEl) textEl.textContent = options.text || '';
        if (timeEl) {
            if (options.time) {
                timeEl.textContent = options.time;
            } else {
                const now = new Date();
                timeEl.textContent = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            }
        }
        if (avatarEl) {
            if (options.avatar) {
                avatarEl.src = options.avatar;
                avatarEl.style.display = 'block';
            } else {
                // 优先从 profileData 获取，其次用默认头像
                const fallbackAvatar = (profileData && profileData.partner && profileData.partner.avatar) || 'https://api.dicebear.com/7.x/avataaars/svg?seed=partner';
                avatarEl.src = fallbackAvatar;
                avatarEl.style.display = 'block';
            }
        }

        // 显示通知
        el.classList.remove('hide');
        // 触发重排以重新播放动画
        void el.offsetHeight;
        el.classList.add('show');

        // 显示聊天图标小红点
        const chatBadge = document.getElementById('chat-badge');
        if (chatBadge) chatBadge.style.display = 'block';

        // 5秒后自动消失
        _notificationTimer = setTimeout(() => {
            window.dismissHomeNotification(false);
        }, 5000);
    };

    /**
     * 关闭通知横幅
     * @param {boolean} clicked - 是否被点击（点击则进入聊天界面）
     */
    window.dismissHomeNotification = function(clicked) {
        const el = document.getElementById('home-notification');
        if (!el) return;

        if (_notificationTimer) {
            clearTimeout(_notificationTimer);
            _notificationTimer = null;
        }

        el.classList.remove('show');
        el.classList.add('hide');

        // 隐藏聊天图标小红点（如果点击了通知或进入聊天）
        if (clicked) {
            const chatBadge = document.getElementById('chat-badge');
            if (chatBadge) chatBadge.style.display = 'none';
        }

        // 如果被点击，进入聊天界面
        if (clicked && typeof window.hideHomePage === 'function') {
            setTimeout(() => {
                window.hideHomePage();
            }, 200);
        }
    };

    // ========== 弹窗工具函数（独立实现，不依赖 core.js） ==========
    window.homeShowModal = function(modalElement) {
        if (!modalElement) return;
        // 清除之前的定时器
        if (modalElement._hideTimeout) {
            clearTimeout(modalElement._hideTimeout);
            modalElement._hideTimeout = null;
        }
        // 将弹窗移动到 body 末尾，确保不在 home-container 内部
        if (modalElement.parentElement !== document.body) {
            document.body.appendChild(modalElement);
        }
        // 强制显示在最上层
        modalElement.style.cssText = 'display: flex !important; position: fixed !important; top: 0 !important; left: 0 !important; width: 100% !important; height: 100% !important; z-index: 99999 !important; align-items: center !important; justify-content: center !important; background-color: rgba(0, 0, 0, 0.6) !important;';
        // 隐藏 header 和 input-area，彻底避免遮挡
        const header = document.querySelector('.header');
        if (header) header.style.visibility = 'hidden';
        const inputArea = document.querySelector('.input-area-wrapper');
        if (inputArea) inputArea.style.visibility = 'hidden';
        // 重置内容动画 - 先重置为初始状态，然后触发动画
        const content = modalElement.querySelector('.modal-content');
        if (content) {
            // 先设置为初始状态（隐藏）
            content.style.opacity = '0';
            content.style.transform = 'translateY(20px) scale(0.95)';
            // 强制重绘
            void content.offsetWidth;
            // 触发动画到最终状态
            content.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            content.style.opacity = '1';
            content.style.transform = 'translateY(0) scale(1)';
        }
    }

    // ========== 功能翻页 ==========
    let currentAppsPage = 0;

    window.switchAppsPage = function(pageIndex) {
        const pages = document.querySelectorAll('.apps-page');
        const dots = document.querySelectorAll('.apps-dot');
        if (pageIndex < 0 || pageIndex >= pages.length) return;
        pages.forEach((p, i) => p.classList.toggle('active', i === pageIndex));
        dots.forEach((d, i) => d.classList.toggle('active', i === pageIndex));
        currentAppsPage = pageIndex;
    };

    // 触摸滑动翻页
    // 绑定在整个桌面容器上（而不是只绑图标区），这样页面下方的空白区域也能翻页
    (function() {
        const swipeArea = document.getElementById('home-container');
        if (!swipeArea) return;
        let startX = 0;
        let startY = 0;
        swipeArea.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }, { passive: true });
        swipeArea.addEventListener('touchend', (e) => {
            // 拖拽排序 / 建文件夹期间不触发翻页
            if (_dragIsDragging || _suppressClick) return;
            const dx = startX - e.changedTouches[0].clientX;
            const dy = startY - e.changedTouches[0].clientY;
            // 横向位移明显大于纵向时才算翻页，避免上下滚动页面时误触发
            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.2) {
                if (dx > 0) window.switchAppsPage(currentAppsPage + 1);
                else window.switchAppsPage(currentAppsPage - 1);
            }
        }, { passive: true });
    })();

    // ========== 桌面文件夹 ==========
    // 数据结构：{ fid: { name: '文件夹', apps: ['chat', 'moyu'] } }
    // 桌面顺序里用 'folder:<fid>' 占位，其余项就是应用 key
    let folderStore = {};
    let currentFolderId = null;
    let folderEditMode = false;

    function loadFolderStore() {
        folderStore = {};
        try {
            const raw = homeGetItem('home_folders');
            if (raw) folderStore = JSON.parse(raw) || {};
        } catch (e) {
            console.warn('读取桌面文件夹失败', e);
        }
    }

    function saveFolderStore() {
        try {
            homeSetItem('home_folders', JSON.stringify(folderStore));
        } catch (e) {
            console.warn('保存桌面文件夹失败', e);
        }
    }

    /** 取网格中的直接子图标（排除文件夹内部隐藏的图标） */
    function getGridItems(grid) {
        return Array.from(grid.children).filter(el => el.classList && el.classList.contains('app-item'));
    }

    /** 取图标对应的应用 key，文件夹图标返回空串 */
    function getAppKey(item) {
        if (!item || item.dataset.folderId) return '';
        const icon = item.querySelector('.app-icon');
        return (icon && icon.dataset.app) || '';
    }

    /** 创建文件夹外壳（不含内部图标） */
    function createFolderShell(fid) {
        const el = document.createElement('div');
        el.className = 'app-item folder-item';
        el.dataset.folderId = fid;
        el.onclick = () => window.openFolder(fid);

        const icon = document.createElement('div');
        icon.className = 'app-icon folder-icon';
        const preview = document.createElement('div');
        preview.className = 'folder-preview';
        const body = document.createElement('div');
        body.className = 'folder-body';
        icon.appendChild(preview);
        icon.appendChild(body);

        const label = document.createElement('span');
        label.className = 'app-name';
        label.textContent = (folderStore[fid] && folderStore[fid].name) || '文件夹';

        el.appendChild(icon);
        el.appendChild(label);
        return el;
    }

    /** 把应用的真实图标节点搬进文件夹（保留角标 / 自定义图标 / 点击事件） */
    function moveAppIntoFolder(folderEl, appKey) {
        const body = folderEl.querySelector('.folder-body');
        const item = document.querySelector(`.app-icon[data-app="${appKey}"]`);
        const appItem = item && item.closest('.app-item');
        if (!body || !appItem) return;
        body.appendChild(appItem);
    }

    /** 用文件夹内的前 4 个应用刷新 2x2 缩略预览 */
    function refreshFolderPreview(folderEl) {
        const preview = folderEl.querySelector('.folder-preview');
        if (!preview) return;
        preview.innerHTML = '';
        const items = Array.from(folderEl.querySelectorAll('.folder-body > .app-item')).slice(0, 4);
        if (!items.length) {
            preview.innerHTML = '<span class="folder-empty">·</span>';
            return;
        }
        items.forEach(item => {
            const icon = item.querySelector('.app-icon');
            if (!icon) return;
            const clone = icon.cloneNode(true);
            clone.removeAttribute('id');
            clone.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
            clone.classList.add('folder-mini-icon');
            preview.appendChild(clone);
        });
    }

    /** 根据 store 构建完整文件夹节点，应用少于 2 个时返回 null */
    function buildFolderItem(fid) {
        const conf = folderStore[fid];
        if (!conf) return null;
        const apps = (conf.apps || []).filter(key => document.querySelector(`.app-icon[data-app="${key}"]`));
        if (apps.length < 2) return null;
        conf.apps = apps;
        const el = createFolderShell(fid);
        apps.forEach(key => moveAppIntoFolder(el, key));
        refreshFolderPreview(el);
        return el;
    }

    /** 打开文件夹弹层 */
    window.openFolder = function(fid) {
        const folderEl = document.querySelector(`.folder-item[data-folder-id="${fid}"]`);
        const overlay = document.getElementById('folder-overlay');
        const grid = document.getElementById('folder-apps-grid');
        const nameInput = document.getElementById('folder-name-input');
        if (!folderEl || !overlay || !grid) return;

        currentFolderId = fid;
        folderEditMode = false;
        grid.innerHTML = '';

        // 先刷新 2x2 缩略图（此时图标还在文件夹内），再把真实图标搬进弹层
        refreshFolderPreview(folderEl);

        // 把真实图标搬进弹层，角标 / 自定义图标 / 点击打开应用都保持原样
        const body = folderEl.querySelector('.folder-body');
        if (body) {
            Array.from(body.children).forEach(item => grid.appendChild(item));
        }
        if (nameInput) {
            nameInput.value = (folderStore[fid] && folderStore[fid].name) || '文件夹';
        }
        updateFolderEditUI();
        overlay.classList.add('show');
    };

    /** 关闭文件夹弹层，图标回到文件夹内 */
    function closeFolder() {
        const overlay = document.getElementById('folder-overlay');
        const grid = document.getElementById('folder-apps-grid');
        if (!overlay || !grid) return;
        const folderEl = document.querySelector(`.folder-item[data-folder-id="${currentFolderId}"]`);
        const body = folderEl && folderEl.querySelector('.folder-body');
        if (body) {
            Array.from(grid.children).forEach(item => {
                item.classList.remove('editing');
                const removeBtn = item.querySelector('.folder-remove-btn');
                if (removeBtn) removeBtn.remove();
                body.appendChild(item);
            });
        }
        grid.innerHTML = '';
        overlay.classList.remove('show');
        folderEditMode = false;
        currentFolderId = null;
        if (folderEl) refreshFolderPreview(folderEl);
    }
    window.closeFolder = closeFolder;

    /** 刷新文件夹编辑态 UI（编辑按钮文案 + 每个图标的减号） */
    function updateFolderEditUI() {
        const btn = document.getElementById('folder-edit-btn');
        const grid = document.getElementById('folder-apps-grid');
        if (btn) btn.textContent = folderEditMode ? '完成' : '编辑';
        if (!grid) return;
        Array.from(grid.children).forEach(item => {
            item.classList.toggle('editing', folderEditMode);
            const old = item.querySelector('.folder-remove-btn');
            if (old) old.remove();
            if (folderEditMode) {
                const removeBtn = document.createElement('span');
                removeBtn.className = 'folder-remove-btn';
                removeBtn.textContent = '−';
                removeBtn.onclick = (e) => {
                    e.stopPropagation();
                    removeAppFromFolder(item);
                };
                item.appendChild(removeBtn);
            }
        });
    }

    /** 从文件夹移出某个应用 */
    function removeAppFromFolder(item) {
        const fid = currentFolderId;
        const conf = folderStore[fid];
        const appKey = getAppKey(item);
        if (!conf || !appKey) return;
        conf.apps = (conf.apps || []).filter(k => k !== appKey);
        saveFolderStore();

        const grid = document.getElementById('folder-apps-grid');
        if (grid) grid.removeChild(item);
        item.classList.remove('editing');
        const removeBtn = item.querySelector('.folder-remove-btn');
        if (removeBtn) removeBtn.remove();

        if (conf.apps.length < 2) {
            // 只剩一个应用时自动解散
            closeFolder();
            dissolveFolder(fid);
            return;
        }

        const folderEl = document.querySelector(`.folder-item[data-folder-id="${fid}"]`);
        if (folderEl && folderEl.parentElement) {
            folderEl.parentElement.insertBefore(item, folderEl.nextSibling);
            refreshFolderPreview(folderEl);
        }
        saveAppOrder();
        rebalancePages();
        updateFolderEditUI();
    }

    /** 解散文件夹，应用回到桌面 */
    function dissolveFolder(fid) {
        const folderEl = document.querySelector(`.folder-item[data-folder-id="${fid}"]`);
        if (folderEl && folderEl.parentElement) {
            const grid = folderEl.parentElement;
            const body = folderEl.querySelector('.folder-body');
            const apps = body ? Array.from(body.children) : [];
            apps.forEach(appItem => grid.insertBefore(appItem, folderEl));
            folderEl.remove();
        }
        delete folderStore[fid];
        saveFolderStore();
        saveAppOrder();
        rebalancePages();
        (window.showNotification || function(){})('已解散文件夹', 'info');
    }
    window.dissolveFolder = dissolveFolder;

    /** 拖拽合并：拖到普通图标上建文件夹；拖到文件夹上则收纳进去 */
    function createFolderWith(srcItem, tgtItem) {
        const srcKey = getAppKey(srcItem);
        if (!srcKey || !tgtItem) return;
        const tgtFid = tgtItem.dataset.folderId;
        if (tgtFid) {
            addAppToFolder(tgtFid, srcItem, srcKey);
            return;
        }
        const tgtKey = getAppKey(tgtItem);
        if (!tgtKey || tgtKey === srcKey) return;

        const fid = 'f' + Date.now().toString(36);
        folderStore[fid] = { name: '文件夹', apps: [tgtKey, srcKey] };
        saveFolderStore();

        const folderEl = createFolderShell(fid);
        tgtItem.parentElement.insertBefore(folderEl, tgtItem);
        moveAppIntoFolder(folderEl, tgtKey);
        moveAppIntoFolder(folderEl, srcKey);
        refreshFolderPreview(folderEl);

        finishDragState();
        saveAppOrder();
        rebalancePages();
        if (navigator.vibrate) navigator.vibrate([12, 40, 18]);
        (window.showNotification || function(){})('已创建文件夹，点开可重命名', 'success');
    }

    /** 把应用放进已有文件夹 */
    function addAppToFolder(fid, srcItem, srcKey) {
        const conf = folderStore[fid];
        const folderEl = document.querySelector(`.folder-item[data-folder-id="${fid}"]`);
        if (!conf || !folderEl) return;
        if (!conf.apps.includes(srcKey)) conf.apps.push(srcKey);
        saveFolderStore();
        moveAppIntoFolder(folderEl, srcKey);
        refreshFolderPreview(folderEl);

        finishDragState();
        saveAppOrder();
        rebalancePages();
        if (navigator.vibrate) navigator.vibrate([12, 40, 18]);
        (window.showNotification || function(){})('已放入文件夹', 'success');
    }

    // ========== 扩展功能（小火人功能页）：内嵌iframe方式，SPA内导航 ==========
    const EXT_APPS = {
        'spark-new':      { key: 'spark',       page: 'pages/spark-new.html' },
        'sweet-new':      { key: 'sweet',       page: 'pages/sweet.html' },
        'ledger-new':     { key: 'ledger',      page: 'pages/ledger.html' },
        'plan-new':       { key: 'plan',        page: 'pages/plan.html' }
    };

    window.showExtApp = function(appKeyOrId) {
        window.__forceHideAllOverlays();
        const conf = EXT_APPS[appKeyOrId] || (Object.values(EXT_APPS).find(c => c.key === appKeyOrId));
        if (!conf) return;
        const container = document.getElementById('extapp-' + conf.key);
        if (!container) return;
        const iframe = document.getElementById('extapp-' + conf.key + '-iframe');
        // 首次显示才加载iframe（懒加载+缓存），之后不重复加载以保留用户状态
        if (iframe && !iframe.getAttribute('src')) {
            iframe.setAttribute('src', conf.page);
        }
        // 隐藏主页 & 聊天，记录前态
        window.__preExtAppState = window.__preExtAppState || {};
        const homeContainer = document.getElementById('home-container');
        const chatArea = document.querySelector('.main-chat-area');
        const header = document.querySelector('.header');
        const inputArea = document.querySelector('.input-area-wrapper');
        const petContainer = document.getElementById('pet-container');
        const momentsContainer = document.getElementById('moments-container');
        window.__preExtAppState = {
            homeDisplay: homeContainer ? homeContainer.style.display : '',
            homeActive: homeContainer ? homeContainer.classList.contains('active') : false,
            chatDisplay: chatArea ? chatArea.style.display : '',
            headerDisplay: header ? header.style.display : '',
            inputDisplay: inputArea ? inputArea.style.display : '',
            petDisplay: petContainer ? petContainer.style.display : '',
            momentsDisplay: momentsContainer ? momentsContainer.style.display : '',
            bodyHomeActive: document.body.classList.contains('home-active')
        };
        if (petContainer) petContainer.style.display = 'none';
        if (momentsContainer) {
            momentsContainer.style.display = 'none';
            momentsContainer.classList.remove('active');
        }
        if (homeContainer) {
            homeContainer.style.display = 'none';
            homeContainer.classList.remove('active');
        }
        if (chatArea) chatArea.style.display = 'none';
        if (header) header.style.display = 'none';
        if (inputArea) inputArea.style.display = 'none';

        container.style.display = 'flex';
        document.body.classList.add('home-active'); // 允许iframe内滚动

        // ========== 同步主站主题色/深浅色/字体 到 iframe 内 ==========
        try {
            var doc = document.documentElement;
            var colorTheme = doc.getAttribute('data-color-theme');
            var theme = doc.getAttribute('data-theme');
            // 读取主站当前的字体 CSS 变量（用户在外观设置里配置的自定义字体也会同步）
            var fontVar = doc.style.getPropertyValue('--font-family') || '';
            var msgFontVar = doc.style.getPropertyValue('--message-font-family') || '';
            var fontSize = doc.style.getPropertyValue('--font-size') || '';
            var syncMsg = { type: 'theme:sync', colorTheme: colorTheme, theme: theme, fontFamily: fontVar, messageFontFamily: msgFontVar, fontSize: fontSize, ts: Date.now() };
            // 立即 postMessage 给当前 iframe
            if (iframe && iframe.contentWindow) {
                try { iframe.contentWindow.postMessage(syncMsg, '*'); } catch(e){}
            }
            // 额外保险：如果 postMessage 因为 src 还没加载被丢，过 1500ms / 4000ms 再投两次（懒加载场景）
            [1500, 4000].forEach(function(t){
                setTimeout(function(){
                    var ct = document.documentElement.getAttribute('data-color-theme');
                    var dtt = document.documentElement.getAttribute('data-theme');
                    var fv = document.documentElement.style.getPropertyValue('--font-family') || '';
                    var mfv = document.documentElement.style.getPropertyValue('--message-font-family') || '';
                    var fs = document.documentElement.style.getPropertyValue('--font-size') || '';
                    var msg = { type: 'theme:sync', colorTheme: ct, theme: dtt, fontFamily: fv, messageFontFamily: mfv, fontSize: fs, ts: Date.now() };
                    var iframeEl = document.getElementById('extapp-' + conf.key + '-iframe');
                    if (iframeEl && iframeEl.contentWindow) {
                        try { iframeEl.contentWindow.postMessage(msg, '*'); } catch(e){}
                    }
                }, t);
            });
} catch(e) { console.warn('empty catch at home.js:1670', e); }
    };

    // 主页切换主题/深浅色/字体时，广播到所有已存在的 extapp iframe，保持视觉统一
    (function installExtAppThemeBroadcaster() {
        var lastTheme = { color: null, dark: null, font: null };
        var pollTimer = null;
        var hasExtAppIframes = function() {
            return document.querySelectorAll('iframe[id^="extapp-"][id$="-iframe"]').length > 0;
        };
        function broadcast() {
            try {
                var doc = document.documentElement;
                var color = doc.getAttribute('data-color-theme');
                var dark = doc.getAttribute('data-theme');
                var font = doc.style.getPropertyValue('--font-family') || '';
                if (color === lastTheme.color && dark === lastTheme.dark && font === lastTheme.font) return;
                lastTheme.color = color; lastTheme.dark = dark; lastTheme.font = font;
                var msgFontVar = doc.style.getPropertyValue('--message-font-family') || '';
                var fontSize = doc.style.getPropertyValue('--font-size') || '';
                var msg = { type: 'theme:sync', colorTheme: color, theme: dark, fontFamily: font, messageFontFamily: msgFontVar, fontSize: fontSize, ts: Date.now() };
                var iframes = document.querySelectorAll('iframe[id^="extapp-"][id$="-iframe"]');
                iframes.forEach(function(f){
                    if (f && f.contentWindow) {
                        try { f.contentWindow.postMessage(msg, '*'); }
                        catch(e) { console.warn('extapp theme broadcast postMessage error:', e); }
                    }
                });
            } catch(e) { console.warn('installExtAppThemeBroadcaster broadcast error:', e); }
        }
        // 仅在有 extapp iframe 时启动 2.2s 轮询；没有时只在事件触发时检查
        function ensurePolling() {
            if (hasExtAppIframes() && !pollTimer) {
                pollTimer = setInterval(broadcast, 2200);
            } else if (!hasExtAppIframes() && pollTimer) {
                clearInterval(pollTimer);
                pollTimer = null;
            }
        }
        function onActive() { ensurePolling(); broadcast(); }
        document.addEventListener('visibilitychange', function(){ if (document.visibilityState === 'visible') onActive(); });
        window.addEventListener('pageshow', onActive);
        setTimeout(onActive, 3000);
        window.addEventListener('beforeunload', function() {
            if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
        });
    })();

    window.hideExtApp = function(appKeyOrId) {
        window.__forceHideAllOverlays();
        let conf = null;
        if (appKeyOrId) {
            conf = EXT_APPS[appKeyOrId] || (Object.values(EXT_APPS).find(c => c.key === appKeyOrId));
        }
        const keys = conf ? [conf.key] : Object.values(EXT_APPS).map(c => c.key);
        let wasShown = false;
        keys.forEach(k => {
            const container = document.getElementById('extapp-' + k);
            if (container && container.style.display !== 'none') {
                container.style.display = 'none';
                wasShown = true;
                // 通知 iframe 已关闭（可选清理）
                try {
                    const iframe = document.getElementById('extapp-' + k + '-iframe');
                    if (iframe && iframe.contentWindow) {
                        iframe.contentWindow.postMessage({ type: 'extapp:closed', key: k }, '*');
                    }
} catch(e) { console.warn('empty catch at home.js:1717', e); }
            }
        });
        if (!wasShown) return;

        // 恢复前态
        const prev = window.__preExtAppState || {};
        const homeContainer = document.getElementById('home-container');
        const chatArea = document.querySelector('.main-chat-area');
        const header = document.querySelector('.header');
        const inputArea = document.querySelector('.input-area-wrapper');

        // 默认：回到主页（和 pet/moments 行为一致）
        if (homeContainer) {
            homeContainer.style.display = prev.homeDisplay !== undefined ? prev.homeDisplay : 'flex';
            homeContainer.classList.add('active');
        }
        // 其他元素还原（聊天区默认保持隐藏，因为用户是从主页点进来的）
        if (chatArea) chatArea.style.display = prev.chatDisplay || 'none';
        if (header) header.style.display = prev.headerDisplay || 'none';
        if (inputArea) inputArea.style.display = prev.inputDisplay || 'none';
        document.body.classList.add('home-active');

        // 强制确保主页状态正确 & 所有蒙层隐藏（这是解决"返回卡住加载界面"的关键兜底）
        if (typeof window.showHomePage === 'function') window.showHomePage();
        window.__forceHideAllOverlays();
    };

    // 监听子iframe的返回请求
    (function setupExtAppPostMessageListener() {
        if (window.__extAppPmInited) return;
        window.addEventListener('message', function(ev) {
            const data = ev.data || {};
            if (data.type === 'extapp:back') {
                window.hideExtApp(data.key);
            }
        });
        window.__extAppPmInited = true;
    })();

    // ========== 功能导航 ==========
    window.openApp = function(app) {
        const appActions = {
            'chat': () => {
                // 隐藏聊天图标小红点
                const chatBadge = document.getElementById('chat-badge');
                if (chatBadge) chatBadge.style.display = 'none';
                window.hideHomePage();
            },
            'mailbox': () => {
                const modal = document.getElementById('envelope-modal');
                if (modal) {
                    if (typeof renderEnvelopeLists === 'function') renderEnvelopeLists();
                    homeShowModal(modal);
                }
            },
            'moyu': () => {
                // 隐藏摸鱼小记小红点
                const moyuBadge = document.getElementById('moyu-badge');
                if (moyuBadge) moyuBadge.style.display = 'none';
                const modal = document.getElementById('moyu-modal');
                if (modal) {
                    homeShowModal(modal);
                    // 渲染内容
                    if (typeof window.renderMoyuCurrent === 'function') window.renderMoyuCurrent();
                    if (typeof window.renderMoyuRecords === 'function') window.renderMoyuRecords();
                    if (typeof window.renderMoyuLocations === 'function') window.renderMoyuLocations();
                    if (typeof window.updateMoyuLocationSelect === 'function') window.updateMoyuLocationSelect();
                    if (typeof window.switchMoyuTab === 'function') window.switchMoyuTab('current');
                }
            },
            'diary': () => {
                const modal = document.getElementById('diary-modal');
                if (!modal) {
                    console.error('diary-modal not found');
                    return;
                }
                // 确保弹窗在 body 下
                if (modal.parentElement !== document.body) {
                    document.body.appendChild(modal);
                }
                // 显示弹窗
                homeShowModal(modal);
                // 触发渲染（如果 diary.js 已加载）
                if (typeof window.openDiaryModal === 'function') {
                    window.openDiaryModal();
                }
            },
            'fortune': () => {
                if (typeof generateFortune === 'function') generateFortune();
                const modal = document.getElementById('fortune-lenormand-modal');
                if (modal) homeShowModal(modal);
            },
            'mood': () => {
                const modal = document.getElementById('mood-modal');
                if (modal) homeShowModal(modal);
            },
            'calendar': () => {
                // 绑定到聊天界面顶部的日历功能
                if (typeof window.openMiniCalendar === 'function') {
                    window.openMiniCalendar();
                } else if (typeof openMiniCalendar === 'function') {
                    openMiniCalendar();
                }
            },
            'decide': () => {
                const modal = document.getElementById('decision-menu-modal');
                if (modal) homeShowModal(modal);
            },
            'stats': () => {
                const modal = document.getElementById('stats-modal');
                if (modal) homeShowModal(modal);
            },
            'accounting': () => {
                if (typeof window.openAccountingModal === 'function') {
                    window.openAccountingModal();
                } else {
                    const modal = document.getElementById('accounting-modal');
                    if (modal) homeShowModal(modal);
                }
            },
            'pet': () => {
                // 切换到萌宠屋页面（内嵌，非跳转）
                window.showPetPage();
            },
            'games': () => {
                // 桌面小游戏：面板内独立运行，不写入聊天
                if (window.ChatGames && typeof window.ChatGames.open === 'function') {
                    window.ChatGames.open();
                } else {
                    (window.showNotification || function(){})('小游戏加载中...', 'info');
                }
            },
            'weibo': () => {
                // 微博：热搜榜 + 话题广场
                if (window.ZyWeibo && typeof window.ZyWeibo.open === 'function') {
                    window.ZyWeibo.open();
                } else {
                    (window.showNotification || function(){})('微博加载中...', 'info');
                }
            },
            'ta-phone': () => {
                if (typeof window.TaPhoneApp !== 'undefined') {
                    window.TaPhoneApp.showTaPhone();
                } else {
                    (window.showNotification || function(){})('TA的手机加载中...', 'info');
                    const script = document.createElement('script');
                    var basePath = window.location.pathname.replace(/\/[^\/]*$/, '/') || '/';
                    script.src = basePath + 'js/ta-phone.js';
                    script.onload = function() {
                        if (typeof window.TaPhoneApp !== 'undefined') window.TaPhoneApp.showTaPhone();
                        else (window.showNotification || function(){})('TA的手机加载失败', 'error');
                    };
                    script.onerror = function() {
                        (window.showNotification || function(){})('TA的手机加载失败', 'error');
                    };
                    document.head.appendChild(script);
                }
            },
            'map': () => {
                if (typeof window.MapApp !== 'undefined') {
                    window.MapApp.show();
                } else {
                    // 动态加载 map.js（使用绝对路径避免预览环境路径问题）
                    (window.showNotification || function(){})('地图加载中...', 'info');
                    const script = document.createElement('script');
                    var basePath = window.location.pathname.replace(/\/[^\/]*$/, '/') || '/';
                    script.src = basePath + 'js/features/map.js';
                    script.onload = function() {
                        if (typeof window.MapApp !== 'undefined') {
                            window.MapApp.show();
                        } else {
                            (window.showNotification || function(){})('地图加载失败，请刷新重试', 'error');
                        }
                    };
                    script.onerror = function() {
                        (window.showNotification || function(){})('地图加载失败，请检查网络', 'error');
                    };
                    document.head.appendChild(script);
                }
            },
            'moments': () => {
                // 优先打开覆盖式朋友圈页面（原底部导航栏的行为）
                if (typeof window.showMomentsPage === 'function') {
                    window.showMomentsPage();
                    return;
                }
                // 显示朋友圈页面
                if (typeof window.showMoments === 'function') {
                    window.showMoments();
                } else {
                    // 动态加载朋友圈模块
                    fetch('moments.html')
                        .then(response => response.text())
                        .then(html => {
                            const div = document.createElement('div');
                            div.innerHTML = html;
                            document.body.appendChild(div);
                            // 执行脚本
                            const scripts = div.querySelectorAll('script');
                            scripts.forEach(script => {
                                const newScript = document.createElement('script');
                                newScript.textContent = script.textContent;
                                document.body.appendChild(newScript);
                            });
                            setTimeout(() => window.showMoments(), 100);
                        })
                        .catch(err => console.error('加载朋友圈失败:', err));
                }
            },
            // ========== 原底部导航栏功能，改为桌面图标入口 ==========
            'appearance': () => {
                if (typeof window.openCustomizePanel === 'function') window.openCustomizePanel();
            },
            'cards': () => {
                const modal = document.getElementById('custom-replies-modal');
                if (modal) {
                    if (typeof renderReplyLibrary === 'function') renderReplyLibrary();
                    homeShowModal(modal);
                }
            },
            'chat-settings': () => {
                const modal = document.getElementById('chat-modal');
                if (modal) homeShowModal(modal);
            },
            // ========== 用户扩展功能：内嵌iframe，和参考站原有行为一致 ==========
            'spark-new':       () => window.showExtApp('spark-new'),
            'sweet-new':       () => window.showExtApp('sweet-new'),
            'ledger-new':      () => window.showExtApp('ledger-new'),
            'plan-new':        () => window.showExtApp('plan-new')
        };

        if (appActions[app]) {
            const result = appActions[app]();
            if (result && typeof result.then === 'function') {
                result.catch(e => console.error('打开应用失败:', app, e));
            }
        } else {
            console.log('打开应用:', app);
        }
    };

    window.switchNav = function(el, item) {
        document.querySelectorAll('.home-nav-item').forEach(n => n.classList.remove('active'));
        el.classList.add('active');

        const navActions = {
            'appearance': () => {
                window.openCustomizePanel();
            },
            'cards': () => {
                const modal = document.getElementById('custom-replies-modal');
                if (modal) {
                    if (typeof renderReplyLibrary === 'function') renderReplyLibrary();
                    homeShowModal(modal);
                }
            },
            'chat': () => {
                // 聊天设置 - 直接打开聊天设置弹窗
                const modal = document.getElementById('chat-modal');
                if (modal) homeShowModal(modal);
            },
            'stats': () => {
                const modal = document.getElementById('stats-modal');
                if (modal) homeShowModal(modal);
            },
            'moments': () => {
                // 朋友圈 - 打开覆盖式页面
                window.showMomentsPage();
            }
        };

        if (navActions[item]) {
            navActions[item]();
        }
    };

    // ========== 朋友圈页面显示/隐藏 ==========
    // 记录进入朋友圈前的页面状态
    let _preMomentsState = {};

    window.showMomentsPage = function() {
        const homeContainer = document.getElementById('home-container');
        const momentsContainer = document.getElementById('moments-container');
        const chatArea = document.querySelector('.main-chat-area');
        const header = document.querySelector('.header');
        const inputArea = document.querySelector('.input-area-wrapper');

        // 清除朋友圈小红点
        if (typeof MomentsApp !== 'undefined' && MomentsApp.clearMomentsBadge) {
            MomentsApp.clearMomentsBadge();
        }

        // 记录进入前的显示状态
        _preMomentsState = {
            chatArea: chatArea ? chatArea.style.display : '',
            header: header ? header.style.display : '',
            inputArea: inputArea ? inputArea.style.display : ''
        };

        // 隐藏主页
        if (homeContainer) {
            homeContainer.classList.remove('active');
            homeContainer.style.display = 'none';
        }
        // 隐藏聊天区域
        if (chatArea) chatArea.style.display = 'none';
        if (header) header.style.display = 'none';
        if (inputArea) inputArea.style.display = 'none';

        // 允许 body 滚动
        document.body.classList.add('home-active');

        // 显示朋友圈
        if (momentsContainer) {
            momentsContainer.style.display = 'block';
            momentsContainer.classList.add('active');
        }

        // 初始化朋友圈（同步头像）
        setTimeout(() => {
            try {
                if (typeof window.MomentsApp !== 'undefined' && window.MomentsApp.init) {
                    window.MomentsApp.init();
                }
            } catch (e) {
                console.error('MomentsApp init error:', e);
            }
        }, 100);
    };

    window.hideMomentsPage = function() {
        const momentsContainer = document.getElementById('moments-container');
        const homeContainer = document.getElementById('home-container');
        const chatArea = document.querySelector('.main-chat-area');
        const header = document.querySelector('.header');
        const inputArea = document.querySelector('.input-area-wrapper');

        // 隐藏朋友圈
        if (momentsContainer) {
            momentsContainer.style.display = 'none';
            momentsContainer.classList.remove('active');
        }

        // 显示主页
        if (homeContainer) {
            homeContainer.classList.add('active');
            homeContainer.style.display = 'flex';
        }

        // 恢复进入前的聊天区域状态（不强制显示）
        if (chatArea) chatArea.style.display = _preMomentsState.chatArea || '';
        if (header) header.style.display = _preMomentsState.header || '';
        if (inputArea) inputArea.style.display = _preMomentsState.inputArea || '';

        // 移除底部栏的 active 状态
        document.querySelectorAll('.home-nav-item').forEach(n => n.classList.remove('active'));

        // 停止访客在线定时器
        if (typeof MomentsApp !== 'undefined' && MomentsApp.stopOnlineVisitorTimer) {
            MomentsApp.stopOnlineVisitorTimer();
        }
    };

    // ========== 加载保存的设置 ==========
    async function loadSavedSettings() {
        // 先读出桌面文件夹配置，reorderAppItems 渲染时要用
        loadFolderStore();

        // 头像绑定开关（全局）
        const savedAvatarSync = localStorage.getItem('home_avatar_sync');
        if (savedAvatarSync !== null) {
            avatarSyncEnabled = savedAvatarSync === 'true';
        }
        const avatarToggle = document.getElementById('avatar-sync-toggle');
        if (avatarToggle) {
            avatarToggle.classList.toggle('active', avatarSyncEnabled);
        }

        // 背景绑定开关（全局）
        const savedBgSync = localStorage.getItem('home_bg_sync');
        if (savedBgSync !== null) {
            bgSyncEnabled = savedBgSync === 'true';
        }
        const bgToggle = document.getElementById('bg-sync-toggle');
        if (bgToggle) {
            bgToggle.classList.toggle('active', bgSyncEnabled);
        }

        // 图标颜色
        const savedIconColor = homeGetItem('home_icon_color');
        const savedIconColorName = homeGetItem('home_icon_color_name');
        if (savedIconColor) {
            applyIconColor(savedIconColor);
            // 更新颜色选择器
            const colorInput = document.getElementById('icon-color-custom');
            if (colorInput) colorInput.value = savedIconColor;
            // 更新预设选中状态
            if (savedIconColorName) {
                document.querySelectorAll('.icon-color-preset').forEach(el => {
                    el.classList.toggle('active', el.dataset.color === savedIconColorName);
                });
            }
        }

        // 页面背景
        const savedPageBg = homeGetItem('home_page_bg');
        if (savedPageBg === 'custom') {
            const customUrl = homeGetItem('home_page_bg_custom');
            if (customUrl) {
                const pageBg = document.getElementById('home-page-bg');
                if (pageBg) pageBg.style.background = `url(${customUrl}) center/cover no-repeat`;
            }
        } else if (savedPageBg && pageBgPresets[savedPageBg]) {
            window.setPageBg(savedPageBg);
        }

        // 加载个人资料数据（头像和昵称优先级最高）
        ['me', 'partner'].forEach(who => {
            // 先重置为默认值，避免残留上一个会话的数据
            const defaults = who === 'me' ? {
                name: '我', id: '@my_profile',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=me',
                signature: '"今天也要加油呀 ✨"', startDate: ''
            } : {
                name: '梦角', id: '@dream_partner',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=partner',
                signature: '"和你在一起的每一天都很开心 💕"', startDate: ''
            };
            profileData[who] = { ...defaults };

            // 头像和昵称：优先从聊天设置同步，如果没有则从 Home 全局存储读取
            if (window.settings) {
                const settingAvatar = who === 'me' ? window.settings.myAvatar : window.settings.partnerAvatar;
                const settingName = who === 'me' ? window.settings.myName : window.settings.partnerName;
                
                if (settingAvatar) {
                    profileData[who].avatar = settingAvatar;
                } else {
                    // 聊天设置没有头像，从 Home 全局存储读取
                    const savedAvatar = homeGetGlobal(`home_avatar_${who}`);
                    if (savedAvatar) profileData[who].avatar = savedAvatar;
                }
                
                if (settingName) {
                    profileData[who].name = settingName;
                }
            } else {
                // 聊天设置不可用，从 Home 全局存储读取
                const savedAvatar = homeGetGlobal(`home_avatar_${who}`);
                if (savedAvatar) profileData[who].avatar = savedAvatar;
            }

            // 从 Home 存储读取完整的资料数据（昵称、头像、签名、起始日期等）
            const savedProfile = homeGetItem(`profile_${who}`);
            if (savedProfile) {
                try {
                    const parsed = JSON.parse(savedProfile);
                    if (parsed.name) profileData[who].name = parsed.name;
                    if (parsed.avatar) profileData[who].avatar = parsed.avatar;
                    if (parsed.signature) profileData[who].signature = parsed.signature;
                    if (parsed.startDate) profileData[who].startDate = parsed.startDate;
                    if (parsed.id) profileData[who].id = parsed.id;
} catch(e) { console.warn('empty catch at home.js:2176', e); }
            }

            // 更新头像 DOM（必须在数据加载完成后执行）
            const avatarEl = document.getElementById(`avatar-${who}`);
            const customizeAvatar = document.getElementById(`customize-avatar-${who}`);
            const heroAvatar = document.getElementById(`hero-avatar-${who}`);
            if (avatarEl) avatarEl.src = profileData[who].avatar;
            if (customizeAvatar) customizeAvatar.src = profileData[who].avatar;
            if (heroAvatar) heroAvatar.src = profileData[who].avatar;
        });

        updateHeroTitleFromProfiles();

        // 桌面小组件：读开关状态并渲染
        loadWidgetSettings();

        // 签名
        const savedSubtitle = homeGetItem('home_hero_subtitle');
        if (savedSubtitle) {
            const subtitle = document.getElementById('hero-subtitle');
            const subtitleInput = document.getElementById('customize-subtitle-input');
            if (subtitle) subtitle.textContent = savedSubtitle;
            if (subtitleInput) subtitleInput.value = savedSubtitle;
        }

        // 主题
        const savedThemeName = homeGetItem('home_theme');
        if (savedThemeName && themePresets[savedThemeName]) {
            applyHomeTheme(savedThemeName);
        } else {
            const savedCustomTheme = homeGetItem('home_theme_custom');
            if (savedCustomTheme) {
                try {
                    const parsed = JSON.parse(savedCustomTheme);
                    currentTheme = { ...themePresets.default, ...parsed };
                    renderTheme();
                    const colorInputMap = {
                        'title': 'color-title',
                        'subtitle': 'color-subtitle',
                        'accent': 'color-accent',
                        'time': 'color-time',
                        'iconColor': 'color-icon-color',
                        'iconBg': 'color-icon-bg',
                        'iconBorder': 'color-icon-border'
                    };
                    const hexMap = {
                        'title': 'hex-title',
                        'subtitle': 'hex-subtitle',
                        'accent': 'hex-accent',
                        'time': 'hex-time',
                        'iconColor': 'hex-icon-color',
                        'iconBg': 'hex-icon-bg',
                        'iconBorder': 'hex-icon-border'
                    };
                    Object.keys(parsed).forEach(key => {
                        const input = document.getElementById(colorInputMap[key]);
                        if (input) input.value = parsed[key];
                        const hexEl = document.getElementById(hexMap[key]);
                        if (hexEl) hexEl.textContent = parsed[key];
                    });
                    document.querySelectorAll('.theme-preset').forEach(el => el.classList.remove('active'));
} catch(e) { console.warn('empty catch at home.js:2235', e); }
            }
        }

        // 自定义功能图标
        const savedIcons = homeGetItem('home_app_icons');
        if (savedIcons) {
            try {
                customAppIcons = JSON.parse(savedIcons);
                Object.keys(customAppIcons).forEach(app => {
                    const iconEl = document.querySelector(`.app-icon[data-app="${app}"]`);
                    if (iconEl && customAppIcons[app]) {
                        iconEl.innerHTML = `<img src="${customAppIcons[app]}" style="width:100%;height:100%;object-fit:cover;border-radius:12px;">`;
                    }
                });
} catch(e) { console.warn('empty catch at home.js:2250', e); }
        }

        // 加载保存的应用顺序
        const savedOrder = homeGetItem('home_app_order');
        if (savedOrder) {
            try {
                appOrder = JSON.parse(savedOrder);
                reorderAppItems();
} catch(e) { console.warn('empty catch at home.js:2259', e); }
        } else {
            // 首次加载：按默认顺序重新分页（每页8个）并保存
            reorderAppItems();
            saveAppOrder();
        }

        renderIconGrid();
        
        // 渲染自定义背景预设
        renderPageBgPresets();
        renderCardBgPresets();
    }

    /**
     * 根据 appOrder 重新排序应用图标
     */
    function reorderAppItems() {
        const pager = document.getElementById('apps-pager');
        if (!pager) return;

        // 收集所有顶层 app-item 并建立映射（不包括文件夹内隐藏的图标）
        const allItems = [];
        const itemMap = new Map();
        pager.querySelectorAll('.apps-grid').forEach(grid => {
            getGridItems(grid).forEach(item => {
                const appKey = getAppKey(item);
                if (appKey) {
                    itemMap.set(appKey, item);
                    allItems.push(item);
                }
            });
        });

        // 按保存的顺序排列，并把 folder:xxx 还原成文件夹
        const orderedItems = [];
        const usedApps = new Set();
        appOrder.forEach(key => {
            if (typeof key !== 'string') return;
            if (key.indexOf('folder:') === 0) {
                const fid = key.slice(7);
                const folderEl = buildFolderItem(fid);
                if (folderEl) {
                    orderedItems.push(folderEl);
                    (folderStore[fid].apps || []).forEach(k => usedApps.add(k));
                }
            } else if (itemMap.has(key) && !usedApps.has(key)) {
                orderedItems.push(itemMap.get(key));
                usedApps.add(key);
            }
        });
        // 添加未排序的项目（新增的 app）
        allItems.forEach(item => {
            const appKey = getAppKey(item);
            if (appKey && !usedApps.has(appKey)) {
                orderedItems.push(item);
                usedApps.add(appKey);
            }
        });

        // 按每页 8 个重新分配到页面
        rebalancePagesWithItems(orderedItems);
    }

    /**
     * 将指定的 item 列表按每页 8 个分配到页面（复用已有页面或创建新页面）
     */
    function rebalancePagesWithItems(orderedItems) {
        const pager = document.getElementById('apps-pager');
        const dotsContainer = document.getElementById('apps-dots');
        if (!pager || !dotsContainer) return;

        // 移除旧的 apps-page
        pager.querySelectorAll('.apps-page').forEach(p => p.remove());
        dotsContainer.innerHTML = '';

        const totalPages = Math.max(1, Math.ceil(orderedItems.length / 8));

        for (let p = 0; p < totalPages; p++) {
            const pageDiv = document.createElement('div');
            pageDiv.className = 'apps-page' + (p === 0 ? ' active' : '');
            pageDiv.id = `apps-page-${p + 1}`;

            const gridDiv = document.createElement('div');
            gridDiv.className = 'apps-grid';

            for (let i = p * 8; i < Math.min((p + 1) * 8, orderedItems.length); i++) {
                gridDiv.appendChild(orderedItems[i]);
            }

            pageDiv.appendChild(gridDiv);
            pager.insertBefore(pageDiv, dotsContainer);

            const dot = document.createElement('span');
            dot.className = 'apps-dot' + (p === 0 ? ' active' : '');
            dot.onclick = () => window.switchAppsPage(p);
            dotsContainer.appendChild(dot);
        }

        // 最后一页：微博热搜卡片
        renderWeiboBoardPage();

        if (currentAppsPage >= totalPages) {
            currentAppsPage = totalPages - 1;
        }
        window.switchAppsPage(currentAppsPage);
    }

    // ========== 桌面「微博热搜」页 ==========
    function renderWeiboBoardPage() {
        const pager = document.getElementById('apps-pager');
        const dotsContainer = document.getElementById('apps-dots');
        if (!pager || !dotsContainer) return;

        const old = document.getElementById('apps-page-weibo');
        if (old) old.remove();
        const oldDot = document.getElementById('apps-dot-weibo');
        if (oldDot) oldDot.remove();

        let hot = [];
        if (window.ZyWeibo && typeof window.ZyWeibo.getHot === 'function') {
            hot = window.ZyWeibo.getHot() || [];
        }
        if (!hot.length) {
            // 微博模块尚未加载时，直接读本地热搜缓存
            try {
                const raw = localStorage.getItem('zy_weibo_hot');
                if (raw) {
                    const arr = JSON.parse(raw);
                    if (Array.isArray(arr)) hot = arr;
                }
            } catch (e) {}
        }
        hot = hot.slice(0, 6);

        const pageDiv = document.createElement('div');
        pageDiv.className = 'apps-page';
        pageDiv.id = 'apps-page-weibo';

        const board = document.createElement('div');
        board.id = 'weibo-board';

        const head = document.createElement('div');
        head.className = 'wbb-head';
        const title = document.createElement('div');
        title.className = 'wbb-title';
        title.textContent = '微博 · 实时热搜';
        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'wbb-edit';
        editBtn.textContent = '编辑';
        editBtn.addEventListener('click', e => {
            e.stopPropagation();
            if (window.ZyWeibo) window.ZyWeibo.editHot();
        });
        head.appendChild(title);
        head.appendChild(editBtn);
        board.appendChild(head);

        const list = document.createElement('div');
        list.className = 'wbb-list';
        if (!hot.length) {
            const empty = document.createElement('div');
            empty.className = 'wbb-empty';
            empty.textContent = '还没有热搜，点「编辑」添加';
            list.appendChild(empty);
        }
        hot.forEach((h, i) => {
            const row = document.createElement('div');
            row.className = 'wbb-row';
            const rank = document.createElement('span');
            rank.className = 'wbb-rank' + (i < 3 ? ' top' : '');
            rank.textContent = String(i + 1);
            const txt = document.createElement('span');
            txt.className = 'wbb-txt';
            txt.textContent = h.title;
            row.appendChild(rank);
            row.appendChild(txt);
            if (h.tag) {
                const badge = document.createElement('span');
                badge.className = 'wbb-badge';
                badge.textContent = h.tag;
                row.appendChild(badge);
            }
            row.addEventListener('click', () => {
                if (window.ZyWeibo) window.ZyWeibo.openTopic(h.title);
            });
            list.appendChild(row);
        });
        board.appendChild(list);

        const foot = document.createElement('button');
        foot.type = 'button';
        foot.className = 'wbb-more';
        foot.textContent = '查看完整榜单 ›';
        foot.addEventListener('click', () => {
            if (window.ZyWeibo) window.ZyWeibo.openHot();
        });
        board.appendChild(foot);

        pageDiv.appendChild(board);
        pager.insertBefore(pageDiv, dotsContainer);

        const dot = document.createElement('span');
        dot.className = 'apps-dot';
        dot.id = 'apps-dot-weibo';
        dot.onclick = () => window.switchAppsPage(document.querySelectorAll('.apps-page').length - 1);
        dotsContainer.appendChild(dot);
    }

    // 热搜被编辑后，桌面卡片同步刷新
    window.addEventListener('zyWeiboHotUpdated', () => renderWeiboBoardPage());
    // 所有脚本加载完成后补渲染一次（防止微博模块晚于首页初始化）
    window.addEventListener('load', () => renderWeiboBoardPage());

    // ========== 初始化 ==========
    window.initHomePage = async function() {
        // 清理旧的底部栏颜色设置（已废弃）
        localStorage.removeItem('home_nav_colors');

        // 清理 chatContainer 上可能残留的内联背景样式
        // （之前版本 syncBgToChat 会设置此样式，现在已由外观设置独立控制）
        const chatContainer = document.getElementById('chat-container');
        if (chatContainer) {
            chatContainer.style.removeProperty('background');
        }

        await loadSavedSettings();

        // 更新标题显示
        updateHeroTitleFromProfiles();

        // 初始化应用拖拽功能
        initAppDragAndDrop();
    };

    // ========== 应用图标长按拖拽功能 ==========
    // 使用事件委托，将 touchstart/mousedown 绑定到 pager 容器上，
    // 这样 rebalancePages 重建网格后事件仍然有效
    let _dragLongPressTimer = null;
    let _dragIsDragging = false;
    let _dragDraggedItem = null;
    let _dragCurrentGrid = null;
    let _dragAutoScrollTimer = null;
    let _dragStartX, _dragStartY;
    let _suppressClick = false;           // 拖拽 / 长按结束后屏蔽那一次误触点击
    let _folderHoverTarget = null;        // 当前拖拽悬停的合并目标
    let _folderHoverTimer = null;         // 停留计时器（到时生成文件夹）
    let _folderHoverX = 0, _folderHoverY = 0;

    function initAppDragAndDrop() {
        const pager = document.getElementById('apps-pager');
        if (!pager) return;
        initFolderOverlay();

        // 防止重复初始化
        if (pager.dataset.dndInit === '1') return;
        pager.dataset.dndInit = '1';

        // 事件委托：绑定到 pager 容器
        pager.addEventListener('touchstart', _handleTouchStart, { passive: false });
        pager.addEventListener('mousedown', _handleMouseDown);

        // 长按 / 拖拽结束后吃掉紧随其后的 click，避免误打开应用
        pager.addEventListener('click', function(e) {
            if (_suppressClick) {
                e.preventDefault();
                e.stopPropagation();
                _suppressClick = false;
            }
        }, true);

        // 全局移动和结束事件
        document.addEventListener('touchmove', _handleTouchMove, { passive: false });
        document.addEventListener('touchend', _handleTouchEnd);
        document.addEventListener('mousemove', _handleMouseMove);
        document.addEventListener('mouseup', _handleMouseUp);
    }

    /** 文件夹弹层事件绑定（只绑一次） */
    function initFolderOverlay() {
        const overlay = document.getElementById('folder-overlay');
        if (!overlay || overlay.dataset.init === '1') return;
        overlay.dataset.init = '1';

        // 点空白处关闭，并阻止事件穿透到桌面
        overlay.addEventListener('click', (e) => {
            e.stopPropagation();
            if (e.target === overlay) closeFolder();
        });

        const grid = document.getElementById('folder-apps-grid');
        if (grid) {
            // 捕获阶段：编辑态拦掉点击；普通态先关弹层，再让图标打开应用
            grid.addEventListener('click', (e) => {
                if (folderEditMode) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }
                closeFolder();
            }, true);
        }

        const editBtn = document.getElementById('folder-edit-btn');
        if (editBtn) {
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                folderEditMode = !folderEditMode;
                updateFolderEditUI();
            });
        }

        const dissolveBtn = document.getElementById('folder-dissolve-btn');
        if (dissolveBtn) {
            dissolveBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const fid = currentFolderId;
                if (!fid) return;
                closeFolder();
                dissolveFolder(fid);
            });
        }

        // 重命名
        const nameInput = document.getElementById('folder-name-input');
        if (nameInput) {
            const commitName = () => {
                const fid = currentFolderId;
                if (!fid || !folderStore[fid]) return;
                const val = (nameInput.value || '').trim() || '文件夹';
                folderStore[fid].name = val;
                nameInput.value = val;
                saveFolderStore();
                const folderEl = document.querySelector(`.folder-item[data-folder-id="${fid}"]`);
                const label = folderEl && folderEl.querySelector('.app-name');
                if (label) label.textContent = val;
            };
            nameInput.addEventListener('change', commitName);
            nameInput.addEventListener('blur', commitName);
            nameInput.addEventListener('click', (e) => e.stopPropagation());
        }
    }

    function _handleTouchStart(e) {
        const item = e.target.closest('.app-item');
        if (!item) return;

        _dragStartX = e.touches[0].clientX;
        _dragStartY = e.touches[0].clientY;
        _dragCurrentGrid = item.closest('.apps-grid');

        _dragLongPressTimer = setTimeout(() => {
            _startDrag(item);
        }, 500);
    }

    function _handleMouseDown(e) {
        const item = e.target.closest('.app-item');
        if (!item) return;

        _dragStartX = e.clientX;
        _dragStartY = e.clientY;
        _dragCurrentGrid = item.closest('.apps-grid');

        _dragLongPressTimer = setTimeout(() => {
            _startDrag(item);
        }, 500);
    }

    function _handleTouchMove(e) {
        if (_dragLongPressTimer && !_dragIsDragging) {
            // 手指轻微晃动不算滑动，避免长按被判成翻页/滚动
            const touch = e.touches[0];
            if (Math.hypot(touch.clientX - _dragStartX, touch.clientY - _dragStartY) > 10) {
                clearTimeout(_dragLongPressTimer);
                _dragLongPressTimer = null;
            }
            return;
        }
        if (_dragIsDragging) {
            e.preventDefault();
            const touch = e.touches[0];
            _handleDragMove(touch.clientX, touch.clientY);
        }
    }

    function _handleMouseMove(e) {
        if (_dragLongPressTimer && !_dragIsDragging) {
            if (Math.hypot(e.clientX - _dragStartX, e.clientY - _dragStartY) > 10) {
                clearTimeout(_dragLongPressTimer);
                _dragLongPressTimer = null;
            }
            return;
        }
        if (_dragIsDragging) {
            e.preventDefault();
            _handleDragMove(e.clientX, e.clientY);
        }
    }

    function _handleTouchEnd(e) {
        if (_dragLongPressTimer) {
            clearTimeout(_dragLongPressTimer);
            _dragLongPressTimer = null;
        }
        if (_dragIsDragging) {
            _endDrag();
        }
    }

    function _handleMouseUp(e) {
        if (_dragLongPressTimer) {
            clearTimeout(_dragLongPressTimer);
            _dragLongPressTimer = null;
        }
        if (_dragIsDragging) {
            _endDrag();
        }
    }

    function _startDrag(item) {
        _dragIsDragging = true;
        _dragDraggedItem = item;
        _suppressClick = true;          // 长按松手时不打开应用
        item.classList.add('dragging');

        // 动态获取所有网格（因为 rebalancePages 会重建网格）
        const grids = document.querySelectorAll('.apps-grid');
        grids.forEach(g => g.classList.add('drag-mode'));

        // 所有图标一起抖动，像真机进入可整理状态
        const pager = document.getElementById('apps-pager');
        if (pager) pager.classList.add('jiggle');

        // 震动反馈
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    }

    /** 清理拖拽悬停计时与高亮 */
    function clearFolderHover() {
        if (_folderHoverTimer) {
            clearTimeout(_folderHoverTimer);
            _folderHoverTimer = null;
        }
        if (_folderHoverTarget) {
            _folderHoverTarget.classList.remove('folder-hover-target');
            _folderHoverTarget = null;
        }
    }

    /**
     * 拖拽悬停检测：在另一个图标上停留 650ms 就合并成文件夹
     * （拖动过程中会实时换位，所以这里用"手指移动距离"判断是否还停在原目标上）
     */
    function _updateFolderHover(x, y) {
        if (!_dragDraggedItem) return;

        if (_folderHoverTarget) {
            const moved = Math.hypot(x - _folderHoverX, y - _folderHoverY);
            if (moved <= 36 && _folderHoverTarget.isConnected) return;
            clearFolderHover();
        }

        const elementBelow = document.elementFromPoint(x, y);
        const targetItem = elementBelow && elementBelow.closest('.app-item');
        if (!targetItem || targetItem === _dragDraggedItem) return;

        _folderHoverTarget = targetItem;
        _folderHoverX = x;
        _folderHoverY = y;
        targetItem.classList.add('folder-hover-target');

        if (navigator.vibrate) navigator.vibrate(8);
        _folderHoverTimer = setTimeout(() => {
            const src = _dragDraggedItem;
            const tgt = _folderHoverTarget;
            clearFolderHover();
            if (src && tgt && src.isConnected && tgt.isConnected) {
                createFolderWith(src, tgt);
            }
        }, 650);
    }

    function _handleDragMove(x, y) {
        if (!_dragDraggedItem) return;

        // 先做合并判定，再执行换位（换位后拖拽图标会盖住目标）
        _updateFolderHover(x, y);

        const pager = document.getElementById('apps-pager');
        if (!pager) return;
        const pagerRect = pager.getBoundingClientRect();
        const edgeThreshold = 60;

        const isNearLeftEdge = x < pagerRect.left + edgeThreshold;
        const isNearRightEdge = x > pagerRect.right - edgeThreshold;

        pager.classList.remove('drag-left', 'drag-right');
        if (isNearLeftEdge && currentAppsPage > 0) {
            pager.classList.add('drag-left');
        } else if (isNearRightEdge && currentAppsPage < document.querySelectorAll('.apps-page').length - 1) {
            pager.classList.add('drag-right');
        }

        if (_dragAutoScrollTimer) {
            clearTimeout(_dragAutoScrollTimer);
            _dragAutoScrollTimer = null;
        }

        if (isNearLeftEdge && currentAppsPage > 0) {
            _dragAutoScrollTimer = setTimeout(() => {
                pager.classList.remove('drag-left', 'drag-right');
                switchAppsPage(currentAppsPage - 1);
                const newGrid = document.querySelectorAll('.apps-grid')[currentAppsPage];
                if (newGrid) {
                    newGrid.appendChild(_dragDraggedItem);
                    _dragCurrentGrid = newGrid;
                }
            }, 400);
        } else if (isNearRightEdge) {
            const totalPages = document.querySelectorAll('.apps-page').length;
            if (currentAppsPage < totalPages - 1) {
                _dragAutoScrollTimer = setTimeout(() => {
                    pager.classList.remove('drag-left', 'drag-right');
                    switchAppsPage(currentAppsPage + 1);
                    const newGrid = document.querySelectorAll('.apps-grid')[currentAppsPage];
                    if (newGrid) {
                        newGrid.appendChild(_dragDraggedItem);
                        _dragCurrentGrid = newGrid;
                    }
                }, 400);
            }
        }

        const elementBelow = document.elementFromPoint(x, y);
        const targetItem = elementBelow?.closest('.app-item');

        if (targetItem && targetItem !== _dragDraggedItem) {
            const targetGrid = targetItem.closest('.apps-grid');
            if (targetGrid) {
                const allItems = getGridItems(targetGrid);
                const targetIndex = allItems.indexOf(targetItem);
                const draggedIndex = allItems.indexOf(_dragDraggedItem);

                if (draggedIndex !== -1) {
                    if (draggedIndex < targetIndex) {
                        targetItem.after(_dragDraggedItem);
                    } else {
                        targetItem.before(_dragDraggedItem);
                    }
                } else {
                    targetGrid.appendChild(_dragDraggedItem);
                    const updatedItems = getGridItems(targetGrid);
                    const updatedTargetIndex = updatedItems.indexOf(targetItem);
                    const newDraggedIndex = updatedItems.indexOf(_dragDraggedItem);

                    if (newDraggedIndex < updatedTargetIndex) {
                        targetItem.after(_dragDraggedItem);
                    } else {
                        targetItem.before(_dragDraggedItem);
                    }
                    _dragCurrentGrid = targetGrid;
                }
            }
        }
    }

    /** 只清理拖拽视觉状态，不做保存（建文件夹时复用） */
    function finishDragState() {
        if (_dragAutoScrollTimer) {
            clearTimeout(_dragAutoScrollTimer);
            _dragAutoScrollTimer = null;
        }
        if (_dragDraggedItem) {
            _dragDraggedItem.classList.remove('dragging');
        }
        // 动态获取所有网格
        const grids = document.querySelectorAll('.apps-grid');
        grids.forEach(g => g.classList.remove('drag-mode'));
        const pager = document.getElementById('apps-pager');
        if (pager) pager.classList.remove('drag-left', 'drag-right', 'jiggle');
        clearFolderHover();
        _dragIsDragging = false;
        _dragDraggedItem = null;
        _dragCurrentGrid = null;
        setTimeout(() => { _suppressClick = false; }, 350);
    }

    function _endDrag() {
        finishDragState();

        // 保存新顺序
        saveAppOrder();

        // 重新平衡页面
        rebalancePages();
    }

    /**
     * 重新平衡页面（确保每页最多8个应用）
     */
    function rebalancePages() {
        const pager = document.getElementById('apps-pager');
        if (!pager) return;

        // 收集所有顶层项目（按当前 DOM 顺序，跳过文件夹内部隐藏图标）
        const allItems = [];
        pager.querySelectorAll('.apps-grid').forEach(grid => {
            getGridItems(grid).forEach(item => allItems.push(item));
        });

        // 复用统一的分页逻辑
        rebalancePagesWithItems(allItems);
    }

    /** 收集桌面顺序：应用 key 或 folder:<fid> */
    function collectDesktopOrder() {
        const order = [];
        document.querySelectorAll('.apps-grid').forEach(grid => {
            getGridItems(grid).forEach(item => {
                const fid = item.dataset.folderId;
                if (fid) {
                    order.push('folder:' + fid);
                } else {
                    const appKey = getAppKey(item);
                    if (appKey) order.push(appKey);
                }
            });
        });
        return order;
    }

    function saveAppOrder() {
        appOrder = collectDesktopOrder();
        homeSetItem('home_app_order', JSON.stringify(appOrder));
    }

    /**
     * 同步更新 Home 界面的昵称（供外部调用）
     */
    window.updateHomeNicknames = function() {
        if (window.settings) {
            if (window.settings.myName) {
                profileData.me.name = window.settings.myName;
            }
            if (window.settings.partnerName) {
                profileData.partner.name = window.settings.partnerName;
            }
        }
        updateHeroTitleFromProfiles();
    };

    /**
     * 同步更新 Home 界面的头像（供外部调用）
     * @param {string} who - 'me' 或 'partner'
     * @param {string} url - 头像图片 URL
     */
    window.updateHomeAvatar = function(who, url) {
        if (!who || !url || !profileData[who]) return;

        // 更新数据（头像始终全局存储）
        profileData[who].avatar = url;
        homeSetGlobal(`home_avatar_${who}`, url);
        homeSetGlobal(`profile_${who}`, JSON.stringify(profileData[who]));

        // 更新所有显示位置
        // 1. 个人资料页头像
        const avatarEl = document.getElementById(`avatar-${who}`);
        if (avatarEl) avatarEl.src = url;

        // 2. 自定义面板头像
        const customizeAvatar = document.getElementById(`customize-avatar-${who}`);
        if (customizeAvatar) customizeAvatar.src = url;

        // 3. 主页大卡片头像
        const heroAvatar = document.getElementById(`hero-avatar-${who}`);
        if (heroAvatar) heroAvatar.src = url;

        // 4. 聊天界面头像（仅在头像绑定开启时同步）
        if (avatarSyncEnabled) {
            const chatAvatarEl = who === 'me'
                ? document.getElementById('my-avatar')
                : document.getElementById('partner-avatar');
            if (chatAvatarEl) {
                chatAvatarEl.innerHTML = `<img src="${url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
            }

            // 同步到聊天设置内存
            if (window.settings) {
                if (who === 'me') {
                    window.settings.myAvatar = url;
                } else if (who === 'partner') {
                    window.settings.partnerAvatar = url;
                }
            }

            // 直接保存头像到 localforage（不依赖 saveData，确保立即可用）
            const avatarKey = who === 'me' ? 'myAvatar' : 'partnerAvatar';
            if (typeof localforage !== 'undefined' && window.SESSION_ID && window.APP_PREFIX) {
                const storageKey = `${window.APP_PREFIX}${window.SESSION_ID}_${avatarKey}`;
                // 同时保存到 localStorage 作为同步备份
                try {
                    localStorage.setItem(storageKey, url);
} catch(e) { console.warn('empty catch at home.js:2683', e); }
                localforage.setItem(storageKey, url).catch(() => {});
            }
        }

        // 同时触发 saveData 保存其他设置
        if (typeof window.saveData === 'function') {
            window.saveData();
        } else if (typeof window.throttledSaveData === 'function') {
            window.throttledSaveData();
        }
    };

    // 会话切换弹窗
    window.showSessionSwitcher = function() {
        const sessionList = window.sessionList || [];
        const currentSessionId = window.SESSION_ID;

        if (sessionList.length <= 1) {
            (window.showNotification || function(){})('只有一个会话，无法切换', 'warning');
            return;
        }

        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.5); z-index: 100002;
            display: flex; align-items: center; justify-content: center;
            animation: fadeIn 0.2s ease;
        `;
        overlay.innerHTML = `<style>@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }</style>`;

        const panel = document.createElement('div');
        panel.style.cssText = `
            background: var(--secondary-bg); border-radius: 18px;
            padding: 20px; width: 85%; max-width: 320px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.4);
            animation: popIn 0.22s cubic-bezier(.34,1.56,.64,1);
        `;
        panel.innerHTML = `
            <style>@keyframes popIn { from { opacity: 0; transform: scale(.93) } to { opacity: 1; transform: scale(1) } }</style>
            <div style="font-size: 15px; font-weight: 700; color: var(--text-primary); margin-bottom: 14px; display: flex; align-items: center; gap: 8px;">
                <i class="fas fa-exchange-alt" style="color: var(--accent-color);"></i>
                切换会话
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px; max-height: 50vh; overflow-y: auto;">
                ${sessionList.map(s => `
                    <button class="session-switch-item ${s.id === currentSessionId ? 'active' : ''}" data-id="${s.id}" style="
                        display: flex; align-items: center; gap: 10px;
                        padding: 12px 14px; border-radius: 12px;
                        border: 1.5px solid ${s.id === currentSessionId ? 'var(--accent-color)' : 'var(--border-color)'};
                        background: ${s.id === currentSessionId ? 'rgba(var(--accent-color-rgb),0.1)' : 'var(--primary-bg)'};
                        color: var(--text-primary); font-size: 13px; cursor: pointer;
                        font-family: var(--font-family); text-align: left;
                        transition: all 0.15s;
                    ">
                        <i class="fas fa-${s.id === currentSessionId ? 'check-circle' : 'circle'}" style="color: ${s.id === currentSessionId ? 'var(--accent-color)' : 'var(--text-secondary)'};"></i>
                        <span style="flex: 1; font-weight: ${s.id === currentSessionId ? '700' : '500'};">${s.name}</span>
                        <span style="font-size: 11px; color: var(--text-secondary);">${new Date(s.createdAt).toLocaleDateString()}</span>
                    </button>
                `).join('')}
            </div>
            <div style="margin-top: 14px; display: flex; gap: 10px;">
                <button id="session-switch-cancel" style="flex: 1; padding: 11px; border: 1.5px solid var(--border-color); border-radius: 12px; background: none; color: var(--text-secondary); font-size: 13px; cursor: pointer; font-family: var(--font-family);">取消</button>
                <button id="session-switch-new" style="flex: 1; padding: 11px; border: none; border-radius: 12px; background: var(--accent-color); color: #fff; font-size: 13px; font-weight: 700; cursor: pointer; font-family: var(--font-family);">新建会话</button>
            </div>
        `;

        overlay.appendChild(panel);
        document.body.appendChild(overlay);

        // 取消按钮
        panel.querySelector('#session-switch-cancel').onclick = () => overlay.remove();
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

        // 新建会话按钮
        panel.querySelector('#session-switch-new').onclick = () => {
            overlay.remove();
            if (typeof window.createNewSession === 'function') {
                window.createNewSession(true).then(() => {
                    window.location.reload();
                });
            }
        };

        // 会话项点击
        panel.querySelectorAll('.session-switch-item').forEach(btn => {
            btn.onclick = () => {
                const sessionId = btn.dataset.id;
                if (sessionId === currentSessionId) {
                    overlay.remove();
                    return;
                }
                overlay.remove();
                window.location.hash = sessionId;
                window.location.reload();
            };
            btn.onmouseenter = () => {
                if (!btn.classList.contains('active')) {
                    btn.style.borderColor = 'var(--accent-color)';
                    btn.style.background = 'rgba(var(--accent-color-rgb),0.05)';
                }
            };
            btn.onmouseleave = () => {
                if (!btn.classList.contains('active')) {
                    btn.style.borderColor = 'var(--border-color)';
                    btn.style.background = 'var(--primary-bg)';
                }
            };
        });
    };

    // 从聊天设置同步数据到 Home 页（供 core.js 调用）
    // 注意：头像和昵称的同步已在 loadSavedSettings 中处理，这里只处理其他数据
    window.syncHomePageData = function() {
        // 更新标题显示
        updateHeroTitleFromProfiles();
    };

    // 暴露给外部调用（由 core.js 的 loadData 完成后调用）
    // DOM 加载完成后只初始化时间更新，设置加载等 loadData 完成后再执行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            updateTime();
            setInterval(updateTime, 1000);
        });
    } else {
        updateTime();
        setInterval(updateTime, 1000);
    }

    // 主题预设点击 - 直接绑定到 document 确保一定能触发
    document.addEventListener('click', function(e) {
        const preset = e.target.closest('.theme-preset');
        if (preset && preset.dataset.theme) {
            e.preventDefault();
            e.stopPropagation();
            applyHomeTheme(preset.dataset.theme);
        }
    }, true); // 使用捕获阶段

    // ========== 安卓返回键：优先返回上一级，而不是直接退出 App ==========
    // MainActivity 在 canGoBack() 为 false 时调用 window.mjHandleBack()：
    // 返回 true = 已处理（关弹窗 / 退出功能页 / 回首页）；返回 false = 允许系统退出。
    (function installAndroidBackHandler() {
        function isShown(el) {
            if (!el) return false;
            if (el.classList.contains('hidden')) return false;
            const cs = window.getComputedStyle(el);
            if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return false;
            const rect = el.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
        }

        window.mjHandleBack = function() {
            try {
                // 1) 弹窗（从最后 / 最上层开始关）
                const modals = document.querySelectorAll('.modal');
                for (let i = modals.length - 1; i >= 0; i--) {
                    if (isShown(modals[i])) {
                        if (typeof window.hideModal === 'function') window.hideModal(modals[i]);
                        else modals[i].style.display = 'none';
                        return true;
                    }
                }

                // 2) 商城的商品 / 心愿单弹层
                const shopModals = document.querySelectorAll('.shop-modal.active');
                if (shopModals.length) {
                    shopModals[shopModals.length - 1].classList.remove('active');
                    return true;
                }

                // 3) TA的手机
                if (isShown(document.getElementById('ta-phone-container')) &&
                    window.TaPhoneApp && typeof window.TaPhoneApp.hideTaPhone === 'function') {
                    window.TaPhoneApp.hideTaPhone();
                    return true;
                }

                // 4) 地图页
                if (isShown(document.getElementById('map-app-overlay')) &&
                    window.MapApp && typeof window.MapApp.hide === 'function') {
                    window.MapApp.hide();
                    return true;
                }

                // 6) 萌宠屋
                if (isShown(document.getElementById('pet-container')) &&
                    typeof window.hidePetPage === 'function') {
                    window.hidePetPage();
                    return true;
                }

                // 7) 朋友圈
                if (isShown(document.getElementById('moments-container')) &&
                    typeof window.hideMomentsPage === 'function') {
                    window.hideMomentsPage();
                    return true;
                }

                // 8) iframe 功能页（计划 / 账本 / 甜蜜 / 火花）
                //    先让子页面处理自己的弹层（如计划页的任务弹窗），再退出整页
                let extappFrame = null;
                document.querySelectorAll('iframe[id^="extapp-"][id$="-iframe"]').forEach(function(frame) {
                    let box = frame.parentNode;
                    for (let d = 0; d < 4 && box && box !== document.body; d++, box = box.parentNode) {
                        if (box.id && box.id.indexOf('extapp-') === 0 && isShown(box)) {
                            extappFrame = frame;
                            return;
                        }
                    }
                });
                if (extappFrame) {
                    try {
                        if (typeof extappFrame.contentWindow.mjHandleBack === 'function' &&
                            extappFrame.contentWindow.mjHandleBack()) {
                            return true;
                        }
                    } catch (err) {
                        // 跨域或子页未实现时直接退页
                    }
                    if (typeof window.hideExtApp === 'function') {
                        window.hideExtApp();
                        return true;
                    }
                }

                // 9) 聊天页 → 回首页
                if (isShown(document.querySelector('.main-chat-area')) &&
                    typeof window.showHomePage === 'function') {
                    window.showHomePage();
                    return true;
                }
            } catch (e) {
                console.warn('mjHandleBack error:', e);
            }
            return false;
        };
    })();

})();
