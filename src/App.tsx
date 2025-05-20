import React, { useState, useEffect } from 'react';
import CaseClosedSlideshow from './case-closed-slideshow';
import { ThemeProvider } from './ThemeContext';
import ThemeStyles from './themeStyles';
import ThemePanel from './ThemePanel';
import './index.css';
import { imageFileNames } from './slideData'; 
import axios from 'axios'; 

const API_URL = '/api'; 

function App() {
  const [preloadedRotations, setPreloadedRotations] = useState<Record<string, number> | null>(null);
  const [appLoading, setAppLoading] = useState(true);

  useEffect(() => {
    const fetchAppData = async () => {
      try {
        console.log('App: Fetching rotations...');
        const rotationsResponse = await axios.get(`${API_URL}/rotations`);
        setPreloadedRotations(rotationsResponse.data);
        console.log('App: Rotations fetched', rotationsResponse.data);

        console.log('App: Preloading images...');
        const imagePromises = imageFileNames.map(fileName => {
          return new Promise<void>((resolve, reject) => {
            const img = new Image();
            img.src = `/slides/${fileName}`;
            img.onload = () => resolve();
            img.onerror = () => reject(new Error(`Failed to load image: ${fileName}`));
          });
        });

        await Promise.all(imagePromises);
        console.log('App: All images preloaded.');

      } catch (error) {
        console.error('App: Error preloading data:', error);
        if (!preloadedRotations) setPreloadedRotations({}); 
      } finally {
        setAppLoading(false);
      }
    };

    fetchAppData();
  }, []); 

  if (appLoading) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
        <p className="text-xl">Loading Case Files...</p>
        <p className="text-sm mt-2">Reticulating splines and decrypting data streams...</p>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <ThemeStyles />
      <React.StrictMode>
        <CaseClosedSlideshow preloadedRotations={preloadedRotations || {}} />
        <ThemePanel />
      </React.StrictMode>
    </ThemeProvider>
  );
}

export default App;