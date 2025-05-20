import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Maximize, RotateCcw, RotateCw } from 'lucide-react';
import EXIF from 'exif-js';
import axios from 'axios';
import { useTheme } from './ThemeContext';
import { imageFileNames } from './slideData';

interface Image {
  id: number;
  src: string;
  title: string;
  description: string;
}

interface CaseClosedSlideshowProps {
  preloadedRotations?: Record<string, number>;
}

const API_URL = '/api';

const CaseClosedSlideshow: React.FC<CaseClosedSlideshowProps> = ({ preloadedRotations }) => {
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
  const [animationKey, setAnimationKey] = useState(0); 
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const slideshowRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    setNaturalDimensions(null); 
  }, [currentIndex]);

  const isImageRotated90or270 = useCallback(() => {
    const currentImagePath = images[currentIndex]?.src;
    if (!currentImagePath) return false;
    
    const normalizedPath = currentImagePath.replace(/^\//, '');
    
    if (manualRotations[normalizedPath] !== undefined) {
      return manualRotations[normalizedPath] === 90 || manualRotations[normalizedPath] === 270;
    }
    
    return [5, 6, 7, 8].includes(orientations[currentIndex] || 0);
  }, [images, currentIndex, manualRotations, orientations]);

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

  useEffect(() => {
    const loadedImages = imageFileNames.map((fileName, index) => {
      const displayName = fileName.replace(/\.[^/.]+$/, "");
      
      return {
        id: index + 1,
        src: `/slides/${fileName}`,
        title: `Case File #${index + 1}: ${displayName}`,
        description: `Braxton's Graduation - Exhibit ${displayName}`
      };
    });
    
    setImages(loadedImages);
    if (preloadedRotations) {
      console.log('Using preloaded rotations:', preloadedRotations);
      setManualRotations(preloadedRotations);
    } else {
      fetchRotations();
    }
    setLoading(false);
  }, [fetchRotations, preloadedRotations]);

  const getRotationTransform = (orientation: number): string => {
    switch(orientation) {
      case 2: return 'scale(-1, 1)'; 
      case 3: return 'rotate(180deg)'; 
      case 4: return 'scale(-1, 1) rotate(180deg)'; 
      case 5: return 'scale(-1, 1) rotate(90deg)'; 
      case 6: return 'rotate(90deg)'; 
      case 7: return 'scale(-1, 1) rotate(-90deg)'; 
      case 8: return 'rotate(-90deg)'; 
      default: return 'none'; 
    }
  };

  const handleImageLoad = () => {
    if (imageRef.current) {
      const imgElement = imageRef.current;
      try {
        // @ts-ignore - EXIF.js actually can work with HTMLImageElement but TS doesn't know that
        EXIF.getData(imgElement, function() {
          try {
            // @ts-ignore - EXIF.js adds getTag method to the element
            const orientation = EXIF.getTag(this, 'Orientation');
            if (orientation) {
              setOrientations(prev => ({
                ...prev,
                [currentIndex]: orientation
              }));
            }
          } catch (tagError) {
            console.warn(`Error reading EXIF tag for image ${images[currentIndex]?.src}:`, tagError);
          }
        });
      } catch (exifError) {
        console.warn(`Error initializing EXIF.getData for image ${images[currentIndex]?.src}:`, exifError);
      }

      if (imgElement.naturalWidth > 0 && imgElement.naturalHeight > 0) {
        setNaturalDimensions({ width: imgElement.naturalWidth, height: imgElement.naturalHeight });
      } else {
        setNaturalDimensions(null); 
      }
    } else {
      setNaturalDimensions(null);
    }
  };

  const rotateImage = (direction: 'clockwise' | 'counterclockwise') => {
    if (!images[currentIndex]) return;
    
    const degrees = direction === 'clockwise' ? 90 : -90;
    const imagePath = images[currentIndex].src;
    
    const normalizedPath = imagePath.replace(/^\//, ''); 
    
    const currentRotation = manualRotations[normalizedPath] || 0;
    const newRotation = ((currentRotation + degrees) % 360 + 360) % 360;
    
    setManualRotations(prev => ({
      ...prev,
      [normalizedPath]: newRotation
    }));
    
    saveRotation(normalizedPath, newRotation);
  };

  const goToNextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex === images.length - 1 ? 0 : prevIndex + 1));
    setAnimationKey(prevKey => prevKey + 1); 
  };

  const goToPreviousSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? images.length - 1 : prevIndex - 1));
    setAnimationKey(prevKey => prevKey + 1); 
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (slideshowRef.current && slideshowRef.current.requestFullscreen) {
        slideshowRef.current.requestFullscreen()
          .then(() => {
            setIsFullscreen(true);
          })
          .catch(err => {
            console.error(`Error attempting to enable fullscreen: ${err.message}`);
          });
      } else {
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
          .then(() => {
            setIsFullscreen(false);
          })
          .catch(err => {
            console.error(`Error attempting to exit fullscreen: ${err.message}`);
          });
      } else {
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
  };

  const getTransform = () => {
    let transform = 'none';
    
    const currentImagePath = images[currentIndex]?.src;
    if (!currentImagePath) return transform;
    
    const normalizedPath = currentImagePath.replace(/^\//, '');
    
    if (manualRotations[normalizedPath] !== undefined) {
      return `rotate(${manualRotations[normalizedPath]}deg)`;
    }
    
    if (orientations[currentIndex]) {
      transform = getRotationTransform(orientations[currentIndex]);
    }
    
    return transform;
  };

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

          <div
            className="relative flex flex-col items-center justify-center py-4 px-4 flex-grow overflow-hidden"
            ref={containerRef}
          >
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
              {images.length > 0 && images[currentIndex] && (
                <div 
                  key={animationKey} 
                  className="image-slide-transition w-full h-full flex items-center justify-center"
                >
                  <img
                    ref={imageRef}
                    src={images[currentIndex].src}
                    alt={images[currentIndex].title}
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
              )}
            </div>

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