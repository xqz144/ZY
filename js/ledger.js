/**
 * 喵喵账本 - 涂鸦风情侣记账
 * 存储键：mengjiao_ledger
 * 模块：
 *   · 双子 tab：明细（月历+当日流水） / 小票（每日小票打印）
 *   · 记一笔：收入/支出切换、分类、金额、备注、日期
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'mengjiao_ledger';
  const VERSION = 1;

  /* =========================
     分类定义（支出 9，收入 3）
     ========================= */
  const EXPENSE_CATS = [
    { key: 'food',   label: '餐饮', icon: 'utensils', cls: 'lg-cat-food' },
    { key: 'shop',   label: '购物', icon: 'shopping-bag', cls: 'lg-cat-shop' },
    { key: 'snack',  label: '零食', icon: 'cookie', cls: 'lg-cat-snack' },
    { key: 'travel', label: '交通', icon: 'car', cls: 'lg-cat-travel' },
    { key: 'phone',  label: '通讯', icon: 'phone', cls: 'lg-cat-phone' },
    { key: 'house',  label: '居家', icon: 'home', cls: 'lg-cat-house' },
    { key: 'fun',    label: '娱乐', icon: 'gamepad-2', cls: 'lg-cat-fun' },
    { key: 'health', label: '健康', icon: 'heart-pulse', cls: 'lg-cat-health' },
    { key: 'other',  label: '其他', icon: 'more-horizontal', cls: 'lg-cat-other' }
  ];
  const INCOME_CATS = [
    { key: 'salary', label: '工资', icon: 'coins', cls: 'lg-cat-salary' },
    { key: 'red',    label: '红包', icon: 'hand-coins', cls: 'lg-cat-red' },
    { key: 'gift',   label: '礼物', icon: 'gift', cls: 'lg-cat-gift' },
    { key: 'other',  label: '其他', icon: 'more-horizontal', cls: 'lg-cat-other' }
  ];
  function getCat(type, key) {
    const arr = type === 'in' ? INCOME_CATS : EXPENSE_CATS;
    return arr.filter(function (c) { return c.key === key; })[0] || arr[arr.length - 1];
  }

  /* =========================
     工具
     ========================= */
  function pad(n) { n = String(n); return n.length < 2 ? '0' + n : n; }
  function todayStr() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function formatCN(dateStr) {
    if (!dateStr) return '';
    var parts = dateStr.split('-').map(Number);
    var d = new Date(parts[0], parts[1] - 1, parts[2]);
    var weekNames = ['日', '一', '二', '三', '四', '五', '六'];
    return (parts[1]) + '月' + parts[2] + '日 星期' + weekNames[d.getDay()];
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function toMoney(n) {
    var v = Number(n || 0);
    return (v < 0 ? '-' : '') + '¥' + Math.abs(v).toFixed(2);
  }
  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function genTicketNo(dateStr) {
    // 用日期+随机数字，不需要绝对唯一
    var d = (dateStr || todayStr()).replace(/-/g, '');
    return d + String(randInt(100, 999));
  }
  function sameDay(a, b) { return a && b && a.slice(0, 10) === b.slice(0, 10); }
  function uid() { return 'id_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  function refreshIcons() {
    try {
      if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
    } catch (e) {}
  }

  /* =========================
     存储
     ========================= */
  function defaultData() {
    return {
      version: VERSION,
      shopName: '喵喵之家',
      tableNo: '520',
      staff: '梦角',
      entries: []
    };
  }
  function migrate(d) {
    if (!d || typeof d !== 'object') d = defaultData();
    if (!d.version) d.version = VERSION;
    if (!d.shopName) d.shopName = '喵喵之家';
    if (!d.tableNo) d.tableNo = '520';
    if (!d.staff) d.staff = '梦角';
    if (!Array.isArray(d.entries)) d.entries = [];
    return d;
  }
  var DATA = defaultData();
  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      DATA = migrate(raw ? JSON.parse(raw) : null);
    } catch (e) { DATA = defaultData(); }
  }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(DATA)); } catch (e) {}
    try {
      if (window.top && window.top !== window.self) window.top.postMessage({ type: 'ledger:sync', entries: DATA.entries.length }, '*');
    } catch (e) {}
  }
  function getData() { return DATA; }

  /* =========================
     状态
     ========================= */
  const calState = {
    year: null,
    month: null, // 0-11
    selDate: null // 'YYYY-MM-DD'
  };
  const ticketState = { date: null };

  function ensureCalInit() {
    if (calState.year == null) {
      var t = new Date();
      calState.year = t.getFullYear();
      calState.month = t.getMonth();
    }
    if (!calState.selDate) calState.selDate = todayStr();
  }

  /* =========================
     Toast + Overlay
     ========================= */
  function toast(msg) {
    var t = document.createElement('div');
    t.className = 'ledger-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { try { t.remove(); } catch (e) {} }, 2000);
  }
  function openOverlay(innerHtml) {
    var ov = document.createElement('div');
    ov.className = 'ledger-overlay';
    ov.innerHTML = innerHtml;
    document.body.appendChild(ov);
    ov.addEventListener('click', function (e) {
      if (e.target === ov) closeOverlay();
    });
    return ov;
  }
  function closeOverlay() {
    var ov = document.querySelector('.ledger-overlay');
    if (ov) ov.remove();
  }

  /* =========================
     月历渲染
     ========================= */
  function renderCalTitle() {
    ensureCalInit();
    var y = document.getElementById('cal-year');
    var m = document.getElementById('cal-month');
    if (y) y.textContent = calState.year + '年';
    if (m) m.textContent = (calState.month + 1) + '月';
  }
  function weekdayOffset(y, month) {
    var first = new Date(y, month, 1);
    return (first.getDay() + 6) % 7; // 周一=0
  }
  function getMonthStats(y, month) {
    var prefix = y + '-' + pad(month + 1) + '-';
    var d = getData();
    var perDay = {}; // { 'DD': {in, out, inCount, outCount} }
    var out = 0, inn = 0;
    d.entries.forEach(function (e) {
      if (e.date && e.date.slice(0, 8) !== prefix) return;
      var day = e.date.slice(8, 10);
      if (!perDay[day]) perDay[day] = { out: 0, in: 0, outCount: 0, inCount: 0 };
      if (e.type === 'in') { perDay[day].in += +e.amount; perDay[day].inCount++; inn += +e.amount; }
      else { perDay[day].out += +e.amount; perDay[day].outCount++; out += +e.amount; }
    });
    // hero
    var monthOut = document.getElementById('month-out');
    var monthIn = document.getElementById('month-in');
    if (monthOut) monthOut.textContent = toMoney(out);
    if (monthIn) monthIn.textContent = toMoney(inn);
    return perDay;
  }
  function renderCalendar() {
    ensureCalInit();
    renderCalTitle();
    var stats = getMonthStats(calState.year, calState.month);
    var grid = document.getElementById('ledger-cal-grid');
    if (!grid) return;
    var days = new Date(calState.year, calState.month + 1, 0).getDate();
    var off = weekdayOffset(calState.year, calState.month);
    var rows = Math.ceil((off + days) / 7);
    var total = rows * 7;
    var today = todayStr();
    var html = '';
    for (var i = 0; i < total; i++) {
      var dayN = i - off + 1;
      if (dayN < 1 || dayN > days) { html += '<div class="ledger-cell empty"></div>'; continue; }
      var ds = calState.year + '-' + pad(calState.month + 1) + '-' + pad(dayN);
      var cls = ['ledger-cell'];
      if (ds === today) cls.push('today');
      if (ds === calState.selDate) cls.push('selected');
      var st = stats[pad(dayN)] || null;
      var amtHtml = '';
      if (st) {
        // 展示绝对值较大的那个，或者都有则展示支出（按日常习惯）
        if (st.out > 0) amtHtml = '<div class="ledger-cell-amt out">' + formatShortAmt(st.out) + '</div>';
        else if (st.in > 0) amtHtml = '<div class="ledger-cell-amt in">+' + formatShortAmt(st.in) + '</div>';
      }
      html += '<div class="' + cls.join(' ') + '" data-date="' + ds + '">' +
          '<span class="ledger-cell-num">' + dayN + '</span>' +
          amtHtml +
        '</div>';
    }
    grid.innerHTML = html;
    refreshIcons();
    grid.querySelectorAll('.ledger-cell:not(.empty)').forEach(function (el) {
      el.addEventListener('click', function () {
        calState.selDate = el.getAttribute('data-date');
        renderCalendar();
        renderDayList();
      });
    });
  }
  function formatShortAmt(n) {
    var v = Number(n || 0);
    if (v >= 1000) return v.toFixed(0);
    return v.toFixed(v === Math.floor(v) ? 0 : (v < 10 ? 2 : 1));
  }
  function moveMonth(delta) {
    ensureCalInit();
    var d = new Date(calState.year, calState.month + delta, 1);
    calState.year = d.getFullYear();
    calState.month = d.getMonth();
    renderCalendar();
  }

  /* =========================
     当日流水
     ========================= */
  function renderDayList() {
    ensureCalInit();
    var d = getData();
    var day = calState.selDate || todayStr();
    var items = d.entries.filter(function (e) { return sameDay(e.date, day); }).sort(function (a, b) {
      // 按时间倒序
      var ta = a.createdAt || 0, tb = b.createdAt || 0;
      return tb - ta;
    });
    var titleEl = document.getElementById('ledger-day-title');
    if (titleEl) {
      titleEl.textContent = sameDay(day, todayStr()) ? '今天 · ' + formatCN(day) : formatCN(day);
    }
    var out = 0, inn = 0;
    items.forEach(function (e) {
      if (e.type === 'in') inn += +e.amount; else out += +e.amount;
    });
    var sumEl = document.getElementById('ledger-day-num');
    if (sumEl) {
      if (inn === 0 && out === 0) sumEl.textContent = '¥0.00';
      else if (inn === 0) sumEl.textContent = toMoney(-out);
      else if (out === 0) sumEl.textContent = '+' + toMoney(inn).replace('¥','');
      else sumEl.textContent = '净 ' + toMoney(inn - out);
    }
    var list = document.getElementById('ledger-day-list');
    if (!list) return;
    if (!items.length) {
      list.innerHTML =
        '<div style="text-align:center;padding:28px 10px 22px;color:var(--text-secondary);">' +
          '<div style="margin:0 auto 10px;width:44px;height:44px;border-radius:50%;background:rgba(var(--accent-color-rgb),0.15);display:flex;align-items:center;justify-content:center;">' +
            '<i data-lucide="clipboard-list" style="width:22px;height:22px;color:var(--accent-color);"></i>' +
          '</div>' +
          '<div style="font-size:13px;font-weight:700;">今天还没有记录哦~</div>' +
          '<div style="font-size:12px;color:var(--text-secondary);margin-top:4px;">点击右下角「记一笔」开始吧</div>' +
        '</div>';
      refreshIcons();
      return;
    }
    list.innerHTML = items.map(function (e) {
      var c = getCat(e.type, e.category);
      return '<div class="ledger-entry" data-id="' + esc(e.id) + '">' +
        '<div class="ledger-entry-icon ' + esc(c.cls) + '"><i data-lucide="' + esc(c.icon) + '"></i></div>' +
        '<div class="ledger-entry-info">' +
          '<div class="ledger-entry-top">' +
            '<span class="ledger-entry-name">' + esc(c.label) + '</span>' +
            '<span class="ledger-entry-amount ' + (e.type === 'in' ? 'in' : 'out') + '">' + (e.type === 'in' ? '+' : '-') + esc(toMoney(e.amount)) + '</span>' +
          '</div>' +
          (e.note ? '<div class="ledger-entry-note">' + esc(e.note) + '</div>' :
            '<div class="ledger-entry-note" style="color:var(--text-secondary);opacity:.55;">点击编辑或删除</div>') +
        '</div>' +
      '</div>';
    }).join('');
    refreshIcons();
    list.querySelectorAll('.ledger-entry').forEach(function (el) {
      el.addEventListener('click', function () {
        var id = el.getAttribute('data-id');
        var found = getData().entries.filter(function (x) { return x.id === id; })[0];
        if (found) openEntryForm(found);
      });
    });
  }

  /* =========================
     记一笔 表单
     ========================= */
  function openEntryForm(entry) {
    const isEdit = !!(entry && entry.id);
    var type = entry ? entry.type : 'out';
    var catKey = entry ? entry.category : (type === 'in' ? INCOME_CATS[0].key : EXPENSE_CATS[0].key);
    var amount = entry ? String(+entry.amount) : '';
    var note = entry ? (entry.note || '') : '';
    var date = entry ? (entry.date || todayStr()) : todayStr();

    function updateCategories() {
      var arr = type === 'in' ? INCOME_CATS : EXPENSE_CATS;
      var wrap = document.getElementById('entry-cats');
      if (!wrap) return;
      wrap.innerHTML = arr.map(function (c) {
        var active = (c.key === catKey);
        return '<div class="ledger-cat-cell' + (active ? ' active' : '') + '" data-k="' + esc(c.key) + '">' +
          '<div class="ledger-cat-icon ' + esc(c.cls) + '"><i data-lucide="' + esc(c.icon) + '"></i></div>' +
          '<div class="ledger-cat-label">' + esc(c.label) + '</div>' +
        '</div>';
      }).join('');
      refreshIcons();
      wrap.querySelectorAll('.ledger-cat-cell').forEach(function (cell) {
        cell.addEventListener('click', function () {
          catKey = cell.getAttribute('data-k');
          updateCategories();
        });
      });
    }

    openOverlay(
      '<div class="ledger-sheet">' +
        '<div class="ledger-sheet-head">' +
          '<div class="ledger-sheet-title" style="text-align:center;flex:1;">' + (isEdit ? '编辑记录' : '记一笔') + '</div>' +
          '<button class="ledger-sheet-close" id="entry-close">×</button>' +
        '</div>' +
        '<div class="ledger-seg" id="entry-seg">' +
          '<button class="out' + (type === 'out' ? ' active' : '') + '" data-t="out">支出</button>' +
          '<button class="in' + (type === 'in' ? ' active' : '') + '" data-t="in">收入</button>' +
        '</div>' +
        '<div class="ledger-field" style="margin-top:14px;">' +
          '<label class="ledger-field-label">金额</label>' +
          '<input class="ledger-amount-input" id="entry-amount" type="number" inputmode="decimal" min="0" step="0.01" placeholder="¥0.00" value="' + esc(amount) + '">' +
        '</div>' +
        '<div class="ledger-field">' +
          '<label class="ledger-field-label">分类</label>' +
          '<div class="ledger-cat-grid" id="entry-cats"></div>' +
        '</div>' +
        '<div class="ledger-field">' +
          '<label class="ledger-field-label">日期</label>' +
          '<input type="date" id="entry-date" value="' + esc(date) + '">' +
        '</div>' +
        '<div class="ledger-field">' +
          '<label class="ledger-field-label">备注</label>' +
          '<textarea id="entry-note" placeholder="写点什么…">' + esc(note) + '</textarea>' +
        '</div>' +
        '<div class="ledger-sheet-actions">' +
          (isEdit ? '<button class="ledger-btn ledger-btn-danger" id="entry-del">删除</button>' : '') +
          '<button class="ledger-btn ledger-btn-ghost" id="entry-cancel">取消</button>' +
          '<button class="ledger-btn ledger-btn-primary" id="entry-save">' + (isEdit ? '保存' : '添加') + '</button>' +
        '</div>' +
      '</div>');

    document.getElementById('entry-close').addEventListener('click', closeOverlay);
    document.getElementById('entry-cancel').addEventListener('click', closeOverlay);

    document.querySelectorAll('#entry-seg button').forEach(function (b) {
      b.addEventListener('click', function () {
        type = b.getAttribute('data-t');
        document.querySelectorAll('#entry-seg button').forEach(function (x) {
          x.classList.remove('active');
        });
        b.classList.add('active');
        // 切换分类时，如果当前分类不存在于新类型，就默认第一个
        var arr = type === 'in' ? INCOME_CATS : EXPENSE_CATS;
        if (!arr.some(function (c) { return c.key === catKey; })) catKey = arr[0].key;
        updateCategories();
      });
    });

    if (isEdit) {
      document.getElementById('entry-del').addEventListener('click', function () {
        DATA.entries = DATA.entries.filter(function (x) { return x.id !== entry.id; });
        save(); closeOverlay(); renderAll();
        toast('已删除');
      });
    }

    document.getElementById('entry-save').addEventListener('click', function () {
      var amt = parseFloat(document.getElementById('entry-amount').value);
      if (!amt || amt <= 0) { toast('请填写金额'); return; }
      var dt = document.getElementById('entry-date').value || todayStr();
      var nt = document.getElementById('entry-note').value.trim();
      if (isEdit) {
        entry.type = type;
        entry.category = catKey;
        entry.amount = +amt.toFixed(2);
        entry.date = dt;
        entry.note = nt;
      } else {
        DATA.entries.push({
          id: uid(),
          type: type,
          category: catKey,
          amount: +amt.toFixed(2),
          date: dt,
          note: nt,
          createdAt: Date.now()
        });
      }
      save(); closeOverlay(); renderAll();
      toast(isEdit ? '已保存' : '已记录');
    });

    updateCategories();
  }

  /* =========================
     小票视图
     ========================= */
  function ensureTicketInit() { if (!ticketState.date) ticketState.date = todayStr(); }
  function moveTicketDay(delta) {
    ensureTicketInit();
    var parts = ticketState.date.split('-').map(Number);
    var d = new Date(parts[0], parts[1] - 1, parts[2]);
    d.setDate(d.getDate() + delta);
    ticketState.date = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    renderTicket();
  }
  function renderTicketHeader() {
    ensureTicketInit();
    var el = document.getElementById('ticket-day-label');
    if (!el) return;
    el.textContent = sameDay(ticketState.date, todayStr()) ? '今天 · ' + formatCN(ticketState.date) : formatCN(ticketState.date);
  }
  function renderTicket() {
    ensureTicketInit();
    renderTicketHeader();
    var d = getData();
    var day = ticketState.date;
    var items = d.entries.filter(function (e) { return sameDay(e.date, day); });

    document.getElementById('ticket-shop').textContent = d.shopName || '喵喵之家';
    document.getElementById('ticket-table').textContent = d.tableNo || '520';
    document.getElementById('ticket-staff').textContent = d.staff || '梦角';
    document.getElementById('ticket-date').textContent = day;
    document.getElementById('ticket-no').textContent = genTicketNo(day);

    // 分组（按分类聚合出 单价/次数/小计 给支出；收入单独列为一行）
    var groups = {}; // catKey -> { type, label, total, maxPrice, count }
    var outTotal = 0, inTotal = 0;
    items.forEach(function (e) {
      var cat = getCat(e.type, e.category);
      var k = e.type + ':' + e.category;
      if (!groups[k]) groups[k] = {
        type: e.type,
        key: e.category,
        label: cat.label,
        total: 0, maxPrice: 0, count: 0
      };
      groups[k].total += +e.amount;
      groups[k].count += 1;
      if (+e.amount > groups[k].maxPrice) groups[k].maxPrice = +e.amount;
      if (e.type === 'in') inTotal += +e.amount; else outTotal += +e.amount;
    });

    var listEl = document.getElementById('ticket-list');
    if (!items.length) {
      listEl.innerHTML =
        '<div style="text-align:center;padding:16px 0 10px;color:#999;font-size:12px;">当天没有消费记录 ~</div>';
    } else {
      var keys = Object.keys(groups).sort(function (a, b) {
        // 支出在前，按 total desc
        var ga = groups[a], gb = groups[b];
        if (ga.type !== gb.type) return ga.type === 'out' ? -1 : 1;
        return gb.total - ga.total;
      });
      listEl.innerHTML = keys.map(function (k) {
        var g = groups[k];
        var max = g.count > 0 ? Number(g.maxPrice).toFixed(2) : '0.00';
        return '<div class="ledger-ticket-row' + (g.type === 'in' ? ' income-row' : '') + '">' +
          '<span>' + esc(g.label) + (g.type === 'in' ? '（收）' : '') + '</span>' +
          '<span>' + max + '</span>' +
          '<span>' + g.count + '</span>' +
          '<span>' + Number(g.total).toFixed(2) + '</span>' +
        '</div>';
      }).join('');
    }
    var total = outTotal;
    var income = inTotal;
    var balance = income - total;
    var totalEl = document.getElementById('ticket-total');
    if (totalEl) totalEl.textContent = toMoney(total);
    var incEl = document.getElementById('ticket-income');
    if (incEl) incEl.textContent = toMoney(income);
    var balEl = document.getElementById('ticket-balance');
    if (balEl) {
      balEl.textContent = toMoney(balance);
      balEl.classList.remove('neg', 'pos');
      balEl.classList.add(balance < 0 ? 'neg' : 'pos');
    }
  }
  function copyTicketText() {
    ensureTicketInit();
    var d = getData();
    var day = ticketState.date;
    var items = d.entries.filter(function (e) { return sameDay(e.date, day); });
    var rows = [];
    rows.push('[' + (d.shopName || '喵喵之家') + '] 消费单');
    rows.push('日期：' + day);
    rows.push('单号：' + genTicketNo(day));
    rows.push('桌号：' + (d.tableNo || '520') + '  服务员：' + (d.staff || '梦角'));
    rows.push('------------------------------------');
    rows.push('消费类别        单价   次  小计');
    var groups = {};
    var outTotal = 0, inTotal = 0;
    items.forEach(function (e) {
      var cat = getCat(e.type, e.category);
      var k = e.type + ':' + e.category;
      if (!groups[k]) groups[k] = { type: e.type, label: cat.label, total: 0, maxPrice: 0, count: 0 };
      groups[k].total += +e.amount;
      groups[k].count += 1;
      if (+e.amount > groups[k].maxPrice) groups[k].maxPrice = +e.amount;
      if (e.type === 'in') inTotal += +e.amount; else outTotal += +e.amount;
    });
    var keys = Object.keys(groups).sort(function (a, b) {
      var ga = groups[a], gb = groups[b];
      if (ga.type !== gb.type) return ga.type === 'out' ? -1 : 1;
      return gb.total - ga.total;
    });
    if (!keys.length) { rows.push('当天暂无消费记录'); }
    keys.forEach(function (k) {
      var g = groups[k];
      rows.push(
        (g.label + (g.type === 'in' ? '(收)' : '')).padEnd(10, ' ') + '  ' +
        Number(g.maxPrice).toFixed(2).padStart(7, ' ') + '  ' +
        String(g.count).padStart(2, ' ') + '  ' +
        Number(g.total).toFixed(2).padStart(8, ' ')
      );
    });
    rows.push('------------------------------------');
    rows.push('消费合计：' + toMoney(outTotal));
    rows.push('今日收入：' + toMoney(inTotal));
    var bal = inTotal - outTotal;
    rows.push('今日结余：' + toMoney(bal));
    var text = rows.join('\n');
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      ta.remove();
      if (!ok && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { toast('已复制小票文本'); });
        return;
      }
      toast(ok ? '已复制小票文本' : '复制失败');
    } catch (e) { toast('复制失败'); }
  }
  function printTicket() {
    // 用 window.print + 样式仅隐藏 body，显示小票
    var wrap = document.getElementById('ledger-ticket-wrap');
    if (!wrap) return;
    var el = wrap.querySelector('.ledger-ticket');
    if (!el) return;
    var id = 'ledger-print';
    var existed = document.getElementById(id);
    if (existed) existed.remove();
    var st = document.createElement('style');
    st.id = id;
    st.textContent =
      '@media print {' +
        'body * { visibility: hidden !important; } ' +
        '.' + el.className.split(/\s+/)[0] + ', ' +
        '.' + el.className.split(/\s+/)[0] + ' * { visibility: visible !important; } ' +
        '.ledger-ticket { position: absolute; left: 0; top: 0; box-shadow: none !important; max-width: 80mm; } ' +
      '}';
    document.head.appendChild(st);
    try { window.print(); } catch (e) {}
    setTimeout(function () {
      var s = document.getElementById(id);
      if (s) s.remove();
    }, 1000);
  }

  /* =========================
     子 tab 切换
     ========================= */
  function switchSubTab(name) {
    document.querySelectorAll('.ledger-subtab').forEach(function (t) {
      t.classList.toggle('active', t.getAttribute('data-subtab') === name);
    });
    document.querySelectorAll('.ledger-subpanel').forEach(function (p) {
      p.classList.toggle('active', p.getAttribute('data-subpanel') === name);
    });
    refreshIcons();
    if (name === 'calendar') {
      renderCalendar();
      renderDayList();
    } else {
      renderTicket();
    }
  }

  /* =========================
     绑定事件
     ========================= */
  function bindEvents() {
    document.querySelectorAll('.ledger-subtab').forEach(function (t) {
      t.addEventListener('click', function () { switchSubTab(t.getAttribute('data-subtab')); });
    });
    var addBtn = document.getElementById('ledger-add-btn');
    if (addBtn) addBtn.addEventListener('click', function () { openEntryForm(null); });

    var pM = document.getElementById('cal-prev');
    if (pM) pM.addEventListener('click', function () { moveMonth(-1); });
    var nM = document.getElementById('cal-next');
    if (nM) nM.addEventListener('click', function () { moveMonth(1); });

    var pD = document.getElementById('ticket-prev-day');
    if (pD) pD.addEventListener('click', function () { moveTicketDay(-1); });
    var nD = document.getElementById('ticket-next-day');
    if (nD) nD.addEventListener('click', function () { moveTicketDay(1); });

    var cBtn = document.getElementById('ticket-copy');
    if (cBtn) cBtn.addEventListener('click', copyTicketText);
    var sBtn = document.getElementById('ticket-share');
    if (sBtn) sBtn.addEventListener('click', printTicket);
  }

  /* =========================
     入口
     ========================= */
  function renderAll() {
    ensureCalInit();
    renderCalendar();
    renderDayList();
    renderTicket();
  }

  function init() {
    load();
    bindEvents();
    renderAll();
    refreshIcons();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
