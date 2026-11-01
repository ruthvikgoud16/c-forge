# Visual simulator catalog

Design only. No simulator is implemented. Each tool is a `visualisation` resource payload, not its own database table.

Status: **P** planned. Build order: 2E first two Unit 1 tools, then Unit 2–5 in 2F. See [IMPLEMENTATION_ROADMAP.md](IMPLEMENTATION_ROADMAP.md).

Shared rules: no GCC in the browser academy; these are **didactic visualisers**, not the judge. They must not claim to be a real compiler.

## Unit 1

### Computer block diagram explorer

- **Objective:** Name input, memory, ALU/CU, output, and how data moves.
- **Interactions:** Click a block; read a one-sentence role; highlight the next hop.
- **Inputs:** None required; optional “follow a keypress” scenario.
- **Feedback:** Selected block and path highlight; short caption.
- **Why:** Topic `u1-t1` is abstract without a picture.
- **Dependencies:** Catalog topic `u1-t1`; existing static block-diagram component can be extended.

### Binary number converter

- **Objective:** See that a bit pattern is a value, not magic text.
- **Interactions:** Toggle bits; type a small decimal (0–255).
- **Inputs:** Bit vector or decimal integer in range.
- **Feedback:** Live binary, decimal, and a place-value breakdown.
- **Why:** Students confuse “binary” with “the computer’s language” instead of place value.
- **Dependencies:** `u1-t1`; no judge.

### Algorithm and flowchart builder

- **Objective:** Sequence, decision, and loop symbols; one valid path.
- **Interactions:** Place start/process/decision/io/end; connect arrows; run a token through.
- **Inputs:** Student-built graph; a tiny canned example (largest of two numbers).
- **Feedback:** Token follows Yes/No; invalid graphs show a simple rule, not a crash.
- **Why:** `u1-t2` is the bridge from English to code.
- **Dependencies:** `u1-t2`. **2E priority.**

### Data type explorer

- **Objective:** See `int`, `char`, `float` as different boxes.
- **Interactions:** Choose a type; type a value; see accepted vs rejected.
- **Inputs:** Type name + sample literal.
- **Feedback:** Size-as-metaphor (not invented ABI claims); overflow warning in simple English.
- **Why:** `u1-t4` fails when students treat every value as text.
- **Dependencies:** `u1-t4`. Do not invent compiler-specific sizes as official syllabus facts; say “typical teaching sizes”.

### Operator evaluator

- **Objective:** Evaluate an expression in the order C uses for the operators already taught.
- **Interactions:** Enter a small expression from a allow-list of operators; step.
- **Inputs:** Expression string from a safe subset (`+ - * / % = == != < > && ||`).
- **Feedback:** One reduction per step; current operator highlighted.
- **Why:** `u1-t6` / `u2-t1` errors are mostly order-of-operations.
- **Dependencies:** `u1-t6`. **2E priority.** Not a replacement for the judge.

## Unit 2

### Conditional execution visualiser

- **Objective:** See which branch runs.
- **Interactions:** Set variable values; step an `if` / `if-else` / nested `if`.
- **Inputs:** Condition values; canned snippet.
- **Feedback:** Active branch highlight; inactive branch dimmed.
- **Why:** Students read both branches as if both run.
- **Dependencies:** `u2-t2`. **2F first visual.**

### Switch-case simulator

- **Objective:** Match, fall-through, and `break`.
- **Interactions:** Choose a selector value; step cases.
- **Inputs:** Integer selector; canned `switch`.
- **Feedback:** Landing case; whether execution falls through.
- **Why:** Fall-through is the usual surprise.
- **Dependencies:** `u2-t3`.

### Loop execution simulator

- **Objective:** See initialisation, condition, body, update.
- **Interactions:** Step `while`, `do-while`, `for` on the same tiny task.
- **Inputs:** Start, end, step.
- **Feedback:** Iteration count; condition true/false; body highlight.
- **Why:** Off-by-one and “do-while runs once”.
- **Dependencies:** `u2-t5`, `u2-t6`. **2F priority with conditionals.**

### Break / continue visualisation

- **Objective:** `break` leaves the loop; `continue` skips to the update/condition.
- **Interactions:** Toggle a `break` or `continue` line; step.
- **Inputs:** Canned loop.
- **Feedback:** Arrow to exit vs next iteration.
- **Why:** `u2-t4` wording is easy to memorise and hard to see.
- **Dependencies:** `u2-t4`, loop simulator.

### Expression precedence explorer

- **Objective:** Parentheses vs default precedence and associativity.
- **Interactions:** Same as operator evaluator with type-conversion captions.
- **Inputs:** Small mixed expression.
- **Feedback:** Tree or reduction list; conversion note when `int`/`float` mix.
- **Why:** Official topic `u2-t1`.
- **Dependencies:** Unit 1 evaluator; `u2-t1`.

## Unit 3

### Array memory visualiser

