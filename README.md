# Case Closed Slideshow

A photo slideshow application for Braxton's graduation with a "Case Closed" detective theme.

## Features

- Beautiful "Case Files" presentation of graduation photos
- Auto-rotation of images using EXIF data
- Manual rotation capability that persists across devices and sessions
- Fullscreen mode and image zoom
- Keyboard navigation (arrow keys)
- Auto-advance slideshow

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd case_closed
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn
   ```

3. Ensure images are in the correct location:
   - Place your images in the `public/slides` directory
   - If needed, create the directory structure:
     ```bash
     mkdir -p public/slides
     # If you have existing slides in another location:
     mv slides public/
     ```

### Running the Application

#### Development Mode

Run both the React frontend and Node.js backend simultaneously:

```bash
npm run dev:all
# or
yarn dev:all
```

This will start:

- React frontend at http://localhost:5173
- Node.js backend at http://localhost:3001

#### Running Frontend and Backend Separately

If needed, you can run them separately:

```bash
# Frontend only
npm run dev
# or
yarn dev

# Backend only
npm run server
# or
yarn server
```

## Usage

- **Navigate**: Use left/right arrow buttons or keyboard arrow keys to change slides
- **Rotate**: Click the rotate buttons to fix image orientation (persists across all devices)
- **Zoom**: Click on an image to zoom in/out
- **Fullscreen**: Click the fullscreen button to enter/exit fullscreen mode

## Technical Details

- Frontend: React with TypeScript and Vite
- Backend: Node.js with Express
- Styling: Tailwind CSS
- Image rotation: Combination of EXIF metadata reading and manual rotation API
- State persistence: Saved to server in JSON file

## License

This project is MIT licensed.
