import React from "react";
import { cn } from "../../utils/cn";

// --- Icons ---
const ChevronRight = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("h-4 w-4 shrink-0", className)} {...props}>
    <path d="m9 18 6-6-6-6"/>
  </svg>
);

const MoreHorizontal = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("h-4 w-4 shrink-0", className)} {...props}>
    <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
  </svg>
);

// --- Root Component ---
export interface BreadcrumbProps extends React.ComponentPropsWithoutRef<"nav"> {}

export const Breadcrumb = React.forwardRef<HTMLElement, BreadcrumbProps>(
  ({ className, ...props }, ref) => (
    <nav ref={ref} aria-label="breadcrumb" className={className} {...props} />
  )
);
Breadcrumb.displayName = "Breadcrumb";

// --- List ---
export interface BreadcrumbListProps extends React.ComponentPropsWithoutRef<"ol"> {}

export const BreadcrumbList = React.forwardRef<HTMLOListElement, BreadcrumbListProps>(
  ({ className, ...props }, ref) => (
    <ol
      ref={ref}
      className={cn(
        "flex flex-wrap items-center gap-1.5 break-words text-sm text-[#888888] sm:gap-2.5 dark:text-zinc-400",
        className
      )}
      {...props}
    />
  )
);
BreadcrumbList.displayName = "BreadcrumbList";

// --- Item ---
export interface BreadcrumbItemProps extends React.ComponentPropsWithoutRef<"li"> {}

export const BreadcrumbItem = React.forwardRef<HTMLLIElement, BreadcrumbItemProps>(
  ({ className, ...props }, ref) => (
    <li
      ref={ref}
      className={cn("inline-flex items-center gap-1.5", className)}
      {...props}
    />
  )
);
BreadcrumbItem.displayName = "BreadcrumbItem";

// --- Link (Supports Hex Codes via CSS Variables) ---
export interface BreadcrumbLinkProps extends React.ComponentPropsWithoutRef<"a"> {
  asChild?: boolean;
  linkColor?: string;
  hoverColor?: string;
}

export const BreadcrumbLink = React.forwardRef<HTMLAnchorElement, BreadcrumbLinkProps>(
  ({ asChild, className, children, linkColor, hoverColor, style, ...props }, ref) => {
    // Map hex codes to CSS variables safely
    const customStyle = {
      ...style,
      ...(linkColor ? { '--bc-link': linkColor } : {}),
      ...(hoverColor ? { '--bc-hover': hoverColor } : {}),
    } as React.CSSProperties;

    // Use Tailwind arbitrary values mapped to those CSS variables
    const combinedClassName = cn(
      "transition-colors",
      linkColor ? "text-[color:var(--bc-link)]" : "text-inherit",
      hoverColor ? "hover:text-[color:var(--bc-hover)]" : "hover:text-black dark:hover:text-white",
      className
    );
    
    if (asChild && React.isValidElement(children)) {
      const childElement = children as React.ReactElement<React.HTMLAttributes<HTMLElement>>;
      return React.cloneElement(childElement, {
        ...props,
        style: { ...customStyle, ...(childElement.props.style || {}) },
        className: cn(combinedClassName, childElement.props.className),
        ref,
      } as React.HTMLAttributes<HTMLElement> & { ref?: React.Ref<HTMLAnchorElement> });
    }

    return (
      <a ref={ref} className={combinedClassName} style={customStyle} {...props}>
        {children}
      </a>
    );
  }
);
BreadcrumbLink.displayName = "BreadcrumbLink";

// --- Active Page (Supports Hex Codes via CSS Variables) ---
export interface BreadcrumbPageProps extends React.ComponentPropsWithoutRef<"span"> {
  pageColor?: string;
}

export const BreadcrumbPage = React.forwardRef<HTMLSpanElement, BreadcrumbPageProps>(
  ({ className, pageColor, style, ...props }, ref) => {
    const customStyle = {
      ...style,
      ...(pageColor ? { '--bc-page': pageColor } : {}),
    } as React.CSSProperties;

    return (
      <span
        ref={ref}
        role="link"
        aria-disabled="true"
        aria-current="page"
        style={customStyle}
        className={cn("font-medium", pageColor ? "text-[color:var(--bc-page)]" : "text-black dark:text-zinc-100", className)}
        {...props}
      />
    );
  }
);
BreadcrumbPage.displayName = "BreadcrumbPage";

// --- Separator ---
export interface BreadcrumbSeparatorProps extends React.ComponentPropsWithoutRef<"li"> {}

export const BreadcrumbSeparator = React.forwardRef<HTMLLIElement, BreadcrumbSeparatorProps>(
  ({ children, className, ...props }, ref) => (
    <li
      ref={ref}
      role="presentation"
      aria-hidden="true"
      className={cn("[&>svg]:w-3.5 [&>svg]:h-3.5", className)}
      {...props}
    >
      {children ?? <ChevronRight />}
    </li>
  )
);
BreadcrumbSeparator.displayName = "BreadcrumbSeparator";

// --- Ellipsis ---
export interface BreadcrumbEllipsisProps extends React.ComponentPropsWithoutRef<"span"> {}

export const BreadcrumbEllipsis = React.forwardRef<HTMLSpanElement, BreadcrumbEllipsisProps>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      role="presentation"
      aria-hidden="true"
      className={cn("flex h-5 w-5 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontal />
      <span className="sr-only">More</span>
    </span>
  )
);
BreadcrumbEllipsis.displayName = "BreadcrumbEllipsis";