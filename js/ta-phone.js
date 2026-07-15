/* ============================================
 *  TA的手机 - 梦角手机模拟模块
 * 版本：1.0
 * ============================================ */

(function() {
    'use strict';

    /* ---------- 存储键 ---------- */
    var STORAGE = {
        DIARIES: 'ta_phone_diaries',
        MUSIC: 'ta_phone_music',
        MUSIC_STATE: 'ta_phone_music_state',
        BROWSER: 'ta_phone_browser',
        PROFILE: 'profile_partner'
    };

    /* ---------- 日记模板 ---------- */
    var DIARY_TEMPLATES = [
        '今天一直在想一个问题。「{content}」',
        '看到了一句话，觉得很适合我们。「{content}」',
        '不知道为什么，突然想起了「{content}」，忍不住笑了笑。',
        '今天好像特别想和你说……「{content}」',
        '翻到了一条消息，又看了一遍。「{content}」'
    ];

    /* ---------- 默认浏览器历史 ---------- */
    var DEFAULT_BROWSER_HISTORY = [
        { query: '怎么哄人开心', time: '3天前' },
        { query: '情侣周年纪念日礼物', time: '5天前' },
        { query: '今天天气怎么样', time: '昨天' },
        { query: '异地恋怎么维持', time: '2天前' },
        { query: '好吃的甜品店推荐', time: '今天' }
    ];

    /* ---------- 预设歌曲 ---------- */
    var PRESET_SONGS = [
        { name: '遗失の心跳', url: '' },
        { name: '慢慢喜欢你', url: '' },
        { name: '小幸运', url: '' }
    ];

    /* ---------- 状态 ---------- */
    var partnerName = '梦角';
    var currentPage = 'desktop';
    var audioEl = null;
    var musicList = [];
    var currentSongIndex = 0;
    var isPlaying = false;
    var rotationId = null;
    var clockTimer = null;
    var pageStack = [];

    /* ---------- 工具函数 ---------- */
    function getPartnerName() {
        try {
            var raw = localStorage.getItem(STORAGE.PROFILE);
            if (raw) {
                var p = JSON.parse(raw);
                if (p.name) return p.name;
            }
        } catch (e) {}
        return '梦角';
    }

    function escapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function getWeekDay(date) {
        var days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        return days[date.getDay()];
    }

    function formatDateCN(date) {
        return (date.getMonth() + 1) + '月' + date.getDate() + '日';
    }

    function formatDateTimeCN(date) {
        var h = date.getHours();
        var m = date.getMinutes();
        return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
    }

    function getCurrentTimeStr() {
        var now = new Date();
        return formatDateTimeCN(now);
    }

    /* ---------- 数据读写 ---------- */
    function loadDiaries() {
        try {
            var raw = localStorage.getItem(STORAGE.DIARIES);
            return raw ? JSON.parse(raw) : [];
        } catch (e) { return []; }
    }

    function saveDiaries(diaries) {
        localStorage.setItem(STORAGE.DIARIES, JSON.stringify(diaries));
    }

    function loadMusic() {
        try {
            var raw = localStorage.getItem(STORAGE.MUSIC);
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return PRESET_SONGS.slice();
    }

    function saveMusic(list) {
        localStorage.setItem(STORAGE.MUSIC, JSON.stringify(list));
    }

    function loadMusicState() {
        try {
            var raw = localStorage.getItem(STORAGE.MUSIC_STATE);
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return { index: 0, playing: false };
    }

    function saveMusicState() {
        localStorage.setItem(STORAGE.MUSIC_STATE, JSON.stringify({
            index: currentSongIndex,
            playing: isPlaying
        }));
    }

    function loadBrowserHistory() {
        try {
            var raw = localStorage.getItem(STORAGE.BROWSER);
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return null;
    }

    function saveBrowserHistory(list) {
        localStorage.setItem(STORAGE.BROWSER, JSON.stringify(list));
    }

    function ensureBrowserHistory() {
        var list = loadBrowserHistory();
        if (!list || list.length === 0) {
            list = DEFAULT_BROWSER_HISTORY.slice();
            var name = getPartnerName();
            list.push({ query: name + '的喜好', time: '昨天' });
            saveBrowserHistory(list);
        }
        return list;
    }

    /* ---------- 生成自动日记 ---------- */
    function generateAutoDiaries(existingCount) {
        var need = 3 - existingCount;
        if (need <= 0) return [];
        var replies = [];
        try {
            if (Array.isArray(window._customReplies)) {
                replies = window._customReplies;
            }
        } catch (e) {}

        if (replies.length === 0) {
            replies = [
                '你今天过得好吗',
                '好想见你',
                '什么时候才能再见呢',
                '想和你一起看日落',
                '你笑起来真好看'
            ];
        }

        var result = [];
        for (var i = 0; i < need; i++) {
            var daysAgo = i + 1;
            var d = new Date();
            d.setDate(d.getDate() - daysAgo);
            var dateStr = formatDateCN(d) + ' ' + getWeekDay(d);
            var reply = replies[Math.floor(Math.random() * replies.length)];
            var template = DIARY_TEMPLATES[Math.floor(Math.random() * DIARY_TEMPLATES.length)];
            var content = template.replace('{content}', reply);
            result.push({ date: dateStr, content: content, source: 'auto' });
        }
        return result;
    }

    /* ---------- 注入样式 ---------- */
    function injectStyles() {
        var style = document.createElement('style');
        style.id = 'ta-phone-styles';
        style.textContent = [
            /* ---- 手机壳容器 ---- */
            '#ta-phone-container{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.55);display:none;align-items:center;justify-content:center;z-index:99990;backdrop-filter:blur(4px);}',
            '#ta-phone-container.active{display:flex;}',

            '.ta-phone-wrapper{display:flex;flex-direction:column;align-items:center;}',

            /* ---- 手机壳 ---- */
            '.ta-phone-shell{width:320px;height:640px;background:#1a1014;border-radius:40px;padding:12px;box-shadow:0 0 0 3px #5c2030,0 0 0 6px #3a1520,0 20px 60px rgba(0,0,0,0.5);position:relative;}',

            /* ---- 手机屏幕 ---- */
            '.ta-phone-screen{width:100%;height:100%;background:var(--primary-bg,#fef6f0);border-radius:30px;overflow:hidden;display:flex;flex-direction:column;position:relative;}',

            /* ---- 刘海 ---- */
            '.ta-phone-notch{position:absolute;top:0;left:50%;transform:translateX(-50%);width:120px;height:28px;background:#1a1014;border-radius:0 0 18px 18px;z-index:10;}',

            /* ---- 状态栏 ---- */
            '.ta-phone-statusbar{height:44px;padding:0 20px;display:flex;align-items:center;justify-content:space-between;font-size:12px;font-weight:600;color:#1a1014;position:relative;z-index:5;flex-shrink:0;background:var(--primary-bg,#fef6f0);}',
            '.ta-phone-statusbar .status-time{font-size:13px;letter-spacing:0.5px;}',
            '.ta-phone-statusbar .status-icons{display:flex;align-items:center;gap:6px;font-size:11px;}',

            /* ---- 内容区域 ---- */
            '.ta-phone-body{flex:1;overflow:hidden;position:relative;background:var(--primary-bg,#fef6f0);}',

            /* ---- 页面通用 ---- */
            '.ta-phone-page{position:absolute;top:0;left:0;width:100%;height:100%;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;}',
            '.ta-phone-page::-webkit-scrollbar{width:2px;}',
            '.ta-phone-page::-webkit-scrollbar-thumb{background:rgba(0,0,0,0.15);border-radius:2px;}',

            /* ---- 桌面 ---- */
            '.ta-phone-desktop{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 20px 20px;gap:28px;}',

            '.ta-phone-apps{display:flex;flex-direction:column;align-items:center;gap:24px;}',

            '.ta-phone-app-icon{display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:transform 0.2s ease;}',
            '.ta-phone-app-icon:active{transform:scale(0.9);}',
            '.ta-phone-app-icon .icon-box{width:60px;height:60px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:24px;color:#fff;box-shadow:0 4px 12px rgba(0,0,0,0.15);}',
            '.ta-phone-app-icon .icon-label{font-size:11px;color:var(--text-secondary,#666);white-space:nowrap;}',

            /* ---- 底部 Home indicator ---- */
            '.ta-phone-home-indicator{height:30px;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:var(--primary-bg,#fef6f0);}',
            '.ta-phone-home-bar{width:120px;height:4px;background:var(--text-secondary,#999);border-radius:2px;opacity:0.5;}',

            /* ---- 底部提示文字 ---- */
            '.ta-phone-hint{text-align:center;color:rgba(255,255,255,0.5);font-size:12px;margin-top:14px;letter-spacing:1px;}',

            /* ---- 页面切换动画 ---- */
            '@keyframes taPhoneSlideIn{from{transform:translateX(100%);opacity:0.6;}to{transform:translateX(0);opacity:1;}}',
            '@keyframes taPhoneSlideOut{from{transform:translateX(0);opacity:1;}to{transform:translateX(100%);opacity:0.6;}}',
            '.ta-phone-slide-in{animation:taPhoneSlideIn 0.32s ease-out forwards;}',
            '.ta-phone-slide-out{animation:taPhoneSlideOut 0.28s ease-in forwards;}',

            /* ---- 功能页头部 ---- */
            '.ta-phone-header{height:44px;display:flex;align-items:center;padding:0 12px;flex-shrink:0;background:var(--primary-bg,#fef6f0);border-bottom:1px solid var(--border-color,rgba(0,0,0,0.06));}',
            '.ta-phone-header .back-btn{background:none;border:none;font-size:16px;color:var(--accent-color,#c0392b);cursor:pointer;padding:6px 10px;border-radius:8px;transition:background 0.2s;}',
            '.ta-phone-header .back-btn:active{background:rgba(0,0,0,0.05);}',
            '.ta-phone-header .header-title{flex:1;text-align:center;font-size:15px;font-weight:600;color:var(--text-primary,#333);margin-right:36px;}',

            /* ---- 日记页 ---- */
            '.ta-diary-list{padding:12px 14px 20px;display:flex;flex-direction:column;gap:10px;}',
            '.ta-diary-card{display:flex;gap:12px;padding:12px 14px;background:rgba(255,255,255,0.6);border-radius:12px;border:1px solid var(--border-color,rgba(0,0,0,0.06));}',
            '.ta-diary-date{display:flex;flex-direction:column;align-items:center;justify-content:flex-start;min-width:52px;padding-top:2px;}',
            '.ta-diary-date .day{font-size:22px;font-weight:700;color:var(--accent-color,#c0392b);line-height:1.1;}',
            '.ta-diary-date .month{font-size:11px;color:var(--text-secondary,#888);margin-top:2px;}',
            '.ta-diary-date .weekday{font-size:10px;color:var(--text-secondary,#aaa);margin-top:1px;}',
            '.ta-diary-content{flex:1;font-size:13px;line-height:1.7;color:var(--text-primary,#444);}',

            '.ta-diary-add-btn{display:block;margin:10px 14px 30px;padding:10px;background:var(--accent-color,#c0392b);color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;text-align:center;transition:opacity 0.2s;}',
            '.ta-diary-add-btn:active{opacity:0.8;}',

            /* ---- 弹窗/模态 ---- */
            '.ta-phone-modal-overlay{position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;z-index:20;padding:20px;box-sizing:border-box;}',
            '.ta-phone-modal{background:var(--secondary-bg,#fff);border-radius:16px;width:100%;max-width:270px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.2);}',
            '.ta-phone-modal-header{padding:14px 16px 10px;font-size:14px;font-weight:600;color:var(--text-primary,#333);border-bottom:1px solid var(--border-color,rgba(0,0,0,0.06));}',
            '.ta-phone-modal-body{padding:12px 16px;}',
            '.ta-phone-modal-footer{display:flex;border-top:1px solid var(--border-color,rgba(0,0,0,0.06));}',
            '.ta-phone-modal-footer button{flex:1;padding:11px 0;border:none;font-size:13px;font-weight:600;cursor:pointer;transition:background 0.2s;}',
            '.ta-phone-modal-footer .modal-cancel{background:none;color:var(--text-secondary,#888);}',
            '.ta-phone-modal-footer .modal-confirm{background:var(--accent-color,#c0392b);color:#fff;}',
            '.ta-phone-modal-footer .modal-cancel:active{background:rgba(0,0,0,0.04);}',
            '.ta-phone-modal-footer .modal-confirm:active{opacity:0.85;}',

            '.ta-phone-input{width:100%;padding:10px 12px;border:1px solid var(--border-color,rgba(0,0,0,0.12));border-radius:8px;font-size:13px;color:var(--text-primary,#333);background:var(--primary-bg,#fef6f0);outline:none;box-sizing:border-box;resize:none;font-family:inherit;}',
            '.ta-phone-input:focus{border-color:var(--accent-color,#c0392b);}',

            '.ta-phone-select{width:100%;padding:10px 12px;border:1px solid var(--border-color,rgba(0,0,0,0.12));border-radius:8px;font-size:13px;color:var(--text-primary,#333);background:var(--primary-bg,#fef6f0);outline:none;box-sizing:border-box;margin-top:8px;appearance:auto;}',

            /* ---- 音乐页 ---- */
            '.ta-music-page{display:flex;flex-direction:column;height:100%;}',

            '.ta-music-player{display:flex;flex-direction:column;align-items:center;padding:20px 16px 12px;flex-shrink:0;}',
            '.ta-music-cover-wrap{width:160px;height:160px;border-radius:50%;padding:8px;background:linear-gradient(135deg,#f0c0c8,#e0a0b0);box-shadow:0 6px 24px rgba(0,0,0,0.12);margin-bottom:14px;position:relative;overflow:hidden;}',
            '.ta-music-cover{width:100%;height:100%;border-radius:50%;background:linear-gradient(135deg,#f5c6d0,#e8a4b8,#d4899e);display:flex;align-items:center;justify-content:center;font-size:48px;color:rgba(255,255,255,0.85);}',
            '.ta-music-cover.spinning{animation:taPhoneCoverSpin 8s linear infinite;}',
            '.ta-music-cover.paused{animation-play-state:paused;}',
            '@keyframes taPhoneCoverSpin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}',

            '.ta-music-cover-center{width:20px;height:20px;border-radius:50%;background:var(--primary-bg,#fef6f0);position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:2;box-shadow:0 0 4px rgba(0,0,0,0.1);}',

            '.ta-music-song-name{font-size:15px;font-weight:600;color:var(--text-primary,#333);margin-bottom:16px;text-align:center;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',

            '.ta-music-controls{display:flex;align-items:center;gap:24px;margin-bottom:14px;}',
            '.ta-music-ctrl-btn{background:none;border:none;font-size:18px;color:var(--text-primary,#555);cursor:pointer;padding:8px;border-radius:50%;transition:all 0.2s;}',
            '.ta-music-ctrl-btn:active{transform:scale(0.9);}',
            '.ta-music-ctrl-btn.play-btn{width:48px;height:48px;background:var(--accent-color,#c0392b);color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 3px 10px rgba(0,0,0,0.15);}',
            '.ta-music-ctrl-btn.play-btn:active{opacity:0.85;}',

            '.ta-music-volume{display:flex;align-items:center;gap:8px;width:100%;max-width:200px;margin-bottom:10px;}',
            '.ta-music-volume i{font-size:12px;color:var(--text-secondary,#999);}',
            '.ta-music-volume input[type=range]{flex:1;-webkit-appearance:none;appearance:none;height:4px;background:var(--border-color,rgba(0,0,0,0.1));border-radius:2px;outline:none;}',
            '.ta-music-volume input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;background:var(--accent-color,#c0392b);border-radius:50%;cursor:pointer;}',

            /* ---- 播放列表 ---- */
            '.ta-music-playlist{flex:1;overflow-y:auto;border-top:1px solid var(--border-color,rgba(0,0,0,0.06));padding:8px 14px 20px;-webkit-overflow-scrolling:touch;}',
            '.ta-music-playlist::-webkit-scrollbar{width:2px;}',
            '.ta-music-playlist::-webkit-scrollbar-thumb{background:rgba(0,0,0,0.1);border-radius:2px;}',
            '.ta-music-playlist-title{font-size:12px;font-weight:600;color:var(--text-secondary,#999);padding:8px 0 6px;letter-spacing:0.5px;}',

            '.ta-music-song-item{display:flex;align-items:center;padding:10px 10px;border-radius:8px;cursor:pointer;transition:background 0.15s;gap:10px;}',
            '.ta-music-song-item:active{background:rgba(0,0,0,0.04);}',
            '.ta-music-song-item.active{background:rgba(0,0,0,0.04);}',
            '.ta-music-song-item.active .song-item-name{color:var(--accent-color,#c0392b);}',
            '.ta-music-song-item .song-item-icon{font-size:14px;color:var(--text-secondary,#bbb);width:20px;text-align:center;}',
            '.ta-music-song-item.active .song-item-icon{color:var(--accent-color,#c0392b);}',
            '.ta-music-song-item .song-item-name{flex:1;font-size:13px;color:var(--text-primary,#444);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
            '.ta-music-song-item .song-item-del{background:none;border:none;font-size:12px;color:var(--text-secondary,#ccc);cursor:pointer;padding:4px;opacity:0;transition:opacity 0.2s;}',
            '.ta-music-song-item:hover .song-item-del{opacity:1;}',
            '.ta-music-song-item .song-item-del:active{color:#e74c3c;}',

            '.ta-music-add-btn{display:block;margin:8px 14px 10px;padding:8px;background:none;border:1px dashed var(--border-color,rgba(0,0,0,0.15));border-radius:8px;font-size:12px;color:var(--text-secondary,#999);cursor:pointer;text-align:center;transition:all 0.2s;}',
            '.ta-music-add-btn:active{background:rgba(0,0,0,0.03);}',

            /* ---- 浏览器页 ---- */
            '.ta-browser-list{padding:8px 14px 20px;display:flex;flex-direction:column;gap:2px;}',
            '.ta-browser-item{display:flex;align-items:center;padding:10px 10px;border-radius:10px;gap:10px;position:relative;overflow:hidden;transition:background 0.15s;cursor:default;}',
            '.ta-browser-item:active{background:rgba(0,0,0,0.03);}',
            '.ta-browser-item .browser-icon{font-size:14px;color:var(--text-secondary,#bbb);flex-shrink:0;width:20px;text-align:center;}',
            '.ta-browser-item .browser-query{flex:1;font-size:13px;color:var(--text-primary,#444);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
            '.ta-browser-item .browser-time{font-size:11px;color:var(--text-secondary,#aaa);flex-shrink:0;}',
            '.ta-browser-item .browser-delete{position:absolute;right:-70px;top:0;height:100%;width:70px;background:#e74c3c;color:#fff;border:none;font-size:12px;cursor:pointer;transition:right 0.25s ease;display:flex;align-items:center;justify-content:center;}',
            '.ta-browser-item.show-delete .browser-delete{right:0;}',
            '.ta-browser-item.show-delete .browser-query{margin-right:70px;}',

            '.ta-browser-add-btn{display:block;margin:8px 14px 30px;padding:8px;background:none;border:1px dashed var(--border-color,rgba(0,0,0,0.15));border-radius:8px;font-size:12px;color:var(--text-secondary,#999);cursor:pointer;text-align:center;transition:all 0.2s;}',
            '.ta-browser-add-btn:active{background:rgba(0,0,0,0.03);}',

            /* ---- 空状态 ---- */
            '.ta-phone-empty{text-align:center;padding:40px 20px;color:var(--text-secondary,#bbb);font-size:13px;}',
            '.ta-phone-empty i{font-size:32px;margin-bottom:10px;display:block;opacity:0.3;}'
        ].join('\n');
        document.head.appendChild(style);
    }

    /* ---------- 状态栏时钟 ---------- */
    function startClock() {
        stopClock();
        updateClock();
        clockTimer = setInterval(updateClock, 30000);
    }

    function stopClock() {
        if (clockTimer) {
            clearInterval(clockTimer);
            clockTimer = null;
        }
    }

    function updateClock() {
        var el = document.querySelector('#ta-phone-container .status-time');
        if (el) el.textContent = getCurrentTimeStr();
    }

    /* ---------- 获取容器 ---------- */
    function getContainer() {
        return document.getElementById('ta-phone-container');
    }

    /* ---------- 渲染整个手机界面 ---------- */
    function renderPhone() {
        var container = getContainer();
        if (!container) return;

        container.innerHTML = [
            '<div class="ta-phone-wrapper">',
            '  <div class="ta-phone-shell">',
            '    <div class="ta-phone-screen">',
            '      <div class="ta-phone-notch"></div>',
            '      <div class="ta-phone-statusbar">',
            '        <span class="status-time">' + getCurrentTimeStr() + '</span>',
            '        <span class="status-icons">',
            '          <i class="fas fa-wifi"></i>',
            '          <i class="fas fa-battery-three-quarters"></i>',
            '        </span>',
            '      </div>',
            '      <div class="ta-phone-body" id="ta-phone-body"></div>',
            '      <div class="ta-phone-home-indicator"><div class="ta-phone-home-bar"></div></div>',
            '    </div>',
            '  </div>',
            '  <div class="ta-phone-hint">偷看一眼就好——他不会知道的。</div>',
            '</div>'
        ].join('\n');

        renderDesktop();
    }

    /* ---------- 渲染桌面 ---------- */
    function renderDesktop() {
        var body = document.getElementById('ta-phone-body');
        if (!body) return;

        body.innerHTML = [
            '<div class="ta-phone-page" id="ta-phone-desktop">',
            '  <div class="ta-phone-desktop">',
            '    <div class="ta-phone-apps">',
            '      <div class="ta-phone-app-icon" data-app="diary">',
            '        <div class="icon-box" style="background:#E8A4B8;"><i class="fas fa-book-open"></i></div>',
            '        <span class="icon-label">TA的日记</span>',
            '      </div>',
            '      <div class="ta-phone-app-icon" data-app="music">',
            '        <div class="icon-box" style="background:#A8D8EA;"><i class="fas fa-music"></i></div>',
            '        <span class="icon-label">TA的音乐</span>',
            '      </div>',
            '      <div class="ta-phone-app-icon" data-app="browser">',
            '        <div class="icon-box" style="background:#C4B5FD;"><i class="fas fa-globe"></i></div>',
            '        <span class="icon-label">TA的浏览器</span>',
            '      </div>',
            '    </div>',
            '  </div>',
            '</div>'
        ].join('\n');

        /* 绑定图标点击 */
        body.querySelectorAll('.ta-phone-app-icon').forEach(function(icon) {
            icon.addEventListener('click', function() {
                var app = this.getAttribute('data-app');
                openApp(app);
            });
        });

        currentPage = 'desktop';
    }

    /* ---------- 打开 App ---------- */
    function openApp(appName) {
        pageStack.push(currentPage);
        currentPage = appName;

        var body = document.getElementById('ta-phone-body');
        if (!body) return;

        switch (appName) {
            case 'diary': renderDiaryPage(body); break;
            case 'music': renderMusicPage(body); break;
            case 'browser': renderBrowserPage(body); break;
        }
    }

    /* ---------- 返回上一级 ---------- */
    function goBack() {
        if (currentPage === 'desktop') return;

        /* 检查是否有模态弹窗 */
        var modal = document.querySelector('#ta-phone-body .ta-phone-modal-overlay');
        if (modal) {
            modal.remove();
            return;
        }

        var body = document.getElementById('ta-phone-body');
        if (!body) return;

        var currentPageEl = body.querySelector('.ta-phone-page');
        if (currentPageEl) {
            currentPageEl.classList.add('ta-phone-slide-out');
            currentPageEl.addEventListener('animationend', function() {
                pageStack.pop();
                renderDesktop();
            }, { once: true });
        } else {
            pageStack.pop();
            renderDesktop();
        }

        if (currentPage === 'music') {
            stopAudioPlayback();
        }
        currentPage = 'desktop';
    }

    /* ==================== 日记页 ==================== */
    function renderDiaryPage(body) {
        var diaries = loadDiaries();
        var autoDiaries = generateAutoDiaries(diaries.length);
        var allDiaries = autoDiaries.concat(diaries);

        var listHTML = '';
        if (allDiaries.length === 0) {
            listHTML = '<div class="ta-phone-empty"><i class="fas fa-book-open"></i>还没有日记</div>';
        } else {
            allDiaries.forEach(function(d) {
                var parts = d.date.split(' ');
                var dateParts = parts[0].split('月');
                var day = dateParts[1] ? dateParts[1].replace('日', '') : '';
                var month = dateParts[0] + '月';
                var weekday = parts[1] || '';
                listHTML += '<div class="ta-diary-card">' +
                    '<div class="ta-diary-date">' +
                    '  <span class="day">' + day + '</span>' +
                    '  <span class="month">' + month + '</span>' +
                    '  <span class="weekday">' + weekday + '</span>' +
                    '</div>' +
                    '<div class="ta-diary-content">' + escapeHtml(d.content) + '</div>' +
                    '</div>';
            });
        }

        body.innerHTML = [
            '<div class="ta-phone-page ta-phone-slide-in" id="ta-phone-diary">',
            '  <div class="ta-phone-header">',
            '    <button class="back-btn" id="ta-diary-back"><i class="fas fa-chevron-left"></i></button>',
            '    <span class="header-title">TA的日记</span>',
            '  </div>',
            '  <div class="ta-diary-list">' + listHTML + '</div>',
            '  <button class="ta-diary-add-btn" id="ta-diary-add">+ 写日记</button>',
            '</div>'
        ].join('\n');

        document.getElementById('ta-diary-back').addEventListener('click', goBack);
        document.getElementById('ta-diary-add').addEventListener('click', showAddDiaryModal);
    }

    function showAddDiaryModal() {
        var body = document.getElementById('ta-phone-body');
        var page = document.getElementById('ta-phone-diary');
        if (!page) return;

        var overlay = document.createElement('div');
                overlay.className = 'ta-phone-modal-overlay';
        overlay.innerHTML = [
            '<div class="ta-phone-modal">',
            '  <div class="ta-phone-modal-header">写一条日记</div>',
            '  <div class="ta-phone-modal-body">',
            '    <textarea class="ta-phone-input" id="ta-diary-input" rows="4" placeholder="在这里写点什么……"></textarea>',
            '  </div>',
            '  <div class="ta-phone-modal-footer">',
            '    <button class="modal-cancel" id="ta-diary-modal-cancel">取消</button>',
            '    <button class="modal-confirm" id="ta-diary-modal-confirm">保存</button>',
            '  </div>',
            '</div>'
        ].join('\n');

        page.appendChild(overlay);

        overlay.querySelector('#ta-diary-modal-cancel').addEventListener('click', function() {
            overlay.remove();
        });
        overlay.querySelector('#ta-diary-modal-confirm').addEventListener('click', function() {
            var input = document.getElementById('ta-diary-input');
            var text = input ? input.value.trim() : '';
            if (!text) return;

            var now = new Date();
            var dateStr = formatDateCN(now) + ' ' + getWeekDay(now);
            var diaries = loadDiaries();
            diaries.unshift({ date: dateStr, content: text, source: 'user' });
            saveDiaries(diaries);
            overlay.remove();
            renderDiaryPage(document.getElementById('ta-phone-body'));
        });

        /* 点击遮罩关闭 */
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) overlay.remove();
        });
    }

    /* ==================== 音乐页 ==================== */
    function renderMusicPage(body) {
        musicList = loadMusic();
        var state = loadMusicState();
        currentSongIndex = state.index || 0;
        if (currentSongIndex >= musicList.length) currentSongIndex = 0;

        var currentSong = musicList[currentSongIndex] || { name: '暂无歌曲' };

        /* 播放列表 HTML */
        var playlistHTML = '';
        if (musicList.length === 0) {
            playlistHTML = '<div class="ta-phone-empty"><i class="fas fa-music"></i>还没有歌曲</div>';
        } else {
            musicList.forEach(function(song, idx) {
                var activeClass = idx === currentSongIndex ? ' active' : '';
                playlistHTML += '<div class="ta-music-song-item' + activeClass + '" data-idx="' + idx + '">' +
                    '<span class="song-item-icon"><i class="fas ' + (idx === currentSongIndex && isPlaying ? 'fa-volume-up' : 'fa-music') + '"></i></span>' +
                    '<span class="song-item-name">' + escapeHtml(song.name) + '</span>' +
                    '<button class="song-item-del" data-delidx="' + idx + '"><i class="fas fa-xmark"></i></button>' +
                    '</div>';
            });
        }

        var coverClass = 'ta-music-cover';
        if (isPlaying) coverClass += ' spinning';

        body.innerHTML = [
            '<div class="ta-phone-page ta-phone-slide-in" id="ta-phone-music">',
            '  <div class="ta-phone-header">',
            '    <button class="back-btn" id="ta-music-back"><i class="fas fa-chevron-left"></i></button>',
            '    <span class="header-title">音乐</span>',
            '  </div>',
            '  <div class="ta-music-page">',
            '    <div class="ta-music-player">',
            '      <div class="ta-music-cover-wrap">',
            '        <div class="' + coverClass + '" id="ta-music-cover">',
            '          <div class="ta-music-cover-center"></div>',
            '          <i class="fas fa-music" style="position:relative;z-index:1;"></i>',
            '        </div>',
            '      </div>',
            '      <div class="ta-music-song-name" id="ta-music-song-name">' + escapeHtml(currentSong.name) + '</div>',
            '      <div class="ta-music-controls">',
            '        <button class="ta-music-ctrl-btn" id="ta-music-prev"><i class="fas fa-backward-step"></i></button>',
            '        <button class="ta-music-ctrl-btn play-btn" id="ta-music-play"><i class="fas ' + (isPlaying ? 'fa-pause' : 'fa-play') + '" style="margin-left:' + (isPlaying ? '0' : '2') + 'px;"></i></button>',
            '        <button class="ta-music-ctrl-btn" id="ta-music-next"><i class="fas fa-forward-step"></i></button>',
            '      </div>',
            '      <div class="ta-music-volume">',
            '        <i class="fas fa-volume-low"></i>',
            '        <input type="range" id="ta-music-volume" min="0" max="100" value="80">',
            '        <i class="fas fa-volume-high"></i>',
            '      </div>',
            '    </div>',
            '    <button class="ta-music-add-btn" id="ta-music-add">+ 添加歌曲</button>',
            '    <div class="ta-music-playlist">',
            '      <div class="ta-music-playlist-title">播放列表</div>',
            '      ' + playlistHTML,
            '    </div>',
            '  </div>',
            '</div>'
        ].join('\n');

        /* 绑定事件 */
        document.getElementById('ta-music-back').addEventListener('click', goBack);
        document.getElementById('ta-music-play').addEventListener('click', togglePlay);
        document.getElementById('ta-music-prev').addEventListener('click', prevSong);
        document.getElementById('ta-music-next').addEventListener('click', nextSong);
        document.getElementById('ta-music-add').addEventListener('click', showAddMusicModal);
        document.getElementById('ta-music-volume').addEventListener('input', function(e) {
            if (audioEl) audioEl.volume = parseInt(e.target.value) / 100;
        });

        /* 播放列表点击 */
        body.querySelectorAll('.ta-music-song-item').forEach(function(item) {
            item.addEventListener('click', function(e) {
                if (e.target.closest('.song-item-del')) return;
                var idx = parseInt(this.getAttribute('data-idx'));
                playSong(idx);
            });
        });

        /* 删除歌曲 */
        body.querySelectorAll('.song-item-del').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                var idx = parseInt(this.getAttribute('data-delidx'));
                deleteSong(idx);
            });
        });

        /* 如果之前在播放，恢复旋转 */
        if (isPlaying) startCoverRotation();
    }

    function initAudio() {
        if (!audioEl) {
            audioEl = new Audio();
            audioEl.volume = 0.8;
            audioEl.addEventListener('ended', function() {
                nextSong();
            });
        }
    }

    function playSong(idx) {
        initAudio();
        if (idx < 0 || idx >= musicList.length) return;
        currentSongIndex = idx;
        var song = musicList[idx];

        /* 更新 UI */
        var nameEl = document.getElementById('ta-music-song-name');
        if (nameEl) nameEl.textContent = song.name;

        if (song.url) {
            audioEl.src = song.url;
            audioEl.play().catch(function() {});
            isPlaying = true;
            startCoverRotation();
        } else {
            /* 无 URL 的预设歌曲只做模拟 UI */
            isPlaying = true;
            startCoverRotation();
        }

        updatePlayButton();
        updatePlaylistHighlight();
        saveMusicState();
    }

    function togglePlay() {
        if (isPlaying) {
            pausePlayback();
        } else {
            resumePlayback();
        }
    }

    function pausePlayback() {
        isPlaying = false;
        if (audioEl) audioEl.pause();
        stopCoverRotation();
        updatePlayButton();
        saveMusicState();
    }

    function resumePlayback() {
        initAudio();
        var song = musicList[currentSongIndex];
        if (song && song.url) {
            audioEl.play().catch(function() {});
        }
        isPlaying = true;
        startCoverRotation();
        updatePlayButton();
        saveMusicState();
    }

    function nextSong() {
        if (musicList.length === 0) return;
        var idx = (currentSongIndex + 1) % musicList.length;
        playSong(idx);
    }

    function prevSong() {
        if (musicList.length === 0) return;
        var idx = currentSongIndex - 1;
        if (idx < 0) idx = musicList.length - 1;
        playSong(idx);
    }

    function updatePlayButton() {
        var btn = document.getElementById('ta-music-play');
        if (!btn) return;
        btn.innerHTML = '<i class="fas ' + (isPlaying ? 'fa-pause' : 'fa-play') + '" style="margin-left:' + (isPlaying ? '0' : '2') + 'px;"></i>';
    }

    function updatePlaylistHighlight() {
        var items = document.querySelectorAll('.ta-music-song-item');
        items.forEach(function(item, idx) {
            item.classList.toggle('active', idx === currentSongIndex);
            var icon = item.querySelector('.song-item-icon i');
            if (icon) {
                icon.className = 'fas ' + (idx === currentSongIndex && isPlaying ? 'fa-volume-up' : 'fa-music');
            }
        });
    }

    /* ---- 封面旋转 ---- */
    function startCoverRotation() {
        stopCoverRotation();
        var cover = document.getElementById('ta-music-cover');
        if (cover) {
            cover.classList.add('spinning');
            cover.classList.remove('paused');
        }
    }

    function stopCoverRotation() {
        var cover = document.getElementById('ta-music-cover');
        if (cover) {
            cover.classList.remove('spinning');
        }
        if (rotationId) {
            cancelAnimationFrame(rotationId);
            rotationId = null;
        }
    }

    function stopAudioPlayback() {
        pausePlayback();
    }

    function deleteSong(idx) {
        musicList.splice(idx, 1);
        saveMusic(musicList);
        if (currentSongIndex >= musicList.length) {
            currentSongIndex = Math.max(0, musicList.length - 1);
        }
        if (idx === currentSongIndex) {
            pausePlayback();
        }
        renderMusicPage(document.getElementById('ta-phone-body'));
    }

    function showAddMusicModal() {
        var page = document.getElementById('ta-phone-music');
        if (!page) return;

        var overlay = document.createElement('div');
        overlay.className = 'ta-phone-modal-overlay';
        overlay.innerHTML = [
            '<div class="ta-phone-modal">',
            '  <div class="ta-phone-modal-header">添加歌曲</div>',
            '  <div class="ta-phone-modal-body">',
            '    <input class="ta-phone-input" id="ta-music-name-input" type="text" placeholder="歌曲名称" style="margin-bottom:8px;">',
            '    <input class="ta-phone-input" id="ta-music-url-input" type="text" placeholder="音乐 URL（https://...）">',
            '  </div>',
            '  <div class="ta-phone-modal-footer">',
            '    <button class="modal-cancel" id="ta-music-modal-cancel">取消</button>',
            '    <button class="modal-confirm" id="ta-music-modal-confirm">添加</button>',
            '  </div>',
            '</div>'
        ].join('\n');

        page.appendChild(overlay);

        overlay.querySelector('#ta-music-modal-cancel').addEventListener('click', function() {
            overlay.remove();
        });
        overlay.querySelector('#ta-music-modal-confirm').addEventListener('click', function() {
            var nameInput = document.getElementById('ta-music-name-input');
            var urlInput = document.getElementById('ta-music-url-input');
            var name = nameInput ? nameInput.value.trim() : '';
            var url = urlInput ? urlInput.value.trim() : '';
            if (!name) return;

            musicList.push({ name: name, url: url });
            saveMusic(musicList);
            overlay.remove();
            renderMusicPage(document.getElementById('ta-phone-body'));
        });

        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) overlay.remove();
        });
    }

    /* ==================== 浏览器页 ==================== */
    function renderBrowserPage(body) {
        var history = ensureBrowserHistory();

        var listHTML = '';
        if (history.length === 0) {
            listHTML = '<div class="ta-phone-empty"><i class="fas fa-globe"></i>暂无浏览记录</div>';
        } else {
            history.forEach(function(item, idx) {
                listHTML += '<div class="ta-browser-item" data-idx="' + idx + '">' +
                    '<span class="browser-icon"><i class="fas fa-magnifying-glass"></i></span>' +
                    '<span class="browser-query">' + escapeHtml(item.query) + '</span>' +
                    '<span class="browser-time">' + escapeHtml(item.time) + '</span>' +
                    '<button class="browser-delete" data-delidx="' + idx + '">删除</button>' +
                    '</div>';
            });
        }

        body.innerHTML = [
            '<div class="ta-phone-page ta-phone-slide-in" id="ta-phone-browser">',
            '  <div class="ta-phone-header">',
            '    <button class="back-btn" id="ta-browser-back"><i class="fas fa-chevron-left"></i></button>',
            '    <span class="header-title">浏览器</span>',
            '  </div>',
            '  <div class="ta-browser-list">' + listHTML + '</div>',
            '  <button class="ta-browser-add-btn" id="ta-browser-add">+ 添加记录</button>',
            '</div>'
        ].join('\n');

        document.getElementById('ta-browser-back').addEventListener('click', goBack);
        document.getElementById('ta-browser-add').addEventListener('click', showAddBrowserModal);

        /* 长按显示删除 */
        var longPressTimer = null;
        body.querySelectorAll('.ta-browser-item').forEach(function(item) {
            item.addEventListener('touchstart', function(e) {
                longPressTimer = setTimeout(function() {
                    item.classList.add('show-delete');
                }, 500);
            }, { passive: true });
            item.addEventListener('touchend', function() {
                clearTimeout(longPressTimer);
            }, { passive: true });
            item.addEventListener('touchmove', function() {
                clearTimeout(longPressTimer);
            }, { passive: true });
            /* 桌面端：鼠标右键或长按 */
            item.addEventListener('contextmenu', function(e) {
                e.preventDefault();
                body.querySelectorAll('.ta-browser-item.show-delete').forEach(function(el) {
                    el.classList.remove('show-delete');
                });
                item.classList.add('show-delete');
            });
            /* 点击其他地方关闭删除按钮 */
            item.addEventListener('click', function(e) {
                if (e.target.closest('.browser-delete')) return;
                body.querySelectorAll('.ta-browser-item.show-delete').forEach(function(el) {
                    if (el !== item) el.classList.remove('show-delete');
                });
            });
        });

        /* 删除按钮 */
        body.querySelectorAll('.browser-delete').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                var idx = parseInt(this.getAttribute('data-delidx'));
                var list = ensureBrowserHistory();
                list.splice(idx, 1);
                saveBrowserHistory(list);
                renderBrowserPage(document.getElementById('ta-phone-body'));
            });
        });
    }

    function showAddBrowserModal() {
        var page = document.getElementById('ta-phone-browser');
        if (!page) return;

        var overlay = document.createElement('div');
        overlay.className = 'ta-phone-modal-overlay';
        overlay.innerHTML = [
            '<div class="ta-phone-modal">',
            '  <div class="ta-phone-modal-header">添加浏览记录</div>',
            '  <div class="ta-phone-modal-body">',
            '    <input class="ta-phone-input" id="ta-browser-query-input" type="text" placeholder="搜索词或网址">',
            '    <select class="ta-phone-select" id="ta-browser-time-select">',
            '      <option value="今天">今天</option>',
            '      <option value="昨天">昨天</option>',
            '      <option value="2天前">2天前</option>',
            '      <option value="3天前">3天前</option>',
            '      <option value="5天前">5天前</option>',
            '      <option value="custom">自定义</option>',
            '    </select>',
            '    <input class="ta-phone-input" id="ta-browser-custom-time" type="text" placeholder="自定义时间（如：上周一）" style="margin-top:8px;display:none;">',
            '  </div>',
            '  <div class="ta-phone-modal-footer">',
            '    <button class="modal-cancel" id="ta-browser-modal-cancel">取消</button>',
            '    <button class="modal-confirm" id="ta-browser-modal-confirm">确认</button>',
            '  </div>',
            '</div>'
        ].join('\n');

        page.appendChild(overlay);

        var timeSelect = overlay.querySelector('#ta-browser-time-select');
        var customInput = overlay.querySelector('#ta-browser-custom-time');
        timeSelect.addEventListener('change', function() {
            customInput.style.display = this.value === 'custom' ? 'block' : 'none';
        });

        overlay.querySelector('#ta-browser-modal-cancel').addEventListener('click', function() {
            overlay.remove();
        });
        overlay.querySelector('#ta-browser-modal-confirm').addEventListener('click', function() {
            var queryInput = document.getElementById('ta-browser-query-input');
            var query = queryInput ? queryInput.value.trim() : '';
            if (!query) return;

            var timeVal = timeSelect.value;
            if (timeVal === 'custom') {
                timeVal = customInput.value.trim() || '今天';
            }

            var list = ensureBrowserHistory();
            list.unshift({ query: query, time: timeVal });
            saveBrowserHistory(list);
            overlay.remove();
            renderBrowserPage(document.getElementById('ta-phone-body'));
        });

        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) overlay.remove();
        });
    }

    /* ==================== 公共 API ==================== */
    function init() {
        partnerName = getPartnerName();
        injectStyles();
        ensureBrowserHistory();
        console.log('[TA的手机] 模块加载完成');
    }

    function showTaPhone() {
        var container = getContainer();
        if (!container) return;

        /* 重新读取梦角名字 */
        partnerName = getPartnerName();

        /* 初始化浏览器默认数据（含动态名字） */
        ensureBrowserHistory();

        renderPhone();
        container.style.display = 'flex';
        container.classList.add('active');
        startClock();

        /* 恢复音乐播放状态 */
        var musicState = loadMusicState();
        isPlaying = musicState.playing || false;
        currentSongIndex = musicState.index || 0;
    }

    function hideTaPhone() {
        var container = getContainer();
        if (!container) return;

        container.classList.remove('active');
        container.style.display = 'none';

        stopClock();
        stopAudioPlayback();

        /* 清除所有模态 */
        var modals = container.querySelectorAll('.ta-phone-modal-overlay');
        modals.forEach(function(m) { m.remove(); });

        /* 清除浏览器删除状态 */
        var items = container.querySelectorAll('.ta-browser-item.show-delete');
        items.forEach(function(item) { item.classList.remove('show-delete'); });
    }

    /* ---------- 暴露公共 API ---------- */
    window.TaPhoneApp = {
        init: init,
        showTaPhone: showTaPhone,
        hideTaPhone: hideTaPhone,
        goBack: goBack
    };

    /* ---------- 自动初始化 ---------- */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
