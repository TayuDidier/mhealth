# MHealth Antenatal Care - UI Color & Design System Reference

This document contains the color palette, typography, and UI styling details extracted from the current project. You can reference this when setting up a new project to adopt the exact same design language and aesthetics.

## Color Palette

### Primary Colors
- **Primary (Pink):** `#ee2b8c`
  - *Usage:* Main call-to-action buttons, active states, icons, and brand highlights.

### Background & Surface Colors
- **Background Light:** `#f8f6f7`
  - *Usage:* Main background color for the application in light mode.
- **Background Dark:** `#221019`
  - *Usage:* Main background color for the application in dark mode.
- **Card Dark:** `#331926`
  - *Usage:* Background color for cards, dropdowns, and elevated surfaces in dark mode.

### Accent & Soft Colors
- **Lavender Soft:** `#f3e8ff`
  - *Usage:* Soft backgrounds for tags, subtle highlights, or secondary card accents.
- **Mint:** `#e0f2f1`
  - *Usage:* Soft backgrounds for positive states, success indicators, or subtle highlights.

## Typography

- **Primary Font Family:** "Manrope", sans-serif
  - *Weights:* 400 (Regular), 500 (Medium), 600 (Semi-Bold), 700 (Bold), 800 (Extra Bold)
  - *Google Fonts Import:* 
    ```html
    <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
    ```

- **Icons:** Material Symbols Outlined
  - *Google Fonts Import:*
    ```html
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
    ```

## UI Elements & Structure

### Border Radius
- **Default:** `0.5rem` (8px) - Used for standard buttons and inputs.
- **Large (lg):** `1rem` (16px) - Used for small cards and modals.
- **Extra Large (xl):** `1.5rem` (24px) - Used for main layout cards and featured sections.
- **Full:** `9999px` - Used for pills, badges, and circular avatars.

## Tailwind CSS Configuration Snippet

If your new project uses Tailwind CSS, you can directly copy this configuration into your `tailwind.config.js` (or `<script>` tag if using the CDN) to immediately adopt the design system:

```javascript
module.exports = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#ee2b8c",
        "background-light": "#f8f6f7",
        "background-dark": "#221019",
        "card-dark": "#331926",
        "lavender-soft": "#f3e8ff",
        mint: "#e0f2f1",
      },
      fontFamily: {
        display: ["Manrope", "sans-serif"],
        sans: ["Manrope", "sans-serif"], // Sets Manrope as the default sans font
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        lg: "1rem",
        xl: "1.5rem",
        full: "9999px",
      },
    },
  },
  // ... rest of your Tailwind config
};
```

## CSS Variables (Alternative)

If you prefer using pure CSS instead of Tailwind, you can add these variables to your main CSS file (`:root` for light mode and a `.dark` class for dark mode):

```css
:root {
  --color-primary: #ee2b8c;
  --color-background: #f8f6f7;
  --color-surface: #ffffff; /* Assuming white for light mode cards */
  --color-lavender-soft: #f3e8ff;
  --color-mint: #e0f2f1;
  
  --radius-default: 0.5rem;
  --radius-lg: 1rem;
  --radius-xl: 1.5rem;
  --radius-full: 9999px;
  
  --font-sans: 'Manrope', sans-serif;
}

.dark {
  --color-background: #221019;
  --color-surface: #331926;
}
```
