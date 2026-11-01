import {
  FIRECRACKER_LIMITS,
  assertNoAnswerKeyInGuestPayload,
  judgePrivateEndpoint,
  type FirecrackerDestroyRequest,
  type FirecrackerDestroyResult,
  type FirecrackerJobCreateRequest,
  type FirecrackerJobCreateResult,
  type FirecrackerRunRequest,
  type FirecrackerRunResult,
} from "./firecracker-contract";
import type { FirecrackerJudgePort } from "./firecracker-port";

export class HttpFirecrackerJudge implements FirecrackerJudgePort {
  readonly kind = "http" as const;

  constructor(private readonly baseUrl: string) {
    if (!judgePrivateEndpoint(baseUrl)) {
      throw Object.assign(new Error("judge endpoint must be private"), { code: "JUDGE_PUBLIC_ENDPOINT" });
    }
  }

  async createJob(auth: string, request: FirecrackerJobCreateRequest): Promise<FirecrackerJobCreateResult> {
    assertNoAnswerKeyInGuestPayload(request);
    return this.post<FirecrackerJobCreateResult>("/v1/jobs", auth, request);
  }

  async runJob(auth: string, request: FirecrackerRunRequest): Promise<FirecrackerRunResult> {
    assertNoAnswerKeyInGuestPayload(request);
    return this.post<FirecrackerRunResult>(`/v1/jobs/${request.jobId}/run`, auth, {
      ownerId: request.ownerId,
      stdin: request.stdin,
    });
  }

  async destroyJob(auth: string, request: FirecrackerDestroyRequest): Promise<FirecrackerDestroyResult> {
    const response = await fetch(`${this.baseUrl.replace(/\/$/, "")}/v1/jobs/${request.jobId}`, {
      method: "DELETE",
      headers: {
        authorization: auth,
        "content-type": "application/json",
      },
      body: JSON.stringify({ ownerId: request.ownerId }),
    });
    if (response.status === 401) return { status: "unauthorized" };
    if (response.status === 403) return { status: "forbidden" };
    if (response.status === 404) return { status: "not_found" };
    if (!response.ok) return { status: "not_found" };
    return (await response.json()) as FirecrackerDestroyResult;
  }

  private async post<T>(path: string, auth: string, body: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl.replace(/\/$/, "")}${path}`, {
      method: "POST",
      headers: {
        authorization: auth,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const payload = (await response.json().catch(() => ({}))) as T;
    if (response.status === 401) return { status: "unauthorized" } as T;
    if (response.status === 429) {
      return { status: "queue_full", retryAfterSec: FIRECRACKER_LIMITS.maxConcurrentJobs } as T;
    }
    return payload;
  }
}
