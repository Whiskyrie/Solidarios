// src/navigation/index.tsx
import React from "react";
import { useAuth } from "../hooks/useAuth";
import { UserRole } from "../types/users.types";

// Navegadores
import AuthNavigator from "./AuthNavigator";
import AdminNavigator from "./AdminNavigator";
import FuncionarioNavigator from "./FuncionarioNavigator";
import DoadorNavigator from "./DoadorNavigator";
import BeneficiarioNavigator from "./BeneficiarioNavigator";

// Provedor de navegação
const Navigation: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  // Determinar qual navegador mostrar com base no estado de autenticação e perfil
  const renderNavigator = () => {
    if (!isAuthenticated || !user) {
      return <AuthNavigator />;
    }

    // Roteamento baseado no perfil do usuário
    switch (user.role) {
      case UserRole.ADMIN:
        return <AdminNavigator />;
      case UserRole.FUNCIONARIO:
        return <FuncionarioNavigator />;
      case UserRole.DOADOR:
        return <DoadorNavigator />;
      case UserRole.BENEFICIARIO:
        return <BeneficiarioNavigator />;
      default:
        return <AuthNavigator />;
    }
  };

  return <NavigationContainer>{renderNavigator()}</NavigationContainer>;
};

export default Navigation;
