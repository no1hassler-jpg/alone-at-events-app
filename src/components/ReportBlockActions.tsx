import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { blockUser } from '../services/userService';
import { reportUser, ReportContext } from '../services/reportService';

export function ReportBlockActions({
  currentUid,
  targetUid,
  targetName,
  context,
  chatId,
  onBlocked,
}: {
  currentUid: string;
  targetUid: string;
  targetName: string;
  context: ReportContext;
  chatId?: string;
  onBlocked?: () => void;
}) {
  function handleReport() {
    Alert.alert(
      `Report ${targetName}?`,
      "We'll review this. It won't be visible to them.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          style: 'destructive',
          onPress: () => {
            reportUser(currentUid, targetUid, context, chatId).catch(() => {
              Alert.alert("Couldn't send report", 'Please try again.');
            });
            Alert.alert('Reported', `Thanks for letting us know about ${targetName}.`);
          },
        },
      ]
    );
  }

  function handleBlock() {
    Alert.alert(
      `Block ${targetName}?`,
      "They won't be able to message you anymore.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: () => {
            blockUser(currentUid, targetUid)
              .then(() => onBlocked?.())
              .catch(() => {
                Alert.alert("Couldn't block user", 'Please try again.');
              });
          },
        },
      ]
    );
  }

  return (
    <View style={styles.row}>
      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        onPress={handleReport}
      >
        <Text style={styles.buttonText}>Report</Text>
      </Pressable>
      <Pressable
        style={({ pressed }) => [styles.button, styles.blockButton, pressed && styles.buttonPressed]}
        onPress={handleBlock}
      >
        <Text style={[styles.buttonText, styles.blockButtonText]}>Block</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#161616',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#2A2A2A',
  },
  buttonPressed: {
    opacity: 0.7,
  },
  blockButton: {
    backgroundColor: '#3A1414',
    borderColor: '#3A1414',
  },
  buttonText: {
    color: '#B7B7B7',
    fontSize: 13,
    fontWeight: '700',
  },
  blockButtonText: {
    color: '#FF5C5C',
  },
});
