import React, { useState, useEffect } from 'react';
import { useTheme, Theme } from './ThemeContext';
import { Check, Eye, Save, Plus } from 'lucide-react';
import axios from 'axios';
import ThemeCreator from './ThemeCreator';

const API_URL = '/api';

const ThemePanel: React.FC = () => {
  const { activeTheme, setActiveTheme, availableThemes, customThemes, addCustomTheme } = useTheme();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showCreator, setShowCreator] = useState(false);
  const [allThemes, setAllThemes] = useState<Theme[]>([]);

  // Combine built-in themes with custom themes
  useEffect(() => {
    setAllThemes([...availableThemes, ...customThemes]);
  }, [availableThemes, customThemes]);

  const applyTheme = (theme: Theme) => {
    setActiveTheme(theme);
    setSaveStatus('idle');
  };

  const saveCurrentTheme = async () => {
    setSaveStatus('saving');
    try {
      const response = await axios.post(`${API_URL}/global-theme`, activeTheme);
      if (response.data.success) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('error');
      }
    } catch (err) {
      setSaveStatus('error');
    }
  };

  const handleThemeCreated = (newTheme: Theme) => {
    // Add to custom themes
    addCustomTheme(newTheme);
    // Apply the new theme
    setActiveTheme(newTheme);
    // Close the creator
    setShowCreator(false);
  };

  return (
    <div className="h-full w-full flex flex-col text-gray-800 pt-1 relative">
      {showCreator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="max-w-lg w-full">
            <ThemeCreator 
              onThemeCreated={handleThemeCreated} 
              onCancel={() => setShowCreator(false)} 
            />
          </div>
        </div>
      )}

      <div className="p-1 flex-shrink-0 mb-4 border-b border-gray-700 pb-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-gray-100">Active Theme</h3>
          <button
            onClick={saveCurrentTheme}
            className={`p-2 rounded-md text-white flex items-center ${
              saveStatus === 'saved' ? 'bg-green-600' : saveStatus === 'error' ? 'bg-red-600' : 'bg-blue-600 hover:bg-blue-700'
            } transition-colors`}
            disabled={saveStatus === 'saving'}
          >
            {saveStatus === 'idle' && <><Save size={16} className="mr-1" /> Save</>}
            {saveStatus === 'saving' && 'Saving...'}
            {saveStatus === 'saved' && <><Check size={16} className="mr-1" /> Saved</>}
            {saveStatus === 'error' && 'Error'}
          </button>
        </div>
        
        <div className="p-3 rounded-lg bg-gray-700 mb-3">
          <h4 className="font-medium mb-1 text-gray-50">{activeTheme.name}</h4>
          <p className="text-sm text-gray-300 mb-2">{activeTheme.description}</p>
          
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
          
          <div className="grid grid-cols-2 gap-2 mt-3">
            {activeTheme.colors.map((color, i) => (
              <div key={i} className="flex items-center text-sm text-gray-200">
                <div 
                  className="w-6 h-6 rounded mr-2 flex-shrink-0 border border-gray-600"
                  style={{ backgroundColor: color.hex }}
                />
                <div className="truncate">{color.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-1 overflow-y-auto flex-grow custom-scrollbar">
        <div className="flex justify-between items-center mb-3 sticky top-0 bg-gray-800 py-2 z-10 px-1">
          <h3 className="text-lg font-semibold text-gray-100">Available Themes</h3>
          <button
            onClick={() => setShowCreator(true)}
            className="p-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white flex items-center text-sm"
            title="Create New Theme"
          >
            <Plus size={16} className="mr-1" /> New Theme
          </button>
        </div>
        
        <div className="space-y-3 pr-1">
          {allThemes.map((theme, index) => (
            <div
              key={theme.name}
              className={`p-3 rounded-lg cursor-pointer transition-colors shadow-md ${
                activeTheme.name === theme.name
                  ? 'bg-blue-700 border-2 border-blue-500 text-white'
                  : 'bg-gray-700 hover:bg-gray-650 text-gray-200'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <h4 className="font-medium">{theme.name}</h4>
                <div className="flex items-center">
                  <button 
                    onClick={() => applyTheme(theme)}
                    className={`p-1 rounded hover:bg-blue-500 ${activeTheme.name === theme.name ? 'text-white' : 'text-blue-400'}`}
                    title="Apply Theme"
                  >
                    <Eye size={16} />
                  </button>
                </div>
              </div>
              
              <p className={`text-sm mb-2 ${activeTheme.name === theme.name ? 'text-blue-100' : 'text-gray-400'}`}>{theme.description}</p>
              
              <div className="flex h-6 rounded-md overflow-hidden">
                {theme.colors.map((color, i) => (
                  <div 
                    key={i} 
                    className="flex-1 border border-gray-600"
                    style={{ backgroundColor: color.hex }}
                    title={`${color.name} (${color.hex})`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ThemePanel; 