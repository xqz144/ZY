/**
 * 祁煜故事集 — 剧情阅读模块
 * 简约风格版：细线图标 + 柔和色调 + 可替换顶部背景
 *
 * 分类结构（对应游戏剧情板块）：
 *   主线剧情 → chapter（章节翻页阅读）
 *   倾心之约/牵绊 → chapter
 *   倾心之约/思念 → card（卡片网格）
 *   倾心之约/传说 → chapter
 *   逸闻 → card
 *   世界深处 → card
 *   短信通话 → chat（仿聊天还原）
 *   朋友圈 → moments（仿朋友圈还原）
 *   心迹互动 → card（带分支标注）
 */
(function (global) {
    'use strict';

    /* ========== 简约主题色 ========== */
    var THEME = {
        accent: '#8B7355',           // 温润棕灰（主色）
        accentLight: '#D4C5B0',      // 浅棕灰（卡片图标底）
        bg: '#FAF8F5',               // 米白背景
        cardBg: '#FFFFFF',
        cardBorder: '#EDE8E1',
        textPrimary: '#2C2420',
        textSecondary: '#9B8E84',
        textTertiary: '#C4BAB3',
        headerBg: '#F5F1EC',
        mutedBg: '#F2EEE9',
        dark: {
            accent: '#D4C5B0',
            accentLight: '#5A4D40',
            bg: '#1A1816',
            cardBg: '#24201C',
            cardBorder: '#352F2A',
            textPrimary: '#F0EBE4',
            textSecondary: '#A89E95',
            textTertiary: '#6E645D',
            headerBg: '#1F1C19',
            mutedBg: '#2A2622'
        }
    };

    /* ========== 细线 SVG 图标 ========== */
    var ICONS = {
        main: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" style="width:28px;height:28px;"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="9" y1="7" x2="16" y2="7"/><line x1="9" y1="11" x2="14" y2="11"/></svg>',
        bond: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" style="width:28px;height:28px;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
        memory: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" style="width:28px;height:28px;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
        legend: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" style="width:28px;height:28px;"><path d="M12 2L8 8h8l-4-6z"/><path d="M8 8l-3 6 7 4 7-4-3-6"/><path d="M5 14l7 4 7-4"/><path d="M12 12v8"/></svg>',
        anecdote: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" style="width:28px;height:28px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
        world: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" style="width:28px;height:28px;"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
        messages: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" style="width:28px;height:28px;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
        moments: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" style="width:28px;height:28px;"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>',
        trace: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" style="width:28px;height:28px;"><path d="M12 2l2.09 6.26L20 9.27l-5 4.14L16.18 21 12 17.77 7.82 21 9 13.41 4 9.27l5.91-1.01L12 2z"/></svg>',
    };

    /* ========== 数据结构（默认空壳） ========== */
    var DEFAULT_DATA = {
        heroBg: null,  // 顶部背景图（base64）
        categories: [
            { id: 'main', title: '主线剧情', subtitle: '与祁煜并肩的冒险旅程', iconKey: 'main', type: 'chapter', chapters: [] },
            { id: 'bond', title: '倾心之约 · 牵绊', subtitle: '好感度解锁的约会故事', iconKey: 'bond', type: 'chapter', chapters: [] },
            { id: 'memory', title: '倾心之约 · 思念', subtitle: '五星思念卡专属剧情', iconKey: 'memory', type: 'card', cards: [] },
            { id: 'legend', title: '倾心之约 · 传说', subtitle: '深层身份与过往秘密', iconKey: 'legend', type: 'chapter', chapters: [] },
            { id: 'anecdote', title: '逸闻', subtitle: '不为人知的轶事', iconKey: 'anecdote', type: 'card', cards: [] },
            { id: 'world', title: '世界深处', subtitle: '世界观扩展与时间线', iconKey: 'world', type: 'card', cards: [] },
            { id: 'messages', title: '短信通话', subtitle: '他的消息与来电', iconKey: 'messages', type: 'chat', conversations: [] },
            { id: 'moments', title: '朋友圈', subtitle: '他的动态分享', iconKey: 'moments', type: 'moments', posts: [] },
            { id: 'trace', title: '心迹互动', subtitle: '互动剧情分支记录', iconKey: 'trace', type: 'card', cards: [] }
        ]
    };

    /* ========== 存储 ========== */
    var STORAGE_KEY = 'qiyu_story_data';
    var HERO_BG_KEY = 'qiyu_story_hero_bg';
    var SAVE_KEY = 'qiyu_story_saves';
    var MAX_SAVES = 5;
    var SAVE_VERSION = 1;
    var ASSET_KEY = 'qiyu_story_assets';

    function loadData() {
        try {
            var saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                var data = JSON.parse(saved);
                if (data && data.categories) {
                    DEFAULT_DATA.categories.forEach(function(def) {
                        var exists = data.categories.find(function(c) { return c.id === def.id; });
                        if (!exists) data.categories.push(def);
                    });
                    // 加载 hero 背景
                    var bg = localStorage.getItem(HERO_BG_KEY);
                    if (bg) data.heroBg = bg;
                    return data;
                }
            }
        } catch (e) {}
        return JSON.parse(JSON.stringify(DEFAULT_DATA));
    }

    function saveData(data) {
        try {
            // heroBg 单独存（可能很大）
            var toSave = JSON.parse(JSON.stringify(data));
            var bg = toSave.heroBg;
            delete toSave.heroBg;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
            if (bg) localStorage.setItem(HERO_BG_KEY, bg);
            else localStorage.removeItem(HERO_BG_KEY);
        } catch (e) {
            console.error('[qiyu-story] 保存失败', e);
        }
    }

    var storyData = null;

    /* ========== 素材库 ========== */
    function loadAssets() {
        try {
            var s = localStorage.getItem(ASSET_KEY);
            if (s) return JSON.parse(s);
        } catch (e) {}
        return { scenes: [], portraits: [] };
    }

    function saveAssets(assets) {
        try { localStorage.setItem(ASSET_KEY, JSON.stringify(assets)); } catch (e) { console.error('[qiyu-story] 素材保存失败', e); }
    }

    function addAsset(category, name, data) {
        var assets = loadAssets();
        if (!assets[category]) assets[category] = [];
        var asset = { id: 'asset_' + Date.now() + '_' + Math.floor(Math.random() * 1000), name: name, data: data, createdAt: Date.now() };
        assets[category].push(asset);
        saveAssets(assets);
        return asset;
    }

    function deleteAsset(id) {
        var assets = loadAssets();
        ['scenes', 'portraits'].forEach(function(cat) {
            assets[cat] = (assets[cat] || []).filter(function(a) { return a.id !== id; });
        });
        saveAssets(assets);
    }

    function renameAsset(id, name) {
        var assets = loadAssets();
        ['scenes', 'portraits'].forEach(function(cat) {
            (assets[cat] || []).forEach(function(a) { if (a.id === id) a.name = name; });
        });
        saveAssets(assets);
    }

    /* 图片处理：压缩到指定最大宽度，返回 base64 */
    function processImage(file, maxWidth, cropTopRatio, cropBottomRatio, callback) {
        var reader = new FileReader();
        reader.onload = function(e) {
            var img = new Image();
            img.onload = function() {
                var w = img.width, h = img.height;
                var scale = Math.min(1, maxWidth / w);
                var dw = Math.round(w * scale);
                var dh = Math.round(h * scale);
                // 裁剪上下区域（用于去掉 UI 文字）
                var sy = cropTopRatio ? Math.round(h * cropTopRatio) : 0;
                var sh = cropBottomRatio ? Math.round(h * (1 - cropTopRatio - cropBottomRatio)) : h - sy;
                if (sh <= 0) { sy = 0; sh = h; }
                var canvas = document.createElement('canvas');
                canvas.width = dw;
                canvas.height = Math.round(dh * (sh / h));
                var ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, sy, w, sh, 0, 0, dw, canvas.height);
                callback(canvas.toDataURL('image/jpeg', 0.85));
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    /* ========== 工具函数 ========== */
    function isDark() {
        return document.documentElement.getAttribute('data-theme') === 'dark' ||
            (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches &&
                document.documentElement.getAttribute('data-theme') !== 'light');
    }

    function getTheme() {
        return isDark() ? THEME.dark : THEME;
    }

    function esc(text) {
        if (!text) return '';
        var d = document.createElement('div');
        d.textContent = text;
        return d.innerHTML;
    }

    function formatContent(text) {
        if (!text) return '<p style="color:' + getTheme().textTertiary + ';font-style:italic;">内容待补充…</p>';
        var html = esc(text);
        html = html.split(/\n\n+|---/).map(function(p) {
            p = p.trim();
            if (!p) return '';
            var imgMatch = p.match(/\[img:(.+?)\]/);
            if (imgMatch) {
                var url = imgMatch[1].trim();
                return '<figure style="margin:24px 0;text-align:center;"><img src="' + esc(url) + '" style="max-width:100%;border-radius:12px;" /><figcaption style="font-size:11px;color:' + getTheme().textTertiary + ';margin-top:6px;">' + esc(p.replace(imgMatch[0], '').trim()) + '</figcaption></figure>';
            }
            return '<p style="margin:0 0 1.4em;line-height:1.9;font-size:14.5px;letter-spacing:0.2px;">' + p.replace(/\n/g, '<br>') + '</p>';
        }).join('');
        return html;
    }

    function getCat(id) {
        return storyData.categories.find(function(c) { return c.id === id; });
    }

    function countItems(cat) {
        if (cat.type === 'chapter') return (cat.chapters || []).length;
        if (cat.type === 'card') return (cat.cards || []).length;
        if (cat.type === 'chat') return (cat.conversations || []).length;
        if (cat.type === 'moments') return (cat.posts || []).length;
        return 0;
    }

    /* ========== 主面板 ========== */
    function openStory() {
        if (!storyData) storyData = loadData();
        var t = getTheme();

        var overlay = document.createElement('div');
        overlay.id = 'qiyu-story-root';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:999999995;background:' + t.bg + ';overflow-y:auto;-webkit-overflow-scrolling:touch;';

        // Hero 区域
        var heroBgStyle = storyData.heroBg ?
            'background-image:url(' + storyData.heroBg + ');background-size:cover;background-position:center;' :
            'background:' + t.headerBg + ';';

        var heroHtml =
            '<div style="position:relative;height:200px;' + heroBgStyle + 'display:flex;flex-direction:column;align-items:center;justify-content:center;padding:calc(env(safe-area-inset-top,0px) + 20px) 20px 0;box-sizing:border-box;">' +
                // 背景图遮罩
                (storyData.heroBg ? '<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0.1) 0%,rgba(0,0,0,0.35) 100%);"></div>' : '') +
                // 返回按钮
                '<div onclick="document.getElementById(\'qiyu-story-root\').remove();" style="position:absolute;top:calc(env(safe-area-inset-top,0px) + 12px);left:16px;z-index:10;width:32px;height:32px;border-radius:50%;background:' + (storyData.heroBg ? 'rgba(0,0,0,0.3)' : t.mutedBg) + ';display:flex;align-items:center;justify-content:center;font-size:16px;color:' + (storyData.heroBg ? '#fff' : t.textSecondary) + ';cursor:pointer;">←</div>' +
                // 上传按钮
                '<div onclick="QiyuStory.uploadHeroBg()" style="position:absolute;top:calc(env(safe-area-inset-top,0px) + 12px);right:16px;z-index:10;width:32px;height:32px;border-radius:50%;background:' + (storyData.heroBg ? 'rgba(0,0,0,0.3)' : t.mutedBg) + ';display:flex;align-items:center;justify-content:center;font-size:14px;color:' + (storyData.heroBg ? '#fff' : t.textSecondary) + ';cursor:pointer;" title="更换背景">⤓</div>' +
                // 文字
                '<div style="position:relative;z-index:2;text-align:center;' + (storyData.heroBg ? 'color:#fff;text-shadow:0 2px 8px rgba(0,0,0,0.4);' : 'color:' + t.textPrimary + ';') + '">' +
                    '<div style="font-size:22px;font-weight:700;letter-spacing:1px;margin-bottom:4px;">祁煜故事集</div>' +
                    '<div style="font-size:12px;font-weight:500;' + (storyData.heroBg ? 'opacity:0.9;' : 'color:' + t.textSecondary + ';') + '">利莫里亚最后的火焰</div>' +
                '</div>' +
            '</div>';

        // 分类卡片
        var cardsHtml = '<div style="padding:16px 16px 40px;display:flex;flex-direction:column;gap:10px;">';

        storyData.categories.forEach(function(cat) {
            var count = countItems(cat);
            var statusText = count > 0 ? count + ' 篇' : '待补充';
            var statusColor = count > 0 ? t.accent : t.textTertiary;
            var iconHtml = ICONS[cat.iconKey] || ICONS.main;

            cardsHtml +=
                '<div onclick="QiyuStory.openCategory(\'' + cat.id + '\')" style="display:flex;align-items:center;gap:16px;padding:16px;border-radius:14px;background:' + t.cardBg + ';border:1px solid ' + t.cardBorder + ';cursor:pointer;transition:background 0.15s;" onmousedown="this.style.background=\'' + t.mutedBg + '\'" onmouseup="this.style.background=\'' + t.cardBg + '\'" ontouchstart="this.style.background=\'' + t.mutedBg + '\'" ontouchend="this.style.background=\'' + t.cardBg + '\'">' +
                    '<div style="width:44px;height:44px;border-radius:12px;background:' + t.accentLight + ';display:flex;align-items:center;justify-content:center;color:' + t.accent + ';flex-shrink:0;">' + iconHtml + '</div>' +
                    '<div style="flex:1;min-width:0;">' +
                        '<div style="font-size:15px;font-weight:600;color:' + t.textPrimary + ';line-height:1.3;">' + esc(cat.title) + '</div>' +
                        '<div style="font-size:12px;color:' + t.textSecondary + ';margin-top:3px;line-height:1.4;">' + esc(cat.subtitle) + '</div>' +
                    '</div>' +
                    '<div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">' +
                        '<span style="font-size:11px;font-weight:500;color:' + statusColor + ';">' + statusText + '</span>' +
                        '<span style="font-size:14px;color:' + t.textTertiary + ';">›</span>' +
                    '</div>' +
                '</div>';
        });
        cardsHtml += '</div>';

        overlay.innerHTML = heroHtml + cardsHtml;
        document.body.appendChild(overlay);
    }

    /* ========== 上传 Hero 背景 ========== */
    function uploadHeroBg() {
        var input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = function(e) {
            var file = e.target.files && e.target.files[0];
            if (!file) return;
            if (file.size > 5 * 1024 * 1024) {
                alert('图片不能超过 5MB');
                return;
            }
            var reader = new FileReader();
            reader.onload = function() {
                storyData.heroBg = reader.result;
                saveData(storyData);
                // 刷新 hero 区域
                var root = document.getElementById('qiyu-story-root');
                if (root) {
                    var t = getTheme();
                    var heroBgStyle = 'background-image:url(' + storyData.heroBg + ');background-size:cover;background-position:center;';
                    root.querySelector('div').parentElement.querySelector('div').style.cssText = 'position:relative;height:200px;' + heroBgStyle + 'display:flex;flex-direction:column;align-items:center;justify-content:center;padding:calc(env(safe-area-inset-top,0px) + 20px) 20px 0;box-sizing:border-box;';
                    // 简单起见，直接重新打开
                    root.remove();
                    openStory();
                }
            };
            reader.readAsDataURL(file);
        };
        input.click();
    }

    /* ========== 分类路由 ========== */
    function openCategory(catId) {
        var cat = getCat(catId);
        if (!cat) return;
        if (cat.type === 'chapter') openChapterList(cat);
        else if (cat.type === 'card') openCardGrid(cat);
        else if (cat.type === 'chat') openChatList(cat);
        else if (cat.type === 'moments') openMomentsList(cat);
    }

    /* ========== 子页面顶部栏 ========== */
    function subHeader(title, subtitle) {
        var t = getTheme();
        return '<div style="position:sticky;top:0;z-index:10;display:flex;align-items:center;gap:12px;padding:calc(env(safe-area-inset-top,0px) + 12px) 16px 12px;background:' + t.bg + ';border-bottom:1px solid ' + t.cardBorder + ';">' +
            '<div onclick="var o=document.getElementById(\'qiyu-chapter-list\')||document.getElementById(\'qiyu-card-grid\')||document.getElementById(\'qiyu-chat-list\')||document.getElementById(\'qiyu-moments-list\');if(o)o.remove();" style="width:32px;height:32px;border-radius:50%;background:' + t.mutedBg + ';display:flex;align-items:center;justify-content:center;font-size:15px;color:' + t.textPrimary + ';cursor:pointer;flex-shrink:0;">←</div>' +
            '<div style="flex:1;">' +
                '<div style="font-size:16px;font-weight:600;color:' + t.textPrimary + ';">' + esc(title) + '</div>' +
                '<div style="font-size:11px;color:' + t.textSecondary + ';margin-top:2px;">' + esc(subtitle) + '</div>' +
            '</div>' +
        '</div>';
    }

    /* ========== 章节列表（按篇分组 + 状态标记） ========== */
    function openChapterList(cat) {
        var t = getTheme();
        var overlay = document.createElement('div');
        overlay.id = 'qiyu-chapter-list';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:999999996;background:' + t.bg + ';overflow-y:auto;-webkit-overflow-scrolling:touch;';

        var chapters = cat.chapters || [];
        var listHtml = '';

        if (chapters.length === 0) {
            listHtml = '<div style="text-align:center;padding:80px 20px;"><div style="font-size:36px;color:' + t.textTertiary + ';margin-bottom:12px;">' + (ICONS[cat.iconKey] || '') + '</div><div style="font-size:14px;color:' + t.textSecondary + ';font-weight:500;">还没有内容</div><div style="font-size:12px;color:' + t.textTertiary + ';margin-top:6px;">后续在这里补充章节故事</div></div>';
        } else {
            // 按 arc 分组
            var arcs = {};
            var arcOrder = [];
            chapters.forEach(function(ch) {
                var arc = ch.arc || '未分类';
                if (!arcs[arc]) { arcs[arc] = []; arcOrder.push(arc); }
                arcs[arc].push(ch);
            });

            var globalIdx = 0;
            arcOrder.forEach(function(arcName) {
                // 篇标题
                listHtml += '<div style="padding:16px 16px 8px;font-size:12px;font-weight:700;color:' + t.accent + ';letter-spacing:0.5px;">' + esc(arcName) + '</div>';
                arcs[arcName].forEach(function(ch) {
                    var idx = globalIdx;
                    var statusBadge = ch.status === 'unconfirmed' ?
                        '<span style="font-size:9px;font-weight:600;color:#E8A035;padding:1px 6px;border-radius:4px;background:rgba(232,160,53,0.12);margin-left:6px;">待确认</span>' : '';
                    var sceneCount = (ch.scenes && ch.scenes.length) ? ch.scenes.length + ' 场景' : (ch.content ? '1 篇' : '空');
                    var hasContent = (ch.scenes && ch.scenes.length) || ch.content;

                    listHtml +=
                        '<div onclick="QiyuStory.openChapter(\'' + cat.id + '\',' + idx + ')" style="display:flex;align-items:center;gap:14px;padding:14px 16px;border-bottom:1px solid ' + t.cardBorder + ';cursor:pointer;" onmousedown="this.style.background=\'' + t.mutedBg + '\'" onmouseup="this.style.background=\'transparent\'" ontouchstart="this.style.background=\'' + t.mutedBg + '\'" ontouchend="this.style.background=\'transparent\'">' +
                            '<div style="width:28px;height:28px;border-radius:8px;background:' + t.accentLight + ';display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;color:' + t.accent + ';flex-shrink:0;">' + (idx + 1) + '</div>' +
                            '<div style="flex:1;min-width:0;">' +
                                '<div style="font-size:14px;font-weight:600;color:' + t.textPrimary + ';line-height:1.3;">' + esc(ch.title || ('第' + (idx+1) + '章')) + statusBadge + '</div>' +
                                '<div style="font-size:12px;color:' + t.textSecondary + ';margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + esc(ch.summary || sceneCount) + '</div>' +
                            '</div>' +
                            '<span style="font-size:14px;color:' + t.textTertiary + ';">›</span>' +
                        '</div>';
                    globalIdx++;
                });
            });
        }

        // 编辑按钮
        var editBtn = '<div onclick="QiyuStory.openEditor(\'' + cat.id + '\')" style="position:fixed;bottom:calc(env(safe-area-inset-bottom,0px) + 20px);right:20px;width:48px;height:48px;border-radius:50%;background:' + t.accent + ';display:flex;align-items:center;justify-content:center;color:#fff;font-size:22px;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,0.15);z-index:20;">✎</div>';

        overlay.innerHTML = subHeader(cat.title, cat.subtitle) + '<div style="padding-bottom:80px;">' + listHtml + '</div>' + editBtn;
        document.body.appendChild(overlay);
    }

    /* ========== 章节阅读器（支持场景列表） ========== */
    function openChapter(catId, index) {
        var cat = getCat(catId);
        if (!cat || !cat.chapters || !cat.chapters[index]) return;
        var ch = cat.chapters[index];
        var t = getTheme();

        // 如果有场景，先显示场景列表
        if (ch.scenes && ch.scenes.length > 0) {
            openSceneList(catId, index);
            return;
        }

        // 没有场景，直接显示内容
        var overlay = document.createElement('div');
        overlay.id = 'qiyu-chapter-reader';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:999999997;background:' + t.bg + ';overflow-y:auto;-webkit-overflow-scrolling:touch;';

        var content = formatContent(ch.content);

        var prevBtn = index > 0 ?
            '<div onclick="QiyuStory.openChapter(\'' + catId + '\',' + (index-1) + ')" style="padding:12px 20px;border-radius:10px;background:' + t.mutedBg + ';color:' + t.textPrimary + ';font-size:13px;font-weight:500;text-align:center;cursor:pointer;">← 上一章</div>' : '';
        var nextBtn = index < cat.chapters.length - 1 ?
            '<div onclick="QiyuStory.openChapter(\'' + catId + '\',' + (index+1) + ')" style="padding:12px 20px;border-radius:10px;background:' + t.accent + ';color:#fff;font-size:13px;font-weight:500;text-align:center;cursor:pointer;">下一章 →</div>' : '';

        var statusBadge = ch.status === 'unconfirmed' ?
            '<span style="display:inline-block;font-size:10px;font-weight:600;color:#E8A035;padding:2px 8px;border-radius:6px;background:rgba(232,160,53,0.12);margin-left:8px;vertical-align:middle;">待确认</span>' : '';

        overlay.innerHTML =
            subHeader(cat.title, ch.arc || ('第' + (index+1) + '章')) +
            '<div style="max-width:600px;margin:0 auto;padding:32px 24px 60px;">' +
                '<h1 style="font-size:20px;font-weight:700;color:' + t.textPrimary + ';line-height:1.5;margin:0 0 10px;">' + esc(ch.title || ('第' + (index+1) + '章')) + statusBadge + '</h1>' +
                (ch.summary ? '<div style="font-size:13px;color:' + t.textSecondary + ';line-height:1.6;margin-bottom:28px;padding-left:10px;border-left:2px solid ' + t.accentLight + ';">' + esc(ch.summary) + '</div>' : '<div style="height:16px;"></div>') +
                '<div style="color:' + t.textPrimary + ';">' + content + '</div>' +
                '<div style="display:flex;gap:12px;margin-top:40px;">' + prevBtn + nextBtn + '</div>' +
            '</div>';

        document.body.appendChild(overlay);
    }

    /* ========== 场景列表 ========== */
    function openSceneList(catId, chIdx) {
        var cat = getCat(catId);
        if (!cat || !cat.chapters || !cat.chapters[chIdx]) return;
        var ch = cat.chapters[chIdx];
        var t = getTheme();

        var overlay = document.createElement('div');
        overlay.id = 'qiyu-chapter-reader';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:999999997;background:' + t.bg + ';overflow-y:auto;-webkit-overflow-scrolling:touch;';

        var statusBadge = ch.status === 'unconfirmed' ?
            '<span style="display:inline-block;font-size:10px;font-weight:600;color:#E8A035;padding:2px 8px;border-radius:6px;background:rgba(232,160,53,0.12);margin-left:8px;vertical-align:middle;">待确认</span>' : '';

        var scenesHtml = '';
        ch.scenes.forEach(function(sc, sIdx) {
            var pIcon = sc.perspective === 'first' ? '◉' : '○';
            var pLabel = sc.perspective === 'first' ? '第一人称' : '第三人称';
            scenesHtml +=
                '<div onclick="QiyuStory.openScene(\'' + catId + '\',' + chIdx + ',' + sIdx + ')" style="display:flex;align-items:center;gap:12px;padding:14px 16px;border-bottom:1px solid ' + t.cardBorder + ';cursor:pointer;" onmousedown="this.style.background=\'' + t.mutedBg + '\'" onmouseup="this.style.background=\'transparent\'" ontouchstart="this.style.background=\'' + t.mutedBg + '\'" ontouchend="this.style.background=\'transparent\'">' +
                    '<div style="width:24px;height:24px;border-radius:6px;background:' + t.accentLight + ';display:flex;align-items:center;justify-content:center;font-size:11px;color:' + t.accent + ';flex-shrink:0;">' + pIcon + '</div>' +
                    '<div style="flex:1;min-width:0;">' +
                        '<div style="font-size:14px;font-weight:600;color:' + t.textPrimary + ';line-height:1.3;">' + esc(sc.title || ('场景' + (sIdx+1))) + '</div>' +
                        '<div style="font-size:11px;color:' + t.textTertiary + ';margin-top:2px;">' + pLabel + (sc.content ? '' : ' · 待补充') + '</div>' +
                    '</div>' +
                    '<span style="font-size:14px;color:' + t.textTertiary + ';">›</span>' +
                '</div>';
        });

        // 翻页按钮
        var prevBtn = chIdx > 0 ?
            '<div onclick="QiyuStory.openChapter(\'' + catId + '\',' + (chIdx-1) + ')" style="padding:12px 20px;border-radius:10px;background:' + t.mutedBg + ';color:' + t.textPrimary + ';font-size:13px;font-weight:500;text-align:center;cursor:pointer;">← 上一章</div>' : '';
        var nextBtn = chIdx < cat.chapters.length - 1 ?
            '<div onclick="QiyuStory.openChapter(\'' + catId + '\',' + (chIdx+1) + ')" style="padding:12px 20px;border-radius:10px;background:' + t.accent + ';color:#fff;font-size:13px;font-weight:500;text-align:center;cursor:pointer;">下一章 →</div>' : '';

        overlay.innerHTML =
            subHeader(ch.arc || cat.title, ch.title || '') +
            '<div style="max-width:600px;margin:0 auto;padding:24px 16px 60px;">' +
                '<h1 style="font-size:20px;font-weight:700;color:' + t.textPrimary + ';line-height:1.5;margin:0 0 8px;">' + esc(ch.title || ('第' + (chIdx+1) + '章')) + statusBadge + '</h1>' +
                (ch.summary ? '<div style="font-size:13px;color:' + t.textSecondary + ';line-height:1.6;margin-bottom:24px;padding-left:10px;border-left:2px solid ' + t.accentLight + ';">' + esc(ch.summary) + '</div>' : '<div style="height:12px;"></div>') +
                '<div style="font-size:11px;font-weight:600;color:' + t.accent + ';padding:0 0 8px;letter-spacing:0.5px;">场景列表</div>' +
                '<div style="background:' + t.cardBg + ';border-radius:12px;border:1px solid ' + t.cardBorder + ';overflow:hidden;">' + scenesHtml + '</div>' +
                '<div style="display:flex;gap:12px;margin-top:32px;">' + prevBtn + nextBtn + '</div>' +
            '</div>';

        document.body.appendChild(overlay);
    }

    /* ========== 单场景阅读 ========== */
    function openScene(catId, chIdx, sIdx) {
        var cat = getCat(catId);
        if (!cat || !cat.chapters || !cat.chapters[chIdx]) return;
        var ch = cat.chapters[chIdx];
        if (!ch.scenes || !ch.scenes[sIdx]) return;
        var sc = ch.scenes[sIdx];
        var t = getTheme();

        var overlay = document.createElement('div');
        overlay.id = 'qiyu-scene-reader';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:999999998;background:' + t.bg + ';overflow-y:auto;-webkit-overflow-scrolling:touch;';

        var content = formatContent(sc.content);
        var pLabel = sc.perspective === 'first' ? '第一人称视角' : '第三人称视角';

        // 场景间翻页
        var prevBtn = sIdx > 0 ?
            '<div onclick="QiyuStory.openScene(\'' + catId + '\',' + chIdx + ',' + (sIdx-1) + ')" style="padding:12px 20px;border-radius:10px;background:' + t.mutedBg + ';color:' + t.textPrimary + ';font-size:13px;font-weight:500;text-align:center;cursor:pointer;">← 上一场景</div>' : '';
        var nextBtn = sIdx < ch.scenes.length - 1 ?
            '<div onclick="QiyuStory.openScene(\'' + catId + '\',' + chIdx + ',' + (sIdx+1) + ')" style="padding:12px 20px;border-radius:10px;background:' + t.accent + ';color:#fff;font-size:13px;font-weight:500;text-align:center;cursor:pointer;">下一场景 →</div>' : '';

        overlay.innerHTML =
            subHeader(ch.title, pLabel) +
            '<div style="max-width:600px;margin:0 auto;padding:28px 24px 60px;">' +
                '<h2 style="font-size:17px;font-weight:700;color:' + t.textPrimary + ';line-height:1.5;margin:0 0 20px;">' + esc(sc.title || ('场景' + (sIdx+1))) + '</h2>' +
                '<div style="color:' + t.textPrimary + ';">' + content + '</div>' +
                '<div style="display:flex;gap:12px;margin-top:40px;">' + prevBtn + nextBtn + '</div>' +
                '<div onclick="document.getElementById(\'qiyu-scene-reader\').remove();" style="margin-top:12px;padding:10px 20px;border-radius:10px;background:transparent;color:' + t.textSecondary + ';font-size:12px;font-weight:500;text-align:center;cursor:pointer;border:1px solid ' + t.cardBorder + ';">返回场景列表</div>' +
            '</div>';

        document.body.appendChild(overlay);
        overlay.scrollTop = 0;
    }

    /* ========== 卡片网格 ========== */
    function openCardGrid(cat) {
        var t = getTheme();
        var overlay = document.createElement('div');
        overlay.id = 'qiyu-card-grid';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:999999996;background:' + t.bg + ';overflow-y:auto;-webkit-overflow-scrolling:touch;';

        var cards = cat.cards || [];
        var gridHtml = '';

        if (cards.length === 0) {
            gridHtml = '<div style="text-align:center;padding:80px 20px;"><div style="font-size:36px;color:' + t.textTertiary + ';margin-bottom:12px;">' + (ICONS[cat.iconKey] || '') + '</div><div style="font-size:14px;color:' + t.textSecondary + ';font-weight:500;">还没有内容</div><div style="font-size:12px;color:' + t.textTertiary + ';margin-top:6px;">后续在这里补充' + cat.title + '</div></div>';
        } else {
            gridHtml = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:16px;">';
            cards.forEach(function(card, idx) {
                var iconHtml = ICONS[cat.iconKey] || ICONS.memory;
                gridHtml +=
                    '<div onclick="QiyuStory.openCardDetail(\'' + cat.id + '\',' + idx + ')" style="overflow:hidden;border-radius:12px;background:' + t.cardBg + ';border:1px solid ' + t.cardBorder + ';cursor:pointer;" onmousedown="this.style.background=\'' + t.mutedBg + '\'" onmouseup="this.style.background=\'' + t.cardBg + '\'" ontouchstart="this.style.background=\'' + t.mutedBg + '\'" ontouchend="this.style.background=\'' + t.cardBg + '\'">' +
                        '<div style="height:72px;background:' + t.headerBg + ';display:flex;align-items:center;justify-content:center;color:' + t.accent + ';">' + iconHtml + '</div>' +
                        '<div style="padding:10px 12px 12px;">' +
                            '<div style="font-size:13px;font-weight:600;color:' + t.textPrimary + ';line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">' + esc(card.title || '未命名') + '</div>' +
                            (card.tag ? '<span style="display:inline-block;margin-top:6px;font-size:10px;font-weight:500;color:' + t.accent + ';">' + esc(card.tag) + '</span>' : '') +
                        '</div>' +
                    '</div>';
            });
            gridHtml += '</div>';
        }

        overlay.innerHTML = subHeader(cat.title, cat.subtitle) + gridHtml;
        document.body.appendChild(overlay);
    }

    /* ========== 卡片详情 ========== */
    function openCardDetail(catId, index) {
        var cat = getCat(catId);
        if (!cat || !cat.cards || !cat.cards[index]) return;
        var card = cat.cards[index];
        var t = getTheme();

        var overlay = document.createElement('div');
        overlay.id = 'qiyu-card-detail';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:999999997;background:' + t.bg + ';overflow-y:auto;-webkit-overflow-scrolling:touch;';

        var content = formatContent(card.content);

        var branchesHtml = '';
        if (card.branches && card.branches.length) {
            branchesHtml = '<div style="margin-top:32px;padding:16px;border-radius:10px;background:' + t.mutedBg + ';">' +
                '<div style="font-size:12px;font-weight:600;color:' + t.accent + ';margin-bottom:12px;">分支选项</div>';
            card.branches.forEach(function(b) {
                branchesHtml +=
                    '<div style="padding:10px 12px;border-radius:8px;background:' + t.cardBg + ';margin-bottom:8px;border-left:2px solid ' + t.accentLight + ';">' +
                        '<div style="font-size:13px;font-weight:500;color:' + t.textPrimary + ';">' + esc(b.option || b.title || '') + '</div>' +
                        (b.result ? '<div style="font-size:12px;color:' + t.textSecondary + ';margin-top:4px;">' + esc(b.result) + '</div>' : '') +
                    '</div>';
            });
            branchesHtml += '</div>';
        }

        overlay.innerHTML =
            subHeader(cat.title, card.title || '') +
            '<div style="max-width:600px;margin:0 auto;padding:24px 24px 60px;">' +
                '<h1 style="font-size:18px;font-weight:700;color:' + t.textPrimary + ';line-height:1.4;margin:0 0 8px;">' + esc(card.title || '未命名') + '</h1>' +
                (card.subtitle ? '<div style="font-size:13px;color:' + t.textSecondary + ';margin-bottom:24px;">' + esc(card.subtitle) + '</div>' : '<div style="height:12px;"></div>') +
                (card.tag ? '<span style="display:inline-block;font-size:10px;font-weight:500;color:' + t.accent + ';padding:3px 10px;border-radius:6px;background:' + t.mutedBg + ';margin-bottom:24px;">' + esc(card.tag) + '</span>' : '') +
                '<div style="color:' + t.textPrimary + ';">' + content + '</div>' +
                branchesHtml +
            '</div>';

        document.body.appendChild(overlay);
    }

    /* ========== 短信通话列表 ========== */
    function openChatList(cat) {
        var t = getTheme();
        var overlay = document.createElement('div');
        overlay.id = 'qiyu-chat-list';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:999999996;background:' + t.bg + ';overflow-y:auto;-webkit-overflow-scrolling:touch;';

        var convs = cat.conversations || [];
        var listHtml = '';

        if (convs.length === 0) {
            listHtml = '<div style="text-align:center;padding:80px 20px;"><div style="font-size:36px;color:' + t.textTertiary + ';margin-bottom:12px;">' + (ICONS[cat.iconKey] || '') + '</div><div style="font-size:14px;color:' + t.textSecondary + ';font-weight:500;">还没有内容</div><div style="font-size:12px;color:' + t.textTertiary + ';margin-top:6px;">后续在这里补充短信和通话记录</div></div>';
        } else {
            convs.forEach(function(conv, idx) {
                listHtml +=
                    '<div onclick="QiyuStory.openChatDetail(\'' + cat.id + '\',' + idx + ')" style="display:flex;align-items:center;gap:14px;padding:16px;border-bottom:1px solid ' + t.cardBorder + ';cursor:pointer;" onmousedown="this.style.background=\'' + t.mutedBg + '\'" onmouseup="this.style.background=\'transparent\'" ontouchstart="this.style.background=\'' + t.mutedBg + '\'" ontouchend="this.style.background=\'transparent\'">' +
                        '<div style="width:40px;height:40px;border-radius:50%;background:' + t.accentLight + ';display:flex;align-items:center;justify-content:center;font-size:18px;color:' + t.accent + ';">' + (conv.type === 'call' ? '📞' : '💬') + '</div>' +
                        '<div style="flex:1;min-width:0;">' +
                            '<div style="font-size:14px;font-weight:500;color:' + t.textPrimary + ';">' + esc(conv.title || '未命名') + '</div>' +
                            '<div style="font-size:12px;color:' + t.textSecondary + ';margin-top:3px;">' + (conv.messages && conv.messages.length ? conv.messages.length + ' 条消息' : '空') + '</div>' +
                        '</div>' +
                        '<span style="font-size:14px;color:' + t.textTertiary + ';">›</span>' +
                    '</div>';
            });
        }

        overlay.innerHTML = subHeader(cat.title, cat.subtitle) + '<div>' + listHtml + '</div>';
        document.body.appendChild(overlay);
    }

    /* ========== 短信通话详情 ========== */
    function openChatDetail(catId, index) {
        var cat = getCat(catId);
        if (!cat || !cat.conversations || !cat.conversations[index]) return;
        var conv = cat.conversations[index];
        var t = getTheme();

        var overlay = document.createElement('div');
        overlay.id = 'qiyu-chat-detail';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:999999997;background:' + t.bg + ';overflow-y:auto;-webkit-overflow-scrolling:touch;';

        var msgsHtml = '';
        var messages = conv.messages || [];

        if (messages.length === 0) {
            msgsHtml = '<div style="text-align:center;padding:60px 20px;color:' + t.textTertiary + ';font-size:13px;">没有消息记录</div>';
        } else {
            messages.forEach(function(msg) {
                var isMe = msg.from === 'me';
                if (msg.type === 'call') {
                    msgsHtml += '<div style="display:flex;justify-content:center;margin:12px 0;"><div style="padding:6px 14px;border-radius:14px;background:' + t.mutedBg + ';font-size:11px;color:' + t.textSecondary + ';">📞 ' + esc(msg.text || '通话记录') + '</div></div>';
                } else {
                    var align = isMe ? 'flex-end' : 'flex-start';
                    var bubbleBg = isMe ? t.accent : t.cardBg;
                    var bubbleColor = isMe ? '#fff' : t.textPrimary;
                    var border = isMe ? 'none' : '1px solid ' + t.cardBorder;
                    msgsHtml +=
                        '<div style="display:flex;flex-direction:' + (isMe ? 'row-reverse' : 'row') + ';align-items:flex-start;gap:8px;margin:8px 16px;">' +
                            '<div style="width:30px;height:30px;border-radius:50%;background:' + (isMe ? t.accentLight : t.accent) + ';display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:' + (isMe ? t.accent : '#fff') + ';flex-shrink:0;">' + (isMe ? '我' : '煜') + '</div>' +
                            '<div style="max-width:70%;">' +
                                (msg.time ? '<div style="font-size:10px;color:' + t.textTertiary + ';margin-bottom:3px;text-align:' + (isMe ? 'right' : 'left') + ';">' + esc(msg.time) + '</div>' : '') +
                                '<div style="padding:10px 14px;border-radius:16px;background:' + bubbleBg + ';color:' + bubbleColor + ';font-size:14px;line-height:1.5;' + (border !== 'none' ? 'border:' + border + ';' : '') + '">' + esc(msg.text || '') + '</div>' +
                            '</div>' +
                        '</div>';
                }
            });
        }

        overlay.innerHTML =
            subHeader(conv.title || '对话', conv.type === 'call' ? '📞 通话' : '💬 短信') +
            '<div style="padding:12px 0 40px;min-height:calc(100vh - 52px);">' + msgsHtml + '</div>';

        document.body.appendChild(overlay);
        overlay.scrollTop = overlay.scrollHeight;
    }

    /* ========== 朋友圈列表 ========== */
    function openMomentsList(cat) {
        var t = getTheme();
        var overlay = document.createElement('div');
        overlay.id = 'qiyu-moments-list';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:999999996;background:' + t.bg + ';overflow-y:auto;-webkit-overflow-scrolling:touch;';

        var posts = cat.posts || [];
        var postsHtml = '';

        if (posts.length === 0) {
            postsHtml = '<div style="text-align:center;padding:80px 20px;"><div style="font-size:36px;color:' + t.textTertiary + ';margin-bottom:12px;">' + (ICONS[cat.iconKey] || '') + '</div><div style="font-size:14px;color:' + t.textSecondary + ';font-weight:500;">还没有内容</div><div style="font-size:12px;color:' + t.textTertiary + ';margin-top:6px;">后续在这里补充朋友圈动态</div></div>';
        } else {
            posts.forEach(function(post) {
                postsHtml +=
                    '<div style="padding:16px;border-bottom:1px solid ' + t.cardBorder + ';">' +
                        '<div style="display:flex;gap:12px;">' +
                            '<div style="width:36px;height:36px;border-radius:50%;background:' + t.accent + ';display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;color:#fff;flex-shrink:0;">煜</div>' +
                            '<div style="flex:1;min-width:0;">' +
                                '<div style="font-size:13px;font-weight:600;color:' + t.accent + ';">祁煜</div>' +
                                (post.text ? '<div style="font-size:14px;color:' + t.textPrimary + ';margin-top:6px;line-height:1.5;white-space:pre-wrap;">' + esc(post.text) + '</div>' : '') +
                                (post.image ? '<div style="margin-top:10px;border-radius:10px;overflow:hidden;"><img src="' + esc(post.image) + '" style="width:100%;display:block;" /></div>' : '') +
                                '<div style="font-size:11px;color:' + t.textTertiary + ';margin-top:8px;">' + esc(post.time || '') + '</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>';
            });
        }

        overlay.innerHTML = subHeader(cat.title, cat.subtitle) + '<div>' + postsHtml + '</div>';
        document.body.appendChild(overlay);
    }

    /* ========== 内容编辑器 ========== */
    function openEditor(catId) {
        if (!storyData) storyData = loadData();
        var cat = getCat(catId);
        if (!cat) return;
        var t = getTheme();

        var overlay = document.createElement('div');
        overlay.id = 'qiyu-editor';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:999999999;background:' + t.bg + ';overflow-y:auto;-webkit-overflow-scrolling:touch;';

        var chapters = cat.chapters || [];

        var listHtml = '';
        if (chapters.length > 0) {
            // 按 arc 分组
            var arcs = {};
            var arcOrder = [];
            chapters.forEach(function(ch, idx) {
                var arc = ch.arc || '未分类';
                if (!arcs[arc]) { arcs[arc] = []; arcOrder.push(arc); }
                arcs[arc].push({ ch: ch, idx: idx });
            });

            arcOrder.forEach(function(arcName) {
                listHtml += '<div style="padding:12px 16px 6px;font-size:11px;font-weight:700;color:' + t.accent + ';letter-spacing:0.5px;">' + esc(arcName) + '</div>';
                arcs[arcName].forEach(function(item) {
                    listHtml +=
                        '<div style="display:flex;align-items:center;gap:8px;padding:10px 16px;border-bottom:1px solid ' + t.cardBorder + ';">' +
                            '<div style="flex:1;min-width:0;cursor:pointer;" onclick="QiyuStory.editChapter(\'' + catId + '\',' + item.idx + ')">' +
                                '<div style="font-size:13px;font-weight:600;color:' + t.textPrimary + ';">' + esc(item.ch.title || '未命名') + '</div>' +
                                '<div style="font-size:11px;color:' + t.textTertiary + ';margin-top:2px;">' + (item.ch.scenes ? item.ch.scenes.length + ' 场景' : (item.ch.content ? '有内容' : '空')) + (item.ch.status === 'unconfirmed' ? ' · 待确认' : '') + '</div>' +
                            '</div>' +
                            '<div onclick="QiyuStory.deleteChapter(\'' + catId + '\',' + item.idx + ')" style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;color:#E0493B;cursor:pointer;font-size:16px;">×</div>' +
                        '</div>';
                });
            });
        }

        overlay.innerHTML =
            '<div style="position:sticky;top:0;z-index:10;display:flex;align-items:center;gap:12px;padding:calc(env(safe-area-inset-top,0px) + 12px) 16px 12px;background:' + t.bg + ';border-bottom:1px solid ' + t.cardBorder + ';">' +
                '<div onclick="document.getElementById(\'qiyu-editor\').remove();" style="width:32px;height:32px;border-radius:50%;background:' + t.mutedBg + ';display:flex;align-items:center;justify-content:center;font-size:15px;color:' + t.textPrimary + ';cursor:pointer;flex-shrink:0;">←</div>' +
                '<div style="flex:1;">' +
                    '<div style="font-size:16px;font-weight:600;color:' + t.textPrimary + ';">编辑内容</div>' +
                    '<div style="font-size:11px;color:' + t.textSecondary + ';margin-top:2px;">' + esc(cat.title) + '</div>' +
                '</div>' +
            '</div>' +
            '<div style="padding:16px 0 80px;">' + listHtml + '</div>' +
            '<div onclick="QiyuStory.addChapterForm(\'' + catId + '\')" style="position:fixed;bottom:calc(env(safe-area-inset-bottom,0px) + 20px);right:20px;width:48px;height:48px;border-radius:50%;background:' + t.accent + ';display:flex;align-items:center;justify-content:center;color:#fff;font-size:22px;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,0.15);z-index:20;">+</div>';

        document.body.appendChild(overlay);
    }

    /* ========== 添加章节表单 ========== */
    function addChapterForm(catId) {
        var t = getTheme();
        var overlay = document.createElement('div');
        overlay.id = 'qiyu-editor-form';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:999999999;background:rgba(0,0,0,0.4);display:flex;align-items:flex-end;';

        var html =
            '<div style="background:' + t.cardBg + ';width:100%;border-radius:20px 20px 0 0;padding:24px 20px calc(env(safe-area-inset-bottom,0px) + 24px);max-height:80vh;overflow-y:auto;">' +
                '<div style="font-size:16px;font-weight:600;color:' + t.textPrimary + ';margin-bottom:20px;">添加章节</div>' +
                '<div style="margin-bottom:16px;"><label style="display:block;font-size:12px;font-weight:500;color:' + t.textSecondary + ';margin-bottom:6px;">篇名（arc）</label><input id="ed-arc" type="text" placeholder="如：于深空之下" style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid ' + t.cardBorder + ';background:' + t.bg + ';color:' + t.textPrimary + ';font-size:14px;font-family:inherit;box-sizing:border-box;" /></div>' +
                '<div style="margin-bottom:16px;"><label style="display:block;font-size:12px;font-weight:500;color:' + t.textSecondary + ';margin-bottom:6px;">标题</label><input id="ed-title" type="text" placeholder="如：焰尾鱼" style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid ' + t.cardBorder + ';background:' + t.bg + ';color:' + t.textPrimary + ';font-size:14px;font-family:inherit;box-sizing:border-box;" /></div>' +
                '<div style="margin-bottom:16px;"><label style="display:block;font-size:12px;font-weight:500;color:' + t.textSecondary + ';margin-bottom:6px;">概要</label><textarea id="ed-summary" placeholder="一句话描述这章讲了什么" style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid ' + t.cardBorder + ';background:' + t.bg + ';color:' + t.textPrimary + ';font-size:14px;font-family:inherit;box-sizing:border-box;min-height:60px;resize:vertical;"></textarea></div>' +
                '<div style="margin-bottom:24px;"><label style="display:flex;align-items:center;gap:8px;font-size:13px;color:' + t.textPrimary + ';"><input id="ed-unconfirmed" type="checkbox" style="width:16px;height:16px;" /><span>标记为「待确认」</span></label></div>' +
                '<div style="display:flex;gap:12px;">' +
                    '<div onclick="document.getElementById(\'qiyu-editor-form\').remove();" style="flex:1;padding:12px;border-radius:10px;background:' + t.mutedBg + ';color:' + t.textPrimary + ';font-size:14px;font-weight:500;text-align:center;cursor:pointer;">取消</div>' +
                    '<div onclick="QiyuStory.saveNewChapter(\'' + catId + '\')" style="flex:1;padding:12px;border-radius:10px;background:' + t.accent + ';color:#fff;font-size:14px;font-weight:500;text-align:center;cursor:pointer;">保存</div>' +
                '</div>' +
            '</div>';

        overlay.innerHTML = html;
        overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };
        document.body.appendChild(overlay);
    }

    /* ========== 编辑章节（含场景编辑） ========== */
    function editChapter(catId, idx) {
        if (!storyData) storyData = loadData();
        var cat = getCat(catId);
        if (!cat || !cat.chapters || !cat.chapters[idx]) return;
        var ch = cat.chapters[idx];
        var t = getTheme();

        // 移除编辑器
        var ed = document.getElementById('qiyu-editor');
        if (ed) ed.remove();

        var overlay = document.createElement('div');
        overlay.id = 'qiyu-chapter-edit';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:999999999;background:' + t.bg + ';overflow-y:auto;-webkit-overflow-scrolling:touch;';

        // 场景列表
        var scenesHtml = '';
        if (ch.scenes && ch.scenes.length) {
            ch.scenes.forEach(function(sc, sIdx) {
                scenesHtml +=
                    '<div style="display:flex;align-items:flex-start;gap:8px;padding:12px 16px;border-bottom:1px solid ' + t.cardBorder + ';">' +
                        '<div style="flex:1;min-width:0;">' +
                            '<div style="font-size:13px;font-weight:600;color:' + t.textPrimary + ';">' + esc(sc.title || ('场景' + (sIdx+1))) + '</div>' +
                            '<div style="font-size:11px;color:' + t.textTertiary + ';margin-top:2px;">' + (sc.perspective === 'first' ? '第一人称' : '第三人称') + (sc.content ? '' : ' · 待补充') + '</div>' +
                        '</div>' +
                        '<div onclick="QiyuStory.editScene(\'' + catId + '\',' + idx + ',' + sIdx + ')" style="padding:4px 10px;border-radius:6px;background:' + t.mutedBg + ';color:' + t.textPrimary + ';font-size:11px;cursor:pointer;">编辑</div>' +
                        '<div onclick="QiyuStory.deleteScene(\'' + catId + '\',' + idx + ',' + sIdx + ')" style="padding:4px 8px;color:#E0493B;cursor:pointer;font-size:16px;">×</div>' +
                    '</div>';
            });
        }

        overlay.innerHTML =
            '<div style="position:sticky;top:0;z-index:10;display:flex;align-items:center;gap:12px;padding:calc(env(safe-area-inset-top,0px) + 12px) 16px 12px;background:' + t.bg + ';border-bottom:1px solid ' + t.cardBorder + ';">' +
                '<div onclick="document.getElementById(\'qiyu-chapter-edit\').remove();" style="width:32px;height:32px;border-radius:50%;background:' + t.mutedBg + ';display:flex;align-items:center;justify-content:center;font-size:15px;color:' + t.textPrimary + ';cursor:pointer;flex-shrink:0;">←</div>' +
                '<div style="flex:1;font-size:16px;font-weight:600;color:' + t.textPrimary + ';">编辑章节</div>' +
            '</div>' +
            '<div style="padding:16px 16px 80px;">' +
                '<div style="margin-bottom:16px;"><label style="display:block;font-size:12px;font-weight:500;color:' + t.textSecondary + ';margin-bottom:6px;">篇名</label><input id="ch-arc" type="text" value="' + esc(ch.arc || '') + '" style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid ' + t.cardBorder + ';background:' + t.cardBg + ';color:' + t.textPrimary + ';font-size:14px;font-family:inherit;box-sizing:border-box;" /></div>' +
                '<div style="margin-bottom:16px;"><label style="display:block;font-size:12px;font-weight:500;color:' + t.textSecondary + ';margin-bottom:6px;">标题</label><input id="ch-title" type="text" value="' + esc(ch.title || '') + '" style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid ' + t.cardBorder + ';background:' + t.cardBg + ';color:' + t.textPrimary + ';font-size:14px;font-family:inherit;box-sizing:border-box;" /></div>' +
                '<div style="margin-bottom:16px;"><label style="display:block;font-size:12px;font-weight:500;color:' + t.textSecondary + ';margin-bottom:6px;">概要</label><textarea id="ch-summary" style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid ' + t.cardBorder + ';background:' + t.cardBg + ';color:' + t.textPrimary + ';font-size:14px;font-family:inherit;box-sizing:border-box;min-height:60px;resize:vertical;">' + esc(ch.summary || '') + '</textarea></div>' +
                '<div style="margin-bottom:24px;"><label style="display:flex;align-items:center;gap:8px;font-size:13px;color:' + t.textPrimary + ';"><input id="ch-unconfirmed" type="checkbox" ' + (ch.status === 'unconfirmed' ? 'checked' : '') + ' style="width:16px;height:16px;" /><span>标记为「待确认」</span></label></div>' +
                '<div style="font-size:12px;font-weight:700;color:' + THEME.accent + ';padding:8px 0;letter-spacing:0.5px;">文游节点' + (ch.vnNodes ? (' · ' + ch.vnNodes.length + ' 个') : '') + '</div>' +
                '<div onclick="QiyuStory.openVNEditor(\'' + catId + '\',' + idx + ')" style="padding:12px;border-radius:10px;border:1px solid ' + t.cardBorder + ';background:' + t.cardBg + ';color:' + THEME.accent + ';font-size:13px;font-weight:600;text-align:center;cursor:pointer;margin-bottom:10px;display:flex;align-items:center;justify-content:center;gap:6px;"><span>🎭</span>打开文游节点编辑器</div>' +
                '<div onclick="QiyuStory.openAssetLibrary(\'scenes\',null)" style="padding:10px;border-radius:10px;border:1px solid ' + t.cardBorder + ';background:' + t.cardBg + ';color:' + t.textSecondary + ';font-size:12px;text-align:center;cursor:pointer;margin-bottom:6px;">🖼️ 管理场景素材</div>' +
                '<div onclick="QiyuStory.openAssetLibrary(\'portraits\',null)" style="padding:10px;border-radius:10px;border:1px solid ' + t.cardBorder + ';background:' + t.cardBg + ';color:' + t.textSecondary + ';font-size:12px;text-align:center;cursor:pointer;margin-bottom:20px;">👤 管理立绘素材</div>' +
                '<div style="font-size:12px;font-weight:700;color:' + THEME.accent + ';padding:8px 0;letter-spacing:0.5px;">场景</div>' +
                '<div style="background:' + t.cardBg + ';border-radius:12px;border:1px solid ' + t.cardBorder + ';overflow:hidden;margin-bottom:12px;">' + scenesHtml + '</div>' +
                '<div onclick="QiyuStory.addSceneForm(\'' + catId + '\',' + idx + ')" style="padding:10px;border-radius:10px;border:1px dashed ' + t.cardBorder + ';color:' + t.textSecondary + ';font-size:13px;text-align:center;cursor:pointer;margin-bottom:24px;">+ 添加场景</div>' +
                '<div onclick="QiyuStory.saveChapterEdit(\'' + catId + '\',' + idx + ')" style="padding:12px;border-radius:10px;background:' + THEME.accent + ';color:#fff;font-size:14px;font-weight:500;text-align:center;cursor:pointer;">保存修改</div>' +
            '</div>';

        document.body.appendChild(overlay);
    }

    /* ========== 添加场景表单 ========== */
    function addSceneForm(catId, chIdx) {
        var t = getTheme();
        var overlay = document.createElement('div');
        overlay.id = 'qiyu-scene-form';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:999999999;background:rgba(0,0,0,0.4);display:flex;align-items:flex-end;';

        var html =
            '<div style="background:' + t.cardBg + ';width:100%;border-radius:20px 20px 0 0;padding:24px 20px calc(env(safe-area-inset-bottom,0px) + 24px);max-height:85vh;overflow-y:auto;">' +
                '<div style="font-size:16px;font-weight:600;color:' + t.textPrimary + ';margin-bottom:20px;">添加场景</div>' +
                '<div style="margin-bottom:16px;"><label style="display:block;font-size:12px;font-weight:500;color:' + t.textSecondary + ';margin-bottom:6px;">场景标题</label><input id="sc-title" type="text" placeholder="如：晴空广场" style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid ' + t.cardBorder + ';background:' + t.bg + ';color:' + t.textPrimary + ';font-size:14px;font-family:inherit;box-sizing:border-box;" /></div>' +
                '<div style="margin-bottom:16px;"><label style="display:block;font-size:12px;font-weight:500;color:' + t.textSecondary + ';margin-bottom:6px;">视角</label><select id="sc-perspective" style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid ' + t.cardBorder + ';background:' + t.bg + ';color:' + t.textPrimary + ';font-size:14px;font-family:inherit;box-sizing:border-box;"><option value="third">第三人称（叙述）</option><option value="first">第一人称（代入）</option></select></div>' +
                '<div style="margin-bottom:24px;"><label style="display:block;font-size:12px;font-weight:500;color:' + t.textSecondary + ';margin-bottom:6px;">内容（空行分段，[img:URL] 插图）</label><textarea id="sc-content" placeholder="场景内容…" style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid ' + t.cardBorder + ';background:' + t.bg + ';color:' + t.textPrimary + ';font-size:14px;font-family:inherit;box-sizing:border-box;min-height:120px;resize:vertical;"></textarea></div>' +
                '<div style="display:flex;gap:12px;">' +
                    '<div onclick="document.getElementById(\'qiyu-scene-form\').remove();" style="flex:1;padding:12px;border-radius:10px;background:' + t.mutedBg + ';color:' + t.textPrimary + ';font-size:14px;font-weight:500;text-align:center;cursor:pointer;">取消</div>' +
                    '<div onclick="QiyuStory.saveNewScene(\'' + catId + '\',' + chIdx + ')" style="flex:1;padding:12px;border-radius:10px;background:' + t.accent + ';color:#fff;font-size:14px;font-weight:500;text-align:center;cursor:pointer;">保存</div>' +
                '</div>' +
            '</div>';

        overlay.innerHTML = html;
        overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };
        document.body.appendChild(overlay);
    }

    /* ========== 编辑场景表单 ========== */
    function editScene(catId, chIdx, sIdx) {
        if (!storyData) storyData = loadData();
        var cat = getCat(catId);
        if (!cat || !cat.chapters[chIdx]) return;
        var ch = cat.chapters[chIdx];
        if (!ch.scenes || !ch.scenes[sIdx]) return;
        var sc = ch.scenes[sIdx];
        var t = getTheme();

        var sf = document.getElementById('qiyu-scene-form');
        if (sf) sf.remove();
        var ce = document.getElementById('qiyu-chapter-edit');
        if (ce) ce.remove();

        var overlay = document.createElement('div');
        overlay.id = 'qiyu-scene-edit';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:999999999;background:' + t.bg + ';overflow-y:auto;-webkit-overflow-scrolling:touch;';

        overlay.innerHTML =
            '<div style="position:sticky;top:0;z-index:10;display:flex;align-items:center;gap:12px;padding:calc(env(safe-area-inset-top,0px) + 12px) 16px 12px;background:' + t.bg + ';border-bottom:1px solid ' + t.cardBorder + ';">' +
                '<div onclick="document.getElementById(\'qiyu-scene-edit\').remove();" style="width:32px;height:32px;border-radius:50%;background:' + t.mutedBg + ';display:flex;align-items:center;justify-content:center;font-size:15px;color:' + t.textPrimary + ';cursor:pointer;flex-shrink:0;">←</div>' +
                '<div style="flex:1;font-size:16px;font-weight:600;color:' + t.textPrimary + ';">编辑场景</div>' +
            '</div>' +
            '<div style="padding:16px 16px 80px;">' +
                '<div style="margin-bottom:16px;"><label style="display:block;font-size:12px;font-weight:500;color:' + t.textSecondary + ';margin-bottom:6px;">场景标题</label><input id="se-title" type="text" value="' + esc(sc.title || '') + '" style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid ' + t.cardBorder + ';background:' + t.cardBg + ';color:' + t.textPrimary + ';font-size:14px;font-family:inherit;box-sizing:border-box;" /></div>' +
                '<div style="margin-bottom:16px;"><label style="display:block;font-size:12px;font-weight:500;color:' + t.textSecondary + ';margin-bottom:6px;">视角</label><select id="se-perspective" style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid ' + t.cardBorder + ';background:' + t.cardBg + ';color:' + t.textPrimary + ';font-size:14px;font-family:inherit;box-sizing:border-box;"><option value="third" ' + (sc.perspective !== 'first' ? 'selected' : '') + '>第三人称（叙述）</option><option value="first" ' + (sc.perspective === 'first' ? 'selected' : '') + '>第一人称（代入）</option></select></div>' +
                '<div style="margin-bottom:24px;"><label style="display:block;font-size:12px;font-weight:500;color:' + t.textSecondary + ';margin-bottom:6px;">内容（空行分段，[img:URL] 插图）</label><textarea id="se-content" style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid ' + t.cardBorder + ';background:' + t.cardBg + ';color:' + t.textPrimary + ';font-size:14px;font-family:inherit;box-sizing:border-box;min-height:200px;resize:vertical;">' + esc(sc.content || '') + '</textarea></div>' +
                '<div onclick="QiyuStory.saveSceneEdit(\'' + catId + '\',' + chIdx + ',' + sIdx + ')" style="padding:12px;border-radius:10px;background:' + t.accent + ';color:#fff;font-size:14px;font-weight:500;text-align:center;cursor:pointer;">保存</div>' +
            '</div>';

        document.body.appendChild(overlay);
    }

    /* ========== 保存操作 ========== */
    function saveNewChapter(catId) {
        if (!storyData) storyData = loadData();
        var cat = getCat(catId);
        if (!cat) return;
        var arc = document.getElementById('ed-arc').value.trim();
        var title = document.getElementById('ed-title').value.trim();
        var summary = document.getElementById('ed-summary').value.trim();
        var unconfirmed = document.getElementById('ed-unconfirmed').checked;

        if (!title) { alert('请输入标题'); return; }

        if (!cat.chapters) cat.chapters = [];
        cat.chapters.push({
            arc: arc || '未分类',
            title: title,
            summary: summary,
            status: unconfirmed ? 'unconfirmed' : 'confirmed',
            scenes: []
        });
        saveData(storyData);

        document.getElementById('qiyu-editor-form').remove();
        // 刷新编辑器
        var ed = document.getElementById('qiyu-editor');
        if (ed) ed.remove();
        openEditor(catId);
    }

    function saveChapterEdit(catId, idx) {
        if (!storyData) storyData = loadData();
        var cat = getCat(catId);
        if (!cat || !cat.chapters[idx]) return;
        var ch = cat.chapters[idx];

        ch.arc = document.getElementById('ch-arc').value.trim() || '未分类';
        ch.title = document.getElementById('ch-title').value.trim();
        ch.summary = document.getElementById('ch-summary').value.trim();
        ch.status = document.getElementById('ch-unconfirmed').checked ? 'unconfirmed' : 'confirmed';

        saveData(storyData);
        document.getElementById('qiyu-chapter-edit').remove();
        openEditor(catId);
    }

    function deleteChapter(catId, idx) {
        if (!confirm('确定删除这个章节？')) return;
        if (!storyData) storyData = loadData();
        var cat = getCat(catId);
        if (!cat || !cat.chapters) return;
        cat.chapters.splice(idx, 1);
        saveData(storyData);
        var ed = document.getElementById('qiyu-editor');
        if (ed) ed.remove();
        openEditor(catId);
    }

    function saveNewScene(catId, chIdx) {
        if (!storyData) storyData = loadData();
        var cat = getCat(catId);
        if (!cat || !cat.chapters[chIdx]) return;
        var ch = cat.chapters[chIdx];
        var title = document.getElementById('sc-title').value.trim();
        var perspective = document.getElementById('sc-perspective').value;
        var content = document.getElementById('sc-content').value;

        if (!title) { alert('请输入场景标题'); return; }
        if (!ch.scenes) ch.scenes = [];
        ch.scenes.push({ title: title, perspective: perspective, content: content });
        saveData(storyData);

        document.getElementById('qiyu-scene-form').remove();
        var ce = document.getElementById('qiyu-chapter-edit');
        if (ce) ce.remove();
        editChapter(catId, chIdx);
    }

    function saveSceneEdit(catId, chIdx, sIdx) {
        if (!storyData) storyData = loadData();
        var cat = getCat(catId);
        if (!cat || !cat.chapters[chIdx] || !cat.chapters[chIdx].scenes) return;
        var sc = cat.chapters[chIdx].scenes[sIdx];

        sc.title = document.getElementById('se-title').value.trim();
        sc.perspective = document.getElementById('se-perspective').value;
        sc.content = document.getElementById('se-content').value;

        saveData(storyData);
        document.getElementById('qiyu-scene-edit').remove();
        editChapter(catId, chIdx);
    }

    function deleteScene(catId, chIdx, sIdx) {
        if (!confirm('确定删除这个场景？')) return;
        if (!storyData) storyData = loadData();
        var cat = getCat(catId);
        if (!cat || !cat.chapters[chIdx] || !cat.chapters[chIdx].scenes) return;
        cat.chapters[chIdx].scenes.splice(sIdx, 1);
        saveData(storyData);
        var ce = document.getElementById('qiyu-chapter-edit');
        if (ce) ce.remove();
        editChapter(catId, chIdx);
    }

    /* ============================================================
     *                        文游引擎 (VN Engine)
     * ============================================================ */

    /* ---------- 存档系统 ---------- */
    function loadSaves() {
        try {
            var s = localStorage.getItem(SAVE_KEY);
            if (s) {
                var parsed = JSON.parse(s);
                if (parsed && parsed.version === SAVE_VERSION && parsed.slots) return parsed.slots;
            }
        } catch(e) {}
        var slots = [];
        for (var i = 0; i < MAX_SAVES; i++) slots.push(null);
        return slots;
    }

    function writeSaves(slots) {
        try { localStorage.setItem(SAVE_KEY, JSON.stringify({ version: SAVE_VERSION, slots: slots })); } catch(e) {}
    }

    function saveToSlot(slotIdx, catId, chIdx, nodeId, chTitle, nodeTitle) {
        var slots = loadSaves();
        slots[slotIdx] = {
            catId: catId, chIdx: chIdx, nodeId: nodeId,
            chTitle: chTitle, nodeTitle: nodeTitle,
            time: new Date().toLocaleString('zh-CN')
        };
        writeSaves(slots);
    }

    function getSaveSlot(slotIdx) {
        var slots = loadSaves();
        return slots[slotIdx] || null;
    }

    /* ---------- VN 运行状态 ---------- */
    var vnState = null;

    function startVN(catId, chIdx, startNodeId) {
        if (!storyData) storyData = loadData();
        var cat = getCat(catId);
        if (!cat || !cat.chapters || !cat.chapters[chIdx]) return;
        var ch = cat.chapters[chIdx];
        var nodes = ch.vnNodes || [];
        if (nodes.length === 0) { alert('本章暂未录入文游节点，后续会完善'); return; }

        // 建立索引
        var nodeMap = {};
        nodes.forEach(function(n) { nodeMap[n.id] = n; });
        var startId = startNodeId || (nodes[0] && nodes[0].id) || 'start';
        if (!nodeMap[startId]) { alert('找不到起始节点'); return; }

        vnState = {
            catId: catId, chIdx: chIdx,
            nodes: nodes, nodeMap: nodeMap,
            current: startId
        };

        renderVN();
    }

    /* ---------- 渲染 VN 界面 ---------- */
    function renderVN() {
        if (!vnState) return;
        if (document.getElementById('qiyu-vn')) document.getElementById('qiyu-vn').remove();

        var t = getTheme();
        var node = vnState.nodeMap[vnState.current];
        if (!node) { alert('节点不存在'); return; }

        var dark = isDark();
        var overlay = document.createElement('div');
        overlay.id = 'qiyu-vn';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:999999999;overflow:hidden;touch-action:none;';

        // 背景
        var bgStyle = node.bg ?
            'background-image:url(' + node.bg + ');background-size:cover;background-position:center;' :
            'background:' + (dark ? '#1a1816' : t.headerBg) + ';';

        // 立绘位置
        var portraitHtml = '';
        if (node.portrait) {
            var posStyle = node.position === 'right' ? 'right:5%;' : 'left:5%;';
            portraitHtml =
                '<div style="position:absolute;bottom:180px;bottom:calc(180px + env(safe-area-inset-bottom,0px));' + posStyle + 'width:45%;height:60%;pointer-events:none;z-index:2;">' +
                    '<img src="' + esc(node.portrait) + '" style="width:100%;height:100%;object-fit:contain;object-position:bottom;filter:drop-shadow(0 4px 12px rgba(0,0,0,0.25));" />' +
                '</div>';
        }

        // 角色名条
        var nameHtml = '';
        if (node.character && node.type !== 'narrate') {
            var isMe = node.character === '我' || node.character === '主角';
            var nameColor = isMe ? '#5B8C85' : THEME.accent;
            nameHtml =
                '<div style="position:relative;margin-bottom:-1px;display:inline-block;padding:4px 16px;border-radius:10px 10px 0 0;background:rgba(255,255,255,0.95);color:' + nameColor + ';font-size:13px;font-weight:700;box-shadow:0 -2px 6px rgba(0,0,0,0.05);backdrop-filter:blur(12px);">' +
                    esc(node.character) +
                '</div>';
        }

        // 文字框内容
        var contentHtml = '';
        if (node.type === 'choice') {
            // 选项
            contentHtml = '<div style="padding:6px 0;display:flex;flex-direction:column;gap:8px;">';
            (node.choices || []).forEach(function(chc, i) {
                contentHtml +=
                    '<div onclick="QiyuStory.vnChoice(' + i + ')" style="padding:10px 14px;border-radius:10px;border:1px solid ' + (dark ? THEME.darkCardBorder : '#e4ddcf') + ';background:rgba(255,255,255,0.6);color:' + t.textPrimary + ';font-size:13px;cursor:pointer;backdrop-filter:blur(4px);transition:all 0.15s;" onmousedown="this.style.background=\'rgba(255,255,255,0.9)\'" onmouseup="this.style.background=\'rgba(255,255,255,0.6)\'">' +
                        esc(chc.text) +
                    '</div>';
            });
            contentHtml += '</div>';
        } else if (node.type === 'end') {
            contentHtml =
                '<div style="text-align:center;padding:16px 0;">' +
                    '<div style="font-size:15px;font-weight:700;color:' + THEME.accent + ';margin-bottom:8px;">' + esc(node.title || '本章完') + '</div>' +
                    (node.text ? '<div style="font-size:13px;color:' + t.textSecondary + ';line-height:1.6;">' + esc(node.text) + '</div>' : '') +
                '</div>';
        } else {
            contentHtml =
                '<div style="padding:4px 2px;font-size:14.5px;line-height:1.85;letter-spacing:0.3px;color:' + t.textPrimary + ';min-height:72px;">' +
                    esc(node.text || '…') +
                '</div>';
        }

        // 下一页提示
        var indicatorHtml = '';
        if (node.type !== 'choice' && node.type !== 'end') {
            indicatorHtml =
                '<div onclick="QiyuStory.vnAdvance()" style="position:absolute;right:16px;bottom:calc(env(safe-area-inset-bottom,0px) + 10px);font-size:11px;font-weight:700;color:' + THEME.accent + ';display:flex;align-items:center;gap:2px;cursor:pointer;padding:4px 8px;border-radius:6px;background:rgba(0,0,0,0.04);">' +
                    '下一页 <span style="animation:vnPulse 1s infinite;">▸</span>' +
                '</div>';
        }

        // 文本框容器
        var textboxHtml =
            '<div style="position:absolute;left:0;right:0;bottom:0;padding:0 16px calc(env(safe-area-inset-bottom,0px) + 48px);z-index:5;">' +
                nameHtml +
                '<div style="background:rgba(255,255,255,0.92);backdrop-filter:blur(14px);border-radius:14px 14px 14px 14px;padding:16px 18px 36px;box-shadow:0 -4px 24px rgba(0,0,0,0.08);border:1px solid ' + (dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.04)') + ';position:relative;">' +
                    contentHtml +
                    indicatorHtml +
                '</div>' +
            '</div>';

        // 顶部菜单
        var menuHtml =
            '<div style="position:absolute;top:calc(env(safe-area-inset-top,0px) + 12px);left:16px;right:16px;z-index:10;display:flex;justify-content:space-between;align-items:center;">' +
                '<div onclick="QiyuStory.vnBack()" style="width:32px;height:32px;border-radius:50%;background:rgba(0,0,0,0.3);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;color:#fff;font-size:15px;cursor:pointer;">←</div>' +
                '<div style="display:flex;gap:8px;">' +
                    '<div onclick="QiyuStory.vnSaveMenu()" style="width:32px;height:32px;border-radius:50%;background:rgba(0,0,0,0.3);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;cursor:pointer;">💾</div>' +
                    '<div onclick="QiyuStory.vnLoadMenu()" style="width:32px;height:32px;border-radius:50%;background:rgba(0,0,0,0.3);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;cursor:pointer;">📂</div>' +
                '</div>' +
            '</div>';

        // 点击空白区域翻页（除选项页/结束页）
        var clickToAdvance = (node.type !== 'choice' && node.type !== 'end') ?
            'onclick="QiyuStory.vnAdvance(event)"' : '';

        overlay.innerHTML =
            '<div style="position:relative;width:100%;height:100%;' + bgStyle + '" ' + clickToAdvance + ' id="qiyu-vn-bg">' +
                // 背景遮罩保证文字可读
                (node.bg ? '<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0.15) 0%,rgba(0,0,0,0) 30%,rgba(0,0,0,0.35) 100%);"></div>' : '') +
                menuHtml +
                portraitHtml +
                textboxHtml +
            '</div>';

        // CSS 动画
        overlay.innerHTML += '<style>@keyframes vnPulse{0%,100%{transform:translateX(0);opacity:1}50%{transform:translateX(3px);opacity:0.6}}</style>';

        document.body.appendChild(overlay);
    }

    /* ---------- 翻页 ---------- */
    function vnAdvance(evt) {
        if (evt && evt.target) {
            // 如果点在文字框或控件上，不触发
            var tag = evt.target.tagName;
            if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || evt.target.closest && evt.target.closest('[onclick*="vnChoice"],[onclick*="vnSave"],[onclick*="vnLoad"],[onclick*="vnBack"]')) return;
        }
        if (!vnState) return;
        var node = vnState.nodeMap[vnState.current];
        if (!node || node.type === 'choice' || node.type === 'end') return;

        if (node.next) {
            vnState.current = node.next;
            renderVN();
        }
    }

    /* ---------- 选项 ---------- */
    function vnChoice(idx) {
        if (!vnState) return;
        var node = vnState.nodeMap[vnState.current];
        if (!node || node.type !== 'choice' || !node.choices || !node.choices[idx]) return;
        var nextId = node.choices[idx].next;
        if (nextId && vnState.nodeMap[nextId]) {
            vnState.current = nextId;
            renderVN();
        } else {
            alert('选项跳转目标不存在：' + nextId);
        }
    }

    /* ---------- 返回 ---------- */
    function vnBack() {
        if (confirm('确定退出文游模式？当前进度会丢失，建议先存档。')) {
            var el = document.getElementById('qiyu-vn');
            if (el) el.remove();
            vnState = null;
        }
    }

    /* ---------- 存档菜单 ---------- */
    function vnSaveMenu() {
        if (!vnState) return;
        var t = getTheme();
        var overlay = document.createElement('div');
        overlay.id = 'qiyu-vn-save';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:9999999998;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;padding:20px;';

        var slots = loadSaves();
        var slotsHtml = '<div style="display:flex;flex-direction:column;gap:8px;margin:16px 0;">';
        slots.forEach(function(s, i) {
            if (s) {
                slotsHtml +=
                    '<div onclick="QiyuStory.doSave(' + i + ')" style="padding:12px 14px;border-radius:10px;background:' + t.cardBg + ';border:1px solid ' + t.cardBorder + ';cursor:pointer;">' +
                        '<div style="display:flex;justify-content:space-between;align-items:center;">' +
                            '<div><span style="font-size:12px;font-weight:700;color:' + THEME.accent + ';">存档 ' + (i+1) + '</span></div>' +
                            '<span style="font-size:11px;color:' + t.textTertiary + ';">' + esc(s.time) + '</span>' +
                        '</div>' +
                        '<div style="font-size:13px;color:' + t.textPrimary + ';margin-top:4px;font-weight:600;">' + esc(s.chTitle || '') + ' - ' + esc(s.nodeTitle || '') + '</div>' +
                    '</div>';
            } else {
                slotsHtml +=
                    '<div onclick="QiyuStory.doSave(' + i + ')" style="padding:12px 14px;border-radius:10px;background:' + t.cardBg + ';border:1px dashed ' + t.cardBorder + ';cursor:pointer;">' +
                        '<div style="font-size:12px;font-weight:700;color:' + THEME.accent + ';margin-bottom:4px;">存档 ' + (i+1) + '</div>' +
                        '<div style="font-size:12px;color:' + t.textTertiary + ';">空存档位 · 点击保存</div>' +
                    '</div>';
            }
        });
        slotsHtml += '</div>';

        overlay.innerHTML =
            '<div style="background:' + t.bg + ';border-radius:18px;width:100%;max-width:400px;max-height:80vh;overflow-y:auto;padding:20px 16px;">' +
                '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">' +
                    '<div style="font-size:16px;font-weight:700;color:' + t.textPrimary + ';">保存进度</div>' +
                    '<div onclick="document.getElementById(\'qiyu-vn-save\').remove();" style="width:28px;height:28px;border-radius:50%;background:' + t.mutedBg + ';display:flex;align-items:center;justify-content:center;color:' + t.textPrimary + ';cursor:pointer;font-size:14px;">×</div>' +
                '</div>' +
                slotsHtml +
            '</div>';

        overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };
        document.body.appendChild(overlay);
    }

    function doSave(slotIdx) {
        if (!vnState) return;
        var node = vnState.nodeMap[vnState.current];
        var cat = getCat(vnState.catId);
        var ch = cat && cat.chapters[vnState.chIdx];
        saveToSlot(slotIdx, vnState.catId, vnState.chIdx, vnState.current,
            ch ? ch.title : '', node && node.type === 'dialog' && node.character ? node.character + '：' + (node.text || '').slice(0, 15) : (node && node.title || node.type || ''));
        alert('已保存到存档 ' + (slotIdx + 1));
        var sm = document.getElementById('qiyu-vn-save');
        if (sm) sm.remove();
        // 刷新存档菜单
        vnSaveMenu();
    }

    /* ---------- 读档菜单 ---------- */
    function vnLoadMenu() {
        var t = getTheme();
        var overlay = document.createElement('div');
        overlay.id = 'qiyu-vn-load';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:9999999998;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;padding:20px;';

        var slots = loadSaves();
        var hasSave = slots.some(function(s) { return s; });
        var slotsHtml = '';
        if (!hasSave) {
            slotsHtml = '<div style="padding:40px 16px;text-align:center;font-size:13px;color:' + t.textTertiary + ';">还没有存档</div>';
        } else {
            slotsHtml = '<div style="display:flex;flex-direction:column;gap:8px;margin:16px 0;">';
            slots.forEach(function(s, i) {
                if (s) {
                    slotsHtml +=
                        '<div onclick="QiyuStory.doLoad(' + i + ')" style="padding:12px 14px;border-radius:10px;background:' + t.cardBg + ';border:1px solid ' + t.cardBorder + ';cursor:pointer;">' +
                            '<div style="display:flex;justify-content:space-between;align-items:center;">' +
                                '<div><span style="font-size:12px;font-weight:700;color:' + THEME.accent + ';">存档 ' + (i+1) + '</span></div>' +
                                '<span style="font-size:11px;color:' + t.textTertiary + ';">' + esc(s.time) + '</span>' +
                            '</div>' +
                            '<div style="font-size:13px;color:' + t.textPrimary + ';margin-top:4px;font-weight:600;">' + esc(s.chTitle || '') + ' - ' + esc(s.nodeTitle || '') + '</div>' +
                        '</div>';
                }
            });
            slotsHtml += '</div>';
        }

        overlay.innerHTML =
            '<div style="background:' + t.bg + ';border-radius:18px;width:100%;max-width:400px;max-height:80vh;overflow-y:auto;padding:20px 16px;">' +
                '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">' +
                    '<div style="font-size:16px;font-weight:700;color:' + t.textPrimary + ';">读取进度</div>' +
                    '<div onclick="document.getElementById(\'qiyu-vn-load\').remove();" style="width:28px;height:28px;border-radius:50%;background:' + t.mutedBg + ';display:flex;align-items:center;justify-content:center;color:' + t.textPrimary + ';cursor:pointer;font-size:14px;">×</div>' +
                '</div>' +
                slotsHtml +
            '</div>';

        overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };
        document.body.appendChild(overlay);
    }

    function doLoad(slotIdx) {
        var slot = getSaveSlot(slotIdx);
        if (!slot) { alert('存档为空'); return; }
        var lm = document.getElementById('qiyu-vn-load');
        if (lm) lm.remove();
        var vn = document.getElementById('qiyu-vn');
        if (vn) vn.remove();
        startVN(slot.catId, slot.chIdx, slot.nodeId);
    }

    /* ---------- 素材库管理界面 ---------- */
    var assetPickerCallback = null;
    var assetPickerCategory = null;

    function openAssetLibrary(category, callback) {
        assetPickerCategory = category;
        assetPickerCallback = callback;
        var t = getTheme();
        var overlay = document.getElementById('qiyu-asset-lib');
        if (overlay) overlay.remove();

        overlay = document.createElement('div');
        overlay.id = 'qiyu-asset-lib';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:9999999999;background:' + t.bg + ';overflow-y:auto;-webkit-overflow-scrolling:touch;';

        var assets = loadAssets();
        var list = assets[category] || [];
        var isScene = category === 'scenes';
        var title = isScene ? '场景素材库' : '立绘素材库';

        var gridHtml = '';
        if (list.length === 0) {
            gridHtml = '<div style="padding:60px 20px;text-align:center;font-size:13px;color:' + t.textTertiary + ';">还没有素材，点击下方 + 添加</div>';
        } else {
            gridHtml = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:12px;">';
            list.forEach(function(a) {
                var aspect = isScene ? 'aspect-ratio:9/16;' : 'aspect-ratio:3/4;';
                gridHtml +=
                    '<div style="border-radius:10px;overflow:hidden;border:1px solid ' + t.cardBorder + ';background:' + t.cardBg + ';">' +
                        '<div onclick="QiyuStory.pickAsset(\'' + a.id + '\')" style="' + aspect + 'overflow:hidden;cursor:pointer;">' +
                            '<img src="' + a.data + '" style="width:100%;height:100%;object-fit:cover;" />' +
                        '</div>' +
                        '<div style="padding:6px 8px;">' +
                            '<div style="font-size:11px;color:' + t.textPrimary + ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + esc(a.name) + '</div>' +
                            '<div style="display:flex;gap:6px;margin-top:4px;">' +
                                '<div onclick="QiyuStory.renameAssetPrompt(\'' + a.id + '\')" style="font-size:10px;color:' + t.textSecondary + ';cursor:pointer;">重命名</div>' +
                                '<div onclick="QiyuStory.deleteAssetConfirm(\'' + a.id + '\')" style="font-size:10px;color:#E0493B;cursor:pointer;">删除</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>';
            });
            gridHtml += '</div>';
        }

        overlay.innerHTML =
            '<div style="position:sticky;top:0;z-index:10;display:flex;align-items:center;gap:12px;padding:calc(env(safe-area-inset-top,0px) + 12px) 16px 12px;background:' + t.bg + ';border-bottom:1px solid ' + t.cardBorder + ';">' +
                '<div onclick="QiyuStory.closeAssetLib()" style="width:32px;height:32px;border-radius:50%;background:' + t.mutedBg + ';display:flex;align-items:center;justify-content:center;font-size:15px;color:' + t.textPrimary + ';cursor:pointer;flex-shrink:0;">×</div>' +
                '<div style="flex:1;font-size:16px;font-weight:600;color:' + t.textPrimary + ';">' + title + ' · ' + list.length + '</div>' +
            '</div>' +
            '<div style="padding:12px 16px;">' +
                '<label style="display:block;padding:14px;border-radius:12px;border:2px dashed ' + t.cardBorder + ';text-align:center;cursor:pointer;background:' + t.cardBg + ';">' +
                    '<div style="font-size:22px;">📷</div>' +
                    '<div style="font-size:13px;color:' + t.textSecondary + ';margin-top:4px;">点击从相册选择图片添加</div>' +
                    '<input type="file" accept="image/*" style="display:none;" onchange="QiyuStory.uploadAsset(this.files[0])" />' +
                '</label>' +
            '</div>' +
            gridHtml +
            '<div style="height:40px;"></div>';

        document.body.appendChild(overlay);
    }

    function closeAssetLib() {
        var el = document.getElementById('qiyu-asset-lib');
        if (el) el.remove();
        assetPickerCallback = null;
    }

    function uploadAsset(file) {
        if (!file) return;
        var name = file.name.replace(/\.[^.]+$/, '');
        var maxWidth = assetPickerCategory === 'scenes' ? 1080 : 800;
        processImage(file, maxWidth, 0, 0, function(data) {
            var asset = addAsset(assetPickerCategory, name, data);
            closeAssetLib();
            openAssetLibrary(assetPickerCategory, assetPickerCallback);
        });
    }

    function pickAsset(id) {
        var assets = loadAssets();
        var found = null;
        (assets[assetPickerCategory] || []).forEach(function(a) { if (a.id === id) found = a; });
        if (found && assetPickerCallback) {
            assetPickerCallback(found);
            closeAssetLib();
        }
    }

    function renameAssetPrompt(id) {
        var name = prompt('输入新名称：');
        if (name && name.trim()) {
            renameAsset(id, name.trim());
            closeAssetLib();
            openAssetLibrary(assetPickerCategory, assetPickerCallback);
        }
    }

    function deleteAssetConfirm(id) {
        if (confirm('确定删除这个素材？')) {
            deleteAsset(id);
            closeAssetLib();
            openAssetLibrary(assetPickerCategory, assetPickerCallback);
        }
    }

    /* 从素材库选择，填充到指定 hidden input + 预览区 */
    function pickFromLibrary(category, inputId, previewId) {
        openAssetLibrary(category, function(asset) {
            var input = document.getElementById(inputId);
            if (input) input.value = asset.data;
            var preview = document.getElementById(previewId);
            if (preview) {
                preview.innerHTML = '<img src="' + asset.data + '" style="width:100%;border-radius:8px;max-height:140px;object-fit:cover;margin-bottom:6px;" />';
            }
        });
    }

    /* ---------- VN 节点编辑器 ---------- */
    function openVNEditor(catId, chIdx) {
        if (!storyData) storyData = loadData();
        var cat = getCat(catId);
        if (!cat || !cat.chapters[chIdx]) return;
        var ch = cat.chapters[chIdx];
        if (!ch.vnNodes) ch.vnNodes = [];
        var t = getTheme();

        var ce = document.getElementById('qiyu-chapter-edit');
        if (ce) ce.remove();

        var overlay = document.createElement('div');
        overlay.id = 'qiyu-vn-editor';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:999999999;background:' + t.bg + ';overflow-y:auto;-webkit-overflow-scrolling:touch;';

        var nodesHtml = '';
        ch.vnNodes.forEach(function(n, i) {
            var typeLabel = n.type === 'dialog' ? '对话' : n.type === 'narrate' ? '旁白' : n.type === 'choice' ? '分支' : '结束';
            nodesHtml +=
                '<div style="display:flex;align-items:flex-start;gap:8px;padding:10px 12px;border-bottom:1px solid ' + t.cardBorder + ';">' +
                    '<div style="width:24px;height:24px;border-radius:6px;background:' + THEME.accentLight + ';display:flex;align-items:center;justify-content:center;font-size:10px;color:' + THEME.accent + ';flex-shrink:0;margin-top:2px;">' + (i+1) + '</div>' +
                    '<div style="flex:1;min-width:0;cursor:pointer;" onclick="QiyuStory.editVNNode(\'' + catId + '\',' + chIdx + ',' + i + ')">' +
                        '<div style="font-size:12px;color:' + THEME.accent + ';font-weight:700;">' + typeLabel + ' · ' + esc(n.id) + '</div>' +
                        '<div style="font-size:13px;color:' + t.textPrimary + ';margin-top:2px;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">' + esc(n.text || (n.type === 'choice' ? ('选项 ×' + (n.choices ? n.choices.length : 0)) : (n.type === 'end' ? (n.title || '本章完') : ''))) + '</div>' +
                    '</div>' +
                    '<div onclick="QiyuStory.deleteVNNode(\'' + catId + '\',' + chIdx + ',' + i + ')" style="padding:4px 8px;color:#E0493B;cursor:pointer;font-size:16px;">×</div>' +
                '</div>';
        });
        if (ch.vnNodes.length === 0) {
            nodesHtml = '<div style="padding:40px 16px;text-align:center;font-size:12px;color:' + t.textTertiary + ';">还没有文游节点，点击下方 + 添加</div>';
        }

        overlay.innerHTML =
            '<div style="position:sticky;top:0;z-index:10;display:flex;align-items:center;gap:12px;padding:calc(env(safe-area-inset-top,0px) + 12px) 16px 12px;background:' + t.bg + ';border-bottom:1px solid ' + t.cardBorder + ';">' +
                '<div onclick="document.getElementById(\'qiyu-vn-editor\').remove();QiyuStory.editChapter(\'' + catId + '\',' + chIdx + ')" style="width:32px;height:32px;border-radius:50%;background:' + t.mutedBg + ';display:flex;align-items:center;justify-content:center;font-size:15px;color:' + t.textPrimary + ';cursor:pointer;flex-shrink:0;">←</div>' +
                '<div style="flex:1;">' +
                    '<div style="font-size:16px;font-weight:600;color:' + t.textPrimary + ';">编辑文游节点</div>' +
                    '<div style="font-size:11px;color:' + t.textSecondary + ';margin-top:2px;">' + esc(ch.title) + ' · ' + ch.vnNodes.length + ' 个节点</div>' +
                '</div>' +
            '</div>' +
            '<div style="padding:8px 0 80px;">' + nodesHtml + '</div>' +
            '<div onclick="QiyuStory.addVNNodeForm(\'' + catId + '\',' + chIdx + ')" style="position:fixed;bottom:calc(env(safe-area-inset-bottom,0px) + 20px);right:20px;width:48px;height:48px;border-radius:50%;background:' + THEME.accent + ';display:flex;align-items:center;justify-content:center;color:#fff;font-size:22px;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,0.15);z-index:20;">+</div>';

        document.body.appendChild(overlay);
    }

    function addVNNodeForm(catId, chIdx) {
        var t = getTheme();
        var overlay = document.createElement('div');
        overlay.id = 'qiyu-vn-node-form';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:999999999;background:rgba(0,0,0,0.4);display:flex;align-items:flex-end;';

        var html =
            '<div style="background:' + t.cardBg + ';width:100%;border-radius:20px 20px 0 0;padding:24px 20px calc(env(safe-area-inset-bottom,0px) + 24px);max-height:85vh;overflow-y:auto;">' +
                '<div style="font-size:16px;font-weight:600;color:' + t.textPrimary + ';margin-bottom:16px;">添加文游节点</div>' +
                '<div style="margin-bottom:14px;"><label style="display:block;font-size:12px;font-weight:500;color:' + t.textSecondary + ';margin-bottom:6px;">节点ID（唯一，跳转用）</label><input id="vnf-id" type="text" placeholder="如：node_start" style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid ' + t.cardBorder + ';background:' + t.bg + ';color:' + t.textPrimary + ';font-size:14px;font-family:inherit;box-sizing:border-box;" /></div>' +
                '<div style="margin-bottom:14px;"><label style="display:block;font-size:12px;font-weight:500;color:' + t.textSecondary + ';margin-bottom:6px;">类型</label><select id="vnf-type" onchange="vnToggleForm()" style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid ' + t.cardBorder + ';background:' + t.bg + ';color:' + t.textPrimary + ';font-size:14px;font-family:inherit;box-sizing:border-box;"><option value="dialog">对话（角色说话+可选立绘）</option><option value="narrate">旁白（纯叙述，无角色）</option><option value="choice">分支选项</option><option value="end">结束</option></select></div>' +
                '<div id="vnf-fields-dialog">' +
                    '<div style="margin-bottom:14px;"><label style="display:block;font-size:12px;font-weight:500;color:' + t.textSecondary + ';margin-bottom:6px;">角色名</label><input id="vnf-char" type="text" placeholder="如：祁煜 / 我" style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid ' + t.cardBorder + ';background:' + t.bg + ';color:' + t.textPrimary + ';font-size:14px;font-family:inherit;box-sizing:border-box;" /></div>' +
                    '<div style="margin-bottom:14px;"><label style="display:block;font-size:12px;font-weight:500;color:' + t.textSecondary + ';margin-bottom:6px;">立绘（可留空）</label>' +
                        '<div id="vnf-portrait-preview"></div>' +
                        '<div onclick="QiyuStory.pickFromLibrary(\'portraits\',\'vnf-portrait\',\'vnf-portrait-preview\')" style="padding:10px 12px;border-radius:8px;border:1px solid ' + t.cardBorder + ';background:' + t.bg + ';color:' + THEME.accent + ';font-size:13px;text-align:center;cursor:pointer;margin-top:6px;">从立绘素材库选择</div>' +
                        '<input type="hidden" id="vnf-portrait" value="" />' +
                    '</div>' +
                    '<div style="margin-bottom:14px;"><label style="display:block;font-size:12px;font-weight:500;color:' + t.textSecondary + ';margin-bottom:6px;">立绘位置</label><select id="vnf-pos" style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid ' + t.cardBorder + ';background:' + t.bg + ';color:' + t.textPrimary + ';font-size:14px;font-family:inherit;box-sizing:border-box;"><option value="left">左侧</option><option value="right">右侧</option></select></div>' +
                    '<div style="margin-bottom:14px;"><label style="display:block;font-size:12px;font-weight:500;color:' + t.textSecondary + ';margin-bottom:6px;">背景图（可留空）</label>' +
                        '<div id="vnf-bg-preview"></div>' +
                        '<div onclick="QiyuStory.pickFromLibrary(\'scenes\',\'vnf-bg\',\'vnf-bg-preview\')" style="padding:10px 12px;border-radius:8px;border:1px solid ' + t.cardBorder + ';background:' + t.bg + ';color:' + THEME.accent + ';font-size:13px;text-align:center;cursor:pointer;margin-top:6px;">从场景素材库选择</div>' +
                        '<input type="hidden" id="vnf-bg" value="" />' +
                    '</div>' +
                    '<div style="margin-bottom:14px;"><label style="display:block;font-size:12px;font-weight:500;color:' + t.textSecondary + ';margin-bottom:6px;">台词文本</label><textarea id="vnf-text" placeholder="写台词或叙述内容" style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid ' + t.cardBorder + ';background:' + t.bg + ';color:' + t.textPrimary + ';font-size:14px;font-family:inherit;box-sizing:border-box;min-height:80px;resize:vertical;"></textarea></div>' +
                    '<div style="margin-bottom:20px;"><label style="display:block;font-size:12px;font-weight:500;color:' + t.textSecondary + ';margin-bottom:6px;">下一节点ID（留空=结束）</label><input id="vnf-next" type="text" placeholder="如：node_02" style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid ' + t.cardBorder + ';background:' + t.bg + ';color:' + t.textPrimary + ';font-size:14px;font-family:inherit;box-sizing:border-box;" /></div>' +
                '</div>' +
                '<div style="display:flex;gap:12px;">' +
                    '<div onclick="document.getElementById(\'qiyu-vn-node-form\').remove();" style="flex:1;padding:12px;border-radius:10px;background:' + t.mutedBg + ';color:' + t.textPrimary + ';font-size:14px;font-weight:500;text-align:center;cursor:pointer;">取消</div>' +
                    '<div onclick="QiyuStory.saveNewVNNode(\'' + catId + '\',' + chIdx + ')" style="flex:1;padding:12px;border-radius:10px;background:' + THEME.accent + ';color:#fff;font-size:14px;font-weight:500;text-align:center;cursor:pointer;">保存</div>' +
                '</div>' +
            '</div>';

        overlay.innerHTML = html + '<script>function vnToggleForm(){}<\/script>';
        overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };
        document.body.appendChild(overlay);
    }

    function saveNewVNNode(catId, chIdx) {
        if (!storyData) storyData = loadData();
        var cat = getCat(catId);
        if (!cat || !cat.chapters[chIdx]) return;
        var ch = cat.chapters[chIdx];
        if (!ch.vnNodes) ch.vnNodes = [];

        var id = document.getElementById('vnf-id').value.trim();
        var type = document.getElementById('vnf-type').value;
        if (!id) { alert('请输入节点ID'); return; }
        if (ch.vnNodes.some(function(n) { return n.id === id; })) { alert('节点ID已存在，请换一个'); return; }

        var node = { id: id, type: type };

        // 立绘和背景从 hidden input 读取 base64
        var portraitVal = (type === 'dialog' || type === 'narrate') && document.getElementById('vnf-portrait') ? document.getElementById('vnf-portrait').value : '';
        var bgVal = (type === 'dialog' || type === 'narrate') && document.getElementById('vnf-bg') ? document.getElementById('vnf-bg').value : '';
        if (portraitVal) node.portrait = portraitVal;
        if (bgVal) node.bg = bgVal;

        if (type === 'dialog' || type === 'narrate') {
            node.character = document.getElementById('vnf-char').value.trim() || (type === 'dialog' ? '' : null);
            var posEl = document.getElementById('vnf-pos');
            node.position = posEl ? posEl.value : 'left';
            node.text = document.getElementById('vnf-text').value;
            node.next = document.getElementById('vnf-next').value.trim() || null;
        } else if (type === 'choice') {
            node.choices = [];
        } else if (type === 'end') {
            node.title = '本章完';
        }
        ch.vnNodes.push(node);
        saveData(storyData);
        var f = document.getElementById('qiyu-vn-node-form');
        if (f) f.remove();
        var ed = document.getElementById('qiyu-vn-editor');
        if (ed) ed.remove();
        openVNEditor(catId, chIdx);

        if (type === 'choice') {
            alert('分支节点已添加，请在列表中点击进入编辑选项及跳转目标');
        }
    }

    function editVNNode(catId, chIdx, nIdx) {
        if (!storyData) storyData = loadData();
        var cat = getCat(catId);
        if (!cat || !cat.chapters[chIdx] || !cat.chapters[chIdx].vnNodes) return;
        var node = cat.chapters[chIdx].vnNodes[nIdx];
        var t = getTheme();

        var ed = document.getElementById('qiyu-vn-editor');
        if (ed) ed.remove();

        var overlay = document.createElement('div');
        overlay.id = 'qiyu-vn-node-edit';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:999999999;background:' + t.bg + ';overflow-y:auto;-webkit-overflow-scrolling:touch;';

        var previewImg = function(data) { return data ? '<img src="' + data + '" style="width:100%;border-radius:8px;max-height:120px;object-fit:cover;" />' : ''; };

        // 分支选项 UI
        var choicesHtml = '';
        if (node.type === 'choice') {
            choicesHtml += '<div style="font-size:12px;font-weight:700;color:' + THEME.accent + ';padding:8px 0;">分支选项</div>';
            (node.choices || []).forEach(function(c, i) {
                choicesHtml +=
                    '<div style="margin-bottom:10px;padding:10px;border-radius:8px;border:1px solid ' + t.cardBorder + ';background:' + t.bg + ';">' +
                        '<div style="margin-bottom:6px;"><input class="choice-text" data-idx="' + i + '" type="text" placeholder="选项文字" value="' + esc(c.text || '') + '" style="width:100%;padding:8px 10px;border-radius:6px;border:1px solid ' + t.cardBorder + ';background:' + t.cardBg + ';color:' + t.textPrimary + ';font-size:13px;box-sizing:border-box;" /></div>' +
                        '<div><input class="choice-next" data-idx="' + i + '" type="text" placeholder="跳转节点ID" value="' + esc(c.next || '') + '" style="width:100%;padding:8px 10px;border-radius:6px;border:1px solid ' + t.cardBorder + ';background:' + t.cardBg + ';color:' + t.textPrimary + ';font-size:13px;box-sizing:border-box;" /></div>' +
                    '</div>';
            });
            choicesHtml += '<div onclick="QiyuStory.addChoice(\'' + catId + '\',' + chIdx + ',' + nIdx + ')" style="padding:8px;border-radius:8px;border:1px dashed ' + t.cardBorder + ';text-align:center;font-size:12px;color:' + t.textSecondary + ';cursor:pointer;">+ 添加选项</div>';
        }

        var endFields = node.type === 'end' ?
            '<div style="margin-bottom:14px;"><label style="display:block;font-size:12px;font-weight:500;color:' + t.textSecondary + ';margin-bottom:6px;">标题</label><input id="ne-title" type="text" value="' + esc(node.title || '') + '" placeholder="本章完" style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid ' + t.cardBorder + ';background:' + t.cardBg + ';color:' + t.textPrimary + ';font-size:14px;font-family:inherit;box-sizing:border-box;" /></div>' : '';

        var dialogNarrateFields = (node.type === 'dialog' || node.type === 'narrate') ?
            '<div style="margin-bottom:14px;"><label style="display:block;font-size:12px;font-weight:500;color:' + t.textSecondary + ';margin-bottom:6px;">角色名</label><input id="ne-char" type="text" value="' + esc(node.character || '') + '" style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid ' + t.cardBorder + ';background:' + t.cardBg + ';color:' + t.textPrimary + ';font-size:14px;font-family:inherit;box-sizing:border-box;" /></div>' +
            '<div style="margin-bottom:14px;"><label style="display:block;font-size:12px;font-weight:500;color:' + t.textSecondary + ';margin-bottom:6px;">立绘</label>' +
                '<div id="ne-portrait-preview">' + previewImg(node.portrait || '') + '</div>' +
                '<div onclick="QiyuStory.pickFromLibrary(\'portraits\',\'ne-portrait\',\'ne-portrait-preview\')" style="padding:10px 12px;border-radius:8px;border:1px solid ' + t.cardBorder + ';background:' + t.cardBg + ';color:' + THEME.accent + ';font-size:13px;text-align:center;cursor:pointer;margin-top:6px;">从立绘素材库选择</div>' +
                '<input type="hidden" id="ne-portrait" value="' + esc(node.portrait || '') + '" /></div>' +
            '<div style="margin-bottom:14px;"><label style="display:block;font-size:12px;font-weight:500;color:' + t.textSecondary + ';margin-bottom:6px;">立绘位置</label><select id="ne-pos" style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid ' + t.cardBorder + ';background:' + t.cardBg + ';color:' + t.textPrimary + ';font-size:14px;font-family:inherit;box-sizing:border-box;"><option value="left"' + (node.position !== 'right' ? ' selected' : '') + '>左侧</option><option value="right"' + (node.position === 'right' ? ' selected' : '') + '>右侧</option></select></div>' +
            '<div style="margin-bottom:14px;"><label style="display:block;font-size:12px;font-weight:500;color:' + t.textSecondary + ';margin-bottom:6px;">背景图</label>' +
                '<div id="ne-bg-preview">' + previewImg(node.bg || '') + '</div>' +
                '<div onclick="QiyuStory.pickFromLibrary(\'scenes\',\'ne-bg\',\'ne-bg-preview\')" style="padding:10px 12px;border-radius:8px;border:1px solid ' + t.cardBorder + ';background:' + t.cardBg + ';color:' + THEME.accent + ';font-size:13px;text-align:center;cursor:pointer;margin-top:6px;">从场景素材库选择</div>' +
                '<input type="hidden" id="ne-bg" value="' + esc(node.bg || '') + '" /></div>' +
            '<div style="margin-bottom:20px;"><label style="display:block;font-size:12px;font-weight:500;color:' + t.textSecondary + ';margin-bottom:6px;">文本内容</label><textarea id="ne-text" style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid ' + t.cardBorder + ';background:' + t.cardBg + ';color:' + t.textPrimary + ';font-size:14px;font-family:inherit;box-sizing:border-box;min-height:100px;resize:vertical;">' + esc(node.text || '') + '</textarea></div>' +
            (node.type !== 'choice' ? '<div style="margin-bottom:20px;"><label style="display:block;font-size:12px;font-weight:500;color:' + t.textSecondary + ';margin-bottom:6px;">下一节点ID</label><input id="ne-next" type="text" value="' + esc(node.next || '') + '" style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid ' + t.cardBorder + ';background:' + t.cardBg + ';color:' + t.textPrimary + ';font-size:14px;font-family:inherit;box-sizing:border-box;" /></div>' : '') +
            choicesHtml
            : '';

        overlay.innerHTML =
            '<div style="position:sticky;top:0;z-index:10;display:flex;align-items:center;gap:12px;padding:calc(env(safe-area-inset-top,0px) + 12px) 16px 12px;background:' + t.bg + ';border-bottom:1px solid ' + t.cardBorder + ';">' +
                '<div onclick="document.getElementById(\'qiyu-vn-node-edit\').remove();QiyuStory.openVNEditor(\'' + catId + '\',' + chIdx + ')" style="width:32px;height:32px;border-radius:50%;background:' + t.mutedBg + ';display:flex;align-items:center;justify-content:center;font-size:15px;color:' + t.textPrimary + ';cursor:pointer;flex-shrink:0;">←</div>' +
                '<div style="flex:1;font-size:16px;font-weight:600;color:' + t.textPrimary + ';">编辑节点 · ' + esc(node.id) + '</div>' +
            '</div>' +
            '<div style="padding:16px;">' +
                '<div style="margin-bottom:14px;"><label style="display:block;font-size:12px;font-weight:500;color:' + t.textSecondary + ';margin-bottom:6px;">节点ID</label><input id="ne-id" type="text" value="' + esc(node.id) + '" style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid ' + t.cardBorder + ';background:' + t.cardBg + ';color:' + t.textPrimary + ';font-size:14px;font-family:inherit;box-sizing:border-box;" /></div>' +
                endFields +
                dialogNarrateFields +
                '<div onclick="QiyuStory.saveVNNodeEdit(\'' + catId + '\',' + chIdx + ',' + nIdx + ')" style="padding:12px;border-radius:10px;background:' + THEME.accent + ';color:#fff;font-size:14px;font-weight:500;text-align:center;cursor:pointer;">保存</div>' +
            '</div>';

        document.body.appendChild(overlay);
    }

    function saveVNNodeEdit(catId, chIdx, nIdx) {
        if (!storyData) storyData = loadData();
        var cat = getCat(catId);
        if (!cat || !cat.chapters[chIdx] || !cat.chapters[chIdx].vnNodes) return;
        var node = cat.chapters[chIdx].vnNodes[nIdx];

        var newId = document.getElementById('ne-id').value.trim();
        if (!newId) { alert('节点ID不能为空'); return; }

        var finish = function() {
            node.id = newId;
            // 立绘和背景从 hidden input 读取
            var portraitVal = (node.type === 'dialog' || node.type === 'narrate') && document.getElementById('ne-portrait') ? document.getElementById('ne-portrait').value : '';
            var bgVal = (node.type === 'dialog' || node.type === 'narrate') && document.getElementById('ne-bg') ? document.getElementById('ne-bg').value : '';
            if (portraitVal) node.portrait = portraitVal; else delete node.portrait;
            if (bgVal) node.bg = bgVal; else delete node.bg;
            if (node.type === 'end') {
                node.title = document.getElementById('ne-title').value.trim() || '本章完';
            }
            if (node.type === 'dialog' || node.type === 'narrate') {
                node.character = document.getElementById('ne-char').value.trim() || null;
                node.position = document.getElementById('ne-pos').value || 'left';
                node.text = document.getElementById('ne-text').value;
                node.next = document.getElementById('ne-next').value.trim() || null;
            }
            if (node.type === 'choice') {
                var texts = document.querySelectorAll('.choice-text');
                var newChoices = [];
                texts.forEach(function(el) {
                    var idx = parseInt(el.getAttribute('data-idx'));
                    var text = el.value.trim();
                    if (text) {
                        var nextEl = document.querySelector('.choice-next[data-idx="' + idx + '"]');
                        newChoices.push({ text: text, next: (nextEl && nextEl.value.trim()) || null });
                    }
                });
                node.choices = newChoices;
            }
            saveData(storyData);
            var ed = document.getElementById('qiyu-vn-node-edit');
            if (ed) ed.remove();
            openVNEditor(catId, chIdx);
        };

        finish();
    }

    function addChoice(catId, chIdx, nIdx) {
        if (!storyData) storyData = loadData();
        var cat = getCat(catId);
        if (!cat || !cat.chapters[chIdx] || !cat.chapters[chIdx].vnNodes) return;
        var node = cat.chapters[chIdx].vnNodes[nIdx];
        if (node.type !== 'choice') return;
        if (!node.choices) node.choices = [];
        node.choices.push({ text: '', next: '' });
        saveData(storyData);
        var ed = document.getElementById('qiyu-vn-node-edit');
        if (ed) ed.remove();
        editVNNode(catId, chIdx, nIdx);
    }

    function deleteVNNode(catId, chIdx, nIdx) {
        if (!confirm('确定删除这个文游节点？')) return;
        if (!storyData) storyData = loadData();
        var cat = getCat(catId);
        if (!cat || !cat.chapters[chIdx] || !cat.chapters[chIdx].vnNodes) return;
        cat.chapters[chIdx].vnNodes.splice(nIdx, 1);
        saveData(storyData);
        var ed = document.getElementById('qiyu-vn-editor');
        if (ed) ed.remove();
        openVNEditor(catId, chIdx);
    }

    /* ---------- 修改 openChapter：有 vnNodes 走文游 ---------- */
    var _origOpenChapter = openChapter;
    openChapter = function(catId, index) {
        if (!storyData) storyData = loadData();
        var cat = getCat(catId);
        if (!cat || !cat.chapters || !cat.chapters[index]) return;
        var ch = cat.chapters[index];

        if (ch.vnNodes && ch.vnNodes.length > 0) {
            // 检查是否有未完成存档
            var hasSave = loadSaves().some(function(s) { return s && s.catId === catId && s.chIdx === index; });
            if (hasSave && confirm('本章有存档，是否继续上次进度？')) {
                // 找最近一个存档
                var slots = loadSaves();
                var lastSlot = null;
                slots.forEach(function(s) { if (s && s.catId === catId && s.chIdx === index) lastSlot = s; });
                if (lastSlot) { startVN(catId, index, lastSlot.nodeId); return; }
            }
            startVN(catId, index);
            return;
        }
        // 否则走原来的场景列表
        _origOpenChapter(catId, index);
    };

    /* ========== 主线剧情数据初始化 ========== */
    function initMainStoryline() {
        if (!storyData) storyData = loadData();
        var cat = getCat('main');
        if (!cat) return;

        // 只在空数据时初始化
        if (cat.chapters && cat.chapters.length > 0) return;

        cat.chapters = [
            // 篇一：于深空之下
            { arc: '于深空之下', title: '焰尾鱼', summary: '晴空广场偶遇祁煜，焰尾鱼事件', status: 'confirmed', scenes: [
                { title: '晴空广场', perspective: 'first', content: '' },
                { title: '焰尾鱼', perspective: 'first', content: '' },
                { title: '初识', perspective: 'first', content: '' }
            ], vnNodes: [
                { id: 'n1', type: 'narrate', character: null, position: 'left', text: '阳光明媚的午后，晴空广场人来人往。巨大的电子屏上滚动播放着今日消息，海风带着咸意掠过发梢。' , next: 'n2' },
                { id: 'n2', type: 'narrate', character: null, position: 'left', text: '我在人群中漫无目的地走着——或者说，是被某种奇怪的预感牵引着脚步。', next: 'n3' },
                { id: 'n3', type: 'dialog', character: '我', position: 'left', text: '（……总觉得，今天会遇到什么特别的事。）', next: 'n4' },
                { id: 'n4', type: 'dialog', character: '我', position: 'left', text: '哎，那边怎么围了一群人？好像在看什么奇怪的东西……', next: 'n5' },
                { id: 'n5', type: 'narrate', character: null, position: 'left', text: '我挤开人群，看到广场中央的喷泉池边——水正以一种违背常识的方式，凝成一条红色的鱼尾。', next: 'n6' },
                { id: 'n6', type: 'dialog', character: '我', position: 'left', text: '那是……鱼的尾巴？在空中飘着？！', next: 'n7' },
                { id: 'n7', type: 'narrate', character: null, position: 'left', text: '焰尾鱼在半空优雅地摆动尾鳍，像是在寻找什么。', next: 'n8' },
                { id: 'n8', type: 'dialog', character: '祁煜', position: 'right', text: '别靠太近。', next: 'n9' },
                { id: 'n9', type: 'narrate', character: null, position: 'left', text: '低沉的男声从身侧传来。我转过头——一个穿着深蓝衬衫、气质沉静的男人正站在我旁边，目光锁定那条焰尾鱼。', next: 'n10' },
                { id: 'n10', type: 'choice', choices: [
                    { text: '你是谁？为什么要管这种事？', next: 'b1_a' },
                    { text: '谢谢提醒。你……认识这条鱼？', next: 'b1_b' },
                    { text: '（退后一步，谨慎地观察他）', next: 'b1_c' }
                ] },
                // 分支 A
                { id: 'b1_a', type: 'dialog', character: '祁煜', position: 'right', text: '祁煜。——至于我为什么要管，和你没关系。', next: 'merge1' },
                // 分支 B
                { id: 'b1_b', type: 'dialog', character: '祁煜', position: 'right', text: '……算不上认识。但它属于不该出现在这里的东西。', next: 'merge1' },
                // 分支 C
                { id: 'b1_c', type: 'dialog', character: '祁煜', position: 'right', text: '（微微瞥了你一眼）……别紧张，我对普通人没兴趣。', next: 'merge1' },
                // 汇合
                { id: 'merge1', type: 'narrate', character: null, position: 'left', text: '话音未落，焰尾鱼突然发出尖锐的嘶鸣，猛地向人群扑了过去！', next: 'n11' },
                { id: 'n11', type: 'dialog', character: '祁煜', position: 'right', text: '啧。', next: 'n12' },
                { id: 'n12', type: 'narrate', character: null, position: 'left', text: '他瞬间抬手，指间浮现一颗暗红色的光粒——焰尾鱼应声被定在半空，化作细碎的火屑消散。', next: 'n13' },
                { id: 'n13', type: 'dialog', character: '我', position: 'left', text: '（刚才那是什么……？他是猎人？还是……）', next: 'n14' },
                { id: 'n14', type: 'dialog', character: '祁煜', position: 'right', text: '你看到了。', next: 'n15' },
                { id: 'n15', type: 'narrate', character: null, position: 'left', text: '他转过头看向我，那双暗红色的瞳孔里，像是映着深海里的火光。', next: 'n16' },
                { id: 'n16', type: 'dialog', character: '祁煜', position: 'right', text: '记住，从今天开始，你已经算半个「圈内人」了。', next: 'end1' },
                { id: 'end1', type: 'end', title: '第一章 · 焰尾鱼 · 完', text: '（剧情演示节点结束，后续可在编辑器中继续补充）' }
            ] },
            { arc: '于深空之下', title: '油画幻境', summary: '雷温收藏家家中调查会引发幻境的油画，画作者是祁煜', status: 'confirmed', scenes: [
                { title: '雷温家', perspective: 'first', content: '' },
                { title: '油画与幻境', perspective: 'first', content: '' },
                { title: 'FLUX画廊', perspective: 'third', content: '' }
            ]},
            { arc: '于深空之下', title: '私人保镖', summary: '珊瑚石触发幻象，答应成为祁煜的私人保镖', status: 'confirmed', scenes: [
                { title: '珊瑚石', perspective: 'first', content: '' },
                { title: '血之媒介', perspective: 'first', content: '' },
                { title: '契约', perspective: 'first', content: '' }
            ]},
            { arc: '于深空之下', title: '出海·帽儿岛', summary: '祁煜带"我"前往帽儿岛猎杀流浪体磷龙取芯核', status: 'confirmed', scenes: [
                { title: '启航', perspective: 'first', content: '' },
                { title: '磷龙之战', perspective: 'first', content: '' }
            ]},
            { arc: '于深空之下', title: '海下月光', summary: '战后二人被卷入海中，祁煜化为人鱼将"我"带回海面——首次显人鱼真身', status: 'confirmed', scenes: [
                { title: '落海', perspective: 'first', content: '' },
                { title: '契约之力', perspective: 'first', content: '' },
                { title: '人鱼真身', perspective: 'first', content: '' }
            ]},
            { arc: '于深空之下', title: '日落银河', summary: '雷温去世后祁煜出席葬礼，继续调查珊瑚石与海神书线索', status: 'confirmed', scenes: [
                { title: '雷温葬礼', perspective: 'third', content: '' },
                { title: '珊瑚石与海神书', perspective: 'first', content: '' }
            ]},

            // 篇二～五（待补充）
            { arc: '久候狂欢之徒', title: '待补充', summary: '此篇章祁煜相关剧情待整理', status: 'unconfirmed', scenes: [] },
            { arc: '明日序言', title: '待补充', summary: '此篇章祁煜相关剧情待整理', status: 'unconfirmed', scenes: [] },
            { arc: '飞鸟回还日', title: '待补充', summary: '此篇章祁煜相关剧情待整理', status: 'unconfirmed', scenes: [] },
            { arc: '以寂灭，以新生', title: '待补充', summary: '此篇章祁煜相关剧情待整理', status: 'unconfirmed', scenes: [] },

            // 篇六：献给昨日之诗
            { arc: '献给昨日之诗', title: '被移植的世界', summary: '临空市异象频发，祁煜暗中寻找海神书封存的力量', status: 'confirmed', scenes: [
                { title: '异象', perspective: 'third', content: '' },
                { title: '海神书', perspective: 'third', content: '' },
                { title: '祁煜幼年', perspective: 'third', content: '' },
                { title: 'EVER暗线', perspective: 'third', content: '' }
            ]},
            { arc: '献给昨日之诗', title: '往日回溯', summary: '回溯者们、女神圣剑碑、Echo等节点，菲罗斯星与地球的时空关联', status: 'confirmed', scenes: [
                { title: '回溯者们', perspective: 'third', content: '' },
                { title: '女神圣剑碑', perspective: 'third', content: '' }
            ]},
            { arc: '献给昨日之诗', title: '徘徊者的回信', summary: '进入鲸落城，海边挽歌，回到祁煜前世故乡', status: 'confirmed', scenes: [
                { title: '鲸落城', perspective: 'first', content: '' },
                { title: '海边挽歌', perspective: 'first', content: '' }
            ]},
            { arc: '献给昨日之诗', title: '岔路的伊始', summary: '前世今生的汇合与分别——逆流而别、至涟漪处', status: 'confirmed', scenes: [
                { title: '旅程尽处', perspective: 'first', content: '' },
                { title: '潮信回声', perspective: 'first', content: '' },
                { title: '逆流而别', perspective: 'first', content: '' }
            ]},

            // 前世编年（利莫里亚线）
            { arc: '前世编年', title: '祭品与海神', summary: '"我"作为祭品被神使养大，困于神庙；年幼的最后一位海神祁煜自由受限', status: 'confirmed', scenes: [
                { title: '神庙中的祭品', perspective: 'first', content: '' },
                { title: '年幼的海神', perspective: 'third', content: '' }
            ]},
            { arc: '前世编年', title: '暴雨夜', summary: '"我"被丢下海，祁煜私自跑出来救起"我"，带回鲸落城，结为信徒', status: 'confirmed', scenes: [
                { title: '献祭', perspective: 'first', content: '' },
                { title: '祁煜救人', perspective: 'third', content: '' },
                { title: '鲸落城', perspective: 'first', content: '' }
            ]},
            { arc: '前世编年', title: '海底日出与海神祭典', summary: '二人看海底日出、逛海神祭典；祁煜将鳞片交给"我"', status: 'confirmed', scenes: [
                { title: '海底日出', perspective: 'first', content: '' },
                { title: '海神祭典', perspective: 'first', content: '' },
                { title: '鳞片', perspective: 'first', content: '' }
            ]},
            { arc: '前世编年', title: '利莫里亚契约', summary: '神殿缔结契约；祁煜获得海神之力后被控制，意识苏醒后将火种交给"我"', status: 'confirmed', scenes: [
                { title: '缔结契约', perspective: 'first', content: '' },
                { title: '海神之力的控制', perspective: 'third', content: '' },
                { title: '火种', perspective: 'first', content: '' }
            ]},
            { arc: '前世编年', title: '封印', summary: '得知不存在烛芯、利莫里亚注定灭亡，"我"用契约将祁煜封印在深海海底', status: 'confirmed', scenes: [
                { title: '真相', perspective: 'first', content: '' },
                { title: '封印', perspective: 'first', content: '' }
            ]},
            { arc: '前世编年', title: '万年后的重逢', summary: '"我"再次降生为海神新娘，被囚禁；祁煜被封印失忆，"我"是他唯一能听到的声音', status: 'confirmed', scenes: [
                { title: '再次降生', perspective: 'first', content: '' },
                { title: '囚禁', perspective: 'first', content: '' },
                { title: '跨越封印的声音', perspective: 'first', content: '' }
            ]},
            { arc: '前世编年', title: '解封', summary: '聆海仪式上"我"唱祭海歌，祁煜用海水将"我"带到封印处，"我"解开他的封印', status: 'confirmed', scenes: [
                { title: '聆海仪式', perspective: 'first', content: '' },
                { title: '解开封印', perspective: 'first', content: '' }
            ]},
            { arc: '前世编年', title: '海神冢', summary: '二人前往海神冢完成试炼，重铸断潮戟，"我"想起部分记忆', status: 'confirmed', scenes: [
                { title: '海神冢', perspective: 'first', content: '' },
                { title: '断潮戟', perspective: 'first', content: '' },
                { title: '记忆复苏', perspective: 'first', content: '' }
            ]},
            { arc: '前世编年', title: '第三月蚀·献心', summary: '祁煜力量耗尽即将陨灭，"我"用契约为祁煜献上自己的心；罗镜城颠倒回鲸落城', status: 'confirmed', scenes: [
                { title: '力量耗尽', perspective: 'first', content: '' },
                { title: '献心', perspective: 'first', content: '' },
                { title: '罗镜城颠倒', perspective: 'third', content: '' }
            ]},
            { arc: '前世编年', title: '金沙时期', summary: '海洋干涸三万年后，"我"成为菲罗斯星公主；祁煜被作为贡品送到"我"面前', status: 'unconfirmed', scenes: [
                { title: '三万年后', perspective: 'third', content: '' },
                { title: '贡品', perspective: 'first', content: '' },
                { title: '放走', perspective: 'first', content: '' }
            ]},
            { arc: '前世编年', title: '女巫与人鱼', summary: '祁煜献出逆鳞、人鱼之血与歌喉炼制魔药，让成为女巫的"我"变回人类', status: 'unconfirmed', scenes: [
                { title: '女巫', perspective: 'first', content: '' },
                { title: '逆鳞与魔药', perspective: 'third', content: '' },
                { title: '消散', perspective: 'first', content: '' }
            ]}
        ];

        saveData(storyData);
    }

    /* ========== 导出 API ========== */
    global.QiyuStory = {
        openStory: openStory,
        openCategory: openCategory,
        openChapter: openChapter,
        openScene: openScene,
        openSceneList: openSceneList,
        openCardDetail: openCardDetail,
        openChatDetail: openChatDetail,
        uploadHeroBg: uploadHeroBg,
        openEditor: openEditor,
        addChapterForm: addChapterForm,
        editChapter: editChapter,
        addSceneForm: addSceneForm,
        editScene: editScene,
        saveNewChapter: saveNewChapter,
        saveChapterEdit: saveChapterEdit,
        deleteChapter: deleteChapter,
        saveNewScene: saveNewScene,
        saveSceneEdit: saveSceneEdit,
        deleteScene: deleteScene,
        initMainStoryline: initMainStoryline,
        // 文游引擎
        startVN: startVN,
        vnAdvance: vnAdvance,
        vnChoice: vnChoice,
        vnBack: vnBack,
        vnSaveMenu: vnSaveMenu,
        doSave: doSave,
        vnLoadMenu: vnLoadMenu,
        doLoad: doLoad,
        // 文游编辑
        openVNEditor: openVNEditor,
        addVNNodeForm: addVNNodeForm,
        saveNewVNNode: saveNewVNNode,
        editVNNode: editVNNode,
        saveVNNodeEdit: saveVNNodeEdit,
        addChoice: addChoice,
        deleteVNNode: deleteVNNode,
        // 素材库
        openAssetLibrary: openAssetLibrary,
        closeAssetLib: closeAssetLib,
        uploadAsset: uploadAsset,
        pickAsset: pickAsset,
        renameAssetPrompt: renameAssetPrompt,
        deleteAssetConfirm: deleteAssetConfirm,
        pickFromLibrary: pickFromLibrary,
        getData: function() { if (!storyData) storyData = loadData(); return storyData; },
        saveData: function(data) { storyData = data; saveData(data); },
        resetHeroBg: function() {
            if (!storyData) storyData = loadData();
            storyData.heroBg = null;
            saveData(storyData);
            var root = document.getElementById('qiyu-story-root');
            if (root) { root.remove(); openStory(); }
        },
        addChapter: function(catId, chapter) {
            if (!storyData) storyData = loadData();
            var cat = getCat(catId);
            if (cat && cat.type === 'chapter') {
                if (!cat.chapters) cat.chapters = [];
                cat.chapters.push(chapter);
                saveData(storyData);
            }
        },
        addCard: function(catId, card) {
            if (!storyData) storyData = loadData();
            var cat = getCat(catId);
            if (cat && cat.type === 'card') {
                if (!cat.cards) cat.cards = [];
                cat.cards.push(card);
                saveData(storyData);
            }
        },
        addConversation: function(catId, conv) {
            if (!storyData) storyData = loadData();
            var cat = getCat(catId);
            if (cat && cat.type === 'chat') {
                if (!cat.conversations) cat.conversations = [];
                cat.conversations.push(conv);
                saveData(storyData);
            }
        },
        addPost: function(catId, post) {
            if (!storyData) storyData = loadData();
            var cat = getCat(catId);
            if (cat && cat.type === 'moments') {
                if (!cat.posts) cat.posts = [];
                cat.posts.push(post);
                saveData(storyData);
            }
        }
    };

    // 自动初始化主线数据
    setTimeout(function() {
        try { initMainStoryline(); } catch(e) { console.error('[qiyu-story] init error', e); }
        try {
            // 给已有数据但没文游节点的用户，补充注入焰尾鱼文游演示
            if (!storyData) storyData = loadData();
            var cat = getCat('main');
            if (cat && cat.chapters && cat.chapters[0] && cat.chapters[0].title === '焰尾鱼' && (!cat.chapters[0].vnNodes || cat.chapters[0].vnNodes.length === 0)) {
                cat.chapters[0].vnNodes = [
                    { id: 'n1', type: 'narrate', character: null, position: 'left', text: '阳光明媚的午后，晴空广场人来人往。巨大的电子屏上滚动播放着今日消息，海风带着咸意掠过发梢。' , next: 'n2' },
                    { id: 'n2', type: 'narrate', character: null, position: 'left', text: '我在人群中漫无目的地走着——或者说，是被某种奇怪的预感牵引着脚步。', next: 'n3' },
                    { id: 'n3', type: 'dialog', character: '我', position: 'left', text: '（……总觉得，今天会遇到什么特别的事。）', next: 'n4' },
                    { id: 'n4', type: 'dialog', character: '我', position: 'left', text: '哎，那边怎么围了一群人？好像在看什么奇怪的东西……', next: 'n5' },
                    { id: 'n5', type: 'narrate', character: null, position: 'left', text: '我挤开人群，看到广场中央的喷泉池边——水正以一种违背常识的方式，凝成一条红色的鱼尾。', next: 'n6' },
                    { id: 'n6', type: 'dialog', character: '我', position: 'left', text: '那是……鱼的尾巴？在空中飘着？！', next: 'n7' },
                    { id: 'n7', type: 'narrate', character: null, position: 'left', text: '焰尾鱼在半空优雅地摆动尾鳍，像是在寻找什么。', next: 'n8' },
                    { id: 'n8', type: 'dialog', character: '祁煜', position: 'right', text: '别靠太近。', next: 'n9' },
                    { id: 'n9', type: 'narrate', character: null, position: 'left', text: '低沉的男声从身侧传来。我转过头——一个穿着深蓝衬衫、气质沉静的男人正站在我旁边，目光锁定那条焰尾鱼。', next: 'n10' },
                    { id: 'n10', type: 'choice', choices: [
                        { text: '你是谁？为什么要管这种事？', next: 'b1_a' },
                        { text: '谢谢提醒。你……认识这条鱼？', next: 'b1_b' },
                        { text: '（退后一步，谨慎地观察他）', next: 'b1_c' }
                    ] },
                    { id: 'b1_a', type: 'dialog', character: '祁煜', position: 'right', text: '祁煜。——至于我为什么要管，和你没关系。', next: 'merge1' },
                    { id: 'b1_b', type: 'dialog', character: '祁煜', position: 'right', text: '……算不上认识。但它属于不该出现在这里的东西。', next: 'merge1' },
                    { id: 'b1_c', type: 'dialog', character: '祁煜', position: 'right', text: '（微微瞥了你一眼）……别紧张，我对普通人没兴趣。', next: 'merge1' },
                    { id: 'merge1', type: 'narrate', character: null, position: 'left', text: '话音未落，焰尾鱼突然发出尖锐的嘶鸣，猛地向人群扑了过去！', next: 'n11' },
                    { id: 'n11', type: 'dialog', character: '祁煜', position: 'right', text: '啧。', next: 'n12' },
                    { id: 'n12', type: 'narrate', character: null, position: 'left', text: '他瞬间抬手，指间浮现一颗暗红色的光粒——焰尾鱼应声被定在半空，化作细碎的火屑消散。', next: 'n13' },
                    { id: 'n13', type: 'dialog', character: '我', position: 'left', text: '（刚才那是什么……？他是猎人？还是……）', next: 'n14' },
                    { id: 'n14', type: 'dialog', character: '祁煜', position: 'right', text: '你看到了。', next: 'n15' },
                    { id: 'n15', type: 'narrate', character: null, position: 'left', text: '他转过头看向我，那双暗红色的瞳孔里，像是映着深海里的火光。', next: 'n16' },
                    { id: 'n16', type: 'dialog', character: '祁煜', position: 'right', text: '记住，从今天开始，你已经算半个「圈内人」了。', next: 'end1' },
                    { id: 'end1', type: 'end', title: '第一章 · 焰尾鱼 · 完', text: '（剧情演示节点结束，后续可在编辑器中继续补充）' }
                ];
                saveData(storyData);
            }
        } catch(e) { console.error('[qiyu-story] vn demo inject error', e); }
    }, 0);

})(typeof window !== 'undefined' ? window : this);
