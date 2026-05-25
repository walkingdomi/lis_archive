import cs from 'classnames'
import dynamic from 'next/dynamic'
import Image from 'next/legacy/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { type PageBlock } from 'notion-types'
import {
  formatDate,
  getBlockTitle,
  getBlockValue,
  getPageProperty
} from 'notion-utils'
import * as React from 'react'
import BodyClassName from 'react-body-classname'
import {
  type NotionComponents,
  NotionRenderer,
  useNotionContext
} from 'react-notion-x'
import { EmbeddedTweet, TweetNotFound, TweetSkeleton } from 'react-tweet'
import { useSearchParam } from 'react-use'

import type * as types from '@/lib/types'
import * as config from '@/lib/config'
import { mapImageUrl } from '@/lib/map-image-url'
import { getCanonicalPageUrl, mapPageUrl } from '@/lib/map-page-url'
import { searchNotion } from '@/lib/search-notion'
import { useDarkMode } from '@/lib/use-dark-mode'

import { DarkModeToggle } from './DarkModeToggle'
import { Footer } from './Footer'
import { HeaderSearch } from './HeaderSearch'
import { Loading } from './Loading'
import { NotionPageHeader } from './NotionPageHeader'
import { Page404 } from './Page404'
import { PageAside } from './PageAside'
import { PageHead } from './PageHead'
import styles from './styles.module.css'

// -----------------------------------------------------------------------------
// dynamic imports for optional components
// -----------------------------------------------------------------------------

const Code = dynamic(() =>
  import('react-notion-x/third-party/code').then(async (m) => {
    await Promise.allSettled([
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-markup-templating.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-markup.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-bash.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-c.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-cpp.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-csharp.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-docker.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-java.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-js-templates.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-coffeescript.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-diff.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-git.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-go.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-graphql.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-handlebars.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-less.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-makefile.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-markdown.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-objectivec.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-ocaml.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-python.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-reason.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-rust.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-sass.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-scss.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-solidity.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-sql.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-stylus.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-swift.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-wasm.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-yaml.js')
    ])
    return m.Code
  })
)

const Collection = dynamic(() =>
  import('react-notion-x/third-party/collection').then((m) => m.Collection)
)
const Equation = dynamic(() =>
  import('react-notion-x/third-party/equation').then((m) => m.Equation)
)
const Pdf = dynamic(
  () => import('react-notion-x/third-party/pdf').then((m) => m.Pdf),
  { ssr: false }
)
const Modal = dynamic(
  () =>
    import('react-notion-x/third-party/modal').then((m) => {
      m.Modal.setAppElement('.notion-viewport')
      return m.Modal
    }),
  { ssr: false }
)

// -----------------------------------------------------------------------------
// Archive helpers
// -----------------------------------------------------------------------------

function getSemester(dateStr: string): string {
  const month = new Date(dateStr).getMonth() + 1 // 1-12
  return month >= 3 && month <= 8 ? '1학기' : '2학기'
}

function extractGDriveThumb(url: string): string | undefined {
  const m1 = url.match(/\/file\/d\/([^/?]+)/)
  if (m1) return `https://drive.google.com/thumbnail?id=${m1[1]}&sz=w400`
  const m2 = url.match(/[?&]id=([^&]+)/)
  if (m2) return `https://drive.google.com/thumbnail?id=${m2[1]}&sz=w400`
  return undefined
}

interface ArchiveItem {
  id: string
  title: string
  tags: string[]
  dateStr: string
  monthStr: string
  description: string
  url: string
  cover?: string
}

