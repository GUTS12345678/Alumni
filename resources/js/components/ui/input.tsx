import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "border-input file:text-foreground selection:bg-primary selection:text-primary-foreground flex h-9 w-full min-w-0 rounded-md border bg-white px-3 py-1 text-base text-gray-900 shadow-xs transition-all duration-200 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        // iOS Safari fix: Force light text color in light mode with !important
        "[color-scheme:light] [-webkit-text-fill-color:theme(colors.gray.900)!important] placeholder:text-gray-500 placeholder:[-webkit-text-fill-color:theme(colors.gray.500)!important]",
        // Autofill styling for iOS
        "autofill:bg-white autofill:text-gray-900 autofill:[-webkit-text-fill-color:theme(colors.gray.900)!important]",
        "[&:-webkit-autofill]:bg-white [&:-webkit-autofill]:text-gray-900 [&:-webkit-autofill]:[-webkit-text-fill-color:theme(colors.gray.900)!important] [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0px_1000px_white_inset!important]",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        "dark:[color-scheme:dark] dark:bg-gray-800 dark:text-white dark:[-webkit-text-fill-color:theme(colors.white)!important] dark:placeholder:text-gray-400 dark:placeholder:[-webkit-text-fill-color:theme(colors.gray.400)!important]",
        "dark:[&:-webkit-autofill]:bg-gray-800 dark:[&:-webkit-autofill]:text-white dark:[&:-webkit-autofill]:[-webkit-text-fill-color:theme(colors.white)!important] dark:[&:-webkit-autofill]:[-webkit-box-shadow:0_0_0px_1000px_rgb(31_41_55)_inset!important]",
        className
      )}
      style={{
        WebkitAppearance: 'none',
        MozAppearance: 'textfield',
      } as React.CSSProperties}
      {...props}
    />
  )
}

export { Input }
