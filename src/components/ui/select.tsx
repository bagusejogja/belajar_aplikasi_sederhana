"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    )
  }
)
Select.displayName = "Select"

export const SelectGroup = ({ children }: { children: React.ReactNode }) => <optgroup>{children}</optgroup>
export const SelectValue = ({ children }: { children?: React.ReactNode }) => <span>{children}</span>
export const SelectTrigger = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
export const SelectContent = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
export const SelectItem = ({ value, children }: { value: string; children: React.ReactNode }) => (
  <option value={value}>{children}</option>
)
export const SelectLabel = ({ children }: { children: React.ReactNode }) => <span>{children}</span>
export const SelectSeparator = () => <hr />
