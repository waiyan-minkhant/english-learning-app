export const colors = {
  primary: "#FF6715",
  primaryForeground: "#FFFFFF",
  brandBackground: "#FFF2EB",
  brandGradientFrom: "#FFF2EB",
  brandGradientTo: "#FFFCFA",
  lockedGradientFrom: "#ECECEC",
  lockedGradientTo: "#F8F8F8",
  background: "#F5F5F5",
  surface: "#FFFFFF",
  surfaceSecondary: "#FCFDFD",
  muted: "#EFF0F0",
  foreground: "#282A2A",
  mutedForeground: "#646868",
  border: "#EFF0F0",
  borderStrong: "#505353",
  icon: "#505353",
  iconOnBrand: "#FFFFFF",
  success: "#00CC44",
  successForeground: "#00AD3A",
  danger: "#CC0000",
  dangerForeground: "#AD0000",
  warning: "#FF6715"
} as const;

export type ColorToken = keyof typeof colors;
