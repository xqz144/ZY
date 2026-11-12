/* 微博 — 热搜榜 · 话题广场
 * 独立全屏应用：桌面「微博」图标 或 桌面「微博热搜」卡片进入。
 * 数据：微博正文/图片存 localforage（体积大），热搜榜存 localStorage（桌面卡片需同步读取）。
 * 内容全部本地生成，不联网；热搜榜支持自定义编辑。
 */
(function () {
  'use strict';

  var STYLE_ID = 'zy-weibo-style';
  var LB_POSTS = 'zy_weibo_posts';
  var LS_HOT = 'zy_weibo_hot';
  var LS_SEEDED = 'zy_weibo_seeded';

  /* ========== 默认热搜 ========== */
  var DEFAULT_HOT = [
    { title: '原来被爱是这样的感觉', tag: '沸', hot: 3456789 },
    { title: '情侣之间最舒服的相处模式', tag: '热', hot: 2134567 },
    { title: '分享欲是最高级的浪漫', tag: '沸', hot: 1876543 },
    { title: '异地恋的坚持有多难', tag: '新', hot: 1522890 },
    { title: '恋爱脑到底是不是贬义词', tag: '热', hot: 1345678 },
    { title: '原来真的有人会一直记得你', tag: '', hot: 1120340 },
    { title: '谈一场不内耗的恋爱', tag: '', hot: 987654 },
    { title: '今年冬天的第一杯奶茶', tag: '新', hot: 876543 },
    { title: '一个人也要好好吃饭', tag: '', hot: 765432 },
    { title: '晚安是每天都在说的情话', tag: '', hot: 654321 }
  ];

  /* ========== 模拟网友 ========== */
  var NETS = [
    { id: 'n1', name: '橘子汽水味的猫', color: '#ffb3c6' },
    { id: 'n2', name: '今天也想躺平', color: '#9fd8cb' },
    { id: 'n3', name: '凌晨三点的海', color: '#a3bffa' },
    { id: 'n4', name: '柠檬不加冰', color: '#ffe08a' },
    { id: 'n5', name: '晚风收藏家', color: '#d7b8f3' },
    { id: 'n6', name: '一只小猪蹄', color: '#ffc9a3' },
    { id: 'n7', name: '月亮邮差', color: '#b8e0ff' },
    { id: 'n8', name: '小熊软糖机', color: '#ffb0b0' }
  ];

  var NET_COMMENTS = [
    '哈哈哈哈太真实了', '磕到了磕到了', '祝久久呀', '这句话我要抄下来',
    '呜呜呜被甜到了', '路过，祝幸福', '这才是爱情该有的样子', '我也想有人这样对我',
    '每天来这儿吃点甜的', '收藏了，谢谢'
  ];

  /* ========== 预置微博 ========== */
  var SEED_POSTS = [
    { uid: 'n1', topic: 2, text: '下班路上看到一对老夫妻牵着手慢慢走，突然就想起你。原来分享欲真的是最高级的浪漫，看到什么第一反应都是「要告诉他」。', likes: 328, reposts: 46, comments: ['n3', 'n5'] },
    { uid: 'n3', topic: 0, text: '以前总觉得被爱要有理由，后来才懂，被爱是那种你什么都没做，对方也觉得你很好很好的感觉。', likes: 1204, reposts: 233, comments: ['n1', 'n7'] },
    { uid: 'partner', topic: 1, text: '最舒服的相处模式大概就是：各忙各的，但一抬头就知道对方在。不用刻意找话题，安静也不尴尬。', likes: 866, reposts: 78, comments: ['n2', 'n4'] },
    { uid: 'n5', topic: 3, text: '异地恋第三年，吵架的频率变低了，想念的频率变高了。坚持很难，但想到是你，就觉得还行。', likes: 542, reposts: 91, comments: ['n6'] },
    { uid: 'n4', topic: 4, text: '「恋爱脑」这个词被用坏了。认真喜欢一个人本身没有错，错的是失去自己。爱可以很用力，但别把人生也一起押上。', likes: 2311, reposts: 502, comments: ['n1', 'n3', 'n8'] },
    { uid: 'n7', topic: 5, text: '随口说过的一句「想吃那家店的栗子蛋糕」，两周后她拎着蛋糕出现在我家门口。原来真的有人会一直记得你。', likes: 1789, reposts: 366, comments: ['n2'] },
    { uid: 'n6', topic: 6, text: '不内耗的恋爱是什么样？大概就是有话直说、不猜、不演、不比较。你不说我不问，最后谁都不开心。', likes: 973, reposts: 155, comments: ['n5', 'n4'] },
    { uid: 'me', topic: 9, text: '今天的晚安提前说了，因为想早点见到你。', likes: 233, reposts: 12, comments: ['partner', 'n8'] },
    { uid: 'n8', topic: 7, text: '今年冬天的第一杯奶茶是热的，捧在手里那一瞬间，整个人都被哄好了。', likes: 421, reposts: 33, comments: ['n6'] },
    { uid: 'n2', topic: 8, text: '一个人也要好好吃饭。今天给自己煮了番茄牛腩面，吃完觉得日子也没那么难过。', likes: 655, reposts: 87, comments: ['n7', 'n3'] }
  ];

  /* ========== 状态 ========== */
  var state = {
    tab: 'feed',        // feed | hot | topic | editor
    topic: '',
    prevTab: 'feed',
    posts: [],
    hot: [],
    loaded: false,
    editingPhotos: []
  };

  var root = null;
  var headTitleEl = null;
  var tabsEl = null;
  var listEl = null;
  var fabEl = null;
  var popEl = null;
  var popBodyEl = null;
  var popTitleEl = null;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); }

  function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

  function pick(arr) { return arr[rand(0, arr.length - 1)]; }

  function uid() { return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  /* ========== 热搜榜读写 ========== */
  function getHot() {
    if (state.hot && state.hot.length) return state.hot;
    var arr = null;
    try {
      var raw = localStorage.getItem(LS_HOT);
      if (raw) arr = JSON.parse(raw);
    } catch (e) { arr = null; }
    if (!Array.isArray(arr) || !arr.length) arr = DEFAULT_HOT.slice();
    state.hot = arr.map(function (it, i) {
      return {
        title: String(it && it.title != null ? it.title : DEFAULT_HOT[i] ? DEFAULT_HOT[i].title : ''),
        tag: it && it.tag ? String(it.tag) : '',
        hot: Number(it && it.hot) || (DEFAULT_HOT[i] ? DEFAULT_HOT[i].hot : 100000)
      };
    }).filter(function (it) { return it.title; });
    return state.hot;
  }

  function saveHot() {
    try {
      localStorage.setItem(LS_HOT, JSON.stringify(state.hot));
    } catch (e) {}
    try { window.dispatchEvent(new CustomEvent('zyWeiboHotUpdated')); } catch (e) {}
  }

  /* ========== 微博数据读写 ========== */
  function readProfile(who) {
    var def = { name: who === 'me' ? '我' : '梦角', avatar: '' };
    try {
      var raw = localStorage.getItem('profile_' + who);
      if (raw) {
        var p = JSON.parse(raw);
        return { name: p.name || def.name, avatar: p.avatar || '' };
      }
    } catch (e) {}
    return def;
  }

  function ensureSeed() {
    var seeded = false;
    try { seeded = localStorage.getItem(LS_SEEDED) === '1'; } catch (e) {}
    var now = Date.now();
    var topicTitles = getHot().map(function (h) { return h.title; });
    state.posts = SEED_POSTS.map(function (s, i) {
      var comments = (s.comments || []).map(function (cid, j) {
        return {
          uid: cid,
          text: NET_COMMENTS[(i * 3 + j) % NET_COMMENTS.length],
          ts: now - (i + 1) * 3600000 - j * 600000
        };
      });
      return {
        id: 'seed' + i,
        uid: s.uid,
        text: s.text,
        imgs: [],
        topic: topicTitles[s.topic] || '',
        ts: now - (i + 1) * 5400000 - rand(0, 900000),
        likes: s.likes || 0,
        liked: false,
        reposts: s.reposts || 0,
        reposted: false,
        comments: comments
      };
    }).sort(function (a, b) { return b.ts - a.ts; });
    try { localStorage.setItem(LS_SEEDED, '1'); } catch (e) {}
    savePosts();
  }

  function loadPosts() {
    if (state.loaded) return Promise.resolve(state.posts);
    if (typeof localforage === 'undefined') {
      state.loaded = true;
      ensureSeed();
      return Promise.resolve(state.posts);
    }
    return localforage.getItem(LB_POSTS).then(function (arr) {
      if (Array.isArray(arr) && arr.length) {
        state.posts = arr;
        state.loaded = true;
      } else {
        state.loaded = true;
        ensureSeed();
      }
      return state.posts;
    }).catch(function () {
      state.loaded = true;
      ensureSeed();
      return state.posts;
    });
  }

  function savePosts() {
    if (typeof localforage === 'undefined') return;
    localforage.setItem(LB_POSTS, state.posts).catch(function () {});
  }

  /* ========== 展示工具 ========== */
  function timeText(ts) {
    var now = Date.now();
    var d = now - ts;
    if (d < 60000) return '刚刚';
    if (d < 3600000) return Math.floor(d / 60000) + '分钟前';
    if (d < 86400000) return Math.floor(d / 3600000) + '小时前';
    var dt = new Date(ts);
    var today = new Date();
    var yest = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
    var hh = String(dt.getHours()).padStart(2, '0');
    var mm = String(dt.getMinutes()).padStart(2, '0');
    if (dt >= yest && dt < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
      return '昨天 ' + hh + ':' + mm;
    }
    return (dt.getMonth() + 1) + '月' + dt.getDate() + '日';
  }

  function hotText(n) {
    if (n >= 100000000) return (n / 100000000).toFixed(1) + '亿';
    if (n >= 10000) return Math.round(n / 10000) + '万';
    return String(n);
  }

  function userOf(uidv) {
    if (uidv === 'me') {
      var m = readProfile('me');
      return { id: 'me', name: m.name, color: '#ff8200', avatar: m.avatar };
    }
    if (uidv === 'partner') {
      var p = readProfile('partner');
      return { id: 'partner', name: p.name, color: '#eb7350', avatar: p.avatar };
    }
    for (var i = 0; i < NETS.length; i++) {
      if (NETS[i].id === uidv) return NETS[i];
    }
    return { id: uidv, name: '网友', color: '#c9c9c9' };
  }

  function avatarEl(uidv, size) {
    var u = userOf(uidv);
    var box = el('div', 'wb-ava');
    box.style.width = size + 'px';
    box.style.height = size + 'px';
    if (u.avatar && /^https?:|^data:/.test(u.avatar)) {
      var img = el('img', 'wb-ava-img');
      img.src = u.avatar;
      img.alt = u.name;
      box.appendChild(img);
    } else {
      box.style.background = 'linear-gradient(135deg,' + u.color + ',' + shade(u.color) + ')';
      box.style.fontSize = Math.round(size * 0.42) + 'px';
      box.textContent = (u.name || '网').slice(0, 1);
    }
    return box;
  }

  function shade(hex) {
    try {
      var c = hex.replace('#', '');
      var r = parseInt(c.slice(0, 2), 16), g = parseInt(c.slice(2, 4), 16), b = parseInt(c.slice(4, 6), 16);
      r = Math.max(0, Math.round(r * 0.82));
      g = Math.max(0, Math.round(g * 0.82));
      b = Math.max(0, Math.round(b * 0.82));
      return 'rgb(' + r + ',' + g + ',' + b + ')';
    } catch (e) { return hex; }
  }

  function icon(name) {
    var paths = {
      repost: 'M17 2l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3',
      comment: 'M21 11.5a8.4 8.4 0 0 1-8.5 8.5 8.6 8.6 0 0 1-3.9-.9L3 21l1.9-5.6A8.5 8.5 0 1 1 21 11.5z',
      like: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 1 0-7.8 7.8L12 21.2l8.8-8.8a5.5 5.5 0 0 0 0-7.8z'
    };
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', name === 'like' ? 'none' : 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.7');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', paths[name]);
    svg.appendChild(p);
    return svg;
  }

  /* ========== 样式 ========== */
  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var css = [
      '#zy-weibo{position:fixed;inset:0;z-index:99990;background:#f4f4f4;display:none;flex-direction:column;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;color:#333;}',
      '#zy-weibo.show{display:flex;}',
      '#zy-weibo .wb-shell{width:100%;max-width:560px;margin:0 auto;display:flex;flex-direction:column;flex:1;min-height:0;background:#f4f4f4;}',
      '#zy-weibo .wb-head{height:46px;flex-shrink:0;background:#fff;display:flex;align-items:center;padding:0 6px 0 4px;border-bottom:1px solid #ededed;position:relative;}',
      '#zy-weibo .wb-head-btn{width:40px;height:40px;border:none;background:none;font-size:22px;line-height:1;color:#333;display:flex;align-items:center;justify-content:center;cursor:pointer;}',
      '#zy-weibo .wb-head-btn:active{opacity:.5;}',
      '#zy-weibo .wb-head-title{flex:1;text-align:center;font-size:17px;font-weight:700;letter-spacing:.5px;}',
      '#zy-weibo .wb-tabs{display:flex;background:#fff;border-bottom:1px solid #ededed;flex-shrink:0;}',
      '#zy-weibo .wb-tab{flex:1;text-align:center;padding:11px 0 9px;font-size:14.5px;color:#828282;position:relative;cursor:pointer;}',
      '#zy-weibo .wb-tab.on{color:#333;font-weight:700;}',
      '#zy-weibo .wb-tab.on::after{content:"";position:absolute;left:50%;transform:translateX(-50%);bottom:0;width:26px;height:3px;border-radius:2px;background:#ff8200;}',
      '#zy-weibo .wb-list{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding-bottom:74px;}',
      '#zy-weibo .wb-post{background:#fff;padding:12px 14px 6px;margin-bottom:8px;}',
      '#zy-weibo .wb-post-top{display:flex;align-items:center;gap:9px;}',
      '#zy-weibo .wb-ava{flex-shrink:0;border-radius:50%;color:#fff;display:flex;align-items:center;justify-content:center;overflow:hidden;font-weight:600;}',
      '#zy-weibo .wb-ava-img{width:100%;height:100%;object-fit:cover;display:block;}',
      '#zy-weibo .wb-post-who{flex:1;min-width:0;}',
      '#zy-weibo .wb-name{font-size:14px;font-weight:600;color:#333;display:flex;align-items:center;gap:4px;}',
      '#zy-weibo .wb-verified{font-size:10px;color:#ff8200;border:1px solid rgba(255,130,0,.45);border-radius:8px;padding:0 3px;line-height:13px;transform:scale(.9);}',
      '#zy-weibo .wb-time{font-size:11.5px;color:#939393;margin-top:2px;}',
      '#zy-weibo .wb-text{font-size:14.5px;line-height:1.62;margin:9px 0 0;word-break:break-word;white-space:pre-wrap;}',
      '#zy-weibo .wb-topic-link{color:#eb7350;}',
      '#zy-weibo .wb-imgs{display:grid;gap:4px;margin-top:9px;}',
      '#zy-weibo .wb-imgs.n1{grid-template-columns:1fr;}',
      '#zy-weibo .wb-imgs.n2{grid-template-columns:1fr 1fr;}',
      '#zy-weibo .wb-imgs.n3{grid-template-columns:1fr 1fr 1fr;}',
      '#zy-weibo .wb-imgs img{width:100%;height:100%;object-fit:cover;border-radius:4px;display:block;aspect-ratio:1/1;}',
      '#zy-weibo .wb-imgs.n1 img{aspect-ratio:4/3;}',
      '#zy-weibo .wb-topic-tag{display:inline-block;margin-top:8px;font-size:12.5px;color:#eb7350;background:rgba(255,130,0,.08);border-radius:4px;padding:2px 7px;}',
      '#zy-weibo .wb-acts{display:flex;align-items:center;margin-top:10px;border-top:1px solid #f5f5f5;padding-top:2px;}',
      '#zy-weibo .wb-act{flex:1;display:flex;align-items:center;justify-content:center;gap:5px;padding:9px 0;font-size:12.5px;color:#828282;cursor:pointer;background:none;border:none;}',
      '#zy-weibo .wb-act svg{width:16px;height:16px;}',
      '#zy-weibo .wb-act.on{color:#ff8200;}',
      '#zy-weibo .wb-act.on svg{fill:currentColor;stroke:currentColor;}',
      '#zy-weibo .wb-act:active{opacity:.55;}',
      '#zy-weibo .wb-hot-row{display:flex;align-items:center;gap:10px;background:#fff;padding:13px 14px;border-bottom:1px solid #f4f4f4;cursor:pointer;}',
      '#zy-weibo .wb-hot-row:active{background:#fafafa;}',
      '#zy-weibo .wb-rank{width:19px;text-align:center;font-size:15px;font-weight:700;color:#b0b0b0;flex-shrink:0;}',
      '#zy-weibo .wb-rank.r1{color:#ff3b30;}',
      '#zy-weibo .wb-rank.r2{color:#ff7a00;}',
      '#zy-weibo .wb-rank.r3{color:#ffb300;}',
      '#zy-weibo .wb-hot-main{flex:1;min-width:0;}',
      '#zy-weibo .wb-hot-title{font-size:14.5px;color:#222;line-height:1.4;overflow:hidden;text-overflow:ellipsis;}',
      '#zy-weibo .wb-hot-meta{font-size:11.5px;color:#a5a5a5;margin-top:3px;}',
      '#zy-weibo .wb-badge{font-size:11px;color:#fff;border-radius:3px;padding:1px 4px;margin-left:5px;vertical-align:1px;font-weight:600;}',
      '#zy-weibo .wb-badge.fei{background:#ff3b30;}',
      '#zy-weibo .wb-badge.re{background:#ff8a00;}',
      '#zy-weibo .wb-badge.xin{background:#ff5f9e;}',
      '#zy-weibo .wb-board-head{display:flex;align-items:center;justify-content:space-between;padding:12px 14px 8px;background:#fff;}',
      '#zy-weibo .wb-board-title{font-size:15px;font-weight:700;}',
      '#zy-weibo .wb-link{font-size:12.5px;color:#ff8200;background:none;border:none;cursor:pointer;padding:4px;}',
      '#zy-weibo .wb-fab{position:absolute;right:18px;bottom:26px;width:52px;height:52px;border-radius:50%;border:none;background:linear-gradient(135deg,#ffa042,#ff8200);color:#fff;font-size:26px;line-height:1;box-shadow:0 6px 18px rgba(255,130,0,.35);cursor:pointer;z-index:3;}',
      '#zy-weibo .wb-fab:active{transform:scale(.94);}',
      '#zy-weibo .wb-empty{text-align:center;color:#aaa;font-size:13px;padding:46px 20px;}',
      '#zy-weibo .wb-topic-hero{background:#fff;padding:16px 14px 12px;margin-bottom:8px;}',
      '#zy-weibo .wb-topic-hero h2{font-size:18px;margin:0 0 7px;color:#222;}',
      '#zy-weibo .wb-topic-hero p{font-size:12.5px;color:#939393;margin:0;line-height:1.6;}',
      '#zy-weibo .wb-topic-hero .wb-join{margin-top:10px;width:100%;padding:9px 0;border-radius:20px;border:1px solid #ff8200;background:#fff;color:#ff8200;font-size:13.5px;font-weight:600;cursor:pointer;}',
      '#zy-weibo .wb-edit-row{background:#fff;padding:10px 12px;border-bottom:1px solid #f2f2f2;display:flex;gap:8px;align-items:center;}',
      '#zy-weibo .wb-inp{flex:1;min-width:0;border:1px solid #e4e4e4;border-radius:8px;padding:8px 10px;font-size:13.5px;color:#333;background:#fafafa;outline:none;font-family:inherit;}',
      '#zy-weibo .wb-inp:focus{border-color:#ff8200;background:#fff;}',
      '#zy-weibo .wb-inp.num{width:88px;flex:0 0 88px;}',
      '#zy-weibo .wb-mini{border:none;background:none;color:#ff5050;font-size:12.5px;cursor:pointer;padding:4px 2px;flex-shrink:0;}',
      '#zy-weibo .wb-tag-sel{border:1px solid #e4e4e4;border-radius:8px;background:#fafafa;font-size:12.5px;padding:8px 6px;color:#555;flex-shrink:0;}',
      '#zy-weibo .wb-pop{position:absolute;inset:0;z-index:5;display:none;flex-direction:column;justify-content:flex-end;background:rgba(0,0,0,.35);}',
      '#zy-weibo .wb-pop.show{display:flex;}',
      '#zy-weibo .wb-pop-inner{background:#fff;border-radius:18px 18px 0 0;max-height:86%;display:flex;flex-direction:column;overflow:hidden;animation:wbUp .2s ease;}',
      '@keyframes wbUp{from{transform:translateY(30px);opacity:.6}to{transform:translateY(0);opacity:1}}',
      '#zy-weibo .wb-pop-head{display:flex;align-items:center;padding:13px 14px;border-bottom:1px solid #f2f2f2;}',
      '#zy-weibo .wb-pop-title{flex:1;font-size:15px;font-weight:700;}',
      '#zy-weibo .wb-pop-x{width:30px;height:30px;border:none;background:#f4f4f4;border-radius:50%;font-size:15px;color:#777;cursor:pointer;}',
      '#zy-weibo .wb-pop-body{padding:12px 14px 22px;overflow-y:auto;}',
      '#zy-weibo .wb-ta{width:100%;box-sizing:border-box;min-height:110px;border:none;outline:none;font-size:15px;line-height:1.65;color:#333;font-family:inherit;resize:none;background:#fff;}',
      '#zy-weibo .wb-chips{display:flex;flex-wrap:wrap;gap:7px;margin:8px 0 12px;}',
      '#zy-weibo .wb-chip{font-size:12.5px;padding:5px 10px;border-radius:14px;background:#f5f5f5;color:#666;border:1px solid transparent;cursor:pointer;}',
      '#zy-weibo .wb-chip.on{background:rgba(255,130,0,.1);color:#ff8200;border-color:rgba(255,130,0,.4);}',
      '#zy-weibo .wb-photos{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;}',
      '#zy-weibo .wb-photo{position:relative;aspect-ratio:1/1;border-radius:6px;overflow:hidden;background:#f4f4f4;}',
      '#zy-weibo .wb-photo img{width:100%;height:100%;object-fit:cover;display:block;}',
      '#zy-weibo .wb-photo .wb-del{position:absolute;top:3px;right:3px;width:19px;height:19px;border-radius:50%;border:none;background:rgba(0,0,0,.55);color:#fff;font-size:12px;line-height:1;cursor:pointer;}',
      '#zy-weibo .wb-add-photo{aspect-ratio:1/1;border:1px dashed #d8d8d8;border-radius:6px;background:#fafafa;color:#bbb;font-size:24px;display:flex;align-items:center;justify-content:center;cursor:pointer;}',
      '#zy-weibo .wb-pub{width:100%;margin-top:14px;padding:11px 0;border-radius:22px;border:none;background:linear-gradient(135deg,#ffa042,#ff8200);color:#fff;font-size:15px;font-weight:600;cursor:pointer;}',
      '#zy-weibo .wb-pub:disabled{opacity:.5;}',
      '#zy-weibo .wb-cmt{display:flex;gap:9px;padding:9px 0;border-bottom:1px solid #f6f6f6;}',
      '#zy-weibo .wb-cmt-main{flex:1;min-width:0;}',
      '#zy-weibo .wb-cmt-name{font-size:12.5px;color:#666;font-weight:600;}',
      '#zy-weibo .wb-cmt-text{font-size:14px;line-height:1.55;color:#333;margin-top:3px;word-break:break-word;}',
      '#zy-weibo .wb-cmt-time{font-size:11px;color:#b0b0b0;margin-top:3px;}',
      '#zy-weibo .wb-cmt-bar{display:flex;gap:8px;align-items:center;padding:10px 0 0;}',
      '#zy-weibo .wb-cmt-bar input{flex:1;border:1px solid #e6e6e6;border-radius:18px;padding:9px 14px;font-size:13.5px;outline:none;background:#fafafa;font-family:inherit;}',
      '#zy-weibo .wb-send{border:none;background:#ff8200;color:#fff;border-radius:18px;padding:9px 16px;font-size:13.5px;font-weight:600;cursor:pointer;}',
      '#zy-weibo .wb-toast{position:absolute;left:50%;bottom:96px;transform:translateX(-50%);background:rgba(0,0,0,.75);color:#fff;font-size:13px;padding:8px 16px;border-radius:16px;opacity:0;transition:opacity .25s;pointer-events:none;z-index:9;max-width:80%;text-align:center;}',
      '#zy-weibo .wb-toast.show{opacity:1;}'
    ].join('');
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);
  }

  /* ========== 骨架 ========== */
  function buildRoot() {
    injectStyle();
    root = el('div');
    root.id = 'zy-weibo';

    var shell = el('div', 'wb-shell');

    var head = el('div', 'wb-head');
    var back = el('button', 'wb-head-btn', '‹');
    back.type = 'button';
    back.setAttribute('aria-label', '返回');
    back.addEventListener('click', onBack);
    headTitleEl = el('div', 'wb-head-title', '微博');
    var searchBtn = el('button', 'wb-head-btn');
    searchBtn.type = 'button';
    searchBtn.setAttribute('aria-label', '热搜');
    searchBtn.textContent = '🔍';
    searchBtn.addEventListener('click', function () { switchTab('hot'); });
    head.appendChild(back);
    head.appendChild(headTitleEl);
    head.appendChild(searchBtn);

    tabsEl = el('div', 'wb-tabs');
    [['feed', '首页'], ['hot', '热搜']].forEach(function (t) {
      var tab = el('div', 'wb-tab' + (t[0] === 'feed' ? ' on' : ''), t[1]);
      tab.dataset.tab = t[0];
      tab.addEventListener('click', function () { switchTab(t[0]); });
      tabsEl.appendChild(tab);
    });

    listEl = el('div', 'wb-list');

    fabEl = el('button', 'wb-fab', '＋');
    fabEl.type = 'button';
    fabEl.setAttribute('aria-label', '发微博');
    fabEl.addEventListener('click', function () { openCompose(state.tab === 'topic' ? state.topic : ''); });

    var toast = el('div', 'wb-toast');

    popEl = el('div', 'wb-pop');
    var popInner = el('div', 'wb-pop-inner');
    var popHead = el('div', 'wb-pop-head');
    popTitleEl = el('div', 'wb-pop-title', '');
    var popX = el('button', 'wb-pop-x', '✕');
    popX.type = 'button';
    popX.addEventListener('click', closePop);
    popHead.appendChild(popTitleEl);
    popHead.appendChild(popX);
    popBodyEl = el('div', 'wb-pop-body');
    popInner.appendChild(popHead);
    popInner.appendChild(popBodyEl);
    popEl.appendChild(popInner);
    popEl.addEventListener('click', function (e) { if (e.target === popEl) closePop(); });

    shell.appendChild(head);
    shell.appendChild(tabsEl);
    shell.appendChild(listEl);
    shell.appendChild(fabEl);
    shell.appendChild(popEl);
    shell.appendChild(toast);
    root.appendChild(shell);
    document.body.appendChild(root);

    root._toast = toast;

    // 安卓返回键 / 浏览器返回：优先关闭弹层或应用
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && root.classList.contains('show')) {
        if (popEl.classList.contains('show')) closePop();
        else onBack();
      }
    });
  }

  var _toastTimer = null;
  function toast(msg) {
    if (!root || !root._toast) return;
    var t = root._toast;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(function () { t.classList.remove('show'); }, 1600);
  }

  /* ========== 弹层 ========== */
  function openPop(title, build) {
    popTitleEl.textContent = title;
    clear(popBodyEl);
    build(popBodyEl);
    popEl.classList.add('show');
  }

  function closePop() {
    popEl.classList.remove('show');
    clear(popBodyEl);
  }

  /* ========== 页面渲染 ========== */
  function render() {
    if (!root) return;
    if (state.tab === 'feed' || state.tab === 'hot') {
      tabsEl.style.display = '';
      var tabs = tabsEl.querySelectorAll('.wb-tab');
      for (var i = 0; i < tabs.length; i++) {
        tabs[i].classList.toggle('on', tabs[i].dataset.tab === state.tab);
      }
      headTitleEl.textContent = state.tab === 'hot' ? '微博热搜' : '微博';
      fabEl.style.display = state.tab === 'feed' ? '' : 'none';
    } else {
      tabsEl.style.display = 'none';
      fabEl.style.display = state.tab === 'topic' ? '' : 'none';
      if (state.tab === 'topic') headTitleEl.textContent = '话题';
      else if (state.tab === 'editor') headTitleEl.textContent = '编辑热搜';
    }

    clear(listEl);
    if (state.tab === 'feed') renderFeed();
    else if (state.tab === 'hot') renderHot();
    else if (state.tab === 'topic') renderTopic();
    else if (state.tab === 'editor') renderEditor();
  }

  function sortedPosts() {
    return state.posts.slice().sort(function (a, b) { return b.ts - a.ts; });
  }

  function renderFeed() {
    var posts = sortedPosts();
    if (!posts.length) {
      listEl.appendChild(el('div', 'wb-empty', '还没有微博，点右下角发第一条吧'));
      return;
    }
    posts.forEach(function (p) { listEl.appendChild(buildPostCard(p)); });
  }

  function buildPostCard(p) {
    var card = el('div', 'wb-post');
    var u = userOf(p.uid);

    var top = el('div', 'wb-post-top');
    top.appendChild(avatarEl(p.uid, 40));
    var who = el('div', 'wb-post-who');
    var nm = el('div', 'wb-name', u.name);
    if (p.uid === 'me' || p.uid === 'partner') {
      nm.appendChild(el('span', 'wb-verified', '互关'));
    } else if (p.likes > 800) {
      nm.appendChild(el('span', 'wb-verified', 'V'));
    }
    who.appendChild(nm);
    who.appendChild(el('div', 'wb-time', timeText(p.ts) + ' · 来自 iPhone 客户端'));
    top.appendChild(who);
    card.appendChild(top);

    var text = el('div', 'wb-text');
    var parts = String(p.text || '').split(/(#.*?#)/g);
    parts.forEach(function (seg) {
      if (!seg) return;
      if (/^#.*#$/.test(seg)) {
        var a = el('span', 'wb-topic-link', seg);
        text.appendChild(a);
      } else {
        text.appendChild(document.createTextNode(seg));
      }
    });
    card.appendChild(text);

    if (p.imgs && p.imgs.length) {
      var grid = el('div', 'wb-imgs n' + Math.min(3, p.imgs.length));
      p.imgs.slice(0, 9).forEach(function (src) {
        var img = el('img');
        img.src = src;
        img.alt = '图片';
        grid.appendChild(img);
      });
      card.appendChild(grid);
    }

    if (p.topic) {
      var tag = el('div', 'wb-topic-tag', '#' + p.topic + '#');
      tag.addEventListener('click', function () { openTopic(p.topic); });
      card.appendChild(tag);
    }

    var acts = el('div', 'wb-acts');

    var repostBtn = el('button', 'wb-act' + (p.reposted ? ' on' : ''));
    repostBtn.type = 'button';
    repostBtn.appendChild(icon('repost'));
    var repostTxt = el('span', null, p.reposts ? String(p.reposts) : '转发');
    repostBtn.appendChild(repostTxt);
    repostBtn.addEventListener('click', function () {
      p.reposted = !p.reposted;
      p.reposts = Math.max(0, (p.reposts || 0) + (p.reposted ? 1 : -1));
      repostBtn.classList.toggle('on', p.reposted);
      repostTxt.textContent = p.reposts ? String(p.reposts) : '转发';
      savePosts();
      toast(p.reposted ? '已转发' : '已取消转发');
    });

    var cmtBtn = el('button', 'wb-act');
    cmtBtn.type = 'button';
    cmtBtn.appendChild(icon('comment'));
    cmtBtn.appendChild(el('span', null, (p.comments && p.comments.length) ? String(p.comments.length) : '评论'));
    cmtBtn.addEventListener('click', function () { openComments(p); });

    var likeBtn = el('button', 'wb-act' + (p.liked ? ' on' : ''));
    likeBtn.type = 'button';
    likeBtn.appendChild(icon('like'));
    var likeTxt = el('span', null, p.likes ? String(p.likes) : '赞');
    likeBtn.appendChild(likeTxt);
    likeBtn.addEventListener('click', function () {
      p.liked = !p.liked;
      p.likes = Math.max(0, (p.likes || 0) + (p.liked ? 1 : -1));
      likeBtn.classList.toggle('on', p.liked);
      likeTxt.textContent = p.likes ? String(p.likes) : '赞';
      savePosts();
    });

    acts.appendChild(repostBtn);
    acts.appendChild(cmtBtn);
    acts.appendChild(likeBtn);
    card.appendChild(acts);
    return card;
  }

  function renderHot() {
    var hot = getHot();
    var head = el('div', 'wb-board-head');
    head.appendChild(el('div', 'wb-board-title', '实时热搜榜'));
    var edit = el('button', 'wb-link', '编辑');
    edit.type = 'button';
    edit.addEventListener('click', function () { state.prevTab = 'hot'; state.tab = 'editor'; render(); });
    head.appendChild(edit);
    listEl.appendChild(head);

    hot.forEach(function (h, i) {
      var row = el('div', 'wb-hot-row');
      var r = el('div', 'wb-rank' + (i < 3 ? ' r' + (i + 1) : ''), String(i + 1));
      row.appendChild(r);
      var main = el('div', 'wb-hot-main');
      var title = el('div', 'wb-hot-title', h.title);
      if (h.tag) {
        var cls = h.tag === '沸' ? 'fei' : (h.tag === '热' ? 're' : 'xin');
        title.appendChild(el('span', 'wb-badge ' + cls, h.tag));
      }
      main.appendChild(title);
      main.appendChild(el('div', 'wb-hot-meta', '热度 ' + hotText(h.hot)));
      row.appendChild(main);
      row.addEventListener('click', function () { openTopic(h.title); });
      listEl.appendChild(row);
    });
  }

  function openTopic(topic) {
    state.topic = topic;
    state.tab = 'topic';
    render();
    if (listEl) listEl.scrollTop = 0;
  }

  function renderTopic() {
    var topic = state.topic;
    var posts = sortedPosts().filter(function (p) { return p.topic === topic; });
    var h = getHot().filter(function (x) { return x.title === topic; })[0];

    var hero = el('div', 'wb-topic-hero');
    hero.appendChild(el('h2', null, '# ' + topic + ' #'));
    hero.appendChild(el('p', null, '阅读 ' + hotText((h ? h.hot : 500000) * 3) + ' · 讨论 ' + (posts.length * 37 + 128) + ' · 原创 ' + (posts.length * 9 + 24)));
    hero.appendChild(el('p', null, '这个热搜下的甜蜜与日常，都来自本地模拟的网友，也欢迎你参与。'));
    var join = el('button', 'wb-join', '参与话题');
    join.type = 'button';
    join.addEventListener('click', function () { openCompose(topic); });
    hero.appendChild(join);
    listEl.appendChild(hero);

    if (!posts.length) {
      listEl.appendChild(el('div', 'wb-empty', '这个话题还没有微博，来做第一个吧'));
      return;
    }
    posts.forEach(function (p) { listEl.appendChild(buildPostCard(p)); });
  }

  function renderEditor() {
    var tip = el('div', 'wb-edit-row');
    tip.style.background = '#fffaf2';
    tip.style.color = '#b4864a';
    tip.style.fontSize = '12px';
    tip.textContent = '修改后点「保存」，桌面热搜卡片会同步更新；「标签」可填 沸 / 热 / 新 或留空。';
    listEl.appendChild(tip);

    var hot = getHot();
    hot.forEach(function (h, i) {
      var row = el('div', 'wb-edit-row');

      var titleInp = el('input', 'wb-inp');
      titleInp.type = 'text';
      titleInp.value = h.title;
      titleInp.placeholder = '热搜标题';
      titleInp.addEventListener('input', function () { h.title = titleInp.value; });

      var numInp = el('input', 'wb-inp num');
      numInp.type = 'number';
      numInp.value = h.hot;
      numInp.min = '0';
      numInp.addEventListener('input', function () { h.hot = Number(numInp.value) || 0; });

      var sel = el('select', 'wb-tag-sel');
      ['', '沸', '热', '新'].forEach(function (t) {
        var o = el('option', null, t || '无');
        o.value = t;
        if (h.tag === t) o.selected = true;
        sel.appendChild(o);
      });
      sel.addEventListener('change', function () { h.tag = sel.value; });

      var del = el('button', 'wb-mini', '删除');
      del.type = 'button';
      del.addEventListener('click', function () {
        state.hot.splice(i, 1);
        saveHot();
        render();
      });

      row.appendChild(titleInp);
      row.appendChild(numInp);
      row.appendChild(sel);
      row.appendChild(del);
      listEl.appendChild(row);
    });

    var foot = el('div', 'wb-edit-row');
    foot.style.justifyContent = 'space-between';
    var add = el('button', 'wb-link', '＋ 新增一条');
    add.type = 'button';
    add.style.fontSize = '13px';
    add.addEventListener('click', function () {
      state.hot.push({ title: '新的热搜话题', tag: '', hot: 100000 });
      render();
    });
    var save = el('button', 'wb-pub');
    save.style.width = 'auto';
    save.style.margin = '0';
    save.style.padding = '8px 22px';
    save.style.fontSize = '13.5px';
    save.textContent = '保存';
    save.addEventListener('click', function () {
      state.hot = state.hot.filter(function (x) { return x.title && String(x.title).trim(); });
      if (!state.hot.length) state.hot = DEFAULT_HOT.slice();
      saveHot();
      toast('热搜已保存');
      state.tab = 'hot';
      render();
    });
    foot.appendChild(add);
    foot.appendChild(save);
    listEl.appendChild(foot);

    var reset = el('div', 'wb-edit-row');
    reset.style.borderBottom = 'none';
    var resetBtn = el('button', 'wb-link', '恢复默认热搜');
    resetBtn.type = 'button';
    resetBtn.style.color = '#999';
    resetBtn.addEventListener('click', function () {
      state.hot = DEFAULT_HOT.slice();
      saveHot();
      toast('已恢复默认');
      render();
    });
    reset.appendChild(resetBtn);
    listEl.appendChild(reset);
  }

  /* ========== 发微博 ========== */
  function openCompose(preTopic) {
    if (!state.loaded) {
      loadPosts().then(function () { openCompose(preTopic); });
      return;
    }
    state.editingPhotos = [];
    var topic = preTopic || '';

    openPop('发微博', function (body) {
      var ta = el('textarea', 'wb-ta');
      ta.placeholder = '这一刻的想法…';
      body.appendChild(ta);

      var chips = el('div', 'wb-chips');
      var chipList = [{ title: '' }].concat(getHot().slice(0, 6));
      chipList.forEach(function (h) {
        var c = el('div', 'wb-chip' + ((h.title || '') === topic ? ' on' : ''), h.title ? '#' + h.title + '#' : '不参与话题');
        c.addEventListener('click', function () {
          topic = h.title || '';
          var all = chips.querySelectorAll('.wb-chip');
          for (var i = 0; i < all.length; i++) all[i].classList.remove('on');
          c.classList.add('on');
        });
        chips.appendChild(c);
      });
      body.appendChild(chips);

      var photoWrap = el('div', 'wb-photos');
      var fileInput = el('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      fileInput.multiple = true;
      fileInput.style.display = 'none';

      function paintPhotos() {
        clear(photoWrap);
        state.editingPhotos.forEach(function (src, idx) {
          var cell = el('div', 'wb-photo');
          var img = el('img');
          img.src = src;
          img.alt = '图片';
          cell.appendChild(img);
          var del = el('button', 'wb-del', '✕');
          del.type = 'button';
          del.addEventListener('click', function () {
            state.editingPhotos.splice(idx, 1);
            paintPhotos();
          });
          cell.appendChild(del);
          photoWrap.appendChild(cell);
        });
        if (state.editingPhotos.length < 9) {
          var add = el('div', 'wb-add-photo', '＋');
          add.addEventListener('click', function () { fileInput.click(); });
          photoWrap.appendChild(add);
        }
      }

      fileInput.addEventListener('change', function () {
        var files = Array.prototype.slice.call(fileInput.files || []);
        if (!files.length) return;
        var room = 9 - state.editingPhotos.length;
        files = files.slice(0, Math.max(0, room));
        Promise.all(files.map(compressImage)).then(function (list) {
          list.forEach(function (d) { if (d) state.editingPhotos.push(d); });
          paintPhotos();
          fileInput.value = '';
        });
      });

      paintPhotos();
      body.appendChild(photoWrap);
      body.appendChild(fileInput);

      var pub = el('button', 'wb-pub', '发送');
      pub.type = 'button';
      pub.addEventListener('click', function () {
        var txt = (ta.value || '').trim();
        if (!txt && !state.editingPhotos.length) {
          toast('写点什么再发吧');
          return;
        }
        var post = {
          id: uid(),
          uid: 'me',
          text: txt,
          imgs: state.editingPhotos.slice(),
          topic: topic,
          ts: Date.now(),
          likes: rand(1, 9),
          liked: false,
          reposts: 0,
          reposted: false,
          comments: []
        };
        state.posts.unshift(post);
        savePosts();
        state.editingPhotos = [];
        closePop();
        if (state.tab === 'topic' && topic !== state.topic) { state.tab = 'topic'; state.topic = topic; }
        render();
        toast('发布成功');
        simulateNet(post);
      });
      body.appendChild(pub);
      setTimeout(function () { try { ta.focus(); } catch (e) {} }, 200);
    });
  }

  function compressImage(file) {
    return new Promise(function (resolve) {
      if (!file || !/^image\//.test(file.type)) { resolve(null); return; }
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        try {
          var w = img.naturalWidth || img.width;
          var h = img.naturalHeight || img.height;
          var max = 1000;
          if (w > max || h > max) {
            var r = Math.min(max / w, max / h);
            w = Math.round(w * r);
            h = Math.round(h * r);
          }
          var canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.72));
        } catch (e) {
          resolve(null);
        }
        URL.revokeObjectURL(url);
      };
      img.onerror = function () { URL.revokeObjectURL(url); resolve(null); };
      img.src = url;
    });
  }

  /* 模拟网友互动：一会儿会来点赞、评论 */
  function simulateNet(post) {
    var delay = rand(2500, 6000);
    setTimeout(function () {
      post.likes += rand(3, 26);
      post.reposts += rand(0, 3);
      savePosts();
      if (state.tab === 'feed' || state.tab === 'topic') render();
    }, delay);

    if (Math.random() < 0.75) {
      setTimeout(function () {
        var net = pick(NETS);
        post.comments.push({ uid: net.id, text: pick(NET_COMMENTS), ts: Date.now() });
        savePosts();
        if (state.tab === 'feed' || state.tab === 'topic') render();
        toast(net.name + ' 评论了你的微博');
      }, delay + rand(2000, 5000));
    }
  }

  /* ========== 评论 ========== */
  function openComments(post) {
    openPop('评论 ' + ((post.comments && post.comments.length) || 0), function (body) {
      var wrap = el('div');
      function paint() {
        clear(wrap);
        if (!post.comments.length) {
          wrap.appendChild(el('div', 'wb-empty', '还没有评论，来抢沙发'));
        }
        post.comments.forEach(function (c) {
          var row = el('div', 'wb-cmt');
          row.appendChild(avatarEl(c.uid, 32));
          var main = el('div', 'wb-cmt-main');
          main.appendChild(el('div', 'wb-cmt-name', userOf(c.uid).name));
          main.appendChild(el('div', 'wb-cmt-text', c.text));
          main.appendChild(el('div', 'wb-cmt-time', timeText(c.ts)));
          row.appendChild(main);
          wrap.appendChild(row);
        });
      }
      paint();
      body.appendChild(wrap);

      var bar = el('div', 'wb-cmt-bar');
      var inp = el('input');
      inp.type = 'text';
      inp.placeholder = '说点什么…';
      inp.maxLength = 140;
      var send = el('button', 'wb-send', '发送');
      send.type = 'button';
      function doSend() {
        var v = (inp.value || '').trim();
        if (!v) return;
        post.comments.push({ uid: 'me', text: v, ts: Date.now() });
        inp.value = '';
        savePosts();
        paint();
        popTitleEl.textContent = '评论 ' + post.comments.length;
        if (state.tab === 'feed' || state.tab === 'topic') render();
        if (Math.random() < 0.5) {
          setTimeout(function () {
            var net = pick(NETS);
            post.comments.push({ uid: net.id, text: pick(NET_COMMENTS), ts: Date.now() });
            savePosts();
            paint();
            popTitleEl.textContent = '评论 ' + post.comments.length;
            if (state.tab === 'feed' || state.tab === 'topic') render();
          }, rand(1500, 3500));
        }
      }
      send.addEventListener('click', doSend);
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') doSend(); });
      bar.appendChild(inp);
      bar.appendChild(send);
      body.appendChild(bar);
    });
  }

  /* ========== 开关 / 导航 ========== */
  function switchTab(tab) {
    if (tab !== 'topic') state.prevTab = tab;
    state.tab = tab;
    render();
    if (listEl) listEl.scrollTop = 0;
  }

  function onBack() {
    if (popEl && popEl.classList.contains('show')) { closePop(); return; }
    if (state.tab === 'topic' || state.tab === 'editor') {
      state.tab = state.prevTab || 'feed';
      render();
      return;
    }
    close();
  }

  function open(opts) {
    opts = opts || {};
    if (!root) buildRoot();
    root.classList.add('show');
    document.body.style.overflow = 'hidden';

    var ready = loadPosts();
    if (opts.tab === 'hot') { state.tab = 'hot'; state.prevTab = 'feed'; }
    else if (opts.topic) { state.topic = opts.topic; state.tab = 'topic'; state.prevTab = 'feed'; }
    else { state.tab = 'feed'; state.prevTab = 'feed'; }
    if (opts.edit) state.tab = 'editor';

    getHot();
    render();
    if (listEl) listEl.scrollTop = 0;

    if (!state.loaded) {
      ready.then(function () {
        if (root.classList.contains('show')) render();
      });
    }
  }

  function close() {
    if (!root) return;
    root.classList.remove('show');
    document.body.style.overflow = '';
    if (popEl) popEl.classList.remove('show');
  }

  window.ZyWeibo = {
    open: open,
    close: close,
    openTopic: function (t) { open({ topic: t }); },
    openHot: function () { open({ tab: 'hot' }); },
    editHot: function () { open({ tab: 'hot', edit: true }); },
    getHot: getHot
  };
})();
