import { cva } from 'class-variance-authority'

export const Block = ({
    children,
    title,
    variant = 'primary',
    className,
}: {
    children: React.ReactNode
    title?: string
    variant?: 'primary' | 'secondary'
    className?: string
}) => {
    return (
        <div className={blockVariants({ variant, className })}>
            {title && <h2 className="text-sm font-semibold text-primary text-zinc-700">{title}</h2>}
            {children}
        </div>
    )
}

const blockVariants = cva('flex flex-col gap-2 rounded-sm border p-4', {
    variants: {
        variant: {
            primary: 'border-zinc-300 bg-zinc-50',
            secondary: 'border-zinc-200 bg-zinc-100',
        },
    },
    defaultVariants: {
        variant: 'primary',
    },
})
