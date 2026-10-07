"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  addEventOrganiserAction,
  inviteEventOrganiserAction,
  removeEventOrganiserAction,
  searchCreativesAction,
} from "@/app/actions/organisers";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Notice } from "@/components/ui/notice";
import { cityLabels } from "@/lib/labels";
import type { cities } from "@/lib/validations";

type Organiser = {
  id: string;
  name: string;
  claimed: boolean;
  inviteEmail: string | null;
};

type SearchHit = {
  id: string;
  name: string;
  city: (typeof cities)[number] | null;
};

export function EventOrganisersPanel({
  eventId,
  organisers,
}: {
  eventId: string;
  organisers: Organiser[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchHit[]>([]);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const organiserIds = new Set(organisers.map((organiser) => organiser.id));

  function run(action: () => Promise<{ success: boolean; message: string }>) {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.success) {
        setError(result.message);
        return;
      }
      setMessage(result.message);
      router.refresh();
    });
  }

  function onSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await searchCreativesAction(eventId, query);
      if (!result.success) {
        setError(result.message);
        setResults([]);
        return;
      }
      setResults(result.results);
      if (result.results.length === 0) {
        setMessage("No profiles match that name.");
      }
    });
  }

  function onInvite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await inviteEventOrganiserAction(eventId, {
        name: inviteName,
        email: inviteEmail,
      });
      if (!result.success) {
        setError(result.message);
        return;
      }
      setInviteName("");
      setInviteEmail("");
      setMessage(result.message);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <ul className="divide-y divide-border rounded-xl border border-border">
        {organisers.length === 0 ? (
          <li className="px-4 py-3 text-sm text-muted-foreground">
            No organisers yet.
          </li>
        ) : (
          organisers.map((organiser) => (
            <li
              key={organiser.id}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div>
                <p className="font-medium">{organiser.name}</p>
                <p className="text-sm text-muted-foreground">
                  {organiser.claimed
                    ? "Linked to an account"
                    : organiser.inviteEmail
                      ? `Waiting for ${organiser.inviteEmail} to sign up`
                      : "No account yet"}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={pending}
                onClick={() =>
                  run(() => removeEventOrganiserAction(eventId, organiser.id))
                }
              >
                Remove
              </Button>
            </li>
          ))
        )}
      </ul>

      <form onSubmit={onSearch} className="space-y-3">
        <Field>
          <Label htmlFor="organiser-search">Add someone from the directory</Label>
          <div className="flex gap-2">
            <Input
              id="organiser-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name"
            />
            <Button type="submit" variant="outline" disabled={pending}>
              Search
            </Button>
          </div>
        </Field>
        {results.length > 0 ? (
          <ul className="divide-y divide-border rounded-xl border border-border">
            {results.map((hit) => {
              const added = organiserIds.has(hit.id);
              return (
                <li
                  key={hit.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div>
                    <p className="font-medium">{hit.name}</p>
                    {hit.city ? (
                      <p className="text-sm text-muted-foreground">
                        {cityLabels[hit.city]}
                      </p>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={pending || added}
                    onClick={() =>
                      run(() => addEventOrganiserAction(eventId, hit.id))
                    }
                  >
                    {added ? "Added" : "Add"}
                  </Button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </form>

      <form onSubmit={onInvite} className="space-y-3">
        <Field>
          <Label htmlFor="invite-name">Invite someone new</Label>
          <Input
            id="invite-name"
            value={inviteName}
            onChange={(event) => setInviteName(event.target.value)}
            placeholder="Name"
          />
        </Field>
        <Field>
          <Label htmlFor="invite-email">Email</Label>
          <Input
            id="invite-email"
            type="email"
            autoComplete="off"
            value={inviteEmail}
            onChange={(event) => setInviteEmail(event.target.value)}
            placeholder="name@example.com"
          />
          <p className="text-sm text-muted-foreground">
            Ask them to sign up with this email. The profile becomes theirs
            when they do.
          </p>
        </Field>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Add organiser"}
        </Button>
      </form>

      {error ? <Notice variant="destructive">{error}</Notice> : null}
      {message ? <Notice variant="muted">{message}</Notice> : null}
    </div>
  );
}
