import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import LoginPage from './pages/LoginPage';
import ClientsPage from './pages/ClientsPage';
import api from './api';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await api.get('/auth/me/');
        setUser(response.data);
        if (response.data.csrfToken) {
          api.defaults.headers.common['X-CSRFToken'] = response.data.csrfToken;
        }
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <LoginPage setUser={setUser} /> : <Navigate to="/clients" />} />

        <Route path="/" element={user ? <MainLayout user={user} setUser={setUser} /> : <Navigate to="/login" />}>
          <Route path="clients" element={<ClientsPage />} />
          <Route index element={<Navigate to="clients" />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
