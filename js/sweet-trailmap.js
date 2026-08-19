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
    currentDay: '',   // 自动取今天
  };

  var data = null;

  // ===== 数据层 =====
  function todayKey() {
    var d = new Date();
    return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日';
  }

  function load() {
    if (data) return data;
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      data = raw ? JSON.parse(raw) : defaultData();
      migrate();
    } catch (e) {
      data = defaultData();
    }
    return data;
  }

  function defaultData() {
    return {
      version: 1,
      mineMapDataUrl: null,
      minePins: [],
      // 每天的轨迹记录：{ '日期': [{ from, to, time, mode }] }
      dailyTrips: {},
    };
  }

  function migrate() {
    if (!data.version) data.version = 1;
    if (!data.minePins) data.minePins = [];
    if (!data.dailyTrips) data.dailyTrips = {};
    if (!data.mineMapDataUrl) data.mineMapDataUrl = null;
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

  // 获取最新一个地点（祁煜当前在哪）
  function getCurrentLocation(day) {
    var trips = getTrips(day);
    if (trips.length === 0) return null;
    return trips[trips.length - 1].to;
  }

  // ===== DOM 元素 =====
  var container, bgImg, avatarWrap, tripList, dateLabel, emptyHint;

  function init() {
    load();
    state.currentDay = todayKey();
    cacheElements();
    bindEvents();
    render();
  }

  function cacheElements() {
    container = document.getElementById('trailmapContainer');
    bgImg = document.getElementById('trailmapBg');
    avatarWrap = document.getElementById('trailmapAvatarWrap');
    tripList = document.getElementById('trailmapTripList');
    dateLabel = document.getElementById('trailmapDate');
    emptyHint = document.getElementById('trailmapEmpty');
  }

  function bindEvents() {
    // 世界切换
    document.querySelectorAll('.trailmap-w-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.trailmap-w-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        state.world = btn.dataset.world;
        state.currentDay = todayKey();
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

    // 日期：回到今天
    dateLabel.addEventListener('click', function() {
      state.currentDay = todayKey();
      render();
    });

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

    var now = new Date();
    var timeStr = pad(now.getHours()) + ':' + pad(now.getMinutes());
    var timeRange = prompt('时间段 (如 ' + timeStr + '-' + pad(now.getHours() + 1) + '30):', timeStr + '-' + pad(now.getHours() + 1) + pad(now.getMinutes()));
    if (!timeRange) return;

    var mode = prompt('交通方式:', '🚶 步行');
    if (mode === null) return;

    if (!data.dailyTrips[state.currentDay]) data.dailyTrips[state.currentDay] = [];
    data.dailyTrips[state.currentDay].push({
      from: locations[fromIdx - 1].name,
      to: locations[toIdx - 1].name,
      time: timeRange,
      mode: mode
    });
    // 按时间排序
    data.dailyTrips[state.currentDay].sort(function(a, b) {
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
    dateLabel.textContent = state.currentDay;
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
    // 清除旧头像
    avatarWrap.innerHTML = '';

    var trips = getTrips(state.currentDay);
    if (trips.length === 0) {
      avatarWrap.style.display = 'none';
      return;
    }

    var current = trips[trips.length - 1];
    var loc = findLocation(current.to);
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
    var trips = getTrips(state.currentDay);
    if (trips.length === 0) {
      tripList.innerHTML = '<div class="trailmap-empty-trip">今天还没有行程记录<br>点击上方"记录行程"开始</div>';
      return;
    }

    var html = '';
    for (var i = 0; i < trips.length; i++) {
      var t = trips[i];
      html += '<div class="trailmap-trip-item">' +
        '<div class="trailmap-trip-time">' + escapeHtml(t.time) + '</div>' +
        '<div class="trailmap-trip-body">' +
          '<div class="trailmap-trip-route">' +
            '<span class="trailmap-from">' + escapeHtml(t.from) + '</span>' +
            '<span class="trailmap-arrow">→</span>' +
            '<span class="trailmap-to">' + escapeHtml(t.to) + '</span>' +
          '</div>' +
          '<div class="trailmap-trip-mode">' + escapeHtml(t.mode) + '</div>' +
        '</div>' +
        '<button class="trailmap-trip-del" data-idx="' + i + '" title="删除">✕</button>' +
      '</div>';
    }
    tripList.innerHTML = html;

    tripList.querySelectorAll('.trailmap-trip-del').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var idx = parseInt(btn.dataset.idx);
        data.dailyTrips[state.currentDay].splice(idx, 1);
        save();
        render();
      });
    });
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
