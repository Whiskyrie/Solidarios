import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { Provider } from "react-redux";
import { store } from "./src/store";

// Provedores de contexto
import { AuthProvider } from "./src/hooks/useAuth";

// Navegadores - Importando o MainNavigator
import MainNavigator from "./src/navigation/MainNavigator";

// Componentes globais
import { NotificationBanner } from "./src/components/feedback/barrelFeedback";

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
  // Estado para notificações globais
  const [notification, setNotification] = useState({
    visible: false,
    type: "success" as "success" | "error" | "warning" | "info",
    message: "",
    description: "",
  });

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

  return (
    <Provider store={store}>
      <SafeAreaProvider>
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
