import React, { useState, useEffect } from 'react';
import CaseClosedSlideshow from './case-closed-slideshow';
// ThemeProvider and ThemeStyles are now handled in main.tsx at a higher level
// import { ThemeProvider } from './ThemeContext';
// import ThemeStyles from './themeStyles';
import ThemePanel from './ThemePanel'; // Will be moved to AdminPortal
import './index.css';
import { imageFileNames } from './slideData'; 
import axios from 'axios'; 
// AdminToggleButton and AdminPanel are no longer used directly in App.tsx
// import AdminToggleButton from './AdminToggleButton';
// import AdminPanel, { SlideDetailsData } from './AdminPanel';
import { SlideDetailsData } from './SlideEditor'; // Ensure this type comes from SlideEditor now
import { SlideTransition, defaultTransition } from './slideTransitions';
import { SlideshowTimerSettings } from './case-closed-slideshow'; // Import the interface

const API_URL = '/api'; 

// Define a more specific type for slide details received from API
interface SlideDetailsApiResponse {
  [imagePath: string]: SlideDetailsData;
}

// This App component now primarily sets up the main slideshow view for the '/' route.
function App() {
  const [preloadedRotations, setPreloadedRotations] = useState<Record<string, number> | null>(null);
  const [preloadedSlideDetails, setPreloadedSlideDetails] = useState<SlideDetailsApiResponse | null>(null);
  const [activeTransition, setActiveTransition] = useState<SlideTransition>(defaultTransition);
  const [timerSettings, setTimerSettings] = useState<SlideshowTimerSettings>({ // Initialize with defaults
    autoAdvanceInterval: 5000,
    navigationThrottleMs: 600,
    transitionPrepareDelayMs: 30,
  });
  const [appLoading, setAppLoading] = useState(true);
  // isAdminPanelOpen and currentSlideForAdmin state are no longer needed here, 
  // as AdminPanel is in a separate route and will manage its own state or get it from AdminPortal.

  useEffect(() => {
    const fetchAppData = async () => {
      try {
        console.log('App (Slideshow Page): Fetching initial data...');
        const [rotationsResponse, slideDetailsResponse, transitionResponse, timerSettingsResponse] = await Promise.all([
          axios.get(`${API_URL}/rotations`),
          axios.get(`${API_URL}/slide-details`),
          axios.get(`${API_URL}/slide-transition`),
          axios.get(`${API_URL}/timer-settings`) // Fetch timer settings
        ]);
        
        setPreloadedRotations(rotationsResponse.data);
        setPreloadedSlideDetails(slideDetailsResponse.data);
        
        // Set active transition
        if (transitionResponse.data && transitionResponse.data.name && transitionResponse.data.className) {
          setActiveTransition(transitionResponse.data);
          console.log('App (Slideshow Page): Active transition:', transitionResponse.data.name);
        } else {
          console.log('App (Slideshow Page): Using default transition:', defaultTransition.name);
        }

        // Set timer settings
        if (timerSettingsResponse.data) {
          setTimerSettings(timerSettingsResponse.data);
          console.log('App (Slideshow Page): Timer settings loaded:', timerSettingsResponse.data);
        } else {
          console.log('App (Slideshow Page): Using default timer settings.');
        }

        console.log('App (Slideshow Page): Preloading images...');
        const imagePromises = imageFileNames.map(fileName => {
          return new Promise<void>((resolve, reject) => {
            const img = new Image();
            img.src = `/slides/${fileName}`;
            img.onload = () => resolve();
            img.onerror = () => reject(new Error(`Failed to load image: ${fileName}`));
          });
        });
        await Promise.all(imagePromises);
        console.log('App (Slideshow Page): All images preloaded.');

      } catch (error) {
        console.error('App (Slideshow Page): Error preloading data:', error);
        if (!preloadedRotations) setPreloadedRotations({}); 
        if (!preloadedSlideDetails) setPreloadedSlideDetails({});
      } finally {
        setAppLoading(false);
      }
    };
    fetchAppData();
  }, []); 

  // handleAdminSave is no longer needed here. It will be in AdminPortal.tsx

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
    // ThemeProvider and ThemeStyles are now in main.tsx, wrapping BrowserRouter
    // React.StrictMode is also in main.tsx
    <CaseClosedSlideshow 
      preloadedRotations={preloadedRotations || {}}
      preloadedSlideDetails={preloadedSlideDetails || {}} 
      activeTransition={activeTransition}
      timerSettings={timerSettings} // Pass timerSettings as a prop
      // onCurrentSlideChangeForAdmin is no longer needed from App directly to Slideshow for the old AdminPanel
      // If AdminPortal needs to know about the current slide in the main view (e.g. for a quick edit button),
      // a different mechanism (context or global state) would be needed.
      key={JSON.stringify(preloadedSlideDetails) + activeTransition.name + JSON.stringify(timerSettings)} // Add timerSettings to key
    />
    // ThemePanel, AdminToggleButton, AdminPanel are removed from here.
  );
}

export default App;