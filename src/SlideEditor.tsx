import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X } from 'lucide-react'; // Assuming X is still used for a close button if needed, though it might be part of AdminPortal now.

const API_URL = '/api';

// Details for a single slide that SlideEditor can edit
export interface SlideDetailsData {
  title?: string;
  description?: string;
  isHidden?: boolean;
}

// The complete set of details for all slides, keyed by imagePath
interface AllSlideDetails {
  [imagePath: string]: SlideDetailsData;
}

interface SlideEditorProps {
  // Removed isOpen and onClose as AdminPortal will manage visibility
  currentSlideshowImageSrc: string | null; // To highlight or default select an image
  allImageFiles: string[]; 
  allSlideDetails: AllSlideDetails | null; 
  onSave: (detailsToUpdate: { [imagePath: string]: SlideDetailsData }) => void; 
  // onNavigate: (path: string) => void; // If we add internal navigation links like to ThemeEditor
}

const SlideEditor: React.FC<SlideEditorProps> = ({
  currentSlideshowImageSrc, 
  allImageFiles,
  allSlideDetails,
  onSave,
}) => {
  const [selectedAdminImageSrc, setSelectedAdminImageSrc] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isHidden, setIsHidden] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentSlideshowImageSrc) {
      setSelectedAdminImageSrc(currentSlideshowImageSrc);
    }
  }, [currentSlideshowImageSrc]);

  useEffect(() => {
    setError(null);
    if (selectedAdminImageSrc && allSlideDetails) {
      const details = allSlideDetails[selectedAdminImageSrc];
      const defaultBaseTitle = selectedAdminImageSrc.substring(selectedAdminImageSrc.lastIndexOf('/') + 1).replace(/\.[^/.]+$/, '');
      setTitle(details?.title || defaultBaseTitle);
      setDescription(details?.description || '');
      setIsHidden(details?.isHidden || false);
    } else if (selectedAdminImageSrc) {
        const defaultBaseTitle = selectedAdminImageSrc.substring(selectedAdminImageSrc.lastIndexOf('/') + 1).replace(/\.[^/.]+$/, '');
        setTitle(defaultBaseTitle);
        setDescription("");
        setIsHidden(false);
    } else {
      setTitle('');
      setDescription('');
      setIsHidden(false);
    }
  }, [selectedAdminImageSrc, allSlideDetails]);

  const handleImageSelectForAdmin = (imageFileName: string) => {
    setSelectedAdminImageSrc(`slides/${imageFileName}`);
  };

  const handleSave = async () => {
    if (!selectedAdminImageSrc) {
      setError("No image selected to save details for.");
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const payload: SlideDetailsData = { title, description, isHidden };
      const encodedImagePath = encodeURIComponent(selectedAdminImageSrc);
      const response = await axios.post(`${API_URL}/slide-details/${encodedImagePath}`, payload);
      if (response.data.success) {
        onSave({ [selectedAdminImageSrc]: response.data.updatedDetails });
        console.log("Details saved successfully for", selectedAdminImageSrc);
      } else {
        setError(response.data.error || "Failed to save details.");
      }
    } catch (err: any) {
      console.error("Error saving slide details:", err);
      setError(err.response?.data?.error || err.message || "An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full pt-3">
      {/* List of all images */}
      <div className="p-1 overflow-y-auto border-b border-gray-700 max-h-60 custom-scrollbar">
        {/* <h3 className="text-md font-semibold mb-2 sticky top-0 bg-gray-800 py-1 z-5">All Slides ({allImageFiles.length})</h3> */}
        <ul className="space-y-1 pr-1">
          {allImageFiles.map((fileName) => {
            const normalizedPath = `slides/${fileName}`;
            const details = allSlideDetails ? allSlideDetails[normalizedPath] : null;
            const displayTitle = details?.title || fileName.replace(/\.[^/.]+$/, '');
            const currentIsHidden = details?.isHidden || false;
            return (
              <li 
                key={normalizedPath}
                onClick={() => handleImageSelectForAdmin(fileName)}
                className={`p-2.5 rounded-md cursor-pointer transition-colors flex justify-between items-center text-sm 
                            ${selectedAdminImageSrc === normalizedPath ? 'bg-blue-700 text-white' : 'bg-gray-750 hover:bg-gray-650'}
                            ${currentIsHidden ? 'opacity-50 hover:opacity-75' : ''}`}
                title={displayTitle}
              >
                <span className="truncate pr-2">{displayTitle}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${currentIsHidden ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
                  {currentIsHidden ? 'Hidden' : 'Visible'}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Editing form for selected image */}
      <div className="p-4 flex-grow flex flex-col justify-between">
        {selectedAdminImageSrc ? (
          <div className="flex-grow flex flex-col">
            <div className="mb-3 text-center">
              <img src={`/${selectedAdminImageSrc}`} alt="Selected slide preview" className="w-full h-auto max-h-40 object-contain rounded-md mb-1 bg-gray-700 inline-block"/>
              <p className="text-xs text-gray-500 truncate">{selectedAdminImageSrc}</p>
            </div>
            
            <label htmlFor="slideTitleAdmin" className="block text-sm font-medium text-gray-300 mb-1">Title</label>
            <input
              type="text" id="slideTitleAdmin" value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter custom title"
              className="w-full p-2 text-sm rounded-md bg-gray-700 border border-gray-600 focus:ring-blue-500 focus:border-blue-500 mb-3"
            />

            <label htmlFor="slideDescriptionAdmin" className="block text-sm font-medium text-gray-300 mb-1">Description</label>
            <textarea
              id="slideDescriptionAdmin" value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter custom description" rows={2}
              className="w-full p-2 text-sm rounded-md bg-gray-700 border border-gray-600 focus:ring-blue-500 focus:border-blue-500 mb-3"
            />

            <div className="mb-4">
              <label htmlFor="slideIsHiddenAdmin" className="flex items-center cursor-pointer">
                <input
                  type="checkbox" id="slideIsHiddenAdmin" checked={isHidden}
                  onChange={(e) => setIsHidden(e.target.checked)}
                  className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 mr-2"
                />
                <span className="text-sm text-gray-300">Hide this slide</span>
              </label>
            </div>
            {error && <p className="text-red-400 text-sm mb-3">Error: {error}</p>}
            <div className="mt-auto">
              <button
                onClick={handleSave}
                disabled={isSaving || !selectedAdminImageSrc}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-3 text-sm rounded-md transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save Details'}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8 text-sm">Select a slide from the list above to edit details.</p>
        )}
      </div>
    </div>
  );
};

export default SlideEditor; 