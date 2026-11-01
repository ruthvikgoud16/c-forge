import type { TopicDraft } from "../compile";

export function unit3Drafts(): TopicDraft[] {
  return [
    {
      topicId: "u3-t1",
      unitId: "unit-3",
      lessonId: "u3-t1-one-dimensional-arrays",
      title: "Arrays: Introduction, One-Dimensional",
      sourceLabel: "Arrays: Introduction, One-Dimensional.",
      objectives: [
        "Declare a one-dimensional array with a fixed length.",
        "Explain that valid indices run from 0 through length-1.",
        "Read and write elements with a counted for loop.",
        "State that going past the last index is undefined behaviour, not a guaranteed error message.",
      ],
      beginner:
        "An array is a row of same-type boxes under one name. int a[5] is five ints. The first box is a[0], the last is a[4]. You walk the row with a loop. There is no extra box a[5]; using it is a bug even if the program sometimes appears to run.",
      formal:
        "A one-dimensional array is a contiguous sequence of objects of one type. The declaration T name[N] creates N elements indexed 0 .. N-1. The array name, in most expressions, converts to a pointer to the first element. Bounds are not checked at run time by the language.",
      terms: [
        { term: "array", meaning: "A named sequence of same-type elements stored one after another." },
        { term: "index", meaning: "The integer position of an element, starting at 0 in C." },
        { term: "element", meaning: "One value in the array, such as a[2]." },
        { term: "length", meaning: "The number of elements in the declared array." },
        { term: "off-by-one", meaning: "A loop that stops too early or runs one step past the last valid index." },
      ],
      explanation:
        "Until now a program mostly named one number at a time. A list of marks, readings, or digits needs many values of the same type. An array gives them one name and a position. int marks[40]; reserves forty ints. The first is marks[0] and the last is marks[39]. That zero start is not decoration; a loop written for (i = 1; i <= 40; i++) already walks off the end when i is 40. The safe counted pattern is for (i = 0; i < n; i++). You may initialise at the declaration: int a[5] = {1, 2, 3, 4, 5}; or let the compiler count: int a[] = {1, 2, 3}; which has length 3. Unspecified elements in a partial list are zero. Arrays do not remember their length as a built-in property you can ask later; you keep n yourself. C does not stop a bad index. a[5] on a five-element array is undefined behaviour. It might read leftover memory, crash, or seem to work until a later change. Treat the range 0 .. n-1 as a hard contract. Input uses the same loops: for each i, scanf(\"%d\", &a[i]); — the & is still required for each scalar element. Output uses printf(\"%d\", a[i]); without &.",
      syntax:
        "int a[5];\nint b[] = {2, 4, 6};\na[0] = 10;\nfor (i = 0; i < 5; i++) { /* use a[i] */ }",
      analogy:
        "A one-dimensional array is a row of numbered lockers. The building numbers them 0 to n-1. Locker n does not exist even if you can write the number on a scrap of paper.",
      introduction:
        "Unit 3 begins with a single row of values. Later topics stack rows, then treat text as a row of characters.",
      prerequisiteCheck:
        "You should be able to write a for loop and use scanf/printf with int.",
      examples: [
        {
          title: "Store and print five integers",
          problem: "Put 10, 20, 30, 40, 50 in an array and print them in order.",
          steps: [
            "Declare int a[5] and initialise the list.",
            "Loop i from 0 to 4.",
            "Print a[i] on one line.",
          ],
          code: `#include <stdio.h>
int main(void) {
    int a[5] = {10, 20, 30, 40, 50};
    int i;
    for (i = 0; i < 5; i++) {
        printf("%d ", a[i]);
    }
    printf("\\n");
    return 0;
}`,
          output: "10 20 30 40 50",
        },
        {
          title: "Sum of a one-dimensional array",
          problem: "Add all elements of {3, 1, 4} into sum.",
          steps: [
            "Set sum = 0.",
            "Add a[i] for i = 0, 1, 2.",
            "Print 8.",
          ],
          code: `#include <stdio.h>
int main(void) {
    int a[3] = {3, 1, 4};
    int i, sum = 0;
    for (i = 0; i < 3; i++) {
        sum = sum + a[i];
    }
    printf("%d\\n", sum);
    return 0;
}`,
          output: "8",
        },
      ],
      trace: {
        prompt: "int a[4]={2,4,6,8}; printf(\"%d\", a[2]); What prints?",
        answer: "6",
      },
      predict: {
        prompt: "int a[3]={5,7,9}; What is the last valid index?",
        answer: "2",
      },
      mistakes: [
        { wrong: "The first element is a[1].", why: "C indexes from 0. a[1] is the second element." },
        { wrong: "int a[5]; has a valid a[5].", why: "Five elements are a[0] through a[4]. a[5] is out of range." },
        { wrong: "The compiler always stops an out-of-range index.", why: "C does not bound-check arrays. The result is undefined behaviour." },
      ],
      checks: [
        { q: "What is the first index of an array in C?", a: "0" },
        { q: "Last index of int x[10]?", a: "9" },
        { q: "Does an array object store its length for you to read later as a field?", a: "no" },
      ],
      guided: {
        task: "Read 6 integers into an array and print them in reverse order.",
        hint: "Fill with i from 0 to 5. Print with i from 5 down to 0.",
      },
      independent: {
        task: "Read n (n <= 20) then n integers. Print the largest value and the index where it first appears.",
      },
      flashcards: [
        { front: "First index in C?", back: "0" },
        { front: "int a[5] last index?", back: "4" },
        { front: "What is an element?", back: "One stored value, accessed as a[i]." },
        { front: "Safe loop test for length n?", back: "i < n, starting i at 0." },
        { front: "Are bounds checked?", back: "No. Out-of-range access is undefined behaviour." },
        { front: "scanf into a[i] needs?", back: "&a[i] for a scalar element." },
        { front: "int a[] = {1,2,3}; length?", back: "3" },
      ],
      concepts: [
        {
          prompt: "Why is for (i = 0; i < n; i++) the usual pattern?",
          explanation: "It visits every valid index once and stops before n, which is not a valid index.",
        },
        {
          prompt: "Is a and a[0] the same thing?",
          explanation: "No. a[0] is the first element. In most expressions a becomes the address of that first element.",
        },
      ],
      quickNotes: [
        "Same type, one name, many slots.",
        "Indices run 0 through n-1.",
        "Keep the length in your own variable.",
        "C does not check bounds.",
        "Initialisers can set the first values; the rest may be zero.",
        "Walk arrays with counted for loops.",
      ],
      distinctions: [
        "The length n is not a valid index. The last element is n-1.",
        "a[i] is an element. a is the array (often seen as a pointer to a[0]).",
      ],
      examShort: [
        "Define a one-dimensional array.",
        "Write a declaration for ten ints.",
        "What is wrong with using a[n] on int a[n]?",
      ],
      examLong:
        "A one-dimensional array is a contiguous sequence of elements of one type under a single name. The declaration int a[N]; creates N ints with valid indices 0 through N-1. Elements are read and written as a[i]. A counted loop for (i = 0; i < N; i++) visits each valid index. The language does not store a usable length field on the array object and does not check bounds; an index of N or more, or a negative index, is undefined behaviour. Initialisation may list values in braces. Programs keep the working length in a separate variable and pass that length along when the array is used later.",
      visualizerIds: ["array-string", "syntax"],
      relatedTopicIds: ["u2-t6", "u3-t2", "u3-t3"],
      assessment: [
        { family: "concept", method: "concept", prompt: "Last valid index of int m[8]?", answer: "7", marks: 1, explanation: "0..7." },
        { family: "trace", method: "trace", prompt: "int a[3]={1,2,3}; int s=a[0]+a[2]; s is?", answer: "4", marks: 2, explanation: "1+3." },
        { family: "debug", method: "identify_error", prompt: "for(i=0;i<=n;i++) use a[i] on int a[n]. What is wrong?", answer: "i==n is out of range", marks: 2, explanation: "Use i<n." },
        { family: "syntax", method: "mcq", prompt: "Write a declaration of five doubles named x.", answer: "double x[5];", marks: 1, explanation: "Type name[length]." },
      ],
    },
    {
      topicId: "u3-t2",
      unitId: "unit-3",
      lessonId: "u3-t2-multi-dimensional-arrays",
      title: "Multi-Dimensional Array with suitable examples",
      sourceLabel: "Multi-Dimensional Array with suitable examples.",
      objectives: [
        "Declare a two-dimensional array as rows and columns.",
        "Access an element with two indices, a[row][col].",
        "Walk a matrix with a nested for loop.",
        "State that C stores a 2D array in row-major order.",
      ],
      beginner:
        "A two-dimensional array is a table. int m[3][4] is three rows and four columns. You pick a cell with two numbers: row first, then column, both starting at 0. Nested loops walk the table: the outer loop moves the row, the inner loop moves the column.",
      formal:
        "A multi-dimensional array is an array of arrays. int a[R][C] is R arrays of C ints. The element at row i, column j is a[i][j]. Storage is row-major: row 0's C elements come first, then row 1, and so on.",
      terms: [
        { term: "two-dimensional array", meaning: "An array whose elements are themselves arrays; used as a table." },
        { term: "row", meaning: "The first index in the usual matrix picture." },
        { term: "column", meaning: "The second index in the usual matrix picture." },
        { term: "row-major", meaning: "Rows are stored one after another in memory." },
        { term: "nested loop", meaning: "An inner for that walks columns inside an outer for that walks rows." },
      ],
      explanation:
        "A one-dimensional array is a single row. Many syllabus examples need a table: marks for students versus subjects, or a small matrix to add. C spells that as an array of arrays. int a[2][3] is two rows, each with three ints. The cell in row 1, column 2 is a[1][2], not a[1,2]. Comma does not make a pair of indices. Valid rows are 0 .. R-1 and valid columns are 0 .. C-1. Nested for loops are the natural walk: for each row i, for each column j, use a[i][j]. You can initialise with nested braces: int a[2][3] = {{1, 2, 3}, {4, 5, 6}}; The inner lists are rows. Memory is row-major: 1,2,3 then 4,5,6 sit in that order. Higher dimensions exist (a[2][3][4]) but the course examples stay at two dimensions. When you later pass a 2D array to a function, the callee needs the column count in the parameter type so it can compute row starts. For now, stay inside one function and keep both sizes in variables R and C. Off-by-one errors double: a[2][3] has no a[2][0] and no a[0][3].",
      syntax:
        "int a[2][3];\nint b[2][3] = {{1, 2, 3}, {4, 5, 6}};\na[0][1] = 9;\nfor (i = 0; i < 2; i++)\n    for (j = 0; j < 3; j++) { /* a[i][j] */ }",
      analogy:
        "A 2D array is a seating chart. You name the row, then the seat. The school stores the chart by whole rows on the page, which is row-major order.",
      introduction:
        "After one row of values, the syllabus adds a table: a multi-dimensional array, almost always shown as two dimensions.",
      prerequisiteCheck:
        "You should already index a 1D array from 0 and write a for loop.",
      examples: [
        {
          title: "Print a 2x3 table",
          problem: "Initialise {{1,2,3},{4,5,6}} and print it as two lines.",
          steps: [
            "Declare int a[2][3] with nested initialisers.",
            "Outer loop i over 2 rows.",
            "Inner loop j over 3 columns, then a newline after each row.",
          ],
          code: `#include <stdio.h>
int main(void) {
    int a[2][3] = {{1, 2, 3}, {4, 5, 6}};
    int i, j;
    for (i = 0; i < 2; i++) {
        for (j = 0; j < 3; j++) {
            printf("%d ", a[i][j]);
        }
        printf("\\n");
    }
    return 0;
}`,
          output: "1 2 3\n4 5 6",
        },
        {
          title: "Sum of all cells",
          problem: "Add every entry of a 2x2 matrix {{1,1},{2,3}}.",
          steps: [
            "Set sum = 0.",
            "Add a[i][j] in a nested loop.",
            "Total is 7.",
          ],
          code: `#include <stdio.h>
int main(void) {
    int a[2][2] = {{1, 1}, {2, 3}};
    int i, j, sum = 0;
    for (i = 0; i < 2; i++) {
        for (j = 0; j < 2; j++) {
            sum = sum + a[i][j];
        }
    }
    printf("%d\\n", sum);
    return 0;
}`,
          output: "7",
        },
      ],
      trace: {
        prompt: "int a[2][2]={{9,8},{7,6}}; What is a[1][0]?",
        answer: "7",
      },
      predict: {
        prompt: "int a[3][4]; What is the last valid pair of indices?",
        answer: "a[2][3]",
      },
      mistakes: [
        { wrong: "a[1,2] selects row 1 column 2.", why: "C uses a[1][2]. The comma operator does not form a 2D index." },
        { wrong: "int a[2][3] has six rows.", why: "It has two rows and three columns, six cells total." },
        { wrong: "The first index is the column.", why: "In the usual matrix picture the first index is the row." },
      ],
      checks: [
        { q: "How do you write the element at row i column j?", a: "a[i][j]" },
        { q: "How many ints are in int m[4][5]?", a: "20" },
        { q: "What does row-major mean?", a: "each row's elements sit together, rows one after another" },
      ],
      guided: {
        task: "Read a 3x3 matrix and print its main diagonal a[0][0], a[1][1], a[2][2].",
        hint: "You can use one loop i from 0 to 2 and print a[i][i].",
      },
      independent: {
        task: "Read two 2x2 matrices and print their element-wise sum as a 2x2 table.",
      },
      flashcards: [
        { front: "2D element syntax?", back: "a[row][col]" },
        { front: "int a[2][3] sizes?", back: "2 rows, 3 columns, 6 ints." },
        { front: "Last cell of int a[2][3]?", back: "a[1][2]" },
        { front: "How to walk a matrix?", back: "Nested for loops: rows outside, columns inside." },
        { front: "Row-major?", back: "Row 0 stored first, then row 1, and so on." },
        { front: "a[1,2] valid 2D access?", back: "No. Use a[1][2]." },
        { front: "Nested initialiser?", back: "{{1,2,3},{4,5,6}} for two rows." },
      ],
      concepts: [
        {
          prompt: "Is a 2D array a new type of number?",
          explanation: "No. It is an array whose elements are arrays. Each inner array is one row.",
        },
        {
          prompt: "Why do nested loops match a table?",
          explanation: "One index is not enough. The outer loop holds the row still while the inner loop walks every column of that row.",
        },
      ],
      quickNotes: [
        "A 2D array is a table: rows and columns.",
        "Write a[i][j], not a[i,j].",
        "Both indices start at 0.",
        "Nested for loops walk the table.",
        "Storage is row-major.",
        "Total cells = rows times columns.",
      ],
      distinctions: [
        "a[i] is a whole row (an array of C ints). a[i][j] is one cell.",
        "Multi-dimensional means array of arrays, not a pair written with a comma.",
      ],
      examShort: [
        "Declare a 3-by-4 int matrix.",
        "How is a[1][2] read in words?",
        "Write nested loops to print a 2-by-2 matrix.",
      ],
      examLong:
        "A multi-dimensional array in C is an array of arrays. The common classroom form is two-dimensional: int a[R][C] is R rows of C integers. An element is written a[i][j] with i in 0 .. R-1 and j in 0 .. C-1. Nested for loops visit every cell, usually with the row loop outside and the column loop inside. Initialisers may use nested braces, one inner list per row. Elements of a row sit together in memory (row-major order). Using a comma such as a[i,j] is not two-index access. As with one-dimensional arrays, C does not check bounds.",
      visualizerIds: ["array-string", "algorithm"],
      relatedTopicIds: ["u3-t1", "u4-t4"],
      assessment: [
        { family: "predict", method: "predict", prompt: "int a[2][3]={{1,2,3},{4,5,6}}; a[0][2]+a[1][0]?", answer: "7", marks: 2, explanation: "3+4." },
        { family: "concept", method: "concept", prompt: "How many indices to pick one cell of a 2D array?", answer: "2", marks: 1, explanation: "Row and column." },
        { family: "syntax", method: "identify_error", prompt: "What is wrong with using a[1,2] for a cell?", answer: "comma is not a 2D index; use a[1][2]", marks: 2, explanation: "Two bracket pairs." },
        { family: "algorithm", method: "algorithm", prompt: "Outline printing an R by C matrix.", answer: "for i in 0..R-1: for j in 0..C-1 print a[i][j]; newline each row", marks: 2, explanation: "Nested counted loops." },
      ],
    },
    {
      topicId: "u3-t3",
      unitId: "unit-3",
      lessonId: "u3-t3-string-io",
      title: "Strings: Introduction, String I/O, Unformatted I/O",
      sourceLabel: "Strings: Introduction, String I/O, Unformatted I/O.",
      objectives: [
        "Describe a C string as a char array ending with '\\0'.",
        "Read a word with scanf(\"%s\", ...) and a line with fgets.",
        "Print a string with printf(\"%s\", ...) or puts.",
        "Explain why scanf(\"%s\") stops at whitespace and can overflow a small array.",
      ],
      beginner:
        "A string in C is not a special object type. It is a row of characters with a hidden stopper: the null character '\\0'. \"Hi\" is 'H', 'i', '\\0'. When you print with %s, C starts at the first char and stops at that terminator. Reading is the dangerous part: %s stops at a space and can write past the array if the word is too long.",
      formal:
        "A string is a contiguous sequence of characters terminated by a null character. String literals have static storage and include the terminator. scanf with %s reads a whitespace-delimited word and writes a terminator; it needs a char array, not &array. getchar/putchar and gets-style unformatted calls read or write characters without the same format specifiers; gets is removed from modern C because it cannot limit length. fgets is the safer line reader.",
      terms: [
        { term: "string", meaning: "A char sequence ending with the null character '\\0'." },
        { term: "null terminator", meaning: "The '\\0' that marks the end of a C string." },
        { term: "string literal", meaning: "Text in double quotes, such as \"cat\"." },
        { term: "scanf %s", meaning: "Reads a word (no spaces) into a char array and adds '\\0'." },
        { term: "unformatted I/O", meaning: "Character or line functions such as getchar, putchar, gets/fgets, rather than printf format specifiers." },
      ],
      explanation:
        "C has no string type in the way some languages do. You store text in a char array and agree that the first '\\0' ends the visible text. char s[6] = \"hello\"; uses five letters plus the terminator and fills the array exactly. If you write char s[5] = \"hello\"; you have no room for '\\0' in a simple full-string initialiser and you no longer have a proper string. printf(\"%s\", s) walks until '\\0'. If the terminator is missing, it walks off the array. Input has two common classroom tools. scanf(\"%s\", s) reads a word: it stops at space, tab, or newline, and it writes '\\0'. You pass s, not &s, because the array already names an address. Without a width, a long word overflows s. A width such as %19s matches a 20-char array (19 stored letters plus '\\0'). A full line with spaces needs a line reader. Older books show gets(s). gets has no length limit and is not in current ISO C. This course uses fgets(s, n, stdin), which reads at most n-1 characters, keeps space for '\\0', and usually keeps the newline. Unformatted character I/O uses getchar and putchar to read or write one character at a time. puts(s) prints the string and then a newline. Always size the array for the longest text you will store plus one for the terminator.",
      syntax:
        "char s[20];\nscanf(\"%19s\", s);\nfgets(s, 20, stdin);\nprintf(\"%s\\n\", s);\nputs(s);\nint c = getchar();\nputchar(c);",
      analogy:
        "A C string is a row of beads with a knot at the end. %s walks beads until the knot. If someone forgets the knot, the walk continues into whatever is on the table. A space is a gap that %s treats as the end of a word, even if more beads exist later.",
      introduction:
        "Strings are character arrays with a terminator. This topic is about what they are and how to read and write them, including unformatted character I/O.",
      prerequisiteCheck:
        "You should know char, one-dimensional arrays, and printf/scanf format specifiers.",
      examples: [
        {
          title: "Print a stored string",
          problem: "Store \"C\" in a char array and print it with %s.",
          steps: [
            "Declare char s[] = \"C\"; which is 'C' and '\\0'.",
            "Call printf with %s.",
            "Output is C.",
          ],
          code: `#include <stdio.h>
int main(void) {
    char s[] = "C";
    printf("%s\\n", s);
    return 0;
}`,
          output: "C",
        },
        {
          title: "Read a word, then echo",
          problem: "Read one word into a buffer of 16 chars and print it.",
          steps: [
            "Declare char name[16].",
            "Use scanf(\"%15s\", name) so at most 15 letters plus '\\0' are stored.",
            "Print with printf(\"%s\\n\", name).",
          ],
          code: `#include <stdio.h>
int main(void) {
    char name[16];
    if (scanf("%15s", name) == 1) {
        printf("%s\\n", name);
    }
    return 0;
}`,
          output: "(echo of the word typed)",
        },
      ],
      trace: {
        prompt: "char s[]=\"hi\"; How many elements does s have, including the terminator?",
        answer: "3",
      },
      predict: {
        prompt: "scanf(\"%s\", s) on input \"Ann Marie\". What is stored in s (as a word)?",
        answer: "Ann",
      },
      mistakes: [
        { wrong: "scanf(\"%s\", &s) is required because scanf always needs &.", why: "An array name already converts to the address of the first char. Use scanf(\"%s\", s)." },
        { wrong: "\"hi\" is two characters only.", why: "The literal includes '\\0', so three chars are stored when used as a string." },
        { wrong: "gets is the standard safe line function.", why: "gets cannot limit length and is not in modern ISO C. Use fgets." },
      ],
      checks: [
        { q: "What character ends a C string?", a: "'\\0'" },
        { q: "Why pass s not &s to scanf(\"%s\")?", a: "the array already names the address of the first character" },
        { q: "Does %s read past a space?", a: "no" },
      ],
      guided: {
        task: "Write a program that reads a first name with %s into char name[20] using a width, then prints Hello, name.",
        hint: "Use %19s to leave room for '\\0'. Do not pass &name.",
      },
      independent: {
        task: "Use getchar in a loop to copy characters to the screen until newline. Then rewrite the idea with fgets into a 40-char buffer and puts.",
      },
      flashcards: [
        { front: "What ends a C string?", back: "The null character '\\0'." },
        { front: "\"ab\" occupies how many chars as a string?", back: "3: a, b, '\\0'." },
        { front: "scanf %s reads?", back: "A word, stopping at whitespace." },
        { front: "scanf(\"%s\", s) or &s?", back: "s — the array is already an address." },
        { front: "Safer line input?", back: "fgets(buffer, size, stdin)." },
        { front: "Why avoid gets?", back: "No length limit; removed from modern ISO C." },
        { front: "puts does what extra?", back: "Prints the string and a newline." },
      ],
      concepts: [
        {
          prompt: "Is char s[10] already a string?",
          explanation: "Only if a '\\0' is stored in it. Uninitialised contents are not a string.",
        },
        {
          prompt: "Why can %s overflow?",
          explanation: "Without a width, scanf writes the whole word plus '\\0' and does not know the array size.",
        },
      ],
      quickNotes: [
        "A string is a char array plus '\\0'.",
        "Double-quoted literals include the terminator.",
        "%s prints until '\\0' and reads a single word.",
        "Pass the array name to scanf(\"%s\"), not &array.",
        "Use a width or fgets to respect the buffer size.",
        "gets is not a modern standard function.",
      ],
      distinctions: [
        "A char is one character. A string is many chars plus a terminator.",
        "Formatted %s is not the same as getchar/putchar, which move one character with no specifier.",
      ],
      examShort: [
        "Define a C string.",
        "Why is '\\0' required?",
        "Difference between scanf(\"%s\") and fgets for a line of text.",
      ],
      examLong:
        "In C a string is a sequence of characters stored in a char array and ended by the null character '\\0'. String literals in double quotes include that terminator. printf with %s writes characters until the terminator. scanf with %s reads a whitespace-delimited word into an array and writes a terminator; the array name is passed without &. %s does not know the array length unless a width is given, so a long word can overflow. Unformatted I/O includes getchar and putchar for single characters. Line input in older notes may mention gets, which cannot bound the length and is not in current ISO C; fgets is the replacement that takes a size. puts writes a string followed by a newline.",
      visualizerIds: ["array-string", "syntax"],
      relatedTopicIds: ["u3-t1", "u3-t4", "u3-t5"],
      assessment: [
        { family: "concept", method: "concept", prompt: "What terminator ends a C string?", answer: "'\\0'", marks: 1, explanation: "Null character." },
        { family: "predict", method: "predict", prompt: "char s[]=\"ok\"; printf(\"%c\", s[2]); What kind of character is printed?", answer: "the null character (nothing visible)", marks: 2, explanation: "Index 2 is '\\0'." },
        { family: "debug", method: "identify_error", prompt: "char s[10]; scanf(\"%s\", &s); What is questionable?", answer: "should be s not &s", marks: 2, explanation: "Array already decays to pointer." },
        { family: "short_answer", method: "definition", prompt: "Why is gets unsafe / non-modern?", answer: "no length limit; not in current ISO C", marks: 2, explanation: "Use fgets with a size." },
      ],
    },
    {
      topicId: "u3-t4",
      unitId: "unit-3",
      lessonId: "u3-t4-builtin-string-ops",
      title: "String operations with built-in functions",
      sourceLabel: "String operations with built-in functions: strlen(), strcmp(), strcat(), strcpy(), and strrev().",
      accuracyNotes: [
        "strrev() is not in the ISO C standard library. Treat it as a compiler-specific / non-standard extension. Prefer a classroom reverse written with indices.",
      ],
      objectives: [
        "Use strlen to count characters before '\\0'.",
        "Use strcpy and strcat with a destination that is large enough.",
        "Use strcmp and interpret a negative, zero, or positive result.",
        "State clearly that strrev is not ISO C.",
      ],
      beginner:
        "string.h gives ready-made tools. strlen walks until '\\0' and tells you how many letters that is. strcpy copies a string. strcat glues one string onto the end of another. strcmp compares two strings in dictionary order, not with ==. Some compilers also offer strrev to reverse a string, but that function is not part of standard C, so you should not treat it as portable.",
      formal:
        "strlen(s) returns the number of characters before the terminator. strcpy(dest, src) copies src including '\\0' into dest. strcat(dest, src) appends src onto dest, which must already be a string. strcmp(a, b) returns an int less than, equal to, or greater than zero. None of these know dest's capacity. strrev is a non-standard extension and is not declared by ISO C string.h.",
      terms: [
        { term: "strlen", meaning: "Returns the count of characters before '\\0'." },
        { term: "strcpy", meaning: "Copies a source string into a destination array, including '\\0'." },
        { term: "strcat", meaning: "Appends a source string onto a destination string." },
        { term: "strcmp", meaning: "Compares two strings lexicographically; 0 means equal." },
        { term: "strrev", meaning: "A non-standard function some compilers provide to reverse a string in place." },
      ],
      explanation:
        "The syllabus lists strlen, strcmp, strcat, strcpy, and strrev. The first four are standard when you include <string.h>. strlen(s) does not count '\\0'. For \"cat\" it returns 3. strcpy(dest, src) writes every character of src plus the terminator into dest. dest must be an array you may write, and it must be large enough. strcpy(dest, \"hello\") into char dest[4] overflows. strcat(dest, src) finds dest's '\\0' and copies src there. dest must already be a proper string and must have spare room. char dest[20] = \"good\"; strcat(dest, \" morning\"); becomes \"good morning\". strcmp(a, b) compares letter codes until a difference or both terminators. Zero means equal. A negative value means a comes before b; a positive value means a comes after. Do not write if (strcmp(a, b)) expecting a boolean \"equal\" — non-zero means not equal. Do not compare strings with ==; that compares addresses, not letters. strrev appears in some lab books and in some compilers as an extension that reverses a string in place. It is not an ISO C library function. Portable course code should reverse with a loop (the next topic) or say that a given compiler happened to provide strrev. Never assume strrev exists on every system.",
      syntax:
        "#include <string.h>\nsize_t n = strlen(s);\nstrcpy(dest, src);\nstrcat(dest, src);\nint c = strcmp(a, b);\n/* strrev(s);  -- NON-STANDARD, may be missing */",
      analogy:
        "strlen is counting carriages before the end-of-train marker. strcpy is copying a whole train onto an empty track that must be long enough. strcat couples a second train onto the first. strcmp is checking two nameplates letter by letter. strrev is a workshop tool only some sheds stock — it is not in the national rulebook.",
      introduction:
        "After you can store a string, the syllabus names library operations. Four are standard. strrev is listed in the college wording but is not ISO C.",
      prerequisiteCheck:
        "You need a terminator-based picture of strings and a dest array sized for the result.",
      examples: [
        {
          title: "Length, copy, and compare",
          problem: "Copy \"hi\" into dest, print its length, and compare dest with \"hi\".",
          steps: [
            "Include string.h. Set char dest[8].",
            "strcpy(dest, \"hi\"); then strlen(dest) is 2.",
            "strcmp(dest, \"hi\") is 0.",
          ],
          code: `#include <stdio.h>
#include <string.h>
int main(void) {
    char dest[8];
    strcpy(dest, "hi");
    printf("%zu\\n", strlen(dest));
    printf("%d\\n", strcmp(dest, "hi"));
    return 0;
}`,
          output: "2\n0",
        },
        {
          title: "Concatenate with room to spare",
          problem: "Start dest as \"ab\" and append \"cd\".",
          steps: [
            "char dest[8] = \"ab\";",
            "strcat(dest, \"cd\");",
            "dest is now \"abcd\" with length 4.",
          ],
          code: `#include <stdio.h>
#include <string.h>
int main(void) {
    char dest[8] = "ab";
    strcat(dest, "cd");
    printf("%s %zu\\n", dest, strlen(dest));
    return 0;
}`,
          output: "abcd 4",
        },
      ],
      trace: {
        prompt: "char a[]=\"dog\"; What does strlen(a) return?",
        answer: "3",
      },
      predict: {
        prompt: "strcmp(\"ap\", \"apple\") — is the result negative, zero, or positive?",
        answer: "negative",
      },
      mistakes: [
        { wrong: "if (a == b) compares the text of two strings.", why: "== compares the addresses of the arrays, not the characters." },
        { wrong: "strrev is in every standard C library.", why: "strrev is not ISO C. Many compilers do not provide it." },
        { wrong: "strcat always grows dest to fit.", why: "strcat writes into dest. If dest has no spare bytes, the write overflows." },
      ],
      checks: [
        { q: "Does strlen count '\\0'?", a: "no" },
        { q: "What strcmp result means equal?", a: "0" },
        { q: "Is strrev standard ISO C?", a: "no" },
      ],
      guided: {
        task: "Write a program that reads two words into large arrays, prints which is longer using strlen, and prints whether they are equal using strcmp.",
        hint: "Equal means strcmp returns 0. Do not use == on the arrays.",
      },
      independent: {
        task: "Build a greeting in char dest[40] by strcpy of \"Hello, \" then strcat of a name you read with %s. Print dest. Add a comment that strrev is non-standard so you will reverse in a later exercise by hand.",
      },
      flashcards: [
        { front: "strlen(\"ab\")?", back: "2" },
        { front: "strcpy copies what extra?", back: "The '\\0' terminator." },
        { front: "strcat needs dest to be?", back: "An existing string with leftover space." },
        { front: "strcmp equal?", back: "Returns 0." },
        { front: "== on two arrays?", back: "Compares addresses, not letters." },
        { front: "strrev portable?", back: "No. Not ISO C." },
        { front: "Header for the standard four?", back: "string.h" },
      ],
      concepts: [
        {
          prompt: "Why can strcpy overflow?",
          explanation: "It copies until src's '\\0' and does not receive dest's size. The caller must guarantee space.",
        },
        {
          prompt: "How should we treat the syllabus name strrev?",
          explanation: "Keep the official wording, then label the function as a non-standard extension. Write a reverse with indices when you need portable C.",
        },
      ],
      quickNotes: [
        "Include string.h for the standard string functions.",
        "strlen stops before '\\0'.",
        "strcpy and strcat need a large enough dest.",
        "strcmp == 0 means equal text.",
        "Do not compare string text with ==.",
        "strrev is non-standard; do not depend on it.",
      ],
      distinctions: [
        "Standard: strlen, strcmp, strcat, strcpy. Non-standard: strrev.",
        "strcmp's int result is an ordering, not a boolean 1 for equal.",
      ],
      examShort: [
        "What does strlen return?",
        "How do you test two strings for equal text?",
        "Why is strrev special in this course?",
      ],
      examLong:
        "The header string.h declares the standard string operations listed in this topic, except strrev. strlen(s) returns the number of characters before '\\0'. strcpy(dest, src) copies src and its terminator into dest. strcat(dest, src) appends src onto dest, which must already contain a string and must have unused space. strcmp(a, b) returns a negative value, zero, or a positive value according to lexicographic order; zero means the texts are equal. These functions do not receive the destination capacity, so a short array overflows. The name strrev appears in the official topic list, but strrev is not part of ISO C. Treat it as a compiler-specific extension and reverse strings with an index loop when you need portable code.",
      visualizerIds: ["array-string", "syntax"],
      relatedTopicIds: ["u3-t3", "u3-t5"],
      assessment: [
        { family: "concept", method: "concept", prompt: "Is strrev in ISO C?", answer: "no", marks: 1, explanation: "Non-standard extension." },
        { family: "predict", method: "predict", prompt: "char d[8]=\"xy\"; strcat(d,\"z\"); d is?", answer: "xyz", marks: 2, explanation: "Append then terminator." },
        { family: "debug", method: "identify_error", prompt: "if (s1 == s2) to test text. What is wrong?", answer: "compares pointers not characters", marks: 2, explanation: "Use strcmp." },
        { family: "short_answer", method: "definition", prompt: "What does strcmp return when strings are equal?", answer: "0", marks: 1, explanation: "Zero means match." },
      ],
    },
    {
      topicId: "u3-t5",
      unitId: "unit-3",
      lessonId: "u3-t5-manual-string-ops",
      title: "String operations without built-in functions",
      sourceLabel: "String operations without built-in functions.",
      objectives: [
        "Count length by walking characters until '\\0' without strlen.",
        "Copy and concatenate with index loops without strcpy or strcat.",
        "Compare two strings letter by letter without strcmp.",
        "Reverse a string in place with two indices (portable substitute for strrev).",
      ],
      beginner:
        "You can do every common string job with a loop. Length is \"how many steps until I see '\\0'\". Copy is \"write each letter, then write '\\0'\". Compare is \"walk both together until they differ\". Reverse is \"swap the first letter with the last, then move inward\". No library call is required.",
      formal:
        "Manual string algorithms traverse char arrays until the terminator. Length is the index of '\\0'. Copy writes src[i] to dest[i] including the terminator. Concatenation starts writing at dest's current terminator. Comparison returns at the first differing character. In-place reverse swaps s[i] with s[len-1-i].",
      terms: [
        { term: "manual length", meaning: "A counter that increments until s[i] is '\\0'." },
        { term: "manual copy", meaning: "Element assignment dest[i] = src[i] through the terminator." },
        { term: "in-place reverse", meaning: "Swapping characters from the ends toward the centre." },
        { term: "lexicographic compare", meaning: "Comparing corresponding characters until a difference or both ends." },
        { term: "empty string", meaning: "An array whose first character is already '\\0'." },
      ],
      explanation:
        "The syllabus also asks for string work without built-in functions. That is not a different kind of string; it is the same char array, walked by you. Length: set n = 0; while (s[n] != '\\0') n++; n is the length. Copy: for (i = 0; src[i] != '\\0'; i++) dest[i] = src[i]; dest[i] = '\\0'; Forgetting the last assignment leaves dest without a terminator. Concatenate: find dest's end, then copy src there, then write '\\0'. Compare: walk i while both sides have letters and they match; then the sign of dest[i] - src[i] (as unsigned char in careful code) tells the order. Reverse: compute length, then swap s[left] with s[right] while left < right. That portable reverse replaces non-standard strrev. Empty strings work if you honour '\\0' at index 0: length 0, copy writes one terminator, reverse does nothing. Always keep dest large enough. A manual loop overflows just like strcpy if you write past the last index. These loops are also how you later build small utilities — palindrome checks, counting vowels — without pretending the library is magic.",
      syntax:
        "/* length */\nfor (n = 0; s[n] != '\\0'; n++) { }\n/* copy */\nfor (i = 0; (dest[i] = src[i]) != '\\0'; i++) { }\n/* reverse */\nfor (L = 0, R = n - 1; L < R; L++, R--) { t = s[L]; s[L] = s[R]; s[R] = t; }",
      analogy:
        "Manual string work is counting carriages by walking the platform instead of asking the conductor. Reverse is two porters starting at the engine and the brake van and swapping nameplates until they meet.",
      introduction:
        "Library functions hide a loop. This topic writes that loop so you can operate on strings when you may not call strlen, strcpy, strcat, or strcmp — and so you can reverse without non-standard strrev.",
      prerequisiteCheck:
        "You should know that a string ends at '\\0' and that array indices start at 0.",
      examples: [
        {
          title: "Manual length and copy",
          problem: "Copy \"sun\" into dest without strcpy and print the manual length.",
          steps: [
            "Loop i while src[i] is not '\\0', assigning dest[i] = src[i].",
            "Write dest[i] = '\\0' after the loop (or assign inside a combined test).",
            "Count dest until '\\0' to print 3.",
          ],
          code: `#include <stdio.h>
int main(void) {
    char src[] = "sun";
    char dest[8];
    int i, n;
    for (i = 0; src[i] != '\\0'; i++) {
        dest[i] = src[i];
    }
    dest[i] = '\\0';
    for (n = 0; dest[n] != '\\0'; n++) { }
    printf("%s %d\\n", dest, n);
    return 0;
}`,
          output: "sun 3",
        },
        {
          title: "In-place reverse",
          problem: "Reverse char s[] = \"abcd\" without strrev.",
          steps: [
            "Length is 4. left = 0, right = 3.",
            "Swap a with d, then b with c.",
            "s is now dcba.",
          ],
          code: `#include <stdio.h>
int main(void) {
    char s[] = "abcd";
    int left = 0, right = 3;
    while (left < right) {
        char t = s[left];
        s[left] = s[right];
        s[right] = t;
        left++;
        right--;
    }
    printf("%s\\n", s);
    return 0;
}`,
          output: "dcba",
        },
      ],
      trace: {
        prompt: "Manual compare of \"at\" and \"ate\": at the first difference, which string ends?",
        answer: "\"at\" ends (its next char is '\\0' while 'e' remains)",
      },
      predict: {
        prompt: "Reverse \"a\" in place. What is the string?",
        answer: "a",
      },
      mistakes: [
        { wrong: "After copying letters you can skip writing '\\0' if dest was empty.", why: "dest must receive a terminator or later %s walks off the array." },
        { wrong: "You must call strrev to reverse a string in C.", why: "strrev is non-standard. Two-index swap is ordinary C." },
        { wrong: "Length includes the terminator.", why: "The count of visible characters stops before '\\0', matching strlen." },
      ],
      checks: [
        { q: "When does a manual length loop stop?", a: "when s[i] is '\\0'" },
        { q: "What must a manual copy write last?", a: "'\\0'" },
        { q: "Two indices for reverse move how?", a: "inward from both ends until they meet" },
      ],
      guided: {
        task: "Write a function-free main that concatenates \"good\" and \"day\" into dest[20] using only loops and prints dest.",
        hint: "Find the index of dest's '\\0', then copy the second string there.",
      },
      independent: {
        task: "Read a word and print PALINDROME or NOT by reversing a copy and comparing letter by letter. Do not call string.h functions.",
      },
      flashcards: [
        { front: "Manual strlen idea?", back: "Count until '\\0'." },
        { front: "Manual strcpy must also?", back: "Write '\\0' into dest." },
        { front: "Manual strcat starts writing where?", back: "At dest's current '\\0'." },
        { front: "Reverse without strrev?", back: "Swap ends and move inward." },
        { front: "Empty string length?", back: "0" },
        { front: "First mismatch in compare?", back: "Those two characters decide the order." },
        { front: "Can a manual loop overflow dest?", back: "Yes, if you write past dest's last index." },
      ],
      concepts: [
        {
          prompt: "Are library string functions doing something you cannot write?",
          explanation: "No. They are loops over '\\0'-terminated arrays, with the same overflow rules.",
        },
        {
          prompt: "Why reverse a copy for a palindrome test?",
          explanation: "In-place reverse destroys the original. A second array keeps the input so you can compare.",
        },
      ],
      quickNotes: [
        "Walk until '\\0' for length.",
        "Copy characters, then write '\\0'.",
        "Concatenate at the old end of dest.",
        "Compare corresponding letters.",
        "Reverse by swapping ends — portable, not strrev.",
        "Dest size is still your responsibility.",
      ],
      distinctions: [
        "Manual operations are the same algorithms as the library, written in your loop.",
        "Reversing in place changes s. Comparing a reverse needs a copy if you still need the original.",
      ],
      examShort: [
        "Write a loop that finds the length of s.",
        "How do you reverse a string without strrev?",
        "What is the last assignment in a manual copy?",
      ],
      examLong:
        "String operations without built-in functions use counted or sentinel loops on a char array. Length increments an index until s[i] is '\\0'. Copy assigns dest[i] = src[i] for each source character and then writes '\\0' in dest. Concatenation locates the terminator of dest and copies src from that index. Comparison walks both strings until a character differs or both end; the first difference orders them. A portable reverse, used instead of non-standard strrev, swaps characters from the two ends toward the centre. The destination array must still be large enough. Forgetting the terminator leaves an invalid string.",
      visualizerIds: ["array-string", "algorithm"],
      relatedTopicIds: ["u3-t3", "u3-t4"],
      assessment: [
        { family: "algorithm", method: "algorithm", prompt: "Steps to reverse s of length n in place.", answer: "swap s[i] with s[n-1-i] for i from 0 while i < n-1-i", marks: 3, explanation: "Two-index meet in the middle." },
        { family: "trace", method: "trace", prompt: "Manual length of \"\" (empty string)?", answer: "0", marks: 1, explanation: "s[0] is already '\\0'." },
        { family: "debug", method: "identify_error", prompt: "Copy loop writes letters but never dest[i]='\\0'. What fails later?", answer: "dest is not a string; %s may run past the array", marks: 2, explanation: "Terminator required." },
        { family: "concept", method: "concept", prompt: "Must you call strrev to reverse in ISO C?", answer: "no", marks: 1, explanation: "Use a swap loop." },
      ],
    },
  ];
}
