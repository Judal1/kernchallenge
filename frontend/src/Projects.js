import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function Projects({ token }) {
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [message, setMessage] = useState('');
  const [csrfToken, setCsrfToken] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetch('/api/csrf-token')
      .then(res => res.json())
      .then(data => setCsrfToken(data.csrf_token));
    fetchProjects();
    // eslint-disable-next-line
  }, [token]);

  const fetchProjects = () => {
    fetch('/api/projects', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setProjects(data));
  };

  const handleCreate = (e) => {
    e.preventDefault();
    setMessage('');
    if (!name.trim()) {
      setMessage('Project name is required.');
      return;
    }
    fetch('/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'X-CSRFToken': csrfToken
      },
      body: JSON.stringify({ name, description })
    })
      .then(res => res.json())
      .then(data => {
        setMessage(data.message);
        setName('');
        setDescription('');
        fetchProjects();
      });
  };

  const handleDelete = (id) => {
    setMessage('');
    fetch(`/api/projects/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-CSRFToken': csrfToken
      }
    })
      .then(res => res.json())
      .then(data => {
        setMessage(data.message);
        fetchProjects();
      });
  };

  const handleEdit = (project) => {
    setEditId(project.id);
    setEditName(project.name);
    setEditDescription(project.description || '');
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    setMessage('');
    fetch(`/api/projects/${editId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'X-CSRFToken': csrfToken
      },
      body: JSON.stringify({ name: editName, description: editDescription })
    })
      .then(res => res.json())
      .then(data => {
        setMessage(data.message);
        setEditId(null);
        fetchProjects();
      });
  };

  return (
    <div className="container py-4">
      <h2 className="mb-4 text-primary">My Projects</h2>
      <form className="mb-4" onSubmit={handleCreate}>
        <div className="row g-2">
          <div className="col-md-4">
            <input type="text" className="form-control" placeholder="Project name" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="col-md-5">
            <input type="text" className="form-control" placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div className="col-md-3">
            <button type="submit" className="btn btn-primary w-100">Create Project</button>
          </div>
        </div>
      </form>
      {message && <div className="mb-3 text-center fw-bold text-info">{message}</div>}
      <table className="table table-bordered table-hover">
        <thead className="table-light">
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {projects.map(project => (
            editId === project.id ? (
              <tr key={project.id}>
                <td><input type="text" className="form-control" value={editName} onChange={e => setEditName(e.target.value)} /></td>
                <td><input type="text" className="form-control" value={editDescription} onChange={e => setEditDescription(e.target.value)} /></td>
                <td>{new Date(project.created_at).toLocaleString()}</td>
                <td>
                  <button className="btn btn-success btn-sm me-2" onClick={handleUpdate}>Save</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setEditId(null)}>Cancel</button>
                </td>
              </tr>
            ) : (
              <tr key={project.id}>
                <td>{project.name}</td>
                <td>{project.description}</td>
                <td>{new Date(project.created_at).toLocaleString()}</td>
                <td>
                  <button className="btn btn-outline-primary btn-sm me-2" onClick={() => handleEdit(project)}>Edit</button>
                  <button className="btn btn-outline-danger btn-sm" onClick={() => handleDelete(project.id)}>Delete</button>
                </td>
              </tr>
            )
          ))}
        </tbody>
      </table>
    </div>
  );
}
