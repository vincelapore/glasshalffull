"use server";

import { isAdminAuthenticated } from "@/lib/admin";
import { searchAdminRecords } from "@/lib/queries";

export async function searchAdminRecordsAction(query: string) {
  if (!(await isAdminAuthenticated())) {
    return { success: false as const, message: "Unauthorized", results: [] };
  }

  const results = await searchAdminRecords(query);
  return { success: true as const, message: "", results };
}
