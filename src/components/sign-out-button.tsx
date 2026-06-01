"use client";

import { signOut } from "@/app/actions/auth";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        로그아웃
      </button>
    </form>
  );
}
