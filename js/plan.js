/**
 * 朝夕计划 - plan.js
 * 科学四象限 · 多视图日历 · 专注计时 · 数据统计
 * 数据存储：localStorage（独立存储，不影响朝夕心记）
 */

/* ========== 全局状态 ========== */
const PLAN_STORAGE_KEY = 'plan_app_data_v1';

let planData = {
    tasks: [],          // [{id, text, category, urgent, important, dueDate, dueTime, note, done, createdAt, completedAt}]
    focusRecords: [],   // [{id, taskId, duration, startTime, endTime, completed}]
    settings: {
        categories: [
            {id:'work', name:'工作', icon:'💼', color:'#4d96ff'},
            {id:'life', name:'生活', icon:'🏠', color:'#6bcb77'},
            {id:'study', name:'学习', icon:'📚', color:'#a29bfe'},
            {id:'health', name:'健康', icon:'💪', color:'#fd79a8'},
            {id:'other', name:'其他', icon:'📌', color:'#95a5a6'}
        ],
        defaultFocusMin: 25,
        focusSound: 'bell'
    }
};

// UI 状态
let planState = {
    currentPage: 'list',
    currentVTab: 'month',
    currentFTab: 'timer',
    currentSTab: 'list',
    currentRange: 'month',
    currentCategory: 'all',
    calYear: 0,
    calMonth: 0,
    focusTaskId: null,
    focusMin: 25,
    focusRemaining: 25 * 60,
    focusTimer: null,
    focusRunning: false,
    focusInterval: null,
    editingTaskId: null,
    selectedDate: null
};

/* ========== 工具函数 ========== */
function $(id) { return document.getElementById(id); }
function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function nowTs() { return Date.now(); }

function loadPlanData() {
    try {
        const raw = localStorage.getItem(PLAN_STORAGE_KEY);
        if (raw) {
            const saved = JSON.parse(raw);
            if (saved.tasks) planData.tasks = saved.tasks;
            if (saved.focusRecords) planData.focusRecords = saved.focusRecords;
            if (saved.settings) planData.settings = {...planData.settings, ...saved.settings};
        }
    } catch(e) { console.warn('加载计划数据失败', e); }
}

function savePlanData() {
    try {
        localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(planData));
    } catch(e) {}
}

function uid() { return Date.now() + '_' + Math.random().toString(36).slice(2,8); }

function getCategory(id) {
    return planData.settings.categories.find(c => c.id === id) || planData.settings.categories[4];
}

function isUrgent(t) { return t.urgent === true || t.urgent === 'true'; }
function isImportant(t) { return t.important === true || t.important === 'true'; }

/* ========== 导航 ========== */
function switchPage(page) {
    planState.currentPage = page;
    document.querySelectorAll('.plan-page').forEach(p => p.classList.toggle('active', p.dataset.page === page));
    document.querySelectorAll('.plan-nav-btn').forEach(b => b.classList.toggle('active', b.dataset.nav === page));

    // 懒加载
    if (page === 'list') renderListPage();
    if (page === 'view') renderViewPage();
    if (page === 'focus') renderFocusPage();
    if (page === 'stats') renderStatsPage();
    if (page === 'profile') renderProfilePage();
}

/* ========== 清单页（四象限） ========== */
function renderListPage() {
    if (planState.calYear === 0) {
        const d = new Date();
        planState.calYear = d.getFullYear();
        planState.calMonth = d.getMonth();
    }
    $('listCalMonth').textContent = `${planState.calYear}年${planState.calMonth + 1}月`;
    renderMiniCal();
    renderQuadrants();
    renderFilter();
}

function renderMiniCal() {
    const container = $('listMiniCal');
    if (!container) return;

    const y = planState.calYear, m = planState.calMonth;
    const firstDay = new Date(y, m, 1);
    const lastDay = new Date(y, m + 1, 0);
    const daysInMonth = lastDay.getDate();
    let startDow = firstDay.getDay(); // 0=周日
    startDow = startDow === 0 ? 6 : startDow - 1; // 转换为周一=0

    const today = todayStr();
    const tasksByDate = {};
    planData.tasks.filter(t => !t.done).forEach(t => {
        if (t.dueDate) {
            const d = t.dueDate.slice(0,10);
            if (!tasksByDate[d]) tasksByDate[d] = 0;
            tasksByDate[d]++;
        }
    });

    let html = '<div class="plan-mini-cal-weekdays"><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span><span>日</span></div><div class="plan-mini-cal-days">';

    for (let i = 0; i < startDow; i++) html += '<div class="plan-mini-day" style="visibility:hidden;"></div>';

    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const cls = ['plan-mini-day'];
        if (dateStr === today) cls.push('today');
        if (dateStr === planState.selectedDate) cls.push('selected');
        if (tasksByDate[dateStr]) cls.push('has-tasks');
        html += `<div class="${cls.join(' ')}" data-date="${dateStr}">${d}</div>`;
    }

    html += '</div>';
    container.innerHTML = html;

    container.querySelectorAll('.plan-mini-day[data-date]').forEach(el => {
        el.addEventListener('click', () => {
            planState.selectedDate = el.dataset.date;
            renderMiniCal();
        });
    });
}

