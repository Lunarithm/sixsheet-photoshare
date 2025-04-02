import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
    plugins: [react()],
    server: {
        host: true, // ✅ เปิดให้ใช้จากมือถือ
        strictPort: true,
        port: 5173, // ✅ กำหนดพอร์ต
        cors: true,
      },
});
