import React from "react";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
} from "react-native";
import Card from "../common/Card";
import Typography from "../common/Typography";
import Badge from "../common/Badge";
import Avatar from "../common/Avatar";
import StatusIndicator from "../common/StatusIndicator";
import { formatDate } from "../../utils/formatters";
import { Item, ItemType } from "../../types/items.types";
import { mapStatusToBadgeVariant } from "../common/Badge";
import theme from "../../theme";

export interface ItemCardProps {
  item: Item;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  showDonor?: boolean;
  showCategory?: boolean;
  compact?: boolean;
}

// Mapeamento de tipos de itens para rótulos
const itemTypeLabels: Record<ItemType, string> = {
  [ItemType.ROUPA]: "Roupa",
  [ItemType.CALCADO]: "Calçado",
  [ItemType.UTENSILIO]: "Utensílio",
  [ItemType.OUTRO]: "Outro",
};

// Mapeamento de status para rótulos

const ItemCard: React.FC<ItemCardProps> = ({
  item,
  onPress,
  style,
  showDonor = true,
  showCategory = true,
  compact = false,
}) => {
  const hasImage = item.photos && item.photos.length > 0;

  // Renderizar conteúdo do card
  const renderCardContent = () => (
    <View style={styles.contentContainer}>
      {/* Imagem do item (se disponível) */}
      {hasImage && !compact && (
        <Image
          source={{ uri: item.photos?.[0] || "" }}
          style={styles.image}
          resizeMode="cover"
        />
      )}

      <View style={styles.detailsContainer}>
        <View style={styles.headerRow}>
          <Badge
            label={itemTypeLabels[item.type]}
            variant="info"
            size="small"
          />

          <StatusIndicator status={item.status} size="small" />
        </View>

        {/* Descrição do item */}
        <Typography
          variant="body"
          style={styles.description}
          numberOfLines={compact ? 1 : 2}
        >
          {item.description}
        </Typography>

        {/* Informações adicionais */}
        <View style={styles.infoContainer}>
          {item.size && (
            <View style={styles.infoItem}>
              <Typography variant="small" color={theme.colors.neutral.darkGray}>
                Tamanho:
              </Typography>
              <Typography variant="small">{item.size}</Typography>
            </View>
          )}

          {item.conservationState && (
            <View style={styles.infoItem}>
              <Typography variant="small" color={theme.colors.neutral.darkGray}>
                Estado:
              </Typography>
              <Typography variant="small">{item.conservationState}</Typography>
            </View>
          )}

          {!compact && (
            <View style={styles.infoItem}>
              <Typography variant="small" color={theme.colors.neutral.darkGray}>
                Recebido em:
              </Typography>
              <Typography variant="small">
                {formatDate(item.receivedDate)}
              </Typography>
            </View>
          )}
        </View>

        {/* Categoria (opcional) */}
        {showCategory && item.category && (
          <View style={styles.categoryContainer}>
            <Typography variant="small" color={theme.colors.neutral.darkGray}>
              Categoria:
            </Typography>
            <Badge
              label={item.category.name}
              variant="info"
              size="small"
              style={styles.categoryBadge}
            />
          </View>
        )}
      </View>
    </View>
  );

  // Renderizar rodapé do card com informações do doador
  const renderCardFooter = () =>
    showDonor &&
    item.donor && (
      <View style={styles.footer}>
        <Typography variant="small" color={theme.colors.neutral.darkGray}>
          Doado por:
        </Typography>
        <View style={styles.donorContainer}>
          <Avatar
            name={item.donor.name}
            size="small"
            style={styles.donorAvatar}
          />
          <Typography variant="bodySecondary">{item.donor.name}</Typography>
        </View>
      </View>
    );

  return (
    <Card
      style={[styles.card, compact && styles.compactCard, style]}
      onPress={onPress}
      contentStyle={styles.cardContent}
      footer={!compact && renderCardFooter()}
    >
      {renderCardContent()}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: theme.spacing.s,
  },
  compactCard: {
    minHeight: 80,
  },
  cardContent: {
    padding: theme.spacing.xs,
  },
  contentContainer: {
    flexDirection: "row",
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.small,
    marginRight: theme.spacing.s,
  },
  detailsContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.xxs,
  },
  description: {
    marginBottom: theme.spacing.xxs,
  },
  infoContainer: {
    marginBottom: theme.spacing.xxs,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  categoryContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: theme.spacing.xxs,
  },
  categoryBadge: {
    marginLeft: theme.spacing.xxs,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral.lightGray,
    paddingTop: theme.spacing.xs,
  },
  donorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: theme.spacing.xxs,
  },
  donorAvatar: {
    marginRight: theme.spacing.xs,
  },
});

export default ItemCard;
