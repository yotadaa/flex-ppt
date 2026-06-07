import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
    base: process.env.VITE_BASE_PATH || "/presentation/",
    plugins: [react()],
    resolve: {
        alias: {
            "@": "/src"
        }
    },
    server: {
        host: "127.0.0.1"
    }
});
