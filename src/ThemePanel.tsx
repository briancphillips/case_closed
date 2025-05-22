import React, { useState, useEffect } from 'react';
import { useTheme, Theme } from './ThemeContext';
import { Check, Eye, Save, Plus, Trash2 } from 'lucide-react';
import axios from 'axios';
import ThemeCreator from './ThemeCreator';

const API_URL = '/api';

const ThemePanel: React.FC = () => {
  const { activeTheme, setActiveTheme, availableThemes, customThemes, addCustomTheme, removeTheme } = useTheme();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showCreator, setShowCreator] = useState(false);
  const [allThemes, setAllThemes] = useState<Theme[]>([]);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
  const [hiddenThemes, setHiddenThemes] = useState<string[]>([]);

  // Load hidden themes from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('hiddenThemes');
      if (stored) {
        setHiddenThemes(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Error loading hidden themes:', err);
    }
  }, []);

  // Combine built-in themes with custom themes, filtering out hidden built-in themes
  useEffect(() => {
    const filteredBuiltInThemes = availableThemes.filter(
      theme => !hiddenThemes.includes(theme.name)
    );
    setAllThemes([...filteredBuiltInThemes, ...customThemes]);
  }, [availableThemes, customThemes, hiddenThemes]);

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

  // Handle delete button click
  const handleDeleteClick = (e: React.MouseEvent, themeName: string) => {
    e.stopPropagation(); // Prevent theme selection when clicking delete
    setDeleteConfirmation(themeName);
  };

  // Confirm theme deletion
  const confirmDelete = () => {
    if (deleteConfirmation) {
      removeTheme(deleteConfirmation);
      setDeleteConfirmation(null);
      
      // Update the hiddenThemes state if it's a built-in theme
      const isBuiltIn = availableThemes.some(t => t.name === deleteConfirmation);
      if (isBuiltIn && !hiddenThemes.includes(deleteConfirmation)) {
        setHiddenThemes(prev => [...prev, deleteConfirmation]);
      }
    }
  };

  // Cancel theme deletion
  const cancelDelete = () => {
    setDeleteConfirmation(null);
  };

  return (
    <div className="h-full w-full flex flex-col text-gray-100 pt-1 relative">
      {showCreator && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-200">
          <div className="max-w-lg w-full">
            <ThemeCreator 
              onThemeCreated={handleThemeCreated} 
              onCancel={() => setShowCreator(false)} 
            />
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-200">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full shadow-xl border border-gray-800">
            <h3 className="text-xl font-bold text-white mb-3">Delete Theme</h3>
            <p className="text-gray-300 mb-6 text-sm">
              Are you sure you want to delete the theme "{deleteConfirmation}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                className="px-3 py-1.5 bg-gray-800 text-white text-sm rounded-md hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 border-b border-gray-800 pb-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-base font-medium text-white">Active Theme</h3>
          <button
            onClick={saveCurrentTheme}
            className="px-3 py-1.5 rounded-md text-sm text-white flex items-center transition-all duration-200 focus:outline-none focus:ring-2"
            style={{
              backgroundColor: saveStatus === 'saved' ? '#10B981' : 
                              saveStatus === 'error' ? '#EF4444' : 
                              activeTheme.colors[1]?.hex || '#3B82F6',
              boxShadow: 'var(--shadow-sm)',
              transform: 'translateZ(0)'
            }}
            disabled={saveStatus === 'saving'}
            onMouseOver={(e) => {
              if (saveStatus === 'idle') {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = 'var(--shadow)';
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateZ(0)';
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }}
          >
            {saveStatus === 'idle' && <><Save size={14} className="mr-1.5" /> Save</>}
            {saveStatus === 'saving' && <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </span>}
            {saveStatus === 'saved' && <><Check size={14} className="mr-1.5" /> Saved</>}
            {saveStatus === 'error' && 'Error'}
          </button>
        </div>
        
        <div className="p-3 rounded-md bg-gray-800/50 border border-gray-700/50">
          <h4 className="font-medium mb-1 text-white">{activeTheme.name}</h4>
          <p className="text-xs text-gray-300 mb-3">{activeTheme.description}</p>
          
          <div className="flex h-6 rounded-md overflow-hidden mb-3 shadow-sm">
            {activeTheme.colors.map((color, i) => (
              <div 
                key={i} 
                className="flex-1" 
                style={{ backgroundColor: color.hex }}
                title={`${color.name} (${color.hex})`}
              />
            ))}
          </div>
          
          <div className="grid grid-cols-2 gap-2 mt-2">
            {activeTheme.colors.map((color, i) => (
              <div key={i} className="flex items-center text-xs text-gray-300">
                <div 
                  className="w-4 h-4 rounded-sm mr-2 flex-shrink-0 border border-gray-600"
                  style={{ backgroundColor: color.hex }}
                />
                <div className="truncate">{color.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-y-auto flex-grow custom-scrollbar">
        <div className="flex justify-between items-center mb-3 sticky top-0 py-2 z-10 px-1"
          style={{ backgroundColor: '#1a1a1a' }}>
          <h3 className="text-base font-medium text-white">Available Themes</h3>
          <button
            onClick={() => setShowCreator(true)}
            className="px-2 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white flex items-center text-xs transition-colors"
            title="Create New Theme"
          >
            <Plus size={14} className="mr-1" /> New Theme
          </button>
        </div>
        
        <div className="space-y-2 pr-1">
          {allThemes.map((theme, index) => (
            <div
              key={theme.name}
              className="group p-3 rounded-md cursor-pointer transition-all duration-200 shadow-sm hover:shadow"
              style={{
                backgroundColor: activeTheme.name === theme.name
                  ? (activeTheme.colors[1]?.hex ? `${activeTheme.colors[1]?.hex}15` : 'rgba(59, 130, 246, 0.15)')
                  : 'rgba(30, 30, 30, 0.7)',
                borderLeft: activeTheme.name === theme.name
                  ? `3px solid ${activeTheme.colors[1]?.hex || '#3B82F6'}`
                  : '3px solid transparent',
                transform: 'translateZ(0)'
              }}
              onMouseOver={(e) => {
                if (activeTheme.name !== theme.name) {
                  e.currentTarget.style.backgroundColor = 'rgba(40, 40, 40, 0.7)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow)';
                }
              }}
              onMouseOut={(e) => {
                if (activeTheme.name !== theme.name) {
                  e.currentTarget.style.backgroundColor = 'rgba(30, 30, 30, 0.7)';
                  e.currentTarget.style.transform = 'translateZ(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                }
              }}
            >
              <div className="flex justify-between items-center mb-1">
                <h4 className="font-medium text-sm"
                  style={{
                    color: activeTheme.name === theme.name 
                      ? (activeTheme.colors[1]?.hex || '#3B82F6') 
                      : 'rgba(255, 255, 255, 0.9)'
                  }}>
                  {theme.name}
                </h4>
                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => applyTheme(theme)}
                    className="p-1 rounded-md hover:bg-gray-700 text-gray-300 transition-colors focus:outline-none focus:ring-1 focus:ring-gray-500"
                    title="Apply Theme"
                  >
                    <Eye size={14} />
                  </button>
                  
                  {/* Delete button - show for all themes except the active one */}
                  {theme.name !== activeTheme.name && (
                    <button 
                      onClick={(e) => handleDeleteClick(e, theme.name)}
                      className="p-1 rounded-md ml-1 hover:bg-red-900/50 text-gray-300 hover:text-red-400 transition-colors focus:outline-none focus:ring-1 focus:ring-red-600"
                      title="Delete Theme"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
              
              <p className="text-xs mb-2"
                style={{
                  color: activeTheme.name === theme.name 
                    ? 'rgba(255, 255, 255, 0.8)' 
                    : 'rgba(255, 255, 255, 0.5)'
                }}>
                {theme.description}
              </p>
              
              <div className="flex h-4 rounded-sm overflow-hidden">
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
    </div>
  );
};

export default ThemePanel; 