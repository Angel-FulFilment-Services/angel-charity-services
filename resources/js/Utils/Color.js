// Color utility functions for theme generation
import { get } from 'lodash';
import { getColors, replaceColor } from 'lottie-colorify';

// Function to convert hex to RGB
export const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

// Function to generate color scale from base color (theme-600)
export const generateColorScale = (baseColor) => {
  let rgb;
  
  // Parse input color
  if (typeof baseColor === 'string' && baseColor.startsWith('#')) {
    rgb = hexToRgb(baseColor);
  } else if (typeof baseColor === 'string' && baseColor.includes(',')) {
    const [r, g, b] = baseColor.split(',').map(n => parseInt(n.trim()));
    rgb = { r, g, b };
  } else if (Array.isArray(baseColor)) {
    rgb = { r: baseColor[0], g: baseColor[1], b: baseColor[2] };
  } else {
    return null; // Invalid color format
  }

  // Generate lighter shades (50-500)
  const lighten = (color, factor) => ({
    r: Math.min(255, Math.round(color.r + (255 - color.r) * factor)),
    g: Math.min(255, Math.round(color.g + (255 - color.g) * factor)),
    b: Math.min(255, Math.round(color.b + (255 - color.b) * factor))
  });

  // Generate darker shades (700-900)
  const darken = (color, factor) => ({
    r: Math.max(0, Math.round(color.r * (1 - factor))),
    g: Math.max(0, Math.round(color.g * (1 - factor))),
    b: Math.max(0, Math.round(color.b * (1 - factor)))
  });

  return {
    50: lighten(rgb, 0.95),
    100: lighten(rgb, 0.9),
    200: lighten(rgb, 0.75),
    300: lighten(rgb, 0.6),
    400: lighten(rgb, 0.3),
    500: lighten(rgb, 0.1),
    600: rgb, // Base color
    700: darken(rgb, 0.2),
    800: darken(rgb, 0.4),
    900: darken(rgb, 0.6)
  };
};

// Function to inject theme colors into the page
export const injectThemeColors = (colorScale) => {
  if (!colorScale) return;
  
  const style = document.createElement('style');
  style.innerHTML = `
    :root {
      --theme-50: ${colorScale[50].r} ${colorScale[50].g} ${colorScale[50].b};
      --theme-100: ${colorScale[100].r} ${colorScale[100].g} ${colorScale[100].b};
      --theme-200: ${colorScale[200].r} ${colorScale[200].g} ${colorScale[200].b};
      --theme-300: ${colorScale[300].r} ${colorScale[300].g} ${colorScale[300].b};
      --theme-400: ${colorScale[400].r} ${colorScale[400].g} ${colorScale[400].b};
      --theme-500: ${colorScale[500].r} ${colorScale[500].g} ${colorScale[500].b};
      --theme-600: ${colorScale[600].r} ${colorScale[600].g} ${colorScale[600].b};
      --theme-700: ${colorScale[700].r} ${colorScale[700].g} ${colorScale[700].b};
      --theme-800: ${colorScale[800].r} ${colorScale[800].g} ${colorScale[800].b};
      --theme-900: ${colorScale[900].r} ${colorScale[900].g} ${colorScale[900].b};
    }
  `;
  style.id = 'custom-theme-override';
  
  // Remove existing override if present
  const existing = document.getElementById('custom-theme-override');
  if (existing) {
    existing.remove();
  }
  
  document.head.appendChild(style);
};

// Function to replace colours Lottie animation data
export const replaceAnimationColors = (sourceColors, targetColors, animationData) => {
    if (!sourceColors || !targetColors || !animationData) return animationData;

    // Get the unique colours in the animation, ensure we only have the unique colors
    const animationColors = sourceColors.map(c => c.join(','));
    const uniqueAnimationColors = [...new Set(animationColors)];

    // Create a mapping of target to source colors
    const colorMap = {};
    uniqueAnimationColors.forEach((src, index) => {
        if (targetColors[index]) {
            colorMap[src] = targetColors[index].join(',');
        }
    });

    // Apply the color replacements, ensuring colors are in [r, g, b] format
    Object.entries(colorMap).forEach(([source, target]) => {
        // Convert comma-separated strings back to [r, g, b] arrays
        const sourceRgb = source.split(',').map(Number);
        const targetRgb = target.split(',').map(Number);

        animationData = replaceColor(sourceRgb, targetRgb, animationData);
    });

    return animationData;
};