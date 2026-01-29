
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  INACTIVE = 'inactive',
}

export enum CommissionStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
}

export enum PurchaseOrderStatus {
  PENDING = 'PENDING', // Waiting for payment
  PAID = 'PAID', // Payment received
  VERIFIED = 'VERIFIED', // Admin verified and tickets assigned
  REJECTED = 'REJECTED', // Admin rejected the order
  CANCELLED = 'CANCELLED', // User cancelled
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
  salesGoal?: number; // Total revenue goal in dollars (optional)
  goalThresholdPercent?: number; // Percentage of goal to display publicly (optional)
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
  paymentMethod?: string; // e.g., 'transferencia', 'crypto', 'efectivo'
  paymentNotes?: string; // Additional payment details
  paidAt?: Date; // When the commission was marked as paid
  paidByAdminId?: string; // Admin who marked it as paid
  revertedAt?: Date; // When the commission was reverted to pending
  revertedByAdminId?: string; // Admin who reverted it
  revertNotes?: string; // Reason for reverting to pending
}

export interface UserPrize {
  id: string;
  userId: string;
  prizeId: string;
  prizeName: string;
  raffleId: string;
  dateWon: Date;
  redeemed?: boolean; // Whether the prize has been claimed/redeemed
  redeemedDate?: Date; // Date when the prize was redeemed
  redeemedByAdminId?: string; // Admin who redeemed the prize
  code: string; // Unique code to redeem the prize
}

export interface Notification {
  id: string;
  userId: string; // Recipient
  title: string;
  message: string;
  date: Date;
  read: boolean;
}

export interface RouletteChance {
  id: string;
  userId: string;
  raffleId: string;
  chances: number; // Number of spins available
  createdAt: Date;
}

export interface PurchaseOrder {
  id: string;
  orderCode: string; // Unique code for the order (displayed to users and admins)
  userId: string; // Who made the purchase
  raffleId: string;
  packId?: string; // Reference to the specific ticket pack
  quantity: number; // Number of tickets
  totalPrice: number; // Total price in dollars
  status: PurchaseOrderStatus;
  createdAt: Date;
  paidAt?: Date;
  paidByAdminId?: string; // Admin who marked as paid
  paymentMethod?: string; // Payment method (e.g., 'deposito', 'efectivo', 'transferencia')
  paymentNotes?: string; // Notes about the payment (e.g., deposit number, who received cash)
  verifiedAt?: Date;
  verifiedByAdminId?: string; // Admin who verified the order
  verificationNotes?: string; // Notes about the verification
  rejectionReason?: string;
  rejectedByAdminId?: string; // Admin who rejected the order
  ticketIds?: string[]; // IDs of tickets created when verified
}