// src/navigation/BeneficiarioNavigator.tsx
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View } from "react-native";
import theme from "../theme";
import MyReceiptsScreen from "../screens/beneficiario/MyReceiptsScreen";
import ReceiptDetailScreen from "../screens/beneficiario/ReceiptDetailScreen";
import AvailableItemsScreen from "../screens/beneficiario/AvailableItemsScreen";
import ItemDetailScreen from "../screens/beneficiario/ItemDetailScreen";
import ProfileScreen from "../screens/beneficiario/ProfileScreen";
import EditProfileScreen from "../screens/beneficiario/EditProfileScreen";
import ReceiptHistoryScreen from "../screens/beneficiario/ReceiptHistoryScreen";
import NeedsAssessmentScreen from "../screens/beneficiario/NeedsAssessmentScreen";

// Ícones (pseudo-implementação - você precisará importar os ícones reais)
const ReceiptsIcon = () => (
  <View
    style={{
      width: 24,
      height: 24,
      backgroundColor: theme.colors.primary.secondary,
    }}
  />
);
const AvailableItemsIcon = () => (
  <View
    style={{
      width: 24,
      height: 24,
      backgroundColor: theme.colors.status.success,
    }}
  />
);
const ProfileIcon = () => (
  <View
    style={{
      width: 24,
      height: 24,
      backgroundColor: theme.colors.primary.main,
    }}
  />
);

// Stack Navigators para cada tab
const ReceiptsStack = createNativeStackNavigator();
const AvailableItemsStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

// Stack Navigator para Meus Recebimentos
const ReceiptsNavigator = () => {
  return (
    <ReceiptsStack.Navigator screenOptions={{ headerShown: false }}>
      <ReceiptsStack.Screen
        name="MyReceiptsList"
        component={MyReceiptsScreen}
      />
      <ReceiptsStack.Screen
        name="ReceiptDetail"
        component={ReceiptDetailScreen}
      />
      <ReceiptsStack.Screen
        name="ReceiptHistory"
        component={ReceiptHistoryScreen}
      />
    </ReceiptsStack.Navigator>
  );
};

// Stack Navigator para Itens Disponíveis
const AvailableItemsNavigator = () => {
  return (
    <AvailableItemsStack.Navigator screenOptions={{ headerShown: false }}>
      <AvailableItemsStack.Screen
        name="AvailableItemsList"
        component={AvailableItemsScreen}
      />
      <AvailableItemsStack.Screen
        name="ItemDetail"
        component={ItemDetailScreen}
      />
    </AvailableItemsStack.Navigator>
  );
};

// Stack Navigator para Perfil
const ProfileNavigator = () => {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
      <ProfileStack.Screen
        name="ReceiptHistory"
        component={ReceiptHistoryScreen}
      />
      <ProfileStack.Screen
        name="NeedsAssessment"
        component={NeedsAssessmentScreen}
      />
    </ProfileStack.Navigator>
  );
};

// Tab Navigator principal
const Tab = createBottomTabNavigator();

const BeneficiarioNavigator: React.FC = () => {
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
        name="MyReceipts"
        component={ReceiptsNavigator}
        options={{
          tabBarIcon: ({ color }) => <ReceiptsIcon />,
          tabBarLabel: "Meus Recebimentos",
        }}
      />
      <Tab.Screen
        name="AvailableItems"
        component={AvailableItemsNavigator}
        options={{
          tabBarIcon: ({ color }) => <AvailableItemsIcon />,
          tabBarLabel: "Itens Disponíveis",
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileNavigator}
        options={{
          tabBarIcon: ({ color }) => <ProfileIcon />,
          tabBarLabel: "Perfil",
        }}
      />
    </Tab.Navigator>
  );
};

export default BeneficiarioNavigator;
