// src/navigation/types.ts
import { NavigatorScreenParams } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { BENEFICIARIO_ROUTES, DOADOR_ROUTES, ADMIN_ROUTES } from "./routes";

// Tipos para AuthNavigator
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type AuthScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

// Tipos para AdminNavigator - Tabs
export type AdminTabParamList = {
  Dashboard: undefined;
  Items: NavigatorScreenParams<AdminItemsStackParamList>;
  Inventory: NavigatorScreenParams<AdminInventoryStackParamList>;
  Distributions: NavigatorScreenParams<AdminDistributionsStackParamList>;
  Users: NavigatorScreenParams<AdminUsersStackParamList>;
};

export type AdminTabScreenProps<T extends keyof AdminTabParamList> =
  BottomTabScreenProps<AdminTabParamList, T>;

// Tipos para AdminNavigator - Items Stack
export type AdminItemsStackParamList = {
  ItemsList: undefined;
  ItemDetail: { id: string };
  CreateItem: { id?: string; isEditing?: boolean } | undefined;
};

export type AdminItemsScreenProps<T extends keyof AdminItemsStackParamList> =
  NativeStackScreenProps<AdminItemsStackParamList, T>;

// Tipos para AdminNavigator - Inventory Stack
export type AdminInventoryStackParamList = {
  InventoryList: undefined;
  InventoryDetail: { id: string };
};

export type AdminInventoryScreenProps<
  T extends keyof AdminInventoryStackParamList
> = NativeStackScreenProps<AdminInventoryStackParamList, T>;

// Tipos para AdminNavigator - Distributions Stack
export type AdminDistributionsStackParamList = {
  DistributionsList: undefined;
  DistributionDetail: { id: string };
  CreateDistribution: undefined;
};

export type AdminDistributionsScreenProps<
  T extends keyof AdminDistributionsStackParamList
> = NativeStackScreenProps<AdminDistributionsStackParamList, T>;

// Tipos para AdminNavigator - Users Stack
export type AdminUsersStackParamList = {
  UsersList: undefined;
  UserDetail: { id: string };
  CreateUser: undefined;
};

export type AdminUsersScreenProps<T extends keyof AdminUsersStackParamList> =
  NativeStackScreenProps<AdminUsersStackParamList, T>;

// Tipos para FuncionarioNavigator - Tabs
export type FuncionarioTabParamList = {
  Dashboard: undefined;
  Items: NavigatorScreenParams<FuncionarioItemsStackParamList>;
  Inventory: NavigatorScreenParams<FuncionarioInventoryStackParamList>;
  Distributions: NavigatorScreenParams<FuncionarioDistributionsStackParamList>;
  Beneficiaries: NavigatorScreenParams<FuncionarioBeneficiariesStackParamList>;
};

export type FuncionarioTabScreenProps<T extends keyof FuncionarioTabParamList> =
  BottomTabScreenProps<FuncionarioTabParamList, T>;

// Tipos para FuncionarioNavigator - Stacks
export type FuncionarioItemsStackParamList = {
  ItemsList: undefined;
  ItemDetail: { id: string };
  CreateItem: undefined;
};

export type FuncionarioInventoryStackParamList = {
  InventoryList: undefined;
  InventoryDetail: { id: string };
};

export type FuncionarioDistributionsStackParamList = {
  DistributionsList: undefined;
  DistributionDetail: { id: string };
  CreateDistribution: undefined;
};

export type FuncionarioBeneficiariesStackParamList = {
  BeneficiariesList: undefined;
  BeneficiaryDetail: { id: string };
};

// Tipos para DoadorNavigator - Tabs
export type DoadorTabParamList = {
  MyDonations: NavigatorScreenParams<DoadorDonationsStackParamList>;
  NewDonation: NavigatorScreenParams<DoadorNewDonationStackParamList>;
  Profile: NavigatorScreenParams<DoadorProfileStackParamList>;
};

export type DoadorTabScreenProps<T extends keyof DoadorTabParamList> =
  BottomTabScreenProps<DoadorTabParamList, T>;

// Tipos para DoadorNavigator - Stacks
export type DoadorDonationsStackParamList = {
  MyDonationsList: undefined;
  DonationDetail: { id: string };
  DonationHistory: undefined;
  Impact: undefined;
};

export type DoadorNewDonationStackParamList = {
  CreateDonation: undefined;
};

export type DoadorProfileStackParamList = {
  ProfileMain: undefined;
  EditProfile: undefined;
  DonationHistory: undefined;
  Impact: undefined;
};

// Tipos para BeneficiarioNavigator - Tabs
export type BeneficiarioTabParamList = {
  MyReceipts: NavigatorScreenParams<BeneficiarioReceiptsStackParamList>;
  AvailableItems: NavigatorScreenParams<BeneficiarioItemsStackParamList>;
  Profile: NavigatorScreenParams<BeneficiarioProfileStackParamList>;
};

export type BeneficiarioTabScreenProps<
  T extends keyof BeneficiarioTabParamList
> = BottomTabScreenProps<BeneficiarioTabParamList, T>;

// Tipos para BeneficiarioNavigator - Stacks
export type BeneficiarioReceiptsStackParamList = {
  MyReceiptsList: undefined;
  ReceiptDetail: { id: string };
  ReceiptHistory: undefined;
};

export type BeneficiarioItemsStackParamList = {
  AvailableItemsList: undefined;
  ItemDetail: { id: string };
};

export type BeneficiarioProfileStackParamList = {
  ProfileMain: undefined;
  EditProfile: undefined;
  ReceiptHistory: undefined;
  NeedsAssessment: undefined;
};

// Parâmetros para as rotas de Beneficiário
export type BeneficiarioStackParamList = {
  [BENEFICIARIO_ROUTES.AVAILABLE_ITEMS]: undefined;
  [BENEFICIARIO_ROUTES.ITEM_DETAIL]: { id: string };
  [BENEFICIARIO_ROUTES.MY_RECEIPTS]: undefined;
  [BENEFICIARIO_ROUTES.RECEIPT_DETAIL]: { id: string };
  [BENEFICIARIO_ROUTES.PROFILE]: undefined;
  [BENEFICIARIO_ROUTES.EDIT_PROFILE]: undefined;
  [BENEFICIARIO_ROUTES.NEEDS_ASSESSMENT]: undefined;
};

// Parâmetros para as rotas de Doador
export type DoadorStackParamList = {
  [DOADOR_ROUTES.MY_DONATIONS]: undefined;
  [DOADOR_ROUTES.NEW_DONATION]: undefined;
  [DOADOR_ROUTES.DONATION_DETAIL]: { id: string };
  [DOADOR_ROUTES.PROFILE]: undefined;
  [DOADOR_ROUTES.EDIT_PROFILE]: undefined;
  [DOADOR_ROUTES.DONATION_HISTORY]: undefined;
  [DOADOR_ROUTES.IMPACT]: undefined;
};
