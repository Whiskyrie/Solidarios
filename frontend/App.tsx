import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { Provider } from "react-redux";
import { store } from "./src/store";

// Provedores de contexto
import { AuthProvider, useAuth } from "./src/hooks/useAuth";

// Navegadores
import AuthNavigator from "./src/navigation/AuthNavigator";
import AdminNavigator from "./src/navigation/AdminNavigator";
import FuncionarioNavigator from "./src/navigation/FuncionarioNavigator";
import DoadorNavigator from "./src/navigation/DoadorNavigator";
import BeneficiarioNavigator from "./src/navigation/BeneficiarioNavigator";

// Componentes globais
import { NotificationBanner } from "./src/components/feedback/barrelFeedback";
import { Loading } from "./src/components/common/barrelCommon";

// Navegador baseado no papel do usuário
const RoleNavigator = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <Loading visible={true} message="Carregando..." overlay />;
  }

  if (!user) {
    return <AuthNavigator />;
  }

  switch (user.role) {
    case "admin":
      return <AdminNavigator />;
    case "funcionario":
      return <FuncionarioNavigator />;
    case "doador":
      return <DoadorNavigator />;
    case "beneficiario":
      return <BeneficiarioNavigator />;
    default:
      return <AuthNavigator />;
  }
};

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
              <RoleNavigator />
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
