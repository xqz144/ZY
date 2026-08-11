document.addEventListener('DOMContentLoaded', async () => {
    const loaderBar = document.getElementById('loader-tech-bar');
    const welcomeSubtitle = document.querySelector('.welcome-subtitle-scramble');
    const welcomeScreen = document.getElementById('welcome-animation');
    const disclaimerModal = document.getElementById('disclaimer-modal');
    const acceptDisclaimerBtn = document.getElementById('accept-disclaimer');

    // ========== 强制隐藏保险：无论初始化成功/失败/卡住，8秒后/15秒轮询兜底隐藏welcome ==========
    (function installWelcomeForceHideSafetyNet() {
      // 合法面板白名单（外观设置/字卡库/聊天设置等，绝对不能误伤）
      var LEGIT_WHITELIST_IDS = [
        'customize-overlay','customize-panel',
        'chat-modal','stats-modal','moyu-modal','envelope-modal','group-chat-modal','custom-replies-modal',
        'shop-container','pet-container','moments-container',
        'extapp-diary','extapp-wish','extapp-spark','extapp-anniversary','extapp-music','extapp-call','extapp-history',
        'ti-settings-modal','settings-modal','disclaimer-modal','gift-cabinet-modal'
      ];
      function forceHideAllOverlays() {
        try {
          var wel = document.getElementById('welcome-animation');
          if (wel) { wel.classList.add('hidden'); wel.style.display = 'none'; wel.style.visibility = 'hidden'; wel.style.zIndex = '-9999'; }
          var splash = document.getElementById('splash-declaration');
          if (splash) { splash.style.display = 'none'; splash.classList.add('splash-fade-out'); }
          var tour = document.getElementById('tour-overlay');
          if (tour) { tour.style.display = 'none'; tour.classList.remove('active','show','open'); }
          // 选择器极度收敛：只关真正的启动遮罩类，绝不碰 customize-overlay、各种 .modal
          var masks = document.querySelectorAll('.onboarding-modal, .onboarding-overlay, .modal-backdrop, .modal-mask, .mask-layer');
          masks.forEach(function(m){
            try {
              // 白名单检查：ID/父级ID在白名单直接跳过
              var skip = false;
              var p = m;
              for (var i=0; i<5 && p; i++, p=p.parentNode) {
                if (p && p.id && LEGIT_WHITELIST_IDS.indexOf(p.id) !== -1) { skip = true; break; }
              }
              if (skip) return;
              // 只移除状态类，不硬写 style.display（硬写会把外观设置等永久关死）
              m.classList.remove('active','show','open');
} catch(e) { console.warn('empty catch at app.js:39', e); }
          });
          // 保险：如果 customize-overlay 已经有 .active 却被写了 display:none，清空让 CSS 生效
          var co = document.getElementById('customize-overlay');
          if (co && co.classList.contains('active') && co.style && co.style.display === 'none') {
            co.style.display = '';
            co.style.visibility = '';
            co.style.zIndex = '';
          }
} catch(e) { console.warn('empty catch at app.js:48', e); }
      }
      // 首次 8 秒绝对兜底（防止 initializeSession/loadData 卡住导致 setTimeout(hideWelcome) 不执行）
      setTimeout(forceHideAllOverlays, 8000);
      // 再隔 15 秒、30 秒、60 秒再兜一次（缓存/性能慢的设备），间隔拉大避免打扰正常面板
      setTimeout(forceHideAllOverlays, 15000);
      setTimeout(forceHideAllOverlays, 30000);
      setTimeout(forceHideAllOverlays, 60000);
      // 20 秒一次常驻轮询（间隔拉宽至 20s，防止刚点开外观设置就被兜）
      setInterval(forceHideAllOverlays, 20000);
      // 每次用户回到可见页面立即兜一次
      document.addEventListener('visibilitychange', function(){ if (document.visibilityState==='visible') forceHideAllOverlays(); });
      window.addEventListener('pageshow', forceHideAllOverlays);
    })();

    const updateLoader = (text, width) => {
        if (welcomeSubtitle) welcomeSubtitle.textContent = text;
        if (loaderBar) loaderBar.style.width = width;
    };

    const hideWelcomeScreen = () => {
        if (!welcomeScreen) return;
        welcomeScreen.classList.add('hidden');
        setTimeout(() => {
            welcomeScreen.style.display = 'none';
            welcomeScreen.style.visibility = 'hidden';
            welcomeScreen.style.zIndex = '-9999';
            // 加载动画结束后显示主页
            if (typeof window.showHomePage === 'function') {
                window.showHomePage();
            }
        }, 800);
    };

    const safeAwait = async (promise, fallback = null) => {
        try {
            return await promise;
        } catch (error) {
            console.error('操作失败:', error);
            return fallback;
        }
    };

    try {
        try { setupEventListeners?.(); } catch(e) { console.error('setupEventListeners:', e); }

        if (typeof localforage === 'undefined') {
            console.warn('LocalForage 未加载，将使用 localStorage 降级方案');
        }

        try {
            const emergencyBackupRaw = localStorage.getItem('BACKUP_V1_critical');
            if (emergencyBackupRaw) {
                const emergencyBackup = JSON.parse(emergencyBackupRaw);
                if (emergencyBackup && Array.isArray(emergencyBackup.messages) && emergencyBackup.messages.length > 0) {
                    console.warn('[boot] 检测到紧急备份，可用于异常恢复');
                }
            }
        } catch (e) {
            console.warn('[boot] 紧急备份检查失败:', e);
        }

        updateLoader('正在建立安全连接...', '10%');
        await safeAwait(initializeSession());

        updateLoader('正在读取记忆存档...', '40%');
        await safeAwait(loadData());

        updateLoader('正在渲染我们的世界...', '70%');
        
        await Promise.allSettled([
            safeAwait(initializeRandomUI?.())
        ]);

        setInterval(checkStatusChange, 60000);

        if (disclaimerModal) {
            const tourSeen = await safeAwait(localforage?.getItem(APP_PREFIX + 'tour_seen'), false);
            
            if (!tourSeen) {
                showModal(disclaimerModal);
                
                if (acceptDisclaimerBtn && !acceptDisclaimerBtn._bound) {
                    acceptDisclaimerBtn._bound = true;
                    acceptDisclaimerBtn.addEventListener('click', () => {
                        hideModal(disclaimerModal);
                        localforage?.setItem(APP_PREFIX + 'tour_seen', true).catch(() => {});
                        startTour?.();
                    }, { once: true });
                }
            }
        }

        updateLoader('连接成功，欢迎回来。', '100%');
        setTimeout(hideWelcomeScreen, 3500);

        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                try {
                    if (typeof saveTimeout !== 'undefined') clearTimeout(saveTimeout);
} catch(e) { console.warn('empty catch at app.js:148', e); }
                try { _backupCriticalData(); } catch (e) { console.warn('[visibilitychange] 紧急备份失败:', e); }
                try {
                    const p = saveData();
                    if (p && typeof p.catch === 'function') {
                        p.catch(e => console.error('[visibilitychange] 保存失败:', e));
                    }
                } catch (e) {
                    console.error('[visibilitychange] 保存失败:', e);
                }
            } else if (document.visibilityState === 'visible') {
                try {
                    const backup = typeof _tryRecoverFromBackup === 'function' ? _tryRecoverFromBackup() : null;
                    if (backup && Array.isArray(backup.messages) && backup.messages.length > 0 && Array.isArray(messages) && backup.messages.length > messages.length) {
                        console.warn('[visibilitychange] 检测到备份消息比当前更多，自动尝试恢复');
                        try {
                            messages = backup.messages.map(m => ({
                                ...m,
                                timestamp: new Date(m.timestamp)
                            }));
                            if (backup.settings) Object.assign(settings, backup.settings);
                            if (typeof updateUI === 'function') updateUI();
                            if (typeof throttledSaveData === 'function') throttledSaveData();
                            showNotification('已自动恢复本地临时备份内容', 'warning', 3500);
                        } catch (restoreErr) {
                            console.warn('[visibilitychange] 自动恢复失败，保留当前页面内容:', restoreErr);
                        }
                    }
                } catch (e) {
                    console.warn('[visibilitychange] 恢复备份失败:', e);
                }
            }
        });

        window.addEventListener('pagehide', () => {
            try { _backupCriticalData(); } catch (e) {}
        });

        window.addEventListener('beforeunload', () => {
            try { _backupCriticalData(); } catch (e) {}
        });

        setInterval(() => {
            saveData().catch(e => console.warn('[autoBackup] 定时保存失败:', e));
        }, 3 * 60 * 1000);

        (() => {
            const REMIND_KEY = 'exportReminderLastShown';
            const last = parseInt(localStorage.getItem(REMIND_KEY) || '0', 10);
            const daysSince = (Date.now() - last) / (1000 * 60 * 60 * 24);
            if (daysSince >= 7) {
                setTimeout(() => {
                    showNotification('建议定期导出备份，防止数据意外丢失', 'info', 7000);
                    localStorage.setItem(REMIND_KEY, String(Date.now()));
                }, 8000);
            }
        })();

        setTimeout(async () => {
            if ('Notification' in window && Notification.permission === 'default') {
                try {
                    const permission = await Notification.requestPermission();
                    if (permission === 'granted') {
                        showNotification('已开启系统通知，收到消息时会提醒你', 'success', 3000);
                    }
                } catch(e) {
                    console.warn('通知权限请求失败:', e);
                }
            }
        }, 3000);

    } catch (err) {
        console.error('严重初始化错误:', err);
        try {
            const backup = typeof _tryRecoverFromBackup === 'function' ? _tryRecoverFromBackup() : null;
            if (backup && Array.isArray(backup.messages) && backup.messages.length > 0) {
                messages = backup.messages.map(m => ({
                    ...m,
                    timestamp: new Date(m.timestamp)
                }));
                if (backup.settings) Object.assign(settings, backup.settings);
                if (typeof updateUI === 'function') updateUI();
                showNotification('初始化异常，已使用本地紧急备份恢复', 'warning', 5000);
            }
        } catch (recoverErr) {
            console.warn('[boot] 初始化失败后的恢复也失败:', recoverErr);
        }
        updateLoader('加载遇到问题，已强制进入...', '100%');
        setTimeout(hideWelcomeScreen, 3500);
    }
});
const stickerInput = document.getElementById('sticker-file-input');
            if (stickerInput) {
                stickerInput.addEventListener('change', async (e) => {
                    const files = Array.from(e.target.files);
                    if (!files.length) return;

                    const oversized = files.filter(f => f.size > 2 * 1024 * 1024);
                    if (oversized.length > 0) {
                        showNotification(oversized.length + ' 张图片超过 2MB 限制，已跳过', 'warning');
                    }

                    const validFiles = files.filter(f => f.size <= 2 * 1024 * 1024);
                    if (!validFiles.length) return;

                    showNotification('正在批量处理 ' + validFiles.length + ' 张图片...', 'info');

                    let successCount = 0;
                    let failCount = 0;

                    for (const file of validFiles) {
                        try {
                            const base64 = await optimizeImage(file, 300, 0.8);
                            stickerLibrary.push(base64);
                            // 同步更新全局变量
                            window._stickerLibrary = stickerLibrary;
                            successCount++;
                        } catch (err) {
                            console.error(err);
                            failCount++;
                        }
                    }

                    // 通知其他模块表情包已更新
                    try {
                        window.dispatchEvent(new CustomEvent('stickerLibraryUpdated', { detail: { count: stickerLibrary.length } }));
} catch(e) { console.warn('empty catch at app.js:274', e); }

                    throttledSaveData();
                    renderReplyLibrary();

                    if (failCount > 0) {
                        showNotification('上传完成：' + successCount + ' 张成功，' + failCount + ' 张失败', 'warning');
                    } else {
                        showNotification('上传成功，共 ' + successCount + ' 张', 'success');
                    }

                    e.target.value = '';
                });
            }
