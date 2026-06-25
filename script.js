// Project Management System - LocalStorage data + UI rendering

const STORAGE_KEYS = {
  projects: 'pms_projects',
  tasks: 'pms_tasks',
  members: 'pms_members',
  settings: 'pms_settings',
  notifications: 'pms_notifications',
  activities: 'pms_activities',
  reports: 'pms_reports'
};

const uid = () => Math.random().toString(16).slice(2) + Date.now().toString(16);

const nowISO = () => new Date().toISOString();

function load(key, fallback){
  try{
    const raw = localStorage.getItem(key);
    if(!raw) return fallback;
    return JSON.parse(raw);
  }catch(e){
    return fallback;
  }
}

function save(key, value){
  localStorage.setItem(key, JSON.stringify(value));
}

function toastNotify(message, type='info'){
  // Lightweight notification: store + (optional) show on dashboard
  const notifications = load(STORAGE_KEYS.notifications, []);
  notifications.unshift({
    id: uid(),
    message,
    type,
    time: nowISO(),
    read: false
  });
  save(STORAGE_KEYS.notifications, notifications.slice(0, 40));
}

function logActivity(activity){
  const activities = load(STORAGE_KEYS.activities, []);
  activities.unshift({
    id: uid(),
    ...activity,
    time: nowISO()
  });
  save(STORAGE_KEYS.activities, activities.slice(0, 80));
}

function seedIfEmpty(){
  const projects = load(STORAGE_KEYS.projects, null);
  const tasks = load(STORAGE_KEYS.tasks, null);
  const members = load(STORAGE_KEYS.members, null);
  const settings = load(STORAGE_KEYS.settings, null);

  if(settings === null){
    save(STORAGE_KEYS.settings, {
      theme: 'light',
      notificationsEnabled: true,
      dashboardPrefs: {}
    });
  }

  if(!projects || !tasks || !members){
    const demoMembers = [
      { id:'m-1', name:'John', email:'john@example.com', phone:'9000000001', role:'Developer', department:'Engineering', skills:['JS','APIs'], experience:'3y', status:'Available', avatarSeed:'J' },
      { id:'m-2', name:'Sarah', email:'sarah@example.com', phone:'9000000002', role:'Designer', department:'Design', skills:['UI','UX'], experience:'2y', status:'Busy', avatarSeed:'S' },
      { id:'m-3', name:'Mike', email:'mike@example.com', phone:'9000000003', role:'Project Manager', department:'PMO', skills:['Planning','Delivery'], experience:'5y', status:'On Leave', avatarSeed:'M' }
    ];

    const today = new Date();
    const addDays = (d)=> new Date(today.getTime() + d*24*3600*1000);
    const fmt = (d)=> d.toISOString().slice(0,10);

    const demoProjects = [
      {
        id:'p-100',
        name:'College ERP System',
        description:'Web application development for campus operations.',
        category:'Web Development',
        priority:'High',
        status:'In Progress',
        startDate: fmt(addDays(-20)),
        endDate: fmt(addDays(45)),
        progress: 55,
        createdDate: fmt(addDays(-20)),
        manager: 'Mike',
        tags:['ERP','Campus'],
        color:'#2563EB',
        icon:'fa-solid fa-diagram-project'
      },
      {
        id:'p-101',
        name:'Mobile App MVP',
        description:'Initial mobile app prototype and user testing.',
        category:'Mobile App',
        priority:'Medium',
        status:'Planning',
        startDate: fmt(addDays(5)),
        endDate: fmt(addDays(80)),
        progress: 15,
        createdDate: fmt(addDays(0)),
        manager: 'John',
        tags:['MVP','Prototype'],
        color:'#06B6D4',
        icon:'fa-solid fa-mobile-screen-button'
      }
    ];

    const demoTasks = [
      { id:'t-201', projectId:'p-100', name:'Create Homepage UI', description:'Design homepage layout and responsive components.', priority:'High', status:'To Do', deadline: fmt(addDays(1)), assignedMemberId:'m-2', assignedMember:'Sarah', estTime:6, actualTime:0, category:'UI', labels:['Homepage','UI'], creationDate: fmt(addDays(-2)), progress:10 },
      { id:'t-202', projectId:'p-100', name:'API Integration', description:'Integrate backend services and connect endpoints.', priority:'Critical', status:'In Progress', deadline: fmt(addDays(12)), assignedMemberId:'m-1', assignedMember:'John', estTime:14, actualTime:5, category:'Backend', labels:['API'], creationDate: fmt(addDays(-5)), progress:45 },
      { id:'t-203', projectId:'p-100', name:'Requirement Analysis', description:'Collect requirements and document scope.', priority:'Medium', status:'Completed', deadline: fmt(addDays(-3)), assignedMemberId:'m-3', assignedMember:'Mike', estTime:5, actualTime:5, category:'Planning', labels:['Docs'], creationDate: fmt(addDays(-10)), progress:100 },
      { id:'t-204', projectId:'p-101', name:'Prototype Login Flow', description:'Implement login screens for prototype.', priority:'High', status:'Review', deadline: fmt(addDays(9)), assignedMemberId:'m-2', assignedMember:'Sarah', estTime:4, actualTime:1, category:'UI', labels:['Login'], creationDate: fmt(addDays(-1)), progress:30 }
    ];

    save(STORAGE_KEYS.members, demoMembers);
    save(STORAGE_KEYS.projects, demoProjects);
    save(STORAGE_KEYS.tasks, demoTasks);
    save(STORAGE_KEYS.notifications, []);
    save(STORAGE_KEYS.activities, []);
    save(STORAGE_KEYS.reports, []);
  }
}

