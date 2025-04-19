import React, { useContext, useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import SessionContext from '../../context/session/sessionContext';
import MessageContext from '../../context/message/messageContext';
import { API_URL } from '../../config';

const Chat = () => {
  const { sessionId, jid } = useParams();
  const { state: sessionState } = useContext(SessionContext);
  const { state: messageState, dispatch: messageDispatch } = useContext(MessageContext);
  const [loading, setLoading] = useState(true);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [socket, setSocket] = useState(null);
  const [selectedContact, setSelectedContact] = useState(jid || null);
  const messagesEndRef = useRef(null);

  // Carregar contatos
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setContactsLoading(true);
        const res = await axios.get(`${API_URL}/api/messages/${sessionId}/contacts`);
        
        messageDispatch({
          type: 'GET_CONTACTS',
          payload: res.data.contacts
        });
      } catch (err) {
        setError('Erro ao carregar contatos');
      } finally {
        setContactsLoading(false);
      }
    };

    fetchContacts();
  }, [sessionId, messageDispatch]);

  // Carregar mensagens do contato selecionado
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedContact) return;
      
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/api/messages/${sessionId}/history/${selectedContact}`);
        
        messageDispatch({
          type: 'GET_MESSAGES',
          payload: {
            jid: selectedContact,
            messages: res.data.messages
          }
        });
        
        messageDispatch({
          type: 'SET_CURRENT_CHAT',
          payload: {
            sessionId,
            jid: selectedContact
          }
        });
      } catch (err) {
        setError('Erro ao carregar mensagens');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [sessionId, selectedContact, messageDispatch]);

  // Configurar Socket.IO
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const newSocket = io(API_URL, {
      auth: {
        token
      }
    });

    newSocket.on('connect', () => {
      console.log('Socket.IO conectado');
      // Inscrever-se em eventos da sessão
      newSocket.emit('subscribe:session', sessionId);
    });

    newSocket.on('message', (data) => {
      if (data.eventType === 'new' && data.data.remoteJid === selectedContact) {
        // Adicionar nova mensagem ao estado
        messageDispatch({
          type: 'ADD_MESSAGE',
          payload: data.data
        });
      } else if (data.eventType === 'status') {
        // Atualizar status da mensagem
        messageDispatch({
          type: 'UPDATE_MESSAGE_STATUS',
          payload: {
            jid: data.data.remoteJid,
            messageId: data.data.messageId,
            status: data.data.status
          }
        });
      }
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.emit('unsubscribe:session', sessionId);
        newSocket.disconnect();
      }
    };
  }, [sessionId, selectedContact, messageDispatch]);

  // Rolar para o final das mensagens quando novas mensagens chegarem
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messageState.messages[selectedContact]]);

  // Enviar mensagem
  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!message.trim() || !selectedContact) return;
    
    try {
      setSending(true);
      const res = await axios.post(`${API_URL}/api/messages/${sessionId}/send`, {
        jid: selectedContact,
        text: message
      });
      
      if (res.data.success) {
        setMessage('');
      }
    } catch (err) {
      setError(
        err.response && err.response.data.message
          ? err.response.data.message
          : 'Erro ao enviar mensagem'
      );
    } finally {
      setSending(false);
    }
  };

  // Selecionar contato
  const handleContactSelect = (contactJid) => {
    setSelectedContact(contactJid);
  };

  // Encontrar nome do contato
  const getContactName = (contactJid) => {
    const contact = messageState.contacts.find(c => c.jid === contactJid);
    return contact ? (contact.name || contact.pushName || contact.phoneNumber || contactJid) : contactJid;
  };

  // Formatar timestamp
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        <div className="sidebar-header">
          <h2>Contatos</h2>
          <Link to="/sessions" className="btn btn-sm btn-secondary">
            Voltar
          </Link>
        </div>
        
        {contactsLoading ? (
          <div className="loading">Carregando contatos...</div>
        ) : messageState.contacts.length === 0 ? (
          <div className="no-contacts">
            <p>Nenhum contato encontrado.</p>
          </div>
        ) : (
          <div className="contact-list">
            {messageState.contacts.map(contact => (
              <div
                key={contact.jid}
                className={`contact-item ${selectedContact === contact.jid ? 'active' : ''}`}
                onClick={() => handleContactSelect(contact.jid)}
              >
                <div className="contact-avatar">
                  {(contact.name || contact.pushName || '?').charAt(0).toUpperCase()}
                </div>
                <div className="contact-info">
                  <div className="contact-name">
                    {contact.name || contact.pushName || contact.phoneNumber || contact.jid}
                  </div>
                  {contact.lastInteraction && (
                    <div className="contact-last-seen">
                      {new Date(contact.lastInteraction).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="chat-main">
        {!selectedContact ? (
          <div className="no-chat-selected">
            <p>Selecione um contato para iniciar o chat.</p>
          </div>
        ) : (
          <>
            <div className="chat-header">
              <h2>{getContactName(selectedContact)}</h2>
            </div>
            
            {error && <div className="alert alert-danger">{error}</div>}
            
            <div className="messages-container">
              {loading ? (
                <div className="loading">Carregando mensagens...</div>
              ) : !messageState.messages[selectedContact] || messageState.messages[selectedContact].length === 0 ? (
                <div className="no-messages">
                  <p>Nenhuma mensagem encontrada. Envie uma mensagem para iniciar a conversa.</p>
                </div>
              ) : (
                <div className="messages-list">
                  {messageState.messages[selectedContact].map(msg => (
                    <div
                      key={msg.messageId}
                      className={`message-bubble ${msg.fromMe ? 'outgoing' : 'incoming'}`}
                    >
                      <div className="message-content">
                        {msg.content}
                      </div>
                      <div className="message-meta">
                        <span className="message-time">{formatTime(msg.timestamp)}</span>
                        {msg.fromMe && (
                          <span className={`message-status status-${msg.status}`}>
                            {msg.status === 'pending' && '⌛'}
                            {msg.status === 'sent' && '✓'}
                            {msg.status === 'delivered' && '✓✓'}
                            {msg.status === 'read' && '✓✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
            
            <div className="message-input-container">
              <form onSubmit={sendMessage}>
                <div className="input-group">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Digite uma mensagem..."
                    disabled={sending}
                  />
                  <button type="submit" disabled={sending || !message.trim()}>
                    {sending ? 'Enviando...' : 'Enviar'}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Chat;
