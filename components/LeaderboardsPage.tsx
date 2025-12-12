import React, { useMemo } from 'react';
import { User, Ticket, Raffle } from '../types';
import Leaderboard from './Leaderboard';
import { UserCircleIcon, ShareIcon } from './icons';

interface LeaderboardsPageProps {
    users: User[];
    tickets: Ticket[];
    raffles: Raffle[];
    currentUser: User;
}

const LeaderboardsPage: React.FC<LeaderboardsPageProps> = ({ users, tickets, raffles, currentUser }) => {

    const salesData = useMemo(() => {
        // NOTE: This calculation is an approximation based on the raffle's base ticket price.
        // It does not account for special pricing from ticket packs.
        const rafflePriceMap = raffles.reduce((acc, r) => {
            acc[r.id] = r.ticketPrice;
            return acc;
        }, {} as Record<string, number>);

        const userSales = users.map(user => {
            // Direct referral sales calculation:
            // 1. Tickets originally purchased by direct referrals (originalUserId matches a referral).
            // 2. Tickets originally purchased by the user but transferred to someone else (resale).
            // Logic explicitly excludes tickets bought by the user and kept by the user.
            const directReferralIds = users
                .filter(u => u.referredBy === user.id)
                .map(u => u.id);

            const directSales = tickets
                .filter(t => {
                    // Tickets bought by referrals
                    const isReferralPurchase = directReferralIds.includes(t.originalUserId);
                    // Tickets bought by self AND transferred (not kept)
                    const isPersonalResale = t.originalUserId === user.id && t.userId !== user.id;
                    return isReferralPurchase || isPersonalResale;
                })
                .reduce((sum, ticket) => sum + (rafflePriceMap[ticket.raffleId] || 0), 0);
            
            // Full network sales calculation:
            // 1. Tickets originally purchased by anyone in the downline.
            // 2. Tickets originally purchased by the user but transferred to someone else (resale).
            const downlineIds = users
                .filter(u => u.upline?.includes(user.id))
                .map(u => u.id);

            const networkSales = tickets
                .filter(t => {
                    const isDownlinePurchase = downlineIds.includes(t.originalUserId);
                    const isPersonalResale = t.originalUserId === user.id && t.userId !== user.id;
                    return isDownlinePurchase || isPersonalResale;
                })
                .reduce((sum, ticket) => sum + (rafflePriceMap[ticket.raffleId] || 0), 0);

            return {
                id: user.id,
                name: user.name,
                directSales,
                networkSales,
            };
        });

        const topDirectSellers = [...userSales]
            .sort((a, b) => b.directSales - a.directSales)
            .slice(0, 10)
            .map(u => ({
                id: u.id,
                name: u.name,
                amount: u.directSales,
                isCurrentUser: u.id === currentUser.id
            }));

        const topNetworkSellers = [...userSales]
            .sort((a, b) => b.networkSales - a.networkSales)
            .slice(0, 10)
            .map(u => ({
                id: u.id,
                name: u.name,
                amount: u.networkSales,
                isCurrentUser: u.id === currentUser.id
            }));
            
        return { topDirectSellers, topNetworkSellers };

    }, [users, tickets, raffles, currentUser.id]);


    return (
        <div>
             <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-6">Leaderboards</h2>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Leaderboard
                    title="Top 10 - Vendedores Directos"
                    subtitle="Ventas generadas por referidos directos y boletos transferidos."
                    data={salesData.topDirectSellers}
                    icon={UserCircleIcon}
                    colorClass="text-cyan-400"
                />
                 <Leaderboard
                    title="Top 10 - Líderes de Red"
                    subtitle="Ventas generadas por toda la red y boletos transferidos."
                    data={salesData.topNetworkSellers}
                    icon={ShareIcon}
                    colorClass="text-fuchsia-400"
                />
             </div>
        </div>
    );
};

export default LeaderboardsPage;