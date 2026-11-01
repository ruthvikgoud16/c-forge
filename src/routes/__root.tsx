import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { ProductHomeActions, ProductNotice } from "@/components/common/ProductNotice";
import { AppearanceProvider } from "@/components/common/AppearanceProvider";
import { Button } from "@/components/ui/button";

function NotFoundComponent() {
  return (
    <ProductNotice
      eyebrow="CForge"
      title="This page is not in CForge"
      body="That address does not match a public, student, or faculty screen. Nothing was invented for it."
    >
      <ProductHomeActions />
    </ProductNotice>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <ProductNotice
      eyebrow="CForge"
      title="This page did not load"
      body="The original API or this screen failed. No catalog, progress, or faculty counts were invented."
    >
      <Button variant="hero" className="rounded-full" onClick={() => { router.invalidate(); reset(); }}>Try again</Button>
      <ProductHomeActions />
    </ProductNotice>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "CForge — C Programming Academy" },
      { name: "description", content: "A structured C programming academy for engineering students." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `(()=>{try{if(localStorage.getItem("cforge_appearance")==="dark"){document.documentElement.classList.add("dark");document.documentElement.style.colorScheme="dark";}}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AppearanceProvider>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
        <Toaster position="top-right" />
      </AppearanceProvider>
    </QueryClientProvider>
  );
}
