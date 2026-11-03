import { createRoot } from "react-dom/client";
import {
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
  RouterProvider,
} from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { AppShell } from "@/components/layout/AppShell";
import { CoursesPage } from "@/pages/CoursesPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { GradebookPage } from "@/pages/GradebookPage";
import { LoginPage } from "@/pages/LoginPage";
import { LtiLaunchPage } from "@/pages/LtiLaunchPage";
import "@/styles/globals.css";

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <h1 className="text-base font-semibold text-slate-900">{title}</h1>
      </div>
      <div className="flex flex-1 items-center justify-center p-6 text-sm text-slate-500">
        This area is ready for its feature module.
      </div>
    </div>
  );
}

function RootLayout() {
  return <Outlet />;
}

const rootRoute = createRootRoute({ component: RootLayout });
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/login" });
  },
});
const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "app",
  component: AppShell,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "login",
  component: LoginPage,
});

const ltiLaunchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "lti-launch",
  component: LtiLaunchPage,
});

const dashboardRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "dashboard",
  component: DashboardPage,
});

const coursesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "courses",
  component: CoursesPage,
});

const newCourseRoute = createRoute({
  getParentRoute: () => coursesRoute,
  path: "new",
  component: () => <PlaceholderPage title="New Course" />,
});

const courseShellRoute = createRoute({
  getParentRoute: () => coursesRoute,
  path: "$shellId",
  component: CoursesPage,
});

const gradebookRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "gradebook",
  component: GradebookPage,
});

const crosslistRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "crosslist",
  component: () => <PlaceholderPage title="Cross-list" />,
});

const myGradesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "my-grades",
  component: () => <PlaceholderPage title="My Grades" />,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  ltiLaunchRoute,
  appRoute.addChildren([
    dashboardRoute,
    coursesRoute.addChildren([newCourseRoute, courseShellRoute]),
    gradebookRoute,
    crosslistRoute,
    myGradesRoute,
  ]),
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Missing root element");

createRoot(rootElement).render(
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={router} />
  </QueryClientProvider>,
);
