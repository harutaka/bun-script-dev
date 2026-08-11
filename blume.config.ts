import { defineConfig } from "blume";

export default defineConfig({
  title: "Bun Script Dev",
  description: "Documentation powered by Blume.",
  feedback: false,

  deployment: {
    site: "https://harutaka.github.io",
    base: "/bun-script-dev",
  },

  i18n: {
    defaultLocale: "ja",
    locales: [{ code: "ja", label: "日本語" }],
  },
});
