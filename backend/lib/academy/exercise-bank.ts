import type { ExerciseRow } from "./public-dto";
import { ADD_TWO_ID, HELLO_CFORGE_ID, addTwoIntegers, helloCforge } from "./exercise-data";

function id(n: number) {
  return `33333333-3333-4333-8333-3333333330${String(n).padStart(2, "0")}`;
}

const starterIo = `#include <stdio.h>

int main(void) {
    /* Read the input described in the statement, then print the required line. */
    return 0;
}
`;

export const echoInteger: ExerciseRow = {
  id: id(1),
  slug: "echo-integer",
  title: "Echo one integer",
  objective: "Read one integer and print it unchanged.",
  statement:
    "CForge practice for Unit 1 variables and formatted I/O. Read a single integer and print that same integer. This is academy practice, not an official laboratory sheet.",
  inputFormat: "One integer n.",
  outputFormat: "One line: n and a newline.",
  constraints: "Use scanf/printf. −10000 ≤ n ≤ 10000. Standard C only.",
  starterCode: starterIo,
  language: "c",
  tests: [
    { ordinal: 1, visibility: "sample", stdin: "7\n", expectedStdout: "7\n" },
    { ordinal: 2, visibility: "hidden", stdin: "0\n", expectedStdout: "0\n" },
    { ordinal: 3, visibility: "hidden", stdin: "-12\n", expectedStdout: "-12\n" },
    { ordinal: 4, visibility: "hidden", stdin: "10000\n", expectedStdout: "10000\n" },
  ],
};

export const integerRemainder: ExerciseRow = {
  id: id(2),
  slug: "integer-remainder",
  title: "Integer remainder",
  objective: "Print a modulo b for two integers.",
  statement:
    "Read two integers a and b (b is never 0) and print the remainder of integer division a % b. CForge practice for Unit 1 arithmetic operators.",
  inputFormat: "Two integers a and b, b ≠ 0.",
  outputFormat: "One line: a % b and a newline.",
  constraints: "0 ≤ a ≤ 10000. 1 ≤ b ≤ 100. Do not use floating point.",
  starterCode: starterIo,
  language: "c",
  tests: [
    { ordinal: 1, visibility: "sample", stdin: "7 3\n", expectedStdout: "1\n" },
    { ordinal: 2, visibility: "hidden", stdin: "10 5\n", expectedStdout: "0\n" },
    { ordinal: 3, visibility: "hidden", stdin: "1 9\n", expectedStdout: "1\n" },
    { ordinal: 4, visibility: "hidden", stdin: "100 7\n", expectedStdout: "2\n" },
  ],
};

export const maxOfTwo: ExerciseRow = {
  id: id(3),
  slug: "max-of-two",
  title: "Larger of two integers",
  objective: "Use a decision to print the larger of two integers.",
  statement:
    "Read two integers and print the larger value. If they are equal, print that value once. CForge practice for Unit 2 if / if-else. Not an official lab.",
  inputFormat: "Two integers a and b.",
  outputFormat: "One line: the larger value and a newline.",
  constraints: "−10000 ≤ a, b ≤ 10000. Use a conditional, not a library max.",
  starterCode: starterIo,
  language: "c",
  tests: [
    { ordinal: 1, visibility: "sample", stdin: "3 8\n", expectedStdout: "8\n" },
    { ordinal: 2, visibility: "hidden", stdin: "9 9\n", expectedStdout: "9\n" },
    { ordinal: 3, visibility: "hidden", stdin: "-4 -1\n", expectedStdout: "-1\n" },
    { ordinal: 4, visibility: "hidden", stdin: "0 -5\n", expectedStdout: "0\n" },
  ],
};

export const letterGrade: ExerciseRow = {
  id: id(4),
  slug: "letter-grade",
  title: "Letter grade from marks",
  objective: "Map an integer mark to a letter with an else-if ladder.",
  statement:
    "Read one integer mark. Print A if mark ≥ 90, B if mark ≥ 75, C if mark ≥ 50, otherwise F. CForge practice for Unit 2 else-if. These bands are academy practice, not university regulations.",
  inputFormat: "One integer mark.",
  outputFormat: "One line: A, B, C, or F and a newline.",
  constraints: "0 ≤ mark ≤ 100.",
  starterCode: starterIo,
  language: "c",
  tests: [
    { ordinal: 1, visibility: "sample", stdin: "82\n", expectedStdout: "B\n" },
    { ordinal: 2, visibility: "hidden", stdin: "90\n", expectedStdout: "A\n" },
    { ordinal: 3, visibility: "hidden", stdin: "50\n", expectedStdout: "C\n" },
    { ordinal: 4, visibility: "hidden", stdin: "49\n", expectedStdout: "F\n" },
  ],
};

