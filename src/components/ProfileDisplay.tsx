import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { PublicProfile } from '../types/profile';

export function ProfileDisplay({ profile }: { profile: PublicProfile }) {
  const socialEntries = Object.entries(profile.socialLinks).filter(([, value]) => !!value);

  return (
    <View>
      <View style={styles.avatarRow}>
        {profile.photoURL ? (
          <Image source={{ uri: profile.photoURL }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarInitial}>{profile.name.charAt(0).toUpperCase() || '?'}</Text>
          </View>
        )}
        <View style={styles.nameBlock}>
          <Text style={styles.name}>{profile.name || 'Unnamed'}</Text>
          {profile.age && <Text style={styles.age}>{profile.age} years old</Text>}
        </View>
      </View>

      {profile.bio && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>BIO</Text>
          <Text style={styles.bio}>{profile.bio}</Text>
        </View>
      )}

      {profile.musicTags.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>MUSIC TASTE</Text>
          <View style={styles.tagRow}>
            {profile.musicTags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag.toUpperCase()}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {socialEntries.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SOCIAL</Text>
          {socialEntries.map(([platform, handle]) => (
            <Pressable key={platform} onPress={() => Linking.openURL(handle as string)}>
              <Text style={styles.socialLink}>
                {platform.charAt(0).toUpperCase() + platform.slice(1)}: {handle}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginRight: 16,
  },
  avatarPlaceholder: {
    backgroundColor: '#1E2E2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#4ADE80',
    fontSize: 28,
    fontWeight: '800',
  },
  nameBlock: {
    flex: 1,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  age: {
    color: '#8A8A8A',
    fontSize: 14,
    marginTop: 2,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    color: '#8A8A8A',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  bio: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 21,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
  socialLink: {
    color: '#8AB4F8',
    fontSize: 14,
    marginBottom: 6,
  },
});
