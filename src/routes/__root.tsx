import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { CustomCursor } from "@/components/site/custom-cursor";
import { FloatingCTA } from "@/components/site/floating-cta";
import appCss from "../styles.css?url";

const APP_NAME = "ProtoPatch";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      {
        name: "description",
        content:
          "ProtoPatch turns hand-drawn napkin sketches into live full-stack apps and mobile bug recordings into autonomous GitHub pull requests.",
      },
      { name: "theme-color", content: "#F4F4F0" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.json" },
    ],
  }),
  component: () => (
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="bg-paper text-ink font-sans">
        <CustomCursor />
        <AuthProvider>
          <Outlet />
          <FloatingCTA />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});


