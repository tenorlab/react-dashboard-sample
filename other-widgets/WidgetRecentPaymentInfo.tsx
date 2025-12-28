// file: src/other-widgets/WidgetRecentPaymentInfo.tsx
import {
  DashboardWidgetBase,
  WrapperColumnContent,
  WrapperColumnContentListItem,
} from '@tenorlab/react-dashboard'
import type {
  IDashboardWidget,
  IDashboardWidgetProps,
  TDashboardWidgetKey,
} from '@tenorlab/react-dashboard'

const widgetKey: TDashboardWidgetKey = 'WidgetRecentPaymentInfo' as const

export function WidgetRecentPaymentInfo(props: IDashboardWidgetProps): IDashboardWidget {
  return (
    <DashboardWidgetBase
      widgetKey={widgetKey}
      title="Recent Payments"
      parentWidgetKey={props.parentWidgetKey}
      index={props.index}
      maxIndex={props.maxIndex}
      isEditing={props.isEditing}
      onRemoveClick={props.onRemoveClick}
      onMoveClick={props.onMoveClick}
    >
      <WrapperColumnContent>
        <WrapperColumnContentListItem>
          <div className="text-sm">Next Payment Due:</div>
          <div className="dashboard-number number-base text-primary">Mar 15th, 2025</div>
        </WrapperColumnContentListItem>
        <WrapperColumnContentListItem>
          <div className="text-sm">Last Payment:</div>
          <div className="text-sm flex flex-row gap-2">
            <span className="font-bold text-primary">$4,321</span> on
            <span className="font-bold text-primary">Jan 13th, 2024</span>
          </div>
        </WrapperColumnContentListItem>
      </WrapperColumnContent>
    </DashboardWidgetBase>
  )
}
