import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { usePublicProfile } from '../hooks/useUserProfile';
import { RootStackParamList } from '../navigation/types';
import { updateUserProfile, uploadProfilePhoto } from '../services/userService';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

export function EditProfileScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { profile, loading } = usePublicProfile(user?.uid);

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [bio, setBio] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [musicTags, setMusicTags] = useState<string[]>([]);
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [spotify, setSpotify] = useState('');
  const [photoURL, setPhotoURL] = useState<string | undefined>(undefined);
  const [localPhotoUri, setLocalPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    // Firestore's realtime listener re-emits the profile more than once (cache, then
    // server), so this only runs once to avoid clobbering in-progress edits.
    if (!profile || initializedRef.current) return;
    initializedRef.current = true;
    setName(profile.name);
    setAge(profile.age ? String(profile.age) : '');
    setBio(profile.bio ?? '');
    setMusicTags(profile.musicTags);
    setInstagram(profile.socialLinks.instagram ?? '');
    setTwitter(profile.socialLinks.twitter ?? '');
    setSpotify(profile.socialLinks.spotify ?? '');
    setPhotoURL(profile.photoURL);
  }, [profile]);

  async function handlePickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to set a profile photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      setLocalPhotoUri(result.assets[0].uri);
    }
  }

  function addTag() {
    const trimmed = tagInput.trim();
    if (trimmed && !musicTags.includes(trimmed)) {
      setMusicTags([...musicTags, trimmed]);
    }
    setTagInput('');
  }

  function removeTag(tag: string) {
    setMusicTags(musicTags.filter((t) => t !== tag));
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    try {
      let nextPhotoURL = photoURL;
      if (localPhotoUri) {
        nextPhotoURL = await uploadProfilePhoto(user.uid, localPhotoUri);
      }

      await updateUserProfile(user.uid, {
        name: name.trim(),
        age: age ? Number(age) : undefined,
        bio: bio.trim(),
        musicTags,
        socialLinks: {
          instagram: instagram.trim() || undefined,
          twitter: twitter.trim() || undefined,
          spotify: spotify.trim() || undefined,
        },
        photoURL: nextPhotoURL,
      });
      navigation.goBack();
    } catch (err) {
      Alert.alert("Couldn't save profile", err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading || !profile) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#4ADE80" />
      </View>
    );
  }

  const displayedPhoto = localPhotoUri ?? photoURL;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Pressable style={styles.photoPicker} onPress={handlePickPhoto}>
        {displayedPhoto ? (
          <Image source={{ uri: displayedPhoto }} style={styles.photo} />
        ) : (
          <View style={[styles.photo, styles.photoPlaceholder]}>
            <Text style={styles.photoPlaceholderText}>Add photo</Text>
          </View>
        )}
        <Text style={styles.photoHint}>Tap to change</Text>
      </Pressable>

      <Text style={styles.label}>NAME</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholderTextColor="#8A8A8A" />

      <Text style={styles.label}>AGE</Text>
      <TextInput
        style={styles.input}
        value={age}
        onChangeText={setAge}
        keyboardType="number-pad"
        placeholderTextColor="#8A8A8A"
      />

      <Text style={styles.label}>BIO</Text>
      <TextInput
        style={[styles.input, styles.bioInput]}
        value={bio}
        onChangeText={setBio}
        multiline
        placeholder="Tell people what you're about"
        placeholderTextColor="#8A8A8A"
      />

      <Text style={styles.label}>MUSIC TASTE</Text>
      <View style={styles.tagRow}>
        {musicTags.map((tag) => (
          <Pressable key={tag} style={styles.tag} onPress={() => removeTag(tag)}>
            <Text style={styles.tagText}>{tag.toUpperCase()} ✕</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.tagInputRow}>
        <TextInput
          style={[styles.input, styles.tagInputField]}
          value={tagInput}
          onChangeText={setTagInput}
          placeholder="e.g. Techno"
          placeholderTextColor="#8A8A8A"
          onSubmitEditing={addTag}
          returnKeyType="done"
        />
        <Pressable style={styles.addTagButton} onPress={addTag}>
          <Text style={styles.addTagButtonText}>ADD</Text>
        </Pressable>
      </View>

      <Text style={styles.label}>INSTAGRAM</Text>
      <TextInput
        style={styles.input}
        value={instagram}
        onChangeText={setInstagram}
        placeholder="https://instagram.com/you"
        placeholderTextColor="#8A8A8A"
        autoCapitalize="none"
      />

      <Text style={styles.label}>TWITTER / X</Text>
      <TextInput
        style={styles.input}
        value={twitter}
        onChangeText={setTwitter}
        placeholder="https://x.com/you"
        placeholderTextColor="#8A8A8A"
        autoCapitalize="none"
      />

      <Text style={styles.label}>SPOTIFY</Text>
      <TextInput
        style={styles.input}
        value={spotify}
        onChangeText={setSpotify}
        placeholder="https://open.spotify.com/user/you"
        placeholderTextColor="#8A8A8A"
        autoCapitalize="none"
      />

      <Pressable
        style={({ pressed }) => [styles.saveButton, pressed && styles.saveButtonPressed]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#0D0D0D" />
        ) : (
          <Text style={styles.saveButtonText}>SAVE</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPicker: {
    alignItems: 'center',
    marginBottom: 24,
  },
  photo: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  photoPlaceholder: {
    backgroundColor: '#161616',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderText: {
    color: '#8A8A8A',
    fontSize: 12,
  },
  photoHint: {
    color: '#4ADE80',
    fontSize: 12,
    marginTop: 8,
    fontWeight: '600',
  },
  label: {
    color: '#8A8A8A',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#161616',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#2A2A2A',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 15,
  },
  bioInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 3,
    backgroundColor: '#1E2E2A',
  },
  tagText: {
    color: '#4ADE80',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  tagInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tagInputField: {
    flex: 1,
  },
  addTagButton: {
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#161616',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#2A2A2A',
  },
  addTagButtonText: {
    color: '#4ADE80',
    fontSize: 12,
    fontWeight: '700',
  },
  saveButton: {
    backgroundColor: '#4ADE80',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 28,
  },
  saveButtonPressed: {
    opacity: 0.85,
  },
  saveButtonText: {
    color: '#0D0D0D',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
