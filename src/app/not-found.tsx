export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col justify-center px-8 sm:px-20">
      <p className="caption">404</p>
      <h1 className="mt-4 font-serif text-4xl font-light sm:text-5xl lg:text-6xl" data-testid="not-found-title">This page doesn’t exist.</h1>
      <p className="mt-4 max-w-md text-sm text-neutral-600">If you were sent a gallery link, check that it was copied in full.</p>
    </main>
  );
}
