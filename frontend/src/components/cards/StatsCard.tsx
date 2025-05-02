import React from "react";
import {
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TouchableOpacity,
} from "react-native";
import Card from "../common/Card";
import Typography from "../common/Typography";
import { formatNumber, formatPercent } from "../../utils/formatters";
import theme from "../../theme";

export type StatValueType = "number" | "currency" | "percentage" | "text";

export interface StatData {
  title: string;
  value: number | string;
  type?: StatValueType;
  color?: string;
  previousValue?: number;
  showChange?: boolean;
  icon?: React.ReactNode;
}

export interface StatsCardProps {
  title?: string;
  stats: StatData[];
  onPress?: () => void;
  actionLabel?: string;
  onActionPress?: () => void;
  style?: StyleProp<ViewStyle>;
  columns?: 1 | 2 | 3 | 4;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  stats,
  onPress,
  actionLabel,
  onActionPress,
  style,
  columns = 2,
}) => {
  // Formatar valor com base no tipo
  const formatValue = (stat: StatData): string => {
    const { value, type = "number" } = stat;

    if (typeof value === "string") {
      return value;
    }

    switch (type) {
      case "currency":
        return formatNumber(value);
      case "percentage":
        return formatPercent(value / 100);
      case "text":
        return value.toString();
      case "number":
      default:
        return formatNumber(value, 0);
    }
  };

  // Calcular a variação percentual
  const calculateChange = (current: number, previous: number): number => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  // Renderizar indicador de mudança
  const renderChangeIndicator = (stat: StatData) => {
    if (
      !stat.showChange ||
      typeof stat.value !== "number" ||
      !stat.previousValue
    ) {
      return null;
    }

    const change = calculateChange(stat.value, stat.previousValue);
    const changeColor =
      change > 0
        ? theme.colors.status.success
        : change < 0
        ? theme.colors.status.error
        : theme.colors.neutral.darkGray;

    return (
      <View style={[styles.changeContainer, { borderColor: changeColor }]}>
        {change !== 0 && (
          <View
            style={[
              styles.arrow,
              { borderColor: changeColor },
              change > 0 ? styles.arrowUp : styles.arrowDown,
            ]}
          />
        )}
        <Typography variant="small" color={changeColor}>
          {change > 0 ? "+" : ""}
          {formatPercent(change / 100)}
        </Typography>
      </View>
    );
  };

  // Renderizar um único item de estatística
  const renderStatItem = (stat: StatData, index: number) => {
    // Use "as any" to fix type compatibility with DimensionValue
    const itemWidth = `${100 / columns}%` as any;

    return (
      <View
        key={`${stat.title}-${index}`}
        style={[styles.statItem, { width: itemWidth }]}
      >
        <View style={styles.statHeader}>
          {stat.icon && <View style={styles.statIcon}>{stat.icon}</View>}
          <Typography
            variant="bodySecondary"
            color={theme.colors.neutral.darkGray}
            style={styles.statTitle}
            numberOfLines={1}
          >
            {stat.title}
          </Typography>
        </View>

        <View style={styles.statValueContainer}>
          <Typography
            variant="h3"
            color={stat.color || theme.colors.neutral.black}
            style={styles.statValue}
            numberOfLines={1}
          >
            {formatValue(stat)}
          </Typography>

          {renderChangeIndicator(stat)}
        </View>
      </View>
    );
  };

  // Renderizar rodapé com ação
  const renderFooter = () =>
    actionLabel &&
    onActionPress && (
      <TouchableOpacity
        style={styles.actionButton}
        onPress={onActionPress}
        activeOpacity={0.7}
      >
        <Typography
          variant="bodySecondary"
          color={theme.colors.primary.secondary}
        >
          {actionLabel}
        </Typography>
      </TouchableOpacity>
    );

  return (
    <Card
      title={title}
      style={[styles.card, style]}
      onPress={onPress}
      footer={renderFooter()}
    >
      <View style={styles.statsContainer}>{stats.map(renderStatItem)}</View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: theme.spacing.s,
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  statItem: {
    marginBottom: theme.spacing.m,
    paddingHorizontal: theme.spacing.xs,
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.xxs,
  },
  statIcon: {
    marginRight: theme.spacing.xxs,
  },
  statTitle: {
    flex: 1,
  },
  statValueContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statValue: {
    marginRight: theme.spacing.xs,
  },
  changeContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.xxs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.small,
    borderWidth: 1,
  },
  arrow: {
    width: 0,
    height: 0,
    borderStyle: "solid",
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 4,
    borderBottomWidth: 4,
    marginRight: 2,
  },
  arrowUp: {
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "inherit",
    borderTopWidth: 0,
  },
  arrowDown: {
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "inherit",
    borderBottomWidth: 0,
  },
  actionButton: {
    paddingVertical: theme.spacing.xs,
    alignItems: "center",
  },
});

export default StatsCard;
