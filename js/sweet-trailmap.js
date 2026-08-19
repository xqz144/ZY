/**
 * sweet-trailmap.js - 甜蜜轨迹 · 轨迹地图模块
 * 支持：祁煜的世界(V6底图) + 我的世界(自定义底图)
 * 功能：地点标记 CRUD、行程记录、轨迹线绘制、日期切换
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'mengjiao_trailmap';
  var MAX_MAP_SIZE = 4 * 1024 * 1024; // 4MB base64 限制

  // 祁煜的世界 · 预定义地点（V6 底图精确对齐）
  var PINS_QIYU = [
    { id: 'hongwan', name: '晴空中央湾区', x: 68, y:  9, cat: 'blue',   desc: '临空市核心湾区' },
    { id: 'hunter',  name: '猎人协会总部', x: 67, y: 29, cat: 'blue',   desc: '深空猎人协会总部' },
    { id: 'ever',    name: 'EVER集团大楼', x: 84, y: 40, cat: 'blue',   desc: '跨国集团总部' },
    { id: 'naokong', name: '脑机研究中心', x: 30, y: 55, cat: 'blue',   desc: '科研机构' },
    { id: 'chaoxi',  name: '潮汐屿',       x: 64, y: 72, cat: 'blue',   desc: '小岛' },
    { id: 'akso',    name: 'AKSO医院',     x: 72, y: 12, cat: 'blue',   desc: '私立医院' },
    { id: 'moart',   name: 'Mo Art Studio',x: 25, y: 40, cat: 'blue',   desc: '祁煜的海边画室' },
    { id: 'maoer',   name: '帽儿岛',       x: 18, y: 27, cat: 'red',    desc: '祁煜幼时搁浅之地' },
    { id: 'baisha',  name: '白沙湾海区',   x: 47, y: 67, cat: 'red',    desc: '临空市海湾' },
    { id: 'xiwai',   name: '西郊别墅区',   x: 77, y: 47, cat: 'red',    desc: '西郊豪华别墅区' },
    { id: 'landong', name: '宝空大岛·蓝洞',x: 21, y: 83, cat: 'red',    desc: '大岛蓝洞景观' },
    { id: 'chaoxiqu',name: '潮汐区',       x: 28, y: 33, cat: 'purple', desc: '帽儿岛潮汐区' },
    { id: 'n109',    name: 'N-109禁区',    x: 91, y: 53, cat: 'purple', desc: '危险禁区' },
    { id: 'limori',  name: '利莫里亚遗迹', x: 73, y: 92, cat: 'purple', desc: '古文明遗迹' },
    { id: 'deep',    name: '深空隧道',     x: 55, y: 80, cat: 'purple', desc: '2034年时空隧道' },
    { id: 'lingkong',name: '临空塔',       x: 47, y: 24, cat: 'purple', desc: '临空市地标' },
    { id: 'qingkong',name: '晴空调环路',   x: 60, y: 50, cat: 'purple', desc: '晴空环路区域' },
  ];

  // 默认行程数据
  var DEFAULT_TRIPS = {
    '5月23日': [
      { time: '18:01-18:28', from: '帽儿岛', to: 'EVER集团大楼', mode: '🚗 乘车 17.57km · 27分钟' },
      { time: '14:01-14:28', from: 'AKSO医院', to: '猎人协会总部', mode: '🚗 乘车 · 3km · 5分钟' },
      { time: '12:01-12:28', from: 'Mo Art Studio', to: '白沙湾海区', mode: '🚶 步行 · 海边散步' },
    ],
    '5月24日': [
      { time: '10:00-12:00', from: 'Mo Art Studio', to: '帽儿岛', mode: '⛴️ 乘船 · 环岛采风' },
      { time: '14:00-16:00', from: '帽儿岛', to: '西郊别墅区', mode: '🚗 乘车 · 拜访收藏家' },
    ],
    '5月25日': [
      { time: '09:00-11:00', from: '猎人协会总部', to: 'N-109禁区', mode: '🚗 乘车 · 任务出动' },
      { time: '14:00-16:00', from: 'N-109禁区', to: '利莫里亚遗迹', mode: '🚗 乘车 · 探索遗迹' },
    ],
    '5月26日': [
      { time: '10:00-12:00', from: '白沙湾海区', to: 'Mo Art Studio', mode: '🚶 步行 · 回画室' },
      { time: '15:00-17:00', from: 'Mo Art Studio', to: '深空隧道', mode: '🚗 乘车 · 调查异常' },
    ],
  };

  // 状态
  var state = {
    world: 'qiyu',          // 'qiyu' | 'mine'
    currentDay: '5月23日',
    days: Object.keys(DEFAULT_TRIPS),
    dayIdx: 0,
    pinMode: false,         // 是否处于添加地点模式
    editingPin: null,       // 当前编辑的 PIN
  };

  var data = null;

  // ===== 数据层 =====
  function load() {
    if (data) return data;
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        data = JSON.parse(raw);
      } else {
        data = defaultData();
      }
      migrate();
    } catch (e) {
      data = defaultData();
    }
    return data;
  }

  function defaultData() {
    return {
      version: 1,
      mineMapDataUrl: null,   // 我的世界底图 base64
      minePins: [],           // 我的世界 PIN 列表
      mineTrips: {},          // 我的世界行程
      trips: DEFAULT_TRIPS,   // 祁煜行程（预置，可修改）
    };
  }

  function migrate() {
    if (!data.version) data.version = 1;
    if (!data.minePins) data.minePins = [];
    if (!data.mineTrips) data.mineTrips = {};
    if (!data.trips) data.trips = DEFAULT_TRIPS;
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('[甜蜜轨迹] 保存失败 (可能存储已满)', e);
      alert('数据保存失败，可能是底图太大。请尝试使用更小的图片。');
    }
  }

  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  function getPins() {
    if (state.world === 'qiyu') return PINS_QIYU.slice();
    return data.minePins.slice();
  }

  function getTrips() {
    if (state.world === 'qiyu') return data.trips;
    return data.mineTrips;
  }

  function setTrip(day, trips) {
    if (state.world === 'qiyu') {
      data.trips[day] = trips;
    } else {
      data.mineTrips[day] = trips;
    }
    save();
  }

  // ===== 渲染层 =====
  var container, bgImg, svg, pinLayer, emptyHint, tripList, dateLabel;

  function init() {
    load();
    cacheElements();
    bindEvents();
    render();
  }

  function cacheElements() {
    container = document.getElementById('trailmapContainer');
    bgImg = document.getElementById('trailmapBg');
    svg = document.getElementById('trailmapSvg');
    pinLayer = document.getElementById('trailmapPinLayer');
    emptyHint = document.getElementById('trailmapEmpty');
    tripList = document.getElementById('trailmapTripList');
    dateLabel = document.getElementById('trailmapDate');
  }

  function bindEvents() {
    // 世界切换
    document.querySelectorAll('.trailmap-w-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.trailmap-w-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        state.world = btn.dataset.world;
        state.currentDay = getDays()[0] || formatToday();
        state.dayIdx = 0;
        render();
      });
    });

    // 添加 PIN 模式
    var addPinBtn = document.getElementById('addPinMode');
    addPinBtn.addEventListener('click', function() {
      state.pinMode = !state.pinMode;
      addPinBtn.classList.toggle('active', state.pinMode);
      container.style.cursor = state.pinMode ? 'crosshair' : 'default';
      updateHint();
    });

    // 记录行程
    document.getElementById('addTrip').addEventListener('click', addTripDialog);

    // 上传底图
    document.getElementById('uploadMineMap').addEventListener('click', triggerUpload);
    document.getElementById('trailmapUploadBig').addEventListener('click', triggerUpload);

    // 地图容器点击
    container.addEventListener('click', onContainerClick);

    // 日期切换
    document.getElementById('prevDay').addEventListener('click', function() {
      var days = getDays();
      if (state.dayIdx > 0) {
        state.dayIdx--;
        state.currentDay = days[state.dayIdx];
        render();
      }
    });
    document.getElementById('nextDay').addEventListener('click', function() {
      var days = getDays();
      if (state.dayIdx < days.length - 1) {
        state.dayIdx++;
        state.currentDay = days[state.dayIdx];
        render();
      } else {
        // 添加新日期
        var newDay = prompt('输入新日期 (如 5月27日):', formatToday());
        if (newDay) {
          days.push(newDay);
          state.currentDay = newDay;
          state.dayIdx = days.length - 1;
          setTrip(newDay, []);
          render();
        }
      }
    });

    // 文件上传隐藏 input
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
    if (file.size > MAX_MAP_SIZE * 2) {
      alert('图片太大了，请使用小于 8MB 的图片');
      return;
    }
    var reader = new FileReader();
    reader.onload = function(evt) {
      var dataUrl = evt.target.result;
      try {
        data.mineMapDataUrl = dataUrl;
        save();
        render();
      } catch (err) {
        alert('保存失败：' + err.message);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function getDays() {
    var trips = getTrips();
    var days = Object.keys(trips);
    if (days.length === 0) {
      days = [formatToday()];
      setTrip(days[0], []);
    }
    return days;
  }

  function formatToday() {
    var d = new Date();
    return (d.getMonth() + 1) + '月' + d.getDate() + '日';
  }

  function onContainerClick(e) {
    // 关闭已有弹窗
    document.querySelectorAll('.trailmap-popup').forEach(function(p) { p.remove(); });

    if (!state.pinMode) return;
    if (state.world !== 'mine') return; // 祁煜世界不可编辑

    var rect = container.getBoundingClientRect();
    var x = parseFloat(((e.clientX - rect.left) / rect.width * 100).toFixed(2));
    var y = parseFloat(((e.clientY - rect.top) / rect.height * 100).toFixed(2));

    var name = prompt('输入地点名称:');
    if (!name) return;

    var catOptions = [
      { id: 'mine', name: '自定义地点' },
      { id: 'blue', name: '城市/机构' },
      { id: 'red', name: '剧情地点' },
      { id: 'purple', name: '主线遗迹' },
    ];
    var catStr = prompt('分类 (输入数字):\n1. 自定义地点\n2. 城市/机构\n3. 剧情地点\n4. 主线遗迹', '1');
    var cat = catOptions[parseInt(catStr) - 1] ? catOptions[parseInt(catStr) - 1].id : 'mine';

    var desc = prompt('描述 (可选):', '') || '';

    var pin = { id: uid(), name: name, x: x, y: y, cat: cat, desc: desc };
    data.minePins.push(pin);
    save();
    render();
  }

  function updateHint() {
    var hint = document.getElementById('trailmapHint');
    if (state.world === 'mine' && state.pinMode) {
      hint.textContent = '📍 添加地点模式：点击地图任意位置添加标记';
    } else if (state.world === 'mine' && !data.mineMapDataUrl) {
      hint.textContent = '💡 先上传你的真实地图底图，再添加地点';
    } else {
      hint.textContent = '点击地点标记查看详情 · 切换到"我的世界"可自定义';
    }
  }

  // ===== 主渲染 =====
  function render() {
    renderBg();
    renderPins();
    renderTrail();
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
    dateLabel.textContent = state.currentDay;
  }

  function renderPins() {
    pinLayer.innerHTML = '';
    var pins = getPins();
    var trips = getTrips()[state.currentDay] || [];
    var activeNames = {};
    trips.forEach(function(t) { activeNames[t.from] = true; activeNames[t.to] = true; });

    pins.forEach(function(pin) {
      var el = document.createElement('div');
      el.className = 'trailmap-pin cat-' + pin.cat;
      if (activeNames[pin.name]) el.classList.add('active');
      el.style.left = pin.x + '%';
      el.style.top = pin.y + '%';
      el.innerHTML = '<div class="trailmap-pin-dot"></div><div class="trailmap-pin-label">' + escapeHtml(pin.name) + '</div>';
      el.addEventListener('click', function(e) {
        e.stopPropagation();
        showPinPopup(pin, el);
      });
      pinLayer.appendChild(el);
    });
  }

  function showPinPopup(pin, el) {
    document.querySelectorAll('.trailmap-popup').forEach(function(p) { p.remove(); });
    var rect = el.getBoundingClientRect();
    var containerRect = container.getBoundingClientRect();
    var catMap = { blue: '城市与机构', red: '剧情地点', purple: '主线遗迹', mine: '我的地点' };

    var popup = document.createElement('div');
    popup.className = 'trailmap-popup';
    var actions = '';
    if (state.world === 'mine') {
      actions = '<div class="popup-actions">' +
        '<button class="popup-edit" data-act="edit">编辑</button>' +
        '<button class="popup-del" data-act="del">删除</button>' +
        '</div>';
    }
    popup.innerHTML =
      '<h4>' + escapeHtml(pin.name) + '</h4>' +
      '<span class="cat-tag cat-' + pin.cat + '">' + (catMap[pin.cat] || '地点') + '</span>' +
      (pin.desc ? '<p>' + escapeHtml(pin.desc) + '</p>' : '') +
      actions;

    var left = rect.left - containerRect.left + rect.width / 2;
    var top = rect.top - containerRect.top - 8;
    popup.style.left = left + 'px';
    popup.style.top = top + 'px';

    pinLayer.appendChild(popup);

    popup.querySelector('[data-act="edit"]')?.addEventListener('click', function() {
      var newName = prompt('编辑地点名称:', pin.name);
      if (newName !== null) {
        var newDesc = prompt('编辑描述:', pin.desc || '');
        var newCat = prompt('分类 (1-4):', { blue:1, red:2, purple:3, mine:4 }[pin.cat] || 4);
        pin.name = newName;
        pin.desc = newDesc || '';
        var cats = ['blue','red','purple','mine'];
        pin.cat = cats[parseInt(newCat) - 1] || 'mine';
        save();
        render();
      }
    });

    popup.querySelector('[data-act="del"]')?.addEventListener('click', function() {
      if (confirm('确定删除"' + pin.name + '"吗?')) {
        data.minePins = data.minePins.filter(function(p) { return p.id !== pin.id; });
        save();
        render();
      }
    });

    // 点击外部关闭
    setTimeout(function() {
      document.addEventListener('click', closePopupOnce, { once: true });
    }, 10);
  }

  function closePopupOnce() {
    document.querySelectorAll('.trailmap-popup').forEach(function(p) { p.remove(); });
  }

  function renderTrail() {
    svg.innerHTML = '';
    var trips = getTrips()[state.currentDay] || [];
    if (trips.length === 0) return;

    var pins = getPins();
    var points = [];
    trips.forEach(function(t) {
      var fromPin = pins.find(function(p) { return p.name === t.from; });
      if (fromPin && !points.some(function(pt) { return pt.x === fromPin.x && pt.y === fromPin.y; })) {
        points.push({ x: fromPin.x, y: fromPin.y });
      }
      var toPin = pins.find(function(p) { return p.name === t.to; });
      if (toPin && !points.some(function(pt) { return pt.x === toPin.x && pt.y === toPin.y; })) {
        points.push({ x: toPin.x, y: toPin.y });
      }
    });

    if (points.length < 2) return;

    var d = 'M ' + points[0].x + ' ' + points[0].y;
    for (var i = 1; i < points.length; i++) {
      d += ' L ' + points[i].x + ' ' + points[i].y;
    }

    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    path.setAttribute('class', 'trailmap-line');
    svg.appendChild(path);
  }

  function renderTripList() {
    var trips = getTrips()[state.currentDay] || [];
    if (trips.length === 0) {
      tripList.innerHTML = '<div class="trailmap-empty-trip">暂无行程记录 · 点击顶部"记录行程"添加</div>';
      return;
    }
    tripList.innerHTML = trips.map(function(t, idx) {
      return '<div class="trailmap-trip-item">' +
        '<div class="trailmap-trip-time">' + escapeHtml(t.time) + '</div>' +
        '<div class="trailmap-trip-route">' +
        '<div><strong>' + escapeHtml(t.from) + '</strong> → <strong>' + escapeHtml(t.to) + '</strong></div>' +
        '<div class="trailmap-trip-mode">' + escapeHtml(t.mode || '') + '</div>' +
        '</div>' +
        '<button class="trailmap-trip-del" data-idx="' + idx + '" title="删除">✕</button>' +
        '</div>';
    }).join('');

    tripList.querySelectorAll('.trailmap-trip-del').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var idx = parseInt(btn.dataset.idx);
        var trips = getTrips()[state.currentDay];
        trips.splice(idx, 1);
        setTrip(state.currentDay, trips);
        render();
      });
    });
  }

  function addTripDialog() {
    var pins = getPins();
    if (pins.length < 2) {
      alert('请先添加至少 2 个地点标记');
      return;
    }

    var pinNames = pins.map(function(p, i) { return (i + 1) + '. ' + p.name; }).join('\n');
    var fromIdx = parseInt(prompt('起点:\n' + pinNames));
    if (!fromIdx || fromIdx < 1 || fromIdx > pins.length) return;
    var toIdx = parseInt(prompt('终点:\n' + pinNames));
    if (!toIdx || toIdx < 1 || toIdx > pins.length) return;
    if (fromIdx === toIdx) { alert('起点和终点不能相同'); return; }

    var time = prompt('时间段 (如 14:00-16:00):', '10:00-12:00');
    if (!time) return;
    var mode = prompt('交通方式描述 (如 🚗 乘车 · 5km):', '🚶 步行');
    if (mode === null) return;

    var trips = getTrips()[state.currentDay] || [];
    trips.push({
      time: time,
      from: pins[fromIdx - 1].name,
      to: pins[toIdx - 1].name,
      mode: mode
    });
    // 按时间排序
    trips.sort(function(a, b) { return a.time.localeCompare(b.time); });
    setTrip(state.currentDay, trips);
    render();
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

  // 暴露到 sweet.js 调用
  window.SweetTrailMap = {
    init: init,
    refresh: render
  };
})();
