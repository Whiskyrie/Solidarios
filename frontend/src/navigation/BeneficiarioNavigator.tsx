// src/navigation/BeneficiarioNavigator.tsx
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Icon from "react-native-vector-icons/Ionicons";
import theme from "../theme";
import MyReceiptsScreen from "../screens/beneficiario/MyReceiptsScreen";
import ReceiptDetailScreen from "../screens/beneficiario/ReceiptDetailScreen";
import AvailableItemsScreen from "../screens/beneficiario/AvailableItemsScreen";
import ItemDetailScreen from "../screens/beneficiario/ItemDetailScreen";
import ProfileScreen from "../screens/beneficiario/ProfileScreen";
import EditProfileScreen from "../screens/beneficiario/EditProfileScreen";
import ReceiptHistoryScreen from "../screens/beneficiario/ReceiptHistoryScreen";
import NeedsAssessmentScreen from "../screens/beneficiario/NeedsAssessmentScreen";

// Ícones reais usando react-native-vector-icons
const ReceiptsIcon = ({ color }: { color: string }) => (
  <Icon name="receipt" size={24} color={color} />
);
const AvailableItemsIcon = ({ color }: { color: string }) => (
  <Icon name="list" size={24} color={color} />
);
const ProfileIcon = ({ color }: { color: string }) => (
  <Icon name="person" size={24} color={color} />
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
          tabBarIcon: ({ color }) => <ReceiptsIcon color={color} />,
          tabBarLabel: "Meus Recebimentos",
        }}
      />
      <Tab.Screen
        name="AvailableItems"
        component={AvailableItemsNavigator}
        options={{
          tabBarIcon: ({ color }) => <AvailableItemsIcon color={color} />,
          tabBarLabel: "Itens Disponíveis",
        }}
      />
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

export default BeneficiarioNavigator;
