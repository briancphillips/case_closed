# Slideshow Refactor Plan

This plan aims to simplify the slideshow's state management and transition logic to eliminate bugs related to slide indexing, duplicate slides, and animation glitches.

**I. Core Principles:**

1.  **Single Source of Truth for Slide Index**: `currentIndex` will be the _only_ state variable directly controlling which slide's data is considered "current".
2.  **Atomic Transitions**: A transition should be treated as an atomic operation. Once initiated, it should run to completion or be explicitly cancelled and reset. No new transitions should start until the current one is fully resolved.
3.  **CSS-Driven Animations (Primarily)**: Leverage CSS transitions and animations as much as possible for performance. JavaScript will primarily be used to trigger these by adding/removing classes or setting initial/final states.
4.  **Simplified State**: Reduce the number of state variables involved in managing transitions.
5.  **Clear Lifecycle**: Transitions will have a clear lifecycle: `idle` -> `preparing` -> `transitioning` -> `finishing` -> `idle`.

**II. State Simplification:**

1.  `currentIndex: number`: The index of the currently visible slide.
2.  `previousSlide: Image | null`: Stores the data of the slide that is transitioning _out_. This is used to render the exiting slide.
3.  `transitionStatus: 'idle' | 'preparing' | 'active' | 'finishing'`: Manages the current phase of the transition.
    - `idle`: No transition in progress.
    - `preparing`: Setting up the next slide and previous slide elements, but animations haven't started.
    - `active`: CSS animations are running.
    - `finishing`: Animations have completed, cleaning up.
4.  `activeTransitionClassName: string`: The CSS class for the _current_ transition type (e.g., "transition-slide-left"). This will be derived from props.
5.  **Remove/Consolidate**:
    - `isTransitioning` (replaced by `transitionStatus`).
    - `initialTransform`, `exitingTransform` (these will be managed by CSS classes based on `activeTransitionClassName` and `transitionStatus`).
    - `animationLock` (the `transitionStatus` will serve this purpose).
    - `nextIndexRef`, `pendingIndexRef` (simplified logic should make these unnecessary).
    - `transitionCounter` (unique keys for slides will be derived differently if still needed, or component memoization might be better).
    - `currentSlideKey` (keys will be `image.src` or `image.id`).
    - `exitDirection` (can be inferred or handled by specific transition classes).

**III. Transition Logic Refactor:**

1.  **Navigation Functions (`goToNext`, `goToPrevious`):**

    - If `transitionStatus !== 'idle'`, ignore the call (debouncing/throttling can still be applied as an outer layer if desired, but the status check is primary).
    - Set `transitionStatus` to `'preparing'`.
    - Determine the `nextSlideIndex`.
    - Set `previousSlide` to `images[currentIndex]`.
    - Set `currentIndex` to `nextSlideIndex`.
    - In a `useEffect` hook that listens to `currentIndex` and `transitionStatus === 'preparing'`:
      - Force a re-render if necessary to ensure both `previousSlide` and the new `images[currentIndex]` are in the DOM.
      - Use `requestAnimationFrame` or a micro-timeout (`setTimeout(0)`) to allow React to commit DOM changes.
      - Then, set `transitionStatus` to `'active'`. This will trigger CSS classes that start the animation.

2.  **Animation Handling (CSS + `onTransitionEnd`):**

    - The `slide-container` will hold two `div` elements: one for the current slide and one for the previous (exiting) slide.
    - **CSS Classes**:
      - `.slide-current`: Always applied to the slide for `images[currentIndex]`.
      - `.slide-previous`: Always applied to the slide for `previousSlide`.
      - When `transitionStatus === 'active'`:
        - The `.slide-current` element gets an "enter-active" class (e.g., `transition-slide-left-enter-active`).
        - The `.slide-previous` element gets an "exit-active" class (e.g., `transition-slide-left-exit-active`).
      - These classes define the `transform` and `opacity` for the start and end of the transition.
    - **`onTransitionEnd`**:
      - Attach this event listener to _both_ the current and previous slide `div`s during the `'active'` phase.
      - When _both_ transitions have ended (can be tracked with a counter or by checking properties):
        - Set `transitionStatus` to `'finishing'`.

3.  **Cleanup (`useEffect` on `transitionStatus === 'finishing'`):**
    - Set `previousSlide` to `null`.
    - Set `transitionStatus` to `'idle'`.
    - Remove any temporary CSS classes if not handled automatically.

**IV. JSX Structure (Simplified Example):**

