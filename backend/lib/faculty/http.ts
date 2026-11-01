import { json } from "@/lib/academy/http";
import { FacultyPersistError } from "@/lib/academy/db";

export function facultyFail(error: unknown) {
  if (error instanceof FacultyPersistError) {
    return json(error.httpStatus, { error: error.code });
  }
  throw error;
}
