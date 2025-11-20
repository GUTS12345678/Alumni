import * as React from "react"
import { cn } from "@/lib/utils"

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, ...props }, ref) => {
        return (
            <textarea
                className={cn(
                    "flex min-h-[80px] w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-gray-900 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    "[-webkit-text-fill-color:theme(colors.gray.900)] placeholder:text-gray-500 placeholder:[-webkit-text-fill-color:theme(colors.gray.500)]",
                    "dark:bg-gray-800 dark:text-white dark:[-webkit-text-fill-color:theme(colors.white)] dark:placeholder:text-gray-400 dark:placeholder:[-webkit-text-fill-color:theme(colors.gray.400)]",
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Textarea.displayName = "Textarea"

export { Textarea }