export interface WRVUAdjustment {
  id: string;
  name: string;
  description?: string;
  providerId: string;
  amount: number;
  month: string;
  year: number;
  createdAt: Date;
}

// The form data structure that matches our modal
export interface WRVUAdjustmentFormData {
  name: string;
  description?: string;
  providerId: string;
  year: number;
  monthlyValues: {
    [key: string]: number;  // Jan: 50, Feb: 50, etc.
  };
}

// Response type for our API
export interface WRVUAdjustmentResponse {
  success: boolean;
  data?: WRVUAdjustment[];
  error?: string;
}

// For the AG Grid display
export interface WRVUAdjustmentGridRow {
  name: string;
  Jan?: number;
  Feb?: number;
  Mar?: number;
  Apr?: number;
  May?: number;
  Jun?: number;
  Jul?: number;
  Aug?: number;
  Sep?: number;
  Oct?: number;
  Nov?: number;
  Dec?: number;
  YTD: number;
} 