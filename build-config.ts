import type { ReactComponentBuildConfig, WebComponentBuildConfig } from "../../tasks/build/builder/src/types.ts";

export const webComponentList: WebComponentBuildConfig[] = [
  {
    name: "jb-validation",
    path: "./lib/jb-validation.ts",
    outputPath: "./dist/jb-validation.js",
    umdName: "JBValidation",
  }
];
export const reactComponentList: ReactComponentBuildConfig[] = [];