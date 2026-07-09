import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../navigation/types';
import { sendMessage, subscribeToMessages } from '../services/chatService';
import { reportUser } from '../services/reportService';
import { blockUser } from '../services/userService';
import { ChatMessage } from '../types/chat';

type Props = NativeStackScreenProps<RootStackParamList, 'Conversation'>;

export function ConversationScreen({ route, navigation }: Props) {
  const { chatId, otherUserId, otherUserName } = route.params;
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const listRef = useRef<FlatList>(null);

  useEffect(() => subscribeToMessages(chatId, setMessages), [chatId]);

  function handleReportOrBlock() {
    Alert.alert(otherUserName, 'What would you like to do?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'View profile',
        onPress: () => navigation.navigate('UserProfile', { userId: otherUserId }),
      },
      {
        text: 'Report',
        onPress: () => {
          if (!user) return;
          reportUser(user.uid, otherUserId, 'chat', chatId).catch(() => {
            Alert.alert("Couldn't send report", 'Please try again.');
          });
          Alert.alert('Reported', `Thanks for letting us know about ${otherUserName}.`);
        },
      },
      {
        text: 'Block',
        style: 'destructive',
        onPress: () => {
          if (!user) return;
          Alert.alert(`Block ${otherUserName}?`, "They won't be able to message you anymore.", [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Block',
              style: 'destructive',
              onPress: () => {
                blockUser(user.uid, otherUserId)
                  .then(() => navigation.goBack())
                  .catch(() => Alert.alert("Couldn't block user", 'Please try again.'));
              },
            },
          ]);
        },
      },
    ]);
  }

  useLayoutEffect(() => {
    navigation.setOptions({
      title: otherUserName,
      headerRight: () => (
        <Pressable onPress={handleReportOrBlock} hitSlop={12} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>⋯</Text>
        </Pressable>
      ),
    });
  }, [navigation, otherUserName]);

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
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => {
          const isMine = item.senderId === user?.uid;
          return (
            <View style={[styles.bubbleRow, isMine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
              <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
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
  headerButton: {
    paddingHorizontal: 8,
  },
  headerButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
});
