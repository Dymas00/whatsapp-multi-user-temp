import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import SessionContext from '../../context/session/sessionContext';
import { API_URL } from '../../config';

const SessionList = () => {
  const { state, dispatch } = useContext(SessionContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newSessionName, setNewSessionName] = useState('');
  const [creating, setCreating] = useState(false);

  // Carregar sessões
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/api/sessions`);
        
        dispatch({
          type: 'GET_SESSIONS',
          payload: res.data.sessions
        });
      } catch (err) {
        setError('Erro ao carregar sessões');
        dispatch({
          type: 'SESSION_ERROR',
          payload: 'Erro ao carregar sessões'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [dispatch]);

  // Criar nova sessão
  const createSession = async (e) => {
    e.preventDefault();
    
    if (!newSessionName.trim()) {
      setError('Nome da sessão é obrigatório');
      return;
    }
    
    try {
      setCreating(true);
      const res = await axios.post(`${API_URL}/api/sessions`, {
        name: newSessionName
      });
      
      dispatch({
        type: 'CREATE_SESSION',
        payload: res.data.session
      });
      
      setNewSessionName('');
      setError(null);
    } catch (err) {
      setError(
        err.response && err.response.data.message
          ? err.response.data.message
          : 'Erro ao criar sessão'
      );
    } finally {
      setCreating(false);
    }
  };

  // Iniciar sessão
  const startSession = async (sessionId) => {
    try {
      const res = await axios.post(`${API_URL}/api/sessions/${sessionId}/start`);
      
      dispatch({
        type: 'UPDATE_SESSION',
        payload: res.data.session
      });
    } catch (err) {
      setError(
        err.response && err.response.data.message
          ? err.response.data.message
          : 'Erro ao iniciar sessão'
      );
    }
  };

  // Parar sessão
  const stopSession = async (sessionId) => {
    try {
      const res = await axios.post(`${API_URL}/api/sessions/${sessionId}/stop`);
      
      if (res.data.success) {
        // Atualizar estado da sessão
        const updatedSession = { ...state.sessions.find(s => s.sessionId === sessionId), isActive: false };
        
        dispatch({
          type: 'UPDATE_SESSION',
          payload: updatedSession
        });
      }
    } catch (err) {
      setError(
        err.response && err.response.data.message
          ? err.response.data.message
          : 'Erro ao parar sessão'
      );
    }
  };

  // Excluir sessão
  const deleteSession = async (sessionId) => {
    if (!window.confirm('Tem certeza que deseja excluir esta sessão? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    try {
      const res = await axios.delete(`${API_URL}/api/sessions/${sessionId}`);
      
      if (res.data.success) {
        dispatch({
          type: 'DELETE_SESSION',
          payload: sessionId
        });
      }
    } catch (err) {
      setError(
        err.response && err.response.data.message
          ? err.response.data.message
          : 'Erro ao excluir sessão'
      );
    }
  };

  return (
    <div className="session-list-container">
      <h1>Gerenciar Sessões</h1>
      <p>Crie e gerencie suas sessões do WhatsApp</p>
      
      {error && <div className="alert alert-danger">{error}</div>}
      
      <div className="create-session-form">
        <h2>Nova Sessão</h2>
        <form onSubmit={createSession}>
          <div className="form-group">
            <label htmlFor="sessionName">Nome da Sessão</label>
            <input
              type="text"
              id="sessionName"
              value={newSessionName}
              onChange={(e) => setNewSessionName(e.target.value)}
              placeholder="Ex: Trabalho, Pessoal, etc."
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={creating}>
            {creating ? 'Criando...' : 'Criar Sessão'}
          </button>
        </form>
      </div>
      
      <div className="sessions-container">
        <h2>Suas Sessões</h2>
        
        {loading ? (
          <p>Carregando sessões...</p>
        ) : state.sessions.length === 0 ? (
          <p>Nenhuma sessão encontrada. Crie uma nova sessão para começar.</p>
        ) : (
          <div className="session-grid">
            {state.sessions.map(session => (
              <div key={session.sessionId} className={`session-card ${session.isActive ? 'active' : 'inactive'}`}>
                <div className="session-header">
                  <h3>{session.name}</h3>
                  <span className={`status-badge ${session.isActive ? 'active' : 'inactive'}`}>
                    {session.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                
                <div className="session-body">
                  {session.phoneNumber && <p>Telefone: {session.phoneNumber}</p>}
                  <p>Criado em: {new Date(session.createdAt).toLocaleString()}</p>
                  {session.lastConnection && (
                    <p>Última conexão: {new Date(session.lastConnection).toLocaleString()}</p>
                  )}
                </div>
                
                <div className="session-actions">
                  <Link to={`/sessions/${session.sessionId}`} className="btn btn-info">
                    Detalhes
                  </Link>
                  
                  {session.isActive ? (
                    <>
                      <button
                        onClick={() => stopSession(session.sessionId)}
                        className="btn btn-warning"
                      >
                        Parar
                      </button>
                      
                      <Link to={`/chat/${session.sessionId}`} className="btn btn-success">
                        Chat
                      </Link>
                    </>
                  ) : (
                    <button
                      onClick={() => startSession(session.sessionId)}
                      className="btn btn-primary"
                    >
                      Iniciar
                    </button>
                  )}
                  
                  <button
                    onClick={() => deleteSession(session.sessionId)}
                    className="btn btn-danger"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionList;
