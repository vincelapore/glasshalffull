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
      <div className="relative overflow-hidden rounded-[1.75rem] bg-[#3c5cff] text-white">
        <Image
          src="/mark.png"
          alt=""
          width={552}
          height={608}
          aria-hidden
          className="pointer-events-none absolute -bottom-12 -left-12 h-[20rem] w-auto max-w-none opacity-50 select-none sm:-bottom-16 sm:-left-16 sm:h-[24rem]"
        />
        <div className="relative flex flex-col px-6 py-8 sm:px-10 sm:py-10 md:px-12">
          <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
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

            <nav className="flex flex-col items-start gap-1.5 text-sm">
              {publicNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="transition-opacity hover:opacity-60"
                >
                  {link.label}
                </Link>
              ))}
              <ThemeToggle
                appearance="text"
                className="w-fit font-normal tracking-normal text-white normal-case"
              />
            </nav>
          </div>

          <div className="mt-16 flex flex-col gap-8 md:mt-24 md:flex-row md:items-end md:justify-between">
            <p className="font-heading text-[3.25rem] leading-[0.8] font-extrabold tracking-tight sm:text-[clamp(5.5rem,16vw,11rem)]">
              ghf.
            </p>

            <div className="flex max-w-sm flex-col gap-8 md:items-end">
              <p className="text-sm leading-relaxed text-white/90 md:text-center">
                Glass Half Full operates on the unceded lands of the Yugera and
                Turrbal peoples of Meanjin, and the Wurundjeri and Boon Wurrung
                peoples of the Kulin Nation in Naarm. We pay our respects to
                the original owners of this land and their legacy.
              </p>
              <div className="text-sm md:text-right">
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
      className="size-6"
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
