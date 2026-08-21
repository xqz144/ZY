/**
 * 朝夕计划 - plan.js
 * 对齐新 plan.html 结构（涂鸦风 / lucide icons / 新类名）
 */

const PLAN_KEY = 'plan_app_v4';

let planData = {
    tasks: [],
    focusRecords: [],
    settings: {
        categories: [
            {id:'work', name:'工作', icon:'💼', color:'#7BB3D9'},
            {id:'life', name:'生活', icon:'🏠', color:'#6BCB77'},
            {id:'study', name:'学习', icon:'📚', color:'#B4A5E8'},
            {id:'health', name:'健康', icon:'💪', color:'#FF9EC4'},
            {id:'other', name:'其他', icon:'📌', color:'#C4B8AB'}
        ],
        focusMin: 25
    }
};

let S = {
    panel: 'list',
    vtab: 'month',
    range: 'month',
    category: 'all',
    calY: 0, calM: 0,
    focusTaskId: null,
    focusMin: 25,
    focusRemain: 25 * 60,
    focusRunning: false,
    focusTimer: null,
    editingId: null
};

/* ============ 工具 ============ */
function $(id) { return document.getElementById(id); }
function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }
function esc(s) { const d=document.createElement('div'); d.textContent=s||''; return d.innerHTML; }
function isU(t) { return t.urgent===true || t.urgent==='true'; }
function isI(t) { return t.important===true || t.important==='true'; }
function catOf(id) { return planData.settings.categories.find(c=>c.id===id) || planData.settings.categories[4]; }

function load() {
    try { const r = localStorage.getItem(PLAN_KEY); if (r) {
        const d = JSON.parse(r);
        if (d.tasks) planData.tasks = d.tasks;
        if (d.focusRecords) planData.focusRecords = d.focusRecords;
        if (d.settings) planData.settings = {...planData.settings, ...d.settings};
    }} catch(e){}
}
function save() { localStorage.setItem(PLAN_KEY, JSON.stringify(planData)); }

/* ============ 主 Tab 切换 ============ */
function switchPanel(panel) {
    S.panel = panel;
    document.querySelectorAll('.plan-subtab').forEach(b => {
        b.classList.toggle('active', b.dataset.subtab === panel);
    });
    document.querySelectorAll('.plan-subpanel').forEach(el => {
        el.classList.toggle('active', el.dataset.subpanel === panel);
    });
    if (panel === 'list') renderList();
    if (panel === 'view') renderView();
    if (panel === 'focus') renderFocus();
    if (panel === 'stats') renderStats();
    if (panel === 'profile') renderProfile();
}

/* ============ 清单页 ============ */
function renderList() {
    if (!S.calY) { const d=new Date(); S.calY=d.getFullYear(); S.calM=d.getMonth(); }
    $('listYear').textContent = S.calY + '年';
    $('listMonth').textContent = (S.calM+1) + '月';
    renderMiniCal();
    renderQuads();
    renderFilterText();
}

function renderMiniCal() {
    const c = $('listMiniCal'); if (!c) return;
    const y=S.calY, m=S.calM;
    const dim = new Date(Date.UTC(y, m+1, 0)).getUTCDate();
    let sd = new Date(Date.UTC(y, m, 1)).getUTCDay();
    sd = sd===0 ? 6 : sd-1; // 周一=0

    const today = todayStr();
    const tasksByDate = {};
    planData.tasks.filter(t=>!t.done).forEach(t=>{
        if (t.dueDate) { const d=t.dueDate.slice(0,10); if(!tasksByDate[d])tasksByDate[d]=[]; tasksByDate[d].push(t); }
    });

    let h = '';
    for (let i=0;i<sd;i++) h += '<div class="plan-cal-cell empty"></div>';
    for (let d=1; d<=dim; d++) {
        const ds = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const cls = ['plan-cal-cell'];
        if (ds===today) cls.push('today');
        const dayTasks = tasksByDate[ds] || [];
        const dots = dayTasks.slice(0,4).map(t=>{
            const c = catOf(t.category);
            return `<span style="background:${c.color}"></span>`;
        }).join('');
        h += `<div class="${cls.join(' ')}" data-date="${ds}">
            <div class="plan-cal-cell-num">${d}</div>
            ${dots?`<div class="plan-cal-cell-dots">${dots}</div>`:''}
        </div>`;
    }
    c.innerHTML = h;
    if (window.lucide) lucide.createIcons();
    c.querySelectorAll('.plan-cal-cell:not(.empty)').forEach(el => {
        el.addEventListener('click', () => showDayModal(el.dataset.date));
    });
}

function renderFilterText() {
    const el = $('listFilterText');
    if (!el) return;
    el.textContent = S.category==='all' ? '全部分类' : catOf(S.category).name;
}

