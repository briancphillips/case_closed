export interface SlideTransition {
  name: string; // User-friendly name, e.g., "Fade In"
  className: string; // CSS class to apply for this transition
}

export const availableTransitions: SlideTransition[] = [
  {
    name: "None",
    className: "transition-none", // A class that does no animation or a very quick one
  },
  {
    name: "Fade",
    className: "transition-fade",
  },
  {
    name: "Slide Left",
    className: "transition-slide-left",
  },
  {
    name: "Slide Right", // For internal use when "Slide Left" is selected and user goes backward
    className: "transition-slide-right",
  },
  {
    name: "Zoom In",
    className: "transition-zoom-in",
  },
  // Add more transitions here as needed
];

// You might want a default transition if none is selected or loaded
export const defaultTransition: SlideTransition = availableTransitions[1]; // Default to Fade 