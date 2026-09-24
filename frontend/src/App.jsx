import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { supabase } from './lib/supabase';
import './App.css';
import Login from './components/Login';
import CreateAccount from './components/CreateAccount';
import NotesView from './components/NotesView';
import TodoView from './components/TodoView';
import HabitsView from './components/HabitsView';
import SettingsModal from './components/SettingsModal';

/* ============================== ICONS ============================== */
const Icon = {
  ChevronLeft: (p) => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" {...p}><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  ChevronRight: (p) => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" {...p}><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  Plus: (p) => (<svg viewBox="0 0 24 24" width="16" height="16" fill="none" {...p}><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>),
  Search: (p) => (<svg viewBox="0 0 24 24" width="16" height="16" fill="none" {...p}><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/><path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>),
  Sparkle: (p) => (<svg viewBox="0 0 24 24" width="16" height="16" fill="none" {...p}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>),
  Close: (p) => (<svg viewBox="0 0 24 24" width="16" height="16" fill="none" {...p}><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>),
  Clock: (p) => (<svg viewBox="0 0 24 24" width="14" height="14" fill="none" {...p}><circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6"/><path d="M12 8v4.2l3 1.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>),
  Pin: (p) => (<svg viewBox="0 0 24 24" width="14" height="14" fill="none" {...p}><path d="M12 21s-6.5-5.6-6.5-10.8A6.5 6.5 0 0112 3.7a6.5 6.5 0 016.5 6.5C18.5 15.4 12 21 12 21z" stroke="currentColor" strokeWidth="1.6"/><circle cx="12" cy="10.4" r="2.1" stroke="currentColor" strokeWidth="1.6"/></svg>),
  Trash: (p) => (<svg viewBox="0 0 24 24" width="15" height="15" fill="none" {...p}><path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-9 0l1 13a1 1 0 001 1h8a1 1 0 001-1l1-13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  Edit: (p) => (<svg viewBox="0 0 24 24" width="15" height="15" fill="none" {...p}><path d="M15.2 4.8l4 4L8 20H4v-4L15.2 4.8z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>),
  Send: (p) => (<svg viewBox="0 0 24 24" width="16" height="16" fill="none" {...p}><path d="M4 12l16-8-6 16-3-6-7-2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>),
  Mic: (p) => (<svg viewBox="0 0 24 24" width="16" height="16" fill="none" {...p}><rect x="9" y="3" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.8"/><path d="M6 11a6 6 0 0012 0M12 17v4M8.5 21h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>),
  Menu: (p) => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" {...p}><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>),
  Check: (p) => (<svg viewBox="0 0 24 24" width="14" height="14" fill="none" {...p}><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  Bolt: (p) => (<svg viewBox="0 0 24 24" width="14" height="14" fill="none" {...p}><path d="M13 3L5 14h6l-1 7 8-11h-6l1-7z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>),
  Grid: (p) => (<svg viewBox="0 0 24 24" width="16" height="16" fill="none" {...p}><rect x="4" y="4" width="7" height="7" rx="1.3" stroke="currentColor" strokeWidth="1.6"/><rect x="13" y="4" width="7" height="7" rx="1.3" stroke="currentColor" strokeWidth="1.6"/><rect x="4" y="13" width="7" height="7" rx="1.3" stroke="currentColor" strokeWidth="1.6"/><rect x="13" y="13" width="7" height="7" rx="1.3" stroke="currentColor" strokeWidth="1.6"/></svg>),
  List: (p) => (<svg viewBox="0 0 24 24" width="16" height="16" fill="none" {...p}><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>),
  Columns: (p) => (<svg viewBox="0 0 24 24" width="16" height="16" fill="none" {...p}><rect x="4" y="4" width="16" height="16" rx="1.6" stroke="currentColor" strokeWidth="1.6"/><path d="M9.3 4v16M14.7 4v16" stroke="currentColor" strokeWidth="1.6"/></svg>),
  Task: (p) => (<svg viewBox="0 0 24 24" width="16" height="16" fill="none" {...p}><rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.6"/><path d="M8 12.5l2.4 2.4L16 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  Cal: (p) => (<svg viewBox="0 0 24 24" width="16" height="16" fill="none" {...p}><rect x="4" y="5.5" width="16" height="15" rx="2.4" stroke="currentColor" strokeWidth="1.6"/><path d="M4 10h16M8 3.5v3M16 3.5v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>),
  Gear: (p) => (<svg viewBox="0 0 24 24" width="16" height="16" fill="none" {...p}><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6"/><path d="M12 3.5v2M12 18.5v2M20.5 12h-2M5.5 12h-2M17.7 6.3l-1.4 1.4M7.7 16.3l-1.4 1.4M17.7 17.7l-1.4-1.4M7.7 7.7L6.3 6.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>),
  Sun: (p) => (<svg viewBox="0 0 24 24" width="16" height="16" fill="none" {...p}><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6"/><path d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>),
};

/* ============================== DATE HELPERS ============================== */
const pad = (n) => (n < 10 ? '0' + n : '' + n);
const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
const startOfWeek = (d) => { const r = new Date(d); r.setHours(0, 0, 0, 0); r.setDate(r.getDate() - r.getDay()); return r; };
const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const buildMonthGrid = (d) => { const start = startOfWeek(startOfMonth(d)); return Array.from({ length: 42 }, (_, i) => addDays(start, i)); };
const buildWeek = (d) => { const start = startOfWeek(d); return Array.from({ length: 7 }, (_, i) => addDays(start, i)); };
const fmtMonthYear = (d) => d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
const fmtWeekday = (d, len = 'short') => d.toLocaleDateString('en-US', { weekday: len });
const fmtDayHeader = (d) => d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
const timeToMinutes = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const minutesToTime = (mins) => { mins = ((mins % 1440) + 1440) % 1440; return `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`; };
const to12h = (t) => { const [h, m] = t.split(':').map(Number); const ap = h >= 12 ? 'PM' : 'AM'; const hh = h % 12 === 0 ? 12 : h % 12; return m === 0 ? `${hh} ${ap}` : `${hh}:${pad(m)} ${ap}`; };
const durationLabel = (start, end) => { const mins = timeToMinutes(end) - timeToMinutes(start); const h = Math.floor(mins / 60), m = mins % 60; if (h && m) return `${h}h ${m}m`; if (h) return `${h}h`; return `${m}m`; };

/* ============================== STATIC DATA ============================== */
const CATEGORIES = [
  { id: 'work', label: 'Work', color: '#2C5282' },
  { id: 'personal', label: 'Personal', color: '#146B54' },
  { id: 'health', label: 'Health', color: '#A23B3B' },
  { id: 'focus', label: 'Focus', color: '#9786e8' },
  { id: 'meeting', label: 'Meeting', color: '#0E6E76' },
];
const PRIORITIES = ['Low', 'Medium', 'High'];
const HOUR_START = 7;
const HOUR_END = 21;
const HOUR_HEIGHT = 64;
const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const eventToUI = (event) => {
  const start = new Date(event.start_time);
  const end = new Date(event.end_time);
  return { ...event, id: String(event.id), date: isoDate(start), start: `${pad(start.getHours())}:${pad(start.getMinutes())}`, end: `${pad(end.getHours())}:${pad(end.getMinutes())}`, category: event.category || 'work', priority: event.priority ? event.priority[0].toUpperCase() + event.priority.slice(1) : 'Medium' };
};
const eventToAPI = (event) => ({ title: event.title, description: event.description || null, start_time: `${event.date}T${event.start}:00`, end_time: `${event.date}T${event.end}:00`, location: event.location || null, priority: (event.priority || 'Medium').toLowerCase(), category: event.category || 'work', status: 'scheduled' });

const catMeta = (id) => CATEGORIES.find((c) => c.id === id) || CATEGORIES[0];

function makeSeedEvents(today) {
  const d = (offset) => isoDate(addDays(today, offset));
  let uid = 1;
  const id = () => 'seed-' + uid++;
  return [
    { id: id(), title: 'AI Project Review', description: 'Walk through the scheduling engine milestones with the team.', date: d(0), start: '10:00', end: '12:00', category: 'work', priority: 'High', location: 'Conference Room A' },
    { id: id(), title: 'Design Sync', description: 'Review the new calendar interaction patterns.', date: d(0), start: '11:00', end: '12:30', category: 'meeting', priority: 'Medium', location: 'Zoom' },
    { id: id(), title: 'Morning Run', description: 'Easy 5k around the park.', date: d(0), start: '07:00', end: '07:45', category: 'health', priority: 'Low', location: 'Riverside Park' },
    { id: id(), title: 'Deep Work — Roadmap Doc', description: 'Draft the Q4 product roadmap.', date: d(0), start: '14:00', end: '16:00', category: 'focus', priority: 'High', location: '' },
    { id: id(), title: 'Dinner with Mira', description: 'Catch up over dinner.', date: d(0), start: '19:00', end: '20:30', category: 'personal', priority: 'Low', location: 'Osteria Nova' },
    { id: id(), title: 'Investor Update Call', description: 'Monthly sync with the board.', date: d(1), start: '09:00', end: '09:45', category: 'meeting', priority: 'High', location: 'Zoom' },
    { id: id(), title: 'Physio Appointment', description: 'Follow-up on shoulder mobility.', date: d(1), start: '13:00', end: '13:45', category: 'health', priority: 'Medium', location: 'Clarity Health' },
    { id: id(), title: '1:1 with Sam', description: 'Weekly check-in.', date: d(1), start: '15:30', end: '16:00', category: 'work', priority: 'Medium', location: 'Office — Room 2' },
    { id: id(), title: 'Focus Block — Inbox Zero', description: 'Clear backlog and plan the week.', date: d(2), start: '08:30', end: '09:30', category: 'focus', priority: 'Low', location: '' },
    { id: id(), title: 'Product Demo', description: 'Demo the new AI assistant to the design team.', date: d(2), start: '11:00', end: '12:00', category: 'work', priority: 'High', location: 'Studio B' },
    { id: id(), title: 'Yoga', description: 'Recovery session.', date: d(2), start: '18:00', end: '19:00', category: 'health', priority: 'Low', location: 'Home' },
    { id: id(), title: 'Grocery Run', description: '', date: d(-1), start: '17:30', end: '18:15', category: 'personal', priority: 'Low', location: 'Market Street' },
    { id: id(), title: 'Quarterly Planning', description: 'Set goals for next quarter.', date: d(-1), start: '10:00', end: '11:30', category: 'work', priority: 'High', location: 'Boardroom' },
    { id: id(), title: 'Client Onboarding Call', description: 'Walk a new client through setup.', date: d(3), start: '10:30', end: '11:15', category: 'meeting', priority: 'Medium', location: 'Zoom' },
    { id: id(), title: 'Team Lunch', description: '', date: d(3), start: '12:30', end: '13:30', category: 'personal', priority: 'Low', location: 'Terrace Cafe' },
    { id: id(), title: 'Strategy Offsite Prep', description: 'Prepare slides for offsite.', date: d(4), start: '09:00', end: '10:30', category: 'work', priority: 'Medium', location: '' },
    { id: id(), title: 'Dentist', description: '', date: d(-2), start: '09:30', end: '10:15', category: 'health', priority: 'Medium', location: 'Bright Smile Clinic' },
  ];
}

/* ============================== CONFLICT LOGIC ============================== */
function findConflicts(events) {
  const byDate = {};
  events.forEach((e) => { (byDate[e.date] ||= []).push(e); });
  const conflicts = [];
  Object.entries(byDate).forEach(([date, list]) => {
    const sorted = [...list].sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const a = sorted[i], b = sorted[j];
        if (timeToMinutes(a.start) < timeToMinutes(b.end) && timeToMinutes(b.start) < timeToMinutes(a.end)) {
          conflicts.push({ id: `${a.id}-${b.id}`, date, a, b });
        }
      }
    }
  });
  return conflicts;
}
function suggestSlotsForConflict(conflict) {
  const base = Math.max(timeToMinutes(conflict.a.end), timeToMinutes(conflict.b.end));
  return [30, 150, 300].map((offset) => {
    const start = base + offset;
    return { start: minutesToTime(start), end: minutesToTime(start + 60) };
  });
}

/* ============================== MOCK AI ============================== */

function buildAIResponse({ text, events, today, conflicts }) {
  const q = text.toLowerCase();
  const todays = events.filter((e) => e.date === isoDate(today)).sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));

  if (q.includes('schedule') && q.includes('today') || q.includes("today")) {
    if (!todays.length) return { type: 'text', text: "You have a clear day today — nothing on the calendar yet." };
    const lines = todays.map((e) => `${to12h(e.start)}–${to12h(e.end)} · ${e.title}`).join('\n');
    return { type: 'text', text: `You have ${todays.length} event${todays.length > 1 ? 's' : ''} today:\n\n${lines}` };
  }
  if (q.includes('free')) {
    const dayStart = 8 * 60, dayEnd = 19 * 60;
    const busy = todays.map((e) => [timeToMinutes(e.start), timeToMinutes(e.end)]).sort((a, b) => a[0] - b[0]);
    const gaps = [];
    let cursor = dayStart;
    busy.forEach(([s, e]) => { if (s - cursor >= 30) gaps.push([cursor, s]); cursor = Math.max(cursor, e); });
    if (dayEnd - cursor >= 30) gaps.push([cursor, dayEnd]);
    if (!gaps.length) return { type: 'text', text: "Today's fully booked between 8 AM and 7 PM." };
    const lines = gaps.slice(0, 4).map(([s, e]) => `${to12h(minutesToTime(s))} – ${to12h(minutesToTime(e))}`).join('\n');
    return { type: 'text', text: `Here's your open time today:\n\n${lines}` };
  }
  if (q.includes('conflict')) {
    const todaysConflicts = conflicts.filter((c) => c.date === isoDate(today));
    if (!todaysConflicts.length) return { type: 'text', text: "You're all clear — no conflicts today." };
    const c = todaysConflicts[0];
    return { type: 'conflict', text: `You have a scheduling conflict today between "${c.a.title}" and "${c.b.title}".`, conflict: c };
  }
  if (q.includes('schedule time') || q.includes('project') || q.includes('block')) {
    const slots = [90, 240, 360].map((offset) => { const s = 9 * 60 + offset; return { start: minutesToTime(s), end: minutesToTime(s + 60) }; });
    return { type: 'suggestion', text: 'I found a few good windows for a focused work block:', slots, title: 'Focus block — Project work', thinkingLabel: 'Finding the best time…' };
  }
  if (q.includes('plan my day')) {
    if (!todays.length) return { type: 'text', text: "Nothing's booked yet — want me to block out a few focus sessions?" };
    const lines = todays.map((e, i) => `${i + 1}. ${to12h(e.start)} — ${e.title}`).join('\n');
    return { type: 'text', text: `Here's the shape of your day:\n\n${lines}\n\nWant me to protect some focus time between meetings?` };
  }
  return { type: 'text', text: "I can help with your schedule — try asking what's on today, when you're free, or to plan your day." };
}

/* ============================== SMALL UI PARTS ============================== */
function CategoryDot({ color, size = 8 }) {
  return <span className="cat-dot" style={{ width: size, height: size, background: color }} />;
}

function EventPill({ event, onClick }) {
  const cat = catMeta(event.category);
  return (
    <button className="event-pill" style={{ '--cat-color': cat.color }} onClick={(e) => { e.stopPropagation(); onClick(event); }}>
      <span className="event-pill-dot" />
      <span className="event-pill-time">{to12h(event.start)}</span>
      <span className="event-pill-title">{event.title}</span>
    </button>
  );
}

function TimedEventCard({ event, onClick, style }) {
  const cat = catMeta(event.category);
  return (
    <button className="timed-event" style={{ ...style, '--cat-color': cat.color }} onClick={(e) => { e.stopPropagation(); onClick(event); }}>
      <span className="timed-event-bar" />
      <span className="timed-event-body">
        <span className="timed-event-title">{event.title}</span>
        <span className="timed-event-time">{to12h(event.start)} – {to12h(event.end)}</span>
      </span>
    </button>
  );
}

/* ============================== SIDEBAR ============================== */
function Sidebar({
  view,
  setView,
  currentDate,
  goToday,
  activeCats,
  toggleCat,
  mobileOpen,
  closeMobile,
  currentSection = 'calendar',
  setCurrentSection,
  onOpenSettings,
}) {
  const nav = [
    {
      id: 'calendar',
      label: 'Calendar',
      icon: Icon.Cal,
      action: () => {
        setCurrentSection?.('calendar');
        setView('month');
      },
    },
    {
      id: 'habits',
      label: 'Habits',
      icon: Icon.Check,
      action: () => setCurrentSection?.('habits'),
    },
    {
      id: 'notes',
      label: 'Notes',
      icon: Icon.List,
      action: () => setCurrentSection?.('notes'),
    },
    {
      id: 'to-do',
      label: 'To-Do List',
      icon: Icon.Grid,
      action: () => setCurrentSection?.('to-do'),
    },
  ];
  return (
    <>
      {mobileOpen && <div className="sidebar-scrim" onClick={closeMobile} />}
      <aside className={`sidebar ${mobileOpen ? 'sidebar--open' : ''}`}>
        <div className="brand">
          <span className="brand-mark"><Icon.Sparkle />✦</span>
          <span className="brand-name">NOVA</span>
        </div>

        <nav className="side-nav">
          {nav.map((n) => (
            <button key={n.id}
              className={`side-nav-item ${currentSection === n.id ? 'side-nav-item--active' : ''}`}
              onClick={() => {
                n.action();
                closeMobile();
              }}
            >
            <n.icon className="side-nav-icon" />
            <span>{n.label}</span>
          </button>
          ))}
        </nav>

        <div className="side-section">
          <div className="side-section-title">Categories</div>
          <div className="cat-list">
            {CATEGORIES.map((c) => (
              <button key={c.id} className={`cat-item ${activeCats.has(c.id) ? '' : 'cat-item--off'}`} onClick={() => toggleCat(c.id)}>
                <CategoryDot color={c.color} />
                <span>{c.label}</span>
                {activeCats.has(c.id) && <Icon.Check className="cat-check" />}
              </button>
            ))}
          </div>
        </div>

        <div className="side-footer">
          <button
            className="side-nav-item"
            onClick={() => {
              onOpenSettings?.();
              closeMobile();
            }}
          >
            <Icon.Gear className="side-nav-icon" />
            <span>Settings</span>
          </button>
          {/* <div className="profile-chip">
            <span className="avatar">JV</span>
            <span className="profile-meta">
              <span className="profile-name">Jyothi Vaddi</span>
              <span className="profile-sub">Free plan</span>
            </span>
          </div> */}
        </div>
      </aside>
    </>
  );
}

/* ============================== TOP BAR ============================== */
function TopBar({
  view,
  setView,
  currentDate,
  onPrev,
  onNext,
  onToday,
  label,
  search,
  setSearch,
  onNewEvent,
  onOpenAI,
  onMenu,
  handleLogout,
  currentSection = 'calendar',
  onOpenSettings,
}) {
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileOpen &&
        !event.target.closest('.profile-menu')
      ) {
        setProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileOpen]);

  const views = [
    { id: 'month', label: 'Month', icon: Icon.Grid },
    { id: 'week', label: 'Week', icon: Icon.Columns },
    { id: 'day', label: 'Day', icon: Icon.List },
  ];
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="icon-btn only-mobile" onClick={onMenu}><Icon.Menu /></button>
        
        <h1 className="period-label">{label}</h1>
      </div>

      <div className="topbar-right">
        <div className="search-box">
          <Icon.Search className="search-icon" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              currentSection === 'notes'
                ? 'Search notes…'
                : currentSection === 'to-do'
                ? 'Search tasks…'
                : currentSection === 'habits'
                ? 'Search habits…'
                : 'Search events…'
            }
          />
        </div>

        <button className="ai-trigger" onClick={onOpenAI}>
          <Icon.Sparkle />
          <span>Ask AI</span>
        </button>

        <button className="new-event-btn" onClick={onNewEvent}>
          <Icon.Plus />
          <span className="only-desktop">New event</span>
        </button>

        <div className="profile-menu">
  <button
    type="button"
    className="profile-avatar"
    onClick={() => setProfileOpen((prev) => !prev)}
    aria-label="Open account menu"
    aria-expanded={profileOpen}
  >
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="8"
        r="3.2"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M5.5 20c.5-4 2.8-6 6.5-6s6 2 6.5 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  </button>

  {profileOpen && (
    <div className="profile-dropdown">
      <div className="profile-account">
        <div className="profile-dropdown-avatar">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <circle
              cx="12"
              cy="8"
              r="3.2"
              stroke="currentColor"
              strokeWidth="1.8"
            />

            <path
              d="M5.5 20c.5-4 2.8-6 6.5-6s6 2 6.5 6"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div className="profile-account-text">
          <strong>Your Account</strong>
          <span>Manage your settings</span>
        </div>
      </div>

      <div className="profile-divider" />

      <button
        type="button"
        className="profile-logout"
        style={{ marginBottom: 4, color: 'var(--text, #f0f0f4)' }}
        onClick={() => {
          setProfileOpen(false);
          onOpenSettings?.();
        }}
      >
        <Icon.Gear />
        <span>Settings & Preferences</span>
      </button>

      <button
        type="button"
        className="profile-logout"
        onClick={handleLogout}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M10 17l5-5-5-5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <path
            d="M15 12H3"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />

          <path
            d="M20 4v16"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>

        <span>Log out</span>
      </button>
    </div>
  )}
</div>
      </div>
    </header>
  );
}

