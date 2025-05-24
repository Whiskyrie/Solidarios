import React, { useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Animated,
  TouchableOpacityProps 
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Typography from '../common/Typography';
import theme from '../../theme';

interface MenuItemProps extends TouchableOpacityProps {
  label: string;
  icon: string;
  badge?: number | string;
  rightIcon?: string;
}

/**
 * Componente de item de menu com animação
 */
const MenuItem = React.memo(({
  label,
  icon,
  badge,
  rightIcon = "chevron-right",
  ...rest
}: MenuItemProps) => {
  // Animação para feedback visual
  const bgColorAnim = useRef(new Animated.Value(0)).current;

  // Handlers para animação
  const handlePressIn = () => {
    Animated.timing(bgColorAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(bgColorAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  // Interpolação de cor para o background
  const backgroundColor = bgColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.neutral.white, `${theme.colors.primary.secondary}10`]
  });

  return (
    <TouchableOpacity
      {...rest}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.9}
      accessibilityRole="button"
    >
      <Animated.View style={[styles.container, { backgroundColor }]}>
        {/* Ícone esquerdo */}
        <View style={styles.iconContainer}>
          <MaterialIcons 
            name={icon} 
            size={24} 
            color={theme.colors.primary.secondary} 
          />
        </View>
        
        {/* Conteúdo central */}
        <View style={styles.content}>
          <Typography variant="body" style={styles.label}>
            {label}
          </Typography>
          
          {badge !== undefined && (
            <View style={styles.badge}>
              <Typography 
                variant="caption" 
                color={theme.colors.neutral.white}
              >
                {badge}
              </Typography>
            </View>
          )}
        </View>
        
        {/* Ícone direito */}
        <MaterialIcons 
          name={rightIcon} 
          size={24} 
          color={theme.colors.neutral.darkGray} 
        />
      </Animated.View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.s,
    paddingHorizontal: theme.spacing.m,
  },
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: theme.borderRadius.small,
    backgroundColor: `${theme.colors.primary.secondary}10`,
    marginRight: theme.spacing.s,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    flex: 1,
  },
  badge: {
    backgroundColor: theme.colors.primary.secondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: theme.spacing.s,
  },
});

export default MenuItem;