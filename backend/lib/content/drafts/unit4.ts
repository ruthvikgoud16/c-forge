import type { TopicDraft } from "../compile";

export function unit4Drafts(): TopicDraft[] {
  return [
    {
      topicId: "u4-t1",
      unitId: "unit-4",
      lessonId: "u4-t1-storage-classes",
      title: "Storage Classes: auto, static, register and extern",
      sourceLabel: "Storage Classes: auto, static, register and extern with suitable examples.",
      objectives: [
        "State that auto is the default for block-scope variables and that they die when the block ends.",
        "Contrast static local variables, which keep their value between calls.",
        "Describe register as a hint that a variable will be used heavily (the compiler may ignore it).",
        "Describe extern as a declaration that a name is defined in another file (or later in this file).",
      ],
      beginner:
        "A storage class answers three quiet questions: where does this name live, how long does it last, and who else can see it? auto locals are born when you enter a block and vanish when you leave. static locals remember the last value the next time you come back. register is a request to keep a hot variable handy. extern says the real object is defined somewhere else.",
      formal:
        "auto specifies automatic storage duration at block scope (this is the default for local objects). static at block scope gives static storage duration and internal persistence across calls; at file scope it gives internal linkage. register is a storage-class hint; taking the address of a register variable is not allowed if the hint is honoured. extern declares a name with external linkage without defining the object in this place.",
      terms: [
        { term: "auto", meaning: "Default local storage: created on entry to the block, destroyed on exit." },
        { term: "static (local)", meaning: "The variable keeps its last value between function calls." },
        { term: "register", meaning: "A hint that the variable will be used often; you must not take its address if it truly is register." },
        { term: "extern", meaning: "A declaration that the object or function is defined elsewhere." },
        { term: "storage duration", meaning: "How long the object exists: automatic, static, or allocated." },
      ],
      explanation:
        "C names have a storage class, even when you do not write one. Inside a function, int x; is an auto variable. It is created when the block is entered and forgotten when the block ends. The next call does not see the old x. That is why a local counter that is not static cannot count how many times a function was called. Write static int count = 0; inside the function and count lives for the whole program run. The initialiser runs only once. Each call can do count++ and the value remains. File-scope static int hidden; is a different use of the same keyword: the name is not exported to other .c files. register int i; asks the compiler to keep i in a fast place. Modern compilers already assign registers, so the keyword is mostly historical. If a variable is register, you cannot apply & to it. extern int total; does not create total. It promises that some other translation unit (or a later definition) defines int total; so this file may use the name. Two files should not both define the same object without care; one definition, many extern declarations. Do not treat these four words as four data types. They are rules for lifetime and visibility sitting in front of a type.",
      syntax:
        "void f(void) {\n    auto int a = 1;     /* same as int a = 1; */\n    static int s = 0;   /* keeps s */\n    register int r = 2;\n}\nextern int shared;      /* declaration */\nint shared = 0;         /* one definition */",
      analogy:
        "auto is a tray you pick up at a cafeteria station and leave on the way out. static local is a locker at that station that still holds your bag next visit. register is asking to keep the tray in your hands, not on a far table. extern is a note that the real locker is in another building.",
      introduction:
        "Unit 4 opens with how long a variable lives and who can see it: auto, static, register, and extern.",
      prerequisiteCheck:
        "You should know local variables inside main or another function, and that a program can have more than one function.",
      examples: [
        {
          title: "static local remembers",
          problem: "Call a function three times. Show a static counter rising 1, 2, 3.",
          steps: [
            "Inside tick, declare static int n = 0;",
            "Increment n and print it each call.",
            "Each call sees the previous n, so the prints are 1 2 3.",
          ],
          code: `#include <stdio.h>
void tick(void) {
    static int n = 0;
    n++;
    printf("%d ", n);
}
int main(void) {
    tick();
    tick();
    tick();
    printf("\\n");
    return 0;
}`,
          output: "1 2 3",
        },
        {
          title: "auto local does not remember",
          problem: "Replace static with a plain int and call three times.",
          steps: [
            "int n = 0; inside the function starts over every call.",
            "Each call prints 1.",
            "That is automatic storage duration.",
          ],
          code: `#include <stdio.h>
void tick(void) {
    int n = 0;
    n++;
    printf("%d ", n);
}
int main(void) {
    tick();
    tick();
    tick();
    printf("\\n");
    return 0;
}`,
          output: "1 1 1",
        },
      ],
      trace: {
        prompt: "static int s = 5; in a function, then s = s + 1; on first call. What is s at the start of the second call?",
        answer: "6",
      },
      predict: {
        prompt: "May you write int *p = &r; if r is register int r?",
        answer: "no (not if it is register)",
      },
      mistakes: [
        { wrong: "static local is reset to 0 on every call.", why: "The initialiser runs once. Later calls see the stored value." },
        { wrong: "extern int x; allocates x.", why: "extern here is a declaration. Some other line must define x." },
        { wrong: "auto is a different type from int.", why: "auto is a storage class. The type is still int." },
      ],
      checks: [
        { q: "What is the default storage class of a local int?", a: "auto" },
        { q: "Which local keeps its value between calls?", a: "static" },
        { q: "Does extern define the object by itself?", a: "no" },
      ],
      guided: {
        task: "Write a function next_id that returns 1, then 2, then 3 on successive calls using a static local.",
        hint: "static int id = 0; then return ++id;",
      },
      independent: {
        task: "In comments, write one sentence each for auto, static local, register, and extern. Then write a tiny two-function program that shows auto forgets and static remembers.",
      },
      flashcards: [
        { front: "auto lifetime?", back: "The block that contains the variable." },
        { front: "static local lifetime?", back: "The whole program run; value kept between calls." },
        { front: "register meaning?", back: "Hint for a heavily used variable; no & if it is register." },
        { front: "extern meaning?", back: "Declared here, defined elsewhere." },
        { front: "Default local class?", back: "auto" },
        { front: "static int n = 0 init runs?", back: "Once." },
        { front: "Is auto a type?", back: "No. It is a storage class." },
      ],
      concepts: [
        {
          prompt: "Why does a non-static local fail as a call counter?",
          explanation: "It is created fresh each call, so it cannot remember the previous count.",
        },
        {
          prompt: "Is file-scope static the same idea as local static?",
          explanation: "Both have static duration, but file-scope static also hides the name from other files (internal linkage).",
        },
      ],
      quickNotes: [
        "auto is the default local: born and gone with the block.",
        "static local keeps its value.",
        "static initialiser runs once.",
        "register is a hint; & is not allowed on a register object.",
        "extern declares; it does not by itself define.",
        "Storage class is not a data type.",
      ],
      distinctions: [
        "auto versus static local is forget versus remember across calls.",
        "extern versus a definition: one names an object that already exists; the other creates it.",
      ],
      examShort: [
        "Four storage classes named in the syllabus.",
        "Difference between auto and static local.",
        "What does extern declare?",
      ],
      examLong:
        "The syllabus storage classes are auto, static, register, and extern. auto is the default for block-scope variables: they have automatic storage duration and are created and destroyed with the block. A static variable inside a function has static storage duration; it is initialised once and retains its value between calls. register is a hint that a variable is heavily used; if the variable is register, its address may not be taken. extern declares a name with external linkage so this file can use an object or function defined elsewhere. These keywords control lifetime and linkage; they are not extra data types.",
      visualizerIds: ["syntax"],
      relatedTopicIds: ["u4-t2", "u1-t3"],
      assessment: [
        { family: "predict", method: "predict", prompt: "static int n=0; n++; called twice. n after second call?", answer: "2", marks: 2, explanation: "Value persists." },
        { family: "concept", method: "concept", prompt: "Default storage class of a local variable?", answer: "auto", marks: 1, explanation: "Automatic duration." },
        { family: "short_answer", method: "definition", prompt: "What does extern int x; do?", answer: "declares x defined elsewhere", marks: 2, explanation: "Not a definition." },
        { family: "debug", method: "identify_error", prompt: "register int r; printf(\"%p\", (void*)&r); Why may this be illegal?", answer: "cannot take address of a register variable", marks: 2, explanation: "& forbidden for register." },
      ],
    },
    {
      topicId: "u4-t2",
      unitId: "unit-4",
      lessonId: "u4-t2-functions-return-exit",
      title: "Introduction to Functions, return(), exit()",
      sourceLabel: "Functions: Introduction to Functions, Working with functions, Benefits and Types of Functions, return(), exit().",
      objectives: [
        "Write a function with a return type, a name, parameters, and a body.",
        "Use return to send a value back to the caller and leave the function.",
        "List benefits: reuse, smaller main, one place to fix a job.",
        "Contrast return from main with exit from <stdlib.h>, which ends the whole program.",
      ],
      beginner:
        "A function is a named piece of work. You declare what it returns, what it needs, and what it does. return hands a value back and stops that function. exit ends the entire program, not just the current function. The college wording writes return() and exit(); in C they are return expression; and the library function exit(status).",
      formal:
        "A function definition provides a return type, identifier, parameter list, and compound statement. return expression; yields a value to the caller. return; is valid in a void function. exit(status) in stdlib.h terminates the program after atexit handlers and flushing of open streams, and never returns to the caller.",
      terms: [
        { term: "function", meaning: "A named block of code you can call, optionally with parameters and a return value." },
        { term: "return", meaning: "Leaves the current function and optionally gives a value to the caller." },
        { term: "exit", meaning: "A library function that ends the whole program." },
        { term: "prototype", meaning: "A declaration of a function's return type, name, and parameters before it is used." },
        { term: "void", meaning: "A return type meaning the function does not send back a value." },
      ],
      explanation:
        "Functions let you name a job once and call it many times. A definition looks like int square(int n) { return n * n; }. The first int is the return type. n is a parameter. The caller writes square(5) and receives 25. Benefits are practical: main stays short, the same formula is not pasted three times, and a bug is fixed in one body. Types of functions in classroom language include functions that take nothing and return nothing (void f(void)), functions that take values and return a value, and functions that only print. C needs a declaration in scope before a call if the definition sits below main; a prototype int square(int n); is enough. return x; evaluates x, gives that value to the caller, and leaves the function immediately. Statements after a taken return do not run. return 0; from main reports success to the environment. exit(status) is different. It is a function in stdlib.h, not a keyword. It terminates the program from wherever you call it — even from a helper deep in the call chain. Use it for a fatal failure when no caller can recover. Do not use exit as a substitute for an ordinary return of a computed result. The syllabus writes return() and exit(); remember return is a statement and exit is a library call that takes an integer status.",
      syntax:
        "int add(int a, int b);\nint add(int a, int b) {\n    return a + b;\n}\nvoid stop_now(void) {\n    exit(1);\n}",
      analogy:
        "A function is a service window. You hand in forms (arguments) and get a stamp back (return). Closing your own window is return. Turning off the whole office lights is exit.",
      introduction:
        "This topic introduces functions as reusable work, then separates return (leave this function) from exit (leave the program).",
      prerequisiteCheck:
        "You should already have written main and used operators and if.",
      examples: [
        {
          title: "Return a computed value",
          problem: "Write max2 that returns the larger of two ints.",
          steps: [
            "Declare int max2(int a, int b).",
            "If a > b return a; else return b.",
            "main prints max2(3, 9) which is 9.",
          ],
          code: `#include <stdio.h>
int max2(int a, int b) {
    if (a > b) return a;
    return b;
}
int main(void) {
    printf("%d\\n", max2(3, 9));
    return 0;
}`,
          output: "9",
        },
        {
          title: "exit ends the program",
          problem: "If n is negative, call exit(1) before printing done.",
          steps: [
            "Include stdlib.h.",
            "When n < 0, exit(1) so the later printf does not run.",
            "With n = -2 the process ends with status 1.",
          ],
          code: `#include <stdio.h>
#include <stdlib.h>
int main(void) {
    int n = -2;
    if (n < 0) {
        exit(1);
    }
    printf("done\\n");
    return 0;
}`,
          output: "(no done; process status 1)",
        },
      ],
      trace: {
        prompt: "int f(void){ return 4; printf(\"X\"); } What prints when f is called from main that only calls f?",
        answer: "nothing from f (return happens first)",
      },
      predict: {
        prompt: "Does exit(0) return to the function that called exit?",
        answer: "no",
      },
      mistakes: [
        { wrong: "return and exit are the same.", why: "return leaves one function. exit ends the program." },
        { wrong: "A non-void function may fall off the end without return and still be safe.", why: "You must return a value. Falling off is undefined for a value-returning function (except main)." },
        { wrong: "return is a function you call as return(x) only.", why: "return is a statement. Parentheses around the expression are optional, not a call." },
      ],
      checks: [
        { q: "What keyword sends a value back to the caller?", a: "return" },
        { q: "Which header declares exit?", a: "stdlib.h" },
        { q: "Name one benefit of functions.", a: "reuse / shorter main / single place to fix a job" },
      ],
      guided: {
        task: "Write int area_rect(int w, int h) that returns w*h, and call it from main with 4 and 5.",
        hint: "Put a prototype above main or define the function before main.",
      },
      independent: {
        task: "Write void report(int code) that prints OK if code is 0 and otherwise calls exit(code). Call it from main with 0, then experiment in a comment on what would happen with a non-zero code.",
      },
      flashcards: [
        { front: "What is a function?", back: "A named piece of work with a return type and optional parameters." },
        { front: "What does return do?", back: "Leaves the current function and may give a value to the caller." },
        { front: "What does exit do?", back: "Ends the entire program." },
        { front: "Header for exit?", back: "stdlib.h" },
        { front: "void return type?", back: "The function does not return a value." },
        { front: "Prototype?", back: "A declaration of the function before the call." },
        { front: "return 0 from main?", back: "Successful finish status." },
      ],
      concepts: [
        {
          prompt: "Is main a special kind of function?",
          explanation: "It is an ordinary function the environment calls first. It still returns an int in hosted C.",
        },
        {
          prompt: "When is exit reasonable?",
          explanation: "When the program cannot continue and no caller will handle the failure. Ordinary results should use return.",
        },
      ],
      quickNotes: [
        "A function has a return type, name, parameters, and a body.",
        "return leaves this function.",
        "exit leaves the program.",
        "exit lives in stdlib.h.",
        "Prototypes let you call a function defined later.",
        "Benefits: reuse, clarity, one place to fix.",
      ],
      distinctions: [
        "return is a statement in the current function. exit is a library call that terminates the process.",
        "A prototype declares. A definition includes the body.",
      ],
      examShort: [
        "Benefits of functions.",
        "Difference between return and exit.",
        "Write a function that returns the square of n.",
      ],
      examLong:
        "A function packages a job under a name. It has a return type, a parameter list, and a body. The caller supplies arguments and may use the value produced by return. return expression; evaluates the expression, yields that value, and leaves only the current function. A void function uses return; with no value. Functions reduce repetition, keep main readable, and give one place to correct a calculation. Types in classroom language include void functions and value-returning functions, with or without parameters. exit(status), declared in stdlib.h, terminates the whole program and does not return to the caller. The syllabus writes return() and exit(); in C, return is a statement and exit is a library function.",
      visualizerIds: ["syntax", "flowchart"],
      relatedTopicIds: ["u4-t1", "u4-t3", "u4-t5"],
      assessment: [
        { family: "concept", method: "concept", prompt: "Does exit return to its caller?", answer: "no", marks: 1, explanation: "The program ends." },
        { family: "syntax", method: "concept", prompt: "Keyword that yields a value from a function?", answer: "return", marks: 1, explanation: "Return statement." },
        { family: "trace", method: "trace", prompt: "int g(int x){ return x+1; } printf(\"%d\", g(4)); Output?", answer: "5", marks: 2, explanation: "4+1." },
        { family: "short_answer", method: "definition", prompt: "Name two benefits of functions.", answer: "reuse and a single place to fix a job", marks: 2, explanation: "Also shorter main." },
      ],
    },
    {
      topicId: "u4-t3",
      unitId: "unit-4",
      lessonId: "u4-t3-call-by-value-reference",
      title: "Call by Value and Call by Reference",
      sourceLabel: "Parameter Passing Mechanisms: Call by Value and Call by Reference.",
      accuracyNotes: [
        "Standard C passes arguments by value. The college phrase 'call by reference' is taught as passing an address (a pointer) so the callee can modify the caller's object. C has no true call-by-reference parameter mode.",
      ],
      objectives: [
        "Explain that C copies each argument (pass by value).",
        "Show that changing a scalar parameter does not change the caller's variable.",
        "Show that passing a pointer still copies the pointer, but *p can change the caller's object.",
        "Preserve the college phrase 'call by reference' while stating that C has no true reference parameters.",
      ],
      beginner:
        "When you call f(x), C copies the value of x into f's parameter. If f changes its copy, x in main stays the same. Books still say 'call by reference' for a second pattern: you pass the address of x, and the function writes through that address. The address itself is still a copy. C does not have a real reference parameter like some other languages.",
      formal:
        "All function arguments in C are passed by value: each parameter is a new object initialised from the argument. A so-called reference call passes a pointer value. The pointer is copied; dereferencing it accesses the caller's object. There is no reference type in ISO C that aliases the argument automatically.",
      terms: [
        { term: "call by value", meaning: "The function receives a copy of the argument's value." },
        { term: "pointer", meaning: "A value that holds the address of an object." },
        { term: "dereference", meaning: "Using *p to read or write the object p points to." },
        { term: "call by reference (college phrase)", meaning: "Teaching name for passing an address so the callee can modify the caller's object." },
        { term: "address-of", meaning: "The & operator, which yields the address of an object." },
      ],
      explanation:
        "The official wording is 'Call by Value and Call by Reference.' Stay accurate: C is pass-by-value. For a scalar, void inc(int n) { n = n + 1; } called as inc(x) copies x into n. After the call, x is unchanged. That surprises anyone who hoped n was another name for x. To let a function change the caller's int, you pass a pointer: void inc(int *p) { *p = *p + 1; } and call inc(&x). The parameter p is still a copy — a copy of the address. Writing p = NULL inside inc would not change the caller's pointer if they passed one; writing *p changes x. That is the classroom 'call by reference' in C: pointer plus dereference. It is not a separate language mode. Swap is the standard example. swap(int a, int b) cannot exchange the caller's variables. swap(int *a, int *b) can exchange *a and *b. Arrays will look similar in the next topic because an array argument decays to a pointer (still a copy of an address). Do not tell students that C has true references. Keep the college phrase, then immediately say what actually happens.",
      syntax:
        "void by_value(int n) { n = n + 1; }\nvoid by_pointer(int *p) { *p = *p + 1; }\n/* call */\nby_value(x);    /* x unchanged */\nby_pointer(&x); /* x changed */",
      analogy:
        "Call by value is handing someone a photocopy of a form; their scribbles stay on the copy. The classroom 'reference' pattern is handing them the locker number (address). They still received a copy of the number, but they can open the locker and change what is inside.",
      introduction:
        "Functions receive data through parameters. This topic is the official pair of phrases — value and so-called reference — with the C fact that every argument is a copy.",
      prerequisiteCheck:
        "You should be able to write a function with parameters and know that &x is the address of x.",
      examples: [
        {
          title: "Value copy does not change the caller",
          problem: "x is 4. Call bump(x) that does n++. Show x after the call.",
          steps: [
            "Define void bump(int n) { n = n + 1; }",
            "Call bump(x) with x = 4.",
            "Print x; it is still 4.",
          ],
          code: `#include <stdio.h>
void bump(int n) {
    n = n + 1;
}
int main(void) {
    int x = 4;
    bump(x);
    printf("%d\\n", x);
    return 0;
}`,
          output: "4",
        },
        {
          title: "Pointer lets the callee write the caller's object",
          problem: "Same x = 4, but bump takes int *p and does *p = *p + 1.",
          steps: [
            "Call bump(&x).",
            "p holds the address of x.",
            "*p = 5 so x becomes 5.",
          ],
          code: `#include <stdio.h>
void bump(int *p) {
    *p = *p + 1;
}
int main(void) {
    int x = 4;
    bump(&x);
    printf("%d\\n", x);
    return 0;
}`,
          output: "5",
        },
      ],
      trace: {
        prompt: "void s(int a,int b){ int t=a; a=b; b=t; } x=1;y=2; s(x,y); x and y after?",
        answer: "1 2",
      },
      predict: {
        prompt: "void s(int *a,int *b){ int t=*a; *a=*b; *b=t; } x=1;y=2; s(&x,&y); x and y?",
        answer: "2 1",
      },
      mistakes: [
        { wrong: "C has a native call-by-reference mode like some other languages.", why: "Every argument is passed by value. Addresses are values too." },
        { wrong: "Changing a parameter always changes the variable in main.", why: "Only the copy changes unless you write through a pointer to the caller's object." },
        { wrong: "Passing a pointer is not pass-by-value.", why: "The pointer is copied. *p is how the callee reaches the original object." },
      ],
      checks: [
        { q: "Does C pass scalars by copying them?", a: "yes" },
        { q: "How do you let a function change the caller's int?", a: "pass its address and write through the pointer" },
        { q: "Is there true call-by-reference in ISO C?", a: "no" },
      ],
      guided: {
        task: "Write swap(int *a, int *b) and use it to exchange two ints in main. Also write a broken swap(int a, int b) and comment why it fails.",
        hint: "The working version swaps *a and *b, not a and b.",
      },
      independent: {
        task: "Write a function that returns the sum of two ints by value, and another that writes the sum into an int *out. Show both from main.",
      },
      flashcards: [
        { front: "How does C pass arguments?", back: "By value: each parameter is a copy." },
        { front: "Does bump(int n) change x in bump(x)?", back: "No." },
        { front: "How to change x from a function?", back: "Pass &x and assign through *p." },
        { front: "Is the pointer copied too?", back: "Yes. The address value is copied." },
        { front: "True call-by-reference in C?", back: "No." },
        { front: "College 'reference' means?", back: "Pass an address and dereference it." },
        { front: "&x means?", back: "The address of x." },
      ],
      concepts: [
        {
          prompt: "If p is a copy of &x, why can *p change x?",
          explanation: "p and &x hold the same address. Dereferencing that address names x itself.",
          formal: "The pointer object is a copy; the pointee is the caller's object.",
        },
        {
          prompt: "Why keep the syllabus words 'call by reference'?",
          explanation: "They are the official topic wording. Teach them as a phrase, then explain the pointer mechanism so the C model stays correct.",
        },
      ],
      quickNotes: [
        "C copies every argument.",
        "A changed copy does not change the caller.",
        "Passing &x copies an address.",
        "*p can modify the caller's object.",
        "That pattern is the classroom 'call by reference'.",
        "ISO C has no true reference parameters.",
      ],
      distinctions: [
        "Pass-by-value of an int versus pass-by-value of a pointer to int.",
        "Changing p versus changing *p: one edits the copy of the address; the other edits the object.",
      ],
      examShort: [
        "What is call by value in C?",
        "How is 'call by reference' implemented in C?",
        "Why can a swap of two ints fail if it takes int a, int b?",
      ],
      examLong:
        "In C every function argument is passed by value, which means the parameter is a new object initialised from the argument. Assigning to a scalar parameter therefore cannot change the caller's variable. The official phrase 'call by reference' is taught using pointers: the caller passes an address with &x, the parameter is a pointer (still a copy of that address), and the function writes through *p to modify the caller's object. C has no true call-by-reference parameter mode. A swap function must take two pointers and exchange *a and *b. Confusing the college wording with a language feature from other languages leads to wrong mental models.",
      visualizerIds: ["syntax", "control-flow"],
      relatedTopicIds: ["u4-t2", "u4-t4"],
      assessment: [
        { family: "concept", method: "concept", prompt: "Does ISO C have true call-by-reference?", answer: "no", marks: 1, explanation: "All arguments are values, including pointers." },
        { family: "predict", method: "predict", prompt: "void f(int n){n=0;} int x=3; f(x); x is?", answer: "3", marks: 2, explanation: "Copy changed, not x." },
        { family: "trace", method: "trace", prompt: "void f(int *p){*p=0;} int x=3; f(&x); x is?", answer: "0", marks: 2, explanation: "Wrote through the address." },
        { family: "debug", method: "identify_error", prompt: "swap(int a,int b) used to exchange x and y. Why does it fail?", answer: "only copies are swapped", marks: 2, explanation: "Need pointers." },
      ],
    },
    {
      topicId: "u4-t4",
      unitId: "unit-4",
      lessonId: "u4-t4-arrays-to-functions",
      title: "Passing Arrays to Functions",
      sourceLabel: "Passing Arrays to Functions.",
      objectives: [
        "Pass a one-dimensional array to a function and state that the parameter is a pointer to the first element.",
        "Pass the working length as a separate argument because the callee does not receive the array size.",
        "Show that the callee can change the caller's elements through that pointer.",
        "Write a 2D parameter with the column size present in the type.",
      ],
      beginner:
        "You cannot hand a function a magic suitcase that still knows it is an array of 10. When you write f(a), C passes the address of a[0]. The function sees a pointer. You also pass n so the function knows how many elements to use. Because the function has the address of the real elements, a[i] = ... inside the function changes the caller's array.",
      formal:
        "In a function call, an array expression decays to a pointer to its first element. A parameter declared int a[] or int *a is a pointer. The number of elements is not passed automatically. Writes through a[i] modify the caller's objects. For int a[R][C], a parameter must know C, e.g. int a[][C].",
      terms: [
        { term: "decay", meaning: "An array expression becomes a pointer to the first element in most contexts, including function calls." },
        { term: "array parameter", meaning: "Written int a[] but meaning int *a in a parameter list." },
        { term: "length argument", meaning: "A separate int n that tells the function how many elements to use." },
        { term: "shared elements", meaning: "The callee's a[i] names the same objects as the caller's a[i]." },
        { term: "column size", meaning: "The inner dimension a 2D parameter type must include." },
      ],
      explanation:
        "Passing arrays is the everyday follow-up to pointers. A function cannot receive a copy of every element just because the parameter looks like int a[10]. In a call, the array name decays: f(a) is like f(&a[0]). Inside f, the parameter is a pointer. You may write int sum(int a[], int n) or int sum(int *a, int n). They mean the same thing. The 10 in int a[10] as a parameter is ignored by the compiler as a size; n is the truth you pass. Because a points at the caller's first element, assignments change the original list. That is useful for sorting later and surprising if you thought arrays were copied. If you need a private copy, you must copy elements yourself. For two-dimensional arrays the callee needs the column count in the type so it can compute where row i starts: void print(int a[][4], int rows). The row count can stay a parameter; the column count belongs in the brackets. sizeof(a) inside the function is the size of a pointer, not the size of the original array. Do not use sizeof(a)/sizeof(a[0]) in the callee to recover n.",
      syntax:
        "int sum(int a[], int n);\nvoid scale(int *a, int n, int k);\nvoid print2(int a[][4], int rows);\n/* call */\nsum(v, 5);",
      analogy:
        "Sending an array is handing over the street address of the first house on a terrace, plus a note that says how many houses to visit. The function does not receive a second terrace. If it paints a door, it is the original door.",
      introduction:
        "After scalar value versus pointer, the syllabus applies the same idea to arrays: they decay to a pointer when passed.",
      prerequisiteCheck:
        "You should know 1D arrays, for loops, and that C passes arguments by value (including pointer values).",
      examples: [
        {
          title: "Sum receives a pointer and a length",
          problem: "Sum {1, 2, 3} in a function.",
          steps: [
            "Write int sum(int a[], int n).",
            "Add a[i] from 0 to n-1.",
            "Call sum(v, 3) and print 6.",
          ],
          code: `#include <stdio.h>
int sum(int a[], int n) {
    int i, s = 0;
    for (i = 0; i < n; i++) {
        s = s + a[i];
    }
    return s;
}
int main(void) {
    int v[3] = {1, 2, 3};
    printf("%d\\n", sum(v, 3));
    return 0;
}`,
          output: "6",
        },
        {
          title: "Callee writes the caller's cells",
          problem: "Double each element of {1, 4} inside a function.",
          steps: [
            "void twice(int a[], int n) multiplies a[i] by 2.",
            "Call twice(v, 2).",
            "main prints 2 8.",
          ],
          code: `#include <stdio.h>
void twice(int a[], int n) {
    int i;
    for (i = 0; i < n; i++) {
        a[i] = a[i] * 2;
    }
}
int main(void) {
    int v[2] = {1, 4};
    twice(v, 2);
    printf("%d %d\\n", v[0], v[1]);
    return 0;
}`,
          output: "2 8",
        },
      ],
      trace: {
        prompt: "void z(int a[]){ a[0]=0; } int v[2]={5,6}; z(v); v[0] is?",
        answer: "0",
      },
      predict: {
        prompt: "Inside void f(int a[100]), does sizeof(a) equal 100*sizeof(int)?",
        answer: "no (it is the size of a pointer)",
      },
      mistakes: [
        { wrong: "The function receives a full copy of the array.", why: "The array decays to a pointer. Elements are not copied automatically." },
        { wrong: "int a[10] as a parameter knows the length 10.", why: "That 10 is not a usable runtime length. Pass n separately." },
        { wrong: "The callee cannot change the caller's elements.", why: "a[i] in the callee names the same objects as in the caller." },
      ],
      checks: [
        { q: "What does an array become when passed to a function?", a: "a pointer to the first element" },
        { q: "Why pass n as well?", a: "the function does not receive the element count" },
        { q: "Can the function change a[i] in the caller?", a: "yes" },
      ],
      guided: {
        task: "Write void maxmin(int a[], int n, int *mx, int *mn) that stores the largest and smallest values. Call it from main.",
        hint: "Walk a[i]. Write results through the two outgoing pointers.",
      },
      independent: {
        task: "Write a function that reverses n elements of an int array in place, and a second function that prints them. Show both on {1,2,3,4}.",
      },
      flashcards: [
        { front: "Array in a call becomes?", back: "Pointer to a[0] (decay)." },
        { front: "int a[] as parameter means?", back: "int *a" },
        { front: "Who supplies the length?", back: "You, as a separate argument." },
        { front: "Does the callee share elements?", back: "Yes. Writes change the caller." },
        { front: "sizeof in the callee?", back: "Size of a pointer, not the original array." },
        { front: "2D parameter needs?", back: "The column dimension in the type." },
        { front: "f(a) versus f(&a[0])?", back: "Same idea for a 1D array." },
      ],
      concepts: [
        {
          prompt: "Is passing an array an exception to pass-by-value?",
          explanation: "No. The value that is copied is a pointer. The elements stay where they were.",
        },
        {
          prompt: "Why is sizeof broken as a length method inside the function?",
          explanation: "The parameter is a pointer. sizeof sees the pointer, not the original array object.",
        },
      ],
      quickNotes: [
        "Arrays decay to a pointer when passed.",
        "Pass the length yourself.",
        "int a[] and int *a are the same as a parameter.",
        "Writes through a[i] change the caller.",
        "sizeof(a) in the callee is not the array length.",
        "2D parameters include the column size.",
      ],
      distinctions: [
        "Copying a pointer to the first element is not copying the array.",
        "A parameter's written [10] is not a runtime size the function can trust.",
      ],
      examShort: [
        "What is array decay?",
        "Why pass the size with the array?",
        "Can a function sort the caller's array in place?",
      ],
      examLong:
        "When an array is passed to a function it decays to a pointer to its first element. A parameter written int a[] is a pointer, the same as int *a. The element count is not passed automatically, so the caller also supplies n. Because the pointer addresses the original elements, assignments in the callee change the caller's array. That is still pass-by-value: the pointer value is copied. sizeof on the parameter yields the pointer size, not the original array size. For a two-dimensional array the parameter type must include the column dimension, for example int a[][C], while the number of rows can be an ordinary integer argument.",
      visualizerIds: ["array-string", "syntax"],
      relatedTopicIds: ["u3-t1", "u4-t3", "u5-t1"],
      assessment: [
        { family: "concept", method: "concept", prompt: "Does f(a) copy all elements of a?", answer: "no", marks: 1, explanation: "Decay to pointer." },
        { family: "trace", method: "trace", prompt: "void f(int a[]){a[1]=9;} int v[]={1,2,3}; f(v); v[1]?", answer: "9", marks: 2, explanation: "Shared elements." },
        { family: "syntax", method: "mcq", prompt: "Write a prototype that sums n ints from an array a.", answer: "int sum(int a[], int n);", marks: 2, explanation: "Pointer plus length." },
        { family: "algorithm", method: "independent_write", prompt: "Why include C in int a[][C]?", answer: "so the function can compute the start of each row", marks: 2, explanation: "Row-major layout needs the column count." },
      ],
    },
    {
      topicId: "u4-t5",
      unitId: "unit-4",
      lessonId: "u4-t5-recursion",
      title: "Recursion with suitable illustrative programs",
      sourceLabel: "Recursion with suitable illustrative programs.",
      objectives: [
        "Define recursion as a function calling itself to solve a smaller case of the same problem.",
        "Write a base case that stops the chain of calls.",
        "Trace factorial or a simple countdown on paper.",
        "State that each call has its own parameters and locals.",
      ],
      beginner:
        "A recursive function asks a smaller version of the same question, then uses that answer. You must also write a smallest question that does not ask again — the base case. Without it the function calls itself forever. Each call has its own n, just like stacked trays, each with a different number.",
      formal:
        "Recursion is self-invocation. A well-founded recursive function reduces a parameter toward a base case that returns without a further self-call. Each activation has its own automatic storage. Deep recursion consumes stack space. Tail-like patterns still use a stack frame per call in ordinary C implementations.",
      terms: [
        { term: "recursion", meaning: "A function solving a problem by calling itself on a smaller instance." },
        { term: "base case", meaning: "The simple case that returns without another self-call." },
        { term: "recursive case", meaning: "The branch that calls the same function with a smaller argument." },
        { term: "activation", meaning: "One running instance of the function with its own locals." },
        { term: "stack overflow", meaning: "Too many nested calls, exhausting call-stack space." },
      ],
      explanation:
        "Recursion is a design, not a new keyword. A function may call itself. That is useful when the problem shrinks in a regular way: n! is n times (n-1)!, and 0! is 1. The 0! (or 1!) line is the base case. The n * fact(n - 1) line is the recursive case. Trace fact(3): it waits for fact(2), which waits for fact(1), which waits for fact(0) = 1, then the multiplications unwind 1, 2, 6. Each call has its own n. They are not one shared variable. Missing the base case, or failing to shrink n, produces unbounded recursion and typically crashes when the stack runs out. Recursion can replace a loop, but it is not automatically better. A simple countdown is clearer as a loop. Classroom examples stay small: factorial, a sum 1..n, Fibonacci (which is easy to write and expensive if you branch twice without storing results), and binary search later. return is how a base case delivers its value and how a recursive case multiplies or adds after the inner call returns. exit would abort the whole program and is the wrong tool for returning from one level.",
      syntax:
        "int fact(int n) {\n    if (n <= 1) return 1;          /* base */\n    return n * fact(n - 1);        /* recursive */\n}",
      analogy:
        "Recursion is asking the person behind you to count the remaining queue, then adding yourself. The last person says \"zero behind me\" — that is the base case — and the answers travel back to the front.",
      introduction:
        "The last official topic of Unit 4 is recursion: a function that calls itself, with a base case so the chain stops.",
      prerequisiteCheck:
        "You should be able to write a function that returns a value and understand that each call has its own locals.",
      examples: [
        {
          title: "Factorial",
          problem: "Compute 4! with a recursive function.",
          steps: [
            "Base: n <= 1 returns 1.",
            "Otherwise return n * fact(n - 1).",
            "fact(4) = 4*3*2*1 = 24.",
          ],
          code: `#include <stdio.h>
int fact(int n) {
    if (n <= 1) return 1;
    return n * fact(n - 1);
}
int main(void) {
    printf("%d\\n", fact(4));
    return 0;
}`,
          output: "24",
        },
        {
          title: "Sum 1 through n",
          problem: "Recursive sum of 1..3.",
          steps: [
            "sum(0) is 0 (base).",
            "sum(n) is n + sum(n - 1).",
            "sum(3) is 3+2+1+0 = 6.",
          ],
          code: `#include <stdio.h>
int sumto(int n) {
    if (n <= 0) return 0;
    return n + sumto(n - 1);
}
int main(void) {
    printf("%d\\n", sumto(3));
    return 0;
}`,
          output: "6",
        },
      ],
      trace: {
        prompt: "fact(3) with fact(n)=1 if n<=1 else n*fact(n-1). List the return values from the innermost call outward.",
        answer: "1, then 2, then 6",
      },
      predict: {
        prompt: "int f(int n){ if(n==0) return 0; return 1+f(n-1); } f(4) is?",
        answer: "4",
      },
      mistakes: [
        { wrong: "A recursive function can omit a base case if n is small.", why: "Without a base case the calls never stop, even if you started from 3." },
        { wrong: "All recursive calls share one n.", why: "Each activation has its own parameter object." },
        { wrong: "Recursion is always faster than a loop.", why: "It often uses more stack space and is not automatically faster." },
      ],
      checks: [
        { q: "What stops a recursive chain?", a: "the base case" },
        { q: "Must the recursive call use a smaller problem?", a: "yes" },
        { q: "Does each call have its own locals?", a: "yes" },
      ],
      guided: {
        task: "Write a recursive function that prints n, n-1, ... 1, then write a second one that prints 1 ... n (print after the recursive call).",
        hint: "Print-before-call counts down. Recurse-then-print counts up as the stack unwinds.",
      },
      independent: {
        task: "Write recursive power(base, exp) for a non-negative exp that returns base^exp. Include a base case for exp == 0.",
      },
      flashcards: [
        { front: "Recursion?", back: "A function calls itself on a smaller case." },
        { front: "Base case?", back: "The case that returns without another self-call." },
        { front: "0! in the usual definition?", back: "1" },
        { front: "Own locals per call?", back: "Yes." },
        { front: "Missing base case?", back: "Unbounded recursion / stack overflow." },
        { front: "fact(3) waits for?", back: "fact(2), then multiplies by 3." },
        { front: "Is recursion a keyword?", back: "No. It is a calling pattern." },
      ],
      concepts: [
        {
          prompt: "Why must the argument change?",
          explanation: "If you call f(n) from f(n), you never approach the base case.",
        },
        {
          prompt: "Where do the pending multiplications live?",
          explanation: "In each waiting activation on the call stack, until the inner call returns.",
        },
      ],
      quickNotes: [
        "Recursion is self-call plus a base case.",
        "Shrink the problem every call.",
        "Each call has its own parameters.",
        "return delivers the inner result outward.",
        "Too many calls can overflow the stack.",
        "A loop is often simpler for straight counting.",
      ],
      distinctions: [
        "A recursive case calls itself. A base case does not.",
        "Recursion is not the same as iteration, though both can repeat work.",
      ],
      examShort: [
        "Define recursion.",
        "What is a base case?",
        "Trace fact(4).",
      ],
      examLong:
        "Recursion means a function solves a problem by calling itself on a smaller instance of the same problem. A correct recursive function has a base case that returns without a further self-call, and a recursive case that reduces a parameter so that the base case is reached. Each call has its own automatic variables, so the n of fact(3) is not the n of fact(2). A typical illustration is factorial: if n <= 1 return 1, else return n * fact(n - 1). Without a base case, or without shrinking n, calls continue until the stack is exhausted. Recursion is a design choice, not a faster mode of the machine; many linear problems are clearer as loops.",
      visualizerIds: ["recursion", "control-flow"],
      relatedTopicIds: ["u4-t2", "u5-t6", "u5-t7"],
      assessment: [
        { family: "trace", method: "trace", prompt: "fact(0) with base n<=1 returning 1?", answer: "1", marks: 1, explanation: "Base case." },
        { family: "predict", method: "predict", prompt: "int p(int n){if(n==1)return 1; return n*p(n-1);} p(3)?", answer: "6", marks: 2, explanation: "3*2*1." },
        { family: "concept", method: "concept", prompt: "What happens if the recursive call does not shrink n?", answer: "the calls never reach a base case", marks: 2, explanation: "Unbounded recursion." },
        { family: "algorithm", method: "algorithm", prompt: "Write the two branches of recursive factorial.", answer: "if n<=1 return 1 else return n*fact(n-1)", marks: 2, explanation: "Base and recursive case." },
      ],
    },
  ];
}
