import React, { useEffect } from 'react';
import { useTheme } from './ThemeContext';

// Calculate the relative luminance of a color for contrast calculations
const getLuminance = (hexColor: string): number => {
  // Remove # if present
  const hex = hexColor.replace('#', '');
  
  // Convert hex to RGB
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;
  
  // Calculate luminance using the formula for relative luminance
  const R = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  const G = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  const B = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
  
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
};

// Get contrasting text color (black or white) based on background color
const getContrastTextColor = (hexColor: string): string => {
  const luminance = getLuminance(hexColor);
  // Use white text for dark backgrounds, black text for light backgrounds
  // 0.5 is a common threshold, but adjust if needed for better contrast
  return luminance > 0.5 ? '#000000' : '#ffffff';
};

// This component doesn't render anything visual
// It just applies CSS variables to the :root element based on the active theme
const ThemeStyles: React.FC = () => {
  const { activeTheme } = useTheme();

  useEffect(() => {
    // Get the document root element
    const root = document.documentElement;

    // Apply each color from the active theme as a CSS variable
    activeTheme.colors.forEach((color) => {
      // Convert color name to kebab-case for CSS variable naming
      const cssVarName = color.name
        .toLowerCase()
        .replace(/\s+/g, '-');
      
      // Set the CSS variable
      root.style.setProperty(`--color-${cssVarName}`, color.hex);
      
      // Also set a contrasting text color for this background
      root.style.setProperty(`--text-on-${cssVarName}`, getContrastTextColor(color.hex));
    });

    // Also set color variables by index for components that don't need named colors
    activeTheme.colors.forEach((color, index) => {
      root.style.setProperty(`--theme-color-${index + 1}`, color.hex);
      // Set contrasting text colors for each theme color
      root.style.setProperty(`--text-on-theme-color-${index + 1}`, getContrastTextColor(color.hex));
    });

    // Set the primary and secondary colors for convenience
    if (activeTheme.colors.length > 0) {
      root.style.setProperty('--primary-color', activeTheme.colors[0].hex);
      root.style.setProperty('--text-on-primary', getContrastTextColor(activeTheme.colors[0].hex));
    }
    if (activeTheme.colors.length > 1) {
      root.style.setProperty('--secondary-color', activeTheme.colors[1].hex);
      root.style.setProperty('--text-on-secondary', getContrastTextColor(activeTheme.colors[1].hex));
    }
    if (activeTheme.colors.length > 2) {
      root.style.setProperty('--tertiary-color', activeTheme.colors[2].hex);
      root.style.setProperty('--text-on-tertiary', getContrastTextColor(activeTheme.colors[2].hex));
    }
    if (activeTheme.colors.length > 3) {
      root.style.setProperty('--quaternary-color', activeTheme.colors[3].hex);
      root.style.setProperty('--text-on-quaternary', getContrastTextColor(activeTheme.colors[3].hex));
    }
    if (activeTheme.colors.length > 4) {
      root.style.setProperty('--quinary-color', activeTheme.colors[4].hex);
      root.style.setProperty('--text-on-quinary', getContrastTextColor(activeTheme.colors[4].hex));
    }

    // Set theme name as a data attribute for potential CSS targeting
    document.body.setAttribute('data-theme', activeTheme.name.toLowerCase().replace(/\s+/g, '-'));
  }, [activeTheme]);

  // This component doesn't render anything
  return null;
};

export default ThemeStyles; 