export const sumOneToN: ExerciseRow = {
  id: id(5),
  slug: "sum-one-to-n",
  title: "Sum from 1 to n",
  objective: "Use a loop to add the integers 1 through n.",
  statement:
    "Read a non-negative integer n and print 1+2+…+n. If n is 0, print 0. CForge practice for Unit 2 for-loops.",
  inputFormat: "One integer n.",
  outputFormat: "One line: the sum and a newline.",
  constraints: "0 ≤ n ≤ 200. Use a loop (do not hard-code a closed form if you prefer; either is accepted if the output matches).",
  starterCode: starterIo,
  language: "c",
  tests: [
    { ordinal: 1, visibility: "sample", stdin: "5\n", expectedStdout: "15\n" },
    { ordinal: 2, visibility: "hidden", stdin: "0\n", expectedStdout: "0\n" },
    { ordinal: 3, visibility: "hidden", stdin: "1\n", expectedStdout: "1\n" },
    { ordinal: 4, visibility: "hidden", stdin: "100\n", expectedStdout: "5050\n" },
  ],
};

export const arraySum: ExerciseRow = {
  id: id(6),
  slug: "array-sum",
  title: "Sum of a one-dimensional array",
  objective: "Read n integers into an array (or on the fly) and print their sum.",
  statement:
    "The first integer is n. The next n integers are the values. Print their sum. CForge practice for Unit 3 one-dimensional arrays. Not an official laboratory experiment.",
  inputFormat: "n, then n integers.",
  outputFormat: "One line: the sum and a newline.",
  constraints: "1 ≤ n ≤ 32. Each value is between −1000 and 1000.",
  starterCode: starterIo,
  language: "c",
  tests: [
    { ordinal: 1, visibility: "sample", stdin: "3\n1 2 3\n", expectedStdout: "6\n" },
    { ordinal: 2, visibility: "hidden", stdin: "1\n9\n", expectedStdout: "9\n" },
    { ordinal: 3, visibility: "hidden", stdin: "4\n-1 0 1 5\n", expectedStdout: "5\n" },
    { ordinal: 4, visibility: "hidden", stdin: "2\n1000 -1000\n", expectedStdout: "0\n" },
  ],
};

export const stringLengthManual: ExerciseRow = {
  id: id(7),
  slug: "string-length-manual",
  title: "String length without strlen",
  objective: "Count characters in one word without string-library functions.",
  statement:
    "Read one word (no spaces) and print how many characters it has. Do not call strlen, strcpy, or any <string.h> function. Do not use strrev (it is not ISO C and is not part of this problem). CForge practice for Unit 3 string work without built-in functions.",
  inputFormat: "One word of letters or digits.",
  outputFormat: "One line: the length and a newline.",
  constraints: "1 ≤ length ≤ 64. No spaces in the word.",
  starterCode: starterIo,
  language: "c",
  tests: [
    { ordinal: 1, visibility: "sample", stdin: "cat\n", expectedStdout: "3\n" },
    { ordinal: 2, visibility: "hidden", stdin: "A\n", expectedStdout: "1\n" },
    { ordinal: 3, visibility: "hidden", stdin: "CForge\n", expectedStdout: "6\n" },
    { ordinal: 4, visibility: "hidden", stdin: "abcdefghij\n", expectedStdout: "10\n" },
  ],
};

export const swapTwoAddresses: ExerciseRow = {
  id: id(8),
  slug: "swap-two-addresses",
  title: "Swap two integers through addresses",
  objective: "Exchange two caller variables by passing their addresses.",
  statement:
    "Read two integers x and y. Swap them so the first printed number is the original y and the second is the original x. Standard C passes arguments by value; to change the caller's objects you pass addresses (pointers). The college phrase 'call by reference' is taught that way. CForge practice for Unit 4. Not an official lab.",
  inputFormat: "Two integers x and y.",
  outputFormat: "One line: y then a space then x, then a newline.",
  constraints: "−10000 ≤ x, y ≤ 10000.",
  starterCode: `#include <stdio.h>

int main(void) {
    int x, y;
    /* Swap using addresses, then print y then x. */
    return 0;
}
`,
  language: "c",
  tests: [
    { ordinal: 1, visibility: "sample", stdin: "3 8\n", expectedStdout: "8 3\n" },
    { ordinal: 2, visibility: "hidden", stdin: "0 0\n", expectedStdout: "0 0\n" },
    { ordinal: 3, visibility: "hidden", stdin: "-2 5\n", expectedStdout: "5 -2\n" },
    { ordinal: 4, visibility: "hidden", stdin: "51 1\n", expectedStdout: "1 51\n" },
  ],
};

