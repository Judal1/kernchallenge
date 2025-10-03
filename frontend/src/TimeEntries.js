import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

function TimeEntries({ token, csrfToken }) {
  const [entries, setEntries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({
    project_id: '',
    description: '',
    start_time: '',
    end_time: ''
  });
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({
    project_id: '',
    description: '',
    start_time: '',
    end_time: ''
  });
  const [search, setSearch] = useState({
    project_id: '',
    description: '',
    min_duration: '',
    max_duration: '',
    start_date: '',
    end_date: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetch('/api/projects', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(setProjects);
    fetch('/api/time-entries', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(setEntries);
  }, [token, navigate]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEditChange = e => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEdit = entry => {
    setEditId(entry.id);
    setEditForm({
      project_id: entry.project_id,
      description: entry.description,
      start_time: entry.start_time?.slice(0, 16),
      end_time: entry.end_time?.slice(0, 16)
    });
  };

  const handleEditCancel = () => {
    setEditId(null);
    setEditForm({ project_id: '', description: '', start_time: '', end_time: '' });
  };

  const handleEditSave = e => {
    e.preventDefault();
    fetch(`/api/time-entries/${editId}`, {
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
          fetch('/api/time-entries', {
            headers: { Authorization: `Bearer ${token}` }
          })
            .then(res => res.json())
            .then(setEntries);
          setEditId(null);
        }
      });
  };

  const handleSubmit = e => {
    e.preventDefault();
    setLoading(true);
    fetch('/api/time-entries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'X-CSRF-Token': csrfToken
      },
      body: JSON.stringify(form)
    })
      .then(res => res.json())
      .then(data => {
        setLoading(false);
        if (data.id) {
          setEntries([...entries, {
            ...form,
            id: data.id,
            project_name: projects.find(p => p.id === parseInt(form.project_id))?.name,
            start_time: form.start_time,
            end_time: form.end_time,
            duration: Math.floor((new Date(form.end_time) - new Date(form.start_time)) / 60000),
            created_at: new Date().toISOString()
          }]);
          setForm({ project_id: '', description: '', start_time: '', end_time: '' });
        }
      });
  };

  const handleDelete = id => {
    fetch(`/api/time-entries/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-CSRF-Token': csrfToken
      }
    })
      .then(res => res.json())
      .then(() => {
        setEntries(entries.filter(e => e.id !== id));
      });
  };

  // Filtering logic
  const filteredEntries = entries.filter(e => {
    let match = true;
    if (search.project_id && String(e.project_id) !== String(search.project_id)) match = false;
    if (search.description && !e.description.toLowerCase().includes(search.description.toLowerCase())) match = false;
    if (search.min_duration && e.duration < parseInt(search.min_duration)) match = false;
    if (search.max_duration && e.duration > parseInt(search.max_duration)) match = false;
    if (search.start_date && new Date(e.start_time) < new Date(search.start_date)) match = false;
    if (search.end_date && new Date(e.end_time) > new Date(search.end_date)) match = false;
    return match;
  });

  return (
    <div className="container mt-4">
      <h2>Time Entries</h2>
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="row">
          <div className="col-md-3">
            <select name="project_id" className="form-control" value={form.project_id} onChange={handleChange} required>
              <option value="">Select Project</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <input name="description" className="form-control" placeholder="Description" value={form.description} onChange={handleChange} required />
          </div>
          <div className="col-md-2">
            <input name="start_time" type="datetime-local" className="form-control" value={form.start_time} onChange={handleChange} required />
          </div>
          <div className="col-md-2">
            <input name="end_time" type="datetime-local" className="form-control" value={form.end_time} onChange={handleChange} required />
          </div>
          <div className="col-md-2">
            <button type="submit" className="btn btn-primary w-100" disabled={loading}>Add Entry</button>
          </div>
        </div>
      </form>
      <div className="mb-4 p-3 bg-light rounded shadow-sm">
        <h5>Search & Filter</h5>
        <div className="row g-2">
          <div className="col-md-2">
            <select name="project_id" className="form-control" value={search.project_id} onChange={e => setSearch({ ...search, project_id: e.target.value })}>
              <option value="">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <input name="description" className="form-control" placeholder="Description" value={search.description} onChange={e => setSearch({ ...search, description: e.target.value })} />
          </div>
          <div className="col-md-2">
            <input name="min_duration" type="number" className="form-control" placeholder="Min Duration" value={search.min_duration} onChange={e => setSearch({ ...search, min_duration: e.target.value })} />
          </div>
          <div className="col-md-2">
            <input name="max_duration" type="number" className="form-control" placeholder="Max Duration" value={search.max_duration} onChange={e => setSearch({ ...search, max_duration: e.target.value })} />
          </div>
          <div className="col-md-2">
            <input name="start_date" type="datetime-local" className="form-control" value={search.start_date} onChange={e => setSearch({ ...search, start_date: e.target.value })} />
          </div>
          <div className="col-md-2">
            <input name="end_date" type="datetime-local" className="form-control" value={search.end_date} onChange={e => setSearch({ ...search, end_date: e.target.value })} />
          </div>
        </div>
      </div>
      <table className="table table-striped">
        <thead>
          <tr>
            <th>Project</th>
            <th>Description</th>
            <th>Start</th>
            <th>End</th>
            <th>Duration (min)</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredEntries.map(e => (
            editId === e.id ? (
              <tr key={e.id}>
                <td>
                  <select name="project_id" className="form-control" value={editForm.project_id} onChange={handleEditChange} required>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <input name="description" className="form-control" value={editForm.description} onChange={handleEditChange} required />
                </td>
                <td>
                  <input name="start_time" type="datetime-local" className="form-control" value={editForm.start_time} onChange={handleEditChange} required />
                </td>
                <td>
                  <input name="end_time" type="datetime-local" className="form-control" value={editForm.end_time} onChange={handleEditChange} required />
                </td>
                <td>
                  {Math.floor((new Date(editForm.end_time) - new Date(editForm.start_time)) / 60000)}
                </td>
                <td>
                  <button className="btn btn-success btn-sm me-2" onClick={handleEditSave}>Save</button>
                  <button className="btn btn-secondary btn-sm" onClick={handleEditCancel}>Cancel</button>
                </td>
              </tr>
            ) : (
              <tr key={e.id}>
                <td>{e.project_name}</td>
                <td>{e.description}</td>
                <td>{e.start_time?.replace('T', ' ').slice(0, 16)}</td>
                <td>{e.end_time?.replace('T', ' ').slice(0, 16)}</td>
                <td>{e.duration}</td>
                <td>
                  <button className="btn btn-outline-primary btn-sm me-2" onClick={() => handleEdit(e)}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(e.id)}>Delete</button>
                </td>
              </tr>
            )
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TimeEntries;
