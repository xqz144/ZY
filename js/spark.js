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
 * SparkTracker —— 数据读写层（父窗口与 spark iframe 共用）
 * 通过 localStorage (key = "mengjiao_spark") 同步数据
 *
 * v3 结构（单宠物 + 多形态）:
 *   { version: 3, form: "original"|"alternate", pet: { ... } }
 *
 * v2 结构（旧版多宠物）:
 *   { activePet: "fire", pets: { fire: { ... } } }
 *
 * 本文件兼容两种结构，遇到 v3 时不做转换，直接在 pet 字段上操作。
 * ================================================================== */
(function () {
  'use strict';

  if (window.SparkTracker && window.SparkTracker._ready) return;

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

  var MILESTONES = [
    { days: 3, label: "3天", icon: "🌱" },
    { days: 7, label: "7天", icon: "🌿" },
    { days: 14, label: "14天", icon: "🔥" },
    { days: 30, label: "30天", icon: "⭐" },
    { days: 50, label: "50天", icon: "💫" },
    { days: 100, label: "100天", icon: "👑" }
  ];

  var DAILY_LIMITS = { chat: 10, moments: 2 };
  var EXP_PER = { chat: 3, moments: 8 };
  var FULLNESS_MAX = 100;
  var MOOD_MAX = 100;
  var DEFAULT_NAME = '小火人';

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

  function petData(defaultName) {
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
      foods: {},
      name: defaultName
    };
  }

  function isV3(d) {
    return d && d.version === 3 && d.pet && typeof d.pet === 'object';
  }

  function defaultV3Data() {
    return {
      version: 3,
      form: 'original',
      pet: petData(DEFAULT_NAME)
    };
  }

  function migrateToV3(raw) {
    if (!raw) return defaultV3Data();
    if (isV3(raw)) return raw;
    var pet = petData(DEFAULT_NAME);
    if (raw.pets && typeof raw.pets === 'object') {
      var activeKey = raw.activePet && raw.pets[raw.activePet] ? raw.activePet : 'fire';
      var src = raw.pets[activeKey] || raw.pets.fire || {};
      for (var k in pet) {
        if (k in src && src[k] !== null && src[k] !== undefined) pet[k] = src[k];
      }
      pet.name = src.name || pet.name;
    } else {
      for (var k in pet) {
        if (k in raw && raw[k] !== null && raw[k] !== undefined) pet[k] = raw[k];
      }
    }
    if (!pet.name) pet.name = DEFAULT_NAME;
    if (!pet.avatar) pet.avatar = petData().avatar;
    return { version: 3, form: 'original', pet: pet };
  }

  function mergeObj(base, extra) {
    if (!extra) return base;
    for (var k in extra) {
      if (!Object.prototype.hasOwnProperty.call(extra, k)) continue;
      var v = extra[k];
      if (v === null || v === undefined) continue;
      if (typeof base[k] === 'object' && base[k] !== null && !Array.isArray(base[k]) &&
          typeof v === 'object' && !Array.isArray(v)) {
        base[k] = mergeObj(base[k], v);
      } else {
        base[k] = v;
      }
    }
    return base;
  }

  var SparkTracker = {
    _ready: true,

    load: function () {
      try {
        var raw = localStorage.getItem(SPARK_KEY);
        var d = raw ? JSON.parse(raw) : null;
        if (isV3(d)) {
          var pd = d.pet;
          if (!pd.avatar) pd.avatar = petData().avatar;
          if (typeof pd.fullness !== 'number') pd.fullness = 60;
          if (typeof pd.mood !== 'number') pd.mood = 60;
          if (!pd.foods) pd.foods = {};
          if (!pd.name) pd.name = DEFAULT_NAME;
          this._updateVitals(pd, false);
          return d;
        }
        d = migrateToV3(d);
        this._updateVitals(d.pet, false);
        this.save(d);
        return d;
      } catch (e) { /* ignore */ }
      var fresh = defaultV3Data();
      fresh.pet.lastVitalUpdate = new Date().toISOString();
      return fresh;
    },

    _updateVitals: function (pd, autoSave) {
      if (!pd) return;
      var now = new Date();
      var last = pd.lastVitalUpdate ? new Date(pd.lastVitalUpdate) : now;
      if (isNaN(last.getTime())) last = now;
      var hours = Math.max(0, (now - last) / 3600000);
      pd.fullness = Math.max(0, pd.fullness - hours * 2);
      pd.mood = Math.max(0, pd.mood - hours * 1);
      pd.lastVitalUpdate = now.toISOString();
      if (autoSave !== false) {
        var d = this.load();
        d.pet = pd;
        this.save(d);
      }
    },

    save: function (d) {
      if (!isV3(d)) d = migrateToV3(d);
      try { localStorage.setItem(SPARK_KEY, JSON.stringify(d)); } catch (e) { /* ignore */ }
    },

    current: function (d) {
      if (!d) d = this.load();
      return d.pet;
    },

    getActivePet: function () {
      return 'fire';
    },
    switchPet: function () {
      return false;
    },

    setName: function (name) {
      var d = this.load();
      d.pet.name = String(name || '').trim().slice(0, 12) || DEFAULT_NAME;
      this.save(d);
      return d.pet.name;
    },

    setForm: function (formId) {
      var d = this.load();
      d.form = formId;
      this.save(d);
      return true;
    },

    recordInteraction: function (type) {
      var d = this.load();
      var pd = d.pet;
      var t = todayStr();
      if (!pd.daily[t]) pd.daily[t] = { chat: 0, moments: 0 };
      if (pd.daily[t][type] >= DAILY_LIMITS[type]) {
        return { gained: 0, leveledUp: false, level: pd.level };
      }
      pd.daily[t][type]++;
      pd.totalInteractions++;
      var gained = EXP_PER[type] || 0;
      pd.exp += gained;
      pd.totalExp += gained;
      pd.fullness = Math.min(FULLNESS_MAX, pd.fullness + 0.3);
      pd.mood = Math.min(MOOD_MAX, pd.mood + 0.5);
      if (t !== pd.lastActiveDate) {
        if (pd.lastActiveDate === yesterdayStr()) pd.streak++;
        else if (pd.lastActiveDate !== t) pd.streak = 1;
        pd.lastActiveDate = t;
      } else if (pd.streak === 0) {
        pd.streak = 1;
      }
      var leveledUp = this._levelUpIfNeeded(pd);
      this._checkMilestones(pd);
      if (pd.makeupMonth !== monthKey()) {
        pd.makeupMonth = monthKey();
        pd.makeupCards = 1;
      }
      this.save(d);
      try { window.parent && window.parent.postMessage({ type: 'spark:update', leveledUp: leveledUp }, '*'); } catch (e) {}
      return { gained: gained, leveledUp: leveledUp, level: pd.level };
    },

    _levelUpIfNeeded: function (pd) {
      var leveledUp = false;
      while (pd.level < LEVELS.length && pd.exp >= LEVELS[pd.level - 1].need) {
        pd.exp -= LEVELS[pd.level - 1].need;
        pd.level++;
        leveledUp = true;
      }
      return leveledUp;
    },

    _checkMilestones: function (pd) {
      MILESTONES.forEach(function (m) {
        if (pd.streak >= m.days && pd.milestones.indexOf(m.days) === -1) {
          pd.milestones.push(m.days);
        }
      });
    },

    getState: function (petData) {
      var pd = petData || this.load().pet;
      var t = todayStr();
      var today = pd.daily[t] || { chat: 0, moments: 0 };
      var lastActive = pd.lastActiveDate;
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
