import React from 'react';
import { Raffle, User } from '../types';
import RaffleCard from './RaffleCard';
import iconoRR from '../src/img/iconoRR.png';

interface PublicRafflesProps {
  raffles: Raffle[];
  users: User[];
  onPurchase: (raffleId: string, amount: number, totalCost: number) => void;
  onLogin: () => void;
}

const PublicRaffles: React.FC<PublicRafflesProps> = ({ raffles, users, onPurchase, onLogin }) => {
  return (
    <div className="bg-white text-gray-900 min-h-screen">
      <header className="bg-white/90 backdrop-blur-sm sticky top-0 z-50 border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <img src={iconoRR} alt="RifaRaiz Logo" className="h-10 w-auto" />
            </div>
            <button
              onClick={onLogin}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition"
            >
              Iniciar sesion
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Rifas Activas</h1>
          <p className="text-sm text-gray-600 mt-2">Explora las rifas disponibles y participa cuando quieras.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {raffles.map(raffle => {
            const standardCard = (
              <RaffleCard
                key={raffle.id}
                raffle={raffle}
                onPurchase={onPurchase}
                hasActiveTickets={false}
                users={users}
              />
            );

            const fidelityCard = raffle.associatedBusinesses && raffle.associatedBusinesses.length > 0 ? (
              <RaffleCard
                key={`${raffle.id}-fidelity`}
                raffle={{
                  ...raffle,
                  id: `${raffle.id}_fidelity`,
                  title: `${raffle.title}`,
                  isFidelity: true,
                }}
                onPurchase={onPurchase}
                hasActiveTickets={false}
                users={users}
              />
            ) : null;

            return (
              <React.Fragment key={raffle.id}>
                {standardCard}
                {fidelityCard}
              </React.Fragment>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default PublicRaffles;