function getFiltered() {
    return planData.tasks.filter(t => S.category==='all' || (t.category||'other')===S.category);
}

function renderQuads() {
    const tasks = getFiltered();
    const p = tasks.filter(t=>!t.done);
    const d = tasks.filter(t=>t.done);
    const q1 = p.filter(t=>isU(t)&&isI(t));
    const q2 = p.filter(t=>!isU(t)&&isI(t));
    const q3 = p.filter(t=>isU(t)&&!isI(t));
    const q4 = p.filter(t=>!isU(t)&&!isI(t));

    const qMap = {q1,q2,q3,q4};
    ['q1','q2','q3','q4'].forEach(q => {
        const el = $('list'+q.toUpperCase()); if (!el) return;
        const arr = qMap[q];
        if (arr.length===0) {
            el.innerHTML = `<div class="plan-qempty">暂无任务</div>`;
        } else {
            el.innerHTML = arr.map(renderQItem).join('');
        }
    });

    // 已完成追加到 q4
    if (d.length>0) {
        const el = $('listQ4');
        el.innerHTML += `<div style="font-size:11px;color:var(--text-secondary);margin-top:8px;font-weight:700;border-top:1px dashed rgba(var(--accent-color-rgb),0.4);padding-top:6px;">已完成 ${d.length}</div>`;
        el.innerHTML += d.map(renderQItem).join('');
    }

    bindQuadEvents();
}

function renderQItem(t) {
    const c = catOf(t.category);
    let meta = '';
    if (t.dueDate) {
        const d=new Date(t.dueDate+(t.dueTime||'23:59'));
        const ov = !t.done && d<new Date();
        const md = `${d.getMonth()+1}/${d.getDate()}${t.dueTime?' '+t.dueTime:''}`;
        meta = `<div class="plan-qmeta ${ov?'overdue':''}">${ov?'逾期':'·'} ${c.name} · ${md}</div>`;
    }
    return `<div class="plan-qitem ${t.done?'done':''}" data-id="${t.id}">
        <div class="plan-qcheck" data-check="${t.id}">${t.done?'<i data-lucide="check"></i>':''}</div>
        <div class="plan-qcontent">
            <div class="plan-qtext">${c.icon} ${esc(t.text)}</div>
            ${meta}
        </div>
    </div>`;
}

function bindQuadEvents() {
    if (window.lucide) lucide.createIcons();
    document.querySelectorAll('.plan-qitem').forEach(it => {
        const check = it.querySelector('[data-check]');
        if (check) check.addEventListener('click', e => {
            e.stopPropagation();
            toggleTask(it.dataset.id);
        });
        it.addEventListener('dblclick', () => openTaskModal(it.dataset.id));
    });
}

/* ============ 农历/班休 工具 ============ */
// 简化版农历（仅显示日序"初一~三十"，节气不展示）+ 法定班休占位
const LUNAR_DAYS = ['初一','初二','初三','初四','初五','初六','初七','初八','初九','初十',
    '十一','十二','十三','十四','十五','十六','十七','十八','十九','二十',
    '廿一','廿二','廿三','廿四','廿五','廿六','廿七','廿八','廿九','三十'];
function getLunarDayStr(y, m, d) {
    // 近似：按儒略日偏移（不精确但视觉够用，1900-01-31 对应农历 1900 正月初一）
    const base = new Date(1900, 0, 31).getTime();
    const diffDays = Math.floor((new Date(y, m, d).getTime() - base) / 86400000);
    // 简化：每年354天（粗糙近似），但保证稳定输出
    const lunarMonths = [29,30,29,30,29,30,29,30,29,30,29,30];
    let rem = diffDays % 354;
    if (rem < 0) rem += 354;
    for (let i = 0; i < 12; i++) {
        if (rem < lunarMonths[i]) {
            return LUNAR_DAYS[rem];
        }
        rem -= lunarMonths[i];
    }
    return LUNAR_DAYS[rem % 30];
}
// 班休：简化 —— 周六=休 周日=休；1号若在月末附近作特殊（默认周末休，其他工作日"班"不展示，只有节假日再打休）
function getWorkOffTag(y, m, d) {
    const dow = new Date(Date.UTC(y, m, d)).getUTCDay();
    if (dow === 0 || dow === 6) return 'off';
    return null;
}
// 被选中的日期（用户点击）
if (!S.selectedDate) S.selectedDate = todayStr();

