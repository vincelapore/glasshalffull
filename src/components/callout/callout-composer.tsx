"use client";

import { useState, type FormEvent } from "react";

import { ProfileCallout } from "@/components/callout/profile-callout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  calloutKindLabels,
  calloutKinds,
  MAX_CALLOUT_BODY,
  MAX_CALLOUT_ROLES,
  type CalloutKind,
  type CalloutRoleChoice,
} from "@/lib/callouts";
import type { ExampleCallout } from "@/lib/example-callouts";
import { roleLabels } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { creativeRoles } from "@/lib/validations";

type DraftRole = {
  key: string;
  role: CalloutRoleChoice;
  kind: CalloutKind;
};

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

function blankRole(): DraftRole {
  return { key: crypto.randomUUID(), role: "photographer", kind: "paid" };
}

export function CalloutComposer() {
  const [body, setBody] = useState("");
  const [roles, setRoles] = useState<DraftRole[]>(() => [blankRole()]);
  const [error, setError] = useState<string | null>(null);
  const [posted, setPosted] = useState<ExampleCallout | null>(null);

  function updateRole(key: string, patch: Partial<DraftRole>) {
    setError(null);
    setRoles((current) =>
      current.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
  }

  function post(event: FormEvent) {
    event.preventDefault();
    const text = body.trim();

    if (!text) {
      setError("Write what you need.");
      return;
    }

    const chosen = roles.map((row) => row.role);
    if (new Set(chosen).size !== chosen.length) {
      setError("Each role can only be listed once.");
      return;
    }

    setError(null);
    setPosted({
      id: `draft-${crypto.randomUUID()}`,
      body: text,
      daysLeft: "7 days left",
      poster: {
        name: "You",
        city: "meanjin",
        avatarSrc: "",
        href: null,
      },
      roles: roles.map((row) => ({
        id: row.key,
        role: row.role,
        kind: row.kind,
      })),
    });
  }

  if (posted) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          This is how it would sit on your page. Nothing was saved.
        </p>
        <ProfileCallout callout={posted} />
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setPosted(null);
            setBody("");
            setRoles([blankRole()]);
          }}
        >
          Write another
        </Button>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={post}>
      <div className="space-y-2">
        <Label htmlFor="callout-body">What you need</Label>
        <Textarea
          id="callout-body"
          value={body}
          maxLength={MAX_CALLOUT_BODY}
          rows={3}
          placeholder="What you need, and when."
          onChange={(event) => {
            setError(null);
            setBody(event.target.value);
          }}
        />
        <p className="text-xs text-muted-foreground">
          {body.length}/{MAX_CALLOUT_BODY} · up for seven days
        </p>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Roles</legend>
        {roles.map((row) => (
          <div
            key={row.key}
            className="space-y-2 rounded-xl border border-border p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">Role</span>
              {roles.length > 1 ? (
                <button
                  type="button"
                  className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  onClick={() =>
                    setRoles((current) =>
                      current.filter((item) => item.key !== row.key),
                    )
                  }
                >
                  Remove
                </button>
              ) : null}
            </div>
            <select
              value={row.role}
              className={selectClassName}
              onChange={(event) =>
                updateRole(row.key, {
                  role: event.target.value as CalloutRoleChoice,
                })
              }
            >
              {creativeRoles.map((role) => (
                <option key={role} value={role}>
                  {roleLabels[role]}
                </option>
              ))}
            </select>
            <div className="flex flex-wrap gap-1.5">
              {calloutKinds.map((kind) => {
                const active = row.kind === kind;
                return (
                  <button
                    key={kind}
                    type="button"
                    aria-pressed={active}
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-sm transition-colors",
                      active
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:bg-foreground/10 hover:text-foreground",
                    )}
                    onClick={() => updateRole(row.key, { kind })}
                  >
                    {calloutKindLabels[kind]}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {roles.length < MAX_CALLOUT_ROLES ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setRoles((current) => [...current, blankRole()])}
          >
            Add role
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground">Four roles is the cap.</p>
        )}
      </fieldset>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button type="submit">Post callout</Button>
    </form>
  );
}
