import { useState, useMemo, useEffect } from 'react';
import './TodoView.css';

const TodoIcon = {
  Check: (p) => (<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 13l4 4L19 7"/></svg>),
  Close: (p) => (<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}><path d="M6 6l12 12M18 6L6 18"/></svg>),
  Calendar: (p) => (<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>),
  Edit: (p) => (<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>),
  Trash: (p) => (<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>),
  Plus: (p) => (<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}><path d="M12 5v14M5 12h14"/></svg>),
  Tasks: (p) => (<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 10l2 2 4-4"/></svg>),
};


const PRIORITIES = [
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Medium' },
  { id: 'high', label: 'High' },
];

const CATEGORIES = [
  { id: 'all', label: 'All Categories' },
  { id: 'work', label: 'Work' },
  { id: 'personal', label: 'Personal' },
  { id: 'focus', label: 'Focus' },
  { id: 'health', label: 'Health' },
  { id: 'meeting', label: 'Meeting' },
];

export default function TodoView({ apiBase, flashToast, onScheduleEvent }) {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | pending | today | high | completed
  const [selectedCat, setSelectedCat] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Quick Add State
  const [quickTitle, setQuickTitle] = useState('');
  const [quickPriority, setQuickPriority] = useState('medium');
  const [quickCategory, setQuickCategory] = useState('work');
  const [quickDueDate, setQuickDueDate] = useState('');

  // Expandable subtasks state per card
  const [expandedSubtasks, setExpandedSubtasks] = useState({});

  // Edit / Create Modal State
  const [editingTodo, setEditingTodo] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiBase}/todos/`);
      if (!res.ok) throw new Error('Failed to load todos');
      const data = await res.json();
      setTodos(data);
    } catch {
      const stored = localStorage.getItem('nova_todos');
      if (stored) {
        try {
          setTodos(JSON.parse(stored));
        } catch {
          // ignore
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  useEffect(() => {
    if (todos.length > 0) {
      localStorage.setItem('nova_todos', JSON.stringify(todos));
    }
  }, [todos]);

  const handleQuickAdd = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!quickTitle.trim()) {
      setCreateModalOpen(true);
      return;
    }

    const payload = {
      title: quickTitle.trim(),
      description: '',
      completed: false,
      priority: quickPriority,
      category: quickCategory,
      due_date: quickDueDate ? `${quickDueDate}T17:00:00` : null,
      subtasks: '[]',
    };

    try {
      const res = await fetch(`${apiBase}/todos/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const saved = await res.json();
        setTodos((prev) => [saved, ...prev]);
        flashToast?.('Task added to to-do list');
      } else {
        throw new Error('API create failed');
      }
    } catch {
      const localItem = {
        ...payload,
        id: Date.now(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setTodos((prev) => [localItem, ...prev]);
      flashToast?.('Task saved locally');
    }

    setQuickTitle('');
    setQuickDueDate('');
    // Auto-switch to All so the newly added task is instantly visible!
    setFilter('all');
    setSelectedCat('all');
  };

  const handleCreateTask = async (formData) => {
    const payload = {
      title: formData.title.trim(),
      description: formData.description ? formData.description.trim() : null,
      completed: false,
      priority: formData.priority || 'medium',
      category: formData.category || 'work',
      due_date: formData.due_date ? `${formData.due_date}T17:00:00` : null,
      subtasks: formData.subtasks || '[]',
    };

    try {
      const res = await fetch(`${apiBase}/todos/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const saved = await res.json();
        setTodos((prev) => [saved, ...prev]);
        flashToast?.('Task created successfully! 🎉');
      } else {
        throw new Error('API create failed');
      }
    } catch {
      const localItem = {
        ...payload,
        id: Date.now(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setTodos((prev) => [localItem, ...prev]);
      flashToast?.('Task saved locally');
    }

    setFilter('all');
    setSelectedCat('all');
    setCreateModalOpen(false);
  };

  const handleToggleComplete = async (todo) => {
    const nextCompleted = !todo.completed;
    try {
      await fetch(`${apiBase}/todos/${todo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: nextCompleted }),
      });
    } catch {
      // ignore
    }

    setTodos((prev) =>
      prev.map((t) => (t.id === todo.id ? { ...t, completed: nextCompleted } : t))
    );
    flashToast?.(nextCompleted ? 'Task marked complete! 🎉' : 'Task reopened');
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`${apiBase}/todos/${id}`, { method: 'DELETE' });
    } catch {
      // ignore
    }
    setTodos((prev) => prev.filter((t) => t.id !== id));
    flashToast?.('Task deleted', 'neutral');
  };

  const handleToggleSubtask = async (todo, subtaskId) => {
    let subtasks = [];
    try {
      subtasks = JSON.parse(todo.subtasks || '[]');
    } catch {
      subtasks = [];
    }

    const updated = subtasks.map((st) =>
      st.id === subtaskId ? { ...st, done: !st.done } : st
    );

    const updatedStr = JSON.stringify(updated);

    try {
      await fetch(`${apiBase}/todos/${todo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subtasks: updatedStr }),
      });
    } catch {
      // ignore
    }

    setTodos((prev) =>
      prev.map((t) => (t.id === todo.id ? { ...t, subtasks: updatedStr } : t))
    );
  };

  const handleSaveEdit = async (formData) => {
    try {
      const res = await fetch(`${apiBase}/todos/${formData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const saved = await res.json();
        setTodos((prev) => prev.map((t) => (t.id === saved.id ? saved : t)));
        flashToast?.('Task updated');
      }
    } catch {
      setTodos((prev) =>
        prev.map((t) => (t.id === formData.id ? { ...t, ...formData } : t))
      );
      flashToast?.('Task updated locally');
    }
    setEditingTodo(null);
  };

  // Stats calculation
  const totalCount = todos.length;
  const completedCount = todos.filter((t) => t.completed).length;
  const pendingCount = totalCount - completedCount;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Filtering
  const filteredTodos = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return todos.filter((t) => {
      // Filter tab
      if (filter === 'pending' && t.completed) return false;
      if (filter === 'completed' && !t.completed) return false;
      if (filter === 'high' && (t.priority !== 'high' || t.completed)) return false;
      if (filter === 'today') {
        if (!t.due_date) return false;
        const dueDateStr = t.due_date.split('T')[0];
        if (dueDateStr !== todayStr) return false;
      }

      // Category filter
      if (selectedCat !== 'all' && t.category !== selectedCat) return false;

      // Search
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchDesc = t.description && t.description.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc) return false;
      }

      return true;
    });
  }, [todos, filter, selectedCat, searchQuery]);

  return (
    <div className="todo-view">
      {/* Top Header & Progress */}
      <div className="todo-header">
        <div className="todo-header-top">
          <div className="todo-title-group">
            <h2>To-Do List & Deliverables</h2>
            <p>
              Stay organized, track action items, and bridge tasks directly into your calendar.
            </p>
          </div>
          <button
            type="button"
            className="todo-new-btn"
            onClick={() => setCreateModalOpen(true)}
          >
            <TodoIcon.Plus />
            <span>New Task</span>
          </button>
        </div>

        {/* Progress Tracker Card */}
        <div className="todo-progress-card">
          <div className="todo-progress-header">
            <div className="todo-progress-title-col">
              <span className="todo-progress-kicker">Task Overview</span>
              <strong className="todo-progress-stat">
                {completedCount} of {totalCount} completed
              </strong>
            </div>

            <div className="todo-progress-stats-group">
              <div className="todo-mini-metric">
                <span className="todo-mini-metric-num">{pendingCount}</span>
                <span className="todo-mini-metric-lbl">Pending</span>
              </div>
              <div className="todo-mini-metric">
                <span className="todo-mini-metric-num todo-mini-metric-num--green">{completedCount}</span>
                <span className="todo-mini-metric-lbl">Completed</span>
              </div>
              <div className="todo-mini-metric">
                <span className="todo-mini-metric-num todo-mini-metric-num--accent">{progressPercent}%</span>
                <span className="todo-mini-metric-lbl">Rate</span>
              </div>
            </div>
          </div>

          <div className="todo-progress-track">
            <div
              className="todo-progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quick Add Bar */}
      <form className="todo-quick-add" onSubmit={handleQuickAdd}>
        <input
          className="todo-quick-input"
          placeholder="What needs to be accomplished next? Press Enter or click + Add Task..."
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
        />

        <input
          type="date"
          className="todo-quick-date"
          value={quickDueDate}
          onChange={(e) => setQuickDueDate(e.target.value)}
          title="Due date"
        />

        <select
          className="todo-quick-select"
          value={quickPriority}
          onChange={(e) => setQuickPriority(e.target.value)}
          title="Priority"
        >
          <option value="low">Low Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="high">High Priority</option>
        </select>

        <select
          className="todo-quick-select"
          value={quickCategory}
          onChange={(e) => setQuickCategory(e.target.value)}
          title="Category"
        >
          <option value="work">Work</option>
          <option value="personal">Personal</option>
          <option value="focus">Focus</option>
          <option value="health">Health</option>
          <option value="meeting">Meeting</option>
        </select>

        <button type="submit" className="todo-quick-btn">
          <TodoIcon.Plus />
          <span>Add Task</span>
        </button>
      </form>

      {/* Filter Row */}
      <div className="todo-filter-row">
        <div className="todo-tabs">
          {[
            { id: 'all', label: `All (${totalCount})` },
            { id: 'pending', label: `Pending (${pendingCount})` },
            { id: 'today', label: 'Due Today' },
            { id: 'high', label: 'High Priority' },
            { id: 'completed', label: `Completed (${completedCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`todo-tab ${filter === tab.id ? 'todo-tab--active' : ''}`}
              onClick={() => setFilter(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="todo-tabs">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`todo-tab ${
                selectedCat === cat.id ? 'todo-tab--active' : ''
              }`}
              onClick={() => setSelectedCat(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div className="todo-list">
        {filteredTodos.length === 0 && (
          <div className="todo-empty-state">
            <h3>No tasks found in this view</h3>
            <p>
              {filter !== 'all' || selectedCat !== 'all' || searchQuery
                ? 'Try clearing your filters or searching for something else.'
                : 'All caught up! Add a new task above to stay productive.'}
            </p>
          </div>
        )}

        {filteredTodos.map((todo) => {
          let subtasksList = [];
          try {
            subtasksList = JSON.parse(todo.subtasks || '[]');
          } catch {
            subtasksList = [];
          }

          const dueDateObj = todo.due_date ? new Date(todo.due_date) : null;
          const isOverdue =
            dueDateObj &&
            !todo.completed &&
            dueDateObj < new Date(new Date().setHours(0, 0, 0, 0));
          const isToday =
            dueDateObj &&
            dueDateObj.toISOString().split('T')[0] ===
              new Date().toISOString().split('T')[0];
          const totalSubtasks = subtasksList.length;
          const completedSubtasks = subtasksList.filter((s) => s.done).length;
          const isExpanded = Boolean(expandedSubtasks[todo.id]);

          return (
            <div
              key={todo.id}
              className={`todo-card todo-card--priority-${todo.priority || 'medium'} ${
                todo.completed ? 'todo-card--completed' : ''
              }`}
            >
              <div className="todo-card-accent" />

              <div className="todo-card-inner">
                {/* Header Row: Badges on left, Action buttons on right */}
                <div className="todo-card-topbar">
                  <div className="todo-card-badges">
                    <span
                      className={`todo-priority-pill todo-priority-pill--${todo.priority || 'medium'}`}
                    >
                      <span className="todo-priority-dot" />
                      {(todo.priority || 'medium').toUpperCase()}
                    </span>

                    <span className="todo-cat-pill">
                      {todo.category || 'work'}
                    </span>

                    {dueDateObj && (
                      <span
                        className={`todo-due-pill ${
                          isOverdue
                            ? 'todo-due-pill--overdue'
                            : isToday
                            ? 'todo-due-pill--today'
                            : ''
                        }`}
                      >
                        <TodoIcon.Calendar />
                        <span>
                          {isToday
                            ? 'Due Today'
                            : isOverdue
                            ? `Overdue (${dueDateObj.toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                              })})`
                            : dueDateObj.toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                              })}
                        </span>
                      </span>
                    )}

                    {todo.completed && (
                      <span className="todo-completed-pill">
                        ✓ Completed
                      </span>
                    )}
                  </div>

                  <div className="todo-card-actions">
                    {onScheduleEvent && !todo.completed && (
                      <button
                        className="todo-action-btn todo-action-btn--calendar"
                        onClick={() =>
                          onScheduleEvent({
                            title: todo.title,
                            description: todo.description || '',
                            date: todo.due_date ? todo.due_date.split('T')[0] : null,
                            category: todo.category || 'work',
                            priority:
                              (todo.priority &&
                                todo.priority[0].toUpperCase() +
                                  todo.priority.slice(1)) ||
                              'Medium',
                          })
                        }
                        title="Schedule on Calendar"
                        aria-label="Schedule on Calendar"
                      >
                        <TodoIcon.Calendar />
                      </button>
                    )}

                    <button
                      className="todo-action-btn todo-action-btn--edit"
                      onClick={() => setEditingTodo({ ...todo })}
                      title="Edit task"
                      aria-label="Edit task"
                    >
                      <TodoIcon.Edit />
                    </button>

                    <button
                      className="todo-action-btn todo-action-btn--danger"
                      onClick={() => handleDelete(todo.id)}
                      title="Delete task"
                      aria-label="Delete task"
                    >
                      <TodoIcon.Trash />
                    </button>
                  </div>
                </div>

                {/* Card Main: Checkbox + Content */}
                <div className="todo-card-body">
                  <button
                    type="button"
                    className={`todo-squircle-check ${
                      todo.completed ? 'todo-squircle-check--checked' : ''
                    }`}
                    onClick={() => handleToggleComplete(todo)}
                    aria-label={
                      todo.completed ? 'Mark task incomplete' : 'Mark task completed'
                    }
                  >
                    {todo.completed && <TodoIcon.Check />}
                  </button>

                  <div className="todo-card-main-text">
                    <h3
                      className={`todo-card-title ${
                        todo.completed ? 'todo-card-title--done' : ''
                      }`}
                    >
                      {todo.title}
                    </h3>

                    {todo.description && (
                      <p
                        className={`todo-card-desc ${
                          todo.completed ? 'todo-card-desc--done' : ''
                        }`}
                      >
                        {todo.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Subtasks Accordion Box */}
                {totalSubtasks > 0 && (
                  <div className="todo-subtasks-container">
                    <button
                      type="button"
                      className="todo-subtasks-summary-btn"
                      onClick={() =>
                        setExpandedSubtasks((prev) => ({
                          ...prev,
                          [todo.id]: !prev[todo.id],
                        }))
                      }
                    >
                      <span className="todo-subtasks-summary-left">
                        <TodoIcon.Tasks />
                        <span>
                          {completedSubtasks} of {totalSubtasks} subtasks completed
                        </span>
                      </span>
                      <span className="todo-subtasks-summary-chevron">
                        {isExpanded ? '▴ Hide Checklist' : '▾ View Checklist'}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="todo-subtasks-drawer">
                        {subtasksList.map((st) => (
                          <label key={st.id} className="todo-subtask-drawer-item">
                            <button
                              type="button"
                              className={`todo-subtask-check-circle ${
                                st.done ? 'todo-subtask-check-circle--checked' : ''
                              }`}
                              onClick={() => handleToggleSubtask(todo, st.id)}
                            >
                              {st.done && <TodoIcon.Check />}
                            </button>
                            <span
                              className={`todo-subtask-drawer-text ${
                                st.done ? 'todo-subtask-drawer-text--done' : ''
                              }`}
                            >
                              {st.text}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Modal (Create & Edit) */}
      {(createModalOpen || editingTodo) && (
        <TaskModal
          todo={editingTodo}
          onClose={() => {
            setCreateModalOpen(false);
            setEditingTodo(null);
          }}
          onSave={(data) => {
            if (editingTodo) {
              handleSaveEdit(data);
            } else {
              handleCreateTask(data);
            }
          }}
        />
      )}
    </div>
  );
}

function TaskModal({ todo, onClose, onSave }) {
  const isEdit = Boolean(todo && todo.id);
  const [title, setTitle] = useState(todo?.title || '');
  const [description, setDescription] = useState(todo?.description || '');
  const [priority, setPriority] = useState(todo?.priority || 'medium');
  const [category, setCategory] = useState(todo?.category || 'work');
  const [dueDate, setDueDate] = useState(
    todo?.due_date ? todo.due_date.split('T')[0] : ''
  );

  let initialSubtasks = [];
  try {
    initialSubtasks = JSON.parse(todo?.subtasks || '[]');
  } catch {
    initialSubtasks = [];
  }
  const [subtasks, setSubtasks] = useState(initialSubtasks);
  const [newSubtaskText, setNewSubtaskText] = useState('');

  const handleAddSubtask = (e) => {
    e.preventDefault();
    if (!newSubtaskText.trim()) return;
    setSubtasks((prev) => [
      ...prev,
      { id: String(Date.now()), text: newSubtaskText.trim(), done: false },
    ]);
    setNewSubtaskText('');
  };

  const handleRemoveSubtask = (id) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      ...(isEdit ? { id: todo.id } : {}),
      title: title.trim(),
      description: description.trim() || null,
      priority,
      category,
      due_date: dueDate ? `${dueDate}T17:00:00` : null,
      subtasks: JSON.stringify(subtasks),
    });
  };

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div
        className="modal modal--form todo-modal"
        style={{ maxWidth: 520 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{isEdit ? 'Edit Task' : 'New Task'}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close modal"><TodoIcon.Close /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="note-modal-body">
            <div className="field">
              <label>Task Title *</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Prepare Q3 Financial Deck"
                required
                autoFocus
              />
            </div>

            <div className="field-row">
              <div className="field">
                <label>Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="field">
                <label>Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="work">Work</option>
                  <option value="personal">Personal</option>
                  <option value="focus">Focus</option>
                  <option value="health">Health</option>
                  <option value="meeting">Meeting</option>
                </select>
              </div>
            </div>

            <div className="field">
              <label>Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className="field">
              <label>Description & Notes</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add more context or instructions..."
              />
            </div>

            {/* Checklist / Subtasks Manager */}
            <div className="field">
              <label>Checklist Items</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                {subtasks.map((st) => (
                  <div key={st.id} className="todo-subtask-edit-item">
                    <span>{st.text}</span>
                    <button
                      type="button"
                      className="todo-subtask-del-btn"
                      onClick={() => handleRemoveSubtask(st.id)}
                      title="Remove subtask"
                    >
                      <TodoIcon.Close />
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={newSubtaskText}
                  onChange={(e) => setNewSubtaskText(e.target.value)}
                  placeholder="Add a subtask step..."
                  style={{ flex: 1 }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSubtask(e);
                    }
                  }}
                />
                <button
                  type="button"
                  className="todo-subtask-add-btn"
                  onClick={handleAddSubtask}
                >
                  + Add
                </button>
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="ghost-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-btn">
              {isEdit ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
