// file: src/widgets-catalog.tsx
import {
  IDynamicWidgetCatalogEntry,
  TDashboardWidgetCatalog,
  TWidgetMetaInfoBase,
  WidgetContainerColumn,
  WidgetContainerLarge,
  WidgetContainerRow,
  TWidgetFactory,
} from '@tenorlab/react-dashboard'
import {
  createStaticEntry,
  localWidgetDiscovery,
  remoteWidgetDiscovery,
} from '@tenorlab/react-dashboard/core'

// other static widgets
import { WidgetRecentPaymentInfo } from './other-widgets/WidgetRecentPaymentInfo'

// import { getWidgetsManifestUrl } from '@/utils'

const bundledWidgetsSrcPath = '/src/bundled-widgets'
const asyncWidgetsSrcPath = '/src/async-widgets'

// Use Vite's Glob Import
// This creates an object where the keys are file paths, and the values are the TWidgetFactory functions.
// We target the 'index.ts' files within the widgets subdirectories.
type TGlobModuleMap = Record<string, TWidgetFactory>

// Eagerly loaded (Non-lazy / Bundled):
const bundledWidgetModules = import.meta.glob('/src/bundled-widgets/*/index.ts', {
  eager: true /* we load this immediately */,
}) as TGlobModuleMap

// Lazy loaded (Code-split / Plugins):
const asyncWidgetModules = import.meta.glob('/src/async-widgets/*/index.ts') as TGlobModuleMap

// Meta modules (Always eager so titles/icons are available immediately)
const allMetaModules = import.meta.glob('/src/**/widget-*/meta.ts', {
  eager: true,
}) as Record<string, Record<string, TWidgetMetaInfoBase>>

console.log('allMetaModules,', allMetaModules)

const hasPermission = (_user_: any, _permission: string) => true

/**
 * @name getWidgetCatalog
 * @description Dynamically builds the widgets catalog based on user type and operations/permissions.
 */
export const getWidgetCatalog = async (user: any | null): Promise<TDashboardWidgetCatalog> => {
  // A. Register Static Core Components
  const catalogMapEntries: [string, IDynamicWidgetCatalogEntry][] = [
    // everyone has access to the containers:
    createStaticEntry('WidgetContainer', WidgetContainerColumn),
    createStaticEntry('WidgetContainerRow', WidgetContainerRow),
    createStaticEntry('WidgetContainerLarge', WidgetContainerLarge),
  ]

  // B. Register Business Static Widgets
  // we could filter further by permissions and user type if needed
  if (hasPermission(user, 'some-permission')) {
    // catalogMapEntries.push(createStaticEntryFromStaticMap('WidgetCreditOverview'))
    // catalogMapEntries.push(createStaticEntryFromStaticMap('WidgetOutstandingBalance'))
    catalogMapEntries.push(createStaticEntry('WidgetRecentPaymentInfo', WidgetRecentPaymentInfo))
  }

  // C. Dynamic Discovery of bundled Widgets
  const staticEntries = localWidgetDiscovery(
    bundledWidgetsSrcPath,
    bundledWidgetModules,
    allMetaModules,
    false, // lazy: false
  )
  catalogMapEntries.push(...staticEntries)

  // D. Dynamic Discovery of async Widgets (lazy loaded)
  // Dynamic Widgets (plugins) Discovery Loop from /src/plugins/ folder
  const pluginEntries = localWidgetDiscovery(
    asyncWidgetsSrcPath,
    asyncWidgetModules,
    allMetaModules,
    true, // lazy: true
  )
  catalogMapEntries.push(...pluginEntries)

  // E. Optional: Remote discovery of -pre-built widgets hosted on a CDN
  /*const manifestUrl = getWidgetsManifestUrl()
  if (manifestUrl.length > 0) {
    const remoteResponse = await remoteWidgetDiscovery(manifestUrl)
    if (!remoteResponse.message) {
      catalogMapEntries.push(...(remoteResponse.entries || []))
    } else {
      console.error(
        'Remote plugin discovery failed:',
        remoteResponse.message,
        remoteResponse.details,
      )
    }
  } else {
    console.error(
      `manifestUrl (VITE_WIDGETS_MANIFEST_URL) not set. Skipping remote widget discovery`,
    )
  }*/

  return new Map(catalogMapEntries)
}
