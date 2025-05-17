# Multi-stage build para aplicações NestJS

# ==== ESTÁGIO DE BUILD ====
FROM node:20-alpine AS build

WORKDIR /app

# Copie package.json e package-lock.json
COPY package*.json ./

# Instale todas as dependências, incluindo devDependencies
RUN npm ci

# Copie o restante do código fonte
COPY . .

# Execute o build do NestJS
RUN npm run build

# ==== ESTÁGIO DE PRODUÇÃO ====
FROM node:20-alpine AS production

# Adicione dumb-init para lidar corretamente com sinais
RUN apk add --no-cache dumb-init

# Defina NODE_ENV como production
ENV NODE_ENV=production

# Crie diretório de aplicação com permissões corretas
WORKDIR /app

# Copie apenas package.json e package-lock.json
COPY --chown=node:node package*.json ./

# Instale apenas as dependências de produção
RUN npm ci --only=production && npm cache clean --force

# Copie os arquivos de build do estágio anterior
COPY --chown=node:node --from=build /app/dist /app/dist

# Crie um diretório para uploads com permissões adequadas (se necessário)
RUN mkdir -p /app/uploads && chown -R node:node /app/uploads

# Use o usuário node para melhorar a segurança
USER node

# Exponha a porta da aplicação
EXPOSE 3000

# Use dumb-init como entrypoint para lidar corretamente com sinais
ENTRYPOINT ["dumb-init", "--"]

# Comando para executar a aplicação
CMD ["node", "dist/main.js"]

# Metadados da imagem
LABEL maintainer="Seu Nome <seu-email@exemplo.com>"
LABEL version="1.0"
LABEL description="Backend da aplicação Solidários"