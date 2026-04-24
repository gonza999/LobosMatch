import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  PanResponder,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../theme';
import { Loading } from '../../components';
import useMatchStore from '../../store/useMatchStore';
import { getPhotoUrl } from '../../utils/helpers';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

function SwipeCard({ profile, onSwipeLeft, onSwipeRight, onSwipeUp }) {
  const position = useRef(new Animated.ValueXY()).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event(
        [null, { dx: position.x, dy: position.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy < -120) {
          // Swipe up → superlike
          Animated.spring(position, {
            toValue: { x: 0, y: -600 },
            useNativeDriver: false,
          }).start(() => onSwipeUp?.());
        } else if (gesture.dx > SWIPE_THRESHOLD) {
          Animated.spring(position, {
            toValue: { x: SCREEN_WIDTH + 100, y: gesture.dy },
            useNativeDriver: false,
          }).start(() => onSwipeRight?.());
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          Animated.spring(position, {
            toValue: { x: -SCREEN_WIDTH - 100, y: gesture.dy },
            useNativeDriver: false,
          }).start(() => onSwipeLeft?.());
        } else {
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            friction: 5,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
  });

  const likeOpacity = position.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const nopeOpacity = position.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const photo = getPhotoUrl(profile);

  return (
    <Animated.View
      style={[
        styles.card,
        {
          transform: [
            { translateX: position.x },
            { translateY: position.y },
            { rotate },
          ],
        },
      ]}
      {...panResponder.panHandlers}
    >
      {photo ? (
        <Image source={{ uri: photo }} style={styles.cardImage} />
      ) : (
        <View style={[styles.cardImage, styles.noPhoto]}>
          <Ionicons name="person" size={80} color={colors.textLight} />
        </View>
      )}

      {/* LIKE stamp */}
      <Animated.View style={[styles.stamp, styles.stampLike, { opacity: likeOpacity }]}>
        <Text style={styles.stampText}>LIKE</Text>
      </Animated.View>

      {/* NOPE stamp */}
      <Animated.View style={[styles.stamp, styles.stampNope, { opacity: nopeOpacity }]}>
        <Text style={[styles.stampText, { color: colors.dislike }]}>NOPE</Text>
      </Animated.View>

      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>
          {profile.name}, {profile.age || ''}
        </Text>
        {profile.bio ? (
          <Text style={styles.cardBio} numberOfLines={2}>
            {profile.bio}
          </Text>
        ) : null}
        {profile.interests?.length > 0 && (
          <View style={styles.interestsRow}>
            {profile.interests.slice(0, 4).map((i, idx) => (
              <View key={idx} style={styles.interestChip}>
                <Text style={styles.interestText}>{i}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </Animated.View>
  );
}

export default function ExploreScreen() {
  const { feed, isLoadingFeed, fetchFeed, like, dislike, superlike, showMatchOverlay, dismissMatchOverlay } =
    useMatchStore();

  useEffect(() => {
    fetchFeed(true);
  }, []);

  const handleSwipeRight = () => {
    if (feed.length > 0) like(feed[0]._id);
  };

  const handleSwipeLeft = () => {
    if (feed.length > 0) dislike(feed[0]._id);
  };

  const handleSwipeUp = () => {
    if (feed.length > 0) superlike(feed[0]._id);
  };

  useEffect(() => {
    if (feed.length <= 2) fetchFeed();
  }, [feed.length]);

  if (isLoadingFeed && feed.length === 0) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Explorar</Text>

      <View style={styles.cardContainer}>
        {feed.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="search" size={60} color={colors.textLight} />
            <Text style={styles.emptyText}>No hay más personas en tu zona</Text>
            <TouchableOpacity onPress={() => fetchFeed(true)}>
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Show top card only */}
            <SwipeCard
              key={feed[0]._id}
              profile={feed[0]}
              onSwipeRight={handleSwipeRight}
              onSwipeLeft={handleSwipeLeft}
              onSwipeUp={handleSwipeUp}
            />
          </>
        )}
      </View>

      {feed.length > 0 && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionDislike]}
            onPress={handleSwipeLeft}
          >
            <Ionicons name="close" size={32} color={colors.dislike} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionSuperlike]}
            onPress={handleSwipeUp}
          >
            <Ionicons name="star" size={28} color={colors.superlike} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionLike]}
            onPress={handleSwipeRight}
          >
            <Ionicons name="heart" size={32} color={colors.like} />
          </TouchableOpacity>
        </View>
      )}

      {/* Match Overlay */}
      {showMatchOverlay && (
        <View style={styles.matchOverlay}>
          <View style={styles.matchContent}>
            <Text style={styles.matchTitle}>🐺 ¡Es un Match!</Text>
            <Text style={styles.matchSubtitle}>
              Tú y {showMatchOverlay.user?.name || 'alguien'} se gustaron mutuamente
            </Text>
            <TouchableOpacity
              style={styles.matchBtn}
              onPress={dismissMatchOverlay}
            >
              <Text style={styles.matchBtnText}>Seguir Explorando</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: SCREEN_WIDTH > 420 ? 380 : SCREEN_WIDTH - 40,
    height: '85%',
    borderRadius: spacing.radius.lg,
    backgroundColor: colors.card,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    position: 'absolute',
  },
  cardImage: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.surface,
  },
  noPhoto: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stamp: {
    position: 'absolute',
    top: 40,
    zIndex: 10,
    borderWidth: 3,
    borderRadius: spacing.radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  stampLike: {
    left: 20,
    borderColor: colors.like,
  },
  stampNope: {
    right: 20,
    borderColor: colors.dislike,
  },
  stampText: {
    ...typography.h2,
    color: colors.like,
    fontWeight: '800',
  },
  cardInfo: {
    padding: spacing.md,
    backgroundColor: colors.card,
  },
  cardName: { ...typography.h3, color: colors.text },
  cardBio: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  interestsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  interestChip: {
    backgroundColor: colors.primaryLight + '30',
    borderRadius: spacing.radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  interestText: { ...typography.small, color: colors.primary },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.md,
  },
  actionBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionDislike: { borderWidth: 1, borderColor: colors.dislike + '40' },
  actionSuperlike: { borderWidth: 1, borderColor: colors.superlike + '40' },
  actionLike: { borderWidth: 1, borderColor: colors.like + '40' },
  empty: { alignItems: 'center', gap: spacing.md },
  emptyText: { ...typography.body, color: colors.textSecondary },
  retryText: { ...typography.captionBold, color: colors.primary },
  matchOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  matchContent: {
    backgroundColor: colors.card,
    borderRadius: spacing.radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    maxWidth: 320,
    width: '90%',
  },
  matchTitle: { ...typography.h1, color: colors.primary, marginBottom: spacing.sm },
  matchSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  matchBtn: {
    backgroundColor: colors.primary,
    borderRadius: spacing.radius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm + 4,
  },
  matchBtnText: { ...typography.button, color: colors.textOnPrimary },
});