const myStickerQuickUpload = document.getElementById('my-sticker-quick-upload');
if (myStickerQuickUpload) {
    myStickerQuickUpload.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;
        const oversized = files.filter(f => f.size > 2 * 1024 * 1024);
        if (oversized.length > 0) showNotification(oversized.length + ' 张图片超过 2MB，已跳过', 'warning');
        const validFiles = files.filter(f => f.size <= 2 * 1024 * 1024);
        if (!validFiles.length) return;
        showNotification('正在处理 ' + validFiles.length + ' 张...', 'info');
        let ok = 0, fail = 0;
        for (const file of validFiles) {
            try {
                const base64 = await optimizeImage(file, 300, 0.8);
                myStickerLibrary.push(base64);
                ok++;
            } catch(err) { fail++; }
        }
        throttledSaveData();
        if (typeof renderComboContent === 'function') renderComboContent('my-sticker');
        showNotification(fail > 0 ? `上传完成：${ok} 成功 ${fail} 失败` : `✓ 已添加 ${ok} 张到我的表情库`, fail > 0 ? 'warning' : 'success');
        e.target.value = '';
    });
}

window.addEventListener('load', function() {
    setTimeout(function() {
        try {
            if (localStorage.getItem('dailyGreetingShown') === new Date().toDateString()) return;
            try { if (typeof checkPartnerDailyMood === 'function') checkPartnerDailyMood(); } catch(e2) { console.warn('checkPartnerDailyMood error:', e2); }
            if (typeof _buildDailyGreeting === 'function') _buildDailyGreeting();
            if (window.localforage && window.APP_PREFIX) {
                localforage.getItem(window.APP_PREFIX + 'tour_seen').then(function(seen) {
                    if (seen) {
                        var modal = document.getElementById('daily-greeting-modal');
                        if (modal) modal.classList.remove('hidden');
                        localStorage.setItem('dailyGreetingShown', new Date().toDateString());
                    }
                }).catch(function() {
                    var modal = document.getElementById('daily-greeting-modal');
                    if (modal) modal.classList.remove('hidden');
                    localStorage.setItem('dailyGreetingShown', new Date().toDateString());
                });
            } else {
                var modal = document.getElementById('daily-greeting-modal');
                if (modal) modal.classList.remove('hidden');
                localStorage.setItem('dailyGreetingShown', new Date().toDateString());
            }
        } catch(e) { console.warn('Daily greeting timing error:', e); }
    }, 4500);
}, { once: true });
