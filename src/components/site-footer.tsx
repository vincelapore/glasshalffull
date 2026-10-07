import Image from "next/image";
import Link from "next/link";

import { publicNavLinks } from "@/components/site-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { creativePath } from "@/lib/paths";

const instagramHref = "https://instagram.com/glasshalffull_brisbane";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto px-3 pt-10 pb-3 sm:px-4 sm:pb-4">
      <div className="relative overflow-clip rounded-[1.5rem] bg-[#3c5cff] text-white">
        <Image
          src="/mark.png"
          alt=""
          width={552}
          height={608}
          aria-hidden
          className="pointer-events-none absolute -bottom-10 -left-10 h-[16rem] w-auto max-w-none opacity-45 select-none sm:-bottom-14 sm:-left-14 sm:h-[22rem]"
        />
        <div className="relative flex flex-col px-5 py-6 sm:px-8 sm:py-8 md:px-10">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-heading text-lg leading-snug sm:text-xl">
                Pour back in. Stay connected{" "}
                <span className="whitespace-nowrap">muchacho. 🚰</span>
              </p>
              <a
                href={instagramHref}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="mt-4 inline-flex transition-opacity hover:opacity-60"
              >
                <InstagramIcon />
              </a>
            </div>

            <nav className="flex flex-col items-start gap-1.5 text-xs">
              {publicNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="transition-opacity hover:opacity-60"
                >
                  {link.label}
                </Link>
              ))}
              <ThemeToggle className="size-7 text-white hover:bg-white/15 hover:text-white" />
            </nav>
          </div>

          <div className="mt-12 flex flex-col gap-8 md:mt-16 md:flex-row md:items-center md:justify-between md:gap-12">
            <p className="font-heading pb-[0.08em] text-[3.75rem] leading-[0.92] font-extrabold tracking-tight sm:text-[clamp(7rem,18vw,13rem)]">
              ghf.
            </p>

            <div className="ml-auto flex w-full max-w-xs flex-col gap-4 text-right">
              <p className="text-xs leading-snug text-white/85">
                Glass Half Full operates on the unceded lands of the Yugera and
                Turrbal peoples of Meanjin, and the Wurundjeri and Boon Wurrung
                peoples of the Kulin Nation in Naarm. We pay our respects to
                the original owners of this land and their legacy.
              </p>
              <div className="text-[11px] text-white/70">
                <p>© {year} Glass Half Full</p>
                <p>
                  Website by{" "}
                  <Link
                    href={creativePath("vince-lapore")}
                    className="underline underline-offset-4 transition-opacity hover:opacity-60"
                  >
                    this guy
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function InstagramIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}