function renderFilter() {
    const el = $('listCalFilter');
    if (!el) return;
    const cat = planState.currentCategory;
    el.querySelector('span').textContent = cat === 'all' ? '全部分类' : getCategory(cat).name;
}

function renderQuadrants() {
    const tasks = planData.tasks.filter(t => {
        if (planState.currentCategory !== 'all' && (t.category || 'other') !== planState.currentCategory) return false;
        if (planState.selectedDate && t.dueDate && t.dueDate.slice(0,10) !== planState.selectedDate) return false;
        return true;
    });

    const pending = tasks.filter(t => !t.done);
    const done = tasks.filter(t => t.done);

    const q1 = pending.filter(t => isUrgent(t) && isImportant(t));
    const q2 = pending.filter(t => !isUrgent(t) && isImportant(t));
    const q3 = pending.filter(t => isUrgent(t) && !isImportant(t));
    const q4 = pending.filter(t => !isUrgent(t) && !isImportant(t));

    const qEls = {q1, q2, q3, q4};
    Object.keys(qEls).forEach(q => {
        const el = $('list' + q.toUpperCase());
        if (!el) return;
        el.innerHTML = qEls[q].length === 0 ? '<div class="plan-quad-empty">暂无任务</div>' :
            qEls[q].map(t => renderQuadItem(t)).join('');
    });

    // 为已完成项追加到 q4
    if (done.length > 0) {
        const el = $('listQ4');
        el.innerHTML += '<div style="font-size:11px;color:#999;margin-top:10px;font-weight:600;">已完成</div>';
        el.innerHTML += done.map(t => renderQuadItem(t)).join('');
    }

    // 绑定事件
    bindQuadrantEvents();
}

function renderQuadItem(task) {
    const cat = getCategory(task.category);
    const time = task.dueTime ? ` ${task.dueTime}` : '';
    let dueLabel = '';
    if (task.dueDate) {
        const overdue = !task.done && new Date(task.dueDate + 'T' + (task.dueTime || '23:59')) < new Date();
        const date = new Date(task.dueDate);
        dueLabel = `<span class="${overdue ? 'plan-quad-overdue' : ''}">${overdue ? '逾期 ' : ''}${date.getMonth()+1}/${date.getDate()}${time}</span>`;
    }
    return `
        <div class="plan-quad-item ${task.done ? 'done' : ''}" data-id="${task.id}">
            <div class="plan-quad-check" data-check="${task.id}">${task.done ? '<i class="fas fa-check"></i>' : ''}</div>
            <div class="plan-quad-content">
                <div class="plan-quad-text">${cat.icon} ${escapeHtml(task.text)}</div>
                <div class="plan-quad-meta">
                    <span>${cat.name}</span>
                    ${dueLabel}
                </div>
            </div>
        </div>
    `;
}

function bindQuadrantEvents() {
    document.querySelectorAll('.plan-quad-item').forEach(item => {
        const id = item.dataset.id;
        item.querySelectorAll('[data-check]').forEach(cb => {
            cb.addEventListener('click', e => { e.stopPropagation(); toggleTask(Number(cb.dataset.check)); });
        });
        item.addEventListener('click', () => openTaskModal(id));
    });
}

/* ========== 多视图日历 ========== */
function renderViewPage() {
    if (planState.calYear === 0) {
        const d = new Date();
        planState.calYear = d.getFullYear();
        planState.calMonth = d.getMonth();
    }
    $('viewCalMonth').textContent = `${planState.calYear}年${planState.calMonth + 1}月`;
    renderViewFilter();
    renderMonthView();
}

function renderViewFilter() {
    const el = $('viewCalFilter');
    if (!el) return;
    const cat = planState.currentCategory;
    el.querySelector('span').textContent = cat === 'all' ? '全部分类' : getCategory(cat).name;
}

