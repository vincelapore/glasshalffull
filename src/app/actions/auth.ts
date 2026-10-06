"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/server";

export async function signOutAction() {
  await auth.signOut();

  // HTTP localhost stores cookies without the `__Secure-` prefix.
  const store = await cookies();
  for (const name of [
    "neon-auth.session_token",
    "neon-auth.local.session_data",
  ]) {
    store.set(name, "", { path: "/", maxAge: 0 });
  }

  redirect("/");
}
