/**
 * Resolves the active palette from the device colour scheme.
 *
 * Components take a palette rather than checking the theme themselves,
 * which keeps them pure enough to render under either scheme in tests.
 */

import { useColorScheme } from 'react-native';
import { palettes, type Palette } from './tokens';

export function useTheme(): { palette: Palette; isDark: boolean } {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  return { palette: isDark ? palettes.dark : palettes.light, isDark };
}
