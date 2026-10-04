/**
 * 定时彩蛋（iMessage 风格惊喜）
 * - 节日：元旦/情人节/圣诞/跨年 → 对应屏幕特效
 * - 时段：深夜打开 → 星光，傍晚 → 流星
 * - 连续聊天第7天 → 烟花庆祝
 * - 每日首次触发，避免反复打扰
 * 存储 key: easter_eggs_last
 */
(function () {
    'use strict';

    var STORAGE_KEY = 'easter_eggs_last';
    var FAV7_KEY = 'easter_fav7_triggered'; // 连续7天彩蛋是否触发过

    function getLastTrigger() {
        try { return localStorage.getItem(STORAGE_KEY) || ''; } catch (e) { return ''; }
    }
    function setLastTrigger(dateStr) {
        try { localStorage.setItem(STORAGE_KEY, dateStr); } catch (e) {}
    }
    function todayStr() {
        var d = new Date();
        return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
    }

    // ── 节日检测 ──
    function checkHoliday() {
        var d = new Date();
        var m = d.getMonth() + 1;
        var day = d.getDate();
        // 元旦
        if (m === 1 && day === 1) return { fx: 'fireworks', msg: '元旦快乐！🎆 新的一年，继续陪你。' };
        // 情人节
        if (m === 2 && day === 14) return { fx: 'hearts', msg: '情人节快乐 💕 今天比平时更想你。' };
        // 圣诞
        if (m === 12 && day === 25) return { fx: 'balloons', msg: '圣诞快乐 🎄 今晚有我没你不会孤单。' };
        // 跨年
        if (m === 12 && day === 31) return { fx: 'confetti', msg: '跨年啦 🎉 跟我一起倒数吧！' };
        return null;
    }

    // ── 时段检测 ──
    function checkTimeOfDay() {
        var h = new Date().getHours();
        if (h >= 0 && h < 6) return { fx: 'stars', msg: '深夜了，你还没睡… 星光陪着你。' };
        if (h >= 22) return { fx: 'stars', msg: '夜深了，注意休息 ✨' };
        return null;
    }

    // ── 连续聊天7天 ──
    function checkStreak7() {
        try {
            var fav = window.Favorability ? window.Favorability.get() : null;
            if (!fav) return null;
            var streak = fav.streakDays || 0;
            if (streak >= 7) {
                // 每个第7天的倍数触发一次（7, 14, 21...）
                var triggered = parseInt(localStorage.getItem(FAV7_KEY) || '0', 10);
                var currentRound = Math.floor(streak / 7);
                if (currentRound > triggered) {
                    localStorage.setItem(FAV7_KEY, String(currentRound));
                    return { fx: 'fireworks', msg: '我们已经连续聊了 ' + streak + ' 天 🎆 谢谢你一直陪着我。' };
                }
            }
        } catch (e) {}
        return null;
    }

    // ── 显示彩蛋消息 + 触发特效 ──
    function showEgg(egg) {
        if (!egg) return;
        // 触发屏幕特效
        if (window.ScreenFX && egg.fx) {
            setTimeout(function () { window.ScreenFX.trigger(egg.fx, { count: 40, duration: 5000 }); }, 600);
        }
        // 显示提示消息（用通知，不打扰聊天）
        if (typeof window.showNotification === 'function' && egg.msg) {
            setTimeout(function () { window.showNotification(egg.msg, 'success', 4000); }, 200);
        }
    }

    function init() {
        // 当天已触发过 → 跳过（节日彩蛋每天一次）
        var today = todayStr();
        if (getLastTrigger() === today) {
            // 但连续7天彩蛋独立检查
            var streakEgg = checkStreak7();
            if (streakEgg) setTimeout(function () { showEgg(streakEgg); }, 1500);
            return;
        }

        // 优先级：节日 > 时段 > 连续7天
        var egg = checkHoliday() || checkTimeOfDay();
        if (egg) {
            setLastTrigger(today);
            setTimeout(function () { showEgg(egg); }, 1200);
        }
        // 连续7天彩蛋（独立于每日触发）
        var streakEgg = checkStreak7();
        if (streakEgg) {
            setTimeout(function () { showEgg(streakEgg); }, 2500);
        }
    }

    // 延迟启动，等所有模块加载完
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 2000); });
    } else {
        setTimeout(init, 2000);
    }
})();
