export default function HomePage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-16 sm:px-6">
      <section className="space-y-4">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Glass Half Full
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Pouring back into Brisbane&apos;s creative scene.
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Discover events, meet the artists behind them, and reconnect with the
          local music, art, queer, and fashion community.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">Featured Events</h2>
        <p className="text-sm text-muted-foreground">
          Featured events grid placeholder — UI coming next.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">
          Discover Creatives
        </h2>
        <p className="text-sm text-muted-foreground">
          Creatives carousel placeholder — UI coming next.
        </p>
      </section>
    </div>
  );
}
