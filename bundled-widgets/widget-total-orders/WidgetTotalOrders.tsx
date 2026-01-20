// file: src/bundled-widgets/widget-total-orders/WidgetTotalOrders.tsx
import {
  IDashboardWidget,
  IDashboardWidgetProps,
} from '@tenorlab/react-dashboard'
import { DashboardWidgetBase, WrapperColumnContent } from '@tenorlab/react-dashboard'

export function WidgetTotalOrders(props: IDashboardWidgetProps): IDashboardWidget {
  return (
    <DashboardWidgetBase
      {...props}
    >
      <WrapperColumnContent>
        <div className="dashboard-number number-xl text-primary">1,250</div>
        <div className="text-sm">Orders this month</div>
      </WrapperColumnContent>
    </DashboardWidgetBase>
  )
}
