import type {
  FirecrackerDestroyRequest,
  FirecrackerDestroyResult,
  FirecrackerJobCreateRequest,
  FirecrackerJobCreateResult,
  FirecrackerRunRequest,
  FirecrackerRunResult,
} from "./firecracker-contract";

export type FirecrackerJudgePort = {
  readonly kind: "mock" | "http";
  createJob(auth: string, request: FirecrackerJobCreateRequest): Promise<FirecrackerJobCreateResult>;
  runJob(auth: string, request: FirecrackerRunRequest): Promise<FirecrackerRunResult>;
  destroyJob(auth: string, request: FirecrackerDestroyRequest): Promise<FirecrackerDestroyResult>;
};
