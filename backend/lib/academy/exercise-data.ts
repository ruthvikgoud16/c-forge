import type { ExerciseRow } from "./public-dto";

export const HELLO_CFORGE_ID = "11111111-1111-4111-8111-111111111111";
export const ADD_TWO_ID = "22222222-2222-4222-8222-222222222222";

export const helloCforge: ExerciseRow = {
  id: HELLO_CFORGE_ID,
  slug: "hello-cforge",
  title: "Hello, CForge!",
  objective: "Write a complete C program that prints the academy greeting exactly.",
  statement:
    "The academy needs a first program that proves your toolchain path works. Print the greeting Hello, CForge! as a single line. Do not add extra spaces, punctuation, or lines.",
  inputFormat: "This problem takes no input.",
  outputFormat: "A single line: Hello, CForge! followed by a newline.",
  constraints: "Use standard C. Do not read stdin. Output must match exactly.",
  starterCode: `#include <stdio.h>

int main(void) {
    /* Print the required greeting. */
    return 0;
}
`,
  language: "c",
  tests: [
    { ordinal: 1, visibility: "sample", stdin: "", expectedStdout: "Hello, CForge!\n" },
    { ordinal: 2, visibility: "hidden", stdin: "", expectedStdout: "Hello, CForge!\n" },
    {
      ordinal: 3,
      visibility: "hidden",
      stdin: "ignored-hidden-stdin\n",
      expectedStdout: "Hello, CForge!\n",
    },
    { ordinal: 4, visibility: "hidden", stdin: "", expectedStdout: "Hello, CForge!\n" },
  ],
};

export const addTwoIntegers: ExerciseRow = {
  id: ADD_TWO_ID,
  slug: "add-two-integers",
  title: "Add two integers",
  objective: "Read two integers and print their sum.",
  statement:
    "Write a C program that reads two integers (separated by space or newline) and prints their sum as a single integer line. This is original academy practice for Unit 1 input and arithmetic.",
  inputFormat: "Two integers a and b.",
  outputFormat: "One line: a+b and a newline.",
  constraints: "Use standard C scanf/printf. No compiler-specific headers.",
  starterCode: `#include <stdio.h>

int main(void) {
    int a, b;
    /* Read a and b, then print a + b. */
    return 0;
}
`,
  language: "c",
  tests: [
    { ordinal: 1, visibility: "sample", stdin: "2 3\n", expectedStdout: "5\n" },
    { ordinal: 2, visibility: "hidden", stdin: "0 0\n", expectedStdout: "0\n" },
    { ordinal: 3, visibility: "hidden", stdin: "-2 9\n", expectedStdout: "7\n" },
    { ordinal: 4, visibility: "hidden", stdin: "51 1\n", expectedStdout: "52\n" },
  ],
};
