'use client'
import { useEffect, useState } from 'react'
import { Search, X } from 'lucide-react'

/**
 * Debounced search input. Calls `onSearch(value)` ~350ms after the user stops
 * typing (and immediately on clear). Keeps the network quiet while typing.
 */
export function SearchInput({
  value,
  onSearch,
  placeholder = 'Rechercher…',
  className = '',
}: {
  value: string
  onSearch: (value: string) => void
  placeholder?: string
  className?: string
}) {
  const [text, setText] = useState(value)

  useEffect(() => {
    setText(value)
  }, [value])

  useEffect(() => {
    const id = setTimeout(() => {
      onSearch(text.trim())
    }, 350)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text])

  return (
    <div className={`relative ${className}`}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-8 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
      {text && (
        <button
          type="button"
          aria-label="Effacer"
          onClick={() => setText('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
