/**
 * 备份与导入面板：统一的分类勾选 UI
 *  - 导出备份：弹出分类勾选 → 生成 ZIP/JSON 下载
 *  - 导入备份：选择备份文件 → 弹出分类勾选 → 按勾选恢复
 *  分类表与 ChatBackup.buildModuleSkipPatterns / applyBackupToStorage (selective) 双向映射
 */
(function (global) {
    'use strict';

    /**
     * 统一分类表：
     *  id:       导入 selective 模式的 categoryId（与 applyBackupToStorage.categories 对应）
     *  label:    展示名
     *  desc:     说明（小字提示）
     *  incl:     对应 ChatBackup.buildModuleSkipPatterns 的 inclXxx flag 列表（导出时使用）
     *  indexedDBNeedles / localStorageNeedles / localStoragePrefixes: 导入 selective 过滤用
     */
    var BACKUP_CATEGORIES = [
        {
            id: 'chat',
            label: '聊天记录 / 会话 / 红包 / 信封',
            desc: '对话消息、会话列表、红包记录、信封',
            incl: ['inclMsgs', 'inclSet', 'inclEnvelope', 'inclGroupChat'],
            indexedDBNeedles: ['chatMessages', 'sessionList', 'chatSettings', 'showPartnerNameInChat', 'envelopeData', 'pending_envelope', 'transferData'],
            localStorageNeedles: ['groupChatSettings']
        },
        {
            id: 'replies',
            label: '回复库 / 拍一拍 / 氛围',
            desc: '字卡库、拍一拍、状态、个性签名、颜文字',
            incl: ['inclCustom', 'inclCoreExtra', 'inclFeatures'],
            indexedDBNeedles: ['customReplies', 'customPokes', 'customStatuses', 'customMottos', 'customIntros', 'customEmojis', 'customReplyGroups', 'customPokeGroups', 'customStatusGroups', 'kaomojiLibrary', 'kaomojiGroups', 'customVoices', 'customVoiceGroups', 'myPokes'],
            localStorageNeedles: ['disabledReplyItems', 'pokeSym_my', 'pokeSym_partner', 'pokeSym_my_custom', 'pokeSym_partner_custom']
        },
        {
            id: 'stickers',
            label: '表情库（贴纸）',
            desc: '自定义表情包、禁用项',
            incl: ['inclStickers', 'inclCoreExtra'],
            indexedDBNeedles: ['stickerLibrary', 'myStickerLibrary', 'customStickerGroups'],
            localStorageNeedles: ['disabledStickerItems']
        },
        {
            id: 'moments',
            label: '朋友圈',
            desc: '朋友圈动态、评论、点赞、访客记录、设置',
            incl: ['inclMoments'],
            indexedDBNeedles: [],
            localStorageNeedles: ['moments_data', 'moments_visitor_records', 'moments_friends', 'moments_reply_speed', 'moments_reply_count_min', 'moments_reply_count_max', 'moments_friend_like', 'moments_cover', 'moments_visitor_last_online', 'moments_visitor_last_viewed_count', 'home_avatar_me', 'profile_me', 'profile_partner']
        },
        {
            id: 'pet',
            label: '宠物 / 小火人',
            desc: '小火人（像素宠物）游戏状态、连聊火花',
            incl: ['inclPet', 'inclSpark'],
            indexedDBNeedles: ['petGameState', 'pixelPetGame', 'chat_streak_data'],
            localStorageNeedles: []
        },
        {
            id: 'mood',
            label: '心晴手账',
            desc: '每日心情日历记录、自定义表情',
            incl: ['inclMood'],
            indexedDBNeedles: ['moodCalendar', 'customMoodOptions', 'moodTrash'],
            localStorageNeedles: []
        },
        {
            id: 'diary',
            label: '朝夕心记',
            desc: '朝夕计划待办、习惯、纪念日、生理周期',
            incl: ['inclDiary'],
            indexedDBNeedles: ['diaryTodos', 'diaryHabits', 'diaryHabitRecords', 'diaryPeriodRecords', 'diaryAnniversaries', 'diaryTodoCategories'],
            localStorageNeedles: ['diaryPeriodLastReminderDate']
        },
        {
            id: 'accounting',
            label: '同心记账',
            desc: '账本记录、标签分类',
            incl: ['inclAccounting'],
            indexedDBNeedles: ['accountingRecords', 'accountingLabels'],
            localStorageNeedles: []
        },
        {
            id: 'shop',
            label: '商城 / 礼物柜',
            desc: '商城余额、商品、购物车、订单、礼物柜收藏',
            incl: ['inclShop'],
            indexedDBNeedles: [],
            localStorageNeedles: ['shop_balance', 'shop_search_history', 'shop_gift_cabinet', 'shop_products', 'shop_cart', 'shop_orders']
        },
        {
            id: 'themes',
            label: '主题 / 外观 / 图库 / 头像',
            desc: '自定义主题、主题预设、聊天背景、头像、角色卡片',
            incl: ['inclThemes', 'inclHome'],
            indexedDBNeedles: ['customThemes', 'themeSchemes', 'backgroundGallery', 'chatBackground', 'partnerAvatar', 'myAvatar', 'playerCover', 'partnerPersonas'],
            localStorageNeedles: ['home_page_bg', 'home_card_bg', 'home_icon_color', 'home_icon_color_name', 'home_hero_subtitle', 'home_theme', 'home_theme_custom', 'home_app_icons', 'home_app_order', 'home_session_bind', 'home_avatar_sync', 'home_bg_sync', 'home_card_bg_custom', 'home_page_bg_custom', 'home_avatar_me', 'profile_me', 'profile_partner']
        },
        {
            id: 'moyu',
            label: '摸鱼小记',
            desc: '摸鱼记录、工作会话、活动地点',
            incl: ['inclMoyu'],
            indexedDBNeedles: ['moyuRecords', 'currentMoyuRecord', 'moyuWorkSession', 'moyuLocations', 'moyuActivities', 'moyuUnread'],
            localStorageNeedles: []
        },
        {
            id: 'taPhone',
            label: 'TA 的手机',
            desc: '收藏的短信、相册等条目',
            incl: ['inclTaPhone'],
            indexedDBNeedles: [],
            localStorageNeedles: ['ta_phone_collections']
        },
        {
            id: 'dg',
            label: '每日公告 / 运势 / 天气',
            desc: '公告自定义、运势记录、自定义天气',
            incl: ['inclDg'],
            indexedDBNeedles: [],
            localStorageNeedles: ['dg_custom_data', 'dg_status_pool', 'weekly_fortune', 'daily_fortune'],
            localStoragePrefixes: ['customWeather_', 'dailyFortuneNotes_']
        },
        {
            id: 'tarot',
            label: '塔罗 / 占卜历史',
            desc: '占卜记录、自定义牌组',
            incl: ['inclTarot'],
            indexedDBNeedles: ['diviHistory', 'customTarotDeck', 'customTarotEnabled'],
            localStorageNeedles: []
        },
        {
            id: 'call',
            label: '通话功能',
            desc: '通话开关、窗口位置、背景图',
            incl: ['inclCall'],
            indexedDBNeedles: [],
            localStorageNeedles: ['callFeatureEnabled', 'callWindowPos', 'callWindowSize', 'callPillPos', 'callBgImageData']
        },
        {
            id: 'map',
            label: '地图',
            desc: '地图轨迹与标记数据',
            incl: ['inclMap'],
            indexedDBNeedles: [],
            localStorageNeedles: ['_mapData']
        },
        {
            id: 'coreExtra',
            label: '其它设置与杂项',
            desc: '通知开关、会话列表索引、最后导出提醒、新手指引等',
            incl: ['inclCoreExtra', 'inclOnboarding', 'inclFeatures'],
            indexedDBNeedles: ['lastSessionId', 'sessionList'],
            localStorageNeedles: ['notifEnabled', 'exportReminderLastShown', 'tiSettings_showAvatar', 'tiSettings_customText', 'splashPledgeSigned_v3', 'tour_seen', 'headerAlwaysClear', 'keepaliveAudioEnabled', 'immersive_mode']
        }
    ];

    /**
     * 把分类勾选 → ChatBackup.buildBackupPayload 需要的 inclXxx flags
     */
    function categoriesToFlags(selectedIds) {
        var flags = {
            inclMsgs: false, inclSet: false, inclCustom: false,
            inclThemes: false, inclDg: false, inclStickers: false,
            inclHome: false, inclMoyu: false, inclShop: false,
            inclMoments: false, inclMap: false, inclTaPhone: false,
            inclPet: false, inclDiary: false, inclAccounting: false,
            inclEnvelope: false, inclMood: false, inclTarot: false,
            inclCall: false, inclGroupChat: false, inclSpark: false,
            inclFeatures: false, inclCoreExtra: false, inclOnboarding: false
        };
        if (!selectedIds || !selectedIds.length) return flags;
        var selectedMap = {};
        for (var i = 0; i < selectedIds.length; i++) selectedMap[selectedIds[i]] = true;
        for (var j = 0; j < BACKUP_CATEGORIES.length; j++) {
            var cat = BACKUP_CATEGORIES[j];
            if (!selectedMap[cat.id] || !cat.incl || !cat.incl.length) continue;
            for (var k = 0; k < cat.incl.length; k++) flags[cat.incl[k]] = true;
        }
        return flags;
    }

    /**
     * 弹出分类勾选面板（可用于导出 OR 导入）
     * @param {string} title - 面板标题（如"选择要导出的内容" / "选择要导入的内容"）
     * @param {string} confirmText - 确认按钮文字
     * @returns {Promise<string[]|null>} 选中的分类 id 数组；取消则返回 null
     */
    function openCategoryPicker(title, confirmText) {
        return new Promise(function (resolve) {
            var overlay = document.createElement('div');
            overlay.style.cssText = 'position:fixed;inset:0;z-index:999999998;background:rgba(0,0,0,0.6);backdrop-filter:blur(10px);display:flex;align-items:flex-end;justify-content:center;';
            overlay.innerHTML =
                '<div style="width:100%;max-width:560px;background:var(--secondary-bg,#ffffff);border-radius:24px 24px 0 0;box-shadow:0 -10px 60px rgba(0,0,0,0.3);padding:16px 18px 20px;max-height:92vh;display:flex;flex-direction:column;">' +
                    '<div style="width:36px;height:4px;border-radius:2px;background:var(--border-color,#e5e5e5);margin:0 auto 14px;"></div>' +
                    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
                        '<div style="font-size:17px;font-weight:800;color:var(--text-primary,#1a1a1a);">' + title + '</div>' +
                        '<div id="bp-picked-count" style="font-size:12px;color:var(--accent-color,#b8a9c9);font-weight:700;">已选 ' + BACKUP_CATEGORIES.length + '/' + BACKUP_CATEGORIES.length + '</div>' +
                    '</div>' +
                    '<div style="display:flex;gap:8px;margin-bottom:10px;">' +
                        '<button id="bp-select-all" style="flex:1;padding:8px 10px;border-radius:10px;border:1.5px solid var(--border-color,#e5e5e5);background:var(--primary-bg,#fafafa);color:var(--text-primary,#1a1a1a);font-size:12px;font-weight:700;font-family:inherit;cursor:pointer;">全选</button>' +
                        '<button id="bp-invert" style="flex:1;padding:8px 10px;border-radius:10px;border:1.5px solid var(--border-color,#e5e5e5);background:var(--primary-bg,#fafafa);color:var(--text-primary,#1a1a1a);font-size:12px;font-weight:700;font-family:inherit;cursor:pointer;">反选</button>' +
                        '<button id="bp-none" style="flex:1;padding:8px 10px;border-radius:10px;border:1.5px solid var(--border-color,#e5e5e5);background:var(--primary-bg,#fafafa);color:var(--text-primary,#1a1a1a);font-size:12px;font-weight:700;font-family:inherit;cursor:pointer;">清空</button>' +
                    '</div>' +
                    '<div id="bp-list" style="display:flex;flex-direction:column;gap:10px;overflow-y:auto;overflow-x:hidden;padding-right:4px;"></div>' +
                    '<div style="display:flex;gap:10px;margin-top:14px;">' +
                        '<button id="bp-cancel" style="flex:1;padding:13px 0;border-radius:14px;border:none;background:var(--primary-bg,#f4f1f7);color:var(--text-primary,#1a1a1a);font-size:14px;font-weight:700;font-family:inherit;cursor:pointer;">取消</button>' +
                        '<button id="bp-confirm" style="flex:1;padding:13px 0;border-radius:14px;border:none;background:linear-gradient(135deg,var(--accent-color,#b8a9c9),var(--accent-color-2,#8a7da0));color:#fff;font-size:14px;font-weight:700;font-family:inherit;cursor:pointer;box-shadow:0 6px 16px rgba(184,169,201,0.45);">' + confirmText + '</button>' +
                    '</div>' +
                '</div>';
            document.body.appendChild(overlay);

            var list = overlay.querySelector('#bp-list');
            BACKUP_CATEGORIES.forEach(function (c) {
                var lab = document.createElement('label');
                lab.style.cssText = 'display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:12px 12px;border:1.5px solid var(--border-color,#e5e5e5);border-radius:14px;background:var(--primary-bg,#fafafa);cursor:pointer;transition:all 0.15s;';
                lab.innerHTML =
                    '<div style="flex:1;display:flex;flex-direction:column;gap:4px;">' +
                        '<span style="font-size:13.5px;font-weight:800;color:var(--text-primary,#1a1a1a);line-height:1.3;">' + c.label + '</span>' +
                        (c.desc ? '<span style="font-size:11px;color:var(--text-secondary,#8a8a8a);font-weight:500;line-height:1.35;">' + c.desc + '</span>' : '') +
                    '</div>' +
                    '<input type="checkbox" data-cat="' + c.id + '" checked style="margin-top:3px;transform:scale(1.15);accent-color:var(--accent-color,#b8a9c9);cursor:pointer;flex-shrink:0;">';
                list.appendChild(lab);
            });

            function updateCount() {
                var checked = overlay.querySelectorAll('input[type=checkbox]:checked').length;
                var txt = overlay.querySelector('#bp-picked-count');
                if (txt) txt.textContent = '已选 ' + checked + '/' + BACKUP_CATEGORIES.length;
            }
            list.addEventListener('change', updateCount);
            overlay.querySelector('#bp-select-all').onclick = function () {
                overlay.querySelectorAll('input[type=checkbox]').forEach(function (cb) { cb.checked = true; });
                updateCount();
            };
            overlay.querySelector('#bp-invert').onclick = function () {
                overlay.querySelectorAll('input[type=checkbox]').forEach(function (cb) { cb.checked = !cb.checked; });
                updateCount();
            };
            overlay.querySelector('#bp-none').onclick = function () {
                overlay.querySelectorAll('input[type=checkbox]').forEach(function (cb) { cb.checked = false; });
                updateCount();
            };

            overlay.addEventListener('click', function (ev) { if (ev.target === overlay) { overlay.remove(); resolve(null); } });
            overlay.querySelector('#bp-cancel').onclick = function () { overlay.remove(); resolve(null); };
            overlay.querySelector('#bp-confirm').onclick = function () {
                var selected = Array.from(overlay.querySelectorAll('input[type=checkbox]:checked')).map(function (i) { return i.dataset.cat; });
                overlay.remove();
                if (!selected.length) {
                    if (typeof showNotification === 'function') showNotification('请至少选择一个分类', 'warning', 2500);
                    resolve(null);
                    return;
                }
                resolve(selected);
            };
        });
    }

    /**
     * 打开备份与导入主面板
     */
    function openBackupPanel() {
        var overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;z-index:999999997;background:rgba(0,0,0,0.55);backdrop-filter:blur(10px);display:flex;align-items:flex-end;justify-content:center;';
        overlay.innerHTML =
            '<div style="width:100%;max-width:560px;background:var(--secondary-bg,#ffffff);border-radius:28px 28px 0 0;box-shadow:0 -12px 60px rgba(0,0,0,0.3);padding:18px 20px calc(20px + env(safe-area-inset-bottom,0px));max-height:92vh;display:flex;flex-direction:column;">' +
                '<div style="width:40px;height:4px;border-radius:2px;background:var(--border-color,#e5e5e5);margin:0 auto 16px;"></div>' +
                '<div style="font-size:19px;font-weight:800;color:var(--text-primary,#1a1a1a);margin-bottom:4px;display:flex;align-items:center;gap:8px;">' +
                    '<span style="font-size:20px;">💾</span>备份与导入' +
                '</div>' +
                '<div style="font-size:12px;color:var(--text-secondary,#8a8a8a);font-weight:500;margin-bottom:18px;">可以自由勾选要导出或导入的内容，建议定期全量备份哦 ✨</div>' +

                '<div style="display:flex;flex-direction:column;gap:14px;">' +
                    // 导出卡片
                    '<div id="bp-export-card" style="display:flex;flex-direction:column;gap:10px;padding:18px;border-radius:20px;background:linear-gradient(135deg,#faf7ff 0%,#fff0f5 100%);border:1.5px solid #eee5f5;cursor:pointer;transition:transform 0.15s;">' +
                        '<div style="display:flex;align-items:center;gap:12px;">' +
                            '<div style="width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,#b8a9c9,#d4c5e0);display:flex;align-items:center;justify-content:center;font-size:22px;color:#fff;box-shadow:0 4px 12px rgba(184,169,201,0.4);">📤</div>' +
                            '<div style="flex:1;">' +
                                '<div style="font-size:15px;font-weight:800;color:#3a2a4a;">导出备份</div>' +
                                '<div style="font-size:11.5px;color:#8a7da0;font-weight:500;margin-top:2px;">选择内容 → 生成 ZIP / JSON 文件保存到手机</div>' +
                            '</div>' +
                            '<div style="font-size:20px;color:#b8a9c9;">›</div>' +
                        '</div>' +
                    '</div>' +

                    // 导入卡片
                    '<div id="bp-import-card" style="display:flex;flex-direction:column;gap:10px;padding:18px;border-radius:20px;background:linear-gradient(135deg,#f0fff7 0%,#f0faff 100%);border:1.5px solid #e0f5e8;cursor:pointer;transition:transform 0.15s;">' +
                        '<div style="display:flex;align-items:center;gap:12px;">' +
                            '<div style="width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,#8bc9a9,#a4d9c0);display:flex;align-items:center;justify-content:center;font-size:22px;color:#fff;box-shadow:0 4px 12px rgba(139,201,169,0.4);">📥</div>' +
                            '<div style="flex:1;">' +
                                '<div style="font-size:15px;font-weight:800;color:#2a4a3a;">导入备份</div>' +
                                '<div style="font-size:11.5px;color:#6a9a8a;font-weight:500;margin-top:2px;">选择备份文件 → 选择要恢复的内容 → 生效</div>' +
                            '</div>' +
                            '<div style="font-size:20px;color:#8bc9a9;">›</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +

                // 隐藏的 file input
                '<input type="file" id="bp-import-file" accept=".zip,.json,application/zip,application/json" style="display:none;">' +

                '<div style="margin-top:18px;display:flex;justify-content:center;">' +
                    '<button id="bp-close" style="padding:12px 28px;border-radius:12px;border:none;background:var(--primary-bg,#f4f1f7);color:var(--text-primary,#1a1a1a);font-size:13px;font-weight:700;font-family:inherit;cursor:pointer;">关闭</button>' +
                '</div>' +
            '</div>';
        document.body.appendChild(overlay);

        overlay.addEventListener('click', function (ev) { if (ev.target === overlay) overlay.remove(); });
        overlay.querySelector('#bp-close').onclick = function () { overlay.remove(); };

        var importFileInput = overlay.querySelector('#bp-import-file');

        // 导出
        var exportCard = overlay.querySelector('#bp-export-card');
        exportCard.onclick = async function () {
            try {
                if (typeof ChatBackup === 'undefined' || !ChatBackup.exportBackupToFile) {
                    if (typeof showNotification === 'function') showNotification('备份模块未加载，请刷新', 'error');
                    return;
                }
                var picked = await openCategoryPicker('选择要导出的内容', '开始导出');
                if (!picked || !picked.length) return;
                var flags = categoriesToFlags(picked);
                // 让面板先关闭视觉上更顺
                // ChatBackup.exportBackupToFile 自己会弹通知
                await ChatBackup.exportBackupToFile(flags);
            } catch (e) {
                console.error('[bp] 导出失败', e);
                if (typeof showNotification === 'function') showNotification('导出失败：' + (e && e.message ? e.message : '未知错误'), 'error', 5000);
            }
        };

        // 导入
        var importCard = overlay.querySelector('#bp-import-card');
        importCard.onclick = function () {
            importFileInput.value = '';
            importFileInput.click();
        };
        importFileInput.onchange = async function (ev) {
            var file = ev.target.files && ev.target.files[0];
            if (!file) return;
            if (file.size > 250 * 1024 * 1024) {
                if (typeof showNotification === 'function') showNotification('文件过大（>250MB），请确认是否正确备份', 'error');
                return;
            }
            try {
                if (typeof ChatBackup === 'undefined' || !ChatBackup.loadBackupFromFile || !ChatBackup.applyBackupToStorage) {
                    if (typeof showNotification === 'function') showNotification('备份模块未加载，请刷新', 'error');
                    return;
                }
                if (typeof showNotification === 'function') showNotification('正在解析备份文件…', 'info', 2000);
                var data = await ChatBackup.loadBackupFromFile(file);
                var fullLike = ChatBackup.isFullBackupShape ? ChatBackup.isFullBackupShape(data) : true;
                if (!fullLike) {
                    if (typeof showNotification === 'function') showNotification('这不是本应用的备份文件', 'error');
                    return;
                }
                // 先让用户确认
                var ok = confirm('导入备份将按你的选择覆盖对应数据。\n\n头像/背景等勾选后会写入备份中的内容。\n\n确定继续吗？');
                if (!ok) return;

                var picked = await openCategoryPicker('选择要导入的内容', '开始恢复');
                if (!picked || !picked.length) return;

                if (typeof showNotification === 'function') showNotification('正在恢复数据…', 'info', 3000);
                await ChatBackup.applyBackupToStorage(data, {
                    selective: true,
                    selectedCategoryIds: picked,
                    categories: BACKUP_CATEGORIES
                });
                if (typeof showNotification === 'function') showNotification('恢复完成，即将刷新页面…', 'success', 2000);
                overlay.remove();
                setTimeout(function () { location.reload(); }, 2200);
            } catch (err) {
                console.error('[bp] 导入失败', err);
                var msg = err && err.message ? err.message : '未知错误';
                if (typeof showNotification === 'function') showNotification('导入失败：' + msg, 'error', 5000);
            }
        };
    }

    global.BackupPanel = {
        CATEGORIES: BACKUP_CATEGORIES,
        categoriesToFlags: categoriesToFlags,
        openCategoryPicker: openCategoryPicker,
        openBackupPanel: openBackupPanel
    };
})(typeof window !== 'undefined' ? window : this);
