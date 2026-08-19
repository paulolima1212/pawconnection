import { StyleSheet, Text, View } from 'react-native';

import { PawColors, PawFontSize, PawLineHeight } from '@/constants/paw-styles';

export function ProfileTipBanner() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.text}>
        💡 Keep your profile updated to connect better with the pet community
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: PawColors.profileTipBg,
    borderWidth: 1,
    borderColor: PawColors.reactionLavender,
    borderRadius: 16,
    paddingHorizontal: 17,
    paddingVertical: 17,
  },
  text: {
    fontSize: 13,
    lineHeight: 21.125,
    fontWeight: '400',
    color: 'rgba(51,32,21,0.7)',
    textAlign: 'center',
  },
});
