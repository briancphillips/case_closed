import React from 'react';
import { useTheme } from './ThemeContext';

const ThemePreview: React.FC = () => {
  const { activeTheme } = useTheme();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">Current Theme: {activeTheme.name}</h1>
      <p className="text-lg text-center mb-8">{activeTheme.description}</p>
      
      {/* Theme colors strip */}
      <div className="flex h-16 mb-6 rounded-md overflow-hidden">
        {activeTheme.colors.map((color, i) => (
          <div 
            key={i} 
            className="flex-1 flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: color.hex }}
          >
            {i + 1}
          </div>
        ))}
      </div>
      
      {/* Theme colors with CSS variable names */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {activeTheme.colors.map((color, index) => (
          <div 
            key={index}
            className="p-4 rounded-lg shadow-md"
            style={{ backgroundColor: color.hex, color: index > 2 ? '#000' : '#fff' }}
          >
            <h3 className="font-bold mb-1">{color.name}</h3>
            <p>CSS Variable: <code>--color-{color.name.toLowerCase().replace(/\s+/g, '-')}</code></p>
            <p>Utility Class: {index === 0 ? 'bg-primary' : index === 1 ? 'bg-secondary' : index === 2 ? 'bg-tertiary' : index === 3 ? 'bg-quaternary' : 'bg-quinary'}</p>
            <p>Hex: {color.hex}</p>
          </div>
        ))}
      </div>
      
      {/* UI Component Examples */}
      <h2 className="text-2xl font-bold mb-4">UI Component Examples</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Buttons */}
        <div className="p-6 rounded-lg shadow-md bg-white">
          <h3 className="font-bold mb-4">Buttons</h3>
          <div className="space-y-4">
            <button className="px-4 py-2 rounded-md bg-primary text-white w-full">Primary Button</button>
            <button className="px-4 py-2 rounded-md bg-secondary text-white w-full">Secondary Button</button>
            <button className="px-4 py-2 rounded-md bg-tertiary text-white w-full">Tertiary Button</button>
          </div>
        </div>
        
        {/* Cards */}
        <div className="p-6 rounded-lg shadow-md bg-white">
          <h3 className="font-bold mb-4">Card</h3>
          <div className="rounded-lg overflow-hidden border border-gray-200">
            <div className="bg-primary p-4 text-white font-bold">Card Header</div>
            <div className="p-4">
              <p>This is a card body with a <span className="text-secondary font-bold">themed accent</span>.</p>
            </div>
            <div className="bg-quaternary p-2 text-white text-center">Card Footer</div>
          </div>
        </div>
        
        {/* Alert */}
        <div className="p-6 rounded-lg shadow-md bg-white">
          <h3 className="font-bold mb-4">Alert</h3>
          <div className="p-4 rounded-md bg-opacity-20 bg-tertiary border-l-4 border-tertiary">
            <div className="font-bold text-tertiary">Information Alert</div>
            <p>This is an alert message using tertiary theme color.</p>
          </div>
        </div>
        
        {/* Form */}
        <div className="p-6 rounded-lg shadow-md bg-white">
          <h3 className="font-bold mb-4">Form Elements</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-secondary mb-1">Name</label>
              <input type="text" className="w-full p-2 border border-gray-300 rounded focus:border-primary focus:ring-1 focus:ring-primary" />
            </div>
            <div className="flex items-center">
              <input type="checkbox" className="text-primary w-5 h-5 mr-2" />
              <label>Subscribe using primary color</label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemePreview; 