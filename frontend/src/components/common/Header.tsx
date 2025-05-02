import React from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
  StatusBar,
} from "react-native";
import Typography from "./Typography";
import theme from "../../theme";

export interface HeaderProps {
  title: string;
  subtitle?: string;
  leftComponent?: React.ReactNode;
  rightComponent?: React.ReactNode;
  onBackPress?: () => void;
  style?: StyleProp<ViewStyle>;
  backgroundColor?: string;
  titleColor?: string;
  subtitleColor?: string;
  elevated?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  leftComponent,
  rightComponent,
  onBackPress,
  style,
  backgroundColor = theme.colors.primary.main,
  titleColor = theme.colors.neutral.white,
  subtitleColor = theme.colors.neutral.white + "CC", // 80% opacity
  elevated = true,
}) => {
  return (
    <>
      <StatusBar backgroundColor={backgroundColor} barStyle="light-content" />
      <View
        style={[
          styles.container,
          { backgroundColor },
          elevated && styles.elevated,
          style,
        ]}
      >
        <View style={styles.leftContainer}>
          {leftComponent ? (
            leftComponent
          ) : onBackPress ? (
            <TouchableOpacity
              onPress={onBackPress}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <BackIcon color={titleColor} />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.titleContainer}>
          <Typography
            variant="h3"
            color={titleColor}
            style={styles.title}
            numberOfLines={1}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="small"
              color={subtitleColor}
              style={styles.subtitle}
              numberOfLines={1}
            >
              {subtitle}
            </Typography>
          )}
        </View>

        <View style={styles.rightContainer}>
          {rightComponent || <View style={styles.placeholderRight} />}
        </View>
      </View>
    </>
  );
};

// Componente de ícone de voltar padrão
const BackIcon = ({ color = "#FFFFFF" }: { color?: string }) => (
  <View style={backIconStyles.container}>
    <View style={[backIconStyles.arrow, { borderColor: color }]} />
  </View>
);

const backIconStyles = StyleSheet.create({
  container: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  arrow: {
    width: 10,
    height: 10,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    transform: [{ rotate: "45deg" }],
  },
});

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    paddingHorizontal: theme.spacing.s,
  },
  elevated: {
    ...theme.shadows.medium,
    elevation: 4,
  },
  leftContainer: {
    width: 48,
    height: "100%",
    justifyContent: "center",
    alignItems: "flex-start",
  },
  backButton: {
    padding: theme.spacing.xxs,
  },
  titleContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
  },
  rightContainer: {
    width: 48,
    height: "100%",
    justifyContent: "center",
    alignItems: "flex-end",
  },
  placeholderRight: {
    width: 24,
  },
});

export default Header;
