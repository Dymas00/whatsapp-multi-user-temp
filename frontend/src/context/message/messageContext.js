import React, { createContext, useReducer } from 'react';

const MessageContext = createContext();

const initialState = {
  messages: {},
  contacts: [],
  currentChat: null,
  loading: true,
  error: null
};

const messageReducer = (state, action) => {
  switch (action.type) {
    case 'GET_MESSAGES':
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.jid]: action.payload.messages
        },
        loading: false
      };
    case 'ADD_MESSAGE':
      const jid = action.payload.remoteJid;
      return {
        ...state,
        messages: {
          ...state.messages,
          [jid]: [
            ...(state.messages[jid] || []),
            action.payload
          ]
        }
      };
    case 'UPDATE_MESSAGE_STATUS':
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.jid]: (state.messages[action.payload.jid] || []).map(
            msg => msg.messageId === action.payload.messageId 
              ? { ...msg, status: action.payload.status } 
              : msg
          )
        }
      };
    case 'GET_CONTACTS':
      return {
        ...state,
        contacts: action.payload,
        loading: false
      };
    case 'SET_CURRENT_CHAT':
      return {
        ...state,
        currentChat: action.payload
      };
    case 'MESSAGE_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
};

export const MessageProvider = ({ children }) => {
  const [state, dispatch] = useReducer(messageReducer, initialState);

  return (
    <MessageContext.Provider value={{ state, dispatch }}>
      {children}
    </MessageContext.Provider>
  );
};

export default MessageContext;
