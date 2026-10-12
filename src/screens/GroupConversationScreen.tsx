import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { usePublicProfile } from '../hooks/useUserProfile';
import { RootStackParamList } from '../navigation/types';
import { getOrCreateChat, sendMessage, subscribeToChat, subscribeToMessages } from '../services/chatService';
import { reportUser } from '../services/reportService';
import { blockUser } from '../services/userService';
import { Chat, ChatMessage } from '../types/chat';

type Props = NativeStackScreenProps<RootStackParamList, 'GroupConversation'>;

export function GroupConversationScreen({ route, navigation }: Props) {
  const { chatId } = route.params;
  const { user } = useAuth();
  const { profile: myProfile } = usePublicProfile(user?.uid);
  const insets = useSafeAreaInsets();
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [openingChatFor, setOpeningChatFor] = useState<string | null>(null);
  const listRef = useRef<FlatList>(null);

  useEffect(() => subscribeToChat(chatId, setChat), [chatId]);
  useEffect(() => subscribeToMessages(chatId, setMessages), [chatId]);

  const members = Object.entries(chat?.participantNames ?? {}).map(([uid, name]) => ({ uid, name }));

  async function handleOpenDirectChat(member: { uid: string; name: string }) {
    if (!user || !myProfile) return;
    setOpeningChatFor(member.uid);
    try {
      const directChatId = await getOrCreateChat(
        { uid: user.uid, name: myProfile.name },
        { uid: member.uid, name: member.name }
      );
      navigation.navigate('Conversation', {
        chatId: directChatId,
        otherUserId: member.uid,
        otherUserName: member.name,
      });
    } catch {
      Alert.alert("Couldn't start chat", 'Please try again.');
    } finally {
      setOpeningChatFor(null);
    }
  }

  function handleReportOrBlockMember(member: { uid: string; name: string }) {
    if (!user) return;
    Alert.alert(member.name, 'What would you like to do?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Report',
        onPress: () => {
          reportUser(user.uid, member.uid, 'chat', chatId).catch(() => {
            Alert.alert("Couldn't send report", 'Please try again.');
          });
          Alert.alert('Reported', `Thanks for letting us know about ${member.name}.`);
        },
      },
      {
        text: 'Block',
        style: 'destructive',
        onPress: () => {
          Alert.alert(`Block ${member.name}?`, "They won't be able to message you anymore.", [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Block',
              style: 'destructive',
              onPress: () => {
                blockUser(user.uid, member.uid).catch(() => {
                  Alert.alert("Couldn't block user", 'Please try again.');
                });
              },
            },
          ]);
        },
      },
    ]);
  }

  async function handleSend() {
    if (!user || !text.trim()) return;
    const toSend = text;
    setText('');
    await sendMessage(chatId, user.uid, toSend);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top}
    >
      <View style={styles.membersSection}>
        <Text style={styles.membersLabel}>MEMBERS ({members.length})</Text>
        <ScrollView style={styles.membersList}>
          {members.map((member) => {
            const isSelf = member.uid === user?.uid;
            return (
              <View key={member.uid} style={styles.memberRow}>
                <Pressable
                  style={styles.memberRowMain}
                  onPress={() => handleOpenDirectChat(member)}
                  disabled={isSelf || openingChatFor === member.uid}
                >
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitial}>{member.name.charAt(0).toUpperCase() || '?'}</Text>
                  </View>
                  <Text style={styles.memberName}>
                    {member.name}
                    {isSelf ? ' (You)' : ''}
                  </Text>
                </Pressable>
                {!isSelf && (
                  <Pressable
                    style={styles.kebabButton}
                    onPress={() => handleReportOrBlockMember(member)}
                    hitSlop={12}
                  >
                    <Text style={styles.kebabText}>⋯</Text>
                  </Pressable>
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => {
          const isMine = item.senderId === user?.uid;
          const senderName = chat?.participantNames[item.senderId];
          return (
            <View style={[styles.bubbleRow, isMine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
              <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
                {!isMine && senderName && <Text style={styles.senderLabel}>{senderName}</Text>}
                <Text style={styles.bubbleText}>{item.text}</Text>
              </View>
            </View>
          );
        }}
      />

      <View style={[styles.inputRow, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Message"
          placeholderTextColor="#8A8A8A"
          multiline
        />
        <Pressable style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.sendButtonText}>SEND</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  membersSection: {
    maxHeight: 160,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2A2A2A',
    paddingTop: 12,
  },
  membersLabel: {
    color: '#8A8A8A',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  membersList: {
    maxHeight: 130,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  memberRowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E2E2A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarInitial: {
    color: '#4ADE80',
    fontSize: 13,
    fontWeight: '800',
  },
  memberName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  kebabButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  kebabText: {
    color: '#8A8A8A',
    fontSize: 18,
    fontWeight: '800',
  },
  listContent: {
    padding: 16,
  },
  bubbleRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bubbleRowMine: {
    justifyContent: 'flex-end',
  },
  bubbleRowTheirs: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  bubbleMine: {
    backgroundColor: '#245C3B',
  },
  bubbleTheirs: {
    backgroundColor: '#161616',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#2A2A2A',
  },
  senderLabel: {
    color: '#4ADE80',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  bubbleText: {
    color: '#FFFFFF',
    fontSize: 15,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#2A2A2A',
  },
  input: {
    flex: 1,
    backgroundColor: '#161616',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#2A2A2A',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#4ADE80',
  },
  sendButtonText: {
    color: '#0D0D0D',
    fontSize: 12,
    fontWeight: '800',
  },
});
