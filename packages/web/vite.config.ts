import path from "node:path";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      // Inject JAZZ_WORKER_ACCOUNT for the shared lib
      "process.env.JAZZ_WORKER_ACCOUNT": JSON.stringify(
        env.VITE_JAZZ_WORKER_ACCOUNT,
      ),
    },
    optimizeDeps: {
      include: ["fast-myers-diff"],
      esbuildOptions: {
        target: "esnext",
      },
    },
    build: {
      target: "esnext",
      commonjsOptions: {
        include: [/fast-myers-diff/, /node_modules/],
      },
    },
  };
});
