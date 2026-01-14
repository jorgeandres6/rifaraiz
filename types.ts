
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  INACTIVE = 'inactive',
}

export enum CommissionStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
}

export interface BankAccount {
  bankName: string;
  accountType: 'ahorro' | 'corriente';
  idNumber: string; // cedula or RUC
  accountNumber: string;
}

export interface CryptoWallet {
  address: string;
  network: string; // e.g. BSC, ETH, TRX
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string;
  referralCode: string;
  referredBy?: string; // ID of the user who referred this user
  upline?: string[]; // Array of upline user IDs, from direct to top
  country?: string;
  bankAccount?: BankAccount;
  cryptoWallet?: CryptoWallet;
}

export interface TicketPack {
  quantity: number;
  price: number;
  participationBonusPercent?: number;
  isFidelityPack?: boolean; // New flag to indicate if this pack grants fidelity access
}

export interface ExtraPrize {
  id: string;
  name: string;
  quantity: number;
}

export interface Raffle {
  id: string;
  title: string;
  description: string;
  prizeInfo: string;
  salesGoal: number; // Total revenue goal in dollars
  goalThresholdPercent: number; // Percentage of goal to display publicly
  ticketPrice: number;
  soldTickets: number;
  currentSales: number; // Actual revenue in dollars
  ticketPacks?: TicketPack[];
  extraPrizes?: ExtraPrize[];
  isMonthly?: boolean;
  associatedBusinesses?: string[]; // List of businesses for Fidelity Raffle
  isFidelity?: boolean; // Flag to identify if it is the derived fidelity version
}

export interface Ticket {
  id: string;
  raffleId: string;
  userId: string; // Current owner
  purchaseDate: Date;
  ticketNumber: string;
  originalUserId: string;
  transferCount: number;
  purchasedPackInfo?: {
      quantity: number;
      price: number;
      participationBonusPercent?: number;
  };
}

export interface Commission {
  id:string;
  userId: string; // User who RECEIVES the commission
  amount: number;
  status: CommissionStatus;
  level: number; // e.g., 1 for direct referral, 2 for indirect
  sourceUserId: string; // User who MADE the purchase that generated the commission
  raffleId: string;
  date: Date;
}

export interface UserPrize {
  id: string;
  userId: string;
  prizeId: string;
  prizeName: string;
  raffleId: string;
  dateWon: Date;
}

export interface Notification {
  id: string;
  userId: string; // Recipient
  title: string;
  message: string;
  date: Date;
  read: boolean;
}