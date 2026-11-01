# Technical research report (Milestone 0 → 1)

## Decision: split academy and judge

Compiling C inside Next.js would put GCC, temporary binaries, and student-controlled stdin on the same process that holds session secrets and the database role. A dedicated judge process is the Milestone 1 security boundary.

## Decision: Docker as the isolation host

The judge image contains GCC and the HTTP adapter. Student programs run under a `confine` wrapper (Landlock + seccomp + rlimits) inside that container. Nested `docker run` is not used and the Docker socket is not mounted. See [docs/JUDGE_ISOLATION.md](../JUDGE_ISOLATION.md).

This is defense in depth, not a formal isolation proof. Kernel/container escape is out of scope for functional tests.

## Decision: invitation token hashing

Raw invite tokens are shown once. Only SHA-256 hashes are stored. Seat assignment happens in the same transaction as token consume + student insert so the 51-seat trigger and unique roll identifier apply together.

## Decision: public DTO stripping

Hidden tests are a confidentiality requirement, not a UI preference. Serialization lives in `lib/academy/public-dto.ts` and is unit-tested so route handlers cannot casually spread database rows to the client.

## Unresolved (do not invent)

- Official college roll-number format and roster source.
- Who may mint faculty tokens in production (currently an env secret).
- Exam policies, curriculum packaging, AI teaching.

## What tests do not prove

Passing Hello World, timeout, and 401 cases does not prove the judge is safe against container escape, side-channel leakage, or Postgres role misconfiguration in a real deployment.
