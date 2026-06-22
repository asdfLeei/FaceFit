/**
 * FaceFit - Beauty and Hair Services App
 * Pinkish theme with modern design
 */

import { Platform } from 'react-native';

// Primary pinkish colors
const primaryPink = '#E91E63';
const lightPink = '#F06292';
const darkPink = '#C2185B';
const accentPink = '#FF69B4';

export const PINK = {
  deep: '#7D2550',
  mid: '#C2457A',
  tint: '#FBEAF0',
  accent: '#F4B8D1',
  accentDark: '#E8A0BC',
  white: '#FFFFFF',
  textPrimary: '#1A0A11',
  textMuted: '#9B7B8A',
  border: '#E8D0DA',
  cardBg: '#FAF4F7',
  success: '#2E7D5A',
  successBg: '#E8F5EE',
};
export const Colors = {
  light: {
    text: '#1A1A1A',
    background: '#FFFFFF',
    tint: primaryPink,
    icon: '#E91E63',
    tabIconDefault: '#CCCCCC',
    tabIconSelected: primaryPink,
    primary: primaryPink,
    secondary: lightPink,
    accent: accentPink,
    border: '#F0F0F0',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
  },
  dark: {
    text: '#FFFFFF',
    background: '#121212',
    tint: lightPink,
    icon: '#FF69B4',
    tabIconDefault: '#666666',
    tabIconSelected: lightPink,
    primary: darkPink,
    secondary: primaryPink,
    accent: accentPink,
    border: '#333333',
    success: '#66BB6A',
    warning: '#FFA726',
    error: '#EF5350',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
