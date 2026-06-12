// ESLint flat config — enforces the architecture in ARCHITECTURE.md.
//
// The architecture is enforced with plain `no-restricted-imports` on import
// strings (deterministic, no module resolution needed):
//
//   • Barrel rule — a feature is a black box. Other code imports it only via
//     '@/features/<name>' (its index barrel), never '@/features/<name>/internals'.
//     Inside a feature, files import each other with RELATIVE paths.
//   • Layer direction — shell → features → shared. The bottom layers
//     (shared / services / types) must never import a feature.
//
// Run: `npm run lint`.
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

const featureBarrelOnly = {
  message:
    "Import a feature through its barrel '@/features/<name>', not its internals. " +
    "Inside the same feature, use a relative path. See ARCHITECTURE.md.",
};

const noFeatures = {
  message:
    "shared / services / types must not import a feature (wrong layer direction: " +
    "shell → features → shared). See ARCHITECTURE.md.",
};

export default tseslint.config(
  { ignores: ["dist", "node_modules", "src-tauri", "android_app", "scripts", "public"] },

  // Base rules for all source.
  {
    files: ["src/**/*.{ts,tsx}"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    plugins: { "react-hooks": reactHooks },
    rules: {
      // Barrel rule: forbid deep imports into any feature (allows '@/features/x').
      "no-restricted-imports": [
        "error",
        { patterns: [{ group: ["@/features/*/**"], ...featureBarrelOnly }] },
      ],
      // Keep the architecture rules loud without drowning in unrelated noise.
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "no-empty": "off",
      "no-useless-escape": "off",
    },
  },

  // Bottom layers may never reach up into a feature.
  {
    files: ["src/shared/**", "src/services/**", "src/types/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [{ group: ["@/features/*", "@/features/*/**"], ...noFeatures }] },
      ],
    },
  },
);
