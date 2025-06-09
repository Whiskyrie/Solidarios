import React, { useState, useEffect, useCallback } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { Provider } from "react-redux";
import { store } from "./src/store";
import * as SplashScreen from "expo-splash-screen";

// Provedores de contexto
import { AuthProvider } from "./src/hooks/useAuth";

// Navegadores - Importando o MainNavigator
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

export default function App() {
  // Estado para controlar se o app está pronto
  const [appIsReady, setAppIsReady] = useState(false);

  // Estado para notificações globais
  const [notification, setNotification] = useState({
    visible: false,
    type: "success" as "success" | "error" | "warning" | "info",
    message: "",
    description: "",
  });

  // Carregar recursos necessários
  useEffect(() => {
    async function prepare() {
      try {
        // Carregue fontes personalizadas se necessário
        // await Font.loadAsync({
        //   'custom-font': require('./assets/fonts/CustomFont.ttf'),
        // });

        // Simula um tempo de carregamento mínimo para uma transição suave
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Você pode adicionar outras operações de inicialização aqui
        // como verificar autenticação, carregar configurações, etc.
      } catch (e) {
        console.warn("Erro ao carregar recursos:", e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  // Callback para quando o layout raiz estiver pronto
  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // Isso diz ao splash screen para se esconder imediatamente
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  // Funções para gerenciar notificações
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

  // Não renderiza nada até o app estar pronto
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
            <NavigationContainer>
              <MainNavigator />
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
            </NavigationContainer>
          </NotificationContext.Provider>
        </AuthProvider>
      </SafeAreaProvider>
    </Provider>
  );
}
