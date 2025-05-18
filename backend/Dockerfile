# Etapa de build
FROM node:22-alpine AS builder

# Diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências primeiro para melhor aproveitamento de cache
COPY package*.json ./

# Instalar dependências (incluindo devDependencies)
RUN npm ci

# Copiar o código-fonte
COPY . .

# Compilar a aplicação
RUN npm run build

# Etapa de produção (imagem final)
FROM node:22-alpine AS production

# Definir variáveis de ambiente para produção
ENV NODE_ENV=production

# Diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar apenas dependências de produção (sem devDependencies)
RUN npm ci --omit=dev

# Copiar apenas os arquivos compilados da etapa de build
COPY --from=builder /app/dist ./dist

# Copiar os arquivos de configuração necessários
COPY --from=builder /app/.env* ./
COPY --from=builder /app/nest-cli.json ./

# Expor a porta usada pela aplicação
EXPOSE 3000

# Criar usuário não-root para executar a aplicação (boa prática de segurança)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Comando para executar a aplicação
CMD ["node", "dist/main.js"]