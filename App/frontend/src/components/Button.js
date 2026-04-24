import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../theme';

const variants = {
  primary: {
    bg: colors.primary,
    text: colors.textOnPrimary,
    border: colors.primary,
  },
  secondary: {
    bg: colors.secondary,
    text: colors.textOnPrimary,
    border: colors.secondary,
  },
  outline: {
    bg: 'transparent',
    text: colors.primary,
    border: colors.primary,
  },
  ghost: {
    bg: 'transparent',
    text: colors.primary,
    border: 'transparent',
  },
  danger: {
    bg: colors.error,
    text: colors.textOnPrimary,
    border: colors.error,
  },
};

export default function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
}) {
  const v = variants[variant] || variants.primary;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        styles.button,
        { backgroundColor: v.bg, borderColor: v.border },
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.text} size="small" />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, { color: v.text }, textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.lg,
    borderRadius: spacing.radius.md,
    borderWidth: 1.5,
    gap: spacing.sm,
  },
  text: {
    ...typography.button,
  },
  disabled: {
    opacity: 0.5,
  },
});
