'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Star, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ICON_MAP } from '@/lib/constants/item-types';
import type { CollectionWithMeta } from '@/lib/db/collections';
import { deleteCollection } from '@/actions/collections';
import { EditCollectionDialog } from '@/components/collections/edit-collection-dialog';

export function CollectionCard({ col }: { col: CollectionWithMeta }) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deletePending, startDeleteTransition] = useTransition();

  const handleCardClick = () => {
    router.push(`/collections/${col.slug}`);
  };

  const handleDelete = () => {
    startDeleteTransition(async () => {
      const result = await deleteCollection(col.id);
      if (result.success) {
        toast.success('Collection deleted');
        setDeleteOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <>
      <Card
        size="sm"
        className="hover:ring-foreground/20 transition-shadow cursor-pointer h-full border-l-[3px] relative"
        style={{ borderLeftColor: col.dominantColor }}
        onClick={handleCardClick}
      >
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="truncate">{col.name}</CardTitle>
            <div className="flex items-center gap-1 shrink-0">
              {col.isFavorite && (
                <Star className="size-3.5 fill-yellow-400 text-yellow-400" />
              )}
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="size-3.5" />
                  <span className="sr-only">Collection options</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => setEditOpen(true)}
                  >
                    <Pencil className="size-3.5 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" disabled>
                    <Star className="size-3.5 mr-2" />
                    Favorite
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-destructive focus:text-destructive"
                    onClick={() => setDeleteOpen(true)}
                  >
                    <Trash2 className="size-3.5 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          {col.description && (
            <CardDescription className="line-clamp-2">{col.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {col.itemCount} {col.itemCount === 1 ? 'item' : 'items'}
          </span>
          {col.types.length > 0 && (
            <div className="flex items-center gap-1">
              {col.types.map((type) => {
                const Icon = ICON_MAP[type.icon];
                return Icon ? (
                  <Icon
                    key={type.name}
                    className="size-3"
                    style={{ color: type.color }}
                    aria-label={type.name}
                  />
                ) : null;
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <EditCollectionDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        collection={{ id: col.id, name: col.name, description: col.description }}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete collection?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{col.name}&rdquo; will be permanently deleted. Items in this collection will
              not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer" disabled={deletePending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              className="cursor-pointer"
              onClick={handleDelete}
              disabled={deletePending}
            >
              {deletePending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
