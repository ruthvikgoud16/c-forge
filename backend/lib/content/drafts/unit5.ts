import type { TopicDraft } from "../compile";

export function unit5Drafts(): TopicDraft[] {
  return [
    {
      topicId: "u5-t1",
      unitId: "unit-5",
      lessonId: "u5-t1-linear-search",
      title: "Linear Search",
      sourceLabel: "Searching: Linear Search.",
      objectives: [
        "Describe linear search as checking elements from the start until a match or the end.",
        "Write a loop that returns the index of a key or a not-found signal.",
        "Trace a successful search and a failed search on a short list.",
        "State that the array need not be sorted.",
      ],
      beginner:
        "Linear search is looking through a row from left to right. You compare each box with the value you want. If you find it, you remember the index. If you reach the end, it is not there. The list does not have to be in order.",
      formal:
        "Linear (sequential) search examines a[0], a[1], ... until a[i] equals the key or i reaches n. It returns the first matching index, or a sentinel such as -1. Correctness does not require a sorted array. In the worst case every element is inspected.",
      terms: [
        { term: "key", meaning: "The value you are looking for." },
        { term: "linear search", meaning: "A sequential scan from the first element toward the last." },
        { term: "index", meaning: "The position returned when the key is found." },
        { term: "not found", meaning: "A signal such as -1 when no element equals the key." },
        { term: "first match", meaning: "The smallest i with a[i] == key if duplicates exist." },
      ],
      explanation:
        "Searching is asking where a value sits in an array. Linear search is the method that does not need any special order. You start at index 0. If a[0] is the key, you are done. If not, try a[1], and so on, until a[n-1]. A for loop with a break, or a while that stops on match, is the whole algorithm. Returning the index is more useful than only printing FOUND, because later code can use a[i]. If the key is missing, return -1 or another value that cannot be a valid index. Duplicates: the simple scan returns the first hit and ignores later copies unless you keep scanning on purpose. The array may be unsorted. That is the feature: you can search marks or IDs as they were typed. The cost is that a missing key always looks at every element, and a key at the end does too. There is no clever jump. Later, binary search will jump, but only after the array is sorted. Do not mix the two. A linear scan that breaks early on a match is still linear search, not binary search.",
      syntax:
        "int linear_search(int a[], int n, int key) {\n    int i;\n    for (i = 0; i < n; i++) {\n        if (a[i] == key) return i;\n    }\n    return -1;\n}",
      analogy:
        "Linear search is walking a library shelf from the left end, reading every spine until you see the title or run out of books. The shelf does not need to be alphabetised.",
      introduction:
        "Unit 5 begins with the search that always works on an unordered list: linear search.",
      prerequisiteCheck:
        "You should be able to walk a one-dimensional array with a for loop and write a function that returns an int.",
      examples: [
        {
          title: "Find a present key",
          problem: "Search for 8 in {3, 8, 2, 8}. Return the first index.",
          steps: [
            "Compare 3, not a match.",
            "Compare 8 at index 1, match.",
            "Return 1 and do not continue to the second 8.",
          ],
          code: `#include <stdio.h>
int linear_search(int a[], int n, int key) {
    int i;
    for (i = 0; i < n; i++) {
        if (a[i] == key) return i;
    }
    return -1;
}
int main(void) {
    int a[4] = {3, 8, 2, 8};
    printf("%d\\n", linear_search(a, 4, 8));
    return 0;
}`,
          output: "1",
        },
        {
          title: "Key missing",
          problem: "Search for 5 in {1, 4, 7}.",
          steps: [
            "Check 1, 4, and 7.",
            "None equals 5.",
            "Return -1.",
          ],
          code: `#include <stdio.h>
int linear_search(int a[], int n, int key) {
    int i;
    for (i = 0; i < n; i++) {
        if (a[i] == key) return i;
    }
    return -1;
}
int main(void) {
    int a[3] = {1, 4, 7};
    printf("%d\\n", linear_search(a, 3, 5));
    return 0;
}`,
          output: "-1",
        },
      ],
      trace: {
        prompt: "linear search 4 in {4, 1, 4}. Which index is returned if we stop at the first match?",
        answer: "0",
      },
      predict: {
        prompt: "How many comparisons in the worst case on n elements when the key is absent?",
        answer: "n",
      },
      mistakes: [
        { wrong: "Linear search requires a sorted array.", why: "Order is not required. That requirement belongs to binary search." },
        { wrong: "Returning 0 always means not found.", why: "0 is a valid first index. Use a negative sentinel such as -1." },
        { wrong: "You must scan the whole array even after a match.", why: "You may return at the first match unless the problem asks for all positions." },
      ],
      checks: [
        { q: "Must the array be sorted for linear search?", a: "no" },
        { q: "What is a common not-found return value?", a: "-1" },
        { q: "Which match does a simple scan return if the key appears twice?", a: "the first" },
      ],
      guided: {
        task: "Write linear_search and use it to print the index of a key read from input, or the words NOT FOUND.",
        hint: "Store the return value. If it is -1, print the message; else print the index.",
      },
      independent: {
        task: "Adapt linear search to count how many times a key appears, instead of returning the first index.",
      },
      flashcards: [
        { front: "Linear search order?", back: "From index 0 toward n-1." },
        { front: "Sorted required?", back: "No." },
        { front: "Not found?", back: "Return a non-index such as -1." },
        { front: "Duplicates?", back: "First match unless you keep scanning." },
        { front: "Worst-case looks at?", back: "Every element." },
        { front: "Why return an index?", back: "The caller can use a[i] later." },
        { front: "Is breaking early still linear search?", back: "Yes." },
      ],
      concepts: [
        {
          prompt: "Why is this called linear?",
          explanation: "The amount of work grows with the length of the list: one more element, one more check in the worst case.",
        },
        {
          prompt: "When is linear search the right tool?",
          explanation: "When the list is short or unsorted, or when building a sorted copy would cost more than a scan.",
        },
      ],
      quickNotes: [
        "Scan from the left until a match or the end.",
        "No sort is required.",
        "Return the first index or -1.",
        "A missing key costs n comparisons.",
        "Do not use 0 as not-found.",
        "This is sequential search, not binary search.",
      ],
      distinctions: [
        "Linear search does not need order. Binary search does.",
        "Index 0 is a successful hit at the first element, not a failure.",
      ],
      examShort: [
        "Write the idea of linear search in two sentences.",
        "What do you return when the key is absent?",
        "Does linear search need a sorted array?",
      ],
      examLong:
        "Linear search, also called sequential search, looks at array elements in order from index 0. At each index it compares a[i] with the key. If they are equal it returns i, usually the first match when duplicates exist. If the loop ends without a match it returns a sentinel such as -1. The method does not require the array to be sorted. In the worst case, including an absent key, every element is examined. The algorithm is a counted loop with an equality test and an early return. It is the correct search when order is unknown or the list is short.",
      visualizerIds: ["search-sort", "algorithm", "array-string"],
      relatedTopicIds: ["u3-t1", "u4-t4", "u5-t2"],
      assessment: [
        { family: "algorithm", method: "algorithm", prompt: "Outline linear search for key in a[0..n-1].", answer: "for i from 0 to n-1 if a[i]==key return i; return -1", marks: 3, explanation: "Sequential scan." },
        { family: "trace", method: "trace", prompt: "Search 2 in {9,2,2}. First index?", answer: "1", marks: 2, explanation: "First match." },
        { family: "concept", method: "concept", prompt: "Must the array be sorted?", answer: "no", marks: 1, explanation: "Linear search is order-independent." },
        { family: "predict", method: "predict", prompt: "Search 7 in {1,2,3} returning -1 if missing. Result?", answer: "-1", marks: 1, explanation: "Absent key." },
      ],
    },
    {
      topicId: "u5-t2",
      unitId: "unit-5",
      lessonId: "u5-t2-binary-search",
      title: "Binary Search",
      sourceLabel: "Searching: Binary Search.",
      accuracyNotes: [
        "Binary search is defined only on a sorted array (non-decreasing or non-increasing, consistently). An unsorted array makes the algorithm incorrect, not merely slower.",
      ],
      objectives: [
        "State that binary search requires a sorted array.",
        "Trace low, high, and mid while the key is found or the range becomes empty.",
        "Explain integer mid = (low + high) / 2 and that integer division truncates.",
        "Compare the idea with linear search.",
      ],
      beginner:
        "Binary search only works if the list is already sorted. You look at the middle. If that is the key, stop. If the key is smaller, throw away the right half. If it is larger, throw away the left half. Then do the same on what is left. You are not walking every box.",
      formal:
        "Binary search maintains a contiguous range [low, high] of a sorted array. mid is an integer midpoint. The key is compared with a[mid] and the range is replaced by the left or right half, or the search ends on a match. If low exceeds high, the key is absent. The array must be sorted in the order the comparisons assume.",
      terms: [
        { term: "sorted prerequisite", meaning: "Elements must already be in order, or the discarded half may contain the key." },
        { term: "low", meaning: "The first index still under consideration." },
        { term: "high", meaning: "The last index still under consideration." },
        { term: "mid", meaning: "An integer middle index, usually (low + high) / 2." },
        { term: "halve", meaning: "Drop the half that cannot contain the key." },
      ],
      explanation:
        "Binary search is a different idea from linear search. It is not 'a faster loop over the same unordered list'. It needs the array already sorted, typically non-decreasing: each element is less than or equal to the next. You keep two ends, low and high. While low <= high, compute mid. In C, (low + high) / 2 is integer division, so the fraction is discarded — mid is a whole index. Compare a[mid] with the key. Equal: return mid. Key smaller: the key, if present, is in the left half, so high = mid - 1. Key larger: low = mid + 1. When low passes high, the range is empty and the key is not there. If you run this on an unsorted array, the algorithm still runs, but it can report not-found for a value that is sitting in the discarded half. That is a correctness failure, not a performance footnote. Classroom traces should write low, high, mid, and a[mid] on each step. For even lengths, truncation picks the left-biased mid; that is fine if you keep the update rules. Binary search is the reason Unit 5 also teaches sorting: you sort once, then search many times.",
      syntax:
        "int binary_search(int a[], int n, int key) {\n    int low = 0, high = n - 1, mid;\n    while (low <= high) {\n        mid = (low + high) / 2;   /* int division truncates */\n        if (a[mid] == key) return mid;\n        if (key < a[mid]) high = mid - 1;\n        else low = mid + 1;\n    }\n    return -1;\n}",
      analogy:
        "Binary search is finding a name in a sorted directory: open the middle page, then only keep the half that can still hold the name. If the directory is shuffled, throwing a half away can throw the name away.",
      introduction:
        "The second search method in the unit is binary search. It is faster on large sorted lists and wrong on unsorted ones.",
      prerequisiteCheck:
        "You need arrays, integer division, and the meaning of a sorted (non-decreasing) sequence.",
      examples: [
        {
          title: "Find 7 in a sorted list",
          problem: "a = {1, 3, 5, 7, 9}, key = 7.",
          steps: [
            "low=0 high=4 mid=2 a[2]=5. 7 > 5 so low=3.",
            "low=3 high=4 mid=3 a[3]=7. Match.",
            "Return 3.",
          ],
          code: `#include <stdio.h>
int binary_search(int a[], int n, int key) {
    int low = 0, high = n - 1, mid;
    while (low <= high) {
        mid = (low + high) / 2;
        if (a[mid] == key) return mid;
        if (key < a[mid]) high = mid - 1;
        else low = mid + 1;
    }
    return -1;
}
int main(void) {
    int a[5] = {1, 3, 5, 7, 9};
    printf("%d\\n", binary_search(a, 5, 7));
    return 0;
}`,
          output: "3",
        },
        {
          title: "Absent key on a sorted list",
          problem: "Search 4 in {1, 3, 5, 7}.",
          steps: [
            "mid points at 3, then the range shrinks to the right of 3 and left of 5.",
            "low becomes greater than high.",
            "Return -1. 4 is not in the list.",
          ],
          code: `#include <stdio.h>
int binary_search(int a[], int n, int key) {
    int low = 0, high = n - 1, mid;
    while (low <= high) {
        mid = (low + high) / 2;
        if (a[mid] == key) return mid;
        if (key < a[mid]) high = mid - 1;
        else low = mid + 1;
    }
    return -1;
}
int main(void) {
    int a[4] = {1, 3, 5, 7};
    printf("%d\\n", binary_search(a, 4, 4));
    return 0;
}`,
          output: "-1",
        },
      ],
      trace: {
        prompt: "Sorted a={2,4,6,8,10}, key=8. First mid=(0+4)/2=2, a[2]=6. What are low and high after this step?",
        answer: "low=3 high=4",
      },
      predict: {
        prompt: "If the array is {9, 1, 5} (unsorted) and you binary-search for 9, is a correct found index guaranteed?",
        answer: "no",
      },
      mistakes: [
        { wrong: "Binary search works on any array and is just faster.", why: "It requires a sorted array. On an unsorted array it can miss a present key." },
        { wrong: "(low + high) / 2 is a real number mid.", why: "Both sides are int, so the division truncates to an int index." },
        { wrong: "When key < a[mid] you set low = mid + 1.", why: "A smaller key lies to the left, so high = mid - 1." },
      ],
      checks: [
        { q: "What must be true before binary search is correct?", a: "the array is sorted in the assumed order" },
        { q: "What does (low + high) / 2 do with a remainder?", a: "truncates toward zero for these non-negative ints" },
        { q: "When is the key declared absent?", a: "when low > high" },
      ],
      guided: {
        task: "Trace binary search for 5 on {1,2,3,4,5,6,7} by filling a table of low, high, mid until you return an index.",
        hint: "Start low=0 high=6. Write a[mid] each time before you shrink.",
      },
      independent: {
        task: "Implement binary_search. Test a found key, an absent key, and write a comment that you must sort first if the data arrives unordered.",
      },
      flashcards: [
        { front: "Binary search needs?", back: "A sorted array." },
        { front: "mid in C?", back: "(low + high) / 2 with integer truncation." },
        { front: "key < a[mid]?", back: "high = mid - 1." },
        { front: "key > a[mid]?", back: "low = mid + 1." },
        { front: "Empty range?", back: "low > high, not found." },
        { front: "Unsorted input?", back: "The algorithm can be wrong." },
        { front: "Versus linear?", back: "Linear needs no order; binary discards a half each step." },
      ],
      concepts: [
        {
          prompt: "Why does unsorted data break binary search?",
          explanation: "Dropping a half assumes every discarded element is on the wrong side of mid. Without order that assumption is false.",
        },
        {
          prompt: "Is mid always the statistical centre?",
          explanation: "With integer division it is the lower middle when the range length is even. The algorithm still works with consistent updates.",
        },
      ],
      quickNotes: [
        "Sort first, then binary search.",
        "Keep a range [low, high].",
        "mid uses truncating integer division.",
        "Equal: return. Smaller: go left. Larger: go right.",
        "low > high means absent.",
        "Unsorted arrays are not a valid input.",
      ],
      distinctions: [
        "Binary search is incorrect on unsorted data, not merely slower.",
        "Integer / truncates; mid is an index, not a fraction.",
      ],
      examShort: [
        "State the prerequisite for binary search.",
        "Write the mid formula and the two range updates.",
        "When do you stop and report not found?",
      ],
      examLong:
        "Binary search locates a key in a sorted array by repeatedly discarding half of the remaining range. The indices low and high start at 0 and n-1. While low <= high, mid is computed as (low + high) / 2. In C this is integer division, so any fraction is truncated. If a[mid] equals the key the index is returned. If the key is smaller, high becomes mid - 1; if larger, low becomes mid + 1. When low exceeds high the key is absent. The array must already be sorted in the order the comparisons assume. Running the same steps on an unsorted array can miss a key that is present. Binary search is therefore a partner of the sorting methods in this unit, not a replacement for linear search on raw input.",
      visualizerIds: ["search-sort", "algorithm", "binary"],
      relatedTopicIds: ["u5-t1", "u2-t1", "u5-t3"],
      assessment: [
        { family: "concept", method: "concept", prompt: "Can you binary-search an unsorted array correctly?", answer: "no", marks: 1, explanation: "Sorted prerequisite." },
        { family: "trace", method: "trace", prompt: "a={1,2,3,4,5} key=1. First mid=(0+4)/2. a[mid]?", answer: "3", marks: 2, explanation: "mid=2." },
        { family: "predict", method: "predict", prompt: "(1+2)/2 in int?", answer: "1", marks: 1, explanation: "Integer division truncates." },
        { family: "algorithm", method: "algorithm", prompt: "If key > a[mid], how do you update the range?", answer: "low = mid + 1", marks: 2, explanation: "Keep the right half." },
      ],
    },
    {
      topicId: "u5-t3",
      unitId: "unit-5",
      lessonId: "u5-t3-bubble-sort",
      title: "Bubble Sort",
      sourceLabel: "Sorting: Bubble Sort.",
      objectives: [
        "Describe a pass as comparing neighbours and swapping them when they are out of order.",
        "Explain that each pass moves the next largest (for ascending) toward the end.",
        "Trace one or two passes on a short list.",
        "Optionally stop early if a pass makes no swap.",
      ],
      beginner:
        "Bubble sort looks at two neighbours at a time. If the left one is larger (for an ascending sort), you swap them. You walk the row like that. Big values drift to the right like bubbles. You repeat passes until the row is ordered.",
      formal:
        "Bubble sort performs adjacent comparisons. For ascending order, if a[j] > a[j+1] the two elements are swapped. After pass i, the largest remaining element is in its final position at the right. n-1 passes suffice. A swapped flag can terminate when a pass is already sorted.",
      terms: [
        { term: "pass", meaning: "One left-to-right sweep of adjacent pairs." },
        { term: "adjacent swap", meaning: "Exchanging a[j] and a[j+1] when they are out of order." },
        { term: "ascending", meaning: "Each element is less than or equal to the next when finished." },
        { term: "in place", meaning: "The array is rearranged using only a little extra storage (a temporary for the swap)." },
        { term: "early exit", meaning: "Stopping if a pass performs no swaps." },
      ],
      explanation:
        "Bubble sort is usually the first sorting method in this unit because the rule is local: only two neighbours. For ascending order, compare a[0] with a[1], a[1] with a[2], and so on. Whenever the left is greater, swap. After the first full pass, the largest value has moved to a[n-1]. The next pass can ignore that last slot. After the second pass, the second largest sits at a[n-2]. That is why the inner loop often runs to n-1-i. After n-1 passes the array is sorted. A boolean swapped, reset at the start of a pass and set on any swap, lets you stop if the list is already ordered — useful on nearly sorted input, not required for correctness. Stability: equal keys keep their order if you only swap on > and not on >=. Trace with a tiny array and write the row after each swap, not only after each pass, until you see the largest 'bubble' rightward. Bubble sort is easy to write and slow on long lists. The course asks you to trace it, not to claim it is the default sort for large data.",
      syntax:
        "for (i = 0; i < n - 1; i++) {\n    for (j = 0; j < n - 1 - i; j++) {\n        if (a[j] > a[j + 1]) {\n            t = a[j]; a[j] = a[j + 1]; a[j + 1] = t;\n        }\n    }\n}",
      analogy:
        "Bubble sort is people in a queue comparing with the next person only. If they are in the wrong order they swap. The tallest person steps rightward each pass until they stand at the end.",
      introduction:
        "Sorting begins with bubble sort: repeated adjacent swaps that push the next extreme to the end of the unsorted prefix.",
      prerequisiteCheck:
        "You should be able to swap two ints using a temporary and write nested for loops.",
      examples: [
        {
          title: "One pass on four values",
          problem: "Show {4, 3, 2, 1} after the first bubble pass (ascending).",
          steps: [
            "4>3 swap → 3,4,2,1.",
            "4>2 swap → 3,2,4,1.",
            "4>1 swap → 3,2,1,4. Largest is at the end.",
          ],
          code: `#include <stdio.h>
int main(void) {
    int a[4] = {4, 3, 2, 1};
    int j, t;
    for (j = 0; j < 3; j++) {
        if (a[j] > a[j + 1]) {
            t = a[j];
            a[j] = a[j + 1];
            a[j + 1] = t;
        }
    }
    printf("%d %d %d %d\\n", a[0], a[1], a[2], a[3]);
    return 0;
}`,
          output: "3 2 1 4",
        },
        {
          title: "Full sort",
          problem: "Bubble-sort {3, 1, 2} into ascending order.",
          steps: [
            "Pass 0: 3>1 swap, 3>2 swap → 1,2,3.",
            "Pass 1: 1 and 2 already ordered.",
            "Print 1 2 3.",
          ],
          code: `#include <stdio.h>
void bubble(int a[], int n) {
    int i, j, t;
    for (i = 0; i < n - 1; i++) {
        for (j = 0; j < n - 1 - i; j++) {
            if (a[j] > a[j + 1]) {
                t = a[j];
                a[j] = a[j + 1];
                a[j + 1] = t;
            }
        }
    }
}
int main(void) {
    int a[3] = {3, 1, 2};
    bubble(a, 3);
    printf("%d %d %d\\n", a[0], a[1], a[2]);
    return 0;
}`,
          output: "1 2 3",
        },
      ],
      trace: {
        prompt: "First pass ascending on {2, 5, 1}. Array after the pass?",
        answer: "2 1 5",
      },
      predict: {
        prompt: "After k full passes of the usual algorithm, where is the largest element?",
        answer: "at the end (index n-1 after the first pass, and the next extremes follow)",
      },
      mistakes: [
        { wrong: "You compare a[j] with a[j+2] in the inner step.", why: "Bubble sort compares neighbours: a[j] and a[j+1]." },
        { wrong: "One pass always fully sorts the array.", why: "One pass only guarantees the extreme at the end. More passes finish the rest." },
        { wrong: "Swapping on >= is required.", why: "For ascending, swap when a[j] > a[j+1]. Swapping equals is unnecessary and can disturb order." },
      ],
      checks: [
        { q: "Which pair does the inner step compare?", a: "neighbours a[j] and a[j+1]" },
        { q: "What does one full pass guarantee in ascending bubble sort?", a: "the largest remaining value reaches the right end" },
        { q: "How many passes are enough in the basic form?", a: "n-1" },
      ],
      guided: {
        task: "Implement bubble sort and print the array after every pass for {5, 1, 4, 2}.",
        hint: "Put a print loop after the inner j loop, still inside i.",
      },
      independent: {
        task: "Add a swapped flag so the function returns as soon as a pass makes no swap. Test it on an already sorted array.",
      },
      flashcards: [
        { front: "Bubble compare?", back: "Adjacent pair a[j], a[j+1]." },
        { front: "Ascending swap when?", back: "a[j] > a[j+1]." },
        { front: "After first pass?", back: "Largest is at the last index." },
        { front: "Inner limit n-1-i?", back: "The right i elements are already finished." },
        { front: "Early exit?", back: "Stop if a pass has no swaps." },
        { front: "In place?", back: "Yes, besides a temporary." },
        { front: "One pass enough?", back: "No, except for already-almost-sorted cases with a flag." },
      ],
      concepts: [
        {
          prompt: "Why shrink the inner loop?",
          explanation: "Each pass parks one more value at the end, so those positions need not be compared again.",
        },
        {
          prompt: "Is bubble sort the method binary search needs?",
          explanation: "Any correct sort can produce the ordered array. Bubble sort is one syllabus method that can do that job.",
        },
      ],
      quickNotes: [
        "Compare neighbours and swap if out of order.",
        "Large values move right in an ascending sort.",
        "Repeat passes; n-1 is enough.",
        "The inner loop can stop earlier each pass.",
        "A no-swap pass means the array is sorted.",
        "Easy to trace; not the fastest for long arrays.",
      ],
      distinctions: [
        "A pass is one sweep, not the whole sort.",
        "Adjacent swaps are bubble sort; picking a global minimum is selection sort.",
      ],
      examShort: [
        "Explain one pass of bubble sort.",
        "Write the nested-loop skeleton.",
        "What is in the last position after the first ascending pass?",
      ],
      examLong:
        "Bubble sort sorts by repeated adjacent comparisons. In an ascending implementation the inner loop compares a[j] with a[j+1] and swaps when a[j] is greater. After the first pass the largest element is at index n-1. Each later pass ignores one more finished slot at the right, which is why the inner bound is often n-1-i. n-1 passes guarantee a sorted array. An optional flag records whether any swap occurred; a quiet pass means the remaining prefix is already ordered. The method is in place and simple to trace. It is taught for understanding, not as the most efficient sort for large n.",
      visualizerIds: ["search-sort", "algorithm", "array-string"],
      relatedTopicIds: ["u5-t4", "u5-t5", "u5-t2"],
      assessment: [
        { family: "trace", method: "trace", prompt: "First ascending pass on {1, 4, 3}. Result?", answer: "1 3 4", marks: 2, explanation: "Only 4 and 3 swap." },
        { family: "algorithm", method: "algorithm", prompt: "When do you swap in ascending bubble sort?", answer: "when a[j] > a[j+1]", marks: 2, explanation: "Adjacent inversion." },
        { family: "concept", method: "concept", prompt: "Are comparisons only between neighbours?", answer: "yes", marks: 1, explanation: "Adjacent pairs." },
        { family: "syntax", method: "identify_error", prompt: "Inner loop j < n - i but still compares a[j+1] when j = n-i-1 with i=0: last j is n-1, a[j+1] is out of range if bound is j<n. What bound is safe?", answer: "j < n-1-i", marks: 2, explanation: "Need a neighbour a[j+1]." },
      ],
    },
    {
      topicId: "u5-t4",
      unitId: "unit-5",
      lessonId: "u5-t4-insertion-sort",
      title: "Insertion Sort",
      sourceLabel: "Sorting: Insertion Sort.",
      objectives: [
        "Treat the left part of the array as already sorted and insert the next element into it.",
        "Shift larger elements right to open the insertion hole.",
        "Trace inserting one key into a sorted prefix.",
        "Contrast the idea with bubble sort's adjacent swaps along the whole row.",
      ],
      beginner:
        "Insertion sort works like sorting cards in your hand. The left cards are already in order. You take the next card and slide it left until it sits in the right gap. The cards that are larger move one place right to make room.",
      formal:
        "Insertion sort maintains a sorted prefix a[0..i-1]. The key a[i] is removed (stored), elements greater than the key are shifted one position right, and the key is written into the opened index. i runs from 1 to n-1.",
      terms: [
        { term: "sorted prefix", meaning: "The left part of the array that is already in order." },
        { term: "key", meaning: "The next unsorted element being inserted." },
        { term: "shift", meaning: "Moving a larger element one index to the right to open a gap." },
        { term: "insert", meaning: "Writing the key into the gap where it belongs." },
        { term: "growing hand", meaning: "The informal picture: one more card joins the sorted hand each time." },
      ],
      explanation:
        "Insertion sort grows a sorted region from the left. a[0] alone is already sorted. Take a[1] as the key. While the element on the left is greater than the key, move that element one step right. Then drop the key into the hole. Now two elements are sorted. Repeat with a[2], a[3], …, a[n-1]. The inner walk goes left, not right. That is a different motion from bubble sort. On data that is already nearly sorted, insertion sort does little shifting and is pleasant. On reverse-sorted data it shifts a lot. Equal keys: if you stop shifting when a[j] <= key, the new key sits after earlier equals, which keeps the method stable. Traces should show the key, the shifts, and the prefix after each i. Do not swap the key down one step at a time unless you are carefully simulating the same idea; the standard write-up uses a stored key and assignments a[j+1] = a[j]. After the last insertion the whole array is the prefix.",
      syntax:
        "for (i = 1; i < n; i++) {\n    key = a[i];\n    j = i - 1;\n    while (j >= 0 && a[j] > key) {\n        a[j + 1] = a[j];\n        j--;\n    }\n    a[j + 1] = key;\n}",
      analogy:
        "You hold a sorted fan of cards and pick the next card from the table. Fingers slide the higher cards right to open a slot, then the new card drops in. The fan is one card larger.",
      introduction:
        "Insertion sort is the hand-of-cards method: insert the next value into an already sorted left part.",
      prerequisiteCheck:
        "You should understand array indices and be able to move an element from a[j] to a[j+1] without losing the key.",
      examples: [
        {
          title: "Insert the second element",
          problem: "{3, 1, 2}: insert 1 into the prefix {3}.",
          steps: [
            "key = 1, j = 0, a[0]=3 > 1 so a[1] = 3.",
            "j becomes -1. Place key at a[0].",
            "Array is 1, 3, 2.",
          ],
          code: `#include <stdio.h>
int main(void) {
    int a[3] = {3, 1, 2};
    int key = a[1];
    int j = 0;
    while (j >= 0 && a[j] > key) {
        a[j + 1] = a[j];
        j--;
    }
    a[j + 1] = key;
    printf("%d %d %d\\n", a[0], a[1], a[2]);
    return 0;
}`,
          output: "1 3 2",
        },
        {
          title: "Complete insertion sort",
          problem: "Sort {3, 1, 2} fully.",
          steps: [
            "After inserting 1: 1, 3, 2.",
            "Insert 2: 3 shifts right, 2 lands in the middle.",
            "Result 1, 2, 3.",
          ],
          code: `#include <stdio.h>
void insertion(int a[], int n) {
    int i, j, key;
    for (i = 1; i < n; i++) {
        key = a[i];
        j = i - 1;
        while (j >= 0 && a[j] > key) {
            a[j + 1] = a[j];
            j--;
        }
        a[j + 1] = key;
    }
}
int main(void) {
    int a[3] = {3, 1, 2};
    insertion(a, 3);
    printf("%d %d %d\\n", a[0], a[1], a[2]);
    return 0;
}`,
          output: "1 2 3",
        },
      ],
      trace: {
        prompt: "Sorted prefix is {1, 4, 5}, key to insert is 3 (array 1,4,5,3). Array after this insertion?",
        answer: "1 3 4 5",
      },
      predict: {
        prompt: "On an already sorted array, how many shifts does each insertion perform?",
        answer: "0",
      },
      mistakes: [
        { wrong: "The inner loop always walks the whole array to the right.", why: "It walks left through the prefix, shifting larger values right." },
        { wrong: "You can overwrite a[i] with a shift before saving the key.", why: "Save key = a[i] first. The first shift may write over a[i]." },
        { wrong: "Insertion sort needs a second array.", why: "Shifts happen in the same array. It is an in-place method." },
      ],
      checks: [
        { q: "Which part is sorted before inserting a[i]?", a: "a[0] through a[i-1]" },
        { q: "Why store key = a[i]?", a: "so shifts can overwrite a[i] safely" },
        { q: "Where does the inner loop move?", a: "leftward through the prefix" },
      ],
      guided: {
        task: "Trace insertion sort on {5, 2, 4, 1} by writing the array after each i.",
        hint: "Start i=1. After each insertion the left i+1 elements should be sorted.",
      },
      independent: {
        task: "Implement insertion sort and count the number of shifts (assignments a[j+1]=a[j]) for {4,3,2,1} versus {1,2,3,4}.",
      },
      flashcards: [
        { front: "Insertion sort picture?", back: "Insert the next card into a sorted hand." },
        { front: "Prefix a[0..i-1]?", back: "Already sorted." },
        { front: "Save a[i] as?", back: "key" },
        { front: "Inner motion?", back: "Shift larger elements right; walk j left." },
        { front: "Place key at?", back: "a[j+1] after the while." },
        { front: "i starts at?", back: "1" },
        { front: "Nearly sorted data?", back: "Few shifts." },
      ],
      concepts: [
        {
          prompt: "How is a shift different from a swap?",
          explanation: "A shift copies one element right. The key is written once at the end, not swapped at every step.",
        },
        {
          prompt: "Why start i at 1?",
          explanation: "A single element is already a sorted prefix. The first insertion uses a[1].",
        },
      ],
      quickNotes: [
        "Left side is sorted; insert the next key.",
        "Save the key before shifting.",
        "Shift larger prefix elements right.",
        "Drop the key in the hole.",
        "i runs from 1 to n-1.",
        "Works well on nearly sorted lists.",
      ],
      distinctions: [
        "Insertion sort grows a sorted prefix. Bubble sort parks extremes at the end.",
        "Shifting is not the same as swapping every adjacent pair.",
      ],
      examShort: [
        "Explain insertion sort with the card picture.",
        "Why save key = a[i]?",
        "Write the while condition for shifting.",
      ],
      examLong:
        "Insertion sort keeps a sorted prefix on the left of the array. For i from 1 to n-1 the element a[i] is stored in a key variable. Index j starts at i-1 and moves left while j is valid and a[j] is greater than the key, shifting each such a[j] to a[j+1]. The key is then written at a[j+1], which is the correct hole. After the last i the prefix is the whole array. The method is in place. It performs little work on data that is already nearly ordered and more shifting when the data is reverse-sorted. It differs from bubble sort, which repeatedly swaps neighbours to move an extreme to the end.",
      visualizerIds: ["search-sort", "algorithm", "array-string"],
      relatedTopicIds: ["u5-t3", "u5-t5"],
      assessment: [
        { family: "algorithm", method: "algorithm", prompt: "Where is the key placed after the shift loop?", answer: "a[j+1]", marks: 2, explanation: "The opened hole." },
        { family: "trace", method: "trace", prompt: "Insert 0 into prefix {1,2,3} (array 1,2,3,0). Result?", answer: "0 1 2 3", marks: 2, explanation: "All three shift right." },
        { family: "debug", method: "identify_error", prompt: "Loop starts i=0 and uses key=a[0]. What is pointless or risky?", answer: "prefix is empty / j starts at -1; i should start at 1", marks: 2, explanation: "First element already sorted." },
        { family: "concept", method: "concept", prompt: "Does insertion sort need a second result array?", answer: "no", marks: 1, explanation: "In-place shifts." },
      ],
    },
    {
      topicId: "u5-t5",
      unitId: "unit-5",
      lessonId: "u5-t5-selection-sort",
      title: "Selection Sort",
      sourceLabel: "Sorting: Selection Sort.",
      objectives: [
        "Select the minimum of the unsorted suffix and swap it into the next front position.",
        "Trace one selection pass on a short list.",
        "State that the left prefix becomes finished after each swap.",
        "Contrast selection (one min, one swap per pass) with bubble (many adjacent swaps).",
      ],
      beginner:
        "Selection sort looks at the leftover part of the list, finds the smallest value, and swaps it into the first leftover slot. Then it forgets that slot and repeats. Each pass does a lot of looking and usually only one swap.",
      formal:
        "For i from 0 to n-2, find the index of the minimum in a[i..n-1] and swap that element with a[i]. The prefix a[0..i] is then in final order for an ascending sort. The algorithm is in place and performs at most n-1 swaps.",
      terms: [
        { term: "unsorted suffix", meaning: "The part of the array that has not yet been placed." },
        { term: "minimum index", meaning: "The position of the smallest value in the suffix." },
        { term: "selection", meaning: "Choosing that minimum to occupy the next finished slot." },
        { term: "pass i", meaning: "Scan from i to n-1, then swap with a[i]." },
        { term: "finished prefix", meaning: "The left elements that will not move again in this method." },
      ],
      explanation:
        "Selection sort is a global look, then a single placement. Start with i = 0. Scan the whole array for the smallest value; remember its index min. Swap a[min] with a[0]. Position 0 is done. Next i = 1: scan from 1 to n-1, find the smallest leftover, swap it into a[1]. Continue until i is n-2. The last element is automatically in place. Compared with bubble sort you do not swap every inversion you meet; you wait until you know the winner of the suffix. Compared with insertion sort you do not shift a hole; you swap two positions. The number of comparisons is still about the same order as the other simple sorts. If the minimum is already at i, you can skip the swap. Traces should list min after each inner scan, then the array after the swap. Selection sort is not stable in the usual swap form: a later equal key can jump in front of an earlier one. For this course, focus on the min-and-swap picture and on writing the inner loop that updates min when a[j] < a[min].",
      syntax:
        "for (i = 0; i < n - 1; i++) {\n    min = i;\n    for (j = i + 1; j < n; j++) {\n        if (a[j] < a[min]) min = j;\n    }\n    t = a[i]; a[i] = a[min]; a[min] = t;\n}",
      analogy:
        "Selection sort is lining up by repeatedly picking the shortest remaining person from the unmarked group and placing them at the next mark on the floor. You search the group each time; you do not bubble people past each other one step at a time.",
      introduction:
        "Selection sort is the third simple sort: pick the next minimum and swap it into place.",
      prerequisiteCheck:
        "You should be able to find the minimum of an array with a loop, and swap two elements.",
      examples: [
        {
          title: "First selection on {64, 25, 12, 22}",
          problem: "Place the minimum at index 0.",
          steps: [
            "min starts at 0 (64). 25 is smaller, 12 is smaller, 22 is not.",
            "min is 2 (12).",
            "Swap with a[0] → 12, 25, 64, 22.",
          ],
          code: `#include <stdio.h>
int main(void) {
    int a[4] = {64, 25, 12, 22};
    int min = 0, j, t;
    for (j = 1; j < 4; j++) {
        if (a[j] < a[min]) min = j;
    }
    t = a[0];
    a[0] = a[min];
    a[min] = t;
    printf("%d %d %d %d\\n", a[0], a[1], a[2], a[3]);
    return 0;
}`,
          output: "12 25 64 22",
        },
        {
          title: "Full selection sort",
          problem: "Sort {3, 1, 2}.",
          steps: [
            "i=0: min is 1, swap → 1, 3, 2.",
            "i=1: min is 2, swap → 1, 2, 3.",
            "Done.",
          ],
          code: `#include <stdio.h>
void selection(int a[], int n) {
    int i, j, min, t;
    for (i = 0; i < n - 1; i++) {
        min = i;
        for (j = i + 1; j < n; j++) {
            if (a[j] < a[min]) min = j;
        }
        t = a[i];
        a[i] = a[min];
        a[min] = t;
    }
}
int main(void) {
    int a[3] = {3, 1, 2};
    selection(a, 3);
    printf("%d %d %d\\n", a[0], a[1], a[2]);
    return 0;
}`,
          output: "1 2 3",
        },
      ],
      trace: {
        prompt: "First pass of selection sort on {5, 4, 1, 3}. Array after the swap?",
        answer: "1 4 5 3",
      },
      predict: {
        prompt: "How many swaps at most for n elements in the usual implementation?",
        answer: "n-1",
      },
      mistakes: [
        { wrong: "Selection sort swaps every time it sees a smaller value in the inner loop.", why: "It only remembers min and swaps once after the inner scan." },
        { wrong: "The inner loop starts at 0 every time.", why: "It starts at i+1. The prefix is already finished." },
        { wrong: "You need n passes including i = n-1.", why: "The last element is left in place after n-1 placements." },
      ],
      checks: [
        { q: "What do you find in the suffix?", a: "the minimum (for ascending)" },
        { q: "When do you swap?", a: "once after the inner scan, with a[i]" },
        { q: "Where does the inner loop start?", a: "i+1" },
      ],
      guided: {
        task: "Implement selection sort and print the index min before each swap for {9, 3, 7, 1}.",
        hint: "After the j loop and before the swap, printf min.",
      },
      independent: {
        task: "Write selection sort and bubble sort on the same input and count swaps. Comment on why the counts differ.",
      },
      flashcards: [
        { front: "Selection idea?", back: "Find the min of the leftover, swap into the next slot." },
        { front: "Inner loop finds?", back: "Index of the minimum." },
        { front: "Swaps per pass?", back: "At most one." },
        { front: "Prefix after i?", back: "The smallest i+1 elements in order." },
        { front: "i runs to?", back: "n-2 (loop i < n-1)." },
        { front: "Start min at?", back: "i" },
        { front: "Versus bubble?", back: "One placement swap, not many neighbour swaps." },
      ],
      concepts: [
        {
          prompt: "Why is the prefix 'finished'?",
          explanation: "Each placed value is the next smallest overall, so it will never need to move again in this algorithm.",
        },
        {
          prompt: "Can min stay equal to i?",
          explanation: "Yes, if a[i] is already the suffix minimum. The swap then exchanges an element with itself.",
        },
      ],
      quickNotes: [
        "Scan the suffix for the minimum index.",
        "Swap once with a[i].",
        "The left side is finished after each i.",
        "Inner loop starts at i+1.",
        "n-1 placements complete the sort.",
        "Looking is frequent; swapping is rare.",
      ],
      distinctions: [
        "Selection chooses a global min then swaps. Bubble fixes local inversions immediately.",
        "Insertion shifts a key into a prefix. Selection swaps a min into the front of the suffix.",
      ],
      examShort: [
        "State the selection-sort idea.",
        "Write how min is updated.",
        "How many swaps in the basic form at most?",
      ],
      examLong:
        "Selection sort builds a finished prefix from the left. For i from 0 to n-2 it finds the index of the minimum element in the suffix a[i..n-1] and swaps that element with a[i]. After that swap, a[i] holds the next value in ascending order and will not be moved again by this method. The inner loop only updates a min index; the swap happens once per i. The last element remains when n-1 values have been placed. The algorithm is in place. It differs from bubble sort, which may swap many adjacent pairs in a pass, and from insertion sort, which shifts a stored key into a sorted prefix.",
      visualizerIds: ["search-sort", "algorithm", "array-string"],
      relatedTopicIds: ["u5-t3", "u5-t4"],
      assessment: [
        { family: "trace", method: "trace", prompt: "Select min of {4, 2, 3} into index 0. Array?", answer: "2 4 3", marks: 2, explanation: "Swap 4 and 2." },
        { family: "algorithm", method: "algorithm", prompt: "What does the inner loop compute?", answer: "index of the minimum in the suffix", marks: 2, explanation: "min = j when a[j] < a[min]." },
        { family: "concept", method: "concept", prompt: "Does selection sort swap on every comparison?", answer: "no", marks: 1, explanation: "One swap after the scan." },
        { family: "predict", method: "predict", prompt: "After first pass on {1, 5, 0}, first element is?", answer: "0", marks: 1, explanation: "Minimum moved to front." },
      ],
    },
    {
      topicId: "u5-t6",
      unitId: "unit-5",
      lessonId: "u5-t6-quick-sort",
      title: "Quick Sort",
      sourceLabel: "Sorting: Quick Sort.",
      objectives: [
        "Describe partition: pick a pivot and split the range into smaller and larger sides.",
        "State that quick sort then sorts those two sides recursively.",
        "Trace a simple partition on a short range.",
        "Note that the time depends on pivot quality; a sorted list with a poor pivot is a slow case.",
      ],
      beginner:
        "Quick sort picks a pivot value. It rearranges the piece of the array so everything smaller than the pivot sits on the left and everything larger on the right. The pivot is then in its final home. The same idea is used on the left piece and on the right piece.",
      formal:
        "Quick sort is a divide-and-conquer sort. A partition step chooses a pivot and permutes a[low..high] so that a[p] is the pivot, all to the left are <= pivot (scheme-dependent), and all to the right are >= pivot. The two subranges are sorted by recursive calls. Depth and work depend on pivot balance.",
      terms: [
        { term: "pivot", meaning: "The value used to split a range into two sides." },
        { term: "partition", meaning: "The rearrangement that places the pivot in its final index." },
        { term: "subrange", meaning: "The left piece or the right piece after partition." },
        { term: "divide and conquer", meaning: "Solve two smaller sorts after one split." },
        { term: "unbalanced pivot", meaning: "A split that leaves one side almost empty, which makes many shallow layers of work." },
      ],
      explanation:
        "Quick sort is the first recursive sort in the unit. The engine is partition. One common classroom scheme: take the last element as pivot. Walk j from low to high-1. Whenever a[j] is less than or equal to the pivot, grow a left region and swap that a[j] into it. Finally swap the pivot just after that region. The pivot's index p is now correct for the whole array, not only for this pass. Then recurse on low .. p-1 and on p+1 .. high. The base case is an empty or single-element range. Recursion here is the same idea as Unit 4: smaller ranges, a stop condition. Quick sort is in place (a few locals plus stack frames). It is not the same as merge sort: it does not need a full extra array, but its running time depends on how balanced the splits are. If the array is already sorted and you always pick the last element as pivot, one side is empty every time and you get a long chain of calls — a slow case. Better pivot rules exist; for this course, trace a small last-element partition correctly. Integer comparisons use < or <= consistently with your chosen scheme so equal keys still finish in a valid order.",
      syntax:
        "/* last-element pivot sketch */\npivot = a[high];\ni = low;\nfor (j = low; j < high; j++) {\n    if (a[j] <= pivot) { swap(a[i], a[j]); i++; }\n}\nswap(a[i], a[high]);  /* pivot at i */\nquick(a, low, i - 1);\nquick(a, i + 1, high);",
      analogy:
        "Partition is asking everyone shorter than the chosen leader to stand left and everyone taller to stand right. The leader stays in the middle gap. Then each side repeats the same rule with its own leader.",
      introduction:
        "Quick sort splits a range around a pivot, then uses recursion on the two sides.",
      prerequisiteCheck:
        "You need array swaps, ranges [low, high], and the recursion base-case idea.",
      examples: [
        {
          title: "Partition with last pivot",
          problem: "Partition {4, 1, 3} with pivot 3 (last element).",
          steps: [
            "j=0: 4 > 3, no left growth.",
            "j=1: 1 <= 3, swap with a[0] → 1, 4, 3, then grow i.",
            "Swap pivot into a[1] → 1, 3, 4. Pivot index is 1.",
          ],
          code: `#include <stdio.h>
int partition(int a[], int low, int high) {
    int pivot = a[high];
    int i = low, j, t;
    for (j = low; j < high; j++) {
        if (a[j] <= pivot) {
            t = a[i]; a[i] = a[j]; a[j] = t;
            i++;
        }
    }
    t = a[i]; a[i] = a[high]; a[high] = t;
    return i;
}
int main(void) {
    int a[3] = {4, 1, 3};
    int p = partition(a, 0, 2);
    printf("%d | %d %d %d\\n", p, a[0], a[1], a[2]);
    return 0;
}`,
          output: "1 | 1 3 4",
        },
        {
          title: "Recursive sort of three values",
          problem: "Quick-sort {3, 1, 2}.",
          steps: [
            "Partition around 2 → 1, 2, 3 (or an equivalent valid split).",
            "Recurse on the empty or single-element sides.",
            "Array is sorted.",
          ],
          code: `#include <stdio.h>
int partition(int a[], int low, int high) {
    int pivot = a[high], i = low, j, t;
    for (j = low; j < high; j++) {
        if (a[j] <= pivot) {
            t = a[i]; a[i] = a[j]; a[j] = t;
            i++;
        }
    }
    t = a[i]; a[i] = a[high]; a[high] = t;
    return i;
}
void quick(int a[], int low, int high) {
    int p;
    if (low >= high) return;
    p = partition(a, low, high);
    quick(a, low, p - 1);
    quick(a, p + 1, high);
}
int main(void) {
    int a[3] = {3, 1, 2};
    quick(a, 0, 2);
    printf("%d %d %d\\n", a[0], a[1], a[2]);
    return 0;
}`,
          output: "1 2 3",
        },
      ],
      trace: {
        prompt: "After a correct partition, is the pivot already in its final sorted index?",
        answer: "yes",
      },
      predict: {
        prompt: "If low > high, what does the recursive function do?",
        answer: "return immediately (base case)",
      },
      mistakes: [
        { wrong: "Quick sort merges two sorted halves from an extra array.", why: "That is merge sort. Quick sort partitions in place, then recurses." },
        { wrong: "The pivot is only a comparison helper and then moves around forever.", why: "After partition the pivot sits at its final index." },
        { wrong: "A sorted array is always the fastest case.", why: "With a last-element pivot, a sorted array can be the unbalanced slow case." },
      ],
      checks: [
        { q: "What does partition do to the pivot?", a: "places it at its final index" },
        { q: "What happens after partition?", a: "recursive sort of left and right ranges" },
        { q: "Name a slow shape of splits.", a: "one side empty every time" },
      ],
      guided: {
        task: "On paper, partition {6, 3, 8, 5} with pivot 5 using the last-element scheme. Write i, j, and the array after each inner step.",
        hint: "Grow the <= region from the left. Swap the pivot into a[i] at the end.",
      },
      independent: {
        task: "Implement quick sort with a last-element pivot and test {10, 7, 8, 9, 1, 5}. Add a comment about unbalanced pivots.",
      },
      flashcards: [
        { front: "Pivot?", back: "The split value." },
        { front: "Partition result?", back: "Pivot in final place; sides unordered except vs pivot." },
        { front: "Then?", back: "Recurse left and right." },
        { front: "Base case?", back: "Range of size 0 or 1." },
        { front: "Extra full array?", back: "Not required (in-place partition)." },
        { front: "Bad pivot pattern?", back: "Always empty on one side." },
        { front: "Divide and conquer?", back: "Split, then sort the parts." },
      ],
      concepts: [
        {
          prompt: "Why can sides still look messy after partition?",
          explanation: "Only the pivot is guaranteed finished. Each side is only known to be on the correct side of the pivot.",
        },
        {
          prompt: "How is this recursion like factorial?",
          explanation: "A problem becomes smaller problems plus a simple stop. Here the smaller problems are shorter ranges.",
        },
      ],
      quickNotes: [
        "Pick a pivot and partition the range.",
        "The pivot's index is then final.",
        "Recurse on left and right.",
        "Stop on empty or single-element ranges.",
        "Balance of the split matters.",
        "This is not merge sort.",
      ],
      distinctions: [
        "Quick sort partitions then recurses. Merge sort recurses then merges.",
        "A finished pivot is not the same as two already-sorted halves.",
      ],
      examShort: [
        "What is a pivot?",
        "What does partition guarantee?",
        "Write the two recursive calls after index p.",
      ],
      examLong:
        "Quick sort is a divide-and-conquer algorithm. A partition step chooses a pivot and rearranges a range so the pivot occupies its final index, values on one side satisfy the chosen comparison against the pivot, and values on the other side satisfy the opposite comparison. The function then calls itself on the left subrange and the right subrange. Ranges of length 0 or 1 are base cases. The method is in place aside from recursive stack frames. Its work depends on how balanced the partitions are; always taking the last element of an already sorted range as pivot can produce empty sides and a long chain of calls. Classroom traces should show the array after partition and the pivot index before the recursive calls.",
      visualizerIds: ["search-sort", "recursion", "algorithm"],
      relatedTopicIds: ["u4-t5", "u5-t7", "u5-t5"],
      assessment: [
        { family: "concept", method: "concept", prompt: "After partition, is the pivot in its final position?", answer: "yes", marks: 1, explanation: "That is the guarantee." },
        { family: "algorithm", method: "algorithm", prompt: "What are the two recursive ranges after pivot index p?", answer: "low..p-1 and p+1..high", marks: 2, explanation: "Skip the finished pivot." },
        { family: "trace", method: "trace", prompt: "Partition {2, 1} pivot last=1. Pivot index?", answer: "0", marks: 2, explanation: "1 moves to the front." },
        { family: "short_answer", method: "definition", prompt: "What is an unbalanced partition?", answer: "one side nearly empty", marks: 2, explanation: "Leads to a deep, thin recursion." },
      ],
    },
    {
      topicId: "u5-t7",
      unitId: "unit-5",
      lessonId: "u5-t7-merge-sort",
      title: "Merge Sort",
      sourceLabel: "Sorting: Merge Sort.",
      objectives: [
        "Describe merge sort as splitting a range in half, sorting each half, then merging two sorted runs.",
        "Trace a merge of two short sorted lists into one.",
        "State that merge uses extra storage for the combined run.",
        "Contrast the recurse-then-combine order with quick sort.",
      ],
      beginner:
        "Merge sort splits the list in half, sorts each half (the same way), then zips the two sorted halves together. Zipping is easy because you only ever look at the front of each half and take the smaller head. You need a spare row of boxes for that zip.",
      formal:
        "Merge sort is divide-and-conquer. A range is split at mid. Each half is sorted recursively. A merge step combines two sorted sequences into one sorted sequence, typically using an auxiliary array. The base case is a range of length 0 or 1. Integer mid = (low + high) / 2 truncates.",
      terms: [
        { term: "split", meaning: "Cutting the current range into a left half and a right half at mid." },
        { term: "merge", meaning: "Combining two already-sorted runs into one sorted run." },
        { term: "run", meaning: "A contiguous sorted piece of the array." },
        { term: "auxiliary array", meaning: "Extra storage used while merging." },
        { term: "mid", meaning: "(low + high) / 2 with integer truncation." },
      ],
      explanation:
        "Merge sort does the recursive work first, then a linear combine. To sort a[low..high], if the range has at most one element it is done. Otherwise mid = (low + high) / 2 — again integer division, so the split is not a fractional index. Sort left low..mid. Sort right mid+1..high. Now you have two sorted runs. Merge them: keep an index on each run, copy the smaller current head into a temporary array, and advance that run. When one run is exhausted, copy the rest of the other. Copy the temporary back (or merge into a workspace sized for the whole array). That extra memory is the usual price. The method's split is even, so the recursion tree is balanced in length even if the values are already sorted — unlike last-pivot quick sort. Merge is stable if, when heads are equal, you take the left run first. Traces for exams often show the tree of halves and then the merged rows on the way up. Do not confuse merge with partition: merge needs two sorted inputs; partition does not.",
      syntax:
        "if (low >= high) return;\nmid = (low + high) / 2;\nmerge_sort(a, low, mid);\nmerge_sort(a, mid + 1, high);\nmerge(a, low, mid, high);  /* uses extra buffer */",
      analogy:
        "Two sorted stacks of exam scripts: you always take the script with the smaller mark from the two fronts and lay it on a third table. That third table is the extra space. The original stacks were made by the same process on smaller piles.",
      introduction:
        "Merge sort is the second recursive sort: split, sort halves, then merge two sorted runs using extra storage.",
      prerequisiteCheck:
        "You should know binary-search mid, recursion, and how to copy between arrays.",
      examples: [
        {
          title: "Merge two sorted runs",
          problem: "Merge left {1, 4} and right {2, 5} into {1, 2, 4, 5}.",
          steps: [
            "Heads 1 and 2: take 1.",
            "Heads 4 and 2: take 2.",
            "Heads 4 and 5: take 4, then 5.",
          ],
          code: `#include <stdio.h>
int main(void) {
    int left[2] = {1, 4};
    int right[2] = {2, 5};
    int out[4];
    int i = 0, j = 0, k = 0;
    while (i < 2 && j < 2) {
        if (left[i] <= right[j]) out[k++] = left[i++];
        else out[k++] = right[j++];
    }
    while (i < 2) out[k++] = left[i++];
    while (j < 2) out[k++] = right[j++];
    printf("%d %d %d %d\\n", out[0], out[1], out[2], out[3]);
    return 0;
}`,
          output: "1 2 4 5",
        },
        {
          title: "Full merge sort on four values",
          problem: "Sort {4, 1, 3, 2}.",
          steps: [
            "Split into {4,1} and {3,2}, then into singles.",
            "Merge to {1,4} and {2,3}.",
            "Merge to {1,2,3,4}.",
          ],
          code: `#include <stdio.h>
void merge(int a[], int low, int mid, int high) {
    int n1 = mid - low + 1, n2 = high - mid;
    int L[8], R[8];
    int i, j, k;
    for (i = 0; i < n1; i++) L[i] = a[low + i];
    for (j = 0; j < n2; j++) R[j] = a[mid + 1 + j];
    i = 0; j = 0; k = low;
    while (i < n1 && j < n2) {
        if (L[i] <= R[j]) a[k++] = L[i++];
        else a[k++] = R[j++];
    }
    while (i < n1) a[k++] = L[i++];
    while (j < n2) a[k++] = R[j++];
}
void merge_sort(int a[], int low, int high) {
    int mid;
    if (low >= high) return;
    mid = (low + high) / 2;
    merge_sort(a, low, mid);
    merge_sort(a, mid + 1, high);
    merge(a, low, mid, high);
}
int main(void) {
    int a[4] = {4, 1, 3, 2};
    merge_sort(a, 0, 3);
    printf("%d %d %d %d\\n", a[0], a[1], a[2], a[3]);
    return 0;
}`,
          output: "1 2 3 4",
        },
      ],
      trace: {
        prompt: "Merge {0, 5} with {1, 2}. First two values written?",
        answer: "0 then 1",
      },
      predict: {
        prompt: "mid for low=0 high=3 using int division?",
        answer: "1",
      },
      mistakes: [
        { wrong: "Merge sort partitions around a pivot like quick sort.", why: "It splits by index at mid, not by a pivot value." },
        { wrong: "You can merge two unsorted halves and still get a sorted result.", why: "Merge assumes both inputs are already sorted." },
        { wrong: "Merge sort never needs extra memory.", why: "The usual merge copies into an auxiliary array." },
      ],
      checks: [
        { q: "In which order do split, recurse, and merge happen?", a: "split, recurse both halves, then merge" },
        { q: "What extra thing does merge usually need?", a: "an auxiliary array" },
        { q: "Must each half be sorted before merge?", a: "yes" },
      ],
      guided: {
        task: "On paper, draw the split tree for {9, 1, 5, 3} and write each merged run on the way up.",
        hint: "Halve until singles. Merge pairs first, then the two pairs.",
      },
      independent: {
        task: "Implement merge and merge_sort for n <= 16 using a fixed temporary buffer. Test {5, 2, 4, 6, 1, 3}.",
      },
      flashcards: [
        { front: "Merge sort order of work?", back: "Split, sort halves, merge." },
        { front: "mid?", back: "(low + high) / 2, truncated." },
        { front: "Merge needs?", back: "Two sorted runs and extra space." },
        { front: "Take which head?", back: "The smaller current front." },
        { front: "Base case?", back: "One element or empty." },
        { front: "Split by value or index?", back: "By index." },
        { front: "Versus quick sort?", back: "Recurse first, then combine; uses extra array." },
      ],
      concepts: [
        {
          prompt: "Why is merge easy?",
          explanation: "Each input run is already ordered, so the next output value is always one of the two heads.",
        },
        {
          prompt: "Why mention integer division again?",
          explanation: "mid is an index. (low + high) / 2 drops a remainder, which still gives a valid split.",
        },
      ],
      quickNotes: [
        "Split the range at a truncated mid.",
        "Sort left, sort right, then merge.",
        "Merge walks two sorted runs.",
        "Use extra storage for the combined run.",
        "Base case is a tiny range.",
        "This is not pivot partition.",
      ],
      distinctions: [
        "Merge sort combines sorted halves. Quick sort splits by pivot then sorts the messy sides.",
        "Extra array for merge versus in-place partition for the usual quick sort.",
      ],
      examShort: [
        "Write the three steps of merge sort.",
        "How do you choose the next value while merging?",
        "Why is extra memory used?",
      ],
      examLong:
        "Merge sort sorts a range by dividing it at mid = (low + high) / 2, using integer division so mid is an index. Each half is sorted by a recursive call. A merge step then combines the two sorted runs. Merge compares the current heads and writes the smaller into an auxiliary array, then copies leftovers and writes the result back. A range of length 0 or 1 is a base case. The algorithm is divide-and-conquer like quick sort, but the split is by position rather than by a pivot, and the combine step needs extra storage. Merge requires sorted inputs; merging unsorted halves does not sort them.",
      visualizerIds: ["search-sort", "recursion", "algorithm"],
      relatedTopicIds: ["u5-t6", "u4-t5", "u5-t2"],
      assessment: [
        { family: "algorithm", method: "algorithm", prompt: "Order of merge-sort steps on a range.", answer: "split at mid, sort left, sort right, merge", marks: 2, explanation: "Recurse then combine." },
        { family: "trace", method: "trace", prompt: "Merge {1, 3} and {2}. Sequence written?", answer: "1 2 3", marks: 2, explanation: "Heads 1 then 2 then leftover 3." },
        { family: "concept", method: "concept", prompt: "Does typical merge need extra storage?", answer: "yes", marks: 1, explanation: "Auxiliary array." },
        { family: "predict", method: "predict", prompt: "(0+1)/2 in int for mid?", answer: "0", marks: 1, explanation: "Truncation." },
      ],
    },
    {
      topicId: "u5-t8",
      unitId: "unit-5",
      lessonId: "u5-t8-cforge-practice",
      title: "CForge practice problems for searching and sorting",
      sourceLabel: "Competitive Programming Practice Problems using global coding platforms, Experiments / Laboratory for Unit V.",
      provenance: "supplementary",
      officialLab: false,
      accuracyNotes: [
        "These are original CForge practice problems. They are not official university laboratory experiments and they are not problems copied from any named coding platform. No platform list was supplied in the source, so none is invented here.",
      ],
      objectives: [
        "Practise linear and binary search on short arrays you type yourself.",
        "Implement one simple sort and one recursive sort on the same input.",
        "Write a clear not-found and already-sorted case, not only the happy path.",
        "Keep these tasks labelled as CForge practice, not as official labs.",
      ],
      beginner:
        "This page is extra practice written for CForge. It is not a list of official college lab experiments and it does not pretend to be a problem from a named contest site. Use it to try search and sort again with your own numbers.",
      formal:
        "Supplementary CForge exercises covering linear search, binary search on a sorted copy, and the unit's sorting methods. Provenance is supplementary. officialLab is false. No university experiment sheet is reproduced or invented.",
      terms: [
        { term: "CForge practice", meaning: "An original exercise from this product, not an official lab sheet." },
        { term: "supplementary", meaning: "Extra material; not a substitute for a verified laboratory list." },
        { term: "edge case", meaning: "Empty-feeling inputs such as n=1, already sorted, or a missing key." },
        { term: "oracle check", meaning: "Comparing your function's array with a known correct order such as a tiny hand-sorted list." },
        { term: "sorted copy", meaning: "A second array you sort so binary search's prerequisite holds." },
      ],
      explanation:
        "The official Unit V line mentions competitive practice on global platforms and laboratory work. No named problems, platform identities, or experiment numbers were supplied with this curriculum, so CForge does not invent them. Instead this topic offers original practice that uses only the algorithms already taught: linear search, binary search after you sort, bubble or insertion or selection, and a recursive sort if you are ready. Each problem below is a CForge prompt. Treat a missing key as a first-class case. Treat n = 1 as a sort that must not walk off the array. If you want binary search, sort first — do not binary-search raw typed data. If you compare two sorts, use the same input and print both results; they should match. Do not write that these tasks carry official marks or come from a previous paper. They exist so you can practise without waiting for a lab handout. When a real laboratory list is verified later, it belongs in a different, labelled place.",
      syntax:
        "/* CForge practice shape */\nint n = /* small, known */;\nint a[32];\n/* fill a */\n/* call YOUR linear_search / sort */\n/* print indices or the sorted row */",
      analogy:
        "This is a practice pitch next to the official ground. Same ball (search and sort), but the drills are ours. Nobody should pretend the drill sheet is the university fixture list.",
      introduction:
        "Supplementary CForge practice for Unit 5. Not official labs. Not platform problems.",
      prerequisiteCheck:
        "You should have read linear search, binary search, and at least one sorting topic in this unit.",
      examples: [
        {
          title: "CForge practice: first index or none",
          problem: "CForge-1. Array {9, 4, 9, 1}. Report the first index of 9 and of 2 using linear search.",
          steps: [
            "Scan for 9; return 0.",
            "Scan for 2; return -1.",
            "Print 0 and -1. This is CForge practice, not a lab number.",
          ],
          code: `#include <stdio.h>
int linear_search(int a[], int n, int key) {
    int i;
    for (i = 0; i < n; i++) {
        if (a[i] == key) return i;
    }
    return -1;
}
int main(void) {
    int a[4] = {9, 4, 9, 1};
    printf("%d %d\\n", linear_search(a, 4, 9), linear_search(a, 4, 2));
    return 0;
}`,
          output: "0 -1",
        },
        {
          title: "CForge practice: sort then binary search",
          problem: "CForge-2. Start from {9, 4, 1}. Sort ascending with any taught sort, then binary-search for 4.",
          steps: [
            "Sort to {1, 4, 9}. Do not binary-search the unsorted triple.",
            "low=0 high=2 mid=1, a[1]=4.",
            "Return index 1 in the sorted copy.",
          ],
          code: `#include <stdio.h>
void insertion(int a[], int n) {
    int i, j, key;
    for (i = 1; i < n; i++) {
        key = a[i];
        j = i - 1;
        while (j >= 0 && a[j] > key) {
            a[j + 1] = a[j];
            j--;
        }
        a[j + 1] = key;
    }
}
int binary_search(int a[], int n, int key) {
    int low = 0, high = n - 1, mid;
    while (low <= high) {
        mid = (low + high) / 2;
        if (a[mid] == key) return mid;
        if (key < a[mid]) high = mid - 1;
        else low = mid + 1;
    }
    return -1;
}
int main(void) {
    int a[3] = {9, 4, 1};
    insertion(a, 3);
    printf("%d\\n", binary_search(a, 3, 4));
    return 0;
}`,
          output: "1",
        },
      ],
      trace: {
        prompt: "CForge-3. After insertion sort, {2, 2, 1} becomes what ascending row?",
        answer: "1 2 2",
      },
      predict: {
        prompt: "CForge-4. Binary search on unsorted {3, 1, 2} for 3 — is a correct hit guaranteed?",
        answer: "no",
      },
      mistakes: [
        { wrong: "These CForge tasks are official university lab experiments.", why: "They are original practice. officialLab is false." },
        { wrong: "You may binary-search the numbers in the order you typed them.", why: "Binary search still needs a sorted array. Sort a copy first." },
        { wrong: "A practice prompt invents official exam statistics.", why: "CForge practice does not assign official marks or cite papers that were not supplied." },
      ],
      checks: [
        { q: "Are these official labs?", a: "no" },
        { q: "What must you do before binary search in CForge-2?", a: "sort the array" },
        { q: "What should linear search return when the key is missing?", a: "-1 or another non-index" },
      ],
      guided: {
        task: "CForge-5. Implement bubble sort on {8, 3, 8, 1} and print the array after each pass. Label the program as CForge practice in a comment.",
        hint: "Adjacent swaps. After the first pass the largest 8 should sit at the end.",
      },
      independent: {
        task: "CForge-6. Write two functions, selection_sort and merge_sort (or quick_sort), run both on {11, 4, 7, 4, 0}, and print both results. They must match. CForge-7. Count how many linear-search comparisons you need to decide that 5 is missing from {1, 2, 3, 4}.",
      },
      flashcards: [
        { front: "Is this topic an official lab list?", back: "No. It is CForge supplementary practice." },
        { front: "CForge-1 missing key?", back: "Return a non-index such as -1." },
        { front: "CForge-2 order of work?", back: "Sort first, then binary search." },
        { front: "n = 1 sort?", back: "Leave the single element; do not read a[1]." },
        { front: "Two sorts on one input?", back: "Results must match." },
        { front: "Were platform problems supplied?", back: "No. None are invented here." },
        { front: "officialLab for this topic?", back: "false" },
      ],
      concepts: [
        {
          prompt: "Why keep this topic separate from official labs?",
          explanation: "The source mentioned laboratory and platforms but did not name items. Inventing a lab sheet would be inaccurate. CForge practice is labelled supplementary.",
        },
        {
          prompt: "What makes a good self-check here?",
          explanation: "A missing key, a one-element array, and two different sorts that agree on the same numbers.",
        },
      ],
      quickNotes: [
        "These problems are original CForge practice.",
        "They are not official university labs.",
        "No named contest-platform set was supplied.",
        "Sort before binary search.",
        "Always test a missing key.",
        "Two correct sorts must agree.",
      ],
      distinctions: [
        "Supplementary CForge practice versus an official laboratory sheet.",
        "Practising an algorithm versus claiming a previous-paper problem.",
      ],
      examShort: [
        "Why must you sort before binary search in practice?",
        "What sentinel can linear search return when a key is absent?",
        "State that CForge practice is not an official lab list.",
      ],
      examLong:
        "This topic is supplementary CForge practice for searching and sorting. It is not an official university laboratory list and it does not reproduce problems from a named global coding platform, because no such list was supplied. Students should reuse the unit methods: linear search that returns a first index or -1, binary search only after the array is sorted, and at least one simple sort plus one recursive sort on the same input so the results can be compared. Edge cases include a missing key, a one-element array, and already-sorted data. Opening this page is practice, not proof of a completed official experiment.",
      visualizerIds: ["search-sort", "algorithm"],
      relatedTopicIds: ["u5-t1", "u5-t2", "u5-t3", "u5-t6"],
      assessment: [
        { family: "concept", method: "concept", prompt: "Are these official university labs?", answer: "no", marks: 1, explanation: "Supplementary CForge practice." },
        { family: "algorithm", method: "algorithm", prompt: "CForge: steps to binary-search a value in an unordered list.", answer: "sort a copy, then binary search", marks: 2, explanation: "Sorted prerequisite." },
        { family: "predict", method: "predict", prompt: "Linear search for 5 in {1,2,3,4} returns?", answer: "-1", marks: 1, explanation: "Missing key." },
        { family: "short_answer", method: "independent_write", prompt: "Write one CForge practice task in a sentence that uses insertion sort.", answer: "sort a small array with insertion sort and print it", marks: 2, explanation: "Original practice, not a lab code." },
      ],
    },
  ];
}
