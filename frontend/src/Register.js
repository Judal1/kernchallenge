import React, { useState, useEffect } from 'react';
import { hashPassword } from './crypto';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function Register({ onSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [csrfToken, setCsrfToken] = useState('');

  useEffect(() => {
    fetch('/api/csrf-token')
      .then(res => res.json())
      .then(data => setCsrfToken(data.csrf_token));
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage('');
    setSuccess(false);
    if (password !== confirm) {
      setMessage("Passwords do not match.");
      return;
    }
    const hashed = await hashPassword(password);
    fetch('/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken
      },
      body: JSON.stringify({ username, password: hashed })
    })
      .then(res => res.json())
      .then(data => {
        setMessage(data.message);
        if (data.message && data.message.toLowerCase().includes('success')) {
          setSuccess(true);
          if (onSuccess) onSuccess();
        }
      });
  };

  return (
    <div className="container-fluid d-flex justify-content-center align-items-center min-vh-100 bg-light">
      <form className="p-4 rounded shadow bg-white w-100" style={{maxWidth:400}} onSubmit={handleRegister}>
        <h2 className="mb-4 text-primary">Sign up</h2>
        <div className="mb-3">
          <input type="text" className="form-control" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
        </div>
        <div className="mb-3">
          <input type="password" className="form-control" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        <div className="mb-3">
          <input type="password" className="form-control" placeholder="Confirm password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
        </div>
        <button type="submit" className="btn btn-primary w-100">Sign up</button>
        {message && <div className={`mt-3 text-center fw-bold ${success ? 'text-success' : 'text-danger'}`}>{message}</div>}
      </form>
    </div>
  );
}
