type GetWidgetConfigInput = {
  /** The Project's widget config, as the Project resolution includes it. */
  widgetConfig: { enabled: boolean } | null;
};

/**
 * What an embedding page needs to render the widget: whether the Project left
 * it on. A Project with no widget config row counts as enabled, so a widget
 * installed before the setting existed keeps working. Branding is always off:
 * this fork has no Plans to sell white-labelling with.
 */
export function getWidgetConfig({ widgetConfig }: GetWidgetConfigInput) {
  return {
    enabled: widgetConfig?.enabled ?? true,
    branding: false,
  };
}

export type GetWidgetConfigOutput = ReturnType<typeof getWidgetConfig>;
