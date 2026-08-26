/**
 * 祁煜故事集 — 剧情阅读模块
 * 框架版：UI + 数据结构 + 空壳内容（待补充）
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

    /* ========== 主题色 ========== */
    // 祁煜：火 Evol + 利莫里亚海洋 → 珊瑚橙 + 深海青
    var THEME = {
        accent: '#FF6B5C',          // 珊瑚火橙
        accentRgb: '255, 107, 92',
        accentDark: '#E0493B',
        ocean: '#2EC4B6',           // 利莫里亚海青
        oceanDark: '#1A9E92',
        goldStar: '#FFD700',
        bgGradient: 'linear-gradient(160deg, #fff5f3 0%, #fef0ef 30%, #f0faf8 100%)',
        cardBg: 'rgba(255, 255, 255, 0.92)',
        cardBorder: 'rgba(255, 107, 92, 0.15)',
        textPrimary: '#2d1f1c',
        textSecondary: '#8a7a76',
        textTertiary: '#b0a5a2',
        shadowColor: 'rgba(255, 107, 92, 0.12)',
        darkBgGradient: 'linear-gradient(160deg, #1a1212 0%, #1a1416 50%, #0f1a18 100%)',
        darkCardBg: 'rgba(40, 30, 28, 0.92)',
        darkCardBorder: 'rgba(255, 107, 92, 0.2)',
        darkTextPrimary: '#f5ebe8',
        darkTextSecondary: '#a89a96',
        darkTextTertiary: '#6a5e5c',
    };

    /* ========== 数据结构（默认空壳） ========== */
    var DEFAULT_DATA = {
        categories: [
            {
                id: 'main',
                title: '主线剧情',
                subtitle: '与祁煜并肩的冒险旅程',
                icon: '📖',
                gradient: 'linear-gradient(135deg, #FF6B5C, #FF8E5C)',
                type: 'chapter',
                chapters: []  // {id, title, summary, content, images:[]}
            },
            {
                id: 'bond',
                title: '倾心之约 · 牵绊',
                subtitle: '好感度解锁的约会故事',
                icon: '💕',
                gradient: 'linear-gradient(135deg, #FF8E5C, #FFAA7A)',
                type: 'chapter',
                chapters: []
            },
            {
                id: 'memory',
                title: '倾心之约 · 思念',
                subtitle: '五星思念卡专属剧情',
                icon: '🌟',
                gradient: 'linear-gradient(135deg, #FFD700, #FFA500)',
                type: 'card',
                cards: []  // {id, title, subtitle, content, image, tag}
            },
            {
                id: 'legend',
                title: '倾心之约 · 传说',
                subtitle: '深层身份与过往秘密',
                icon: '🔱',
                gradient: 'linear-gradient(135deg, #2EC4B6, #4FD9CC)',
                type: 'chapter',
                chapters: []
            },
            {
                id: 'anecdote',
                title: '逸闻',
                subtitle: '不为人知的轶事',
                icon: '📜',
                gradient: 'linear-gradient(135deg, #C9A063, #E0B97A)',
                type: 'card',
                cards: []
            },
            {
                id: 'world',
                title: '世界深处',
                subtitle: '世界观扩展与时间线',
                icon: '🌍',
                gradient: 'linear-gradient(135deg, #5B9BD5, #7BAFE0)',
                type: 'card',
                cards: []
            },
            {
                id: 'messages',
                title: '短信通话',
                subtitle: '他的消息与来电',
                icon: '💬',
                gradient: 'linear-gradient(135deg, #7BC8A4, #95D9B5)',
                type: 'chat',
                conversations: []  // {id, title, type:'sms'|'call', messages:[]}
            },
            {
                id: 'moments',
                title: '朋友圈',
                subtitle: '他的动态分享',
                icon: '📱',
                gradient: 'linear-gradient(135deg, #BB9EC7, #D4BEE0)',
                type: 'moments',
                posts: []  // {id, text, image, time, likes:[]}
            },
            {
                id: 'trace',
                title: '心迹互动',
                subtitle: '互动剧情分支记录',
                icon: '✨',
                gradient: 'linear-gradient(135deg, #FF6B5C, #FFD700)',
                type: 'card',
                cards: []  // {id, title, subtitle, content, image, branches:[]}
            }
        ]
    };

    /* ========== 存储 ========== */
    var STORAGE_KEY = 'qiyu_story_data';

    function loadData() {
        try {
            var saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                var data = JSON.parse(saved);
                // 合并新分类（向前兼容）
                if (data && data.categories) {
                    DEFAULT_DATA.categories.forEach(function(def) {
                        var exists = data.categories.find(function(c) { return c.id === def.id; });
                        if (!exists) data.categories.push(def);
                    });
                    return data;
                }
            }
        } catch (e) {}
        return JSON.parse(JSON.stringify(DEFAULT_DATA));
    }

    function saveData(data) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.error('[qiyu-story] 保存失败', e);
        }
    }

    var storyData = null;

    /* ========== UI 工具 ========== */
    function isDarkMode() {
        return document.documentElement.getAttribute('data-theme') === 'dark' ||
            (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches &&
                document.documentElement.getAttribute('data-theme') !== 'light');
    }

    function t(prop) {
        return isDarkMode() ? THEME['dark' + prop.charAt(0).toUpperCase() + prop.slice(1)] || THEME[prop] : THEME[prop];
    }

    function escapeHtml(text) {
        if (!text) return '';
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function formatContent(text) {
        if (!text) return '<p style="color:' + (isDarkMode() ? THEME.darkTextTertiary : THEME.textTertiary) + ';font-style:italic;">内容待补充…</p>';
        var html = escapeHtml(text);
        // 段落分隔（空行或 --- 分隔）
        html = html.split(/\n\n+|---/).map(function(p) {
            p = p.trim();
            if (!p) return '';
            // [img:位置|url] 插图标记
            var imgMatch = p.match(/\[img:(.+?)\]/);
            if (imgMatch) {
                var url = imgMatch[1].trim();
                return '<figure style="margin:20px 0;text-align:center;"><img src="' + escapeHtml(url) + '" style="max-width:100%;border-radius:14px;box-shadow:0 6px 20px ' + THEME.shadowColor + ';" /><figcaption style="font-size:11px;color:' + (isDarkMode() ? THEME.darkTextTertiary : THEME.textTertiary) + ';margin-top:6px;">' + escapeHtml(p.replace(imgMatch[0], '').trim()) + '</figcaption></figure>';
            }
            return '<p style="margin:0 0 1.2em;line-height:1.85;font-size:14.5px;letter-spacing:0.3px;">' + p.replace(/\n/g, '<br>') + '</p>';
        }).join('');
        return html;
    }

    function getCategory(id) {
        return storyData.categories.find(function(c) { return c.id === id; });
    }

    function countItems(cat) {
        if (cat.type === 'chapter') return (cat.chapters || []).length;
        if (cat.type === 'card') return (cat.cards || []).length;
        if (cat.type === 'chat') return (cat.conversations || []).length;
        if (cat.type === 'moments') return (cat.posts || []).length;
        return 0;
    }

    /* ========== 主面板（分类浏览器） ========== */
    function openStory() {
        if (!storyData) storyData = loadData();

        var overlay = document.createElement('div');
        overlay.id = 'qiyu-story-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:999999995;background:' + (isDarkMode() ? THEME.darkBgGradient : THEME.bgGradient) + ';overflow-y:auto;-webkit-overflow-scrolling:touch;';

        var dark = isDarkMode();
        var tp = dark ? THEME.darkTextPrimary : THEME.textPrimary;
        var ts = dark ? THEME.darkTextSecondary : THEME.textSecondary;
        var cardBg = dark ? THEME.darkCardBg : THEME.cardBg;
        var cardBorder = dark ? THEME.darkCardBorder : THEME.cardBorder;

        // 顶部头图区域
        var heroHtml =
            '<div style="position:relative;height:220px;overflow:hidden;flex-shrink:0;">' +
                '<div style="position:absolute;inset:0;background:linear-gradient(160deg, #FF6B5C 0%, #FF8E5C 30%, #2EC4B6 100%);opacity:0.9;"></div>' +
                // 装饰光晕
                '<div style="position:absolute;top:-40px;right:-30px;width:160px;height:160px;border-radius:50%;background:radial-gradient(circle, rgba(255,215,0,0.2) 0%, transparent 70%);pointer-events:none;"></div>' +
                '<div style="position:absolute;bottom:-30px;left:20px;width:120px;height:120px;border-radius:50%;background:radial-gradient(circle, rgba(46,196,182,0.2) 0%, transparent 70%);pointer-events:none;"></div>' +
                // 水波纹装饰
                '<svg style="position:absolute;bottom:0;left:0;right:0;width:100%;height:60px;" viewBox="0 0 1440 60" preserveAspectRatio="none"><path d="M0,30 C320,50 640,10 960,30 C1280,50 1440,30 1440,30 L1440,60 L0,60 Z" fill="' + (dark ? '#1a1212' : '#fff5f3') + '" opacity="0.5"/></svg>' +
                '<svg style="position:absolute;bottom:0;left:0;right:0;width:100%;height:40px;" viewBox="0 0 1440 40" preserveAspectRatio="none"><path d="M0,20 C480,35 960,5 1440,20 L1440,40 L0,40 Z" fill="' + (dark ? '#1a1212' : '#fff5f3') + '"/></svg>' +
                // 文字
                '<div style="position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding-top:env(safe-area-inset-top,0px);">' +
                    '<div style="font-size:48px;line-height:1;margin-bottom:10px;filter:drop-shadow(0 2px 8px rgba(0,0,0,0.2));">🔥</div>' +
                    '<div style="font-size:24px;font-weight:900;color:#fff;text-shadow:0 2px 8px rgba(0,0,0,0.3);letter-spacing:2px;">祁煜故事集</div>' +
                    '<div style="font-size:12px;color:rgba(255,255,255,0.85);margin-top:6px;font-weight:500;text-shadow:0 1px 4px rgba(0,0,0,0.2);">利莫里亚最后的火焰</div>' +
                '</div>' +
                // 返回按钮
                '<div onclick="document.getElementById(\'qiyu-story-overlay\').remove();" style="position:absolute;top:env(safe-area-inset-top,0px);left:12px;z-index:10;width:36px;height:36px;border-radius:50%;background:rgba(0,0,0,0.25);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;color:#fff;font-size:18px;cursor:pointer;">←</div>' +
            '</div>';

        // 分类卡片网格
        var cardsHtml = '<div style="display:grid;grid-template-columns:repeat(2, 1fr);gap:12px;padding:16px 16px 40px;">';

        storyData.categories.forEach(function(cat) {
            var count = countItems(cat);
            var statusText = count > 0 ? count + ' 篇' : '待补充';
            var statusColor = count > 0 ? THEME.accent : (dark ? THEME.darkTextTertiary : THEME.textTertiary);
            cardsHtml +=
                '<div onclick="QiyuStory.openCategory(\'' + cat.id + '\')" style="position:relative;overflow:hidden;border-radius:18px;background:' + cardBg + ';border:1px solid ' + cardBorder + ';box-shadow:0 4px 16px ' + THEME.shadowColor + ';cursor:pointer;transition:transform 0.2s, box-shadow 0.2s;" onmousedown="this.style.transform=\'scale(0.97)\'" onmouseup="this.style.transform=\'scale(1)\'" ontouchstart="this.style.transform=\'scale(0.97)\'" ontouchend="this.style.transform=\'scale(1)\'">' +
                    // 顶部渐变条
                    '<div style="height:60px;background:' + cat.gradient + ';position:relative;overflow:hidden;">' +
                        '<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 70% 30%, rgba(255,255,255,0.2) 0%, transparent 60%);"></div>' +
                        '<div style="position:absolute;top:50%;left:16px;transform:translateY(-50%);font-size:28px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.15));">' + cat.icon + '</div>' +
                    '</div>' +
                    // 内容
                    '<div style="padding:12px 14px 14px;">' +
                        '<div style="font-size:14px;font-weight:800;color:' + tp + ';line-height:1.3;">' + cat.title + '</div>' +
                        '<div style="font-size:11px;color:' + ts + ';margin-top:4px;line-height:1.4;font-weight:500;">' + cat.subtitle + '</div>' +
                        '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:10px;">' +
                            '<span style="font-size:10px;font-weight:700;color:' + statusColor + ';padding:2px 8px;border-radius:8px;background:' + (dark ? 'rgba(255,107,92,0.12)' : 'rgba(255,107,92,0.08)') + ';">' + statusText + '</span>' +
                            '<span style="font-size:14px;color:' + (dark ? THEME.darkTextTertiary : THEME.textTertiary) + ';">›</span>' +
                        '</div>' +
                    '</div>' +
                '</div>';
        });
        cardsHtml += '</div>';

        // 底部说明
        var footerHtml =
            '<div style="text-align:center;padding:0 20px 40px;">' +
                '<div style="font-size:11px;color:' + (dark ? THEME.darkTextTertiary : THEME.textTertiary) + ';line-height:1.6;">' +
                    '剧情内容基于游戏公开资料整理<br>仅作阅读收藏用途<br><strong style="color:' + THEME.ocean + ';">🌊 利莫里亚 · 火焰不灭</strong>' +
                '</div>' +
            '</div>';

        overlay.innerHTML = heroHtml + cardsHtml + footerHtml;
        document.body.appendChild(overlay);
    }

    /* ========== 分类详情页 ========== */
    function openCategory(catId) {
        var cat = getCategory(catId);
        if (!cat) return;

        if (cat.type === 'chapter') openChapterList(cat);
        else if (cat.type === 'card') openCardGrid(cat);
        else if (cat.type === 'chat') openChatList(cat);
        else if (cat.type === 'moments') openMomentsList(cat);
    }

    /* ========== 章节列表（主线/牵绊/传说） ========== */
    function openChapterList(cat) {
        var dark = isDarkMode();
        var tp = dark ? THEME.darkTextPrimary : THEME.textPrimary;
        var ts = dark ? THEME.darkTextSecondary : THEME.textSecondary;
        var cardBg = dark ? THEME.darkCardBg : THEME.cardBg;
        var cardBorder = dark ? THEME.darkCardBorder : THEME.cardBorder;

        var overlay = document.createElement('div');
        overlay.id = 'qiyu-chapter-list';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:999999996;background:' + (dark ? THEME.darkBgGradient : THEME.bgGradient) + ';overflow-y:auto;-webkit-overflow-scrolling:touch;';

        var chapters = cat.chapters || [];
        var listHtml = '';

        if (chapters.length === 0) {
            listHtml = emptyState(cat.icon, '还没有内容', '后续在这里补充' + cat.title + '的章节故事');
        } else {
            chapters.forEach(function(ch, idx) {
                listHtml +=
                    '<div onclick="QiyuStory.openChapter(\'' + cat.id + '\', ' + idx + ')" style="display:flex;align-items:center;gap:14px;padding:16px;border-radius:16px;background:' + cardBg + ';border:1px solid ' + cardBorder + ';margin-bottom:10px;cursor:pointer;transition:transform 0.15s;box-shadow:0 2px 10px ' + THEME.shadowColor + ';" onmousedown="this.style.transform=\'scale(0.98)\'" onmouseup="this.style.transform=\'scale(1)\'" ontouchstart="this.style.transform=\'scale(0.98)\'" ontouchend="this.style.transform=\'scale(1)\'">' +
                        '<div style="width:42px;height:42px;border-radius:12px;background:' + cat.gradient + ';display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:900;color:#fff;flex-shrink:0;box-shadow:0 3px 10px ' + THEME.shadowColor + ';">' + (idx + 1) + '</div>' +
                        '<div style="flex:1;min-width:0;">' +
                            '<div style="font-size:14px;font-weight:700;color:' + tp + ';line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(ch.title || ('第' + (idx+1) + '章')) + '</div>' +
                            '<div style="font-size:11px;color:' + ts + ';margin-top:3px;line-height:1.4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(ch.summary || '点击阅读') + '</div>' +
                        '</div>' +
                        '<div style="font-size:14px;color:' + (dark ? THEME.darkTextTertiary : THEME.textTertiary) + ';">›</div>' +
                    '</div>';
            });
        }

        overlay.innerHTML = buildSubHeader(cat, listHtml, dark);
        document.body.appendChild(overlay);
    }

    /* ========== 章节阅读器 ========== */
    function openChapter(catId, index) {
        var cat = getCategory(catId);
        if (!cat || !cat.chapters || !cat.chapters[index]) return;
        var ch = cat.chapters[index];
        var dark = isDarkMode();
        var tp = dark ? THEME.darkTextPrimary : THEME.textPrimary;
        var ts = dark ? THEME.darkTextSecondary : THEME.textSecondary;

        var overlay = document.createElement('div');
        overlay.id = 'qiyu-chapter-reader';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:999999997;background:' + (dark ? '#1a1212' : '#fff8f6') + ';overflow-y:auto;-webkit-overflow-scrolling:touch;';

        var content = formatContent(ch.content);

        // 翻页按钮
        var prevBtn = index > 0 ?
            '<div onclick="QiyuStory.openChapter(\'' + catId + '\', ' + (index-1) + ')" style="flex:1;padding:12px;border-radius:12px;background:' + (dark ? THEME.darkCardBg : '#fff') + ';border:1px solid ' + (dark ? THEME.darkCardBorder : THEME.cardBorder) + ';color:' + tp + ';font-size:13px;font-weight:700;text-align:center;cursor:pointer;font-family:inherit;">← 上一章</div>' : '';
        var nextBtn = index < cat.chapters.length - 1 ?
            '<div onclick="QiyuStory.openChapter(\'' + catId + '\', ' + (index+1) + ')" style="flex:1;padding:12px;border-radius:12px;background:linear-gradient(135deg,' + THEME.accent + ',' + THEME.accentDark + ');color:#fff;font-size:13px;font-weight:700;text-align:center;cursor:pointer;font-family:inherit;box-shadow:0 4px 12px ' + THEME.shadowColor + ';">下一章 →</div>' : '';

        overlay.innerHTML =
            // 顶部栏
            '<div style="position:sticky;top:0;z-index:10;display:flex;align-items:center;gap:12px;padding:calc(env(safe-area-inset-top,0px) + 12px) 16px 12px;background:' + (dark ? 'rgba(26,18,18,0.9)' : 'rgba(255,248,246,0.9)') + ';backdrop-filter:blur(12px);border-bottom:1px solid ' + (dark ? THEME.darkCardBorder : THEME.cardBorder) + ';">' +
                '<div onclick="document.getElementById(\'qiyu-chapter-reader\').remove();" style="width:32px;height:32px;border-radius:50%;background:' + (dark ? THEME.darkCardBg : '#fff') + ';display:flex;align-items:center;justify-content:center;font-size:16px;color:' + tp + ';cursor:pointer;flex-shrink:0;">←</div>' +
                '<div style="flex:1;min-width:0;">' +
                    '<div style="font-size:12px;font-weight:800;color:' + THEME.accent + ';line-height:1.2;">' + cat.icon + ' ' + escapeHtml(cat.title) + '</div>' +
                    '<div style="font-size:13px;font-weight:700;color:' + tp + ';margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(ch.title || ('第' + (index+1) + '章')) + '</div>' +
                '</div>' +
            '</div>' +
            // 内容区
            '<div style="max-width:640px;margin:0 auto;padding:28px 22px 40px;">' +
                // 章节标题
                '<h1 style="font-size:22px;font-weight:900;color:' + tp + ';line-height:1.4;margin:0 0 8px;letter-spacing:0.5px;">' + escapeHtml(ch.title || ('第' + (index+1) + '章')) + '</h1>' +
                (ch.summary ? '<div style="font-size:13px;color:' + ts + ';line-height:1.6;margin-bottom:24px;padding-left:12px;border-left:3px solid ' + THEME.accent + ';font-style:italic;">' + escapeHtml(ch.summary) + '</div>' : '<div style="height:20px;"></div>') +
                // 正文
                '<div style="font-family:-apple-system,\'PingFang SC\',\'Noto Serif SC\',serif;color:' + tp + ';">' + content + '</div>' +
                // 翻页
                '<div style="display:flex;gap:10px;margin-top:36px;">' + prevBtn + nextBtn + '</div>' +
            '</div>';

        document.body.appendChild(overlay);
        overlay.scrollTop = 0;
    }

    /* ========== 卡片网格（思念/逸闻/世界深处/心迹） ========== */
    function openCardGrid(cat) {
        var dark = isDarkMode();
        var tp = dark ? THEME.darkTextPrimary : THEME.textPrimary;
        var ts = dark ? THEME.darkTextSecondary : THEME.textSecondary;
        var cardBg = dark ? THEME.darkCardBg : THEME.cardBg;
        var cardBorder = dark ? THEME.darkCardBorder : THEME.cardBorder;

        var overlay = document.createElement('div');
        overlay.id = 'qiyu-card-grid';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:999999996;background:' + (dark ? THEME.darkBgGradient : THEME.bgGradient) + ';overflow-y:auto;-webkit-overflow-scrolling:touch;';

        var cards = cat.cards || [];
        var gridHtml = '';

        if (cards.length === 0) {
            gridHtml = emptyState(cat.icon, '还没有内容', '后续在这里补充' + cat.title);
        } else {
            gridHtml = '<div style="display:grid;grid-template-columns:repeat(2, 1fr);gap:12px;">';
            cards.forEach(function(card, idx) {
                var imgHtml = card.image ?
                    '<div style="height:100px;border-radius:12px 12px 0 0;overflow:hidden;background:' + cat.gradient + ';">' +
                        '<img src="' + escapeHtml(card.image) + '" style="width:100%;height:100%;object-fit:cover;" />' +
                    '</div>' :
                    '<div style="height:80px;border-radius:12px 12px 0 0;background:' + cat.gradient + ';display:flex;align-items:center;justify-content:center;font-size:32px;position:relative;overflow:hidden;">' +
                        '<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 60% 30%, rgba(255,255,255,0.15) 0%, transparent 60%);"></div>' +
                        '<span style="position:relative;z-index:1;">' + cat.icon + '</span>' +
                    '</div>';

                gridHtml +=
                    '<div onclick="QiyuStory.openCardDetail(\'' + cat.id + '\', ' + idx + ')" style="overflow:hidden;border-radius:14px;background:' + cardBg + ';border:1px solid ' + cardBorder + ';box-shadow:0 3px 12px ' + THEME.shadowColor + ';cursor:pointer;transition:transform 0.15s;" onmousedown="this.style.transform=\'scale(0.97)\'" onmouseup="this.style.transform=\'scale(1)\'" ontouchstart="this.style.transform=\'scale(0.97)\'" ontouchend="this.style.transform=\'scale(1)\'">' +
                        imgHtml +
                        '<div style="padding:10px 12px 12px;">' +
                            '<div style="font-size:13px;font-weight:800;color:' + tp + ';line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">' + escapeHtml(card.title || '未命名') + '</div>' +
                            (card.subtitle ? '<div style="font-size:10px;color:' + ts + ';margin-top:4px;line-height:1.4;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden;font-weight:500;">' + escapeHtml(card.subtitle) + '</div>' : '') +
                            (card.tag ? '<span style="display:inline-block;margin-top:6px;font-size:9px;font-weight:700;color:' + THEME.accent + ';padding:1px 7px;border-radius:6px;background:rgba(255,107,92,0.1);">' + escapeHtml(card.tag) + '</span>' : '') +
                        '</div>' +
                    '</div>';
            });
            gridHtml += '</div>';
        }

        overlay.innerHTML = buildSubHeader(cat, gridHtml, dark);
        document.body.appendChild(overlay);
    }

    /* ========== 卡片详情（阅读） ========== */
    function openCardDetail(catId, index) {
        var cat = getCategory(catId);
        if (!cat || !cat.cards || !cat.cards[index]) return;
        var card = cat.cards[index];
        var dark = isDarkMode();
        var tp = dark ? THEME.darkTextPrimary : THEME.textPrimary;
        var ts = dark ? THEME.darkTextSecondary : THEME.textSecondary;

        var overlay = document.createElement('div');
        overlay.id = 'qiyu-card-detail';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:999999997;background:' + (dark ? '#1a1212' : '#fff8f6') + ';overflow-y:auto;-webkit-overflow-scrolling:touch;';

        var content = formatContent(card.content);

        // 分支选项（心迹用）
        var branchesHtml = '';
        if (card.branches && card.branches.length) {
            branchesHtml = '<div style="margin-top:28px;padding:16px;border-radius:14px;background:' + (dark ? 'rgba(255,107,92,0.08)' : 'rgba(255,107,92,0.05)') + ';border:1px solid ' + (dark ? THEME.darkCardBorder : THEME.cardBorder) + ';">' +
                '<div style="font-size:12px;font-weight:800;color:' + THEME.accent + ';margin-bottom:10px;">⚡ 分支选项</div>';
            card.branches.forEach(function(b) {
                branchesHtml +=
                    '<div style="padding:10px 12px;border-radius:10px;background:' + (dark ? THEME.darkCardBg : '#fff') + ';margin-bottom:8px;border-left:3px solid ' + THEME.ocean + ';">' +
                        '<div style="font-size:13px;font-weight:700;color:' + tp + ';">' + escapeHtml(b.option || b.title || '') + '</div>' +
                        (b.result ? '<div style="font-size:12px;color:' + ts + ';margin-top:4px;line-height:1.5;">' + escapeHtml(b.result) + '</div>' : '') +
                    '</div>';
            });
            branchesHtml += '</div>';
        }

        overlay.innerHTML =
            // 顶部栏
            '<div style="position:sticky;top:0;z-index:10;display:flex;align-items:center;gap:12px;padding:calc(env(safe-area-inset-top,0px) + 12px) 16px 12px;background:' + (dark ? 'rgba(26,18,18,0.9)' : 'rgba(255,248,246,0.9)') + ';backdrop-filter:blur(12px);border-bottom:1px solid ' + (dark ? THEME.darkCardBorder : THEME.cardBorder) + ';">' +
                '<div onclick="document.getElementById(\'qiyu-card-detail\').remove();" style="width:32px;height:32px;border-radius:50%;background:' + (dark ? THEME.darkCardBg : '#fff') + ';display:flex;align-items:center;justify-content:center;font-size:16px;color:' + tp + ';cursor:pointer;flex-shrink:0;">←</div>' +
                '<div style="flex:1;font-size:13px;font-weight:800;color:' + THEME.accent + ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + cat.icon + ' ' + escapeHtml(cat.title) + '</div>' +
            '</div>' +
            // 内容区
            '<div style="max-width:640px;margin:0 auto;padding:24px 20px 40px;">' +
                // 大图
                (card.image ?
                    '<div style="border-radius:16px;overflow:hidden;margin-bottom:20px;box-shadow:0 8px 24px ' + THEME.shadowColor + ';">' +
                        '<img src="' + escapeHtml(card.image) + '" style="width:100%;display:block;" />' +
                    '</div>' : '') +
                // 标题
                '<h1 style="font-size:20px;font-weight:900;color:' + tp + ';line-height:1.4;margin:0 0 6px;">' + escapeHtml(card.title || '未命名') + '</h1>' +
                (card.subtitle ? '<div style="font-size:13px;color:' + ts + ';margin-bottom:20px;font-weight:500;">' + escapeHtml(card.subtitle) + '</div>' : '<div style="height:16px;"></div>') +
                (card.tag ? '<span style="display:inline-block;font-size:10px;font-weight:700;color:' + THEME.accent + ';padding:2px 10px;border-radius:8px;background:rgba(255,107,92,0.1);margin-bottom:20px;">' + escapeHtml(card.tag) + '</span>' : '') +
                // 正文
                '<div style="font-family:-apple-system,\'PingFang SC\',\'Noto Serif SC\',serif;color:' + tp + ';">' + content + '</div>' +
                branchesHtml +
            '</div>';

        document.body.appendChild(overlay);
        overlay.scrollTop = 0;
    }

    /* ========== 短信通话列表 ========== */
    function openChatList(cat) {
        var dark = isDarkMode();
        var tp = dark ? THEME.darkTextPrimary : THEME.textPrimary;
        var ts = dark ? THEME.darkTextSecondary : THEME.textSecondary;
        var cardBg = dark ? THEME.darkCardBg : THEME.cardBg;
        var cardBorder = dark ? THEME.darkCardBorder : THEME.cardBorder;

        var overlay = document.createElement('div');
        overlay.id = 'qiyu-chat-list';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:999999996;background:' + (dark ? THEME.darkBgGradient : THEME.bgGradient) + ';overflow-y:auto;-webkit-overflow-scrolling:touch;';

        var convs = cat.conversations || [];
        var listHtml = '';

        if (convs.length === 0) {
            listHtml = emptyState(cat.icon, '还没有内容', '后续在这里补充短信和通话记录');
        } else {
            convs.forEach(function(conv, idx) {
                var icon = conv.type === 'call' ? '📞' : '💬';
                listHtml +=
                    '<div onclick="QiyuStory.openChatDetail(\'' + cat.id + '\', ' + idx + ')" style="display:flex;align-items:center;gap:12px;padding:14px;border-radius:16px;background:' + cardBg + ';border:1px solid ' + cardBorder + ';margin-bottom:8px;cursor:pointer;box-shadow:0 2px 8px ' + THEME.shadowColor + ';">' +
                        '<div style="width:40px;height:40px;border-radius:12px;background:' + cat.gradient + ';display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">' + icon + '</div>' +
                        '<div style="flex:1;min-width:0;">' +
                            '<div style="font-size:13px;font-weight:700;color:' + tp + ';line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(conv.title || '未命名') + '</div>' +
                            '<div style="font-size:11px;color:' + ts + ';margin-top:2px;">' + (conv.messages && conv.messages.length ? conv.messages.length + '条消息' : '空') + '</div>' +
                        '</div>' +
                        '<div style="font-size:14px;color:' + (dark ? THEME.darkTextTertiary : THEME.textTertiary) + ';">›</div>' +
                    '</div>';
            });
        }

        overlay.innerHTML = buildSubHeader(cat, listHtml, dark);
        document.body.appendChild(overlay);
    }

    /* ========== 短信通话详情（仿聊天界面） ========== */
    function openChatDetail(catId, index) {
        var cat = getCategory(catId);
        if (!cat || !cat.conversations || !cat.conversations[index]) return;
        var conv = cat.conversations[index];
        var dark = isDarkMode();
        var tp = dark ? THEME.darkTextPrimary : THEME.textPrimary;
        var ts = dark ? THEME.darkTextSecondary : THEME.textSecondary;

        var overlay = document.createElement('div');
        overlay.id = 'qiyu-chat-detail';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:999999997;background:' + (dark ? '#1a1212' : '#f5ebe8') + ';overflow-y:auto;-webkit-overflow-scrolling:touch;';

        var msgsHtml = '';
        var messages = conv.messages || [];
        if (messages.length === 0) {
            msgsHtml = emptyState('💬', '没有消息', '后续在这里补充对话内容');
        } else {
            messages.forEach(function(msg) {
                var isMe = msg.from === 'me';
                var bubbleBg = isMe ? THEME.accent : (dark ? '#3a2a28' : '#fff');
                var bubbleColor = isMe ? '#fff' : tp;
                var align = isMe ? 'flex-end' : 'flex-start';
                var avatar = isMe ? '我' : '煜';

                if (msg.type === 'call') {
                    // 通话记录样式
                    msgsHtml +=
                        '<div style="display:flex;justify-content:center;margin:10px 0;">' +
                            '<div style="display:flex;align-items:center;gap:6px;padding:6px 14px;border-radius:16px;background:' + (dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)') + ';font-size:11px;color:' + ts + ';">' +
                                '<span>📞</span>' +
                                '<span>' + escapeHtml(msg.text || '通话记录') + '</span>' +
                            '</div>' +
                        '</div>';
                } else {
                    msgsHtml +=
                        '<div style="display:flex;flex-direction:' + (isMe ? 'row-reverse' : 'row') + ';align-items:flex-start;gap:8px;margin:8px 16px;">' +
                            '<div style="width:32px;height:32px;border-radius:50%;background:' + (isMe ? THEME.ocean : cat.gradient) + ';display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;flex-shrink:0;">' + avatar + '</div>' +
                            '<div style="max-width:72%;">' +
                                (msg.time ? '<div style="font-size:10px;color:' + (dark ? THEME.darkTextTertiary : THEME.textTertiary) + ';margin-bottom:3px;text-align:' + (isMe ? 'right' : 'left') + ';">' + escapeHtml(msg.time) + '</div>' : '') +
                                '<div style="padding:10px 14px;border-radius:16px;background:' + bubbleBg + ';color:' + bubbleColor + ';font-size:14px;line-height:1.5;box-shadow:0 2px 6px rgba(0,0,0,0.06);">' + escapeHtml(msg.text || '') + '</div>' +
                            '</div>' +
                        '</div>';
                }
            });
        }

        overlay.innerHTML =
            '<div style="position:sticky;top:0;z-index:10;display:flex;align-items:center;gap:12px;padding:calc(env(safe-area-inset-top,0px) + 12px) 16px 12px;background:' + (dark ? 'rgba(26,18,18,0.9)' : 'rgba(245,235,232,0.9)') + ';backdrop-filter:blur(12px);border-bottom:1px solid ' + (dark ? THEME.darkCardBorder : THEME.cardBorder) + ';">' +
                '<div onclick="document.getElementById(\'qiyu-chat-detail\').remove();" style="width:32px;height:32px;border-radius:50%;background:' + (dark ? THEME.darkCardBg : '#fff') + ';display:flex;align-items:center;justify-content:center;font-size:16px;color:' + tp + ';cursor:pointer;flex-shrink:0;">←</div>' +
                '<div style="flex:1;">' +
                    '<div style="font-size:15px;font-weight:800;color:' + tp + ';line-height:1.2;">' + escapeHtml(conv.title || '对话') + '</div>' +
                    '<div style="font-size:11px;color:' + ts + ';margin-top:2px;">' + (conv.type === 'call' ? '📞 通话' : '💬 短信') + '</div>' +
                '</div>' +
            '</div>' +
            '<div style="padding:16px 0 40px;min-height:calc(100vh - 60px);">' + msgsHtml + '</div>';

        document.body.appendChild(overlay);
        overlay.scrollTop = overlay.scrollHeight;
    }

    /* ========== 朋友圈列表 ========== */
    function openMomentsList(cat) {
        var dark = isDarkMode();
        var tp = dark ? THEME.darkTextPrimary : THEME.textPrimary;
        var ts = dark ? THEME.darkTextSecondary : THEME.textSecondary;
        var cardBg = dark ? THEME.darkCardBg : THEME.cardBg;
        var cardBorder = dark ? THEME.darkCardBorder : THEME.cardBorder;

        var overlay = document.createElement('div');
        overlay.id = 'qiyu-moments-list';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:999999996;background:' + (dark ? THEME.darkBgGradient : THEME.bgGradient) + ';overflow-y:auto;-webkit-overflow-scrolling:touch;';

        var posts = cat.posts || [];
        var postsHtml = '';

        if (posts.length === 0) {
            postsHtml = emptyState(cat.icon, '还没有内容', '后续在这里补充朋友圈动态');
        } else {
            posts.forEach(function(post) {
                postsHtml +=
                    '<div style="display:flex;gap:12px;padding:16px;border-radius:16px;background:' + cardBg + ';border:1px solid ' + cardBorder + ';margin-bottom:10px;box-shadow:0 2px 10px ' + THEME.shadowColor + ';">' +
                        '<div style="width:40px;height:40px;border-radius:12px;background:' + cat.gradient + ';display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">🔥</div>' +
                        '<div style="flex:1;min-width:0;">' +
                            '<div style="font-size:13px;font-weight:800;color:' + THEME.accent + ';">祁煜</div>' +
                            (post.text ? '<div style="font-size:14px;color:' + tp + ';margin-top:6px;line-height:1.5;white-space:pre-wrap;">' + escapeHtml(post.text) + '</div>' : '') +
                            (post.image ? '<div style="margin-top:8px;border-radius:12px;overflow:hidden;"><img src="' + escapeHtml(post.image) + '" style="width:100%;display:block;" /></div>' : '') +
                            '<div style="font-size:11px;color:' + ts + ';margin-top:8px;">' + escapeHtml(post.time || '') + '</div>' +
                        '</div>' +
                    '</div>';
            });
        }

        overlay.innerHTML = buildSubHeader(cat, postsHtml, dark);
        document.body.appendChild(overlay);
    }

    /* ========== 公共组件：子页面顶部栏 ========== */
    function buildSubHeader(cat, contentHtml, dark) {
        var tp = dark ? THEME.darkTextPrimary : THEME.textPrimary;
        var ts = dark ? THEME.darkTextSecondary : THEME.textSecondary;

        return (
            '<div style="position:sticky;top:0;z-index:10;display:flex;align-items:center;gap:12px;padding:calc(env(safe-area-inset-top,0px) + 12px) 16px 12px;background:' + (dark ? 'rgba(26,18,18,0.9)' : 'rgba(255,245,243,0.9)') + ';backdrop-filter:blur(12px);border-bottom:1px solid ' + (dark ? THEME.darkCardBorder : THEME.cardBorder) + ';">' +
                '<div onclick="(function(el){var o=document.getElementById(\'qiyu-chapter-list\')||document.getElementById(\'qiyu-card-grid\')||document.getElementById(\'qiyu-chat-list\')||document.getElementById(\'qiyu-moments-list\');if(o)o.remove();})(this)" style="width:32px;height:32px;border-radius:50%;background:' + (dark ? THEME.darkCardBg : '#fff') + ';display:flex;align-items:center;justify-content:center;font-size:16px;color:' + tp + ';cursor:pointer;flex-shrink:0;">←</div>' +
                '<div style="flex:1;">' +
                    '<div style="font-size:16px;font-weight:900;color:' + tp + ';line-height:1.2;">' + cat.icon + ' ' + escapeHtml(cat.title) + '</div>' +
                    '<div style="font-size:11px;color:' + ts + ';margin-top:2px;font-weight:500;">' + escapeHtml(cat.subtitle) + '</div>' +
                '</div>' +
            '</div>' +
            '<div style="padding:16px 16px 40px;max-width:640px;margin:0 auto;">' + contentHtml + '</div>'
        );
    }

    /* ========== 空状态 ========== */
    function emptyState(icon, title, desc) {
        var dark = isDarkMode();
        return (
            '<div style="text-align:center;padding:60px 20px;">' +
                '<div style="font-size:48px;margin-bottom:16px;opacity:0.5;">' + icon + '</div>' +
                '<div style="font-size:15px;font-weight:700;color:' + (dark ? THEME.darkTextSecondary : THEME.textSecondary) + ';margin-bottom:6px;">' + title + '</div>' +
                '<div style="font-size:12px;color:' + (dark ? THEME.darkTextTertiary : THEME.textTertiary) + ';line-height:1.5;">' + desc + '</div>' +
            '</div>'
        );
    }

    /* ========== 导出 API ========== */
    global.QiyuStory = {
        openStory: openStory,
        openCategory: openCategory,
        openChapter: openChapter,
        openCardDetail: openCardDetail,
        openChatDetail: openChatDetail,
        getData: function() { if (!storyData) storyData = loadData(); return storyData; },
        saveData: function(data) { storyData = data; saveData(data); },
        // 添加章节
        addChapter: function(catId, chapter) {
            if (!storyData) storyData = loadData();
            var cat = getCategory(catId);
            if (cat && cat.type === 'chapter') {
                if (!cat.chapters) cat.chapters = [];
                cat.chapters.push(chapter);
                saveData(storyData);
            }
        },
        // 添加卡片
        addCard: function(catId, card) {
            if (!storyData) storyData = loadData();
            var cat = getCategory(catId);
            if (cat && cat.type === 'card') {
                if (!cat.cards) cat.cards = [];
                cat.cards.push(card);
                saveData(storyData);
            }
        },
        // 添加对话
        addConversation: function(catId, conv) {
            if (!storyData) storyData = loadData();
            var cat = getCategory(catId);
            if (cat && cat.type === 'chat') {
                if (!cat.conversations) cat.conversations = [];
                cat.conversations.push(conv);
                saveData(storyData);
            }
        },
        // 添加朋友圈
        addPost: function(catId, post) {
            if (!storyData) storyData = loadData();
            var cat = getCategory(catId);
            if (cat && cat.type === 'moments') {
                if (!cat.posts) cat.posts = [];
                cat.posts.push(post);
                saveData(storyData);
            }
        }
    };

})(typeof window !== 'undefined' ? window : this);
