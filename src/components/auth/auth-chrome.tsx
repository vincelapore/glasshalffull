import Image from "next/image";
import Link from "next/link";

import { AuthBackButton } from "@/components/auth/auth-back-button";
import { pageWidths } from "@/components/ui/page";

/**
 * Minimal chrome for sign-in, sign-up, and password recovery.
 * Form sits optically centered (slightly above true middle); scrolls on short viewports.
 */
export function AuthChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <header className="relative shrink-0 px-4 pt-6 sm:px-6">
        <div className={`relative mx-auto ${pageWidths.auth}`}>
          <div className="absolute top-1/2 left-0 -translate-y-1/2">
            <AuthBackButton />
          </div>
          <div className="flex justify-center">
            <Link href="/" aria-label="Glass Half Full" className="shrink-0">
              <Image
                src="/mark.png"
                alt=""
                width={487}
                height={542}
                priority
                className="h-8 w-auto dark:invert"
              />
            </Link>
          </div>
        </div>
      </header>
      <main className="flex flex-1 flex-col justify-center overflow-y-auto pt-6 pb-16 sm:pb-24">
        {children}
      </main>
    </div>
  );
}