function renderMonthView() {
    const grid = $('viewMonthGrid');
    if (!grid) return;

    const y = planState.calYear, m = planState.calMonth;
    const firstDay = new Date(y, m, 1);
    const lastDay = new Date(y, m + 1, 0);
    const daysInMonth = lastDay.getDate();
    let startDow = firstDay.getDay();
    startDow = startDow === 0 ? 6 : startDow - 1;

    const today = todayStr();
    const tasksByDate = {};
    getFilteredTasks().forEach(t => {
        if (t.dueDate) {
            const d = t.dueDate.slice(0,10);
            if (!tasksByDate[d]) tasksByDate[d] = [];
            tasksByDate[d].push(t);
        }
    });

    let html = '<div class="plan-month-weekdays"><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span><span>日</span></div><div class="plan-month-days">';

    for (let i = 0; i < startDow; i++) html += '<div class="plan-month-cell other-month" style="visibility:hidden;"></div>';

    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const cls = ['plan-month-cell'];
        if (dateStr === today) cls.push('today');
        const dayTasks = tasksByDate[dateStr] || [];
        let content = '';
        dayTasks.slice(0, 3).forEach(t => {
            const cat = getCategory(t.category);
            content += `<div class="plan-month-bar ${cat.id}">${escapeHtml(t.text)}</div>`;
        });
        if (dayTasks.length > 3) content += `<div style="font-size:9px;color:#999;">+${dayTasks.length - 3}</div>`;

        html += `<div class="${cls.join(' ')}" data-date="${dateStr}"><div class="plan-month-cell-num">${d}</div><div class="plan-month-cell-content">${content}</div></div>`;
    }

    html += '</div>';
    grid.innerHTML = html;

    grid.querySelectorAll('.plan-month-cell[data-date]').forEach(cell => {
        cell.addEventListener('click', () => showDayDetail(cell.dataset.date));
    });
}

function renderWeekView() {
    const grid = $('viewWeekGrid');
    if (!grid) return;

    const today = new Date();
    const dayOfWeek = today.getDay() || 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - dayOfWeek + 1);
    if (dayOfWeek === 7) monday.setDate(today.getDate() - 6);

    const weekDays = ['一','二','三','四','五','六','日'];
    const tasksByDate = {};
    getFilteredTasks().forEach(t => {
        if (t.dueDate) {
            const d = t.dueDate.slice(0,10);
            if (!tasksByDate[d]) tasksByDate[d] = [];
            tasksByDate[d].push(t);
        }
    });

    let html = '<div class="plan-week-days">';
    for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        const dateStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
        const isToday = dateStr === todayStr();
        const dayTasks = tasksByDate[dateStr] || [];
        html += `<div class="plan-week-col ${isToday ? 'plan-week-col-today' : ''}">
            <div class="plan-week-col-head">周${weekDays[i]}</div>
            <div class="plan-week-num">${date.getDate()}</div>
            ${dayTasks.map(t => {
                const cat = getCategory(t.category);
                return `<div class="plan-week-bar ${cat.id}" data-id="${t.id}">${escapeHtml(t.text)}</div>`;
            }).join('')}
        </div>`;
    }
    html += '</div>';
    grid.innerHTML = html;

    grid.querySelectorAll('.plan-week-bar').forEach(bar => {
        bar.addEventListener('click', () => openTaskModal(bar.dataset.id));
    });
}

function renderDayView() {
    const container = $('viewDayView');
    if (!container) return;

    const date = new Date(planState.calYear, planState.calMonth, 1);
    const today = todayStr();
    const weekDays = ['周日','周一','周二','周三','周四','周五','周六'];

    const tasks = getFilteredTasks()
        .filter(t => t.dueDate && t.dueDate.slice(0,10) === today)
        .sort((a,b) => (a.dueTime || '99:99').localeCompare(b.dueTime || '99:99'));

    let html = `<div class="plan-day-header">
        <div class="plan-day-date">${today}</div>
        <div class="plan-day-week">${weekDays[date.getDay()]}</div>
    </div>`;

    if (tasks.length === 0) {
        html += '<div style="text-align:center;padding:40px 20px;color:#bbb;">今天还没有安排哦~</div>';
    } else {
        html += '<div class="plan-day-timeline">';
        tasks.forEach(t => {
            const cat = getCategory(t.category);
            html += `<div class="plan-day-item ${t.done ? 'done' : ''}" data-id="${t.id}">
                <div class="plan-day-time">${t.dueTime || '--:--'}</div>
                <div class="plan-day-dot" style="background:${cat.color};"></div>
                <div class="plan-day-content">${cat.icon} ${escapeHtml(t.text)}${t.done ? ' ✓' : ''}</div>
            </div>`;
        });
        html += '</div>';
    }

    container.innerHTML = html;
    container.querySelectorAll('.plan-day-item').forEach(item => {
        item.addEventListener('click', () => openTaskModal(item.dataset.id));
    });
}

