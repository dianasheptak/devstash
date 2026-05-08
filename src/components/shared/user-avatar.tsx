import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/initials";
import { cn } from "@/lib/utils";

type Props = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  className?: string;
  size?: "default" | "sm" | "lg";
};

export function UserAvatar({ name, email, image, className, size = "default" }: Props) {
  const initials = getInitials(name ?? email ?? "");

  return (
    <Avatar size={size} className={cn(className)}>
      {image ? <AvatarImage src={image} alt={name ?? email ?? "User"} /> : null}
      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
