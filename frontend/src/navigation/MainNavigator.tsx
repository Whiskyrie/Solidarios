// src/navigation/MainNavigator.tsx
import React, { useEffect } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../hooks/useAuth";
import { ActivityIndicator, View } from "react-native";

// Navegadores
import AuthNavigator from "./AuthNavigator";
import RoleNavigator from "./RoleNavigator";
import SplashScreen from "../screens/auth/SplashScreen";

// Definição de rotas
export type MainStackParamList = {
  Auth: undefined;
  Role: undefined;
  Splash: undefined;
};

const Stack = createNativeStackNavigator<MainStackParamList>();

const MainNavigator: React.FC = () => {
  const { isAuthenticated, isLoading, getProfile } = useAuth();

  // Carregar perfil do usuário ao iniciar, mas somente uma vez
  useEffect(() => {
    if (!isLoading) {
      // Evita chamadas repetidas para getProfile
      // O hook useAuth já deve tentar obter o perfil na inicialização
    }
  }, []);

  // Se ainda estiver carregando, mostre a tela de splash
  if (isLoading) {
    return <SplashScreen />;
  }

  // Depois que o carregamento terminar, use o navegador adequado
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "fade",
      }}
    >
      {isAuthenticated ? (
        <Stack.Screen name="Role" component={RoleNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default MainNavigator;
