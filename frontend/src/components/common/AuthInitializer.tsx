import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { authManager } from "../../utils/authManager";
import { authDebugger } from "../../utils/authDebugger";

interface AuthInitializerProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AuthInitializer: React.FC<AuthInitializerProps> = ({
  children,
  fallback,
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [, setInitError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        console.log("[AuthInitializer] Iniciando autenticação...");

        // Capturar estado inicial
        if (__DEV__) {
          await authDebugger.captureState("initialize_start");
        }

        const result = await authManager.initialize();

        if (isMounted) {
          if (result.success) {
            console.log("[AuthInitializer] Inicialização concluída:", {
              isAuthenticated: result.isAuthenticated,
              hasUser: !!result.user,
            });

            if (__DEV__) {
              await authDebugger.captureState("initialize_success");
            }

            setIsInitialized(true);
            setInitError(null);
          } else {
            console.error(
              "[AuthInitializer] Falha na inicialização:",
              result.error
            );
            setInitError(result.error || "Erro na inicialização");
            setIsInitialized(true); // Ainda assim permite continuar
          }
        }
      } catch (error) {
        console.error("[AuthInitializer] Erro inesperado:", error);
        if (isMounted) {
          setInitError("Erro inesperado na inicialização");
          setIsInitialized(true);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []); // IMPORTANTE: Array vazio para executar apenas uma vez

  if (!isInitialized) {
    return (
      fallback || (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#fff",
          }}
        >
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )
    );
  }

  return <>{children}</>;
};
