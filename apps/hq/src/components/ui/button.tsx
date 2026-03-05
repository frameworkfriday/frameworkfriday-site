import { cn } from "@/lib/utils";
import { forwardRef, type ButtonHTMLAttributes } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg" | "icon";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
          {
            "bg-primary text-white hover:bg-primary-hover shadow-sm":
              variant === "default",
            "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 shadow-sm":
              variant === "outline",
            "text-gray-600 hover:text-gray-900 hover:bg-gray-100":
              variant === "ghost",
            "bg-danger text-white hover:bg-red-600 shadow-sm":
              variant === "danger",
            "bg-success text-white hover:bg-green-600 shadow-sm":
              variant === "success",
          },
          {
            "h-8 px-3 text-sm": size === "sm",
            "h-10 px-4 text-sm": size === "md",
            "h-12 px-6 text-base": size === "lg",
            "h-10 w-10 p-0": size === "icon",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
