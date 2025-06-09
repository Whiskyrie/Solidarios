# Projeto Solidários - Sistema de Gestão de Doações

<div align="center">
  <img src="frontend/assets/favicon.svg" alt="Logo Solidários" width="50" />
  <h3>📦 Conectando doadores e beneficiários de forma eficiente 📦</h3>
</div>

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Requisitos](#-requisitos)
- [Instalação e Configuração](#-instalação-e-configuração)
- [Executando o Projeto](#-executando-o-projeto)
- [Funcionalidades Principais](#-funcionalidades-principais)
- [Arquitetura](#-arquitetura)
- [API Documentation](#-api-documentation)
- [Contribuição](#-contribuição)
- [Licença](#-licença)

## 🔍 Sobre o Projeto

O Sistema Solidários é uma plataforma completa para gerenciamento de doações, projetada para conectar doadores e beneficiários de forma eficiente. A aplicação permite o cadastro de itens para doação, controle de estoque, e distribuição dos itens aos beneficiários.

### Principais características:

- Sistema de gerenciamento completo para doações
- Controle de inventário e rastreamento de itens
- Gestão de usuários com diferentes perfis e permissões
- Registro e acompanhamento das distribuições
- Interface amigável e responsiva

## 🛠 Tecnologias Utilizadas

<div align="center">
  <table>
    <tr>
      <th>Backend</th>
      <th>Frontend</th>
      <th>DevOps/Ferramentas</th>
    </tr>
    <tr>
      <td>
        <img src="https://nestjs.com/img/logo-small.svg" height="30" /><br />
        <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original.svg" height="30" /><br />
        <img src="https://www.postgresql.org/media/img/about/press/elephant.png" height="30" /><br />
        <img src="https://raw.githubusercontent.com/typeorm/typeorm/master/resources/logo_big.png" height="30" /><br />
        <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg" height="30" />
        <br />
        <img src ="https://cdn.worldvectorlogo.com/logos/jwt-3.svg" height="30"/><br />
        <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/swagger/swagger-original.svg" height="30" /><br />
      </td>
      <td>
        <img src="https://d33wubrfki0l68.cloudfront.net/554c3b0e09cf167f0281fda839a5433f2040b349/ecfc9/img/header_logo.svg" height="30" /><br />
        <img src="https://www.svgrepo.com/show/373591/expo.svg" height="30" /><br />
        <img src="https://www.svgrepo.com/show/452093/redux.svg" height="30" /><br />
        <img src="https://static-00.iconduck.com/assets.00/formik-icon-512x512-se1fegy1.png" height="30" /><br />
        <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/axios/axios-plain.svg" height="30" /><br />
        <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/reactnavigation/reactnavigation-original.svg" height="30" /><br />
        <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg" height="30" /><br />
      </td>
      <td>
        <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/docker/docker-original-wordmark.svg" height="30" /><br />
        <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/git/git-original.svg" height="30" /><br />
        <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/eslint/eslint-original.svg" height="30"/><br />
        <img src="https://www.svgrepo.com/show/354208/prettier.svg" height="30"/><br />
        <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/jest/jest-plain.svg" height="30" /><br />
        <img src="https://www.svgrepo.com/show/331509/npm.svg" height="30" /><br />
        <img src="https://www.svgrepo.com/show/475654/github-color.svg" height="30" /><br />
      </td>
    </tr>
  </table>
</div>

## 📁 Estrutura do Projeto

O projeto está organizado em duas partes principais:

### Backend (pasta `/backend`)

```
backend/
├── dist/                  # Código compilado
├── node_modules/          # Dependências
├── src/
│   ├── common/            # Componentes compartilhados
│   │   ├── config/        # Configurações globais
│   │   ├── filters/       # Filtros globais de exceções
│   │   ├── interceptors/  # Interceptors
│   │   ├── middleware/    # Middlewares
│   │   ├── pagination/    # DTOs para paginação
│   │   └── validators/    # Validadores personalizados
│   ├── modules/           # Módulos da aplicação
│   │   ├── auth/          # Autenticação e autorização
│   │   ├── categories/    # Gerenciamento de categorias
│   │   ├── distributions/ # Distribuições de itens
│   │   ├── inventory/     # Controle de estoque
│   │   ├── items/         # Itens para doação
│   │   └── users/         # Gerenciamento de usuários
│   ├── app.controller.ts  # Controller principal
│   ├── app.module.ts      # Módulo principal
│   ├── app.service.ts     # Serviço principal
│   └── main.ts            # Ponto de entrada da aplicação
├── .dockerignore          # Arquivos ignorados pelo Docker
├── .env                   # Variáveis de ambiente (não incluir no git)
├── .eslintrc.js           # Configuração do ESLint
├── .gitignore             # Arquivos ignorados pelo Git
├── .prettierrc            # Configuração do Prettier
├── docker-compose.yml     # Configuração do Docker Compose
├── Dockerfile             # Configuração do Docker
├── nest-cli.json          # Configuração do CLI do NestJS
├── package.json           # Dependências e scripts
├── tsconfig.build.json    # Configuração do TypeScript para build
└── tsconfig.json          # Configuração geral do TypeScript
```

### Frontend (pasta `/frontend`)

```
frontend/
├── assets/                # Imagens, fontes e outros recursos
├── node_modules/          # Dependências
├── src/
│   ├── api/               # Serviços de comunicação com API
│   ├── components/        # Componentes reutilizáveis
│   │   ├── cards/         # Componentes de cards
│   │   ├── common/        # Componentes base (Button, Typography, etc)
│   │   ├── feedback/      # Notificações, alertas, etc
│   │   └── forms/         # Componentes de formulário
│   ├── hooks/             # Custom hooks
│   ├── navigation/        # Configuração de navegação
│   │   ├── AuthNavigator  # Navegação para autenticação
│   │   ├── MainNavigator  # Navegação principal
│   │   └── RoleNavigator  # Navegação baseada em perfil
│   ├── screens/           # Telas da aplicação
│   ├── store/             # Estado global com Redux
│   │   └── slices/        # Slices do Redux Toolkit
│   ├── theme/             # Temas da aplicação (cores, espaçamentos)
│   ├── types/             # Definições de tipos TypeScript
│   └── utils/             # Funções utilitárias
├── App.tsx                # Componente principal
├── app.json               # Configuração do Expo
├── babel.config.js        # Configuração do Babel
├── index.ts               # Ponto de entrada
├── package.json           # Dependências e scripts
└── tsconfig.json          # Configuração do TypeScript
```

## 📋 Requisitos

- Node.js (v18 ou superior)
- npm ou yarn
- Docker e Docker Compose (para desenvolvimento local com banco de dados)
- Expo CLI (para desenvolvimento Frontend)

## 🔧 Instalação e Configuração

### Clonando o repositório

```bash
git clone https://github.com/seu-usuario/solidarios.git
cd solidarios
```

### Backend

1. Navegue até a pasta do backend:

```bash
cd backend
```

2. Instale as dependências:

```bash
npm install
```

3. Configure as variáveis de ambiente:

```bash
cp .env.example .env
```

4. Edite o arquivo `.env` com suas configurações:

```
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=******
DB_DATABASE=solidarios_db

# JWT
JWT_SECRET=seu_segredo_jwt_aqui
JWT_EXPIRATION_TIME=15m
REFRESH_TOKEN_EXPIRATION_DAYS=7

# App
PORT=3000
```

5. Inicie o Docker com o banco de dados PostgreSQL:

```bash
docker-compose up -d
```

### Frontend

1. Navegue até a pasta do frontend:

```bash
cd ../frontend
```

2. Instale as dependências:

```bash
npm install
```

## 🚀 Executando o Projeto

### Backend

1. A partir da pasta `backend`:

```bash
# Desenvolvimento
npm run start:dev

# Produção
npm run build
npm run start:prod
```

O servidor estará disponível em `http://localhost:3000`.

### Frontend

1. A partir da pasta `frontend`:

```bash
# Inicia o Expo
npm start

# Iniciar diretamente para dispositivos específicos
npm run android
npm run ios
npm run web
```

Siga as instruções no terminal para rodar em um emulador ou dispositivo físico.

## 🧩 Funcionalidades Principais

- **Autenticação e Autorização**
  - Registro e login de usuários
  - Perfis de usuário: Admin, Funcionário, Doador e Beneficiário
  - JWT para autenticação segura

- **Gerenciamento de Itens**
  - Cadastro de itens para doação
  - Categorização e classificação
  - Upload de fotos

- **Controle de Inventário**
  - Rastreamento de estoque
  - Alertas de nível baixo
  - Localização de itens

- **Distribuições**
  - Registro de distribuições para beneficiários
  - Histórico de distribuições
  - Estatísticas e relatórios

- **Dashboard e Relatórios**
  - Visualização de estatísticas
  - Gráficos de desempenho
  - Exportação de dados

## 🏗 Arquitetura

### Backend

O backend segue uma arquitetura modular baseada no framework NestJS, implementando princípios SOLID e Clean Architecture:

- **Controllers**: Responsáveis por receber as requisições HTTP e retornar respostas.
- **Services**: Contêm a lógica de negócio e orquestram operações.
- **Entities**: Representam as tabelas do banco de dados e suas relações.
- **DTOs**: Objetos para transferência de dados entre camadas.
- **Repositories**: Abstraem a comunicação com o banco de dados via TypeORM.
- **Guards/Interceptors**: Implementam segurança e transformação de dados.

### Frontend

O frontend utiliza uma arquitetura baseada em componentes com React Native e Expo:

- **Componentes**: Blocos de construção reutilizáveis da interface.
- **Hooks**: Lógica reutilizável para componentes funcionais.
- **Store**: Gerenciamento de estado global via Redux Toolkit.
- **Services**: Comunicação com a API backend.
- **Navigation**: Fluxo de navegação baseado em perfil de usuário.

## 📑 API Documentation

A documentação da API está disponível através do Swagger após iniciar o servidor backend:

http://localhost:3000/api

## 👥 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Faça commit das suas alterações (`git commit -m 'Adiciona nova feature'`)
4. Faça push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

<div align="center">
  <p>Desenvolvido com ❤️ para conectar pessoas e fazer a diferença</p>
</div>