import Link from "next/link";

export function ProseLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <article className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <header className="mb-10 text-center">
        <h1 className="text-3xl sm:text-5xl font-bold text-primary mb-2">
          {title}
        </h1>
        {subtitle && (
          <p className="text-lg text-muted-foreground">{subtitle}</p>
        )}
      </header>
      <div className="space-y-8 text-muted-foreground leading-relaxed [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-primary [&_h2]:mb-3 [&_h2]:mt-8 [&_p]:mb-4 [&_a]:text-accent [&_a]:underline [&_a:hover]:text-accent-foreground [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-2">
        {children}
      </div>
      <div className="mt-12 pt-6 border-t border-border text-center">
        <Link
          href="/stable-yields"
          className="text-accent hover:text-accent-foreground underline"
        >
          Back to Yield Comparison Table
        </Link>
      </div>
    </article>
  );
}
