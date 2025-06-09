import React from "react";
import {
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TouchableOpacity,
  FlatList,
} from "react-native";
import Card from "../common/Card";
import Typography from "../common/Typography";
import Avatar from "../common/Avatar";
import Badge from "../common/Badge";
import Divider from "../common/Divider";
import { formatDateTime } from "../../utils/formatters";
import { Distribution } from "../../types/distributions.types";
import theme from "../../theme";

export interface DistributionCardProps {
  distribution: Distribution;
  onPress?: () => void;
  onBeneficiaryPress?: () => void;
  onItemPress?: (itemId: string) => void;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
  showItems?: boolean;
}

const DistributionCard: React.FC<DistributionCardProps> = ({
  distribution,
  onPress,
  onBeneficiaryPress,
  onItemPress,
  style,
  compact = false,
  showItems = true,
}) => {
  // Renderizar cabeçalho com data e ID
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Typography
        variant={compact ? "bodySecondary" : "h4"}
        style={styles.headerTitle}
      >
        Distribuição
      </Typography>
      <Typography variant="small" color={theme.colors.neutral.darkGray}>
        {formatDateTime(distribution.date)}
      </Typography>
    </View>
  );

  // Renderizar informações do beneficiário
  const renderBeneficiary = () => (
    <TouchableOpacity
      style={styles.beneficiaryContainer}
      onPress={onBeneficiaryPress}
      disabled={!onBeneficiaryPress}
      activeOpacity={0.7}
    >
      <View style={styles.beneficiaryHeader}>
        <Typography
          variant="bodySecondary"
          color={theme.colors.neutral.darkGray}
        >
          Beneficiário:
        </Typography>

        {!compact && onBeneficiaryPress && (
          <Typography variant="small" color={theme.colors.primary.secondary}>
            Ver perfil
          </Typography>
        )}
      </View>

      <View style={styles.beneficiaryContent}>
        <Avatar
          name={distribution.beneficiary.name}
          size={compact ? "small" : "medium"}
          style={styles.avatar}
        />

        <View style={styles.beneficiaryInfo}>
          <Typography variant="body" numberOfLines={1}>
            {distribution.beneficiary.name}
          </Typography>

          {!compact && (
            <Typography
              variant="small"
              color={theme.colors.neutral.darkGray}
              numberOfLines={1}
            >
              {distribution.beneficiary.email}
            </Typography>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  // Renderizar informações do funcionário
  const renderEmployee = () =>
    !compact && (
      <View style={styles.employeeContainer}>
        <Typography
          variant="bodySecondary"
          color={theme.colors.neutral.darkGray}
        >
          Realizada por:
        </Typography>

        <View style={styles.employeeContent}>
          <Avatar
            name={distribution.employee.name}
            size="small"
            style={styles.avatar}
          />

          <Typography variant="bodySecondary" numberOfLines={1}>
            {distribution.employee.name}
          </Typography>
        </View>
      </View>
    );

  // Renderizar item da distribuição
  const renderItem = ({ item }: { item: Distribution["items"][0] }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => onItemPress && onItemPress(item.id)}
      disabled={!onItemPress}
      activeOpacity={0.7}
    >
      <View style={styles.itemInfo}>
        <Typography variant="bodySecondary" numberOfLines={1}>
          {item.description}
        </Typography>

        {item.category && (
          <Typography variant="small" color={theme.colors.neutral.darkGray}>
            {item.category.name}
          </Typography>
        )}
      </View>

      {item.size && (
        <Badge
          label={item.size}
          variant="info"
          size="small"
          style={styles.sizeBadge}
        />
      )}
    </TouchableOpacity>
  );

  // Renderizar lista de itens
  const renderItems = () =>
    showItems &&
    !compact && (
      <View style={styles.itemsContainer}>
        <Typography variant="bodySecondary" style={styles.itemsTitle}>
          Itens distribuídos ({distribution.items.length})
        </Typography>

        <FlatList
          data={distribution.items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <Divider spacing={theme.spacing.xs} />}
          style={styles.itemsList}
        />
      </View>
    );

  // Renderizar observações
  const renderObservations = () =>
    !compact &&
    distribution.observations && (
      <View style={styles.observationsContainer}>
        <Typography
          variant="bodySecondary"
          color={theme.colors.neutral.darkGray}
        >
          Observações:
        </Typography>

        <Typography variant="bodySecondary" style={styles.observationsText}>
          {distribution.observations}
        </Typography>
      </View>
    );

  // Renderizar resumo compacto (número de itens)
  const renderCompactSummary = () =>
    compact && (
      <View style={styles.compactSummaryContainer}>
        <Typography
          variant="bodySecondary"
          color={theme.colors.neutral.darkGray}
        >
          {distribution.items.length}{" "}
          {distribution.items.length === 1 ? "item" : "itens"} distribuídos
        </Typography>
      </View>
    );

  return (
    <Card
      style={[styles.card, compact && styles.compactCard, style]}
      onPress={onPress}
      contentStyle={styles.cardContent}
    >
      {renderHeader()}
      {renderBeneficiary()}
      {renderEmployee()}
      {renderItems()}
      {renderObservations()}
      {renderCompactSummary()}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: theme.spacing.s,
  },
  compactCard: {
    minHeight: 100,
  },
  cardContent: {
    padding: theme.spacing.s,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },
  headerTitle: {
    flex: 1,
  },
  beneficiaryContainer: {
    marginBottom: theme.spacing.s,
  },
  beneficiaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.xxs,
  },
  beneficiaryContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  beneficiaryInfo: {
    flex: 1,
  },
  avatar: {
    marginRight: theme.spacing.xs,
  },
  employeeContainer: {
    marginBottom: theme.spacing.s,
  },
  employeeContent: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: theme.spacing.xxs,
  },
  itemsContainer: {
    marginBottom: theme.spacing.s,
  },
  itemsTitle: {
    marginBottom: theme.spacing.xs,
  },
  itemsList: {
    maxHeight: 200,
  },
  itemContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: theme.spacing.xs,
  },
  itemInfo: {
    flex: 1,
  },
  sizeBadge: {
    marginLeft: theme.spacing.s,
  },
  observationsContainer: {
    marginTop: theme.spacing.xs,
  },
  observationsText: {
    marginTop: theme.spacing.xxs,
  },
  compactSummaryContainer: {
    marginTop: theme.spacing.xs,
    alignItems: "flex-end",
  },
});

export default DistributionCard;
