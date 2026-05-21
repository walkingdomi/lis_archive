import Head from 'next/head'
import * as React from 'react'

import { type Member, members } from '../data/credits'

export default function CreditsPage() {
  return (
    <>
      <Head>
        <title>Credits — 문헌정보학과 아카이브</title>
      </Head>

      <header className='mji-header'>
        <div className='mji-nav-inner'>
          <div className='mji-nav-rhs'>
            <a href='/' className='mji-home-btn'>
              <svg width='16' height='16' viewBox='0 0 16 16' fill='none' aria-hidden='true'>
                <path d='M8 2L2 7.5V14h4.5v-4h3v4H14V7.5L8 2Z' stroke='currentColor' strokeWidth='1.4' strokeLinejoin='round' />
              </svg>
              <span>Home</span>
            </a>
          </div>
        </div>
      </header>

      <main className='mji-credits-page'>
        <div className='mji-credits-inner'>
          <p className='mji-credits-eyebrow'>CREDITS</p>
          <h1 className='mji-credits-title'>만든 사람들</h1>
          <p className='mji-credits-desc'>
            명지대학교 문헌정보학과 아카이브는 학과 구성원들이 함께 기획하고 제작했습니다.
          </p>

          <div className='mji-credits-grid'>
            {members.map((m: Member) => (
              <div key={m.studentId + m.name} className='mji-credit-card'>
                <Avatar github={m.github} name={m.name} />
                <div className='mji-credit-info'>
                  <span className='mji-credit-name'>{m.name}</span>
                  <span className='mji-credit-id'>{m.studentId}</span>
                  <span className='mji-credit-role'>{m.role}</span>
                  <div className='mji-credit-links'>
                    {m.github && (
                      <a
                        href={`https://github.com/${m.github}`}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='mji-credit-link'
                        aria-label={`${m.name} GitHub`}
                      >
                        <GitHubIcon />
                      </a>
                    )}
                    {m.email && (
                      <a
                        href={`mailto:${m.email}`}
                        className='mji-credit-link'
                        aria-label={`${m.name} 이메일`}
                      >
                        <MailIcon />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  )
}

function Avatar({ github, name }: { github?: string; name: string }) {
  const [failed, setFailed] = React.useState(false)

  if (github && !failed) {
    return (
      <img
        className='mji-credit-avatar'
        src={`https://github.com/${github}.png`}
        alt={name}
        onError={() => setFailed(true)}
      />
    )
  }

  return (
    <div className='mji-credit-avatar mji-credit-avatar--fallback' aria-hidden='true'>
      <UserIcon />
    </div>
  )
}

function UserIcon() {
  return (
    <svg width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'>
      <circle cx='12' cy='8' r='4' />
      <path d='M4 20c0-4 3.6-7 8-7s8 3 8 7' />
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor'>
      <path d='M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z' />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'>
      <rect x='2' y='4' width='20' height='16' rx='2' />
      <path d='M2 7l10 7 10-7' />
    </svg>
  )
}
