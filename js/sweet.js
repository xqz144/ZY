/**
 * 甜蜜轨迹 - sweet.js
 * 情侣日常记录应用：恋爱打卡 / 纪念日 / 甜蜜日记 / 愿望清单
 * 数据存储：localStorage（key: mengjiao_sweet），与主站同源共享。
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'mengjiao_sweet';

  /* ========== 默认数据 ========== */
  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function pad(n) { return String(n).padStart(2, '0'); }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  function defaultData() {
    return {
      version: 1,
      togetherDate: todayStr(),
      checkins: [
        { id: uid(), name: '说"我爱你"', emoji: 'heart', custom: false },
        { id: uid(), name: '拥抱一下', emoji: 'users', custom: false },
        { id: uid(), name: '说晚安', emoji: 'moon', custom: false },
        { id: uid(), name: '亲一下', emoji: 'sparkles', custom: false },
        { id: uid(), name: '聊聊今天', emoji: 'message-circle', custom: false },
        { id: uid(), name: '一起喝水', emoji: 'coffee', custom: false }
      ],
      checkinRecords: {},     // { 'YYYY-MM-DD': { checkinId: true } }
      anniversaries: [
        { id: uid(), name: '我们在一起', date: todayStr(), emoji: 'heart', type: 'anniversary' }
      ],
      diaries: [],
      moodCalendar: {},        // { 'YYYY-MM-DD': 'happy'|'love'|'x'|'leaf'|'coffee'|'sad'|'angry'|'search' }
      wishes: [
        { id: uid(), title: '一起看一场电影', category: '一起去', done: false, ts: Date.now() },
        { id: uid(), title: '一起去海边', category: '一起去', done: false, ts: Date.now() },
        { id: uid(), title: '送TA一份小礼物', category: '想买', done: false, ts: Date.now() }
      ]
    };
  }

  /* ========== 读写 ========== */
  var cache = null;
  function load() {
    if (cache) return cache;
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      cache = raw ? JSON.parse(raw) : defaultData();
      cache = migrate(cache);
    } catch (e) {
      cache = defaultData();
    }
    return cache;
  }
  function migrate(d) {
    if (!d || typeof d !== 'object') return defaultData();
    if (!d.version) d.version = 1;
    if (!d.togetherDate) d.togetherDate = todayStr();
    if (!Array.isArray(d.checkins)) d.checkins = [];
    if (!d.checkinRecords || typeof d.checkinRecords !== 'object') d.checkinRecords = {};
    if (!Array.isArray(d.anniversaries)) d.anniversaries = [];
    if (!Array.isArray(d.diaries)) d.diaries = [];
    if (!d.moodCalendar || typeof d.moodCalendar !== 'object') d.moodCalendar = {};
    if (!Array.isArray(d.wishes)) d.wishes = [];
    return d;
  }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cache)); }
    catch (e) { console.warn('[甜蜜轨迹] 保存失败', e); }
  }
  function getData() { return load(); }

  /* ========== 日期工具 ========== */
  function daysBetween(fromStr, toStr) {
    var a = new Date(fromStr + 'T00:00:00');
    var b = new Date((toStr || todayStr()) + 'T00:00:00');
    if (isNaN(a.getTime()) || isNaN(b.getTime())) return 0;
    return Math.max(0, Math.round((b - a) / 86400000));
  }
  function formatDateCN(dateStr) {
    if (!dateStr) return '';
    var d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return dateStr;
    return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日';
  }
  function relativeDay(dateStr) {
    var diff = daysBetween(dateStr, todayStr());
    if (diff === 0) return '今天';
    if (diff === 1) return '昨天';
    if (diff < 7) return diff + '天前';
    if (diff < 30) return Math.floor(diff / 7) + '周前';
    if (diff < 365) return Math.floor(diff / 30) + '个月前';
    return Math.floor(diff / 365) + '年前';
  }

  /* ========== Lucide 重新渲染 ========== */
  function refreshIcons() {
    try {
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    } catch (e) {}
  }

  /* ========== Toast ========== */
  function toast(msg) {
    var old = document.querySelector('.sweet-toast');
    if (old) old.remove();
    var t = document.createElement('div');
    t.className = 'sweet-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.remove(); }, 2000);
  }

  /* ========== 转义 ========== */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* ================================================================
     渲染：Hero 在一起天数
     ================================================================ */
  function renderHero() {
    var d = getData();
    var days = daysBetween(d.togetherDate, todayStr());
    var daysEl = document.getElementById('together-days');
    var subEl = document.getElementById('together-sub');
    if (daysEl) daysEl.textContent = days;
    if (subEl) subEl.textContent = '从 ' + formatDateCN(d.togetherDate) + ' 开始';
  }

  /* ================================================================
     恋爱打卡
     ================================================================ */
  function renderCheckin() {
    var d = getData();
    var today = todayStr();
    var todayRec = d.checkinRecords[today] || {};
    var doneCount = d.checkins.filter(function (c) { return todayRec[c.id]; }).length;
    var total = d.checkins.length;

    // 统计卡
    var statsEl = document.getElementById('checkin-stats');
    if (statsEl) {
      statsEl.innerHTML =
        statCard(doneCount + '/' + total, '今日打卡') +
        statCard(calcStreak(d), '连续天数') +
        statCard(total, '打卡项目');
    }

    // 列表
    var listEl = document.getElementById('checkin-list');
    if (!listEl) return;
    if (!d.checkins.length) {
      listEl.innerHTML = emptyState('flower', '还没有打卡项目，点右上角添加吧');
      return;
    }
    var html = '';
    d.checkins.forEach(function (c) {
      var done = !!todayRec[c.id];
      var icon = c.emoji || 'star';
      html += '<div class="sweet-checkin-item' + (done ? ' done' : '') + (c.custom ? ' custom' : '') + '" data-id="' + esc(c.id) + '">' +
        '<span class="sweet-checkin-emoji"><i data-lucide="' + esc(icon) + '"></i></span>' +
        '<span class="sweet-checkin-name">' + esc(c.name) + '</span>' +
        '<span class="sweet-checkin-tick"><i data-lucide="check"></i></span>' +
        (c.custom ? '<button class="sweet-checkin-del" data-del="' + esc(c.id) + '" title="删除">×</button>' : '') +
        '</div>';
    });
    listEl.innerHTML = html;
    refreshIcons();

    // 绑定
    listEl.querySelectorAll('.sweet-checkin-item').forEach(function (el) {
      el.addEventListener('click', function (e) {
        if (e.target.closest('[data-del]')) return;
        toggleCheckin(el.getAttribute('data-id'));
      });
    });
    listEl.querySelectorAll('[data-del]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        removeCheckin(btn.getAttribute('data-del'));
      });
    });
  }
  function statCard(num, label) {
    return '<div class="sweet-stat-card"><div class="sweet-stat-num">' + esc(num) + '</div><div class="sweet-stat-label">' + esc(label) + '</div></div>';
  }
  function calcStreak(d) {
    // 从今天向前数连续有打卡记录的天数
    var recs = d.checkinRecords || {};
    var streak = 0;
    var cur = new Date();
    for (var i = 0; i < 366; i++) {
      var key = cur.getFullYear() + '-' + pad(cur.getMonth() + 1) + '-' + pad(cur.getDate());
      var r = recs[key];
      if (r && Object.keys(r).length > 0) {
        streak++;
        cur.setDate(cur.getDate() - 1);
      } else {
        // 今天还没打卡不算断，跳过今天继续看昨天
        if (i === 0) { cur.setDate(cur.getDate() - 1); continue; }
        break;
      }
    }
    return streak;
  }
  function toggleCheckin(id) {
    var d = getData();
    var today = todayStr();
    if (!d.checkinRecords[today]) d.checkinRecords[today] = {};
    if (d.checkinRecords[today][id]) delete d.checkinRecords[today][id];
    else d.checkinRecords[today][id] = true;
    if (Object.keys(d.checkinRecords[today]).length === 0) delete d.checkinRecords[today];
    save();
    renderCheckin();
  }
  function removeCheckin(id) {
    var d = getData();
    d.checkins = d.checkins.filter(function (c) { return c.id !== id; });
    // 清理记录中的该 id
    Object.keys(d.checkinRecords).forEach(function (k) {
      if (d.checkinRecords[k][id]) { delete d.checkinRecords[k][id]; if (!Object.keys(d.checkinRecords[k]).length) delete d.checkinRecords[k]; }
    });
    save();
    renderCheckin();
    toast('已删除打卡项');
  }

  /* ================================================================
     纪念日
     ================================================================ */
  function renderAnniversary() {
    var d = getData();
    var listEl = document.getElementById('anni-list');
    if (!listEl) return;
    if (!d.anniversaries.length) {
      listEl.innerHTML = emptyState('cake', '还没有纪念日，添加一个吧');
      return;
    }
    // 排序：倒计时类（未来日期升序）在前，纪念类按日期
    var today = todayStr();
    var html = '';
    d.anniversaries.slice().sort(function (a, b) {
      return (a.date || '').localeCompare(b.date || '');
    }).forEach(function (a) {
      var diff = daysBetween(a.date, today);
      var isFuture = a.date > today;
      var num, unit, soon = false;
      if (a.type === 'countdown') {
        if (isFuture) {
          num = diff; unit = '天后';
          if (diff <= 7) soon = true;
        } else {
          num = 0; unit = '已到'; soon = true;
        }
      } else {
        num = diff; unit = '天';
      }
      html += '<div class="sweet-anni-card" data-id="' + esc(a.id) + '">' +
        '<div class="sweet-anni-emoji"><i data-lucide="' + esc(a.emoji || 'gift') + '"></i></div>' +
        '<div class="sweet-anni-info">' +
          '<div class="sweet-anni-name">' + esc(a.name) + '</div>' +
          '<div class="sweet-anni-date">' + formatDateCN(a.date) + '</div>' +
        '</div>' +
        '<div class="sweet-anni-count' + (soon ? ' soon' : '') + '">' +
          '<div class="sweet-anni-count-num">' + num + '</div>' +
          '<div class="sweet-anni-count-unit">' + unit + '</div>' +
        '</div>' +
        '<button class="sweet-row-del" data-del="' + esc(a.id) + '" title="删除"><i data-lucide="trash-2"></i></button>' +
        '</div>';
    });
    listEl.innerHTML = html;
    refreshIcons();
    listEl.querySelectorAll('[data-del]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        confirmRemove('删除该纪念日？', function () {
          d.anniversaries = d.anniversaries.filter(function (x) { return x.id !== btn.getAttribute('data-del'); });
          save(); renderAnniversary(); toast('已删除');
        });
      });
    });
    listEl.querySelectorAll('.sweet-anni-card').forEach(function (el) {
      el.addEventListener('click', function (e) {
        if (e.target.closest('[data-del]')) return;
        openAnniForm(el.getAttribute('data-id'));
      });
    });
  }

  /* ================================================================
     甜蜜日记
     ================================================================ */
  var DIARY_MOODS = [
    { e: 'smile', t: '开心' }, { e: 'heart', t: '幸福' }, { e: 'zap', t: '心动' },
    { e: 'leaf', t: '平静' }, { e: 'coffee', t: '疲惫' }, { e: 'frown', t: '难过' },
    { e: 'angry', t: '生气' }, { e: 'search', t: '思考' }
  ];
  function renderDiary() {
    var d = getData();
    var listEl = document.getElementById('diary-list');
    if (!listEl) return;
    if (!d.diaries.length) {
      listEl.innerHTML = emptyState('book-open', '写下你们今天的甜蜜瞬间吧');
      return;
    }
    var html = '';
    d.diaries.slice().sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); }).forEach(function (dia) {
      html += '<div class="sweet-diary-card" data-id="' + esc(dia.id) + '">' +
        '<div class="sweet-diary-top">' +
          '<span class="sweet-diary-mood"><i data-lucide="' + esc(dia.mood || 'smile') + '"></i></span>' +
          '<span class="sweet-diary-title">' + esc(dia.title || '无题') + '</span>' +
          '<span class="sweet-diary-date">' + relativeDay(dia.date) + '</span>' +
        '</div>' +
        (dia.content ? '<div class="sweet-diary-content">' + esc(dia.content) + '</div>' : '') +
        '</div>';
    });
    listEl.innerHTML = html;
    listEl.querySelectorAll('.sweet-diary-card').forEach(function (el) {
      el.addEventListener('click', function () { openDiaryForm(el.getAttribute('data-id')); });
    });
  }

  /* ================================================================
     愿望清单
     ================================================================ */
  var WISH_CATEGORIES = ['一起去', '想买', '想做', '其他'];
  function renderWish() {
    var d = getData();
    var listEl = document.getElementById('wish-list');
    if (!listEl) return;
    if (!d.wishes.length) {
      listEl.innerHTML = emptyState('gift', '添加你们的小愿望吧');
      return;
    }
    var html = '';
    WISH_CATEGORIES.forEach(function (cat) {
      var items = d.wishes.filter(function (w) { return (w.category || '其他') === cat; });
      if (!items.length) return;
      html += '<div class="sweet-wish-group"><div class="sweet-wish-group-title">' + esc(cat) + '</div><div class="sweet-wish-list">';
      items.forEach(function (w) {
        html += '<div class="sweet-wish-item' + (w.done ? ' done' : '') + '" data-id="' + esc(w.id) + '">' +
          '<div class="sweet-wish-check" data-toggle="' + esc(w.id) + '"><i data-lucide="check"></i></div>' +
          '<span class="sweet-wish-text">' + esc(w.title) + '</span>' +
          '<button class="sweet-row-del" data-del="' + esc(w.id) + '" title="删除"><i data-lucide="trash-2"></i></button>' +
          '</div>';
      });
      html += '</div></div>';
    });
    listEl.innerHTML = html;
    refreshIcons();
    listEl.querySelectorAll('[data-toggle]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.stopPropagation();
        toggleWish(el.getAttribute('data-toggle'));
      });
    });
    listEl.querySelectorAll('[data-del]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        confirmRemove('删除该愿望？', function () {
          d.wishes = d.wishes.filter(function (x) { return x.id !== btn.getAttribute('data-del'); });
          save(); renderWish(); toast('已删除');
        });
      });
    });
  }
  function toggleWish(id) {
    var d = getData();
    var w = d.wishes.find(function (x) { return x.id === id; });
    if (!w) return;
    w.done = !w.done;
    save();
    renderWish();
    toast(w.done ? '完成一个愿望！' : '已取消完成');
  }

  /* ========== 通用空状态 ========== */
  function emptyState(icon, text) {
    return '<div class="sweet-empty"><span class="sweet-empty-emoji"><i data-lucide="' + esc(icon) + '"></i></span>' + esc(text) + '</div>';
  }

  /* ================================================================
     弹窗系统
     ================================================================ */
  function openOverlay(html) {
    closeOverlay();
    var ov = document.createElement('div');
    ov.className = 'sweet-overlay';
    ov.id = 'sweet-overlay';
    ov.innerHTML = html;
    document.body.appendChild(ov);
    ov.addEventListener('click', function (e) {
      if (e.target === ov) closeOverlay();
    });
    refreshIcons();
    return ov;
  }
  function closeOverlay() {
    var ov = document.getElementById('sweet-overlay');
    if (ov) ov.remove();
  }
  function confirmRemove(msg, onOk) {
    openOverlay(
      '<div class="sweet-sheet" style="max-width:340px;text-align:center;">' +
        '<div class="sweet-sheet-title" style="margin-bottom:10px;">' + esc(msg) + '</div>' +
        '<div class="sweet-sheet-actions">' +
          '<button class="sweet-btn sweet-btn-ghost" id="cf-cancel">取消</button>' +
          '<button class="sweet-btn sweet-btn-danger" id="cf-ok">删除</button>' +
        '</div>' +
      '</div>');
    var ov = document.getElementById('sweet-overlay');
    document.getElementById('cf-cancel').addEventListener('click', closeOverlay);
    document.getElementById('cf-ok').addEventListener('click', function () { onOk(); closeOverlay(); });
  }

  /* ---------- 一起的日子 ---------- */
  function openTogetherForm() {
    var d = getData();
    openOverlay(
      '<div class="sweet-sheet">' +
        '<div class="sweet-sheet-head"><div class="sweet-sheet-title">在一起的日子</div><button class="sweet-sheet-close" id="to-close">×</button></div>' +
        '<div class="sweet-field"><label class="sweet-field-label">起始日期</label><input type="date" id="to-date" value="' + esc(d.togetherDate) + '"></div>' +
        '<div class="sweet-sheet-actions"><button class="sweet-btn sweet-btn-ghost" id="to-cancel">取消</button><button class="sweet-btn sweet-btn-primary" id="to-save">保存</button></div>' +
      '</div>');
    document.getElementById('to-close').addEventListener('click', closeOverlay);
    document.getElementById('to-cancel').addEventListener('click', closeOverlay);
    document.getElementById('to-save').addEventListener('click', function () {
      var v = document.getElementById('to-date').value;
      if (!v) { toast('请选择日期'); return; }
      d.togetherDate = v; save(); renderHero(); closeOverlay(); toast('已更新');
    });
  }

  /* ---------- 恋爱打卡 · 新增项目 ---------- */
  var CHECKIN_EMOJIS = ['heart', 'users', 'sparkles', 'moon', 'coffee', 'message-circle', 'star', 'gift', 'music', 'sun', 'cloud', 'camera'];
  function openCheckinForm() {
    var picked = 'heart';
    openOverlay(
      '<div class="sweet-sheet">' +
        '<div class="sweet-sheet-head"><div class="sweet-sheet-title">新增打卡项</div><button class="sweet-sheet-close" id="ck-close">×</button></div>' +
        '<div class="sweet-field"><label class="sweet-field-label">名称</label><input type="text" id="ck-name" placeholder="例如：一起散步" maxlength="20"></div>' +
        '<div class="sweet-field"><label class="sweet-field-label">图标</label><div class="sweet-emoji-row" id="ck-emoji">' +
          CHECKIN_EMOJIS.map(function (e, i) { return '<button class="sweet-emoji-pick' + (i === 0 ? ' active' : '') + '" data-e="' + e + '"><i data-lucide="' + e + '"></i></button>'; }).join('') +
        '</div></div>' +
        '<div class="sweet-sheet-actions"><button class="sweet-btn sweet-btn-ghost" id="ck-cancel">取消</button><button class="sweet-btn sweet-btn-primary" id="ck-save">添加</button></div>' +
      '</div>');
    document.getElementById('ck-close').addEventListener('click', closeOverlay);
    document.getElementById('ck-cancel').addEventListener('click', closeOverlay);
    document.querySelectorAll('#ck-emoji .sweet-emoji-pick').forEach(function (b) {
      b.addEventListener('click', function () {
        document.querySelectorAll('#ck-emoji .sweet-emoji-pick').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        picked = b.getAttribute('data-e');
      });
    });
    document.getElementById('ck-save').addEventListener('click', function () {
      var name = document.getElementById('ck-name').value.trim();
      if (!name) { toast('请输入名称'); return; }
      var d = getData();
      d.checkins.push({ id: uid(), name: name, emoji: picked, custom: true });
      save(); renderCheckin(); closeOverlay(); toast('已添加');
    });
  }

  /* ---------- 纪念日 · 表单 ---------- */
  var ANNI_EMOJIS = ['heart', 'sparkles', 'cake', 'gift', 'star', 'music', 'plane', 'home', 'coffee', 'sun', 'moon', 'camera'];
  function openAnniForm(id) {
    var d = getData();
    var a = id ? d.anniversaries.find(function (x) { return x.id === id; }) : null;
    var picked = a ? (a.emoji || 'heart') : 'heart';
    var type = a ? (a.type || 'anniversary') : 'anniversary';
    openOverlay(
      '<div class="sweet-sheet">' +
        '<div class="sweet-sheet-head"><div class="sweet-sheet-title">' + (a ? '编辑纪念日' : '新增纪念日') + '</div><button class="sweet-sheet-close" id="an-close">×</button></div>' +
        '<div class="sweet-field"><label class="sweet-field-label">名称</label><input type="text" id="an-name" value="' + esc(a ? a.name : '') + '" placeholder="例如：第一次约会" maxlength="20"></div>' +
        '<div class="sweet-field"><label class="sweet-field-label">日期</label><input type="date" id="an-date" value="' + esc(a ? a.date : todayStr()) + '"></div>' +
        '<div class="sweet-field"><label class="sweet-field-label">类型</label><div class="sweet-seg" id="an-type">' +
          '<button class="' + (type === 'anniversary' ? 'active' : '') + '" data-t="anniversary">纪念（已过天数）</button>' +
          '<button class="' + (type === 'countdown' ? 'active' : '') + '" data-t="countdown">倒计时（还有几天）</button>' +
        '</div></div>' +
        '<div class="sweet-field"><label class="sweet-field-label">图标</label><div class="sweet-emoji-row" id="an-emoji">' +
          ANNI_EMOJIS.map(function (e) { return '<button class="sweet-emoji-pick' + (e === picked ? ' active' : '') + '" data-e="' + e + '"><i data-lucide="' + e + '"></i></button>'; }).join('') +
        '</div></div>' +
        '<div class="sweet-sheet-actions"><button class="sweet-btn sweet-btn-ghost" id="an-cancel">取消</button><button class="sweet-btn sweet-btn-primary" id="an-save">' + (a ? '保存' : '添加') + '</button></div>' +
      '</div>');
    document.getElementById('an-close').addEventListener('click', closeOverlay);
    document.getElementById('an-cancel').addEventListener('click', closeOverlay);
    document.querySelectorAll('#an-type button').forEach(function (b) {
      b.addEventListener('click', function () {
        document.querySelectorAll('#an-type button').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        type = b.getAttribute('data-t');
      });
    });
    document.querySelectorAll('#an-emoji .sweet-emoji-pick').forEach(function (b) {
      b.addEventListener('click', function () {
        document.querySelectorAll('#an-emoji .sweet-emoji-pick').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        picked = b.getAttribute('data-e');
      });
    });
    document.getElementById('an-save').addEventListener('click', function () {
      var name = document.getElementById('an-name').value.trim();
      var date = document.getElementById('an-date').value;
      if (!name) { toast('请输入名称'); return; }
      if (!date) { toast('请选择日期'); return; }
      if (a) {
        a.name = name; a.date = date; a.emoji = picked; a.type = type;
      } else {
        d.anniversaries.push({ id: uid(), name: name, date: date, emoji: picked, type: type });
      }
      save(); renderAnniversary(); closeOverlay(); toast(a ? '已保存' : '已添加');
    });
  }

  /* ---------- 甜蜜日记 · 表单 ---------- */
  function openDiaryForm(id) {
    var d = getData();
    var dia = id ? d.diaries.find(function (x) { return x.id === id; }) : null;
    var picked = dia ? (dia.mood || 'smile') : 'smile';
    openOverlay(
      '<div class="sweet-sheet">' +
        '<div class="sweet-sheet-head"><div class="sweet-sheet-title">' + (dia ? '编辑日记' : '写一篇甜蜜日记') + '</div><button class="sweet-sheet-close" id="di-close">×</button></div>' +
        '<div class="sweet-field"><label class="sweet-field-label">日期</label><input type="date" id="di-date" value="' + esc(dia ? dia.date : todayStr()) + '"></div>' +
        '<div class="sweet-field"><label class="sweet-field-label">心情</label><div class="sweet-emoji-row" id="di-mood">' +
          DIARY_MOODS.map(function (m) { return '<button class="sweet-emoji-pick' + (m.e === picked ? ' active' : '') + '" data-e="' + m.e + '" title="' + m.t + '"><i data-lucide="' + m.e + '"></i></button>'; }).join('') +
        '</div></div>' +
        '<div class="sweet-field"><label class="sweet-field-label">标题</label><input type="text" id="di-title" value="' + esc(dia ? dia.title : '') + '" placeholder="给这一天起个名字" maxlength="30"></div>' +
        '<div class="sweet-field"><label class="sweet-field-label">内容</label><textarea id="di-content" placeholder="记录今天发生的小事……" maxlength="2000">' + esc(dia ? dia.content : '') + '</textarea></div>' +
        '<div class="sweet-sheet-actions"><button class="sweet-btn sweet-btn-ghost" id="di-cancel">取消</button><button class="sweet-btn sweet-btn-primary" id="di-save">' + (dia ? '保存' : '添加') + '</button></div>' +
      '</div>');
    document.getElementById('di-close').addEventListener('click', closeOverlay);
    document.getElementById('di-cancel').addEventListener('click', closeOverlay);
    document.querySelectorAll('#di-mood .sweet-emoji-pick').forEach(function (b) {
      b.addEventListener('click', function () {
        document.querySelectorAll('#di-mood .sweet-emoji-pick').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        picked = b.getAttribute('data-e');
      });
    });
    document.getElementById('di-save').addEventListener('click', function () {
      var date = document.getElementById('di-date').value || todayStr();
      var title = document.getElementById('di-title').value.trim();
      var content = document.getElementById('di-content').value.trim();
      if (!title && !content) { toast('写点什么吧'); return; }
      if (dia) {
        dia.date = date; dia.mood = picked; dia.title = title; dia.content = content; dia.ts = Date.now();
      } else {
        d.diaries.push({ id: uid(), date: date, mood: picked, title: title, content: content, ts: Date.now() });
      }
      save(); renderDiary(); closeOverlay(); toast(dia ? '已保存' : '已记录');
    });
    // 日记长按/删除
    if (dia) {
      var delBtn = document.createElement('button');
      delBtn.className = 'sweet-btn sweet-btn-danger';
      delBtn.textContent = '删除这篇';
      delBtn.style.marginTop = '8px';
      delBtn.style.flex = 'none';
      delBtn.addEventListener('click', function () {
        confirmRemove('删除这篇日记？', function () {
          d.diaries = d.diaries.filter(function (x) { return x.id !== dia.id; });
          save(); renderDiary(); closeOverlay(); toast('已删除');
        });
      });
      document.querySelector('#sweet-overlay .sweet-sheet .sweet-sheet-actions').after(delBtn);
    }
  }

  /* ---------- 愿望清单 · 表单 ---------- */
  function openWishForm() {
    var d = getData();
    var cat = '一起去';
    openOverlay(
      '<div class="sweet-sheet">' +
        '<div class="sweet-sheet-head"><div class="sweet-sheet-title">新增愿望</div><button class="sweet-sheet-close" id="wi-close">×</button></div>' +
        '<div class="sweet-field"><label class="sweet-field-label">愿望</label><input type="text" id="wi-title" placeholder="例如：一起看日出" maxlength="40"></div>' +
        '<div class="sweet-field"><label class="sweet-field-label">分类</label><div class="sweet-seg" id="wi-cat">' +
          WISH_CATEGORIES.map(function (c, i) { return '<button class="' + (i === 0 ? 'active' : '') + '" data-c="' + c + '">' + c + '</button>'; }).join('') +
        '</div></div>' +
        '<div class="sweet-sheet-actions"><button class="sweet-btn sweet-btn-ghost" id="wi-cancel">取消</button><button class="sweet-btn sweet-btn-primary" id="wi-save">添加</button></div>' +
      '</div>');
    document.getElementById('wi-close').addEventListener('click', closeOverlay);
    document.getElementById('wi-cancel').addEventListener('click', closeOverlay);
    document.querySelectorAll('#wi-cat button').forEach(function (b) {
      b.addEventListener('click', function () {
        document.querySelectorAll('#wi-cat button').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        cat = b.getAttribute('data-c');
      });
    });
    document.getElementById('wi-save').addEventListener('click', function () {
      var title = document.getElementById('wi-title').value.trim();
      if (!title) { toast('请输入愿望'); return; }
      d.wishes.push({ id: uid(), title: title, category: cat, done: false, ts: Date.now() });
      save(); renderWish(); closeOverlay(); toast('已添加');
    });
  }

  /* ================================================================
     心情 · 涂鸦风日历
     ================================================================ */
  // 心情定义：key -> { label, Lucide icon, CSS color class }
  var MOODS = [
    { key: 'happy',  label: '开心', icon: 'smile' },
    { key: 'love',   label: '幸福', icon: 'heart' },
    { key: 'x',      label: '心动', icon: 'zap' },
    { key: 'leaf',   label: '平静', icon: 'leaf' },
    { key: 'coffee', label: '疲惫', icon: 'coffee' },
    { key: 'sad',    label: '难过', icon: 'frown' },
    { key: 'angry',  label: '生气', icon: 'angry' },
    { key: 'search', label: '思考', icon: 'search' }
  ];
  var moodState = {
    viewYear: null,
    viewMonth: null   // 0-11
  };
  function getMood(key) {
    var m = MOODS.filter(function (x) { return x.key === key; })[0];
    return m || MOODS[0];
  }
  function ensureMoodDate() {
    if (moodState.viewYear == null || moodState.viewMonth == null) {
      var t = new Date();
      moodState.viewYear = t.getFullYear();
      moodState.viewMonth = t.getMonth();
    }
  }
  function renderMoodCalTitle() {
    ensureMoodDate();
    var y = document.getElementById('mood-year');
    var m = document.getElementById('mood-month');
    if (y) y.textContent = moodState.viewYear + '年';
    if (m) m.textContent = (moodState.viewMonth + 1) + '月';
  }
  function weekdayOffset(y, month) {
    // 返回该月 1 号是周几（周一首列，返回 0..6）
    var first = new Date(y, month, 1);
    var js = first.getDay(); // 0=Sun..6=Sat
    return (js + 6) % 7;   // 转成周一为 0
  }
  function renderMoodCalendar() {
    ensureMoodDate();
    var d = getData();
    var y = moodState.viewYear, m = moodState.viewMonth;
    renderMoodCalTitle();
    var grid = document.getElementById('mood-cal-grid');
    if (!grid) return;

    var firstDay = weekdayOffset(y, m);
    var daysInMonth = new Date(y, m + 1, 0).getDate();
    var today = todayStr();
    var total = Math.ceil((firstDay + daysInMonth) / 7) * 7;
    var html = '';
    for (var i = 0; i < total; i++) {
      var cellDay = i - firstDay + 1;
      var empty = (cellDay < 1 || cellDay > daysInMonth);
      if (empty) {
        html += '<div class="mood-cell empty"></div>';
        continue;
      }
      var dateStr = y + '-' + pad(m + 1) + '-' + pad(cellDay);
      var moodKey = d.moodCalendar[dateStr] || '';
      var classes = ['mood-cell'];
      if (moodKey) classes.push('hasmood mood-mood-' + moodKey);
      if (dateStr === today) classes.push('today');
      var mood = moodKey ? getMood(moodKey) : null;
      html += '<div class="' + classes.join(' ') + '" data-date="' + dateStr + '">' +
        (mood ? '<span class="mood-cell-icon"><i data-lucide="' + mood.icon + '"></i></span>' : '') +
        '<span class="mood-cell-num">' + cellDay + '</span>' +
        '</div>';
    }
    grid.innerHTML = html;
    refreshIcons();
    // 绑定点击
    grid.querySelectorAll('.mood-cell:not(.empty)').forEach(function (el) {
      el.addEventListener('click', function () {
        openMoodPicker(el.getAttribute('data-date'));
      });
    });

    // 写日记按钮：今天有日记的话，改文案
    var todayHasDiary = (d.diaries || []).some(function (dia) { return dia.date === today; });
    var text = document.getElementById('mood-write-text');
    if (text) text.textContent = todayHasDiary ? '今天已经写过日记啦' : '今天还没写日记';
  }
  function moveMonth(delta) {
    ensureMoodDate();
    var d = new Date(moodState.viewYear, moodState.viewMonth + delta, 1);
    moodState.viewYear = d.getFullYear();
    moodState.viewMonth = d.getMonth();
    renderMoodCalendar();
  }
  function openMoodPicker(dateStr) {
    var d = getData();
    var current = d.moodCalendar[dateStr] || '';
    var picked = current || MOODS[0].key;
    openOverlay(
      '<div class="sweet-sheet">' +
        '<div class="sweet-sheet-head"><div class="sweet-sheet-title" style="text-align:center;flex:1;">选择当天心情</div><button class="sweet-sheet-close" id="mp-close">×</button></div>' +
        '<div class="mood-pick-date">' + esc(formatDateCN(dateStr)) + '</div>' +
        '<div class="mood-pick-grid" id="mp-grid">' +
          MOODS.map(function (m) {
            return '<div class="mood-pick-cell' + (m.key === picked ? ' active mood-mood-' + m.key : '') + '" data-k="' + m.key + '">' +
              '<div class="mood-pick-cell-icon mood-mood-' + m.key + '"><i data-lucide="' + m.icon + '"></i></div>' +
              '<div class="mood-pick-cell-label">' + m.label + '</div>' +
              '</div>';
          }).join('') +
        '</div>' +
        '<div class="sweet-sheet-actions">' +
          '<button class="sweet-btn sweet-btn-danger" id="mp-del" style="flex:0 0 30%;padding:11px 10px;">清除</button>' +
          '<button class="sweet-btn sweet-btn-ghost" id="mp-cancel">取消</button>' +
          '<button class="sweet-btn sweet-btn-primary" id="mp-save">确定</button>' +
        '</div>' +
      '</div>');
    document.getElementById('mp-close').addEventListener('click', closeOverlay);
    document.getElementById('mp-cancel').addEventListener('click', closeOverlay);
    document.querySelectorAll('#mp-grid .mood-pick-cell').forEach(function (el) {
      el.addEventListener('click', function () {
        var k = el.getAttribute('data-k');
        picked = k;
        document.querySelectorAll('#mp-grid .mood-pick-cell').forEach(function (x) {
          x.classList.remove('active');
          x.classList.remove('mood-mood-happy', 'mood-mood-love', 'mood-mood-x', 'mood-mood-leaf', 'mood-mood-coffee', 'mood-mood-sad', 'mood-mood-angry', 'mood-mood-search');
        });
        el.classList.add('active', 'mood-mood-' + k);
        refreshIcons();
      });
    });
    document.getElementById('mp-del').addEventListener('click', function () {
      if (d.moodCalendar[dateStr]) {
        delete d.moodCalendar[dateStr];
        save();
        renderMoodCalendar();
        toast('已清除心情');
      }
      closeOverlay();
    });
    document.getElementById('mp-save').addEventListener('click', function () {
      d.moodCalendar[dateStr] = picked;
      save();
      renderMoodCalendar();
      closeOverlay();
      toast('心情已记录');
    });
    refreshIcons();
  }
  /* ================================================================
     甜蜜日记 · 子标签切换
     ================================================================ */
  function switchSubTab(name) {
    var tabs = document.querySelectorAll('.sweet-subtab');
    var panels = document.querySelectorAll('.sweet-subpanel');
    tabs.forEach(function (t) { t.classList.toggle('active', t.getAttribute('data-subtab') === name); });
    panels.forEach(function (p) { p.classList.toggle('active', p.getAttribute('data-subpanel') === name); });
    refreshIcons();
    if (name === 'diary-calendar') renderMoodCalendar();
    else renderDiary();
  }

  /* ================================================================
     标签切换
     ================================================================ */
  function switchTab(tab) {
    document.querySelectorAll('.sweet-tab').forEach(function (t) {
      t.classList.toggle('active', t.getAttribute('data-tab') === tab);
    });
    document.querySelectorAll('.sweet-panel').forEach(function (p) {
      p.classList.toggle('active', p.getAttribute('data-panel') === tab);
    });
    refreshIcons();
  }

  /* ================================================================
     初始化
     ================================================================ */
  function bindEvents() {
    document.querySelectorAll('.sweet-tab').forEach(function (t) {
      t.addEventListener('click', function () { switchTab(t.getAttribute('data-tab')); });
    });
    // 子标签（日记列表 / 心情日历）
    document.querySelectorAll('.sweet-subtab').forEach(function (t) {
      t.addEventListener('click', function () { switchSubTab(t.getAttribute('data-subtab')); });
    });
    // 心情日历月份切换
    var mPrev = document.getElementById('mood-prev-month');
    if (mPrev) mPrev.addEventListener('click', function () { moveMonth(-1); });
    var mNext = document.getElementById('mood-next-month');
    if (mNext) mNext.addEventListener('click', function () { moveMonth(1); });
    // 心情日历底部写日记按钮
    var mWrite = document.getElementById('mood-write-btn');
    if (mWrite) mWrite.addEventListener('click', function () { openDiaryForm(null); });

    var heroEdit = document.getElementById('edit-together-date');
    if (heroEdit) heroEdit.addEventListener('click', openTogetherForm);

    var ckAdd = document.getElementById('checkin-add');
    if (ckAdd) ckAdd.addEventListener('click', openCheckinForm);
    var anAdd = document.getElementById('anni-add');
    if (anAdd) anAdd.addEventListener('click', function () { openAnniForm(null); });
    var diAdd = document.getElementById('diary-add');
    if (diAdd) diAdd.addEventListener('click', function () { openDiaryForm(null); });
    var wiAdd = document.getElementById('wish-add');
    if (wiAdd) wiAdd.addEventListener('click', openWishForm);
  }

  function renderAll() {
    renderHero();
    renderCheckin();
    renderAnniversary();
    renderDiary();
    renderWish();
    refreshIcons();
  }

  function init() {
    load();
    bindEvents();
    renderAll();
    // 跨标签同步（同源 localStorage）
    window.addEventListener('storage', function (e) {
      if (e.key === STORAGE_KEY) { cache = null; renderAll(); }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 暴露给外部（便于主页 postMessage 通知刷新）
  window.SweetApp = { refresh: renderAll, switchTab: switchTab };
})();
