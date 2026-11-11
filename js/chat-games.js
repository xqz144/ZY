/* 聊天小游戏中心
 * 独立模块：自注入样式与底部面板，不污染 chat-new.html 既有结构。
 * 游戏结果通过 window.ChatGamesBridge 写入聊天记录，刷新后仍保留。
 */
(function () {
  'use strict';

  var btn = document.getElementById('gameBtn');
  var bridge = window.ChatGamesBridge;

  if (!btn || !bridge) {
    if (window.console) console.warn('[chat-games] 缺少游戏入口或写入桥，已跳过初始化');
    return;
  }

  var STYLE_ID = 'chat-games-style';
  var mask = null;      // 面板遮罩
  var bodyEl = null;    // 内容区
  var titleEl = null;   // 标题
  var backBtn = null;   // 返回按钮

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

  function names() {
    try {
      return bridge.getNames();
    } catch (e) {
      return { partner: '梦角', me: '我' };
    }
  }

  /* ========== 样式 ========== */
  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      '.cg-mask{position:fixed;inset:0;z-index:60;display:none;align-items:flex-end;justify-content:center;}',
      '.cg-mask.show{display:flex;}',
      '.cg-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.25);backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px);}',
      '.cg-panel{position:relative;width:100%;max-width:520px;max-height:82vh;background:#fff;border-radius:24px 24px 0 0;box-shadow:0 -8px 40px rgba(31,38,135,.12);display:flex;flex-direction:column;padding-bottom:env(safe-area-inset-bottom,0px);animation:cgSlideUp .22s ease;}',
      '@keyframes cgSlideUp{from{transform:translateY(28px);opacity:.5}to{transform:translateY(0);opacity:1}}',
      '.cg-head{display:flex;align-items:center;gap:8px;padding:16px 18px 10px;border-bottom:1px solid rgba(232,164,184,.12);}',
      '.cg-title{flex:1;font-size:16px;font-weight:600;color:var(--text-primary,#4a3f45);}',
      '.cg-back,.cg-close{width:32px;height:32px;border-radius:50%;border:none;background:rgba(232,164,184,.1);color:var(--accent-color,#e8a4b8);font-size:17px;line-height:1;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;}',
      '.cg-back[hidden]{display:none;}',
      '.cg-back:active,.cg-close:active{transform:scale(.92);}',
      '.cg-body{overflow-y:auto;padding:14px 16px 22px;-webkit-overflow-scrolling:touch;}',
      '.cg-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}',
      '.cg-item{background:#fdf7f9;border:1px solid rgba(232,164,184,.18);border-radius:16px;padding:14px;text-align:left;cursor:pointer;transition:transform .15s ease,background .15s ease;}',
      '.cg-item:active{transform:scale(.97);background:rgba(232,164,184,.12);}',
      '.cg-emoji{font-size:22px;line-height:1;}',
      '.cg-name{font-size:14px;font-weight:600;color:var(--text-primary,#4a3f45);margin-top:7px;}',
      '.cg-desc{font-size:11px;color:var(--text-secondary,#9a8a92);margin-top:3px;line-height:1.4;}',
      '.cg-center{text-align:center;}',
      '.cg-dice{font-size:46px;letter-spacing:8px;margin:12px 0 4px;line-height:1.1;color:#e8a4b8;}',
      '.cg-result{font-size:15px;font-weight:600;color:var(--accent-color,#e8a4b8);min-height:22px;padding:4px 0;}',
      '.cg-sub{font-size:12px;color:var(--text-secondary,#9a8a92);margin-top:6px;line-height:1.6;}',
      '.cg-actions{display:flex;gap:10px;justify-content:center;margin-top:16px;flex-wrap:wrap;}',
      '.cg-btn{padding:10px 20px;border-radius:14px;border:1px solid rgba(232,164,184,.3);background:rgba(232,164,184,.1);color:var(--text-primary,#4a3f45);font-size:14px;font-weight:500;cursor:pointer;transition:transform .15s ease;}',
      '.cg-btn.primary{background:linear-gradient(135deg,#f4a0bc,#e8a4b8);color:#fff;border-color:transparent;}',
      '.cg-btn:active{transform:scale(.96);}',
      '.cg-btn:disabled{opacity:.5;cursor:not-allowed;}',
      '.cg-input{width:100%;box-sizing:border-box;padding:11px 14px;border-radius:14px;border:1px solid rgba(232,164,184,.25);font-size:16px;color:var(--text-primary,#4a3f45);outline:none;text-align:center;background:#fff;}',
      '.cg-input:focus{border-color:var(--accent-color,#e8a4b8);}',
      '.cg-log{margin-top:12px;font-size:12px;color:var(--text-secondary,#9a8a92);line-height:1.7;max-height:132px;overflow-y:auto;text-align:left;background:rgba(232,164,184,.06);border-radius:12px;padding:10px 12px;}',
      '.cg-log:empty{display:none;}',
      '.cg-rps{display:flex;gap:12px;justify-content:center;margin:14px 0 6px;}',
      '.cg-rps button{width:64px;height:64px;font-size:30px;line-height:1;background:rgba(232,164,184,.08);border:1px solid rgba(232,164,184,.22);border-radius:18px;cursor:pointer;transition:transform .15s ease;}',
      '.cg-rps button:active{transform:scale(.93);}',
      '.cg-prompt{margin-top:10px;padding:16px;border-radius:16px;background:rgba(232,164,184,.08);border:1px dashed rgba(232,164,184,.35);font-size:14px;line-height:1.65;color:var(--text-primary,#4a3f45);min-height:64px;display:flex;align-items:center;justify-content:center;text-align:center;}',
      '.cg-opt{display:block;width:100%;box-sizing:border-box;text-align:left;margin-top:8px;padding:12px 14px;border-radius:14px;border:1px solid rgba(232,164,184,.2);background:#fff;font-size:13.5px;color:var(--text-primary,#4a3f45);cursor:pointer;}',
      '.cg-opt:active{background:rgba(232,164,184,.08);}',
      '.cg-mode{display:flex;gap:8px;justify-content:center;margin-bottom:4px;}',
      '.cg-mode button{flex:1;padding:9px 0;border-radius:12px;border:1px solid rgba(232,164,184,.2);background:#fff;font-size:13px;color:var(--text-secondary,#9a8a92);cursor:pointer;}',
      '.cg-mode button.on{background:rgba(232,164,184,.16);border-color:rgba(232,164,184,.5);color:var(--accent-color,#e8a4b8);font-weight:600;}'
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
    while (bodyEl.firstChild) bodyEl.removeChild(bodyEl.firstChild);
    bodyEl.appendChild(node);
  }

  /* ========== 游戏列表 ========== */
  var GAMES = [
    { id: 'dice', emoji: '🎲', name: '掷骰子', desc: '你一颗，TA 一颗，比大小' },
    { id: 'rps', emoji: '✌️', name: '石头剪刀布', desc: '一局定输赢，敢不敢来' },
    { id: 'guess', emoji: '🔢', name: '猜数字', desc: 'TA 想了 1~100 的数' },
    { id: 'truth', emoji: '🎯', name: '真心话大冒险', desc: '抽一张，回答或行动' },
    { id: 'sync', emoji: '💞', name: '默契问答', desc: '看看你们有多默契' }
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
      });
      grid.appendChild(item);
    });
    wrap.appendChild(grid);
    wrap.appendChild(el('div', 'cg-sub', '小提示：游戏结果会以聊天气泡的形式保存下来～'));
    setView('小游戏', wrap, false);
  }

  function openGame(title, viewFn) {
    setView(title, viewFn(), true);
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
          finish();
        }
      }, 70);

      function finish() {
        var mine = rand(1, 6);
        var theirs = rand(1, 6);
        var n = names();
        diceEl.textContent = DICE_FACES[mine - 1] + ' ' + DICE_FACES[theirs - 1];
        var msg;
        if (mine > theirs) {
          resultEl.textContent = '你赢了！' + mine + ' : ' + theirs;
          msg = '🎲 我掷了 ' + theirs + ' 点，你掷了 ' + mine + ' 点，这局你赢啦～';
        } else if (mine < theirs) {
          resultEl.textContent = 'TA 赢了' + ' ' + mine + ' : ' + theirs;
          msg = '🎲 我掷了 ' + theirs + ' 点，你掷了 ' + mine + ' 点，这局我赢咯！';
        } else {
          resultEl.textContent = '平局！' + mine + ' : ' + theirs;
          msg = '🎲 我们都掷出了 ' + mine + ' 点，心有灵犀呀～';
        }
        subEl.textContent = n.me + ' ' + mine + ' 点 · ' + n.partner + ' ' + theirs + ' 点';
        bridge.partnerSay(msg);
        rollBtn.disabled = false;
        rollBtn.textContent = '再掷一次';
      }
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
    var title = el('div', 'cg-sub', '选一个手势，TA 也会同时出');
    var row = el('div', 'cg-rps');
    var resultEl = el('div', 'cg-result', '');
    var subEl = el('div', 'cg-sub', '石头赢剪刀 · 剪刀赢布 · 布赢石头');

    RPS_KEYS.forEach(function (key) {
      var b = el('button', null, RPS[key].emoji);
      b.type = 'button';
      b.title = RPS[key].name;
      b.addEventListener('click', function () { play(key); });
      row.appendChild(b);
    });

    function play(mineKey) {
      var theirKey = pick(RPS_KEYS);
      var mine = RPS[mineKey];
      var theirs = RPS[theirKey];
      var n = names();
      var line = mine.emoji + ' ' + mine.name + ' vs ' + theirs.emoji + ' ' + theirs.name;
      var msg;
      var verdict;
      if (mineKey === theirKey) {
        resultEl.textContent = '平局';
        msg = '✊ 我出' + theirs.name + '，你出' + mine.name + '，平局！再来一局？';
        verdict = '想到一块去了';
      } else if (mine.beats === theirKey) {
        resultEl.textContent = '你赢了';
        msg = '✌️ 我出' + theirs.name + '，你出' + mine.name + '，你赢啦～';
        verdict = n.partner + '输得心服口服';
      } else {
        resultEl.textContent = 'TA 赢了';
        msg = '✌️ 我出' + theirs.name + '，你出' + mine.name + '，这局我赢咯！';
        verdict = '再来一局扳回来';
      }
      subEl.textContent = line + ' · ' + verdict;
      bridge.partnerSay(msg);
    }

    wrap.appendChild(title);
    wrap.appendChild(row);
    wrap.appendChild(resultEl);
    wrap.appendChild(subEl);
    return wrap;
  }

  /* ========== 3. 猜数字 ========== */
  function viewGuess() {
    var secret = rand(1, 100);
    var tries = 0;
    var MAX_TRIES = 8;

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

    function endGame(text, msg) {
      resultEl.textContent = text;
      input.disabled = true;
      guessBtn.disabled = true;
      giveUpBtn.disabled = true;
      if (msg) bridge.partnerSay(msg);
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
      var line = '第 ' + tries + ' 次：' + val + ' → ';
      if (val === secret) {
        line += '猜中啦！';
        logEl.appendChild(el('div', null, line));
        endGame('🎉 猜中了！答案就是 ' + secret,
          '🎉 你猜中啦！答案就是 ' + secret + '，一共用了 ' + tries + ' 次，厉害～');
        return;
      }
      if (val > secret) {
        line += '大了';
        if (tries >= MAX_TRIES) {
          logEl.appendChild(el('div', null, line));
          endGame('机会用完啦，答案是 ' + secret,
            '🔢 机会用完啦，其实答案是 ' + secret + '，下次一定可以～');
          return;
        }
        resultEl.textContent = '大了，往小一点猜';
      } else {
        line += '小了';
        if (tries >= MAX_TRIES) {
          logEl.appendChild(el('div', null, line));
          endGame('机会用完啦，答案是 ' + secret,
            '🔢 机会用完啦，其实答案是 ' + secret + '，下次一定可以～');
          return;
        }
        resultEl.textContent = '小了，往大一点猜';
      }
      logEl.appendChild(el('div', null, line + '（还剩 ' + (MAX_TRIES - tries) + ' 次）'));
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
      endGame('答案是 ' + secret, '🔢 答案其实是 ' + secret + ' 呀，下次再来～');
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
  var TRUTHS = [
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

  var DARES = [
    '用一句话夸我，不能重复以前说过的。',
    '发一条只给我看的朋友圈。',
    '学一句我最常说的口头禅。',
    '用三个表情包描述今天的心情。',
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
    var resultEl = el('div', 'cg-result', '');
    var actions = el('div', 'cg-actions');
    var againBtn = makeBtn('换一题', false);
    var sendBtn = makeBtn('发给 TA', true);
    actions.appendChild(againBtn);
    actions.appendChild(sendBtn);

    function refreshMode() {
      truthBtn.className = mode === 'truth' ? 'on' : '';
      dareBtn.className = mode === 'dare' ? 'on' : '';
      nextPrompt();
    }

    function nextPrompt() {
      var pool = mode === 'truth' ? TRUTHS : DARES;
      var next = current;
      while (pool.length > 1 && next === current) next = pick(pool);
      current = next;
      promptEl.textContent = current;
      resultEl.textContent = '';
    }

    truthBtn.addEventListener('click', function () {
      if (mode === 'truth') return;
      mode = 'truth';
      current = '';
      refreshMode();
    });
    dareBtn.addEventListener('click', function () {
      if (mode === 'dare') return;
      mode = 'dare';
      current = '';
      refreshMode();
    });
    againBtn.addEventListener('click', nextPrompt);
    sendBtn.addEventListener('click', function () {
      if (!current) return;
      var label = mode === 'truth' ? '🎯 真心话：' : '🎯 大冒险：';
      bridge.partnerSay(label + current);
      resultEl.textContent = '已发到聊天啦～';
    });

    wrap.appendChild(modeRow);
    wrap.appendChild(promptEl);
    wrap.appendChild(actions);
    wrap.appendChild(resultEl);
    wrap.appendChild(el('div', 'cg-sub', '抽到就认真回答，不许耍赖哦'));
    refreshMode();
    return wrap;
  }

  /* ========== 5. 默契问答 ========== */
  var SYNC_QS = [
    { q: '周末更想怎么过？', a: '宅家发呆', b: '出门走走' },
    { q: '吃火锅先下什么？', a: '肉', b: '菜' },
    { q: '有点小矛盾时谁先低头？', a: '我先', b: 'TA 先' },
    { q: '更喜欢哪种约会？', a: '看电影', b: '逛公园' },
    { q: '收到礼物更看重？', a: '实用性', b: '心意' },
    { q: '几点睡才算熬夜？', a: '11 点后', b: '1 点后' },
    { q: '旅行喜欢哪种节奏？', a: '慢慢逛', b: '打卡赶场' },
    { q: '心情不好时更想？', a: '被抱着', b: '一个人静静' }
  ];

  function viewSync() {
    var wrap = el('div', 'cg-center');
    var progress = el('div', 'cg-sub', '第 1 / ' + SYNC_QS.length + ' 题');
    var questionEl = el('div', 'cg-prompt', '');
    var optWrap = el('div');
    var resultEl = el('div', 'cg-result', '');
    var nextWrap = el('div', 'cg-actions');
    var index = 0;
    var score = 0;

    function render() {
      var item = SYNC_QS[index];
      progress.textContent = '第 ' + (index + 1) + ' / ' + SYNC_QS.length + ' 题';
      questionEl.textContent = item.q;
      resultEl.textContent = '';
      while (optWrap.firstChild) optWrap.removeChild(optWrap.firstChild);
      while (nextWrap.firstChild) nextWrap.removeChild(nextWrap.firstChild);

      ['a', 'b'].forEach(function (key) {
        var opt = el('button', 'cg-opt', item[key]);
        opt.type = 'button';
        opt.addEventListener('click', function () {
          answer(item, key);
        });
        optWrap.appendChild(opt);
      });
    }

    function answer(item, mineKey) {
      var theirKey = Math.random() < 0.7 ? mineKey : (mineKey === 'a' ? 'b' : 'a');
      var mine = item[mineKey];
      var theirs = item[theirKey];
      var same = mineKey === theirKey;
      if (same) score++;

      Array.prototype.forEach.call(optWrap.children, function (opt) {
        opt.disabled = true;
        opt.style.opacity = '0.55';
      });

      resultEl.textContent = same ? '默契 +1 💞' : '差一点点～';
      var msg = '💞 默契问答：' + item.q + ' 我选「' + theirs + '」，你选「' + mine + '」—— ' +
        (same ? '我们想到一块啦！' : '差一点点，下次一定！');
      bridge.partnerSay(msg);

      if (index < SYNC_QS.length - 1) {
        nextWrap.appendChild(makeBtn('下一题', true, function () {
          index++;
          render();
        }));
      } else {
        nextWrap.appendChild(makeBtn('看看结果', true, function () {
          var rate = Math.round((score / SYNC_QS.length) * 100);
          var text = '8 题里默契了 ' + score + ' 题，默契度 ' + rate + '%';
          questionEl.textContent = '默契度 ' + rate + '%';
          while (optWrap.firstChild) optWrap.removeChild(optWrap.firstChild);
          resultEl.textContent = text;
          while (nextWrap.firstChild) nextWrap.removeChild(nextWrap.firstChild);
          nextWrap.appendChild(makeBtn('再来一轮', false, function () {
            index = 0;
            score = 0;
            render();
          }));
          bridge.partnerSay('💞 我们这轮默契了 ' + score + '/' + SYNC_QS.length + ' 题，默契度 ' + rate + '%，' +
            (rate >= 70 ? '太合拍啦！' : '再多聊聊天就更有默契了～'));
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

  /* ========== 入口绑定 ========== */
  btn.addEventListener('click', open);

  // 方便调试 / 自动化验证
  window.ChatGames = { open: open, close: close, games: GAMES };
})();