export const factorialRecursive: ExerciseRow = {
  id: id(9),
  slug: "factorial-recursive",
  title: "Factorial (small n)",
  objective: "Compute n! for a small non-negative n.",
  statement:
    "Read n and print n! (n factorial). 0! is 1. A recursive function is a good fit; an iterative loop is also accepted if the output matches. CForge practice for Unit 4 recursion. n stays small so the result fits in a 32-bit int.",
  inputFormat: "One integer n.",
  outputFormat: "One line: n! and a newline.",
  constraints: "0 ≤ n ≤ 12.",
  starterCode: starterIo,
  language: "c",
  tests: [
    { ordinal: 1, visibility: "sample", stdin: "5\n", expectedStdout: "120\n" },
    { ordinal: 2, visibility: "hidden", stdin: "0\n", expectedStdout: "1\n" },
    { ordinal: 3, visibility: "hidden", stdin: "1\n", expectedStdout: "1\n" },
    { ordinal: 4, visibility: "hidden", stdin: "12\n", expectedStdout: "479001600\n" },
  ],
};

export const linearSearchIndex: ExerciseRow = {
  id: id(10),
  slug: "linear-search-index",
  title: "Linear search, first index",
  objective: "Find the first index of a key in an unsorted list, or −1.",
  statement:
    "The first integer is n. Then n integers (the list, not necessarily sorted). Then one integer key. Print the first 0-based index where the list equals key. If key is absent, print -1. CForge practice for Unit 5 linear search. This is not a college laboratory sheet and not a contest problem from an external platform.",
  inputFormat: "n, then n integers, then key.",
  outputFormat: "One line: the index or -1, and a newline.",
  constraints: "1 ≤ n ≤ 32. Values and key are between −1000 and 1000.",
  starterCode: starterIo,
  language: "c",
  tests: [
    { ordinal: 1, visibility: "sample", stdin: "4\n9 3 3 7\n3\n", expectedStdout: "1\n" },
    { ordinal: 2, visibility: "hidden", stdin: "3\n1 2 3\n4\n", expectedStdout: "-1\n" },
    { ordinal: 3, visibility: "hidden", stdin: "1\n8\n8\n", expectedStdout: "0\n" },
    { ordinal: 4, visibility: "hidden", stdin: "5\n4 4 4 4 5\n5\n", expectedStdout: "4\n" },
  ],
};

export const minOfThreeTernary: ExerciseRow = {
  id: id(11),
  slug: "min-of-three-ternary",
  title: "Smallest of three integers",
  objective: "Use a conditional expression to print the minimum of three integers.",
  statement:
    "Read three integers a, b, and c. Print the smallest value. If two or three are tied for smallest, print that value once. CForge practice for Unit 1 operators and the conditional (ternary) operator. Not an official laboratory sheet.",
  inputFormat: "Three integers a, b, and c.",
  outputFormat: "One line: the smallest value and a newline.",
  constraints: "−10000 ≤ a, b, c ≤ 10000. Standard C only.",
  starterCode: starterIo,
  language: "c",
  tests: [
    { ordinal: 1, visibility: "sample", stdin: "4 1 9\n", expectedStdout: "1\n" },
    { ordinal: 2, visibility: "hidden", stdin: "0 0 0\n", expectedStdout: "0\n" },
    { ordinal: 3, visibility: "hidden", stdin: "-3 -1 -2\n", expectedStdout: "-3\n" },
    { ordinal: 4, visibility: "hidden", stdin: "5 5 4\n", expectedStdout: "4\n" },
  ],
};

