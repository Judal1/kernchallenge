import React, { useEffect, useState } from 'react';
import { startOfWeek, addDays, format, isSameDay, getHours, getMinutes } from 'date-fns';
import { Modal, Button } from 'react-bootstrap';

function CalendarDashboard({ token, csrfToken, user }) {
  // Fallback for user being undefined
  if (!user) {
    return (
      <div className="container mt-4">
        <h2 className="mb-3">Weekly Timesheet (Grid View)</h2>
        <div className="alert alert-warning">You must be logged in to view your timesheet.</div>
      </div>
    );
  }
  const [entries, setEntries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [weekDays, setWeekDays] = useState([]);
  const [hourRows, setHourRows] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalEntry, setModalEntry] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ project_id: '', description: '', start_time: '', end_time: '' });

  useEffect(() => {
    if (!token) return;
    fetch('/api/time-entries', {
      headers: { Authorization: `Bearer ${token}` }
    })
        .then(res => res.json())
        .then(data => setEntries(Array.isArray(data) ? data : []));
    fetch('/api/projects', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(setProjects);
    // Calculate current week days
    const now = new Date();
    const start = startOfWeek(now, { weekStartsOn: 1 }); // Monday
    setWeekDays(Array.from({ length: 7 }, (_, i) => addDays(start, i)));
    setHourRows(Array.from({ length: 24 }, (_, i) => i));
  }, [token]);

  // Color palette for projects
  const colors = [
    '#007bff', '#28a745', '#ffc107', '#17a2b8', '#6610f2', '#fd7e14', '#6f42c1', '#e83e8c', '#20c997', '#343a40', '#ff3860', '#00d1b2', '#ffdd57', '#23d160', '#3273dc', '#ff6f61'
  ];
  // Map project id to color
  const getProjectColor = projectId => {
    const idx = projects.findIndex(p => p.id === projectId);
    return colors[idx % colors.length];
  };

  // Helper: get entries for a day and hour (spanning multiple days)
  const getEntriesForCell = (day, hour) => {
    return entries.filter(e => {
      const start = new Date(e.start_time);
      const end = new Date(e.end_time);
      const cellStart = new Date(day);
      cellStart.setHours(hour, 0, 0, 0);
      const cellEnd = new Date(day);
      cellEnd.setHours(hour + 1, 0, 0, 0);
      return start < cellEnd && end > cellStart;
    });
  };

  const getTotalForDay = day => {
    return entries.filter(e => isSameDay(new Date(e.start_time), day)).reduce((sum, e) => sum + (e.duration || 0), 0);
  };

  const handleBlockClick = entry => {
    setModalEntry(entry);
    setEditForm({
      project_id: entry.project_id,
      description: entry.description,
      start_time: entry.start_time?.slice(0, 16),
      end_time: entry.end_time?.slice(0, 16)
    });
    setEditMode(false);
    setShowModal(true);
  };

  const handleEditChange = e => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSave = () => {
    fetch(`/api/time-entries/${modalEntry.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'X-CSRF-Token': csrfToken
      },
      body: JSON.stringify(editForm)
    })
      .then(res => res.json())
      .then(data => {
        if (data.message === 'Time entry updated') {
          setShowModal(false);
          setEditMode(false);
          // Refresh entries
          fetch('/api/time-entries', {
            headers: { Authorization: `Bearer ${token}` }
          })
            .then(res => res.json())
            .then(setEntries);
        }
      });
  };

  const handleDelete = () => {
    fetch(`/api/time-entries/${modalEntry.id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-CSRF-Token': csrfToken
      }
    })
      .then(res => res.json())
      .then(() => {
        setShowModal(false);
        setEditMode(false);
        // Refresh entries
        fetch('/api/time-entries', {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(res => res.json())
          .then(setEntries);
      });
  };

  const getProjectName = entry => projects.find(p => p.id === entry.project_id)?.name || entry.project_name;

  return (
    <div className="container mt-4">
      <h2 className="mb-3">Weekly Timesheet (Grid View)</h2>
      <div className="table-responsive">
        <table className="table table-bordered text-center align-middle">
          <thead>
            <tr>
              <th style={{width: 80}}>Hour</th>
              {weekDays.map(day => (
                <th key={day}>{format(day, 'EEE dd/MM')}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hourRows.map(hour => (
              <tr key={hour}>
                <td className="fw-bold">{hour}:00</td>
                {weekDays.map(day => (
                  <td key={day} style={{ minWidth: 80, verticalAlign: 'top', padding: 2 }}>
                    <div>
                      {getEntriesForCell(day, hour).map(e => (
                        <div
                          key={e.id}
                          className="mb-1 px-1 py-0 text-white rounded small cursor-pointer"
                          style={{ fontSize: '0.85em', lineHeight: '1.2', cursor: 'pointer', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', background: getProjectColor(e.project_id) }}
                          title={getProjectName(e)}
                          onClick={() => handleBlockClick(e)}
                        >
                          {getProjectName(e)}
                        </div>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
            <tr className="table-secondary">
              <td className="fw-bold">Total</td>
              {weekDays.map(day => (
                <td key={day} className="fw-bold">{getTotalForDay(day)} min</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <Modal show={showModal} onHide={() => { setShowModal(false); setEditMode(false); }}>
        <Modal.Header closeButton>
          <Modal.Title>Time Entry Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalEntry && !editMode && (
            <>
              <div><strong>Project:</strong> {getProjectName(modalEntry)}</div>
              <div><strong>Description:</strong> {modalEntry.description}</div>
              <div><strong>Start:</strong> {format(new Date(modalEntry.start_time), 'EEE dd/MM HH:mm')}</div>
              <div><strong>End:</strong> {format(new Date(modalEntry.end_time), 'EEE dd/MM HH:mm')}</div>
              <div><strong>Duration:</strong> {modalEntry.duration} min</div>
            </>
          )}
          {modalEntry && editMode && (
            <form>
              <div className="mb-2">
                <label className="form-label">Project</label>
                <select name="project_id" className="form-control" value={editForm.project_id} onChange={handleEditChange} required>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-2">
                <label className="form-label">Description</label>
                <input name="description" className="form-control" value={editForm.description} onChange={handleEditChange} required />
              </div>
              <div className="mb-2">
                <label className="form-label">Start</label>
                <input name="start_time" type="datetime-local" className="form-control" value={editForm.start_time} onChange={handleEditChange} required />
              </div>
              <div className="mb-2">
                <label className="form-label">End</label>
                <input name="end_time" type="datetime-local" className="form-control" value={editForm.end_time} onChange={handleEditChange} required />
              </div>
            </form>
          )}
        </Modal.Body>
        <Modal.Footer>
          {!editMode ? (
            <>
              <Button variant="danger" onClick={handleDelete}>Delete</Button>
              <Button variant="primary" onClick={() => setEditMode(true)}>Edit</Button>
              <Button variant="secondary" onClick={() => { setShowModal(false); setEditMode(false); }}>Close</Button>
            </>
          ) : (
            <>
              <Button variant="success" onClick={handleEditSave}>Save</Button>
              <Button variant="secondary" onClick={() => setEditMode(false)}>Cancel</Button>
            </>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default CalendarDashboard;