/* ============ 视图页 ============ */
function renderView() {
    if (!S.calY) { const d=new Date(); S.calY=d.getFullYear(); S.calM=d.getMonth(); }
    $('viewBigYear').textContent = S.calY;
    $('viewBigMonth').textContent = String(S.calM+1).padStart(2,'0');
    const ft = $('viewFilterText'); if (ft) ft.textContent = S.category==='all' ? '全部分类' : catOf(S.category).name;
    if (S.vtab === 'month') renderMonthView();
    if (S.vtab === 'week') renderWeekView();
    if (S.vtab === 'day') renderDayView();
}

function renderMonthView() {
    const g = $('viewMonthGrid'); if (!g) return;
    const y=S.calY, m=S.calM;
    const dim = new Date(Date.UTC(y, m+1, 0)).getUTCDate();
    let sd = new Date(Date.UTC(y, m, 1)).getUTCDay();
    sd = sd===0 ? 6 : sd-1; // 周一=0
    const today = todayStr();
    const sel = S.selectedDate;

    const tbd = {};
    getFiltered().forEach(t => {
        if (t.dueDate) { const d=t.dueDate.slice(0,10); if(!tbd[d])tbd[d]=[]; tbd[d].push(t); }
    });

    let h = '';
    for (let i=0;i<sd;i++) h += '<div class="plan-vcell empty"></div>';
    for (let d=1; d<=dim; d++) {
        const ds = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const cls = ['plan-vcell'];
        if (ds===today) cls.push('today');
        if (ds===sel) cls.push('selected');
        const dayTs = tbd[ds] || [];
        const lun = getLunarDayStr(y,m,d);
        const wt = getWorkOffTag(y,m,d);
        const tag = wt ? `<div class="plan-vtag ${wt}">${wt==='off'?'休':'班'}</div>` : '';

        let pills = '';
        const max = 3;
        dayTs.slice(0, max).forEach(t => {
            pills += `<div class="plan-vpill ${catOf(t.category).id}">${catOf(t.category).icon}${esc(t.text)}</div>`;
        });
        if (dayTs.length > max) pills += `<div class="plan-vpill more">+${dayTs.length-max} 更多</div>`;

        h += `<div class="${cls.join(' ')}" data-date="${ds}">
            <div class="plan-vheadrow">
                <div class="plan-vnum">${d}</div>
                <div class="plan-vlunar">${lun}</div>
            </div>
            ${tag}
            <div class="plan-vpills">${pills}</div>
        </div>`;
    }
    g.innerHTML = h;
    g.querySelectorAll('.plan-vcell[data-date]').forEach(c => {
        c.addEventListener('click', () => {
            S.selectedDate = c.dataset.date;
            renderMonthView();
            showDayModal(c.dataset.date);
        });
    });
}

function renderWeekView() {
    const g = $('viewWeekGrid'); if (!g) return;
    const now = new Date();
    const dow = now.getDay() || 7;
    const mon = new Date(now);
    mon.setDate(now.getDate() - dow + (dow===7?-6:1));
    const wkds = ['一','二','三','四','五','六','日'];
    const tbd = {};
    getFiltered().forEach(t => {
        if (t.dueDate) { const d=t.dueDate.slice(0,10); if(!tbd[d])tbd[d]=[]; tbd[d].push(t); }
    });
    const today = todayStr();
    const sel = S.selectedDate;
    let h = '';
    for (let i=0;i<7;i++) {
        const dt = new Date(mon); dt.setDate(mon.getDate()+i);
        const ds = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
        const isToday = ds===today;
        const isSel = ds===sel;
        const ts = tbd[ds] || [];
        const pills = ts.map(t=>`<div class="plan-vpill ${catOf(t.category).id}" data-id="${t.id}">${catOf(t.category).icon}${esc(t.text)}</div>`).join('');
        h += `<div class="plan-vweek-cell ${isToday?'today':''} ${isSel?'selected':''}" data-date="${ds}">
            <div class="plan-vweek-cell-head">周${wkds[i]}</div>
            <div class="plan-vweek-cell-num">${dt.getDate()}</div>
            <div class="plan-vweek-pills">${pills}</div>
        </div>`;
    }
    g.innerHTML = h;
    g.querySelectorAll('.plan-vweek-cell').forEach(c => {
        c.addEventListener('click', (e) => {
            const pill = e.target.closest('.plan-vpill');
            if (pill && pill.dataset.id) { e.stopPropagation(); openTaskModal(pill.dataset.id); return; }
            S.selectedDate = c.dataset.date;
            renderWeekView();
            showDayModal(c.dataset.date);
        });
    });
}