function getFilteredTasks() {
    return planData.tasks.filter(t => {
        if (planState.currentCategory !== 'all' && (t.category || 'other') !== planState.currentCategory) return false;
        return true;
    });
}

/* ========== 专注计时 ========== */
function renderFocusPage() {
    updateFocusTimerUI();
    renderFocusPresets();
    const task = planData.tasks.find(t => t.id === planState.focusTaskId);
    const taskPicker = $('focusTaskPicker');
    if (taskPicker) {
        taskPicker.querySelector('span').textContent = task ? `📌 ${task.text}` : '关联任务';
    }
}

function renderFocusPresets() {
    document.querySelectorAll('.plan-preset-btn').forEach(btn => {
        btn.classList.toggle('active', Number(btn.dataset.min) === planState.focusMin);
    });
}

function updateFocusTimerUI() {
    const m = Math.floor(planState.focusRemaining / 60);
    const s = planState.focusRemaining % 60;
    $('timerMin').textContent = String(m).padStart(2,'0');
    $('timerSec').textContent = String(s).padStart(2,'0');

    // SVG 圆环进度
    const progress = $('timerProgress');
    if (progress) {
        const total = planState.focusMin * 60;
        const ratio = planState.focusRemaining / total;
        const circumference = 534; // 2π * 85
        progress.style.strokeDashoffset = circumference * (1 - ratio);
    }

    // 按钮状态
    const startBtn = $('focusStart');
    const startText = $('focusStartText');
    if (planState.focusRunning) {
        startBtn.classList.add('running');
        startBtn.innerHTML = '<i class="fas fa-pause"></i> 暂停';
    } else {
        startBtn.classList.remove('running');
        startBtn.innerHTML = '<i class="fas fa-play"></i> 开始专注';
    }
}

function startFocusTimer() {
    if (planState.focusRunning) return;
    planState.focusRunning = true;
    planState.focusInterval = setInterval(() => {
        planState.focusRemaining--;
        if (planState.focusRemaining <= 0) {
            planState.focusRemaining = 0;
            stopFocusTimer(true);
        }
        updateFocusTimerUI();
    }, 1000);
    updateFocusTimerUI();
}

function pauseFocusTimer() {
    planState.focusRunning = false;
    if (planState.focusInterval) { clearInterval(planState.focusInterval); planState.focusInterval = null; }
    updateFocusTimerUI();
}

function stopFocusTimer(completed) {
    planState.focusRunning = false;
    if (planState.focusInterval) { clearInterval(planState.focusInterval); planState.focusInterval = null; }

    if (completed) {
        // 记录专注
        planData.focusRecords.push({
            id: uid(),
            taskId: planState.focusTaskId,
            duration: planState.focusMin,
            completed: true,
            timestamp: nowTs()
        });
        savePlanData();
        // 提示
        if (typeof window.showNotification === 'function') {
            window.showNotification('专注完成！太棒了 🎉', 'success');
        } else {
            alert('专注完成！太棒了 🎉');
        }
        planState.focusRemaining = planState.focusMin * 60;
    }
    updateFocusTimerUI();
}

function resetFocusTimer() {
    pauseFocusTimer();
    planState.focusRemaining = planState.focusMin * 60;
    updateFocusTimerUI();
}

/* ========== 数据统计 ========== */
function renderStatsPage() {
    const range = planState.currentRange;
    let dateRangeText = '';
    const now = new Date();
    let startDate;

    if (range === 'week') {
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 6);
        dateRangeText = `${startDate.getFullYear()}年${startDate.getMonth()+1}月${startDate.getDate()}日 ~ ${now.getMonth()+1}月${now.getDate()}日`;
    } else if (range === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        dateRangeText = `${now.getFullYear()}年${now.getMonth()+1}月1日 ~ ${now.getMonth()+1}月${now.getDate()}日`;
    } else if (range === 'year') {
        startDate = new Date(now.getFullYear(), 0, 1);
        dateRangeText = `${now.getFullYear()}年1月1日 ~ ${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日`;
    } else {
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 29);
        dateRangeText = `${startDate.getMonth()+1}月${startDate.getDate()}日 ~ ${now.getMonth()+1}月${now.getDate()}日`;
    }

    $('statsDateRange').textContent = dateRangeText;

    // 计算统计
    const totalTasks = planData.tasks.filter(t => {
        if (!t.createdAt) return true;
        return t.createdAt >= startDate.getTime();
    });

    const success = totalTasks.filter(t => t.done).length;
    const fail = totalTasks.filter(t => !t.done && t.dueDate && new Date(t.dueDate) < now).length;
    const miss = totalTasks.filter(t => !t.done && !t.dueDate).length;
    const rate = totalTasks.length > 0 ? Math.round(success / totalTasks.length * 100) : 0;

    $('statSuccess').textContent = success;
    $('statFail').textContent = fail;
    $('statMiss').textContent = miss;
    $('statRate').textContent = rate + '%';

    renderPieChart(totalTasks);
    renderTrendChart(startDate, now);
}

