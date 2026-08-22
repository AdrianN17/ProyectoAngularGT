export interface WalletResponse {
  WalletId:       string;
  Name:           string;
  LastName:       string;
  DocumentNumber: string;
  DocumentType:   string;
  Currency:       string;
  Email:          string;
  Phone:          string;
  DailyLimit:     number;
  balanceAmount:  number;
}

export interface CreateWalletRequest {
  Name:           string;
  LastName:       string;
  DocumentType:   string;
  DocumentNumber: string;
  Email:          string;
  Phone:          string;
  Currency:       string;
  DailyLimit:     number;
}

export type UpdateWalletRequest = Partial<
  Pick<WalletResponse, 'Name' | 'LastName' | 'DocumentType' | 'DocumentNumber' | 'Email' | 'Phone' | 'DailyLimit'>
>;

export type ReplaceWalletRequest = Pick<
  WalletResponse, 'Name' | 'LastName' | 'DocumentType' | 'DocumentNumber' | 'Email' | 'Phone' | 'DailyLimit'
>;
