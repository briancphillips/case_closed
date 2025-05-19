import React from 'react';
import CaseClosedSlideshow from './case-closed-slideshow'; // Assuming case-closed-slideshow.tsx will be in the same src/ directory
import './index.css'; // We'll create this for global styles if needed, or for Tailwind directives

function App() {
  return (
    <React.StrictMode>
      <CaseClosedSlideshow />
    </React.StrictMode>
  );
}

export default App; 