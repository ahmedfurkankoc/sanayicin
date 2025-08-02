import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
  {
    rules: {
      // Kritik olmayan hataları atla
      "@next/next/no-img-element": "warn", // img element uyarısı
      "react/no-unescaped-entities": "warn", // Escape edilmemiş karakterler
      "react-hooks/exhaustive-deps": "warn", // useEffect dependency uyarısı
      "@next/next/no-html-link-for-pages": "error", // Bu kritik, hata olarak kalacak
    },
  },
];

export default eslintConfig;