- **Objective:** Index is an offset from zero.
- **Interactions:** Set length; write `a[i]`; click a cell.
- **Inputs:** Length 1–8; cell values.
- **Feedback:** Boxes labelled `0 … n-1`; out-of-range attempt marked invalid (teaching, not UB execution).
- **Why:** `u3-t1`.
- **Dependencies:** `u3-t1`. **2F priority.**

### Indexing explorer

- **Objective:** `a[i]` vs the value `i`.
- **Interactions:** Move `i`; show `a[i]`.
- **Inputs:** Fixed tiny array.
- **Feedback:** Highlighted cell.
- **Why:** Students use the value as the index.
- **Dependencies:** Array memory visualiser.

### Multidimensional array visualiser

- **Objective:** Rows and columns as `a[r][c]`.
- **Interactions:** Click a cell; see both indices.
- **Inputs:** Small 2×3 or 3×3 teaching grid.
- **Feedback:** Row/column highlight.
- **Why:** `u3-t2`.
- **Dependencies:** `u3-t2`.

### String memory explorer

- **Objective:** Characters plus the `'\0'` terminator.
- **Interactions:** Type a short string; show cells including terminator.
- **Inputs:** ASCII teaching string, length cap.
- **Feedback:** Index row; terminator cell labelled.
- **Why:** `u3-t3` and off-by-one on length.
- **Dependencies:** `u3-t3`.

### String function simulator

- **Objective:** `strlen`, `strcmp`, `strcat`, `strcpy` as copies and counts. **`strrev` labelled non-standard.**
- **Interactions:** Pick a function; step copies.
- **Inputs:** One or two short strings.
- **Feedback:** Destination buffer cells; overflow warning if dest is too small (teaching model).
- **Why:** `u3-t4` / `u3-t5`.
- **Dependencies:** String memory explorer. Never teach `strrev` as ISO C.

## Unit 4

### Function call-stack visualiser

- **Objective:** Each call has its own frame.
- **Interactions:** Step into `main` → `f` → return.
- **Inputs:** Canned two-function program.
- **Feedback:** Stack frames appear and disappear.
- **Why:** `u4-t2`.
- **Dependencies:** `u4-t2`. **2F priority.**

### Parameter passing simulator

- **Objective:** C is pass-by-value; a pointer argument still copies the address.
- **Interactions:** Toggle “value” vs “address of x”; step assignments.
- **Inputs:** Canned `swap` that fails vs `swap` with pointers.
- **Feedback:** Two memory columns: caller object vs parameter box.
- **Why:** Official phrase “Call by Reference” must stay; the picture prevents the wrong language-lawyer claim.
- **Dependencies:** `u4-t3`.

### Storage class scope/lifetime explorer

- **Objective:** `auto`, `static`, `register`, `extern` as lifetime and visibility, not four kinds of int.
- **Interactions:** Step two calls; watch a `static` cell keep its value.
- **Inputs:** Canned snippets.
- **Feedback:** Timeline of “exists / gone”.
- **Why:** `u4-t1`.
- **Dependencies:** `u4-t1`. Do not invent register-allocation guarantees.

### Recursion tree visualiser

- **Objective:** Each recursive call is a new frame; base case stops.
- **Interactions:** Step `fact(3)` or a tiny Fibonacci **with a warning about duplicate work**.
- **Inputs:** Small n (cap 5).
- **Feedback:** Tree of calls; returning values.
- **Why:** `u4-t5`.
- **Dependencies:** Call-stack visualiser.

## Unit 5

### Linear and binary search visualiser

- **Objective:** Linear walks; binary halves a **sorted** list.
- **Interactions:** Set target; step comparisons.
- **Inputs:** Tiny array; target. Binary mode refuses unsorted input and explains why.
- **Feedback:** Examined cells; low/mid/high for binary.
- **Why:** `u5-t1`, `u5-t2`.
- **Dependencies:** Array visualiser. **2F priority.**

### Sorting animations (bubble, insertion, selection)

- **Objective:** See adjacent swap vs insert vs min-select.
- **Interactions:** Play/step; same starting array for all three.
- **Inputs:** 5–8 integers.
- **Feedback:** Compared pair; swap; pass boundary.
- **Why:** `u5-t3`–`u5-t5`.
- **Dependencies:** Array visualiser.

### Quick sort and merge sort steppers

- **Objective:** Partition vs merge; recursion already taught.
- **Interactions:** Step partition or merge; show subarrays.
- **Inputs:** Tiny array (cap 8).
- **Feedback:** Pivot/partition or left/right merge buffers.
- **Why:** `u5-t6`, `u5-t7`.
- **Dependencies:** Recursion tree (conceptual); array visualiser.

### Side-by-side algorithm comparison

- **Objective:** Same data, different comparison counts (teaching counts, not a benchmark paper).
- **Interactions:** Choose two algorithms; run both on the same array.
- **Inputs:** Shared tiny array.
- **Feedback:** Step counts as “this run”, not official complexity marks.
- **Why:** Stops memorising Big-O with no picture. Do not invent exam weightage.
- **Dependencies:** The sort/search visualisers.

## Intentionally not specified

Competitive-platform judges (`u5-t8`) — no named platforms were supplied. Do not invent them as CForge simulators.