function renderDayView() {
    const c = $('viewDayView'); if (!c) return;
    const tgt = S.selectedDate || todayStr();
    const wkds = ['周日','周一','周二','周三','周四','周五','周六'];
    const tasks = getFiltered().filter(t => t.dueDate && t.dueDate.slice(0,10)===tgt).sort((a,b)=>(a.dueTime||'99').localeCompare(b.dueTime||'99'));
    const dt = new Date(tgt + 'T00:00');
    let h = `<div class="plan-vday-head">
        <div class="plan-vday-date">${tgt}</div>
        <div class="plan-vday-week">${wkds[dt.getDay()]}</div>
    </div>`;
    if (tasks.length===0) {
        h += '<div style="text-align:center;padding:30px 20px;color:var(--text-secondary);font-weight:700;">今天还没有安排哦~</div>';
    } else {
        h += '<div class="plan-vday-list">';
        tasks.forEach(t => {
            const cat = catOf(t.category);
            h += `<div class="plan-vday-item" data-id="${t.id}">
                <div class="plan-vday-time">${t.dueTime||'--:--'}</div>
                <div class="plan-vday-dot" style="background:${cat.color};"></div>
                <div style="flex:1;">
                    <div class="plan-vday-text">${cat.icon} ${esc(t.text)}${t.done?' ✓':''}</div>
                    <div class="plan-vday-extra">${cat.name}${t.note?' · '+t.note:''}</div>
                </div>
            </div>`;
        });
        h += '</div>';
    }
    c.innerHTML = h;
    c.querySelectorAll('.plan-vday-item').forEach(it => {
        it.addEventListener('click', () => openTaskModal(it.dataset.id));
    });
}

/* ============ 专注页 ============ */
function renderFocus() {
    const task = planData.tasks.find(t => t.id===S.focusTaskId);
    const nameEl = $('focusTaskName');
    if (nameEl) nameEl.textContent = task ? `📌 ${task.text}` : '关联任务';
    updateTimer();
}

function updateTimer() {
    const m = Math.floor(S.focusRemain/60), s = S.focusRemain%60;
    $('timerMin').textContent = String(m).padStart(2,'0');
    $('timerSec').textContent = String(s).padStart(2,'0');
    const p = $('timerProgress');
    if (p) {
        const total = S.focusMin*60;
        const ratio = S.focusRemain/total;
        const circ = 597;
        p.style.strokeDashoffset = circ * (1-ratio);
    }
    const btn = $('focusStart');
    const txt = $('focusStartText');
    if (!btn || !txt) return;
    if (S.focusRunning) {
        btn.classList.add('running');
        btn.innerHTML = '<i data-lucide="pause"></i><span>暂停</span>';
    } else {
        btn.classList.remove('running');
        btn.innerHTML = '<i data-lucide="play"></i><span>开始专注</span>';
    }
    if (window.lucide) lucide.createIcons();
}

function startFocus() {
    if (S.focusRunning) return;
    S.focusRunning = true;
    S.focusTimer = setInterval(() => {
        S.focusRemain--;
        if (S.focusRemain<=0) { S.focusRemain=0; stopFocus(true); }
        updateTimer();
    }, 1000);
    updateTimer();
}
function pauseFocus() {
    S.focusRunning = false;
    if (S.focusTimer) { clearInterval(S.focusTimer); S.focusTimer=null; }
    updateTimer();
}
function stopFocus(done) {
    S.focusRunning = false;
    if (S.focusTimer) { clearInterval(S.focusTimer); S.focusTimer=null; }
    if (done) {
        planData.focusRecords.push({id:uid(), taskId:S.focusTaskId, duration:S.focusMin, completed:true, ts:Date.now()});
        save();
        alert('专注完成！太棒了 🎉');
        S.focusRemain = S.focusMin*60;
    }
    updateTimer();
}
function resetFocus() {
    pauseFocus();
    S.focusRemain = S.focusMin*60;
    updateTimer();
}

/* ============ 统计页 ============ */
function renderStats() {
    const now = new Date();
    let start, dateRange;
    if (S.range==='week') {
        start = new Date(now); start.setDate(now.getDate()-6);
        dateRange = `${start.getMonth()+1}月${start.getDate()}日 ~ ${now.getMonth()+1}月${now.getDate()}日`;
    } else if (S.range==='month') {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        dateRange = `${now.getFullYear()}年${now.getMonth()+1}月1日 ~ ${now.getMonth()+1}月${now.getDate()}日`;
    } else if (S.range==='year') {
        start = new Date(now.getFullYear(), 0, 1);
        dateRange = `${now.getFullYear()}年全年`;
    } else {
        start = new Date(now); start.setDate(now.getDate()-29);
        dateRange = `${start.getMonth()+1}月${start.getDate()}日 ~ ${now.getMonth()+1}月${now.getDate()}日`;
    }
    const d = $('statsDate'); if (d) d.textContent = dateRange;

    const inRange = planData.tasks.filter(t => !t.createdAt || t.createdAt >= start.getTime());
    const total = inRange.length;
    const success = inRange.filter(t=>t.done).length;
    const fail = inRange.filter(t=>!t.done && t.dueDate && new Date(t.dueDate+'T23:59')<now).length;
    const miss = inRange.filter(t=>!t.done && !t.dueDate).length;
    const rate = total>0 ? Math.round(success/total*100) : 0;

    $('statSuccess').textContent = success;
    $('statFail').textContent = fail;
    $('statMiss').textContent = miss;
    $('statRate').textContent = rate + '%';

    drawPie(inRange);
    drawTrend(start, now);
}

