// src/navigation/FuncionarioNavigator.tsx
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Icon from "react-native-vector-icons/Ionicons";
import theme from "../theme";
import DashboardScreen from "../screens/admin/DashboardScreen";
import ItemsScreen from "../screens/admin/ItemsScreen";
import ItemDetailScreen from "../screens/admin/ItemDetailScreen";
import InventoryScreen from "../screens/admin/InventoryScreen";
import InventoryDetailScreen from "../screens/admin/InventoryDetailScreen";
import DistributionsScreen from "../screens/admin/DistributionsScreen";
import DistributionDetailScreen from "../screens/admin/DistributionDetailScreen";
import CreateItemScreen from "../screens/admin/CreateItemScreen";
import CreateDistributionScreen from "../screens/admin/CreateDistributionScreen";
import BeneficiariesScreen from "../screens/funcionario/BeneficiariesScreen";
import BeneficiaryDetailScreen from "../screens/funcionario/BeneficiaryDetailScreen";

// Implementação real dos ícones usando react-native-vector-icons
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
const BeneficiariesIcon = ({ color }: { color: string }) => (
  <Icon name="people" size={24} color={color} />
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
        name="Beneficiaries"
        component={BeneficiariesNavigator}
        options={{
          tabBarIcon: ({ color }) => <BeneficiariesIcon color={color} />,
          tabBarLabel: "Beneficiários",
        }}
      />
    </Tab.Navigator>
  );
};

export default FuncionarioNavigator;
