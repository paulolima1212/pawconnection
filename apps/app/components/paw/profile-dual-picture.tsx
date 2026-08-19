import { Image } from 'expo-image';
import type { ImageSourcePropType } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { PawColors } from '@/constants/paw-styles';

type ProfileDualPictureProps = {
  dogAvatar: ImageSourcePropType;
  humanAvatar: ImageSourcePropType;
};

export function ProfileDualPicture({ dogAvatar, humanAvatar }: ProfileDualPictureProps) {
  return (
    <View style={styles.wrap}>
      <Image source={dogAvatar} style={styles.dog} contentFit="cover" />
      <Image source={humanAvatar} style={styles.human} contentFit="cover" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 62,
    height: 61,
    position: 'relative',
  },
  dog: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1,
    borderColor: PawColors.black,
    backgroundColor: PawColors.fieldGray,
  },
  human: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: PawColors.black,
    backgroundColor: PawColors.fieldGray,
  },
});
