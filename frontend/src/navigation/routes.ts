// src/navigation/routes.ts

// Rotas para o navegador de autenticação
export const AUTH_ROUTES = {
  WELCOME: "Welcome",
  LOGIN: "Login",
  REGISTER: "Register",
  FORGOT_PASSWORD: "ForgotPassword",
};

// Rotas para o navegador de perfis
export const ROLE_ROUTES = {
  ADMIN: "Admin",
  FUNCIONARIO: "Funcionario",
  DOADOR: "Doador",
  BENEFICIARIO: "Beneficiario",
};

// Rotas para o Admin
export const ADMIN_ROUTES = {
  // Tabs
  DASHBOARD: "Dashboard",
  ITEMS: "Items",
  INVENTORY: "Inventory",
  DISTRIBUTIONS: "Distributions",
  USERS: "Users",

  // Telas internas de Dashboard
  DASHBOARD_MAIN: "DashboardMain",

  // Telas internas de Itens
  ITEMS_LIST: "ItemsList",
  ITEM_DETAIL: "ItemDetail",
  CREATE_ITEM: "CreateItem",

  // Telas internas de Inventário
  INVENTORY_LIST: "InventoryList",
  INVENTORY_DETAIL: "InventoryDetail",

  // Telas internas de Distribuições
  DISTRIBUTIONS_LIST: "DistributionsList",
  DISTRIBUTION_DETAIL: "DistributionDetail",
  CREATE_DISTRIBUTION: "CreateDistribution",

  // Telas internas de Usuários
  USERS_LIST: "UsersList",
  USER_DETAIL: "UserDetail",
  CREATE_USER: "CreateUser",
};

// Rotas para o Funcionário
export const FUNCIONARIO_ROUTES = {
  // Tabs
  DASHBOARD: "Dashboard",
  ITEMS: "Items",
  INVENTORY: "Inventory",
  DISTRIBUTIONS: "Distributions",
  BENEFICIARIES: "Beneficiaries",

  // Telas internas de Dashboard
  DASHBOARD_MAIN: "DashboardMain",

  // Telas internas de Itens
  ITEMS_LIST: "ItemsList",
  ITEM_DETAIL: "ItemDetail",
  CREATE_ITEM: "CreateItem",

  // Telas internas de Inventário
  INVENTORY_LIST: "InventoryList",
  INVENTORY_DETAIL: "InventoryDetail",

  // Telas internas de Distribuições
  DISTRIBUTIONS_LIST: "DistributionsList",
  DISTRIBUTION_DETAIL: "DistributionDetail",
  CREATE_DISTRIBUTION: "CreateDistribution",

  // Telas internas de Beneficiários
  BENEFICIARIES_LIST: "BeneficiariesList",
  BENEFICIARY_DETAIL: "BeneficiaryDetail",
};

// Rotas para o Doador
export const DOADOR_ROUTES = {
  // Tabs
  MY_DONATIONS: "MyDonations",
  NEW_DONATION: "NewDonation",
  PROFILE: "Profile",

  // Telas internas de Minhas Doações
  MY_DONATIONS_LIST: "MyDonationsList",
  DONATION_DETAIL: "DonationDetail",
  DONATION_HISTORY: "DonationHistory",
  IMPACT: "Impact",

  // Telas internas de Nova Doação
  CREATE_DONATION: "CreateDonation",

  // Telas internas de Perfil
  PROFILE_MAIN: "ProfileMain",
  EDIT_PROFILE: "EditProfile",
};

// Rotas para o Beneficiário
export const BENEFICIARIO_ROUTES = {
  // Tabs
  MY_RECEIPTS: "MyReceipts",
  AVAILABLE_ITEMS: "AvailableItems",
  PROFILE: "Profile",

  // Telas internas de Meus Recebimentos
  MY_RECEIPTS_LIST: "MyReceiptsList",
  RECEIPT_DETAIL: "ReceiptDetail",
  RECEIPT_HISTORY: "ReceiptHistory",

  // Telas internas de Itens Disponíveis
  AVAILABLE_ITEMS_LIST: "AvailableItemsList",
  ITEM_DETAIL: "ItemDetail",

  // Telas internas de Perfil
  PROFILE_MAIN: "ProfileMain",
  EDIT_PROFILE: "EditProfile",
  NEEDS_ASSESSMENT: "NeedsAssessment",
};
