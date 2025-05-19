import React, { useState, useEffect } from 'react';
import { useTheme, Theme } from './ThemeContext';
import { Settings, X, Save, Check, Eye } from 'lucide-react';

const ThemePanel: React.FC = () => {
  const { activeTheme, setActiveTheme, availableThemes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [savedThemes, setSavedThemes] = useState<Theme[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Load saved themes from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem('case-closed-themes');
    if (savedData) {
      try {
        setSavedThemes(JSON.parse(savedData));
      } catch (err) {
        console.error('Failed to parse saved themes:', err);
      }
    }
  }, []);

  const togglePanel = () => {
    setIsOpen(!isOpen);
  };

  const applyTheme = (theme: Theme) => {
    setActiveTheme(theme);
    setSaveStatus('idle');
  };

  const saveCurrentTheme = () => {
    setSaveStatus('saving');
    
    // Simulate a save operation to backend
    setTimeout(() => {
      // Save to localStorage for demo purposes
      const updatedSavedThemes = [...savedThemes];
      
      // Check if theme already exists
      const existingIndex = updatedSavedThemes.findIndex(t => t.name === activeTheme.name);
      if (existingIndex >= 0) {
        // Update existing theme
        updatedSavedThemes[existingIndex] = activeTheme;
      } else {
        // Add new theme
        updatedSavedThemes.push(activeTheme);
      }
      
      setSavedThemes(updatedSavedThemes);
      localStorage.setItem('case-closed-themes', JSON.stringify(updatedSavedThemes));
      setSaveStatus('saved');
      
      // Reset to idle after showing saved status
      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    }, 500);
  };

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={togglePanel}
        className="fixed bottom-4 right-4 p-3 rounded-full bg-gray-800 text-white shadow-lg z-50 hover:bg-gray-700 transition-colors"
        style={{ 
          backgroundColor: activeTheme.colors[0].hex,
          color: '#ffffff' 
        }}
        title="Theme Settings"
      >
        <Settings size={24} />
      </button>

      {/* Admin panel */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } overflow-y-auto`}
      >
        <div className="p-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold">Theme Settings</h2>
          <button
            onClick={togglePanel}
            className="p-1 rounded-full hover:bg-gray-100"
            title="Close"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Active Theme</h3>
            <button
              onClick={saveCurrentTheme}
              className={`p-2 rounded-md text-white flex items-center ${
                saveStatus === 'saved' ? 'bg-green-500' : 'bg-blue-500 hover:bg-blue-600'
              } transition-colors`}
              disabled={saveStatus === 'saving'}
            >
              {saveStatus === 'idle' && <><Save size={16} className="mr-1" /> Save</>}
              {saveStatus === 'saving' && 'Saving...'}
              {saveStatus === 'saved' && <><Check size={16} className="mr-1" /> Saved</>}
            </button>
          </div>
          
          <div className="p-3 rounded-lg bg-gray-100 mb-4">
            <h4 className="font-medium mb-1">{activeTheme.name}</h4>
            <p className="text-sm text-gray-600 mb-2">{activeTheme.description}</p>
            
            {/* Color strip preview */}
            <div className="flex h-8 rounded-md overflow-hidden mb-2">
              {activeTheme.colors.map((color, i) => (
                <div 
                  key={i} 
                  className="flex-1" 
                  style={{ backgroundColor: color.hex }}
                  title={`${color.name} (${color.hex})`}
                />
              ))}
            </div>
            
            {/* Individual color swatches */}
            <div className="grid grid-cols-2 gap-2 mt-3">
              {activeTheme.colors.map((color, i) => (
                <div key={i} className="flex items-center text-sm">
                  <div 
                    className="w-6 h-6 rounded mr-2 flex-shrink-0" 
                    style={{ backgroundColor: color.hex }}
                  />
                  <div className="truncate">{color.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Available Themes</h3>
          
          {/* Theme selection */}
          <div className="space-y-4">
            {availableThemes.map((theme, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  activeTheme.name === theme.name
                    ? 'bg-blue-100 border-2 border-blue-500'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-medium">{theme.name}</h4>
                  <div className="flex items-center">
                    <button 
                      onClick={() => applyTheme(theme)}
                      className="p-1 rounded hover:bg-blue-200 text-blue-700"
                      title="Apply Theme"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-2">{theme.description}</p>
                
                {/* Color strip preview */}
                <div className="flex h-6 rounded-md overflow-hidden">
                  {theme.colors.map((color, i) => (
                    <div 
                      key={i} 
                      className="flex-1" 
                      style={{ backgroundColor: color.hex }}
                      title={`${color.name} (${color.hex})`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 sticky bottom-0 bg-white">
          <div className="text-xs text-gray-500 text-center">
            Theme colors will be applied to the entire application
          </div>
        </div>
      </div>
    </>
  );
};

export default ThemePanel; 