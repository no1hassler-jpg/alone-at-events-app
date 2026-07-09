import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

export type ReportContext = 'profile' | 'chat';

export async function reportUser(
  reporterId: string,
  reportedUserId: string,
  context: ReportContext,
  chatId?: string
) {
  await addDoc(collection(db, 'reports'), {
    reporterId,
    reportedUserId,
    context,
    chatId: chatId ?? null,
    createdAt: serverTimestamp(),
  });
}
