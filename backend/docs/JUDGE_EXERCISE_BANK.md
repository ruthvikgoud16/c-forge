# Judge exercise bank (Milestone 2F.3)

Academy C practice on the existing isolated GCC judge. **Not official laboratory sheets. Not contests.**

## Starters (Milestone 1 / 2B)

| Slug | Topic |
| --- | --- |
| `hello-cforge` | `u1-t5` structure of a C program |
| `add-two-integers` | `u1-t4` formatted I/O |

## New (2F.3, ten problems)

Beginner first, then harder. Each has a sample plus three hidden tests. Hidden stdin and expected stdout stay server-side.

| Slug | Topic | Idea |
| --- | --- | --- |
| `echo-integer` | `u1-t3` | Read and print one integer |
| `integer-remainder` | `u1-t6` | `a % b` |
| `max-of-two` | `u2-t2` | if / if-else |
| `letter-grade` | `u2-t3` | else-if bands (academy practice, not university marks) |
| `sum-one-to-n` | `u2-t6` | for-loop sum |
| `array-sum` | `u3-t1` | one-dimensional array sum |
| `string-length-manual` | `u3-t5` | length without `strlen` / no `strrev` |
| `swap-two-addresses` | `u4-t3` | swap via pointers (C is pass-by-value) |
| `factorial-recursive` | `u4-t5` | n! for n ≤ 12 |
| `linear-search-index` | `u5-t1` | first index or −1; list need not be sorted |

No exercise is mapped to `u1-t8`, `u2-t7`, `u3-t6`, `u4-t6`, or `u5-t8`. Binary search is not in this batch (it needs a sorted list).

## Expansion (2F.3 second batch, ten problems)

Additive rows only. Ledger `2026-10-31_006_exercise_bank_2f3b` (`db/seed-exercises-2f3b.sql`). Existing twelve exercises are not rewritten.

| Slug | Topic | Idea |
| --- | --- | --- |
| `min-of-three-ternary` | `u1-t7` | Smallest of three (conditional operator) |
| `evaluate-with-precedence` | `u2-t1` | Print `a + b * c` with C precedence |
| `skip-multiples-continue` | `u2-t4` | Print 1..n except multiples of k |
| `count-digits-while` | `u2-t5` | Digit count; 0 has one digit |
| `matrix-2x2-sum` | `u3-t2` | Sum of a 2-by-2 matrix |
| `string-equal-strcmp` | `u3-t4` | `equal` / `differ` via `strcmp` (no `strrev`) |
| `square-return` | `u4-t2` | Function returns `n * n` |
| `array-max-argument` | `u4-t4` | Maximum after passing an array |
| `binary-search-index` | `u5-t2` | First index on a sorted list, or −1 |
| `bubble-sort-asc` | `u5-t3` | Non-decreasing space-separated line |

Reference C lives in `lib/academy/exercise-solutions.ts` (server-side only). Hidden stdin/stdout stay in `exercise_tests` / in-process bank and never appear on the public DTO.

Bank size after this expansion: 22 exercises (2 starters + first 10 + second 10).

## Behaviour unchanged

- Studio and `GET /api/v1/exercises/:id` return the public DTO only.
- Run uses sample (or custom) stdin. Submit runs every test, including hidden, and returns pass/fail ordinals only.
- Judge stays the Docker/GCC service. Academy does not compile in-process.

Mapping: `lib/academy/exercise-bank.ts` `EXERCISE_TOPIC_IDS`. Hub independent-practice cards link to `/studio/:id` when a mapping exists.
