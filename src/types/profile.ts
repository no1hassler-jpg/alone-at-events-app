export interface SocialLinks {
  instagram?: string;
  twitter?: string;
  spotify?: string;
}

// Readable by any signed-in user (see firestore.rules: users/{uid}).
export interface PublicProfile {
  uid: string;
  name: string;
  photoURL?: string;
  age?: number;
  bio?: string;
  musicTags: string[];
  socialLinks: SocialLinks;
  createdAt: number;
}

// Readable only by the profile's own owner (see firestore.rules: users/{uid}/private/{doc}).
export interface PrivateProfile {
  email: string;
  blockedUserIds: string[];
  interestedEventIds: string[];
}

export type UserProfile = PublicProfile & PrivateProfile;
