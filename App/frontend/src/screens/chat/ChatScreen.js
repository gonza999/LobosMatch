import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../theme';
import { Loading } from '../../components';
import useChatStore from '../../store/useChatStore';
import useAuthStore from '../../store/useAuthStore';
import { socketService } from '../../services/socket.service';
import { chatService } from '../../services/chat.service';
import { formatTime } from '../../utils/helpers';
import { MAX_MESSAGE_LENGTH } from '../../utils/constants';

export default function ChatScreen({ route, navigation }) {
  const { matchId, userName } = route.params;
  const { user } = useAuthStore();
  const { messages, fetchMessages, addMessage, markAsRead, typingUsers, setTyping, clearTyping } =
    useChatStore();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [page, setPage] = useState(1);
  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const chatMessages = messages[matchId] || [];

  useEffect(() => {
    navigation.setOptions({ title: userName || 'Chat' });
    fetchMessages(matchId, 1);
    markAsRead(matchId);
    socketService.joinMatch(matchId);

    return () => {
      socketService.leaveMatch(matchId);
    };
  }, [matchId]);

  // Socket listeners
  useEffect(() => {
    const handleNewMessage = ({ matchId: mId, message }) => {
      if (mId === matchId) {
        addMessage(matchId, message);
        markAsRead(matchId);
      }
    };

    const handleTyping = ({ matchId: mId, userId, userName: name }) => {
      if (mId === matchId && userId !== user?._id) {
        setTyping(matchId, userId, name);
      }
    };

    const handleStopTyping = ({ matchId: mId }) => {
      if (mId === matchId) clearTyping(matchId);
    };

    socketService.on('newMessage', handleNewMessage);
    socketService.on('userTyping', handleTyping);
    socketService.on('userStoppedTyping', handleStopTyping);

    return () => {
      socketService.off('newMessage', handleNewMessage);
      socketService.off('userTyping', handleTyping);
      socketService.off('userStoppedTyping', handleStopTyping);
    };
  }, [matchId]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    socketService.stopTyping(matchId);

    try {
      const { data } = await chatService.sendMessage(matchId, trimmed);
      addMessage(matchId, data.message);
      setText('');
    } catch {
      // handle error silently
    }
    setSending(false);
  };

  const handleTextChange = (val) => {
    setText(val);
    socketService.typing(matchId);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketService.stopTyping(matchId);
    }, 2000);
  };

  const loadOlder = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchMessages(matchId, nextPage);
  };

  const typingUser = typingUsers[matchId];

  const renderMessage = useCallback(
    ({ item }) => {
      const isOwn = item.sender === user?._id || item.sender?._id === user?._id;
      return (
        <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
          <Text style={[styles.bubbleText, isOwn && styles.bubbleTextOwn]}>
            {item.text}
          </Text>
          <Text style={[styles.bubbleTime, isOwn && styles.bubbleTimeOwn]}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
      );
    },
    [user?._id]
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={chatMessages}
        keyExtractor={(item) => item._id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        ListHeaderComponent={
          chatMessages.length >= 30 ? (
            <TouchableOpacity onPress={loadOlder} style={styles.loadMore}>
              <Text style={styles.loadMoreText}>Cargar anteriores</Text>
            </TouchableOpacity>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbubble-outline" size={40} color={colors.textLight} />
            <Text style={styles.emptyText}>Enviá el primer mensaje</Text>
          </View>
        }
      />

      {typingUser && (
        <Text style={styles.typingIndicator}>
          {typingUser.userName || 'Alguien'} está escribiendo...
        </Text>
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={handleTextChange}
          placeholder="Escribí un mensaje..."
          placeholderTextColor={colors.textLight}
          maxLength={MAX_MESSAGE_LENGTH}
          multiline
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!text.trim() || sending}
          style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
        >
          <Ionicons
            name="send"
            size={22}
            color={text.trim() && !sending ? colors.primary : colors.textLight}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  messagesList: {
    padding: spacing.md,
    paddingBottom: spacing.xs,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '78%',
    padding: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: spacing.radius.lg,
    marginBottom: spacing.sm,
  },
  bubbleOwn: {
    backgroundColor: colors.primary,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: colors.surface,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  bubbleText: { ...typography.body, color: colors.text },
  bubbleTextOwn: { color: colors.textOnPrimary },
  bubbleTime: { ...typography.small, color: colors.textLight, marginTop: 2, textAlign: 'right' },
  bubbleTimeOwn: { color: 'rgba(255,255,255,0.7)' },
  typingIndicator: {
    ...typography.small,
    color: colors.textSecondary,
    fontStyle: 'italic',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    backgroundColor: colors.card,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: spacing.radius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
  loadMore: { alignItems: 'center', paddingVertical: spacing.sm },
  loadMoreText: { ...typography.captionBold, color: colors.primary },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  emptyText: { ...typography.caption, color: colors.textLight },
});
