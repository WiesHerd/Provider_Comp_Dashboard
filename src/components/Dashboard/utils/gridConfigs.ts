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

export const customStyles = `
  .ag-theme-alpine {
    --ag-header-background-color: #cbd5e1;
    --ag-odd-row-background-color: #ffffff;
    --ag-even-row-background-color: #ffffff;
    --ag-border-color: #e2e8f0;
    --ag-header-font-weight: 600;
    --ag-header-font-size: 15.5px;
    --ag-row-hover-color: #e5e7eb;
    border-radius: 12px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    overflow: hidden;
  }

  .ag-header-cell {
    font-size: 15.5px !important;
    font-weight: 600 !important;
    color: #1e293b !important;
  }

  .ag-row[row-index="0"] .ag-cell,
  .ag-row[row-index="3"] .ag-cell {
    background-color: #f1f5f9 !important;
    font-weight: 600;
  }

  .adjustment-row {
    background-color: #eef2ff !important;
  }
`; 