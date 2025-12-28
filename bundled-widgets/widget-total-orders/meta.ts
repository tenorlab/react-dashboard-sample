// file: src/bundled-widgets/widget-total-orders/meta.ts
import type { TWidgetMetaInfo } from '@tenorlab/react-dashboard'
import { MonitorIcon as ComponentIcon } from '@tenorlab/react-dashboard'

// Define the metadata object for the plugin
export const WidgetTotalOrdersMeta: TWidgetMetaInfo = {
  name: 'Total Orders',
  categories: ['Widget'],
  icon: ComponentIcon,
  noDuplicatedWidgets: true,
  description: 'Displays information about your total orders.',
  externalDependencies: [],
}
