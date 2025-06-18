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

// Provedores de contexto
import { AuthProvider } from "./src/hooks/useAuth";
import { AuthListener } from "./src/utils/authListener";

// Sistema de autenticação
import { initializeAuth } from "./src/utils/authInit";
import { restoreAuthState } from "./src/store/slices/authSlice";
import { configureTokenManager } from "./src/utils/tokenManager";

// Navegadores
import MainNavigator from "./src/navigation/MainNavigator";

// Componentes globais
import { NotificationBanner } from "./src/components/feedback/barrelFeedback";

// Manter a splash screen visível enquanto carregamos recursos
SplashScreen.preventAutoHideAsync();

// Sistema de notificações global
export const NotificationContext = React.createContext({
  showNotification: (_: {
    type: "success" | "error" | "warning" | "info";
    message: string;
    description?: string;
  }) => {},
  hideNotification: () => {},
});

/**
 * Componente interno que contém a navegação e o AuthListener
 * Necessário para garantir que o AuthListener tenha acesso ao NavigationContainer
 */
const AppContent: React.FC = () => {
  return (
    <NavigationContainer>
      <AuthListener>
        <MainNavigator />
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

  // Carregar recursos e inicializar sistema de autenticação
  useEffect(() => {
    async function prepare() {
      try {
        console.log("[App] Iniciando preparação da aplicação...");

        // 1. Configurar token manager
        console.log("[App] Configurando token manager...");
        configureTokenManager({
          renewalTimeBeforeExpiry: 5, // 5 minutos antes da expiração
          enableDebugLogs: __DEV__,
          maxRetryAttempts: 3,
          retryDelay: 1000,
        });

        // 2. Inicializar sistema de autenticação
        console.log("[App] Inicializando sistema de autenticação...");
        const authInitialized = await initializeAuth({
          renewalTimeBeforeExpiry: 5,
          enableDebugLogs: __DEV__,
          loginRouteName: "Login",
          tokenCheckInterval: 30, // Verificar tokens a cada 30 minutos
        });

        if (authInitialized) {
          console.log(
            "[App] Sistema de autenticação inicializado - usuário possivelmente autenticado"
          );
        } else {
          console.log(
            "[App] Sistema de autenticação inicializado - usuário não autenticado"
          );
        }

        // 3. Restaurar estado de autenticação no Redux
        console.log("[App] Restaurando estado de autenticação no Redux...");
        store.dispatch(restoreAuthState());

        // 4. Aguardar um pouco para transição suave
        await new Promise((resolve) => setTimeout(resolve, 1000));

        console.log("[App] Inicialização completa com sucesso");
      } catch (error) {
        console.error("[App] Erro durante inicialização:", error);
        console.log("[App] Continuando inicialização apesar do erro");
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      console.log("[App] Layout pronto, escondendo splash screen");
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
      <SafeAreaProvider onLayout={onLayoutRootView}>
        <StatusBar style="auto" />
        <AuthProvider>
          <NotificationContext.Provider
            value={{ showNotification, hideNotification }}
          >
            <AppContent />
            <NotificationBanner
              visible={notification.visible}
              type={notification.type}
              message={notification.message}
              description={notification.description}
              onClose={hideNotification}
              position="top"
              autoClose
              duration={3000}
            />
          </NotificationContext.Provider>
        </AuthProvider>
      </SafeAreaProvider>
    </Provider>
  );
}
