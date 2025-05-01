# Estágio base
FROM node:22.15-alpine AS base 
WORKDIR /usr/src/app
COPY package*.json ./

# Estágio de desenvolvimento
FROM base AS development
# Instalar dependências de compilação do bcrypt
RUN apk add --no-cache make gcc g++ python3 
RUN npm install
RUN npm uninstall bcrypt || true
RUN npm install bcrypt --build-from-source
COPY . .
EXPOSE 3000
CMD ["npm", "run", "start:dev"]

# Estágio de produção
FROM base AS production
# Instalar dependências de compilação
RUN apk add --no-cache make gcc g++ python3
RUN npm ci --only=production
RUN npm uninstall bcrypt || true
RUN npm install bcrypt --build-from-source

COPY . .
EXPOSE 3000
CMD ["npm", "run", "start"]