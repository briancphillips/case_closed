import React, { useState } from 'react';
import CaseClosedSlideshow from './case-closed-slideshow'; // Assuming case-closed-slideshow.tsx will be in the same src/ directory
import ThemePreview from './ThemePreview';
import { ThemeProvider } from './ThemeContext';
import ThemeStyles from './themeStyles';
import ThemePanel from './ThemePanel';
import './index.css'; // We'll create this for global styles if needed, or for Tailwind directives

function App() {
  const [showThemePreview, setShowThemePreview] = useState(false);

  const toggleThemePreview = () => {
    setShowThemePreview(!showThemePreview);
  };

  return (
    <ThemeProvider>
      {/* ThemeStyles component applies CSS variables based on selected theme */}
      <ThemeStyles />
      
      <React.StrictMode>
        {/* Theme Preview Toggle Button */}
        <button 
          onClick={toggleThemePreview}
          className="fixed top-4 left-4 z-50 px-3 py-2 bg-gray-800 text-white rounded-md shadow-lg hover:bg-gray-700 transition-colors"
        >
          {showThemePreview ? 'View Slideshow' : 'View Theme Preview'}
        </button>
        
        {/* Conditional Rendering based on selected view */}
        {showThemePreview ? (
          <ThemePreview />
        ) : (
          <CaseClosedSlideshow />
        )}
        
        {/* Theme Panel for backend administration */}
        <ThemePanel />
      </React.StrictMode>
    </ThemeProvider>
  );
}

export default App; 