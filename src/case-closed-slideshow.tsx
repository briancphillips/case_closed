import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Maximize, RotateCcw, RotateCw, Focus } from 'lucide-react';
import EXIF from 'exif-js';
import axios from 'axios';
import { useTheme } from './ThemeContext';
import { imageFileNames } from './slideData';
import { SlideTransition, defaultTransition } from './slideTransitions';

interface SlideDetailsData {
  title?: string;
  description?: string;
  isHidden?: boolean;
}

interface SlideDetailsApiResponse {
  [imagePath: string]: SlideDetailsData;
}

interface Image {
  id: number;
  src: string;
  title: string;
  description: string;
  isHidden?: boolean;
}

interface CaseClosedSlideshowProps {
  preloadedRotations?: Record<string, number>;
  preloadedSlideDetails?: SlideDetailsApiResponse;
  onCurrentSlideChangeForAdmin?: (slideInfo: { src: string | null; title: string; description: string }) => void;
  isAdminPanelOpen?: boolean;
  activeTransition?: SlideTransition;
}

const API_URL = '/api';

const CaseClosedSlideshow: React.FC<CaseClosedSlideshowProps> = ({ 
  preloadedRotations, 
  preloadedSlideDetails, 
  onCurrentSlideChangeForAdmin,
  isAdminPanelOpen,
  activeTransition
}) => {
  const { activeTheme } = useTheme();
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState(false);
  const [isImmersiveModeActive, setIsImmersiveModeActive] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [orientations, setOrientations] = useState<Record<number, number>>({});
  const [manualRotations, setManualRotations] = useState<Record<string, number>>({});
  const [slideDetails, setSlideDetails] = useState<SlideDetailsApiResponse>({});
  const [isSaving, setIsSaving] = useState(false);
  const [naturalDimensions, setNaturalDimensions] = useState<{ width: number; height: number } | null>(null);
  const [animationKey, setAnimationKey] = useState(0);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(null);
  const [activeTransitionClassName, setActiveTransitionClassName] = useState<string>(
    activeTransition?.className || defaultTransition.className
  );
  const [previousIndex, setPreviousIndex] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [initialTransform, setInitialTransform] = useState<string>('translateX(0%)');
  const [exitDirection, setExitDirection] = useState<'left' | 'right'>('left');
  const [exitingTransform, setExitingTransform] = useState<string>('translateX(0%)');
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const slideshowRef = useRef<HTMLDivElement>(null);
  const autoAdvanceTimerRef = useRef<number | null>(null);
  
  // Function to get next image index
  const getNextIndex = useCallback(() => {
    return currentIndex === images.length - 1 ? 0 : currentIndex + 1;
  }, [currentIndex, images.length]);
  
  // Reset dimensions when changing slides
  useEffect(() => {
    setNaturalDimensions(null); 
  }, [currentIndex]);

  // Update activeTransitionClassName when activeTransition prop changes
  useEffect(() => {
    if (activeTransition?.className) {
      setActiveTransitionClassName(activeTransition.className);
      console.log("Using provided activeTransition:", activeTransition.name);
    }
  }, [activeTransition]);

  // Enhanced preloading: Preload a few slides ahead
  useEffect(() => {
    if (images.length === 0) return;
    
    // Preload next 3 images
    for (let i = 1; i <= 3; i++) {
      const preloadIndex = (currentIndex + i) % images.length;
      const img = new Image();
      img.src = images[preloadIndex]?.src;
    }
  }, [images, currentIndex]);

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
    let processedImages = imageFileNames.map((fileName, index) => {
      const normalizedSrc = `slides/${fileName}`;
      const defaultBaseTitle = fileName.replace(/\.[^/.]+$/, "");
      
      const details = preloadedSlideDetails ? preloadedSlideDetails[normalizedSrc] : null;

      return {
        id: index + 1,
        src: `/${normalizedSrc}`,
        title: details?.title || defaultBaseTitle,
        description: details?.description || `Braxton's Graduation - Exhibit ${defaultBaseTitle}`,
        isHidden: details?.isHidden || false,
      };
    });

    processedImages = processedImages.filter(img => !img.isHidden);
    setImages(processedImages);
    
    if (preloadedRotations) {
      const normalizedRotations: Record<string, number> = {};
      for (const key in preloadedRotations) {
        normalizedRotations[key.replace(/^\//, '')] = preloadedRotations[key];
      }
      setManualRotations(normalizedRotations);
    } else {
      fetchRotations();
    }

    if (preloadedSlideDetails) {
        setSlideDetails(preloadedSlideDetails);
    }
    setLoading(false);
  }, [preloadedRotations, preloadedSlideDetails, fetchRotations]);

  useEffect(() => {
    if (onCurrentSlideChangeForAdmin && images[currentIndex]) {
      const currentImage = images[currentIndex];
      onCurrentSlideChangeForAdmin({
        src: currentImage.src.replace(/^\//, ''),
        title: currentImage.title,
        description: currentImage.description,
      });
    }
  }, [currentIndex, images, onCurrentSlideChangeForAdmin]);

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
      
      // Always set dimensions first, regardless of EXIF processing
      if (imgElement.naturalWidth > 0 && imgElement.naturalHeight > 0) {
        setNaturalDimensions({ width: imgElement.naturalWidth, height: imgElement.naturalHeight });
        
        // Update container size once when first image loads if not already set
        if (!containerSize && containerRef.current) {
          const container = containerRef.current;
          setContainerSize({
            width: container.clientWidth,
            height: container.clientHeight
          });
        }
      } else {
        setNaturalDimensions(null); 
      }
      
      // Try to get EXIF data, but don't let errors interrupt the flow
      try {
        // Skip EXIF processing for non-JPEG images to avoid errors
        const src = imgElement.src.toLowerCase();
        if (!src.endsWith('.jpg') && !src.endsWith('.jpeg')) {
          // Not a JPEG, so just set default orientation
          setOrientations(prev => ({
            ...prev,
            [currentIndex]: 1 // Default to normal orientation
          }));
          return;
        }
        
        // Process EXIF for JPEG images
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
              } else {
                // No orientation tag found
                setOrientations(prev => ({
                  ...prev,
                  [currentIndex]: 1 // Default to normal orientation
                }));
              }
            } catch (tagError) {
              console.warn(`Error reading EXIF Orientation tag for image ${images[currentIndex]?.src}:`, tagError);
              // Set a default orientation or handle error gracefully if needed
              setOrientations(prev => ({
                ...prev,
                [currentIndex]: 1 // Default to normal orientation
              }));
            }
          });
        } catch (exifError) {
          console.warn(`Error initializing EXIF.getData for image ${images[currentIndex]?.src}:`, exifError);
          // If EXIF.getData itself fails, ensure a default orientation
          setOrientations(prev => ({
            ...prev,
            [currentIndex]: 1 // Default to normal orientation
          }));
        }
      } catch (error) {
        console.error("Complete failure in EXIF processing:", error);
        setOrientations(prev => ({
          ...prev,
          [currentIndex]: 1 // Default to normal orientation
        }));
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

  // Memoize goToNextSlide to stabilize its reference for useEffect dependency array
  const memoizedGoToNextSlide = useCallback(() => {
    if (images.length === 0) return;
    setPreviousIndex(currentIndex);
    setCurrentIndex((prevIndex) => (prevIndex === images.length - 1 ? 0 : prevIndex + 1));
    setIsTransitioning(true);
    setExitDirection('left'); // When going next, the previous slide exits to the left
    
    // Set initial transform based on active transition
    if (activeTransitionClassName === 'transition-slide-left') {
      // Start positions - new slide starts off-screen, current slide is visible
      setInitialTransform('translateX(100%)'); 
      setExitingTransform('translateX(0%)');
      
      // After a short delay, move both slides to their final positions
      setTimeout(() => {
        setInitialTransform('translateX(0%)'); // New slide moves to center
        setExitingTransform('translateX(-100%)'); // Current slide moves out to the left
      }, 50);
    } else if (activeTransitionClassName === 'transition-zoom-in') {
      setInitialTransform('scale(0.5)');
      setExitingTransform('scale(1)');
      
      setTimeout(() => {
        setInitialTransform('scale(1)');
        setExitingTransform('scale(1.5)');
      }, 50);
    } else {
      // Default to fade transition
      setInitialTransform('none');
      setExitingTransform('none');
    }
  }, [images.length, currentIndex, activeTransitionClassName]);

  // Reset auto-advance timer
  const resetAutoAdvanceTimer = useCallback(() => {
    // Clear any existing timer
    if (autoAdvanceTimerRef.current !== null) {
      clearInterval(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    
    // Set a new timer if conditions are right
    if (!isZoomed && !isAdminPanelOpen && images.length > 0) {
      autoAdvanceTimerRef.current = window.setInterval(() => {
        // Use the function we pass rather than direct reference to avoid circular dependency
        memoizedGoToNextSlide();
      }, 5000);
    }
  }, [isZoomed, isAdminPanelOpen, images.length, memoizedGoToNextSlide]);

  const goToPreviousSlide = () => {
    if (images.length === 0) return;
    setPreviousIndex(currentIndex);
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? images.length - 1 : prevIndex - 1));
    setIsTransitioning(true);
    setExitDirection('right'); // When going previous, the previous slide exits to the right
    
    // Set initial transform based on active transition but in the opposite direction for previous
    if (activeTransitionClassName === 'transition-slide-left') {
      // Start positions - new slide starts off-screen, current slide is visible
      setInitialTransform('translateX(-100%)');
      setExitingTransform('translateX(0%)');
      
      // After a short delay, move both slides to their final positions
      setTimeout(() => {
        setInitialTransform('translateX(0%)'); // New slide moves to center
        setExitingTransform('translateX(100%)'); // Current slide moves out to the right
      }, 50);
    } else if (activeTransitionClassName === 'transition-zoom-in') {
      setInitialTransform('scale(0.5)');
      setExitingTransform('scale(1)');
      
      setTimeout(() => {
        setInitialTransform('scale(1)');
        setExitingTransform('scale(1.5)');
      }, 50);
    } else {
      // Default to fade transition
      setInitialTransform('none');
      setExitingTransform('none');
    }
  };

  const toggleStandardFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      slideshowRef.current?.requestFullscreen();
      setIsImmersiveModeActive(false);
    }
  };

  const toggleImmersiveMode = () => {
    if (isImmersiveModeActive) {
      setIsImmersiveModeActive(false);
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
    } else {
      setIsImmersiveModeActive(true);
      if (!document.fullscreenElement) {
        slideshowRef.current?.requestFullscreen();
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const currentlyFullscreen = !!document.fullscreenElement;
      setIsBrowserFullscreen(currentlyFullscreen);
      if (!currentlyFullscreen) {
        setIsImmersiveModeActive(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
  };

  // Get container background style
  const getContainerBackgroundStyle = () => {
    return {
      backgroundColor: 'transparent',
      borderRadius: '8px',
      padding: '4px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: containerSize ? `${containerSize.width}px` : '100%',
      height: containerSize ? `${containerSize.height}px` : '100%',
      minHeight: '400px'
    };
  };

  // Get transform for the current image
  const getImageTransform = () => {
    const currentImagePath = images[currentIndex]?.src;
    if (!currentImagePath) return 'none';
    
    const normalizedPath = currentImagePath.replace(/^\//, '');
    
    if (manualRotations[normalizedPath] !== undefined) {
      return `rotate(${manualRotations[normalizedPath]}deg)`;
    }
    
    if (orientations[currentIndex]) {
      return getRotationTransform(orientations[currentIndex]);
    }
    
    return 'none';
  };

  // Get transform for a previous image
  const getPreviousImageTransform = () => {
    if (previousIndex === null) return 'none';
    
    const prevImagePath = images[previousIndex]?.src;
    if (!prevImagePath) return 'none';
    
    const normalizedPath = prevImagePath.replace(/^\//, '');
    
    if (manualRotations[normalizedPath] !== undefined) {
      return `rotate(${manualRotations[normalizedPath]}deg)`;
    }
    
    if (orientations[previousIndex]) {
      return getRotationTransform(orientations[previousIndex]);
    }
    
    return 'none';
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        memoizedGoToNextSlide();
      }
      if (e.key === 'ArrowLeft') {
        goToPreviousSlide();
      }
      if (e.key === 'Escape' && isBrowserFullscreen) {
        // Standard fullscreen exit is handled by fullscreenchange event
        // No specific call to toggleStandardFullscreen needed here as it would call exitFullscreen again
        // If immersive mode is active, the fullscreenchange listener will also turn it off.
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentIndex, images.length, isBrowserFullscreen, memoizedGoToNextSlide]);

  // Setup auto-advance and handle changes to relevant state
  useEffect(() => {
    resetAutoAdvanceTimer();
    
    return () => {
      if (autoAdvanceTimerRef.current !== null) {
        clearInterval(autoAdvanceTimerRef.current);
        autoAdvanceTimerRef.current = null;
      }
    };
  }, [isZoomed, isAdminPanelOpen, images.length, resetAutoAdvanceTimer]);

  // Reset timer when currentIndex changes (manual navigation)
  useEffect(() => {
    resetAutoAdvanceTimer();
    
    if (isTransitioning) {
      const timer = setTimeout(() => {
        setIsTransitioning(false);
        setPreviousIndex(null); // Clear previous index after transition
      }, 1500); // Match transition duration (1.5s)
      return () => clearTimeout(timer);
    }
  }, [currentIndex, resetAutoAdvanceTimer, isTransitioning]);

  // Update resize handler
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      ref={slideshowRef}
      className="slideshow-container min-h-screen w-full"
      style={{
        backgroundColor: activeTheme.colors[0].hex,
        color: `var(--text-on-primary)`,
        fontFamily: 'Inter, system-ui, sans-serif' // Modern font
      }}
    >
      {loading ? (
        <div className="flex justify-center items-center h-screen">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
            <div className="text-lg font-medium tracking-tight">Loading Case Files...</div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-screen">
          {/* Header: Conditionally hidden in immersive mode */}
          {!isImmersiveModeActive && (
            <div 
              className="px-6 py-4 flex justify-between items-center border-b flex-shrink-0"
              style={{ 
                borderColor: 'rgba(255,255,255,0.1)',
                color: `var(--text-on-primary)`,
                backdropFilter: 'blur(8px)',
                backgroundColor: `${activeTheme.colors[0].hex}99` // Semi-transparent primary color
              }}
            >
              <h1 className="text-2xl font-bold tracking-tight">
                {images[currentIndex] ? `Case File #${images[currentIndex].id}: ${images[currentIndex].title}` : 'Case Closed'}
              </h1>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleStandardFullscreen}
                  className="p-2 rounded-md hover:bg-white/10 transition-all duration-200 flex items-center justify-center"
                  style={{ 
                    color: `var(--text-on-primary)`
                  }}
                  title={isBrowserFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                >
                  <Maximize className="w-5 h-5" />
                </button>
                <button
                  onClick={toggleImmersiveMode}
                  className="p-2 rounded-md hover:bg-white/10 transition-all duration-200 flex items-center justify-center"
                  style={{ 
                    color: `var(--text-on-primary)`
                  }}
                  title={isImmersiveModeActive ? "Exit Immersive View" : "Enter Immersive View"}
                >
                  <Focus className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          <div
            className="relative flex flex-col items-center justify-center py-4 px-4 flex-grow overflow-hidden"
            ref={containerRef}
          >
            <div
              className="image-container relative max-w-5xl mx-auto"
              style={getContainerBackgroundStyle()}
            >
              {images.length > 0 && (
                <div className="slide-container">
                  {/* Current (Incoming) Slide */}
                  {images[currentIndex] && (
                    <div
                      key={`slide-${currentIndex}`}
                      className={`slide ${activeTransitionClassName} active`}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: activeTransitionClassName === 'transition-fade' ? 0 : 1, // Start invisible for fade
                        zIndex: 2,
                        transform: initialTransform,
                        transition: activeTransitionClassName === 'transition-fade' 
                                      ? 'opacity 1s ease-in-out' 
                                      : 'transform 1.5s cubic-bezier(0.33, 1, 0.68, 1), opacity 1.5s ease-in-out'
                      }}
                      onTransitionEnd={() => {
                        if (activeTransitionClassName === 'transition-fade') {
                          // Ensure opacity is set to 1 after transition
                          const elem = document.querySelector('.slide.active') as HTMLElement;
                          if (elem) elem.style.opacity = '1';
                        }
                      }}
                    >
                      <img
                        ref={imageRef}
                        src={images[currentIndex].src}
                        alt={images[currentIndex].title}
                        className={`object-contain ${isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'} shadow-2xl rounded-sm`}
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          width: 'auto',
                          height: 'auto',
                          transform: getImageTransform()
                        }}
                        onClick={toggleZoom}
                        onLoad={handleImageLoad}
                      />
                    </div>
                  )}
                  
                  {/* Previous (Exiting) Slide */}
                  {isTransitioning && previousIndex !== null && images[previousIndex] && (
                    <div
                      key={`slide-${previousIndex}-exiting`}
                      className={`slide ${activeTransitionClassName} exiting`}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: activeTransitionClassName === 'transition-fade' ? 1 : 1, // Start visible
                        zIndex: 1,
                        transform: exitingTransform,
                        transition: activeTransitionClassName === 'transition-fade' 
                                      ? 'opacity 1s ease-in-out' 
                                      : 'transform 1.5s cubic-bezier(0.33, 1, 0.68, 1), opacity 1.5s ease-in-out'
                      }}
                      onTransitionEnd={() => {
                        if (activeTransitionClassName === 'transition-fade') {
                          // Ensure opacity is set to 0 after transition
                          const elem = document.querySelector('.slide.exiting') as HTMLElement;
                          if (elem) elem.style.opacity = '0';
                        }
                      }}
                    >
                      <img
                        src={images[previousIndex].src}
                        alt={images[previousIndex].title}
                        className="object-contain shadow-2xl rounded-sm"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          width: 'auto',
                          height: 'auto',
                          transform: getPreviousImageTransform()
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
              
              {/* Hidden preload container */}
              <div style={{ display: 'none', position: 'absolute', pointerEvents: 'none' }}>
                {images.length > 0 && (
                  <>
                    <img src={images[(currentIndex + 1) % images.length]?.src} alt="preload" />
                    <img src={images[(currentIndex + 2) % images.length]?.src} alt="preload" />
                  </>
                )}
              </div>
            </div>

            {/* Navigation Buttons: Conditionally hidden in immersive mode */}
            {!isImmersiveModeActive && (
              <>
                <button
                  onClick={goToPreviousSlide}
                  className="absolute left-6 top-1/2 -translate-y-1/2 p-3 rounded-full backdrop-blur-sm shadow-lg opacity-80 hover:opacity-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/20"
                  style={{ 
                    backgroundColor: `${activeTheme.colors[1].hex}CC`, // Semi-transparent secondary
                    color: `var(--text-on-secondary)`,
                    transform: 'translateZ(0)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-50%) translateX(-2px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(-50%) translateX(0)';
                  }}
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={memoizedGoToNextSlide}
                  className="absolute right-6 top-1/2 -translate-y-1/2 p-3 rounded-full backdrop-blur-sm shadow-lg opacity-80 hover:opacity-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/20"
                  style={{ 
                    backgroundColor: `${activeTheme.colors[1].hex}CC`, // Semi-transparent secondary
                    color: `var(--text-on-secondary)`,
                    transform: 'translateZ(0)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-50%) translateX(2px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(-50%) translateX(0)';
                  }}
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Bottom Description: Conditionally hidden in immersive mode */}
          {!isImmersiveModeActive && (
            <div
              className="py-4 px-6 text-center flex-shrink-0 backdrop-blur-sm"
              style={{ 
                backgroundColor: `${activeTheme.colors[1].hex}DD`, // More opaque than buttons
                color: `var(--text-on-secondary)`,
                borderTop: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <div className="max-w-4xl mx-auto">
                <p className="text-lg font-medium tracking-tight">{images[currentIndex]?.description || 'Loading description...'}</p>
                <p className="text-xs mt-2 opacity-80">
                  {images.length > 0 ? `Image ${images.findIndex(img => img.id === images[currentIndex]?.id) + 1} of ${images.length}` : 'No images'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CaseClosedSlideshow;