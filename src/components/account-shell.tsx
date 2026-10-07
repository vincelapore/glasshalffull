import { AccountTabs } from "@/components/account-tabs";
import { Page, PageHeader } from "@/components/ui/page";

export function AccountShell({
  user,
  children,
}: {
  user: { name?: string | null; email?: string | null };
  children: React.ReactNode;
}) {
  const name = user.name?.trim();
  const email = user.email?.trim();

  return (
    <Page width="narrow">
      <PageHeader
        className="mb-6"
        title="Account"
        description={
          <>
            {name || email}
            {email && name ? ` · ${email}` : null}
          </>
        }
      />
      <AccountTabs />
      {children}
    </Page>
  );
}
