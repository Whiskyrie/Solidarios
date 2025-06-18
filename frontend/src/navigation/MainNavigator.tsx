/**
 * MainNavigator - Navegador principal com gerenciamento inteligente de estado
 */
import React, { useEffect, useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../hooks/useAuth";
import { useAppDispatch, useAppSelector } from "../store";
import { restoreAuthState } from "../store/slices/authSlice";

// Navegadores
import AuthNavigator from "./AuthNavigator";
import RoleNavigator from "./RoleNavigator";
import SplashScreen from "../screens/auth/SplashScreen";

export type MainStackParamList = {
  Auth: undefined;
  Role: undefined;
  Splash: undefined;
};

const Stack = createNativeStackNavigator<MainStackParamList>();

const MainNavigator: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading, tokenStatus } = useAuth();
  const authState = useAppSelector((state) => state.auth);

  // Estado local para controlar se já tentou restaurar
  const [hasTriedRestore, setHasTriedRestore] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Efeito para restaurar estado de autenticação
  useEffect(() => {
    const initializeAuthState = async () => {
      // Se já tentou restaurar ou está carregando, não fazer nada
      if (hasTriedRestore || isLoading) {
        return;
      }

      // Se não há tokens no estado Redux, tentar restaurar
      if (!authState.accessToken && !authState.refreshToken) {
        console.log(
          "[MainNavigator] Tentando restaurar estado de autenticação..."
        );

        try {
          await dispatch(restoreAuthState()).unwrap();
          console.log("[MainNavigator] Estado restaurado com sucesso");
        } catch (error) {
          console.log(
            "[MainNavigator] Nenhum estado anterior encontrado:",
            error
          );
        }
      }

      setHasTriedRestore(true);
      setIsInitializing(false);
    };

    initializeAuthState();
  }, [
    dispatch,
    authState.accessToken,
    authState.refreshToken,
    hasTriedRestore,
    isLoading,
  ]);

  // Efeito para monitorar status do token
  useEffect(() => {
    if (isAuthenticated && !tokenStatus.hasValidTokens) {
      console.log(
        "[MainNavigator] Token inválido detectado, pode ser necessário reautenticar"
      );
    }
  }, [isAuthenticated, tokenStatus.hasValidTokens]);

  // Mostrar splash durante inicialização ou carregamento
  if (isInitializing || isLoading || !hasTriedRestore) {
    return <SplashScreen />;
  }

  // Log para debug
  console.log("[MainNavigator] Estado atual:", {
    isAuthenticated,
    hasValidTokens: tokenStatus.hasValidTokens,
    isTokenExpired: tokenStatus.isExpired,
    timeUntilExpiry: tokenStatus.timeUntilExpiry,
  });

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "fade",
        animationDuration: 300,
      }}
    >
      {isAuthenticated && tokenStatus.hasValidTokens ? (
        <Stack.Screen
          name="Role"
          component={RoleNavigator}
          options={{
            gestureEnabled: false, // Evitar voltar para auth por gesture
          }}
        />
      ) : (
        <Stack.Screen
          name="Auth"
          component={AuthNavigator}
          options={{
            gestureEnabled: false,
          }}
        />
      )}
    </Stack.Navigator>
  );
};

export default MainNavigator;
