import { defineConfig } from "orval";

export default defineConfig({
  api: {
    input: {
      target: "http://localhost:8000/openapi.json",
    },
    output: {
      mode: "single",
      target: "src/api/generated/index.ts",
      schemas: "src/api/generated/model",
      client: "axios",
      clean: true,
      prettier: false,
      override: {
        mutator: {
          path: "src/api/http.ts",
          name: "apiClient",
        },
      },
    },
  },
});
