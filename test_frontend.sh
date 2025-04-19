#!/bin/bash

# Script para verificar a integridade do frontend
echo "Verificando integridade do frontend..."

cd frontend

# Verificar se o arquivo de configuração existe
if [ ! -f "src/config.js" ]; then
  echo "Criando arquivo de configuração do frontend..."
  echo "export const API_URL = 'http://localhost:3000';" > src/config.js
fi

# Verificar componentes essenciais
COMPONENTS=(
  "src/App.js"
  "src/context/auth/authContext.js"
  "src/context/session/sessionContext.js"
  "src/context/message/messageContext.js"
  "src/components/auth/Login.js"
  "src/components/auth/Register.js"
  "src/components/dashboard/Dashboard.js"
  "src/components/sessions/SessionList.js"
  "src/components/sessions/SessionDetail.js"
  "src/components/chat/Chat.js"
)

MISSING=0
for COMPONENT in "${COMPONENTS[@]}"; do
  if [ ! -f "$COMPONENT" ]; then
    echo "Componente ausente: $COMPONENT"
    MISSING=1
  fi
done

if [ $MISSING -eq 0 ]; then
  echo "Todos os componentes do frontend estão presentes."
else
  echo "Alguns componentes do frontend estão ausentes. Verifique a estrutura do projeto."
fi

# Criar arquivo de roteamento privado se não existir
if [ ! -f "src/components/routing/PrivateRoute.js" ]; then
  echo "Criando componente de rota privada..."
  mkdir -p src/components/routing
  cat > src/components/routing/PrivateRoute.js << 'EOF'
import React, { useContext } from 'react';
import { Route, Redirect } from 'react-router-dom';
import AuthContext from '../../context/auth/authContext';

const PrivateRoute = ({ component: Component, ...rest }) => {
  const { state } = useContext(AuthContext);
  
  return (
    <Route
      {...rest}
      render={props =>
        !state.token ? (
          <Redirect to="/login" />
        ) : (
          <Component {...props} />
        )
      }
    />
  );
};

export default PrivateRoute;
EOF
  echo "Componente de rota privada criado com sucesso."
fi

# Criar componente de navbar se não existir
if [ ! -f "src/components/layout/Navbar.js" ]; then
  echo "Criando componente de navbar..."
  mkdir -p src/components/layout
  cat > src/components/layout/Navbar.js << 'EOF'
import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../../context/auth/authContext';

const Navbar = () => {
  const { state, dispatch } = useContext(AuthContext);

  const onLogout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  const authLinks = (
    <ul>
      <li>
        <Link to="/dashboard">Dashboard</Link>
      </li>
      <li>
        <Link to="/sessions">Sessões</Link>
      </li>
      <li>
        <a href="#!" onClick={onLogout}>
          Sair
        </a>
      </li>
    </ul>
  );

  const guestLinks = (
    <ul>
      <li>
        <Link to="/login">Login</Link>
      </li>
      <li>
        <Link to="/register">Registro</Link>
      </li>
    </ul>
  );

  return (
    <nav className="navbar">
      <h1>
        <Link to="/">
          <i className="fab fa-whatsapp"></i> WhatsApp Multi-Usuários
        </Link>
      </h1>
      {state.token ? authLinks : guestLinks}
    </nav>
  );
};

export default Navbar;
EOF
  echo "Componente de navbar criado com sucesso."
fi

# Criar arquivo de índice se não existir
if [ ! -f "src/index.js" ]; then
  echo "Criando arquivo de índice do React..."
  cat > src/index.js << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
EOF
  echo "Arquivo de índice criado com sucesso."
fi

# Criar arquivo CSS básico se não existir
if [ ! -f "src/index.css" ]; then
  echo "Criando arquivo CSS básico..."
  cat > src/index.css << 'EOF'
:root {
  --primary-color: #25d366;
  --dark-color: #075e54;
  --light-color: #f4f4f4;
  --danger-color: #dc3545;
  --success-color: #28a745;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Roboto', sans-serif;
  font-size: 1rem;
  line-height: 1.6;
  background-color: #f0f2f5;
  color: #333;
}

a {
  color: var(--primary-color);
  text-decoration: none;
}

a:hover {
  color: var(--dark-color);
}

ul {
  list-style: none;
}

.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 2rem;
}

.btn {
  display: inline-block;
  background: var(--light-color);
  color: #333;
  padding: 0.4rem 1.3rem;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  margin-right: 0.5rem;
  outline: none;
  transition: all 0.2s ease-in;
}

.btn-primary {
  background: var(--primary-color);
  color: #fff;
}

.btn-secondary {
  background: var(--dark-color);
  color: #fff;
}

.btn-danger {
  background: var(--danger-color);
  color: #fff;
}

.btn-success {
  background: var(--success-color);
  color: #fff;
}

.btn:hover {
  opacity: 0.8;
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.7rem 2rem;
  position: fixed;
  z-index: 1;
  width: 100%;
  top: 0;
  background-color: var(--dark-color);
  color: #fff;
}

.navbar ul {
  display: flex;
}

.navbar a {
  color: #fff;
  padding: 0.45rem;
  margin: 0 0.25rem;
}

.navbar a:hover {
  color: var(--primary-color);
}

.navbar h1 {
  font-size: 1.5rem;
}

.chat-container {
  display: flex;
  height: calc(100vh - 70px);
  margin-top: 70px;
}

.chat-sidebar {
  width: 300px;
  background: #fff;
  border-right: 1px solid #ddd;
  overflow-y: auto;
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.messages-container {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  background: #e5ddd5;
}

.message-input-container {
  padding: 1rem;
  background: #f0f0f0;
}

.message-bubble {
  max-width: 70%;
  padding: 0.5rem 1rem;
  margin-bottom: 1rem;
  border-radius: 0.5rem;
  position: relative;
}

.message-bubble.outgoing {
  background: #dcf8c6;
  margin-left: auto;
}

.message-bubble.incoming {
  background: #fff;
}

.session-card {
  background: #fff;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.session-card.active {
  border-left: 5px solid var(--success-color);
}

.session-card.inactive {
  border-left: 5px solid var(--danger-color);
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.8rem;
  margin-left: 0.5rem;
}

.status-badge.active {
  background: var(--success-color);
  color: #fff;
}

.status-badge.inactive {
  background: var(--danger-color);
  color: #fff;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
}

.form-group input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 0.25rem;
}

.alert {
  padding: 0.8rem;
  margin: 1rem 0;
  opacity: 0.9;
  background: var(--light-color);
  color: #333;
  border-radius: 0.25rem;
}

.alert-danger {
  background: var(--danger-color);
  color: #fff;
}

.alert-success {
  background: var(--success-color);
  color: #fff;
}

.dashboard-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin: 2rem 0;
}

.stat-card {
  background: #fff;
  padding: 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: var(--primary-color);
}

.qr-image img {
  max-width: 300px;
  margin: 1rem auto;
  display: block;
}

@media (max-width: 700px) {
  .chat-container {
    flex-direction: column;
  }
  
  .chat-sidebar {
    width: 100%;
    height: 300px;
  }
  
  .dashboard-stats {
    grid-template-columns: 1fr;
  }
}
EOF
  echo "Arquivo CSS básico criado com sucesso."
fi

echo "Verificação do frontend concluída."
cd ..