function drawPie(tasks) {
    const cvs = $('pieChart'); if (!cvs) return;
    const ctx = cvs.getContext('2d');
    const cx=100, cy=100, r=80;

    const stats = {q1:0,q2:0,q3:0,q4:0};
    tasks.filter(t=>t.done).forEach(t => {
        if (isU(t)&&isI(t)) stats.q1++;
        else if (!isU(t)&&isI(t)) stats.q2++;
        else if (isU(t)&&!isI(t)) stats.q3++;
        else stats.q4++;
    });
    const total = Object.values(stats).reduce((a,b)=>a+b,0);
    const items = [
        {k:'q1',l:'重要且紧急',v:stats.q1,c:'#e5655b'},
        {k:'q2',l:'重要不紧急',v:stats.q2,c:'#5a9d6f'},
        {k:'q3',l:'紧急不重要',v:stats.q3,c:'#c58a3e'},
        {k:'q4',l:'不重要不紧急',v:stats.q4,c:'#7a7a7a'}
    ];

    ctx.clearRect(0,0,200,200);
    if (total===0) {
        ctx.fillStyle='#f0f0f0';
        ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle='#1a1a1a'; ctx.lineWidth=2; ctx.stroke();
        ctx.fillStyle='#7a7a7a';
        ctx.font='bold 12px sans-serif'; ctx.textAlign='center';
        ctx.fillText('暂无打卡数据', cx, cy);
    } else {
        let sa = -Math.PI/2;
        items.forEach(it => {
            if (it.v===0) return;
            const a = (it.v/total)*Math.PI*2;
            ctx.beginPath();
            ctx.moveTo(cx,cy); ctx.arc(cx,cy,r,sa,sa+a); ctx.closePath();
            ctx.fillStyle=it.c; ctx.fill();
            sa+=a;
        });
        ctx.beginPath(); ctx.arc(cx,cy,45,0,Math.PI*2);
        ctx.fillStyle='#fff'; ctx.fill();
        ctx.strokeStyle='#1a1a1a'; ctx.lineWidth=2; ctx.stroke();
        ctx.fillStyle='#1a1a1a';
        ctx.font='bold 18px sans-serif'; ctx.textAlign='center';
        ctx.fillText(total, cx, cy-5);
        ctx.fillStyle='#7a7a7a';
        ctx.font='10px sans-serif';
        ctx.fillText('完成打卡', cx, cy+12);
    }

    const legend = $('pieLegend');
    if (legend) {
        legend.innerHTML = items.map(it => {
            const pct = total>0?Math.round(it.v/total*100):0;
            return `<div class="plan-legend-item"><div class="plan-legend-dot" style="background:${it.c};"></div><span>${it.l}</span><span class="plan-legend-val">${it.v}次 ${pct}%</span></div>`;
        }).join('');
    }
}

