# Aerial Threat Detection Browser Prototype

This is a browser-only React + Tailwind version of the Aerial Threat Detection interface.

## How to run

```bash
npm install
npm run dev
```

`npm run dev` starts Vite and opens the app in your default browser only. It does not open Electron.

## Important note

This build is for browser-based UI demonstration. A normal browser cannot directly run local Python YOLOv8 scripts or access Electron IPC APIs. The app previews uploaded image/video files and generates demo summary counts for presentation. For real YOLOv8 detection, connect this frontend to a backend API or use the Electron/Python version.
