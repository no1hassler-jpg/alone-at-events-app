import { useEffect, useState } from 'react';
import { subscribeToPrivateProfile, subscribeToPublicProfile } from '../services/userService';
import { PrivateProfile, PublicProfile } from '../types/profile';

export function usePublicProfile(uid: string | undefined) {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = subscribeToPublicProfile(uid, (nextProfile) => {
      setProfile(nextProfile);
      setLoading(false);
    });
    return unsubscribe;
  }, [uid]);

  return { profile, loading };
}

// Only ever resolves for the current user's own uid — Firestore rules deny
// reading anyone else's private/data subdocument.
export function usePrivateProfile(uid: string | undefined) {
  const [profile, setProfile] = useState<PrivateProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = subscribeToPrivateProfile(uid, (nextProfile) => {
      setProfile(nextProfile);
      setLoading(false);
    });
    return unsubscribe;
  }, [uid]);

  return { profile, loading };
}
