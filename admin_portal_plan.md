# Plan: Dedicated Admin Portal

This plan outlines the steps to create a dedicated admin portal for managing the slideshow content, separate from the public-facing slideshow view.

## Goals

1.  **Separate Admin Interface**: Create a distinct area (e.g., `/admin` route) for all administrative functions.
2.  **Consolidate Admin Panels**: Move the existing Theme Panel and Slide Details Management Panel into this new admin portal.
3.  **User Experience**: Ensure regular users viewing the slideshow do not see or have access to admin controls.
4.  **Maintain Functionality**: All current admin functionalities (theme selection, slide detail editing including hide/unhide) should be available in the new portal.

## Phase 1: Basic Admin Route and Structure

1.  **Routing Setup (React Router)**:

    - If not already present, add `react-router-dom` to the project: `npm install react-router-dom` (or `yarn add react-router-dom`).
    - Modify `App.tsx` or `main.tsx` to set up routes:
      - `/`: Will render the `CaseClosedSlideshow` component (public view).
      - `/admin`: Will render a new `AdminPortal` component.

2.  **Create `AdminPortal.tsx` Component**:

    - This will be the main layout component for the admin section.
    - It will initially be simple, perhaps with a header like "Admin Portal".
    - It needs to manage its own state or receive necessary global state (like themes, slide details) similar to how `App.tsx` currently does for the main slideshow, but specifically for admin purposes.

3.  **Modify `App.tsx`**:
    - Remove direct rendering of `ThemePanel`, `AdminToggleButton`, and `AdminPanel`.
    - `App.tsx` will primarily be responsible for rendering the router and providing global contexts (like `ThemeProvider`) if they wrap the entire application.
    - Data fetching for `preloadedRotations` and `preloadedSlideDetails` might stay in `App.tsx` if `AdminPortal` and `CaseClosedSlideshow` both need this data from a common parent, or it could be duplicated/moved if contexts are used more extensively.

## Phase 2: Migrating Admin Functionality

1.  **Move `ThemePanel.tsx` to `AdminPortal.tsx`**:

    - `AdminPortal.tsx` will now render `ThemePanel`.
    - Ensure `ThemePanel` still functions correctly within the admin portal context (theme changes should ideally still reflect on the main slideshow if it's a global theme, or the admin portal might have its own preview).

2.  **Move Slide Details Management (`AdminPanel.tsx`) to `AdminPortal.tsx`**:

    - The current `AdminPanel.tsx` (which lists all slides and allows editing title, description, isHidden) will be rendered within `AdminPortal.tsx`.
    - `AdminPortal.tsx` will need to fetch/manage `allImageFiles` and `allSlideDetails` (similar to what `App.tsx` does now) and pass them to this slide management panel.
    - The `onSave` functionality will be handled within `AdminPortal.tsx` to update the global or admin-specific state for slide details.

3.  **Data Flow for Admin Portal**:
    - `AdminPortal.tsx` will be responsible for fetching data needed for its child components (e.g., slide details, theme configurations).
    - Consider if a separate data fetching mechanism or context is needed for the admin portal versus the main slideshow to keep things clean.

## Phase 3: Enhancements and Refinements

1.  **Admin Portal Navigation/Layout**:

    - Design a simple navigation within `AdminPortal.tsx` if multiple admin sections are envisioned (e.g., a sidebar for "Theme Settings", "Slide Management"). For now, just placing them in the main admin page area is fine.

2.  **Synchronization with Slideshow (Optional but Recommended)**:

    - If changes made in the admin portal (e.g., hiding a slide, changing a title) should immediately reflect on an open slideshow view (without a full page reload for the user), a more sophisticated state management solution (like Zustand, Redux, or a shared React Context with a robust update mechanism) would be needed. This might involve:
      - Having `App.tsx` hold the canonical `slideDetails` and `rotations`.
      - Providing update functions via Context to both `AdminPortal` and `CaseClosedSlideshow`.
      - Forcing a re-render of `CaseClosedSlideshow` when `slideDetails` change (e.g., using `key={JSON.stringify(slideDetails)}` as currently done in `App.tsx`).

3.  **Security (Future Consideration - Out of Scope for Initial Move)**:
    - Currently, the admin portal will be accessible by navigating to `/admin`.
    - For a real application, this would need authentication and authorization.

## Detailed Component Changes (Initial Thoughts)

- **`main.tsx` (or `App.tsx` if router is there):**

  - Wrap the application with `<BrowserRouter>`.
  - Define `<Routes>` with `<Route path="/" element={<App />} />` and `<Route path="/admin" element={<AdminPortal />} />` (or adjust structure so `App` contains the main slideshow and `AdminPortal` is separate).
  - A better structure might be: `<Route path="/" element={<SlideshowPage />} />` and `<Route path="/admin" element={<AdminPortalPage />} />` where `SlideshowPage` sets up `CaseClosedSlideshow` and `AdminPortalPage` sets up the `AdminPortal`.

- **`App.tsx` (becomes `SlideshowPage.tsx` or similar):**

  - Focuses solely on rendering the `CaseClosedSlideshow` and its necessary data (rotations, slide details).
  - Will no longer render `ThemePanel`, `AdminToggleButton`, `AdminPanel`.
  - Still needs to fetch `preloadedRotations` and `preloadedSlideDetails` for the slideshow itself.

- **`AdminPortal.tsx` (New or `AdminPortalPage.tsx`):**

  - Main container for the `/admin` route.
  - Will fetch its own copy of `slideDetails` (or receive from a higher-level context if we implement advanced state management).
  - Renders the `ThemePanel` component.
  - Renders the slide management component (current `AdminPanel.tsx`, perhaps renamed to `SlideEditorPanel.tsx`).
  - Handles saving data from these panels.

- **`AdminPanel.tsx` (renamed to `SlideEditorPanel.tsx` or similar):**

  - Functionality remains largely the same (list all slides, edit selected slide), but receives props from `AdminPortal.tsx` instead of `App.tsx`.

- **`AdminToggleButton.tsx`:**
  - This component will likely be removed, as access to the admin portal will be via the `/admin` route directly.

## Step-by-Step Implementation Plan

1.  **Install `react-router-dom`.**
2.  **Restructure `main.tsx` and `App.tsx` for routing.**
    - Create a `SlideshowPage.tsx` from the current `App.tsx`'s slideshow-specific logic.
    - Modify `App.tsx` to be the root component that sets up the router and global providers.
3.  **Create the basic `AdminPortal.tsx` component.**
4.  **Move `ThemePanel.tsx` into `AdminPortal.tsx`.** Test theme changes.
5.  **Move the current `AdminPanel.tsx` (slide management) into `AdminPortal.tsx`.**
    - Rename it to something like `SlideEditor.tsx` for clarity.
    - Ensure `AdminPortal.tsx` fetches and passes `allImageFiles` and `allSlideDetails` to `SlideEditor.tsx`.
    - Wire up the `onSave` mechanism within `AdminPortal.tsx`.
6.  **Test all admin functionalities in the new `/admin` portal.**
7.  **(Optional/Advanced) Implement a shared context or state management solution if real-time updates between `/admin` and `/` (slideshow) are critical without page reloads.** For now, changes made in `/admin` will be visible on `/` after a refresh or when it re-fetches data. The `key` prop on `CaseClosedSlideshow` will help if `preloadedSlideDetails` is updated by a parent component shared by both routes.

This plan provides a clear path to a more organized and scalable admin interface.
