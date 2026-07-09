import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { usePublicProfile } from '../hooks/useUserProfile';
import { RootStackParamList } from '../navigation/types';
import { getOrCreateChat, subscribeToChats } from '../services/chatService';
import { findUserByEmail } from '../services/userService';
import { Chat } from '../types/chat';

function timeAgo(millis: number): string {
  if (!millis) return '';
  const diffMinutes = Math.round((Date.now() - millis) / 60000);
  if (diffMinutes < 1) return 'now';
  if (diffMinutes < 60) return `${diffMinutes}m`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h`;
  return `${Math.round(diffHours / 24)}d`;
}

export function ChatListScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { profile: myProfile } = usePublicProfile(user?.uid);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [chats, setChats] = useState<Chat[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!user) return;
    return subscribeToChats(user.uid, setChats);
  }, [user]);

  async function handleStartChat() {
    if (!user || !myProfile) return;
    setStarting(true);
    try {
      const otherUser = await findUserByEmail(email);
      if (!otherUser) {
        Alert.alert('No user found', `No account found for ${email}.`);
        return;
      }
      if (otherUser.uid === user.uid) {
        Alert.alert("That's you", 'Enter someone else\'s email to start a chat.');
        return;
      }
      const chatId = await getOrCreateChat(
        { uid: user.uid, name: myProfile.name },
        { uid: otherUser.uid, name: otherUser.name }
      );
      setModalVisible(false);
      setEmail('');
      navigation.navigate('Conversation', {
        chatId,
        otherUserId: otherUser.uid,
        otherUserName: otherUser.name,
      });
    } catch {
      Alert.alert("Couldn't start chat", 'Please try again.');
    } finally {
      setStarting(false);
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>CHATS</Text>
        <Pressable style={styles.newChatButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.newChatButtonText}>+ NEW</Text>
        </Pressable>
      </View>

      {chats.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No conversations yet.</Text>
          <Text style={styles.emptySubtext}>Start one from someone's profile, or tap + New.</Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const otherUid = item.participantIds.find((id) => id !== user?.uid) ?? '';
            const otherName = item.participantNames[otherUid] ?? 'Unknown';
            return (
              <Pressable
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                onPress={() =>
                  navigation.navigate('Conversation', {
                    chatId: item.id,
                    otherUserId: otherUid,
                    otherUserName: otherName,
                  })
                }
              >
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>{otherName.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.name}>{otherName}</Text>
                  <Text style={styles.lastMessage} numberOfLines={1}>
                    {item.lastMessage || 'Say hello 👋'}
                  </Text>
                </View>
                <Text style={styles.time}>{timeAgo(item.lastMessageAt)}</Text>
              </Pressable>
            );
          }}
        />
      )}

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Start a new chat</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Their email"
              placeholderTextColor="#8A8A8A"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <View style={styles.modalButtonRow}>
              <Pressable
                style={styles.modalCancelButton}
                onPress={() => {
                  setModalVisible(false);
                  setEmail('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalStartButton} onPress={handleStartChat} disabled={starting}>
                {starting ? (
                  <ActivityIndicator color="#0D0D0D" />
                ) : (
                  <Text style={styles.modalStartText}>Start</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  newChatButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#161616',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#2A2A2A',
  },
  newChatButtonText: {
    color: '#4ADE80',
    fontSize: 12,
    fontWeight: '700',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtext: {
    color: '#8A8A8A',
    fontSize: 13,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2A2A2A',
  },
  rowPressed: {
    backgroundColor: '#161616',
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E2E2A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarInitial: {
    color: '#4ADE80',
    fontSize: 16,
    fontWeight: '800',
  },
  rowText: {
    flex: 1,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  lastMessage: {
    color: '#8A8A8A',
    fontSize: 13,
  },
  time: {
    color: '#8A8A8A',
    fontSize: 11,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#161616',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#2A2A2A',
    padding: 20,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 14,
  },
  modalInput: {
    backgroundColor: '#0D0D0D',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#2A2A2A',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 15,
    marginBottom: 16,
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#8A8A8A',
    fontSize: 14,
    fontWeight: '700',
  },
  modalStartButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#4ADE80',
  },
  modalStartText: {
    color: '#0D0D0D',
    fontSize: 14,
    fontWeight: '800',
  },
});
