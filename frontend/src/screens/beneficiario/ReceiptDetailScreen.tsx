// src/screens/beneficiario/ReceiptDetailScreen.tsx
import React, { useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import {
  RouteProp,
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { BeneficiarioStackParamList } from "../../navigation/types";
import { StackNavigationProp } from "@react-navigation/stack";

// Componentes
import {
  Typography,
  Header,
  Card,
  Divider,
  Avatar,
  Badge,
  EmptyState,
  Loading,
  ErrorState,
  ItemCard,
} from "../../components/barrelComponents";
import theme from "../../theme";

// Hooks
import { useAuth } from "../../hooks/useAuth";
import { useDistributions } from "../../hooks/useDistributions";

// Tipos e rotas
import { BENEFICIARIO_ROUTES } from "../../navigation/routes";
import { formatDate, formatDateTime } from "../../utils/formatters";

// Interface para a rota
type ReceiptDetailScreenRouteProp = RouteProp<
  BeneficiarioStackParamList,
  typeof BENEFICIARIO_ROUTES.RECEIPT_DETAIL
>;

const ReceiptDetailScreen: React.FC = () => {
  // Navegação e parâmetros
  const route = useRoute<ReceiptDetailScreenRouteProp>();
  const id = route.params?.id || "";
  const navigation =
    useNavigation<StackNavigationProp<BeneficiarioStackParamList>>();

  // Estado
  const { user } = useAuth();
  const { distribution, fetchDistributionById, isLoading, error, clearError } =
    useDistributions();

  // Carregar detalhes da distribuição
  const loadDistribution = useCallback(async () => {
    await fetchDistributionById(id);
  }, [fetchDistributionById, id]);

  // Carregar dados ao focar na tela
  useFocusEffect(
    useCallback(() => {
      loadDistribution();
    }, [loadDistribution])
  );

  // Compartilhar comprovante
  const handleShareReceipt = () => {
    Alert.alert(
      "Compartilhar Comprovante",
      "Esta funcionalidade geraria um PDF com os detalhes do recebimento para compartilhar.",
      [{ text: "OK" }]
    );
  };

  // Renderizar loading state
  if (isLoading && !distribution) {
    return (
      <Loading
        visible={true}
        message="Carregando detalhes do recebimento..."
        overlay
      />
    );
  }

  // Renderizar erro
  if (error) {
    return (
      <ErrorState
        title="Erro ao carregar detalhes"
        description={error}
        actionLabel="Tentar novamente"
        onAction={() => {
          clearError();
          loadDistribution();
        }}
      />
    );
  }

  // Se a distribuição não foi carregada
  if (!distribution) {
    return (
      <EmptyState
        title="Recebimento não encontrado"
        description="O recebimento que você está procurando não está disponível."
        actionLabel="Voltar para recebimentos"
        onAction={() => navigation.goBack()}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <Header
        title="Detalhes do Recebimento"
        onBackPress={() => navigation.goBack()}
        backgroundColor={theme.colors.primary.secondary}
        rightComponent={
          <TouchableOpacity
            onPress={handleShareReceipt}
            style={styles.shareButton}
          >
            <Typography variant="small" color={theme.colors.neutral.white}>
              Compartilhar
            </Typography>
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Informações gerais */}
        <Card style={styles.card}>
          <View style={styles.headerRow}>
            <Typography variant="h3">Recebimento de Doações</Typography>
            <Badge
              label={formatDate(distribution.date)}
              variant="info"
              size="small"
            />
          </View>

          <Divider spacing={theme.spacing.s} />

          {/* ID da distribuição */}
          <View style={styles.infoRow}>
            <Typography
              variant="bodySecondary"
              color={theme.colors.neutral.darkGray}
            >
              Código:
            </Typography>
            <Typography variant="bodySecondary">
              {distribution.id.slice(0, 8).toUpperCase()}
            </Typography>
          </View>

          {/* Data e hora */}
          <View style={styles.infoRow}>
            <Typography
              variant="bodySecondary"
              color={theme.colors.neutral.darkGray}
            >
              Data e hora:
            </Typography>
            <Typography variant="bodySecondary">
              {formatDateTime(distribution.date)}
            </Typography>
          </View>

          {/* Observações (se houver) */}
          {distribution.observations && (
            <View style={styles.observationsContainer}>
              <Typography
                variant="bodySecondary"
                color={theme.colors.neutral.darkGray}
              >
                Observações:
              </Typography>
              <View style={styles.observationsBox}>
                <Typography variant="bodySecondary">
                  {distribution.observations}
                </Typography>
              </View>
            </View>
          )}
        </Card>

        {/* Funcionário responsável */}
        <Card title="Responsável pela entrega" style={styles.card}>
          <View style={styles.employeeContainer}>
            <Avatar
              name={distribution.employee.name}
              size="medium"
              style={styles.avatar}
            />
            <View style={styles.employeeInfo}>
              <Typography variant="body">
                {distribution.employee.name}
              </Typography>
              <Typography variant="small" color={theme.colors.neutral.darkGray}>
                {distribution.employee.email}
              </Typography>
              <Badge
                label="Funcionário"
                variant="info"
                size="small"
                style={styles.roleBadge}
              />
            </View>
          </View>
        </Card>

        {/* Lista de itens recebidos */}
        <Card
          title={`Itens recebidos (${distribution.items.length})`}
          style={styles.card}
        >
          {distribution.items.length > 0 ? (
            <FlatList
              data={distribution.items}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <ItemCard
                  item={item}
                  onPress={() =>
                    navigation.navigate(BENEFICIARIO_ROUTES.ITEM_DETAIL, {
                      id: item.id,
                    })
                  }
                  compact
                  showDonor
                />
              )}
              scrollEnabled={false}
              ItemSeparatorComponent={() => (
                <Divider spacing={theme.spacing.xs} />
              )}
              style={styles.itemsList}
            />
          ) : (
            <Typography variant="bodySecondary" style={styles.emptyText}>
              Nenhum item encontrado neste recebimento.
            </Typography>
          )}
        </Card>

        {/* Informações de doadores */}
        <Card title="Doadores" style={styles.card}>
          {/* Extrair doadores únicos dos itens */}
          {Array.from(
            new Set(distribution.items.map((item) => item.donorId))
          ).map((donorId) => {
            const donor = distribution.items.find(
              (item) => item.donorId === donorId
            )?.donor;
            if (!donor) return null;

            return (
              <View key={donorId} style={styles.donorContainer}>
                <Avatar
                  name={donor.name}
                  size="small"
                  style={styles.donorAvatar}
                />
                <View style={styles.donorInfo}>
                  <Typography variant="bodySecondary">{donor.name}</Typography>
                  <Typography
                    variant="small"
                    color={theme.colors.neutral.darkGray}
                  >
                    {
                      distribution.items.filter(
                        (item) => item.donorId === donorId
                      ).length
                    }{" "}
                    item(ns) doado(s)
                  </Typography>
                </View>
              </View>
            );
          })}
        </Card>

        {/* Assinatura */}
        <View style={styles.footerContainer}>
          <Typography
            variant="small"
            color={theme.colors.neutral.darkGray}
            center
          >
            Este comprovante é válido apenas para fins de controle interno.
          </Typography>
          <Typography
            variant="small"
            color={theme.colors.neutral.darkGray}
            center
          >
            Distribuição realizada em {formatDate(distribution.date)}
          </Typography>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.white,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.s,
    paddingBottom: theme.spacing.xxl,
  },
  shareButton: {
    padding: theme.spacing.xs,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: theme.borderRadius.small,
  },
  card: {
    marginBottom: theme.spacing.s,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },
  observationsContainer: {
    marginTop: theme.spacing.s,
  },
  observationsBox: {
    backgroundColor: theme.colors.neutral.lightGray,
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.small,
    marginTop: theme.spacing.xxs,
  },
  employeeContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.xs,
  },
  avatar: {
    marginRight: theme.spacing.s,
  },
  employeeInfo: {
    flex: 1,
  },
  roleBadge: {
    alignSelf: "flex-start",
    marginTop: theme.spacing.xxs,
  },
  itemsList: {
    marginTop: theme.spacing.xs,
  },
  emptyText: {
    textAlign: "center",
    padding: theme.spacing.s,
  },
  donorContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.lightGray,
  },
  donorAvatar: {
    marginRight: theme.spacing.xs,
  },
  donorInfo: {
    flex: 1,
  },
  footerContainer: {
    marginTop: theme.spacing.m,
    marginBottom: theme.spacing.xl,
    padding: theme.spacing.s,
  },
});

export default ReceiptDetailScreen;
