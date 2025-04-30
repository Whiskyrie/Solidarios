# Estágio base
FROM node:18-alpine AS base
WORKDIR /usr/src/app
COPY package*.json ./

# Estágio de desenvolvimento
FROM base AS development
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "start:dev"]

# Estágio de produção
FROM base AS production
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "run", "start"]