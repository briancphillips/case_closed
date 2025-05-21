import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { SlideTransition, availableTransitions, defaultTransition } from './slideTransitions';
import { useTheme } from './ThemeContext'; // To style panel with theme colors
import { Save, Check, Eye } from 'lucide-react';

const API_URL = '/api';

const TransitionPanel: React.FC = () => {
  const { activeTheme } = useTheme();
  const [activeTransition, setActiveTransition] = useState<SlideTransition>(defaultTransition);
  const [selectedTransition, setSelectedTransition] = useState<SlideTransition>(defaultTransition);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    // Fetch the currently saved transition
    const fetchCurrentTransition = async () => {
      try {
        const response = await axios.get<SlideTransition>(`${API_URL}/slide-transition`);
        if (response.data && response.data.name && response.data.className) {
          setActiveTransition(response.data);
          setSelectedTransition(response.data);
        } else {
          // If backend returns invalid data, fallback to default
          setActiveTransition(defaultTransition);
          setSelectedTransition(defaultTransition);
        }
      } catch (error) {
        console.error('Error fetching slide transition:', error);
        setActiveTransition(defaultTransition);
        setSelectedTransition(defaultTransition);
      }
    };
    fetchCurrentTransition();
  }, []);

  const handleSelectTransition = (transition: SlideTransition) => {
    setSelectedTransition(transition);
    setSaveStatus('idle'); // Reset save status when a new selection is made
  };

  const handleSaveTransition = async () => {
    setSaveStatus('saving');
    try {
      const response = await axios.post(`${API_URL}/slide-transition`, selectedTransition);
      if (response.data.success) {
        setActiveTransition(selectedTransition);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('error');
      }
    } catch (err) {
      console.error('Error saving slide transition:', err);
      setSaveStatus('error');
    }
  };

  return (
    <div className="h-full flex flex-col pt-1" style={{ color: `var(--text-on-quinary)` }}>
      {/* Active Transition Display */}
      <div className="p-1 flex-shrink-0 mb-4 border-b pb-4" style={{ borderColor: activeTheme.colors[2]?.hex || '#4B5563' }}>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold">Active Transition</h3>
          <button
            onClick={handleSaveTransition}
            className={`p-2 rounded-md text-white flex items-center transition-colors`}
            style={{
              backgroundColor: saveStatus === 'saved' 
                ? (activeTheme.colors[2]?.hex || 'green') 
                : saveStatus === 'error' 
                  ? (activeTheme.colors[3]?.hex || 'red') 
                  : (activeTheme.colors[1]?.hex || 'blue'),
              color: saveStatus === 'saved' 
                ? `var(--text-on-tertiary)`
                : saveStatus === 'error'
                  ? `var(--text-on-quaternary)`
                  : `var(--text-on-secondary)`
            }}
            disabled={saveStatus === 'saving' || selectedTransition.className === activeTransition.className}
          >
            {saveStatus === 'idle' && <><Save size={16} className="mr-1" /> Save</>}
            {saveStatus === 'saving' && 'Saving...'}
            {saveStatus === 'saved' && <><Check size={16} className="mr-1" /> Saved</>}
            {saveStatus === 'error' && 'Error'}
          </button>
        </div>
        <div className="p-3 rounded-lg" style={{ backgroundColor: activeTheme.colors[0] ? activeTheme.colors[0].hex : '#374151' }}>
          <h4 
            className="font-medium mb-1"
            style={{ color: activeTheme.colors[1] ? `var(--text-on-primary)` : '#E5E7EB' }}
          >
            {activeTransition.name}
          </h4>
          <p className="text-sm" style={{ color: activeTheme.colors[3] ? `var(--text-on-primary)` : '#D1D5DB' }}>
            Applies animation: <code className="text-xs p-0.5 rounded" style={{backgroundColor: activeTheme.colors[2]?.hex, color: `var(--text-on-tertiary)`}}>{activeTransition.className}</code>
          </p>
        </div>
      </div>

      {/* Available Transitions List */}
      <div className="p-1 overflow-y-auto flex-grow custom-scrollbar">
        <h3 className="text-lg font-semibold mb-3 sticky top-0 py-2 z-10 px-1"
          style={{
            backgroundColor: activeTheme.colors[4]?.hex || '#1F2937', // Match panel bg
            color: `var(--text-on-quinary)` // Text on panel bg
          }}
        >Available Transitions</h3>
        <div className="space-y-2 pr-1">
          {availableTransitions.map((transition, index) => (
            <div
              key={index}
              onClick={() => handleSelectTransition(transition)}
              className={`p-3 rounded-lg cursor-pointer transition-colors shadow-md`}
              style={{
                backgroundColor: selectedTransition.className === transition.className 
                  ? (activeTheme.colors[1]?.hex || 'blue') 
                  : (activeTheme.colors[0]?.hex || '#374151'),
                color: selectedTransition.className === transition.className
                  ? `var(--text-on-secondary)`
                  : `var(--text-on-primary)`,
                border: selectedTransition.className === transition.className 
                  ? `2px solid ${activeTheme.colors[2]?.hex || 'lightblue'}`
                  : `2px solid transparent`
              }}
            >
              <div className="flex justify-between items-center mb-1">
                <h4 className="font-medium">{transition.name}</h4>
                {activeTransition.className === transition.className && (
                  <Check size={18} style={{ color: selectedTransition.className === transition.className ? `var(--text-on-secondary)` : activeTheme.colors[2]?.hex }} />
                )}
              </div>
              <p className="text-sm">
                Animation class: <code className="text-xs p-0.5 rounded" style={{backgroundColor: activeTheme.colors[2]?.hex, color: `var(--text-on-tertiary)`}}>{transition.className}</code>
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TransitionPanel; 