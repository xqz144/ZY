/**
 * 火花功能 - Streak
 * 连续聊天超过3天出现火花图标，断聊后变灰，连续3天重燃
 */
(function() {
  'use strict';

  const STORAGE_KEY = 'chat_streak_data';
  const STREAK_THRESHOLD = 3;      // 出现火花所需连续天数
  const REKINDLE_THRESHOLD = 3;    // 重燃所需连续天数

  // 火花数据
  let streakData = {
    currentStreak: 0,      // 当前连续天数
    maxStreak: 0,          // 历史最高连续天数
    rekindleCount: 0,      // 重燃次数
    lastChatDate: null,    // 最后聊天日期 (YYYY-MM-DD)
    isActive: false,       // 火花是否燃烧中
    rekindleProgress: 0,   // 重燃进度（0-3）
    history: []            // 历史记录 [{date, userMsg, partnerMsg}]
  };

  // ========== 工具函数 ==========

  function getTodayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  function getDateDiff(date1, date2) {
    const d1 = new Date(date1 + 'T00:00:00');
    const d2 = new Date(date2 + 'T00:00:00');
    return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
  }

  function loadStreakData() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        streakData = { ...streakData, ...parsed };
      }
    } catch(e) {}
  }

  function saveStreakData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(streakData));
    } catch(e) {}
  }

  // ========== 核心逻辑 ==========

  /**
   * 记录一次聊天（用户发送消息时调用）
   */
  function recordChat() {
    const today = getTodayStr();

    // 今天已经记录过，不重复处理
    if (streakData.lastChatDate === today) return;

    const diff = streakData.lastChatDate ? getDateDiff(streakData.lastChatDate, today) : 999;

    if (diff === 1) {
      // 连续聊天
      streakData.currentStreak++;
      streakData.rekindleProgress++;

      // 检查是否达到出现火花条件
      if (!streakData.isActive && streakData.currentStreak >= STREAK_THRESHOLD) {
        streakData.isActive = true;
        streakData.rekindleProgress = 0;
        showSparkNotification('🔥 火花出现！已连续聊天 ' + streakData.currentStreak + ' 天');
      }
      // 检查是否重燃成功
      else if (!streakData.isActive && streakData.rekindleProgress >= REKINDLE_THRESHOLD) {
        streakData.isActive = true;
        streakData.currentStreak = streakData.rekindleProgress;
        streakData.rekindleCount++;
        streakData.rekindleProgress = 0;
        showSparkNotification('🔥 火花重燃！连续聊天 ' + streakData.currentStreak + ' 天');
      }
      // 火花继续燃烧
      else if (streakData.isActive) {
        if (streakData.currentStreak > streakData.maxStreak) {
          streakData.maxStreak = streakData.currentStreak;
        }
      }
    } else if (diff > 1) {
      // 断聊了，火花熄灭
      if (streakData.isActive) {
        streakData.isActive = false;
        streakData.rekindleProgress = 0;
        showSparkNotification('💨 火花已熄灭，连续聊天可重燃');
      }
      streakData.currentStreak = 1;
      streakData.rekindleProgress = 1;
    } else {
      // diff <= 0 同一天或异常，不处理
      return;
    }

    streakData.lastChatDate = today;
    saveStreakData();
    updateSparkUI();
  }

  /**
   * 记录对方消息（确保双方都有消息才算聊过）
   */
  function recordPartnerChat() {
    // 对方消息只标记当天有互动，实际计数在用户发送时处理
    // 这里可以扩展为需要双方都有消息才算的逻辑
  }

  // ========== UI 更新 ==========

  function updateSparkUI() {
    const icon = document.getElementById('spark-icon');
    const badge = document.getElementById('spark-badge');
    if (!icon) return;

    if (streakData.isActive) {
      icon.className = 'spark-icon active';
      icon.style.display = 'flex';
      if (badge) {
        badge.textContent = streakData.currentStreak;
        badge.style.display = 'block';
      }
    } else if (streakData.currentStreak > 0 || streakData.rekindleProgress > 0) {
      // 有连续记录但火花未激活（重燃中或刚断）
      icon.className = 'spark-icon inactive';
      icon.style.display = 'flex';
      if (badge) {
        const days = streakData.rekindleProgress || streakData.currentStreak;
        badge.textContent = days;
        badge.style.display = days > 0 ? 'block' : 'none';
      }
    } else {
      icon.style.display = 'none';
    }
  }

  function showSparkNotification(text) {
    if (typeof showNotification === 'function') {
      showNotification(text, 'info', 3000);
    }
  }

  // ========== 弹窗 ==========

  function openSparkModal() {
    const overlay = document.getElementById('spark-modal-overlay');
    if (!overlay) return;

    const flame = document.getElementById('spark-modal-flame');
    const title = document.getElementById('spark-modal-title');
    const subtitle = document.getElementById('spark-modal-subtitle');
    const streakDays = document.getElementById('spark-streak-days');
    const rekindleCount = document.getElementById('spark-rekindle-count');
    const info = document.getElementById('spark-rekindle-info');

    if (streakData.isActive) {
      if (flame) { flame.textContent = '🔥'; }
      title.textContent = '火花燃烧中';
      subtitle.textContent = '保持连续聊天，让火花更旺！';
      if (info) {
        info.className = 'spark-rekindle-info';
        info.querySelector('.rekindle-text').textContent = '✨ 火花状态良好';
        info.querySelector('.rekindle-sub').textContent = '继续保持连续聊天吧！';
      }
    } else if (streakData.rekindleProgress > 0) {
      if (flame) { flame.textContent = '💫'; }
      title.textContent = '正在重燃火花';
      subtitle.textContent = '连续聊天中，火花即将重燃！';
      if (info) {
        info.className = 'spark-rekindle-info needed';
        const need = REKINDLE_THRESHOLD - streakData.rekindleProgress;
        info.querySelector('.rekindle-text').textContent = '💡 还需连续聊天';
        info.querySelector('.rekindle-sub').textContent = '再聊 ' + need + ' 天即可重燃火花！';
      }
    } else {
      if (flame) { flame.textContent = '💨'; }
      title.textContent = '火花已熄灭';
      subtitle.textContent = '昨天没有聊天，火花变灰了...';
      if (info) {
        info.className = 'spark-rekindle-info needed';
        info.querySelector('.rekindle-text').textContent = '💡 还需连续聊天';
        info.querySelector('.rekindle-sub').textContent = '再聊 ' + REKINDLE_THRESHOLD + ' 天即可重燃火花！';
      }
    }

    streakDays.textContent = streakData.currentStreak;
    rekindleCount.textContent = streakData.rekindleCount;

    overlay.style.display = 'flex';
    overlay.style.opacity = '1';
    overlay.style.visibility = 'visible';
  }

  function closeSparkModal() {
    const overlay = document.getElementById('spark-modal-overlay');
    if (overlay) {
      overlay.style.display = 'none';
      overlay.style.opacity = '0';
      overlay.style.visibility = 'hidden';
    }
  }

  // ========== 初始化 ==========

  function init() {
    // 确保弹窗在 body 直接子级（避免被父容器 overflow:hidden 裁剪）
    var overlay = document.getElementById('spark-modal-overlay');
    if (overlay && overlay.parentElement && overlay.parentElement.tagName !== 'BODY') {
      document.body.appendChild(overlay);
    }
    loadStreakData();
    updateSparkUI();
  }

  // 页面加载时初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 暴露到全局
  window.SparkApp = {
    recordChat,
    recordPartnerChat,
    openSparkModal,
    closeSparkModal,
    getData: () => ({ ...streakData })
  };

})();

