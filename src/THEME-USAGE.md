# Case Closed Theme System

This document explains how to use the theme system in the Case Closed application.

## Available Themes

The application includes several pre-defined themes, each with a unique color palette:

- Mystery Solved
- Chapter Complete
- Final Verdict
- Quest Completed
- Mystery Noir
- Final Piece
- Case Files

## Using Theme Colors in Components

### CSS Variables

All theme colors are available as CSS variables. You can use them in your CSS:

```css
.my-component {
  background-color: var(--primary-color);
  color: var(--secondary-color);
  border: 1px solid var(--tertiary-color);
}
```

### Named Color Variables

Each color is available by its name:

```css
.element {
  background-color: var(--color-detective-navy);
  color: var(--color-clue-scarlet);
}
```

### Utility Classes

The application includes Tailwind-compatible utility classes for backgrounds, text, and borders:

```jsx
<div className="bg-primary text-secondary border border-tertiary">
  Themed content
</div>
```

Available classes:

- `bg-primary`, `bg-secondary`, `bg-tertiary`, `bg-quaternary`, `bg-quinary`
- `text-primary`, `text-secondary`, `text-tertiary`, `text-quaternary`, `text-quinary`
- `border-primary`, `border-secondary`, `border-tertiary`, `border-quaternary`, `border-quinary`

## Theme Administration

The application includes a theme admin panel that can be accessed by clicking the settings button in the bottom right corner of the application. This panel allows you to:

1. View all available themes
2. Preview theme colors
3. Select and apply a theme to the entire application

## Programmatic Theme Access

You can access the current theme programmatically using the `useTheme` hook:

```jsx
import { useTheme } from './ThemeContext';

function MyComponent() {
  const { activeTheme, setActiveTheme, availableThemes } = useTheme();

  // Access theme colors
  const primaryColor = activeTheme.colors[0].hex;

  // Change theme programmatically
  const switchToTheme = (themeName) => {
    const theme = availableThemes.find(t => t.name === themeName);
    if (theme) setActiveTheme(theme);
  };

  return (
    // Your component JSX
  );
}
```
