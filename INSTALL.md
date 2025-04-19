# WhatsApp Multi-Usuários - Documentação de Instalação

## Visão Geral

O WhatsApp Multi-Usuários é um sistema que permite gerenciar até 10 sessões simultâneas do WhatsApp através da API Baileys. O sistema oferece uma interface web para gerenciar sessões, enviar e receber mensagens em tempo real, e acessar históricos de mensagens.

## Requisitos do Sistema

### Requisitos de Hardware
- CPU: 2 núcleos ou mais
- RAM: 4GB ou mais
- Armazenamento: 10GB de espaço livre

### Requisitos de Software
- Node.js 17 ou superior
- MongoDB 4.4 ou superior
- NPM 7 ou superior
- Sistema operacional: Linux, macOS ou Windows

## Instalação

### 1. Preparação do Ambiente

#### Instalar Node.js e NPM
```bash
# Usando NVM (recomendado)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
source ~/.bashrc
nvm install 17
nvm use 17

# Verificar instalação
node -v  # Deve mostrar v17.x.x
npm -v   # Deve mostrar 7.x.x ou superior
```

#### Instalar MongoDB
```bash
# Ubuntu/Debian
wget -qO - https://www.mongodb.org/static/pgp/server-4.4.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/4.4 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.4.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# Verificar instalação
mongo --version
```

### 2. Configuração do Projeto

#### Clonar ou Extrair o Projeto
```bash
# Se estiver usando o arquivo ZIP
unzip whatsapp-multi-user.zip -d whatsapp-multi-user
cd whatsapp-multi-user

# Ou clone do repositório (se aplicável)
# git clone https://github.com/seu-usuario/whatsapp-multi-user.git
# cd whatsapp-multi-user
```

#### Instalar Dependências do Backend
```bash
npm install
```

#### Instalar Dependências do Frontend
```bash
cd frontend
npm install
cd ..
```

#### Configurar Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto com o seguinte conteúdo:

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/whatsapp-multi-user
JWT_SECRET=seu_segredo_jwt_super_seguro
JWT_EXPIRATION=24h
NODE_ENV=production
MAX_SESSIONS=10
```

Substitua `seu_segredo_jwt_super_seguro` por uma string aleatória segura.

#### Configurar Frontend
Crie um arquivo `config.js` na pasta `frontend/src` com o seguinte conteúdo:

```javascript
export const API_URL = 'http://localhost:3000';
```

Se você estiver implantando em um servidor remoto, substitua `localhost:3000` pelo endereço IP ou domínio do seu servidor.

### 3. Construir o Frontend
```bash
cd frontend
npm run build
cd ..
```

### 4. Iniciar o Sistema

#### Iniciar em Modo de Desenvolvimento
```bash
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

#### Iniciar em Modo de Produção
```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar o backend com PM2
pm2 start src/index.js --name whatsapp-backend

# Para servir o frontend, você pode usar um servidor web como Nginx ou Apache
# Exemplo com servidor simples:
npm install -g serve
serve -s frontend/build -l 3001
```

## Uso do Sistema

### Acessar o Sistema
Abra seu navegador e acesse:
- Modo de desenvolvimento: http://localhost:3001
- Modo de produção: http://seu-servidor:3001 (ou o domínio configurado)

### Criar uma Conta
1. Clique em "Registro" na página inicial
2. Preencha o formulário com seu nome de usuário, email e senha
3. Clique em "Registrar"

### Gerenciar Sessões
1. Após fazer login, você será redirecionado para o Dashboard
2. Clique em "Gerenciar Sessões" para ver todas as suas sessões
3. Clique em "Criar Sessão" para adicionar uma nova sessão do WhatsApp

### Conectar ao WhatsApp
1. Clique em "Detalhes" em uma sessão
2. Clique em "Iniciar Sessão"
3. Escaneie o código QR com seu WhatsApp (Menu > WhatsApp Web)
4. Após a conexão, o status mudará para "Ativo"

### Enviar e Receber Mensagens
1. Clique em "Chat" em uma sessão ativa
2. Selecione um contato na lista à esquerda
3. Digite sua mensagem e clique em "Enviar"
4. As mensagens recebidas aparecerão automaticamente

## Solução de Problemas

### O Backend Não Inicia
- Verifique se o MongoDB está em execução: `sudo systemctl status mongod`
- Verifique se a porta 3000 está disponível: `lsof -i :3000`
- Verifique os logs: `pm2 logs whatsapp-backend`

### O Frontend Não Carrega
- Verifique se o arquivo `config.js` está configurado corretamente
- Verifique se o backend está em execução e acessível
- Limpe o cache do navegador ou tente em uma janela anônima

### Não Consigo Escanear o Código QR
- Certifique-se de que seu telefone tem acesso à internet
- Reinicie a sessão clicando em "Parar Sessão" e depois "Iniciar Sessão"
- Verifique se seu WhatsApp está atualizado

### Mensagens Não São Enviadas
- Verifique se a sessão está ativa
- Verifique se o número de telefone está no formato correto (com código do país)
- Reinicie a sessão se o problema persistir

## Backup e Restauração

### Backup do Banco de Dados
```bash
mongodump --db whatsapp-multi-user --out /caminho/para/backup
```

### Restauração do Banco de Dados
```bash
mongorestore --db whatsapp-multi-user /caminho/para/backup/whatsapp-multi-user
```

### Backup das Sessões
```bash
# As sessões são armazenadas na pasta 'sessions' na raiz do projeto
cp -r sessions /caminho/para/backup/sessions
```

### Restauração das Sessões
```bash
cp -r /caminho/para/backup/sessions .
```

## Atualização do Sistema

Para atualizar o sistema para uma nova versão:

1. Faça backup do banco de dados e das sessões
2. Extraia a nova versão do sistema
3. Copie o arquivo `.env` e a pasta `sessions` para a nova versão
4. Instale as dependências e construa o frontend
5. Reinicie o sistema

## Considerações de Segurança

- Altere o `JWT_SECRET` para uma string aleatória segura
- Use HTTPS em ambiente de produção
- Mantenha o Node.js e o MongoDB atualizados
- Não compartilhe suas credenciais de acesso
- Faça backups regulares do banco de dados e das sessões

## Limitações Conhecidas

- Máximo de 10 sessões simultâneas
- Algumas funcionalidades do WhatsApp podem não estar disponíveis
- O WhatsApp pode impor limites de mensagens para contas não verificadas
- O sistema não é afiliado ou endossado pelo WhatsApp

## Suporte

Se você encontrar problemas ou tiver dúvidas, entre em contato através de:

- Email: seu-email@exemplo.com
- GitHub: https://github.com/seu-usuario/whatsapp-multi-user/issues
