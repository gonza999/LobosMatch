import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { colors, typography, spacing } from '../../theme';
import { Button, Input } from '../../components';
import useAuthStore from '../../store/useAuthStore';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const { login, isLoading, error, clearError } = useAuthStore();

  const validate = () => {
    const errs = {};
    if (!email.trim()) errs.email = 'Email requerido';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Email no válido';
    if (!password) errs.password = 'Contraseña requerida';
    else if (password.length < 6) errs.password = 'Mínimo 6 caracteres';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async () => {
    clearError();
    if (!validate()) return;
    try {
      await login(email.trim().toLowerCase(), password);
    } catch {
      // error shown via store
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Image
            source={require('../../../assets/favicon.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.title}>LobosMatch</Text>
          <Text style={styles.subtitle}>Encontrá a alguien especial</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="tu@email.com"
            keyboardType="email-address"
            error={errors.email}
          />
          <Input
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            placeholder="Tu contraseña"
            secureTextEntry
            error={errors.password}
          />

          {error && <Text style={styles.apiError}>{error}</Text>}

          <Button
            title="Iniciar Sesión"
            onPress={handleLogin}
            loading={isLoading}
            style={styles.loginBtn}
          />
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('Register')}
          style={styles.registerLink}
        >
          <Text style={styles.registerText}>
            ¿No tenés cuenta?{' '}
            <Text style={styles.registerBold}>Registrate</Text>
          </Text>
        </TouchableOpacity>

        <Text style={styles.creator}>Creador: Gonzalo Misciagna</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logo: { fontSize: 64, marginBottom: spacing.sm },
  logoImage: { width: 80, height: 80, marginBottom: spacing.sm },
  title: { ...typography.h1, color: colors.primary },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  form: {
    marginBottom: spacing.lg,
  },
  apiError: {
    ...typography.small,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  loginBtn: {
    marginTop: spacing.sm,
  },
  registerLink: {
    alignItems: 'center',
  },
  registerText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  registerBold: {
    color: colors.primary,
    fontWeight: '600',
  },
  creator: {
    ...typography.small,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: spacing.xl,
    fontSize: 11,
  },
});
