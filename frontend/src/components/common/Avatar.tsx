import React from 'react';
import {
  View,
  Image,
  StyleSheet,
  StyleProp,
  ViewStyle,
  ImageSourcePropType,
  Text,
} from 'react-native';
import theme from '../../theme';

export type AvatarSize = 'small' | 'medium' | 'large' | number;

export interface AvatarProps {
  source?: ImageSourcePropType;
  name?: string;
  size?: AvatarSize;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
}

const getInitials = (name: string) => {
  if (!name) return '';
  
  const nameParts = name.trim().split(' ');
  
  if (nameParts.length === 1) {
    return nameParts[0].charAt(0).toUpperCase();
  }
  
  return (
    nameParts[0].charAt(0) + 
    nameParts[nameParts.length - 1].charAt(0)
  ).toUpperCase();
};

const getSizeValue = (size: AvatarSize): number => {
  if (typeof size === 'number') return size;
  
  switch (size) {
    case 'small':
      return 32;
    case 'large':
      return 64;
    case 'medium':
    default:
      return 48;
  }
};

const Avatar: React.FC<AvatarProps> = ({
  source,
  name,
  size = 'medium',
  backgroundColor = theme.colors.primary.main,
  style,
}) => {
  const sizeValue = getSizeValue(size);
  const fontSize = sizeValue * 0.4;
  
  const containerStyle = {
    width: sizeValue,
    height: sizeValue,
    borderRadius: sizeValue / 2,
    backgroundColor,
  };

  return (
    <View style={[styles.container, containerStyle, style]}>
      {source ? (
        <Image
          source={source}
          style={styles.image}
          resizeMode="cover"
        />
      ) : name ? (
        <Text style={[styles.initials, { fontSize }]}>
          {getInitials(name)}
        </Text>
      ) : (
        <View style={styles.placeholder} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  initials: {
    color: theme.colors.neutral.white,
    fontFamily: theme.fontFamily.primary,
    fontWeight: '500',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.neutral.mediumGray,
  },
});

export default Avatar;