function drawTrend(start, end) {
    const cvs = $('trendChart'); if (!cvs) return;
    const ctx = cvs.getContext('2d');
    const w=340, h=130;
    ctx.clearRect(0,0,w,h);

    const days=[], data=[];
    for (let i=6;i>=0;i--) {
        const d=new Date(end); d.setDate(end.getDate()-i);
        const ds=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        days.push(`${d.getMonth()+1}/${d.getDate()}`);
        const c = planData.tasks.filter(t=>t.done && t.dueDate && t.dueDate.slice(0,10)===ds).length;
        data.push(c);
    }
    const mv = Math.max(...data, 3);
    const bw = 30, gap = (w-bw*7)/8;
    const by = h-24;

    // 网格
    ctx.strokeStyle='#e0e0e0'; ctx.lineWidth=1;
    for (let i=0;i<4;i++) {
        const y = 12+(h-40)*i/3;
        ctx.beginPath(); ctx.moveTo(gap,y); ctx.lineTo(w-gap,y); ctx.stroke();
    }

    data.forEach((v,i) => {
        const x = gap + i*(bw+gap);
        const bh = v>0 ? (h-40)*v/mv : 2;
        const y = by-bh;
        const g = ctx.createLinearGradient(x,y,x,by);
        g.addColorStop(0,'#F4A6B3'); g.addColorStop(1,'#e5655b');
        ctx.fillStyle=g;
        const r = 5;
        ctx.beginPath();
        ctx.moveTo(x+r,y);
        ctx.lineTo(x+bw-r,y);
        ctx.quadraticCurveTo(x+bw,y,x+bw,y+r);
        ctx.lineTo(x+bw,by);
        ctx.lineTo(x,by);
        ctx.lineTo(x,y+r);
        ctx.quadraticCurveTo(x,y,x+r,y);
        ctx.fill();

        ctx.strokeStyle='#1a1a1a'; ctx.lineWidth=1.5;
        ctx.strokeRect(x+0.5, y+0.5, bw-1, by-y-1);

        ctx.fillStyle='#7a7a7a'; ctx.font='10px sans-serif'; ctx.textAlign='center';
        ctx.fillText(days[i], x+bw/2, h-8);
        if (v>0) {
            ctx.fillStyle='#1a1a1a'; ctx.font='bold 11px sans-serif';
            ctx.fillText(v, x+bw/2, y-4);
        }
    });

    ctx.strokeStyle='#1a1a1a'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(gap,by); ctx.lineTo(w-gap,by); ctx.stroke();
}

/* ============ 我的页 ============ */
function renderProfile() {
    const img = $('profileAvatarImg');
    if (img) {
        try {
            if (window.getPartnerAvatar) {
                const a = window.getPartnerAvatar();
                if (a && a.startsWith('http')) img.src = a;
            }
        } catch(e){}
    }
    $('profileTotal').textContent = planData.tasks.length;
    $('profileDone').textContent = planData.tasks.filter(t=>t.done).length;
    $('profileFocus').textContent = planData.focusRecords.reduce((s,r)=>s+r.duration,0);
}

/* ============ 任务 CRUD ============ */
function openTaskModal(id) {
    const t = id ? planData.tasks.find(x=>x.id===id) : null;
    S.editingId = id || null;
    $('taskModalTitle').textContent = t ? '编辑任务' : '新建任务';
    $('taskText').value = t ? t.text : '';
    fillCatSel('taskCategory');
    $('taskCategory').value = t?(t.category||'other'):'work';
    $('taskUrgent').value = t?String(isU(t)):'false';
    $('taskImportant').value = t?String(isI(t)):'true';
    $('taskDate').value = t&&t.dueDate?t.dueDate.slice(0,10):'';
    $('taskTime').value = t&&t.dueTime?t.dueTime:'';
    $('taskNote').value = t?(t.note||''):'';
    showModal('taskModal');
}

function saveTask() {
    const text = $('taskText').value.trim();
    if (!text) { alert('请输入任务内容'); return; }
    const obj = {
        id: S.editingId || uid(),
        text,
        category: $('taskCategory').value,
        urgent: $('taskUrgent').value==='true',
        important: $('taskImportant').value==='true',
        dueDate: $('taskDate').value || null,
        dueTime: $('taskTime').value || null,
        note: $('taskNote').value.trim(),
        done: false,
        createdAt: Date.now()
    };
    if (S.editingId) {
        const i = planData.tasks.findIndex(x=>x.id===S.editingId);
        if (i>=0) { obj.done=planData.tasks[i].done; obj.createdAt=planData.tasks[i].createdAt; planData.tasks[i]=obj; }
    } else {
        planData.tasks.push(obj);
    }
    save();
    hideModal('taskModal');
    renderList();
}

function toggleTask(id) {
    const t = planData.tasks.find(x=>x.id===id);
    if (!t) return;
    t.done = !t.done;
    if (t.done) t.completedAt = Date.now();
    else delete t.completedAt;
    save();
    renderList();
    if (S.panel==='view') {
        if (S.vtab==='day') renderDayView();
        if (S.vtab==='month') renderMonthView();
        if (S.vtab==='week') renderWeekView();
    }
}

function fillCatSel(id) {
    const sel = $(id); if (!sel) return;
    const cur = sel.value;
    sel.innerHTML = planData.settings.categories.map(c=>`<option value="${c.id}">${c.icon} ${c.name}</option>`).join('');
    sel.value = cur;
}

