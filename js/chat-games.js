/* 桌面小游戏中心
 * 独立模块：自注入样式与底部面板，从桌面「小游戏」图标打开。
 * 所有游戏过程与结果只在面板内展示，不写入聊天记录。
 * 题库支持自定义，保存在 localStorage。
 */
(function () {
  'use strict';

  var STYLE_ID = 'chat-games-style';
  var mask = null;
  var bodyEl = null;
  var titleEl = null;
  var backBtn = null;

  /* ========== 题库默认值 ========== */
  var DEFAULT_TRUTHS = [
    '最近一次心跳加速，是因为什么？',
    '手机相册里最新一张照片是什么？',
    '如果只能记住我们之间的一件事，你选哪件？',
    '你偷偷为我做过、但我不知道的事是什么？',
    '你觉得我最迷人的地方是哪里？',
    '有没有哪一刻，你特别想抱住我？',
    '你最想和我一起去哪里旅行？',
    '我们第一次聊天，你还记得我说了什么吗？',
    '如果可以对我说一句悄悄话，现在最想说什么？',
    '你做过的关于我的最甜的梦是什么？',
    '你手机里给我的备注是什么？为什么？',
    '最近有没有因为小事偷偷生我的气？',
    '你希望我们十年后是什么样子？',
    '你最喜欢我哪一种笑？'
  ];

  var DEFAULT_DARES = [
    '用一句话夸我，不能重复以前说过的。',
    '发一条只给我看的朋友圈。',
    '学一句我最常说的口头禅。',
    '用三个表情描述今天的心情。',
    '给我讲一个冷笑话，不好笑要重讲。',
    '闭眼三秒，说出你现在想到的第一个画面。',
    '用最温柔的语气说一句「晚安」。',
    '把手机壁纸换成我们的合照（或头像）。',
    '给我唱一句现在想到的歌。',
    '认真描述一下我今天的穿搭。',
    '说三个我的优点，每个都要举例。',
    '对着屏幕比一个爱心。',
    '用一句诗形容我们的关系。',
    '现在立刻喝一口水，然后说「想你」。'
  ];

  // 默契问答：| 分隔的「问题|选项A|选项B」
  var DEFAULT_SYNC = [
    '周末更想怎么过？|宅家发呆|出门走走',
    '吃火锅先下什么？|肉|菜',
    '有点小矛盾时谁先低头？|我先|TA 先',
    '更喜欢哪种约会？|看电影|逛公园',
    '收到礼物更看重？|实用性|心意',
    '几点睡才算熬夜？|11 点后|1 点后',
    '旅行喜欢哪种节奏？|慢慢逛|打卡赶场',
    '心情不好时更想？|被抱着|一个人静静'
  ];

  var LS_KEYS = {
    truth: 'zy_game_truths',
    dare: 'zy_game_dares',
    sync: 'zy_game_sync'
  };

  function readList(key, def) {
    try {
      var raw = localStorage.getItem(key);
      if (raw) {
        var arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length) return arr;
      }
    } catch (e) {}
    return def.slice();
  }

  function writeList(key, arr) {
    try {
      localStorage.setItem(key, JSON.stringify(arr));
      return true;
    } catch (e) {
      return false;
    }
  }

  function getTruths() { return readList(LS_KEYS.truth, DEFAULT_TRUTHS); }
  function getDares() { return readList(LS_KEYS.dare, DEFAULT_DARES); }

  /** 解析默契问答，过滤掉格式不正确的行 */
  function getSyncQuestions() {
    var lines = readList(LS_KEYS.sync, DEFAULT_SYNC);
    var out = [];
    lines.forEach(function (line) {
      var parts = String(line).split('|');
      if (parts.length >= 3) {
        var q = parts[0].trim(), a = parts[1].trim(), b = parts[2].trim();
        if (q && a && b) out.push({ q: q, a: a, b: b });
      }
    });
    if (!out.length) {
      DEFAULT_SYNC.forEach(function (line) {
        var p = line.split('|');
        out.push({ q: p[0], a: p[1], b: p[2] });
      });
    }
    return out;
  }

  /* ========== 小工具 ========== */
  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function makeBtn(text, primary, onClick) {
    var b = el('button', 'cg-btn' + (primary ? ' primary' : ''), text);
    b.type = 'button';
    if (typeof onClick === 'function') b.addEventListener('click', onClick);
    return b;
  }

  function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function pick(arr) {
    return arr[rand(0, arr.length - 1)];
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  /* ========== 样式 ========== */
  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      '.cg-mask{position:fixed;inset:0;z-index:99998;display:none;align-items:flex-end;justify-content:center;}',
      '.cg-mask.show{display:flex;}',
      '.cg-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.3);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);}',
      '.cg-panel{position:relative;width:100%;max-width:520px;max-height:84vh;background:#fff;color:#3a3a3a;border-radius:24px 24px 0 0;box-shadow:0 -8px 40px rgba(31,38,135,.14);display:flex;flex-direction:column;padding-bottom:env(safe-area-inset-bottom,0px);animation:cgSlideUp .22s ease;}',
      '@keyframes cgSlideUp{from{transform:translateY(28px);opacity:.5}to{transform:translateY(0);opacity:1}}',
      '.cg-head{display:flex;align-items:center;gap:8px;padding:16px 18px 10px;border-bottom:1px solid rgba(232,164,184,.14);}',
      '.cg-title{flex:1;font-size:16px;font-weight:600;}',
      '.cg-back,.cg-close{width:32px;height:32px;border-radius:50%;border:none;background:rgba(232,164,184,.12);color:#e08cab;font-size:17px;line-height:1;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;}',
      '.cg-back[hidden]{display:none;}',
      '.cg-back:active,.cg-close:active{transform:scale(.92);}',
      '.cg-body{overflow-y:auto;padding:14px 16px 22px;-webkit-overflow-scrolling:touch;}',
      '.cg-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}',
      '.cg-item{background:#fdf7f9;border:1px solid rgba(232,164,184,.2);border-radius:16px;padding:14px;text-align:left;cursor:pointer;transition:transform .15s ease,background .15s ease;}',
      '.cg-item:active{transform:scale(.97);background:rgba(232,164,184,.12);}',
      '.cg-emoji{font-size:22px;line-height:1;}',
      '.cg-name{font-size:14px;font-weight:600;margin-top:7px;}',
      '.cg-desc{font-size:11px;color:#a08f97;margin-top:3px;line-height:1.4;}',
      '.cg-center{text-align:center;}',
      '.cg-dice{font-size:46px;letter-spacing:8px;margin:12px 0 4px;line-height:1.1;color:#e8a4b8;}',
      '.cg-result{font-size:15px;font-weight:600;color:#e08cab;min-height:22px;padding:4px 0;}',
      '.cg-sub{font-size:12px;color:#a08f97;margin-top:6px;line-height:1.6;}',
      '.cg-actions{display:flex;gap:10px;justify-content:center;margin-top:16px;flex-wrap:wrap;}',
      '.cg-btn{padding:10px 20px;border-radius:14px;border:1px solid rgba(232,164,184,.32);background:rgba(232,164,184,.1);color:#4a3f45;font-size:14px;font-weight:500;cursor:pointer;transition:transform .15s ease;}',
      '.cg-btn.primary{background:linear-gradient(135deg,#f4a0bc,#e8a4b8);color:#fff;border-color:transparent;}',
      '.cg-btn.small{padding:7px 14px;font-size:12.5px;}',
      '.cg-btn:active{transform:scale(.96);}',
      '.cg-btn:disabled{opacity:.5;cursor:not-allowed;}',
      '.cg-input{width:100%;box-sizing:border-box;padding:11px 14px;border-radius:14px;border:1px solid rgba(232,164,184,.28);font-size:16px;color:#3a3a3a;background:#fdfbfa;outline:none;text-align:center;}',
      '.cg-input:focus{border-color:#e8a4b8;}',
      '.cg-log{margin-top:12px;font-size:12px;color:#a08f97;line-height:1.7;max-height:132px;overflow-y:auto;text-align:left;background:rgba(232,164,184,.07);border-radius:12px;padding:10px 12px;}',
      '.cg-log:empty{display:none;}',
      '.cg-rps{display:flex;gap:12px;justify-content:center;margin:14px 0 6px;}',
      '.cg-rps button{width:64px;height:64px;font-size:30px;line-height:1;background:rgba(232,164,184,.09);border:1px solid rgba(232,164,184,.24);border-radius:18px;cursor:pointer;transition:transform .15s ease;}',
      '.cg-rps button:active{transform:scale(.93);}',
      '.cg-prompt{margin-top:10px;padding:16px;border-radius:16px;background:rgba(232,164,184,.09);border:1px dashed rgba(232,164,184,.38);font-size:14px;line-height:1.65;min-height:64px;display:flex;align-items:center;justify-content:center;text-align:center;}',
      '.cg-opt{display:block;width:100%;box-sizing:border-box;text-align:left;margin-top:8px;padding:12px 14px;border-radius:14px;border:1px solid rgba(232,164,184,.22);background:#fff;font-size:13.5px;color:#4a3f45;cursor:pointer;}',
      '.cg-opt:active{background:rgba(232,164,184,.08);}',
      '.cg-mode{display:flex;gap:8px;justify-content:center;margin-bottom:4px;}',
      '.cg-mode button{flex:1;padding:9px 0;border-radius:12px;border:1px solid rgba(232,164,184,.22);background:#fff;font-size:13px;color:#a08f97;cursor:pointer;}',
      '.cg-mode button.on{background:rgba(232,164,184,.16);border-color:rgba(232,164,184,.5);color:#e08cab;font-weight:600;}',
      '.cg-ta{width:100%;box-sizing:border-box;min-height:180px;max-height:34vh;padding:12px;border-radius:14px;border:1px solid rgba(232,164,184,.28);background:#fdfbfa;font-size:13px;line-height:1.7;color:#4a3f45;outline:none;resize:vertical;font-family:inherit;}',
      '.cg-ta:focus{border-color:#e8a4b8;}',
      '.cg-tip{font-size:11.5px;color:#a08f97;margin:8px 0 10px;line-height:1.6;text-align:left;}',
      '.cg-row{display:flex;gap:10px;justify-content:center;margin-top:12px;}'
    ].join('');
    document.head.appendChild(style);
  }

  /* ========== 面板骨架 ========== */
  function buildSheet() {
    injectStyle();
    mask = el('div', 'cg-mask');
    mask.id = 'chatGameSheet';
    mask.setAttribute('aria-hidden', 'true');
    mask.innerHTML =
      '<div class="cg-backdrop"></div>' +
      '<div class="cg-panel" role="dialog" aria-modal="true">' +
        '<div class="cg-head">' +
          '<button type="button" class="cg-back" aria-label="返回">‹</button>' +
          '<span class="cg-title">小游戏</span>' +
          '<button type="button" class="cg-close" aria-label="关闭">✕</button>' +
        '</div>' +
        '<div class="cg-body"></div>' +
      '</div>';

    document.body.appendChild(mask);
    bodyEl = mask.querySelector('.cg-body');
    titleEl = mask.querySelector('.cg-title');
    backBtn = mask.querySelector('.cg-back');

    mask.querySelector('.cg-backdrop').addEventListener('click', close);
    mask.querySelector('.cg-close').addEventListener('click', close);
    backBtn.addEventListener('click', showGrid);
  }

  function open() {
    if (!mask) buildSheet();
    showGrid();
    mask.classList.add('show');
    mask.setAttribute('aria-hidden', 'false');
  }

  function close() {
    if (!mask) return;
    mask.classList.remove('show');
    mask.setAttribute('aria-hidden', 'true');
  }

  function setView(title, node, showBack) {
    titleEl.textContent = title;
    backBtn.hidden = !showBack;
    clear(bodyEl);
    bodyEl.appendChild(node);
  }

  function openGame(title, viewFn) {
    setView(title, viewFn(), true);
  }

  /* ========== 游戏列表 ========== */
  var GAMES = [
    { id: 'dice', emoji: '🎲', name: '掷骰子', desc: '双方各掷一颗，比大小' },
    { id: 'rps', emoji: '✌️', name: '石头剪刀布', desc: '一局定输赢' },
    { id: 'guess', emoji: '🔢', name: '猜数字', desc: '1~100，八次机会' },
    { id: 'truth', emoji: '🎯', name: '真心话大冒险', desc: '抽一张，回答或行动' },
    { id: 'sync', emoji: '💞', name: '默契问答', desc: '看看你们有多默契' },
    { id: 'edit', emoji: '✏️', name: '自定义题库', desc: '自己出题才有意思' }
  ];

  function showGrid() {
    var wrap = el('div');
    var grid = el('div', 'cg-grid');
    GAMES.forEach(function (g) {
      var item = el('div', 'cg-item');
      item.setAttribute('role', 'button');
      item.appendChild(el('div', 'cg-emoji', g.emoji));
      item.appendChild(el('div', 'cg-name', g.name));
      item.appendChild(el('div', 'cg-desc', g.desc));
      item.addEventListener('click', function () {
        if (g.id === 'dice') openGame('掷骰子', viewDice);
        else if (g.id === 'rps') openGame('石头剪刀布', viewRps);
        else if (g.id === 'guess') openGame('猜数字', viewGuess);
        else if (g.id === 'truth') openGame('真心话大冒险', viewTruth);
        else if (g.id === 'sync') openGame('默契问答', viewSync);
        else if (g.id === 'edit') openGame('自定义题库', viewEditor);
      });
      grid.appendChild(item);
    });
    wrap.appendChild(grid);
    wrap.appendChild(el('div', 'cg-sub', '游戏结果只在这里显示，不会发到聊天里～'));
    setView('小游戏', wrap, false);
  }

  /* ========== 1. 掷骰子 ========== */
  var DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

  function viewDice() {
    var wrap = el('div', 'cg-center');
    var diceEl = el('div', 'cg-dice', '🎲 🎲');
    var resultEl = el('div', 'cg-result', '准备好了吗？');
    var subEl = el('div', 'cg-sub', '点「掷一次」，看看今天谁的运气更好');
    var actions = el('div', 'cg-actions');
    var rollBtn = makeBtn('掷一次', true);
    actions.appendChild(rollBtn);

    rollBtn.addEventListener('click', function () {
      rollBtn.disabled = true;
      var ticks = 0;
      var timer = setInterval(function () {
        diceEl.textContent = DICE_FACES[rand(0, 5)] + ' ' + DICE_FACES[rand(0, 5)];
        ticks++;
        if (ticks >= 8) {
          clearInterval(timer);
          var mine = rand(1, 6);
          var theirs = rand(1, 6);
          diceEl.textContent = DICE_FACES[mine - 1] + ' ' + DICE_FACES[theirs - 1];
          if (mine > theirs) resultEl.textContent = '你赢了！' + mine + ' : ' + theirs;
          else if (mine < theirs) resultEl.textContent = 'TA 赢了 ' + mine + ' : ' + theirs;
          else resultEl.textContent = '平局！' + mine + ' : ' + theirs;
          subEl.textContent = '我 ' + mine + ' 点 · TA ' + theirs + ' 点';
          rollBtn.disabled = false;
          rollBtn.textContent = '再掷一次';
        }
      }, 70);
    });

    wrap.appendChild(diceEl);
    wrap.appendChild(resultEl);
    wrap.appendChild(subEl);
    wrap.appendChild(actions);
    return wrap;
  }

  /* ========== 2. 石头剪刀布 ========== */
  var RPS = {
    rock: { emoji: '✊', name: '石头', beats: 'scissors' },
    scissors: { emoji: '✌️', name: '剪刀', beats: 'paper' },
    paper: { emoji: '✋', name: '布', beats: 'rock' }
  };
  var RPS_KEYS = ['rock', 'scissors', 'paper'];

  function viewRps() {
    var wrap = el('div', 'cg-center');
    var row = el('div', 'cg-rps');
    var resultEl = el('div', 'cg-result', '');
    var subEl = el('div', 'cg-sub', '石头赢剪刀 · 剪刀赢布 · 布赢石头');

    RPS_KEYS.forEach(function (key) {
      var b = el('button', null, RPS[key].emoji);
      b.type = 'button';
      b.title = RPS[key].name;
      b.addEventListener('click', function () {
        var theirKey = pick(RPS_KEYS);
        var mine = RPS[key];
        var theirs = RPS[theirKey];
        if (key === theirKey) {
          resultEl.textContent = '平局';
          subEl.textContent = mine.emoji + ' ' + mine.name + ' vs ' + theirs.emoji + ' ' + theirs.name + ' · 想到一块去了';
        } else if (mine.beats === theirKey) {
          resultEl.textContent = '你赢了';
          subEl.textContent = mine.emoji + ' ' + mine.name + ' vs ' + theirs.emoji + ' ' + theirs.name + ' · TA 输得心服口服';
        } else {
          resultEl.textContent = 'TA 赢了';
          subEl.textContent = mine.emoji + ' ' + mine.name + ' vs ' + theirs.emoji + ' ' + theirs.name + ' · 再来一局扳回来';
        }
      });
      row.appendChild(b);
    });

    wrap.appendChild(row);
    wrap.appendChild(resultEl);
    wrap.appendChild(subEl);
    return wrap;
  }

  /* ========== 3. 猜数字 ========== */
  function viewGuess() {
    var MAX_TRIES = 8;
    var secret = rand(1, 100);
    var tries = 0;

    var wrap = el('div', 'cg-center');
    var hint = el('div', 'cg-sub', 'TA 心里想了一个 1~100 的数字，你有 ' + MAX_TRIES + ' 次机会');
    var input = el('input', 'cg-input');
    input.type = 'number';
    input.min = '1';
    input.max = '100';
    input.placeholder = '输入 1~100';
    input.style.marginTop = '14px';
    var resultEl = el('div', 'cg-result', '');
    var logEl = el('div', 'cg-log', '');
    var actions = el('div', 'cg-actions');
    var guessBtn = makeBtn('猜一下', true);
    var giveUpBtn = makeBtn('放弃', false);
    actions.appendChild(guessBtn);
    actions.appendChild(giveUpBtn);

    function endGame(text) {
      resultEl.textContent = text;
      input.disabled = true;
      guessBtn.disabled = true;
      giveUpBtn.disabled = true;
      clear(actions);
      actions.appendChild(makeBtn('再玩一局', true, function () {
        setView('猜数字', viewGuess(), true);
      }));
    }

    function doGuess() {
      var val = parseInt(input.value, 10);
      if (!val || val < 1 || val > 100) {
        resultEl.textContent = '请输入 1~100 的整数';
        return;
      }
      tries++;
      if (val === secret) {
        logEl.appendChild(el('div', null, '第 ' + tries + ' 次：' + val + ' → 猜中啦！'));
        endGame('🎉 猜中了！答案就是 ' + secret);
        return;
      }
      var remain = MAX_TRIES - tries;
      logEl.appendChild(el('div', null, '第 ' + tries + ' 次：' + val + ' → ' + (val > secret ? '大了' : '小了') + (remain > 0 ? '（还剩 ' + remain + ' 次）' : '')));
      if (remain <= 0) {
        endGame('机会用完啦，答案是 ' + secret);
        return;
      }
      resultEl.textContent = val > secret ? '大了，往小一点猜' : '小了，往大一点猜';
      input.value = '';
      input.focus();
    }

    guessBtn.addEventListener('click', doGuess);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        doGuess();
      }
    });
    giveUpBtn.addEventListener('click', function () {
      logEl.appendChild(el('div', null, '你选择了放弃'));
      endGame('答案是 ' + secret);
    });

    wrap.appendChild(hint);
    wrap.appendChild(input);
    wrap.appendChild(resultEl);
    wrap.appendChild(logEl);
    wrap.appendChild(actions);
    setTimeout(function () { try { input.focus(); } catch (e) {} }, 120);
    return wrap;
  }

  /* ========== 4. 真心话大冒险 ========== */
  function viewTruth() {
    var mode = 'truth';
    var current = '';

    var wrap = el('div', 'cg-center');
    var modeRow = el('div', 'cg-mode');
    var truthBtn = el('button', null, '真心话');
    var dareBtn = el('button', null, '大冒险');
    truthBtn.type = 'button';
    dareBtn.type = 'button';
    modeRow.appendChild(truthBtn);
    modeRow.appendChild(dareBtn);

    var promptEl = el('div', 'cg-prompt', '');
    var actions = el('div', 'cg-actions');
    var againBtn = makeBtn('换一题', false);
    var editBtn = makeBtn('编辑题库', false);
    actions.appendChild(againBtn);
    actions.appendChild(editBtn);

    function pool() {
      return mode === 'truth' ? getTruths() : getDares();
    }

    function nextPrompt() {
      var list = pool();
      var next = current;
      while (list.length > 1 && next === current) next = pick(list);
      current = next;
      promptEl.textContent = current;
    }

    function refreshMode() {
      truthBtn.className = mode === 'truth' ? 'on' : '';
      dareBtn.className = mode === 'dare' ? 'on' : '';
      current = '';
      nextPrompt();
    }

    truthBtn.addEventListener('click', function () {
      if (mode === 'truth') return;
      mode = 'truth';
      refreshMode();
    });
    dareBtn.addEventListener('click', function () {
      if (mode === 'dare') return;
      mode = 'dare';
      refreshMode();
    });
    againBtn.addEventListener('click', nextPrompt);
    editBtn.addEventListener('click', function () {
      openGame('自定义题库', viewEditor);
    });

    wrap.appendChild(modeRow);
    wrap.appendChild(promptEl);
    wrap.appendChild(actions);
    wrap.appendChild(el('div', 'cg-sub', '抽到就认真回答，不许耍赖哦'));
    refreshMode();
    return wrap;
  }

  /* ========== 5. 默契问答 ========== */
  function viewSync() {
    var questions = getSyncQuestions();
    var index = 0;
    var score = 0;

    var wrap = el('div', 'cg-center');
    var progress = el('div', 'cg-sub', '');
    var questionEl = el('div', 'cg-prompt', '');
    var optWrap = el('div');
    var resultEl = el('div', 'cg-result', '');
    var nextWrap = el('div', 'cg-actions');

    function render() {
      var item = questions[index];
      progress.textContent = '第 ' + (index + 1) + ' / ' + questions.length + ' 题';
      questionEl.textContent = item.q;
      resultEl.textContent = '';
      clear(optWrap);
      clear(nextWrap);
      ['a', 'b'].forEach(function (key) {
        var opt = el('button', 'cg-opt', item[key]);
        opt.type = 'button';
        opt.addEventListener('click', function () { answer(item, key); });
        optWrap.appendChild(opt);
      });
    }

    function answer(item, mineKey) {
      var theirKey = Math.random() < 0.7 ? mineKey : (mineKey === 'a' ? 'b' : 'a');
      var same = mineKey === theirKey;
      if (same) score++;

      Array.prototype.forEach.call(optWrap.children, function (opt) {
        opt.disabled = true;
        opt.style.opacity = '0.55';
      });

      resultEl.textContent = 'TA 选了「' + item[theirKey] + '」' + (same ? ' · 默契 +1 💞' : ' · 差一点点');
      clear(nextWrap);

      if (index < questions.length - 1) {
        nextWrap.appendChild(makeBtn('下一题', true, function () {
          index++;
          render();
        }));
      } else {
        var rate = Math.round((score / questions.length) * 100);
        nextWrap.appendChild(makeBtn('看看结果', true, function () {
          questionEl.textContent = '默契度 ' + rate + '%';
          clear(optWrap);
          clear(nextWrap);
          resultEl.textContent = questions.length + ' 题里默契了 ' + score + ' 题';
          nextWrap.appendChild(makeBtn('再来一轮', false, function () {
            index = 0;
            score = 0;
            render();
          }));
          nextWrap.appendChild(makeBtn('编辑题库', false, function () {
            openGame('自定义题库', viewEditor);
          }));
        }));
      }
    }

    render();
    wrap.appendChild(progress);
    wrap.appendChild(questionEl);
    wrap.appendChild(optWrap);
    wrap.appendChild(resultEl);
    wrap.appendChild(nextWrap);
    return wrap;
  }

  /* ========== 6. 自定义题库 ========== */
  function viewEditor() {
    var tab = 'truth';

    var wrap = el('div');
    var modeRow = el('div', 'cg-mode');
    var tabs = [
      { id: 'truth', label: '真心话' },
      { id: 'dare', label: '大冒险' },
      { id: 'sync', label: '默契问答' }
    ];
    var tabBtns = {};
    tabs.forEach(function (t) {
      var b = el('button', null, t.label);
      b.type = 'button';
      b.addEventListener('click', function () {
        tab = t.id;
        refresh();
      });
      tabBtns[t.id] = b;
      modeRow.appendChild(b);
    });

    var tipEl = el('div', 'cg-tip', '');
    var ta = el('textarea', 'cg-ta');
    var row = el('div', 'cg-row');
    var saveBtn = makeBtn('保存', true);
    var resetBtn = makeBtn('恢复默认', false);
    row.appendChild(saveBtn);
    row.appendChild(resetBtn);

    function currentKey() {
      return tab === 'truth' ? LS_KEYS.truth : tab === 'dare' ? LS_KEYS.dare : LS_KEYS.sync;
    }

    function currentDefault() {
      return tab === 'truth' ? DEFAULT_TRUTHS : tab === 'dare' ? DEFAULT_DARES : DEFAULT_SYNC;
    }

    function refresh() {
      Object.keys(tabBtns).forEach(function (k) {
        tabBtns[k].className = k === tab ? 'on' : '';
      });
      tipEl.textContent = tab === 'sync'
        ? '每行一道题，用「|」分隔：问题|选项A|选项B'
        : '每行一条，空行会自动忽略';
      ta.value = readList(currentKey(), currentDefault()).join('\n');
    }

    saveBtn.addEventListener('click', function () {
      var lines = ta.value.split('\n')
        .map(function (s) { return s.trim(); })
        .filter(function (s) { return s.length > 0; });
      if (!lines.length) {
        tipEl.textContent = '至少要保留一条内容';
        return;
      }
      if (tab === 'sync') {
        var bad = lines.filter(function (line) { return line.split('|').length < 3; }).length;
        if (bad > 0) {
          tipEl.textContent = '有 ' + bad + ' 行格式不对，应为：问题|选项A|选项B';
          return;
        }
      }
      if (writeList(currentKey(), lines)) {
        tipEl.textContent = '已保存 ' + lines.length + ' 条';
      } else {
        tipEl.textContent = '保存失败，存储空间可能已满';
      }
    });

    resetBtn.addEventListener('click', function () {
      try { localStorage.removeItem(currentKey()); } catch (e) {}
      ta.value = currentDefault().join('\n');
      tipEl.textContent = '已恢复默认题库';
    });

    wrap.appendChild(modeRow);
    wrap.appendChild(tipEl);
    wrap.appendChild(ta);
    wrap.appendChild(row);
    refresh();
    return wrap;
  }

  /* ========== 对外接口 ========== */
  window.ChatGames = {
    open: open,
    close: close,
    games: GAMES
  };

  // 桌面图标点击后由 home.js 的 openApp 调用
})();