export const evaluateWithPrecedence: ExerciseRow = {
  id: id(12),
  slug: "evaluate-with-precedence",
  title: "Evaluate a + b * c",
  objective: "Print a + b * c using C operator precedence (multiplication before addition).",
  statement:
    "Read three integers a, b, and c. Print the value of the C expression a + b * c. Do not add parentheses that would change the meaning to (a + b) * c. CForge practice for Unit 2 precedence. Not an official lab.",
  inputFormat: "Three integers a, b, and c.",
  outputFormat: "One line: a + b * c and a newline.",
  constraints: "−100 ≤ a, b, c ≤ 100.",
  starterCode: starterIo,
  language: "c",
  tests: [
    { ordinal: 1, visibility: "sample", stdin: "2 3 4\n", expectedStdout: "14\n" },
    { ordinal: 2, visibility: "hidden", stdin: "0 5 2\n", expectedStdout: "10\n" },
    { ordinal: 3, visibility: "hidden", stdin: "1 1 1\n", expectedStdout: "2\n" },
    { ordinal: 4, visibility: "hidden", stdin: "-2 3 5\n", expectedStdout: "13\n" },
  ],
};

export const skipMultiplesContinue: ExerciseRow = {
  id: id(13),
  slug: "skip-multiples-continue",
  title: "Skip multiples of k",
  objective: "Print 1 through n except multiples of k.",
  statement:
    "Read two integers n and k. Print the integers from 1 through n, in order, omitting every value that is a multiple of k. Separate printed numbers with a single space. End with a newline. If every integer is omitted, print only a newline. continue is a natural fit; any correct output is accepted. CForge practice for Unit 2 unconditional statements. Not an official lab.",
  inputFormat: "Two integers n and k.",
  outputFormat: "Zero or more integers on one line, space-separated, then a newline.",
  constraints: "1 ≤ n ≤ 40. 1 ≤ k ≤ 40.",
  starterCode: starterIo,
  language: "c",
  tests: [
    { ordinal: 1, visibility: "sample", stdin: "6 2\n", expectedStdout: "1 3 5\n" },
    { ordinal: 2, visibility: "hidden", stdin: "7 3\n", expectedStdout: "1 2 4 5 7\n" },
    { ordinal: 3, visibility: "hidden", stdin: "5 1\n", expectedStdout: "\n" },
    { ordinal: 4, visibility: "hidden", stdin: "1 2\n", expectedStdout: "1\n" },
  ],
};

export const countDigitsWhile: ExerciseRow = {
  id: id(14),
  slug: "count-digits-while",
  title: "Count digits with a while loop",
  objective: "Count how many decimal digits a non-negative integer has.",
  statement:
    "Read one non-negative integer n. Print how many decimal digits it has. 0 has one digit. A while loop that repeatedly divides by 10 is a good fit. CForge practice for Unit 2 while / do-while. Not an official laboratory sheet.",
  inputFormat: "One integer n.",
  outputFormat: "One line: the digit count and a newline.",
  constraints: "0 ≤ n ≤ 1000000000 (one billion).",
  starterCode: starterIo,
  language: "c",
  tests: [
    { ordinal: 1, visibility: "sample", stdin: "123\n", expectedStdout: "3\n" },
    { ordinal: 2, visibility: "hidden", stdin: "0\n", expectedStdout: "1\n" },
    { ordinal: 3, visibility: "hidden", stdin: "7\n", expectedStdout: "1\n" },
    { ordinal: 4, visibility: "hidden", stdin: "1000000000\n", expectedStdout: "10\n" },
  ],
};

export const matrixTwoByTwoSum: ExerciseRow = {
  id: id(15),
  slug: "matrix-2x2-sum",
  title: "Sum of a 2-by-2 matrix",
  objective: "Read four integers as a 2-by-2 matrix and print their sum.",
  statement:
    "Read four integers in row-major order: a11 a12 a21 a22. Treat them as a 2-by-2 matrix and print the sum of all four cells. CForge practice for Unit 3 multi-dimensional arrays. Not an official laboratory experiment.",
  inputFormat: "Four integers on one line, or split across lines.",
  outputFormat: "One line: the sum and a newline.",
  constraints: "Each cell is between −1000 and 1000.",
  starterCode: starterIo,
  language: "c",
  tests: [
    { ordinal: 1, visibility: "sample", stdin: "1 2 3 4\n", expectedStdout: "10\n" },
    { ordinal: 2, visibility: "hidden", stdin: "0 0 0 0\n", expectedStdout: "0\n" },
    { ordinal: 3, visibility: "hidden", stdin: "-1 1 -1 1\n", expectedStdout: "0\n" },
    { ordinal: 4, visibility: "hidden", stdin: "10 20 30 40\n", expectedStdout: "100\n" },
  ],
};

