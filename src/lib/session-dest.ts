import type { Role } from "@/domain/types";

export function logoutDest(role: Role | null | undefined) {
  return role === "faculty" ? "/faculty-login" : "/";
}

export function signedInDest(role: Role | null | undefined) {
  if (role === "faculty") return "/faculty";
  if (role === "student") return "/learn";
  return null;
}
