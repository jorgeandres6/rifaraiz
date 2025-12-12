
import React, { useState, useEffect } from 'react';
import { User, Raffle, Ticket, Commission, UserRole, CommissionStatus, ExtraPrize, UserPrize, Notification } from './types';
import Dashboard from './components/Dashboard';
import AuthPage from './pages/AuthPage';
import Header from './components/Header';
import NotificationsModal from './components/NotificationsModal';
import SettingsModal from './components/SettingsModal';

const App: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [raffleForRoulette, setRaffleForRoulette] = useState<Raffle | null>(null);
  const [userPrizes, setUserPrizes] = useState<UserPrize[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Initial Mock Notifications
  const [notifications, setNotifications] = useState<Notification[]>([
      { id: 'n1', userId: '2', title: '¡Bienvenido!', message: 'Gracias por unirte a RifaRaiz.', date: new Date(Date.now() - 7200000), read: false },
      { id: 'n2', userId: '2', title: 'Nueva Rifa', message: 'Participa en la rifa del PS5.', date: new Date(Date.now() - 18000000), read: true },
  ]);


  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, rafflesRes, ticketsRes, commissionsRes] = await Promise.all([
          fetch('/data/users.json'),
          fetch('/data/raffles.json'),
          fetch('/data/tickets.json'),
          fetch('/data/commissions.json'),
        ]);

        if (!usersRes.ok || !rafflesRes.ok || !ticketsRes.ok || !commissionsRes.ok) {
          throw new Error('La respuesta de la red no fue correcta');
        }

        const usersData: User[] = await usersRes.json();
        const rafflesData: Raffle[] = await rafflesRes.json();
        const ticketsData: any[] = await ticketsRes.json();
        const commissionsData: any[] = await commissionsRes.json();

        const parsedTickets: Ticket[] = ticketsData.map(ticket => ({
          ...ticket,
          purchaseDate: new Date(ticket.purchaseDate),
        }));
        const parsedCommissions: Commission[] = commissionsData.map(c => ({
            ...c,
            date: new Date(c.date)
        }));

        setUsers(usersData);
        setRaffles(rafflesData);
        setTickets(parsedTickets);
        setCommissions(parsedCommissions);
        
      } catch (error) {
        console.error("No se pudieron obtener los datos de simulación:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    // Este efecto se ejecuta cuando el estado de `users` se llena desde la obtención de datos
    if (users.length > 0) {
      const loggedInUserId = localStorage.getItem('loggedInUserId');
      if (loggedInUserId) {
        const user = users.find(u => u.id === loggedInUserId);
        setCurrentUser(user || null); // Establece el usuario o nulo si no se encuentra
      }
    }
  }, [users]);

  const handleLogin = (email: string, pass: string): { success: boolean; message?: string } => {
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
        return { success: false, message: "Credenciales inválidas. Por favor, inténtalo de nuevo." };
    }
    
    if (user.role === UserRole.INACTIVE) {
        return { success: false, message: "Tu cuenta ha sido desactivada. Por favor, contacta al administrador." };
    }
    
    // Check against the user's specific password, or the default "password" for legacy/demo users
    const correctPassword = user.password || 'password';
    if (pass === correctPassword) {
      setCurrentUser(user);
      localStorage.setItem('loggedInUserId', user.id);
      return { success: true };
    }
    
    return { success: false, message: "Credenciales inválidas. Por favor, inténtalo de nuevo." };
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('loggedInUserId');
  };

  const handleSignup = (name: string, email: string, pass: string, phone: string, city: string, referralCode?: string): { success: boolean; message?: string } => {
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, message: "El correo electrónico ya está en uso." };
    }
    
    const newUser: User = {
      id: String(Date.now()),
      name,
      email,
      password: pass,
      role: UserRole.USER,
      referralCode: name.toUpperCase().substring(0, 4) + String(Date.now()).slice(-3),
    };

    const uplineIdsForJson: { level1?: string; level2?: string; level3?: string } = {};

    if (referralCode) {
        const directReferrer = users.find(u => u.referralCode.toLowerCase() === referralCode.toLowerCase());
        if (directReferrer) {
            newUser.referredBy = directReferrer.id;
            // Build the full upline chain for the new user
            const newUserUpline = [directReferrer.id, ...(directReferrer.upline || [])];
            newUser.upline = newUserUpline;

            // Populate uplineIdsForJson for the JSON export, maintaining the 3-level structure for that specific output
            uplineIdsForJson.level1 = directReferrer.referralCode;
            const level2Referrer = users.find(u => u.id === newUserUpline[1]);
            if (level2Referrer) {
              uplineIdsForJson.level2 = level2Referrer.referralCode;
              const level3Referrer = users.find(u => u.id === newUserUpline[2]);
              if (level3Referrer) {
                uplineIdsForJson.level3 = level3Referrer.referralCode;
              }
            }
        } else {
            return { success: false, message: "El código de referido ingresado no es válido." };
        }
    }

    const [firstName, ...lastNameParts] = name.split(' ');
    const lastName = lastNameParts.join(' ');

    const registrationData = {
        registrationId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        userData: {
            email: newUser.email,
            firstName: firstName,
            lastName: lastName,
            phone: phone,
            city: city,
            status: "pending_verification" 
        },
        networkData: {
            referrerCode: newUser.referralCode,
            referralLink: `https://rifaraiz.com/ref/${newUser.referralCode}`,
            uplineIds: uplineIdsForJson
        },
        metadata: {
            sourceIp: "192.168.1.1", // Mock IP
            userAgent: navigator.userAgent,
            campaignId: null // Optional
        }
    };

    console.log("New User Registration JSON:", JSON.stringify(registrationData, null, 2));

    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    localStorage.setItem('loggedInUserId', newUser.id);
    return { success: true };
  };

  const switchUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('loggedInUserId', user.id);
    }
  };
  
  const handlePurchaseTicket = (raffleId: string, amount: number, totalCost: number) => {
    if (!currentUser) return;
    
    const raffle = raffles.find(r => r.id === raffleId);
    if (!raffle) {
      alert("Rifa no encontrada.");
      return;
    }

    const purchasedPackInfo = raffle.ticketPacks?.find(p => p.quantity === amount && p.price === totalCost);

    const newTickets: Ticket[] = [];
    const purchaseDate = new Date();
    for (let i = 0; i < amount; i++) {
      let ticketNum = `${currentUser.referralCode}-${raffle.soldTickets + i + 1}`;
      if (purchasedPackInfo?.isFidelityPack) {
          ticketNum += "F";
      }

      newTickets.push({
        id: `t${Date.now()}${i}`,
        raffleId,
        userId: currentUser.id,
        purchaseDate: purchaseDate,
        ticketNumber: ticketNum,
        originalUserId: currentUser.id,
        transferCount: 0,
        purchasedPackInfo: purchasedPackInfo ? {
            quantity: purchasedPackInfo.quantity,
            price: purchasedPackInfo.price,
            participationBonusPercent: purchasedPackInfo.participationBonusPercent
        } : undefined,
      });
    }

    setTickets(prev => [...prev, ...newTickets]);
    
    // Update raffle sales and handle Fidelity Pack Logic
    setRaffles(prev => prev.map(r => {
        if (r.id === raffleId) {
            const updatedRaffle = { ...r, soldTickets: r.soldTickets + amount, currentSales: r.currentSales + totalCost };
            
            // Fidelity Access Logic: If purchasing a Fidelity Pack, add user to associatedBusinesses
            if (purchasedPackInfo?.isFidelityPack) {
                const currentAssociations = r.associatedBusinesses || [];
                // Check if user is already associated to avoid duplicates
                if (!currentAssociations.includes(currentUser.name)) {
                    updatedRaffle.associatedBusinesses = [...currentAssociations, currentUser.name];
                    
                    // Add notification for fidelity access
                    setNotifications(prevNotifs => [{
                        id: `nf${Date.now()}`,
                        userId: currentUser.id,
                        title: '¡Acceso Fidelity Activado!',
                        message: `Has desbloqueado el acceso a la versión Fidelity de la rifa "${r.title}" por tu compra del pack especial.`,
                        date: new Date(),
                        read: false
                    }, ...prevNotifs]);
                }
            }
            return updatedRaffle;
        }
        return r;
    }));
    
    // Commission logic using the new `upline` array for efficiency
    const uplineIds = currentUser.upline || [];
    const commissionLevels = [
        { level: 1, rate: 0.20, userId: uplineIds[0] },
        { level: 2, rate: 0.10, userId: uplineIds[1] },
        { level: 3, rate: 0.05, userId: uplineIds[2] },
    ];

    const newCommissions: Commission[] = [];
    commissionLevels.forEach(({ level, rate, userId }) => {
        if (userId) {
            const commissionAmount = totalCost * rate;
            newCommissions.push({
                id: `c${Date.now()}${level}`,
                userId: userId,
                amount: commissionAmount,
                status: CommissionStatus.PENDING,
                level,
                sourceUserId: currentUser.id,
                raffleId,
                date: purchaseDate
            });
            
            // Notification for commission
            setNotifications(prev => [{
                id: `nc${Date.now()}${level}`,
                userId: userId,
                title: 'Comisión Recibida',
                message: `Has recibido $${commissionAmount.toFixed(2)} de comisión por una compra en tu red.`,
                date: new Date(),
                read: false
            }, ...prev]);
        }
    });

    if (newCommissions.length > 0) {
        setCommissions(prev => [...prev, ...newCommissions]);
    }

    // Trigger roulette if the raffle has extra prizes
    const purchasedRaffle = raffles.find(r => r.id === raffleId);
    if (purchasedRaffle?.extraPrizes && purchasedRaffle.extraPrizes.length > 0) {
      setRaffleForRoulette(purchasedRaffle);
    }
  };

  const handlePrizeWon = (prize: ExtraPrize, raffleId: string) => {
    if (!currentUser) return;

    const newUserPrize: UserPrize = {
      id: `up_${Date.now()}`,
      userId: currentUser.id,
      prizeId: prize.id,
      prizeName: prize.name,
      raffleId: raffleId,
      dateWon: new Date(),
    };
    setUserPrizes(prev => [...prev, newUserPrize]);
    console.log("Prize won and stored:", newUserPrize);
  };

  const handleAddRaffle = (newRaffleData: Omit<Raffle, 'id' | 'soldTickets' | 'currentSales'>) => {
    if (currentUser?.role !== UserRole.ADMIN) return;
    const newRaffle: Raffle = {
      ...newRaffleData,
      id: `r${Date.now()}`,
      soldTickets: 0,
      currentSales: 0,
      extraPrizes: [],
    };
    setRaffles(prev => [newRaffle, ...prev]);
  };
  
  const handleUpdateRaffle = (updatedRaffle: Raffle) => {
    if (currentUser?.role !== UserRole.ADMIN) return;
    setRaffles(prevRaffles => prevRaffles.map(raffle => 
      raffle.id === updatedRaffle.id ? updatedRaffle : raffle
    ));
  };

  const handleUpdateUser = (updatedUser: User) => {
    if (currentUser?.role !== UserRole.ADMIN) return;
    
    // Securely update the user list by merging existing user data with updates
    // This ensures properties like passwords are not lost if not explicitly passed
    setUsers(prevUsers => prevUsers.map(user => 
        user.id === updatedUser.id ? { ...user, ...updatedUser } : user
    ));

    // If the admin is editing their own user, update currentUser as well
    if (currentUser.id === updatedUser.id) {
        setCurrentUser(prev => prev ? { ...prev, ...updatedUser } : null);
    }
  };

  const handleAddNotification = (notification: Omit<Notification, 'id' | 'date' | 'read'>) => {
      const newNotif: Notification = {
          ...notification,
          id: `n${Date.now()}`,
          date: new Date(),
          read: false
      };
      setNotifications(prev => [newNotif, ...prev]);
  };

  const handleTransferTickets = (ticketIds: string[], recipientEmail: string): { success: boolean; message?: string } => {
    if (!currentUser) {
        return { success: false, message: "Debes iniciar sesión para realizar una transferencia." };
    }

    const recipient = users.find(u => u.email.toLowerCase() === recipientEmail.toLowerCase());
    if (!recipient) {
      return { success: false, message: "Usuario no registrado. Verifica el correo electrónico." };
    }
    if (recipient.id === currentUser.id) {
      return { success: false, message: "No puedes transferirte boletos a ti mismo." };
    }

    const ticketsToTransfer = tickets.filter(t => ticketIds.includes(t.id));
    const ineligibleTicket = ticketsToTransfer.find(t => t.transferCount >= 3);
    if (ineligibleTicket) {
      return { success: false, message: `El boleto #${ineligibleTicket.ticketNumber} ya alcanzó el límite de transferencias.` };
    }

    setTickets(prevTickets =>
      prevTickets.map(ticket => {
        if (ticketIds.includes(ticket.id)) {
          return {
            ...ticket,
            userId: recipient.id,
            transferCount: ticket.transferCount + 1,
          };
        }
        return ticket;
      })
    );
    
    // Notify recipient
    setNotifications(prev => [{
        id: `nt${Date.now()}`,
        userId: recipient.id,
        title: 'Boletos Recibidos',
        message: `${currentUser.name} te ha transferido ${ticketIds.length} boleto(s).`,
        date: new Date(),
        read: false
    }, ...prev]);

    return { success: true };
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleUpdatePassword = (currentPass: string, newPass: string) => {
    if (!currentUser) return false;

    // Check if current password is correct. 
    // Handle cases where legacy users might have undefined password in JSON, defaulting to 'password'
    const actualCurrentPass = currentUser.password || 'password';
    
    if (currentPass !== actualCurrentPass) {
        return false;
    }

    // Update user in state
    const updatedUser = { ...currentUser, password: newPass };
    
    // We update the users array AND the current user state to ensure consistency
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    setCurrentUser(updatedUser);
    
    // Add Security Notification
    setNotifications(prev => [{
        id: `ns${Date.now()}`,
        userId: currentUser.id,
        title: 'Contraseña Actualizada',
        message: 'La contraseña de tu cuenta ha sido modificada exitosamente.',
        date: new Date(),
        read: false
    }, ...prev]);

    return true;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
            <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-white mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-lg">Cargando datos de RifaRaiz...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthPage onLogin={handleLogin} onSignup={handleSignup} />;
  }

  const myNotifications = notifications.filter(n => n.userId === currentUser.id);
  const hasUnreadNotifications = myNotifications.some(n => !n.read);

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <Header 
        currentUser={currentUser} 
        allUsers={users} 
        switchUser={switchUser} 
        onLogout={handleLogout} 
        onOpenNotifications={() => setShowNotifications(true)}
        hasUnreadNotifications={hasUnreadNotifications}
        onOpenSettings={() => setShowSettings(true)}
      />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <Dashboard 
          currentUser={currentUser}
          raffles={raffles}
          tickets={tickets}
          commissions={commissions}
          users={users}
          onPurchaseTicket={handlePurchaseTicket}
          onAddRaffle={handleAddRaffle}
          onTransferTickets={handleTransferTickets}
          onUpdateUser={handleUpdateUser}
          onUpdateRaffle={handleUpdateRaffle}
          raffleForRoulette={raffleForRoulette}
          onPrizeWon={handlePrizeWon}
          onCloseRoulette={() => setRaffleForRoulette(null)}
          onAddNotification={handleAddNotification}
        />
      </main>

      {showNotifications && (
        <NotificationsModal 
            isOpen={showNotifications} 
            onClose={() => setShowNotifications(false)} 
            notifications={myNotifications}
            onMarkAsRead={handleMarkAsRead}
        />
      )}

      {showSettings && (
        <SettingsModal
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
            onUpdatePassword={handleUpdatePassword}
        />
      )}
    </div>
  );
};

export default App;
