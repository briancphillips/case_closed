import React, { useState, useEffect } from 'react';
import ThemePanel from './ThemePanel'; // Import ThemePanel
import TransitionPanel from './TransitionPanel'; // Import TransitionPanel
import TimingPanel from './TimingPanel'; // Import TimingPanel
import SlideEditor, { SlideDetailsData } from './SlideEditor'; // Renamed from AdminPanel
import { imageFileNames } from './slideData'; // To get the list of all files
import axios from 'axios';
import { Link } from 'react-router-dom'; // Import Link component
import { Home, Palette, Film, Timer } from 'lucide-react'; // Added Palette, Film, and Timer icons
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
  const [activeDisplayTab, setActiveDisplayTab] = useState<'themes' | 'transitions' | 'timing'>('themes');

  // Enable scrolling for admin portal only
  useEffect(() => {
    const prevBodyOverflow = document.body.style.overflow;
    const root = document.getElementById('root');
    const prevRootOverflow = root?.style.overflow;
    const prevAlign = root?.style.alignItems;
    if (root) root.style.alignItems = 'flex-start';
    document.body.style.overflow = 'auto';
    if (root) root.style.overflow = 'auto';

    // Add modern CSS variables for shadcn-like styling
    document.documentElement.style.setProperty('--radius', '0.5rem');
    document.documentElement.style.setProperty('--ring', '0 0 0 2px rgba(24, 24, 27, 0.1)');
    document.documentElement.style.setProperty('--shadow-sm', '0 1px 2px 0 rgba(0, 0, 0, 0.05)');
    document.documentElement.style.setProperty('--shadow', '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)');
    document.documentElement.style.setProperty('--shadow-md', '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)');
    document.documentElement.style.setProperty('--shadow-lg', '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)');
    document.documentElement.style.setProperty('--shadow-xl', '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)');

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      if (root && prevRootOverflow !== undefined) root.style.overflow = prevRootOverflow;
      if (root && prevAlign !== undefined) root.style.alignItems = prevAlign;
      
      // Remove CSS variables
      document.documentElement.style.removeProperty('--radius');
      document.documentElement.style.removeProperty('--ring');
      document.documentElement.style.removeProperty('--shadow-sm');
      document.documentElement.style.removeProperty('--shadow');
      document.documentElement.style.removeProperty('--shadow-md');
      document.documentElement.style.removeProperty('--shadow-lg');
      document.documentElement.style.removeProperty('--shadow-xl');
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
      className="min-h-screen w-full text-white p-4 md:p-6 flex flex-col mt-5 overflow-y-scroll"
      style={{ 
        backgroundColor: '#0a0a0a', // Darker background for modern look
        fontFamily: 'Inter, system-ui, sans-serif', // Modern font
      }} 
    >
      <header className="mb-8 flex-shrink-0 flex justify-between items-center">
        <div>
          <h1 
            className="text-3xl md:text-4xl font-bold tracking-tight"
            style={{ color: activeTheme.colors[1]?.hex || '#3B82F6' }} 
          >Admin Portal</h1>
          <p 
            className="text-sm mt-1 tracking-wide"
            style={{ color: 'rgba(255,255,255,0.6)' }} 
          >Manage slideshow themes and content.</p>
        </div>
        <Link 
          to="/" 
          className="flex items-center px-4 py-2 rounded-md transition-all duration-200 ease-in-out text-white"
          style={{
            backgroundColor: activeTheme.colors[1]?.hex || '#2563EB',
            color: `var(--text-on-secondary)`,
            boxShadow: 'var(--shadow-md)',
            transform: 'translateZ(0)', // Hardware acceleration
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
            e.currentTarget.style.backgroundColor = activeTheme.colors[2]?.hex || '#1D4ED8';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateZ(0)';
            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            e.currentTarget.style.backgroundColor = activeTheme.colors[1]?.hex || '#2563EB';
          }}
          title="Go to Slideshow"
        >
          <Home size={18} className="mr-2" />
          View Slideshow
        </Link>
      </header>
      
      {/* Main content area - takes remaining height */}
      <main className="flex-grow w-full flex flex-col lg:flex-row gap-6 md:gap-8 overflow-hidden">
        {/* Column 1: Settings (Theme Panel & Transition Panel) */}
        <div className="lg:w-1/3 rounded-md shadow-lg flex flex-col overflow-hidden" 
          style={{ 
            backgroundColor: '#1a1a1a',
            borderRadius: 'var(--radius)',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
          <div className="flex border-b border-gray-800">
            <button 
              onClick={() => setActiveDisplayTab('themes')}
              className={`flex-1 p-3 text-center font-medium transition-all duration-200 flex items-center justify-center
                          ${
                            activeDisplayTab === 'themes' 
                              ? 'border-b-2' 
                              : 'opacity-70 hover:opacity-100'
                          }`}
              style={{
                color: activeDisplayTab === 'themes' ? (activeTheme.colors[1]?.hex || '#E5E7EB') : 'rgba(255,255,255,0.6)',
                borderColor: activeDisplayTab === 'themes' ? (activeTheme.colors[1]?.hex || '#E5E7EB') : 'transparent'
              }}
            >
              <Palette size={16} className="mr-2" /> Themes
            </button>
            <button 
              onClick={() => setActiveDisplayTab('transitions')}
              className={`flex-1 p-3 text-center font-medium transition-all duration-200 flex items-center justify-center
                          ${
                            activeDisplayTab === 'transitions' 
                              ? 'border-b-2' 
                              : 'opacity-70 hover:opacity-100'
                          }`}
               style={{
                color: activeDisplayTab === 'transitions' ? (activeTheme.colors[1]?.hex || '#E5E7EB') : 'rgba(255,255,255,0.6)',
                borderColor: activeDisplayTab === 'transitions' ? (activeTheme.colors[1]?.hex || '#E5E7EB') : 'transparent'
              }}
            >
              <Film size={16} className="mr-2" /> Transitions
            </button>
            <button 
              onClick={() => setActiveDisplayTab('timing')}
              className={`flex-1 p-3 text-center font-medium transition-all duration-200 flex items-center justify-center
                          ${
                            activeDisplayTab === 'timing' 
                              ? 'border-b-2' 
                              : 'opacity-70 hover:opacity-100'
                          }`}
               style={{
                color: activeDisplayTab === 'timing' ? (activeTheme.colors[1]?.hex || '#E5E7EB') : 'rgba(255,255,255,0.6)',
                borderColor: activeDisplayTab === 'timing' ? (activeTheme.colors[1]?.hex || '#E5E7EB') : 'transparent'
              }}
            >
              <Timer size={16} className="mr-2" /> {/* Used Timer icon */}
              Timing
            </button>
          </div>

          <div className="flex-grow p-3 overflow-y-scroll custom-scrollbar">
            {activeDisplayTab === 'themes' && <ThemePanel />}
            {activeDisplayTab === 'transitions' && <TransitionPanel />}
            {activeDisplayTab === 'timing' && <TimingPanel />}
          </div>
        </div>

        {/* Column 2: Content Management (Slide Editor) */}
        <div className="lg:w-2/3 rounded-md flex flex-col overflow-hidden"
          style={{
            backgroundColor: '#1a1a1a',
            borderRadius: 'var(--radius)',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
          <h2 
            className="text-xl md:text-2xl font-semibold border-b pb-3 p-4 flex-shrink-0 z-10"
            style={{
              borderColor: 'rgba(255,255,255,0.1)',
              color: activeTheme.colors[1]?.hex || '#E5E7EB',
              letterSpacing: '-0.025em'
            }}
          >Slide Management</h2>
          {loadingDetails && (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              <span className="ml-3 text-sm text-gray-300">Loading slide details...</span>
            </div>
          )}
          {errorDetails && (
            <div className="p-4 m-4 rounded-md bg-red-900/30 border border-red-700/50 text-red-200">
              <p className="text-sm font-medium">Error: {errorDetails}</p>
            </div>
          )}
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
        className="mt-8 text-center text-xs flex-shrink-0 pb-4"
        style={{ color: 'rgba(255,255,255,0.4)' }}
      >
        <p>&copy; {new Date().getFullYear()} Case Closed Slideshow Admin. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default AdminPortal; 