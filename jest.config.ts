import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  coverageProvider: "v8",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
};

// uuid v13 が純粋 ESM のため、createJestConfig が生成した設定を上書きして
// uuid も Babel でトランスパイルされるようにする
export default async () => {
  const cfg = await createJestConfig(config)();
  cfg.transformIgnorePatterns = ["/node_modules/(?!(uuid)/)"];
  return cfg;
};
