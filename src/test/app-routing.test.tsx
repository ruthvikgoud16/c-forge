import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  it("matches a page for / instead of falling back to not found", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });

  it("registers onboarding and diagnostic student routes", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    expect(router.matchRoutes("/learn/onboarding").at(-1)?.routeId).toBe("/learn/onboarding");
    expect(router.matchRoutes("/learn/diagnostic").at(-1)?.routeId).toBe("/learn/diagnostic");
    expect(router.matchRoutes("/learn").at(-1)?.routeId).toBe("/learn/");
    expect(router.matchRoutes("/learn/path").at(-1)?.routeId).toBe("/learn/path");
    expect(router.matchRoutes("/learn/progress").at(-1)?.routeId).toBe("/learn/progress");
    expect(router.matchRoutes("/learn/foundation").at(-1)?.routeId).toBe("/learn/foundation");
    expect(router.matchRoutes("/learn/foundation/f-basic-computer").at(-1)?.routeId).toBe("/learn/foundation/$topicId");
    expect(router.matchRoutes("/learn/labs").at(-1)?.routeId).toBe("/learn/labs");
    expect(router.matchRoutes("/learn/papers").at(-1)?.routeId).toBe("/learn/papers");
    expect(router.matchRoutes("/faculty/labs").at(-1)?.routeId).toBe("/faculty/labs");
    expect(router.matchRoutes("/faculty/papers").at(-1)?.routeId).toBe("/faculty/papers");
  });
});
