export default function ContactLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="h-16 border-b" />
      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-16">
        <div className="mx-auto h-6 w-32 animate-pulse rounded-full bg-muted" />
        <div className="mx-auto mt-6 h-12 w-96 max-w-full animate-pulse rounded-lg bg-muted" />
        <div className="mx-auto mt-4 h-6 w-3/4 animate-pulse rounded-md bg-muted" />
        <div className="mx-auto mt-10 h-96 max-w-lg animate-pulse rounded-2xl bg-muted" />
      </div>
    </div>
  );
}
