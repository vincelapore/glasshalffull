"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";

import { searchAdminRecordsAction } from "@/app/actions/admin-find";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { statusLabels } from "@/lib/labels";

type FindResult = {
  id: string;
  kind: "event" | "profile";
  label: string;
  status: keyof typeof statusLabels;
  href: string;
};

const kindLabels = {
  event: "Event",
  profile: "Profile",
} as const;

export function AdminFind({ children }: { children: React.ReactNode }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FindResult[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const request = useRef(0);

  const term = query.trim();
  const searching = term.length >= 2;

  useEffect(() => {
    if (!searching) return;

    const current = ++request.current;
    const handle = setTimeout(() => {
      startTransition(async () => {
        const result = await searchAdminRecordsAction(term);
        if (current !== request.current) return;
        if (!result.success) {
          setResults([]);
          setMessage(result.message);
          return;
        }
        setResults(result.results);
        setMessage(result.results.length === 0 ? "Nothing matches." : null);
      });
    }, 200);

    return () => clearTimeout(handle);
  }, [searching, term]);

  return (
    <>
      <div className="mb-8">
        <label className="block">
          <span className="sr-only">Find an event or profile to edit</span>
          <Input
            value={query}
            placeholder="Find an event or profile"
            onChange={(event) => {
              const next = event.target.value;
              setQuery(next);
              if (next.trim().length < 2) {
                request.current += 1;
                setResults([]);
                setMessage(null);
              }
            }}
          />
        </label>
        {searching ? (
          message ? (
            <p className="mt-3 text-sm text-muted-foreground">{message}</p>
          ) : results.length > 0 ? (
            <ul className="mt-3 overflow-hidden rounded-lg border border-border">
              {results.map((item) => (
                <li
                  key={`${item.kind}-${item.id}`}
                  className="border-b border-border last:border-b-0"
                >
                  <Link
                    href={item.href}
                    className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm hover:bg-muted/40"
                  >
                    <span className="min-w-0 truncate font-medium">
                      {item.label}
                    </span>
                    <span className="flex shrink-0 items-center gap-2 text-muted-foreground">
                      <Badge variant="outline">{kindLabels[item.kind]}</Badge>
                      {item.status === "pending"
                        ? "Needs review"
                        : statusLabels[item.status]}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null
        ) : null}
      </div>
      {searching ? null : children}
    </>
  );
}
