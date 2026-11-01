import type { TopicDraft } from "../compile";

export function unit2Drafts(): TopicDraft[] {
  return [
    {
      topicId: "u2-t1",
      unitId: "unit-2",
      lessonId: "u2-t1-precedence",
      title: "Precedence and Associativity, Type Conversion with Examples",
      sourceLabel: "Precedence and Associativity, Type Conversion with Examples.",
      objectives: [
        "State how operator precedence decides which operator is applied first in a mixed expression.",
        "Use associativity to resolve operators that share the same precedence.",
        "Explain implicit and explicit type conversion, including that integer division truncates.",
        "Trace a short expression that mixes arithmetic, relational, and assignment operators.",
      ],
      beginner:
        "When C sees 2 + 3 * 4 it does not always go left to right. Some operators bind tighter than others. That tightness is precedence. If two operators have the same rank, associativity says whether to group left or right. Types also matter: mixing int and double can convert values, and 5 / 2 with two ints is 2, not 2.5.",
      formal:
        "Precedence is a ranking of operators. Associativity is the grouping rule among operators of equal precedence. Usual arithmetic conversions and casts change operand types; integer / truncates toward zero.",
      terms: [
        { term: "precedence", meaning: "The rank that decides which operator is applied first when operators differ." },
        { term: "associativity", meaning: "Left-to-right or right-to-left grouping among operators of the same rank." },
        { term: "implicit conversion", meaning: "The compiler changes a value's type automatically in an expression or assignment." },
        { term: "cast", meaning: "An explicit conversion written as (type)value." },
        { term: "integer division", meaning: "Division of two integers; the fractional part is discarded (truncation toward zero)." },
      ],
      explanation:
        "C does not read every expression strictly left to right. Each operator has a precedence rank. Multiplication and division sit above addition and subtraction, so 2 + 3 * 4 is 2 + 12, not 5 * 4. Parentheses override the ranking: (2 + 3) * 4 is 20. When two operators share a rank, associativity decides the grouping. Most binary arithmetic operators associate left to right, so 20 - 8 - 3 is (20 - 8) - 3. Assignment associates right to left, so a = b = 0 stores 0 in b, then in a. Type conversion is a separate rule that still changes results. If both operands of / are int, the result is int and the fraction is thrown away: 5 / 2 is 2. Mixing an int with a double promotes the int before the operation, so 5 / 2.0 is 2.5. A cast such as (double)5 / 2 does the same idea on purpose. Assignment into a narrower type can lose information: storing 3.9 in an int keeps 3. Relational operators produce 1 or 0. Logical && and || sit below relational operators, which is why x < 3 && y > 1 is parsed as (x < 3) && (y > 1). Learning the ranking is not about memorising every row at once; it is about never guessing when parentheses would make the intent obvious.",
      syntax:
        "expr:  a + b * c\ngroup: (a + b) * c\ncast:  (double)a / b\nassign chain: a = b = 0;",
      analogy:
        "Precedence is the order of jobs on a kitchen ticket: chopping happens before plating. Associativity is whether two cooks of equal rank work left-first or right-first. A cast is labelling a bowl so the next step treats flour as grams, not cups.",
      introduction:
        "Unit 2 starts here because if and loops later depend on expressions that already have a single, definite value. If you misread 5 / 2 or a + b * c, every later decision is wrong even when the if keyword is spelled correctly.",
      prerequisiteCheck:
        "You should already know the arithmetic operators +, -, *, /, % and the difference between = and == from Unit 1.",
      examples: [
        {
          title: "Mixed arithmetic and integer division",
          problem: "What does 2 + 9 / 2 * 3 print when all operands are int?",
          steps: [
            "Division and multiplication share precedence and associate left to right.",
            "9 / 2 is integer division, so the result is 4, not 4.5.",
            "4 * 3 is 12. Then 2 + 12 is 14.",
          ],
          code: `#include <stdio.h>
int main(void) {
    printf("%d\\n", 2 + 9 / 2 * 3);
    return 0;
}`,
          output: "14",
        },
        {
          title: "Cast versus integer operands",
          problem: "Show how a cast changes 7 / 2 compared with both operands remaining int.",
          steps: [
            "Declare int a = 7 and int b = 2.",
            "Print a / b. Both ints, so the value is 3.",
            "Print (double)a / b. a is converted first, so the division is floating and prints 3.5.",
          ],
          code: `#include <stdio.h>
int main(void) {
    int a = 7, b = 2;
    printf("%d\\n", a / b);
    printf("%.1f\\n", (double)a / b);
    return 0;
}`,
          output: "3\n3.5",
        },
      ],
      trace: {
        prompt: "int x = 3 + 4 * 2 - 5; What is x?",
        answer: "6",
      },
      predict: {
        prompt: "int a = 5, b = 2; printf(\"%d\", a / b); then printf(\" %.1f\", a / (double)b); What is printed?",
        answer: "2 2.5",
      },
      mistakes: [
        { wrong: "5 / 2 is 2.5 in C when both sides are int.", why: "Integer division truncates. The result type is int, so the value is 2." },
        { wrong: "All operators are applied strictly left to right.", why: "Precedence can pull a later operator first. * binds tighter than +." },
        { wrong: "a = b = 1 is illegal because assignment is not an expression.", why: "Assignment is an operator and associates right to left, so b becomes 1, then a becomes 1." },
      ],
      checks: [
        { q: "Which operator is applied first in 1 + 2 * 3?", a: "*" },
        { q: "What is 11 / 4 as ints?", a: "2" },
        { q: "Does assignment associate left or right?", a: "right to left" },
      ],
      guided: {
        task: "Write a program that prints 5 / 2 and (double)5 / 2 on two lines so you can see truncation versus a real quotient.",
        hint: "Use %d for the int result and a floating specifier such as %f for the cast result.",
      },
      independent: {
        task: "Write an expression using +, *, and parentheses that evaluates to 20 from the numbers 2, 3, and 4, then print it. Also print the same numbers without parentheses and explain the different value in a comment.",
      },
      flashcards: [
        { front: "What is precedence?", back: "A ranking that decides which operator is applied first when ranks differ." },
        { front: "What is associativity?", back: "The grouping rule for operators that share the same precedence." },
        { front: "What is 5 / 2 with two ints?", back: "2. Integer division truncates toward zero." },
        { front: "How do you force floating division of ints a and b?", back: "Cast one operand, for example (double)a / b." },
        { front: "How do + and * compare?", back: "* has higher precedence than +." },
        { front: "How does a = b = 0 group?", back: "a = (b = 0)." },
        { front: "What does a cast look like?", back: "(type)value, such as (double)n." },
      ],
      concepts: [
        {
          prompt: "Why is 2 + 3 * 4 equal to 14, not 20?",
          explanation: "Multiplication has higher precedence than addition, so 3 * 4 is done first.",
          formal: "The * operator binds more tightly than +.",
          example: "2 + 3 * 4 → 2 + 12 → 14",
        },
        {
          prompt: "Does writing 5 / 2.0 change the meaning of / ?",
          explanation: "The operator is still division, but usual arithmetic conversions make it a floating operation.",
          example: "5 / 2.0 is 2.5",
        },
      ],
      quickNotes: [
        "* and / outrank + and -.",
        "Equal-rank arithmetic groups left to right.",
        "Assignment groups right to left.",
        "int / int drops the fraction.",
        "A cast is an explicit conversion you write yourself.",
        "Parentheses are the reliable way to show intended order.",
      ],
      distinctions: [
        "Precedence chooses among different operators. Associativity chooses among equal operators.",
        "Implicit conversion happens without a cast. A cast is written on purpose.",
      ],
      examShort: [
        "Define precedence and associativity.",
        "What is the value of 5 / 2 in integer arithmetic?",
        "How does a = b = 0 group?",
      ],
      examLong:
        "Precedence is the ranking of operators that decides which operation happens first when an expression mixes different operators. Associativity is the grouping rule used when neighbouring operators have the same rank: most arithmetic operators group left to right, while assignment groups right to left. Type conversion changes an operand's type. Implicit conversion is inserted by the compiler, for example when an int meets a double. An explicit cast is written as (type)value. Integer division is a common trap: both operands int means the quotient is int and the fraction is discarded, so 5 / 2 is 2. Parentheses override ranking and should be used whenever the intended order is not obvious.",
      visualizerIds: ["syntax", "control-flow"],
      relatedTopicIds: ["u1-t6", "u1-t7", "u2-t2"],
      assessment: [
        { family: "predict", method: "predict", prompt: "Value of 4 + 6 / 3 * 2 with all ints?", answer: "8", marks: 2, explanation: "6/3 is 2, times 2 is 4, plus 4 is 8." },
        { family: "concept", method: "concept", prompt: "Integer 9 / 4 equals?", answer: "2", marks: 1, explanation: "Truncating integer division." },
        { family: "syntax", method: "identify_error", prompt: "Which grouping is wrong for a = b = 1: a = (b = 1) or (a = b) = 1 as the meaning of the statement?", answer: "(a = b) = 1", marks: 2, explanation: "Assignment associates right to left." },
        { family: "short_answer", method: "definition", prompt: "What does associativity decide?", answer: "grouping of equal-precedence operators", marks: 2, explanation: "Same rank, then left or right grouping." },
      ],
    },
    {
      topicId: "u2-t2",
      unitId: "unit-2",
      lessonId: "u2-t2-if-if-else",
      title: "if, if-else, nested if-else and Examples",
      sourceLabel: "Conditional Statements: if, if-else, nested if-else and Examples.",
      objectives: [
        "Write a one-way if that runs a block only when a condition is non-zero.",
        "Write if-else so exactly one of two paths runs.",
        "Nest if-else to test a second condition after the first is known.",
        "Trace a nested decision with concrete numbers.",
      ],
      beginner:
        "An if asks a yes/no question. If the answer is yes (any non-zero value), C runs the following statement or block. If you also write else, C has a backup path for the no case. You can put another if inside those paths when the second question only makes sense after the first answer.",
      formal:
        "The if statement evaluates a controlling expression. A non-zero value is true. if-else selects one of two statements. Nesting places a further if in either branch. Braces group multiple statements into one block.",
      terms: [
        { term: "condition", meaning: "An expression treated as true when it is not zero." },
        { term: "if", meaning: "A statement that optionally executes its body when the condition is true." },
        { term: "else", meaning: "The alternate path taken when the matching if condition is false." },
        { term: "nested if", meaning: "An if written inside the body of another if or else." },
        { term: "block", meaning: "Statements wrapped in { } that count as one statement for if or else." },
      ],
      explanation:
        "Programs choose. The simplest choice in C is if. You write if (expression) statement. C evaluates the expression. Zero means false; anything else means true. Only then does the statement run. If you need a second path, add else. Exactly one of the two paths runs, never both, and never neither. That is different from writing two separate ifs, which can both run or both skip. When the body needs more than one statement, wrap it in braces. Forgetting braces is a frequent bug: only the next statement belongs to the if. Nested if-else is just another decision inside a path you have already taken. A typical pattern is: if the score is at least 40, then ask whether it is at least 75 for a distinction message; otherwise print fail. Dangling else is the classic nesting trap. An else binds to the nearest unmatched if, not to the one you happened to indent. Braces remove the doubt. Conditions should be comparisons such as n > 0 or n == 0. Writing if (n = 0) assigns zero and then treats the result as false. That is a logic error, not a syntax error. Keep conditions small and name the question you are asking.",
      syntax:
        "if (cond) {\n    /* true path */\n} else {\n    /* false path */\n}\n/* nested */\nif (a > b) {\n    if (a > c) { /* a largest */ }\n}",
      analogy:
        "A night watch checks one door. If it is locked, they walk on (plain if). If it is open they close it, else they log that it was already shut (if-else). A second check inside the open-door path is a nested if: only then do they ask whether the alarm is sounding.",
      introduction:
        "Once expressions have values, you can use those values to pick a path. if and if-else are the decision tools named in this syllabus topic.",
      prerequisiteCheck:
        "You need relational operators such as <, >, == and the idea that zero is false.",
      examples: [
        {
          title: "Pass or fail with if-else",
          problem: "Print PASS if marks are at least 40, otherwise FAIL.",
          steps: [
            "Read or set an int marks.",
            "Test marks >= 40.",
            "Print PASS in the true branch and FAIL in else.",
          ],
          code: `#include <stdio.h>
int main(void) {
    int marks = 38;
    if (marks >= 40) {
        printf("PASS\\n");
    } else {
        printf("FAIL\\n");
    }
    return 0;
}`,
          output: "FAIL",
        },
        {
          title: "Largest of three with nested if",
          problem: "Given a=7, b=12, c=9, print the largest using nested if-else.",
          steps: [
            "Compare a and b first.",
            "If a is larger, compare a with c; else compare b with c.",
            "Print the winner of the inner comparison.",
          ],
          code: `#include <stdio.h>
int main(void) {
    int a = 7, b = 12, c = 9;
    if (a > b) {
        if (a > c) printf("%d\\n", a);
        else printf("%d\\n", c);
    } else {
        if (b > c) printf("%d\\n", b);
        else printf("%d\\n", c);
    }
    return 0;
}`,
          output: "12",
        },
      ],
      trace: {
        prompt: "int n = 0; if (n) printf(\"A\"); else printf(\"B\"); What prints?",
        answer: "B",
      },
      predict: {
        prompt: "int x = 5; if (x > 0) if (x < 3) printf(\"S\"); else printf(\"T\"); What prints?",
        answer: "T",
      },
      mistakes: [
        { wrong: "if (n = 5) compares n with 5.", why: "A single = assigns. The condition becomes 5, which is true, and n is changed." },
        { wrong: "An else always belongs to the first if you wrote.", why: "An else binds to the nearest unmatched if. Use braces to match the if you intend." },
        { wrong: "Two statements after if without braces both belong to the if.", why: "Only the immediately following statement is controlled. The second always runs." },
      ],
      checks: [
        { q: "What values are treated as true in an if condition?", a: "any non-zero value" },
        { q: "Can both the if body and the else body run in one evaluation?", a: "no" },
        { q: "Why write braces around an if body?", a: "to attach more than one statement, and to avoid dangling else" },
      ],
      guided: {
        task: "Write a program that reads one integer and prints POSITIVE, NEGATIVE, or ZERO using nested if-else.",
        hint: "First test n > 0. In the else branch, test n < 0 versus the remaining zero case.",
      },
      independent: {
        task: "Write a nested if-else program that prints the smallest of three integers stored in variables. Include a comment that names which comparison happens first.",
      },
      flashcards: [
        { front: "What does if test?", back: "Whether an expression is non-zero (true) or zero (false)." },
        { front: "What does else add?", back: "A path that runs only when the if condition is false." },
        { front: "What is a nested if?", back: "An if written inside another if or else body." },
        { front: "Why braces?", back: "They turn several statements into one body and fix dangling else." },
        { front: "if (n = 0) — what happens?", back: "n becomes 0 and the condition is false." },
        { front: "Can if and else both run?", back: "No. Exactly one path runs." },
        { front: "Zero in a condition means?", back: "false" },
      ],
      concepts: [
        {
          prompt: "Is a missing else an error?",
          explanation: "No. A plain if is a one-way door. If the condition is false, C just skips the body.",
        },
        {
          prompt: "Why is dangling else a problem?",
          explanation: "Indentation is for humans. The compiler pairs else with the nearest unmatched if, which may not be the outer one you meant.",
        },
      ],
      quickNotes: [
        "Non-zero is true; zero is false.",
        "if-else picks exactly one of two paths.",
        "Braces group a multi-statement body.",
        "else pairs with the nearest unmatched if.",
        "Use == to compare; = assigns.",
        "Nest only when the inner question depends on the outer answer.",
      ],
      distinctions: [
        "A lone if may skip work. if-else always takes one of two named paths.",
        "Nested if is another decision inside a path, not a new kind of keyword.",
      ],
      examShort: [
        "Write the skeleton of if-else.",
        "What is a nested if?",
        "What is the dangling else problem?",
      ],
      examLong:
        "The if statement evaluates a condition. A non-zero result is true and the following statement or block runs. Adding else gives a second path that runs only when the condition is false, so exactly one path executes. When several statements must belong to a path, they are placed in braces. A nested if-else places another condition inside a branch, which is useful when a later question only makes sense after an earlier answer. Care is needed with pairing: an else binds to the nearest unmatched if. Using braces and == rather than = keeps the decision aligned with the intended question.",
      visualizerIds: ["control-flow", "flowchart"],
      relatedTopicIds: ["u2-t1", "u2-t3", "u2-t4"],
      assessment: [
        { family: "trace", method: "trace", prompt: "int n=4; if (n%2==0) printf(\"E\"); else printf(\"O\"); Output?", answer: "E", marks: 2, explanation: "4 is even." },
        { family: "debug", method: "identify_error", prompt: "if (x = 10) printf(\"yes\"); What is the likely mistake?", answer: "assignment used instead of comparison", marks: 2, explanation: "= assigns 10, which is true." },
        { family: "concept", method: "concept", prompt: "If the if condition is false and there is no else, what runs?", answer: "nothing from that if", marks: 1, explanation: "The body is skipped." },
        { family: "syntax", method: "mcq", prompt: "Which wraps several statements as one if body?", answer: "{ }", marks: 1, explanation: "A compound statement." },
      ],
    },
    {
      topicId: "u2-t3",
      unitId: "unit-2",
      lessonId: "u2-t3-else-if-switch",
      title: "else-if ladder and switch statements with Examples",
      sourceLabel: "Conditional Statements: else-if ladder and switch statements with Examples.",
      objectives: [
        "Build an else-if ladder that tests conditions in order and stops at the first match.",
        "Write a switch on an integer expression with case labels and a default.",
        "Explain why most cases need break, and what happens if break is omitted.",
        "Choose else-if versus switch for a given kind of question.",
      ],
      beginner:
        "Sometimes you have more than two answers. An else-if ladder asks question one, then question two, then question three, and stops at the first yes. A switch is a jump table for an integer (or character) value: case 1, case 2, default. After a matching case, C keeps running into the next cases unless you write break.",
      formal:
        "An else-if ladder is a chain of if statements in which each else attaches the next test. switch evaluates an integer controlling expression and transfers to the matching case label. Execution then falls through subsequent cases until break, return, or the end of the switch. default handles unmatched values.",
      terms: [
        { term: "else-if ladder", meaning: "A chain if / else if / else if / else that tests conditions in order." },
        { term: "switch", meaning: "A selection statement that jumps to a case matching an integer expression." },
        { term: "case", meaning: "A label for one constant value inside a switch." },
        { term: "default", meaning: "The label used when no case matches." },
        { term: "fall through", meaning: "Continuing into the next case because break was not written." },
      ],
      explanation:
        "Two-way if-else is not enough when a mark band, a menu, or a day number has many buckets. The else-if ladder tests conditions from the top. The first true condition owns the path; later tests are not asked. That order matters. If you test marks >= 40 before marks >= 75, a score of 80 already matched the weaker test and never reaches distinction. Put the tightest or most specific tests first when ranges overlap. switch is the other syllabus tool. You switch on an integer expression — typically an int or a char, which is a small integer. Each case presents a constant. C jumps to that label. After the matching statements you almost always write break so control leaves the switch. If you forget break, execution falls through into the next case. Sometimes that is intended, for example grouping case 'a': case 'A': before shared work. Usually it is a bug. default is optional but useful for unexpected values. switch cannot replace every ladder: case labels must be constant integers, not ranges such as n > 10, and not floating values. Use a ladder for inequalities and a switch for a discrete set of constants.",
      syntax:
        "if (c1) { }\nelse if (c2) { }\nelse { }\n\nswitch (n) {\n    case 1: /* ... */ break;\n    case 2: /* ... */ break;\n    default: /* ... */ break;\n}",
      analogy:
        "An else-if ladder is a receptionist asking the first matching question on a list and then stopping. A switch is a bank of numbered pigeonholes: you open the hole whose number matches, and if you do not close the flap (break) you spill into the next hole.",
      introduction:
        "This topic extends if-else to many alternatives: a chained ladder, and switch for discrete integer choices.",
      prerequisiteCheck:
        "You should be able to write if-else and compare integers with ==, <, and >.",
      examples: [
        {
          title: "Grade bands with an else-if ladder",
          problem: "Map marks 82 to a letter: 75+ D, 60+ C, 40+ P, else F. Order the tests correctly.",
          steps: [
            "Test the highest band first: marks >= 75.",
            "Then 60, then 40, then else.",
            "82 matches the first test and prints D.",
          ],
          code: `#include <stdio.h>
int main(void) {
    int marks = 82;
    if (marks >= 75) printf("D\\n");
    else if (marks >= 60) printf("C\\n");
    else if (marks >= 40) printf("P\\n");
    else printf("F\\n");
    return 0;
}`,
          output: "D",
        },
        {
          title: "Menu with switch and break",
          problem: "choice is 2. Print the matching drink name. Include default.",
          steps: [
            "switch on choice.",
            "Write a case for 1, 2, and 3, each ending with break.",
            "default covers any other integer.",
          ],
          code: `#include <stdio.h>
int main(void) {
    int choice = 2;
    switch (choice) {
        case 1: printf("tea\\n"); break;
        case 2: printf("coffee\\n"); break;
        case 3: printf("water\\n"); break;
        default: printf("unknown\\n"); break;
    }
    return 0;
}`,
          output: "coffee",
        },
      ],
      trace: {
        prompt: "int n=2; switch(n){ case 1: printf(\"A\"); case 2: printf(\"B\"); case 3: printf(\"C\"); break; } What prints?",
        answer: "BC",
      },
      predict: {
        prompt: "int m=55; if(m>=75) printf(\"D\"); else if(m>=40) printf(\"P\"); else printf(\"F\"); Output?",
        answer: "P",
      },
      mistakes: [
        { wrong: "In a switch, after a matching case C jumps out automatically.", why: "C falls through into later cases until break or the closing brace." },
        { wrong: "You can write case n > 10 in a switch.", why: "case labels must be constant integer values, not relational expressions." },
        { wrong: "In a ladder, test order never matters.", why: "The first true condition wins. Overlapping ranges must be ordered from specific to general." },
      ],
      checks: [
        { q: "What keyword stops fall through in a switch?", a: "break" },
        { q: "When is default used?", a: "when no case matches" },
        { q: "Why put marks >= 75 before marks >= 40?", a: "so a high score is not caught by the weaker test" },
      ],
      guided: {
        task: "Write a switch on a char op that is '+', '-', '*', or '/' and prints the name of the operation. Use default for anything else.",
        hint: "char is an integer type, so case '+': is valid. Put break after each case.",
      },
      independent: {
        task: "Rewrite a four-band grade printer twice: once as an else-if ladder and once as a switch on marks/10 (integer division). Comment why the switch version uses a quotient.",
      },
      flashcards: [
        { front: "What is an else-if ladder?", back: "A chain of if / else if / else tests tried in order." },
        { front: "What type may switch test?", back: "An integer type, commonly int or char." },
        { front: "What does break do in a switch?", back: "Leaves the switch so later cases do not run." },
        { front: "What is fall through?", back: "Running into the next case because break is missing." },
        { front: "What is default?", back: "The path when no case matches." },
        { front: "Can case use a range like n > 5?", back: "No. Labels are constant integers." },
        { front: "First true else-if wins?", back: "Yes. Later tests are skipped." },
      ],
      concepts: [
        {
          prompt: "When is switch a poor fit?",
          explanation: "When the decision depends on ranges or floating values. Those need a ladder of relational tests.",
        },
        {
          prompt: "Is fall through always a bug?",
          explanation: "No. Grouping case 'a': case 'A': before shared code is intentional. Uncommented fall through is usually accidental.",
        },
      ],
      quickNotes: [
        "A ladder stops at the first true condition.",
        "Order overlapping tests from specific to general.",
        "switch jumps to a matching integer case.",
        "Write break unless you want fall through.",
        "default handles unmatched values.",
        "case labels are constants, not conditions.",
      ],
      distinctions: [
        "else-if can test any condition, including ranges. switch matches constant integer labels.",
        "Missing break is fall through. A ladder never falls into the next else if after a match.",
      ],
      examShort: [
        "Write a four-level else-if ladder skeleton.",
        "What happens if break is omitted in a switch?",
        "When do you prefer switch over else-if?",
      ],
      examLong:
        "An else-if ladder chains conditions so that the first true test selects a path and the remaining tests are skipped. Overlapping ranges must be ordered carefully, usually from the most specific test to the most general, with a final else for everything left. A switch statement evaluates an integer expression and transfers control to the matching case label. Execution then continues sequentially, including into later cases, until a break, a return, or the end of the switch. default covers values that match no case. switch is suitable for a discrete set of constants; inequalities and floating tests belong in a ladder.",
      visualizerIds: ["control-flow", "flowchart", "syntax"],
      relatedTopicIds: ["u2-t2", "u2-t4"],
      assessment: [
        { family: "trace", method: "trace", prompt: "switch(1){ case 1: printf(\"X\"); case 2: printf(\"Y\"); break; } Output?", answer: "XY", marks: 2, explanation: "No break after case 1." },
        { family: "predict", method: "predict", prompt: "marks=60; if(marks>=75) D; else if(marks>=60) C; else P; Letter?", answer: "C", marks: 2, explanation: "Second test matches." },
        { family: "concept", method: "concept", prompt: "Can a case label be a variable?", answer: "no", marks: 1, explanation: "Labels must be integer constants." },
        { family: "algorithm", method: "algorithm", prompt: "List the order of tests for bands 75, 60, 40, fail.", answer: ">=75 then >=60 then >=40 then else", marks: 2, explanation: "Specific bands first." },
      ],
    },
    {
      topicId: "u2-t4",
      unitId: "unit-2",
      lessonId: "u2-t4-break-continue-goto",
      title: "break, continue and goto",
      sourceLabel: "Unconditional Statements: break, continue and goto.",
      objectives: [
        "State that break leaves the innermost switch or loop immediately.",
        "State that continue skips the rest of the current loop iteration.",
        "Describe goto as an unconditional jump to a label in the same function.",
        "Explain why goto is usually avoided in structured programs.",
      ],
      beginner:
        "These three statements do not ask a question; they jump. break means stop this loop or switch now. continue means skip the leftover work in this round of a loop and go to the next test or increment. goto flies to a named label. It is legal C, but it makes the path hard to follow, so we almost never use it in new code.",
      formal:
        "break terminates the innermost enclosing switch or iteration statement. continue ends the current iteration of the innermost loop and proceeds with the loop's next iteration (re-testing while/do-while, or the increment then test of for). goto transfers control to a label in the same function. Crossing initialisation of a variable with goto is restricted.",
      terms: [
        { term: "break", meaning: "Leaves the innermost loop or switch immediately." },
        { term: "continue", meaning: "Skips the remaining statements of the current loop iteration." },
        { term: "goto", meaning: "Jumps to a label in the same function." },
        { term: "label", meaning: "An identifier followed by a colon that marks a goto target." },
        { term: "unconditional", meaning: "The jump happens without testing a condition at the jump itself." },
      ],
      explanation:
        "Unit 2 lists break, continue, and goto as unconditional statements. They transfer control without asking a new question at the jump. break already appeared inside switch. In a loop, break means the loop is finished: control goes to the statement after the loop, not to the next iteration. That is useful when you search an array and can stop at the first hit. continue does not finish the loop. It only abandons the rest of this pass. In a while or do-while, the next step is to test the condition again. In a for loop, C still runs the increment, then the test. That difference matters if you increment a counter only in the body of a while: a continue can skip the increment and lock the loop. goto name; jumps to name: in the same function. The language allows it. Structured programming prefers if, loops, and return because each block has one entrance and a clear exit. goto can jump over cleanup, skip initialisation, or create spaghetti paths that are hard to test. A rare accepted use is jumping to a shared error label at the end of a function when many checks can fail. For this course, know the syntax, know that it exists, and prefer break, continue, return, and ordinary conditions.",
      syntax:
        "break;\ncontinue;\nlabel_name:\n    /* ... */\ngoto label_name;",
      analogy:
        "break is leaving the ride entirely. continue is skipping the photo booth on this lap but staying in the queue for another lap. goto is teleporting to a named booth, which works but makes the park map a mess.",
      introduction:
        "After decisions, the syllabus names three jumps that do not themselves test a condition: break, continue, and goto.",
      prerequisiteCheck:
        "You should know if, switch, and that loops repeat a body (while and for appear next; a simple counter loop is enough here).",
      examples: [
        {
          title: "break stops a search loop",
          problem: "Walk i from 1 to 5 and stop when i is 3. Print i each time including 3, then print done.",
          steps: [
            "Use a for loop from 1 through 5.",
            "Print i, then if i == 3 call break.",
            "After the loop print done. 4 and 5 never run.",
          ],
          code: `#include <stdio.h>
int main(void) {
    int i;
    for (i = 1; i <= 5; i++) {
        printf("%d \", i);
        if (i == 3) break;
    }
    printf("done\\n");
    return 0;
}`,
          output: "1 2 3 done",
        },
        {
          title: "continue skips even numbers",
          problem: "Print odd values from 1 to 5 using continue on evens.",
          steps: [
            "Loop i from 1 to 5.",
            "If i is even, continue.",
            "Otherwise print i.",
          ],
          code: `#include <stdio.h>
int main(void) {
    int i;
    for (i = 1; i <= 5; i++) {
        if (i % 2 == 0) continue;
        printf("%d \", i);
    }
    printf("\\n");
    return 0;
}`,
          output: "1 3 5",
        },
      ],
      trace: {
        prompt: "int i; for(i=0;i<4;i++){ if(i==1) continue; if(i==3) break; printf(\"%d\", i); } What prints?",
        answer: "02",
      },
      predict: {
        prompt: "Does break inside a switch that sits inside a loop exit only the switch, or the loop too?",
        answer: "only the innermost switch",
      },
      mistakes: [
        { wrong: "continue ends the whole loop.", why: "continue ends only the current iteration. The loop can still run again." },
        { wrong: "break always exits the function.", why: "break exits the innermost loop or switch, not main and not every brace level." },
        { wrong: "goto is required for every early exit.", why: "return, break, and structured ifs cover ordinary early exits. goto is rarely needed." },
      ],
      checks: [
        { q: "What does break do in a for loop?", a: "leaves the loop immediately" },
        { q: "After continue in a for loop, what still runs before the next test?", a: "the increment" },
        { q: "Must a goto label be in the same function?", a: "yes" },
      ],
      guided: {
        task: "Write a while loop that reads integers until the user enters 0, but use continue to ignore negative values so they are not printed.",
        hint: "If n < 0, continue. If n == 0, break. Otherwise print n.",
      },
      independent: {
        task: "Write one small program that uses break to stop at the first multiple of 7 in 1..20, and comment why you did not use goto for that exit.",
      },
      flashcards: [
        { front: "break in a loop?", back: "Leave the innermost loop now." },
        { front: "break in a switch?", back: "Leave the switch so later cases do not run." },
        { front: "continue?", back: "Skip the rest of this iteration; the loop may continue." },
        { front: "for + continue does what extra?", back: "Still performs the increment, then the test." },
        { front: "goto target?", back: "A label in the same function." },
        { front: "Why avoid goto?", back: "Paths become hard to follow and can skip initialisation or cleanup." },
        { front: "Is goto illegal in C?", back: "No. It is legal but usually poor structure." },
      ],
      concepts: [
        {
          prompt: "Does break exit two nested loops at once?",
          explanation: "No. It exits only the innermost loop or switch. A flag or a redesign is needed to leave both.",
        },
        {
          prompt: "Why can continue in while be dangerous?",
          explanation: "If the loop variable is updated only at the end of the body, continue skips that update and the condition may never change.",
        },
      ],
      quickNotes: [
        "break leaves the innermost loop or switch.",
        "continue skips the rest of the current iteration.",
        "for still increments after continue.",
        "goto jumps to a same-function label.",
        "Prefer structured exits over goto.",
        "These jumps are unconditional at the point of the statement.",
      ],
      distinctions: [
        "break finishes the loop. continue only finishes this pass.",
        "goto is a free jump to a label. break and continue have fixed, local targets.",
      ],
      examShort: [
        "Difference between break and continue.",
        "Where may break appear?",
        "Why is goto discouraged?",
      ],
      examLong:
        "break, continue, and goto transfer control without evaluating a new condition at the jump. break terminates the innermost enclosing loop or switch and continues after that construct. continue ends the current iteration of the innermost loop: while and do-while re-test the condition; for performs its increment and then re-tests. goto transfers control to a label in the same function. Although legal, goto is usually avoided because it can skip initialisation, tangle paths, and hide the structure of a function. Ordinary programs should exit early with return, break, or a clear condition instead.",
      visualizerIds: ["control-flow", "flowchart"],
      relatedTopicIds: ["u2-t3", "u2-t5", "u2-t6"],
      assessment: [
        { family: "concept", method: "concept", prompt: "Does continue terminate the whole loop?", answer: "no", marks: 1, explanation: "It skips the rest of this iteration." },
        { family: "trace", method: "trace", prompt: "for(i=1;i<=3;i++){ if(i==2) break; printf(\"%d\", i);} Output?", answer: "1", marks: 2, explanation: "Loop stops at i==2 before printing 2." },
        { family: "debug", method: "identify_error", prompt: "while(i<10){ if(i%2==0) continue; printf(\"%d\", i); } i never changes. What goes wrong?", answer: "continue skips the increment so the loop may never end", marks: 2, explanation: "Update i before continue or in the condition path." },
        { family: "short_answer", method: "definition", prompt: "What is goto?", answer: "unconditional jump to a label in the same function", marks: 2, explanation: "Same-function label target." },
      ],
    },
    {
      topicId: "u2-t5",
      unitId: "unit-2",
      lessonId: "u2-t5-while-do-while",
      title: "while, do-while",
      sourceLabel: "Control Structures: while, do-while.",
      objectives: [
        "Write a while loop that tests before the body and may run zero times.",
        "Write a do-while loop that runs the body at least once, then tests.",
        "Update the loop variable so the condition can become false.",
        "Trace both loops with the same starting value and compare the number of body runs.",
      ],
      beginner:
        "A while loop asks first, then works. If the answer is already no, the body never runs. A do-while loop works first, then asks. That means the body always runs at least once. Both need a way for the condition to change, or they never stop.",
      formal:
        "while (expression) statement repeatedly evaluates the expression and executes the statement while the expression is non-zero. do statement while (expression); executes the statement, then tests. The do-while body therefore executes one or more times if control reaches the loop.",
      terms: [
        { term: "while", meaning: "A pre-test loop: the condition is checked before each body execution." },
        { term: "do-while", meaning: "A post-test loop: the body runs, then the condition is checked." },
        { term: "iteration", meaning: "One execution of the loop body." },
        { term: "loop variable", meaning: "A value that changes and is used in the loop condition." },
        { term: "infinite loop", meaning: "A loop whose condition never becomes false." },
      ],
      explanation:
        "Loops repeat work. while is the pre-test form. C evaluates the condition. If it is false (zero) at the start, the body is skipped completely. If it is true, the body runs, then C tests again. That is why a search that has nothing to do can finish without dummy work. do-while is the post-test form. The body runs once, then the while (condition); is checked. Menu programs often use do-while: show the menu at least once, then ask whether to repeat. Both forms need progress. If you write while (n < 10) and never change n, the condition stays true and the program hangs. The update can live in the body or, less often, inside the condition itself. Semicolons matter. A stray semicolon after while (n < 10); is an empty loop that already finished before your intended body. do-while requires a semicolon after the final while (condition). Confusing the two is a compile error or an empty-body bug. Zero is still false. while (n) keeps going until n becomes 0. Choose while when zero trips are allowed. Choose do-while when one trip is required.",
      syntax:
        "while (cond) {\n    /* body */\n}\n\ndo {\n    /* body */\n} while (cond);",
      analogy:
        "while is looking both ways before you step onto a moving walkway — if it is closed you never step. do-while is stepping on once, then checking whether to ride again.",
      introduction:
        "Control structures in this topic are the two while-family loops: test-first and test-after.",
      prerequisiteCheck:
        "You should know that a condition is true when it is non-zero, and you should be able to update an int with ++ or +=.",
      examples: [
        {
          title: "Count up with while",
          problem: "Print 1 2 3 using while.",
          steps: [
            "Set i = 1.",
            "While i <= 3, print i and increment i.",
            "When i becomes 4 the condition fails and the loop ends.",
          ],
          code: `#include <stdio.h>
int main(void) {
    int i = 1;
    while (i <= 3) {
        printf("%d \", i);
        i++;
    }
    printf("\\n");
    return 0;
}`,
          output: "1 2 3",
        },
        {
          title: "do-while runs once even when false afterward",
          problem: "Start n at 5. Loop while n < 5. Compare while versus do-while.",
          steps: [
            "A while (n < 5) body does not run because 5 < 5 is false.",
            "A do-while body prints once, then tests 5 < 5 and stops.",
            "This is the essential difference: zero times versus one time.",
          ],
          code: `#include <stdio.h>
int main(void) {
    int n = 5;
    do {
        printf("body\\n");
        n++;
    } while (n < 5);
    return 0;
}`,
          output: "body",
        },
      ],
      trace: {
        prompt: "int n=3; while(n){ printf(\"%d\", n); n--; } What prints?",
        answer: "321",
      },
      predict: {
        prompt: "int x=0; do { x++; } while (x < 0); What is x?",
        answer: "1",
      },
      mistakes: [
        { wrong: "while and do-while always run the same number of times.", why: "If the condition starts false, while runs zero times and do-while still runs once." },
        { wrong: "while (n < 10); { n++; } increments inside the loop.", why: "The semicolon ends an empty loop. The braces are a separate block after the loop." },
        { wrong: "You can omit the semicolon after do-while's condition.", why: "The grammar requires while (cond); at the end of do-while." },
      ],
      checks: [
        { q: "Which loop can run zero times?", a: "while" },
        { q: "Which loop always runs at least once if reached?", a: "do-while" },
        { q: "What is needed to avoid an infinite loop?", a: "a change that can make the condition false" },
      ],
      guided: {
        task: "Write a do-while that reads integers and adds them to a sum until the user enters 0. Print the sum.",
        hint: "Read inside the loop so the first value is accepted, then stop when the value is 0 without adding that 0 if you prefer a clean sum.",
      },
      independent: {
        task: "Write two programs that print a countdown from 5 to 1: one while, one do-while. Then change the start to 0 and write what each program does.",
      },
      flashcards: [
        { front: "while tests when?", back: "Before the body, every time including the first." },
        { front: "do-while tests when?", back: "After the body." },
        { front: "Minimum while iterations if condition starts false?", back: "0" },
        { front: "Minimum do-while iterations if reached?", back: "1" },
        { front: "while (n < 10); danger?", back: "Empty body; the following block is not the loop." },
        { front: "do-while ends with?", back: "while (condition);" },
        { front: "Infinite loop?", back: "Condition never becomes false." },
      ],
      concepts: [
        {
          prompt: "When is do-while the better fit?",
          explanation: "When the body must run once to produce the value you then test, such as showing a menu or reading the first input.",
        },
        {
          prompt: "Is while (1) legal?",
          explanation: "Yes. 1 is always true. You then need break, return, or an exit to stop. It is an intentional infinite loop.",
        },
      ],
      quickNotes: [
        "while is a pre-test loop.",
        "do-while is a post-test loop.",
        "while may run zero times.",
        "do-while runs at least once.",
        "Always update something the condition uses.",
        "Watch for a stray semicolon after while (cond).",
      ],
      distinctions: [
        "while asks first. do-while works first.",
        "An empty while (cond); is a finished loop, not a syntax mark you can ignore.",
      ],
      examShort: [
        "Difference between while and do-while.",
        "Write a while that prints 1 to 5.",
        "Why must the loop variable change?",
      ],
      examLong:
        "while is a pre-test loop. The controlling expression is evaluated before the body. If it is zero at the start, the body never runs. After each execution the expression is tested again. do-while is a post-test loop. The body executes, then the expression is tested, so the body runs at least once when the loop is reached. Both forms repeat while the expression is non-zero and require that some value involved in the condition can change, otherwise the loop does not terminate. A semicolon immediately after while (cond) creates an empty loop. do-while requires a semicolon after the final while (cond).",
      visualizerIds: ["control-flow", "flowchart"],
      relatedTopicIds: ["u2-t4", "u2-t6"],
      assessment: [
        { family: "predict", method: "predict", prompt: "int n=0; while(n<0){ n++; } Value of n?", answer: "0", marks: 2, explanation: "Body never runs." },
        { family: "trace", method: "trace", prompt: "int i=2; do { printf(\"%d\", i); i--; } while(i>0); Output?", answer: "21", marks: 2, explanation: "Prints 2, then 1, then 0 fails the test." },
        { family: "syntax", method: "identify_error", prompt: "do { n--; } while (n > 0)  // missing what?", answer: "semicolon after while (n > 0)", marks: 1, explanation: "do-while ends with ;" },
        { family: "concept", method: "concept", prompt: "Which loop is pre-test?", answer: "while", marks: 1, explanation: "Condition before body." },
      ],
    },
    {
      topicId: "u2-t6",
      unitId: "unit-2",
      lessonId: "u2-t6-for",
      title: "for and its examples",
      sourceLabel: "Control Structures: for and its examples.",
      objectives: [
        "Write a for loop with initialisation, condition, and increment in the header.",
        "Trace the order: init once, then test, body, increment, test again.",
        "Leave a header clause empty only when that work is done elsewhere.",
        "Compare for with while for a counted loop.",
      ],
      beginner:
        "A for loop packs the three usual loop jobs into one line: start a counter, ask whether to keep going, and move the counter. The start happens once. Then C asks, works, moves, asks, works, moves, until the question is no.",
      formal:
        "for (clause1; expression2; expression3) statement. clause1 is evaluated once. Then, while expression2 is non-zero (missing expression2 is treated as true), the statement runs and expression3 is evaluated. Any of the three parts may be omitted. continue still evaluates expression3.",
      terms: [
        { term: "initialisation", meaning: "The first for-header clause, run once before the first test." },
        { term: "condition", meaning: "The middle clause; the loop continues while it is non-zero." },
        { term: "increment", meaning: "The third clause, run after each body, including after continue." },
        { term: "counted loop", meaning: "A loop that repeats a known number of times using a counter." },
        { term: "omitted clause", meaning: "An empty header part, written as a leftover semicolon." },
      ],
      explanation:
        "The syllabus for-loop is the everyday counted loop. The header has three parts separated by semicolons: for (i = 1; i <= n; i++). Initialisation runs once. Then the condition is tested. If it is false, the body never runs, just like while. If it is true, the body runs, then the increment runs, then the test repeats. That order is the whole story. People sometimes think the increment happens at the start; it does not. continue is special: it still runs the increment, then the test, so a for-loop counter does not freeze the way a forgotten while update can. You may declare the counter in the header in C99 (for (int i = 0; i < n; i++)), which limits i to the loop. Older style declares i before the loop. Any clause can be empty. for (;;) is an infinite loop, the same idea as while (1). for (; i < n; i++) uses an i that was already set. Cramming extra work into the increment with the comma operator is legal but easy to misread; keep the header to start, test, and step unless you have a clear reason. A for loop is not a different machine from while. It is a clearer shape when you know the start, the stop test, and the step.",
      syntax:
        "for (init; cond; step) {\n    /* body */\n}\n/* example */\nfor (i = 0; i < n; i++) { }",
      analogy:
        "for is a gym machine with three stickers on the frame: set the pin (init), check the chart (condition), move the pin one hole (increment). You set the pin once. After each set of reps you move the pin, then check the chart again.",
      introduction:
        "for is the third control structure in this unit: a compact counted loop used in almost every later array topic.",
      prerequisiteCheck:
        "You should understand while, and that i++ increases an integer after using it in the increment clause.",
      examples: [
        {
          title: "Print a table of squares",
          problem: "Print i and i*i for i from 1 to 4.",
          steps: [
            "Initialise i to 1 once.",
            "Loop while i <= 4, printing i and i*i.",
            "Increment i after each print.",
          ],
          code: `#include <stdio.h>
int main(void) {
    int i;
    for (i = 1; i <= 4; i++) {
        printf("%d %d\\n", i, i * i);
    }
    return 0;
}`,
          output: "1 1\n2 4\n3 9\n4 16",
        },
        {
          title: "Sum with for",
          problem: "Add 1 through 5 into sum using a for loop.",
          steps: [
            "Set sum = 0 before the loop.",
            "for i from 1 to 5, add i to sum.",
            "After the loop sum is 15.",
          ],
          code: `#include <stdio.h>
int main(void) {
    int i, sum = 0;
    for (i = 1; i <= 5; i++) {
        sum = sum + i;
    }
    printf("%d\\n", sum);
    return 0;
}`,
          output: "15",
        },
      ],
      trace: {
        prompt: "int s=0,i; for(i=0;i<3;i++) s=s+i; What are s and i after the loop?",
        answer: "s=3 i=3",
      },
      predict: {
        prompt: "int i; for(i=5;i<5;i++) printf(\"X\"); How many X?",
        answer: "0",
      },
      mistakes: [
        { wrong: "The increment runs before the first body.", why: "Init runs, then test, then body, then increment." },
        { wrong: "for (i = 0, i < n, i++) is correct punctuation.", why: "The three parts are separated by semicolons, not commas." },
        { wrong: "continue in for skips the increment.", why: "The increment still runs after continue, then the condition is tested." },
      ],
      checks: [
        { q: "How many times does init run?", a: "once" },
        { q: "What punctuation separates the three for clauses?", a: "semicolons" },
        { q: "Does a false first test still run the body?", a: "no" },
      ],
      guided: {
        task: "Write a for loop that prints the even numbers from 2 to 10 inclusive.",
        hint: "Start i at 2, test i <= 10, and step i += 2.",
      },
      independent: {
        task: "Write a for loop that computes n! for a positive int n (product 1*2*...*n) and print the product. Comment the init, test, and step.",
      },
      flashcards: [
        { front: "Three for clauses?", back: "initialisation, condition, increment." },
        { front: "When does init run?", back: "Once, before the first test." },
        { front: "When does increment run?", back: "After each body, and also after continue." },
        { front: "Separators in the header?", back: "Semicolons." },
        { front: "for (;;) means?", back: "Infinite loop (missing condition is true)." },
        { front: "for vs while?", back: "Same power; for gathers start, test, and step in the header." },
        { front: "First test false?", back: "Body never runs." },
      ],
      concepts: [
        {
          prompt: "Is for a different kind of repetition from while?",
          explanation: "No. It is another syntax for the same idea. Use for when the counter's start, test, and step read well in one place.",
        },
        {
          prompt: "Why does continue not freeze a for counter?",
          explanation: "The increment clause still runs. That is different from a while whose only i++ sits after a continue.",
        },
      ],
      quickNotes: [
        "for (init; cond; step) body.",
        "Init once, then test-body-step-test.",
        "Semicolons separate the clauses.",
        "False first test means zero iterations.",
        "continue still runs the step.",
        "for is the usual counted loop for arrays later.",
      ],
      distinctions: [
        "Commas can appear inside a clause (comma operator). Semicolons separate the three clauses.",
        "for is not faster than while by language rule; it is a clearer counted shape.",
      ],
      examShort: [
        "Write a for loop that prints 1 to n.",
        "List the order of init, test, body, and increment.",
        "What does an omitted condition mean?",
      ],
      examLong:
        "A for loop writes the usual loop bookkeeping in one header: for (initialisation; condition; increment). Initialisation is evaluated once. The condition is then tested; a zero result means the body is skipped entirely. When the condition is non-zero the body runs, the increment is evaluated, and the condition is tested again. continue still evaluates the increment. The three clauses are separated by semicolons and any clause may be empty. A missing condition is treated as true, so for (;;) repeats until break or return. for and while are equally powerful; for is the natural form when a counter's start, stop test, and step belong together.",
      visualizerIds: ["control-flow", "flowchart", "syntax"],
      relatedTopicIds: ["u2-t5", "u3-t1"],
      assessment: [
        { family: "trace", method: "trace", prompt: "int i; for(i=1;i<=3;i++) printf(\"%d\", i); Output?", answer: "123", marks: 2, explanation: "i is 1,2,3." },
        { family: "syntax", method: "identify_error", prompt: "for (i = 0, i < n, i++) What is wrong?", answer: "commas used instead of semicolons", marks: 2, explanation: "Header parts need ;" },
        { family: "concept", method: "concept", prompt: "How many times does the increment run if the body runs 4 times and there is no break?", answer: "4", marks: 1, explanation: "Once after each body." },
        { family: "algorithm", method: "algorithm", prompt: "Write the four-step cycle after init for a normal for loop.", answer: "test, body, increment, test", marks: 2, explanation: "Repeat until test fails." },
      ],
    },
  ];
}
