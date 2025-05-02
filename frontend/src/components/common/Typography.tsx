import React from 'react';
import { Text, TextProps, StyleSheet, StyleProp, TextStyle } from 'react-native';
import theme from '../../theme';

export type TypographyVariant = 
  | 'h1' 
  | 'h2' 
  | 'h3' 
  | 'h4' 
  | 'body' 
  | 'bodySecondary' 
  | 'small';

export interface TypographyProps extends TextProps {
  variant?: TypographyVariant;
  color?: string;
  center?: boolean;
  style?: StyleProp<TextStyle>;
  children: React.ReactNode;
}

const Typography: React.FC<TypographyProps> = ({
  variant = 'body',
  color,
  center = false,
  style,
  children,
  ...rest
}) => {
  const textStyles = [
    styles[variant],
    color && { color },
    center && styles.center,
    style,
  ];

  return (
    <Text style={textStyles} {...rest}>
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  h1: {
    fontSize: theme.typography.h1.fontSize,
    fontFamily: theme.fontFamily.primary,
    fontWeight: theme.typography.h1.fontWeight,
    color: theme.typography.h1.color,
    lineHeight: theme.typography.h1.lineHeight,
  },
  h2: {
    fontSize: theme.typography.h2.fontSize,
    fontFamily: theme.fontFamily.primary,
    fontWeight: theme.typography.h2.fontWeight,
    color: theme.typography.h2.color,
    lineHeight: theme.typography.h2.lineHeight,
  },
  h3: {
    fontSize: theme.typography.h3.fontSize,
    fontFamily: theme.fontFamily.primary,
    fontWeight: theme.typography.h3.fontWeight,
    color: theme.typography.h3.color,
    lineHeight: theme.typography.h3.lineHeight,
  },
  h4: {
    fontSize: theme.typography.h4.fontSize,
    fontFamily: theme.fontFamily.primary,
    fontWeight: theme.typography.h4.fontWeight,
    color: theme.typography.h4.color,
    lineHeight: theme.typography.h4.lineHeight,
  },
  body: {
    fontSize: theme.typography.body.fontSize,
    fontFamily: theme.fontFamily.primary,
    fontWeight: theme.typography.body.fontWeight,
    color: theme.typography.body.color,
    lineHeight: theme.typography.body.lineHeight,
  },
  bodySecondary: {
    fontSize: theme.typography.bodySecondary.fontSize,
    fontFamily: theme.fontFamily.primary,
    fontWeight: theme.typography.bodySecondary.fontWeight,
    color: theme.typography.bodySecondary.color,
    lineHeight: theme.typography.bodySecondary.lineHeight,
  },
  small: {
    fontSize: theme.typography.small.fontSize,
    fontFamily: theme.fontFamily.primary,
    fontWeight: theme.typography.small.fontWeight,
    color: theme.typography.small.color,
    lineHeight: theme.typography.small.lineHeight,
  },
  center: {
    textAlign: 'center',
  },
});

export default Typography;