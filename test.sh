#!/bin/bash

# Script de teste para o sistema multi-usuários com Baileys

echo "Iniciando testes do sistema multi-usuários com Baileys..."

# Verificar dependências
echo "Verificando dependências..."
command -v node >/dev/null 2>&1 || { echo "Node.js não encontrado. Por favor, instale o Node.js 17+."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "NPM não encontrado. Por favor, instale o NPM."; exit 1; }
command -v mongo >/dev/null 2>&1 || { echo "MongoDB não encontrado. Por favor, instale o MongoDB."; }

# Verificar versão do Node.js
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 17 ]; then
  echo "Versão do Node.js incompatível. É necessário Node.js 17+."
  exit 1
fi

# Verificar estrutura do projeto
echo "Verificando estrutura do projeto..."
if [ ! -d "src" ] || [ ! -d "frontend" ]; then
  echo "Estrutura de diretórios inválida. Certifique-se de estar no diretório raiz do projeto."
  exit 1
fi

# Instalar dependências do backend
echo "Instalando dependências do backend..."
npm install

# Instalar dependências do frontend
echo "Instalando dependências do frontend..."
cd frontend && npm install && cd ..

# Verificar configuração do MongoDB
echo "Verificando configuração do MongoDB..."
if [ -z "$MONGODB_URI" ]; then
  echo "Variável de ambiente MONGODB_URI não definida. Usando valor padrão."
  export MONGODB_URI="mongodb://localhost:27017/whatsapp-multi-user"
fi

# Executar testes unitários (se existirem)
if [ -d "tests" ]; then
  echo "Executando testes unitários..."
  npm test
fi

# Iniciar servidor em modo de teste
echo "Iniciando servidor em modo de teste..."
NODE_ENV=test PORT=3001 node src/index.js &
SERVER_PID=$!

# Aguardar inicialização do servidor
echo "Aguardando inicialização do servidor..."
sleep 5

# Testar API
echo "Testando endpoints da API..."
curl -s http://localhost:3001/health | grep -q "ok" && echo "Endpoint de saúde: OK" || echo "Endpoint de saúde: FALHA"

# Testar registro de usuário
echo "Testando registro de usuário..."
REGISTER_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -d '{"username":"testuser","email":"test@example.com","password":"password123"}' http://localhost:3001/api/auth/register)
echo $REGISTER_RESPONSE | grep -q "token" && echo "Registro de usuário: OK" || echo "Registro de usuário: FALHA"

# Extrair token
TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
  echo "Token obtido com sucesso."
  
  # Testar criação de sessão
  echo "Testando criação de sessão..."
  SESSION_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"name":"TestSession"}' http://localhost:3001/api/sessions)
  echo $SESSION_RESPONSE | grep -q "success" && echo "Criação de sessão: OK" || echo "Criação de sessão: FALHA"
  
  # Extrair ID da sessão
  SESSION_ID=$(echo $SESSION_RESPONSE | grep -o '"sessionId":"[^"]*' | cut -d'"' -f4)
  
  if [ -n "$SESSION_ID" ]; then
    echo "ID da sessão obtido com sucesso: $SESSION_ID"
    
    # Testar inicialização de sessão
    echo "Testando inicialização de sessão..."
    START_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/sessions/$SESSION_ID/start)
    echo $START_RESPONSE | grep -q "success" && echo "Inicialização de sessão: OK" || echo "Inicialização de sessão: FALHA"
    
    # Testar obtenção de QR code
    echo "Testando obtenção de QR code..."
    QR_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/sessions/$SESSION_ID/qrcode)
    echo $QR_RESPONSE | grep -q "qrCode" && echo "Obtenção de QR code: OK" || echo "Obtenção de QR code: FALHA"
    
    # Testar parada de sessão
    echo "Testando parada de sessão..."
    STOP_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/sessions/$SESSION_ID/stop)
    echo $STOP_RESPONSE | grep -q "success" && echo "Parada de sessão: OK" || echo "Parada de sessão: FALHA"
    
    # Testar exclusão de sessão
    echo "Testando exclusão de sessão..."
    DELETE_RESPONSE=$(curl -s -X DELETE -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/sessions/$SESSION_ID)
    echo $DELETE_RESPONSE | grep -q "success" && echo "Exclusão de sessão: OK" || echo "Exclusão de sessão: FALHA"
  else
    echo "Não foi possível obter o ID da sessão."
  fi
else
  echo "Não foi possível obter o token."
fi

# Parar servidor
echo "Parando servidor..."
kill $SERVER_PID

echo "Testes concluídos."
