import React, { createContext, useContext, useState, ReactNode } from 'react';
import { themes } from './case-closed-themes';

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
};

// Create context with default values
const ThemeContext = createContext<ThemeContextType>({
  activeTheme: themes[0],
  setActiveTheme: () => {},
  availableThemes: themes,
});

// Provider component
export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTheme, setActiveTheme] = useState<Theme>(themes[0]);

  return (
    <ThemeContext.Provider
      value={{
        activeTheme,
        setActiveTheme,
        availableThemes: themes,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = () => useContext(ThemeContext); 