import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: yahooProxy(),
  },
  preview: {
    proxy: yahooProxy(),
  },
})

function yahooProxy() {
  return {
    "/api/yahoo-chart": {
      target: "https://query1.finance.yahoo.com",
      changeOrigin: true,
      rewrite: (path) =>
        path.replace(/^\/api\/yahoo-chart/, "/v8/finance/chart"),
    },
  };
}
