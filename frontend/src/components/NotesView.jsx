import { useState, useMemo, useEffect } from 'react';
import './NotesView.css';

const NotesIcon = {
  Close: (p) => (<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}><path d="M6 6l12 12M18 6L6 18"/></svg>),
  Pin: (p) => (<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 21s-6.5-5.6-6.5-10.8A6.5 6.5 0 0112 3.7a6.5 6.5 0 016.5 6.5C18.5 15.4 12 21 12 21z"/><circle cx="12" cy="10.4" r="2.1"/></svg>),
  Edit: (p) => (<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>),
  Trash: (p) => (<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>),
  Calendar: (p) => (<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>),
};


const NOTE_COLORS = [
  { id: 'amber', label: 'Nova Pink', bg: '#e86a9b' },
  { id: 'rose', label: 'Petal Rose', bg: '#f472b6' },
  { id: 'emerald', label: 'Sage Emerald', bg: '#10b981' },
  { id: 'sky', label: 'Morning Sky', bg: '#38bdf8' },
  { id: 'purple', label: 'Twilight Violet', bg: '#c084fc' },
];

const NOTE_CATEGORIES = [
  { id: 'all', label: 'All Notes' },
  { id: 'work', label: 'Work' },
  { id: 'personal', label: 'Personal' },
  { id: 'focus', label: 'Focus & Ideas' },
  { id: 'health', label: 'Health' },
  { id: 'meeting', label: 'Meeting Memos' },
];

