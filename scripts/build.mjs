import { copyFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { build as viteBuild } from "vite";
import react from "@vitejs/plugin-react";

await mkdir("dist", { recursive: true });

await viteBuild({
  configFile: false,
  plugins: [react()],
  build: {
    emptyOutDir: false,
    rollupOptions: {
      input: {
        popup: resolve("src/popup/index.html"),
        options: resolve("src/options/index.html")
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name][extname]"
      }
    }
  }
});

await viteBuild({
  configFile: false,
  build: {
    emptyOutDir: false,
    rollupOptions: {
      input: resolve("src/content/index.ts"),
      output: {
        entryFileNames: "content.js",
        inlineDynamicImports: true
      }
    }
  }
});

await viteBuild({
  configFile: false,
  build: {
    emptyOutDir: false,
    rollupOptions: {
      input: resolve("src/background/index.ts"),
      output: {
        entryFileNames: "background.js",
        inlineDynamicImports: true
      }
    }
  }
});

await copyFile("src/content/styles.css", "dist/content.css");
