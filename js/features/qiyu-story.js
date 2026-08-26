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
                '<div style="font-size:12px;font-weight:700;color:' + t.accent + ';padding:8px 0;letter-spacing:0.5px;">场景</div>' +
                '<div style="background:' + t.cardBg + ';border-radius:12px;border:1px solid ' + t.cardBorder + ';overflow:hidden;margin-bottom:12px;">' + scenesHtml + '</div>' +
                '<div onclick="QiyuStory.addSceneForm(\'' + catId + '\',' + idx + ')" style="padding:10px;border-radius:10px;border:1px dashed ' + t.cardBorder + ';color:' + t.textSecondary + ';font-size:13px;text-align:center;cursor:pointer;margin-bottom:24px;">+ 添加场景</div>' +
                '<div onclick="QiyuStory.saveChapterEdit(\'' + catId + '\',' + idx + ')" style="padding:12px;border-radius:10px;background:' + t.accent + ';color:#fff;font-size:14px;font-weight:500;text-align:center;cursor:pointer;">保存修改</div>' +
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
            ]},
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
    }, 0);

})(typeof window !== 'undefined' ? window : this);
