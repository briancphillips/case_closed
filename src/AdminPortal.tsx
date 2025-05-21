import React, { useState, useEffect } from 'react';
import ThemePanel from './ThemePanel'; // Import ThemePanel
import TransitionPanel from './TransitionPanel'; // Import TransitionPanel
import SlideEditor, { SlideDetailsData } from './SlideEditor'; // Renamed from AdminPanel
import { imageFileNames } from './slideData'; // To get the list of all files
import axios from 'axios';
import { Link } from 'react-router-dom'; // Import Link component
import { Home, Palette, Film } from 'lucide-react'; // Added Palette and Film icons
import { useTheme } from './ThemeContext'; // Import useTheme hook

const API_URL = '/api';

interface SlideDetailsApiResponse {
  [imagePath: string]: SlideDetailsData;
}

// Basic placeholder for Admin Portal
const AdminPortal: React.FC = () => {
  const { activeTheme } = useTheme(); // Get active theme
  // State for slide details - AdminPortal will own this now
  const [slideDetails, setSlideDetails] = useState<SlideDetailsApiResponse | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [activeDisplayTab, setActiveDisplayTab] = useState<'themes' | 'transitions'>('themes');

  // Enable scrolling for admin portal only
  useEffect(() => {
    const prevBodyOverflow = document.body.style.overflow;
    const root = document.getElementById('root');
    const prevRootOverflow = root?.style.overflow;
    const prevAlign = root?.style.alignItems;
    if (root) root.style.alignItems = 'flex-start';
    document.body.style.overflow = 'auto';
    if (root) root.style.overflow = 'auto';
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      if (root && prevRootOverflow !== undefined) root.style.overflow = prevRootOverflow;
      if (root && prevAlign !== undefined) root.style.alignItems = prevAlign;
    };
  }, []);

  // Fetch initial slide details for the admin portal
  useEffect(() => {
    const fetchAdminData = async () => {
      setLoadingDetails(true);
      try {
        const response = await axios.get(`${API_URL}/slide-details`);
        setSlideDetails(response.data);
        setErrorDetails(null);
      } catch (err: any) {
        console.error("AdminPortal: Error fetching slide details:", err);
        setErrorDetails(err.response?.data?.error || err.message || "Failed to load slide details.");
        setSlideDetails({}); // Set to empty object on error to avoid null issues
      } finally {
        setLoadingDetails(false);
      }
    };
    fetchAdminData();
  }, []);

  // Handler for when SlideEditor saves details
  const handleSlideDetailsSave = (updatedDetailsForOneImage: { [imagePath: string]: SlideDetailsData }) => {
    setSlideDetails(prevDetails => {
      const newDetails = { ...prevDetails, ...updatedDetailsForOneImage };
      // Note: This update only affects the AdminPortal's state.
      // For these changes to reflect immediately in the main slideshow (on '/' route)
      // without a refresh, a global state management or a mechanism to trigger
      // re-fetch in App.tsx (or a shared parent) would be needed.
      // The key={JSON.stringify(preloadedSlideDetails)} on CaseClosedSlideshow in App.tsx
      // would work if App.tsx's preloadedSlideDetails state was updated.
      console.log("AdminPortal: slideDetails updated", newDetails);
      return newDetails;
    });
  };

  return (
    <div 
      className="min-h-screen text-white p-4 md:p-6 flex flex-col mt-5 overflow-auto"
      style={{ backgroundColor: '#111827' }} // Use a fixed neutral dark gray for Admin bg
    >
      <header className="mb-6 md:mb-8 flex-shrink-0 flex justify-between items-center">
        <div>
          <h1 
            className="text-3xl md:text-4xl font-bold"
            style={{ color: activeTheme.colors[1]?.hex || '#3B82F6' }} // Use secondary theme color for title
          >Admin Portal</h1>
          <p 
            className="text-sm"
            style={{ color: activeTheme.colors[3]?.hex || '#9CA3AF' }} // Use quaternary theme color for subtitle
          >Manage slideshow themes and content.</p>
        </div>
        <Link 
          to="/" 
          className="flex items-center px-4 py-2 rounded-lg transition-colors text-white"
          style={{
            backgroundColor: activeTheme.colors[1]?.hex || '#2563EB', // Secondary theme for button bg
            color: `var(--text-on-secondary)` // Contrast text for button
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = activeTheme.colors[2]?.hex || '#1D4ED8'} // Tertiary theme for hover
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = activeTheme.colors[1]?.hex || '#2563EB'}
          title="Go to Slideshow"
        >
          <Home size={20} className="mr-2" />
          View Slideshow
        </Link>
      </header>
      
      {/* Main content area - takes remaining height */}
      <main className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 overflow-hidden"> {/* Added overflow-hidden */}
        {/* Column 1: Settings (Theme Panel & Transition Panel) */}
        <div className="lg:col-span-1 rounded-xl shadow-2xl flex flex-col overflow-hidden">
          <div className="border-b flex" style={{ borderColor: activeTheme.colors[2]?.hex || '#4B5563' }}>
            <button 
              onClick={() => setActiveDisplayTab('themes')}
              className={`flex-1 p-3 text-center font-medium transition-colors flex items-center justify-center
                          ${
                            activeDisplayTab === 'themes' 
                              ? 'border-b-2' 
                              : 'opacity-70 hover:opacity-100'
                          }`}
              style={{
                color: activeDisplayTab === 'themes' ? (activeTheme.colors[1]?.hex || '#E5E7EB') : (activeTheme.colors[3]?.hex || '#9CA3AF'),
                borderColor: activeDisplayTab === 'themes' ? (activeTheme.colors[1]?.hex || '#E5E7EB') : 'transparent'
              }}
            >
              <Palette size={18} className="mr-2" /> Themes
            </button>
            <button 
              onClick={() => setActiveDisplayTab('transitions')}
              className={`flex-1 p-3 text-center font-medium transition-colors flex items-center justify-center
                          ${
                            activeDisplayTab === 'transitions' 
                              ? 'border-b-2' 
                              : 'opacity-70 hover:opacity-100'
                          }`}
               style={{
                color: activeDisplayTab === 'transitions' ? (activeTheme.colors[1]?.hex || '#E5E7EB') : (activeTheme.colors[3]?.hex || '#9CA3AF'),
                borderColor: activeDisplayTab === 'transitions' ? (activeTheme.colors[1]?.hex || '#E5E7EB') : 'transparent'
              }}
            >
              <Film size={18} className="mr-2" /> Transitions
            </button>
          </div>

          <div className="flex-grow p-2 overflow-y-auto custom-scrollbar">
            {activeDisplayTab === 'themes' && <ThemePanel />}
            {activeDisplayTab === 'transitions' && <TransitionPanel />}
          </div>
        </div>

        {/* Column 2: Content Management (Slide Editor) - No specific background */}
        <div className="lg:col-span-2 rounded-xl shadow-2xl flex flex-col overflow-hidden">
          <h2 
            className="text-xl md:text-2xl font-semibold border-b pb-3 p-4 flex-shrink-0 z-10"
            style={{
              borderColor: activeTheme.colors[2]?.hex || '#4B5563', // Tertiary theme for border
              color: activeTheme.colors[1]?.hex || '#E5E7EB' // Secondary theme for title text (or a light gray)
            }}
          >Slide Management</h2>
          {loadingDetails && <p className="text-center p-4">Loading slide details...</p>}
          {errorDetails && <p 
            className="text-center p-4"
            style={{ color: activeTheme.colors[3]?.hex || '#F87171'}} // Use a theme color for error text
          >Error: {errorDetails}</p>}
          {/* SlideEditor itself will manage its internal scrolling */}
          {!loadingDetails && !errorDetails && slideDetails && (
            <SlideEditor 
              allImageFiles={imageFileNames} 
              allSlideDetails={slideDetails}
              onSave={handleSlideDetailsSave}
              currentSlideshowImageSrc={null}
            />
          )}
        </div>
      </main>

      <footer 
        className="mt-6 md:mt-8 text-center text-sm flex-shrink-0"
        style={{ color: activeTheme.colors[3]?.hex || '#6B7280' }} // Use quaternary theme color for footer text
      >
        <p>&copy; {new Date().getFullYear()} Case Closed Slideshow Admin. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default AdminPortal; 