import React, { createContext, useReducer } from 'react';

const SessionContext = createContext();

const initialState = {
  sessions: [],
  currentSession: null,
  loading: true,
  error: null
};

const sessionReducer = (state, action) => {
  switch (action.type) {
    case 'GET_SESSIONS':
      return {
        ...state,
        sessions: action.payload,
        loading: false
      };
    case 'SET_CURRENT_SESSION':
      return {
        ...state,
        currentSession: action.payload,
        loading: false
      };
    case 'CREATE_SESSION':
      return {
        ...state,
        sessions: [...state.sessions, action.payload],
        loading: false
      };
    case 'DELETE_SESSION':
      return {
        ...state,
        sessions: state.sessions.filter(session => session.sessionId !== action.payload),
        currentSession: state.currentSession?.sessionId === action.payload ? null : state.currentSession,
        loading: false
      };
    case 'UPDATE_SESSION':
      return {
        ...state,
        sessions: state.sessions.map(session => 
          session.sessionId === action.payload.sessionId ? action.payload : session
        ),
        currentSession: state.currentSession?.sessionId === action.payload.sessionId ? 
          action.payload : state.currentSession,
        loading: false
      };
    case 'SESSION_ERROR':
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

export const SessionProvider = ({ children }) => {
  const [state, dispatch] = useReducer(sessionReducer, initialState);

  return (
    <SessionContext.Provider value={{ state, dispatch }}>
      {children}
    </SessionContext.Provider>
  );
};

export default SessionContext;