function renderPieChart(tasks) {
    const canvas = $('planPieChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const cx = 100, cy = 100, r = 75;

    // 分类统计
    const stats = {q1:0, q2:0, q3:0, q4:0};
    tasks.filter(t => t.done).forEach(t => {
        if (isUrgent(t) && isImportant(t)) stats.q1++;
        else if (!isUrgent(t) && isImportant(t)) stats.q2++;
        else if (isUrgent(t) && !isImportant(t)) stats.q3++;
        else stats.q4++;
    });

    const total = Object.values(stats).reduce((a,b) => a+b, 0);
    const items = [
        {key:'q1', label:'重要且紧急', value:stats.q1, color:'#ff6b6b'},
        {key:'q2', label:'重要不紧急', value:stats.q2, color:'#fdd86f'},
        {key:'q3', label:'紧急不重要', value:stats.q3, color:'#ff8a4c'},
        {key:'q4', label:'不重要不紧急', value:stats.q4, color:'#4d96ff'}
    ];

    ctx.clearRect(0, 0, 200, 200);

    if (total === 0) {
        ctx.fillStyle = '#eee';
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#999';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('暂无打卡数据', cx, cy);
    } else {
        let startAngle = -Math.PI / 2;
        items.forEach(item => {
            if (item.value === 0) return;
            const angle = (item.value / total) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, r, startAngle, startAngle + angle);
            ctx.closePath();
            ctx.fillStyle = item.color;
            ctx.fill();
            startAngle += angle;
        });
        // 中心白圆
        ctx.beginPath();
        ctx.arc(cx, cy, 40, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.fillStyle = '#333';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(total + '次', cx, cy - 5);
        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#999';
        ctx.fillText('完成打卡', cx, cy + 12);
    }

    // 图例
    const legend = $('planPieLegend');
    if (legend) {
        legend.innerHTML = items.map(it => {
            const pct = total > 0 ? Math.round(it.value / total * 100) : 0;
            return `<div class="plan-legend-item">
                <div class="plan-legend-dot" style="background:${it.color};"></div>
                <span>${it.label}</span>
                <span class="plan-legend-val">${it.value}次 ${pct}%</span>
            </div>`;
        }).join('');
    }
}

function renderTrendChart(startDate, endDate) {
    const canvas = $('planTrendChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = 320, h = 120;
    ctx.clearRect(0, 0, w, h);

    // 生成最近7天数据
    const days = [];
    const data = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(endDate);
        d.setDate(endDate.getDate() - i);
        const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        days.push(d.getMonth() + 1 + '/' + d.getDate());
        const count = planData.tasks.filter(t => {
            return t.done && t.dueDate && t.dueDate.slice(0,10) === ds;
        }).length;
        data.push(count);
    }

    const maxVal = Math.max(...data, 3);
    const barW = 32;
    const gap = (w - barW * 7) / 8;
    const baseY = h - 20;

    // 画网格线
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
        const y = 15 + (h - 35) * i / 3;
        ctx.beginPath();
        ctx.moveTo(gap, y);
        ctx.lineTo(w - gap, y);
        ctx.stroke();
    }

    // 画柱
    data.forEach((val, i) => {
        const x = gap + i * (barW + gap);
        const barH = val > 0 ? ((h - 40) * val / maxVal) : 2;
        const y = baseY - barH;

        const gradient = ctx.createLinearGradient(x, y, x, baseY);
        gradient.addColorStop(0, '#ff8a5c');
        gradient.addColorStop(1, '#ffb199');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        const r = 6;
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + barW - r, y);
        ctx.quadraticCurveTo(x + barW, y, x + barW, y + r);
        ctx.lineTo(x + barW, baseY);
        ctx.lineTo(x, baseY);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.fill();

        // 日期标签
        ctx.fillStyle = '#999';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(days[i], x + barW / 2, h - 5);

        // 数值
        if (val > 0) {
            ctx.fillStyle = '#333';
            ctx.font = 'bold 11px sans-serif';
            ctx.fillText(val, x + barW / 2, y - 4);
        }
    });

    // 轴线
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(gap, baseY);
    ctx.lineTo(w - gap, baseY);
    ctx.stroke();
}

