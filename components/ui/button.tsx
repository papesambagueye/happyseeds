import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
    "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold tracking-[0.01em] transition-all duration-200 hover:scale-[1.03] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          'bg-[#007BFF] text-white shadow-md shadow-blue-500/25 hover:-translate-y-0.5 hover:bg-[#0069D9] hover:shadow-lg',
        destructive:
          'bg-[#E30613] text-white shadow-md shadow-red-500/25 hover:-translate-y-0.5 hover:bg-[#C80510] hover:shadow-lg focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40',
        outline:
          'border border-[#007BFF]/35 bg-white text-black shadow-sm hover:-translate-y-0.5 hover:border-[#007BFF] hover:bg-[#F2F2F2] dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
        secondary:
          'bg-black text-white shadow-md hover:-translate-y-0.5 hover:bg-[#222222]',
        ghost:
          'hover:bg-[#F2F2F2] hover:text-[#007BFF] dark:hover:bg-accent/50',
        link: 'text-[#007BFF] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9',
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
