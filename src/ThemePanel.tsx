import React, { useState, useEffect } from 'react';
import { useTheme, Theme } from './ThemeContext';
import { Save, Check, Eye } from 'lucide-react';
import axios from 'axios';

const API_URL = '/api';

const ThemePanel: React.FC = () => {
  const { activeTheme, setActiveTheme, availableThemes } = useTheme();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

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

  return (
    <div className="h-full flex flex-col text-gray-800 pt-1">
      <div className="p-1 overflow-y-auto flex-grow custom-scrollbar border-b border-gray-700">
        <h3 className="text-lg font-semibold mb-3 text-gray-100 sticky top-0 bg-gray-800 py-2 z-10 px-1">Available Themes</h3>
        
        <div className="space-y-3 pr-1">
          {availableThemes.map((theme, index) => (
            <div
              key={index}
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

      <div className="p-1 flex-shrink-0 mt-4">
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
    </div>
  );
};

export default ThemePanel; 