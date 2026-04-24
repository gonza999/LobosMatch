import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../theme';
import { Button, Loading } from '../../components';
import useAuthStore from '../../store/useAuthStore';
import useUserStore from '../../store/useUserStore';
import { getPhotoUrl } from '../../utils/helpers';

export default function ProfileScreen({ navigation }) {
  const { logout } = useAuthStore();
  const { profile, fetchProfile, isLoading } = useUserStore();

  useEffect(() => {
    fetchProfile();
  }, []);

  if (isLoading && !profile) return <Loading />;

  const photo = getPhotoUrl(profile);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.photoSection}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.photo} />
        ) : (
          <View style={[styles.photo, styles.noPhoto]}>
            <Ionicons name="person" size={60} color={colors.textLight} />
          </View>
        )}
        <Text style={styles.name}>
          {profile?.name}, {profile?.age || ''}
        </Text>
      </View>

      {profile?.bio ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bio</Text>
          <Text style={styles.sectionText}>{profile.bio}</Text>
        </View>
      ) : null}

      {profile?.interests?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Intereses</Text>
          <View style={styles.chips}>
            {profile.interests.map((i, idx) => (
              <View key={idx} style={styles.chip}>
                <Text style={styles.chipText}>{i}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.actions}>
        <Button
          title="Editar Perfil"
          onPress={() => navigation.navigate('EditProfile')}
          style={styles.actionBtn}
        />
        <Button
          title="Configuración"
          variant="outline"
          onPress={() => navigation.navigate('Settings')}
          style={styles.actionBtn}
        />
        <Button
          title="Cerrar Sesión"
          variant="ghost"
          onPress={() => {
            if (Platform.OS === 'web') {
              if (window.confirm('¿Estás seguro de cerrar sesión?')) logout();
            } else {
              Alert.alert('Cerrar Sesión', '¿Estás seguro?', [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Salir', onPress: logout, style: 'destructive' },
              ]);
            }
          }}
          style={styles.actionBtn}
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
  },
  photoSection: { alignItems: 'center', marginBottom: spacing.lg },
  photo: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  noPhoto: { alignItems: 'center', justifyContent: 'center' },
  name: { ...typography.h2, color: colors.text },
  section: { marginBottom: spacing.lg },
  sectionTitle: { ...typography.captionBold, color: colors.textSecondary, marginBottom: spacing.xs },
  sectionText: { ...typography.body, color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    backgroundColor: colors.primaryLight + '30',
    borderRadius: spacing.radius.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
  },
  chipText: { ...typography.small, color: colors.primary },
  actions: { gap: spacing.sm, marginTop: spacing.md },
  actionBtn: {},
});