/* ========== 我的页 ========== */
function renderProfilePage() {
    // 头像
    const avatarImg = $('planProfileAvatarImg');
    if (avatarImg) {
        try {
            if (typeof window.getPartnerAvatar === 'function') {
                const a = window.getPartnerAvatar();
                if (a && a.startsWith('http')) avatarImg.src = a;
            }
        } catch(e) {}
    }

    const total = planData.tasks.length;
    const done = planData.tasks.filter(t => t.done).length;
    const focusMin = planData.focusRecords.reduce((s, r) => s + r.duration, 0);

    $('profileTotalTasks').textContent = total;
    $('profileDoneTasks').textContent = done;
    $('profileFocusMin').textContent = focusMin;
}

/* ========== 任务 CRUD ========== */
function openTaskModal(id) {
    const task = id ? planData.tasks.find(t => t.id === id) : null;
    planState.editingTaskId = id || null;

    $('taskModalTitle').textContent = task ? '编辑任务' : '新建任务';
    $('taskInput').value = task ? task.text : '';
    $('taskCategory').value = task ? (task.category || 'other') : 'work';
    $('taskUrgent').value = task ? String(isUrgent(task)) : 'false';
    $('taskImportant').value = task ? String(isImportant(task)) : 'true';
    $('taskDate').value = task && task.dueDate ? task.dueDate.slice(0,10) : '';
    $('taskTime').value = task && task.dueTime ? task.dueTime : '';
    $('taskNote').value = task ? (task.note || '') : '';

    fillCategorySelect('taskCategory');
    showModal('planTaskModal');
}

function saveTask() {
    const text = $('taskInput').value.trim();
    if (!text) { alert('请输入任务内容'); return; }

    const task = {
        id: planState.editingTaskId || uid(),
        text: text,
        category: $('taskCategory').value,
        urgent: $('taskUrgent').value === 'true',
        important: $('taskImportant').value === 'true',
        dueDate: $('taskDate').value || null,
        dueTime: $('taskTime').value || null,
        note: $('taskNote').value.trim(),
        done: false,
        createdAt: nowTs()
    };

    if (planState.editingTaskId) {
        const idx = planData.tasks.findIndex(t => t.id === planState.editingTaskId);
        if (idx >= 0) {
            task.done = planData.tasks[idx].done;
            task.createdAt = planData.tasks[idx].createdAt;
            planData.tasks[idx] = task;
        }
    } else {
        planData.tasks.push(task);
    }

    savePlanData();
    hideModal('planTaskModal');
    renderListPage();
}

function toggleTask(id) {
    const t = planData.tasks.find(t => t.id === id);
    if (!t) return;
    t.done = !t.done;
    if (t.done) t.completedAt = nowTs();
    else delete t.completedAt;
    savePlanData();
    renderListPage();
    // 如果在视图页也需要刷新
    if (planState.currentPage === 'view') renderViewPage();
}

function deleteTask(id) {
    if (!confirm('确定删除这个任务吗？')) return;
    planData.tasks = planData.tasks.filter(t => t.id !== id);
    savePlanData();
    renderListPage();
    hideModal('planDayModal');
}

function fillCategorySelect(selectId) {
    const sel = $(selectId);
    if (!sel) return;
    const current = sel.value;
    sel.innerHTML = planData.settings.categories.map(c =>
        `<option value="${c.id}">${c.icon} ${c.name}</option>`
    ).join('');
    sel.value = current;
}

/* ========== 分类筛选弹窗 ========== */
function showFilterModal() {
    const body = $('filterModalBody');
    const items = [{id:'all', name:'全部分类', icon:'📋', color:'#333'}, ...planData.settings.categories];
    body.innerHTML = items.map(c => `
        <div class="plan-filter-item ${planState.currentCategory === c.id ? 'active' : ''}" data-cat="${c.id}">
            <div class="plan-filter-icon">${c.icon}</div>
            <div class="plan-filter-name">${c.name}</div>
            ${planState.currentCategory === c.id ? '<div class="plan-filter-check"><i class="fas fa-check"></i></div>' : ''}
        </div>
    `).join('');

    body.querySelectorAll('.plan-filter-item').forEach(item => {
        item.addEventListener('click', () => {
            planState.currentCategory = item.dataset.cat;
            hideModal('planFilterModal');
            // 刷新当前页面
            if (planState.currentPage === 'list') renderListPage();
            if (planState.currentPage === 'view') renderViewPage();
        });
    });

    showModal('planFilterModal');
}

