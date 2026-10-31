// DEMONSTRATION FIXTURE — topic structure follows the established CForge syllabus.
// Explanatory text is demonstration material pending integration of the original teaching packages.
import type { Topic, Unit } from "@/domain/types";

export const units: Unit[] = [
  { id: "unit-1", number: 1, title: "C Programming Fundamentals", shortTitle: "Fundamentals", summary: "From the computer system and number systems to tokens, data types, program structure and every family of operators." },
  { id: "unit-2", number: 2, title: "Decision Making and Looping", shortTitle: "Decisions & Loops", summary: "Precedence, type conversion, selection statements, jumps and the three loop forms." },
  { id: "unit-3", number: 3, title: "Arrays and Strings", shortTitle: "Arrays & Strings", summary: "One- and multi-dimensional arrays, string I/O, the string library and manual string operations." },
  { id: "unit-4", number: 4, title: "Functions and Recursion", shortTitle: "Functions", summary: "Storage classes, declarations and definitions, argument passing, arrays as parameters and recursion." },
  { id: "unit-5", number: 5, title: "Searching and Sorting", shortTitle: "Search & Sort", summary: "Linear and binary search, the elementary sorts, and quick and merge sort." },
];

type T = Omit<Topic, "source" | "order"> ;
const raw: T[] = [
  // ---------------- UNIT 1 ----------------
  {
    id: "computer-system", unitId: "unit-1", title: "Computer System Block Diagram",
    summary: "How input, CPU, memory and output units cooperate to run a program.",
    concepts: [
      { term: "CPU", definition: "Executes instructions; made of the ALU, control unit and registers." },
      { term: "Primary memory", definition: "Fast, directly addressable storage (RAM) holding running programs and data." },
      { term: "Secondary storage", definition: "Non-volatile storage such as SSDs that keeps programs between runs." },
    ],
    example: { code: `#include <stdio.h>\n\nint main(void) {\n    int x;            /* stored in memory */\n    scanf("%d", &x);  /* input unit  */\n    x = x * 2;        /* ALU        */\n    printf("%d\\n", x);/* output unit */\n    return 0;\n}`, output: "Input 21 → 42", explanation: "Each line exercises a different block of the system." },
    tools: ["syntax"], exerciseIds: [],
  },
  {
    id: "number-systems", unitId: "unit-1", title: "Number Systems and Binary",
    summary: "Binary, octal, decimal and hexadecimal representations and conversion between them.",
    concepts: [
      { term: "Base", definition: "The number of distinct digits a positional system uses (2, 8, 10, 16)." },
      { term: "Bit", definition: "A single binary digit, 0 or 1; eight bits make a byte." },
      { term: "Place value", definition: "Each position is worth the base raised to the position index." },
    ],
    example: { code: `#include <stdio.h>\n\nint main(void) {\n    int n = 45;\n    printf("%d %o %X\\n", n, n, n);\n    return 0;\n}`, output: "45 55 2D", explanation: "%o prints octal and %X prints hexadecimal." },
    tools: ["binary"], exerciseIds: ["ex-binary-digits"],
  },
  {
    id: "algorithms-flowcharts", unitId: "unit-1", title: "Algorithms and Flowcharts",
    summary: "Expressing a solution as finite, unambiguous steps and drawing it as a flowchart.",
    concepts: [
      { term: "Algorithm", definition: "A finite sequence of well-defined steps that solves a problem." },
      { term: "Flowchart", definition: "A diagram of an algorithm using terminal, process, decision and I/O symbols." },
      { term: "Decision symbol", definition: "A diamond with one entry and yes/no exits based on a condition." },
    ],
    example: { code: `/* Algorithm: largest of two numbers\n1. Start\n2. Read a, b\n3. If a > b print a else print b\n4. Stop */`, output: "a=4, b=9 → 9", explanation: "Each numbered step maps to one flowchart symbol." },
    tools: ["algorithm", "flowchart"], exerciseIds: ["ex-largest-of-three"],
  },
  {
    id: "tokens", unitId: "unit-1", title: "Keywords, Identifiers, Constants and Variables",
    summary: "The smallest meaningful units of a C program and the rules for naming.",
    concepts: [
      { term: "Keyword", definition: "A reserved word with fixed meaning, such as int, return or while." },
      { term: "Identifier", definition: "A programmer-chosen name; letters, digits, underscore; cannot start with a digit." },
      { term: "Constant", definition: "A fixed value, e.g. 10, 3.14, 'A', or a const-qualified object." },
    ],
    example: { code: `#include <stdio.h>\n\nint main(void) {\n    const float PI = 3.14f;\n    int radius = 2;\n    printf("%.2f\\n", PI * radius * radius);\n    return 0;\n}`, output: "12.56", explanation: "PI is a constant, radius a variable, int and return are keywords." },
    tools: ["syntax"], exerciseIds: [],
  },
  {
    id: "data-types-io", unitId: "unit-1", title: "Data Types and Formatted I/O",
    summary: "int, char, float, double and their modifiers, with printf and scanf format specifiers.",
    concepts: [
      { term: "Data type", definition: "Determines the size, range and operations of a value." },
      { term: "Format specifier", definition: "A % sequence such as %d, %f, %c or %s telling printf/scanf the type." },
      { term: "Address-of in scanf", definition: "scanf needs the variable's address, so most arguments use &." },
    ],
    example: { code: `#include <stdio.h>\n\nint main(void) {\n    char grade = 'A';\n    double gpa = 8.75;\n    printf("%c %.1f\\n", grade, gpa);\n    return 0;\n}`, output: "A 8.8", explanation: "%.1f rounds to one decimal place." },
    syntax: `printf("format", value1, value2, ...);\nscanf("format", &var1, &var2, ...);`,
    tools: ["syntax"], exerciseIds: ["ex-sum-two", "ex-celsius"],
  },
  {
    id: "program-structure", unitId: "unit-1", title: "Structure of a C Program",
    summary: "Preprocessor directives, global declarations, main and user-defined functions.",
    concepts: [
      { term: "Preprocessor directive", definition: "A line beginning with # processed before compilation, e.g. #include." },
      { term: "main function", definition: "The entry point where execution of a hosted C program begins." },
      { term: "Statement", definition: "An instruction terminated by a semicolon." },
    ],
    example: { code: `#include <stdio.h>   /* preprocessor */\n#define GREETING "Hello"\n\nint main(void) {     /* entry point */\n    printf("%s, CForge\\n", GREETING);\n    return 0;\n}`, output: "Hello, CForge", explanation: "GREETING is replaced textually before compilation." },
    syntax: `#include <header.h>\n\nint main(void) {\n    /* declarations */\n    /* statements */\n    return 0;\n}`,
    tools: ["syntax"], exerciseIds: ["ex-hello"],
  },
  {
    id: "arithmetic-assignment", unitId: "unit-1", title: "Arithmetic and Assignment Operators",
    summary: "+, -, *, /, % and compound assignment, including integer division behaviour.",
    concepts: [
      { term: "Integer division", definition: "Dividing two ints discards the fractional part: 7 / 2 is 3." },
      { term: "Modulus", definition: "% gives the remainder of integer division: 7 % 2 is 1." },
      { term: "Compound assignment", definition: "x += 5 means x = x + 5; also -=, *=, /=, %=." },
    ],
    example: { code: `#include <stdio.h>\n\nint main(void) {\n    int a = 17, b = 5;\n    a %= b;\n    printf("%d %d\\n", 17 / 5, a);\n    return 0;\n}`, output: "3 2", explanation: "17 / 5 truncates to 3; 17 % 5 leaves 2." },
    tools: ["syntax"], exerciseIds: ["ex-digit-sum"],
  },
  {
    id: "relational-logical", unitId: "unit-1", title: "Relational and Logical Operators",
    summary: "Comparisons that yield 0 or 1, combined with &&, || and !.",
    concepts: [
      { term: "Relational operator", definition: "<, <=, >, >=, ==, != compare values and produce 1 (true) or 0 (false)." },
      { term: "Short-circuit", definition: "&& stops at the first false operand; || stops at the first true one." },
      { term: "Logical NOT", definition: "! turns any non-zero value into 0 and 0 into 1." },
    ],
    example: { code: `#include <stdio.h>\n\nint main(void) {\n    int x = 5;\n    printf("%d %d %d\\n", x > 3, x > 3 && x < 4, !x);\n    return 0;\n}`, output: "1 0 0", explanation: "Each expression evaluates to an int 1 or 0." },
    tools: ["control-flow"], exerciseIds: ["ex-leap-year"],
  },
  {
    id: "incdec-bitwise", unitId: "unit-1", title: "Increment, Decrement and Bitwise Operators",
    summary: "Prefix vs postfix ++/--, and bit-level &, |, ^, ~, <<, >>.",
    concepts: [
      { term: "Prefix vs postfix", definition: "++x increments then yields the new value; x++ yields the old value then increments." },
      { term: "Bitwise AND", definition: "& keeps a bit only where both operands have 1." },
      { term: "Left shift", definition: "x << n moves bits left n places, multiplying unsigned values by 2ⁿ." },
    ],
    example: { code: `#include <stdio.h>\n\nint main(void) {\n    int i = 5;\n    int a = i++;\n    int b = ++i;\n    printf("%d %d %d %d\\n", a, b, 6 & 3, 1 << 3);\n    return 0;\n}`, output: "5 7 2 8", explanation: "a gets the old 5, b the new 7; 110 & 011 = 010." },
    tools: ["binary"], exerciseIds: ["ex-count-set-bits"],
  },
  {
    id: "conditional-special", unitId: "unit-1", title: "Conditional and Special Operators",
    summary: "The ternary operator, comma operator and sizeof.",
    concepts: [
      { term: "Ternary operator", definition: "cond ? a : b evaluates to a when cond is non-zero, otherwise b." },
      { term: "sizeof", definition: "Yields the size in bytes of a type or object as a size_t." },
      { term: "Comma operator", definition: "Evaluates left then right and yields the right operand's value." },
    ],
    example: { code: `#include <stdio.h>\n\nint main(void) {\n    int a = 8, b = 3;\n    int max = a > b ? a : b;\n    printf("%d %zu\\n", max, sizeof(char));\n    return 0;\n}`, output: "8 1", explanation: "sizeof(char) is always 1 by definition." },
    tools: ["control-flow"], exerciseIds: [],
  },
  // ---------------- UNIT 2 ----------------
  {
    id: "precedence-associativity", unitId: "unit-2", title: "Operator Precedence and Associativity",
    summary: "Which operator binds first, and in which direction ties are resolved.",
    concepts: [
      { term: "Precedence", definition: "Determines which operator is applied first: * binds tighter than +." },
      { term: "Associativity", definition: "Direction for equal-precedence operators; most are left-to-right, assignment is right-to-left." },
      { term: "Parentheses", definition: "Override precedence and make intent explicit." },
    ],
    example: { code: `#include <stdio.h>\n\nint main(void) {\n    int r = 2 + 3 * 4 - 6 / 2;\n    printf("%d\\n", r);\n    return 0;\n}`, output: "11", explanation: "3*4=12 and 6/2=3 first, then 2+12-3." },
    tools: ["algorithm"], exerciseIds: [],
  },
  {
    id: "type-conversion", unitId: "unit-2", title: "Type Conversion",
    summary: "Implicit promotion in mixed expressions and explicit casts.",
    concepts: [
      { term: "Implicit conversion", definition: "The compiler converts operands to a common type, e.g. int to double." },
      { term: "Cast", definition: "(type)expr explicitly converts a value." },
      { term: "Truncation", definition: "Converting a floating value to int discards the fractional part." },
    ],
    example: { code: `#include <stdio.h>\n\nint main(void) {\n    int s = 7, n = 2;\n    printf("%.1f %d\\n", (double)s / n, (int)3.9);\n    return 0;\n}`, output: "3.5 3", explanation: "Casting s first makes the division floating-point." },
    tools: ["syntax"], exerciseIds: ["ex-average"],
  },
  {
    id: "if-else", unitId: "unit-2", title: "if, if-else and Nested if",
    summary: "Selecting a path based on a condition, including nested decisions.",
    concepts: [
      { term: "if statement", definition: "Executes its body only when the condition is non-zero." },
      { term: "Dangling else", definition: "An else binds to the nearest unmatched if; braces avoid ambiguity." },
      { term: "Nested if", definition: "An if placed inside another if or else branch." },
    ],
    example: { code: `#include <stdio.h>\n\nint main(void) {\n    int n = -4;\n    if (n >= 0) {\n        printf("non-negative\\n");\n    } else {\n        if (n % 2 == 0) printf("negative even\\n");\n        else printf("negative odd\\n");\n    }\n    return 0;\n}`, output: "negative even", explanation: "The outer else runs, then the inner if." },
    syntax: `if (condition) {\n    /* true branch */\n} else {\n    /* false branch */\n}`,
    tools: ["control-flow", "flowchart"], exerciseIds: ["ex-largest-of-three", "ex-even-odd"],
  },
  {
    id: "else-if-switch", unitId: "unit-2", title: "Else-if Ladder and switch",
    summary: "Multi-way selection with chained conditions or integer case labels.",
    concepts: [
      { term: "Else-if ladder", definition: "Conditions are tested top to bottom; the first true branch runs." },
      { term: "switch", definition: "Jumps to the case label matching an integer expression." },
      { term: "Fall-through", definition: "Without break, execution continues into the next case." },
    ],
    example: { code: `#include <stdio.h>\n\nint main(void) {\n    int day = 3;\n    switch (day) {\n        case 1: printf("Mon\\n"); break;\n        case 3: printf("Wed\\n"); break;\n        default: printf("Other\\n");\n    }\n    return 0;\n}`, output: "Wed", explanation: "break prevents falling into default." },
    syntax: `switch (expr) {\n    case CONST1: /* ... */ break;\n    default:     /* ... */\n}`,
    tools: ["control-flow"], exerciseIds: ["ex-grade"],
  },
  {
    id: "jumps", unitId: "unit-2", title: "break, continue and goto",
    summary: "Altering the normal flow of loops and switch statements.",
    concepts: [
      { term: "break", definition: "Exits the innermost loop or switch immediately." },
      { term: "continue", definition: "Skips the rest of the current iteration and proceeds to the next." },
      { term: "goto", definition: "Jumps to a labelled statement in the same function; use sparingly." },
    ],
    example: { code: `#include <stdio.h>\n\nint main(void) {\n    for (int i = 1; i <= 6; i++) {\n        if (i == 3) continue;\n        if (i == 5) break;\n        printf("%d ", i);\n    }\n    return 0;\n}`, output: "1 2 4 ", explanation: "3 is skipped and the loop stops at 5." },
    tools: ["control-flow"], exerciseIds: [],
  },
  {
    id: "loops", unitId: "unit-2", title: "while, do-while and for Loops",
    summary: "Entry-controlled and exit-controlled repetition.",
    concepts: [
      { term: "while", definition: "Entry-controlled: tests the condition before every iteration." },
      { term: "do-while", definition: "Exit-controlled: the body runs at least once." },
      { term: "for", definition: "Combines initialisation, condition and update in one header." },
    ],
    example: { code: `#include <stdio.h>\n\nint main(void) {\n    int i = 10;\n    do {\n        printf("%d ", i);\n    } while (i < 5);\n    return 0;\n}`, output: "10 ", explanation: "The body runs once even though the condition is false." },
    syntax: `for (init; condition; update) {\n    /* body */\n}`,
    tools: ["control-flow", "flowchart"], exerciseIds: ["ex-factorial", "ex-fibonacci", "ex-prime", "ex-reverse-number"],
  },
  // ---------------- UNIT 3 ----------------
  {
    id: "arrays-1d", unitId: "unit-3", title: "One-dimensional Arrays",
    summary: "Contiguous collections of same-typed elements accessed by index.",
    concepts: [
      { term: "Zero-based index", definition: "The first element is a[0]; the last of n elements is a[n-1]." },
      { term: "Contiguous storage", definition: "Elements occupy adjacent memory locations." },
      { term: "Out-of-bounds", definition: "Accessing outside 0..n-1 is undefined behaviour in C." },
    ],
    example: { code: `#include <stdio.h>\n\nint main(void) {\n    int a[5] = {4, 8, 15, 16, 23};\n    int sum = 0;\n    for (int i = 0; i < 5; i++) sum += a[i];\n    printf("%d\\n", sum);\n    return 0;\n}`, output: "66", explanation: "The loop visits indexes 0 through 4." },
    syntax: `type name[size];\ntype name[] = {v0, v1, ...};`,
    tools: ["array-string"], exerciseIds: ["ex-array-max", "ex-array-reverse"],
  },
  {
    id: "arrays-2d", unitId: "unit-3", title: "Multidimensional Arrays",
    summary: "Arrays of arrays — matrices stored in row-major order.",
    concepts: [
      { term: "Row-major order", definition: "C stores a 2-D array row by row in memory." },
      { term: "Nested loops", definition: "An outer loop over rows and inner loop over columns traverses a matrix." },
      { term: "Declaration", definition: "int m[3][4] declares 3 rows of 4 ints each." },
    ],
    example: { code: `#include <stdio.h>\n\nint main(void) {\n    int m[2][3] = {{1,2,3},{4,5,6}};\n    printf("%d\\n", m[1][2]);\n    return 0;\n}`, output: "6", explanation: "Row 1, column 2 (zero-based)." },
    tools: ["array-string"], exerciseIds: ["ex-matrix-add"],
  },
  {
    id: "string-io", unitId: "unit-3", title: "String Input and Output",
    summary: "Null-terminated char arrays read with scanf/fgets and printed with printf/puts.",
    concepts: [
      { term: "Null terminator", definition: "Strings end with '\\0', which is not counted by strlen." },
      { term: "scanf %s", definition: "Reads one whitespace-delimited word; no & needed for arrays." },
      { term: "fgets", definition: "Reads a whole line safely, up to a buffer size, keeping the newline." },
    ],
    example: { code: `#include <stdio.h>\n\nint main(void) {\n    char name[20] = "Ada";\n    printf("%s has %zu bytes\\n", name, sizeof name);\n    return 0;\n}`, output: "Ada has 20 bytes", explanation: "sizeof gives the array size, not the string length." },
    tools: ["array-string"], exerciseIds: [],
  },
  {
    id: "string-library", unitId: "unit-3", title: "String Handling Functions",
    summary: "strlen, strcmp, strcat, strcpy from <string.h>, and the non-standard strrev.",
    concepts: [
      { term: "strlen", definition: "Returns the number of characters before the '\\0'." },
      { term: "strcmp", definition: "Returns 0 if equal, negative or positive by lexicographic order." },
      { term: "strrev", definition: "Reverses a string in place — NOT part of ISO C; available only in some compilers." },
    ],
    example: { code: `#include <stdio.h>\n#include <string.h>\n\nint main(void) {\n    char a[20] = "for";\n    strcat(a, "ge");\n    printf("%s %zu %d\\n", a, strlen(a), strcmp(a, "forge") == 0);\n    return 0;\n}`, output: "forge 5 1", explanation: "strcat appends; the destination must have room." },
    note: "strrev is a non-standard extension and is not available in ISO C or on many compilers (e.g. GCC on Linux).",
    tools: ["array-string"], exerciseIds: ["ex-palindrome"],
  },
  {
    id: "manual-strings", unitId: "unit-3", title: "Manual String Operations",
    summary: "Implementing length, copy, reverse and compare with loops.",
    concepts: [
      { term: "Sentinel loop", definition: "Loop until s[i] == '\\0' to walk a string." },
      { term: "Two-pointer reverse", definition: "Swap s[i] and s[j] while moving i forward and j backward." },
      { term: "Manual copy", definition: "Copy each char including the terminating '\\0'." },
    ],
    example: { code: `#include <stdio.h>\n\nint main(void) {\n    char s[] = "loop";\n    int n = 0;\n    while (s[n] != '\\0') n++;\n    printf("%d\\n", n);\n    return 0;\n}`, output: "4", explanation: "Counts characters until the terminator." },
    tools: ["array-string"], exerciseIds: ["ex-count-vowels", "ex-palindrome"],
  },
  // ---------------- UNIT 4 ----------------
  {
    id: "storage-classes", unitId: "unit-4", title: "Storage Classes",
    summary: "auto, register, static and extern — scope, lifetime and linkage.",
    concepts: [
      { term: "auto", definition: "Default for local variables; lifetime is the enclosing block." },
      { term: "static local", definition: "Retains its value between calls; initialised once." },
      { term: "extern", definition: "Declares a variable defined elsewhere, typically another file." },
    ],
    example: { code: `#include <stdio.h>\n\nvoid tick(void) {\n    static int count = 0;\n    count++;\n    printf("%d ", count);\n}\n\nint main(void) {\n    tick(); tick(); tick();\n    return 0;\n}`, output: "1 2 3 ", explanation: "count persists across calls." },
    tools: ["syntax"], exerciseIds: [],
  },
  {
    id: "functions", unitId: "unit-4", title: "Function Declarations and Definitions",
    summary: "Prototypes, definitions, parameters and the call mechanism.",
    concepts: [
      { term: "Prototype", definition: "Declares a function's return type and parameter types before use." },
      { term: "Definition", definition: "Provides the function body." },
      { term: "Parameter vs argument", definition: "Parameters are in the definition; arguments are the values passed at the call." },
    ],
    example: { code: `#include <stdio.h>\n\nint square(int n);          /* declaration */\n\nint main(void) {\n    printf("%d\\n", square(9));\n    return 0;\n}\n\nint square(int n) {         /* definition */\n    return n * n;\n}`, output: "81", explanation: "The prototype lets main call square before its definition." },
    syntax: `return_type name(type param1, type param2);`,
    tools: ["syntax"], exerciseIds: ["ex-gcd"],
  },
  {
    id: "return-exit", unitId: "unit-4", title: "return and exit",
    summary: "Returning values from functions versus terminating the whole program.",
    concepts: [
      { term: "return", definition: "Ends the current function and optionally passes a value to the caller." },
      { term: "exit", definition: "Terminates the entire program from anywhere; declared in <stdlib.h>." },
      { term: "Exit status", definition: "0 or EXIT_SUCCESS signals success to the operating system." },
    ],
    example: { code: `#include <stdio.h>\n#include <stdlib.h>\n\nint main(void) {\n    printf("start\\n");\n    exit(0);\n    printf("never\\n");\n}`, output: "start", explanation: "exit ends the program before the second printf." },
    tools: ["syntax"], exerciseIds: [],
  },
  {
    id: "argument-passing", unitId: "unit-4", title: "Call by Value and Pointer Parameters",
    summary: "C always passes arguments by value; passing an address lets a function modify caller data.",
    concepts: [
      { term: "Call by value", definition: "The function receives a copy; changing the parameter does not change the argument." },
      { term: "Pointer parameter", definition: "Passing &x gives the function a copy of the address, through which it can modify x." },
      { term: "Accurate wording", definition: "C has no true call-by-reference; pointer passing simulates it by value-passing an address." },
    ],
    example: { code: `#include <stdio.h>\n\nvoid swap(int *a, int *b) {\n    int t = *a; *a = *b; *b = t;\n}\n\nint main(void) {\n    int x = 1, y = 2;\n    swap(&x, &y);\n    printf("%d %d\\n", x, y);\n    return 0;\n}`, output: "2 1", explanation: "The addresses are copied, but they point at x and y." },
    tools: ["recursion"], exerciseIds: ["ex-swap"],
  },
  {
    id: "arrays-to-functions", unitId: "unit-4", title: "Passing Arrays to Functions",
    summary: "An array argument decays to a pointer to its first element.",
    concepts: [
      { term: "Array decay", definition: "In a call, an array name converts to a pointer to element 0." },
      { term: "Size parameter", definition: "Pass the length separately; sizeof inside the function gives the pointer size." },
      { term: "Modification", definition: "The function can modify the caller's elements through the pointer." },
    ],
    example: { code: `#include <stdio.h>\n\nvoid twice(int a[], int n) {\n    for (int i = 0; i < n; i++) a[i] *= 2;\n}\n\nint main(void) {\n    int v[3] = {1, 2, 3};\n    twice(v, 3);\n    printf("%d %d %d\\n", v[0], v[1], v[2]);\n    return 0;\n}`, output: "2 4 6", explanation: "The caller's array is changed." },
    tools: ["array-string"], exerciseIds: ["ex-array-max"],
  },
  {
    id: "recursion", unitId: "unit-4", title: "Recursion",
    summary: "Functions that call themselves, with a base case and a progressing recursive case.",
    concepts: [
      { term: "Base case", definition: "The condition that stops recursion without another call." },
      { term: "Recursive case", definition: "Calls the function on a smaller instance of the problem." },
      { term: "Call stack", definition: "Each active call gets a stack frame; frames unwind as calls return." },
    ],
    example: { code: `#include <stdio.h>\n\nint fact(int n) {\n    if (n <= 1) return 1;      /* base case */\n    return n * fact(n - 1);    /* recursive case */\n}\n\nint main(void) {\n    printf("%d\\n", fact(5));\n    return 0;\n}`, output: "120", explanation: "5*4*3*2*1 as the stack unwinds." },
    tools: ["recursion"], exerciseIds: ["ex-factorial", "ex-fibonacci", "ex-power"],
  },
  // ---------------- UNIT 5 ----------------
  {
    id: "searching", unitId: "unit-5", title: "Linear and Binary Search",
    summary: "Scanning element by element versus halving a sorted range.",
    concepts: [
      { term: "Linear search", definition: "Checks each element in turn; O(n); works on unsorted data." },
      { term: "Binary search", definition: "Repeatedly halves a sorted range; O(log n)." },
      { term: "Precondition", definition: "Binary search requires the array to be sorted." },
    ],
    example: { code: `int bsearch_i(int a[], int n, int key) {\n    int lo = 0, hi = n - 1;\n    while (lo <= hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (a[mid] == key) return mid;\n        if (a[mid] < key) lo = mid + 1;\n        else hi = mid - 1;\n    }\n    return -1;\n}`, output: "Index of key, or -1", explanation: "lo + (hi-lo)/2 avoids overflow." },
    tools: ["search-sort"], exerciseIds: ["ex-linear-search", "ex-binary-search"],
  },
  {
    id: "elementary-sorts", unitId: "unit-5", title: "Bubble, Insertion and Selection Sort",
    summary: "Three O(n²) comparison sorts and how each makes progress.",
    concepts: [
      { term: "Bubble sort", definition: "Repeatedly swaps adjacent out-of-order pairs; the largest bubbles to the end each pass." },
      { term: "Insertion sort", definition: "Grows a sorted prefix by inserting each next element into place." },
      { term: "Selection sort", definition: "Selects the minimum of the unsorted part and swaps it to the front." },
    ],
    example: { code: `void bubble(int a[], int n) {\n    for (int i = 0; i < n - 1; i++)\n        for (int j = 0; j < n - 1 - i; j++)\n            if (a[j] > a[j + 1]) {\n                int t = a[j]; a[j] = a[j + 1]; a[j + 1] = t;\n            }\n}`, output: "{5,1,4} → {1,4,5}", explanation: "Each pass fixes one more element at the end." },
    tools: ["search-sort"], exerciseIds: ["ex-bubble-sort"],
  },
  {
    id: "divide-conquer-sorts", unitId: "unit-5", title: "Quick Sort and Merge Sort",
    summary: "Divide-and-conquer sorting with partitioning and merging.",
    concepts: [
      { term: "Partition", definition: "Quick sort places a pivot so smaller items are left and larger are right." },
      { term: "Merge", definition: "Merge sort combines two sorted halves into one sorted sequence." },
      { term: "Complexity", definition: "Merge sort is O(n log n) always; quick sort averages O(n log n), worst O(n²)." },
    ],
    example: { code: `void merge_sort(int a[], int tmp[], int lo, int hi) {\n    if (lo >= hi) return;\n    int mid = (lo + hi) / 2;\n    merge_sort(a, tmp, lo, mid);\n    merge_sort(a, tmp, mid + 1, hi);\n    /* merge a[lo..mid] and a[mid+1..hi] via tmp */\n}`, output: "Sorted range a[lo..hi]", explanation: "Recursion splits until single elements remain." },
    tools: ["search-sort", "recursion"], exerciseIds: [],
  },
  // ---------------- SUPPLEMENTARY ----------------
  {
    id: "competitive-practice", unitId: "supplementary", title: "Competitive Programming Practice",
    summary: "Supplementary package: problem-solving patterns beyond the official syllabus.",
    concepts: [
      { term: "Fast I/O", definition: "Read input efficiently and avoid unnecessary output calls." },
      { term: "Complexity budget", definition: "Estimate operations from constraints before choosing an algorithm." },
      { term: "Edge cases", definition: "Test minimum, maximum and boundary inputs deliberately." },
    ],
    example: { code: `#include <stdio.h>\n\nint main(void) {\n    int t;\n    scanf("%d", &t);\n    while (t--) {\n        long long a, b;\n        scanf("%lld %lld", &a, &b);\n        printf("%lld\\n", a + b);\n    }\n    return 0;\n}`, output: "One sum per test case", explanation: "long long avoids overflow for large inputs." },
    tools: ["algorithm"], exerciseIds: [],
  },
];

export const topics: Topic[] = raw.map((t, i) => ({ ...t, order: i + 1, source: "demo" }));
