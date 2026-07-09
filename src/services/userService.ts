import {
  arrayRemove,
  arrayUnion,
  doc,
  DocumentData,
  getDoc,
  onSnapshot,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { PrivateProfile, PublicProfile } from '../types/profile';

function privateDocRef(uid: string) {
  return doc(db, 'users', uid, 'private', 'data');
}

function toPublicProfile(uid: string, data: DocumentData): PublicProfile {
  return {
    uid,
    name: data.name ?? '',
    photoURL: data.photoURL,
    age: data.age,
    bio: data.bio,
    musicTags: data.musicTags ?? [],
    socialLinks: data.socialLinks ?? {},
    createdAt: data.createdAt ?? Date.now(),
  };
}

function toPrivateProfile(data: DocumentData): PrivateProfile {
  return {
    email: data.email ?? '',
    blockedUserIds: data.blockedUserIds ?? [],
    interestedEventIds: data.interestedEventIds ?? [],
  };
}

export async function createUserProfile(uid: string, { name, email }: { name: string; email: string }) {
  const emailLower = email.trim().toLowerCase();
  const batch = writeBatch(db);

  batch.set(doc(db, 'users', uid), {
    name,
    musicTags: [],
    socialLinks: {},
    createdAt: Date.now(),
  });
  batch.set(privateDocRef(uid), {
    email: emailLower,
    blockedUserIds: [],
    interestedEventIds: [],
  });
  batch.set(doc(db, 'emailLookup', emailLower), { uid });

  await batch.commit();
}

export async function getPublicProfile(uid: string): Promise<PublicProfile | null> {
  const snapshot = await getDoc(doc(db, 'users', uid));
  if (!snapshot.exists()) return null;
  return toPublicProfile(uid, snapshot.data());
}

export function subscribeToPublicProfile(uid: string, callback: (profile: PublicProfile | null) => void) {
  return onSnapshot(doc(db, 'users', uid), (snapshot) => {
    callback(snapshot.exists() ? toPublicProfile(uid, snapshot.data()) : null);
  });
}

export function subscribeToPrivateProfile(uid: string, callback: (profile: PrivateProfile | null) => void) {
  return onSnapshot(privateDocRef(uid), (snapshot) => {
    callback(snapshot.exists() ? toPrivateProfile(snapshot.data()) : null);
  });
}

// Firestore's updateDoc throws if any field (including nested object fields) is
// undefined, but optional profile fields naturally end up undefined when left blank.
function stripUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(stripUndefinedDeep) as unknown as T;
  }
  if (value && typeof value === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      if (nested !== undefined) {
        cleaned[key] = stripUndefinedDeep(nested);
      }
    }
    return cleaned as T;
  }
  return value;
}

export async function updateUserProfile(uid: string, updates: Partial<PublicProfile>) {
  await updateDoc(doc(db, 'users', uid), stripUndefinedDeep(updates));
}

export async function uploadProfilePhoto(uid: string, localUri: string): Promise<string> {
  const response = await fetch(localUri);
  const blob = await response.blob();
  const photoRef = ref(storage, `profilePhotos/${uid}.jpg`);
  await uploadBytes(photoRef, blob);
  return getDownloadURL(photoRef);
}

export async function findUserByEmail(email: string): Promise<PublicProfile | null> {
  const lookupSnapshot = await getDoc(doc(db, 'emailLookup', email.trim().toLowerCase()));
  if (!lookupSnapshot.exists()) return null;
  const uid = lookupSnapshot.data().uid as string;
  return getPublicProfile(uid);
}

export async function confirmEventInterest(uid: string, eventId: string) {
  await updateDoc(privateDocRef(uid), {
    interestedEventIds: arrayUnion(eventId),
  });
}

export async function blockUser(currentUid: string, blockedUid: string) {
  await updateDoc(privateDocRef(currentUid), {
    blockedUserIds: arrayUnion(blockedUid),
  });
}

export async function unblockUser(currentUid: string, blockedUid: string) {
  await updateDoc(privateDocRef(currentUid), {
    blockedUserIds: arrayRemove(blockedUid),
  });
}