/* ==================================================================
 * 小火人 SparkTracker —— 共享数据层（父窗口与 spark iframe 共用）
 * 通过 localStorage (key = "mengjiao_spark") 同步数据
 * ================================================================== */
(function () {
  'use strict';

  if (window.SparkTracker) return;

  var SPARK_KEY = "mengjiao_spark";

  var LEVELS = [
    { lv: 1, title: "小火苗", need: 50 },
    { lv: 2, title: "小火人", need: 150 },
    { lv: 3, title: "火精灵", need: 350 },
    { lv: 4, title: "烈焰使者", need: 700 },
    { lv: 5, title: "焰神", need: 1200 },
    { lv: 6, title: "传说之焰", need: 2000 },
    { lv: 7, title: "永恒之火", need: 999999 }
  ];

  var DAILY_LIMITS = { chat: 10, moments: 2 };
  var EXP_PER = { chat: 3, moments: 8 };
  var FULLNESS_MAX = 100;
  var MOOD_MAX = 100;

  function todayStr() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
  }
  function yesterdayStr() {
    var d = new Date(); d.setDate(d.getDate()-1);
    return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
  }
  function monthKey() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0");
  }

  function defaultData() {
    return {
      level: 1,
      exp: 0,
      totalExp: 0,
      streak: 0,
      lastActiveDate: "",
      totalInteractions: 0,
      makeupCards: 1,
      makeupMonth: monthKey(),
      milestones: [],
      avatar: { hairColor: "purple", outfitColor: "maroon", earColor: "brown", eyes: "round", mouth: "smile", accessory: "none", pose: "idle" },
      daily: {},
      fullness: 60,
      mood: 60,
      lastFed: "",
      lastVitalUpdate: "",
      foods: {}
    };
  }

  var SparkTracker = {
    load: function () {
      try {
        var raw = localStorage.getItem(SPARK_KEY);
        if (raw) {
          var d = JSON.parse(raw);
          var def = defaultData();
          for (var k in def) { if (!(k in d)) d[k] = def[k]; }
          if (!d.avatar) d.avatar = def.avatar;
          if (typeof d.fullness !== "number") d.fullness = def.fullness;
          if (typeof d.mood !== "number") d.mood = def.mood;
          if (!d.foods) d.foods = {};
          this.updateVitals(d);
          return d;
        }
      } catch (e) {}
      var fresh = defaultData();
      fresh.lastVitalUpdate = new Date().toISOString();
      return fresh;
    },
    updateVitals: function (d) {
      var now = new Date();
      var last = d.lastVitalUpdate ? new Date(d.lastVitalUpdate) : now;
      if (isNaN(last.getTime())) last = now;
      var hours = Math.max(0, (now - last) / 3600000);
      var fullnessDrop = hours * 2;
      var moodDrop = hours * 1;
      d.fullness = Math.max(0, d.fullness - fullnessDrop);
      d.mood = Math.max(0, d.mood - moodDrop);
      d.lastVitalUpdate = now.toISOString();
    },
    save: function (d) {
      try { localStorage.setItem(SPARK_KEY, JSON.stringify(d)); } catch (e) {}
    },
    recordInteraction: function (type) {
      var d = this.load();
      var t = todayStr();
      if (!d.daily[t]) d.daily[t] = { chat: 0, moments: 0 };
      if (d.daily[t][type] >= DAILY_LIMITS[type]) return { gained: 0, leveledUp: false, level: d.level };
      d.daily[t][type]++;
      d.totalInteractions++;
      var gained = EXP_PER[type] || 0;
      d.exp += gained;
      d.totalExp += gained;
      // 每次互动略微增加饱腹/心情（让聊天能实时带动小火人状态）
      d.fullness = Math.min(FULLNESS_MAX, d.fullness + 0.3);
      d.mood = Math.min(MOOD_MAX, d.mood + 0.5);
      if (t !== d.lastActiveDate) {
        if (d.lastActiveDate === yesterdayStr()) d.streak++;
        else d.streak = 1;
        d.lastActiveDate = t;
      } else if (d.streak === 0) {
        d.streak = 1;
      }
      var leveledUp = false;
      while (d.level < LEVELS.length && d.exp >= LEVELS[d.level - 1].need) {
        d.exp -= LEVELS[d.level - 1].need;
        d.level++;
        leveledUp = true;
      }
      if (d.makeupMonth !== monthKey()) {
        d.makeupMonth = monthKey();
        d.makeupCards = 1;
      }
      this.save(d);
      return { gained: gained, leveledUp: leveledUp, level: d.level };
    },
    getState: function () {
      var d = this.load();
      var t = todayStr();
      var today = d.daily[t] || { chat: 0, moments: 0 };
      var lastActive = d.lastActiveDate;
      var state = "sleeping";
      if (lastActive === t && (today.chat > 0 || today.moments > 0)) {
        state = "happy";
      } else if (lastActive === yesterdayStr()) {
        state = "calm";
      } else {
        var d2 = new Date((lastActive || "") + "T00:00:00");
        var now = new Date();
        var diff = Math.round((now - d2) / 86400000);
        if (isNaN(diff) || diff < 0) diff = 99;
        if (diff <= 2) state = "hungry";
        else if (diff <= 3) state = "weak";
        else state = "sleeping";
      }
      return state;
    }
  };

  window.SparkTracker = SparkTracker;
})();
