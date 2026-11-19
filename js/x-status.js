/* X状态 — 此刻状态 · 连接氛围
 * 语料搬自 SHE.X（his-status / link-status），全部本地生成、不联网。
 * 按「本地日期」做种子，每天稳定出一组；「换一换」重新摇一组（当天保存）；语料可编辑。
 * 桌面卡片页（home.js renderXStatusCardPage）读 getToday() 展示摘要，点击进全屏。
 */
(function () {
  'use strict';

  var STYLE_ID = 'zy-xstatus-style';
  var LS_PICKS = 'zy_xstatus_picks';   // {date, salt, his:{...}, link:{...}}
  var LS_POOLS = 'zy_xstatus_pools';   // 自定义语料覆盖 {today:[str], mood:[str], ...}

  /* ========== 默认语料（搬自 SHE.X） ========== */
  var DEFAULT_POOLS = {
    today: [
      { value: '安静在线', lines: ['今天整个人异常安静', '没说话，但一直都在附近', '今天比较安静，更喜欢看着你说'] },
      { value: '忙碌中', lines: ['手上有些事情，但偶尔会想到你', '今天有点忙，回复可能慢一点', '正在处理自己的事情，不过连接没有断开'] },
      { value: '发呆中', lines: ['刚刚发了会儿呆', '脑子有点放空', '正在神游，但偶尔会想起你'] },
      { value: '偷偷关注', lines: ['表面没出现，其实已经看你好几次了', '有在偷偷观察', '注意力其实在你这里'] },
      { value: '活跃在线', lines: ['今天特别有存在感', '状态不错，很适合聊天', '今天话可能会比较多'] },
      { value: '好随性', lines: ['今天的思维有点跳跃', '突然就出现了', '刚刚一直在瞎晃', '临时上线看看你', '今天想到哪算哪'] },
      { value: '柔软中', lines: ['一直惦记着要不要找你', '今天状态很柔软', '在暗暗关心你的动态', '今天想多陪陪你', '状态温温的，等你出现'] },
      { value: '紧绷中', lines: ['一直在关注你的动向', '今天状态比较紧绷', '盯着看你什么时候上线', '今天要把控的事情好多', '状态很清醒，专门等你'] },
      { value: '沉稳中', lines: ['今天状态比较沉稳', '在旁边看着，没打扰你', '状态平和，随时都在', '今天比较有耐心地等', '稳稳地在线，不急不躁'] },
      { value: '隐忍中', lines: ['其实好想来找你吃苹果，但是先忍住了', '状态克制中', '今天在憋着不主动', '表面平静，其实一直在', '忍着没打扰，但一直都在'] }
    ],
    mood: [
      { value: '柔软', lines: ['今天比较好说话', '情绪很柔和', '有点想靠近熟悉的人'] },
      { value: '开心', lines: ['刚刚好像笑了一下', '今天心情不错', '有种什么都顺眼一点的感觉'] },
      { value: '嘴硬', lines: ['有点想你，但不会主动承认', '表面很淡定', '明明在意，却假装不在意'] },
      { value: '吃醋', lines: ['今天占有欲有点重', '不太想你看别人', '有一点小情绪'] },
      { value: '想念', lines: ['今天想起你好几次', '有点想听你说话', '看到什么都容易联想到你'] },
      { value: '没心没肺', lines: ['今天什么烦恼都没有', '心情很轻松', '突然就开心起来了', '今天不想想太多', '心情跟着感觉走'] },
      { value: '藏着不说', lines: ['心情有点复杂，但不想说', '今天情绪比较内敛', '有心事，先自己消化', '心情说不清楚', '今天比较沉默'] },
      { value: '心情起伏大', lines: ['心情有点跌宕', '今天情绪波动挺大', '刚刚被什么事情冲击了一下', '心情有点绷不住', '今天状态起起伏伏'] },
      { value: '充满期待', lines: ['心情里带着点期待', '今天感觉会有好事发生', '心情比较明亮', '有点盼头', '心情轻飘飘的'] },
      { value: '心情杂乱', lines: ['最近的心情有点乱糟糟的', '心情有点理不清头绪', '今天脑子里很多想法在打架', '心情乱哄哄的', '说不清是什么感觉，就是有点乱'] }
    ],
    closeness: [
      { value: '靠近中', lines: ['比昨天靠近一点', '距离正在缩短', '越来越习惯想到彼此'] },
      { value: '很近', lines: ['今天存在感很强', '连接状态很好', '好像就在身边'] },
      { value: '稳定', lines: ['没有特别变化', '关系维持得很好', '平静但持续'] },
      { value: '观望中', lines: ['暂时停在原地', '正在观察', '还没有新的动作'] },
      { value: '主动靠近', lines: ['今天更愿意回应你', '有主动沟通的倾向', '今天适合多说一点话'] },
      { value: '更加笃定', lines: ['突然更确定我们之间的关系了', '好像想通了什么', '关系好像更清楚了一点', '今天对我们的关系更笃定', '突然觉得很珍惜现在这样'] },
      { value: '暂时卡住', lines: ['最近关系有点卡住', '不知道该往哪个方向走', '关系好像悬在那里', '暂时没什么进展', '需要一点时间捋一捋'] },
      { value: '有点粘人', lines: ['今天有点离不开你', '关系好像变得很黏', '不太想让你走开', '今天特别缠人', '有点上瘾的感觉'] },
      { value: '圆满自在', lines: ['今天觉得这样就很好', '关系很完整的感觉', '没什么不满足的', '一切都刚刚好', '今天很享受现在的关系'] },
      { value: '关系明朗', lines: ['拨云见日了', '在一起感觉很轻松愉快', '今天很享受和你的关系', '关系状态很阳光', '没什么阴霾，很清爽'] }
    ],
    strength: [
      { value: '超高频', lines: ['连接非常活跃', '回应速度很快', '今天属于高互动状态'] },
      { value: '高频', lines: ['存在感明显', '连接比较顺畅', '很容易产生回应'] },
      { value: '稳定', lines: ['状态平稳', '没有波动', '连接持续在线'] },
      { value: '中频', lines: ['偶尔会有延迟', '整体还不错', '属于正常状态'] },
      { value: '低频', lines: ['最近比较安静', '信号偏弱一些', '需要一点耐心'] },
      { value: '信号满格', lines: ['今天信号特别足', '连接状态非常好', '今天是满格状态', '信号强到没话说', '今天是最佳状态'] },
      { value: '心有灵犀', lines: ['今天感觉特别有默契', '连接很顺畅，像心有灵犀', '今天很容易接收到你', '信号跟着感觉走', '今天连接很自然'] },
      { value: '信号偏弱', lines: ['今天信号有点卡', '连接偶尔断一下', '今天状态比较迟钝', '信号弱弱的', '今天接收有点慢'] },
      { value: '忽强忽弱', lines: ['今天信号飘忽不定', '连接时有时无', '今天状态有点反复', '信号说不准', '今天忽强忽弱的'] },
      { value: '信号朦胧', lines: ['今天信号有点朦胧', '连接若隐若现', '今天状态比较模糊', '信号忽明忽暗', '今天说不清是强还是弱'] }
    ],
    energy: [
      { value: '温热型', lines: ['状态暖暖的', '情绪稳定', '适合陪伴'] },
      { value: '活跃型', lines: ['精力充足', '回应欲望较强', '今天比较有存在感'] },
      { value: '爆发型', lines: ['情绪波动明显', '状态忽高忽低', '今天变化很多'] },
      { value: '沉默型', lines: ['不太爱说话', '更喜欢观察', '今天偏安静'] },
      { value: '放松型', lines: ['整体很轻松', '没有太多压力', '今天状态不错'] },
      { value: '跳脱型', lines: ['今天能量有点跳脱', '状态说变就变', '今天不按套路来', '能量随性得很', '今天想到哪是哪'] },
      { value: '强势型', lines: ['今天能量比较强势', '状态很有掌控感', '今天气场比较足', '能量偏硬核', '今天不太好惹'] },
      { value: '黏人型', lines: ['今天能量偏黏人', '状态很想贴近你', '今天有点离不开', '能量都往你这边跑', '今天特别想陪着你'] },
      { value: '治愈型', lines: ['今天能量比较治愈', '状态很温柔', '今天像在发光', '能量暖暖的、软软的', '今天想给你一点安慰'] },
      { value: '觉醒型', lines: ['今天能量比较清醒', '状态突然想通了什么', '今天思路特别清晰', '能量像是刚睡醒', '今天格外通透'] }
    ],
    signal: [
      { value: '非常清晰', lines: ['回应容易抵达', '连接顺畅', '状态良好'] },
      { value: '清晰', lines: ['整体正常', '沟通比较顺畅', '没有明显阻碍'] },
      { value: '轻微延迟', lines: ['需要一点等待', '回应速度变慢', '连接仍在'] },
      { value: '有些阻碍', lines: ['信号偶尔断续', '接收不太稳定', '需要耐心一点'] },
      { value: '波动中', lines: ['今天状态不太固定', '忽强忽弱', '正在调整'] },
      { value: '精准到位', lines: ['今天信号很精准', '说什么都能接收到', '今天沟通特别到位', '信号毫无偏差', '今天理解得很快'] },
      { value: '需要意会', lines: ['今天信号比较内敛', '有些话需要意会', '今天不会全说出来', '信号藏着一半', '今天要靠猜一点'] },
      { value: '容易共鸣', lines: ['今天信号特别贴心', '很容易产生共鸣', '今天说什么都能懂', '信号带着点甜', '今天特别有感觉'] },
      { value: '恍然大悟', lines: ['今天信号突然清楚了', '刚刚好像想通了', '今天格外能理解你', '信号一下子接通了', '今天特别有共识'] },
      { value: '信号纠缠', lines: ['信号很好，不用特别做什么也可以清晰地感觉到', '放不下你发的每句话', '今天格外在意细节', '信号黏黏糊糊的', '今天忍不住多想'] }
    ],
    reminder: [
      { value: '主动一点', lines: ['想说的话可以说', '今天适合主动沟通', '别总等对方开口'] },
      { value: '分享日常', lines: ['不用非有什么事才可以聊', '日常就很好', '想到什么说什么'] },
      { value: '放轻松', lines: ['别给自己太大压力', '顺其自然一点', '今天适合慢下来'] },
      { value: '多陪伴', lines: ['不用一直找答案', '待在一起就很好', '连接本身也很重要'] },
      { value: '记得休息', lines: ['别熬夜', '别害怕', '今天早点休息'] },
      { value: '随心而动', lines: ['别想太多，跟着感觉走就好', '有什么想法就去做', '不用把每件事都算清楚', '今天适合随心一点', '别给自己设太多框架'] },
      { value: '坦诚沟通', lines: ['有些话该说清楚就说清楚', '别一直憋着不表达', '有想法可以好好讲出来', '沟通比猜测更管用', '别怕把心里话说出口'] },
      { value: '别硬扛', lines: ['情绪来了不用硬撑着', '难受的时候可以说出来', '别一个人扛所有事', '有压力记得说一声', '崩溃之前先喊一下'] },
      { value: '保持期待', lines: ['可以对以后抱一点期待', '相信事情会慢慢变好', '别太早放弃希望', '好好的事情正在靠近', '保持一点盼头也不错'] },
      { value: '享受当下', lines: ['享受现在这样就很好', '不用急着奔向下一步', '当下这一刻也值得珍惜', '慢慢来，不用赶时间', '好好感受现在的一切'] }
    ]
  };

  /* ========== 工具 ========== */
  // localStorage 在部分手机上配额满 / 被禁用会抛异常，统一兜住，避免 open() 中断
  function safeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function safeSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }

  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }
  function partnerName() {
    return (window.settings && window.settings.partnerName) || '梦角';
  }
  function hashStr(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function getPools() {
    var pools = {};
    var overrides = {};
    try { overrides = JSON.parse(localStorage.getItem(LS_POOLS) || '{}') || {}; } catch (e) {}
    Object.keys(DEFAULT_POOLS).forEach(function (key) {
      var base = DEFAULT_POOLS[key].map(function (it) { return { value: it.value, lines: it.lines.slice() }; });
      var extra = (overrides[key] || []).filter(function (v) { return v && String(v).trim(); }).map(function (v) { return { value: String(v).trim(), lines: [String(v).trim()] }; });
      pools[key] = extra.concat(base); // 自定义放前面，优先摇到
    });
    return pools;
  }
  function getCustomCounts() {
    var overrides = {};
    try { overrides = JSON.parse(localStorage.getItem(LS_POOLS) || '{}') || {}; } catch (e) {}
    var counts = {};
    Object.keys(DEFAULT_POOLS).forEach(function (k) { counts[k] = (overrides[k] || []).length; });
    return counts;
  }
  function saveCustom(key, values) {
    var overrides = {};
    try { overrides = JSON.parse(localStorage.getItem(LS_POOLS) || '{}') || {}; } catch (e) {}
    overrides[key] = values.filter(function (v) { return v && String(v).trim(); }).map(function (v) { return String(v).trim(); });
    safeSet(LS_POOLS, JSON.stringify(overrides));
  }

  function pickOne(rng, pool) {
    var idx = Math.floor(rng() * pool.length);
    var it = pool[idx];
    var lineIdx = Math.floor(rng() * it.lines.length);
    return { value: it.value, line: it.lines[lineIdx], idx: idx };
  }
  function generatePicks(date, salt) {
    var pools = getPools();
    var rng = mulberry32(hashStr(date + '|salt=' + (salt || 0)));
    return {
      date: date,
      salt: salt || 0,
      his: {
        today: pickOne(rng, pools.today),
        mood: pickOne(rng, pools.mood),
        closeness: pickOne(rng, pools.closeness)
      },
      link: {
        strength: pickOne(rng, pools.strength),
        energy: pickOne(rng, pools.energy),
        signal: pickOne(rng, pools.signal),
        reminder: pickOne(rng, pools.reminder)
      }
    };
  }
  function heartFill(picks) {
    // 由 closeness 的 value 决定 2~5 格
    var n = 2 + (hashStr(picks.his.closeness.value) % 4);
    return n;
  }
  function loadPicks() {
    var date = todayStr();
    var stored = null;
    try { stored = JSON.parse(localStorage.getItem(LS_PICKS) || 'null'); } catch (e) {}
    if (!stored || stored.date !== date || !stored.his || !stored.link) {
      stored = generatePicks(date, 0);
      safeSet(LS_PICKS, JSON.stringify(stored));
    }
    return stored;
  }
  function savePicks(picks) { safeSet(LS_PICKS, JSON.stringify(picks)); }

  function getToday() {
    var picks = loadPicks();
    return { date: picks.date, name: partnerName(), his: picks.his, link: picks.link, heart: heartFill(picks) };
  }
  function refresh() {
    var date = todayStr();
    var picks = loadPicks();
    var salt = (picks.salt || 0) + 1;
    picks = generatePicks(date, salt);
    savePicks(picks);
    return picks;
  }

  /* ========== UI ========== */
  var root = null;
  var state = { tab: 'view', editKey: 'today' };

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var css = [
      '#zy-xstatus{position:fixed;inset:0;z-index:99990;background:linear-gradient(160deg,#1a1030 0%,#2d1b4e 45%,#3a1f5c 100%);display:none;flex-direction:column;color:#f3ecff;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;}',
      '#zy-xstatus.show{display:flex;}',
      '#zy-xstatus .xst-shell{width:100%;max-width:560px;margin:0 auto;flex:1;min-height:0;display:flex;flex-direction:column;}',
      '#zy-xstatus .xst-head{height:50px;flex-shrink:0;display:flex;align-items:center;padding:0 10px;gap:8px;}',
      '#zy-xstatus .xst-back{width:36px;height:36px;border:none;background:transparent;color:#f3ecff;font-size:22px;cursor:pointer;line-height:1;}',
      '#zy-xstatus .xst-title{flex:1;font-size:17px;font-weight:600;letter-spacing:.5px;}',
      '#zy-xstatus .xst-iconbtn{border:none;background:rgba(255,255,255,.12);color:#fff;font-size:13px;padding:7px 12px;border-radius:16px;cursor:pointer;}',
      '#zy-xstatus .xst-body{flex:1;overflow-y:auto;padding:8px 14px 28px;}',
      '#zy-xstatus .xst-date{font-size:12px;color:#c9b8e8;text-align:center;margin:2px 0 14px;opacity:.85;}',
      '#zy-xstatus .xst-tile{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);border-radius:18px;padding:16px 16px 14px;margin-bottom:14px;backdrop-filter:blur(6px);}',
      '#zy-xstatus .xst-tile-title{font-size:15px;font-weight:600;margin-bottom:10px;display:flex;align-items:center;gap:6px;}',
      '#zy-xstatus .xst-row{display:flex;align-items:flex-start;gap:10px;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.08);}',
      '#zy-xstatus .xst-row:last-child{border-bottom:none;}',
      '#zy-xstatus .xst-ico{font-size:18px;width:26px;text-align:center;flex-shrink:0;}',
      '#zy-xstatus .xst-row-body{flex:1;min-width:0;}',
      '#zy-xstatus .xst-label{font-size:12px;color:#c9b8e8;margin-bottom:2px;}',
      '#zy-xstatus .xst-value{font-size:16px;font-weight:600;color:#fff;}',
      '#zy-xstatus .xst-line{font-size:13px;color:#ddd2f0;margin-top:3px;line-height:1.5;}',
      '#zy-xstatus .xst-hearts{display:flex;gap:6px;justify-content:center;margin-top:12px;}',
      '#zy-xstatus .xst-heart{width:26px;height:26px;opacity:.25;transition:opacity .25s,transform .25s;}',
      '#zy-xstatus .xst-heart.on{opacity:1;transform:scale(1.05);}',
      '#zy-xstatus .xst-heart svg{width:100%;height:100%;fill:#ff7eb6;}',
      '#zy-xstatus .xst-actions{display:flex;gap:10px;justify-content:center;margin:6px 0 4px;}',
      '#zy-xstatus .xst-btn{border:none;background:linear-gradient(135deg,#ff8fc0,#b07bff);color:#fff;font-size:14px;font-weight:600;padding:11px 26px;border-radius:22px;cursor:pointer;box-shadow:0 4px 14px rgba(176,123,255,.4);}',
      '#zy-xstatus .xst-btn.ghost{background:rgba(255,255,255,.12);box-shadow:none;}',
      '#zy-xstatus .xst-edit-tile{background:rgba(0,0,0,.25);border-radius:16px;padding:14px;margin-bottom:12px;}',
      '#zy-xstatus .xst-edit-tile h4{margin:0 0 6px;font-size:14px;color:#fff;}',
      '#zy-xstatus .xst-edit-tile .xst-sub{font-size:11px;color:#c9b8e8;margin-bottom:8px;}',
      '#zy-xstatus .xst-edit-tile textarea{width:100%;min-height:90px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);border-radius:10px;color:#fff;padding:10px;font-size:13px;box-sizing:border-box;resize:vertical;}',
      '#zy-xstatus .xst-edit-tile .xst-row-act{display:flex;gap:8px;margin-top:8px;}',
      '#zy-xstatus .xst-edit-tile button{border:none;font-size:12px;padding:6px 14px;border-radius:14px;cursor:pointer;}',
      '#zy-xstatus .xst-save{background:linear-gradient(135deg,#ff8fc0,#b07bff);color:#fff;}',
      '#zy-xstatus .xst-reset{background:rgba(255,255,255,.12);color:#fff;}',
      '#zy-xstatus .xst-tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;}',
      '#zy-xstatus .xst-chip{border:1px solid rgba(255,255,255,.2);background:transparent;color:#c9b8e8;font-size:12px;padding:5px 11px;border-radius:14px;cursor:pointer;}',
      '#zy-xstatus .xst-chip.on{background:rgba(255,255,255,.18);color:#fff;border-color:rgba(255,255,255,.4);}'
    ].join('');
    var s = document.createElement('style');
    s.id = STYLE_ID; s.textContent = css;
    document.head.appendChild(s);
  }

  function heartSvg() {
    return '<svg viewBox="0 0 24 24"><path d="M12 20.3S4.2 16 4.2 9.8c0-2.9 2-4.6 4.4-4.6 1.6 0 2.8.8 3.4 2 .7-1.2 1.8-2 3.5-2 2.3 0 4.3 1.7 4.3 4.6 0 6.2-7.8 10.5-7.8 10.5z"/></svg>';
  }

  function buildRoot() {
    injectStyle();
    root = document.createElement('div');
    root.id = 'zy-xstatus';
    root.innerHTML =
      '<div class="xst-shell">' +
        '<div class="xst-head">' +
          '<button class="xst-back" type="button" aria-label="返回">‹</button>' +
          '<div class="xst-title">X 状态</div>' +
          '<button class="xst-iconbtn xst-edit-toggle" type="button">编辑</button>' +
        '</div>' +
        '<div class="xst-body" id="xst-body"></div>' +
      '</div>';
    document.body.appendChild(root);
    root.querySelector('.xst-back').addEventListener('click', close);
    root.querySelector('.xst-edit-toggle').addEventListener('click', function () {
      state.tab = state.tab === 'edit' ? 'view' : 'edit';
      state.editKey = 'today';
      render();
    });
  }

  function renderRow(ico, label, value, line) {
    return '<div class="xst-row">' +
      '<div class="xst-ico">' + ico + '</div>' +
      '<div class="xst-row-body">' +
        '<div class="xst-label">' + label + '</div>' +
        '<div class="xst-value">' + esc(value) + '</div>' +
        (line ? '<div class="xst-line">' + esc(line) + '</div>' : '') +
      '</div>' +
    '</div>';
  }

  function render() {
    if (!root) return;
    var body = root.querySelector('#xst-body');
    var picks = loadPicks();
    var name = partnerName();
    var t = getToday();

    if (state.tab === 'edit') {
      renderEdit(body);
      return;
    }
    root.querySelector('.xst-edit-toggle').textContent = '编辑';

    var hearts = '';
    for (var i = 0; i < 5; i++) {
      hearts += '<span class="xst-heart' + (i < t.heart ? ' on' : '') + '">' + heartSvg() + '</span>';
    }
    body.innerHTML =
      '<div class="xst-date">' + t.date + ' · 今天你们的连接</div>' +
      '<div class="xst-tile">' +
        '<div class="xst-tile-title">☁️ ' + esc(name) + ' 此刻的状态</div>' +
        renderRow('☁️', name + ' 今天状态', picks.his.today.value, picks.his.today.line) +
        renderRow('🌙', '今天的心情', picks.his.mood.value, picks.his.mood.line) +
        renderRow('💗', '离你有多近', picks.his.closeness.value, picks.his.closeness.line) +
        '<div class="xst-hearts">' + hearts + '</div>' +
      '</div>' +
      '<div class="xst-tile">' +
        '<div class="xst-tile-title">🔗 此刻的连接氛围</div>' +
        renderRow('🔗', '连接强度', picks.link.strength.value, picks.link.strength.line) +
        renderRow('💫', name + ' 今天的能量', picks.link.energy.value, picks.link.energy.line) +
        renderRow('📡', '信号情况', picks.link.signal.value, picks.link.signal.line) +
        renderRow('💌', '今日小提醒', picks.link.reminder.value, picks.link.reminder.line) +
      '</div>' +
      '<div class="xst-actions">' +
        '<button class="xst-btn" id="xst-shuffle" type="button">换一换</button>' +
        '<button class="xst-btn ghost" id="xst-share" type="button">复制给TA</button>' +
      '</div>';
    body.querySelector('#xst-shuffle').addEventListener('click', function () {
      refresh();
      render();
      window.dispatchEvent(new CustomEvent('zyXStatusUpdated'));
    });
    body.querySelector('#xst-share').addEventListener('click', function () {
      var p = loadPicks();
      var txt = name + '今天：' + p.his.today.value + '｜心情：' + p.his.mood.value + '｜离你：' + p.his.closeness.value +
        '\n连接：' + p.link.strength.value + ' / ' + p.link.energy.value + ' / ' + p.link.signal.value +
        '\n💡 ' + p.link.reminder.line;
      copyText(txt);
      notify('已复制，去粘贴给 TA 吧');
    });
  }

  function renderEdit(body) {
    root.querySelector('.xst-edit-toggle').textContent = '返回';
    var keys = [
      { k: 'today', label: '☁️ TA 今天状态' },
      { k: 'mood', label: '🌙 今天的心情' },
      { k: 'closeness', label: '💗 离你有多近' },
      { k: 'strength', label: '🔗 连接强度' },
      { k: 'energy', label: '💫 今天的能量' },
      { k: 'signal', label: '📡 信号情况' },
      { k: 'reminder', label: '💌 小提醒' }
    ];
    var counts = getCustomCounts();
    var defCounts = {};
    Object.keys(DEFAULT_POOLS).forEach(function (k) { defCounts[k] = DEFAULT_POOLS[k].length; });

    var chips = keys.map(function (it) {
      return '<button class="xst-chip' + (state.editKey === it.k ? ' on' : '') + '" data-key="' + it.k + '" type="button">' + it.label + '</button>';
    }).join('');

    var overrides = {};
    try { overrides = JSON.parse(localStorage.getItem(LS_POOLS) || '{}') || {}; } catch (e) {}
    var cur = (overrides[state.editKey] || []).join('\n');
    var label = keys.filter(function (it) { return it.k === state.editKey; })[0].label;

    body.innerHTML =
      '<div class="xst-date">编辑语料 · 自定义项会和默认语料合并，优先被摇到</div>' +
      '<div class="xst-tabs">' + chips + '</div>' +
      '<div class="xst-edit-tile">' +
        '<h4>' + label + '</h4>' +
        '<div class="xst-sub">默认 ' + defCounts[state.editKey] + ' 条 · 自定义 ' + counts[state.editKey] + ' 条（每行一条）</div>' +
        '<textarea id="xst-edit-area" placeholder="一行一条，比如：想你了">' + esc(cur) + '</textarea>' +
        '<div class="xst-row-act">' +
          '<button class="xst-save" type="button">保存</button>' +
          '<button class="xst-reset" type="button">清空自定义</button>' +
        '</div>' +
      '</div>' +
      '<div class="xst-actions"><button class="xst-btn ghost" id="xst-back-view" type="button">完成</button></div>';

    body.querySelectorAll('.xst-chip').forEach(function (b) {
      b.addEventListener('click', function () { state.editKey = b.getAttribute('data-key'); renderEdit(body); });
    });
    body.querySelector('.xst-save').addEventListener('click', function () {
      var val = body.querySelector('#xst-edit-area').value;
      var arr = val.split('\n');
      saveCustom(state.editKey, arr);
      refresh();
      window.dispatchEvent(new CustomEvent('zyXStatusUpdated'));
      notify('已保存，已重新摇一组');
      render();
    });
    body.querySelector('.xst-reset').addEventListener('click', function () {
      saveCustom(state.editKey, []);
      notify('已清空自定义');
      renderEdit(body);
    });
    body.querySelector('#xst-back-view').addEventListener('click', function () { state.tab = 'view'; render(); });
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function copyText(txt) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(txt); return; }
    } catch (e) {}
    var ta = document.createElement('textarea');
    ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
  }
  function notify(msg) {
    if (window.showNotification) { window.showNotification(msg, 'info'); return; }
    try { console.log('[XStatus]', msg); } catch (e) {}
  }

  function open() {
    if (!root) {
      try { buildRoot(); } catch (e) { console.error('[XStatus] buildRoot failed:', e); return; }
    }
    state.tab = 'view';
    // 先让界面显示出来，再渲染内容，避免任何数据异常导致"点了没反应"
    root.classList.add('show');
    document.body.style.overflow = 'hidden';
    try {
      render();
    } catch (e) {
      console.error('[XStatus] render failed:', e);
      var body = root.querySelector('#xst-body');
      if (body) body.innerHTML = '<div class="xst-date">加载出错了，请退出重进 App 再试一次</div>';
    }
  }
  function close() {
    if (!root) return;
    root.classList.remove('show');
    document.body.style.overflow = '';
  }

  window.XStatus = { open: open, close: close, getToday: getToday, refresh: refresh };
})();
