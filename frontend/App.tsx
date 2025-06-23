/**
 * App.tsx - Aplicação principal com sistema de autenticação integrado
 * CORRIGIDO: AuthListener agora está dentro do NavigationContainer
 */
import React, { useState, useEffect, useCallback } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { Provider } from "react-redux";
import { store } from "./src/store";
import * as SplashScreen from "expo-splash-screen";

// Componentes e navegação
import { AuthProvider } from "./src/hooks/useAuth";
import { AuthListener } from "./src/utils/authListener";
import { AuthInitializer } from "./src/components/common/AuthInitializer";
import MainNavigator from "./src/navigation/MainNavigator";
import { NotificationBanner } from "./src/components/feedback/barrelFeedback";

// Configuração do token manager
import { configureTokenManager } from "./src/utils/tokenManager";

// Manter a splash screen visível enquanto carregamos recursos
SplashScreen.preventAutoHideAsync();

// Sistema de notificações global
export const NotificationContext = React.createContext<{
  showNotification: (params: {
    type: "success" | "error" | "warning" | "info";
    message: string;
    description?: string;
  }) => void;
  hideNotification: () => void;
}>({
  showNotification: () => {},
  hideNotification: () => {},
});

const AppContent: React.FC = () => {
  return (
    <NavigationContainer>
      <AuthListener>
        <AuthInitializer>
          <MainNavigator />
        </AuthInitializer>
      </AuthListener>
    </NavigationContainer>
  );
};

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [notification, setNotification] = useState({
    visible: false,
    type: "success" as "success" | "error" | "warning" | "info",
    message: "",
    description: "",
  });

  useEffect(() => {
    async function prepare() {
      try {
        console.log("[App] Configurando sistema base...");

        // Configurar apenas o token manager, não inicializar auth aqui
        configureTokenManager({
          renewalTimeBeforeExpiry: 5,
          enableDebugLogs: __DEV__,
          maxRetryAttempts: 3,
          retryDelay: 1000,
        });

        // Aguardar um pouco para dar tempo das configurações
        await new Promise((resolve) => setTimeout(resolve, 500));

        console.log("[App] Configuração básica completa");
      } catch (error) {
        console.error("[App] Erro durante configuração:", error);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  const showNotification = ({
    type,
    message,
    description = "",
  }: {
    type: "success" | "error" | "warning" | "info";
    message: string;
    description?: string;
  }) => {
    setNotification({
      visible: true,
      type,
      message,
      description,
    });
  };

  const hideNotification = () => {
    setNotification((prev) => ({ ...prev, visible: false }));
  };

  // Não renderizar nada até o app estar pronto
  if (!appIsReady) {
    return null;
  }

  return (
    <Provider store={store}>
      <AuthProvider>
        <SafeAreaProvider onLayout={onLayoutRootView}>
          <NotificationContext.Provider
            value={{ showNotification, hideNotification }}
          >
            <StatusBar style="auto" />
            <AppContent />
            <NotificationBanner
              visible={notification.visible}
              type={notification.type}
              message={notification.message}
              description={notification.description}
              onClose={hideNotification}
            />
          </NotificationContext.Provider>
        </SafeAreaProvider>
      </AuthProvider>
    </Provider>
  );
}