/* ========== 关联任务弹窗 ========== */
function showTaskPicker() {
    const body = $('taskPickerBody');
    const available = planData.tasks.filter(t => !t.done);
    if (available.length === 0) {
        body.innerHTML = '<div style="text-align:center;padding:30px;color:#bbb;">暂无待完成任务</div>';
    } else {
        body.innerHTML = available.map(t => {
            const cat = getCategory(t.category);
            return `<div class="plan-filter-item ${planState.focusTaskId === t.id ? 'active' : ''}" data-id="${t.id}">
                <div class="plan-filter-icon">${cat.icon}</div>
                <div class="plan-filter-name">${escapeHtml(t.text)}</div>
                ${planState.focusTaskId === t.id ? '<div class="plan-filter-check"><i class="fas fa-check"></i></div>' : ''}
            </div>`;
        }).join('');
    }

    body.querySelectorAll('.plan-filter-item').forEach(item => {
        item.addEventListener('click', () => {
            const id = item.dataset.id;
            planState.focusTaskId = planState.focusTaskId === id ? null : id;
            hideModal('planTaskPickerModal');
            renderFocusPage();
        });
    });

    showModal('planTaskPickerModal');
}

/* ========== 日期详情 ========== */
function showDayDetail(dateStr) {
    const tasks = planData.tasks.filter(t => t.dueDate && t.dueDate.slice(0,10) === dateStr);
    const pending = tasks.filter(t => !t.done);
    const done = tasks.filter(t => t.done);
    const date = new Date(dateStr);
    const weekDays = ['周日','周一','周二','周三','周四','周五','周六'];

    $('dayModalTitle').textContent = `${date.getMonth()+1}月${date.getDate()}日 ${weekDays[date.getDay()]}`;

    let html = '';
    if (pending.length === 0 && done.length === 0) {
        html = '<div style="text-align:center;padding:30px;color:#bbb;">这一天没有任务</div>';
    } else {
        if (pending.length > 0) {
            html += '<div style="font-size:12px;font-weight:600;color:#666;margin-bottom:10px;">待完成</div>';
            pending.forEach(t => {
                const cat = getCategory(t.category);
                html += renderDayTaskItem(t);
            });
        }
        if (done.length > 0) {
            html += '<div style="font-size:12px;font-weight:600;color:#666;margin:14px 0 10px;">已完成</div>';
            done.forEach(t => {
                html += renderDayTaskItem(t);
            });
        }
    }

    $('dayModalBody').innerHTML = html;

    // 绑定事件
    $('dayModalBody').querySelectorAll('.plan-day-task-check').forEach(cb => {
        cb.addEventListener('click', e => {
            e.stopPropagation();
            toggleTask(cb.dataset.check);
            showDayDetail(dateStr); // 刷新
            if (planState.currentPage === 'list') renderListPage();
            if (planState.currentPage === 'view') renderViewPage();
        });
    });
    $('dayModalBody').querySelectorAll('.plan-day-task-item').forEach(item => {
        item.addEventListener('dblclick', () => deleteTask(item.dataset.id));
    });

    showModal('planDayModal');
}

function renderDayTaskItem(t) {
    const cat = getCategory(t.category);
    const time = t.dueTime || '';
    return `<div class="plan-day-task-item ${t.done ? 'done' : ''}" data-id="${t.id}">
        <div class="plan-day-task-check" data-check="${t.id}">${t.done ? '<i class="fas fa-check"></i>' : ''}</div>
        <div class="plan-day-task-content">
            <div class="plan-day-task-text">${cat.icon} ${escapeHtml(t.text)}</div>
            <div class="plan-day-task-meta">${cat.name} ${time}</div>
        </div>
    </div>`;
}

/* ========== 弹窗工具 ========== */
function showModal(id) {
    const el = $(id);
    if (el) el.classList.add('active');
}

function hideModal(id) {
    const el = $(id);
    if (el) el.classList.remove('active');
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}

