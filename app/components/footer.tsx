import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="mt-auto hidden border-t border-border bg-surface/50 md:block">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-8 text-sm text-muted sm:flex-row sm:justify-between sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Image
            src="/dokit_logo.svg"
            alt="DoKit"
            width={24}
            height={24}
            className="h-6 w-6"
          />
          <span className="font-semibold text-foreground">DoKit</span>
          <span className="text-muted">·</span>
          <span>Pick a tool, do the job, keep moving.</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/tools"
            className="transition-colors hover:text-foreground"
          >
            Tools
          </Link>
          <span className="text-border">·</span>
          <span>© {new Date().getFullYear()} DoKit</span>
        </div>
      </div>
    </footer>
  );
}
