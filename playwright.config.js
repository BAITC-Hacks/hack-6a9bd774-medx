import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  timeout: 45000,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:5173",
    browserName: "chromium",
    trace: "retain-on-failure",
    viewport: { width: 1440, height: 1000 },
  },
  webServer: [
    {
      command: `${process.env.SANABRIDGE_PYTHON || "../.venv/bin/python"} -m uvicorn app.main:app --host 127.0.0.1 --port 8000`,
      cwd: "../backend",
      url: "http://127.0.0.1:8000/api/health",
      timeout: 30000,
      env: {
        DATABASE_URL: "sqlite:///./e2e.db",
        OPENAI_API_KEY: "",
        NVIDIA_API_KEY: "",
      },
    },
    {
      command: "npm run dev -- --port 5173 --strictPort",
      url: "http://127.0.0.1:5173",
      timeout: 30000,
    },
  ],
});
