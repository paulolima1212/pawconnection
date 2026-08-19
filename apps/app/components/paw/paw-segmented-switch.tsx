import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';

import { PawColors, PawFontSize, PawLayout, PawLineHeight } from '@/constants/paw-styles';

export type PawSegmentedSwitchTab<T extends string> = {
  id: T;
  label: string;
};

type PawSegmentedSwitchVariant = 'feed' | 'inbox' | 'profile';

type PawSegmentedSwitchProps<T extends string> = {
  tabs: readonly PawSegmentedSwitchTab<T>[];
  value: T;
  onChange: (value: T) => void;
  variant?: PawSegmentedSwitchVariant;
  /** Fixed track width (feed toggle). Full width when omitted. */
  width?: number;
};

const SPRING = { useNativeDriver: true, friction: 9, tension: 80 } as const;

const VARIANTS: Record<
  PawSegmentedSwitchVariant,
  {
    trackHeight: number;
    padding: number;
    borderWidth: number;
    thumbRadius: number;
    trackRadius: number;
    fixedWidth?: number;
    labelSize: number;
    labelLineHeight: number;
    labelWeight: '300' | '600';
    activeLabelWeight: '300' | '400' | '600' | '800';
    inactiveLabelColor: string;
    thumbBorderWidth: number;
  }
> = {
  feed: {
    trackHeight: 41,
    padding: 3,
    borderWidth: 1,
    thumbRadius: PawLayout.borderRadiusPill,
    trackRadius: 20,
    fixedWidth: 180,
    labelSize: PawFontSize.body,
    labelLineHeight: PawLineHeight.body,
    labelWeight: '300',
    activeLabelWeight: '300',
    inactiveLabelColor: PawColors.toggleInactive,
    thumbBorderWidth: 1,
  },
  inbox: {
    trackHeight: 41,
    padding: 3,
    borderWidth: 1,
    thumbRadius: 17.5,
    trackRadius: 20,
    labelSize: PawFontSize.small,
    labelLineHeight: PawLineHeight.small,
    labelWeight: '300',
    activeLabelWeight: '400',
    inactiveLabelColor: PawColors.toggleInactive,
    thumbBorderWidth: 1,
  },
  profile: {
    trackHeight: 58.5,
    padding: 6,
    borderWidth: 2,
    thumbRadius: 16,
    trackRadius: 20,
    labelSize: PawFontSize.body,
    labelLineHeight: PawLineHeight.small + 4.5,
    labelWeight: '600',
    activeLabelWeight: '600',
    inactiveLabelColor: PawColors.toggleInactive,
    thumbBorderWidth: 2,
  },
};

export function PawSegmentedSwitch<T extends string>({
  tabs,
  value,
  onChange,
  variant = 'inbox',
  width: widthProp,
}: PawSegmentedSwitchProps<T>) {
  const config = VARIANTS[variant];
  const slide = useRef(new Animated.Value(0)).current;
  const [trackWidth, setTrackWidth] = useState(config.fixedWidth ?? widthProp ?? 0);

  const activeIndex = Math.max(
    0,
    tabs.findIndex((tab) => tab.id === value),
  );
  const activeTab = tabs[activeIndex] ?? tabs[0];

  const thumbWidth =
    trackWidth > 0 ? (trackWidth - config.padding * 2) / tabs.length : 0;

  const onTrackLayout = (event: LayoutChangeEvent) => {
    if (config.fixedWidth ?? widthProp) return;
    setTrackWidth(event.nativeEvent.layout.width);
  };

  useEffect(() => {
    if (thumbWidth <= 0) return;
    Animated.spring(slide, {
      ...SPRING,
      toValue: activeIndex * thumbWidth,
    }).start();
  }, [activeIndex, thumbWidth, slide]);

  const fixedWidth = config.fixedWidth ?? widthProp;
  const trackStyle = useMemo(
    () => [
      styles.track,
      fixedWidth ? { width: fixedWidth } : styles.trackFullWidth,
      {
        height: config.trackHeight,
        padding: config.padding,
        borderRadius: config.trackRadius,
        borderWidth: config.borderWidth,
      },
    ],
    [config, fixedWidth],
  );

  return (
    <View
      style={[styles.wrap, fixedWidth ? { width: fixedWidth } : styles.wrapFull]}
      accessibilityRole="tablist"
      onLayout={onTrackLayout}>
      <View style={trackStyle}>
        <View style={styles.bgLabels} pointerEvents="none">
          {tabs.map((tab) => (
            <View key={tab.id} style={styles.ghostCell}>
              <Text
                style={[
                  styles.ghostLabel,
                  {
                    fontSize: config.labelSize,
                    lineHeight: config.labelLineHeight,
                    fontWeight: config.labelWeight,
                    color: config.inactiveLabelColor,
                  },
                  tab.id === value && styles.ghostLabelHidden,
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.65}>
                {tab.label}
              </Text>
            </View>
          ))}
        </View>

        {thumbWidth > 0 ? (
          <Animated.View
            style={[
              styles.thumb,
              {
                width: thumbWidth,
                height: config.trackHeight - config.padding * 2,
                top: config.padding,
                left: config.padding,
                borderRadius: config.thumbRadius,
                borderWidth: config.thumbBorderWidth,
                transform: [{ translateX: slide }],
              },
            ]}>
            <Text
              style={[
                styles.thumbLabel,
                {
                  fontSize: config.labelSize,
                  lineHeight: config.labelLineHeight,
                  fontWeight: config.activeLabelWeight,
                },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.65}>
              {activeTab.label}
            </Text>
          </Animated.View>
        ) : null}

        <View style={styles.hitLayer}>
          {tabs.map((tab) => (
            <Pressable
              key={tab.id}
              style={styles.hitCell}
              onPress={() => onChange(tab.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab.id === value }}
              accessibilityLabel={tab.label}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexShrink: 0,
  },
  wrapFull: {
    alignSelf: 'stretch',
    width: '100%',
  },
  track: {
    position: 'relative',
    backgroundColor: PawColors.toggleTrack,
    borderColor: PawColors.toggleBorder,
    overflow: 'hidden',
  },
  trackFullWidth: {
    width: '100%',
  },
  bgLabels: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ghostCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  ghostLabel: {
    textAlign: 'center',
  },
  ghostLabelHidden: {
    opacity: 0,
  },
  thumb: {
    position: 'absolute',
    backgroundColor: PawColors.reactionLavender,
    borderColor: PawColors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbLabel: {
    color: PawColors.black,
    textAlign: 'center',
  },
  hitLayer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  hitCell: {
    flex: 1,
  },
});
