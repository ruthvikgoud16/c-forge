-- Public sample is the only stdout a browser may see.
INSERT INTO exercises (
  id,
  slug,
  title,
  objective,
  statement,
  input_format,
  output_format,
  constraints_text,
  starter_code
) VALUES (
  '11111111-1111-4111-8111-111111111111',
  'hello-cforge',
  'Hello, CForge!',
  'Write a complete C program that prints the academy greeting exactly.',
  'The academy needs a first program that proves your toolchain path works. Print the greeting Hello, CForge! as a single line. Do not add extra spaces, punctuation, or lines.',
  'This problem takes no input.',
  'A single line: Hello, CForge! followed by a newline.',
  'Use standard C. Do not read stdin. Output must match exactly.',
  E'#include <stdio.h>\n\nint main(void) {\n    /* Print the required greeting. */\n    return 0;\n}\n'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO exercise_tests (exercise_id, ordinal, visibility, stdin, expected_stdout) VALUES
  ('11111111-1111-4111-8111-111111111111', 1, 'sample', '', 'Hello, CForge!\n'),
  ('11111111-1111-4111-8111-111111111111', 2, 'hidden', '', 'Hello, CForge!\n'),
  ('11111111-1111-4111-8111-111111111111', 3, 'hidden', 'ignored-hidden-stdin\n', 'Hello, CForge!\n'),
  ('11111111-1111-4111-8111-111111111111', 4, 'hidden', '', 'Hello, CForge!\n')
ON CONFLICT (exercise_id, ordinal) DO NOTHING;

INSERT INTO exercises (
  id, slug, title, objective, statement, input_format, output_format, constraints_text, starter_code
) VALUES (
  '22222222-2222-4222-8222-222222222222',
  'add-two-integers',
  'Add two integers',
  'Read two integers and print their sum.',
  'Write a C program that reads two integers and prints their sum as a single integer line.',
  'Two integers a and b.',
  'One line: a+b and a newline.',
  'Use standard C scanf/printf.',
  E'#include <stdio.h>\n\nint main(void) {\n    int a, b;\n    return 0;\n}\n'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO exercise_tests (exercise_id, ordinal, visibility, stdin, expected_stdout) VALUES
  ('22222222-2222-4222-8222-222222222222', 1, 'sample', '2 3\n', '5\n'),
  ('22222222-2222-4222-8222-222222222222', 2, 'hidden', '0 0\n', '0\n'),
  ('22222222-2222-4222-8222-222222222222', 3, 'hidden', '-2 9\n', '7\n'),
  ('22222222-2222-4222-8222-222222222222', 4, 'hidden', '51 1\n', '52\n')
ON CONFLICT (exercise_id, ordinal) DO NOTHING;

-- Milestone 2F.3 academy practice. Not official laboratory sheets.

INSERT INTO exercises (id, slug, title, objective, statement, input_format, output_format, constraints_text, starter_code) VALUES
  ('33333333-3333-4333-8333-333333333001', 'echo-integer', 'Echo one integer', 'Read one integer and print it unchanged.', 'CForge practice for Unit 1 variables and formatted I/O. Read a single integer and print that same integer. This is academy practice, not an official laboratory sheet.', 'One integer n.', 'One line: n and a newline.', 'Use scanf/printf. −10000 ≤ n ≤ 10000. Standard C only.', E'#include <stdio.h>\n\nint main(void) {\n    /* Read the input described in the statement, then print the required line. */\n    return 0;\n}\n'),
  ('33333333-3333-4333-8333-333333333002', 'integer-remainder', 'Integer remainder', 'Print a modulo b for two integers.', 'Read two integers a and b (b is never 0) and print the remainder of integer division a % b. CForge practice for Unit 1 arithmetic operators.', 'Two integers a and b, b ≠ 0.', 'One line: a % b and a newline.', '0 ≤ a ≤ 10000. 1 ≤ b ≤ 100. Do not use floating point.', E'#include <stdio.h>\n\nint main(void) {\n    /* Read the input described in the statement, then print the required line. */\n    return 0;\n}\n'),
  ('33333333-3333-4333-8333-333333333003', 'max-of-two', 'Larger of two integers', 'Use a decision to print the larger of two integers.', 'Read two integers and print the larger value. If they are equal, print that value once. CForge practice for Unit 2 if / if-else. Not an official lab.', 'Two integers a and b.', 'One line: the larger value and a newline.', '−10000 ≤ a, b ≤ 10000. Use a conditional, not a library max.', E'#include <stdio.h>\n\nint main(void) {\n    /* Read the input described in the statement, then print the required line. */\n    return 0;\n}\n'),
  ('33333333-3333-4333-8333-333333333004', 'letter-grade', 'Letter grade from marks', 'Map an integer mark to a letter with an else-if ladder.', 'Read one integer mark. Print A if mark ≥ 90, B if mark ≥ 75, C if mark ≥ 50, otherwise F. CForge practice for Unit 2 else-if. These bands are academy practice, not university regulations.', 'One integer mark.', 'One line: A, B, C, or F and a newline.', '0 ≤ mark ≤ 100.', E'#include <stdio.h>\n\nint main(void) {\n    /* Read the input described in the statement, then print the required line. */\n    return 0;\n}\n'),
  ('33333333-3333-4333-8333-333333333005', 'sum-one-to-n', 'Sum from 1 to n', 'Use a loop to add the integers 1 through n.', 'Read a non-negative integer n and print 1+2+…+n. If n is 0, print 0. CForge practice for Unit 2 for-loops.', 'One integer n.', 'One line: the sum and a newline.', '0 ≤ n ≤ 200.', E'#include <stdio.h>\n\nint main(void) {\n    /* Read the input described in the statement, then print the required line. */\n    return 0;\n}\n'),
  ('33333333-3333-4333-8333-333333333006', 'array-sum', 'Sum of a one-dimensional array', 'Read n integers into an array (or on the fly) and print their sum.', 'The first integer is n. The next n integers are the values. Print their sum. CForge practice for Unit 3 one-dimensional arrays. Not an official laboratory experiment.', 'n, then n integers.', 'One line: the sum and a newline.', '1 ≤ n ≤ 32. Each value is between −1000 and 1000.', E'#include <stdio.h>\n\nint main(void) {\n    /* Read the input described in the statement, then print the required line. */\n    return 0;\n}\n'),
  ('33333333-3333-4333-8333-333333333007', 'string-length-manual', 'String length without strlen', 'Count characters in one word without string-library functions.', 'Read one word (no spaces) and print how many characters it has. Do not call strlen. Do not use strrev. CForge practice for Unit 3 string work without built-in functions.', 'One word of letters or digits.', 'One line: the length and a newline.', '1 ≤ length ≤ 64. No spaces in the word.', E'#include <stdio.h>\n\nint main(void) {\n    /* Read the input described in the statement, then print the required line. */\n    return 0;\n}\n'),
  ('33333333-3333-4333-8333-333333333008', 'swap-two-addresses', 'Swap two integers through addresses', 'Exchange two caller variables by passing their addresses.', 'Read two integers x and y. Swap them. Standard C passes arguments by value; pass addresses to change the caller. CForge practice for Unit 4. Not an official lab.', 'Two integers x and y.', 'One line: y then a space then x, then a newline.', '−10000 ≤ x, y ≤ 10000.', E'#include <stdio.h>\n\nint main(void) {\n    int x, y;\n    /* Swap using addresses, then print y then x. */\n    return 0;\n}\n'),
  ('33333333-3333-4333-8333-333333333009', 'factorial-recursive', 'Factorial (small n)', 'Compute n! for a small non-negative n.', 'Read n and print n!. 0! is 1. CForge practice for Unit 4 recursion.', 'One integer n.', 'One line: n! and a newline.', '0 ≤ n ≤ 12.', E'#include <stdio.h>\n\nint main(void) {\n    /* Read the input described in the statement, then print the required line. */\n    return 0;\n}\n'),
  ('33333333-3333-4333-8333-333333333010', 'linear-search-index', 'Linear search, first index', 'Find the first index of a key in an unsorted list, or −1.', 'The first integer is n. Then n integers. Then key. Print the first 0-based index or -1. CForge practice for Unit 5 linear search. Not an official laboratory sheet.', 'n, then n integers, then key.', 'One line: the index or -1, and a newline.', '1 ≤ n ≤ 32.', E'#include <stdio.h>\n\nint main(void) {\n    /* Read the input described in the statement, then print the required line. */\n    return 0;\n}\n')
ON CONFLICT (id) DO NOTHING;

INSERT INTO exercise_tests (exercise_id, ordinal, visibility, stdin, expected_stdout) VALUES
  ('33333333-3333-4333-8333-333333333001', 1, 'sample', '7\n', '7\n'),
  ('33333333-3333-4333-8333-333333333001', 2, 'hidden', '0\n', '0\n'),
  ('33333333-3333-4333-8333-333333333001', 3, 'hidden', '-12\n', '-12\n'),
  ('33333333-3333-4333-8333-333333333001', 4, 'hidden', '10000\n', '10000\n'),
  ('33333333-3333-4333-8333-333333333002', 1, 'sample', '7 3\n', '1\n'),
  ('33333333-3333-4333-8333-333333333002', 2, 'hidden', '10 5\n', '0\n'),
  ('33333333-3333-4333-8333-333333333002', 3, 'hidden', '1 9\n', '1\n'),
  ('33333333-3333-4333-8333-333333333002', 4, 'hidden', '100 7\n', '2\n'),
  ('33333333-3333-4333-8333-333333333003', 1, 'sample', '3 8\n', '8\n'),
  ('33333333-3333-4333-8333-333333333003', 2, 'hidden', '9 9\n', '9\n'),
  ('33333333-3333-4333-8333-333333333003', 3, 'hidden', '-4 -1\n', '-1\n'),
  ('33333333-3333-4333-8333-333333333003', 4, 'hidden', '0 -5\n', '0\n'),
  ('33333333-3333-4333-8333-333333333004', 1, 'sample', '82\n', 'B\n'),
  ('33333333-3333-4333-8333-333333333004', 2, 'hidden', '90\n', 'A\n'),
  ('33333333-3333-4333-8333-333333333004', 3, 'hidden', '50\n', 'C\n'),
  ('33333333-3333-4333-8333-333333333004', 4, 'hidden', '49\n', 'F\n'),
  ('33333333-3333-4333-8333-333333333005', 1, 'sample', '5\n', '15\n'),
  ('33333333-3333-4333-8333-333333333005', 2, 'hidden', '0\n', '0\n'),
  ('33333333-3333-4333-8333-333333333005', 3, 'hidden', '1\n', '1\n'),
  ('33333333-3333-4333-8333-333333333005', 4, 'hidden', '100\n', '5050\n'),
  ('33333333-3333-4333-8333-333333333006', 1, 'sample', '3\n1 2 3\n', '6\n'),
  ('33333333-3333-4333-8333-333333333006', 2, 'hidden', '1\n9\n', '9\n'),
  ('33333333-3333-4333-8333-333333333006', 3, 'hidden', '4\n-1 0 1 5\n', '5\n'),
  ('33333333-3333-4333-8333-333333333006', 4, 'hidden', '2\n1000 -1000\n', '0\n'),
  ('33333333-3333-4333-8333-333333333007', 1, 'sample', 'cat\n', '3\n'),
  ('33333333-3333-4333-8333-333333333007', 2, 'hidden', 'A\n', '1\n'),
  ('33333333-3333-4333-8333-333333333007', 3, 'hidden', 'CForge\n', '6\n'),
  ('33333333-3333-4333-8333-333333333007', 4, 'hidden', 'abcdefghij\n', '10\n'),
  ('33333333-3333-4333-8333-333333333008', 1, 'sample', '3 8\n', '8 3\n'),
  ('33333333-3333-4333-8333-333333333008', 2, 'hidden', '0 0\n', '0 0\n'),
  ('33333333-3333-4333-8333-333333333008', 3, 'hidden', '-2 5\n', '5 -2\n'),
  ('33333333-3333-4333-8333-333333333008', 4, 'hidden', '51 1\n', '1 51\n'),
  ('33333333-3333-4333-8333-333333333009', 1, 'sample', '5\n', '120\n'),
  ('33333333-3333-4333-8333-333333333009', 2, 'hidden', '0\n', '1\n'),
  ('33333333-3333-4333-8333-333333333009', 3, 'hidden', '1\n', '1\n'),
  ('33333333-3333-4333-8333-333333333009', 4, 'hidden', '12\n', '479001600\n'),
  ('33333333-3333-4333-8333-333333333010', 1, 'sample', '4\n9 3 3 7\n3\n', '1\n'),
  ('33333333-3333-4333-8333-333333333010', 2, 'hidden', '3\n1 2 3\n4\n', '-1\n'),
  ('33333333-3333-4333-8333-333333333010', 3, 'hidden', '1\n8\n8\n', '0\n'),
  ('33333333-3333-4333-8333-333333333010', 4, 'hidden', '5\n4 4 4 4 5\n5\n', '4\n')
ON CONFLICT (exercise_id, ordinal) DO NOTHING;
