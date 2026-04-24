import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { colors, typography, spacing } from '../../theme';
import { Button } from '../../components';
import useUserStore from '../../store/useUserStore';
import useAuthStore from '../../store/useAuthStore';
import { userService } from '../../services/user.service';

export default function SettingsScreen({ navigation }) {
  const { profile, updateSettings } = useUserStore();
  const { logout } = useAuthStore();

  const [maxDistance, setMaxDistance] = useState(profile?.settings?.maxDistance || 25);
  const [ageMin, setAgeMin] = useState(profile?.settings?.ageRange?.min || 18);
  const [ageMax, setAgeMax] = useState(profile?.settings?.ageRange?.max || 50);
  const [showMe, setShowMe] = useState(profile?.settings?.showMe !== false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings({
        maxDistance,
        ageRange: { min: ageMin, max: ageMax },
        showMe,
      });
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'No se pudo guardar');
    }
    setSaving(false);
  };

  const handleDeleteAccount = async () => {
    const doDelete = async () => {
      try {
        await userService.deleteAccount();
        await logout();
      } catch {
        if (Platform.OS === 'web') window.alert('No se pudo eliminar la cuenta');
        else Alert.alert('Error', 'No se pudo eliminar la cuenta');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Esta acción es irreversible. ¿Estás seguro?')) doDelete();
    } else {
      Alert.alert('Eliminar Cuenta', 'Esta acción es irreversible. ¿Estás seguro?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Distancia Máxima</Text>
        <View style={styles.row}>
          <Button
            title="-"
            variant="outline"
            onPress={() => setMaxDistance(Math.max(1, maxDistance - 5))}
            style={styles.stepper}
          />
          <Text style={styles.value}>{maxDistance} km</Text>
          <Button
            title="+"
            variant="outline"
            onPress={() => setMaxDistance(Math.min(50, maxDistance + 5))}
            style={styles.stepper}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rango de Edad</Text>
        <View style={styles.row}>
          <Button
            title="-"
            variant="outline"
            onPress={() => setAgeMin(Math.max(18, ageMin - 1))}
            style={styles.stepper}
          />
          <Text style={styles.value}>{ageMin}</Text>
          <Button
            title="+"
            variant="outline"
            onPress={() => setAgeMin(Math.min(ageMax, ageMin + 1))}
            style={styles.stepper}
          />
          <Text style={styles.dash}>—</Text>
          <Button
            title="-"
            variant="outline"
            onPress={() => setAgeMax(Math.max(ageMin, ageMax - 1))}
            style={styles.stepper}
          />
          <Text style={styles.value}>{ageMax}</Text>
          <Button
            title="+"
            variant="outline"
            onPress={() => setAgeMax(Math.min(99, ageMax + 1))}
            style={styles.stepper}
          />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.switchRow}>
          <Text style={styles.sectionTitle}>Mostrar mi perfil</Text>
          <Switch
            value={showMe}
            onValueChange={setShowMe}
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={showMe ? colors.primary : colors.textLight}
          />
        </View>
        <Text style={styles.hint}>
          Si lo desactivás, no aparecerás en la exploración de otros usuarios
        </Text>
      </View>

      <Button
        title="Guardar Configuración"
        onPress={handleSave}
        loading={saving}
        style={styles.saveBtn}
      />

      <View style={styles.dangerZone}>
        <Text style={styles.dangerTitle}>Zona de peligro</Text>
        <Button
          title="Eliminar Cuenta"
          variant="danger"
          onPress={handleDeleteAccount}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    padding: spacing.lg,
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: spacing.xxl,
  },
  section: { marginBottom: spacing.lg },
  sectionTitle: { ...typography.captionBold, color: colors.textSecondary, marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  value: { ...typography.bodyBold, color: colors.text, minWidth: 40, textAlign: 'center' },
  dash: { ...typography.body, color: colors.textLight },
  stepper: { width: 40, paddingHorizontal: 0 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hint: { ...typography.small, color: colors.textLight, marginTop: spacing.xs },
  saveBtn: { marginTop: spacing.md },
  dangerZone: {
    marginTop: spacing.xxl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dangerTitle: { ...typography.captionBold, color: colors.error, marginBottom: spacing.md },
});