function getSettings(){ return load(STORAGE_KEYS.settings, {theme:'light', notificationsEnabled:true, dashboardPrefs:{}}); }

function applyTheme(){
  const { theme } = getSettings();
  const el = document.documentElement;
  el.dataset.theme = theme === 'dark' ? 'dark' : 'light';
}

function setTheme(theme){
  const s = getSettings();
  s.theme = theme;
  save(STORAGE_KEYS.settings, s);
  applyTheme();
}

// ---------- Dashboard metrics ----------
function computeMetrics(){
  const projects = load(STORAGE_KEYS.projects, []);
  const tasks = load(STORAGE_KEYS.tasks, []);
  const members = load(STORAGE_KEYS.members, []);

  const totalProjects = projects.length;
  const totalTasks = tasks.length;

  const completedTasks = tasks.filter(t=>t.status==='Completed').length;
  const pendingTasks = tasks.filter(t=>['To Do','Blocked','Cancelled'].includes(t.status)).length;
  const inProgressTasks = tasks.filter(t=>['In Progress','Review','Testing'].includes(t.status)).length;
  const highPriorityTasks = tasks.filter(t=>['High','Critical'].includes(t.priority)).length;

  const delayedProjects = projects.filter(p=>{
    if(!p.endDate) return false;
    return new Date(p.endDate).getTime() < Date.now() && p.status!=='Completed' && p.status!=='Cancelled';
  }).length;

  const completedProjects = projects.filter(p=>p.status==='Completed').length;
  const activeProjects = projects.filter(p=>!['Completed','Cancelled'].includes(p.status)).length;

  const completionPct = totalTasks ? Math.round((completedTasks/totalTasks)*100) : 0;

  return {
    totalProjects,
    activeProjects,
    completedProjects,
    delayedProjects,
    totalTasks,
    completedTasks,
    pendingTasks,
    inProgressTasks,
    highPriorityTasks,
    completionPct,
    teamMembers: members.length
  };
}

function formatTime(iso){
  try{
    const d = new Date(iso);
    return d.toLocaleString([], {hour:'2-digit', minute:'2-digit'});
  }catch{ return '' }
}

