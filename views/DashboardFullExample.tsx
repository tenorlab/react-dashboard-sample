// file: src/views/DashboardFullExample.tsx
import { useEffect, useState } from 'react'
import {
  TDashboardWidgetKey,
  IDashboardConfig,
  TDashboardWidgetCatalog,
  IDashboardSettingEntry,
  useDashboardStore,
  useDashboardUndoService,
} from '@tenorlab/react-dashboard'
import {
  DynamicWidgetLoader,
  DashboardGrid,
  WidgetsCatalogFlyout,
  Button,
  showToast,
} from '@tenorlab/react-dashboard'
import {
  AddIcon,
  DeleteIcon,
  EditIcon,
  MonitorIcon as NonResponsiveDesignIcon,
  MonitorSmartphoneIcon as ResponsiveDesignIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from '@tenorlab/react-dashboard'
import {
  DashboardMinZoomScale,
  DashboardMaxZoomScale,
  blankDashboardConfig,
  getNewZoomScaleWithinRange,
  cssVarsUtils,
  useDashboardStorageService,
  ensureContainersSequence,
  removeEmptyContainers,
  getWidgetMetaFromCatalog,
} from '@tenorlab/react-dashboard/core'
import { IDashboardWidgetExtraProps } from '@/models'
import { getDashboardDefaults } from '../dashboard-defaults'

export function DashboardFullExample() {
  const clientAppKey = 'myclientapp'
  const user = { id: 1234 }
  const userId = user.id
  const dashboardStore = useDashboardStore()
  const dashboardStorageService = useDashboardStorageService()

  const { isLoading, isEditing, currentDashboardConfig } = dashboardStore
  const getCurrentDashboardConfig = () => currentDashboardConfig
  const getCurrentDashboardId = () => currentDashboardConfig.dashboardId
  const getTargetContainerKey = () => dashboardStore.targetContainerKey
  const getIsResponsive = () => currentDashboardConfig.responsiveGrid
  const getNextContainerKey = (selectedContainerKey: TDashboardWidgetKey) =>
    dashboardStore.getNextContainerKey(selectedContainerKey)

  const allDashboardConfigs = dashboardStore.allDashboardConfigs.sort((a, b) => {
    const isADefault = a.dashboardId === 'default'
    const isBDefault = b.dashboardId === 'default'

    // 1. If 'a' is default and 'b' is not, 'a' comes first (-1)
    if (isADefault && !isBDefault) {
      return -1
    }

    // 2. If 'b' is default and 'a' is not, 'b' comes first (1)
    if (isBDefault && !isADefault) {
      return 1
    }

    // 3. If neither is default (or both are, which shouldn't happen),
    // sort alphabetically (A-Z) by dashboardId.
    return a.dashboardId.localeCompare(b.dashboardId)
  })

  // Initialize the undo service hook
  const currentDashboardId = getCurrentDashboardId()
  const undoService = useDashboardUndoService()
  // 1. Get the current index and history from the hook's return values
  const currentIndex = undoService.historyIndex[currentDashboardId]
  const history = undoService.undoHistory[currentDashboardId]
  const undoStatus = undoService.getUndoStatus(currentDashboardId)

  // default dashboard config
  const [_defaultDashboardConfig, setDefaultDashboardConfig] =
    useState<IDashboardConfig>(blankDashboardConfig)
  const [widgetsCatalog, setWidgetsCatalog] = useState<TDashboardWidgetCatalog>(new Map())
  const [dashboardTitle, setDashboardTitle] = useState('Dashboard')
  const getDefaultDashboardConfig = () => _defaultDashboardConfig

  useEffect(() => {
    async function initDashboard() {
      // 1. Start Loading immediately
      dashboardStore.setIsLoading(true)

      try {
        // 2. Fetch Defaults (Catalog and Default Config)
        const defaults = await getDashboardDefaults(user, clientAppKey)

        // 3. Fetch Saved Configs from Storage
        const savedConfigs = await dashboardStorageService.getSavedDashboards(
          userId,
          clientAppKey,
          defaults.widgetsCatalog,
          defaults.dashboardConfig,
        )

        // 4. Batch the Store Updates
        // We set everything at once before turning off isLoading
        dashboardStore.setAllDashboardConfigs(savedConfigs)

        const dashboardConfig =
          savedConfigs.find((x) => x.dashboardId === 'default') ||
          savedConfigs[0] ||
          defaults.dashboardConfig

        dashboardStore.setCurrentDashboardConfig(dashboardConfig)

        // 5. Update Local Component State
        setWidgetsCatalog(defaults.widgetsCatalog)
        setDefaultDashboardConfig(defaults.dashboardConfig)
        setDashboardTitle('Dashboard')

        cssVarsUtils.restoreCssVarsFromSettings(dashboardConfig.cssSettings || [])
      } catch (error) {
        console.error('Dashboard Init Failed', error)
      } finally {
        // 6. FINALLY stop loading - this triggers the transition to DashboardGrid
        dashboardStore.setIsLoading(false)
      }
    }

    initDashboard()
  }, [])

  const selectContainer = async (parentWidgetKey: any) => {
    // toggle the target of the widgets catalog flyout from dashboard to selected container (or vice-versa)
    const currentTargetContainerKey = getTargetContainerKey()
    dashboardStore.setTargetContainerKey(
      currentTargetContainerKey === parentWidgetKey ? undefined : parentWidgetKey,
    )
  }

  /**
   * @param updatedConfigs
   * @param deletedDashboardId: (optional) The ID of the dashboard that was just deleted
   */
  const saveDashboardConfigs = async (
    updatedConfigs: IDashboardConfig[],
    deletedDashboardId?: string,
  ) => {
    const saveResult = await dashboardStorageService.saveDashboards(
      userId,
      clientAppKey,
      updatedConfigs,
      widgetsCatalog,
    )
    if (!saveResult) {
      showToast({
        children: 'Error saving dashboards.',
        severity: 'error',
      })
    } else {
      if (deletedDashboardId) {
        // Case 1: Dashboard was deleted. Remove its history.
        undoService.removeUndoHistoryForDashboard(deletedDashboardId) // Use the dedicated removal function
      } else {
        // Case 2: Standard save/update. Record the successful final state.

        // 1. Find the newly updated configuration within the array
        const finalConfig = updatedConfigs.find(
          (config) => config.dashboardId === getCurrentDashboardId(),
        )

        // 1. Add entry to undo history (Only for standard config changes, not deletion)
        // NOTE: In the deletion scenario (where deletedDashboardId is present),
        // you skip adding an undo entry because the goal is to delete, not record a change.
        if (finalConfig) {
          undoService.addUndoEntry(finalConfig)
        }
      }
    }
  }

  const onAddDashboardClick = async () => {
    let newId = 2
    if (allDashboardConfigs.length > 1) {
      newId =
        Math.max(
          ...allDashboardConfigs
            .filter((x) => x.dashboardId !== 'default' && !isNaN(x.dashboardId as any))
            .map((x) => Number(x.dashboardId)),
        ) + 1
    }

    let name = window.prompt('Enter a name for the new dashboard')
    if (name) {
      const defaultConfig = getDefaultDashboardConfig()
      const item: IDashboardConfig = {
        ...defaultConfig,
        dashboardId: `${newId}`,
        dashboardName: name || `Dashboard ${newId}`,
      }
      const updatedConfigs = dashboardStore.addDashboardConfig(item)
      await saveDashboardConfigs(updatedConfigs)
    }
  }

  const onRemoveDashboardClick = async () => {
    if (window.confirm('Are you sure you want to delete this dashboard?')) {
      const id = getCurrentDashboardId()
      const updatedConfigs = dashboardStore.deleteDashboardConfigById(id)
      await saveDashboardConfigs(updatedConfigs, id)
    }
  }

  const onRemoveWidgetClick = async (
    widgetKey: TDashboardWidgetKey,
    parentWidgetKey?: TDashboardWidgetKey,
  ) => {
    if (
      `${widgetKey}`.includes('WidgetContainer') &&
      !window.confirm('Are you sure you want to delete this container and its widgets?')
    ) {
      // if they dont confirm deleting the container, just reutrn
      return
    }

    console.log('onRemoveWidgetClick', { widgetKey, parentWidgetKey })
    const { success, message, allUpdatedDashboardConfigs } = dashboardStore.removeWidget(
      widgetKey,
      parentWidgetKey,
    )
    console.log('onRemoveWidgetClick', success, allUpdatedDashboardConfigs)
    if (success) {
      await saveDashboardConfigs(allUpdatedDashboardConfigs)
    } else {
      showToast({
        children: message,
        severity: 'error',
      })
    }
  }

  const onAddWidgetClick = async (
    widgetKey: TDashboardWidgetKey,
    parentWidgetKey?: TDashboardWidgetKey,
  ) => {
    // get widget meta info
    const widgetMeta = getWidgetMetaFromCatalog(widgetKey, widgetsCatalog)
    const noDuplicatedWidgets = widgetMeta?.noDuplicatedWidgets || false
    const addWidgetResp = dashboardStore.addWidget({
      widgetKey,
      parentWidgetKey,
      noDuplicatedWidgets,
    })
    if (addWidgetResp.success) {
      await saveDashboardConfigs(addWidgetResp.allUpdatedDashboardConfigs)
    } else {
      showToast({
        children: addWidgetResp.message,
        severity: 'error',
      })
    }
  }

  const onAddContainerClick = async (selectedContainerKey: TDashboardWidgetKey) => {
    const containerWidgetKey = getNextContainerKey(selectedContainerKey)
    const addWidgetResp = dashboardStore.addWidget({
      widgetKey: containerWidgetKey,
    })
    if (addWidgetResp.success) {
      await saveDashboardConfigs(addWidgetResp.allUpdatedDashboardConfigs)

      // select container so that the digets catalog flyout targets it
      // and the user can immediately start adding widgets to the new container
      selectContainer(containerWidgetKey)
    } else {
      showToast({
        children: addWidgetResp.message,
        severity: 'error',
      })
    }
  }

  const onMoveWidgetClick = async (
    direction: -1 | 1,
    widgetKey: TDashboardWidgetKey,
    parentWidgetKey?: TDashboardWidgetKey,
  ) => {
    const moveWidgetResp = dashboardStore.moveWidget(direction, widgetKey, parentWidgetKey)
    if (moveWidgetResp.success) {
      await saveDashboardConfigs(moveWidgetResp.allUpdatedDashboardConfigs)
    } else {
      showToast({
        children: moveWidgetResp.message,
        severity: 'error',
      })
    }
  }

  const onSettingItemsUpdated = async (items: IDashboardSettingEntry[]) => {
    const currentConfig = getCurrentDashboardConfig()
    const updatedDashboardConfig: IDashboardConfig = {
      ...currentConfig,
      cssSettings: items,
    }
    const updatedConfigs = dashboardStore.setCurrentDashboardConfig(updatedDashboardConfig)
    await saveDashboardConfigs(updatedConfigs)
    cssVarsUtils.restoreCssVarsFromSettings(items)
  }

  const onZoomClick = async (direction: -1 | 1) => {
    const currentConfig = getCurrentDashboardConfig()
    let newZoomScale = getNewZoomScaleWithinRange(currentConfig.zoomScale, direction)
    const updatedDashboardConfig = {
      ...currentConfig,
      zoomScale: newZoomScale,
    }
    const updatedConfigs = dashboardStore.setCurrentDashboardConfig(updatedDashboardConfig)
    await saveDashboardConfigs(updatedConfigs)
  }

  const onResetToDefaultDashboardClick = async () => {
    if (!window.confirm('Are you sure you want to reset to the default dashboard configuration?')) {
      return
    }
    // reset to default but preserve current zoom scale
    const currentConfig = getCurrentDashboardConfig()
    const defaultConfig = getDefaultDashboardConfig()
    const updatedDashboardConfig = {
      ...defaultConfig,
      zoomScale: currentConfig.zoomScale,
    }
    cssVarsUtils.restoreCssVarsFromSettings(updatedDashboardConfig.cssSettings)
    undoService.removeUndoHistoryForDashboard(defaultConfig.dashboardId)
    const updatedConfigs = dashboardStore.setCurrentDashboardConfig(updatedDashboardConfig)
    await saveDashboardConfigs(updatedConfigs)
  }

  const onUndoOrRedo = async (operation: 'Undo' | 'Redo') => {
    const currentConfig = getCurrentDashboardConfig()
    //let configFromUndo: IDashboardConfig | undefined
    if (operation === 'Undo') {
      undoService.undo(currentConfig.dashboardId)
      //configFromUndo = undoService.getPreviousChanges(currentConfig.dashboardId)
    } else {
      undoService.redo(currentConfig.dashboardId)
      //configFromUndo = undoService.getNextChanges(currentConfig.dashboardId)
    }
    // if (configFromUndo) {
    //   dashboardStore.setCurrentDashboardConfig(JSON.parse(JSON.stringify(configFromUndo)))
    // }
  }

  const onStartEditingClick = async () => {
    // 1. Reset/initialize history with the current config (Zero-Lag Fix)
    const currentConfig = getCurrentDashboardConfig()
    undoService.initializeHistoryForDashboard(currentConfig)
    // 2. Enable edit mode
    dashboardStore.setIsEditing(true)
  }

  const onResponsiveDashboardToggle = async () => {
    const updatedDashboardConfig = {
      ...getCurrentDashboardConfig(),
      responsiveGrid: !getIsResponsive(),
    }
    const updatedConfigs = dashboardStore.setCurrentDashboardConfig(updatedDashboardConfig)
    await saveDashboardConfigs(updatedConfigs)
  }

  const onDoneClick = async () => {
    dashboardStore.setIsEditing(false)
    undoService.resetAllHistory()
    // ensure container sequence, but keep original order
    const updatedDashboardConfig = ensureContainersSequence(
      removeEmptyContainers(getCurrentDashboardConfig()),
    )
    const updatedConfigs = dashboardStore.setCurrentDashboardConfig(updatedDashboardConfig)
    await saveDashboardConfigs(updatedConfigs)
  }

  // additional data/props to pass through all widgets via extraProps from the dashboard:
  const dashboardContext: IDashboardWidgetExtraProps = {
    apiConfig: {},
    realtime: true,
    theme: 'dark',
    currency: 'USD',
    notificationsCount: 123,
    messages: [
      {
        id: 1,
        title: 'This is a dummy message',
      },
      {
        id: 2,
        title: 'This is another dummy message',
      },
    ],
  }

  // This logic runs AFTER the Dashboard has rendered and the index has been updated.
  useEffect(() => {
    if (currentIndex === undefined || !history) {
      return
    }

    const targetEntry = history[currentIndex]

    // 2. Call the function that updates the store state (the original onHistoryLoad action)
    if (targetEntry) {
      // Assuming you keep the original setup where the hook consumer has access to the store
      dashboardStore.setCurrentDashboardConfig(targetEntry.config)
    }

    // We only run this effect when the index changes.
  }, [currentDashboardId, currentIndex, history])

  return (
    <div className="relative flex flex-col h-full">
      {isEditing && (
        <WidgetsCatalogFlyout
          targetContainerKey={getTargetContainerKey()}
          widgetsCatalog={widgetsCatalog}
          currentDashboardConfig={currentDashboardConfig}
          undoStatus={undoStatus}
          addWidget={onAddWidgetClick}
          addContainer={onAddContainerClick}
          onSettingItemsUpdated={onSettingItemsUpdated}
          onUndoOrRedo={onUndoOrRedo}
          onResetToDefaultDashboardClick={onResetToDefaultDashboardClick}
          onDoneClick={onDoneClick}
        />
      )}
      <div
        className={`flex flex-row items-center gap-2 justify-between w-full ${isEditing ? 'mb-6' : 'mb-4'}`}
      >
        <div className="flex items-center gap-2 w-full h-full">
          <h2 className="m-0">{dashboardTitle}</h2>
          <div className="flex flex-row iems-center gap-1 h-full">
            {!isEditing && (
              <>
                {allDashboardConfigs.map((x) => (
                  <div key={x.dashboardId}>
                    <Button
                      data-testid={`select-dashboard_${x.dashboardId}`}
                      buttonType={x.dashboardId !== getCurrentDashboardId() ? 'normal' : 'normal'}
                      category={
                        x.dashboardId !== getCurrentDashboardId() ? 'secondary' : 'primary'
                      }
                      onClick={() => dashboardStore.selectDashboardById(x.dashboardId)}
                    >
                      {x.dashboardId === 'default' ? 'Default' : x.dashboardName}
                    </Button>
                  </div>
                ))}
                
                <Button
                  data-testid="edit-dashboard-config"
                  isIconButton={true}
                  tooltip={{
                    placement: 'bottom',
                    title: 'Edit Dashboard Configuration',
                  }}
                  onClick={onStartEditingClick}
                >
                  <EditIcon />
                </Button>

                <Button
                  data-testid="add-dashboard-config"
                  isIconButton={true}
                  tooltip={{
                    placement: 'bottom',
                    title: 'Add Dashboard Configuration',
                  }}
                  onClick={onAddDashboardClick}
                >
                  <AddIcon />
                </Button>
                
                {currentDashboardId !== 'default' && (
                  <Button
                    data-testid="delete-dashboard-config"
                    isIconButton={true}
                    className="text-danger"
                    tooltip={{
                      placement: 'bottom',
                      title: 'Delete Dashboard Configuration',
                    }}
                    onClick={() => onRemoveDashboardClick()}
                  >
                    <DeleteIcon />
                  </Button>
                )}
              </>
            )}
            {isEditing && (
              <Button
                data-testid="button-done-editing"
                tooltip={{
                  placement: 'bottom',
                  title: 'Click to exit edit mode',
                }}
                onClick={onDoneClick}
              >
                <span>Done</span>
              </Button>
            )}
            <>
              <Button
                data-testid="responsive-dashboard-toggle"
                isIconButton={true}
                tooltip={{
                  placement: 'bottom',
                  title: 'Responsive',
                }}
                onClick={onResponsiveDashboardToggle}
              >
                {currentDashboardConfig.responsiveGrid ? (
                  <ResponsiveDesignIcon />
                ) : (
                  <NonResponsiveDesignIcon />
                )}
              </Button>

              <Button
                data-testid="btn-dashboard-zoom-out"
                isIconButton={true}
                tooltip={{
                  placement: 'bottom',
                  title: 'Zoom out',
                }}
                disabled={Number(currentDashboardConfig.zoomScale) <= DashboardMinZoomScale}
                onClick={() => onZoomClick(-1)}
              >
                <ZoomOutIcon />
              </Button>
              <Button
                data-testid="btn-dashboard-zoom-in"
                isIconButton={true}
                tooltip={{
                  placement: 'bottom',
                  title: 'Zoom in',
                }}
                disabled={Number(currentDashboardConfig.zoomScale) >= DashboardMaxZoomScale}
                onClick={() => onZoomClick(1)}
              >
                <ZoomInIcon />
              </Button>
            </>
          </div>
        </div>
      </div>

      {isLoading && <div>Loading</div>}
      {!isLoading && (
        <DashboardGrid
          isEditing={isEditing}
          zoomScale={Number(currentDashboardConfig.zoomScale)}
          responsiveGrid={currentDashboardConfig.responsiveGrid}
        >
          {currentDashboardConfig.widgets.map((widgetKey, index) => (
            <DynamicWidgetLoader
              key={`${widgetKey}_${index}`}
              widgetKey={widgetKey}
              parentWidgetKey={undefined}
              targetContainerKey={getTargetContainerKey()}
              index={index}
              maxIndex={currentDashboardConfig.widgets.length - 1}
              childWidgetsConfig={currentDashboardConfig.childWidgetsConfig}
              widgetCatalog={widgetsCatalog as any}
              isEditing={isEditing}
              extraProps={dashboardContext}
              onRemoveClick={onRemoveWidgetClick}
              onMoveClick={onMoveWidgetClick}
              selectContainer={selectContainer}
            />
          ))}
        </DashboardGrid>
      )}
    </div>
  )
}
