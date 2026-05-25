import * as React from 'react'

import { useDarkMode } from '@/lib/use-dark-mode'

export function DarkModeToggle() {
  const { isDarkMode, toggleDarkMode, mounted } = useDarkMode()

  if (!mounted) return null

  return (
    <button
      className='mji-dark-mode-toggle'
      onClick={toggleDarkMode}
      type='button'
      aria-label={isDarkMode ? '라이트 모드로 전환' : '다크 모드로 전환'}
    >
      {isDarkMode ? (
        <>
          <svg width='16' height='16' viewBox='0 0 16 16' fill='none' aria-hidden='true'>
            <path
              d='M13.5 10.5A6 6 0 015.5 2.5a6 6 0 108 8z'
              stroke='currentColor'
              strokeWidth='1.4'
              strokeLinejoin='round'
            />
          </svg>
          <span>Dark</span>
        </>
      ) : (
        <>
          <svg width='16' height='16' viewBox='0 0 16 16' fill='none' aria-hidden='true'>
            <circle cx='8' cy='8' r='3' stroke='currentColor' strokeWidth='1.4' />
            <line x1='8' y1='1' x2='8' y2='3' stroke='currentColor' strokeWidth='1.4' strokeLinecap='round' />
            <line x1='8' y1='13' x2='8' y2='15' stroke='currentColor' strokeWidth='1.4' strokeLinecap='round' />
            <line x1='1' y1='8' x2='3' y2='8' stroke='currentColor' strokeWidth='1.4' strokeLinecap='round' />
            <line x1='13' y1='8' x2='15' y2='8' stroke='currentColor' strokeWidth='1.4' strokeLinecap='round' />
            <line x1='2.93' y1='2.93' x2='4.34' y2='4.34' stroke='currentColor' strokeWidth='1.4' strokeLinecap='round' />
            <line x1='11.66' y1='11.66' x2='13.07' y2='13.07' stroke='currentColor' strokeWidth='1.4' strokeLinecap='round' />
            <line x1='13.07' y1='2.93' x2='11.66' y2='4.34' stroke='currentColor' strokeWidth='1.4' strokeLinecap='round' />
            <line x1='4.34' y1='11.66' x2='2.93' y2='13.07' stroke='currentColor' strokeWidth='1.4' strokeLinecap='round' />
          </svg>
          <span>Light</span>
        </>
      )}
    </button>
  )
}
