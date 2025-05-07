// src/navigation/AdminNavigator.tsx
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import theme from "../theme";

// Tipos de navegação
import {
  AdminTabParamList,
  AdminItemsStackParamList,
  AdminInventoryStackParamList,
  AdminDistributionsStackParamList,
  AdminUsersStackParamList,
} from "./types";
// Ícones (usando react-native-vector-icons)
import Icon from "react-native-vector-icons/Ionicons";

const DashboardIcon = ({ color }: { color: string }) => (
  <Icon name="speedometer" size={24} color={color} />
);
const ItemsIcon = ({ color }: { color: string }) => (
  <Icon name="list" size={24} color={color} />
);
const InventoryIcon = ({ color }: { color: string }) => (
  <Icon name="cube" size={24} color={color} />
);
const DistributionsIcon = ({ color }: { color: string }) => (
  <Icon name="car" size={24} color={color} />
);
const UsersIcon = ({ color }: { color: string }) => (
  <Icon name="people" size={24} color={color} />
);

// Telas
import DashboardScreen from "../screens/admin/DashboardScreen";
import ItemsScreen from "../screens/admin/ItemsScreen";
import ItemDetailScreen from "../screens/admin/ItemDetailScreen";
import InventoryScreen from "../screens/admin/InventoryScreen";
import InventoryDetailScreen from "../screens/admin/InventoryDetailScreen";
import DistributionsScreen from "../screens/admin/DistributionsScreen";
import DistributionDetailScreen from "../screens/admin/DistributionDetailScreen";
import UsersScreen from "../screens/admin/UsersScreen";
import UserDetailScreen from "../screens/admin/UserDetailScreen";
import CreateUserScreen from "../screens/admin/CreateUserScreen";
import CreateItemScreen from "../screens/admin/CreateItemScreen";
import CreateDistributionScreen from "../screens/admin/CreateDistributionScreen";

// Stack Navigators para cada tab
const DashboardStack = createNativeStackNavigator();
const ItemsStack = createNativeStackNavigator<AdminItemsStackParamList>();
const InventoryStack =
  createNativeStackNavigator<AdminInventoryStackParamList>();
const DistributionsStack =
  createNativeStackNavigator<AdminDistributionsStackParamList>();
const UsersStack = createNativeStackNavigator<AdminUsersStackParamList>();

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
      <ItemsStack.Screen name="ItemsList" component={ItemsScreen} />
      <ItemsStack.Screen name="ItemDetail" component={ItemDetailScreen} />
      <ItemsStack.Screen name="CreateItem" component={CreateItemScreen} />
    </ItemsStack.Navigator>
  );
};

// Stack Navigator para Inventário
const InventoryNavigator = () => {
  return (
    <InventoryStack.Navigator screenOptions={{ headerShown: false }}>
      <InventoryStack.Screen name="InventoryList" component={InventoryScreen} />
      <InventoryStack.Screen
        name="InventoryDetail"
        component={InventoryDetailScreen}
      />
    </InventoryStack.Navigator>
  );
};

// Stack Navigator para Distribuições
const DistributionsNavigator = () => {
  return (
    <DistributionsStack.Navigator screenOptions={{ headerShown: false }}>
      <DistributionsStack.Screen
        name="DistributionsList"
        component={DistributionsScreen}
      />
      <DistributionsStack.Screen
        name="DistributionDetail"
        component={DistributionDetailScreen}
      />
      <DistributionsStack.Screen
        name="CreateDistribution"
        component={CreateDistributionScreen}
      />
    </DistributionsStack.Navigator>
  );
};

// Stack Navigator para Usuários
const UsersNavigator = () => {
  return (
    <UsersStack.Navigator screenOptions={{ headerShown: false }}>
      <UsersStack.Screen name="UsersList" component={UsersScreen} />
      <UsersStack.Screen name="UserDetail" component={UserDetailScreen} />
      <UsersStack.Screen name="CreateUser" component={CreateUserScreen} />
    </UsersStack.Navigator>
  );
};

// Tab Navigator principal
const Tab = createBottomTabNavigator<AdminTabParamList>();

const AdminNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary.secondary,
        tabBarInactiveTintColor: theme.colors.neutral.darkGray,
        tabBarStyle: {
          backgroundColor: theme.colors.neutral.white,
          borderTopWidth: 1,
          borderTopColor: theme.colors.neutral.mediumGray,
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
        name="Inventory"
        component={InventoryNavigator}
        options={{
          tabBarIcon: ({ color }) => <InventoryIcon color={color} />,
          tabBarLabel: "Estoque",
        }}
      />
      <Tab.Screen
        name="Distributions"
        component={DistributionsNavigator}
        options={{
          tabBarIcon: ({ color }) => <DistributionsIcon color={color} />,
          tabBarLabel: "Distribuições",
        }}
      />
      <Tab.Screen
        name="Users"
        component={UsersNavigator}
        options={{
          tabBarIcon: ({ color }) => <UsersIcon color={color} />,
          tabBarLabel: "Usuários",
        }}
      />
    </Tab.Navigator>
  );
};

export default AdminNavigator;
