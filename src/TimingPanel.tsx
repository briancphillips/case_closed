import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { SlideshowTimerSettings } from './case-closed-slideshow';
import { Save, Check, AlertTriangle } from 'lucide-react';
import { useTheme } from './ThemeContext';

const API_URL = '/api';

const defaultSettings: SlideshowTimerSettings = {
  autoAdvanceInterval: 5000,
  navigationThrottleMs: 600,
  transitionPrepareDelayMs: 30,
};

const TimingPanel: React.FC = () => {
  const { activeTheme } = useTheme();
  const [settings, setSettings] = useState<SlideshowTimerSettings>(defaultSettings);
  const [initialSettings, setInitialSettings] = useState<SlideshowTimerSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get<SlideshowTimerSettings>(`${API_URL}/timer-settings`);
        setSettings(response.data || defaultSettings);
        setInitialSettings(response.data || defaultSettings);
        setError(null);
      } catch (err) {
        console.error("Error fetching timer settings:", err);
        setError("Failed to load timer settings. Displaying defaults.");
        setSettings(defaultSettings);
        setInitialSettings(defaultSettings);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value === '' ? undefined : Number(value) }));
    setSuccessMessage(null);
    setError(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      // Filter out any empty strings that were converted to undefined
      const settingsToSave: Partial<SlideshowTimerSettings> = {};
      for (const key in settings) {
        const typedKey = key as keyof SlideshowTimerSettings;
        const value = settings[typedKey];

        if (value !== undefined && typeof value === 'number' && !isNaN(value)) {
            if (value >= 0) {
                 settingsToSave[typedKey] = value;
            } else {
                // If negative, revert to default for that specific field
                settingsToSave[typedKey] = defaultSettings[typedKey];
            }
        } else {
            // If undefined, NaN, or somehow not a number, revert to default for that specific field
            settingsToSave[typedKey] = defaultSettings[typedKey];
        }
      }
      
      const response = await axios.post(`${API_URL}/timer-settings`, settingsToSave);
      if (response.data.success) {
        setSettings(response.data.settings || defaultSettings);
        setInitialSettings(response.data.settings || defaultSettings);
        setSuccessMessage("Timer settings saved successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(response.data.error || "Failed to save settings.");
      }
    } catch (err) {
      console.error("Error saving timer settings:", err);
      setError("An unexpected error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };
  
  const hasChanges = JSON.stringify(settings) !== JSON.stringify(initialSettings);

  if (isLoading) {
    return <div className="p-4 text-center text-gray-400">Loading timer settings...</div>;
  }

  const inputStyle = `w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-white placeholder-gray-400`;
  const labelStyle = "block text-sm font-medium text-gray-300 mb-1";

  return (
    <div className="p-6 bg-gray-800 shadow-xl rounded-lg border border-gray-700">
      <h2 className="text-2xl font-semibold mb-6 text-blue-400">Slideshow Timing Configuration</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-700 text-red-300 rounded-md flex items-center">
          <AlertTriangle size={20} className="mr-2" /> {error}
        </div>
      )}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-500/20 border border-green-700 text-green-300 rounded-md flex items-center">
          <Check size={20} className="mr-2" /> {successMessage}
        </div>
      )}

      <div className="space-y-6 mb-6">
        <div>
          <label htmlFor="autoAdvanceInterval" className={labelStyle}>
            Auto-Advance Interval (ms)
          </label>
          <input 
            type="number"
            id="autoAdvanceInterval"
            name="autoAdvanceInterval"
            value={settings.autoAdvanceInterval ?? ''}
            onChange={handleInputChange}
            placeholder="e.g., 5000"
            className={inputStyle}
            min="0"
          />
          <p className="text-xs text-gray-500 mt-1">Time between automatic slide changes. Default: 5000ms.</p>
        </div>

        <div>
          <label htmlFor="navigationThrottleMs" className={labelStyle}>
            Navigation Throttle (ms)
          </label>
          <input 
            type="number"
            id="navigationThrottleMs"
            name="navigationThrottleMs"
            value={settings.navigationThrottleMs ?? ''}
            onChange={handleInputChange}
            placeholder="e.g., 600"
            className={inputStyle}
            min="0"
          />
          <p className="text-xs text-gray-500 mt-1">Minimum time between manual navigations. Default: 600ms.</p>
        </div>

        <div>
          <label htmlFor="transitionPrepareDelayMs" className={labelStyle}>
            Transition Prepare Delay (ms)
          </label>
          <input 
            type="number"
            id="transitionPrepareDelayMs"
            name="transitionPrepareDelayMs"
            value={settings.transitionPrepareDelayMs ?? ''}
            onChange={handleInputChange}
            placeholder="e.g., 30"
            className={inputStyle}
            min="0"
          />
          <p className="text-xs text-gray-500 mt-1">Short delay for DOM updates before animation starts. Default: 30ms.</p>
        </div>
      </div>

      <button 
        onClick={handleSave}
        disabled={isSaving || !hasChanges}
        style={{
          backgroundColor: activeTheme.colors[1] ? activeTheme.colors[1].hex : '#2563eb', // Default to blue
          color: 'white',
        }}
        className={`w-full py-3 px-4 rounded-md font-semibold flex items-center justify-center transition-opacity duration-150 ${isSaving ? 'opacity-70 cursor-not-allowed' : (hasChanges ? 'hover:opacity-90' : 'opacity-50 cursor-not-allowed')}`}
      >
        {isSaving ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Saving...
          </>
        ) : (
          <><Save size={18} className="mr-2" /> Save Timer Settings</>
        )}
      </button>
    </div>
  );
};

export default TimingPanel; 