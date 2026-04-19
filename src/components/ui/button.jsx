import * as React from "react"
import { cn } from "../../lib/utils"

const Button = React.forwardRef(({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
        <button
            ref={ref}
            className={cn(
                "inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                {
                    "bg-primary text-white hover:bg-primary/90 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0": variant === "default",
                    "bg-secondary text-white hover:bg-secondary/80 shadow-sm": variant === "secondary",
                    "border border-slate-200 bg-background hover:bg-slate-50 hover:text-accent-foreground": variant === "outline",
                    "hover:bg-slate-100 hover:text-accent-foreground": variant === "ghost",
                    "bg-red-50 text-red-600 hover:bg-red-100": variant === "destructive",
                    "h-11 px-6 py-2": size === "default",
                    "h-9 rounded-lg px-3": size === "sm",
                    "h-12 rounded-xl px-8 text-base": size === "lg",
                    "h-10 w-10": size === "icon",
                },
                className
            )}
            {...props}
        />
    )
})
Button.displayName = "Button"

export { Button }
