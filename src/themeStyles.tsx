import React, { useEffect } from 'react';
import { useTheme } from './ThemeContext';

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
    });

    // Also set color variables by index for components that don't need named colors
    activeTheme.colors.forEach((color, index) => {
      root.style.setProperty(`--theme-color-${index + 1}`, color.hex);
    });

    // Set the primary and secondary colors for convenience
    if (activeTheme.colors.length > 0) root.style.setProperty('--primary-color', activeTheme.colors[0].hex);
    if (activeTheme.colors.length > 1) root.style.setProperty('--secondary-color', activeTheme.colors[1].hex);
    if (activeTheme.colors.length > 2) root.style.setProperty('--tertiary-color', activeTheme.colors[2].hex);
    if (activeTheme.colors.length > 3) root.style.setProperty('--quaternary-color', activeTheme.colors[3].hex);
    if (activeTheme.colors.length > 4) root.style.setProperty('--quinary-color', activeTheme.colors[4].hex);

    // Set theme name as a data attribute for potential CSS targeting
    document.body.setAttribute('data-theme', activeTheme.name.toLowerCase().replace(/\s+/g, '-'));
  }, [activeTheme]);

  // This component doesn't render anything
  return null;
};

export default ThemeStyles; 