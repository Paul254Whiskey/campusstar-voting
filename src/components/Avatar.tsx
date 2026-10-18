import { classNames, initials, avatarColor } from "@/lib/utils";

interface AvatarProps {
  id: string;
  firstName: string;
  lastName: string;
  imageUrl?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  ring?: boolean;
  className?: string;
}

const sizeMap = {
  xs: "h-8 w-8 text-xs",
  sm: "h-10 w-10 text-sm",
  md: "h-14 w-14 text-lg",
  lg: "h-20 w-20 text-2xl",
  xl: "h-28 w-28 text-3xl",
};

export function Avatar({ id, firstName, lastName, imageUrl, size = "md", ring, className }: AvatarProps) {
  const color = avatarColor(id);
  return (
    <div
      className={classNames(
        "relative shrink-0 rounded-full overflow-hidden flex items-center justify-center font-bold text-white shadow-lg",
        sizeMap[size],
        ring && "ring-2 ring-brand-400/70 ring-offset-2 ring-offset-ink-900",
        className
      )}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`${firstName} ${lastName}`}
          className="h-full w-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className={classNames("h-full w-full bg-gradient-to-br flex items-center justify-center", color)}>
          {initials(firstName, lastName)}
        </div>
      )}
    </div>
  );
}
