import React, { useEffect, useState } from 'react';
import { hashPassword } from './crypto';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import Register from './Register';
import Login from './Login';
import Projects from './Projects';
import TimeEntries from './TimeEntries';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';

function AppNavbar({ token, onLogout }) {
  return (
    <Navbar bg="primary" variant="dark" expand="lg" sticky="top">
      <Container>
        <Navbar.Brand as={Link} to="/">KernChallenge</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <Nav.Link as={Link} to="/projects">Projects</Nav.Link>
            <Nav.Link as={Link} to="/time-entries">Time Entries</Nav.Link>
            {!token ? (
              <>
                <Nav.Link as={Link} to="/register">Sign up</Nav.Link>
                <Nav.Link as={Link} to="/login">Sign in</Nav.Link>
              </>
            ) : (
              <Button variant="outline-light" onClick={onLogout}>Sign out</Button>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

function Home() {
  return (
    <div className="d-flex flex-column justify-content-center align-items-center min-vh-100 bg-light">
      <div className="container-fluid">
        <div className="p-4 p-md-5 rounded shadow bg-white text-center mx-auto" style={{maxWidth: 500}}>
          <h1 className="mb-4 text-primary">Welcome to KernChallenge</h1>
          <p className="mb-4 text-secondary">Manage your time, projects, and team easily.<br/>Sign up or sign in to get started!</p>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('authToken') || '');
  const [csrfToken, setCsrfToken] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }, [token]);

  useEffect(() => {
    fetch('/api/csrf-token')
      .then(res => res.json())
      .then(data => setCsrfToken(data.csrf_token));
  }, [token]);

  const handleLogin = (tok) => {
    setToken(tok);
    setTimeout(() => navigate('/'), 500);
  };

  const handleLogout = () => {
    setToken('');
    navigate('/');
  };

  const handleRegisterSuccess = () => {
    setTimeout(() => navigate('/login'), 500);
  };

  return (
    <>
      <AppNavbar token={token} onLogout={handleLogout} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register onSuccess={handleRegisterSuccess} />} />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/projects" element={<Projects token={token} csrfToken={csrfToken} />} />
        <Route path="/time-entries" element={<TimeEntries token={token} csrfToken={csrfToken} />} />
        <Route path="/logout" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}
