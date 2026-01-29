/**
 * Commission Service
 * Handles calculation and management of referral commissions
 */

import { User, Commission, CommissionStatus } from '../types';

// Configuración de comisiones por nivel
export const COMMISSION_CONFIG = {
  level1: 0.10, // 10% para referido directo
  level2: 0.05, // 5% para segundo nivel
  level3: 0.02, // 2% para tercer nivel
};

/**
 * Calculate commissions for an upline when a user makes a purchase
 * Returns array of commissions to be created
 */
export function calculateCommissions(
  purchaseAmount: number,
  buyerUserId: string,
  uplineIds: string[], // Array of user IDs from direct to top
  raffleId: string
): Omit<Commission, 'id' | 'date'>[] {
  const commissions: Omit<Commission, 'id' | 'date'>[] = [];

  // Level 1: Direct referrer
  if (uplineIds.length > 0) {
    commissions.push({
      userId: uplineIds[0],
      amount: purchaseAmount * COMMISSION_CONFIG.level1,
      status: CommissionStatus.PENDING,
      level: 1,
      sourceUserId: buyerUserId,
      raffleId: raffleId,
    });
  }

  // Level 2: Indirect referrer (referrer's referrer)
  if (uplineIds.length > 1) {
    commissions.push({
      userId: uplineIds[1],
      amount: purchaseAmount * COMMISSION_CONFIG.level2,
      status: CommissionStatus.PENDING,
      level: 2,
      sourceUserId: buyerUserId,
      raffleId: raffleId,
    });
  }

  // Level 3: Two levels up
  if (uplineIds.length > 2) {
    commissions.push({
      userId: uplineIds[2],
      amount: purchaseAmount * COMMISSION_CONFIG.level3,
      status: CommissionStatus.PENDING,
      level: 3,
      sourceUserId: buyerUserId,
      raffleId: raffleId,
    });
  }

  return commissions;
}

/**
 * Build the upline array for a new user based on referrer
 */
export function buildUpline(referrerId: string, referrerUpline: string[] = []): string[] {
  return [referrerId, ...referrerUpline];
}

/**
 * Get commission statistics for a user
 */
export function getCommissionStats(
  commissions: Commission[],
  userId: string
) {
  const userCommissions = commissions.filter(c => c.userId === userId);
  
  const byStatus = {
    pending: userCommissions.filter(c => c.status === CommissionStatus.PENDING),
    paid: userCommissions.filter(c => c.status === CommissionStatus.PAID),
  };

  const totals = {
    pending: byStatus.pending.reduce((sum, c) => sum + c.amount, 0),
    paid: byStatus.paid.reduce((sum, c) => sum + c.amount, 0),
    total: userCommissions.reduce((sum, c) => sum + c.amount, 0),
  };

  const byLevel = {
    level1: userCommissions.filter(c => c.level === 1).reduce((sum, c) => sum + c.amount, 0),
    level2: userCommissions.filter(c => c.level === 2).reduce((sum, c) => sum + c.amount, 0),
    level3: userCommissions.filter(c => c.level === 3).reduce((sum, c) => sum + c.amount, 0),
  };

  return {
    total: totals.total,
    pending: totals.pending,
    paid: totals.paid,
    count: userCommissions.length,
    byLevel,
    byStatus,
  };
}

/**
 * Get network statistics for a user (referral tree)
 */
export function getNetworkStats(userId: string, users: User[]) {
  const user = users.find(u => u.id === userId);
  if (!user) return null;

  const directReferrals = users.filter(u => u.referredBy === userId);
  
  // Build complete downline recursively
  const getAllDownline = (uid: string): User[] => {
    const direct = users.filter(u => u.referredBy === uid);
    const indirect = direct.flatMap(u => getAllDownline(u.id));
    return [...direct, ...indirect];
  };

  const downline = getAllDownline(userId);
  const uniqueDownline = Array.from(new Map(downline.map(u => [u.id, u])).values());

  return {
    directReferralsCount: directReferrals.length,
    directReferrals,
    totalNetworkSize: uniqueDownline.length,
    downline: uniqueDownline,
  };
}
