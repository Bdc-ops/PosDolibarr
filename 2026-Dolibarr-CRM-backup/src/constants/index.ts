export const COLORS = {
  primary: '#2196F3',
  secondary: '#4CAF50',
  error: '#F44336',
  warning: '#FF9800',
  success: '#4CAF50',
  background: '#f5f5f5',
  white: '#ffffff',
  text: '#333333',
  textSecondary: '#666666',
  border: '#dddddd',
};

export const API_TIMEOUT = 30000;
export const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

export const INVOICE_STATUS = {
  DRAFT: '0',
  VALIDATED: '1',
  PAID: '2',
  CANCELLED: '3',
};

export const ORDER_STATUS = {
  DRAFT: '0',
  VALIDATED: '1',
  IN_PROGRESS: '2',
  DELIVERED: '3',
  CANCELLED: '4',
};

export const QUOTE_STATUS = {
  DRAFT: '0',
  SENT: '1',
  ACCEPTED: '2',
  REFUSED: '3',
  CANCELLED: '4',
};