/* ============ 筛选弹窗 ============ */
function showFilter() {
    const body = $('filterModalBody');
    const items = [{id:'all',name:'全部分类',icon:'📋'}, ...planData.settings.categories];
    body.innerHTML = items.map(c => `
        <div class="plan-filter-item ${S.category===c.id?'active':''}" data-cat="${c.id}">
            <div class="plan-filter-ic">${c.icon}</div>
            <div class="plan-filter-txt">${c.name}</div>
            ${S.category===c.id?'<div style="color:var(--accent-color);font-size:14px;font-weight:800;">✓</div>':''}
        </div>`).join('');
    body.querySelectorAll('.plan-filter-item').forEach(it => {
        it.addEventListener('click', () => {
            S.category = it.dataset.cat;
            hideModal('filterModal');
            if (S.panel==='list') renderList();
            if (S.panel==='view') renderView();
        });
    });
    showModal('filterModal');
}

/* ============ 关联任务 ============ */
function showTaskPicker() {
    const body = $('taskPickerBody');
    const av = planData.tasks.filter(t=>!t.done);
    if (av.length===0) { body.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text-secondary);font-weight:700;">暂无待完成任务</div>'; showModal('taskPickerModal'); return; }
    body.innerHTML = av.map(t => {
        const c = catOf(t.category);
        return `<div class="plan-filter-item ${S.focusTaskId===t.id?'active':''}" data-id="${t.id}">
            <div class="plan-filter-ic">${c.icon}</div>
            <div class="plan-filter-txt">${esc(t.text)}</div>
            ${S.focusTaskId===t.id?'<div style="color:var(--accent-color);font-weight:800;">✓</div>':''}
        </div>`;
    }).join('');
    body.querySelectorAll('.plan-filter-item').forEach(it => {
        it.addEventListener('click', () => {
            S.focusTaskId = S.focusTaskId===it.dataset.id ? null : it.dataset.id;
            hideModal('taskPickerModal');
            renderFocus();
        });
    });
    showModal('taskPickerModal');
}

/* ============ 日期详情 ============ */
function showDayModal(ds) {
    const tasks = planData.tasks.filter(t=>t.dueDate && t.dueDate.slice(0,10)===ds);
    const p = tasks.filter(t=>!t.done), d = tasks.filter(t=>t.done);
    const dt = new Date(ds);
    const wkds = ['周日','周一','周二','周三','周四','周五','周六'];
    $('dayModalTitle').textContent = `${dt.getMonth()+1}月${dt.getDate()}日 ${wkds[dt.getDay()]}`;

    let h = '';
    if (p.length===0 && d.length===0) {
        h = '<div style="text-align:center;padding:30px;color:var(--text-secondary);font-weight:700;">这一天没有任务</div>';
    } else {
        if (p.length>0) {
            h += '<div style="font-size:12px;font-weight:700;color:var(--text-secondary);margin-bottom:8px;">待完成</div>';
            p.forEach(t => h += renderDayTask(t));
        }
        if (d.length>0) {
            h += '<div style="font-size:12px;font-weight:700;color:var(--text-secondary);margin:12px 0 8px;">已完成</div>';
            d.forEach(t => h += renderDayTask(t));
        }
    }
    $('dayModalBody').innerHTML = h;
    if (window.lucide) lucide.createIcons();
    $('dayModalBody').querySelectorAll('.plan-day-task-check').forEach(cb => {
        cb.addEventListener('click', e => {
            e.stopPropagation();
            toggleTask(cb.dataset.check);
            showDayModal(ds);
        });
    });
    showModal('dayModal');
}

function renderDayTask(t) {
    const c = catOf(t.category);
    const tm = t.dueTime||'';
    return `<div class="plan-day-task ${t.done?'done':''}" data-id="${t.id}">
        <div class="plan-day-task-check" data-check="${t.id}">${t.done?'<i data-lucide="check"></i>':''}</div>
        <div class="plan-day-task-content">
            <div class="plan-day-task-text">${c.icon} ${esc(t.text)}</div>
            <div class="plan-day-task-meta">${c.name} ${tm}</div>
        </div>
    </div>`;
}

/* ============ 弹窗工具 ============ */
function showModal(id) { $(id)?.classList.add('active'); if (window.lucide) setTimeout(()=>lucide.createIcons(),0); }
function hideModal(id) { $(id)?.classList.remove('active'); }