/* ============================== MONTH VIEW ============================== */
function MonthView({ currentDate, events, today, onDayClick, onEventClick }) {
  const days = useMemo(() => buildMonthGrid(currentDate), [currentDate]);
  const month = currentDate.getMonth();
  const eventsByDate = useMemo(() => {
    const map = {};
    events.forEach((e) => { (map[e.date] ||= []).push(e); });
    Object.values(map).forEach((list) => list.sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start)));
    return map;
  }, [events]);

  return (
    <div className="month-view">
      <div className="month-weekdays">
        {days.slice(0, 7).map((d) => <div key={d.toString()} className="month-weekday">{fmtWeekday(d)}</div>)}
      </div>
      <div className="month-grid">
        {days.map((d) => {
          const iso = isoDate(d);
          const dayEvents = eventsByDate[iso] || [];
          const isToday = sameDay(d, today);
          const isOtherMonth = d.getMonth() !== month;
          return (
            <div key={iso} className={`month-cell ${isOtherMonth ? 'is-muted' : ''} ${isToday ? 'is-today' : ''}`} onClick={() => onDayClick(d)}>
              <div className="month-cell-head">
                <span className={`month-daynum ${isToday ? 'month-daynum--today' : ''}`}>{d.getDate()}</span>
              </div>
              <div className="month-cell-events">
                {dayEvents.slice(0, 3).map((e) => <EventPill key={e.id} event={e} onClick={onEventClick} />)}
                {dayEvents.length > 3 && <div className="more-chip">+{dayEvents.length - 3} more</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================== WEEK / DAY (TIMED) VIEW ============================== */
function TimeGrid({ days, events, today, onEventClick, now }) {
  const hours = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i);
  const gridTop = HOUR_START * 60;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const showNowLine = nowMinutes >= gridTop && nowMinutes <= HOUR_END * 60;
  const nowTop = ((nowMinutes - gridTop) / 60) * HOUR_HEIGHT;

  const eventsFor = (d) => events.filter((e) => e.date === isoDate(d)).sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));

  return (
    <div className="time-grid-wrap">
      <div className="time-grid-header">
        <div className="time-gutter-head" />
        {days.map((d) => (
          <div key={d.toString()} className={`time-col-head ${sameDay(d, today) ? 'is-today' : ''}`}>
            <span className="time-col-weekday">{fmtWeekday(d)}</span>
            <span className={`time-col-daynum ${sameDay(d, today) ? 'time-col-daynum--today' : ''}`}>{d.getDate()}</span>
          </div>
        ))}
      </div>

      <div className="time-grid-body" style={{ '--hour-h': `${HOUR_HEIGHT}px`, '--hours': hours.length }}>
        <div className="time-gutter">
          {hours.map((h) => <div key={h} className="time-gutter-slot">{to12h(`${pad(h)}:00`)}</div>)}
        </div>

        {days.map((d) => (
          <div key={d.toString()} className="time-col">
            {hours.map((h) => <div key={h} className="time-col-slot" />)}
            {sameDay(d, today) && showNowLine && (
              <div className="now-line" style={{ top: nowTop }}>
                <span className="now-dot" />
              </div>
            )}
            {eventsFor(d).map((e) => {
              const startM = timeToMinutes(e.start) - gridTop;
              const endM = timeToMinutes(e.end) - gridTop;
              const top = (startM / 60) * HOUR_HEIGHT;
              const height = Math.max(((endM - startM) / 60) * HOUR_HEIGHT, 30);
              return <TimedEventCard key={e.id} event={e} onClick={onEventClick} style={{ top, height }} />;
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function DayAgenda({ day, events, onEventClick }) {
  const list = events.filter((e) => e.date === isoDate(day)).sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
  return (
    <div className="agenda">
      <h2 className="agenda-heading">{fmtDayHeader(day)}</h2>
      {!list.length && <div className="agenda-empty">Nothing scheduled — enjoy the open day.</div>}
      <div className="agenda-list">
        {list.map((e) => {
          const cat = catMeta(e.category);
          return (
            <button key={e.id} className="agenda-item" style={{ '--cat-color': cat.color }} onClick={() => onEventClick(e)}>
              <div className="agenda-item-time">
                <span>{to12h(e.start)}</span>
                <span className="agenda-item-duration">{durationLabel(e.start, e.end)}</span>
              </div>
              <div className="agenda-item-bar" />
              <div className="agenda-item-body">
                <div className="agenda-item-title-row">
                  <span className="agenda-item-title">{e.title}</span>
                  <span className={`priority-tag priority-tag--${e.priority.toLowerCase()}`}>{e.priority}</span>
                </div>
                {e.description && <p className="agenda-item-desc">{e.description}</p>}
                {e.location && <span className="agenda-item-loc"><Icon.Pin /> {e.location}</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}



/* ============================== SELECTED DAY PANEL ============================== */
function SelectedDayPanel({ day, events, onClose, onEventClick, onAddEvent }) {
  const list = events
    .filter((e) => e.date === isoDate(day))
    .sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));

  return (
    <aside className="selected-day-panel">
      <div className="selected-day-head">
        <div>
          <h2>{day.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}</h2>
        </div>
        <button className="selected-day-close" onClick={onClose} aria-label="Close day details">
          <Icon.Close />
        </button>
      </div>

      <p> </p>
      <div className="selected-day-divider" />

      <div className="selected-day-timeline">
        {list.length ? list.map((event) => {
          const cat = catMeta(event.category);
          return (
            <button
              key={event.id}
              className="selected-day-event"
              onClick={() => onEventClick(event)}
            >
              <span className="selected-day-event-time">{to12h(event.start)}</span>
              <span className="selected-day-event-line">
                <span className="selected-day-event-dot" style={{ background: cat.color }} />
              </span>
              <span className="selected-day-event-content">
                <strong>{event.title}</strong>
                <small>{event.description || `${durationLabel(event.start, event.end)}`}</small>
                {event.location && (
                  <small className="selected-day-location"><Icon.Pin /> {event.location}</small>
                )}
              </span>
              <span className="selected-day-more">•••</span>
            </button>
          );
        }) : (
          <div className="selected-day-empty">
            <div className="selected-day-empty-icon"><Icon.Cal /></div>
            <strong>No events scheduled</strong>
            <span>This day is wide open.</span>
          </div>
        )}
      </div>

      <button className="selected-day-add" onClick={() => onAddEvent(day)}>
        <Icon.Plus />
        Add Event
      </button>

      {/* <div className="selected-day-tasks">
        <div className="selected-day-section-head">
          <h3>Tasks for this day</h3>
          <span>{list.length}</span>
        </div>
        <div className="selected-day-progress"><span style={{ width: `${list.length ? 45 : 0}%` }} /></div>
        <div className="selected-day-task-list">
          <div className="selected-day-task selected-day-task--done">
            <span className="selected-day-task-check"><Icon.Check /></span>
            <span>Review your schedule</span>
            <span className="selected-day-task-more">•••</span>
          </div>
          <div className="selected-day-task">
            <span className="selected-day-task-check" />
            <span>Protect time for your priorities</span>
            <span className="selected-day-task-more">•••</span>
          </div>
          <div className="selected-day-task">
            <span className="selected-day-task-check" />
            <span>Plan tomorrow before winding down</span>
            <span className="selected-day-task-more">•••</span>
          </div>
        </div>
      </div> */}

      <div className="selected-day-quote">
        <Icon.Sparkle />
        <p>A focused day builds<br />a brighter tomorrow.</p>
      </div>
    </aside>
  );
}

/* ============================== CONFLICT BANNER ============================== */
function ConflictBanner({ conflict, onChooseTime, onDismiss }) {
  const slots = useMemo(() => suggestSlotsForConflict(conflict), [conflict]);
  return (
    <div className="conflict-banner">
      <div className="conflict-banner-icon"><Icon.Bolt /></div>
      <div className="conflict-banner-main">
        <div className="conflict-banner-title">Scheduling conflict</div>
        <div className="conflict-banner-desc">
          <strong>{conflict.a.title}</strong> overlaps with <strong>{conflict.b.title}</strong>
          <span className="conflict-banner-time"> · {to12h(conflict.a.start)} – {to12h(conflict.a.end)}</span>
        </div>
        <div className="conflict-suggestions">
          <span className="conflict-suggestions-label">Suggested times</span>
          <div className="conflict-slot-row">
            {slots.map((s) => (
              <button key={s.start} className="conflict-slot" onClick={() => onChooseTime(conflict, s)}>
                {to12h(s.start)} – {to12h(s.end)}
              </button>
            ))}
          </div>
        </div>
      </div>
      <button className="icon-btn conflict-dismiss" onClick={onDismiss}><Icon.Close /></button>
    </div>
  );
}

/* ============================== EVENT MODAL (CREATE / EDIT) ============================== */
function EventModal({ initial, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(initial);
  const [conflict, setConflict] = useState(null);
  const [checkingConflict, setCheckingConflict] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const isEdit = Boolean(initial.id);

  const checkConflict = async () => {
  if (!form.date || !form.start || !form.end) {
    setConflict(null);
    return;
  }

  if (form.end <= form.start) {
    setConflict({
      has_conflict: true,
      message: "End time must be after start time",
      conflicts: [],
      suggestions: []
    });
    return;
  }

  setCheckingConflict(true);

  try {
    const conflictUrl = new URL(
  `${API_BASE}/events/check-conflict`
);

if (isEdit && form.id) {
  conflictUrl.searchParams.set("exclude_event_id", form.id);
}

const response = await fetch(conflictUrl.toString(), {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
      body: JSON.stringify({
        title: form.title || "New Event",
        description: form.description || null,
        start_time: `${form.date}T${form.start}:00`,
        end_time: `${form.date}T${form.end}:00`,
        location: form.location || null,
        priority: form.priority,
        category: form.category,
        status: "scheduled"
      })
    });

    if (!response.ok) {
      throw new Error("Conflict check failed");
    }

    const data = await response.json();
    setConflict(data);
  } catch (error) {
    console.error("Conflict check failed:", error);
    setConflict(null);
  } finally {
    setCheckingConflict(false);
  }
};

useEffect(() => {
  const timer = setTimeout(() => {
    checkConflict();
  }, 400);

  return () => clearTimeout(timer);
}, [form.date, form.start, form.end]);

  const submit = (e) => {

      e.preventDefault();

      if (!form.title.trim() || !form.date || !form.start || !form.end) {
        return;
      }

      if (conflict?.has_conflict) {
        return;
      }

      onSave({
        ...form,
        id: form.id || `ev-${Date.now()}`
      });

  };

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal modal--form" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? 'Edit event' : 'New event'}</h3>
          <button className="icon-btn" onClick={onClose}><Icon.Close /></button>
        </div>

        <form className="event-form" onSubmit={submit}>
          <div className="field">
            <label>Title</label>
            <input value={form.title} onChange={set('title')} placeholder="Add a title" autoFocus required />
          </div>

          <div className="field">
            <label>Description</label>
            <textarea value={form.description || ''} onChange={set('description')} placeholder="Add notes or details" rows={3} />
          </div>

          <div className="field-row">
            <div className="field">
              <label>Date</label>
              <input type="date" value={form.date} onChange={set('date')} required />
            </div>
            <div className="field">
              <label>Start time</label>
              <input type="time" value={form.start} onChange={set('start')} required />
            </div>
            <div className="field">
              <label>End time</label>
              <input type="time" value={form.end} onChange={set('end')} required />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label>Category</label>
              <select value={form.category} onChange={set('category')}>
                {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Priority</label>
              <select value={form.priority} onChange={set('priority')}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="field">
            <label>Location</label>
            <input value={form.location} onChange={set('location')} placeholder="Add a location (optional)" />
          </div>

          {checkingConflict && (
  <div className="conflict-checking">
    Checking your schedule...
  </div>
)}

{!checkingConflict && conflict?.has_conflict && (
  <div className="conflict-warning">

    <div className="conflict-warning-header">
      <span className="conflict-icon">⚠️</span>

      <div>
        <strong>Schedule conflict detected</strong>
        <p>
          This event overlaps with an existing event.
        </p>
      </div>
    </div>

    {conflict.conflicts?.map((item, index) => (
      <div className="conflict-item" key={index}>
        <strong>{item.title}</strong>

        {item.start && item.end && (
          <span>
            {to12h(item.start)} – {to12h(item.end)}
          </span>
        )}
      </div>
    ))}

    {conflict.suggestions?.length > 0 && (
      <div className="conflict-suggestions">

        <span className="suggestions-label">
          Suggested times
        </span>

        <div className="suggestion-list">

          {conflict.suggestions.map((slot, index) => (
            <button
              type="button"
              className="suggestion-btn"
              key={index}
              onClick={() => {
                setForm((f) => ({
                  ...f,
                  start: slot.start,
                  end: slot.end
                }));
              }}
            >
              {to12h(slot.start)} – {to12h(slot.end)}
            </button>
          ))}

        </div>

      </div>
    )}

  </div>
)}

{!checkingConflict && conflict && !conflict.has_conflict && (
  <div className="conflict-success">
    <span>✓</span>
    <span>No scheduling conflicts</span>
  </div>
)}

          <div className="modal-actions">
            
            {isEdit && (
              <button type="button" className="danger-btn" onClick={() => onDelete(form.id)}>
                <Icon.Trash /> Delete
              </button>
            )}
            <div className="modal-actions-right">
              <button type="button" className="ghost-btn" onClick={onClose}>Cancel</button>
              <button type="submit" className="primary-btn" disabled={checkingConflict || conflict?.has_conflict}>
                {checkingConflict ? "Checking..." : isEdit ? "Save changes" : "Create event"} 
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ============================== EVENT DETAILS ============================== */
function EventDetails({ event, onClose, onEdit, onDelete }) {
  const cat = catMeta(event.category);
  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal modal--details" onClick={(e) => e.stopPropagation()}>
        <div className="details-accent" style={{ background: cat.color }} />
        <div className="modal-header">
          <span className="details-cat" style={{ color: cat.color }}><CategoryDot color={cat.color} size={9} /> {cat.label}</span>
          <button className="icon-btn" onClick={onClose}><Icon.Close /></button>
        </div>
        <h2 className="details-title">{event.title}</h2>
        <div className="details-meta">
          <span><Icon.Clock /> {to12h(event.start)} – {to12h(event.end)} · {durationLabel(event.start, event.end)}</span>
          {event.location && <span><Icon.Pin /> {event.location}</span>}
        </div>
        <span className={`priority-tag priority-tag--${event.priority.toLowerCase()}`}>{event.priority} priority</span>
        {event.description && <p className="details-desc">{event.description}</p>}
        <div className="modal-actions">
          <button className="danger-btn" onClick={() => onDelete(event.id)}><Icon.Trash /> Delete</button>
          <div className="modal-actions-right">
            <button className="ghost-btn" onClick={onClose}>Close</button>
            <button className="primary-btn" onClick={() => onEdit(event)}><Icon.Edit /> Edit</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================== AI ASSISTANT PANEL ============================== */
function AIPanel({ open, onClose, events, today, conflicts, onApplySuggestion, onCalendarChanged }) {
  const [messages, setMessages] = useState([
    { id: 'm0', role: 'ai', type: 'text', text: "Hi Jyothi — I'm your calendar assistant. Ask me about your schedule, free time, or let me help resolve a conflict." },
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(null);
  const scrollRef = useRef(null);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const [recording, setRecording] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('');

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, thinking]);

  const send = async (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((m) => [...m, { id: `u-${Date.now()}`, role: 'user', type: 'text', text: trimmed }]);
    setInput('');
    setThinking('NOVA is processing your calendar request...');

    // Extract recent conversational context for multi-turn understanding
    const history = messages
      .slice(-6)
      .map((m) => ({
        role: m.role === 'ai' ? 'assistant' : 'user',
        content: m.text || '',
      }));

    try {
      const resultResponse = await fetch(`${API_BASE}/nova/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: trimmed, history }),
      });
      const result = await resultResponse.json();
      if (!resultResponse.ok) throw new Error(result.detail || 'NOVA could not process that request.');
      setThinking(null);
      setMessages((m) => [
        ...m,
        {
          id: `a-${Date.now()}`,
          role: 'ai',
          type: 'text',
          text: result.message,
          events: result.events || [],
          freeSlots: result.free_slots || [],
          notes: result.notes || [],
          todos: result.todos || [],
        },
      ]);
      if (result.changed) onCalendarChanged();
    } catch (error) {
      setThinking(null);
      setMessages((m) => [...m, { id: `a-${Date.now()}`, role: 'ai', type: 'text', text: error.message || 'NOVA could not process that request.' }]);
    }
  };

  const stopTracks = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const toggleRecording = async () => {
    if (recording) return recorderRef.current?.stop();
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setVoiceStatus('Voice recording is not supported in this browser.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      streamRef.current = stream;
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onstop = async () => {
        setRecording(false);
        stopTracks();
        const audio = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        if (!audio.size) return;
        setVoiceStatus('NOVA is transcribing…');
        try {
          const body = new FormData();
          body.append('audio', audio, 'voice.webm');
          const response = await fetch(`${API_BASE}/voice/transcribe`, { method: 'POST', body });
          const result = await response.json();
          if (!response.ok) throw new Error(result.detail || 'Transcription failed.');
          const transcript = result.text?.trim();
          if (!transcript) throw new Error('No speech was detected. Please try again.');
          setVoiceStatus('');
          send(transcript);
        } catch (error) {
          setVoiceStatus(error.message || 'NOVA could not process that recording.');
        }
      };
      recorder.start();
      setRecording(true);
      setVoiceStatus('Listening… click the microphone to stop.');
    } catch {
      setVoiceStatus('Microphone access was not granted.');
    }
  };

  useEffect(() => () => stopTracks(), []);

  return (
    <>
      {open && <div className="ai-scrim" onClick={onClose} />}
      <aside className={`ai-panel ${open ? 'ai-panel--open' : ''}`}>
        <div className="ai-panel-header">
          <div className="ai-panel-title">
            <span className="ai-panel-icon"><Icon.Sparkle /></span>
            <span>NOVA</span>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon.Close /></button>
        </div>

        <div className="ai-messages" ref={scrollRef}>
          {messages.map((m) => (
            <div key={m.id} className={`ai-msg ai-msg--${m.role}`}>
              {m.role === 'ai' && <span className="ai-msg-avatar"><Icon.Sparkle /></span>}
              <div className="ai-bubble">
                {m.text.split('\n').map((line, i) => <div key={i}>{line || '\u00A0'}</div>)}
                {m.events?.length > 0 && (
  <div className="ai-events-list">
    {m.events.map((event) => (
      <div key={event.id} className="ai-event-card">
        <div className="ai-event-card-top">
          <div className="ai-event-icon">◷</div>

          <div className="ai-event-info">
            <div className="ai-event-title">
              {event.title}
            </div>

            <div className="ai-event-date">
              {new Date(event.start_time).toLocaleDateString([], {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </div>
          </div>
        </div>

        <div className="ai-event-time">
          {new Date(event.start_time).toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit',
          })}
          {' – '}
          {new Date(event.end_time).toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit',
          })}
        </div>

        {event.location && (
          <div className="ai-event-location">
            <span>⌖</span>
            {event.location}
          </div>
        )}
      </div>
    ))}
  </div>
)}

{m.freeSlots?.length > 0 && (
  <div className="ai-free-slots">
    {m.freeSlots.map((slot, index) => (
      <div key={index} className="ai-free-slot">
        <div className="ai-free-slot-icon">
          ◷
        </div>

        <div className="ai-free-slot-info">
          <div className="ai-free-slot-time">
            {new Date(slot.start_time).toLocaleTimeString([], {
              hour: 'numeric',
              minute: '2-digit',
            })}
            {' – '}
            {new Date(slot.end_time).toLocaleTimeString([], {
              hour: 'numeric',
              minute: '2-digit',
            })}
          </div>
        </div>
      </div>
    ))}
  </div>
)}

{m.notes?.length > 0 && (
  <div className="ai-events-list">
    {m.notes.map((note) => (
      <div key={note.id} className="ai-event-card" style={{ borderLeft: '3px solid var(--pink, #e86a9b)' }}>
        <div className="ai-event-card-top">
          <div className="ai-event-icon">📝</div>
          <div className="ai-event-info">
            <div className="ai-event-title">{note.title}</div>
            {note.content && <div className="ai-event-date">{note.content.slice(0, 80)}</div>}
          </div>
        </div>
      </div>
    ))}
  </div>
)}

{m.todos?.length > 0 && (
  <div className="ai-events-list">
    {m.todos.map((todo) => (
      <div key={todo.id} className="ai-event-card" style={{ borderLeft: '3px solid #10b981' }}>
        <div className="ai-event-card-top">
          <div className="ai-event-icon">☑️</div>
          <div className="ai-event-info">
            <div className="ai-event-title" style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
              {todo.title}
            </div>
            <div className="ai-event-date">Priority: {todo.priority}</div>
          </div>
        </div>
      </div>
    ))}
  </div>
)}
                
                {m.type === 'conflict' && m.conflict && (
                  <div className="ai-conflict-card">
                    {suggestSlotsForConflict(m.conflict).slice(0, 3).map((s) => (
                      <button key={s.start} className="conflict-slot conflict-slot--sm" onClick={() => onApplySuggestion(m.conflict.b.id, s)}>
                        {to12h(s.start)} – {to12h(s.end)}
                      </button>
                    ))}
                  </div>
                )}
                {m.type === 'suggestion' && (
                  <div className="ai-suggestion-card">
                    <div className="ai-suggestion-title">{m.title}</div>
                    {m.slots.map((s) => (
                      <button key={s.start} className="conflict-slot conflict-slot--sm" onClick={() => onApplySuggestion(null, s, m.title)}>
                        {to12h(s.start)} – {to12h(s.end)} <span className="choose-label">Choose time</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {thinking && (
            <div className="ai-msg ai-msg--ai">
              <span className="ai-msg-avatar"><Icon.Sparkle /></span>
              <div className="ai-bubble ai-bubble--thinking">
                <span className="thinking-dots"><i /><i /><i /></span>
                {thinking}
              </div>
            </div>
          )}
        </div>

        <div className="ai-quick-chips">
          <button type="button" className="ai-chip" onClick={() => send("Brief me on today")}>
            🌅 Briefing
          </button>
          <button type="button" className="ai-chip" onClick={() => send("When am I free today?")}>
            🕒 Free Time
          </button>
          <button type="button" className="ai-chip" onClick={() => send("Do I have any conflicts?")}>
            ⚠️ Conflicts
          </button>
          <button type="button" className="ai-chip" onClick={() => send("What tasks do I have?")}>
            ☑️ To-dos
          </button>
        </div>

        <form className="ai-input-row" onSubmit={(e) => { e.preventDefault(); send(input); }}>
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about your schedule…" />
          <button type="button" className={`ai-mic-btn ${recording ? 'ai-mic-btn--recording' : ''}`} onClick={toggleRecording} aria-label={recording ? 'Stop recording' : 'Start voice recording'} title={recording ? 'Stop recording' : 'Speak to NOVA'}>
            <Icon.Mic />
          </button>
          <button type="submit" className="ai-send-btn" disabled={!input.trim()}><Icon.Send /></button>
        </form>
        {voiceStatus && <div className="voice-status" role="status">{voiceStatus}</div>}
      </aside>
    </>
  );
}

/* ============================== TOAST ============================== */
function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`toast toast--${toast.type}`}>
      <Icon.Check />
      <span>{toast.message}</span>
    </div>
  );
}

/* ============================== APP ============================== */
export default function App() {
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const userName =
  session?.user?.user_metadata?.full_name ||
  session?.user?.user_metadata?.name ||
  session?.user?.email?.split('@')[0] ||
  'there';

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Logout error:', error);
      return;
    }
  };

  // Restore the Supabase session when NOVA loads and keep it in sync.
  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (mounted) {
        setSession(session);
        setAuthLoading(false);
      }
    };

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(t); }, []);
  const today = now;

  const [events, setEvents] = useState([]);
  const [currentSection, setCurrentSection] = useState('calendar');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [view, setView] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [search, setSearch] = useState('');
  const [activeCats, setActiveCats] = useState(new Set(CATEGORIES.map((c) => c.id)));
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [modal, setModal] = useState(null); // {mode:'create'|'edit', data}
  const [detailsEvent, setDetailsEvent] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [dismissedConflicts, setDismissedConflicts] = useState(new Set());
  const [toast, setToast] = useState(null);

  const flashToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2400);
  };

  const loadEvents = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/events/`);
      if (!response.ok) throw new Error('Unable to load calendar events.');
      setEvents((await response.json()).map(eventToUI));
    } catch {
      flashToast('Calendar data is unavailable. Start the backend to sync events.', 'neutral');
    }
  }, []);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const visibleEvents = useMemo(() => {
    return events.filter((e) => activeCats.has(e.category) && e.title.toLowerCase().includes(search.toLowerCase()));
  }, [events, activeCats, search]);

  const conflicts = useMemo(() => findConflicts(visibleEvents), [visibleEvents]);
  const bannerConflict = conflicts.find((c) => c.date === isoDate(currentDate) && !dismissedConflicts.has(c.id));

  const toggleCat = (id) => setActiveCats((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });

  const goPrev = () => setCurrentDate((d) => view === 'month' ? addDays(startOfMonth(d), -1) : addDays(d, view === 'week' ? -7 : -1));
  const goNext = () => setCurrentDate((d) => view === 'month' ? addDays(new Date(d.getFullYear(), d.getMonth() + 1, 1), 0) : addDays(d, view === 'week' ? 7 : 1));
  const goToday = () => { const d = new Date(); setCurrentDate(d); setSelectedDay(d); setView('month'); };

  const periodLabel = view === 'month'
    ? fmtMonthYear(currentDate)
    : view === 'week'
      ? (() => { const days = buildWeek(currentDate); return `${days[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${days[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`; })()
      : fmtDayHeader(currentDate);

  const openCreate = (date) => setModal({
    mode: 'create',
    data: { title: '', description: '', date: isoDate(date || currentDate), start: '09:00', end: '10:00', category: 'work', priority: 'Medium', location: '' },
  });
  const openEdit = (event) => { setDetailsEvent(null); setModal({ mode: 'edit', data: event }); };

  const handleScheduleFromOther = (item) => {
    setCurrentSection('calendar');
    setModal({
      mode: 'create',
      data: {
        title: item.title || '',
        description: item.description || '',
        date: item.date || isoDate(currentDate),
        start: '09:00',
        end: '10:00',
        category: item.category || 'work',
        priority: item.priority || 'Medium',
        location: item.location || '',
      },
    });
  };

  const saveEvent = async (data) => {
    const editing = Boolean(data.id && !String(data.id).startsWith('ev-'));
    const response = await fetch(`${API_BASE}/events/${editing ? data.id : ''}`, {
      method: editing ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventToAPI(data)),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      flashToast(error.detail?.message || error.detail || 'Unable to save event.', 'neutral');
      return;
    }
    setModal(null);
    await loadEvents();
    flashToast(editing ? 'Event updated' : 'Event created');
  };
  const deleteEvent = async (id) => {
    const response = await fetch(`${API_BASE}/events/${id}`, { method: 'DELETE' });
    if (!response.ok) { flashToast('Unable to delete event.', 'neutral'); return; }
    setModal(null);
    setDetailsEvent(null);
    await loadEvents();
    flashToast('Event deleted', 'neutral');
  };

  const applyConflictSlot = (conflict, slot) => {
    setEvents((prev) => prev.map((e) => (e.id === conflict.b.id ? { ...e, start: slot.start, end: slot.end } : e)));
    setDismissedConflicts((prev) => new Set(prev).add(conflict.id));
    flashToast('Event rescheduled');
  };

  const applyAISuggestion = (eventId, slot, title) => {
    if (eventId) {
      setEvents((prev) => prev.map((e) => (e.id === eventId ? { ...e, start: slot.start, end: slot.end } : e)));
      flashToast('Event rescheduled');
    } else {
      setEvents((prev) => [...prev, { id: `ai-${Date.now()}`, title: title || 'Focus block', description: 'Scheduled by AI Assistant', date: isoDate(currentDate), start: slot.start, end: slot.end, category: 'focus', priority: 'Medium', location: '' }]);
      flashToast('Focus block added to your calendar');
    }
  };

  const weekDays = useMemo(() => buildWeek(currentDate), [currentDate]);

  // Auth gate must come AFTER all hooks so React's hook order never changes.
  if (authLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        Loading NOVA...
      </div>
    );
  }

  if (!session) {
  if (showCreateAccount) {
    return (
      <CreateAccount
        onBackToLogin={() => setShowCreateAccount(false)}
      />
    );
  }

  return (
    <Login
      onCreateAccount={() => setShowCreateAccount(true)}
      onGuestLogin={() => setSession({ user: { email: 'guest@nova.ai', user_metadata: { full_name: 'Jyothi' } } })}
    />
  );
}

  return (
    <div className="app-shell">
      <Sidebar
        view={view} setView={setView} currentDate={currentDate} goToday={goToday}
        activeCats={activeCats} toggleCat={toggleCat}
        mobileOpen={mobileNavOpen} closeMobile={() => setMobileNavOpen(false)}
        currentSection={currentSection} setCurrentSection={setCurrentSection}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <div className="main-col">
        <TopBar
          view={view} setView={setView} currentDate={currentDate}
          onPrev={goPrev} onNext={goNext} onToday={goToday}
          label={
            currentSection === 'notes'
              ? 'Notes & Reflections'
              : currentSection === 'to-do'
              ? 'To-Do List & Tasks'
              : currentSection === 'habits'
              ? 'Daily Habits & Streaks'
              : periodLabel
          }
          search={search} setSearch={setSearch}
          onNewEvent={() => {
            if (currentSection !== 'calendar') {
              setCurrentSection('calendar');
            }
            openCreate(currentDate);
          }}
          onOpenAI={() => setAiOpen(true)}
          onMenu={() => setMobileNavOpen(true)}
          handleLogout={handleLogout}
          currentSection={currentSection}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        {bannerConflict && (
          <ConflictBanner
            conflict={bannerConflict}
            onChooseTime={applyConflictSlot}
            onDismiss={() => setDismissedConflicts((prev) => new Set(prev).add(bannerConflict.id))}
          />
        )}

       <section className="dashboard-intro">
        <div>
          <h1>
            Hello, <span>{userName}</span>
          </h1>
          <p>You've got this. One step at a time.</p>
        </div>
      </section>

        <section className="dashboard-stats">
          <div className="stat-card">
            <span className="stat-icon stat-icon--pink"><Icon.Cal /></span>
            <div><strong>{events.filter((e) => e.date === isoDate(today)).length} Events</strong><span>Today</span></div>
          </div>
          <div className="stat-card">
            <span className="stat-icon"><Icon.List /></span>
            <div><strong>{events.length}</strong><span>Scheduled</span></div>
          </div>
          <div className="stat-card">
            <span className="stat-icon stat-icon--purple"><Icon.Bolt /></span>
            <div><strong>{events.filter((e) => new Date(`${e.date}T${e.start}:00`) >= today).length}</strong><span>Upcoming</span></div>
          </div>
        </section>

        {currentSection === 'calendar' && (
          <div className="workspace-grid">
          <div className="calendar-area">

  {/* Calendar controls */}
  <div className="calendar-toolbar">

    <div className="calendar-toolbar-left">
      <span className="calendar-toolbar-period">{periodLabel}</span>
    </div>

    <div className="date-nav">
          <button className="icon-btn" onClick={goPrev}><Icon.ChevronLeft /></button>
          <button className="icon-btn" onClick={goNext}><Icon.ChevronRight /></button>
          <button className="today-btn" onClick={goToday}>Today</button>
    </div>

    <div className="calendar-view-switch">
      <button
        type="button"
        className={`calendar-view-btn ${view === 'month' ? 'is-active' : ''}`}
        onClick={() => setView('month')}
      >
        <Icon.Grid />
        <span>Month</span>
      </button>

      <button
        type="button"
        className={`calendar-view-btn ${view === 'week' ? 'is-active' : ''}`}
        onClick={() => setView('week')}
      >
        <Icon.Columns />
        <span>Week</span>
      </button>

      <button
        type="button"
        className={`calendar-view-btn ${view === 'day' ? 'is-active' : ''}`}
        onClick={() => setView('day')}
      >
        <Icon.List />
        <span>Day</span>
      </button>
    </div>

  </div>


  {/* Existing calendar views */}
  {view === 'month' && (
    <MonthView
      currentDate={currentDate}
      events={visibleEvents}
      today={today}
      onDayClick={(d) => {
        setCurrentDate(d);
        setSelectedDay(d);
      }}
      onEventClick={setDetailsEvent}
    />
  )}

  {view === 'week' && (
    <TimeGrid
      days={weekDays}
      events={visibleEvents}
      today={today}
      onEventClick={setDetailsEvent}
      now={now}
    />
  )}

  {view === 'day' && (
    <div className="day-view">
      <TimeGrid
        days={[currentDate]}
        events={visibleEvents}
        today={today}
        onEventClick={setDetailsEvent}
        now={now}
      />
    </div>
  )}

</div>

          {selectedDay ? (
            <SelectedDayPanel
              day={selectedDay}
              events={visibleEvents}
              onClose={() => setSelectedDay(null)}
              onEventClick={setDetailsEvent}
              onAddEvent={openCreate}
            />
          ) : (
          <aside className="dashboard-rail">
            <div className="rail-quote">
              <Icon.Sparkle />
              <p>A well planned day<br />leads to a brighter you.</p>
            </div>

            <div className="rail-nova">
              <div className="rail-card-header">
                <div><span className="rail-spark"><Icon.Sparkle /></span> Ask NOVA <span className="beta-badge">Beta</span></div>
                <button className="rail-mic" onClick={() => setAiOpen(true)}><Icon.Mic /></button>
              </div>
              <p>Plan, schedule, reschedule or just talk...</p>
              <button onClick={() => { setAiOpen(true); }} className="rail-prompt">“What's on my schedule today?” <span>→</span></button>
              <button onClick={() => { setAiOpen(true); }} className="rail-prompt">“Add a study session tomorrow at 5 PM” <span>→</span></button>
              <button onClick={() => { setAiOpen(true); }} className="rail-prompt">“Show me my free time this week” <span>→</span></button>
            </div>

            <div className="rail-today">
              <div className="rail-today-header">
                <div><h3>Today · {today.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}</h3></div>
                <button onClick={() => { setCurrentDate(new Date()); setView('day'); }}>View All</button>
              </div>
              <div className="rail-event-list">
                {events.filter((e) => e.date === isoDate(today)).sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start)).slice(0, 5).map((event) => {
                  const cat = catMeta(event.category);
                  return (
                    <button key={event.id} className="rail-event" onClick={() => setDetailsEvent(event)}>
                      <span className="rail-event-icon" style={{ color: cat.color, background: `${cat.color}22` }}><Icon.Cal /></span>
                      <span className="rail-event-copy"><strong>{event.title}</strong><small>{to12h(event.start)}</small></span>
                      <span className="rail-check" />
                    </button>
                  );
                })}
                {!events.some((e) => e.date === isoDate(today)) && <div className="rail-empty">Nothing scheduled today.</div>}
              </div>
            </div>

            <div className="rail-footer-quote">
              <p>Small steps<br />create big changes.</p>
              <span />
            </div>
          </aside>
          )}
        </div>
        )}

        {currentSection === 'notes' && (
          <div className="workspace-pane" style={{ padding: '8px 24px 48px 24px' }}>
            <NotesView
              apiBase={API_BASE}
              flashToast={flashToast}
              onScheduleEvent={handleScheduleFromOther}
            />
          </div>
        )}

        {currentSection === 'to-do' && (
          <div className="workspace-pane" style={{ padding: '8px 24px 48px 24px' }}>
            <TodoView
              apiBase={API_BASE}
              flashToast={flashToast}
              onScheduleEvent={handleScheduleFromOther}
            />
          </div>
        )}

        {currentSection === 'habits' && (
          <div className="workspace-pane" style={{ padding: '8px 24px 48px 24px' }}>
            <HabitsView
              apiBase={API_BASE}
              flashToast={flashToast}
            />
          </div>
        )}
      </div>

      <AIPanel
        open={aiOpen} onClose={() => setAiOpen(false)}
        events={visibleEvents} today={today} conflicts={conflicts}
        onApplySuggestion={applyAISuggestion}
        onCalendarChanged={loadEvents}
      />

      {modal && (
        <EventModal
          initial={modal.data}
          onClose={() => setModal(null)}
          onSave={saveEvent}
          onDelete={deleteEvent}
        />
      )}

      {detailsEvent && (
        <EventDetails
          event={detailsEvent}
          onClose={() => setDetailsEvent(null)}
          onEdit={openEdit}
          onDelete={deleteEvent}
        />
      )}

      {settingsOpen && (
        <SettingsModal
          user={session?.user}
          defaultView={view}
          setDefaultView={setView}
          flashToast={flashToast}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      <Toast toast={toast} />
    </div>
  );
}