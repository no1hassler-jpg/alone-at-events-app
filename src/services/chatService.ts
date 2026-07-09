import {
  addDoc,
  collection,
  doc,
  DocumentData,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Chat, ChatMessage } from '../types/chat';

function chatIdFor(uidA: string, uidB: string): string {
  return [uidA, uidB].sort().join('_');
}

function toMillis(value: Timestamp | number | undefined): number {
  if (!value) return Date.now();
  return typeof value === 'number' ? value : value.toMillis();
}

function toChat(id: string, data: DocumentData): Chat {
  return {
    id,
    participantIds: data.participantIds ?? [],
    participantNames: data.participantNames ?? {},
    lastMessage: data.lastMessage ?? '',
    lastMessageAt: toMillis(data.lastMessageAt),
    createdAt: toMillis(data.createdAt),
  };
}

function toMessage(id: string, data: DocumentData): ChatMessage {
  return {
    id,
    senderId: data.senderId,
    text: data.text,
    createdAt: toMillis(data.createdAt),
  };
}

export async function getOrCreateChat(
  currentUser: { uid: string; name: string },
  otherUser: { uid: string; name: string }
): Promise<string> {
  const chatId = chatIdFor(currentUser.uid, otherUser.uid);
  const chatRef = doc(db, 'chats', chatId);
  const existing = await getDoc(chatRef);
  if (!existing.exists()) {
    await setDoc(chatRef, {
      participantIds: [currentUser.uid, otherUser.uid],
      participantNames: {
        [currentUser.uid]: currentUser.name,
        [otherUser.uid]: otherUser.name,
      },
      lastMessage: '',
      lastMessageAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    });
  }
  return chatId;
}

export function subscribeToChats(uid: string, callback: (chats: Chat[]) => void) {
  const q = query(collection(db, 'chats'), where('participantIds', 'array-contains', uid));
  return onSnapshot(q, (snapshot) => {
    const chats = snapshot.docs
      .map((d) => toChat(d.id, d.data()))
      .sort((a, b) => b.lastMessageAt - a.lastMessageAt);
    callback(chats);
  });
}

export function subscribeToMessages(chatId: string, callback: (messages: ChatMessage[]) => void) {
  const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => toMessage(d.id, d.data())));
  });
}

export async function sendMessage(chatId: string, senderId: string, text: string) {
  const trimmed = text.trim();
  if (!trimmed) return;

  await addDoc(collection(db, 'chats', chatId, 'messages'), {
    senderId,
    text: trimmed,
    createdAt: serverTimestamp(),
  });

  await updateDoc(doc(db, 'chats', chatId), {
    lastMessage: trimmed,
    lastMessageAt: serverTimestamp(),
  });
}
