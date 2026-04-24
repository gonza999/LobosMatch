import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../theme';
import { Avatar, Loading } from '../../components';
import useMatchStore from '../../store/useMatchStore';
import { getPhotoUrl, formatTime } from '../../utils/helpers';

export default function MatchesScreen({ navigation }) {
  const { matches, isLoadingMatches, fetchMatches } = useMatchStore();

  useEffect(() => {
    fetchMatches();
  }, []);

  const renderMatch = ({ item }) => {
    const user = item.user;
    const photo = getPhotoUrl(user);

    return (
      <TouchableOpacity
        style={styles.matchItem}
        onPress={() =>
          navigation.navigate('Chat', {
            matchId: item._id,
            userName: user?.name,
            userPhoto: photo,
          })
        }
      >
        <Avatar uri={photo} name={user?.name} size={56} />
        <View style={styles.matchInfo}>
          <Text style={styles.matchName}>
            {user?.name}, {user?.age || ''}
          </Text>
          {item.lastMessage?.text ? (
            <Text style={styles.lastMsg} numberOfLines={1}>
              {item.lastMessage.text}
            </Text>
          ) : (
            <Text style={styles.newMatch}>¡Nuevo match! Decí hola 👋</Text>
          )}
        </View>
        {item.lastMessage?.createdAt && (
          <Text style={styles.time}>{formatTime(item.lastMessage.createdAt)}</Text>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoadingMatches && !matches.length) return <Loading />;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Matches</Text>
      {matches.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="heart-outline" size={60} color={colors.textLight} />
          <Text style={styles.emptyText}>Aún no tenés matches</Text>
          <Text style={styles.emptySubtext}>¡Seguí explorando!</Text>
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item) => item._id}
          renderItem={renderMatch}
          contentContainerStyle={styles.list}
          onRefresh={fetchMatches}
          refreshing={isLoadingMatches}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    ...typography.h3,
    color: colors.text,
    textAlign: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  list: { paddingHorizontal: spacing.md },
  matchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: spacing.md,
  },
  matchInfo: { flex: 1 },
  matchName: { ...typography.bodyBold, color: colors.text },
  lastMsg: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  newMatch: { ...typography.caption, color: colors.primary, marginTop: 2 },
  time: { ...typography.small, color: colors.textLight },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  emptyText: { ...typography.body, color: colors.textSecondary },
  emptySubtext: { ...typography.caption, color: colors.textLight },
});
