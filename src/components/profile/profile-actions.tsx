"use client";

import { useState } from "react";
import { KeyRound, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChangePasswordDialog } from "@/components/profile/change-password-dialog";
import { DeleteAccountDialog } from "@/components/profile/delete-account-dialog";

type Props = {
  hasPassword: boolean;
  email: string;
};

export function ProfileActions({ hasPassword, email }: Props) {
  const [changeOpen, setChangeOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <div className="rounded-lg border border-border divide-y divide-border">
        {hasPassword && (
          <div className="flex items-center gap-4 px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Change password</p>
              <p className="text-xs text-muted-foreground">
                Update the password used to sign in.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setChangeOpen(true)}
            >
              <KeyRound className="size-4" />
              Change
            </Button>
          </div>
        )}

        <div className="flex items-center gap-4 px-4 py-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-destructive">Delete account</p>
            <p className="text-xs text-muted-foreground">
              Permanently delete your account and all your data.
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="size-4" />
            Delete
          </Button>
        </div>
      </div>

      <ChangePasswordDialog open={changeOpen} onOpenChange={setChangeOpen} />
      <DeleteAccountDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        email={email}
      />
    </>
  );
}