/* ============ 事件绑定 ============ */
function bind() {
    // 主 Tab
    document.querySelectorAll('.plan-subtab').forEach(b => {
        b.addEventListener('click', () => switchPanel(b.dataset.subtab));
    });

    // 视图子 Tab（新版：plan-vtab）
    document.querySelectorAll('.plan-vtab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.plan-vtab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            S.vtab = tab.dataset.vtab;
            document.querySelectorAll('.plan-view-content').forEach(c => {
                c.classList.toggle('active', c.dataset.vtab===S.vtab);
            });
            if (S.vtab==='week') renderWeekView();
            if (S.vtab==='day') renderDayView();
            if (S.vtab==='month') renderMonthView();
        });
    });

    // 今按钮（回到今日）
    $('viewToday')?.addEventListener('click', () => {
        const d = new Date(); S.calY = d.getFullYear(); S.calM = d.getMonth();
        S.selectedDate = todayStr();
        renderView();
    });
    // 分类按钮
    $('viewFilter')?.addEventListener('click', showFilter);

    // 日历导航
    $('listPrev')?.addEventListener('click', () => {S.calM--;if(S.calM<0){S.calM=11;S.calY--;}renderList();});
    $('listNext')?.addEventListener('click', () => {S.calM++;if(S.calM>11){S.calM=0;S.calY++;}renderList();});
    $('listToday')?.addEventListener('click', () => {const d=new Date();S.calY=d.getFullYear();S.calM=d.getMonth();renderList();});
    $('listFilter')?.addEventListener('click', showFilter);

    $('viewPrev')?.addEventListener('click', () => {S.calM--;if(S.calM<0){S.calM=11;S.calY--;}renderView();});
    $('viewNext')?.addEventListener('click', () => {S.calM++;if(S.calM>11){S.calM=0;S.calY++;}renderView();});

    // 新建任务
    $('listFab')?.addEventListener('click', () => openTaskModal(null));

    // 任务弹窗
    $('taskModalClose')?.addEventListener('click', () => hideModal('taskModal'));
    $('taskModalCancel')?.addEventListener('click', () => hideModal('taskModal'));
    $('taskModalSave')?.addEventListener('click', saveTask);

    // 筛选弹窗
    $('filterModalClose')?.addEventListener('click', () => hideModal('filterModal'));

    // 关联任务
    $('focusTaskPicker')?.addEventListener('click', showTaskPicker);
    $('taskPickerClose')?.addEventListener('click', () => hideModal('taskPickerModal'));

    // 日期弹窗
    $('dayModalClose')?.addEventListener('click', () => hideModal('dayModal'));

    // 预设时长
    document.querySelectorAll('.plan-preset').forEach(b => {
        b.addEventListener('click', () => {
            S.focusMin = Number(b.dataset.min);
            S.focusRemain = S.focusMin*60;
            document.querySelectorAll('.plan-preset').forEach(x => {
                x.classList.toggle('active', Number(x.dataset.min)===S.focusMin);
            });
            resetFocus();
        });
    });

    // 专注控制
    $('focusStart')?.addEventListener('click', () => {
        S.focusRunning ? pauseFocus() : startFocus();
    });
    $('focusReset')?.addEventListener('click', resetFocus);

    // 统计范围
    document.querySelectorAll('.plan-range-btn').forEach(b => {
        b.addEventListener('click', () => {
            document.querySelectorAll('.plan-range-btn').forEach(x => x.classList.remove('active'));
            b.classList.add('active');
            S.range = b.dataset.range;
            renderStats();
        });
    });

    // 我的菜单
    document.querySelectorAll('.plan-menu-item').forEach(it => {
        it.addEventListener('click', () => {
            const a = it.dataset.action;
            if (a==='about') alert('朝夕计划 v1.0\n科学四象限 · 多视图日历 · 专注计时 · 数据统计');
            else if (a==='data-export') {
                const blob = new Blob([JSON.stringify(planData,null,2)],{type:'application/json'});
                const url = URL.createObjectURL(blob);
                const el = document.createElement('a');
                el.href = url; el.download = `plan-backup-${todayStr()}.json`;
                el.click();
                URL.revokeObjectURL(url);
            } else if (a==='data-import') {
                const inp = document.createElement('input');
                inp.type='file'; inp.accept='application/json';
                inp.onchange = e => {
                    const f=e.target.files[0]; if(!f)return;
                    const r=new FileReader();
                    r.onload = ev => {
                        try {
                            const d=JSON.parse(ev.target.result);
                            if (d.tasks) planData.tasks=d.tasks;
                            if (d.focusRecords) planData.focusRecords=d.focusRecords;
                            save(); renderProfile();
                            alert('导入成功！');
                        } catch(err){ alert('导入失败'); }
                    };
                    r.readAsText(f);
                };
                inp.click();
            } else { alert('功能开发中...'); }
        });
    });

    // ESC / 点击外部关闭
    document.querySelectorAll('.plan-overlay').forEach(m => {
        m.addEventListener('click', e => { if (e.target===m) m.classList.remove('active'); });
    });
}

/* ============ 初始化 ============ */
document.addEventListener('DOMContentLoaded', () => {
    load();
    bind();
    renderList();
    // 初始化 lucide
    if (window.lucide) lucide.createIcons();
    const p = new URLSearchParams(location.search).get('page');
    if (p && ['list','view','focus','stats','profile'].includes(p)) switchPanel(p);
});
