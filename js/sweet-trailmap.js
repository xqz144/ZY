/**
 * sweet-trailmap.js - 甜蜜轨迹 · 极简版
 * 地图上只显示祁煜头像 + 位置图标，行程文字描述
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'mengjiao_trailmap';

  // 祁煜世界 · 预定义地点（名称 + 坐标 + 描述）
  var QIYU_LOCATIONS = [
    { id: 'maoer',    name: '帽儿岛',         x: 18, y: 27, desc: '祁煜幼时搁浅之地' },
    { id: 'chaoxiqu', name: '潮汐区',         x: 28, y: 33, desc: '帽儿岛潮汐区' },
    { id: 'hongwan',  name: '晴空中央湾区',   x: 68, y:  9, desc: '临空市核心湾区' },
    { id: 'lingkong', name: '临空塔',         x: 47, y: 24, desc: '临空市地标' },
    { id: 'hunter',   name: '猎人协会总部',   x: 67, y: 29, desc: '深空猎人协会总部' },
    { id: 'qingkong', name: '晴空调环路',     x: 60, y: 50, desc: '晴空环路区域' },
    { id: 'ever',     name: 'EVER集团大楼',   x: 84, y: 40, desc: '跨国集团总部' },
    { id: 'xiwai',    name: '西郊别墅区',     x: 77, y: 47, desc: '西郊豪华别墅区' },
    { id: 'n109',     name: 'N-109禁区',      x: 91, y: 53, desc: '危险禁区' },
    { id: 'naokong',  name: '脑机研究中心',   x: 30, y: 55, desc: '科研机构' },
    { id: 'baisha',   name: '白沙湾海区',     x: 47, y: 67, desc: '临空市海湾' },
    { id: 'deep',     name: '深空隧道',       x: 55, y: 80, desc: '2034年时空隧道' },
    { id: 'landong',  name: '宝空大岛·蓝洞',  x: 21, y: 83, desc: '大岛蓝洞景观' },
    { id: 'chaoxi',   name: '潮汐屿',         x: 64, y: 72, desc: '小岛' },
    { id: 'limori',   name: '利莫里亚遗迹',   x: 73, y: 92, desc: '古文明遗迹' },
    { id: 'akso',     name: 'AKSO医院',       x: 72, y: 12, desc: '私立医院' },
    { id: 'moart',    name: 'Mo Art Studio',  x: 25, y: 40, desc: '祁煜的海边画室' },
  ];

  // 状态
  var state = {
    world: 'qiyu',
  };

  var data = null;

  // ===== 日期工具 =====
  function todayKey() {
    var d = new Date();
    return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日';
  }

  function dateKey(date) {
    return date.getFullYear() + '年' + (date.getMonth() + 1) + '月' + date.getDate() + '日';
  }

  function daysAgoKey(n) {
    var d = new Date();
    d.setDate(d.getDate() - n);
    return dateKey(d);
  }

  // ===== 随机行程生成器 =====
  // 模拟祁煜一天的合理行程：早晨从住所出发 → 上午办事 → 中午吃饭 → 下午活动 → 晚上回家
  var TRANSPORT_MODES = ['🚗 乘车', '🚶 步行', '⛴️ 乘船', '🚇 地铁', '🚲 骑行'];

  // 时段模板：[时间段范围, 描述]
  var TIME_SLOTS = [
    { hour: 8,  min: 30, dur: 60,  label: '早晨出发' },
    { hour: 10, min: 0,  dur: 90,  label: '上午活动' },
    { hour: 12, min: 0,  dur: 60,  label: '午餐时间' },
    { hour: 14, min: 0,  dur: 120, label: '下午活动' },
    { hour: 17, min: 30, dur: 60,  label: '傍晚行程' },
    { hour: 19, min: 0,  dur: 90,  label: '晚间活动' },
  ];

  function pad(n) { return String(n).padStart(2, '0'); }

  function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function pickRandomLocation(locations, exclude) {
    var pool = locations.filter(function(l) { return l.name !== exclude; });
    return pool.length > 0 ? pickRandom(pool) : locations[0];
  }

  function genTimeStr(slot) {
    var startH = slot.hour;
    var startM = slot.min + Math.floor(Math.random() * 20) - 10;
    if (startM < 0) { startM += 60; startH--; }
    if (startM >= 60) { startM -= 60; startH++; }
    var endTotal = startH * 60 + startM + slot.dur + Math.floor(Math.random() * 30);
    var endH = Math.floor(endTotal / 60);
    var endM = endTotal % 60;
    return pad(startH) + ':' + pad(startM) + '-' + pad(endH) + ':' + pad(endM);
  }

  // 生成一天的行程
  function genDayTrips(day, locations) {
    if (locations.length < 2) return [];

    // 祁煜可能的起点（住所/画室/别墅）
    var homeCandidates = locations.filter(function(l) {
      return l.name.includes('Studio') || l.name.includes('别墅') || l.name.includes('帽儿');
    });
    var home = homeCandidates.length > 0 ? pickRandom(homeCandidates) : locations[0];

    // 随机选 3-5 个时段
    var slotCount = 3 + Math.floor(Math.random() * 3);
    var slots = TIME_SLOTS.slice(0, slotCount);

    var trips = [];
    var currentLoc = home;

    for (var i = 0; i < slots.length; i++) {
      var slot = slots[i];
      var nextLoc;

      // 最后一段：回家
      if (i === slots.length - 1) {
        nextLoc = home;
      } else {
        nextLoc = pickRandomLocation(locations, currentLoc.name);
      }

      trips.push({
        from: currentLoc.name,
        to: nextLoc.name,
        time: genTimeStr(slot),
        mode: pickRandom(TRANSPORT_MODES)
      });
      currentLoc = nextLoc;
    }

    return trips;
  }

  // 生成最近 N 天的行程
  function genRecentTrips(days, locations) {
    var trips = {};
    for (var i = days - 1; i >= 0; i--) {
      var key = daysAgoKey(i);
      trips[key] = genDayTrips(key, locations);
    }
    return trips;
  }

  // ===== 数据层 =====
  function load() {
    if (data) return data;
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      data = raw ? JSON.parse(raw) : defaultData();
      migrate();
    } catch (e) {
      data = defaultData();
    }
    // 每次打开时，自动生成今天的行程（如果还没有）
    ensureTodayTrips();
    return data;
  }

  function defaultData() {
    return {
      version: 2,
      mineMapDataUrl: null,
      minePins: [],
      autoTrips: {},        // 自动生成的祁煜世界行程
      mineAutoTrips: {},    // 自动生成的我的世界行程
    };
  }

  function migrate() {
    if (!data.version) data.version = 2;
    if (!data.minePins) data.minePins = [];
    if (!data.autoTrips) data.autoTrips = {};
    if (!data.mineAutoTrips) data.mineAutoTrips = {};
    if (!data.mineMapDataUrl) data.mineMapDataUrl = null;
  }

  // 确保今天有行程数据（每次打开自动生成）
  function ensureTodayTrips() {
    var today = todayKey();
    var trips = getAutoTrips();
    if (!trips[today]) {
      // 生成最近 3 天的行程
      var locations = getLocations();
      if (locations.length >= 2) {
        var recent = genRecentTrips(3, locations);
        Object.keys(recent).forEach(function(day) {
          if (!trips[day]) trips[day] = recent[day];
        });
        save();
      }
    }
  }

  function getAutoTrips() {
    return state.world === 'qiyu' ? data.autoTrips : data.mineAutoTrips;
  }

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
    catch (e) { alert('保存失败，底图可能太大，请换小一点的图片'); }
  }

  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  // 获取某天的行程
  function getTrips(day) {
    return data.dailyTrips[day] || [];
  }

  // 获取所有行程（跨日期合并，按日期+时间排序）
  function getAllTrips() {
    var trips = getAutoTrips();
    var all = [];
    Object.keys(trips).forEach(function(day) {
      trips[day].forEach(function(t) {
        all.push({ day: day, from: t.from, to: t.to, time: t.time, mode: t.mode });
      });
    });
    all.sort(function(a, b) {
      if (a.day !== b.day) return a.day.localeCompare(b.day);
      return a.time.localeCompare(b.time);
    });
    return all;
  }

  // 获取最新位置（所有行程中最后一条的终点）
  function getCurrentLocation() {
    var all = getAllTrips();
    if (all.length === 0) return null;
    return all[all.length - 1].to;
  }

  // ===== DOM 元素 =====
  var container, bgImg, avatarWrap, tripList, emptyHint;

  function init() {
    load();
    cacheElements();
    bindEvents();
    render();
  }

  function cacheElements() {
    container = document.getElementById('trailmapContainer');
    bgImg = document.getElementById('trailmapBg');
    avatarWrap = document.getElementById('trailmapAvatarWrap');
    tripList = document.getElementById('trailmapTripList');
    emptyHint = document.getElementById('trailmapEmpty');
  }

  function bindEvents() {
    // 世界切换
    document.querySelectorAll('.trailmap-w-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.trailmap-w-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        state.world = btn.dataset.world;
        render();
      });
    });

    // 上传底图
    document.getElementById('uploadMineMap').addEventListener('click', triggerUpload);
    document.getElementById('trailmapUploadBig').addEventListener('click', triggerUpload);

    // 添加地点
    document.getElementById('addPinMode').addEventListener('click', addLocationFlow);

    // 记录行程
    document.getElementById('addTrip').addEventListener('click', addTripFlow);

    // 隐藏的文件选择器
    var fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    fileInput.addEventListener('change', onFileSelected);
    document.body.appendChild(fileInput);
    window._trailmapFileInput = fileInput;
  }

  function triggerUpload() {
    if (state.world !== 'mine') {
      alert('请先切换到"我的世界"再上传底图');
      return;
    }
    window._trailmapFileInput.click();
  }

  function onFileSelected(e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(evt) {
      data.mineMapDataUrl = evt.target.result;
      save();
      render();
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function getLocations() {
    if (state.world === 'qiyu') return QIYU_LOCATIONS.slice();
    return data.minePins.slice();
  }

  function findLocation(name) {
    return getLocations().find(function(l) { return l.name === name; });
  }

  // ===== 添加地点流程（我的世界）=====
  function addLocationFlow() {
    if (state.world !== 'mine') {
      alert('祁煜的世界地点已预设，请切换到"我的世界"添加自定义地点');
      return;
    }
    if (!data.mineMapDataUrl) {
      alert('请先上传底图');
      return;
    }
    var name = prompt('地点名称:');
    if (!name) return;
    var desc = prompt('描述 (可选):', '') || '';

    // 获取鼠标点击位置
    container.style.cursor = 'crosshair';
    var handler = function(e) {
      container.removeEventListener('click', handler);
      container.style.cursor = '';
      var rect = container.getBoundingClientRect();
      var x = parseFloat(((e.clientX - rect.left) / rect.width * 100).toFixed(2));
      var y = parseFloat(((e.clientY - rect.top) / rect.height * 100).toFixed(2));
      data.minePins.push({ id: uid(), name: name, x: x, y: y, desc: desc });
      save();
      render();
    };
    container.addEventListener('click', handler);
  }

  // ===== 添加行程流程 =====
  function addTripFlow() {
    var locations = getLocations();
    if (locations.length === 0) {
      alert('还没有地点，请先添加地点');
      return;
    }
    var names = locations.map(function(l, i) { return (i + 1) + '. ' + l.name; }).join('\n');

    var fromIdx = parseInt(prompt('起点 (输入编号):\n' + names));
    if (!fromIdx || fromIdx < 1 || fromIdx > locations.length) return;

    var toIdx = parseInt(prompt('终点 (输入编号):\n' + names));
    if (!toIdx || toIdx < 1 || toIdx > locations.length) return;
    if (fromIdx === toIdx) { alert('起点和终点不能相同'); return; }

    // 日期默认今天，可以修改
    var dayInput = prompt('日期 (如 2026年8月19日):', todayKey());
    if (!dayInput) return;

    var now = new Date();
    var timeStr = pad(now.getHours()) + ':' + pad(now.getMinutes());
    var timeRange = prompt('时间段 (如 ' + timeStr + '-' + pad(now.getHours() + 1) + '30):', timeStr + '-' + pad(now.getHours() + 1) + pad(now.getMinutes()));
    if (!timeRange) return;

    var mode = prompt('交通方式:', '🚶 步行');
    if (mode === null) return;

    if (!data.dailyTrips[dayInput]) data.dailyTrips[dayInput] = [];
    data.dailyTrips[dayInput].push({
      from: locations[fromIdx - 1].name,
      to: locations[toIdx - 1].name,
      time: timeRange,
      mode: mode
    });
    // 按时间排序
    data.dailyTrips[dayInput].sort(function(a, b) {
      return a.time.localeCompare(b.time);
    });
    save();
    render();
  }

  function pad(n) { return String(n).padStart(2, '0'); }

  // ===== 主渲染 =====
  function render() {
    renderBg();
    renderAvatar();
    renderTripList();
    updateHint();
    lucideRefresh();
  }

  function renderBg() {
    if (state.world === 'qiyu') {
      bgImg.src = '../assets/map_qiyu_v6.jpg';
      emptyHint.style.display = 'none';
    } else {
      if (data.mineMapDataUrl) {
        bgImg.src = data.mineMapDataUrl;
        emptyHint.style.display = 'none';
      } else {
        bgImg.src = '';
        emptyHint.style.display = 'flex';
      }
    }
  }

  function renderAvatar() {
    avatarWrap.innerHTML = '';

    var currentLocName = getCurrentLocation();
    if (!currentLocName) {
      avatarWrap.style.display = 'none';
      return;
    }

    var loc = findLocation(currentLocName);
    if (!loc) {
      avatarWrap.style.display = 'none';
      return;
    }

    avatarWrap.style.display = 'block';
    avatarWrap.style.left = loc.x + '%';
    avatarWrap.style.top = loc.y + '%';

    avatarWrap.innerHTML =
      '<div class="trailmap-avatar-ring">' +
        '<img class="trailmap-avatar-img" src="../assets/character.png" alt="祁煜">' +
      '</div>' +
      '<div class="trailmap-loc-pin">' +
        '<i data-lucide="map-pin" style="width:12px;height:12px;"></i>' +
      '</div>' +
      '<div class="trailmap-avatar-name">' + escapeHtml(loc.name) + '</div>' +
      '<div class="trailmap-avatar-pulse"></div>';

    lucideRefresh();
  }

  function renderTripList() {
    var allTrips = getAllTrips();
    if (allTrips.length === 0) {
      tripList.innerHTML = '<div class="trailmap-empty-trip">还没有行程记录<br>点击上方"记录行程"开始</div>';
      return;
    }

    // 按日期分组渲染
    var html = '';
    var currentDay = '';
    for (var i = 0; i < allTrips.length; i++) {
      var t = allTrips[i];
      // 日期分组标题
      if (t.day !== currentDay) {
        currentDay = t.day;
        var isToday = (t.day === todayKey());
        html += '<div class="trailmap-day-header">' +
          '<i data-lucide="calendar" style="width:14px;height:14px;"></i>' +
          '<span>' + escapeHtml(t.day) + '</span>' +
          (isToday ? '<span class="trailmap-today-tag">今天</span>' : '') +
        '</div>';
      }
      html += '<div class="trailmap-trip-item" data-day="' + escapeHtml(t.day) + '" data-time="' + escapeHtml(t.time) + '">' +
        '<div class="trailmap-trip-time">' + escapeHtml(t.time) + '</div>' +
        '<div class="trailmap-trip-body">' +
          '<div class="trailmap-trip-route">' +
            '<span class="trailmap-from">' + escapeHtml(t.from) + '</span>' +
            '<span class="trailmap-arrow">→</span>' +
            '<span class="trailmap-to">' + escapeHtml(t.to) + '</span>' +
          '</div>' +
          '<div class="trailmap-trip-mode">' + escapeHtml(t.mode) + '</div>' +
        '</div>' +
        '<button class="trailmap-trip-del" data-day="' + escapeHtml(t.day) + '" data-time="' + escapeHtml(t.time) + '" title="删除">✕</button>' +
      '</div>';
    }
    tripList.innerHTML = html;

    tripList.querySelectorAll('.trailmap-trip-del').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var day = btn.dataset.day;
        var time = btn.dataset.time;
        var trips = data.dailyTrips[day];
        if (!trips) return;
        var idx = trips.findIndex(function(t) { return t.time === time; });
        if (idx >= 0) {
          trips.splice(idx, 1);
          if (trips.length === 0) delete data.dailyTrips[day];
          save();
          render();
        }
      });
    });

    lucideRefresh();
  }

  function updateHint() {
    var hint = document.getElementById('trailmapHint');
    if (state.world === 'mine' && !data.mineMapDataUrl) {
      hint.textContent = '💡 先上传你的真实地图底图';
    } else if (state.world === 'mine') {
      hint.textContent = '💡 点击"添加地点"然后在地图上点击位置';
    } else {
      hint.textContent = '💡 点击"记录行程"添加祁煜的移动轨迹';
    }
  }

  function escapeHtml(s) {
    var div = document.createElement('div');
    div.textContent = s || '';
    return div.innerHTML;
  }

  function lucideRefresh() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  window.SweetTrailMap = {
    init: init,
    refresh: render
  };
})();
