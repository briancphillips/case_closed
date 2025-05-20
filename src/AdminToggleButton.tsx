import React from 'react';
import { Settings } from 'lucide-react'; // Or any other icon you prefer

interface AdminToggleButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

const AdminToggleButton: React.FC<AdminToggleButtonProps> = ({ onClick, isOpen }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-4 left-4 p-3 rounded-full bg-gray-700 text-white shadow-lg z-50 hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
      title={isOpen ? "Close Admin Panel" : "Open Admin Panel"}
      aria-label={isOpen ? "Close Admin Panel" : "Open Admin Panel"}
      aria-pressed={isOpen}
    >
      <Settings size={24} />
    </button>
  );
};

export default AdminToggleButton; 