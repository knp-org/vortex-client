# Vortex Design System: "Liquid Glass"

This document outlines the core UI/UX guidelines for the Vortex client applications, encompassing the Web App, Tauri Desktop App, and Android App. It serves as the single source of truth for our **"Liquid Glass"** design language. All new screens, components, and refactors MUST adhere to these principles.

---

## 1. Core Philosophy

The "Liquid Glass" aesthetic is designed to be highly immersive, premium, and unobtrusive. The UI should feel like a thin, elegant pane of frosted glass resting on top of beautiful, high-resolution media artwork.

- **Content is King**: The UI exists to frame and present the media (posters, backdrops, fanart). It should never distract.
- **Monochromatic Purity**: We strictly avoid legacy brand colors (no bright blues, reds, or greens for primary actions). The entire UI relies on grayscale, deep blacks, pure whites, and varying levels of opacity.
- **Fluid Depth**: The hierarchy is established through blurring (glassmorphism) and subtle drop shadows, rather than solid blocks of color.

## 2. Color Palette & Theming

- **Backgrounds**: Deep, rich blacks (`#000000` or `#050505`) or dynamic blurred artwork acting as the background.
- **Text**: Pure White (`#FFFFFF`) for primary text. Light Grays (e.g., `#A0A0A0` or `#B3B3B3`) for secondary/metadata text.
- **Surface Overlays (Glass)**:
  - **Web/Tauri**: `rgba(255, 255, 255, 0.05)` to `rgba(255, 255, 255, 0.1)` combined with a backdrop blur filter (`backdrop-blur-md` or `backdrop-blur-lg`).
  - **Android (Compose)**: `Color.White.copy(alpha = 0.05f)` to `0.1f` combined with `Modifier.blur()` where applicable, or relying on dark translucent surfaces.
- **Accent & Active States**: Pure White (`#FFFFFF`). For example, active carousel dots, selected toggles, and primary call-to-action buttons should be white text/icons on a slightly brighter translucent white background.
- **Borders**: Hairline borders using very low-opacity white (e.g., `rgba(255, 255, 255, 0.1)`) to define edges on glass cards without making them feel boxed in.

## 3. Typography

Vortex uses a modern, clean font stack to ensure legibility across TV screens, desktop monitors, and mobile devices.

- **Primary Heading Font**: `Plus Jakarta Sans`
- **Body / Metadata Font**: `Inter`
- **Monospace / Technical**: `Geist Mono` (for logs, sync IDs, technical settings)

**Hierarchy Rules**:
- Keep titles bold and crisp.
- Use font weight (e.g., SemiBold vs Regular) rather than color to distinguish adjacent data points.
- Metadata chips should use a smaller text size and regular weight to stay subtle.

## 4. Universal Component Guidelines

Regardless of the platform, the following UI elements must behave consistently:

### Buttons & Actions
- **No solid primary colors**. Primary buttons should be a frosted glass capsule.
- **Hover/Press States**: Slightly increase the background white opacity (e.g., from `10%` to `20%`). Do not invert to solid white unless it's a critical, high-emphasis action like "Play".
- **Shape**: Fully rounded (pill shape) for play buttons or heavily rounded corners (e.g., 12px/12dp) for standard actions.

### Forms & Settings (Toggles, Inputs, Dropdowns)
- **Text Fields**: The "GlassyTextField" pattern. No harsh underlines. Use a translucent dark/frosted background, borderless or subtle white hairline border, and a white cursor.
- **Toggles**: The active state should be White (`#FFFFFF`), and the track should be a translucent gray. Do not use default Android material colors or web blue accents.
- **Dropdowns / Menus**: Should drop down with a heavily blurred backdrop filter. Active items receive a white highlight overlay.

### Loading & Progress
- **Spinners**: Simple white/grayscale circular progress indicators. No colorful sweeping arcs.
- **Progress Bars (Player)**: A thin white line for the filled portion, a slightly thicker, slightly opaque line for the buffered track, and a fully transparent/dark track for the remainder.

### Media Cards (Posters)
- **Aspect Ratios**: Strictly adhere to `2:3` for movie/series posters and `16:9` for episode thumbnails.
- **Corners**: Rounded (e.g., `12dp` or `0.75rem`).
- **Overlays**: A subtle black gradient from the bottom edge up (e.g., `linear-gradient(to top, rgba(0,0,0,0.8), transparent)`) to ensure text legibility if text is drawn over the poster.

## 5. Platform-Specific Guidelines

### Android (Jetpack Compose)
1. **Edge-to-Edge Layouts**: The application must draw behind the system navigation bar and status bar. Use `WindowCompat.setDecorFitsSystemWindows(window, false)`.
2. **Floating Dock**: The main navigation should be a floating glassy pill/dock at the bottom of the screen. Scrollable content (like the Library grid) must have adequate bottom padding (`WindowInsets.navigationBars` + dock height) so items can be scrolled past the dock, but the background draws cleanly behind it.
3. **Deprecations**: Always use modern Material 3 equivalents customized to look like Liquid Glass. (e.g., use `Modifier.menuAnchor(MenuAnchorType.PrimaryNotEditable)` instead of deprecated anchors).

### Web & Desktop (React / Tauri)
1. **Tauri Custom Titlebar**: The desktop app runs undecorated (`decorations: false`). The custom title bar must match the background (or be fully transparent layered over the app background) and include custom window controls (minimize, maximize, close) that follow the monochromatic theme.
2. **CSS Variables & Tailwind**: Rely heavily on Tailwind's arbitrary values for glassmorphism, e.g., `bg-white/10 backdrop-blur-xl border border-white/10`.
3. **Scrollbars**: Hide default OS scrollbars and replace them with a minimal, auto-hiding custom white scrollbar if necessary, or hide them entirely if touch/trackpad navigation is expected.

## 6. Layout & Spatial UX

- **Breathing Room**: Liquid Glass relies heavily on negative space. Do not cram components together. Use large margins (e.g., `24dp` or `32px` minimum around main layout containers).
- **Hero Sections**: Detail screens (Movie/Series) must feature a large hero image (backdrop) occupying the top 40-50% of the screen. The content underneath should gracefully overlap the bottom of this image using a blurred or gradient-faded container.
- **Transitions**: Favor crossfades and smooth, physics-based sliding animations. Snappy, immediate cuts without animation feel contrary to the "liquid" nature of the design language.
