import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { colors, typography, spacing } from '../../theme';
import { Button, Input } from '../../components';
import useAuthStore from '../../store/useAuthStore';
import { GENDERS } from '../../utils/constants';

export default function RegisterScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    birthDate: '',
    gender: '',
    genderPreference: [],
    bio: '',
  });
  const [errors, setErrors] = useState({});
  const { register, isLoading, error, clearError } = useAuthStore();

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    clearError();
  };

  const togglePref = (val) => {
    setForm((prev) => {
      const prefs = prev.genderPreference.includes(val)
        ? prev.genderPreference.filter((g) => g !== val)
        : [...prev.genderPreference, val];
      return { ...prev, genderPreference: prefs };
    });
  };

  const validateStep1 = () => {
    const errs = {};
    if (!form.name.trim() || form.name.trim().length < 2)
      errs.name = 'Nombre de al menos 2 caracteres';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email))
      errs.email = 'Email no válido';
    if (!form.password || form.password.length < 6)
      errs.password = 'Mínimo 6 caracteres';
    if (!/\d/.test(form.password))
      errs.password = 'Debe contener al menos 1 número';
    if (form.password !== form.confirmPassword)
      errs.confirmPassword = 'Las contraseñas no coinciden';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs = {};
    // Validate birthDate as YYYY-MM-DD
    const date = new Date(form.birthDate);
    if (!form.birthDate || isNaN(date.getTime())) {
      errs.birthDate = 'Fecha no válida (AAAA-MM-DD)';
    } else {
      const age = Math.floor((Date.now() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      if (age < 18) errs.birthDate = 'Debes ser mayor de 18 años';
    }
    if (!form.gender) errs.gender = 'Seleccioná tu género';
    if (!form.genderPreference.length)
      errs.genderPreference = 'Seleccioná al menos una preferencia';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
  };

  const handleRegister = async () => {
    if (!validateStep2()) return;
    clearError();
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        birthDate: form.birthDate,
        gender: form.gender,
        genderPreference: form.genderPreference,
      });
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
        <Text style={styles.title}>Crear Cuenta</Text>
        <Text style={styles.stepLabel}>Paso {step} de 2</Text>

        {step === 1 && (
          <View style={styles.form}>
            <Input
              label="Nombre"
              value={form.name}
              onChangeText={(v) => set('name', v)}
              placeholder="Tu nombre"
              autoCapitalize="words"
              error={errors.name}
            />
            <Input
              label="Email"
              value={form.email}
              onChangeText={(v) => set('email', v)}
              placeholder="tu@email.com"
              keyboardType="email-address"
              error={errors.email}
            />
            <Input
              label="Contraseña"
              value={form.password}
              onChangeText={(v) => set('password', v)}
              placeholder="Mínimo 6 caracteres"
              secureTextEntry
              error={errors.password}
            />
            <Input
              label="Confirmar Contraseña"
              value={form.confirmPassword}
              onChangeText={(v) => set('confirmPassword', v)}
              placeholder="Repetí tu contraseña"
              secureTextEntry
              error={errors.confirmPassword}
            />
            <Button title="Siguiente" onPress={handleNext} style={styles.btn} />
          </View>
        )}

        {step === 2 && (
          <View style={styles.form}>
            <Input
              label="Fecha de Nacimiento"
              value={form.birthDate}
              onChangeText={(v) => set('birthDate', v)}
              placeholder="AAAA-MM-DD"
              error={errors.birthDate}
            />

            <Text style={styles.fieldLabel}>Género</Text>
            <View style={styles.chips}>
              {GENDERS.map((g) => (
                <TouchableOpacity
                  key={g.value}
                  onPress={() => set('gender', g.value)}
                  style={[
                    styles.chip,
                    form.gender === g.value && styles.chipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      form.gender === g.value && styles.chipTextActive,
                    ]}
                  >
                    {g.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}

            <Text style={styles.fieldLabel}>¿A quién buscás?</Text>
            <View style={styles.chips}>
              {GENDERS.map((g) => (
                <TouchableOpacity
                  key={g.value}
                  onPress={() => togglePref(g.value)}
                  style={[
                    styles.chip,
                    form.genderPreference.includes(g.value) && styles.chipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      form.genderPreference.includes(g.value) && styles.chipTextActive,
                    ]}
                  >
                    {g.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.genderPreference && (
              <Text style={styles.errorText}>{errors.genderPreference}</Text>
            )}

            {error && <Text style={styles.apiError}>{error}</Text>}

            <View style={styles.stepButtons}>
              <Button
                title="Atrás"
                variant="outline"
                onPress={() => setStep(1)}
                style={styles.halfBtn}
              />
              <Button
                title="Registrarse"
                onPress={handleRegister}
                loading={isLoading}
                style={styles.halfBtn}
              />
            </View>
          </View>
        )}

        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          style={styles.loginLink}
        >
          <Text style={styles.loginText}>
            ¿Ya tenés cuenta? <Text style={styles.loginBold}>Iniciá sesión</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    flexGrow: 1,
    padding: spacing.lg,
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
    paddingTop: spacing.xxl,
  },
  title: { ...typography.h2, color: colors.text, textAlign: 'center' },
  stepLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  form: {},
  fieldLabel: {
    ...typography.captionBold,
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: { ...typography.caption, color: colors.text },
  chipTextActive: { color: colors.textOnPrimary },
  errorText: {
    ...typography.small,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  apiError: {
    ...typography.small,
    color: colors.error,
    textAlign: 'center',
    marginVertical: spacing.sm,
  },
  btn: { marginTop: spacing.md },
  stepButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  halfBtn: { flex: 1 },
  loginLink: { alignItems: 'center', marginTop: spacing.lg },
  loginText: { ...typography.caption, color: colors.textSecondary },
  loginBold: { color: colors.primary, fontWeight: '600' },
});
