import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../../context/auth/authContext';
import SessionContext from '../../context/session/sessionContext';
import { API_URL } from '../../config';

const Dashboard = () => {
  const { state: authState } = useContext(AuthContext);
  const { state: sessionState, dispatch: sessionDispatch } = useContext(SessionContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Carregar sessões do usuário
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/api/sessions`);
        
        sessionDispatch({
          type: 'GET_SESSIONS',
          payload: res.data.sessions
        });
      } catch (err) {
        setError('Erro ao carregar sessões');
        sessionDispatch({
          type: 'SESSION_ERROR',
          payload: 'Erro ao carregar sessões'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [sessionDispatch]);

  // Estatísticas básicas
  const activeSessionsCount = sessionState.sessions.filter(session => session.isActive).length;
  const totalSessionsCount = sessionState.sessions.length;
  const maxSessions = 10; // Limite máximo de sessões

  return (
    <div className="dashboard-container">
      <h1>Dashboard</h1>
      <p>Bem-vindo, {authState.user?.username || 'Usuário'}</p>
      
      {error && <div className="alert alert-danger">{error}</div>}
      
      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Sessões Ativas</h3>
          <p className="stat-value">{activeSessionsCount}</p>
        </div>
        <div className="stat-card">
          <h3>Total de Sessões</h3>
          <p className="stat-value">{totalSessionsCount}</p>
        </div>
        <div className="stat-card">
          <h3>Limite de Sessões</h3>
          <p className="stat-value">{maxSessions}</p>
        </div>
      </div>
      
      <div className="dashboard-actions">
        <Link to="/sessions" className="btn btn-primary">
          Gerenciar Sessões
        </Link>
      </div>
      
      <div className="recent-sessions">
        <h2>Sessões Recentes</h2>
        
        {loading ? (
          <p>Carregando sessões...</p>
        ) : sessionState.sessions.length === 0 ? (
          <p>Nenhuma sessão encontrada. Crie uma nova sessão para começar.</p>
        ) : (
          <div className="session-list">
            {sessionState.sessions.slice(0, 5).map(session => (
              <div key={session.sessionId} className="session-item">
                <div className="session-info">
                  <h3>{session.name}</h3>
                  <p>Status: {session.isActive ? 'Ativo' : 'Inativo'}</p>
                  {session.phoneNumber && <p>Telefone: {session.phoneNumber}</p>}
                </div>
                <div className="session-actions">
                  <Link to={`/sessions/${session.sessionId}`} className="btn btn-sm btn-info">
                    Detalhes
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {sessionState.sessions.length > 0 && (
          <Link to="/sessions" className="btn btn-link">
            Ver todas as sessões
          </Link>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
