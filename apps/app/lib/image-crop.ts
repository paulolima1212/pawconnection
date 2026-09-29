export type CropRect = {
  originX: number;
  originY: number;
  width: number;
  height: number;
};

export type CropFrame = {
  scale: number;
  translateX: number;
  translateY: number;
  viewport: number;
  imageWidth: number;
  imageHeight: number;
};

export function coverScale(imageWidth: number, imageHeight: number, viewport: number): number {
  'worklet';
  if (imageWidth <= 0 || imageHeight <= 0 || viewport <= 0) return 1;
  return Math.max(viewport / imageWidth, viewport / imageHeight);
}

export function clampTranslation(
  translateX: number,
  translateY: number,
  scale: number,
  viewport: number,
  imageWidth: number,
  imageHeight: number,
): { translateX: number; translateY: number } {
  'worklet';
  const safeScale = Math.max(scale, 1);
  const base = coverScale(imageWidth, imageHeight, viewport);
  const displayW = imageWidth * base * safeScale;
  const displayH = imageHeight * base * safeScale;
  const maxX = Math.max(0, (displayW - viewport) / 2);
  const maxY = Math.max(0, (displayH - viewport) / 2);
  return {
    translateX: Math.min(maxX, Math.max(-maxX, translateX)),
    translateY: Math.min(maxY, Math.max(-maxY, translateY)),
  };
}

export function cropRectFromFrame(frame: CropFrame): CropRect {
  const scale = Math.max(frame.scale, 1);
  const clamped = clampTranslation(
    frame.translateX,
    frame.translateY,
    scale,
    frame.viewport,
    frame.imageWidth,
    frame.imageHeight,
  );
  const base = coverScale(frame.imageWidth, frame.imageHeight, frame.viewport);
  const displayW = frame.imageWidth * base * scale;
  const displayH = frame.imageHeight * base * scale;
  const left = (frame.viewport - displayW) / 2 + clamped.translateX;
  const top = (frame.viewport - displayH) / 2 + clamped.translateY;
  const pixelsPerScreen = base * scale;
  const originX = -left / pixelsPerScreen;
  const originY = -top / pixelsPerScreen;
  const size = frame.viewport / pixelsPerScreen;
  return finalizeCropRect(
    { originX, originY, width: size, height: size },
    frame.imageWidth,
    frame.imageHeight,
  );
}

export function finalizeCropRect(
  rect: CropRect,
  imageWidth: number,
  imageHeight: number,
): CropRect {
  const maxSide = Math.max(1, Math.floor(Math.min(imageWidth, imageHeight)));
  const side = Math.max(1, Math.min(maxSide, Math.round(Math.min(rect.width, rect.height))));
  const originX = Math.min(
    Math.max(0, Math.round(rect.originX)),
    Math.max(0, imageWidth - side),
  );
  const originY = Math.min(
    Math.max(0, Math.round(rect.originY)),
    Math.max(0, imageHeight - side),
  );
  return { originX, originY, width: side, height: side };
}
