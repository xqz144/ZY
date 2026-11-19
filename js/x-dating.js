/* X约会 — 本地约会生成器
 * 语料搬自 SHE.X（dp-choice-options 氛围/地点/活动/清单）。流程：邀请 → 选择 → 生成匹配度+任务+故事 → 存入约会簿。
 * 约会簿含照片相册（图片压缩后存 localforage）。全部本地、不联网、不用云端 AI。
 */
(function () {
  'use strict';

  var STYLE_ID = 'zy-xdating-style';
  var LB_BOOK = 'zy_xdating_book';
  var LS_OPTIONS = 'zy_xdating_options';

  /* ========== 默认建议池（搬自 SHE.X，仅取展示文本） ========== */
  var DEFAULT_OPTIONS = {
    atmosphere: ['有点暧昧', '安静一点', '甜甜的', '轻松活泼', '有仪式感', '浪漫一点'],
    place: [
      '黄昏的海边，一起吹吹海风', '街角的咖啡馆，坐在靠窗的位置', '秋天的公园，长椅上落满叶子',
      '看完一场电影，散场后的夜晚', '快打烊的小书店，安安静静的', '摩天轮下，等天慢慢黑下来',
      '城市的高处，看万家灯火', '下雪的夜晚，走在亮着灯的街上', '雨夜的小巷，躲在同一把伞下',
      '就待在家里，暖暖的灯光下'
    ],
    activity: [
      '靠在你肩上，看黄昏的光一点点落下', '牵着手慢慢走，走到哪算哪', '一人一只耳机，听同一首歌',
      '拉着你的手，转圈跳一支舞', '用拍立得，偷偷把你拍下来', '挤在一起，拍一张傻傻的合照',
      '抱一下，抱久一点', '递给你一束花，看你笑', '躺下来，一起数星星', '撑一把伞，把你往伞下拉'
    ],
    item: ['一束花', '拍立得', '一副耳机', '一把伞', '一只气球', '手机', '一个小盒子', '一把小勺子', '什么都不用带']
  };

  /* ========== 任务模板 ========== */
  var TASK_TEMPLATES = [
    '约会开始前，给对方发一句「今天见到你真好」。',
    '牵手的时候，用力握三下，代表「我喜欢你」。',
    '找一个瞬间，认真地夸对方一个你最近才发现的优点。',
    '分开前，给对方一个超过五秒的拥抱。',
    '一起拍一张合照，不用好看，自然就好。',
    '约会中放下手机半小时，只看对方。',
    '偷偷给对方准备一个小惊喜，哪怕只是一颗糖。',
    '说出一件今天对方让你心动的小事。'
  ];

  /* ========== 故事模板（本地拼接，不用 AI） ========== */
  function buildStory(atm, place, act, item, name) {
    var intros = [
      '这一次约会，你们约在' + place + '。',
      '见面的地点定在' + place + '，',
      '你们说好在' + place + '碰头，'
    ];
    var atmParts = {
      '有点暧昧': '空气里飘着点说不清的暧昧，谁都没有先戳破。',
      '安静一点': '没有太多话，只是安静地待在一起，却一点也不尴尬。',
      '甜甜的': '整段时间都甜甜的，像含了颗没化完的糖。',
      '轻松活泼': '两个人笑个不停，像两个偷跑出来玩的小孩。',
      '有仪式感': '这一天被过得很有仪式感，每个细节都像被认真对待过。',
      '浪漫一点': '浪漫得不像是真的，连风都像在配合你们。'
    };
    var actLine = '你们' + act + '，时间好像一下子慢了下来。';
    var itemLine = item && item !== '什么都不用带' ? '带上' + item + '的这一天，多了一点小小的特别。' : '什么都不用带，有彼此就够了。';
    var endings = [
      '回去的路上，你们都没说话，但心里都在偷偷期待下一次。',
      '这一天很短，却足够回味很久很久。',
      '分开的时候，你们约好了，下次还要这样见面。',
      '原来最好的约会，不是去了多远的地方，而是身边的人是你。'
    ];
    return pickRandom(intros) + (atmParts[atm] || '氛围刚好。') + actLine + itemLine + pickRandom(endings);
  }

  /* ========== 工具 ========== */
  function hashStr(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }
  function partnerName() {
    return (window.settings && window.settings.partnerName) || '梦角';
  }
  function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function uid() { return 'd' + Date.now() + '_' + Math.floor(Math.random() * 1000); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function notify(msg) {
    if (window.showNotification) { window.showNotification(msg, 'info'); return; }
    try { console.log('[XDating]', msg); } catch (e) {}
  }

  /* 选项池：默认 + 自定义合并 */
  function getOptions() {
    var opts = {};
    var custom = {};
    try { custom = JSON.parse(localStorage.getItem(LS_OPTIONS) || '{}') || {}; } catch (e) {}
    Object.keys(DEFAULT_OPTIONS).forEach(function (k) {
      var base = DEFAULT_OPTIONS[k].slice();
      var extra = (custom[k] || []).filter(function (v) { return v && String(v).trim(); });
      opts[k] = extra.concat(base);
    });
    return opts;
  }
  function saveCustomOption(key, arr) {
    var custom = {};
    try { custom = JSON.parse(localStorage.getItem(LS_OPTIONS) || '{}') || {}; } catch (e) {}
    custom[key] = arr.filter(function (v) { return v && String(v).trim(); }).map(function (v) { return String(v).trim(); });
    try { localStorage.setItem(LS_OPTIONS, JSON.stringify(custom)); } catch (e) {}
  }

  /* 匹配度：同天同选择稳定，可再摇 */
  function computeScore(atm, place, act, item, salt) {
    var base = hashStr(todayStr() + '|' + atm + '|' + place + '|' + act + '|' + item + '|' + (salt || 0));
    return 78 + (base % 22); // 78 ~ 99
  }

  /* ========== 持久化（约会簿） ========== */
  var book = [];
  function loadBook() {
    if (typeof localforage === 'undefined') return Promise.resolve(book);
    return localforage.getItem(LB_BOOK).then(function (arr) {
      book = Array.isArray(arr) ? arr : [];
      return book;
    }).catch(function () { return book; });
  }
  function saveBook() {
    if (typeof localforage === 'undefined') return;
    localforage.setItem(LB_BOOK, book).catch(function () {});
  }

  /* ========== 图片压缩（搬自 weibo） ========== */
  function compressImage(file) {
    return new Promise(function (resolve) {
      if (!file || !/^image\//.test(file.type)) { resolve(null); return; }
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        try {
          var w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
          var max = 1000;
          if (w > max || h > max) { var r = Math.min(max / w, max / h); w = Math.round(w * r); h = Math.round(h * r); }
          var canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.72));
        } catch (e) { resolve(null); }
        URL.revokeObjectURL(url);
      };
      img.onerror = function () { URL.revokeObjectURL(url); resolve(null); };
      img.src = url;
    });
  }

  /* ========== 状态 ========== */
  var root = null;
  var state = {
    tab: 'invite',     // invite | choose | result | book | edit
    choices: { atmosphere: null, place: null, activity: null, item: null },
    result: null,      // {score,task,story,atm,place,act,item}
    salt: 0,
    editingPhotos: [],
    currentDateId: null
  };

  /* ========== 样式 ========== */
  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var css = [
      '#zy-xdating{position:fixed;inset:0;z-index:99990;background:linear-gradient(160deg,#2a0f2e 0%,#3d1442 45%,#1c0d24 100%);display:none;flex-direction:column;color:#fbeaff;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;}',
      '#zy-xdating.show{display:flex;}',
      '#zy-xdating .xdt-shell{width:100%;max-width:560px;margin:0 auto;flex:1;min-height:0;display:flex;flex-direction:column;}',
      '#zy-xdating .xdt-head{height:50px;flex-shrink:0;display:flex;align-items:center;padding:0 10px;gap:8px;}',
      '#zy-xdating .xdt-back{width:36px;height:36px;border:none;background:transparent;color:#fbeaff;font-size:22px;cursor:pointer;line-height:1;}',
      '#zy-xdating .xdt-title{flex:1;font-size:17px;font-weight:600;}',
      '#zy-xdating .xdt-iconbtn{border:none;background:rgba(255,255,255,.12);color:#fff;font-size:13px;padding:7px 12px;border-radius:16px;cursor:pointer;}',
      '#zy-xdating .xdt-body{flex:1;overflow-y:auto;padding:10px 16px 28px;}',
      '#zy-xdating .xdt-hero{text-align:center;padding:30px 10px 20px;}',
      '#zy-xdating .xdt-hero .big{font-size:26px;font-weight:600;margin-bottom:8px;letter-spacing:1px;}',
      '#zy-xdating .xdt-hero .sub{font-size:13px;color:#d8c0e0;line-height:1.7;}',
      '#zy-xdating .xdt-cta{display:block;width:100%;max-width:260px;margin:22px auto 0;border:none;background:linear-gradient(135deg,#ff7eb6,#b07bff);color:#fff;font-size:16px;font-weight:600;padding:13px;border-radius:24px;cursor:pointer;box-shadow:0 6px 18px rgba(176,123,255,.4);}',
      '#zy-xdating .xdt-tile{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:16px;padding:14px;margin-bottom:12px;}',
      '#zy-xdating .xdt-tile h4{margin:0 0 8px;font-size:14px;color:#fff;display:flex;justify-content:space-between;align-items:center;}',
      '#zy-xdating .xdt-tile h4 .xdt-add{font-size:11px;font-weight:400;color:#ffb0d4;cursor:pointer;}',
      '#zy-xdating .xdt-chips{display:flex;flex-wrap:wrap;gap:7px;}',
      '#zy-xdating .xdt-chip{border:1px solid rgba(255,255,255,.2);background:transparent;color:#f0d8f5;font-size:13px;padding:7px 13px;border-radius:16px;cursor:pointer;}',
      '#zy-xdating .xdt-chip.on{background:linear-gradient(135deg,rgba(255,126,182,.3),rgba(176,123,255,.3));border-color:#ff9ec7;color:#fff;}',
      '#zy-xdating .xdt-score{text-align:center;padding:18px 0 6px;}',
      '#zy-xdating .xdt-score .num{font-size:52px;font-weight:200;background:linear-gradient(135deg,#ff9ec7,#b07bff);-webkit-background-clip:text;background-clip:text;color:transparent;letter-spacing:2px;}',
      '#zy-xdating .xdt-score .lbl{font-size:12px;color:#d8c0e0;letter-spacing:3px;}',
      '#zy-xdating .xdt-result-list{font-size:13px;line-height:1.8;color:#f0d8f5;}',
      '#zy-xdating .xdt-result-list b{color:#fff;font-weight:600;}',
      '#zy-xdating .xdt-story{font-size:14px;line-height:1.9;color:#f5e6fa;background:rgba(0,0,0,.2);border-radius:12px;padding:14px;margin-top:10px;}',
      '#zy-xdating .xdt-actions{display:flex;gap:10px;justify-content:center;margin:16px 0;flex-wrap:wrap;}',
      '#zy-xdating .xdt-btn{border:none;background:linear-gradient(135deg,#ff7eb6,#b07bff);color:#fff;font-size:14px;font-weight:600;padding:11px 22px;border-radius:20px;cursor:pointer;box-shadow:0 4px 14px rgba(176,123,255,.35);}',
      '#zy-xdating .xdt-btn.ghost{background:rgba(255,255,255,.12);box-shadow:none;}',
      '#zy-xdating .xdt-book-empty{text-align:center;color:#d8c0e0;font-size:13px;padding:40px 10px;}',
      '#zy-xdating .xdt-book-item{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:13px;margin-bottom:11px;}',
      '#zy-xdating .xdt-book-item .xdt-bi-top{display:flex;justify-content:space-between;font-size:12px;color:#d8c0e0;margin-bottom:6px;}',
      '#zy-xdating .xdt-book-item .xdt-bi-score{color:#ff9ec7;font-weight:600;}',
      '#zy-xdating .xdt-book-item .xdt-bi-title{font-size:14px;color:#fff;margin-bottom:5px;}',
      '#zy-xdating .xdt-book-item .xdt-bi-story{font-size:12px;color:#d8c0e0;line-height:1.7;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}',
      '#zy-xdating .xdt-book-item .xdt-bi-photos{display:flex;gap:5px;margin-top:8px;flex-wrap:wrap;}',
      '#zy-xdating .xdt-book-item .xdt-bi-photos img{width:54px;height:54px;object-fit:cover;border-radius:8px;}',
      '#zy-xdating .xdt-photos{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;}',
      '#zy-xdating .xdt-photos img{width:80px;height:80px;object-fit:cover;border-radius:10px;}',
      '#zy-xdating .xdt-photos .xdt-ph-add{width:80px;height:80px;border:1px dashed rgba(255,255,255,.35);border-radius:10px;display:flex;align-items:center;justify-content:center;color:#d8c0e0;font-size:26px;cursor:pointer;background:transparent;}',
      '#zy-xdating .xdt-edit-area{width:100%;min-height:90px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);border-radius:10px;color:#fff;padding:10px;font-size:13px;box-sizing:border-box;resize:vertical;margin-top:8px;}',
      '#zy-xdating .xdt-stat{display:flex;justify-content:space-around;margin-bottom:12px;}',
      '#zy-xdating .xdt-stat .xdt-stat-item{text-align:center;}',
      '#zy-xdating .xdt-stat .xdt-stat-num{font-size:24px;font-weight:600;color:#ff9ec7;}',
      '#zy-xdating .xdt-stat .xdt-stat-lbl{font-size:11px;color:#d8c0e0;}'
    ].join('');
    var s = document.createElement('style');
    s.id = STYLE_ID; s.textContent = css;
    document.head.appendChild(s);
  }

  /* ========== 构建 ========== */
  function buildRoot() {
    injectStyle();
    root = document.createElement('div');
    root.id = 'zy-xdating';
    root.innerHTML =
      '<div class="xdt-shell">' +
        '<div class="xdt-head">' +
          '<button class="xdt-back" type="button" aria-label="返回">‹</button>' +
          '<div class="xdt-title">X 约会</div>' +
          '<button class="xdt-iconbtn" id="xdt-book-btn" type="button">约会簿</button>' +
        '</div>' +
        '<div class="xdt-body" id="xdt-body"></div>' +
        '<input type="file" id="xdt-file" accept="image/*" multiple style="display:none">' +
      '</div>';
    document.body.appendChild(root);
    root.querySelector('.xdt-back').addEventListener('click', onBack);
    root.querySelector('#xdt-book-btn').addEventListener('click', function () { state.tab = 'book'; render(); });
    root.querySelector('#xdt-file').addEventListener('change', onPhotoSelect);
  }

  function onBack() {
    if (state.tab === 'book') { state.tab = 'invite'; render(); return; }
    if (state.tab === 'result') { state.tab = 'choose'; render(); return; }
    if (state.tab === 'choose') { state.tab = 'invite'; render(); return; }
    close();
  }

  function goChoose() { state.tab = 'choose'; render(); }

  function generateResult() {
    var c = state.choices;
    if (!c.atmosphere || !c.place || !c.activity) {
      notify('先选好氛围、地点和活动呀');
      return;
    }
    var score = computeScore(c.atmosphere, c.place, c.activity, c.item || '', state.salt);
    var task = pickRandom(TASK_TEMPLATES);
    var story = buildStory(c.atmosphere, c.place, c.activity, c.item, partnerName());
    state.result = { score: score, task: task, story: story, atm: c.atmosphere, place: c.place, act: c.activity, item: c.item };
    state.editingPhotos = [];
    state.tab = 'result';
    render();
  }

  function saveToBook() {
    var r = state.result;
    if (!r) return;
    var entry = {
      id: uid(), date: todayStr(), created: Date.now(),
      atmosphere: r.atm, place: r.place, activity: r.act, item: r.item,
      score: r.score, task: r.task, story: r.story,
      photos: state.editingPhotos.slice()
    };
    book.unshift(entry);
    saveBook();
    notify('已存入约会簿 ❤');
    state.tab = 'book';
    render();
  }

  function onPhotoSelect(e) {
    var files = Array.prototype.slice.call(e.target.files || []);
    if (!files.length) return;
    Promise.all(files.map(compressImage)).then(function (list) {
      list.forEach(function (d) { if (d) state.editingPhotos.push(d); });
      render();
      notify('照片已添加');
    });
    e.target.value = '';
  }

  /* ========== 渲染 ========== */
  function render() {
    if (!root) return;
    var body = root.querySelector('#xdt-body');
    if (state.tab === 'invite') renderInvite(body);
    else if (state.tab === 'choose') renderChoose(body);
    else if (state.tab === 'result') renderResult(body);
    else if (state.tab === 'book') renderBook(body);
  }

  function renderInvite(body) {
    root.querySelector('#xdt-book-btn').style.display = '';
    var name = partnerName();
    body.innerHTML =
      '<div class="xdt-hero">' +
        '<div class="big">和 ' + esc(name) + ' 来一场约会吧</div>' +
        '<div class="sub">选一个氛围、一个地点、一件想一起做的事，<br>生成专属于你们今天的约会。</div>' +
        '<button class="xdt-cta" id="xdt-start">发起约会</button>' +
      '</div>';
    body.querySelector('#xdt-start').addEventListener('click', goChoose);
  }

  function renderChoose(body) {
    root.querySelector('#xdt-book-btn').style.display = '';
    var opts = getOptions();
    var groups = [
      { key: 'atmosphere', title: '🌷 选一种氛围' },
      { key: 'place', title: '📍 选一个地点' },
      { key: 'activity', title: '💫 选一件想做的事' },
      { key: 'item', title: '🎁 带点什么（可选）' }
    ];
    var html = '';
    groups.forEach(function (g) {
      var chips = opts[g.key].map(function (v) {
        return '<button class="xdt-chip' + (state.choices[g.key] === v ? ' on' : '') + '" data-g="' + g.key + '" data-v="' + esc(v) + '" type="button">' + esc(v) + '</button>';
      }).join('');
      html += '<div class="xdt-tile"><h4>' + g.title + '<span class="xdt-add" data-edit="' + g.key + '">＋自定义</span></h4><div class="xdt-chips">' + chips + '</div></div>';
    });
    html += '<div class="xdt-actions"><button class="xdt-btn" id="xdt-gen">生成今日约会</button></div>';
    body.innerHTML = html;

    body.querySelectorAll('.xdt-chip').forEach(function (b) {
      b.addEventListener('click', function () {
        var g = b.getAttribute('data-g'), v = b.getAttribute('data-v');
        state.choices[g] = state.choices[g] === v ? null : v; // 再点一次取消
        renderChoose(body);
      });
    });
    body.querySelectorAll('.xdt-add').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        openEditOption(b.getAttribute('data-edit'));
      });
    });
    body.querySelector('#xdt-gen').addEventListener('click', generateResult);
  }

  function openEditOption(key) {
    var opts = getOptions();
    var custom = {};
    try { custom = JSON.parse(localStorage.getItem(LS_OPTIONS) || '{}') || {}; } catch (e) {}
    var val = (custom[key] || []).join('\n');
    var body = root.querySelector('#xdt-body');
    body.innerHTML =
      '<div class="xdt-tile"><h4>编辑「' + key + '」自定义项</h4>' +
      '<div style="font-size:11px;color:#d8c0e0;margin-bottom:6px;">每行一条，会和默认选项合并</div>' +
      '<textarea class="xdt-edit-area" id="xdt-editopt" placeholder="一行一条">' + esc(val) + '</textarea>' +
      '<div class="xdt-actions"><button class="xdt-btn" id="xdt-saveopt">保存</button><button class="xdt-btn ghost" id="xdt-cancelopt">返回</button></div></div>';
    body.querySelector('#xdt-saveopt').addEventListener('click', function () {
      var arr = body.querySelector('#xdt-editopt').value.split('\n');
      saveCustomOption(key, arr);
      notify('已保存');
      renderChoose(body);
    });
    body.querySelector('#xdt-cancelopt').addEventListener('click', function () { renderChoose(body); });
  }

  function renderResult(body) {
    root.querySelector('#xdt-book-btn').style.display = '';
    var r = state.result;
    var name = partnerName();
    var photosHtml = state.editingPhotos.map(function (p) { return '<img src="' + p + '">'; }).join('');
    body.innerHTML =
      '<div class="xdt-score"><div class="num">' + r.score + '%</div><div class="lbl">今日匹配度</div></div>' +
      '<div class="xdt-tile">' +
        '<div class="xdt-result-list">' +
          '<div>🌷 氛围：<b>' + esc(r.atm) + '</b></div>' +
          '<div>📍 地点：<b>' + esc(r.place) + '</b></div>' +
          '<div>💫 活动：<b>' + esc(r.act) + '</b></div>' +
          (r.item ? '<div>🎁 携带：<b>' + esc(r.item) + '</b></div>' : '') +
          '<div>📝 约会小任务：<b>' + esc(r.task) + '</b></div>' +
        '</div>' +
        '<div class="xdt-story">' + esc(r.story) + '</div>' +
        '<div class="xdt-photos">' + photosHtml + '<button class="xdt-ph-add" id="xdt-add-photo" type="button">＋</button></div>' +
      '</div>' +
      '<div class="xdt-actions">' +
        '<button class="xdt-btn" id="xdt-reroll">换个结果</button>' +
        '<button class="xdt-btn ghost" id="xdt-savebook">存入约会簿</button>' +
        '<button class="xdt-btn ghost" id="xdt-share">复制故事</button>' +
      '</div>';
    body.querySelector('#xdt-reroll').addEventListener('click', function () { state.salt++; generateResult(); });
    body.querySelector('#xdt-savebook').addEventListener('click', saveToBook);
    body.querySelector('#xdt-share').addEventListener('click', function () { copyText(r.story); notify('故事已复制'); });
    body.querySelector('#xdt-add-photo').addEventListener('click', function () { root.querySelector('#xdt-file').click(); });
  }

  function renderBook(body) {
    root.querySelector('#xdt-book-btn').style.display = 'none';
    var total = book.length;
    var photosCount = book.reduce(function (s, e) { return s + (e.photos ? e.photos.length : 0); }, 0);
    var html = '<div class="xdt-stat"><div class="xdt-stat-item"><div class="xdt-stat-num">' + total + '</div><div class="xdt-stat-lbl">约会次数</div></div>' +
      '<div class="xdt-stat-item"><div class="xdt-stat-num">' + photosCount + '</div><div class="xdt-stat-lbl">照片</div></div></div>';
    if (!total) {
      html += '<div class="xdt-book-empty">还没有约会记录<br>去发起第一场约会吧 💕</div>';
    } else {
      html += book.map(function (e) {
        var ph = (e.photos || []).slice(0, 4).map(function (p) { return '<img src="' + p + '">'; }).join('');
        return '<div class="xdt-book-item" data-id="' + e.id + '">' +
          '<div class="xdt-bi-top"><span>' + esc(e.date) + '</span><span class="xdt-bi-score">' + e.score + '% 匹配</span></div>' +
          '<div class="xdt-bi-title">' + esc(e.atm) + ' · ' + esc(e.place) + '</div>' +
          '<div class="xdt-bi-story">' + esc(e.story) + '</div>' +
          (ph ? '<div class="xdt-bi-photos">' + ph + '</div>' : '') +
          '</div>';
      }).join('');
    }
    body.innerHTML = html;
  }

  function copyText(txt) {
    try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(txt); return; } } catch (e) {}
    var ta = document.createElement('textarea'); ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(ta);
  }

  function open() {
    if (!root) buildRoot();
    state.tab = 'invite';
    state.salt = 0;
    state.editingPhotos = [];
    root.classList.add('show');
    document.body.style.overflow = 'hidden';
    loadBook().then(function () { render(); });
    render();
  }
  function close() {
    if (!root) return;
    root.classList.remove('show');
    document.body.style.overflow = '';
  }

  window.XDating = { open: open, close: close };
})();
