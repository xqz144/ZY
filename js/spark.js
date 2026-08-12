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
 * 支持多宠物：fire（小火人）/ kirin（玉麒麟），通过 activePet 切换
 * ================================================================== */
(function () {
  'use strict';

  if (window.SparkTracker && window.SparkTracker._multiPetReady) return;

  var SPARK_KEY = "mengjiao_spark";
  var ACTIVE_PET_KEY = 'mengjiao_active_pet';

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

  var PETS = {
    fire: {
      id: 'fire',
      name: '小火人',
      emoji: '🔥',
      image: 'assets/character.png',
      color: '#ff8a56'
    },
    kirin: {
      id: 'kirin',
      name: '玉麒麟',
      emoji: '🦁',
      image: 'assets/kirin_embroidery.png',
      color: '#c9303c'
    }
  };
  var PET_ORDER = ['fire', 'kirin'];

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

  function defaultData() {
    return {
      activePet: 'fire',
      pets: {
        fire: petData('小火人'),
        kirin: petData('玉麒麟')
      }
    };
  }

  var SparkTracker = {
    _multiPetReady: true,

    /* 宠物注册表（允许外部读取） */
    PETS: PETS,
    PET_ORDER: PET_ORDER,

    load: function () {
      try {
        var raw = localStorage.getItem(SPARK_KEY);
        if (raw) {
          var d = JSON.parse(raw);
          /* 旧格式迁移：单宠物数据 → 多宠物结构 */
          if (!d.pets) {
            var oldData = {};
            for (var k in d) { if (k !== 'activePet') oldData[k] = d[k]; }
            d = {
              activePet: 'fire',
              pets: { fire: oldData, kirin: petData('玉麒麟') }
            };
          }
          /* 确保所有宠物数据完整 */
          for (var pid in PETS) {
            if (!d.pets[pid]) d.pets[pid] = petData(PETS[pid].name);
            var pd = d.pets[pid];
            var def = petData(PETS[pid].name);
            for (var dk in def) { if (!(dk in pd)) pd[dk] = def[dk]; }
            if (!pd.avatar) pd.avatar = def.avatar;
            if (typeof pd.fullness !== "number") pd.fullness = def.fullness;
            if (typeof pd.mood !== "number") pd.mood = def.mood;
            if (!pd.foods) pd.foods = {};
            this.updateVitals(pd);
          }
          if (!d.activePet || !PETS[d.activePet]) d.activePet = 'fire';
          this.save(d);
          return d;
        }
      } catch (e) { /* ignore */ }
      var fresh = defaultData();
      for (var pid2 in fresh.pets) {
        fresh.pets[pid2].lastVitalUpdate = new Date().toISOString();
      }
      return fresh;
    },

    /* 兼容老代码：直接返回当前宠物数据 */
    _legacyWrap: function (d) {
      var pd = d.pets[d.activePet];
      var wrapped = {};
      for (var k in pd) wrapped[k] = pd[k];
      wrapped._root = d;
      return wrapped;
    },

    updateVitals: function (petData) {
      if (!petData) return;
      var now = new Date();
      var last = petData.lastVitalUpdate ? new Date(petData.lastVitalUpdate) : now;
      if (isNaN(last.getTime())) last = now;
      var hours = Math.max(0, (now - last) / 3600000);
      var fullnessDrop = hours * 2;
      var moodDrop = hours * 1;
      petData.fullness = Math.max(0, petData.fullness - fullnessDrop);
      petData.mood = Math.max(0, petData.mood - moodDrop);
      petData.lastVitalUpdate = now.toISOString();
    },

    save: function (d) {
      try { localStorage.setItem(SPARK_KEY, JSON.stringify(d)); } catch (e) { /* ignore */ }
    },

    /* 获取当前活跃宠物数据 */
    current: function (d) {
      if (!d) d = this.load();
      return d.pets[d.activePet];
    },

    /* 获取/设置当前活跃宠物（供父窗口调用） */
    getActivePet: function () {
      try {
        var saved = localStorage.getItem(ACTIVE_PET_KEY);
        if (saved && PETS[saved]) return saved;
      } catch (e) {}
      var d = this.load();
      return d.activePet || 'fire';
    },
    switchPet: function (petId) {
      var d = this.load();
      if (!PETS[petId] || !d.pets[petId]) return false;
      d.activePet = petId;
      this.save(d);
      try { localStorage.setItem(ACTIVE_PET_KEY, petId); } catch (e) {}
      return true;
    },

    setName: function (name) {
      var d = this.load();
      var pd = d.pets[d.activePet];
      pd.name = String(name || "").trim().slice(0, 12) || PETS[d.activePet].name;
      this.save(d);
      return pd.name;
    },

    /*
     * recordInteraction：父窗口（聊天页）每次发消息时调用
     * 操作当前活跃宠物的数据
     */
    recordInteraction: function (type) {
      var d = this.load();
      var pd = d.pets[d.activePet];
      var t = todayStr();
      if (!pd.daily[t]) pd.daily[t] = { chat: 0, moments: 0 };
      if (pd.daily[t][type] >= DAILY_LIMITS[type]) {
        return { gained: 0, leveledUp: false, level: pd.level, petId: d.activePet };
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
        else pd.streak = 1;
        pd.lastActiveDate = t;
      } else if (pd.streak === 0) {
        pd.streak = 1;
      }
      var leveledUp = false;
      while (pd.level < LEVELS.length && pd.exp >= LEVELS[pd.level - 1].need) {
        pd.exp -= LEVELS[pd.level - 1].need;
        pd.level++;
        leveledUp = true;
      }
      MILESTONES.forEach(function (m) {
        if (pd.streak >= m.days && pd.milestones.indexOf(m.days) === -1) {
          pd.milestones.push(m.days);
        }
      });
      if (pd.makeupMonth !== monthKey()) {
        pd.makeupMonth = monthKey();
        pd.makeupCards = 1;
      }
      this.save(d);
      return { gained: gained, leveledUp: leveledUp, level: pd.level, petId: d.activePet };
    },

    getState: function (petData) {
      var d = this.load();
      var pd = petData || d.pets[d.activePet];
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
