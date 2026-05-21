import * as React from 'react'

export function FooterImpl() {
  return (
    <footer className='mji-footer'>
      <span className='mji-footer-copy'>
        © 2026 명지대학교 문헌정보학과 아카이브
      </span>
      <a href='/credits' className='mji-footer-credits'>
        Credits →
      </a>
    </footer>
  )
}

export const Footer = React.memo(FooterImpl)