export default function NotesView({ apiBase, flashToast, onScheduleEvent }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState('all');
  const [onlyPinned, setOnlyPinned] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editorModal, setEditorModal] = useState(null); // { mode: 'create'|'edit', note }

  // Load notes from backend with fallback
  const fetchNotes = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiBase}/notes/`);
      if (!res.ok) throw new Error('Failed to load notes');
      const data = await res.json();
      setNotes(data);
    } catch {
      // Local fallback if backend is unreachable
      const stored = localStorage.getItem('nova_notes');
      if (stored) {
        try {
          setNotes(JSON.parse(stored));
        } catch {
          // ignore
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  // Sync to local storage for offline resilience
  useEffect(() => {
    if (notes.length > 0) {
      localStorage.setItem('nova_notes', JSON.stringify(notes));
    }
  }, [notes]);

  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      const matchCat = selectedCat === 'all' || n.category === selectedCat;
      const matchPinned = onlyPinned ? n.is_pinned : true;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        n.title.toLowerCase().includes(q) ||
        (n.content && n.content.toLowerCase().includes(q)) ||
        (n.tags && n.tags.toLowerCase().includes(q));
      return matchCat && matchPinned && matchSearch;
    });
  }, [notes, selectedCat, onlyPinned, searchQuery]);

  const handleSaveNote = async (formData) => {
    const isEdit = Boolean(formData.id);
    try {
      const url = `${apiBase}/notes/${isEdit ? formData.id : ''}`;
      const method = isEdit ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          content: formData.content || '',
          category: formData.category || 'general',
          color: formData.color || 'amber',
          is_pinned: Boolean(formData.is_pinned),
          tags: formData.tags || '',
        }),
      });

      if (res.ok) {
        const saved = await res.json();
        if (isEdit) {
          setNotes((prev) => prev.map((n) => (n.id === saved.id ? saved : n)));
        } else {
          setNotes((prev) => [saved, ...prev]);
        }
        flashToast?.(isEdit ? 'Note updated' : 'Note created');
      } else {
        throw new Error('API request failed');
      }
    } catch {
      // Offline fallback
      if (isEdit) {
        setNotes((prev) =>
          prev.map((n) =>
            n.id === formData.id
              ? { ...n, ...formData, updated_at: new Date().toISOString() }
              : n
          )
        );
      } else {
        const newNote = {
          ...formData,
          id: Date.now(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setNotes((prev) => [newNote, ...prev]);
      }
      flashToast?.('Note saved locally');
    }
    setEditorModal(null);
  };

  const handleDeleteNote = async (id) => {
    try {
      await fetch(`${apiBase}/notes/${id}`, { method: 'DELETE' });
    } catch {
      // ignore
    }
    setNotes((prev) => prev.filter((n) => n.id !== id));
    flashToast?.('Note deleted', 'neutral');
  };

  const handleTogglePin = async (note) => {
    const nextPinned = !note.is_pinned;
    try {
      await fetch(`${apiBase}/notes/${note.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_pinned: nextPinned }),
      });
    } catch {
      // ignore
    }
    setNotes((prev) =>
      prev.map((n) => (n.id === note.id ? { ...n, is_pinned: nextPinned } : n))
    );
    flashToast?.(nextPinned ? 'Pinned to top' : 'Unpinned');
  };

  const handleCopy = (text) => {
    navigator.clipboard?.writeText(text);
    flashToast?.('Copied to clipboard');
  };

  return (
    <div className="notes-view">
      {/* Top Header */}
      <div className="notes-header">
        <div className="notes-title-group">
          <h2>Notes & Reflections</h2>
          <p>
            {notes.length} note{notes.length === 1 ? '' : 's'} recorded · Capture
            ideas, meeting summaries, and study points.
          </p>
        </div>
        <div className="notes-actions">
          <button
            className="notes-new-btn"
            onClick={() =>
              setEditorModal({
                mode: 'create',
                note: {
                  title: '',
                  content: '',
                  category: 'work',
                  color: 'amber',
                  is_pinned: false,
                  tags: '',
                },
              })
            }
          >
            <span>+</span>
            <span>New Note</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="notes-filter-bar">
        <div className="notes-categories">
          {NOTE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`notes-cat-pill ${
                selectedCat === cat.id ? 'notes-cat-pill--active' : ''
              }`}
              onClick={() => setSelectedCat(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="notes-filter-controls">
          <button
            className={`notes-pinned-toggle ${
              onlyPinned ? 'notes-pinned-toggle--active' : ''
            }`}
            onClick={() => setOnlyPinned((p) => !p)}
            title="Filter pinned notes"
          >
            <span>📌</span>
            <span>Pinned</span>
          </button>
        </div>
      </div>

      {/* Notes Grid */}
      <div className="notes-grid">
        {filteredNotes.length === 0 && (
          <div className="notes-empty">
            <span className="notes-empty-icon">📝</span>
            <h3>No notes found</h3>
            <p>
              {searchQuery || selectedCat !== 'all' || onlyPinned
                ? 'Try adjusting your search or category filter.'
                : 'Click "New Note" to jot down your first note or idea.'}
            </p>
            <button
              className="notes-new-btn"
              onClick={() =>
                setEditorModal({
                  mode: 'create',
                  note: {
                    title: '',
                    content: '',
                    category: 'work',
                    color: 'amber',
                    is_pinned: false,
                    tags: '',
                  },
                })
              }
            >
              Create Note
            </button>
          </div>
        )}

        {filteredNotes.map((note) => {
          const tagsList = note.tags
            ? note.tags
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean)
            : [];
          return (
            <article
              key={note.id}
              className={`note-card note-card--${note.color || 'amber'}`}
            >
              <div>
                <div className="note-card-header">
                  <span className="note-card-cat">{note.category}</span>
                  <button
                    className={`note-pin-btn ${
                      note.is_pinned ? 'note-pin-btn--pinned' : ''
                    }`}
                    onClick={() => handleTogglePin(note)}
                    title={note.is_pinned ? 'Unpin note' : 'Pin note'}
                  >
                    📌
                  </button>
                </div>

                <h3 className="note-card-title">{note.title}</h3>
                {note.content && (
                  <p className="note-card-body">{note.content}</p>
                )}

                {tagsList.length > 0 && (
                  <div className="note-card-tags">
                    {tagsList.map((tag, idx) => (
                      <span key={idx} className="note-tag">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="note-card-footer">
                <span>
                  {note.updated_at
                    ? new Date(note.updated_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'Saved'}
                </span>

                <div className="note-card-actions">
                  {onScheduleEvent && (
                    <button
                      className="note-icon-btn"
                      onClick={() =>
                        onScheduleEvent({
                          title: note.title,
                          description: note.content || '',
                          category: note.category,
                        })
                      }
                      title="Schedule on Calendar"
                    >
                      📅
                    </button>
                  )}

                  <button
                    className="note-icon-btn"
                    onClick={() =>
                      handleCopy(`${note.title}\n\n${note.content || ''}`)
                    }
                    title="Copy note text"
                  >
                    📋
                  </button>

                  <button
                    className="note-icon-btn"
                    onClick={() =>
                      setEditorModal({ mode: 'edit', note: { ...note } })
                    }
                    title="Edit note"
                  >
                    ✏️
                  </button>

                  <button
                    className="note-icon-btn note-icon-btn--danger"
                    onClick={() => handleDeleteNote(note.id)}
                    title="Delete note"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Note Editor Modal */}
      {editorModal && (
        <NoteEditorModal
          initial={editorModal.note}
          mode={editorModal.mode}
          onClose={() => setEditorModal(null)}
          onSave={handleSaveNote}
        />
      )}
    </div>
  );
}

function NoteEditorModal({ initial, mode, onClose, onSave }) {
  const [form, setForm] = useState(
    initial || {
      title: '',
      content: '',
      category: 'work',
      color: 'amber',
      is_pinned: false,
      tags: '',
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave(form);
  };

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div
        className="modal modal--form note-modal"
        style={{ maxWidth: 540 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{mode === 'edit' ? 'Edit Note' : 'New Note'}</h2>
          <button type="button" className="icon-btn" onClick={onClose}><NotesIcon.Close /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="note-modal-body">
            <div className="field">
              <label>Note Title</label>
              <input
                autoFocus
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="Give your note a title..."
                required
              />
            </div>

            <div className="field-row">
              <div className="field">
                <label>Category</label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, category: e.target.value }))
                  }
                >
                  <option value="work">Work</option>
                  <option value="personal">Personal</option>
                  <option value="focus">Focus & Ideas</option>
                  <option value="health">Health</option>
                  <option value="meeting">Meeting Memos</option>
                  <option value="general">General</option>
                </select>
              </div>

              <div className="field">
                <label>Color Accent</label>
                <div className="note-color-swatches" style={{ paddingTop: 8 }}>
                  {NOTE_COLORS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className={`note-color-swatch ${
                        form.color === c.id ? 'note-color-swatch--active' : ''
                      }`}
                      style={{ background: c.bg }}
                      onClick={() => setForm((f) => ({ ...f, color: c.id }))}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="field">
              <label>Content & Details</label>
              <textarea
                rows={6}
                value={form.content || ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, content: e.target.value }))
                }
                placeholder="Write your note, thoughts, checklist or details..."
              />
            </div>

            <div className="field">
              <label>Tags (comma separated)</label>
              <input
                value={form.tags || ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, tags: e.target.value }))
                }
                placeholder="e.g. project, q4, reading"
              />
            </div>

            <button
              type="button"
              className={`note-pin-toggle-pill ${form.is_pinned ? 'note-pin-toggle-pill--active' : ''}`}
              onClick={() => setForm((f) => ({ ...f, is_pinned: !f.is_pinned }))}
            >
              <span className="note-pin-icon">{form.is_pinned ? '📌' : '📍'}</span>
              <span>{form.is_pinned ? 'Pinned to top of notes' : 'Pin this note to the top'}</span>
            </button>
          </div>

          <div className="modal-actions">
            <button type="button" className="ghost-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-btn">
              {mode === 'edit' ? 'Save Changes' : 'Create Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
