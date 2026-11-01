import { json } from "@/lib/academy/http";
import { facultyAuthorized } from "@/lib/faculty/auth";
import { facultyFail } from "@/lib/faculty/http";
import { facultyOverviewPayload } from "@/lib/faculty/overview";

export async function GET(request: Request) {
  if (!facultyAuthorized(request)) return json(401, { error: "unauthorized" });
  try {
    return json(200, await facultyOverviewPayload());
  } catch (error) {
    return facultyFail(error);
  }
}
