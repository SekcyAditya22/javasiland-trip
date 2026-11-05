export const MEDIA_RATIOS = [
  ["16/9", "Lebar · 16:9"],
  ["3/2", "Foto · 3:2"],
  ["4/3", "Klasik · 4:3"],
  ["1/1", "Persegi · 1:1"],
  ["4/5", "Portrait · 4:5"],
];
export const mediaRatio = (settings) =>
  MEDIA_RATIOS.some(([ratio]) => ratio === settings?.ratio)
    ? settings.ratio
    : "16/9";
export const imageFrame = (settings, src) => ({
  x: 50,
  y: 50,
  zoom: 1,
  fit: "cover",
  ...(settings?.items?.find((item) => item.src === src) || {}),
  src,
});
export const imageFrameStyle = (settings, src) => {
  const frame = imageFrame(settings, src);
  return {
    objectFit: frame.fit,
    objectPosition: `${frame.x}% ${frame.y}%`,
    transform: `scale(${frame.zoom})`,
    transformOrigin: `${frame.x}% ${frame.y}%`,
  };
};
export const updateImageFrame = (settings, src, patch) => ({
  ratio: mediaRatio(settings),
  items: [
    ...(settings?.items || []).filter((item) => item.src !== src),
    { ...imageFrame(settings, src), ...patch },
  ],
});
