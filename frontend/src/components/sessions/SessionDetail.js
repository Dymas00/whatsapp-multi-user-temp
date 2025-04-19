import React, { useContext, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import SessionContext from '../../context/session/sessionContext';
import MessageContext from '../../context/message/messageContext';
import { API_URL } from '../../config';

const SessionDetail = ({ history }) => {
  const { sessionId } = useParams();
  const { state: sessionState, dispatch: sessionDispatch } = useContext(SessionContext);
  const { dispatch: messageDispatch } = useContext(MessageContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);

  // Carregar detalhes da sessão
  useEffect(() => {
    const fetchSessionDetails = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/api/sessions/${sessionId}`);
        
        sessionDispatch({
          type: 'SET_CURRENT_SESSION',
          payload: res.data.session
        });
        
        // Se a sessão tiver QR code, buscar
        if (!res.data.session.isActive && !res.data.session.phoneNumber) {
          fetchQrCode();
        }
      } catch (err) {
        setError(
          err.response && err.response.data.message
            ? err.response.data.message
            : 'Erro ao carregar detalhes da sessão'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSessionDetails();
  }, [sessionId, sessionDispatch]);

  // Buscar QR code
  const fetchQrCode = async () => {
    try {
      setQrLoading(true);
      const res = await axios.get(`${API_URL}/api/sessions/${sessionId}/qrcode`);
      
      if (res.data.success && res.data.qrCode) {
        setQrCode(res.data.qrCode);
      }
    } catch (err) {
      console.log('QR code não disponível ainda');
    } finally {
      setQrLoading(false);
    }
  };

  // Iniciar sessão
  const startSession = async () => {
    try {
      const res = await axios.post(`${API_URL}/api/sessions/${sessionId}/start`);
      
      sessionDispatch({
        type: 'UPDATE_SESSION',
        payload: res.data.session
      });
      
      // Buscar QR code após iniciar
      fetchQrCode();
    } catch (err) {
      setError(
        err.response && err.response.data.message
          ? err.response.data.message
          : 'Erro ao iniciar sessão'
      );
    }
  };

  // Parar sessão
  const stopSession = async () => {
    try {
      const res = await axios.post(`${API_URL}/api/sessions/${sessionId}/stop`);
      
      if (res.data.success) {
        // Atualizar estado da sessão
        const updatedSession = { 
          ...sessionState.currentSession, 
          isActive: false 
        };
        
        sessionDispatch({
          type: 'UPDATE_SESSION',
          payload: updatedSession
        });
        
        setQrCode(null);
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
  const deleteSession = async () => {
    if (!window.confirm('Tem certeza que deseja excluir esta sessão? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    try {
      const res = await axios.delete(`${API_URL}/api/sessions/${sessionId}`);
      
      if (res.data.success) {
        sessionDispatch({
          type: 'DELETE_SESSION',
          payload: sessionId
        });
        
        // Redirecionar para a lista de sessões
        history.push('/sessions');
      }
    } catch (err) {
      setError(
        err.response && err.response.data.message
          ? err.response.data.message
          : 'Erro ao excluir sessão'
      );
    }
  };

  // Carregar contatos
  const loadContacts = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/messages/${sessionId}/contacts`);
      
      messageDispatch({
        type: 'GET_CONTACTS',
        payload: res.data.contacts
      });
      
      // Redirecionar para o chat
      history.push(`/chat/${sessionId}`);
    } catch (err) {
      setError(
        err.response && err.response.data.message
          ? err.response.data.message
          : 'Erro ao carregar contatos'
      );
    }
  };

  if (loading) {
    return <div className="loading">Carregando detalhes da sessão...</div>;
  }

  if (!sessionState.currentSession) {
    return (
      <div className="error-container">
        <h2>Sessão não encontrada</h2>
        <Link to="/sessions" className="btn btn-primary">
          Voltar para a lista de sessões
        </Link>
      </div>
    );
  }

  const { name, isActive, phoneNumber, createdAt, lastConnection } = sessionState.currentSession;

  return (
    <div className="session-detail-container">
      <div className="session-detail-header">
        <h1>{name}</h1>
        <span className={`status-badge ${isActive ? 'active' : 'inactive'}`}>
          {isActive ? 'Ativo' : 'Inativo'}
        </span>
      </div>
      
      {error && <div className="alert alert-danger">{error}</div>}
      
      <div className="session-info-card">
        <h2>Informações da Sessão</h2>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">ID da Sessão:</span>
            <span className="info-value">{sessionId}</span>
          </div>
          {phoneNumber && (
            <div className="info-item">
              <span className="info-label">Número de Telefone:</span>
              <span className="info-value">{phoneNumber}</span>
            </div>
          )}
          <div className="info-item">
            <span className="info-label">Criado em:</span>
            <span className="info-value">{new Date(createdAt).toLocaleString()}</span>
          </div>
          {lastConnection && (
            <div className="info-item">
              <span className="info-label">Última Conexão:</span>
              <span className="info-value">{new Date(lastConnection).toLocaleString()}</span>
            </div>
          )}
          <div className="info-item">
            <span className="info-label">Status:</span>
            <span className="info-value">{isActive ? 'Conectado' : 'Desconectado'}</span>
          </div>
        </div>
      </div>
      
      {!isActive && !phoneNumber && (
        <div className="qr-code-container">
          <h2>Conectar ao WhatsApp</h2>
          <p>Escaneie o código QR abaixo com seu WhatsApp para conectar esta sessão:</p>
          
          {qrLoading ? (
            <div className="qr-loading">Carregando código QR...</div>
          ) : qrCode ? (
            <div className="qr-image">
              <img src={qrCode} alt="QR Code para conexão com WhatsApp" />
            </div>
          ) : (
            <div className="qr-not-available">
              <p>Código QR não disponível. Inicie a sessão para gerar um código QR.</p>
            </div>
          )}
        </div>
      )}
      
      <div className="session-actions">
        {isActive ? (
          <>
            <button onClick={stopSession} className="btn btn-warning">
              Parar Sessão
            </button>
            
            <button onClick={loadContacts} className="btn btn-success">
              Abrir Chat
            </button>
          </>
        ) : (
          <button onClick={startSession} className="btn btn-primary">
            Iniciar Sessão
          </button>
        )}
        
        <button onClick={deleteSession} className="btn btn-danger">
          Excluir Sessão
        </button>
        
        <Link to="/sessions" className="btn btn-secondary">
          Voltar para a Lista
        </Link>
      </div>
    </div>
  );
};

export default SessionDetail;
