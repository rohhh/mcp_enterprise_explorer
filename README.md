# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Deploy to GitHub Pages

This project is configured for GitHub Pages with a project-site base path:

- `vite.config.js` uses `base: '/mcp-explorer/'`
- GitHub Actions workflow: `.github/workflows/deploy.yml`

### One-time GitHub setup

1. Push this project to a GitHub repository (recommended repo name: `mcp-explorer`).
2. In GitHub, open **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Push to the `main` branch (or run the workflow manually from the **Actions** tab).

### If your repository name is different

Update `base` in `vite.config.js` to match your repo name:

- Repo `my-dashboard` → `base: '/my-dashboard/'`

## Local pre-deploy checks

Run these before pushing to GitHub:

- Start dev server: `npm run dev`
- Create production build: `npm run build`
- Preview the production build locally: `npm run preview`
