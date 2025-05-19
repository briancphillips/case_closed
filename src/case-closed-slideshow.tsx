import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Search, X, Maximize, RotateCcw, RotateCw } from 'lucide-react';
import EXIF from 'exif-js';
import axios from 'axios';
import { useTheme } from './ThemeContext';

interface Image {
  id: number;
  src: string;
  title: string;
  description: string;
}

// Server URL - will work with both Vite proxy and direct connection
// Uses relative URL which will use the same origin 
const API_URL = '/api';

const CaseClosedSlideshow = () => {
  const { activeTheme } = useTheme();
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [orientations, setOrientations] = useState<Record<number, number>>({});
  const [manualRotations, setManualRotations] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [naturalDimensions, setNaturalDimensions] = useState<{ width: number; height: number } | null>(null);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const slideshowRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    setNaturalDimensions(null); // Reset when current image changes, before new one loads
  }, [currentIndex]);

  // Define the isRotated90or270 function earlier in the component
  const isImageRotated90or270 = useCallback(() => {
    const currentImagePath = images[currentIndex]?.src;
    if (!currentImagePath) return false;
    
    // Normalize the path
    const normalizedPath = currentImagePath.replace(/^\//, '');
    
    // Check manual rotation
    if (manualRotations[normalizedPath] !== undefined) {
      return manualRotations[normalizedPath] === 90 || manualRotations[normalizedPath] === 270;
    }
    
    // Check EXIF orientation
    return [5, 6, 7, 8].includes(orientations[currentIndex] || 0);
  }, [images, currentIndex, manualRotations, orientations]);

  // Fetch stored rotations from the server
  const fetchRotations = useCallback(async () => {
    try {
      console.log('Fetching rotations from server...');
      const response = await axios.get(`${API_URL}/rotations`);
      console.log('Received rotations from server:', response.data);
      setManualRotations(response.data);
    } catch (error) {
      console.error('Error fetching rotations:', error);
    }
  }, []);

  // Save rotation to the server
  const saveRotation = useCallback(async (imagePath: string, degrees: number) => {
    try {
      console.log(`Saving rotation for ${imagePath}: ${degrees}deg`);
      setIsSaving(true);
      const response = await axios.post(`${API_URL}/rotations`, {
        imagePath,
        rotation: degrees
      });
      console.log('Server response:', response.data);
      setIsSaving(false);
    } catch (error) {
      console.error('Error saving rotation:', error);
      setIsSaving(false);
    }
  }, []);
  
  // Load image data and fetch rotations
  useEffect(() => {
    // This is a placeholder - you would replace this with your actual images
    const imageFileNames = [
      "IMG_7203.jpeg", "5195327856631437211.jpeg", "1764409001838833815.jpg", "3610925462567303069.jpg",
      "4942780283842629349.jpg", "7480624530760995708.jpg", "3087990193705241170.jpg", "IMG_0565.jpeg",
      "8730675802130183943.jpg", "3706443471104616931.jpg", "684184206088502385.jpg", "FullSizeRender.jpeg",
      "IMG_1803.jpeg", "B8F1E51B-DC40-431D-A939-64E5707B5BBC.jpeg", "IMG_1502.jpeg", "IMG_1057.png",
      "IMG_0407.jpeg", "IMG_0114.jpeg", "IMG_9735.jpeg", "5588983518907349266.jpg", "5722209987174108697.jpg",
      "7836235424285709223.jpg", "IMG_8733.jpeg", "IMG_8687.jpeg", "IMG_7486.JPG", "IMG_7480.JPG",
      "IMG_5192.jpeg", "20180303_165434.jpeg", "IMG_1208.png", "20230819 - Aminata Yaro-36.JPEG",
      "IMG_7095.jpeg", "_A737237.jpeg", "_A737151.jpeg", "IMG_8639.jpeg", "IMG_5998.JPEG", "IMG_0220.JPEG",
      "IMG_8475.JPG", "IMG_8623.jpeg", "IMG_1866.JPG", "IMG_8613.jpeg", "20200822_220856.JPG",
      "IMG_5947.jpeg", "IMG_2277.jpeg", "FullSizeRender (1).jpeg", "8D881CE3-283C-4984-A240-44D7727EC4A7.jpeg",
      "IMG_7749.jpeg", "IMG_9959.jpeg", "IMG_0331.jpeg", "IMG_9469.jpeg", "IMG_0469.jpeg", "IMG_0470.jpeg",
      "544FEE31-7272-4905-A1F2-B6B9F0A00FE5_1_105_c.jpeg", "grandparents.jpeg", "me + BGT.JPG",
      "B0AA60CE-BB57-488F-9F73-1FC8F8169EF3_1_105_c.jpeg", "CE01B80B-E669-4AB4-AC39-F92180F60EB5_1_105_c.jpeg",
      "109F284D-D484-4F7C-9A2E-0BFCC3A315A2_1_105_c.jpeg", "75AFEAA1-5543-476C-AA30-EB9E5B2B5D02_1_105_c.jpeg",
      "910F9B33-E0DD-4EB5-82B5-84538B24724C_1_105_c.jpeg", "5D265BA3-2621-46A0-864D-02CB8102C6E8_1_105_c.jpeg",
      "4C5D07C2-5DDA-4269-8A17-E84D071DAA3E_1_105_c.jpeg"
    ];

    const loadedImages = imageFileNames.map((fileName, index) => {
      // Remove the file extension for display
      const displayName = fileName.replace(/\.[^/.]+$/, "");
      
      return {
        id: index + 1,
        src: `/slides/${fileName}`,
        title: `Case File #${index + 1}: ${displayName}`,
        description: `Braxton's Graduation - Exhibit ${displayName}`
      };
    });
    
    setImages(loadedImages);
    fetchRotations();
    setLoading(false);
  }, [fetchRotations]);

  // Function to get transform based on EXIF orientation
  const getRotationTransform = (orientation: number): string => {
    // EXIF orientation values and their corresponding transforms
    switch(orientation) {
      case 2: return 'scale(-1, 1)'; // Flip horizontally
      case 3: return 'rotate(180deg)'; // Rotate 180°
      case 4: return 'scale(-1, 1) rotate(180deg)'; // Flip horizontally and rotate 180°
      case 5: return 'scale(-1, 1) rotate(90deg)'; // Flip horizontally and rotate 90° CCW
      case 6: return 'rotate(90deg)'; // Rotate 90° CW
      case 7: return 'scale(-1, 1) rotate(-90deg)'; // Flip horizontally and rotate 90° CW
      case 8: return 'rotate(-90deg)'; // Rotate 90° CCW
      default: return 'none'; // Default - no transform
    }
  };

  // Extract EXIF orientation when image loads
  const handleImageLoad = () => {
    if (imageRef.current) {
      const imgElement = imageRef.current;
      // @ts-ignore - EXIF.js actually can work with HTMLImageElement but TS doesn't know that
      EXIF.getData(imgElement, function() {
        // @ts-ignore - EXIF.js adds getTag method to the element
        const orientation = EXIF.getTag(this, 'Orientation');
        if (orientation) {
          setOrientations(prev => ({
            ...prev,
            [currentIndex]: orientation
          }));
        }
      });

      // Set natural dimensions
      if (imgElement.naturalWidth > 0 && imgElement.naturalHeight > 0) {
        setNaturalDimensions({ width: imgElement.naturalWidth, height: imgElement.naturalHeight });
      } else {
        setNaturalDimensions(null); // Reset if dimensions are invalid
      }
    } else {
      setNaturalDimensions(null);
    }
  };

  // Add manual rotation functionality
  const rotateImage = (direction: 'clockwise' | 'counterclockwise') => {
    if (!images[currentIndex]) return;
    
    const degrees = direction === 'clockwise' ? 90 : -90;
    const imagePath = images[currentIndex].src;
    
    // Make sure the image path is properly formatted as a string
    const normalizedPath = imagePath.replace(/^\//, ''); // Remove leading slash if present
    
    const currentRotation = manualRotations[normalizedPath] || 0;
    // Normalize to 0, 90, 180, 270
    const newRotation = ((currentRotation + degrees) % 360 + 360) % 360;
    
    // Update local state
    setManualRotations(prev => ({
      ...prev,
      [normalizedPath]: newRotation
    }));
    
    // Save to server
    saveRotation(normalizedPath, newRotation);
  };

  const goToNextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex === images.length - 1 ? 0 : prevIndex + 1));
  };

  const goToPreviousSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? images.length - 1 : prevIndex - 1));
  };

  // Real fullscreen implementation using the browser's Fullscreen API
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      // Enter fullscreen
      if (slideshowRef.current && slideshowRef.current.requestFullscreen) {
        slideshowRef.current.requestFullscreen()
          .then(() => {
            setIsFullscreen(true);
          })
          .catch(err => {
            console.error(`Error attempting to enable fullscreen: ${err.message}`);
          });
      } else {
        // Fallback for browsers without fullscreen API
        setIsFullscreen(true);
      }
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen()
          .then(() => {
            setIsFullscreen(false);
          })
          .catch(err => {
            console.error(`Error attempting to exit fullscreen: ${err.message}`);
          });
      } else {
        // Fallback for browsers without fullscreen API
        setIsFullscreen(false);
      }
    }
  };

  // Monitor fullscreen changes from outside source (like Escape key)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Simple toggle for zoom state
  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
  };

  // Get combined transform (EXIF + manual)
  const getTransform = () => {
    let transform = 'none';
    
    // Get current image path
    const currentImagePath = images[currentIndex]?.src;
    if (!currentImagePath) return transform;
    
    // Normalize the path
    const normalizedPath = currentImagePath.replace(/^\//, '');
    
    // Check for manual rotation first (overrides EXIF)
    if (manualRotations[normalizedPath] !== undefined) {
      return `rotate(${manualRotations[normalizedPath]}deg)`;
    }
    
    // Fall back to EXIF orientation
    if (orientations[currentIndex]) {
      transform = getRotationTransform(orientations[currentIndex]);
    }
    
    return transform;
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goToNextSlide();
      if (e.key === 'ArrowLeft') goToPreviousSlide();
      if (e.key === 'Escape' && isFullscreen) toggleFullscreen();
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentIndex, images.length, isFullscreen]);

  // Auto-advance slides every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isZoomed) {
        goToNextSlide();
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [currentIndex, isZoomed]);

  useEffect(() => {
    const handleResize = () => {
      setViewportHeight(window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // We will modify the JSX part to use Flexbox natural sizing
  // Function to render with themed styles
  return (
    <div
      ref={slideshowRef}
      className={`min-h-screen w-full bg-primary text-quaternary`}
      style={{
        backgroundColor: activeTheme.colors[0].hex,
        color: activeTheme.colors[3].hex || '#ffffff'
      }}
    >
      {loading ? (
        <div className="flex justify-center items-center h-screen">
          <div className="text-2xl">Loading Case Files...</div>
        </div>
      ) : (
        <div className="flex flex-col h-screen">
          {/* Header Bar */}
          <div 
            className="p-4 flex justify-between items-center border-b border-tertiary flex-shrink-0"
            style={{ borderColor: activeTheme.colors[2].hex }}
          >
            <h1 className="text-2xl font-bold">Case Closed: {images[currentIndex]?.title}</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => rotateImage('counterclockwise')}
                className="p-2 rounded-full hover:bg-secondary transition-colors"
                style={{ backgroundColor: 'transparent' }}
                title="Rotate Left"
                disabled={isSaving}
              >
                <RotateCcw className="w-6 h-6" />
              </button>
              <button
                onClick={() => rotateImage('clockwise')}
                className="p-2 rounded-full hover:bg-secondary transition-colors"
                style={{ backgroundColor: 'transparent' }}
                title="Rotate Right"
                disabled={isSaving}
              >
                <RotateCw className="w-6 h-6" />
              </button>
              <button 
                onClick={toggleFullscreen}
                className="p-2 rounded-full hover:bg-secondary transition-colors"
                style={{ 
                  backgroundColor: 'transparent',
                }}
                title="Toggle Fullscreen"
              >
                <Maximize className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Main content area - takes all available space */}
          <div
            className="relative flex flex-col items-center justify-center py-4 px-4 flex-grow overflow-hidden"
            ref={containerRef}
          >
            {/* Image container - note we moved ref to parent */}
            <div
              className={`relative overflow-hidden max-w-5xl mx-auto ${isFullscreen ? 'w-full h-full' : ''}`}
              style={{
                backgroundColor: activeTheme.colors[4].hex || '#333',
                boxShadow: `0 10px 25px rgba(0, 0, 0, 0.3)`,
                borderRadius: '8px',
                padding: '4px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                transform: getTransform(),
                transition: 'transform 0.3s ease-in-out',
                width: 'auto',
                height: 'auto',
                maxWidth: isImageRotated90or270() ? '92%' : '96%',
                maxHeight: isImageRotated90or270() ? '96%' : '92%'
              }}
            >
              <img
                ref={imageRef}
                src={images[currentIndex]?.src}
                alt={images[currentIndex]?.title}
                className={`object-contain ${isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  width: 'auto',
                  height: 'auto'
                }}
                onClick={toggleZoom}
                onLoad={handleImageLoad}
              />
            </div>

            {/* Navigation buttons with theme colors */}
            <button
              onClick={goToPreviousSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-secondary text-primary opacity-75 hover:opacity-100 transition-opacity"
              style={{ 
                backgroundColor: activeTheme.colors[1].hex,
                color: activeTheme.colors[2].hex
              }}
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            <button
              onClick={goToNextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-secondary text-primary opacity-75 hover:opacity-100 transition-opacity"
              style={{ 
                backgroundColor: activeTheme.colors[1].hex,
                color: activeTheme.colors[2].hex
              }}
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          </div>

          {/* Footer - doesn't push content, takes its own space */}
          <div 
            className="p-4 bg-secondary text-center flex-shrink-0 border-t"
            style={{ 
              backgroundColor: activeTheme.colors[1].hex,
              color: '#ffffff',
              borderColor: activeTheme.colors[2].hex
            }}
          >
            <div className="max-w-4xl mx-auto">
              <p className="text-lg">{images[currentIndex]?.description}</p>
              <p className="text-sm mt-2">Image {currentIndex + 1} of {images.length}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseClosedSlideshow; 