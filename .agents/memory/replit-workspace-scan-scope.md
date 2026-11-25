---
name: Replit workspace scan scope
description: Replit internal folders can slow Tailwind scanning and cause Vite watcher errors.
---

Restrict Tailwind content scanning and Vite file watching to application files; explicitly exclude Replit's `.local` and `.agents` folders.

**Why:** The Vite watcher tried to watch temporary artifacts under `.local/skills`, and broad Tailwind auto-detection made the preview stall during compilation.

**How to apply:** When configuring Vite and Tailwind in this workspace, add explicit source globs for `index.html` and `src` files, and ignore `.local`, `.agents`, `.git`, dependency, and build-output directories in the Vite watcher.
