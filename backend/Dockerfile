# Etapa de build
FROM node:22-alpine AS builder
# Diretório de trabalho
WORKDIR /app
# Copiar arquivos de dependências primeiro, para melhor caching
COPY package*.json ./
RUN npm ci
# Copiar código fonte
COPY . .
# Compilar a aplicação
RUN npm run build
# Etapa de produção
FROM node:22-alpine AS production
# Diretório de trabalho
WORKDIR /app
# Instalar apenas dependências de produção
COPY package*.json ./
RUN npm ci --omit=dev
# Copiar apenas os arquivos compilados da etapa de build
COPY --from=builder /app/dist ./dist
# Expor a porta usada pela aplicação
EXPOSE 3000
# Criar usuário não-root para executar a aplicação
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
# Comando para executar a aplicação
CMD ["node", "dist/main.js"]