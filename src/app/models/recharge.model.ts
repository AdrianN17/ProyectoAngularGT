export interface RechargeResponse {
  RechargeId: string;
  WalletId:   string;
  Amount:     number;
  Currency:   string;
  MethodType: string;
  CreatedAt:  string;
}

export interface CreateRechargeRequest {
  WalletId:   string;
  Amount:     number;
  Currency:   string;
  MethodType: string;
}