function getArchiveItems(
  recordMap: types.ExtendedRecordMap,
  urlMapper: (id: string) => string
): ArchiveItem[] {
  const collections = Object.values(recordMap.collection || {}) as any[]

  const allBlocks = Object.values(recordMap.block)
  const collectionPages = allBlocks.filter((b) => {
    const v = getBlockValue(b) as any
    return v?.type === 'page' && v?.parent_table === 'collection'
  })

  const schema: Record<string, any> =
    (getBlockValue(collections[0] as any) as any)?.schema ||
    collections[0]?.value?.schema ||
    {}

  const findKey = (
    preferredNames: string[],
    types: string[]
  ): string | undefined => {
    const byName = Object.entries(schema).find(
      ([_, p]) =>
        types.includes(p.type) &&
        preferredNames.includes((p.name as string)?.toLowerCase?.())
    )
    if (byName) return byName[0]
    return Object.entries(schema).find(([_, p]) => types.includes(p.type))?.[0]
  }

  const tagsPropKey = findKey(
    ['tags', 'tag', 'category', '카테고리', 'categories', '태그'],
    ['multi_select', 'select']
  )
  const datePropKey = findKey(
    ['date', 'published', '날짜', 'created', '발행일'],
    ['date']
  )
  const descPropKey = findKey(
    ['description', 'desc', '설명', 'summary', '요약'],
    ['text']
  )
  const coverPropKey = Object.entries(schema).find(([_, p]) =>
    ['cover', 'embed'].includes((p.name as string)?.toLowerCase?.())
  )?.[0]

  return Object.values(recordMap.block)
    .filter((b) => {
      const v = getBlockValue(b) as any
      return v?.type === 'page' && v?.parent_table === 'collection'
    })
    .map((b) => {
      const page = getBlockValue(b) as any
      const props: Record<string, any> = page.properties || {}

      const tagsRaw: string =
        tagsPropKey && props[tagsPropKey] ? props[tagsPropKey][0]?.[0] ?? '' : ''
      const tags = tagsRaw
        .split(',')
        .map((t: string) => t.trim())
        .filter(Boolean)

      let dateStr = ''
      if (datePropKey && props[datePropKey]) {
        const seg = props[datePropKey]
        const dateInfo = seg?.[0]?.[1]?.[0]?.[1]
        if (dateInfo?.start_date) dateStr = dateInfo.start_date
      }

      const descSegs = descPropKey ? props[descPropKey] : null
      const description: string = descSegs
        ? (descSegs as any[]).map((s: any) => s[0]).join('')
        : ''

      const titleSegs: any[] = props.title || []
      const title = titleSegs.map((t: any) => t[0]).join('')

      const monthStr = dateStr ? getSemester(dateStr) : ''

      // Cover 프로퍼티에서 썸네일 추출
      let cover: string | undefined
      if (coverPropKey && props[coverPropKey]) {
        const rawUrl: string = props[coverPropKey]?.[0]?.[0] ?? ''
        if (rawUrl) cover = extractGDriveThumb(rawUrl) ?? rawUrl
      }

      // Cover 프로퍼티 없으면 embed/pdf 블록에서 추출
      if (!cover) {
        const content: string[] = page.content || []
        for (const childId of content) {
          const childEntry = recordMap.block[childId]
          if (!childEntry) continue
          const child = getBlockValue(childEntry as any) as any
          if (child && (child.type === 'embed' || child.type === 'pdf')) {
            const srcUrl: string = child.properties?.source?.[0]?.[0] ?? ''
            if (srcUrl) {
              cover = extractGDriveThumb(srcUrl) || undefined
              if (cover) break
            }
          }
        }
      }

      return {
        id: page.id,
        title,
        tags,
        dateStr,
        monthStr,
        description,
        url: urlMapper(page.id),
        cover
      }
    })
    .filter((item) => item.title)
    .sort((a, b) => {
      if (!a.dateStr && !b.dateStr) return 0
      if (!a.dateStr) return 1
      if (!b.dateStr) return -1
      return b.dateStr.localeCompare(a.dateStr)
    })
}

// -----------------------------------------------------------------------------
// Hero Section
// -----------------------------------------------------------------------------

const HERO_LINES = ['안녕하세요!', '명지대학교 문헌정보학과', '아카이브입니다.']

