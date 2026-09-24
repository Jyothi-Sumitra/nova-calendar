import { useState, useEffect, useMemo } from 'react';
import './HabitsView.css';

const HABIT_CATEGORIES = [
  { id: 'health', label: 'Health & Wellness', color: '#146B54' },
  { id: 'focus', label: 'Focus & Productivity', color: '#9786e8' },
  { id: 'personal', label: 'Personal Growth', color: '#2C5282' },
  { id: 'work', label: 'Work & Craft', color: '#A23B3B' },
];

export default function HabitsView({ apiBase, flashToast }) {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);

  const fetchHabits = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiBase}/habits/`);
      if (!res.ok) throw new Error('Failed to load habits');
      const data = await res.json();
      setHabits(data);
    } catch {
      const stored = localStorage.getItem('nova_habits');
      if (stored) {
        try {
          setHabits(JSON.parse(stored));
        } catch {
          // ignore
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, []);

  useEffect(() => {
    if (habits.length > 0) {
      localStorage.setItem('nova_habits', JSON.stringify(habits));
    }
  }, [habits]);

  // Current week 7 days (Monday - Sunday)
  const currentWeekDays = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 is Sun, 1 is Mon...
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      const dow = d.toLocaleDateString(undefined, { weekday: 'short' });
      const dom = d.getDate();
      const isToday = iso === today.toISOString().split('T')[0];
      return { date: d, iso, dow, dom, isToday };
    });
  }, []);

  const handleToggleDay = async (habit, dateIso) => {
    let completedDates = [];
    try {
      completedDates = JSON.parse(habit.completed_dates || '[]');
    } catch {
      completedDates = [];
    }

    const isDone = completedDates.includes(dateIso);
    const nextDates = isDone
      ? completedDates.filter((d) => d !== dateIso)
      : [...completedDates, dateIso];

    // Optimistic UI update
    setHabits((prev) =>
      prev.map((h) =>
        h.id === habit.id
          ? {
              ...h,
              completed_dates: JSON.stringify(nextDates),
              streak: !isDone ? h.streak + 1 : Math.max(0, h.streak - 1),
            }
          : h
      )
    );

    try {
      const res = await fetch(`${apiBase}/habits/${habit.id}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateIso }),
      });
      if (res.ok) {
        const updated = await res.json();
        setHabits((prev) =>
          prev.map((h) => (h.id === updated.id ? updated : h))
        );
        flashToast?.(!isDone ? 'Habit checked! Keep the streak 🔥' : 'Habit unmarked');
      }
    } catch {
      flashToast?.(!isDone ? 'Checked offline' : 'Unmarked offline');
    }
  };

  const handleCreateHabit = async (formData) => {
    try {
      const isEdit = Boolean(formData.id);
      const url = `${apiBase}/habits/${isEdit ? formData.id : ''}`;
      const method = isEdit ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description || null,
          category: formData.category || 'health',
          color: formData.color || '#146B54',
          target_days: Number(formData.target_days) || 7,
        }),
      });

      if (res.ok) {
        const saved = await res.json();
        if (isEdit) {
          setHabits((prev) => prev.map((h) => (h.id === saved.id ? saved : h)));
        } else {
          setHabits((prev) => [saved, ...prev]);
        }
        flashToast?.(isEdit ? 'Habit updated' : 'Habit created');
      } else {
        throw new Error('API failed');
      }
    } catch {
      const localHabit = {
        ...formData,
        id: formData.id || Date.now(),
        streak: formData.streak || 0,
        best_streak: formData.best_streak || 0,
        completed_dates: formData.completed_dates || '[]',
        created_at: new Date().toISOString(),
      };
      setHabits((prev) => [localHabit, ...prev.filter((h) => h.id !== localHabit.id)]);
      flashToast?.('Habit saved locally');
    }
    setModalOpen(false);
    setEditingHabit(null);
  };

  const handleDeleteHabit = async (id) => {
    try {
      await fetch(`${apiBase}/habits/${id}`, { method: 'DELETE' });
    } catch {
      // ignore
    }
    setHabits((prev) => prev.filter((h) => h.id !== id));
    flashToast?.('Habit deleted', 'neutral');
  };

  const bestOverallStreak = habits.reduce(
    (max, h) => Math.max(max, h.best_streak || h.streak || 0),
    0
  );

  const todayIso = new Date().toISOString().split('T')[0];
  const completedToday = habits.filter((h) => {
    try {
      return JSON.parse(h.completed_dates || '[]').includes(todayIso);
    } catch {
      return false;
    }
  }).length;

  return (
    <div className="habits-view">
      {/* Header */}
      <div className="habits-header">
        <div className="habits-title-group">
          <h2>Daily Habits & Rituals</h2>
          <p>“We are what we repeatedly do. Excellence, then, is not an act, but a habit.”</p>
        </div>
        <div>
          <button
            className="notes-new-btn"
            onClick={() => {
              setEditingHabit(null);
              setModalOpen(true);
            }}
          >
            <span>+</span>
            <span>New Habit</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="habits-stats-row">
        <div className="habit-stat-box">
          <div className="habit-stat-icon">🌱</div>
          <div className="habit-stat-data">
            <strong>{habits.length}</strong>
            <span>Active Habits</span>
          </div>
        </div>

        <div className="habit-stat-box">
          <div className="habit-stat-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#dc2626' }}>
            🔥
          </div>
          <div className="habit-stat-data">
            <strong>{bestOverallStreak} Days</strong>
            <span>Personal Best Streak</span>
          </div>
        </div>

        <div className="habit-stat-box">
          <div className="habit-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#059669' }}>
            ✓
          </div>
          <div className="habit-stat-data">
            <strong>
              {completedToday} of {habits.length}
            </strong>
            <span>Completed Today</span>
          </div>
        </div>
      </div>

      {/* Habits List */}
      <div className="habits-list">
        {habits.length === 0 && (
          <div className="notes-empty">
            <span className="notes-empty-icon">🎯</span>
            <h3>No habits tracked yet</h3>
            <p>
              Build lasting momentum. Create a daily habit like meditation, reading, or exercise.
            </p>
            <button
              className="notes-new-btn"
              onClick={() => {
                setEditingHabit(null);
                setModalOpen(true);
              }}
            >
              Add First Habit
            </button>
          </div>
        )}

        {habits.map((habit) => {
          let datesSet = new Set();
          try {
            datesSet = new Set(JSON.parse(habit.completed_dates || '[]'));
          } catch {
            datesSet = new Set();
          }

          const completedThisWeek = currentWeekDays.filter((d) =>
            datesSet.has(d.iso)
          ).length;

          return (
            <div key={habit.id} className="habit-card">
              <div className="habit-card-top">
                <div className="habit-card-info">
                  <h3>{habit.title}</h3>
                  {habit.description && <p>{habit.description}</p>}
                </div>

                <div className="habit-streak-pill">
                  <span>🔥</span>
                  <span>{habit.streak || 0} Day Streak</span>
                </div>
              </div>

              {/* 7-Day Week Buttons */}
              <div className="habit-days-row">
                {currentWeekDays.map((d) => {
                  const done = datesSet.has(d.iso);
                  return (
                    <div key={d.iso} className="habit-day-item">
                      <span className="habit-day-label">{d.dow}</span>
                      <button
                        type="button"
                        className={`habit-day-btn ${
                          done ? 'habit-day-btn--done' : ''
                        } ${d.isToday ? 'habit-day-btn--today' : ''}`}
                        onClick={() => handleToggleDay(habit, d.iso)}
                        title={`${d.dow}, ${d.iso}: ${
                          done ? 'Completed (Click to undo)' : 'Click to complete'
                        }`}
                      >
                        {done ? '✓' : ''}
                      </button>
                      <span className="habit-day-date">{d.dom}</span>
                    </div>
                  );
                })}
              </div>

              <div className="habit-card-footer">
                <span>
                  Weekly Goal: {completedThisWeek} / {habit.target_days || 7} days
                  completed
                </span>

                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    className="note-icon-btn"
                    onClick={() => {
                      setEditingHabit(habit);
                      setModalOpen(true);
                    }}
                    title="Edit habit"
                  >
                    ✏️
                  </button>
                  <button
                    className="note-icon-btn note-icon-btn--danger"
                    onClick={() => handleDeleteHabit(habit.id)}
                    title="Delete habit"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Habit Modal */}
      {modalOpen && (
        <HabitModal
          habit={editingHabit}
          onClose={() => {
            setModalOpen(false);
            setEditingHabit(null);
          }}
          onSave={handleCreateHabit}
        />
      )}
    </div>
  );
}

function HabitModal({ habit, onClose, onSave }) {
  const [title, setTitle] = useState(habit?.title || '');
  const [description, setDescription] = useState(habit?.description || '');
  const [category, setCategory] = useState(habit?.category || 'health');
  const [targetDays, setTargetDays] = useState(habit?.target_days || 7);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      ...(habit || {}),
      title: title.trim(),
      description: description.trim() || null,
      category,
      target_days: Number(targetDays),
    });
  };

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div
        className="modal"
        style={{ maxWidth: 480 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{habit ? 'Edit Habit' : 'New Habit'}</h2>
          <button className="icon-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="note-modal-body">
            <div className="field">
              <label>Habit Name</label>
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Morning 20m Walk, Read 15 Pages..."
                required
              />
            </div>

            <div className="field">
              <label>Motivation / Details</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Uninterrupted focus before 10 AM"
              />
            </div>

            <div className="field-row">
              <div className="field">
                <label>Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {HABIT_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Target Days / Week</label>
                <select
                  value={targetDays}
                  onChange={(e) => setTargetDays(Number(e.target.value))}
                >
                  <option value={7}>Daily (7 days)</option>
                  <option value={5}>Weekdays (5 days)</option>
                  <option value={4}>4 days / week</option>
                  <option value={3}>3 days / week</option>
                </select>
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="ghost-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-btn">
              {habit ? 'Save Changes' : 'Create Habit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
