// src/navigation/FuncionarioNavigator.tsx
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View } from "react-native";
import theme from "../theme";
import DashboardScreen from "../screens/funcionario/DashboardScreen";
import ItemsScreen from "../screens/funcionario/ItemsScreen";
import ItemDetailScreen from "../screens/funcionario/ItemDetailScreen";
import InventoryScreen from "../screens/funcionario/InventoryScreen";
import InventoryDetailScreen from "../screens/funcionario/InventoryDetailScreen";
import DistributionsScreen from "../screens/funcionario/DistributionsScreen";
import DistributionDetailScreen from "../screens/funcionario/DistributionDetailScreen";
import BeneficiariesScreen from "../screens/funcionario/BeneficiariesScreen";
import BeneficiaryDetailScreen from "../screens/funcionario/BeneficiaryDetailScreen";
import CreateItemScreen from "../screens/funcionario/CreateItemScreen";
import CreateDistributionScreen from "../screens/funcionario/CreateDistributionScreen";

// Ícones (pseudo-implementação - você precisará importar os ícones reais)
const DashboardIcon = () => (
  <View
    style={{
      width: 24,
      height: 24,
      backgroundColor: theme.colors.primary.main,
    }}
  />
);
const ItemsIcon = () => (
  <View
    style={{
      width: 24,
      height: 24,
      backgroundColor: theme.colors.primary.secondary,
    }}
  />
);
const InventoryIcon = () => (
  <View
    style={{
      width: 24,
      height: 24,
      backgroundColor: theme.colors.primary.accent,
    }}
  />
);
const DistributionsIcon = () => (
  <View
    style={{
      width: 24,
      height: 24,
      backgroundColor: theme.colors.status.success,
    }}
  />
);
const BeneficiariesIcon = () => (
  <View
    style={{ width: 24, height: 24, backgroundColor: theme.colors.status.info }}
  />
);

// Stack Navigators para cada tab
const DashboardStack = createNativeStackNavigator();
const ItemsStack = createNativeStackNavigator();
const InventoryStack = createNativeStackNavigator();
const DistributionsStack = createNativeStackNavigator();
const BeneficiariesStack = createNativeStackNavigator();

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

// Tab Navigator principal
const Tab = createBottomTabNavigator();

const FuncionarioNavigator: React.FC = () => {
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
          tabBarIcon: ({ color }) => <DashboardIcon />,
          tabBarLabel: "Dashboard",
        }}
      />
      <Tab.Screen
        name="Items"
        component={ItemsNavigator}
        options={{
          tabBarIcon: ({ color }) => <ItemsIcon />,
          tabBarLabel: "Itens",
        }}
      />
      <Tab.Screen
        name="Inventory"
        component={InventoryNavigator}
        options={{
          tabBarIcon: ({ color }) => <InventoryIcon />,
          tabBarLabel: "Estoque",
        }}
      />
      <Tab.Screen
        name="Distributions"
        component={DistributionsNavigator}
        options={{
          tabBarIcon: ({ color }) => <DistributionsIcon />,
          tabBarLabel: "Distribuições",
        }}
      />
      <Tab.Screen
        name="Beneficiaries"
        component={BeneficiariesNavigator}
        options={{
          tabBarIcon: ({ color }) => <BeneficiariesIcon />,
          tabBarLabel: "Beneficiários",
        }}
      />
    </Tab.Navigator>
  );
};

export default FuncionarioNavigator;
