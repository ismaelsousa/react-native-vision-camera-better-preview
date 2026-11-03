import { type ReactNode, useCallback, useMemo, useState } from 'react';
import {
  type LayoutChangeEvent,
  type StyleProp,
  StyleSheet,
  View,
  type ViewProps,
  type ViewStyle,
} from 'react-native';

type Size = {
  width: number;
  height: number;
};

export type AspectRatioContentLayoutProps = {
  /** Width divided by height for the content frame. */
  aspectRatio: number;
  /** Content rendered above the frame when space permits, or inside it otherwise. */
  top?: ReactNode;
  /** Content rendered below the frame when space permits, or inside it otherwise. */
  bottom?: ReactNode;
  /** Main content rendered inside the aspect-ratio frame. */
  children?: ReactNode;
  /** Optional style for the aspect-ratio frame. */
  frameStyle?: StyleProp<ViewStyle>;
  /** Optional style for the layout's outer container. */
  style?: StyleProp<ViewStyle>;
};

function getContainedSize(container: Size, aspectRatio: number): Size {
  const containerAspectRatio = container.width / container.height;

  if (containerAspectRatio > aspectRatio) {
    return {
      width: container.height * aspectRatio,
      height: container.height,
    };
  }

  return {
    width: container.width,
    height: container.width / aspectRatio,
  };
}

/**
 * Centers an aspect-ratio frame and uses the vertical space around it for the
 * top and bottom slots. If those slots do not fit, they move inside the frame.
 */
export function AspectRatioContentLayout({
  aspectRatio,
  bottom,
  children,
  frameStyle,
  style,
  top,
}: AspectRatioContentLayoutProps) {
  const [containerSize, setContainerSize] = useState<Size>();
  const [topHeight, setTopHeight] = useState(0);
  const [bottomHeight, setBottomHeight] = useState(0);

  const frameSize = useMemo(
    () =>
      containerSize == null
        ? undefined
        : getContainedSize(containerSize, aspectRatio),
    [aspectRatio, containerSize]
  );

  const handleContainerLayout = useCallback(
    ({ nativeEvent }: LayoutChangeEvent) => {
      const { height, width } = nativeEvent.layout;

      setContainerSize((current) =>
        current?.height === height && current.width === width
          ? current
          : { height, width }
      );
    },
    []
  );

  const handleTopLayout = useCallback(({ nativeEvent }: LayoutChangeEvent) => {
    setTopHeight(nativeEvent.layout.height);
  }, []);

  const handleBottomLayout = useCallback(
    ({ nativeEvent }: LayoutChangeEvent) => {
      setBottomHeight(nativeEvent.layout.height);
    },
    []
  );

  const availableOuterHeight =
    containerSize != null && frameSize != null
      ? containerSize.height - frameSize.height
      : 0;
  const renderSlotsInside = topHeight + bottomHeight > availableOuterHeight;

  return (
    <BoxNoneView
      style={[styles.container, style]}
      onLayout={handleContainerLayout}
    >
      {containerSize != null && frameSize != null ? (
        <BoxNoneView
          style={[
            styles.frameColumn,
            { height: containerSize.height, width: frameSize.width },
          ]}
        >
          {!renderSlotsInside ? (
            <BoxNoneView onLayout={handleTopLayout}>{top}</BoxNoneView>
          ) : null}

          <BoxNoneView style={[styles.frame, frameSize, frameStyle]}>
            {renderSlotsInside ? (
              <BoxNoneView
                style={styles.slotInsideTop}
                onLayout={handleTopLayout}
              >
                {top}
              </BoxNoneView>
            ) : null}

            <BoxNoneView style={styles.content}>{children}</BoxNoneView>

            {renderSlotsInside ? (
              <BoxNoneView
                style={styles.slotInsideBottom}
                onLayout={handleBottomLayout}
              >
                {bottom}
              </BoxNoneView>
            ) : null}
          </BoxNoneView>

          {!renderSlotsInside ? (
            <BoxNoneView onLayout={handleBottomLayout}>{bottom}</BoxNoneView>
          ) : null}
        </BoxNoneView>
      ) : null}
    </BoxNoneView>
  );
}

const BoxNoneView = (props: ViewProps) => (
  <View {...props} pointerEvents="box-none" />
);

export const TopWrapperView = BoxNoneView;
export const BottomWrapperView = BoxNoneView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  frameColumn: {
    justifyContent: 'space-between',
  },
  frame: {
    overflow: 'hidden',
    position: 'relative',
  },
  slotInsideBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  slotInsideTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  content: {
    flex: 1,
  },
});
