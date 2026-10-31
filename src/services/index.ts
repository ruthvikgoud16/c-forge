// Single injection point. Replace `demoServices` with the CForge API adapter during integration.
import { demoServices } from "./demo-adapter";
import type { CForgeServices } from "./contracts";

export const services: CForgeServices = demoServices;
export const IS_DEMO = true;
export type { CForgeServices } from "./contracts";