/* ========== 事件绑定 ========== */
function bindEvents() {
    // 底部导航
    document.querySelectorAll('.plan-nav-btn').forEach(btn => {
        btn.addEventListener('click', () => switchPage(btn.dataset.nav));
    });

    // 视图切换标签
    document.querySelectorAll('.plan-view-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.plan-view-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            planState.currentVTab = tab.dataset.vtab;
            document.querySelectorAll('.plan-view-content').forEach(c => {
                c.classList.toggle('active', c.dataset.vcontent === tab.dataset.vtab);
            });
            if (tab.dataset.vtab === 'week') renderWeekView();
            if (tab.dataset.vtab === 'day') renderDayView();
            if (tab.dataset.vtab === 'month') renderMonthView();
        });
    });

    // 专注标签
    document.querySelectorAll('.plan-focus-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.plan-focus-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            planState.currentFTab = tab.dataset.ftab;
        });
    });

    // 统计标签
    document.querySelectorAll('.plan-stats-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.plan-stats-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            planState.currentSTab = tab.dataset.stab;
        });
    });

    // 时间范围
    document.querySelectorAll('.plan-range-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.plan-range-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            planState.currentRange = btn.dataset.range;
            renderStatsPage();
        });
    });

    // 日历导航
    $('listCalPrev').addEventListener('click', () => { planState.calMonth--; if (planState.calMonth < 0) {planState.calMonth=11;planState.calYear--;} renderListPage(); });
    $('listCalNext').addEventListener('click', () => { planState.calMonth++; if (planState.calMonth > 11) {planState.calMonth=0;planState.calYear++;} renderListPage(); });
    $('listCalToday').addEventListener('click', () => { const d=new Date(); planState.calYear=d.getFullYear(); planState.calMonth=d.getMonth(); planState.selectedDate=null; renderListPage(); });
    $('listCalFilter').addEventListener('click', showFilterModal);

    $('viewCalPrev').addEventListener('click', () => { planState.calMonth--; if (planState.calMonth < 0) {planState.calMonth=11;planState.calYear--;} renderViewPage(); });
    $('viewCalNext').addEventListener('click', () => { planState.calMonth++; if (planState.calMonth > 11) {planState.calMonth=0;planState.calYear++;} renderViewPage(); });
    $('viewCalFilter').addEventListener('click', showFilterModal);

    // FAB
    $('listFab').addEventListener('click', () => openTaskModal(null));

    // 任务弹窗
    $('taskModalClose').addEventListener('click', () => hideModal('planTaskModal'));
    $('taskModalCancel').addEventListener('click', () => hideModal('planTaskModal'));
    $('taskModalSave').addEventListener('click', saveTask);

    // 筛选弹窗
    $('filterModalClose').addEventListener('click', () => hideModal('planFilterModal'));

    // 关联任务弹窗
    $('focusTaskPicker').addEventListener('click', showTaskPicker);
    $('taskPickerClose').addEventListener('click', () => hideModal('planTaskPickerModal'));

    // 日期弹窗
    $('dayModalClose').addEventListener('click', () => hideModal('planDayModal'));

    // 专注预设
    document.querySelectorAll('.plan-preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            planState.focusMin = Number(btn.dataset.min);
            planState.focusRemaining = planState.focusMin * 60;
            resetFocusTimer();
        });
    });

    // 专注控制
    $('focusStart').addEventListener('click', () => {
        if (planState.focusRunning) pauseFocusTimer();
        else startFocusTimer();
    });
    $('focusReset').addEventListener('click', resetFocusTimer);

    // 我的页菜单
    document.querySelectorAll('.plan-menu-item').forEach(item => {
        item.addEventListener('click', () => {
            const action = item.dataset.action;
            if (action === 'about') {
                alert('朝夕计划 v1.0\n科学四象限 · 多视图日历 · 专注计时 · 数据统计');
            } else if (action === 'data-export') {
                const data = JSON.stringify(planData, null, 2);
                const blob = new Blob([data], {type:'application/json'});
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `plan-backup-${todayStr()}.json`;
                a.click();
                URL.revokeObjectURL(url);
            } else if (action === 'data-import') {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'application/json';
                input.onchange = e => {
                    const file = e.target.files[0];
                    const reader = new FileReader();
                    reader.onload = ev => {
                        try {
                            const imported = JSON.parse(ev.target.result);
                            if (imported.tasks) planData.tasks = imported.tasks;
                            if (imported.focusRecords) planData.focusRecords = imported.focusRecords;
                            savePlanData();
                            renderProfilePage();
                            alert('导入成功！');
                        } catch(err) { alert('导入失败：' + err.message); }
                    };
                    reader.readAsText(file);
                };
                input.click();
            } else {
                alert('功能开发中...');
            }
        });
    });

    // ESC 关闭弹窗
    document.querySelectorAll('.plan-modal').forEach(modal => {
        modal.addEventListener('click', e => {
            if (e.target === modal) modal.classList.remove('active');
        });
    });

    // 状态栏时间
    function updateTime() {
        const d = new Date();
        $('planStatusTime').textContent = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    }
    updateTime();
    setInterval(updateTime, 30000);
}

/* ========== 初始化 ========== */
document.addEventListener('DOMContentLoaded', () => {
    loadPlanData();
    bindEvents();
    renderListPage();
    // 如果从主页跳转过来，自动打开对应页面
    const params = new URLSearchParams(window.location.search);
    const page = params.get('page');
    if (page && ['list','view','focus','stats','profile'].includes(page)) {
        switchPage(page);
    }
});
