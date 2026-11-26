/* 饮食日记 — 拍照识别（本地模拟）+ 每日记录 + 周报 + 分享卡
 * 参考 nosh 的核心体验，全部本地运行，不上传任何图片。
 * 入口：首页「饮食日记」→ window.XFood.open()
 */
(function () {
  'use strict';

  var KEY = 'zy_food_diary_v1';
  var STYLE_ID = 'zy-food-style';

  /* ================= 食物库（每份估算值） ================= */
  var FOODS = [
    { id: 'rice', n: '米饭', cal: 232, p: 4.4, c: 51.6, f: 0.5, u: '碗', col: '#F6E7CE', tags: ['yellow', 'mixed'], syn: '米饭 rice' },
    { id: 'congee', n: '白粥', cal: 120, p: 4, c: 25, f: 1, u: '碗', col: '#F3EFE4', tags: ['white', 'mixed'], syn: '白粥 粥 porridge congee' },
    { id: 'noodles', n: '面条', cal: 280, p: 9, c: 55, f: 2, u: '碗', col: '#F6E3C5', tags: ['yellow', 'mixed'], syn: '面条 面 noodle' },
    { id: 'ramen', n: '拉面', cal: 480, p: 18, c: 70, f: 14, u: '碗', col: '#F2D9B8', tags: ['yellow', 'red'], syn: '拉面 ramen' },
    { id: 'luosifen', n: '螺蛳粉', cal: 550, p: 18, c: 65, f: 24, u: '碗', col: '#EFCFC4', tags: ['red', 'yellow'], syn: '螺蛳粉 luosifen' },
    { id: 'chaofan', n: '炒饭', cal: 550, p: 15, c: 75, f: 19, u: '份', col: '#F6E2B9', tags: ['yellow'], syn: '炒饭 fried rice' },
    { id: 'jianbing', n: '煎饼果子', cal: 450, p: 14, c: 55, f: 18, u: '个', col: '#F3D8AE', tags: ['yellow'], syn: '煎饼 pancake' },
    { id: 'mantou', n: '馒头', cal: 220, p: 7, c: 47, f: 1, u: '个', col: '#F6F0E1', tags: ['white', 'yellow'], syn: '馒头 mantou' },
    { id: 'bread', n: '全麦面包', cal: 180, p: 7, c: 32, f: 2.5, u: '2片', col: '#E8D6BC', tags: ['yellow'], syn: '面包 bread toast' },
    { id: 'oats', n: '燕麦粥', cal: 150, p: 5, c: 27, f: 3, u: '碗', col: '#E9DCC4', tags: ['white', 'yellow'], syn: '燕麦 oat' },
    { id: 'sweetpotato', n: '红薯', cal: 130, p: 2, c: 30, f: 0.2, u: '个', col: '#F5D9B9', tags: ['yellow'], syn: '红薯 sweet potato' },
    { id: 'corn', n: '玉米', cal: 110, p: 4, c: 24, f: 1.5, u: '根', col: '#F8E9AE', tags: ['yellow'], syn: '玉米 corn' },
    { id: 'egg', n: '鸡蛋', cal: 78, p: 6.3, c: 0.6, f: 5.3, u: '个', col: '#F9EBC9', tags: ['white', 'mixed'], syn: '鸡蛋 蛋 egg' },
    { id: 'tomatoegg', n: '番茄炒蛋', cal: 230, p: 12, c: 9, f: 16, u: '份', col: '#FAD9C4', tags: ['red', 'yellow'], syn: '番茄炒蛋 tomato egg' },
    { id: 'chicken', n: '鸡胸肉', cal: 165, p: 31, c: 0, f: 3.6, u: '份', col: '#F5E5D4', tags: ['white', 'mixed'], syn: '鸡胸 chicken breast' },
    { id: 'kungpao', n: '宫保鸡丁', cal: 380, p: 25, c: 18, f: 24, u: '份', col: '#EFCDB8', tags: ['red'], syn: '宫保 kungpao' },
    { id: 'beef', n: '牛肉', cal: 250, p: 26, c: 0, f: 15, u: '份', col: '#EBC7BE', tags: ['brown'], syn: '牛肉 beef steak' },
    { id: 'pork', n: '猪里脊', cal: 220, p: 26, c: 0, f: 13, u: '份', col: '#F0CDC4', tags: ['brown'], syn: '猪里脊 pork' },
    { id: 'salmon', n: '三文鱼', cal: 208, p: 20, c: 0, f: 13, u: '份', col: '#F8D3C4', tags: ['red'], syn: '三文鱼 salmon' },
    { id: 'shrimp', n: '虾', cal: 100, p: 20, c: 1, f: 1.5, u: '份', col: '#F9E0D5', tags: ['red'], syn: '虾 shrimp' },
    { id: 'tofu', n: '豆腐', cal: 120, p: 10, c: 5, f: 6, u: '份', col: '#F7F0DA', tags: ['white', 'mixed'], syn: '豆腐 tofu' },
    { id: 'malatang', n: '麻辣烫', cal: 500, p: 20, c: 45, f: 26, u: '份', col: '#EFC5B6', tags: ['red'], syn: '麻辣烫 malatang' },
    { id: 'hotpot', n: '火锅', cal: 800, p: 35, c: 40, f: 55, u: '份', col: '#EEC0B2', tags: ['red'], syn: '火锅 hotpot' },
    { id: 'dumpling', n: '饺子', cal: 420, p: 18, c: 50, f: 16, u: '10个', col: '#F4EBDC', tags: ['white', 'yellow'], syn: '饺子 dumpling' },
    { id: 'shengjian', n: '生煎包', cal: 420, p: 14, c: 50, f: 18, u: '4个', col: '#F4DFC2', tags: ['white', 'yellow'], syn: '生煎 bun' },
    { id: 'pizza', n: '披萨', cal: 285, p: 12, c: 36, f: 10, u: '块', col: '#F2D8B5', tags: ['yellow', 'red'], syn: '披萨 pizza' },
    { id: 'burger', n: '汉堡', cal: 540, p: 25, c: 45, f: 28, u: '个', col: '#F1D3AE', tags: ['yellow'], syn: '汉堡 burger' },
    { id: 'fries', n: '薯条', cal: 320, p: 4, c: 43, f: 15, u: '份', col: '#F8E3AF', tags: ['yellow'], syn: '薯条 fries' },
    { id: 'friedchicken', n: '炸鸡', cal: 480, p: 30, c: 20, f: 31, u: '份', col: '#F3CFA9', tags: ['yellow', 'brown'], syn: '炸鸡 fried chicken' },
    { id: 'sushi', n: '寿司', cal: 300, p: 12, c: 50, f: 4, u: '6贯', col: '#EAD9CD', tags: ['white', 'green'], syn: '寿司 sushi' },
    { id: 'salad', n: '蔬菜沙拉', cal: 180, p: 6, c: 12, f: 12, u: '份', col: '#D9EAD8', tags: ['green'], syn: '沙拉 salad' },
    { id: 'broccoli', n: '西兰花', cal: 55, p: 4, c: 7, f: 0.5, u: '份', col: '#D7E9CF', tags: ['green'], syn: '西兰花 broccoli' },
    { id: 'greens', n: '炒青菜', cal: 90, p: 3, c: 8, f: 5, u: '份', col: '#DEEBCB', tags: ['green'], syn: '青菜 蔬菜 vegetable' },
    { id: 'milk', n: '牛奶', cal: 130, p: 8, c: 12, f: 5, u: '杯', col: '#EDF1F7', tags: ['white', 'drink'], syn: '牛奶 milk' },
    { id: 'yogurt', n: '酸奶', cal: 120, p: 6, c: 14, f: 4, u: '杯', col: '#F0F0F6', tags: ['white', 'drink'], syn: '酸奶 yogurt' },
    { id: 'latte', n: '拿铁', cal: 120, p: 6, c: 10, f: 6, u: '杯', col: '#EADCC8', tags: ['brown', 'drink'], syn: '拿铁 latte coffee' },
    { id: 'americano', n: '美式咖啡', cal: 5, p: 0, c: 0, f: 0, u: '杯', col: '#D9C9B4', tags: ['brown', 'drink'], syn: '美式 americano coffee' },
    { id: 'milktea', n: '奶茶', cal: 320, p: 4, c: 55, f: 9, u: '杯', col: '#EAD6C0', tags: ['brown', 'drink'], syn: '奶茶 milk tea' },
    { id: 'cola', n: '可乐', cal: 140, p: 0, c: 39, f: 0, u: '罐', col: '#E3D5CB', tags: ['brown', 'drink'], syn: '可乐 cola' },
    { id: 'cake', n: '蛋糕', cal: 350, p: 5, c: 45, f: 16, u: '块', col: '#F6DDE4', tags: ['white', 'brown'], syn: '蛋糕 cake' },
    { id: 'icecream', n: '冰淇淋', cal: 200, p: 3, c: 24, f: 10, u: '个', col: '#F7E7EC', tags: ['white'], syn: '冰淇淋 ice cream' },
    { id: 'apple', n: '苹果', cal: 95, p: 0.5, c: 25, f: 0.3, u: '个', col: '#F3DCD5', tags: ['green', 'mixed'], syn: '苹果 apple' },
    { id: 'banana', n: '香蕉', cal: 105, p: 1.3, c: 27, f: 0.4, u: '根', col: '#F8E9B8', tags: ['yellow'], syn: '香蕉 banana' },
    { id: 'blueberry', n: '蓝莓', cal: 85, p: 1, c: 21, f: 0.5, u: '盒', col: '#DDE0EE', tags: ['brown'], syn: '蓝莓 blueberry' },
    { id: 'watermelon', n: '西瓜', cal: 90, p: 1.5, c: 22, f: 0.3, u: '块', col: '#F6D8D6', tags: ['red'], syn: '西瓜 watermelon' },
    { id: 'nuts', n: '坚果', cal: 180, p: 5, c: 6, f: 16, u: '小把', col: '#E8D3B7', tags: ['brown'], syn: '坚果 nuts almond' },
    { id: 'protein', n: '蛋白粉', cal: 120, p: 24, c: 3, f: 1, u: '勺', col: '#EFE6DA', tags: ['white'], syn: '蛋白粉 protein' }
  ];

  var CATS = {
    green: ['salad', 'broccoli', 'greens', 'sushi', 'apple'],
    yellow: ['rice', 'noodles', 'ramen', 'chaofan', 'jianbing', 'mantou', 'bread', 'oats', 'sweetpotato', 'corn', 'dumpling', 'shengjian', 'pizza', 'burger', 'fries', 'friedchicken'],
    red: ['tomatoegg', 'kungpao', 'malatang', 'hotpot', 'luosifen', 'salmon', 'shrimp', 'watermelon'],
    white: ['congee', 'egg', 'chicken', 'tofu', 'milk', 'yogurt', 'dumpling', 'shengjian', 'cake', 'icecream'],
    brown: ['beef', 'pork', 'latte', 'americano', 'milktea', 'cola', 'cake', 'nuts', 'friedchicken'],
    mixed: ['rice', 'egg', 'chicken', 'apple', 'tofu', 'noodles']
  };

  var MEALS = [
    { k: 'breakfast', n: '早餐' },
    { k: 'lunch', n: '午餐' },
    { k: 'dinner', n: '晚餐' },
    { k: 'snack', n: '加餐' }
  ];
  var WEEKS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  /* ================= 工具 ================= */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function ds(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parseDS(s) { var a = String(s).split('-'); return new Date(+a[0], +a[1] - 1, +a[2]); }
  function todayStr() { return ds(new Date()); }
  function nowTime() { var d = new Date(); return pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function uid() { return 'f' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36); }
  function round1(n) { return Math.round(n * 10) / 10; }
  function findFood(id) {
    for (var i = 0; i < FOODS.length; i++) if (FOODS[i].id === id) return FOODS[i];
    return null;
  }
  function defaultMeal() {
    var h = new Date().getHours();
    if (h < 10) return 'breakfast';
    if (h < 15) return 'lunch';
    if (h < 21) return 'dinner';
    return 'snack';
  }
  function mealName(k) {
    for (var i = 0; i < MEALS.length; i++) if (MEALS[i].k === k) return MEALS[i].n;
    return '加餐';
  }
  function notify(msg) {
    if (window.showNotification) { window.showNotification(msg, 'info'); return; }
    try { console.log('[Food]', msg); } catch (e) {}
  }
  function dateLabel(s) {
    var d = parseDS(s);
    return (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + WEEKS[d.getDay()];
  }

  /* ================= 数据 ================= */
  var root = null;
  var data = null;
  var st = {
    tab: 'today',
    date: todayStr(),
    meal: 'lunch',
    pendingImg: '',
    pendingName: '',
    pendingCands: [],
    editing: null,
    recogTimer: null,
    shareUrl: ''
  };

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      var d = raw ? JSON.parse(raw) : null;
      if (d && Array.isArray(d.entries)) {
        if (!d.goal || d.goal < 800) d.goal = 1800;
        return d;
      }
    } catch (e) {}
    return { goal: 1800, entries: [] };
  }
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) {
      stripOldImages();
      try { localStorage.setItem(KEY, JSON.stringify(data)); notify('存储空间紧张，已清理较早的照片'); }
      catch (e2) { notify('存储空间不足，照片没有保存'); }
    }
  }
  function stripOldImages() {
    var withImg = [];
    for (var i = 0; i < data.entries.length; i++) if (data.entries[i].img) withImg.push(data.entries[i]);
    withImg.sort(function (a, b) { return (a.ts || 0) - (b.ts || 0); });
    while (withImg.length > 50) { delete withImg.shift().img; }
  }
  function entriesOn(date) {
    return data.entries.filter(function (e) { return e.date === date; });
  }
  function entryCal(e) { return Math.round((e.base ? e.base.cal : 0) * (e.portion || 1)); }
  function dayCal(date) {
    return entriesOn(date).reduce(function (s, e) { return s + entryCal(e); }, 0);
  }

  /* ================= 样式 ================= */
  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = [
      '#zy-food{position:fixed;inset:0;z-index:99990;display:none;flex-direction:column;background:radial-gradient(60% 40% at 8% 0%,#FBE6EA 0%,rgba(251,230,234,0) 60%),radial-gradient(52% 40% at 96% 6%,#DDE9F7 0%,rgba(221,233,247,0) 62%),linear-gradient(165deg,#F9F2EC 0%,#EDF2F8 52%,#E9F1EB 100%);color:#3A3540;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif;}',
      '#zy-food.show{display:flex;}',
      '#zy-food *{box-sizing:border-box;}',
      '#zy-food .fd-shell{width:100%;max-width:600px;margin:0 auto;flex:1;min-height:0;display:flex;flex-direction:column;position:relative;}',
      '#zy-food .fd-head{height:52px;flex-shrink:0;display:flex;align-items:center;gap:8px;padding:0 12px;}',
      '#zy-food .fd-back{width:36px;height:36px;border:none;background:transparent;color:#3A3540;font-size:22px;line-height:1;cursor:pointer;}',
      '#zy-food .fd-title{flex:1;font-size:17px;font-weight:600;color:#2B2A2E;}',
      '#zy-food .fd-hbtn{border:1px solid rgba(255,255,255,.8);background:rgba(255,255,255,.55);color:#3A3540;font-size:12px;padding:7px 12px;border-radius:16px;cursor:pointer;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);box-shadow:0 4px 14px rgba(58,62,86,.06);}',
      '#zy-food .fd-tabs{flex-shrink:0;display:flex;gap:4px;margin:2px 16px 10px;padding:4px;border-radius:18px;background:rgba(255,255,255,.42);border:1px solid rgba(255,255,255,.7);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);}',
      '#zy-food .fd-tab{flex:1;border:0;background:transparent;color:#6E6A70;font-size:13px;font-weight:500;padding:8px 0;border-radius:14px;cursor:pointer;font-family:inherit;}',
      '#zy-food .fd-tab.on{background:rgba(255,255,255,.85);color:#2B2A2E;box-shadow:0 4px 12px rgba(58,62,86,.08);font-weight:600;}',
      '#zy-food .fd-body{flex:1;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:0 16px 26px;}',
      '#zy-food .fd-datebar{display:flex;align-items:center;justify-content:space-between;padding:2px 2px 10px;}',
      '#zy-food .fd-datebar button{width:34px;height:34px;border-radius:50%;border:1px solid rgba(255,255,255,.75);background:rgba(255,255,255,.5);color:#3A3540;font-size:17px;cursor:pointer;}',
      '#zy-food .fd-date{font-size:15px;font-weight:600;color:#2B2A2E;}',
      '#zy-food .fd-date small{font-size:11px;font-weight:500;color:#9C979E;margin-left:6px;}',
      '#zy-food .glass{background:rgba(255,255,255,.52);border:1px solid rgba(255,255,255,.75);box-shadow:0 12px 34px rgba(58,62,86,.08);backdrop-filter:blur(20px) saturate(140%);-webkit-backdrop-filter:blur(20px) saturate(140%);}',
      '#zy-food .fd-goal{display:flex;align-items:center;gap:16px;border-radius:26px;padding:18px;}',
      '#zy-food .fd-ring{position:relative;width:96px;height:96px;flex-shrink:0;}',
      '#zy-food .fd-ring svg{width:96px;height:96px;transform:rotate(-90deg);}',
      '#zy-food .fd-ring circle{fill:none;stroke-width:8;}',
      '#zy-food .fd-ring .bg{stroke:rgba(255,255,255,.65);}',
      '#zy-food .fd-ring .fg{stroke:#E8AAB9;stroke-linecap:round;transition:stroke-dashoffset .4s ease;}',
      '#zy-food .fd-ring .num{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;}',
      '#zy-food .fd-ring .num b{font-size:20px;font-weight:600;color:#2B2A2E;line-height:1.1;font-variant-numeric:tabular-nums;}',
      '#zy-food .fd-ring .num span{font-size:9px;color:#9C979E;margin-top:1px;}',
      '#zy-food .fd-goal .meta{flex:1;min-width:0;}',
      '#zy-food .fd-goal .k{font-size:11px;color:#9C979E;letter-spacing:.06em;}',
      '#zy-food .fd-goal .v{font-size:22px;font-weight:600;color:#2B2A2E;margin-top:2px;font-variant-numeric:tabular-nums;}',
      '#zy-food .fd-goal .v span{font-size:12px;font-weight:500;color:#9C979E;}',
      '#zy-food .fd-macros{display:flex;gap:12px;margin-top:7px;font-size:11px;color:#6E6A70;}',
      '#zy-food .fd-macros span{white-space:nowrap;}',
      '#zy-food .fd-meal{margin-top:16px;}',
      '#zy-food .fd-meal-h{display:flex;align-items:center;justify-content:space-between;padding:0 4px 8px;}',
      '#zy-food .fd-meal-h .n{font-size:14px;font-weight:600;color:#2B2A2E;}',
      '#zy-food .fd-meal-h .n span{font-size:11px;font-weight:500;color:#9C979E;margin-left:6px;}',
      '#zy-food .fd-meal-h button{border:1px solid rgba(255,255,255,.75);background:rgba(255,255,255,.5);color:#6B4651;font-size:11px;padding:5px 10px;border-radius:12px;cursor:pointer;}',
      '#zy-food .fd-entry{display:flex;align-items:center;gap:11px;padding:10px;margin-bottom:8px;border-radius:18px;background:rgba(255,255,255,.55);border:1px solid rgba(255,255,255,.78);box-shadow:0 6px 18px rgba(58,62,86,.05);cursor:pointer;}',
      '#zy-food .fd-entry:active{transform:scale(.99);}',
      '#zy-food .fd-thumb{width:48px;height:48px;border-radius:14px;flex-shrink:0;background:#F6E7CE;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:600;color:#6B4651;overflow:hidden;background-size:cover;background-position:center;}',
      '#zy-food .fd-thumb img{width:100%;height:100%;object-fit:cover;display:block;}',
      '#zy-food .fd-entry .txt{flex:1;min-width:0;}',
      '#zy-food .fd-entry .nm{font-size:14px;font-weight:600;color:#2B2A2E;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
      '#zy-food .fd-entry .sub{font-size:11px;color:#9C979E;margin-top:2px;}',
      '#zy-food .fd-entry .cal{font-size:14px;font-weight:600;color:#6B4651;white-space:nowrap;font-variant-numeric:tabular-nums;}',
      '#zy-food .fd-entry .cal span{font-size:9px;font-weight:500;color:#9C979E;margin-left:2px;}',
      '#zy-food .fd-empty{padding:16px 12px;border-radius:18px;border:1px dashed rgba(58,62,86,.12);color:#9C979E;font-size:12px;text-align:center;margin-bottom:8px;}',
      '#zy-food .fd-addbar{position:sticky;bottom:0;padding:14px 0 4px;margin-top:12px;background:linear-gradient(180deg,rgba(249,242,236,0),rgba(249,242,236,.92) 38%);}',
      '#zy-food .fd-add{display:block;width:100%;border:none;border-radius:24px;padding:14px;font-size:15px;font-weight:600;color:#6B4651;background:linear-gradient(135deg,#F5D3DC,#E8AAB9);box-shadow:0 10px 24px rgba(232,170,185,.32);cursor:pointer;font-family:inherit;}',
      '#zy-food .fd-add:active{transform:scale(.98);}',
      /* week */
      '#zy-food .fd-week{padding-top:4px;}',
      '#zy-food .fd-card{border-radius:24px;padding:16px;margin-bottom:12px;}',
      '#zy-food .fd-card .k{font-size:11px;color:#9C979E;letter-spacing:.06em;}',
      '#zy-food .fd-card .big{font-size:30px;font-weight:600;color:#2B2A2E;margin-top:4px;font-variant-numeric:tabular-nums;}',
      '#zy-food .fd-card .big span{font-size:12px;font-weight:500;color:#9C979E;margin-left:4px;}',
      '#zy-food .fd-card .sub{font-size:11px;color:#6E6A70;margin-top:3px;}',
      '#zy-food .fd-bars{display:flex;align-items:flex-end;justify-content:space-between;gap:6px;height:130px;margin-top:16px;}',
      '#zy-food .fd-bar{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;gap:5px;}',
      '#zy-food .fd-bar .col{width:100%;max-width:28px;border-radius:8px 8px 4px 4px;background:rgba(232,170,185,.32);min-height:4px;transition:height .3s ease;}',
      '#zy-food .fd-bar.on .col{background:linear-gradient(180deg,#F5D3DC,#E8AAB9);}',
      '#zy-food .fd-bar .d{font-size:9px;color:#9C979E;}',
      '#zy-food .fd-bar .v{font-size:9px;color:#9C979E;font-variant-numeric:tabular-nums;}',
      '#zy-food .fd-statgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px;}',
      '#zy-food .fd-stat{border-radius:20px;padding:13px 8px;text-align:center;}',
      '#zy-food .fd-stat b{display:block;font-size:20px;font-weight:600;color:#2B2A2E;font-variant-numeric:tabular-nums;}',
      '#zy-food .fd-stat span{display:block;font-size:10px;color:#9C979E;margin-top:3px;}',
      '#zy-food .fd-top{display:flex;align-items:center;gap:9px;padding:8px 0;border-bottom:1px solid rgba(58,62,86,.06);font-size:13px;}',
      '#zy-food .fd-top:last-child{border-bottom:none;}',
      '#zy-food .fd-top i{width:24px;height:24px;border-radius:8px;flex-shrink:0;background:#F6E7CE;}',
      '#zy-food .fd-top .nm{flex:1;color:#2B2A2E;}',
      '#zy-food .fd-top .ct{font-size:11px;color:#9C979E;}',
      '#zy-food .fd-insight{font-size:13px;line-height:1.75;color:#3A3540;}',
      '#zy-food .fd-sharebtn{width:100%;margin-top:12px;border:none;border-radius:20px;padding:13px;font-size:14px;font-weight:600;color:#6B4651;background:linear-gradient(135deg,#F5D3DC,#E8AAB9);box-shadow:0 8px 20px rgba(232,170,185,.28);cursor:pointer;font-family:inherit;}',
      /* sheet */
      '#zy-food .fd-sheet{position:absolute;inset:0;z-index:5;display:none;}',
      '#zy-food .fd-sheet.on{display:block;}',
      '#zy-food .fd-mask{position:absolute;inset:0;background:rgba(52,50,64,.24);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);}',
      '#zy-food .fd-panel{position:absolute;left:0;right:0;bottom:0;max-height:88%;overflow-y:auto;background:#FBF7F8;border:1px solid rgba(255,255,255,.85);border-radius:26px 26px 0 0;padding:18px 18px 30px;box-shadow:0 -10px 40px rgba(58,62,86,.12);}',
      '#zy-food .fd-panel h3{margin:0 0 14px;font-size:16px;font-weight:600;color:#2B2A2E;}',
      '#zy-food .fd-grab{width:36px;height:4px;border-radius:2px;background:rgba(58,62,86,.14);margin:-6px auto 12px;}',
      '#zy-food .fd-addgrid{display:flex;flex-direction:column;gap:10px;}',
      '#zy-food .fd-addopt{display:flex;align-items:center;gap:12px;padding:15px;border-radius:18px;border:1px solid rgba(58,62,86,.08);background:#fff;cursor:pointer;text-align:left;font-family:inherit;}',
      '#zy-food .fd-addopt .ic{width:38px;height:38px;border-radius:12px;background:rgba(232,170,185,.16);color:#6B4651;display:flex;align-items:center;justify-content:center;flex-shrink:0;}',
      '#zy-food .fd-addopt .ic svg{width:19px;height:19px;}',
      '#zy-food .fd-addopt .t{flex:1;}',
      '#zy-food .fd-addopt .t b{display:block;font-size:14px;font-weight:600;color:#2B2A2E;}',
      '#zy-food .fd-addopt .t span{display:block;font-size:11px;color:#9C979E;margin-top:2px;}',
      '#zy-food .fd-addopt .go{color:#C9C5CC;font-size:18px;}',
      '#zy-food .fd-recog{text-align:center;}',
      '#zy-food .fd-recog img{width:100%;max-height:250px;object-fit:cover;border-radius:18px;display:block;margin-bottom:14px;}',
      '#zy-food .fd-scan{height:6px;border-radius:3px;background:rgba(232,170,185,.18);overflow:hidden;margin:3px 0 10px;}',
      '#zy-food .fd-scan i{display:block;height:100%;width:40%;border-radius:3px;background:linear-gradient(90deg,#F5D3DC,#E8AAB9);animation:fdscan 1.1s ease-in-out infinite;}',
      '@keyframes fdscan{0%{transform:translateX(-110%)}100%{transform:translateX(260%)}}',
      '#zy-food .fd-recog p{font-size:12px;color:#6E6A70;margin:0;}',
      '#zy-food .fd-cands{display:flex;flex-direction:column;gap:8px;}',
      '#zy-food .fd-cand{display:flex;align-items:center;gap:11px;padding:12px;border-radius:16px;border:1px solid rgba(58,62,86,.07);background:#fff;cursor:pointer;text-align:left;font-family:inherit;}',
      '#zy-food .fd-cand .sw{width:38px;height:38px;border-radius:12px;flex-shrink:0;}',
      '#zy-food .fd-cand .t{flex:1;min-width:0;}',
      '#zy-food .fd-cand .t b{display:block;font-size:14px;font-weight:600;color:#2B2A2E;}',
      '#zy-food .fd-cand .t span{display:block;font-size:11px;color:#9C979E;margin-top:2px;}',
      '#zy-food .fd-cand .pc{font-size:11px;font-weight:600;color:#6B4651;}',
      '#zy-food .fd-textbtn{border:none;background:transparent;color:#6B4651;font-size:12px;padding:10px;cursor:pointer;font-family:inherit;}',
      '#zy-food .fd-search{width:100%;border:1px solid rgba(58,62,86,.1);background:#fff;border-radius:14px;padding:11px 13px;font-size:14px;color:#2B2A2E;font-family:inherit;outline:none;margin-bottom:10px;}',
      '#zy-food .fd-foodlist{max-height:300px;overflow-y:auto;border-radius:16px;background:#fff;border:1px solid rgba(58,62,86,.07);}',
      '#zy-food .fd-foodrow{display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid rgba(58,62,86,.05);cursor:pointer;font-size:13px;color:#2B2A2E;}',
      '#zy-food .fd-foodrow:last-child{border-bottom:none;}',
      '#zy-food .fd-foodrow i{width:26px;height:26px;border-radius:8px;flex-shrink:0;}',
      '#zy-food .fd-foodrow .nm{flex:1;}',
      '#zy-food .fd-foodrow .kc{font-size:11px;color:#9C979E;}',
      '#zy-food .fd-field{display:block;margin-bottom:12px;}',
      '#zy-food .fd-field > span{display:block;font-size:11px;color:#6E6A70;margin-bottom:5px;}',
      '#zy-food .fd-field input,#zy-food .fd-field textarea{width:100%;border:1px solid rgba(58,62,86,.1);background:#fff;border-radius:12px;padding:10px 12px;font-size:14px;color:#2B2A2E;font-family:inherit;outline:none;}',
      '#zy-food .fd-field textarea{min-height:64px;resize:vertical;}',
      '#zy-food .fd-row2{display:grid;grid-template-columns:1fr 1fr;gap:10px;}',
      '#zy-food .fd-stepper{display:flex;align-items:center;gap:8px;background:#fff;border:1px solid rgba(58,62,86,.1);border-radius:12px;padding:4px;}',
      '#zy-food .fd-stepper button{width:28px;height:28px;border:none;border-radius:9px;background:rgba(232,170,185,.18);color:#6B4651;font-size:16px;cursor:pointer;}',
      '#zy-food .fd-stepper span{flex:1;text-align:center;font-size:14px;font-weight:600;color:#2B2A2E;}',
      '#zy-food .fd-chips{display:flex;gap:6px;flex-wrap:wrap;}',
      '#zy-food .fd-chip{border:1px solid rgba(58,62,86,.1);background:#fff;color:#6E6A70;font-size:12px;padding:8px 11px;border-radius:12px;cursor:pointer;font-family:inherit;}',
      '#zy-food .fd-chip.on{background:rgba(232,170,185,.22);border-color:#E8AAB9;color:#6B4651;font-weight:600;}',
      '#zy-food .fd-nutri{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px;}',
      '#zy-food .fd-nutri label{display:block;}',
      '#zy-food .fd-nutri span{display:block;font-size:10px;color:#9C979E;margin-bottom:4px;}',
      '#zy-food .fd-nutri input{width:100%;border:1px solid rgba(58,62,86,.1);background:#fff;border-radius:10px;padding:8px;font-size:13px;color:#2B2A2E;font-family:inherit;text-align:center;outline:none;}',
      '#zy-food .fd-btns{display:flex;gap:8px;margin-top:16px;}',
      '#zy-food .fd-btns button{flex:1;border:none;border-radius:18px;padding:13px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;}',
      '#zy-food .fd-save{background:linear-gradient(135deg,#F5D3DC,#E8AAB9);color:#6B4651;box-shadow:0 8px 20px rgba(232,170,185,.28);}',
      '#zy-food .fd-del{background:#fff;border:1px solid rgba(181,118,111,.28)!important;color:#B5766F;}',
      '#zy-food .fd-cancel{background:#fff;border:1px solid rgba(58,62,86,.1)!important;color:#6E6A70;}',
      '#zy-food .fd-shareimg{width:100%;border-radius:16px;display:block;box-shadow:0 10px 30px rgba(58,62,86,.12);}',
      '#zy-food .fd-tip{font-size:11px;color:#9C979E;text-align:center;margin-top:10px;}',
      '#zy-food .fd-toast{position:absolute;left:50%;bottom:96px;transform:translate(-50%,8px);background:rgba(43,42,46,.88);color:#fff;font-size:12px;padding:8px 14px;border-radius:16px;opacity:0;pointer-events:none;transition:opacity .18s ease,transform .18s ease;z-index:20;white-space:nowrap;}',
      '#zy-food .fd-toast.on{opacity:1;transform:translate(-50%,0);}',
      '@media (max-width:380px){#zy-food .fd-ring,#zy-food .fd-ring svg{width:84px;height:84px;}#zy-food .fd-goal{padding:14px;gap:12px;}#zy-food .fd-goal .v{font-size:19px;}}'
    ].join('\n');
    document.head.appendChild(s);
  }

  /* ================= DOM ================= */
  function buildRoot() {
    injectStyle();
    root = document.createElement('div');
    root.id = 'zy-food';
    root.innerHTML =
      '<div class="fd-shell">' +
        '<div class="fd-head">' +
          '<button class="fd-back" type="button" aria-label="返回">‹</button>' +
          '<div class="fd-title">饮食日记</div>' +
          '<button class="fd-hbtn" id="fd-settings" type="button">设置</button>' +
        '</div>' +
        '<div class="fd-tabs">' +
          '<button class="fd-tab on" data-tab="today" type="button">今天</button>' +
          '<button class="fd-tab" data-tab="week" type="button">周报</button>' +
        '</div>' +
        '<div class="fd-body" id="fd-body"></div>' +
        '<div class="fd-sheet" id="fd-sheet"></div>' +
        '<div class="fd-toast" id="fd-toast"></div>' +
      '</div>' +
      '<input type="file" id="fd-camera" accept="image/*" capture="environment" style="display:none">' +
      '<input type="file" id="fd-album" accept="image/*" style="display:none">';
    document.body.appendChild(root);

    root.querySelector('.fd-back').addEventListener('click', onBack);
    root.querySelector('#fd-settings').addEventListener('click', showSettings);
    root.querySelector('#fd-camera').addEventListener('change', onFilePicked);
    root.querySelector('#fd-album').addEventListener('change', onFilePicked);

    root.addEventListener('click', onClick);

    // 日期栏推入历史，Android 返回键先关模块
    try {
      window.addEventListener('popstate', function () {
        if (root && root.classList.contains('show')) { close(); }
      });
    } catch (e) {}
  }

  function bodyEl() { return root.querySelector('#fd-body'); }
  function sheetEl() { return root.querySelector('#fd-sheet'); }
  function toast(msg) {
    var t = root.querySelector('#fd-toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('on');
    clearTimeout(t._timer);
    t._timer = setTimeout(function () { t.classList.remove('on'); }, 1600);
  }

  /* ================= 渲染 ================= */
  function render() {
    if (!root) return;
    var t1 = root.querySelector('[data-tab="today"]');
    var t2 = root.querySelector('[data-tab="week"]');
    if (t1) t1.classList.toggle('on', st.tab === 'today');
    if (t2) t2.classList.toggle('on', st.tab === 'week');
    bodyEl().innerHTML = st.tab === 'week' ? weekHTML() : todayHTML();
  }

  function todayHTML() {
    var list = entriesOn(st.date);
    var cal = dayCal(st.date);
    var p = 0, c = 0, f = 0;
    for (var i = 0; i < list.length; i++) {
      var b = list[i].base || {};
      var k = list[i].portion || 1;
      p += (b.p || 0) * k; c += (b.c || 0) * k; f += (b.f || 0) * k;
    }
    var isToday = st.date === todayStr();
    var html = '<div class="fd-datebar">' +
      '<button type="button" data-act="prev-day" aria-label="前一天">‹</button>' +
      '<div class="fd-date">' + dateLabel(st.date) + (isToday ? '<small>今天</small>' : '') + '</div>' +
      '<button type="button" data-act="next-day" aria-label="后一天">›</button>' +
      '</div>' +
      '<div class="fd-goal glass">' + ringHTML(cal, data.goal) +
      '<div class="meta"><div class="k">今日摄入</div><div class="v">' + cal + ' <span>/ ' + data.goal + ' kcal</span></div>' +
      '<div class="fd-macros"><span>蛋白 ' + Math.round(p) + 'g</span><span>碳水 ' + Math.round(c) + 'g</span><span>脂肪 ' + Math.round(f) + 'g</span></div></div></div>';

    for (var m = 0; m < MEALS.length; m++) {
      var meal = MEALS[m];
      var items = list.filter(function (e) { return e.meal === meal.k; });
      var sum = items.reduce(function (s, e) { return s + entryCal(e); }, 0);
      html += '<div class="fd-meal"><div class="fd-meal-h"><div class="n">' + meal.n + (items.length ? '<span>' + sum + ' kcal</span>' : '') + '</div>' +
        '<button type="button" data-act="add" data-meal="' + meal.k + '">添加</button></div>';
      if (!items.length) {
        html += '<div class="fd-empty">还没有记录</div>';
      } else {
        for (var j = 0; j < items.length; j++) {
          html += entryHTML(items[j]);
        }
      }
      html += '</div>';
    }

    html += '<div class="fd-addbar"><button class="fd-add" type="button" data-act="add">记一口</button></div>';
    return html;
  }

  function ringHTML(cal, goal) {
    var p = goal > 0 ? Math.min(1, cal / goal) : 0;
    var circ = 2 * Math.PI * 42;
    var off = circ * (1 - p);
    return '<div class="fd-ring"><svg viewBox="0 0 100 100"><circle class="bg" cx="50" cy="50" r="42"></circle>' +
      '<circle class="fg" cx="50" cy="50" r="42" style="stroke-dasharray:' + circ.toFixed(1) + ';stroke-dashoffset:' + off.toFixed(1) + '"></circle></svg>' +
      '<div class="num"><b>' + cal + '</b><span>kcal</span></div></div>';
  }

  function entryHTML(e) {
    var color = '#F6E7CE';
    var ff = findFood(e.foodId);
    if (ff) color = ff.col;
    var thumb = e.img ? '<div class="fd-thumb"><img src="' + e.img + '" alt=""></div>'
      : '<div class="fd-thumb" style="background:' + color + '">' + esc((e.name || '食').slice(0, 1)) + '</div>';
    return '<div class="fd-entry" data-act="entry" data-id="' + e.id + '">' + thumb +
      '<div class="txt"><div class="nm">' + esc(e.name) + '</div><div class="sub">' + esc(e.time || '') + ' · ' +
      (e.portion || 1) + ' 份' + (e.note ? ' · ' + esc(e.note) : '') + '</div></div>' +
      '<div class="cal">' + entryCal(e) + '<span>kcal</span></div></div>';
  }

  function weekHTML() {
    var dates = [];
    var end = parseDS(st.date);
    for (var i = 6; i >= 0; i--) {
      var d = new Date(end.getFullYear(), end.getMonth(), end.getDate() - i);
      dates.push(ds(d));
    }
    var totals = dates.map(dayCal);
    var total = totals.reduce(function (a, b) { return a + b; }, 0);
    var max = Math.max.apply(null, totals.concat([data.goal]));
    var recDays = totals.filter(function (v) { return v > 0; }).length;
    var avg = recDays ? Math.round(total / recDays) : 0;
    var top = topFoods(dates);
    var html = '<div class="fd-week">' +
      '<div class="fd-card glass"><div class="k">最近 7 天</div><div class="big">' + total + '<span>kcal</span></div>' +
      '<div class="sub">记录 ' + recDays + ' 天 · 日均 ' + avg + ' kcal · 目标 ' + data.goal + '</div>' +
      '<div class="fd-bars">';
    for (var k = 0; k < 7; k++) {
      var h = max > 0 ? Math.max(4, Math.round(totals[k] / max * 100)) : 4;
      var dd = parseDS(dates[k]);
      html += '<div class="fd-bar' + (totals[k] > 0 ? ' on' : '') + '"><div class="v">' + (totals[k] ? totals[k] : '') + '</div>' +
        '<div class="col" style="height:' + h + 'px"></div><div class="d">' + WEEKS[dd.getDay()].replace('周', '') + '</div></div>';
    }
    html += '</div></div>' +
      '<div class="fd-statgrid">' +
      '<div class="fd-stat glass"><b>' + recDays + '</b><span>记录天数</span></div>' +
      '<div class="fd-stat glass"><b>' + streakDays() + '</b><span>连续记录</span></div>' +
      '<div class="fd-stat glass"><b>' + avg + '</b><span>日均 kcal</span></div>' +
      '</div>';

    html += '<div class="fd-card glass"><div class="k">这周常吃</div>';
    if (!top.length) {
      html += '<div class="fd-empty" style="margin-top:10px;">还没有记录，先去记一口</div>';
    } else {
      for (var t = 0; t < top.length; t++) {
        var f = findFood(top[t].id);
        html += '<div class="fd-top"><i style="background:' + (f ? f.col : '#F6E7CE') + '"></i><span class="nm">' + esc(top[t].name) + '</span><span class="ct">' + top[t].count + ' 次</span></div>';
      }
    }
    html += '</div>';

    html += '<div class="fd-card glass"><div class="k">本周小结</div><div class="fd-insight" style="margin-top:7px;">' + insight(recDays, avg) + '</div>' +
      '<button class="fd-sharebtn" type="button" data-act="share">生成分享卡</button></div></div>';
    return html;
  }

  function topFoods(dates) {
    var map = {};
    data.entries.forEach(function (e) {
      if (dates.indexOf(e.date) < 0) return;
      var key = e.foodId || e.name;
      if (!map[key]) map[key] = { id: e.foodId, name: e.name, count: 0 };
      map[key].count++;
    });
    var arr = Object.keys(map).map(function (k) { return map[k]; });
    arr.sort(function (a, b) { return b.count - a.count; });
    return arr.slice(0, 3);
  }

  function streakDays() {
    var cur = new Date();
    var n = 0;
    // 今天没记录时，从昨天开始算连续
    if (dayCal(ds(cur)) === 0) cur.setDate(cur.getDate() - 1);
    while (true) {
      if (dayCal(ds(cur)) > 0) { n++; cur.setDate(cur.getDate() - 1); }
      else break;
      if (n > 400) break;
    }
    return n;
  }

  function insight(days, avg) {
    if (!days) return '这周还没有记录，从今天的一口开始吧。';
    if (avg > data.goal * 1.15) return '这周吃得有点丰盛，下周可以多安排两顿清淡的，给胃留点余地。';
    if (avg < data.goal * 0.7) return '这周整体偏少，忙的时候也要记得按时吃饭。';
    if (days >= 5) return '这周记录了 ' + days + ' 天，节奏很稳，继续保持。';
    return '已经记录了 ' + days + ' 天，再坚持几天就能看到完整的一周。';
  }

  /* ================= 点击事件 ================= */
  function onClick(ev) {
    var tabBtn = ev.target.closest ? ev.target.closest('[data-tab]') : null;
    if (tabBtn && root.contains(tabBtn)) {
      st.tab = tabBtn.getAttribute('data-tab');
      render();
      return;
    }
    var el = ev.target.closest ? ev.target.closest('[data-act]') : null;
    if (!el || !root.contains(el)) return;
    var act = el.getAttribute('data-act');
    var id = el.getAttribute('data-id');
    switch (act) {
      case 'prev-day': shiftDay(-1); break;
      case 'next-day': shiftDay(1); break;
      case 'add': st.meal = el.getAttribute('data-meal') || defaultMeal(); showAddPicker(); break;
      case 'entry': openEntry(id); break;
      case 'close-sheet': closeSheet(); break;
      case 'camera': closeSheet(); root.querySelector('#fd-camera').click(); break;
      case 'album': closeSheet(); root.querySelector('#fd-album').click(); break;
      case 'manual': closeSheet(); showManual(''); break;
      case 'manual-recog': showManual(st.pendingName || ''); break;
      case 'pick': pickFood(id); break;
      case 'food': pickFood(id); break;
      case 'custom': showEdit(null); break;
      case 'minus': adjustPortion(-0.5); break;
      case 'plus': adjustPortion(0.5); break;
      case 'meal': setMeal(el.getAttribute('data-meal')); break;
      case 'save': saveEntry(); break;
      case 'del': deleteEntry(); break;
      case 'settings': showSettings(); break;
      case 'save-goal': saveGoal(); break;
      case 'clear': clearAll(); break;
      case 'share': showShare(); break;
      case 'download': downloadShare(); break;
    }
  }

  function shiftDay(delta) {
    var d = parseDS(st.date);
    d.setDate(d.getDate() + delta);
    var next = ds(d);
    if (next > todayStr()) { toast('还没到那天呢'); return; }
    st.date = next;
    render();
  }

  function onBack() {
    if (sheetEl().classList.contains('on')) { closeSheet(); return; }
    if (st.tab === 'week') { st.tab = 'today'; render(); return; }
    close();
  }

  /* ================= 弹层 ================= */
  function openSheet(html) {
    var s = sheetEl();
    s.innerHTML = '<div class="fd-mask" data-act="close-sheet"></div><div class="fd-panel"><div class="fd-grab"></div>' + html + '</div>';
    s.classList.add('on');
  }
  function closeSheet() {
    var s = sheetEl();
    if (!s) return;
    s.classList.remove('on');
    s.innerHTML = '';
    st.pendingImg = '';
    st.pendingName = '';
    st.pendingCands = [];
    st.editing = null;
    if (st.recogTimer) { clearTimeout(st.recogTimer); st.recogTimer = null; }
  }

  function showAddPicker() {
    openSheet('<h3>记一口</h3><div class="fd-addgrid">' +
      addOpt('camera', cameraIcon(), '拍照识别', '拍一张，帮你猜猜是什么') +
      addOpt('album', imageIcon(), '从相册选', '用已有的照片来识别') +
      addOpt('manual', searchIcon(), '手动添加', '搜索食物，或自己填') +
      '</div>');
  }
  function addOpt(act, icon, title, sub) {
    return '<button class="fd-addopt" type="button" data-act="' + act + '"><span class="ic">' + icon + '</span>' +
      '<span class="t"><b>' + title + '</b><span>' + sub + '</span></span><span class="go">›</span></button>';
  }

  function cameraIcon() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h3l2-2h6l2 2h3v12H4z"/><circle cx="12" cy="13" r="3.5"/></svg>';
  }
  function imageIcon() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2.5"/><circle cx="9" cy="9" r="1.6"/><path d="m21 15-5-5L5 21"/></svg>';
  }
  function searchIcon() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
  }

  /* ================= 选图 → 模拟识别 ================= */
  function onFilePicked(ev) {
    var input = ev.target;
    var f = input.files && input.files[0];
    input.value = '';
    if (!f) return;
    compressImage(f, function (dataUrl) {
      st.pendingImg = dataUrl;
      st.pendingName = f.name || '';
      startRecognize(dataUrl, f.name || '');
    });
  }

  function compressImage(file, cb) {
    var url = '';
    try { url = URL.createObjectURL(file); } catch (e) { cb(''); return; }
    var img = new Image();
    img.onload = function () {
      try {
        var max = 320;
        var scale = Math.min(1, max / Math.max(img.width, img.height));
        var c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(img.width * scale));
        c.height = Math.max(1, Math.round(img.height * scale));
        var ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0, c.width, c.height);
        cb(c.toDataURL('image/jpeg', 0.62));
      } catch (e) { cb(''); }
      try { URL.revokeObjectURL(url); } catch (e) {}
    };
    img.onerror = function () { cb(''); try { URL.revokeObjectURL(url); } catch (e) {} };
    img.src = url;
  }

  function startRecognize(dataUrl, filename) {
    openSheet('<h3>识别中</h3><div class="fd-recog">' +
      (dataUrl ? '<img src="' + dataUrl + '" alt="">' : '') +
      '<div class="fd-scan"><i></i></div><p>正在看看这盘是什么，稍等一下</p></div>');
    st.recogTimer = setTimeout(function () {
      st.recogTimer = null;
      analyzeImage(dataUrl, function (cat) {
        st.pendingCands = pickCandidates(cat, filename);
        showCandidates();
      });
    }, 1150);
  }

  function analyzeImage(dataUrl, cb) {
    if (!dataUrl) { cb('mixed'); return; }
    var img = new Image();
    img.onload = function () {
      try {
        var c = document.createElement('canvas');
        c.width = 32; c.height = 32;
        var x = c.getContext('2d');
        x.drawImage(img, 0, 0, 32, 32);
        var d = x.getImageData(0, 0, 32, 32).data;
        var g = 0, r = 0, y = 0, w = 0, dark = 0, n = 0;
        for (var i = 0; i < d.length; i += 4) {
          if (d[i + 3] < 40) continue;
          var R = d[i], G = d[i + 1], B = d[i + 2];
          n++;
          if (G > R + 10 && G > B + 10) g++;
          if (R > G + 18 && R > B + 18) r++;
          if (R > 150 && G > 105 && B < 110) y++;
          if (R > 178 && G > 172 && B > 165) w++;
          if ((R + G + B) / 3 < 80) dark++;
        }
        n = n || 1;
        var cat = 'mixed';
        if (g / n > 0.16) cat = 'green';
        else if (y / n > 0.14) cat = 'yellow';
        else if (r / n > 0.16) cat = 'red';
        else if (w / n > 0.28) cat = 'white';
        else if (dark / n > 0.35) cat = 'brown';
        cb(cat);
      } catch (e) { cb('mixed'); }
    };
    img.onerror = function () { cb('mixed'); };
    img.src = dataUrl;
  }

  function pickCandidates(cat, filename) {
    var keywordIds = [];
    var low = String(filename || '').toLowerCase();
    if (low) {
      FOODS.forEach(function (f) {
        var syns = (f.syn || '').toLowerCase().split(/\s+/);
        var hit = false;
        for (var i = 0; i < syns.length; i++) {
          if (syns[i] && low.indexOf(syns[i]) >= 0) { hit = true; break; }
        }
        if (!hit && low.indexOf(f.n) >= 0) hit = true;
        if (hit) keywordIds.push(f.id);
      });
    }
    var pool = CATS[cat] || CATS.mixed;
    var seed = String(filename || '').length + cat.charCodeAt(0);
    var ordered = pool.slice(seed % pool.length).concat(pool.slice(0, seed % pool.length));
    var ids = [];
    keywordIds.concat(ordered).forEach(function (id) {
      if (ids.indexOf(id) < 0 && findFood(id)) ids.push(id);
    });
    var extra = CATS.mixed.concat(CATS.yellow);
    for (var i = 0; ids.length < 4 && i < extra.length; i++) {
      if (ids.indexOf(extra[i]) < 0) ids.push(extra[i]);
    }
    var conf = [92, 81, 72, 64];
    return ids.slice(0, 4).map(function (id, idx) {
      return { id: id, conf: conf[idx] || 60 };
    });
  }

  function showCandidates() {
    var html = '<h3>选一个最像的</h3><div class="fd-cands">';
    st.pendingCands.forEach(function (c) {
      var f = findFood(c.id);
      if (!f) return;
      html += '<button class="fd-cand" type="button" data-act="pick" data-id="' + f.id + '">' +
        '<span class="sw" style="background:' + f.col + '"></span>' +
        '<span class="t"><b>' + esc(f.n) + '</b><span>' + f.cal + ' kcal · 1 ' + f.u + '</span></span>' +
        '<span class="pc">' + c.conf + '%</span></button>';
    });
    html += '</div><button class="fd-textbtn" type="button" data-act="manual-recog" style="display:block;margin:10px auto 0;">都不像，手动添加</button>';
    openSheet(html);
  }

  /* ================= 手动 / 搜索 ================= */
  function showManual(prefill) {
    var html = '<h3>手动添加</h3>' +
      '<input class="fd-search" id="fd-search" type="text" placeholder="搜索食物，比如 米饭、拉面" value="' + esc(prefill || '') + '">' +
      '<div class="fd-foodlist" id="fd-foodlist">' + foodRows(prefill) + '</div>' +
      '<button class="fd-textbtn" type="button" data-act="custom" style="display:block;margin:10px auto 0;">找不到？自己填一份</button>';
    openSheet(html);
    var inp = root.querySelector('#fd-search');
    if (inp) {
      inp.addEventListener('input', function () {
        var box = root.querySelector('#fd-foodlist');
        if (box) box.innerHTML = foodRows(inp.value);
      });
    }
  }

  function foodRows(q) {
    var kw = String(q || '').trim().toLowerCase();
    var list = FOODS.filter(function (f) {
      if (!kw) return true;
      return (f.n + ' ' + f.syn).toLowerCase().indexOf(kw) >= 0;
    }).slice(0, 60);
    if (!list.length) return '<div class="fd-empty" style="margin:10px;">没有找到，换一个关键词试试</div>';
    return list.map(function (f) {
      return '<div class="fd-foodrow" data-act="food" data-id="' + f.id + '"><i style="background:' + f.col + '"></i>' +
        '<span class="nm">' + esc(f.n) + '</span><span class="kc">' + f.cal + ' kcal</span></div>';
    }).join('');
  }

  /* ================= 记录编辑 ================= */
  function pickFood(id) {
    var f = findFood(id);
    if (!f) return;
    st.editing = {
      foodId: f.id,
      name: f.n,
      portion: 1,
      meal: st.meal || defaultMeal(),
      time: nowTime(),
      note: '',
      base: { cal: f.cal, p: f.p, c: f.c, f: f.f },
      unit: f.u,
      img: st.pendingImg,
      date: st.date,
      isNew: true
    };
    showEdit();
  }

  function openEntry(id) {
    var e = null;
    for (var i = 0; i < data.entries.length; i++) if (data.entries[i].id === id) e = data.entries[i];
    if (!e) return;
    var f = findFood(e.foodId);
    st.editing = {
      id: e.id,
      foodId: e.foodId,
      name: e.name,
      portion: e.portion || 1,
      meal: e.meal || 'snack',
      time: e.time || nowTime(),
      note: e.note || '',
      base: e.base ? { cal: e.base.cal, p: e.base.p, c: e.base.c, f: e.base.f } : { cal: entryCal(e), p: 0, c: 0, f: 0 },
      unit: e.unit || (f ? f.u : '份'),
      img: e.img || '',
      date: e.date,
      isNew: false
    };
    showEdit();
  }

  function showEdit() {
    var e = st.editing;
    if (!e) return;
    var unit = e.unit || '份';
    var html = '<h3>' + (e.isNew ? '记下这一口' : '记录详情') + '</h3>' +
      '<label class="fd-field"><span>食物名称</span><input id="fd-name" type="text" value="' + esc(e.name) + '"></label>' +
      '<div class="fd-row2">' +
        '<label class="fd-field"><span>份量（' + esc(unit) + '）</span><div class="fd-stepper">' +
          '<button type="button" data-act="minus">−</button><span id="fd-portion">' + e.portion + '</span>' +
          '<button type="button" data-act="plus">+</button></div></label>' +
        '<label class="fd-field"><span>时间</span><input id="fd-time" type="time" value="' + esc(e.time) + '"></label>' +
      '</div>' +
      '<div class="fd-field"><span>餐次</span><div class="fd-chips">' +
        MEALS.map(function (m) {
          return '<button class="fd-chip' + (m.k === e.meal ? ' on' : '') + '" type="button" data-act="meal" data-meal="' + m.k + '">' + m.n + '</button>';
        }).join('') + '</div></div>' +
      '<div class="fd-nutri">' +
        nutriInput('cal', '热量', e.base.cal * e.portion) +
        nutriInput('p', '蛋白 g', e.base.p * e.portion) +
        nutriInput('c', '碳水 g', e.base.c * e.portion) +
        nutriInput('f', '脂肪 g', e.base.f * e.portion) +
      '</div>' +
      '<label class="fd-field"><span>备注</span><textarea id="fd-note" placeholder="今天这口的感觉…">' + esc(e.note) + '</textarea></label>' +
      '<div class="fd-btns">' +
        (e.isNew ? '<button class="fd-cancel" type="button" data-act="close-sheet">取消</button>' : '<button class="fd-del" type="button" data-act="del">删除</button>') +
        '<button class="fd-save" type="button" data-act="save">保存</button>' +
      '</div>';
    openSheet(html);
  }

  function nutriInput(key, label, val) {
    return '<label><span>' + label + '</span><input id="fd-' + key + '" type="number" step="0.1" min="0" value="' + round1(val) + '"></label>';
  }

  function adjustPortion(delta) {
    var e = st.editing;
    if (!e) return;
    e.portion = Math.min(5, Math.max(0.5, round1(e.portion + delta)));
    var el = root.querySelector('#fd-portion');
    if (el) el.textContent = e.portion;
    ['cal', 'p', 'c', 'f'].forEach(function (k) {
      var inp = root.querySelector('#fd-' + k);
      if (inp) inp.value = round1((e.base[k] || 0) * e.portion);
    });
  }

  function setMeal(k) {
    if (!st.editing) return;
    st.editing.meal = k;
    var chips = root.querySelectorAll('.fd-chip');
    for (var i = 0; i < chips.length; i++) {
      chips[i].classList.toggle('on', chips[i].getAttribute('data-meal') === k);
    }
  }

  function saveEntry() {
    var e = st.editing;
    if (!e) return;
    var name = (root.querySelector('#fd-name') || {}).value || '';
    name = name.trim();
    if (!name) { toast('先写个名字吧'); return; }
    var portion = Math.min(5, Math.max(0.5, parseFloat(root.querySelector('#fd-portion').textContent) || 1));
    var time = (root.querySelector('#fd-time') || {}).value || nowTime();
    var note = (root.querySelector('#fd-note') || {}).value || '';
    var cal = Math.max(0, parseFloat((root.querySelector('#fd-cal') || {}).value) || 0);
    var p = Math.max(0, parseFloat((root.querySelector('#fd-p') || {}).value) || 0);
    var c = Math.max(0, parseFloat((root.querySelector('#fd-c') || {}).value) || 0);
    var f = Math.max(0, parseFloat((root.querySelector('#fd-f') || {}).value) || 0);

    var entry = {
      id: e.id || uid(),
      date: e.date || st.date,
      time: time,
      meal: e.meal || defaultMeal(),
      foodId: e.foodId || '',
      name: name,
      portion: portion,
      unit: e.unit || '份',
      base: { cal: round1(cal / portion), p: round1(p / portion), c: round1(c / portion), f: round1(f / portion) },
      note: note.trim(),
      img: e.img || '',
      ts: Date.now()
    };

    if (e.isNew) {
      data.entries.push(entry);
    } else {
      for (var i = 0; i < data.entries.length; i++) {
        if (data.entries[i].id === entry.id) { data.entries[i] = entry; break; }
      }
    }
    save();
    closeSheet();
    st.tab = 'today';
    st.date = entry.date;
    render();
    toast('记下了');
  }

  function deleteEntry() {
    var e = st.editing;
    if (!e || e.isNew) return;
    if (!window.confirm('删除这条饮食记录？')) return;
    data.entries = data.entries.filter(function (x) { return x.id !== e.id; });
    save();
    closeSheet();
    render();
    toast('已删除');
  }

  /* ================= 设置 ================= */
  function showSettings() {
    openSheet('<h3>设置</h3>' +
      '<label class="fd-field"><span>每日热量目标（kcal）</span><input id="fd-goal" type="number" min="800" max="4000" step="50" value="' + data.goal + '"></label>' +
      '<div class="fd-tip" style="text-align:left;line-height:1.7;margin:0 0 16px;">热量为常见食物的估算值，仅供参考，不作医疗建议。</div>' +
      '<div class="fd-btns"><button class="fd-save" type="button" data-act="save-goal">保存目标</button></div>' +
      '<button class="fd-textbtn" type="button" data-act="clear" style="display:block;margin:14px auto 0;color:#B5766F;">清空全部饮食记录</button>');
  }

  function saveGoal() {
    var v = parseFloat((root.querySelector('#fd-goal') || {}).value) || 1800;
    data.goal = Math.min(4000, Math.max(800, Math.round(v)));
    save();
    closeSheet();
    render();
    toast('目标已更新');
  }

  function clearAll() {
    if (!window.confirm('清空全部饮食记录？这个操作不能撤销。')) return;
    data.entries = [];
    save();
    closeSheet();
    render();
    toast('已清空');
  }

  /* ================= 分享卡 ================= */
  function showShare() {
    var url = '';
    try { url = drawWeekCard(); } catch (e) { console.error('[Food] share failed', e); }
    if (!url) { toast('分享卡生成失败'); return; }
    st.shareUrl = url;
    openSheet('<h3>这周分享卡</h3><img class="fd-shareimg" src="' + url + '" alt="饮食周报">' +
      '<div class="fd-tip">长按图片可以保存到相册</div>' +
      '<div class="fd-btns"><button class="fd-cancel" type="button" data-act="close-sheet">关闭</button>' +
      '<button class="fd-save" type="button" data-act="download">保存图片</button></div>');
  }

  function downloadShare() {
    if (!st.shareUrl) return;
    try {
      var a = document.createElement('a');
      a.href = st.shareUrl;
      a.download = 'food-week-' + (st.date || todayStr()) + '.jpg';
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast('已保存，去相册看看');
    } catch (e) { toast('保存失败，请长按图片保存'); }
  }

  function drawWeekCard() {
    var W = 720, H = 1120;
    var c = document.createElement('canvas');
    c.width = W; c.height = H;
    var x = c.getContext('2d');

    // 背景
    var bg = x.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#FBF2EC');
    bg.addColorStop(0.5, '#EFF3F9');
    bg.addColorStop(1, '#EAF2EE');
    x.fillStyle = bg;
    x.fillRect(0, 0, W, H);
    blob(x, 80, 60, 230, 'rgba(245,211,220,0.55)');
    blob(x, 650, 120, 260, 'rgba(198,219,240,0.5)');
    blob(x, 360, 1080, 280, 'rgba(214,238,227,0.55)');

    var end = parseDS(st.date);
    var dates = [];
    for (var i = 6; i >= 0; i--) {
      dates.push(ds(new Date(end.getFullYear(), end.getMonth(), end.getDate() - i)));
    }
    var totals = dates.map(dayCal);
    var total = totals.reduce(function (a, b) { return a + b; }, 0);
    var recDays = totals.filter(function (v) { return v > 0; }).length;
    var avg = recDays ? Math.round(total / recDays) : 0;
    var max = Math.max.apply(null, totals.concat([data.goal]));

    // 标题
    x.fillStyle = '#2B2A2E';
    x.font = '600 44px -apple-system,"PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif';
    x.fillText('饮食日记', 56, 108);
    x.fillStyle = '#8A858C';
    x.font = '400 21px -apple-system,"PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif';
    x.fillText(dates[0].replace(/-/g, '.') + ' — ' + dates[6].replace(/-/g, '.'), 56, 146);

    // 总览卡
    card(x, 40, 186, 640, 276);
    x.fillStyle = '#9C979E';
    x.font = '400 20px -apple-system,"PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif';
    x.fillText('最近 7 天摄入', 76, 240);
    x.fillStyle = '#2B2A2E';
    x.font = '600 82px -apple-system,"PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif';
    x.fillText(String(total), 76, 326);
    x.fillStyle = '#9C979E';
    x.font = '400 22px -apple-system,"PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif';
    x.textAlign = 'right';
    x.fillText('kcal', 644, 326);
    x.textAlign = 'left';
    x.fillStyle = '#6E6A70';
    x.font = '400 20px -apple-system,"PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif';
    x.fillText('记录 ' + recDays + ' 天 · 日均 ' + avg + ' kcal · 目标 ' + data.goal, 76, 366);

    // 进度条
    var ratio = data.goal > 0 ? Math.min(1, avg / data.goal) : 0;
    roundRect(x, 76, 396, 568, 14, 7);
    x.fillStyle = 'rgba(255,255,255,0.8)';
    x.fill();
    var pg = x.createLinearGradient(76, 0, 644, 0);
    pg.addColorStop(0, '#F5D3DC');
    pg.addColorStop(1, '#E8AAB9');
    roundRect(x, 76, 396, Math.max(14, 568 * ratio), 14, 7);
    x.fillStyle = pg;
    x.fill();

    // 柱状图卡
    card(x, 40, 490, 640, 300);
    x.fillStyle = '#9C979E';
    x.font = '400 20px -apple-system,"PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif';
    x.fillText('每天的变化', 76, 540);
    var baseY = 738, maxH = 120, bw = 44, gap = (568 - bw * 7) / 6;
    for (var k = 0; k < 7; k++) {
      var bx = 76 + k * (bw + gap);
      var h = max > 0 ? Math.max(4, Math.round(totals[k] / max * maxH)) : 4;
      roundRect(x, bx, baseY - h, bw, h, 10);
      var grad = x.createLinearGradient(0, baseY - h, 0, baseY);
      grad.addColorStop(0, totals[k] ? '#F5D3DC' : 'rgba(232,170,185,0.25)');
      grad.addColorStop(1, totals[k] ? '#E8AAB9' : 'rgba(232,170,185,0.18)');
      x.fillStyle = grad;
      x.fill();
      x.fillStyle = '#9C979E';
      x.font = '400 16px -apple-system,"PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif';
      x.textAlign = 'center';
      x.fillText(WEEKS[parseDS(dates[k]).getDay()].replace('周', ''), bx + bw / 2, 768);
      x.textAlign = 'left';
    }

    // 统计
    var stats = [
      { v: String(recDays), l: '记录天数' },
      { v: String(streakDays()), l: '连续记录' },
      { v: String(avg), l: '日均 kcal' }
    ];
    for (var s = 0; s < 3; s++) {
      card(x, 40 + s * 218, 816, 204, 120);
      x.fillStyle = '#2B2A2E';
      x.font = '600 38px -apple-system,"PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif';
      x.textAlign = 'center';
      x.fillText(stats[s].v, 40 + s * 218 + 102, 872);
      x.fillStyle = '#9C979E';
      x.font = '400 17px -apple-system,"PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif';
      x.fillText(stats[s].l, 40 + s * 218 + 102, 902);
      x.textAlign = 'left';
    }

    // 常吃
    var top = topFoods(dates);
    x.fillStyle = '#6E6A70';
    x.font = '400 20px -apple-system,"PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif';
    x.fillText('这周常吃', 56, 990);
    if (top.length) {
      var names = top.map(function (t) { return t.name + ' ×' + t.count; }).join('    ');
      x.fillStyle = '#2B2A2E';
      x.font = '500 22px -apple-system,"PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif';
      x.fillText(names, 56, 1026);
    } else {
      x.fillStyle = '#9C979E';
      x.font = '400 20px -apple-system,"PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif';
      x.fillText('这周还没有记录', 56, 1026);
    }

    // 页脚
    x.fillStyle = '#9C979E';
    x.font = '400 18px -apple-system,"PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif';
    x.fillText('和梦角一起，好好吃饭', 56, 1080);
    x.textAlign = 'right';
    x.fillText('梦角 · 饮食日记', 664, 1080);
    x.textAlign = 'left';

    try { return c.toDataURL('image/jpeg', 0.92); } catch (e) { return ''; }
  }

  function blob(x, cx, cy, r, color) {
    var g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g;
    x.beginPath();
    x.arc(cx, cy, r, 0, Math.PI * 2);
    x.fill();
  }
  function roundRect(x, left, top, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    x.beginPath();
    x.moveTo(left + r, top);
    x.arcTo(left + w, top, left + w, top + h, r);
    x.arcTo(left + w, top + h, left, top + h, r);
    x.arcTo(left, top + h, left, top, r);
    x.arcTo(left, top, left + w, top, r);
    x.closePath();
  }
  function card(x, left, top, w, h) {
    roundRect(x, left, top, w, h, 28);
    x.fillStyle = 'rgba(255,255,255,0.62)';
    x.fill();
    x.strokeStyle = 'rgba(255,255,255,0.85)';
    x.lineWidth = 1.5;
    x.stroke();
  }

  /* ================= 打开 / 关闭 ================= */
  function open() {
    if (!root) {
      try { buildRoot(); } catch (e) { console.error('[Food] buildRoot failed', e); return; }
    }
    data = load();
    st.tab = 'today';
    st.date = todayStr();
    st.meal = defaultMeal();
    root.classList.add('show');
    document.body.style.overflow = 'hidden';
    try { history.pushState({ zyFood: true }, ''); } catch (e) {}
    render();
  }
  function close() {
    if (!root) return;
    closeSheet();
    st.shareUrl = '';
    root.classList.remove('show');
    document.body.style.overflow = '';
    if (history.state && history.state.zyFood) {
      try { history.back(); } catch (e) {}
    }
  }

  window.XFood = { open: open, close: close };
})();
