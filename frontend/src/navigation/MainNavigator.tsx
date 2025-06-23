/**
 * MainNavigator - Versão otimizada sem loop infinito
 * Corrige o problema de múltiplas execuções do useEffect
 */
import React, { useEffect, useState, useRef, useCallback } from "react";
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

  // Estados locais otimizados
  const [isInitializing, setIsInitializing] = useState(true);
  const hasInitialized = useRef(false);
  const lastLoggedState = useRef<string>("");

  // Função memoizada para inicialização
  const initializeAuthState = useCallback(async () => {
    if (hasInitialized.current) {
      return;
    }

    console.log("[MainNavigator] Inicializando estado de autenticação...");

    try {
      // Verificar se há necessidade de restaurar estado
      if (!authState.accessToken && !authState.refreshToken) {
        console.log("[MainNavigator] Restaurando estado de autenticação...");
        await dispatch(restoreAuthState()).unwrap();
      }
    } catch (error) {
      console.log("[MainNavigator] Nenhum estado anterior encontrado:", error);
    } finally {
      hasInitialized.current = true;
      setIsInitializing(false);
      console.log("[MainNavigator] Inicialização completa");
    }
  }, [dispatch, authState.accessToken, authState.refreshToken]);

  // Efeito de inicialização (executa apenas uma vez)
  useEffect(() => {
    initializeAuthState();
  }, [initializeAuthState]);

  // Log inteligente - apenas quando houver mudança de estado significativa
  const currentState = {
    isAuthenticated,
    hasValidTokens: tokenStatus.hasValidTokens,
    isTokenExpired: tokenStatus.isExpired,
    timeUntilExpiry: tokenStatus.timeUntilExpiry,
  };

  const currentStateString = JSON.stringify(currentState);

  useEffect(() => {
    // Só fazer log se:
    // 1. Estamos em desenvolvimento
    // 2. O estado mudou significativamente
    // 3. Não estamos inicializando
    if (
      __DEV__ &&
      hasInitialized.current &&
      !isInitializing &&
      currentStateString !== lastLoggedState.current
    ) {
      console.log("[MainNavigator] Estado atual:", currentState);
      lastLoggedState.current = currentStateString;
    }
  }, [currentStateString, isInitializing]);

  // Efeito para monitorar inconsistências (sem logs repetitivos)
  useEffect(() => {
    if (
      hasInitialized.current &&
      !isInitializing &&
      isAuthenticated &&
      !tokenStatus.hasValidTokens
    ) {
      console.warn(
        "[MainNavigator] Inconsistência detectada: autenticado mas sem tokens válidos"
      );
    }
  }, [isAuthenticated, tokenStatus.hasValidTokens, isInitializing]);

  // Mostrar splash durante inicialização ou carregamento inicial
  if (isInitializing || (!hasInitialized.current && isLoading)) {
    return <SplashScreen />;
  }

  // Determinar qual navegador exibir
  const shouldShowAuthenticatedFlow =
    isAuthenticated && tokenStatus.hasValidTokens;

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "fade",
        animationDuration: 300,
      }}
    >
      {shouldShowAuthenticatedFlow ? (
        <Stack.Screen
          name="Role"
          component={RoleNavigator}
          options={{
            gestureEnabled: false,
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