```tsx
<div className="slide-container">
  {/* Current Slide */}
  {images[currentIndex] && (
    <div
      key={images[currentIndex].id} // Stable key
      className={`slide slide-current ${activeTransitionClassName} ${
        transitionStatus === "active"
          ? "enter-active"
          : transitionStatus === "preparing"
          ? "enter-prepare"
          : "" // Class to set initial off-screen/hidden state
      }`}
      onTransitionEnd={handleTransitionEnd}
    >
      {/* ... image content ... */}
    </div>
  )}

  {/* Previous Slide (for exiting animation) */}
  {previousSlide && transitionStatus !== "idle" && (
    <div
      key={previousSlide.id} // Stable key
      className={`slide slide-previous ${activeTransitionClassName} ${
        transitionStatus === "active"
          ? "exit-active"
          : transitionStatus === "preparing"
          ? "exit-prepare"
          : "" // Class to set initial visible state
      }`}
      onTransitionEnd={handleTransitionEnd}
    >
      {/* ... image content for previousSlide ... */}
    </div>
  )}
</div>
```

**V. CSS Definitions (`src/index.css` or a dedicated transition CSS file):**

- Define base `.slide` styles (absolute positioning, etc.).
- For each transition type (e.g., `transition-slide-left`):
  - `.transition-slide-left.enter-prepare`: Initial state (e.g., `transform: translateX(100%); opacity: 0;`).
  - `.transition-slide-left.enter-active`: Target state + transition properties (e.g., `transform: translateX(0%); opacity: 1; transition: transform 0.5s ease, opacity 0.5s ease;`).
  - `.transition-slide-left.exit-prepare`: Initial state for exiting slide (e.g., `transform: translateX(0%); opacity: 1;`).
  - `.transition-slide-left.exit-active`: Target state for exiting slide + transition (e.g., `transform: translateX(-100%); opacity: 0; transition: transform 0.5s ease, opacity 0.5s ease;`).
- Similar definitions for `transition-fade`, `transition-zoom-in`, and `transition-none`.

**VI. Additional Considerations:**

1.  **Auto-advance Timer**: The auto-advance timer should respect the current transition status and only trigger a new slide change when `transitionStatus === 'idle'`.
2.  **Keyboard Navigation**: Keyboard navigation should similarly respect the transition status.
3.  **Immersive Mode**: Immersive mode toggle should not interfere with transitions in progress.
4.  **Rotation Handling**: Image rotation should be preserved during transitions.
5.  **Error Handling**: Add error boundaries or try/catch blocks for transition-related code.

**VII. Implementation Steps:**

1.  Refactor state variables as defined in (II).
2.  Implement the new `transitionStatus` state machine.
3.  Modify navigation functions (`goToNext`, `goToPrevious`) as per (III.1).
4.  Adjust JSX to render current and previous slides based on the new state and apply dynamic CSS classes (IV).
5.  Define CSS classes for transitions (V).
6.  Implement the `onTransitionEnd` logic and the cleanup effect.
7.  Create a reference to a transitionTimeoutRef for safety cleanup.
8.  Update the JSX for the slide container to use the new structure.

**VIII. Implementation Summary:**

All 8 steps of the refactor plan have been implemented:

1. ✅ Refactor state variables as defined in (II).

   - The state variables `currentIndex`, `previousSlide`, `transitionStatus`, and `activeTransitionClassName` are in place.
   - The old state variables (`isTransitioning`, `initialTransform`, etc.) are not present.

2. ✅ Implement the new `transitionStatus` state machine.

   - The `transitionStatus` states (`'idle'`, `'preparing'`, `'active'`, `'finishing'`) are defined and used correctly.

3. ✅ Modify navigation functions (`goToNext`, `goToPrevious`) as per (III.1).

   - The `startTransition` function (called by `memoizedGoToNextSlide` and `goToPreviousSlide`) implements the logic as specified.

4. ✅ Adjust JSX to render current and previous slides based on the new state and apply dynamic CSS classes (IV).

   - The JSX structure matches the plan, with proper conditional rendering and dynamic classes.

5. ✅ Define CSS classes for transitions (V).

   - The CSS classes have been updated to match the new naming convention and provide the correct initial and target states for each transition type.

6. ✅ Implement the `onTransitionEnd` logic and the cleanup effect.

   - The `handleTransitionEnd` function counts transition end events and sets `transitionStatus` to `'finishing'` when both transitions have completed.

7. ✅ Create a reference to a transitionTimeoutRef for safety cleanup.

   - `transitionTimeoutRef` is defined and used in the transition-related `useEffect` hooks.

8. ✅ Update the JSX for the slide container to use the new structure.
   - The slide container now uses the new structure with `slide`, `slide-current`, `slide-previous`, and dynamic classes based on `transitionStatus`.

The slideshow component now uses a simplified state management approach with a clear transition lifecycle and CSS-driven animations. This should eliminate bugs related to slide indexing, duplicate slides, and animation glitches.
