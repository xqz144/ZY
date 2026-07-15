/* ============================================
 * 朋友圈扩展功能 - 梦角自动发朋友圈
 * 版本：1.3（修复弹窗 + 无限循环评论回复 + 共用全局回复库字卡）
 * ============================================ */

(function() {
    'use strict';

    const STORAGE_KEYS = {
        TEXT_LIBRARY: 'moment_text_library',
        IMAGE_LIBRARY: 'moment_image_library',
        MIXED_LIBRARY: 'moment_mixed_library',
        SETTINGS: 'moment_auto_settings'
    };

    const DEFAULT_SETTINGS = {
        enabled: false,
        minVal: 2,
        minUnit: 'hours',
        maxVal: 6,
        maxUnit: 'hours',
        minCount: 1,
        maxCount: 2
    };

    const UNIT_TO_MS = {
        minutes: 60 * 1000,
        hours: 60 * 60 * 1000,
        days: 24 * 60 * 60 * 1000
    };

    let autoSendTimer = null;
    let settings = { ...DEFAULT_SETTINGS };
    let textLibrary = [];
    let imageLibrary = [];
    let mixedLibrary = [];

    function init() {
        loadData();
        injectSettingsUI();
        injectLibraryManager();
        startAutoSendTimer();
        listenNewMomentComments();
        window.addEventListener('storage', (e) => {
            if (e.key === STORAGE_KEYS.SETTINGS) {
                loadSettings();
                restartAutoSendTimer();
            }
        });
        console.log('[朋友圈扩展] 加载完成，评论自动回复读取全局回复库');
    }

    function loadData() {
        loadSettings();
        loadLibraries();
    }

    function loadSettings() {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
            if (saved) {
                settings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
            }
        } catch (e) {
            settings = { ...DEFAULT_SETTINGS };
        }
    }

    function saveSettings() {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    }

    function loadLibraries() {
        try {
            const text = localStorage.getItem(STORAGE_KEYS.TEXT_LIBRARY);
            textLibrary = text ? JSON.parse(text) : [];
        } catch (e) { textLibrary = []; }
        try {
            const img = localStorage.getItem(STORAGE_KEYS.IMAGE_LIBRARY);
            imageLibrary = img ? JSON.parse(img) : [];
        } catch (e) { imageLibrary = []; }
        try {
            const mixed = localStorage.getItem(STORAGE_KEYS.MIXED_LIBRARY);
            mixedLibrary = mixed ? JSON.parse(mixed) : [];
        } catch (e) { mixedLibrary = []; }
    }

    function saveLibrary(type) {
        const keyMap = {
            text: STORAGE_KEYS.TEXT_LIBRARY,
            image: STORAGE_KEYS.IMAGE_LIBRARY,
            mixed: STORAGE_KEYS.MIXED_LIBRARY
        };
        const libMap = {
            text: textLibrary,
            image: imageLibrary,
            mixed: mixedLibrary
        };
        localStorage.setItem(keyMap[type], JSON.stringify(libMap[type]));
    }

    function startAutoSendTimer() {
        stopAutoSendTimer();
        if (!settings.enabled) return;
        const minMs = settings.minVal * UNIT_TO_MS[settings.minUnit];
        const maxMs = settings.maxVal * UNIT_TO_MS[settings.maxUnit];
        const randomMs = Math.random() * (maxMs - minMs) + minMs;
        autoSendTimer = setTimeout(() => {
            generatePartnerMoments();
            startAutoSendTimer();
        }, randomMs);
    }

    function stopAutoSendTimer() {
        if (autoSendTimer) {
            clearTimeout(autoSendTimer);
            autoSendTimer = null;
        }
    }

    function restartAutoSendTimer() {
        stopAutoSendTimer();
        startAutoSendTimer();
    }

    function generatePartnerMoments() {
        if (!settings.enabled) return;
        const hasContent = textLibrary.length > 0 || imageLibrary.length > 0 || mixedLibrary.length > 0;
        if (!hasContent) return;
        const count = Math.floor(Math.random() * (settings.maxCount - settings.minCount + 1)) + settings.minCount;
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                generateSingleMoment();
            }, i * (Math.random() * 3000 + 1000));
        }
    }

    function generateSingleMoment() {
        const types = [];
        if (textLibrary.length > 0) types.push('text');
        if (imageLibrary.length > 0) types.push('image');
        if (mixedLibrary.length > 0) types.push('mixed');
        if (types.length === 0) return;
        const type = types[Math.floor(Math.random() * types.length)];
        let momentData = null;
        switch (type) {
            case 'text': momentData = pickRandomText(); break;
            case 'image': momentData = pickRandomImage(); break;
            case 'mixed': momentData = pickRandomMixed(); break;
        }
        if (momentData) addPartnerMoment(momentData);
    }

    function pickRandomText() {
        if (textLibrary.length === 0) return null;
        return { text: textLibrary[Math.floor(Math.random() * textLibrary.length)], images: [] };
    }

    function pickRandomImage() {
        if (imageLibrary.length === 0) return null;
        return { text: '', images: [imageLibrary[Math.floor(Math.random() * imageLibrary.length)]] };
    }

    function pickRandomMixed() {
        if (mixedLibrary.length === 0) return null;
        const item = mixedLibrary[Math.floor(Math.random() * mixedLibrary.length)];
        return { text: item.text || '', images: item.images || [] };
    }

    function addPartnerMoment(data) {
        let partnerName = '梦角';
        let partnerAvatar = '';
        try {
            if (window.settings && window.settings.partnerName) partnerName = window.settings.partnerName;
            if (window.settings && window.settings.partnerAvatar) partnerAvatar = window.settings.partnerAvatar;
            const savedAvatar = localStorage.getItem('home_avatar_partner');
            if (savedAvatar) partnerAvatar = savedAvatar;
            const savedProfile = localStorage.getItem('profile_partner');
            if (savedProfile) {
                const profile = JSON.parse(savedProfile);
                if (profile.name) partnerName = profile.name;
                if (profile.avatar) partnerAvatar = profile.avatar;
            }
        } catch (e) {}

        const now = new Date();
        const newMoment = {
            id: Date.now() + Math.random(),
            nickname: partnerName,
            avatar: partnerAvatar,
            text: data.text || '',
            images: data.images || [],
            time: formatTime(now),
            timestamp: now.getTime(),
            likes: [],
            likedByMe: false,
            comments: [],
            collected: false,
            isPartner: true
        };

        if (window.momentsData) {
            window.momentsData.unshift(newMoment);
            if (typeof saveMomentsToStorageSync === 'function') saveMomentsToStorageSync();
            if (typeof renderMoments === 'function') renderMoments();
        }
    }

    function formatTime(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        if (minutes < 1) return '刚刚';
        if (minutes < 60) return `${minutes}分钟前`;
        if (hours < 24) return `${hours}小时前`;
        if (days < 7) return `${days}天前`;
        return `${date.getMonth() + 1}月${date.getDate()}日`;
    }

    function injectSettingsUI() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', doInject);
        } else {
            setTimeout(doInject, 1000);
        }
    }

    function doInject() {
        injectRhythmSettings();
        syncSettingsUI();
        bindSettingsEvents();
    }

    function injectRhythmSettings() {
        const rhythmPanel = document.getElementById('cs-panel-rhythm');
        if (!rhythmPanel) { setTimeout(injectRhythmSettings, 2000); return; }
        if (document.getElementById('moment-auto-section')) return;

        const sectionHTML = `
            <div class="cs-card" id="moment-auto-section" style="margin-top:12px;">
                <div class="setting-pill-row" id="moment-auto-toggle">
                    <span class="setting-pill-icon"><i class="fas fa-images"></i></span>
                    <span class="setting-pill-label">主动发朋友圈 <span style="font-size:11px;color:var(--text-secondary);font-weight:400;">开启后，梦角会随机发朋友圈</span></span>
                    <div class="setting-pill-switch"><div class="setting-pill-knob"></div></div>
                </div>
                <div id="moment-auto-settings" style="display:none;border-top:1px solid var(--border-color);margin-top:8px;">
                    <div style="padding:10px 14px 4px;font-size:12px;font-weight:600;color:var(--text-primary);">发圈间隔</div>
                    <div class="cs-slider-row">
                        <span class="cs-slider-label">最少</span>
                        <input type="range" min="1" max="24" step="1" value="2" class="font-size-slider" id="moment-auto-min-val-slider">
                        <select id="moment-auto-min-unit" style="background:var(--primary-bg);border:1px solid var(--border-color);border-radius:6px;color:var(--text-primary);font-size:12px;padding:2px 4px;outline:none;cursor:pointer;">
                            <option value="minutes">分钟</option>
                            <option value="hours" selected>小时</option>
                            <option value="days">天</option>
                        </select>
                        <span class="cs-slider-val" id="moment-auto-min-val-display">2小时</span>
                    </div>
                    <div class="cs-slider-row">
                        <span class="cs-slider-label">最多</span>
                        <input type="range" min="1" max="24" step="1" value="6" class="font-size-slider" id="moment-auto-max-val-slider">
                        <select id="moment-auto-max-unit" style="background:var(--primary-bg);border:1px solid var(--border-color);border-radius:6px;color:var(--text-primary);font-size:12px;padding:2px 4px;outline:none;cursor:pointer;">
                            <option value="minutes">分钟</option>
                            <option value="hours" selected>小时</option>
                            <option value="days">天</option>
                        </select>
                        <span class="cs-slider-val" id="moment-auto-max-val-display">6小时</span>
                    </div>
                    <div style="padding:10px 14px 4px;font-size:12px;font-weight:600;color:var(--text-primary);border-top:1px solid var(--border-color);">每次发圈数</div>
                    <div class="cs-slider-row">
                        <span class="cs-slider-label">最少</span>
                        <input type="range" min="1" max="5" step="1" value="1" class="font-size-slider" id="moment-count-min-slider">
                        <span class="cs-slider-val" id="moment-count-min-value">1条</span>
                    </div>
                    <div class="cs-slider-row">
                        <span class="cs-slider-label">最多</span>
                        <input type="range" min="1" max="5" step="1" value="2" class="font-size-slider" id="moment-count-max-slider">
                        <span class="cs-slider-val" id="moment-count-max-value">2条</span>
                    </div>
                    <div style="padding:10px 14px;font-size:11px;color:var(--text-secondary);border-top:1px solid var(--border-color);">
                        <i class="fas fa-info-circle" style="margin-right:4px;"></i>
                        朋友圈内容需要在「高级设置-朋友圈字卡库」中添加
                    </div>
                </div>
            </div>
        `;

        const envelopeSection = document.getElementById('envelope-auto-send-settings');
        if (envelopeSection && envelopeSection.parentElement) {
            envelopeSection.parentElement.insertAdjacentHTML('afterend', sectionHTML);
        } else {
            rhythmPanel.insertAdjacentHTML('beforeend', sectionHTML);
        }
    }

    function injectLibraryManager() {
        const advancedPanel = document.getElementById('advanced-settings');
        if (!advancedPanel) return;
        if (document.getElementById('moment-library-entry')) return;

        const entryHTML = `
            <div class="settings-item" id="moment-library-entry" onclick="openMomentLibraryManager()">
                <i class="fas fa-book"></i><span>朋友圈字卡库</span>
                <i class="fas fa-chevron-right settings-arrow"></i>
            </div>
        `;

        const envelopeItem = document.getElementById('envelope-function');
        if (envelopeItem) envelopeItem.insertAdjacentHTML('afterend', entryHTML);
        createLibraryModal();
    }

    function createLibraryModal() {
        if (document.getElementById('moment-library-modal')) return;
        const modalHTML = `
            <div id="moment-library-modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); display:none; align-items:center; justify-content:center; z-index:100001; padding:20px; box-sizing:border-box;">
                <div style="background:var(--secondary-bg,#fff); max-height:90vh; width:100%; max-width:500px; padding:0; overflow:hidden; display:flex; flex-direction:column; border-radius:16px; box-shadow:0 10px 40px rgba(0,0,0,0.3);">
                    <div style="padding:16px 20px; border-bottom:1px solid var(--border-color); display:flex; align-items:center; justify-content:space-between;">
                        <div style="font-size:16px; font-weight:700; color:var(--text-primary);">
                            <i class="fas fa-images" style="color:var(--accent-color); margin-right:8px;"></i>
                            朋友圈字卡库
                        </div>
                        <button onclick="closeMomentLibraryManager()" style="background:none; border:none; color:var(--text-secondary); font-size:18px; cursor:pointer; padding:4px 8px;">
                            <i class="fas fa-xmark"></i>
                        </button>
                    </div>
                    <div style="display:flex; border-bottom:1px solid var(--border-color);">
                        <button class="moment-lib-tab active" data-tab="text" onclick="switchMomentLibTab('text')">文字</button>
                        <button class="moment-lib-tab" data-tab="image" onclick="switchMomentLibTab('image')">图片</button>
                        <button class="moment-lib-tab" data-tab="mixed" onclick="switchMomentLibTab('mixed')">文字+图片</button>
                    </div>
                    <div id="moment-lib-content" style="flex:1; overflow-y:auto; padding:16px;"></div>
                    <div style="padding:12px 16px; border-top:1px solid var(--border-color); display:flex; gap:10px;">
                        <button onclick="addMomentLibItem()" style="flex:1; padding:10px; background:var(--accent-color); color:#fff; border:none; border-radius:10px; font-size:14px; font-weight:600; cursor:pointer;">
                            <i class="fas fa-plus" style="margin-right:4px;"></i>添加内容
                        </button>
                    </div>
                </div>
            </div>
            <style>
                .moment-lib-tab { flex:1; padding:12px; background:none; border:none; color:var(--text-secondary); font-size:14px; cursor:pointer; border-bottom:2px solid transparent; transition:all 0.2s; }
                .moment-lib-tab.active { color:var(--accent-color); border-bottom-color:var(--accent-color); font-weight:600; }
                .moment-lib-item { display:flex; align-items:flex-start; gap:10px; padding:12px; background:var(--primary-bg); border:1px solid var(--border-color); border-radius:12px; margin-bottom:10px; }
                .moment-lib-item-text { flex:1; font-size:13px; color:var(--text-primary); line-height:1.5; word-break:break-all; }
                .moment-lib-item-img { width:60px; height:60px; object-fit:cover; border-radius:8px; flex-shrink:0; }
                .moment-lib-item-del { background:none; border:none; color:var(--text-secondary); cursor:pointer; padding:4px; opacity:0.6; flex-shrink:0; }
                .moment-lib-item-del:hover { opacity:1; color:#ef4444; }
                .moment-lib-empty { text-align:center; padding:40px 20px; color:var(--text-secondary); font-size:13px; }
            </style>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    function syncSettingsUI() {
        const toggle = document.getElementById('moment-auto-toggle');
        if (toggle) toggle.classList.toggle('active', settings.enabled);
        const settingsPanel = document.getElementById('moment-auto-settings');
        if (settingsPanel) settingsPanel.style.display = settings.enabled ? 'block' : 'none';

        const minSlider = document.getElementById('moment-auto-min-val-slider');
        const minUnit = document.getElementById('moment-auto-min-unit');
        const minDisplay = document.getElementById('moment-auto-min-val-display');
        if (minSlider) minSlider.value = settings.minVal;
        if (minUnit) minUnit.value = settings.minUnit;
        if (minDisplay) minDisplay.textContent = settings.minVal + getUnitLabel(settings.minUnit);

        const maxSlider = document.getElementById('moment-auto-max-val-slider');
        const maxUnit = document.getElementById('moment-auto-max-unit');
        const maxDisplay = document.getElementById('moment-auto-max-val-display');
        if (maxSlider) maxSlider.value = settings.maxVal;
        if (maxUnit) maxUnit.value = settings.maxUnit;
        if (maxDisplay) maxDisplay.textContent = settings.maxVal + getUnitLabel(settings.maxUnit);

        const countMinSlider = document.getElementById('moment-count-min-slider');
        const countMinValue = document.getElementById('moment-count-min-value');
        if (countMinSlider) countMinSlider.value = settings.minCount;
        if (countMinValue) countMinValue.textContent = settings.minCount + '条';

        const countMaxSlider = document.getElementById('moment-count-max-slider');
        const countMaxValue = document.getElementById('moment-count-max-value');
        if (countMaxSlider) countMaxSlider.value = settings.maxCount;
        if (countMaxValue) countMaxValue.textContent = settings.maxCount + '条';
    }

    function getUnitLabel(unit) {
        const labels = { minutes: '分钟', hours: '小时', days: '天' };
        return labels[unit] || '小时';
    }

    function bindSettingsEvents() {
        const toggle = document.getElementById('moment-auto-toggle');
        if (toggle) {
            toggle.addEventListener('click', () => {
                settings.enabled = !settings.enabled;
                saveSettings();
                syncSettingsUI();
                restartAutoSendTimer();
                if (typeof showNotification === 'function') {
                    showNotification(`朋友圈自动发送已${settings.enabled ? '开启' : '关闭'}`, 'success');
                }
            });
        }

        const minSlider = document.getElementById('moment-auto-min-val-slider');
        const minUnit = document.getElementById('moment-auto-min-unit');
        if (minSlider) {
            minSlider.addEventListener('input', (e) => {
                let val = parseInt(e.target.value);
                if (val > settings.maxVal && settings.minUnit === settings.maxUnit) { val = settings.maxVal; e.target.value = val; }
                settings.minVal = val;
                const display = document.getElementById('moment-auto-min-val-display');
                if (display) display.textContent = val + getUnitLabel(settings.minUnit);
            });
            minSlider.addEventListener('change', () => saveSettings());
        }
        if (minUnit) {
            minUnit.addEventListener('change', (e) => {
                settings.minUnit = e.target.value;
                const display = document.getElementById('moment-auto-min-val-display');
                if (display) display.textContent = settings.minVal + getUnitLabel(settings.minUnit);
                saveSettings();
                restartAutoSendTimer();
            });
        }

        const maxSlider = document.getElementById('moment-auto-max-val-slider');
        const maxUnit = document.getElementById('moment-auto-max-unit');
        if (maxSlider) {
            maxSlider.addEventListener('input', (e) => {
                let val = parseInt(e.target.value);
                if (val < settings.minVal && settings.minUnit === settings.maxUnit) { val = settings.minVal; e.target.value = val; }
                settings.maxVal = val;
                const display = document.getElementById('moment-auto-max-val-display');
                if (display) display.textContent = val + getUnitLabel(settings.maxUnit);
            });
            maxSlider.addEventListener('change', () => saveSettings());
        }
        if (maxUnit) {
            maxUnit.addEventListener('change', (e) => {
                settings.maxUnit = e.target.value;
                const display = document.getElementById('moment-auto-max-val-display');
                if (display) display.textContent = settings.maxVal + getUnitLabel(settings.maxUnit);
                saveSettings();
                restartAutoSendTimer();
            });
        }

        const countMinSlider = document.getElementById('moment-count-min-slider');
        if (countMinSlider) {
            countMinSlider.addEventListener('input', (e) => {
                let val = parseInt(e.target.value);
                if (val > settings.maxCount) { val = settings.maxCount; e.target.value = val; }
                settings.minCount = val;
                const display = document.getElementById('moment-count-min-value');
                if (display) display.textContent = val + '条';
            });
            countMinSlider.addEventListener('change', () => saveSettings());
        }

        const countMaxSlider = document.getElementById('moment-count-max-slider');
        if (countMaxSlider) {
            countMaxSlider.addEventListener('input', (e) => {
                let val = parseInt(e.target.value);
                if (val < settings.minCount) { val = settings.minCount; e.target.value = val; }
                settings.maxCount = val;
                const display = document.getElementById('moment-count-max-value');
                if (display) display.textContent = val + '条';
            });
            countMaxSlider.addEventListener('change', () => saveSettings());
        }
    }

    let currentLibTab = 'text';

    window.openMomentLibraryManager = function() {
        const modal = document.getElementById('moment-library-modal');
        if (modal) { modal.style.display = 'flex'; loadLibraries(); renderMomentLibrary(); }
    };

    window.closeMomentLibraryManager = function() {
        const modal = document.getElementById('moment-library-modal');
        if (modal) modal.style.display = 'none';
    };

    window.switchMomentLibTab = function(tab) {
        currentLibTab = tab;
        document.querySelectorAll('.moment-lib-tab').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        renderMomentLibrary();
    };

    function renderMomentLibrary() {
        const container = document.getElementById('moment-lib-content');
        if (!container) return;
        let items = [];
        switch (currentLibTab) {
            case 'text': items = textLibrary; break;
            case 'image': items = imageLibrary; break;
            case 'mixed': items = mixedLibrary; break;
        }
        if (items.length === 0) {
            container.innerHTML = `
                <div class="moment-lib-empty">
                    <i class="fas fa-inbox" style="font-size:32px; margin-bottom:12px; opacity:0.3;"></i>
                    <div>暂无内容，点击下方按钮添加</div>
                </div>
            `;
            return;
        }
        container.innerHTML = items.map((item, idx) => {
            if (currentLibTab === 'text') {
                return `<div class="moment-lib-item"><div class="moment-lib-item-text">${escapeHtml(item)}</div><button class="moment-lib-item-del" onclick="deleteMomentLibItem(${idx})"><i class="fas fa-trash"></i></button></div>`;
            } else if (currentLibTab === 'image') {
                return `<div class="moment-lib-item"><img src="${item}" class="moment-lib-item-img" alt=""><div style="flex:1; font-size:12px; color:var(--text-secondary);">图片</div><button class="moment-lib-item-del" onclick="deleteMomentLibItem(${idx})"><i class="fas fa-trash"></i></button></div>`;
            } else {
                return `<div class="moment-lib-item">${item.images && item.images[0] ? `<img src="${item.images[0]}" class="moment-lib-item-img" alt="">` : ''}<div class="moment-lib-item-text">${escapeHtml(item.text || '')}</div><button class="moment-lib-item-del" onclick="deleteMomentLibItem(${idx})"><i class="fas fa-trash"></i></button></div>`;
            }
        }).join('');
    }

    window.addMomentLibItem = function() {
        if (currentLibTab === 'text') {
            const text = prompt('请输入朋友圈文字内容：');
            if (text && text.trim()) { textLibrary.push(text.trim()); saveLibrary('text'); renderMomentLibrary(); }
        } else if (currentLibTab === 'image') {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => { imageLibrary.push(ev.target.result); saveLibrary('image'); renderMomentLibrary(); };
                reader.readAsDataURL(file);
            };
            input.click();
        } else {
            const text = prompt('请输入朋友圈文字内容：');
            if (text === null) return;
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                    mixedLibrary.push({ text: text || '', images: [ev.target.result] });
                    saveLibrary('mixed');
                    renderMomentLibrary();
                };
                reader.readAsDataURL(file);
            };
            input.click();
        }
    };

    window.deleteMomentLibItem = function(idx) {
        if (!confirm('确定删除这条内容吗？')) return;
        switch (currentLibTab) {
            case 'text': textLibrary.splice(idx, 1); saveLibrary('text'); break;
            case 'image': imageLibrary.splice(idx, 1); saveLibrary('image'); break;
            case 'mixed': mixedLibrary.splice(idx, 1); saveLibrary('mixed'); break;
        }
        renderMomentLibrary();
    };

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    window.testPartnerMoment = function() {
        generatePartnerMoments();
        console.log('[朋友圈扩展] 已触发测试发圈');
    };

    // 多层评论循环回复 + 直接读取全局回复库，无需二次修改
    function listenNewMomentComments() {
        setInterval(() => {
            if (!window.momentsData || !settings.enabled) return;
            window.momentsData.forEach(post => {
                if (!post.isPartner) return;
                const traverseComments = (commentList) => {
                    commentList.forEach(comment => {
                        if (comment.isPartnerComment) return;
                        const now = Date.now();
                        if (comment.lastAutoReplyTime && now - comment.lastAutoReplyTime < 3000) return;
                        setTimeout(() => {
                            genAutoReply(post, comment);
                            comment.lastAutoReplyTime = Date.now();
                            if (typeof saveMomentsToStorageSync === 'function') saveMomentsToStorageSync();
                            if (typeof renderMoments === 'function') renderMoments();
                        }, Math.floor(Math.random() * 1200 + 600));
                        if (comment.replies && comment.replies.length > 0) {
                            traverseComments(comment.replies);
                        }
                    });
                };
                traverseComments(post.comments);
            });
        }, 1500);
    }

    function genAutoReply(post, targetComment) {
        let partnerName = '梦角';
        let partnerAvatar = '';
        try {
            const profileRaw = localStorage.getItem('profile_partner');
            if (profileRaw) {
                const pData = JSON.parse(profileRaw);
                if (pData.name) partnerName = pData.name;
                if (pData.avatar) partnerAvatar = pData.avatar;
            }
        } catch (err) {}

        // 读取页面顶部回复库全部主字卡
        function getAllMainReplyCards() {
            try {
                const storeRaw = localStorage.getItem('reply_library_main');
                if (!storeRaw) return [];
                const libData = JSON.parse(storeRaw);
                let allTexts = [];
                libData.groups.forEach(group => {
                    group.cards.forEach(card => {
                        const txt = card.text?.trim();
                        if (txt) allTexts.push(txt);
                    });
                });
                return allTexts;
            } catch (e) {
                return ["嗯？", "我在", "想和你多说说话"];
            }
        }

        const cardList = getAllMainReplyCards();
        const pickText = cardList[Math.floor(Math.random() * cardList.length)];

        const newReplyItem = {
