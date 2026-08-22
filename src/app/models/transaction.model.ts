export interface TransactionResponse {
  PaymentId:    string;
  FromWalletId: string;
  ToWalletId:   string;
  Amount:       number;
  Currency:     string;
  SourceType:   string;
  CreatedAt:    string;
}

export interface CreateTransactionRequest {
  FromWalletId: string;
  ToWalletId:   string;
  Amount:       number;
  Currency:     string;
  SourceType:   string;
}
