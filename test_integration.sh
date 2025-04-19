#!/bin/bash

# Script para testar a integração entre frontend e backend
echo "Testando integração entre frontend e backend..."

# Verificar se o MongoDB está em execução
echo "Verificando se o MongoDB está em execução..."
mongo --eval "db.stats()" > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "AVISO: MongoDB não parece estar em execução. Inicie o MongoDB antes de executar o sistema."
fi

# Verificar portas disponíveis
echo "Verificando portas disponíveis..."
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
  echo "AVISO: A porta 3000 já está em uso. O backend pode não iniciar corretamente."
fi

if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
  echo "AVISO: A porta 3001 já está em uso. O frontend pode não iniciar corretamente."
fi

# Verificar se as dependências estão instaladas
echo "Verificando dependências do backend..."
if [ ! -d "node_modules" ]; then
  echo "Instalando dependências do backend..."
  npm install
fi

echo "Verificando dependências do frontend..."
if [ ! -d "frontend/node_modules" ]; then
  echo "Instalando dependências do frontend..."
  cd frontend && npm install && cd ..
fi

# Criar arquivo de configuração do frontend se não existir
if [ ! -f "frontend/src/config.js" ]; then
  echo "Criando arquivo de configuração do frontend..."
  echo "export const API_URL = 'http://localhost:3000';" > frontend/src/config.js
fi

# Iniciar backend em modo de teste
echo "Iniciando backend em modo de teste..."
NODE_ENV=test PORT=3000 node src/index.js &
BACKEND_PID=$!

# Aguardar inicialização do backend
echo "Aguardando inicialização do backend..."
sleep 5

# Verificar se o backend está respondendo
echo "Verificando se o backend está respondendo..."
curl -s http://localhost:3000/health | grep -q "ok"
if [ $? -eq 0 ]; then
  echo "Backend iniciado com sucesso."
else
  echo "ERRO: Backend não está respondendo. Verifique os logs para mais detalhes."
  kill $BACKEND_PID
  exit 1
fi

# Iniciar frontend em modo de teste
echo "Iniciando frontend em modo de teste..."
cd frontend && PORT=3001 npm start &
FRONTEND_PID=$!

# Aguardar inicialização do frontend
echo "Aguardando inicialização do frontend..."
sleep 10

# Verificar se o frontend está respondendo
echo "Verificando se o frontend está respondendo..."
curl -s http://localhost:3001 | grep -q "React App"
if [ $? -eq 0 ]; then
  echo "Frontend iniciado com sucesso."
else
  echo "AVISO: Não foi possível verificar se o frontend está respondendo. Isso pode ser normal em alguns ambientes."
fi

echo "Sistema iniciado para testes manuais."
echo "Backend: http://localhost:3000"
echo "Frontend: http://localhost:3001"
echo ""
echo "Pressione CTRL+C para encerrar os testes e parar o sistema."

# Aguardar sinal de interrupção
wait $BACKEND_PID $FRONTEND_PID

# Limpar processos ao encerrar
echo "Encerrando processos..."
kill $BACKEND_PID $FRONTEND_PID 2>/dev/null

echo "Teste de integração concluído."