export const stringEqualStrcmp: ExerciseRow = {
  id: id(16),
  slug: "string-equal-strcmp",
  title: "Compare two words",
  objective: "Decide whether two words are equal using a standard string function.",
  statement:
    "Read two words (no spaces). Print equal if they contain the same characters in the same order, otherwise print differ. Comparison is case-sensitive. You may call strcmp from string.h. Do not use strrev; it is not ISO C. CForge practice for Unit 3 string library functions. Not an official lab.",
  inputFormat: "Two words, separated by space or newline.",
  outputFormat: "One line: equal or differ, then a newline.",
  constraints: "Each word has length 1 to 32. Letters or digits only.",
  starterCode: starterIo,
  language: "c",
  tests: [
    { ordinal: 1, visibility: "sample", stdin: "cat cat\n", expectedStdout: "equal\n" },
    { ordinal: 2, visibility: "hidden", stdin: "a b\n", expectedStdout: "differ\n" },
    { ordinal: 3, visibility: "hidden", stdin: "Same same\n", expectedStdout: "differ\n" },
    { ordinal: 4, visibility: "hidden", stdin: "abc ABC\n", expectedStdout: "differ\n" },
  ],
};

export const squareReturn: ExerciseRow = {
  id: id(17),
  slug: "square-return",
  title: "Square with a function",
  objective: "Return n times n from a function and print the result.",
  statement:
    "Read one integer n. Print n * n. Write a function that takes n and returns the square; main should print the returned value. The judge checks output only. CForge practice for Unit 4 functions and return. Not an official lab.",
  inputFormat: "One integer n.",
  outputFormat: "One line: n * n and a newline.",
  constraints: "−100 ≤ n ≤ 100. The square fits in a 32-bit int.",
  starterCode: starterIo,
  language: "c",
  tests: [
    { ordinal: 1, visibility: "sample", stdin: "6\n", expectedStdout: "36\n" },
    { ordinal: 2, visibility: "hidden", stdin: "0\n", expectedStdout: "0\n" },
    { ordinal: 3, visibility: "hidden", stdin: "-4\n", expectedStdout: "16\n" },
    { ordinal: 4, visibility: "hidden", stdin: "12\n", expectedStdout: "144\n" },
  ],
};

export const arrayMaxArgument: ExerciseRow = {
  id: id(18),
  slug: "array-max-argument",
  title: "Maximum of an array argument",
  objective: "Pass an array to a function and print the largest value.",
  statement:
    "The first integer is n. The next n integers are the values. Print the largest value. A function that receives the array (and n) and returns the maximum is the intended shape; the judge checks output only. CForge practice for Unit 4 passing arrays to functions. Not an official laboratory sheet.",
  inputFormat: "n, then n integers.",
  outputFormat: "One line: the maximum and a newline.",
  constraints: "1 ≤ n ≤ 32. Each value is between −1000 and 1000.",
  starterCode: starterIo,
  language: "c",
  tests: [
    { ordinal: 1, visibility: "sample", stdin: "4\n1 8 3 2\n", expectedStdout: "8\n" },
    { ordinal: 2, visibility: "hidden", stdin: "1\n-5\n", expectedStdout: "-5\n" },
    { ordinal: 3, visibility: "hidden", stdin: "3\n-1 -8 -2\n", expectedStdout: "-1\n" },
    { ordinal: 4, visibility: "hidden", stdin: "5\n0 0 0 0 1\n", expectedStdout: "1\n" },
  ],
};

export const binarySearchIndex: ExerciseRow = {
  id: id(19),
  slug: "binary-search-index",
  title: "Binary search, first index",
  objective: "Find the first index of a key in a sorted list, or −1.",
  statement:
    "The first integer is n. Then n integers in non-decreasing order. Then one integer key. Print the first 0-based index where the list equals key. If key is absent, print -1. Binary search is the intended method; any correct first-index output is accepted. CForge practice for Unit 5 binary search. Not an official laboratory sheet and not a contest problem from an external platform.",
  inputFormat: "n, then n sorted integers, then key.",
  outputFormat: "One line: the first index or -1, and a newline.",
  constraints: "1 ≤ n ≤ 32. Values and key are between −1000 and 1000. The list is sorted non-decreasing.",
  starterCode: starterIo,
  language: "c",
  tests: [
    { ordinal: 1, visibility: "sample", stdin: "5\n1 3 5 7 9\n7\n", expectedStdout: "3\n" },
    { ordinal: 2, visibility: "hidden", stdin: "4\n1 2 3 4\n0\n", expectedStdout: "-1\n" },
    { ordinal: 3, visibility: "hidden", stdin: "1\n9\n9\n", expectedStdout: "0\n" },
    { ordinal: 4, visibility: "hidden", stdin: "6\n1 1 1 1 1 2\n2\n", expectedStdout: "5\n" },
  ],
};

