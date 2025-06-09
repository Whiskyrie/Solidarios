// src/navigation/RoleNavigator.tsx
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../hooks/useAuth";
import { UserRole } from "../types/users.types";

// Navegadores específicos por perfil
import AdminNavigator from "./AdminNavigator";
import FuncionarioNavigator from "./FuncionarioNavigator";
import DoadorNavigator from "./DoadorNavigator";
import BeneficiarioNavigator from "./BeneficiarioNavigator";

// Definição de rotas
export type RoleStackParamList = {
  Admin: undefined;
  Funcionario: undefined;
  Doador: undefined;
  Beneficiario: undefined;
};

const Stack = createNativeStackNavigator<RoleStackParamList>();

const RoleNavigator: React.FC = () => {
  const { user } = useAuth();

  // Determinar a rota inicial com base no perfil do usuário
  const getInitialRouteName = (): keyof RoleStackParamList => {
    if (!user) return "Doador"; // Fallback para doador

    switch (user.role) {
      case UserRole.ADMIN:
        return "Admin";
      case UserRole.FUNCIONARIO:
        return "Funcionario";
      case UserRole.DOADOR:
        return "Doador";
      case UserRole.BENEFICIARIO:
        return "Beneficiario";
      default:
        return "Doador";
    }
  };

  return (
    <Stack.Navigator
      initialRouteName={getInitialRouteName()}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Admin" component={AdminNavigator} />
      <Stack.Screen name="Funcionario" component={FuncionarioNavigator} />
      <Stack.Screen name="Doador" component={DoadorNavigator} />
      <Stack.Screen name="Beneficiario" component={BeneficiarioNavigator} />
    </Stack.Navigator>
  );
};

export default RoleNavigator;
