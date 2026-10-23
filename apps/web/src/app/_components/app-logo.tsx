import { cn } from "@workspace/ui/lib/utils";
import Link from "next/link";
import type { ComponentProps } from "react";

// No marketing site on this instance: the logo goes to the app itself.
const appHomeUrl = "/inbox";

type Props = Omit<ComponentProps<typeof Link>, "href"> & {
  className?: string;
  iconClassName?: string;
};

export function AppLogo({ className, ...props }: Props) {
  const sharedClassName = cn(
    "dark:hover:text-primary-foreground hover:text-foreground font-medium transition-colors",
    className,
  );

  return (
    <Link href={appHomeUrl} className={sharedClassName} {...props}>
      /fasterfixes
    </Link>
  );
}

type AppLogoMarkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  className?: string;
};

export function AppLogoMark({ className, ...props }: AppLogoMarkProps) {
  const sharedClassName = cn(
    "dark:hover:text-primary-foreground hover:text-foreground font-medium transition-colors",
    className,
  );

  return (
    <Link href={appHomeUrl} className={sharedClassName} {...props}>
      /ff
    </Link>
  );
}
