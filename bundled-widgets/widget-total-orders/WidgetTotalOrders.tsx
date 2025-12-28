// file: src/bundled-widgets/widget-total-orders/WidgetTotalOrders.tsx
import {
  IDashboardWidget,
  IDashboardWidgetProps,
  TDashboardWidgetKey,
} from '@tenorlab/react-dashboard'
import { DashboardWidgetBase, WrapperColumnContent } from '@tenorlab/react-dashboard'

const WidgetKey: TDashboardWidgetKey = 'WidgetTotalOrders'

export function WidgetTotalOrders(props: IDashboardWidgetProps): IDashboardWidget {
  return (
    <DashboardWidgetBase
      widgetKey={WidgetKey}
      title="Total Orders"
      parentWidgetKey={props.parentWidgetKey}
      index={props.index}
      maxIndex={props.maxIndex}
      isEditing={props.isEditing}
      onRemoveClick={props.onRemoveClick}
      onMoveClick={props.onMoveClick}
    >
      <WrapperColumnContent>
        <div className="dashboard-number number-xl text-primary">1,250</div>
        <div className="text-sm">Orders this month</div>
      </WrapperColumnContent>
    </DashboardWidgetBase>
  )
}
