export const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const baseMonthlyData = Object.fromEntries(months.map((m) => [m.toLowerCase(), 400]));
export const targetMonthlyData = Object.fromEntries(months.map((m) => [m.toLowerCase(), 417]));

export const baseGridConfig = {
  domLayout: 'autoHeight',
  rowHeight: 48,
  headerHeight: 48,
  suppressColumnVirtualisation: true,
  suppressRowVirtualisation: true,
  defaultColDef: {
    resizable: true,
    sortable: false,
    suppressMenu: true,
    suppressSizeToFit: false,
    flex: 1,
    cellClass: 'ag-cell-vertically-aligned',
    headerClass: 'ag-header-cell-right',
  },
  suppressKeyboardEvent: (params: any) => {
    const { event } = params;
    return event.key === 'Enter' || event.key === 'Tab';
  },
  stopEditingWhenCellsLoseFocus: true,
  enterNavigatesVertically: false,
  enterNavigatesVerticallyAfterEdit: false,
  singleClickEdit: true,
  enableCellTextSelection: true,
  ensureDomOrder: true,
  suppressClickEdit: false
}; 