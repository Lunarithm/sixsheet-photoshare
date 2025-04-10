import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
    plugins: [react()],
    preview: {
        allowedHosts: `sixsheet-photoshare-3tu92.ondigitalocean.app`,
        port: 8080,
      },
});