export const bubbleSortAsc: ExerciseRow = {
  id: id(20),
  slug: "bubble-sort-asc",
  title: "Bubble sort ascending",
  objective: "Sort n integers into non-decreasing order and print them.",
  statement:
    "The first integer is n. The next n integers are the values. Print the values in non-decreasing order, separated by single spaces, then a newline. Adjacent-swap (bubble) sort is the intended method; any correct sorted line is accepted. CForge practice for Unit 5 bubble sort. Not an official laboratory sheet.",
  inputFormat: "n, then n integers.",
  outputFormat: "n integers on one line, space-separated, then a newline.",
  constraints: "1 ≤ n ≤ 32. Each value is between −1000 and 1000.",
  starterCode: starterIo,
  language: "c",
  tests: [
    { ordinal: 1, visibility: "sample", stdin: "5\n3 1 4 1 5\n", expectedStdout: "1 1 3 4 5\n" },
    { ordinal: 2, visibility: "hidden", stdin: "1\n9\n", expectedStdout: "9\n" },
    { ordinal: 3, visibility: "hidden", stdin: "4\n0 0 0 0\n", expectedStdout: "0 0 0 0\n" },
    { ordinal: 4, visibility: "hidden", stdin: "3\n-2 8 -2\n", expectedStdout: "-2 -2 8\n" },
  ],
};

export const NEW_JUDGE_EXERCISES: ExerciseRow[] = [
  echoInteger,
  integerRemainder,
  maxOfTwo,
  letterGrade,
  sumOneToN,
  arraySum,
  stringLengthManual,
  swapTwoAddresses,
  factorialRecursive,
  linearSearchIndex,
];

/** Second 2F.3 batch. Do not map labs or u5-t8. */
export const EXPAND_JUDGE_EXERCISES: ExerciseRow[] = [
  minOfThreeTernary,
  evaluateWithPrecedence,
  skipMultiplesContinue,
  countDigitsWhile,
  matrixTwoByTwoSum,
  stringEqualStrcmp,
  squareReturn,
  arrayMaxArgument,
  binarySearchIndex,
  bubbleSortAsc,
];

/** Official teaching topic → one judge exercise. Labs and u5-t8 are never mapped. */
export const EXERCISE_TOPIC_IDS: Record<string, string> = {
  [HELLO_CFORGE_ID]: "u1-t5",
  [ADD_TWO_ID]: "u1-t4",
  [echoInteger.id]: "u1-t3",
  [integerRemainder.id]: "u1-t6",
  [maxOfTwo.id]: "u2-t2",
  [letterGrade.id]: "u2-t3",
  [sumOneToN.id]: "u2-t6",
  [arraySum.id]: "u3-t1",
  [stringLengthManual.id]: "u3-t5",
  [swapTwoAddresses.id]: "u4-t3",
  [factorialRecursive.id]: "u4-t5",
  [linearSearchIndex.id]: "u5-t1",
  [minOfThreeTernary.id]: "u1-t7",
  [evaluateWithPrecedence.id]: "u2-t1",
  [skipMultiplesContinue.id]: "u2-t4",
  [countDigitsWhile.id]: "u2-t5",
  [matrixTwoByTwoSum.id]: "u3-t2",
  [stringEqualStrcmp.id]: "u3-t4",
  [squareReturn.id]: "u4-t2",
  [arrayMaxArgument.id]: "u4-t4",
  [binarySearchIndex.id]: "u5-t2",
  [bubbleSortAsc.id]: "u5-t3",
};

export function allJudgeExercises(): ExerciseRow[] {
  return [helloCforge, addTwoIntegers, ...NEW_JUDGE_EXERCISES, ...EXPAND_JUDGE_EXERCISES];
}

export function findJudgeExercise(id: string) {
  return allJudgeExercises().find((row) => row.id === id || row.slug === id);
}

export function exerciseIdForTopic(topicId: string) {
  const hit = Object.entries(EXERCISE_TOPIC_IDS).find(([, topic]) => topic === topicId);
  return hit?.[0];
}

export function topicIdForExercise(exerciseId: string) {
  return EXERCISE_TOPIC_IDS[exerciseId];
}
