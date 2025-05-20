import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import AdminPortal from './AdminPortal'; // Placeholder for now
import { ThemeProvider } from './ThemeContext';
import ThemeStyles from './themeStyles';
import './index.css'; // For Tailwind directives or global styles

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <ThemeStyles />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/admin" element={<AdminPortal />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
); 