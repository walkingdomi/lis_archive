import { useRouter } from 'next/router'
import * as React from 'react'
import ReactDOM from 'react-dom'

export function HeaderSearch() {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState('')
  const [mounted, setMounted] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  // portal target needs document — only available client-side
  React.useEffect(() => { setMounted(true) }, [])

  // keep input in sync with URL
  React.useEffect(() => {
    const q = router.query.q
    setValue(typeof q === 'string' ? q : '')
  }, [router.query.q])

  // focus when modal opens
  React.useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [open])

  // ESC closes modal
  React.useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const pushQuery = (q: string) => {
    router.replace(
      { pathname: '/', query: q ? { q } : {} },
      undefined,
      { shallow: true, scroll: false }
    )
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setValue(q)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (router.pathname === '/') pushQuery(q.trim())
    }, 150)
  }

  const closeModal = () => {
    setOpen(false)
    setTimeout(() => {
      document.getElementById('archive')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
  }

  const openModal = () => {
    if (router.pathname !== '/') {
      const q = typeof router.query.q === 'string' ? router.query.q : ''
      router.push(q ? `/?q=${encodeURIComponent(q)}` : '/').then(() => setOpen(true))
      return
    }
    setOpen(true)
  }

  const clearQuery = (e: React.MouseEvent) => {
    e.stopPropagation()
    setValue('')
    pushQuery('')
  }

  const currentQ = typeof router.query.q === 'string' ? router.query.q : ''

  const modal = (
    <div
      className='mji-search-overlay'
      onMouseDown={(e) => { if (e.target === e.currentTarget) closeModal() }}
    >
      <div className='mji-search-modal'>
        <div className='mji-search-modal-row'>
          <svg width='20' height='20' viewBox='0 0 16 16' fill='none' aria-hidden='true' className='mji-search-modal-icon'>
            <circle cx='6.5' cy='6.5' r='4.5' stroke='currentColor' strokeWidth='1.5' />
            <path d='M10.5 10.5L14 14' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' />
          </svg>
          <input
            ref={inputRef}
            type='search'
            className='mji-search-modal-input'
            placeholder='검색어를 입력해주세요'
            value={value}
            onChange={handleChange}
            onKeyDown={(e) => { if (e.key === 'Enter') closeModal() }}
          />
          {value && (
            <button
              className='mji-search-modal-clear'
              type='button'
              onMouseDown={(e) => { e.preventDefault(); setValue(''); pushQuery(''); inputRef.current?.focus() }}
            >
              ×
            </button>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <>
      <button className='mji-search-trigger' onClick={openModal} type='button' aria-label='검색'>
        <svg width='16' height='16' viewBox='0 0 16 16' fill='none' aria-hidden='true'>
          <circle cx='6.5' cy='6.5' r='4.5' stroke='currentColor' strokeWidth='1.5' />
          <path d='M10.5 10.5L14 14' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' />
        </svg>
        <span className='mji-search-trigger-label'>{currentQ || 'Search'}</span>
        {currentQ && (
          <span className='mji-search-trigger-clear' role='button' onClick={clearQuery}>×</span>
        )}
      </button>

      {mounted && open && ReactDOM.createPortal(modal, document.body)}
    </>
  )
}
