import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Typography } from "../barrelComponents";
import theme from "../../theme/index";

export interface MenuItemProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  showBadge?: boolean;
  badgeColor?: string;
}

export const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  showBadge = false,
  badgeColor = theme.colors.status.success,
}) => (
  <TouchableOpacity
    style={styles.menuItem}
    onPress={onPress}
    activeOpacity={0.7}
    accessibilityRole="button"
    accessibilityLabel={title}
    accessibilityHint={subtitle}
  >
    <View style={styles.menuItemLeft}>
      <View style={[styles.menuIconContainer, { borderColor: badgeColor }]}>
        <MaterialIcons
          name={icon}
          size={24}
          color={theme.colors.primary.secondary}
        />
        {showBadge && (
          <View style={[styles.badge, { backgroundColor: badgeColor }]} />
        )}
      </View>
      <View style={styles.menuTextContainer}>
        <Typography variant="body" style={styles.menuTitle}>
          {title}
        </Typography>
        <Typography
          variant="small"
          color={theme.colors.neutral.darkGray}
          style={styles.menuSubtitle}
        >
          {subtitle}
        </Typography>
      </View>
    </View>
    <MaterialIcons
      name="chevron-right"
      size={24}
      color={theme.colors.neutral.darkGray}
    />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: theme.spacing.m,
    paddingHorizontal: theme.spacing.s,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.m,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.colors.neutral.white,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontWeight: "600",
    marginBottom: 2,
    color: theme.colors.neutral.black,
  },
  menuSubtitle: {
    lineHeight: 16,
  },
});
