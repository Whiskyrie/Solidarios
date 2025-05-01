# Estágio base
FROM node:${NODE_VERSION}-alpine AS base
WORKDIR /usr/src/app
COPY package*.json ./

# Estágio de desenvolvimento
FROM base AS development
# Instalar dependências de compilação do bcrypt
RUN apk add --no-cache make gcc g++ python3 
RUN npm install bcrypt
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "start:dev"]

# Estágio de produção
FROM base AS production
# Instalar dependências de compilação
RUN apk add --no-cache make gcc g++ python3
RUN npm ci --only=production


COPY . .
EXPOSE 3000
CMD ["npm", "run", "start"]