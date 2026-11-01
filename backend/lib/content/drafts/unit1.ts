import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { LessonDocument } from "@/lib/curriculum/lesson-schema";
import { packageFromExistingLesson } from "../compile";
import type { TopicPackage } from "../types";

function load(id: string): LessonDocument {
  return JSON.parse(readFileSync(join(process.cwd(), "content/curriculum/lessons", `${id}.json`), "utf8")) as LessonDocument;
}

export function unit1Packages(): TopicPackage[] {
  return [
    packageFromExistingLesson(load("u1-t1-computers-and-binary"), {
      visualizerIds: ["binary", "flowchart"],
      relatedTopicIds: ["u1-t2", "f-basic-computer"],
      distinctions: [
        "Main memory is fast and usually volatile. Disk keeps files after power-off.",
        "A bit is one 0 or 1. A byte is eight bits.",
        "Binary place values double: 1, 2, 4, 8 from the right.",
      ],
      examShort: ["Name the four main blocks of a computer diagram.", "Why do computers use binary?", "Convert 13 to binary."],
      flashcards: [
        { front: "What does the ALU do?", back: "Arithmetic and logic: add, subtract, compare." },
        { front: "What does the control unit do?", back: "Fetches the next instruction and directs other parts." },
        { front: "What is a bit?", back: "One binary digit: 0 or 1." },
        { front: "Why binary?", back: "Hardware can reliably hold two states." },
        { front: "Place values from the right?", back: "1, 2, 4, 8, 16, …" },
        { front: "Input unit?", back: "Brings data in: keyboard, mouse, files." },
      ],
      concepts: [
        { prompt: "Is the CPU the whole computer?", explanation: "No. The CPU executes instructions. Memory, input, and output are separate blocks." },
        { prompt: "Does binary only store numbers?", explanation: "Bits store numbers, characters, and instructions. The meaning depends on how the program reads them." },
      ],
      assessment: [
        { family: "concept", method: "concept", prompt: "Name the two parts often drawn inside the CPU.", answer: "control unit and ALU", marks: 2, explanation: "CU directs; ALU calculates." },
        { family: "algorithm", method: "algorithm", prompt: "Convert decimal 13 to binary. Show the bits.", answer: "1101", marks: 3, explanation: "8+4+1 = 13." },
        { family: "short_answer", method: "definition", prompt: "Why does a computer use two symbols instead of ten?", answer: "two stable hardware states", marks: 2, explanation: "Voltage or magnetic states are reliably on/off." },
        { family: "concept", method: "concept", prompt: "Does opening this topic prove mastery of binary?", answer: "no", marks: 1, explanation: "Opening is not mastery." },
      ],
    }),
    packageFromExistingLesson(load("u1-t2-algorithms-flowcharts"), {
      visualizerIds: ["flowchart", "algorithm"],
      relatedTopicIds: ["u1-t1", "u1-t5"],
      distinctions: [
        "An algorithm is the steps. A flowchart is one picture of those steps.",
        "A diamond asks a yes/no question. A rectangle does work.",
      ],
      examShort: ["Define algorithm.", "Name five flowchart symbols.", "Write steps to find the larger of two numbers."],
      flashcards: [
        { front: "Algorithm?", back: "A finite, ordered, unambiguous set of steps to solve a problem." },
        { front: "Oval in a flowchart?", back: "Start or stop (terminator)." },
        { front: "Parallelogram?", back: "Input or output." },
        { front: "Rectangle?", back: "Process / calculation." },
        { front: "Diamond?", back: "Decision (yes/no)." },
        { front: "Must every algorithm be C code?", back: "No. An algorithm can be English or a flowchart first." },
      ],
      concepts: [
        { prompt: "Is a flowchart the program?", explanation: "No. It is a picture of the plan. C is one way to write the plan for the machine." },
      ],
      assessment: [
        { family: "concept", method: "definition", prompt: "A finite unambiguous sequence of steps is called an ____.", answer: "algorithm", marks: 2, explanation: "Definition from the syllabus topic." },
        { family: "syntax", method: "concept", prompt: "Which symbol tests a condition?", answer: "diamond", marks: 1, explanation: "Decision box." },
        { family: "algorithm", method: "algorithm", prompt: "List Start, input a and b, compare, print larger, Stop. What is missing if you never say how to compare?", answer: "the decision step", marks: 2, explanation: "Unambiguous comparison is required." },
        { family: "trace", method: "trace", prompt: "Algorithm: if n is even print EVEN else ODD. n=7. Output?", answer: "ODD", marks: 2, explanation: "7 is not divisible by 2." },
      ],
    }),
    packageFromExistingLesson(load("u1-t3-keywords-identifiers"), {
      visualizerIds: ["syntax"],
      relatedTopicIds: ["u1-t4", "u1-t5"],
      distinctions: [
        "A keyword is reserved (int, return). You cannot use it as a name.",
        "A constant does not change. A variable's stored value can change.",
      ],
      examShort: ["Define identifier.", "Give two invalid identifiers.", "What is a keyword?"],
      flashcards: [
        { front: "Keyword?", back: "A reserved word with a fixed meaning in C, such as int or return." },
        { front: "Identifier?", back: "The name you give a variable, function, or other object." },
        { front: "Can an identifier start with a digit?", back: "No." },
        { front: "Constant?", back: "A value that does not change during the program." },
        { front: "Variable?", back: "A named memory location whose value may change." },
        { front: "Is main a keyword?", back: "No. It is an identifier the runtime looks for as the start function." },
      ],
      concepts: [
        { prompt: "Is printf a keyword?", explanation: "No. It is a library function name declared via stdio.h." },
      ],
      assessment: [
        { family: "syntax", method: "identify_error", prompt: "Which identifier is illegal: sum, _total, 2nd, value1?", answer: "2nd", marks: 2, explanation: "Cannot start with a digit." },
        { family: "concept", method: "concept", prompt: "Can you name a variable int?", answer: "no", marks: 1, explanation: "int is a keyword." },
        { family: "short_answer", method: "definition", prompt: "What is a variable?", answer: "named memory location", marks: 2, explanation: "Name + storage." },
        { family: "debug", method: "identify_error", prompt: "int 1count = 0; What is wrong?", answer: "identifier starts with digit", marks: 2, explanation: "1count is illegal." },
      ],
    }),
    packageFromExistingLesson(load("u1-t4-types-io"), {
      visualizerIds: ["syntax"],
      relatedTopicIds: ["u1-t3", "u1-t5"],
      distinctions: [
        "%d is for int. %f is for float. Using the wrong specifier is undefined behaviour.",
        "scanf needs the address of the variable: &n.",
      ],
      examShort: ["List four basic types.", "What does %d mean?", "Why does scanf use &?"],
      flashcards: [
        { front: "int?", back: "Integer type for whole numbers." },
        { front: "float?", back: "Single-precision floating-point." },
        { front: "char?", back: "A single character, stored as an integer code." },
        { front: "%d", back: "printf/scanf specifier for int." },
        { front: "Why & in scanf?", back: "scanf must write into the variable's address." },
        { front: "double vs float?", back: "double usually has more precision." },
      ],
      concepts: [
        { prompt: "Does printf convert types safely if the specifier is wrong?", explanation: "No. The specifier must match the argument type." },
      ],
      assessment: [
        { family: "syntax", method: "syntax", prompt: "Specifier for int in printf?", answer: "%d", marks: 1, explanation: "Standard int specifier." },
        { family: "debug", method: "identify_error", prompt: "scanf(\"%d\", n); with int n; What is missing?", answer: "&", marks: 2, explanation: "Need &n." },
        { family: "predict", method: "predict", prompt: "int a=3; printf(\"%d\", a+1); Output?", answer: "4", marks: 2, explanation: "3+1." },
        { family: "concept", method: "concept", prompt: "Is char only for letters?", answer: "no", marks: 1, explanation: "char holds a small integer code." },
      ],
      practice: { exerciseId: "22222222-2222-4222-8222-222222222222" },
    }),
    packageFromExistingLesson(load("u1-t5-c-program-structure"), {
      visualizerIds: ["syntax"],
      relatedTopicIds: ["u1-t4", "u1-t6"],
      distinctions: [
        "#include is a preprocessor directive, not a C statement.",
        "main is where execution of a hosted program starts.",
      ],
      examShort: ["Parts of a simple C program.", "What does #include <stdio.h> do?", "Why return 0?"],
      flashcards: [
        { front: "#include <stdio.h>", back: "Tells the preprocessor to insert the standard I/O declarations." },
        { front: "main", back: "The function where a typical C program starts." },
        { front: "return 0;", back: "Signals successful finish to the environment." },
        { front: "Preprocessor?", back: "Runs before the compiler proper; handles #include and #define." },
        { front: "Header file?", back: "Declarations the compiler needs, not the machine code of printf itself." },
        { front: "Statement end?", back: "Most C statements end with a semicolon." },
      ],
      concepts: [
        { prompt: "Is #include a function call?", explanation: "No. It is a preprocessor directive processed before compilation." },
      ],
      assessment: [
        { family: "concept", method: "concept", prompt: "Where does a hosted C program start?", answer: "main", marks: 1, explanation: "Runtime calls main." },
        { family: "syntax", method: "syntax", prompt: "What character ends most statements?", answer: ";", marks: 1, explanation: "Semicolon." },
        { family: "debug", method: "identify_error", prompt: "Missing stdio.h and using printf. What fails?", answer: "undeclared printf", marks: 2, explanation: "Need the header for a prototype." },
        { family: "trace", method: "trace", prompt: "Program prints Hello then returns 0. What is the process exit success code?", answer: "0", marks: 1, explanation: "return 0." },
      ],
      practice: { exerciseId: "11111111-1111-4111-8111-111111111111" },
    }),
    packageFromExistingLesson(load("u1-t6-basic-operators"), {
      visualizerIds: ["syntax", "control-flow"],
      relatedTopicIds: ["u1-t7", "u2-t1"],
      distinctions: [
        "= assigns. == compares.",
        "Integer / truncates toward zero for positive values: 5/2 is 2.",
      ],
      examShort: ["List arithmetic operators.", "Difference between = and ==.", "What is 5/2 in int?"],
      flashcards: [
        { front: "=", back: "Assignment. Stores the right-hand value." },
        { front: "==", back: "Equality test. Result is 1 or 0." },
        { front: "5 / 2 in int", back: "2 (integer division)." },
        { front: "&&", back: "Logical and. Both sides true." },
        { front: "||", back: "Logical or. At least one side true." },
        { front: "!", back: "Logical not." },
      ],
      concepts: [
        { prompt: "Is 5/2 equal to 2.5 in int arithmetic?", explanation: "No. Both operands are int, so the result is int 2." },
      ],
      assessment: [
        { family: "predict", method: "predict", prompt: "int x=5/2; printf(\"%d\", x);", answer: "2", marks: 2, explanation: "Integer division." },
        { family: "debug", method: "identify_error", prompt: "if (x = 5) always true when 5. Why is this dangerous?", answer: "assignment not comparison", marks: 2, explanation: "= assigns." },
        { family: "concept", method: "concept", prompt: "Operator for remainder?", answer: "%", marks: 1, explanation: "Modulo." },
        { family: "trace", method: "trace", prompt: "int a=3,b=4; a=a+b; values of a and b?", answer: "7 4", marks: 2, explanation: "b unchanged." },
      ],
    }),
    packageFromExistingLesson(load("u1-t7-more-operators"), {
      visualizerIds: ["binary", "syntax"],
      relatedTopicIds: ["u1-t6", "u2-t1"],
      distinctions: [
        "++i increments then uses the new value. i++ uses the old value then increments.",
        "?: is a compact if-else expression, not a statement replacement for every if.",
      ],
      examShort: ["Difference prefix vs postfix ++.", "What is the ternary operator?", "Name two bitwise operators."],
      flashcards: [
        { front: "++i", back: "Pre-increment: add 1, then use the value." },
        { front: "i++", back: "Post-increment: use the value, then add 1." },
        { front: "?:", back: "cond ? a : b — choose a if cond is true." },
        { front: "& on integers", back: "Bitwise and." },
        { front: "|", back: "Bitwise or." },
        { front: "sizeof", back: "Operator that yields the size of a type or object in bytes." },
      ],
      concepts: [
        { prompt: "Is sizeof a function?", explanation: "No. It is an operator. Parentheses are used like a function but it is not a call." },
      ],
      assessment: [
        { family: "predict", method: "predict", prompt: "int i=3; printf(\"%d\", i++); then printf(\"%d\", i); outputs?", answer: "3 4", marks: 3, explanation: "Postfix prints 3 then i becomes 4." },
        { family: "concept", method: "concept", prompt: "Symbol of the ternary operator?", answer: "?:", marks: 1, explanation: "Conditional operator." },
        { family: "trace", method: "trace", prompt: "int x = 1 ? 10 : 20; x is?", answer: "10", marks: 2, explanation: "1 is true." },
        { family: "syntax", method: "syntax", prompt: "Bitwise and operator?", answer: "&", marks: 1, explanation: "Single ampersand." },
      ],
    }),
  ];
}
