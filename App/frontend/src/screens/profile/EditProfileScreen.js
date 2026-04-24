import React, { useState, useEffect } from 'react';
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
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../theme';
import { Button, Input } from '../../components';
import useUserStore from '../../store/useUserStore';
import { MAX_BIO_LENGTH, MAX_PHOTOS, GENDERS } from '../../utils/constants';

export default function EditProfileScreen({ navigation }) {
  const { profile, updateProfile, uploadPhoto, deletePhoto, isLoading } = useUserStore();

  const [name, setName] = useState(profile?.name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [interests, setInterests] = useState((profile?.interests || []).join(', '));
  const [genderPreference, setGenderPreference] = useState(profile?.genderPreference || []);
  const [uploading, setUploading] = useState(false);

  const photos = profile?.photos || [];

  const handleSave = async () => {
    try {
      const parsed = interests
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      await updateProfile({
        name: name.trim(),
        bio: bio.trim(),
        interests: parsed,
        genderPreference,
      });
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'No se pudo guardar');
    }
  };

  const handlePickImage = async () => {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert('Límite', `Máximo ${MAX_PHOTOS} fotos`);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [3, 4],
    });

    if (result.canceled) return;

    setUploading(true);
    try {
      const asset = result.assets[0];
      const formData = new FormData();

      if (Platform.OS === 'web') {
        const resp = await fetch(asset.uri);
        const blob = await resp.blob();
        formData.append('photo', blob, 'photo.jpg');
      } else {
        formData.append('photo', {
          uri: asset.uri,
          type: 'image/jpeg',
          name: 'photo.jpg',
        });
      }

      await uploadPhoto(formData);
    } catch {
      Alert.alert('Error', 'No se pudo subir la foto');
    }
    setUploading(false);
  };

  const handleDeletePhoto = (photoId) => {
    if (photos.length <= 1) {
      Alert.alert('Error', 'Debes tener al menos una foto');
      return;
    }
    Alert.alert('Eliminar foto', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deletePhoto(photoId) },
    ]);
  };

  const togglePref = (val) => {
    setGenderPreference((prev) =>
      prev.includes(val) ? prev.filter((g) => g !== val) : [...prev, val]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Fotos</Text>
      <View style={styles.photosGrid}>
        {photos
          .sort((a, b) => a.order - b.order)
          .map((p) => (
            <View key={p.publicId || p._id} style={styles.photoWrapper}>
              <Image source={{ uri: p.url }} style={styles.photoThumb} />
              <TouchableOpacity
                style={styles.deletePhotoBtn}
                onPress={() => handleDeletePhoto(p.publicId || p._id)}
              >
                <Ionicons name="close-circle" size={22} color={colors.error} />
              </TouchableOpacity>
            </View>
          ))}
        {photos.length < MAX_PHOTOS && (
          <TouchableOpacity style={styles.addPhoto} onPress={handlePickImage} disabled={uploading}>
            <Ionicons
              name={uploading ? 'hourglass' : 'add'}
              size={32}
              color={colors.textLight}
            />
          </TouchableOpacity>
        )}
      </View>

      <Input
        label="Nombre"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
      />

      <Input
        label="Bio"
        value={bio}
        onChangeText={setBio}
        multiline
        maxLength={MAX_BIO_LENGTH}
        placeholder="Contá algo sobre vos..."
      />

      <Input
        label="Intereses (separados por coma)"
        value={interests}
        onChangeText={setInterests}
        placeholder="Música, viajes, cocina..."
      />

      <Text style={styles.sectionTitle}>¿A quién buscás?</Text>
      <View style={styles.chips}>
        {GENDERS.map((g) => (
          <TouchableOpacity
            key={g.value}
            onPress={() => togglePref(g.value)}
            style={[styles.chip, genderPreference.includes(g.value) && styles.chipActive]}
          >
            <Text
              style={[styles.chipText, genderPreference.includes(g.value) && styles.chipTextActive]}
            >
              {g.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Button
        title="Guardar"
        onPress={handleSave}
        loading={isLoading}
        style={styles.saveBtn}
      />
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
  sectionTitle: {
    ...typography.captionBold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  photoWrapper: { position: 'relative' },
  photoThumb: {
    width: 96,
    height: 128,
    borderRadius: spacing.radius.md,
    backgroundColor: colors.surface,
  },
  deletePhotoBtn: { position: 'absolute', top: -6, right: -6 },
  addPhoto: {
    width: 96,
    height: 128,
    borderRadius: spacing.radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chips: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...typography.caption, color: colors.text },
  chipTextActive: { color: colors.textOnPrimary },
  saveBtn: { marginTop: spacing.lg },
});
