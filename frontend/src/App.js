// Estrutura básica para o frontend React
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';

// Componentes
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import SessionList from './components/sessions/SessionList';
import SessionDetail from './components/sessions/SessionDetail';
import Chat from './components/chat/Chat';
import Navbar from './components/layout/Navbar';
import PrivateRoute from './components/routing/PrivateRoute';

// Contexto
import AuthContext from './context/auth/authContext';
import SessionContext from './context/session/sessionContext';
import MessageContext from './context/message/messageContext';

// Configuração
import { API_URL } from './config';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  // Configurar axios
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  // Carregar usuário
  useEffect(() => {
    const loadUser = async () => {
      try {
        if (!token) {
          setLoading(false);
          return;
        }

        const res = await axios.get(`${API_URL}/api/auth/me`);
        setUser(res.data.user);
      } catch (err) {
        console.error('Erro ao carregar usuário:', err);
        localStorage.removeItem('token');
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  // Configurar Socket.IO
  useEffect(() => {
    if (token && !socket) {
      const newSocket = io(API_URL, {
        auth: {
          token
        }
      });

      newSocket.on('connect', () => {
        console.log('Socket.IO conectado');
      });

      newSocket.on('disconnect', () => {
        console.log('Socket.IO desconectado');
      });

      newSocket.on('error', (error) => {
        console.error('Erro Socket.IO:', error);
      });

      setSocket(newSocket);
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [token, socket]);

  // Login
  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      return true;
    } catch (err) {
      console.error('Erro de login:', err);
      return false;
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  };

  // Registro
  const register = async (username, email, password) => {
    try {
      const res = await axios.post(`${API_URL}/api/auth/register`, {
        username,
        email,
        password
      });
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      return true;
    } catch (err) {
      console.error('Erro de registro:', err);
      return false;
    }
  };

  // Valores do contexto de autenticação
  const authContextValue = {
    token,
    user,
    loading,
    login,
    logout,
    register
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <AuthContext.Provider value={authContextValue}>
      <Router>
        <Navbar />
        <div className="container">
          <Switch>
            <Route exact path="/login" component={Login} />
            <Route exact path="/register" component={Register} />
            <PrivateRoute exact path="/dashboard" component={Dashboard} />
            <PrivateRoute exact path="/sessions" component={SessionList} />
            <PrivateRoute exact path="/sessions/:sessionId" component={SessionDetail} />
            <PrivateRoute exact path="/chat/:sessionId/:jid" component={Chat} />
            <Redirect from="/" to={token ? "/dashboard" : "/login"} />
          </Switch>
        </div>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;
