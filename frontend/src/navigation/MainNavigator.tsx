/**
 * MainNavigator - Navegador principal com gerenciamento inteligente de estado
 */
import React, { useEffect, useState, useRef } from "react";
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

  // Estados locais para controlar o fluxo
  const [isInitializing, setIsInitializing] = useState(true);
  const hasInitialized = useRef(false);

  // Efeito ÚNICO para restaurar estado de autenticação
  useEffect(() => {
    const initializeAuthState = async () => {
      // Se já inicializou, não fazer nada
      if (hasInitialized.current) {
        return;
      }

      console.log("[MainNavigator] Inicializando estado de autenticação...");

      try {
        // Se não há tokens no estado Redux, tentar restaurar
        if (!authState.accessToken && !authState.refreshToken) {
          console.log("[MainNavigator] Restaurando estado de autenticação...");
          await dispatch(restoreAuthState()).unwrap();
        }
      } catch (error) {
        console.log(
          "[MainNavigator] Nenhum estado anterior encontrado:",
          error
        );
      } finally {
        hasInitialized.current = true;
        setIsInitializing(false);
        console.log("[MainNavigator] Inicialização completa");
      }
    };

    initializeAuthState();
  }, []); // Dependências vazias - executar apenas uma vez

  // Efeito separado para monitorar status do token (sem causar loop)
  useEffect(() => {
    if (isAuthenticated && !tokenStatus.hasValidTokens) {
      console.log(
        "[MainNavigator] Token inválido detectado, pode ser necessário reautenticar"
      );
    }
  }, [isAuthenticated, tokenStatus.hasValidTokens]);

  // Mostrar splash durante inicialização
  if (isInitializing || (!hasInitialized.current && isLoading)) {
    return <SplashScreen />;
  }

  // Log para debug (apenas quando necessário)
  if (__DEV__ && hasInitialized.current) {
    console.log("[MainNavigator] Estado atual:", {
      isAuthenticated,
      hasValidTokens: tokenStatus.hasValidTokens,
      isTokenExpired: tokenStatus.isExpired,
      timeUntilExpiry: tokenStatus.timeUntilExpiry,
    });
  }

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
