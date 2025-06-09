// src/navigation/DoadorNavigator.tsx
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View } from "react-native";
import theme from "../theme";

// Tipos de navegação
import {
  DoadorTabParamList,
  DoadorDonationsStackParamList,
  DoadorNewDonationStackParamList,
  DoadorProfileStackParamList,
} from "./types";

// Substitua as implementações pseudo-ícones por estas:
import Icon from "react-native-vector-icons/Ionicons";

// Ícones reais usando react-native-vector-icons
const DonationsIcon = ({ color }: { color: string }) => (
  <Icon name="gift" size={24} color={color} />
);
const NewDonationIcon = ({ color }: { color: string }) => (
  <Icon name="add-circle" size={24} color={color} />
);
const ProfileIcon = ({ color }: { color: string }) => (
  <Icon name="person" size={24} color={color} />
);

// Telas
import MyDonationsScreen from "../screens/doador/MyDonationsScreen";
import DonationDetailScreen from "../screens/doador/DonationDetailScreen";
import NewDonationScreen from "../screens/doador/NewDonationScreen";
import ProfileScreen from "../screens/doador/ProfileScreen";
import EditProfileScreen from "../screens/doador/EditProfileScreen";
import ImpactScreen from "../screens/doador/ImpactScreen";
import DonationHistoryScreen from "../screens/doador/DonationHistoryScreen";

// Stack Navigators para cada tab
const DonationsStack =
  createNativeStackNavigator<DoadorDonationsStackParamList>();
const NewDonationStack =
  createNativeStackNavigator<DoadorNewDonationStackParamList>();
const ProfileStack = createNativeStackNavigator<DoadorProfileStackParamList>();

// Melhorar a tipagem da navegação
import {
  getFocusedRouteNameFromRoute,
  ParamListBase,
  RouteProp,
} from "@react-navigation/native";

// Stack Navigator para Minhas Doações
const DonationsNavigator = () => {
  return (
    <DonationsStack.Navigator screenOptions={{ headerShown: false }}>
      <DonationsStack.Screen
        name="MyDonationsList"
        component={MyDonationsScreen}
      />
      <DonationsStack.Screen
        name="DonationDetail"
        component={DonationDetailScreen}
      />
      <DonationsStack.Screen
        name="DonationHistory"
        component={DonationHistoryScreen}
      />
      <DonationsStack.Screen name="Impact" component={ImpactScreen} />
    </DonationsStack.Navigator>
  );
};

// Stack Navigator para Nova Doação
const NewDonationNavigator = () => {
  return (
    <NewDonationStack.Navigator screenOptions={{ headerShown: false }}>
      <NewDonationStack.Screen
        name="CreateDonation"
        component={NewDonationScreen}
      />
    </NewDonationStack.Navigator>
  );
};

// Stack Navigator para Perfil
const ProfileNavigator = () => {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
      <ProfileStack.Screen
        name="DonationHistory"
        component={DonationHistoryScreen}
      />
      <ProfileStack.Screen name="Impact" component={ImpactScreen} />
    </ProfileStack.Navigator>
  );
};

// Tab Navigator principal
const Tab = createBottomTabNavigator<DoadorTabParamList>();

// Função para ajudar com a navegação entre stacks
const getTabBarVisibility = (
  route: RouteProp<ParamListBase, string>
): boolean => {
  // O nome da rota focalizada pode ser undefined ou string
  const routeName = getFocusedRouteNameFromRoute(route) as string | undefined;

  // Ocultar a barra de tabs em telas específicas
  if (
    routeName === "DonationDetail" ||
    routeName === "Impact" ||
    routeName === "DonationHistory" ||
    routeName === "EditProfile"
  ) {
    return false;
  }
  return true;
};

const DoadorNavigator: React.FC = () => {
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
        name="MyDonations"
        component={DonationsNavigator}
        options={({ route }) => ({
          tabBarIcon: ({ color }) => <DonationsIcon color={color} />,
          tabBarLabel: "Minhas Doações",
          tabBarStyle: getTabBarVisibility(route)
            ? undefined
            : { display: "none" },
        })}
      />
      <Tab.Screen
        name="NewDonation"
        component={NewDonationNavigator}
        options={{
          tabBarIcon: ({ color }) => <NewDonationIcon color={color} />,
          tabBarLabel: "Nova Doação",
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileNavigator}
        options={({ route }) => ({
          tabBarIcon: ({ color }) => <ProfileIcon color={color} />,
          tabBarLabel: "Perfil",
          tabBarStyle: getTabBarVisibility(route)
            ? undefined
            : { display: "none" },
        })}
      />
    </Tab.Navigator>
  );
};

export default DoadorNavigator;
