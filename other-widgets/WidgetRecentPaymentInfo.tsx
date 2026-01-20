// file: src/other-widgets/WidgetRecentPaymentInfo.tsx
import {
  DashboardWidgetBase,
  WrapperColumnContent,
  WrapperColumnContentListItem,
} from '@tenorlab/react-dashboard'
import type {
  IDashboardWidget,
  IDashboardWidgetProps,
} from '@tenorlab/react-dashboard'

export function WidgetRecentPaymentInfo(props: IDashboardWidgetProps): IDashboardWidget {
  return (
    <DashboardWidgetBase
      {...props}
      widgetKey="WidgetRecentPaymentInfo"
      title="Recent Payments"
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
