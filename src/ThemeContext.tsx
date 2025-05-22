import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { themes } from './case-closed-themes';
import axios from 'axios';

// Define the theme type
export type Color = {
  name: string;
  hex: string;
};

export type Theme = {
  name: string;
  description: string;
  colors: Color[];
};

// Theme context type
type ThemeContextType = {
  activeTheme: Theme;
  setActiveTheme: (theme: Theme) => void;
  availableThemes: Theme[];
  addCustomTheme: (theme: Theme) => void;
  removeTheme: (themeName: string) => void;
  customThemes: Theme[];
};

// Create context with default values
const ThemeContext = createContext<ThemeContextType>({
  activeTheme: themes[0],
  setActiveTheme: () => {},
  availableThemes: themes,
  addCustomTheme: () => {},
  removeTheme: () => {},
  customThemes: []
});

// Provider component
export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTheme, setActiveTheme] = useState<Theme>(themes[0]);
  const [customThemes, setCustomThemes] = useState<Theme[]>([]);

  // Load custom themes from localStorage on mount
  useEffect(() => {
    try {
      const storedThemes = localStorage.getItem('customThemes');
      if (storedThemes) {
        setCustomThemes(JSON.parse(storedThemes));
      }
    } catch (err) {
      console.error('Error loading custom themes:', err);
    }
  }, []);

  // Save custom themes to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem('customThemes', JSON.stringify(customThemes));
    } catch (err) {
      console.error('Error saving custom themes:', err);
    }
  }, [customThemes]);

  // Function to add a new custom theme
  const addCustomTheme = (theme: Theme) => {
    // Check if a theme with the same name already exists
    const exists = [...themes, ...customThemes].some(t => t.name === theme.name);
    if (exists) {
      console.warn(`Theme with name "${theme.name}" already exists. Theme not added.`);
      return;
    }
    setCustomThemes(prev => [...prev, theme]);
  };

  // Function to remove a theme (both custom and built-in)
  const removeTheme = (themeName: string) => {
    // Check if this is a built-in theme
    const isBuiltIn = themes.some(t => t.name === themeName);
    
    if (isBuiltIn) {
      // For built-in themes, we don't actually remove them from the themes array
      // Instead, we'll add them to a "hidden themes" list in localStorage
      const hiddenThemes: string[] = JSON.parse(localStorage.getItem('hiddenThemes') || '[]');
      if (!hiddenThemes.includes(themeName)) {
        hiddenThemes.push(themeName);
        localStorage.setItem('hiddenThemes', JSON.stringify(hiddenThemes));
      }
    } else {
      // For custom themes, remove them from the customThemes state
      setCustomThemes(prev => prev.filter(t => t.name !== themeName));
    }
    
    // If this is the active theme, switch to another available theme
    if (activeTheme.name === themeName) {
      // Find the first non-hidden theme
      const hiddenThemes: string[] = JSON.parse(localStorage.getItem('hiddenThemes') || '[]');
      const availableTheme = [...themes, ...customThemes].find(t => 
        t.name !== themeName && !hiddenThemes.includes(t.name)
      );
      
      if (availableTheme) {
        setActiveTheme(availableTheme);
      } else {
        // If all themes are hidden/deleted, reset hidden themes and use the first built-in
        localStorage.setItem('hiddenThemes', '[]');
        setActiveTheme(themes[0]);
      }
    }
  };

  useEffect(() => {
    async function fetchGlobalTheme() {
      try {
        const response = await axios.get('/api/global-theme');
        if (response.data && response.data.name && response.data.colors) {
          setActiveTheme(response.data);
          
          // If this is a custom theme not in our lists, add it
          const isBuiltIn = themes.some(t => t.name === response.data.name);
          const isCustom = customThemes.some(t => t.name === response.data.name);
          
          if (!isBuiltIn && !isCustom) {
            addCustomTheme(response.data);
          }
        }
      } catch (err) {
        // Optionally log error
      }
    }
    fetchGlobalTheme();
  }, [customThemes]);

  return (
    <ThemeContext.Provider
      value={{
        activeTheme,
        setActiveTheme,
        availableThemes: themes,
        addCustomTheme,
        removeTheme,
        customThemes
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = () => useContext(ThemeContext); 