function parseDate(d){
  if(!d) return null;
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function getUpcomingDeadlines(limit=6){
  const tasks = load(STORAGE_KEYS.tasks, []);
  const upcoming = tasks
    .filter(t=>t.deadline)
    .map(t=>({t, dt: parseDate(t.deadline)}))
    .filter(x=>x.dt)
    .sort((a,b)=>a.dt-b.dt)
    .slice(0, limit)
    .map(x=>x.t);
  return upcoming;
}

function getOverdueTasks(){
  const tasks = load(STORAGE_KEYS.tasks, []);
  const now = Date.now();
  return tasks.filter(t=>t.deadline && parseDate(t.deadline) && parseDate(t.deadline).getTime() < now && t.status!=='Completed' && t.status!=='Cancelled');
}

function renderDashboard(){
  const m = computeMetrics();

  const setCounter = (id, value)=>{
    const el = document.getElementById(id);
    if(!el) return;
    el.textContent = value;
  };

  setCounter('stat_total_projects', m.totalProjects);
  setCounter('stat_active_projects', m.activeProjects);
  setCounter('stat_completed_projects', m.completedProjects);
  setCounter('stat_delayed_projects', m.delayedProjects);

  setCounter('stat_total_tasks', m.totalTasks);
  setCounter('stat_completed_tasks', m.completedTasks);
  setCounter('stat_pending_tasks', m.pendingTasks);
  setCounter('stat_team_members', m.teamMembers);

  // Progress bar
  const pctEl = document.getElementById('project_completion_pct');
  if(pctEl){
    pctEl.textContent = `${m.completionPct}%`;
    const barSpan = document.getElementById('project_completion_bar');
    if(barSpan) barSpan.style.width = `${m.completionPct}%`;
  }

  // Recent activities
  const activities = load(STORAGE_KEYS.activities, []);
  const recentPanel = document.getElementById('recent_activities_list');
  if(recentPanel){
    const items = activities.slice(0,6);
    if(items.length===0){
      recentPanel.innerHTML = '<div class="list-item"><div class="li-left"><div class="ico">...</div><div class="txt"><strong>No activities yet</strong><small>Start by creating a project or task.</small></div></div></div>';
    } else {
      recentPanel.innerHTML = items.map(a=>{
        return `
          <div class="list-item">
            <div class="li-left">
              <div class="ico"><i class="fa-regular fa-clock"></i></div>
              <div class="txt">
                <strong>${escapeHtml(a.activity || 'Activity')}</strong>
                <small>${escapeHtml(a.user || 'System')} • ${formatTime(a.time)}</small>
              </div>
            </div>
            <div class="li-right">${escapeHtml(a.status || '')}</div>
          </div>
        `;
      }).join('');
    }
  }

  // Upcoming deadlines
  const up = getUpcomingDeadlines(6);
  const upcomingEl = document.getElementById('upcoming_deadlines_list');
  if(upcomingEl){
    upcomingEl.innerHTML = up.length ? up.map(t=>{
      return `
        <div class="list-item">
          <div class="li-left">
            <div class="ico"><i class="fa-regular fa-calendar"></i></div>
            <div class="txt">
              <strong>${escapeHtml(t.name)}</strong>
              <small>Deadline: ${escapeHtml(t.deadline)}</small>
            </div>
          </div>
          <div class="li-right">${escapeHtml(t.status)}</div>
        </div>
      `;
    }).join('') : '<div class="list-item"><div class="li-left"><div class="txt"><strong>No upcoming deadlines</strong><small>All tasks are currently on track.</small></div></div></div>';
  }

  // Notifications panel
  const notificationsEnabled = getSettings().notificationsEnabled;
  const noti = load(STORAGE_KEYS.notifications, []).slice(0,6);
  const notiEl = document.getElementById('notifications_list');
  if(notiEl){
    if(!notificationsEnabled){
      notiEl.innerHTML = '<div class="list-item"><div class="li-left"><div class="txt"><strong>Notifications disabled</strong><small>Enable them in Settings.</small></div></div></div>';
    } else if(noti.length===0){
      notiEl.innerHTML = '<div class="list-item"><div class="li-left"><div class="txt"><strong>No notifications</strong><small>When updates happen, they will appear here.</small></div></div></div>';
    } else {
      notiEl.innerHTML = noti.map(n=>{
        const cls = n.type==='danger' ? 'red' : n.type==='success' ? 'green' : n.type==='warning' ? 'amber' : 'primary';
        return `
          <div class="list-item">
            <div class="li-left">
              <div class="ico"><i class="fa-solid fa-bell"></i></div>
              <div class="txt">
                <strong>${escapeHtml(n.message)}</strong>
                <small>${formatTime(n.time)} • ${escapeHtml(n.read ? 'Read' : 'Unread')}</small>
              </div>
            </div>
            <div class="li-right"><span class="pill ${cls}"> ${escapeHtml(n.type)} </span></div>
          </div>
        `;
      }).join('');
    }
  }

  // Counter animation (simple)
  animateCounters(['stat_total_projects','stat_active_projects','stat_completed_projects','stat_delayed_projects','stat_total_tasks','stat_completed_tasks','stat_pending_tasks','stat_team_members']);
}

function animateCounters(ids){
  ids.forEach(id=>{
    const el = document.getElementById(id);
    if(!el) return;
    const target = Number(el.textContent || 0);
    el.textContent = '0';
    const duration = 850;
    const start = performance.now();
    const tick = (t)=>{
      const p = Math.min(1, (t-start)/duration);
      el.textContent = String(Math.round(target*p));
      if(p<1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

function escapeHtml(str){
  return String(str ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'<','>':'>','"':'"',"'":'&#39;'
  }[c]));
}

// ---------- Navigation highlight ----------
function syncNav(){
  const pages = [
    {id:'nav_dashboard', path:'dashboard.html'},
    {id:'nav_projects', path:'projects.html'},
    {id:'nav_tasks', path:'tasks.html'},
    {id:'nav_kanban', path:'kanban.html'},
    {id:'nav_calendar', path:'calendar.html'},
    {id:'nav_team', path:'team.html'},
    {id:'nav_reports', path:'reports.html'},
    {id:'nav_settings', path:'settings.html'},
    {id:'nav_help', path:'about.html'}
  ];
  const page = location.pathname.split('/').pop() || 'index.html';
  pages.forEach(p=>{
    const el = document.getElementById(p.id);
    if(!el) return;
    el.classList.toggle('active', p.path===page || (p.path==='dashboard.html' && (page==='index.html' || page==='')));
  });
}

// ---------- Kanban drag & drop ----------
function setupKanbanDrag(){
  const columns = [
    {selector:'#kanban_todo', statuses:['To Do']},
    {selector:'#kanban_inprogress', statuses:['In Progress']},
    {selector:'#kanban_review', statuses:['Review']},
    {selector:'#kanban_testing', statuses:['Testing']},
    {selector:'#kanban_done', statuses:['Completed']}
  ];

  const getDropStatusFromCol = (colId)=>{
    if(colId==='kanban_todo') return 'To Do';
    if(colId==='kanban_inprogress') return 'In Progress';
    if(colId==='kanban_review') return 'Review';
    if(colId==='kanban_testing') return 'Testing';
    if(colId==='kanban_done') return 'Completed';
    return null;
  };

  document.querySelectorAll('.task-card[data-task-id]').forEach(card=>{
    card.addEventListener('dragstart', (e)=>{
      card.classList.add('dragging');
      e.dataTransfer.setData('text/plain', card.dataset.taskId);
      e.dataTransfer.effectAllowed = 'move';
    });
    card.addEventListener('dragend', ()=> card.classList.remove('dragging'));
  });

  columns.forEach(col=>{
    const el = document.querySelector(col.selector);
    if(!el) return;

    el.addEventListener('dragover', (e)=>{
      e.preventDefault();
      el.classList.add('drop-target');
      e.dataTransfer.dropEffect='move';
    });
    el.addEventListener('dragleave', ()=> el.classList.remove('drop-target'));
    el.addEventListener('drop', (e)=>{
      e.preventDefault();
      el.classList.remove('drop-target');
      const taskId = e.dataTransfer.getData('text/plain');
      const newStatus = getDropStatusFromCol(col.selector.replace('#',''));
      if(!taskId || !newStatus) return;

      const tasks = load(STORAGE_KEYS.tasks, []);
      const idx = tasks.findIndex(t=>t.id===taskId);
      if(idx===-1) return;

      const old = tasks[idx];
      tasks[idx] = {
        ...tasks[idx],
        status: newStatus,
        progress: newStatus==='Completed' ? 100 : tasks[idx].progress
      };
      save(STORAGE_KEYS.tasks, tasks);

      toastNotify(`Task “${old.name}” moved to ${newStatus}`, newStatus==='Completed' ? 'success' : 'info');
      logActivity({
        activity: `Status changed: ${old.name} → ${newStatus}`,
        user: 'You',
        status: 'Updated'
      });

      // Re-render cards in place
      renderKanban();
    });
  });
}

function renderKanban(){
  const tasks = load(STORAGE_KEYS.tasks, []);
  const members = load(STORAGE_KEYS.members, []);
  const getMemberName = (id, fallback)=>{
    const m = members.find(x=>x.id===id);
    return m ? m.name : (fallback || 'Unassigned');
  };

  const colMap = {
    'kanban_todo': 'To Do',
    'kanban_inprogress': 'In Progress',
    'kanban_review': 'Review',
    'kanban_testing': 'Testing',
    'kanban_done': 'Completed'
  };

  Object.entries(colMap).forEach(([colId, status])=>{
    const el = document.getElementById(colId);
    if(!el) return;
    const colTasks = tasks.filter(t=>t.status===status);

    el.innerHTML = colTasks.length ? colTasks.map(t=>{
      const priClass = (t.priority||'Low').toLowerCase();
      const pri = (t.priority||'Low');
      const priNorm = pri==='Critical' ? 'critical' : pri==='High' ? 'high' : pri==='Medium' ? 'medium' : pri==='Low' ? 'low' : 'low';
      const member = getMemberName(t.assignedMemberId, t.assignedMember);

      return `
        <div class="task-card" draggable="true" data-task-id="${escapeHtml(t.id)}">
          <div class="t-top">
            <div>
              <div class="name">${escapeHtml(t.name)}</div>
              <div class="sub">
                <span class="small-badge ${escapeHtml(statusClass(status))}">${escapeHtml(status)}</span>
              </div>
            </div>
          </div>
          <div class="sub">
            <span class="pri ${escapeHtml(priNorm)}">${escapeHtml(pri)}</span>
            <span class="small-badge">Deadline: ${escapeHtml(t.deadline || '—')}</span>
          </div>
          <div class="bottom">
            <span class="small-badge">${escapeHtml(member)}</span>
            <span class="small-badge">${Math.round(t.progress||0)}% </span>
          </div>
        </div>
      `;
    }).join('') : '<div class="list-item"><div class="li-left"><div class="txt"><strong>No tasks</strong><small>Drop tasks here</small></div></div></div>';
  });

  setupKanbanDrag();
}

function statusClass(status){
  if(status==='To Do') return 'todo';
  if(status==='In Progress') return 'inprogress';
  if(status==='Review') return 'review';
  if(status==='Testing') return 'testing';
  if(status==='Completed') return 'completed';
  return 'todo';
}

// ---------- Table pages (projects/tasks) ----------
function renderProjectsTable(){
  const projects = load(STORAGE_KEYS.projects, []);
  const el = document.getElementById('projects_table_body');
  if(!el) return;
  el.innerHTML = projects.map(p=>{
    return `
      <tr>
        <td>${escapeHtml(p.id)}</td>
        <td>
          <div style="display:flex; align-items:center; gap:10px;">
            <span class="pill primary" style="background: rgba(37,99,235,.14); border-color: rgba(37,99,235,.30); color:${p.color||'#2563EB'};">
              <i class="${p.icon||'fa-solid fa-diagram-project'}"></i>
            </span>
            <strong>${escapeHtml(p.name)}</strong>
          </div>
        </td>
        <td>${escapeHtml(p.category||'—')}</td>
        <td><span class="pill cyan">${escapeHtml(p.priority||'—')}</span></td>
        <td>${escapeHtml(p.status||'—')}</td>
        <td>${escapeHtml(p.startDate||'—')}</td>
        <td>${escapeHtml(p.endDate||'—')}</td>
        <td>${escapeHtml(Math.round(p.progress||0))}%</td>
        <td>
          <div class="row-actions">
            <button class="sm-btn" data-action="details" data-id="${escapeHtml(p.id)}">Details</button>
            <button class="sm-btn" data-action="archive" data-id="${escapeHtml(p.id)}">Archive</button>
            <button class="sm-btn" data-action="delete" data-id="${escapeHtml(p.id)}">Delete</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function renderTasksTable(){
  const tasks = load(STORAGE_KEYS.tasks, []);
  const el = document.getElementById('tasks_table_body');
  if(!el) return;
  el.innerHTML = tasks.map(t=>{
    const pri = t.priority||'Low';
    const priPill = pri==='Critical'?'pill red': pri==='High'?'pill amber': pri==='Medium'?'pill primary': 'pill cyan';
    const priText = pri;
    const status = t.status||'To Do';
    return `
      <tr>
        <td>${escapeHtml(t.id)}</td>
        <td><strong>${escapeHtml(t.name)}</strong><div style="color:var(--muted);font-size:12px;font-weight:800;">${escapeHtml(t.description||'')}</div></td>
        <td><span class="${priPill}">${escapeHtml(priText)}</span></td>
        <td>${escapeHtml(t.deadline||'—')}</td>
        <td>${escapeHtml(status)}</td>
        <td>${escapeHtml(t.assignedMember||'—')}</td>
        <td>${escapeHtml(t.category||'—')}</td>
        <td>${escapeHtml(Math.round(t.progress||0))}%</td>
        <td>
          <div class="row-actions">
            <button class="sm-btn" data-action="edit" data-id="${escapeHtml(t.id)}">Edit</button>
            <button class="sm-btn" data-action="duplicate" data-id="${escapeHtml(t.id)}">Duplicate</button>
            <button class="sm-btn" data-action="archive" data-id="${escapeHtml(t.id)}">Archive</button>
            <button class="sm-btn" data-action="delete" data-id="${escapeHtml(t.id)}">Delete</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// ---------- CRUD light modal helpers (minimal) ----------
function bindGlobalThemeToggle(){
  const chk = document.getElementById('theme_toggle_checkbox');
  if(!chk) return;
  const s = getSettings();
  chk.checked = s.theme==='dark';
  chk.addEventListener('change', ()=> setTheme(chk.checked ? 'dark' : 'light'));
}

function init(){
  seedIfEmpty();
  applyTheme();
  syncNav();
  bindGlobalThemeToggle();

  if(document.body.dataset.page==='dashboard') renderDashboard();
  if(document.body.dataset.page==='kanban') renderKanban();
  if(document.body.dataset.page==='projects') renderProjectsTable();
  if(document.body.dataset.page==='tasks') renderTasksTable();
}

window.addEventListener('DOMContentLoaded', init);

