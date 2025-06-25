// src/navigation/FuncionarioNavigator.tsx
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Platform } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import theme from "../theme";

// Importar o DashboardScreen da pasta funcionario
import DashboardScreen from "../screens/funcionario/DashboardScreen";
import ItemsListScreen from "../screens/funcionario/ItemsListScreen";
import ItemDetailScreen from "../screens/funcionario/ItemDetailScreen";
import InventoryScreen from "../screens/funcionario/InventoryScreen";
import InventoryDetailScreen from "../screens/admin/InventoryDetailScreen";
import ProfileScreen from "../screens/funcionario/ProfileScreen";
import DistributionsScreen from "../screens/admin/DistributionsScreen";
import DistributionDetailScreen from "../screens/admin/DistributionDetailScreen";
import CreateItemScreen from "../screens/admin/CreateItemScreen";
import CreateDistributionScreen from "../screens/admin/CreateDistributionScreen";
import BeneficiariesScreen from "../screens/funcionario/BeneficiariesScreen";
import BeneficiaryDetailScreen from "../screens/funcionario/BeneficiaryDetailScreen";

// Implementação real dos ícones usando react-native-vector-icons
const DashboardIcon = ({ color }: { color: string }) => (
  <Icon name="grid-outline" size={24} color={color} />
);
const ItemsIcon = ({ color }: { color: string }) => (
  <Icon name="cube-outline" size={24} color={color} />
);
const InventoryIcon = ({ color }: { color: string }) => (
  <Icon name="library-outline" size={24} color={color} />
);
const DistributionsIcon = ({ color }: { color: string }) => (
  <Icon name="car-outline" size={24} color={color} />
);
const BeneficiariesIcon = ({ color }: { color: string }) => (
  <Icon name="people-outline" size={24} color={color} />
);
// CORREÇÃO: Adicionar ícone específico para Profile
const ProfileIcon = ({ color }: { color: string }) => (
  <Icon name="person-outline" size={24} color={color} />
);

// Definição dos tipos de navegação
import {
  FuncionarioTabParamList,
  FuncionarioItemsStackParamList,
  FuncionarioInventoryStackParamList,
  FuncionarioDistributionsStackParamList,
  FuncionarioBeneficiariesStackParamList,
  FuncionarioProfileStackParamList,
} from "./types";

// Stack Navigators para cada aba
const DashboardStack = createNativeStackNavigator();
const ItemsStack = createNativeStackNavigator<FuncionarioItemsStackParamList>();
const InventoryStack = createNativeStackNavigator<FuncionarioInventoryStackParamList>();
const DistributionsStack = createNativeStackNavigator<FuncionarioDistributionsStackParamList>();
const BeneficiariesStack = createNativeStackNavigator<FuncionarioBeneficiariesStackParamList>();
// CORREÇÃO: Adicionar Stack para Profile
const ProfileStack = createNativeStackNavigator<FuncionarioProfileStackParamList>();

// Stack Navigator para Dashboard
const DashboardNavigator = () => {
  return (
    <DashboardStack.Navigator screenOptions={{ headerShown: false }}>
      <DashboardStack.Screen name="DashboardMain" component={DashboardScreen} />
    </DashboardStack.Navigator>
  );
};

// Stack Navigator para Itens
const ItemsNavigator = () => {
  return (
    <ItemsStack.Navigator screenOptions={{ headerShown: false }}>
      <ItemsStack.Screen name="ItemsList" component={ItemsListScreen} />
      <ItemsStack.Screen name="ItemDetail" component={ItemDetailScreen} />
      <ItemsStack.Screen name="CreateItem" component={CreateItemScreen} />
    </ItemsStack.Navigator>
  );
};

// Stack Navigator para Beneficiários
const BeneficiariesNavigator = () => {
  return (
    <BeneficiariesStack.Navigator screenOptions={{ headerShown: false }}>
      <BeneficiariesStack.Screen
        name="BeneficiariesList"
        component={BeneficiariesScreen}
      />
      <BeneficiariesStack.Screen
        name="BeneficiaryDetail"
        component={BeneficiaryDetailScreen}
      />
    </BeneficiariesStack.Navigator>
  );
};

// CORREÇÃO: Stack Navigator para Profile
const ProfileNavigator = () => {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
    </ProfileStack.Navigator>
  );
};

// Tab Navigator principal
const Tab = createBottomTabNavigator<FuncionarioTabParamList>();

const FuncionarioNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary.secondary,
        tabBarInactiveTintColor: theme.colors.neutral.mediumGray,
        tabBarStyle: {
          backgroundColor: theme.colors.neutral.white,
          borderTopWidth: 1,
          borderTopColor: theme.colors.neutral.lightGray,
          height: Platform.OS === "ios" ? 80 : 60,
          paddingBottom: Platform.OS === "ios" ? insets.bottom : 8,
          paddingTop: 8,
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
          marginBottom: Platform.OS === "ios" ? 0 : 4,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardNavigator}
        options={{
          tabBarIcon: ({ color }) => <DashboardIcon color={color} />,
          tabBarLabel: "Dashboard",
        }}
      />
      <Tab.Screen
        name="Items"
        component={ItemsNavigator}
        options={{
          tabBarIcon: ({ color }) => <ItemsIcon color={color} />,
          tabBarLabel: "Itens",
        }}
      />
      <Tab.Screen
        name="Beneficiaries"
        component={BeneficiariesNavigator}
        options={{
          tabBarIcon: ({ color }) => <BeneficiariesIcon color={color} />,
          tabBarLabel: "Beneficiários",
        }}
      />
      {/* CORREÇÃO: Configuração correta da tab Profile */}
      <Tab.Screen
        name="Profile"
        component={ProfileNavigator}
        options={{
          tabBarIcon: ({ color }) => <ProfileIcon color={color} />,
          tabBarLabel: "Perfil",
        }}
      />
    </Tab.Navigator>
  );
};

export default FuncionarioNavigator;
