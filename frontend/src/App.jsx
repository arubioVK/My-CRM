import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import LoginPage from './pages/LoginPage';
import ClientsPage from './pages/ClientsPage';
import ClientDetailPage from './pages/ClientDetailPage';
import TasksPage from './pages/TasksPage';
import TaskDetailPage from './pages/TaskDetailPage';
import SettingsPage from './pages/SettingsPage';
import TemplatesPage from './pages/Marketing/TemplatesPage';
import TemplateDetailPage from './pages/Marketing/TemplateDetailPage';
import api from './api';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const authCheckStarted = React.useRef(false);

  useEffect(() => {
    if (authCheckStarted.current) return;
    authCheckStarted.current = true;

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
          <Route path="clients/:id" element={<ClientDetailPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="tasks/:id" element={<TaskDetailPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="marketing/templates" element={<TemplatesPage />} />
          <Route path="marketing/templates/new" element={<TemplateDetailPage />} />
          <Route path="marketing/templates/:id" element={<TemplateDetailPage />} />
          <Route index element={<Navigate to="clients" />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
