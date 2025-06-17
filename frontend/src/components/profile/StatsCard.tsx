import React from "react";
import { View, StyleSheet, Animated, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Typography } from "../barrelComponents";
import theme from "../../theme/index";

export interface StatCardProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  iconColor: string;
  gradientColors: [string, string, ...string[]];
  value: number;
  label: string;
  subtitle?: string;
  fadeAnim?: Animated.Value;
  slideAnim?: Animated.Value;
  onPress?: () => void;
}

export const StatCard: React.FC<StatCardProps> = React.memo(
  ({
    icon,
    iconColor,
    gradientColors,
    value,
    label,
    subtitle,
    fadeAnim,
    slideAnim,
    onPress,
  }) => {
    const handlePress = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress?.();
    };

    const CardContent = () => (
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.statGradient}
      >
        <View style={styles.statIconContainer}>
          <MaterialIcons name={icon} size={28} color={iconColor} />
        </View>

        <View style={styles.statContent}>
          <Typography
            variant="h2"
            color={theme.colors.neutral.white}
            style={styles.statValue}
          >
            {value}
          </Typography>
          <Typography
            variant="bodySecondary"
            color="rgba(255,255,255,0.9)"
            style={styles.statLabel}
          >
            {label}
          </Typography>
          <Typography
            variant="caption"
            color="rgba(255,255,255,0.7)"
            style={styles.statSubtitle}
          >
            {subtitle
              ? subtitle.charAt(0).toUpperCase() + subtitle.slice(1)
              : ""}
          </Typography>
        </View>
      </LinearGradient>
    );

    if (fadeAnim && slideAnim) {
      return (
        <Animated.View
          style={[
            styles.statCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {onPress ? (
            <TouchableOpacity
              onPress={handlePress}
              activeOpacity={0.8}
              style={styles.touchable}
            >
              <CardContent />
            </TouchableOpacity>
          ) : (
            <CardContent />
          )}
        </Animated.View>
      );
    }

    return (
      <View style={styles.statCard}>
        {onPress ? (
          <TouchableOpacity
            onPress={handlePress}
            activeOpacity={0.8}
            style={styles.touchable}
          >
            <CardContent />
          </TouchableOpacity>
        ) : (
          <CardContent />
        )}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  statCard: {
    borderRadius: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    overflow: "hidden",
    minHeight: 135,
    backgroundColor: "#FFFFFF",
  },
  touchable: {
    borderRadius: 16,
  },
  statGradient: {
    padding: theme.spacing.m,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 135,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.s,
  },
  statContent: {
    alignItems: "center",
  },
  statValue: {
    fontWeight: "800",
    textAlign: "center",
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    textAlign: "center",
    fontWeight: "600",
    marginBottom: 2,
  },
  statSubtitle: {
    textAlign: "center",
    fontWeight: "400",
  },
});
