import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { DoadorProfileStackParamList } from "../../navigation/types";

// Componentes
import {
  Typography,
  Header,
  Card,
  ErrorState,
} from "../../components/barrelComponents";
import theme from "../../theme";

// Hooks
import { useAuth } from "../../hooks/useAuth";
import { useItems } from "../../hooks/useItems";

// Tipos das estatísticas de impacto
type ImpactStats = {
  totalDonations: number;
  distributedItems: number;
  peopleHelped: number;
  clothesDonated: number;
  shoesDonated: number;
  utensilsDonated: number;
  othersDonated: number;
};

const ImpactScreen: React.FC = () => {
  const navigation =
    useNavigation<StackNavigationProp<DoadorProfileStackParamList, "Impact">>();
  const { user } = useAuth();
  const { fetchItemsByDonor } = useItems();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ImpactStats>({
    totalDonations: 0,
    distributedItems: 0,
    peopleHelped: 0,
    clothesDonated: 0,
    shoesDonated: 0,
    utensilsDonated: 0,
    othersDonated: 0,
  });

  // Carregar estatísticas do usuário
  useEffect(() => {
    const loadImpactStats = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);

        // Buscar todos os itens doados pelo usuário
        const response = await fetchItemsByDonor(user.id, {
          page: 1,
          take: 100,
        });

        if (response && response.data) {
          const items = response.data;

          // Calcular estatísticas
          const distributedItems = items.filter(
            (item) => item.status === "distribuido"
          ).length;

          // Aqui assumimos que cada item distribuído ajudou uma pessoa
          // Numa aplicação real, você poderia ter um cálculo mais preciso
          const peopleHelped = distributedItems;

          // Contar itens por tipo
          const clothesDonated = items.filter(
            (item) => item.type === "roupa"
          ).length;
          const shoesDonated = items.filter(
            (item) => item.type === "calcado"
          ).length;
          const utensilsDonated = items.filter(
            (item) => item.type === "utensilio"
          ).length;
          const othersDonated = items.filter(
            (item) => item.type === "outro"
          ).length;

          setStats({
            totalDonations: items.length,
            distributedItems,
            peopleHelped,
            clothesDonated,
            shoesDonated,
            utensilsDonated,
            othersDonated,
          });
        }
      } catch (err) {
        console.error("Erro ao carregar estatísticas de impacto:", err);
        setError("Não foi possível carregar seus dados de impacto social.");
      } finally {
        setLoading(false);
      }
    };

    loadImpactStats();
  }, [user, fetchItemsByDonor]);

  if (error) {
    return (
      <View style={styles.container}>
        <Header
          title="Meu Impacto Social"
          onBackPress={() => navigation.goBack()}
          backgroundColor={theme.colors.primary.secondary}
        />
        <ErrorState
          title="Erro ao carregar dados"
          description={error}
          actionLabel="Tentar novamente"
          onAction={() => {
            // Usar o tipo correto de navegação
            const rootNavigation = navigation.getParent();
            if (rootNavigation) {
              rootNavigation.navigate("Profile", {
                screen: "Impact",
              });
            } else {
              // Navegação dentro da própria pilha
              navigation.navigate("Impact");
            }
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Meu Impacto Social"
        onBackPress={() => navigation.goBack()}
        backgroundColor={theme.colors.primary.secondary}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <Typography variant="h3" style={styles.title}>
          Seu impacto como doador
        </Typography>

        <Typography variant="bodySecondary" style={styles.subtitle}>
          Veja como suas doações estão fazendo a diferença
        </Typography>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color={theme.colors.primary.secondary}
            />
            <Typography variant="bodySecondary" style={styles.loadingText}>
              Carregando suas estatísticas...
            </Typography>
          </View>
        ) : (
          <>
            {/* Card principal de impacto */}
            <Card style={styles.impactCard}>
              <View style={styles.mainStats}>
                <View style={styles.statItem}>
                  <Typography
                    variant="h2"
                    color={theme.colors.primary.secondary}
                  >
                    {stats.totalDonations}
                  </Typography>
                  <Typography variant="bodySecondary">
                    Doações realizadas
                  </Typography>
                </View>

                <View style={styles.statItem}>
                  <Typography
                    variant="h2"
                    color={theme.colors.primary.secondary}
                  >
                    {stats.distributedItems}
                  </Typography>
                  <Typography variant="bodySecondary">
                    Itens distribuídos
                  </Typography>
                </View>

                <View style={styles.statItem}>
                  <Typography
                    variant="h2"
                    color={theme.colors.primary.secondary}
                  >
                    {stats.peopleHelped}
                  </Typography>
                  <Typography variant="bodySecondary">
                    Pessoas ajudadas
                  </Typography>
                </View>
              </View>
            </Card>

            {/* Detalhes por tipo de item */}
            <Card title="Tipos de itens doados" style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <Typography variant="bodySecondary">Roupas:</Typography>
                <Typography variant="body">{stats.clothesDonated}</Typography>
              </View>
              <View style={styles.detailRow}>
                <Typography variant="bodySecondary">Calçados:</Typography>
                <Typography variant="body">{stats.shoesDonated}</Typography>
              </View>
              <View style={styles.detailRow}>
                <Typography variant="bodySecondary">Utensílios:</Typography>
                <Typography variant="body">{stats.utensilsDonated}</Typography>
              </View>
              <View style={styles.detailRow}>
                <Typography variant="bodySecondary">Outros:</Typography>
                <Typography variant="body">{stats.othersDonated}</Typography>
              </View>
            </Card>

            {/* Mensagem de agradecimento */}
            <Card style={styles.messageCard}>
              <Typography variant="body" style={styles.messageText}>
                Obrigado por suas doações! Cada item faz a diferença na vida de
                quem precisa.
              </Typography>
            </Card>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.lightGray,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.m,
  },
  title: {
    textAlign: "center",
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: theme.spacing.m,
    color: theme.colors.neutral.darkGray,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.xl,
  },
  loadingText: {
    marginTop: theme.spacing.m,
    color: theme.colors.neutral.darkGray,
  },
  impactCard: {
    marginBottom: theme.spacing.m,
    padding: theme.spacing.s,
  },
  mainStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: theme.spacing.m,
  },
  statItem: {
    alignItems: "center",
  },
  detailsCard: {
    marginBottom: theme.spacing.m,
    padding: theme.spacing.s,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.lightGray,
  },
  messageCard: {
    marginBottom: theme.spacing.m,
    padding: theme.spacing.m,
    backgroundColor: theme.colors.primary.secondary + "20", // Adiciona transparência à cor
  },
  messageText: {
    textAlign: "center",
    color: theme.colors.primary.secondary,
    fontWeight: "bold",
  },
});

export default ImpactScreen;
