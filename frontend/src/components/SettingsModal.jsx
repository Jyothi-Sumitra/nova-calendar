import { useState } from 'react';
import './SettingsModal.css';

export default function SettingsModal({
  user,
  onClose,
  defaultView,
  setDefaultView,
  flashToast,
}) {
  const [name, setName] = useState(
    user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Jyothi'
  );
  const [viewChoice, setViewChoice] = useState(defaultView || 'month');
  const [timeFormat, setTimeFormat] = useState('12h');
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const handleSave = (e) => {
    e.preventDefault();
    setDefaultView?.(viewChoice);
    localStorage.setItem('nova_settings', JSON.stringify({ name, viewChoice, timeFormat, voiceEnabled }));
    flashToast?.('Settings saved');
    onClose();
  };

  const handleExportData = () => {
    const backup = {
      notes: localStorage.getItem('nova_notes') ? JSON.parse(localStorage.getItem('nova_notes')) : [],
      todos: localStorage.getItem('nova_todos') ? JSON.parse(localStorage.getItem('nova_todos')) : [],
      habits: localStorage.getItem('nova_habits') ? JSON.parse(localStorage.getItem('nova_habits')) : [],
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nova-calendar-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    flashToast?.('Data exported successfully');
  };

  const initialLetter = name ? name[0].toUpperCase() : 'J';

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Preferences & Settings</h2>
          <button className="icon-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSave}>
          <div className="note-modal-body">
            {/* Profile Section */}
            <div className="settings-section">
              <span className="settings-section-title">Account Profile</span>
              <div className="settings-profile-card">
                <div className="settings-avatar">{initialLetter}</div>
                <div className="settings-profile-info">
                  <strong>{name}</strong>
                  <span>{user?.email || 'guest@nova.ai'}</span>
                </div>
              </div>

              <div className="field">
                <label>Display Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>
            </div>

            {/* Calendar & Display */}
            <div className="settings-section">
              <span className="settings-section-title">Calendar & Scheduling</span>

              <div className="settings-row">
                <label>Default Calendar View</label>
                <select
                  value={viewChoice}
                  onChange={(e) => setViewChoice(e.target.value)}
                  className="todo-quick-select"
                >
                  <option value="month">Month Grid</option>
                  <option value="week">Weekly Schedule</option>
                  <option value="day">Daily Agenda</option>
                </select>
              </div>

              <div className="settings-row">
                <label>Time Display</label>
                <select
                  value={timeFormat}
                  onChange={(e) => setTimeFormat(e.target.value)}
                  className="todo-quick-select"
                >
                  <option value="12h">12-Hour (AM / PM)</option>
                  <option value="24h">24-Hour (Military)</option>
                </select>
              </div>
            </div>

            {/* Assistant & Intelligence */}
            <div className="settings-section">
              <span className="settings-section-title">NOVA Assistant & Voice</span>

              <div className="settings-row">
                <label>Microphone & Voice Input</label>
                <input
                  type="checkbox"
                  checked={voiceEnabled}
                  onChange={(e) => setVoiceEnabled(e.target.checked)}
                  style={{ width: 18, height: 18, cursor: 'pointer' }}
                />
              </div>

              <div className="settings-row">
                <label>Backend API Status</label>
                <span className="settings-status-badge">
                  <span className="settings-status-dot" /> Connected (FastAPI)
                </span>
              </div>
            </div>

            {/* Data Management */}
            <div className="settings-section">
              <span className="settings-section-title">Data Backup</span>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={handleExportData}
                  style={{ flex: 1 }}
                >
                  💾 Export Backup JSON
                </button>
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="ghost-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-btn">
              Save Preferences
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
