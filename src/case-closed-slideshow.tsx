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

export interface Image {
  id: number;
  src: string;
  title: string;
  description: string;
  isHidden?: boolean;
}

export interface SlideshowTimerSettings {
  autoAdvanceInterval?: number;
  navigationThrottleMs?: number;
  transitionPrepareDelayMs?: number;
}

interface CaseClosedSlideshowProps {
  preloadedRotations?: Record<string, number>;
  preloadedSlideDetails?: SlideDetailsApiResponse;
  onCurrentSlideChangeForAdmin?: (slideInfo: { src: string | null; title: string; description: string }) => void;
  isAdminPanelOpen?: boolean;
  activeTransition?: SlideTransition;
  timerSettings?: SlideshowTimerSettings;
}

const API_URL = '/api';

// Define transition lifecycle status
type TransitionStatus = 'idle' | 'preparing' | 'active' | 'finishing';

const CaseClosedSlideshow: React.FC<CaseClosedSlideshowProps> = ({ 
  preloadedRotations, 
  preloadedSlideDetails, 
  onCurrentSlideChangeForAdmin,
  isAdminPanelOpen,
  activeTransition,
  timerSettings
}) => {
  const { activeTheme } = useTheme();

  const { 
    autoAdvanceInterval = 5000, 
    navigationThrottleMs = 600, 
    transitionPrepareDelayMs = 30 
  } = timerSettings || {};

  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // New simplified state for transitions
  const [previousSlide, setPreviousSlide] = useState<Image | null>(null);
  const [transitionStatus, setTransitionStatus] = useState<TransitionStatus>('idle');
  
  const [activeTransitionClassName, setActiveTransitionClassName] = useState<string>(
    activeTransition?.className || defaultTransition.className
  );

  // Existing state variables - will review if all are still needed after full refactor
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState(false);
  const [isImmersiveModeActive, setIsImmersiveModeActive] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [orientations, setOrientations] = useState<Record<number, number>>({});
  const [manualRotations, setManualRotations] = useState<Record<string, number>>({});
  const [slideDetails, setSlideDetails] = useState<SlideDetailsApiResponse>({});
  const [isSaving, setIsSaving] = useState(false); // For image rotation saving
  const [naturalDimensions, setNaturalDimensions] = useState<{ width: number; height: number } | null>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(null);
  
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const slideshowRef = useRef<HTMLDivElement>(null);
  const autoAdvanceTimerRef = useRef<number | null>(null);
  const transitionEndCounterRef = useRef<number>(0); // To count transitionend events
  const transitionTimeoutRef = useRef<number | null>(null); // For transition timeouts

  // Throttling for navigation
  const lastNavigationTimeRef = useRef<number>(0);

  // Function to get next image index (no change needed here for now)
  const getNextIndex = useCallback(() => {
    if (images.length === 0) return 0;
    return (currentIndex + 1) % images.length;
  }, [currentIndex, images.length]);

  const getPrevIndex = useCallback(() => {
    if (images.length === 0) return 0;
    return (currentIndex - 1 + images.length) % images.length;
  }, [currentIndex, images.length]);
  
  useEffect(() => {
    setNaturalDimensions(null); 
  }, [currentIndex]);

  useEffect(() => {
    if (activeTransition?.className) {
      setActiveTransitionClassName(activeTransition.className);
    }
  }, [activeTransition]);

  // Image preloading (no change needed here for now)
  useEffect(() => {
    if (images.length === 0 || loading) return;
    for (let i = 1; i <= 3; i++) {
      const preloadIndex = (currentIndex + i) % images.length;
      if (images[preloadIndex]) {
        const img = new window.Image(); // Use window.Image for clarity
        img.src = images[preloadIndex].src;
      }
    }
  }, [images, currentIndex, loading]);

  // Data fetching and initial setup (largely unchanged for now)
  const fetchRotations = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/rotations`);
      setManualRotations(response.data || {});
    } catch (error) {
      console.error('Error fetching rotations:', error);
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
  
  // Admin panel communication (unchanged for now)
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


  // Refactored Navigation Logic
  const startTransition = useCallback((newIndex: number) => {
    if (images.length === 0 || transitionStatus !== 'idle') {
      return;
    }

    const now = Date.now();
    if (now - lastNavigationTimeRef.current < navigationThrottleMs && activeTransitionClassName !== 'transition-none') {
        console.log("Navigation throttled");
        return; 
    }
    lastNavigationTimeRef.current = now;
    
    setTransitionStatus('preparing');
    setPreviousSlide(images[currentIndex] || null); // Store current as previous
    setCurrentIndex(newIndex); // Set new current index
    transitionEndCounterRef.current = 0; // Reset for new transition

  }, [images, currentIndex, transitionStatus, activeTransitionClassName, navigationThrottleMs]);

  const memoizedGoToNextSlide = useCallback(() => {
    startTransition(getNextIndex());
  }, [startTransition, getNextIndex]);

  const goToPreviousSlide = useCallback(() => {
    startTransition(getPrevIndex());
  }, [startTransition, getPrevIndex]);

  // Effect to advance transition from 'preparing' to 'active'
  useEffect(() => {
    if (transitionStatus === 'preparing') {
      // This timeout allows React to render the new currentIndex and previousSlide
      // before we change classes to trigger the animation.
      const timer = setTimeout(() => {
        setTransitionStatus('active');
      }, transitionPrepareDelayMs); // Small delay for DOM update
      transitionTimeoutRef.current = timer as unknown as number;
      return () => {
        clearTimeout(timer);
        transitionTimeoutRef.current = null;
      };
    }
  }, [transitionStatus, transitionPrepareDelayMs]);
  
  // Effect to handle 'finishing' state and reset to 'idle'
  // This will be triggered by onTransitionEnd later
  useEffect(() => {
    if (transitionStatus === 'finishing') {
      setPreviousSlide(null);
      setTransitionStatus('idle');
      transitionEndCounterRef.current = 0;
    }
  }, [transitionStatus]);

  // Auto-advance timer logic (will need to respect new transitionStatus)
  const resetAutoAdvanceTimer = useCallback(() => {
    if (autoAdvanceTimerRef.current !== null) {
      clearInterval(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    if (!isZoomed && !isAdminPanelOpen && images.length > 0 && transitionStatus === 'idle') {
      autoAdvanceTimerRef.current = window.setInterval(() => {
        memoizedGoToNextSlide();
      }, autoAdvanceInterval);
    }
  }, [isZoomed, isAdminPanelOpen, images.length, memoizedGoToNextSlide, transitionStatus, autoAdvanceInterval]);

  // Handle transition end events to detect when both slides have completed their transitions
  const handleTransitionEnd = useCallback((e: React.TransitionEvent) => {
    // Only count transitions for transform or opacity properties
    // This prevents counting unrelated transitions
    if (e.propertyName !== 'transform' && e.propertyName !== 'opacity') {
      return;
    }
    
    // Only process during the 'active' phase
    if (transitionStatus !== 'active') {
      return;
    }
    
    // Increment the counter
    transitionEndCounterRef.current += 1;
    
    // We expect 2 transition end events (one from each slide)
    // Some transitions might trigger multiple events (one per property)
    // For simplicity, we'll consider the transition complete after 2 events
    if (transitionEndCounterRef.current >= 2) {
      // Both transitions have completed, move to finishing state
      setTransitionStatus('finishing');
    }
  }, [transitionStatus]);

  useEffect(() => {
    resetAutoAdvanceTimer();
    return () => {
      if (autoAdvanceTimerRef.current !== null) {
        clearInterval(autoAdvanceTimerRef.current);
      }
    };
  }, [resetAutoAdvanceTimer]);


  // --- Remaining functions (EXIF, rotation, fullscreen, zoom, styles) ---
  // These are largely independent of the transition core logic but will be reviewed.

  const isImageRotated90or270 = useCallback(() => {
    const currentImagePath = images[currentIndex]?.src;
    if (!currentImagePath) return false;
    const normalizedPath = currentImagePath.replace(/^\//, '');
    if (manualRotations[normalizedPath] !== undefined) {
      return manualRotations[normalizedPath] === 90 || manualRotations[normalizedPath] === 270;
    }
    return [5, 6, 7, 8].includes(orientations[currentIndex] || 0);
  }, [images, currentIndex, manualRotations, orientations]);

  const saveRotation = useCallback(async (imagePath: string, degrees: number) => {
    try {
      setIsSaving(true);
      await axios.post(`${API_URL}/rotations`, { imagePath, rotation: degrees });
      setIsSaving(false);
    } catch (error) {
      console.error('Error saving rotation:', error);
      setIsSaving(false);
    }
  }, []);

  const rotateImage = (direction: 'clockwise' | 'counterclockwise') => {
    if (!images[currentIndex]) return;
    const degrees = direction === 'clockwise' ? 90 : -90;
    const imagePath = images[currentIndex].src;
    const normalizedPath = imagePath.replace(/^\//, ''); 
    const currentRotation = manualRotations[normalizedPath] || 0;
    const newRotation = ((currentRotation + degrees) % 360 + 360) % 360;
    setManualRotations(prev => ({ ...prev, [normalizedPath]: newRotation }));
    saveRotation(normalizedPath, newRotation);
  };
  
  const getRotationTransform = (orientation: number): string => {
    switch(orientation) {
      case 2: return 'scaleX(-1)'; // Simpler scale
      case 3: return 'rotate(180deg)'; 
      case 4: return 'rotate(180deg) scaleX(-1)';
      case 5: return 'rotate(90deg) scaleX(-1)'; 
      case 6: return 'rotate(90deg)'; 
      case 7: return 'rotate(-90deg) scaleX(-1)'; 
      case 8: return 'rotate(-90deg)'; 
      default: return 'none'; 
    }
  };

  const handleImageLoad = () => {
    if (imageRef.current) {
      const imgElement = imageRef.current;
      if (imgElement.naturalWidth > 0 && imgElement.naturalHeight > 0) {
        setNaturalDimensions({ width: imgElement.naturalWidth, height: imgElement.naturalHeight });
        if (!containerSize && containerRef.current) {
          setContainerSize({
            width: containerRef.current.clientWidth,
            height: containerRef.current.clientHeight
          });
        }
      } else {
        setNaturalDimensions(null); 
      }
      try {
        const src = imgElement.src.toLowerCase();
        if (!src.endsWith('.jpg') && !src.endsWith('.jpeg')) {
          setOrientations(prev => ({ ...prev, [currentIndex]: 1 }));
          return;
        }
        EXIF.getData(imgElement as any, function(this: HTMLElement) {
          try {
            const orientation = EXIF.getTag(this, 'Orientation');
            setOrientations(prev => ({ ...prev, [currentIndex]: orientation || 1 }));
          } catch (tagError) {
            console.warn(`EXIF tag error: ${(tagError as Error).message}`);
            setOrientations(prev => ({ ...prev, [currentIndex]: 1 }));
          }
        });
      } catch (error) {
        console.error(`EXIF processing error: ${(error as Error).message}`);
        setOrientations(prev => ({ ...prev, [currentIndex]: 1 }));
      }
    } else {
      setNaturalDimensions(null);
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
      if (document.fullscreenElement) document.exitFullscreen();
    } else {
      setIsImmersiveModeActive(true);
      if (!document.fullscreenElement) slideshowRef.current?.requestFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const currentlyFullscreen = !!document.fullscreenElement;
      setIsBrowserFullscreen(currentlyFullscreen);
      if (!currentlyFullscreen) setIsImmersiveModeActive(false);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleZoom = () => setIsZoomed(!isZoomed);

  const getContainerBackgroundStyle = () => ({
    backgroundColor: 'transparent',
    borderRadius: '8px',
    padding: '4px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: containerSize ? `${containerSize.width}px` : '100%',
    height: containerSize ? `${containerSize.height}px` : '100%',
    minHeight: '400px'
  });

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

  const getPreviousImageTransform = () => {
    if (previousSlide === null) return 'none';
    const prevImagePath = previousSlide.src;
    const normalizedPath = prevImagePath.replace(/^\//, '');
    if (manualRotations[normalizedPath] !== undefined) {
      return `rotate(${manualRotations[normalizedPath]}deg)`;
    }
    // Assuming previousSlide.id can be used to find its original index if orientations were stored by original index
    // For simplicity now, let's assume previousSlide carries enough info or we fetch its orientation if needed.
    // This part might need refinement if orientations are strictly tied to currentIndex.
    // For now, let's assume we can't easily get previous orientation without more state.
    return 'none'; 
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') memoizedGoToNextSlide();
      if (e.key === 'ArrowLeft') goToPreviousSlide();
      if (e.key === 'Escape' && isBrowserFullscreen) { /* Handled by fullscreenchange */ }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isBrowserFullscreen, memoizedGoToNextSlide, goToPreviousSlide]); // Removed currentIndex, images.length

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

  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current !== null) { // This ref does not exist yet, placeholder for planned cleanup
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);


// --- JSX Structure (To be refactored in Step 2) ---
// The current JSX rendering logic will be replaced by the planned structure.
// For now, I'll leave the existing JSX structure commented out or minimal
// to focus on the JS logic changes of Step 1.

  return (
    <div
      ref={slideshowRef}
      className="slideshow-container min-h-screen w-full"
      style={{
        backgroundColor: activeTheme.colors[0].hex,
        color: `var(--text-on-primary)`
      }}
    >
      {loading ? (
        <div className="flex justify-center items-center h-screen">
          <div>Loading...</div>
        </div>
      ) : (
        <div className="flex flex-col h-screen">
          {/* Header */}
          {!isImmersiveModeActive && (
            <div 
              className="px-6 py-4 flex justify-between items-center border-b"
              style={{ borderColor: 'rgba(255,255,255,0.1)' }}
            >
              <h1 className="text-xl font-bold">
                {images[currentIndex] ? images[currentIndex].title : 'Case Closed'}
              </h1>
              <div className="flex items-center gap-2">
                <button onClick={toggleStandardFullscreen} title={isBrowserFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}><Maximize size={20} /></button>
                <button onClick={toggleImmersiveMode} title={isImmersiveModeActive ? "Exit Immersive" : "Enter Immersive"}><Focus size={20} /></button>
              </div>
            </div>
          )}

          {/* Image Display Area - This will be heavily refactored in Step 2 */}
          <div
            className="relative flex flex-col items-center justify-center py-4 px-4 flex-grow overflow-hidden"
            ref={containerRef}
          >
            <div
              className="image-container relative max-w-5xl mx-auto"
              style={getContainerBackgroundStyle()}
            >
              {images.length > 0 && (
                <div className="slide-container" style={{ width: '100%', height: '100%', position: 'relative' }}>
                  {/* Current Slide */}
                  {images[currentIndex] && (
                    <div
                      key={images[currentIndex].id}
                      className={`slide slide-current ${activeTransitionClassName} ${
                        transitionStatus === 'active'
                          ? 'enter-active'
                          : transitionStatus === 'preparing'
                          ? 'enter-prepare'
                          : ''
                      }`}
                      onTransitionEnd={handleTransitionEnd}
                    >
                      <img
                        ref={imageRef}
                        src={images[currentIndex].src}
                        alt={images[currentIndex].title}
                        style={{ maxWidth: '100%', maxHeight: '100%', transform: getImageTransform() }}
                        onLoad={handleImageLoad}
                        onClick={toggleZoom}
                      />
                    </div>
                  )}
                  
                  {/* Previous Slide (for exiting animation) */}
                  {previousSlide && transitionStatus !== 'idle' && (
                    <div
                      key={previousSlide.id}
                      className={`slide slide-previous ${activeTransitionClassName} ${
                        transitionStatus === 'active'
                          ? 'exit-active'
                          : transitionStatus === 'preparing'
                          ? 'exit-prepare'
                          : ''
                      }`}
                      onTransitionEnd={handleTransitionEnd}
                    >
                      <img
                        src={previousSlide.src}
                        alt={previousSlide.title}
                        style={{ maxWidth: '100%', maxHeight: '100%', transform: getPreviousImageTransform() }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            {!isImmersiveModeActive && images.length > 1 && (
              <>
                <button
                  onClick={goToPreviousSlide}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/30 hover:bg-black/50 rounded-full"
                  disabled={transitionStatus !== 'idle'}
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={memoizedGoToNextSlide}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/30 hover:bg-black/50 rounded-full"
                  disabled={transitionStatus !== 'idle'}
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
          </div>

          {/* Description Area */}
          {!isImmersiveModeActive && (
            <div
              className="py-3 px-6 text-center border-t"
              style={{ borderColor: 'rgba(255,255,255,0.1)'}}
            >
              <p className="text-sm">{images[currentIndex]?.description || '...'}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CaseClosedSlideshow;