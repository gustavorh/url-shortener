// Skeleton shown while the dashboard server component fetches data.
export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen">
      <div className="hidden md:block w-64 shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700" />
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 px-6 py-10 md:px-12 md:py-12 mt-14 md:mt-0 outline-none"
      >
        <div className="max-w-5xl mx-auto animate-pulse">
          <div className="h-8 w-40 rounded-lg bg-gray-200 dark:bg-gray-700" />
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-20 rounded-2xl bg-gray-200 dark:bg-gray-700"
              />
            ))}
          </div>
          <div className="mt-5 h-64 rounded-2xl bg-gray-200 dark:bg-gray-700" />
        </div>
      </main>
    </div>
  );
}