function HeroSection() {
  const [displayed, setDisplayed] = React.useState<string[]>([])
  const [done, setDone] = React.useState(false)

  React.useEffect(() => {
    let lineIdx = 0
    let charIdx = 0
    let timerId: ReturnType<typeof setTimeout>

    setDisplayed([''])

    function tick() {
      if (lineIdx >= HERO_LINES.length) {
        setDone(true)
        return
      }
      const line = HERO_LINES[lineIdx]!
      if (charIdx <= line.length) {
        const text = line.slice(0, charIdx)
        setDisplayed((prev) => {
          const next = [...prev]
          next[lineIdx] = text
          return next
        })
        charIdx++
        timerId = setTimeout(tick, 60)
      } else {
        lineIdx++
        charIdx = 0
        if (lineIdx < HERO_LINES.length) {
          setDisplayed((prev) => [...prev, ''])
          timerId = setTimeout(tick, 350)
        } else {
          setDone(true)
        }
      }
    }

    timerId = setTimeout(tick, 700)
    return () => clearTimeout(timerId)
  }, [])

  return (
    <section className='mji-hero' id='hero'>
      <div className='mji-hero-content'>
        <p className='mji-hero-eyebrow'>
          Myongji Univ. Library &amp; Information Science
        </p>

        <h1 className='mji-hero-title'>
          {displayed.map((text, i) => (
            <span key={i} className='mji-hero-line'>
              {text}
              {i === displayed.length - 1 && !done && (
                <span className='mji-cursor' aria-hidden='true'>|</span>
              )}
              {done && i === HERO_LINES.length - 1 && (
                <span className='mji-cursor mji-cursor-done' aria-hidden='true'>|</span>
              )}
            </span>
          ))}
        </h1>

        <p className='mji-hero-sub'>
          문헌정보학과 학생들의 프로젝트, 우수과제, 학술제 등 활동 자료를 이 곳에서 확인해보세요.
        </p>

        <div className='mji-hero-buttons'>
          <a
            href='https://lis.mju.ac.kr'
            target='_blank'
            rel='noopener noreferrer'
            className='mji-btn mji-btn-outline'
          >
            학과 공식 홈페이지 ↗
          </a>
          <a href='#archive' className='mji-btn mji-btn-primary'>
            아카이브 둘러보기
          </a>
        </div>

      </div>
    </section>
  )
}

// -----------------------------------------------------------------------------
// Archive Section (Timeline)
// -----------------------------------------------------------------------------

