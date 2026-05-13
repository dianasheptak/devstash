'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { updateCollection } from '@/actions/collections';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collection: { id: string; name: string; description: string | null };
};

export function EditCollectionDialog({ open, onOpenChange, collection }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(collection.name);
  const [description, setDescription] = useState(collection.description ?? '');

  useEffect(() => {
    if (open) {
      setName(collection.name);
      setDescription(collection.description ?? '');
    }
  }, [open, collection.name, collection.description]);

  const canSubmit = name.trim().length > 0 && !pending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    startTransition(async () => {
      const result = await updateCollection(collection.id, { name, description });

      if (result.success) {
        toast.success('Collection updated');
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Collection</DialogTitle>
          <DialogDescription>Update the name and description.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="ec-name" className="text-xs font-medium text-muted-foreground">
              Name
            </label>
            <Input
              id="ec-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. React Patterns"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="ec-description" className="text-xs font-medium text-muted-foreground">
              Description
            </label>
            <Textarea
              id="ec-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Optional"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={pending}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit} className="cursor-pointer">
              {pending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
