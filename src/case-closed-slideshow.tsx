import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Search, X, Maximize, RotateCcw, RotateCw } from 'lucide-react';
import EXIF from 'exif-js';
import axios from 'axios';

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
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [orientations, setOrientations] = useState<Record<number, number>>({});
  const [manualRotations, setManualRotations] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const slideshowRef = useRef<HTMLDivElement>(null);
  
  // Define the isRotated90or270 function earlier in the component
  const isImageRotated90or270 = () => {
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
  };

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

    const loadedImages = imageFileNames.map((fileName, index) => ({
      id: index + 1,
      src: `/slides/${fileName}`,
      title: `Case File #${index + 1}: ${fileName}`,
      description: `Braxton's Graduation - Exhibit ${fileName}`
    }));
    
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
    if (imageRef.current && images.length > 0) {
      // @ts-ignore - EXIF.js actually can work with HTMLImageElement but TS doesn't know that
      EXIF.getData(imageRef.current, function() {
        // @ts-ignore - EXIF.js adds getTag method to the element
        const orientation = EXIF.getTag(this, 'Orientation');
        if (orientation) {
          setOrientations(prev => ({
            ...prev,
            [currentIndex]: orientation
          }));
        }
      });
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
    const handleKeyDown = (e) => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-gray-900 text-white">
        <div className="flex flex-col items-center">
          <div className="text-2xl font-detective mb-4">Loading Case Files...</div>
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  const transform = getTransform();
  const isRotated = isImageRotated90or270();
  
  return (
    <div 
      ref={slideshowRef}
      className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-black' : 'w-full h-[calc(100vh-4rem)] bg-black'}`}
    >
      {/* Case File Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gray-900 bg-opacity-80 text-white p-4 flex items-center justify-between">
        <div className="flex items-center">
          <div className="mr-2 text-red-500"><Search size={20} /></div>
          <div className="font-bold tracking-wider uppercase">CASE FILE: {images.length > 0 ? currentIndex + 1 : 0} of {images.length}</div>
        </div>
        <div className="flex space-x-4">
          <button 
            onClick={() => rotateImage('counterclockwise')} 
            className="hover:text-blue-400 transition" 
            aria-label="Rotate Counterclockwise"
            disabled={isSaving}
          >
            <RotateCcw size={20} className={isSaving ? "opacity-50" : ""} />
          </button>
          <button 
            onClick={() => rotateImage('clockwise')} 
            className="hover:text-blue-400 transition" 
            aria-label="Rotate Clockwise"
            disabled={isSaving}
          >
            <RotateCw size={20} className={isSaving ? "opacity-50" : ""} />
          </button>
          <button onClick={toggleZoom} className="hover:text-blue-400 transition" aria-label={isZoomed ? "Zoom Out" : "Zoom In"}>
            <Search size={20} />
          </button>
          <button onClick={toggleFullscreen} className="hover:text-blue-400 transition" aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
            <Maximize size={20} />
          </button>
          {isFullscreen && (
            <button onClick={toggleFullscreen} className="hover:text-red-400 transition" aria-label="Close Fullscreen">
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Main Slideshow Area */}
      <div className="relative w-full h-full overflow-hidden bg-gray-800">
        {/* Slideshow images */}
        {images.length > 0 && images[currentIndex] ? (
          <div 
            ref={containerRef}
            className="absolute inset-0 flex items-center justify-center" 
            style={{ 
              // Reserve space for header, navigation and caption
              top: "4rem", 
              bottom: "6rem" 
            }}
          >
            {/* Scientific approach to ensure no vertical clipping:
                1. Container is position: relative and has a fixed height
                2. Image container has object-fit: contain to maintain aspect ratio
                3. max-height ensures image never exceeds container height
                4. For rotated images, we adjust the container to account for the rotation
            */}
            <div 
              className={`relative ${isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
              onClick={toggleZoom}
              style={{
                // For horizontal images, zoom to 150% width but never exceed height
                // For vertical images, keep them fully visible
                width: isRotated ? '65vh' : (isZoomed ? '150%' : '90%'),
                height: isRotated ? '65vw' : '90%',
                maxHeight: '100%', // Critical: ensure height never exceeds container
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease-in-out'
              }}
            >
              <img 
                ref={imageRef}
                src={images[currentIndex].src} 
                alt={images[currentIndex].title}
                style={{
                  maxHeight: '100%', // Critical: ensure height never exceeds container
                  maxWidth: '100%',  // Critical: ensure width never exceeds container
                  objectFit: 'contain', // Critical: maintain aspect ratio while fitting in box
                  transform: transform,
                  transition: 'all 0.3s ease-in-out', // Smooth transition for zoom effect
                  scale: isZoomed ? '1.5' : '1' // Apply zoom effect to the image itself
                }}
                onLoad={handleImageLoad}
                onError={(e) => {
                  // Basic error handling
                  const target = e.target as HTMLImageElement; 
                  target.onerror = null; // prevent looping
                  target.src = `/api/placeholder/800/500?text=Error+Loading+${encodeURIComponent(images[currentIndex].title)}`;
                  console.error("Error loading image:", images[currentIndex].src);
                }}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center w-full h-full text-white text-xl">
            No images found or current image is invalid.
          </div>
        )}

        {/* Navigation Controls */}
        {images.length > 0 && (
          <>
            <button 
              className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-r hover:bg-opacity-70 transition-all disabled:opacity-50"
              onClick={goToPreviousSlide}
              disabled={images.length <= 1}
              aria-label="Previous Slide"
            >
              <ChevronLeft size={30} />
            </button>
            
            <button 
              className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-l hover:bg-opacity-70 transition-all disabled:opacity-50"
              onClick={goToNextSlide}
              disabled={images.length <= 1}
              aria-label="Next Slide"
            >
              <ChevronRight size={30} />
            </button>

            {/* Caption Area */}
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-4">
              <h3 className="text-xl font-bold mb-1">{images[currentIndex].title}</h3>
              <p className="text-sm text-gray-300">{images[currentIndex].description}</p>
            </div>

            {/* Slide Indicators */}
            <div className="absolute bottom-20 left-0 right-0 flex justify-center space-x-2 pb-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full ${
                    index === currentIndex ? 'bg-red-500 w-4' : 'bg-gray-400 hover:bg-gray-500'
                  } transition-all duration-300`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CaseClosedSlideshow; 