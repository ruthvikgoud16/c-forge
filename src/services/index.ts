// Production uses the CForge API. Demo data loads only when VITE_CFORGE_DEMO=1.
import { cforgeServices } from "./cforge-api";
import { demoServices } from "./demo-adapter";
import type { CForgeServices } from "./contracts";

const useDemo = import.meta.env["VITE_CFORGE_DEMO"] === "1";
export const services: CForgeServices = useDemo ? demoServices : cforgeServices;
export const IS_DEMO = useDemo;
export type { CForgeServices } from "./contracts";
