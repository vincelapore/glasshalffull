import { HideHeaderOnFooter } from "@/components/hide-header-on-footer";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <HideHeaderOnFooter />
      <main className="flex-1 pt-[4.25rem]">{children}</main>
      <SiteFooter />
    </>
  );
}
