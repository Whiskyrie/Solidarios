import React from "react";
import { View, StyleSheet, Platform, StatusBar } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { Typography, Avatar } from "../barrelComponents";
import theme from "../../theme/index";

interface ProfileHeaderProps {
  user: {
    name?: string;
    email?: string;
  } | null;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ user }) => {
  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#173F5F"
        translucent
      />
      <LinearGradient
        colors={["#173F5F", "#006E58", "#20B2AA"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View style={styles.userInfo}>
            <View style={styles.avatarContainer}>
              <Avatar name={user?.name} size="large" style={styles.avatar} />
              <View style={styles.onlineIndicator} />
            </View>
            <View style={styles.userDetails}>
              <Typography
                variant="h3"
                color={theme.colors.neutral.white}
                style={styles.userName}
              >
                Olá, {user?.name?.split(" ")[0]}!
              </Typography>
              <Typography
                variant="bodySecondary"
                color="rgba(255,255,255,0.8)"
                style={styles.userEmail}
              >
                {user?.email}
              </Typography>
              <View style={styles.userBadge}>
                <MaterialIcons name="verified" size={14} color="#4CAF50" />
                <Typography
                  variant="small"
                  color="rgba(255,255,255,0.9)"
                  style={styles.badgeText}
                >
                  Doador Verificado
                </Typography>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>
    </>
  );
};

const styles = StyleSheet.create({
  headerGradient: {
    paddingTop:
      Platform.OS === "ios" ? 50 : 30 + (StatusBar.currentHeight ?? 0),
    paddingBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.m,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  headerContent: {
    marginTop: theme.spacing.m,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    marginRight: theme.spacing.m,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.3)",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: theme.spacing.m + 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#4CAF50",
    borderWidth: 2,
    borderColor: theme.colors.neutral.white,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontWeight: "600",
    marginBottom: theme.spacing.xs,
  },
  userEmail: {
    marginBottom: theme.spacing.xs,
  },
  userBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: theme.spacing.s,
    paddingVertical: theme.spacing.xs,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  badgeText: {
    marginLeft: theme.spacing.xs,
    fontWeight: "500",
  },
});
