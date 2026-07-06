import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const repoName = "github-demo-guessing-wc-player";
const isGitHubPages = process.env.GITHUB_PAGES === "true";

export default defineConfig({
  base: isGitHubPages ? `/${repoName}/` : "/",
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
