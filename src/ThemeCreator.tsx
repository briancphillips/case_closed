import React, { useState } from 'react';
import { HexColorPicker, HexColorInput } from 'react-colorful';
import { Color, Theme } from './ThemeContext';
import { Save, Check, X, PlusCircle, Trash2 } from 'lucide-react';
import axios from 'axios';

const API_URL = '/api';

interface ThemeCreatorProps {
  onThemeCreated: (theme: Theme) => void;
  onCancel: () => void;
}

const DEFAULT_COLORS: Color[] = [
  { name: "Primary", hex: "#1D3557" },
  { name: "Secondary", hex: "#E63946" },
  { name: "Tertiary", hex: "#F1FAEE" },
  { name: "Quaternary", hex: "#FFD700" },
  { name: "Quinary", hex: "#9F8BA8" }
];

const ThemeCreator: React.FC<ThemeCreatorProps> = ({ onThemeCreated, onCancel }) => {
  const [themeName, setThemeName] = useState<string>('My Custom Theme');
  const [themeDescription, setThemeDescription] = useState<string>('A custom theme created in the admin panel');
  const [colors, setColors] = useState<Color[]>(DEFAULT_COLORS);
  const [activeColorIndex, setActiveColorIndex] = useState<number | null>(0); // Default select first color
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleColorChange = (newHex: string) => {
    if (activeColorIndex !== null) {
      const newColors = [...colors];
      newColors[activeColorIndex] = { ...newColors[activeColorIndex], hex: newHex };
      setColors(newColors);
    }
  };

  const handleColorNameChange = (index: number, name: string) => {
    const newColors = [...colors];
    newColors[index] = { ...newColors[index], name };
    setColors(newColors);
  };

  const selectColor = (index: number) => {
    setActiveColorIndex(index);
  };

  const handleHexInputChange = (newHex: string) => {
    if (activeColorIndex !== null) {
      handleColorChange(newHex);
    }
  };

  const saveTheme = async () => {
    // Validate inputs
    if (!themeName.trim()) {
      setError('Theme name is required');
      return;
    }

    if (colors.some(color => !color.name.trim())) {
      setError('All colors must have names');
      return;
    }

    const newTheme: Theme = {
      name: themeName,
      description: themeDescription,
      colors: colors
    };

    setSaving(true);
    setError(null);

    try {
      // Save the theme to the global theme
      await axios.post(`${API_URL}/global-theme`, newTheme);
      onThemeCreated(newTheme);
    } catch (err) {
      console.error('Error saving theme:', err);
      setError('Failed to save theme');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 bg-gray-800 rounded-xl text-gray-100 shadow-2xl border border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-blue-400">Create New Theme</h2>
        <button 
          onClick={onCancel} 
          className="p-2 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
          title="Cancel"
        >
          <X size={22} />
        </button>
      </div>

      <div className="space-y-5 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-300">Theme Name</label>
          <input
            type="text"
            value={themeName}
            onChange={(e) => setThemeName(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 rounded-md border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Enter theme name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-300">Description</label>
          <textarea
            value={themeDescription}
            onChange={(e) => setThemeDescription(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 rounded-md border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Enter theme description"
            rows={2}
          />
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2 text-gray-300">Theme Colors</label>
        <div className="flex h-14 rounded-md overflow-hidden mb-4 border border-gray-600">
          {colors.map((color, i) => (
            <div 
              key={i} 
              className={`flex-1 cursor-pointer relative ${activeColorIndex === i ? 'ring-2 ring-blue-500 ring-inset z-10' : 'hover:ring-1 hover:ring-gray-300 hover:ring-inset'}`}
              style={{ backgroundColor: color.hex }}
              onClick={() => selectColor(i)}
              title={`${color.name} (${color.hex})`}
            >
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 px-1 py-0.5 text-xs text-center truncate">
                {color.name}
              </div>
            </div>
          ))}
        </div>
      </div>

      {activeColorIndex !== null && (
        <div className="mb-8 p-4 bg-gray-750 rounded-lg border border-gray-600">
          <div className="flex justify-between items-center mb-4">
            <label className="block text-lg font-medium text-blue-300">
              Edit Color: {colors[activeColorIndex].name}
            </label>
            <div className="text-sm text-blue-200 font-mono">{colors[activeColorIndex].hex}</div>
          </div>
          
          <div className="flex space-x-4 mb-5">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2 text-gray-300">Color Name</label>
              <input
                type="text"
                value={colors[activeColorIndex].name}
                onChange={(e) => handleColorNameChange(activeColorIndex, e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 rounded-md border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Color name"
              />
            </div>
          </div>
          
          <div className="flex gap-6">
            <div className="flex-none">
              <HexColorPicker 
                color={colors[activeColorIndex].hex} 
                onChange={handleColorChange} 
                className="w-48 h-48"
              />
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <label className="block text-sm font-medium mb-2 text-gray-300">Hex Value</label>
              <div className="flex items-center">
                <span className="text-gray-400 mr-1">#</span>
                <HexColorInput
                  prefixed={false}
                  color={colors[activeColorIndex].hex}
                  onChange={handleHexInputChange}
                  className="px-3 py-2 bg-gray-700 rounded-md border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                />
              </div>
              <div 
                className="mt-4 h-16 w-full rounded-md flex items-center justify-center"
                style={{ backgroundColor: colors[activeColorIndex].hex }}
              >
                <span 
                  className={`font-bold text-lg ${parseInt(colors[activeColorIndex].hex.substr(1), 16) > 0xffffff / 2 ? 'text-black' : 'text-white'}`}
                >
                  {colors[activeColorIndex].name}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-800 text-white rounded-md flex items-center">
          <span className="mr-2">⚠️</span> {error}
        </div>
      )}

      <div className="flex justify-end mt-6 space-x-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-white transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={saveTheme}
          disabled={saving}
          className={`px-4 py-2 ${saving ? 'bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'} rounded-md text-white flex items-center transition-colors`}
        >
          {saving ? (
            <>Saving...</>
          ) : (
            <>
              <Save size={16} className="mr-2" /> Save Theme
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ThemeCreator; 