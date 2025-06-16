import React from "react";
import { View, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Card, Typography } from "../barrelComponents";
import { MenuItem, MenuItemProps } from "./MenuItem";
import { DoadorProfileStackParamList } from "../../navigation/types";
import theme from "../../theme/index";

export const ProfileMenu: React.FC = () => {
  const navigation =
    useNavigation<StackNavigationProp<DoadorProfileStackParamList>>();

  const menuItems: MenuItemProps[] = [
    {
      icon: "analytics",
      title: "Relatório de Impacto",
      subtitle: "Veja estatísticas detalhadas das suas doações",
      onPress: () => navigation.navigate("Impact"),
    },
    {
      icon: "edit",
      title: "Editar Perfil",
      subtitle: "Atualize suas informações pessoais",
      onPress: () => navigation.navigate("EditProfile"),
    },
    {
      icon: "history",
      title: "Histórico de Doações",
      subtitle: "Acompanhe todas as suas contribuições",
      onPress: () => navigation.navigate("DonationHistory"),
    },
    {
      icon: "notifications",
      title: "Notificações",
      subtitle: "Gerencie suas preferências de notificação",
      onPress: () =>
        navigation.navigate("UnderConstruction", {
          featureName: "Notificações",
        }),
      showBadge: true,
      badgeColor: theme.colors.status.warning,
    },
    {
      icon: "help",
      title: "Ajuda & Suporte",
      subtitle: "Tire suas dúvidas ou reporte problemas",
      onPress: () =>
        navigation.navigate("UnderConstruction", {
          featureName: "Ajuda & Suporte",
        }),
    },
    {
      icon: "info",
      title: "Sobre o App",
      subtitle: "Versão 1.0.0 • Termos de uso",
      onPress: () =>
        navigation.navigate("UnderConstruction", {
          featureName: "Sobre o App",
        }),
    },
  ];

  return (
    <Card style={styles.menuCard}>
      <Typography variant="h4" style={styles.menuSectionTitle}>
        Configurações
      </Typography>

      {menuItems.map((item, index) => (
        <React.Fragment key={index}>
          <MenuItem {...item} />
          {index < menuItems.length - 1 && <View style={styles.menuDivider} />}
        </React.Fragment>
      ))}
    </Card>
  );
};

const styles = StyleSheet.create({
  menuCard: {
    marginBottom: theme.spacing.l,
    paddingVertical: theme.spacing.s,
  },
  menuSectionTitle: {
    fontWeight: "700",
    marginBottom: theme.spacing.m,
    paddingHorizontal: theme.spacing.s,
    color: theme.colors.neutral.black,
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginHorizontal: theme.spacing.s,
  },
});