function ArchiveSection({
  recordMap,
  urlMapper
}: {
  recordMap: types.ExtendedRecordMap
  urlMapper: (id: string) => string
}) {
  const items = React.useMemo(
    () => getArchiveItems(recordMap, urlMapper),
    [recordMap, urlMapper]
  )
  const [activeCategory, setActiveCategory] = React.useState<string | null>(null)
  const [activeYear, setActiveYear] = React.useState<number | null>(null)
  const router = useRouter()
  const searchQuery = typeof router.query.q === 'string' ? router.query.q : ''

  const allTags = React.useMemo(
    () => Array.from(new Set(items.flatMap((i) => i.tags))).sort(),
    [items]
  )

  const allYears = React.useMemo(
    () =>
      Array.from(
        new Set(
          items
            .map((i) => (i.dateStr ? new Date(i.dateStr).getFullYear() : null))
            .filter((y): y is number => y !== null)
        )
      ).sort((a, b) => b - a),
    [items]
  )

  const filteredItems = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return items.filter((i) => {
      if (activeCategory && !i.tags.includes(activeCategory)) return false
      if (activeYear) {
        const y = i.dateStr ? new Date(i.dateStr).getFullYear() : null
        if (y !== activeYear) return false
      }
      if (q) {
        const haystack = [i.title, i.description, ...i.tags].join(' ').toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [items, activeCategory, activeYear, searchQuery])

  const yearGroups = React.useMemo(() => {
    const map = new Map<number, ArchiveItem[]>()
    for (const item of filteredItems) {
      const year = item.dateStr ? new Date(item.dateStr).getFullYear() : 0
      const list = map.get(year) ?? []
      map.set(year, [...list, item])
    }
    return Array.from(map.entries())
      .map(([year, list]) => ({ year, items: list }))
      .sort((a, b) => b.year - a.year)
  }, [filteredItems])

  return (
    <section className='mji-archive' id='archive'>
      <div className='mji-archive-inner'>
        <aside className='mji-sidebar'>
          {allTags.length > 0 && (
            <div className='mji-sidebar-section'>
              <h3 className='mji-sidebar-title'>카테고리</h3>
              <ul className='mji-sidebar-list'>
                <li>
                  <button
                    className={cs('mji-filter-btn', !activeCategory && 'active')}
                    onClick={() => setActiveCategory(null)}
                  >
                    전체
                  </button>
                </li>
                {allTags.map((tag) => (
                  <li key={tag}>
                    <button
                      className={cs(
                        'mji-filter-btn',
                        activeCategory === tag && 'active'
                      )}
                      onClick={() =>
                        setActiveCategory(tag === activeCategory ? null : tag)
                      }
                    >
                      {tag}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {allYears.length > 0 && (
            <div className='mji-sidebar-section'>
              <h3 className='mji-sidebar-title'>연도</h3>
              <ul className='mji-sidebar-list'>
                <li>
                  <button
                    className={cs('mji-filter-btn', !activeYear && 'active')}
                    onClick={() => setActiveYear(null)}
                  >
                    전체
                  </button>
                </li>
                {allYears.map((year) => (
                  <li key={year}>
                    <button
                      className={cs(
                        'mji-filter-btn',
                        activeYear === year && 'active'
                      )}
                      onClick={() =>
                        setActiveYear(activeYear === year ? null : year)
                      }
                    >
                      {year}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>

        <div className='mji-timeline'>
          <div className='mji-timeline-header'>
            <span className='mji-tl-total'>{filteredItems.length} items</span>
          </div>

          {filteredItems.length === 0 && (
            <p className='mji-no-results'>표시할 아카이브가 없습니다.</p>
          )}

          {yearGroups.map(({ year, items: yearItems }) => (
            <div key={year} className='mji-year-group'>
              <div className='mji-year-row'>
                <span className='mji-year-label'>{year || '—'}</span>
                <div className='mji-year-line' />
              </div>
              {yearItems.map((item, idx) => (
                <a
                  key={item.id}
                  href={item.url}
                  className={cs(
                    'mji-tl-card',
                    idx === yearItems.length - 1 && 'mji-tl-card-last'
                  )}
                >
                  <span className='mji-tl-month'>{item.monthStr}</span>
                  <div className='mji-tl-body'>
                    {item.tags.length > 0 && (
                      <div className='mji-tl-tags'>
                        {item.tags.map((tag) => (
                          <span key={tag} className='mji-tag'>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <h2 className='mji-tl-title'>{item.title}</h2>
                    {item.description && (
                      <p className='mji-tl-desc'>{item.description}</p>
                    )}
                  </div>
                  {item.cover && (
                    <div className='mji-tl-thumb'>
                      <img src={item.cover} alt='' loading='lazy' />
                      <div className='mji-thumb-fade' />
                    </div>
                  )}
                  <div className='mji-tl-action'>
                    <span className='mji-tl-more'>More</span>
                    <div className='mji-tl-circle'>
                      <svg
                        width='12'
                        height='12'
                        viewBox='0 0 12 12'
                        fill='none'
                        aria-hidden='true'
                      >
                        <path
                          d='M2 6h8M7 3l3 3-3 3'
                          stroke='currentColor'
                          strokeWidth='1.2'
                          strokeLinecap='round'
                          strokeLinejoin='round'
                        />
                      </svg>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// -----------------------------------------------------------------------------
// Standalone Site Header (root page - no NotionContext required)
// -----------------------------------------------------------------------------

function SiteHeader() {
  return (
    <header className='mji-header'>
      <div className='mji-nav-inner'>
        <div className='mji-nav-rhs'>
          <HeaderSearch />
        </div>
        <DarkModeToggle />
      </div>
    </header>
  )
}

// -----------------------------------------------------------------------------
// Sub-page tweet embed
// -----------------------------------------------------------------------------

function Tweet({ id }: { id: string }) {
  const { recordMap } = useNotionContext()
  const tweet = (recordMap as types.ExtendedTweetRecordMap)?.tweets?.[id]

  return (
    <React.Suspense fallback={<TweetSkeleton />}>
      {tweet ? <EmbeddedTweet tweet={tweet} /> : <TweetNotFound />}
    </React.Suspense>
  )
}

const propertyLastEditedTimeValue = (
  { block, pageHeader }: any,
  defaultFn: () => React.ReactNode
) => {
  if (pageHeader && block?.last_edited_time) {
    return `Last updated ${formatDate(block?.last_edited_time, {
      month: 'long'
    })}`
  }
  return defaultFn()
}

const propertyDateValue = (
  { data, schema, pageHeader }: any,
  defaultFn: () => React.ReactNode
) => {
  if (pageHeader && schema?.name?.toLowerCase() === 'published') {
    const publishDate = data?.[0]?.[1]?.[0]?.[1]?.start_date
    if (publishDate) {
      return `${formatDate(publishDate, { month: 'long' })}`
    }
  }
  return defaultFn()
}

const propertyTextValue = (
  { schema, pageHeader }: any,
  defaultFn: () => React.ReactNode
) => {
  if (pageHeader && schema?.name?.toLowerCase() === 'author') {
    return <b>{defaultFn()}</b>
  }
  return defaultFn()
}

const notionRendererComponents: Partial<NotionComponents> = {
  nextLegacyImage: Image,
  nextLink: Link,
  Code,
  Collection,
  Equation,
  Pdf,
  Modal,
  Tweet,
  Header: NotionPageHeader,
  propertyLastEditedTimeValue,
  propertyTextValue,
  propertyDateValue
}

// -----------------------------------------------------------------------------
// NotionPage
// -----------------------------------------------------------------------------

export function NotionPage({
  site,
  recordMap,
  error,
  pageId
}: types.PageProps) {
  const router = useRouter()
  const lite = useSearchParam('lite')
  const isLiteMode = lite === 'true'

  const { isDarkMode, mounted: darkModeMounted } = useDarkMode()

  const siteMapPageUrl = React.useMemo(() => {
    const params: any = {}
    if (lite) params.lite = lite
    const searchParams = new URLSearchParams(params)
    return site ? mapPageUrl(site, recordMap!, searchParams) : undefined
  }, [site, recordMap, lite])

  const keys = Object.keys(recordMap?.block || {})
  const block = getBlockValue(recordMap?.block?.[keys[0]!])

  const isBlogPost =
    block?.type === 'page' && block?.parent_table === 'collection'

  const isRootPage = pageId === site?.rootNotionPageId

  const showTableOfContents = !!isBlogPost
  const minTableOfContentsItems = 3

  const pageAside = React.useMemo(
    () => (
      <PageAside
        block={block!}
        recordMap={recordMap!}
        isBlogPost={isBlogPost}
      />
    ),
    [block, recordMap, isBlogPost]
  )

  if (router.isFallback) {
    return <Loading />
  }

  if (error || !site || !block || !recordMap) {
    return <Page404 site={site} pageId={pageId} error={error} />
  }

  const title = getBlockTitle(block, recordMap) || site.name

  console.log('notion page', {
    isDev: config.isDev,
    title,
    pageId,
    rootNotionPageId: site.rootNotionPageId,
    recordMap
  })

  if (!config.isServer) {
    const g = window as any
    g.pageId = pageId
    g.recordMap = recordMap
    g.block = block
  }

  const canonicalPageUrl = config.isDev
    ? undefined
    : getCanonicalPageUrl(site, recordMap)(pageId)

  const socialImage = mapImageUrl(
    getPageProperty<string>('Social Image', block, recordMap) ||
      (block as PageBlock).format?.page_cover ||
      config.defaultPageCover,
    block
  )

  const socialDescription =
    getPageProperty<string>('Description', block, recordMap) ||
    config.description

  // Root page: custom hero + archive layout
  if (isRootPage && !isLiteMode) {
    return (
      <>
        <PageHead
          pageId={pageId}
          site={site}
          title={title}
          description={socialDescription}
          image={socialImage}
          url={canonicalPageUrl}
          isBlogPost={false}
        />

        <SiteHeader />
        <div className='mji-root-page'>
          <HeroSection />
          {siteMapPageUrl != null && (
            <ArchiveSection
              recordMap={recordMap}
              urlMapper={siteMapPageUrl}
            />
          )}
          <Footer />
        </div>
      </>
    )
  }

  // Sub-pages: normal NotionRenderer
  return (
    <>
      <PageHead
        pageId={pageId}
        site={site}
        title={title}
        description={socialDescription}
        image={socialImage}
        url={canonicalPageUrl}
        isBlogPost={isBlogPost}
      />

      {isLiteMode && <BodyClassName className='notion-lite' />}
      {darkModeMounted && (isDarkMode
        ? <BodyClassName className='dark-mode' />
        : <BodyClassName className='light-mode' />)}

      <NotionRenderer
        bodyClassName={cs(
          styles.notion,
          pageId === site.rootNotionPageId && 'index-page'
        )}
        darkMode={isDarkMode}
        components={notionRendererComponents}
        recordMap={recordMap}
        rootPageId={site.rootNotionPageId}
        rootDomain={site.domain}
        fullPage={!isLiteMode}
        previewImages={!!recordMap.preview_images}
        showCollectionViewDropdown={false}
        showTableOfContents={showTableOfContents}
        minTableOfContentsItems={minTableOfContentsItems}
        defaultPageIcon={config.defaultPageIcon}
        defaultPageCover={config.defaultPageCover}
        defaultPageCoverPosition={config.defaultPageCoverPosition}
        mapPageUrl={siteMapPageUrl}
        mapImageUrl={mapImageUrl}
        searchNotion={config.isSearchEnabled ? searchNotion : undefined}
        pageAside={pageAside}
        footer={<Footer />}
      />

    </>
  )
}
