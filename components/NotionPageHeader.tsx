import type * as types from 'notion-types'
import * as React from 'react'
import { useNotionContext } from 'react-notion-x'

import { navigationLinks } from '@/lib/config'


export function NotionPageHeader({
  block
}: {
  block: types.CollectionViewPageBlock | types.PageBlock
}) {
  const { components, mapPageUrl } = useNotionContext()

  return (
    <header className='notion-header mji-header'>
      <div className='mji-nav-inner'>
        <div className='mji-nav-rhs'>
          <a href='/' className='mji-home-btn' aria-label='홈으로'>
            <svg width='16' height='16' viewBox='0 0 16 16' fill='none' aria-hidden='true'>
              <path d='M8 2L2 7.5V14h4.5v-4h3v4H14V7.5L8 2Z' stroke='currentColor' strokeWidth='1.4' strokeLinejoin='round' />
            </svg>
            <span>Home</span>
          </a>

          {navigationLinks
            ?.map((link, index) => {
              if (!link?.pageId && !link?.url) return null
              if (link.pageId) {
                return (
                  <components.PageLink
                    href={mapPageUrl(link.pageId)}
                    key={index}
                    className='mji-nav-link'
                  >
                    {link.title}
                  </components.PageLink>
                )
              } else {
                return (
                  <components.Link
                    href={link.url}
                    key={index}
                    className='mji-nav-link'
                  >
                    {link.title}
                  </components.Link>
                )
              }
            })
            .filter(Boolean)}
        </div>
      </div>
    </header>
  )
}
