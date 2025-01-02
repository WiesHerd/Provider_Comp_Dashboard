import * as React from "react";
import NextLink from "next/link";
import { cn } from "@/lib/utils";

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: React.ReactNode;
  className?: string;
}

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ href, children, className, ...props }, ref) => {
    return (
      <NextLink
        href={href}
        className={cn(
          "text-primary hover:text-primary/80 underline-offset-4 hover:underline",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </NextLink>
    );
  }
);

Link.displayName = "Link";

export { Link }; 