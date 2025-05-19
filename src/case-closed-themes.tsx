import React from 'react';

const CaseClosedThemes = () => {
  const themes = [
    {
      name: "Mystery Solved",
      description: "Inspired by classic detective aesthetics with a feminine touch",
      colors: [
        { name: "Detective Navy", hex: "#1D3557" },
        { name: "Clue Scarlet", hex: "#E63946" },
        { name: "Parchment", hex: "#F1FAEE" },
        { name: "Magnifying Gold", hex: "#FFD700" },
        { name: "Shadow Mauve", hex: "#9F8BA8" }
      ]
    },
    {
      name: "Chapter Complete",
      description: "Celebrating the closing of one chapter and opening of another",
      colors: [
        { name: "Book Binding Brown", hex: "#774936" },
        { name: "Page Cream", hex: "#F8F0DC" },
        { name: "Bookmark Rose", hex: "#E29587" },
        { name: "Ink Blue", hex: "#3D5A80" },
        { name: "New Chapter Green", hex: "#84A98C" }
      ]
    },
    {
      name: "Final Verdict",
      description: "Bold, confident colors inspired by achievement and justice",
      colors: [
        { name: "Gavel Black", hex: "#2D2A32" },
        { name: "Victory Gold", hex: "#FFC857" },
        { name: "Authority Teal", hex: "#087E8B" },
        { name: "Dignity White", hex: "#F5F5F5" },
        { name: "Evidence Plum", hex: "#9B5DE5" }
      ]
    },
    {
      name: "Quest Completed",
      description: "Adventurous colors that mark the end of a journey",
      colors: [
        { name: "Adventure Maroon", hex: "#7B2D26" },
        { name: "Trophy Gold", hex: "#D6AD30" },
        { name: "Path Green", hex: "#6B9080" },
        { name: "Horizon Blue", hex: "#A4C3B2" },
        { name: "Achievement Coral", hex: "#FF6B6B" }
      ]
    },
    {
      name: "Mystery Noir",
      description: "Dramatic black and white palette with vivid accent colors",
      colors: [
        { name: "Detective Black", hex: "#171717" },
        { name: "Evidence White", hex: "#EDEDED" },
        { name: "Clue Red", hex: "#DA0037" },
        { name: "Sleuth Silver", hex: "#AAAAAA" },
        { name: "Secret Purple", hex: "#590D82" }
      ]
    },
    {
      name: "Final Piece",
      description: "Puzzle-inspired colors representing completion",
      colors: [
        { name: "Puzzle Blue", hex: "#457B9D" },
        { name: "Insight Pink", hex: "#F7B1AB" },
        { name: "Connection Orange", hex: "#F3722C" },
        { name: "Framework Grey", hex: "#BFBDC1" },
        { name: "Solution Green", hex: "#90BE6D" }
      ]
    },
    {
      name: "Case Files",
      description: "Vintage detective office colors with feminine undertones",
      colors: [
        { name: "Manila Folder", hex: "#F7EDE2" },
        { name: "Typewriter Black", hex: "#313638" },
        { name: "Office Teal", hex: "#3BCEAC" },
        { name: "Redaction Red", hex: "#B23A48" },
        { name: "Brass Accent", hex: "#C39351" }
      ]
    }
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">Case Closed: Graduation Color Themes</h1>
      
      <div className="space-y-12">
        {themes.map((theme, themeIndex) => (
          <div key={themeIndex} className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-2">{theme.name}</h2>
              <p className="text-gray-700 mb-4">{theme.description}</p>
              
              {/* Color strip preview */}
              <div className="flex h-16 mb-6 rounded-md overflow-hidden">
                {theme.colors.map((color, i) => (
                  <div 
                    key={i} 
                    className="flex-1" 
                    style={{ backgroundColor: color.hex }}
                  />
                ))}
              </div>
              
              {/* Individual color swatches with details */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {theme.colors.map((color, colorIndex) => (
                  <div key={colorIndex} className="flex items-center">
                    <div 
                      className="w-10 h-10 rounded-md mr-3 flex-shrink-0" 
                      style={{ backgroundColor: color.hex }}
                    />
                    <div>
                      <div className="font-medium">{color.name}</div>
                      <div className="text-gray-500 text-sm">{color.hex}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CaseClosedThemes;