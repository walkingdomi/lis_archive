import {
  type ExtendedRecordMap,
  type SearchParams,
  type SearchResults
} from 'notion-types'
import { mergeRecordMaps } from 'notion-utils'
import pMap from 'p-map'
import pMemoize from 'p-memoize'

import {
  isPreviewImageSupportEnabled,
  navigationLinks,
  navigationStyle,
  rootNotionPageId
} from './config'
import { getTweetsMap } from './get-tweets'
import { notion } from './notion-api'
import { getPreviewImageMap } from './preview-images'

// Archive DB page ID (collection ID without dashes = Notion page ID of the database)
const ARCHIVE_COLLECTION_PAGE_ID = 'a880196f858882fe9989071abf333ce3'

const getNavigationLinkPages = pMemoize(
  async (): Promise<ExtendedRecordMap[]> => {
    const navigationLinkPageIds = (navigationLinks || [])
      .map((link) => link?.pageId)
      .filter(Boolean)

    if (navigationStyle !== 'default' && navigationLinkPageIds.length) {
      return pMap(
        navigationLinkPageIds,
        async (navigationLinkPageId) =>
          notion.getPage(navigationLinkPageId, {
            chunkLimit: 1,
            fetchMissingBlocks: false,
            fetchCollections: false,
            signFileUrls: false
          }),
        {
          concurrency: 4
        }
      )
    }

    return []
  }
)

export async function getPage(pageId: string): Promise<ExtendedRecordMap> {
  let recordMap = await notion.getPage(pageId)

  // Root page has archive DB as linked reference — item blocks aren't fetched automatically.
  // Explicitly call getCollectionData using a view from the already-loaded collection_view map.
  if (pageId === rootNotionPageId) {
    const ARCHIVE_COLLECTION_ID = 'a880196f-8588-82fe-9989-071abf333ce3'
    const collectionViewId = Object.keys(recordMap.collection_view || {})[0]
    if (collectionViewId) {
      try {
        const collectionView =
          (recordMap.collection_view[collectionViewId] as any)?.value
        const collectionData = await notion.getCollectionData(
          ARCHIVE_COLLECTION_ID,
          collectionViewId,
          collectionView,
          { limit: 999 }
        )
        const cdMap = (collectionData as any).recordMap
        if (cdMap?.block) {
          recordMap.block = { ...recordMap.block, ...cdMap.block }
        }
      } catch (e) {
        console.warn('[Archive] Failed to fetch collection data:', e)
      }
    } else {
      console.warn('[Archive] No collection_view entries found in recordMap')
    }
  }

  if (navigationStyle !== 'default') {
    // ensure that any pages linked to in the custom navigation header have
    // their block info fully resolved in the page record map so we know
    // the page title, slug, etc.
    const navigationLinkRecordMaps = await getNavigationLinkPages()

    if (navigationLinkRecordMaps?.length) {
      recordMap = navigationLinkRecordMaps.reduce(
        (map, navigationLinkRecordMap) =>
          mergeRecordMaps(map, navigationLinkRecordMap),
        recordMap
      )
    }
  }

  if (isPreviewImageSupportEnabled) {
    const previewImageMap = await getPreviewImageMap(recordMap)
    ;(recordMap as any).preview_images = previewImageMap
  }

  await getTweetsMap(recordMap)

  return recordMap
}

export async function search(params: SearchParams): Promise<SearchResults> {
  return notion.search(params)
}
