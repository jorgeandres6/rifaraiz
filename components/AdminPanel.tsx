
import React, { useState, useMemo } from 'react';
import { Raffle, Ticket, Commission, User, UserRole, TicketPack, Notification } from '../types';
import { generateRaffleContent } from '../services/geminiService';
import { SparklesIcon, PlusCircleIcon, TicketIcon, CurrencyDollarIcon, ClipboardListIcon, GiftIcon, DocumentChartBarIcon, UsersIcon, PencilIcon, XIcon, ShareIcon, TrophyIcon, InformationCircleIcon, MailIcon, PaperAirplaneIcon, BuildingStoreIcon, LockClosedIcon } from './icons';
import ReportModal from './ReportModal';
import LeaderboardsPage from './LeaderboardsPage';
import EditRaffleModal from './EditRaffleModal';


interface AdminPanelProps {
    onAddRaffle: (raffle: Omit<Raffle, 'id' | 'soldTickets' | 'currentSales'>) => void;
    onUpdateRaffle: (raffle: Raffle) => void;
    raffles: Raffle[];
    tickets: Ticket[];
    commissions: Commission[];
    users: User[];
    onUpdateUser: (updatedUser: User) => void;
    currentUser: User;
    onAddNotification: (notification: Omit<Notification, 'id' | 'date' | 'read'>) => void;
}

const CreateRaffleForm: React.FC<{ onAddRaffle: AdminPanelProps['onAddRaffle'] }> = ({ onAddRaffle }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [prizeInfo, setPrizeInfo] = useState('');
    const [ticketPrice, setTicketPrice] = useState(10);
    const [salesGoal, setSalesGoal] = useState(2000);
    const [goalThresholdPercent, setGoalThresholdPercent] = useState(80);
    const [isGenerating, setIsGenerating] = useState(false);
    const [packs, setPacks] = useState<{ quantity: string; price: string; participationBonusPercent: string; isFidelityPack: boolean }[]>([{ quantity: '', price: '', participationBonusPercent: '', isFidelityPack: false }]);
    const [successMessage, setSuccessMessage] = useState('');

    const handlePackChange = (index: number, field: 'quantity' | 'price' | 'participationBonusPercent', value: string) => {
        const newPacks = [...packs];
        // Allow only numbers with up to 2 decimal places
        if (/^\d*(\.\d{0,2})?$/.test(value)) {
            newPacks[index][field] = value;
            setPacks(newPacks);
        }
    };

    const handleFidelityToggle = (index: number) => {
        const newPacks = [...packs];
        newPacks[index].isFidelityPack = !newPacks[index].isFidelityPack;
        setPacks(newPacks);
    };

    const handleAddPack = () => {
        setPacks([...packs, { quantity: '', price: '', participationBonusPercent: '', isFidelityPack: false }]);
    };

    const handleRemovePack = (index: number) => {
        const newPacks = packs.filter((_, i) => i !== index);
        // If the last pack is removed, add a new empty one to avoid empty state
        if (newPacks.length === 0) {
            setPacks([{ quantity: '', price: '', participationBonusPercent: '', isFidelityPack: false }]);
        } else {
            setPacks(newPacks);
        }
    };

    const handleGenerateContent = async () => {
        if (!prizeInfo) {
            alert("Por favor, introduce primero la información del premio.");
            return;
        }
        setIsGenerating(true);
        try {
            const content = await generateRaffleContent(prizeInfo);
            setTitle(content.title);
            setDescription(content.description);
        } catch (error) {
            console.error(error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const ticketPacks: TicketPack[] = packs
            .filter(p => p.quantity && p.price) // Filter out empty packs
            .map(p => {
                const newPack: TicketPack = {
                    quantity: Number(p.quantity),
                    // Round to 2 decimals
                    price: Math.round(Number(p.price) * 100) / 100,
                    isFidelityPack: p.isFidelityPack
                };
                if (p.participationBonusPercent && Number(p.participationBonusPercent) > 0) {
                    newPack.participationBonusPercent = Number(p.participationBonusPercent);
                }
                return newPack;
            });

        const newRaffle: Omit<Raffle, 'id' | 'soldTickets' | 'currentSales'> = {
            title,
            description,
            prizeInfo,
            ticketPrice: Math.round(Number(ticketPrice) * 100) / 100,
            salesGoal: Number(salesGoal),
            goalThresholdPercent: Number(goalThresholdPercent),
            ticketPacks,
        };
        onAddRaffle(newRaffle);
        
        setSuccessMessage(`¡La rifa "${title}" se ha creado con éxito!`);
        setTimeout(() => setSuccessMessage(''), 5000); // Hide after 5 seconds
        
        // Reset form
        setTitle('');
        setDescription('');
        setPrizeInfo('');
        setTicketPrice(10);
        setSalesGoal(2000);
        setGoalThresholdPercent(80);
        setPacks([{ quantity: '', price: '', participationBonusPercent: '', isFidelityPack: false }]);
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="prizeInfo" className="block text-sm font-medium text-gray-300">Información del Premio</label>
                    <input type="text" id="prizeInfo" value={prizeInfo} onChange={(e) => setPrizeInfo(e.target.value)} className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Ej: TV 4K Nuevo"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 invisible">Generar</label>
                        <button type="button" onClick={handleGenerateContent} disabled={isGenerating} className="mt-1 w-full flex items-center justify-center bg-purple-600 text-white font-bold py-2 px-4 rounded-md hover:bg-purple-700 transition-colors duration-300 disabled:bg-purple-900 disabled:cursor-not-allowed">
                        {isGenerating ? (
                            <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Generando...
                            </>
                        ) : (
                            <>
                            <SparklesIcon className="h-5 w-5 mr-2" />
                            Generar Título y Descripción con IA
                            </>
                        )}
                    </button>
                </div>
            </div>
                <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-300">Título de la Rifa</label>
                <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-300">Descripción</label>
                <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"></textarea>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label htmlFor="ticketPrice" className="block text-sm font-medium text-gray-300">Precio del Boleto ($)</label>
                    <input type="number" id="ticketPrice" step="0.01" value={ticketPrice} onChange={(e) => setTicketPrice(Number(e.target.value))} className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500" min="0.01" />
                </div>
                <div>
                    <label htmlFor="salesGoal" className="block text-sm font-medium text-gray-300">Meta de Ventas ($)</label>
                    <input type="number" id="salesGoal" value={salesGoal} onChange={(e) => setSalesGoal(Number(e.target.value))} className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500" min="1" />
                </div>
                <div>
                    <label htmlFor="goalThresholdPercent" className="block text-sm font-medium text-gray-300">Meta a Mostrar (%)</label>
                    <input type="number" id="goalThresholdPercent" value={goalThresholdPercent} onChange={(e) => setGoalThresholdPercent(Number(e.target.value))} className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500" min="1" max="100" />
                </div>
            </div>

            <div>
                <div className="flex items-center space-x-2">
                    <label className="block text-sm font-medium text-gray-300">Packs de Boletos (Opcional)</label>
                    <div className="relative group">
                        <InformationCircleIcon className="h-5 w-5 text-gray-400 cursor-pointer" />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-gray-900 text-white text-xs rounded py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 border border-gray-600 shadow-lg">
                           Define un % de las ventas totales de esta rifa que se repartirá como premio entre todos los compradores de este pack específico.
                           <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-600"></div>
                        </div>
                    </div>
                </div>
                <div className="space-y-2 mt-1">
                    {packs.map((pack, index) => (
                        <div key={index} className="flex flex-col md:flex-row md:items-center gap-2 bg-gray-900/50 p-2 rounded-md border border-gray-700">
                            <div className="flex items-center gap-2 flex-grow">
                                <input
                                    type="text"
                                    placeholder="Cantidad"
                                    value={pack.quantity}
                                    onChange={(e) => handlePackChange(index, 'quantity', e.target.value)}
                                    className="w-full md:w-20 bg-gray-800 border border-gray-600 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                                <span className="text-gray-400 text-sm">boletos x $</span>
                                <input
                                    type="text"
                                    placeholder="Precio"
                                    value={pack.price}
                                    onChange={(e) => handlePackChange(index, 'price', e.target.value)}
                                    className="w-full md:w-24 bg-gray-800 border border-gray-600 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-gray-400 text-sm">Bonus:</span>
                                 <input
                                    type="text"
                                    placeholder="%"
                                    value={pack.participationBonusPercent}
                                    onChange={(e) => handlePackChange(index, 'participationBonusPercent', e.target.value)}
                                    className="w-16 bg-gray-800 border border-gray-600 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    aria-label="Porcentaje de bonus de participación"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleFidelityToggle(index)}
                                    className={`p-2 rounded-md border transition-colors ${pack.isFidelityPack ? 'bg-purple-600 border-purple-500 text-white' : 'bg-gray-800 border-gray-600 text-gray-400 hover:text-purple-400'}`}
                                    title="Marcar como Pack Fidelity (da acceso a rifa fidelity)"
                                >
                                    <BuildingStoreIcon className="h-5 w-5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleRemovePack(index)}
                                    className="p-2 text-gray-400 hover:text-red-400"
                                    aria-label="Eliminar pack"
                                >
                                <XIcon className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                <button
                    type="button"
                    onClick={handleAddPack}
                    className="mt-2 text-sm text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                    + Agregar otro pack
                </button>
            </div>

            {successMessage && (
                <div className="bg-green-500/20 border border-green-500 text-green-300 px-4 py-3 rounded-md text-center" role="alert">
                    <span className="font-bold">{successMessage}</span>
                </div>
            )}

            <button type="submit" className="w-full flex items-center justify-center bg-indigo-600 text-white font-bold py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors duration-300">
                <PlusCircleIcon className="h-5 w-5 mr-2" />
                Crear Rifa
            </button>
        </form>
    )
};

const StatsDashboard: React.FC<{ raffles: Raffle[], tickets: Ticket[], commissions: Commission[], users: User[] }> = ({ raffles, tickets, commissions, users }) => {
    type Stats = {
        totalTicketsSold: number;
        totalRevenue: number;
        commissionTotals: { level1: number; level2: number; level3: number; };
    };
    type RaffleSalesData = { name: string; salesData: number[] };
    const [timePeriod, setTimePeriod] = useState('weekly'); // 'daily', 'weekly', 'monthly'
    const [selectedRaffleId, setSelectedRaffleId] = useState('general');
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    const dashboardData = useMemo(() => {
        const initialTotals: Stats = {
            totalTicketsSold: 0,
            totalRevenue: 0,
            commissionTotals: { level1: 0, level2: 0, level3: 0 }
        };

        const general: Stats = JSON.parse(JSON.stringify(initialTotals));

        const byRaffle = raffles.reduce((acc, raffle) => {
            acc[raffle.id] = {
                title: raffle.title,
                ...JSON.parse(JSON.stringify(initialTotals))
            };
            return acc;
        }, {} as Record<string, Stats & { title: string }>);

        const rafflesDataForChart = raffles.reduce((acc, raffle) => {
            acc[raffle.id] = {
                title: raffle.title,
                purchases: [] as { purchaseDate: Date }[],
            };
            return acc;
        }, {} as Record<string, { title: string; purchases: { purchaseDate: Date }[] }>);

        tickets.forEach(ticket => {
            const raffle = raffles.find(r => r.id === ticket.raffleId);
            if (raffle && byRaffle[raffle.id]) {
                general.totalTicketsSold++;
                general.totalRevenue += raffle.ticketPrice;
                byRaffle[raffle.id].totalTicketsSold++;
                byRaffle[raffle.id].totalRevenue += raffle.ticketPrice;
                rafflesDataForChart[raffle.id].purchases.push({ purchaseDate: ticket.purchaseDate });
            }
        });

        commissions.forEach(commission => {
            if (commission.level === 1) general.commissionTotals.level1 += commission.amount;
            else if (commission.level === 2) general.commissionTotals.level2 += commission.amount;
            else if (commission.level === 3) general.commissionTotals.level3 += commission.amount;
            
            if (byRaffle[commission.raffleId]) {
                 if (commission.level === 1) byRaffle[commission.raffleId].commissionTotals.level1 += commission.amount;
                 else if (commission.level === 2) byRaffle[commission.raffleId].commissionTotals.level2 += commission.amount;
                 else if (commission.level === 3) byRaffle[commission.raffleId].commissionTotals.level3 += commission.amount;
            }
        });

        return {
            activeRafflesCount: raffles.length,
            general,
            byRaffle,
            rafflesData: rafflesDataForChart,
        };
    }, [raffles, tickets, commissions]);
    
    const displayData = selectedRaffleId === 'general' 
        ? dashboardData.general 
        : dashboardData.byRaffle[selectedRaffleId] || dashboardData.general;

    const getStartOfDay = (d: Date): Date => {
        const date = new Date(d);
        date.setHours(0, 0, 0, 0);
        return date;
    };
    const getStartOfWeek = (d: Date): Date => {
        const date = new Date(d);
        const day = date.getDay();
        const diff = date.getDate() - day;
        const target = new Date(date.setDate(diff));
        target.setHours(0, 0, 0, 0);
        return target;
    };
    const getStartOfMonth = (d: Date): Date => {
        return new Date(d.getFullYear(), d.getMonth(), 1);
    };

    const chartData = useMemo(() => {
        const today = new Date();
        let timeLabels: string[] = [];
        let datePoints: Date[] = [];
        let xAxisTitle = '';

        if (timePeriod === 'daily') {
            xAxisTitle = 'Día (D/M)';
            for (let i = 29; i >= 0; i--) {
                const d = new Date(today);
                d.setDate(d.getDate() - i);
                datePoints.push(getStartOfDay(d));
            }
            timeLabels = datePoints.map(d => `${d.getDate()}/${d.getMonth() + 1}`);
        } else if (timePeriod === 'weekly') {
            xAxisTitle = 'Semana (Inicio D/M)';
            for (let i = 7; i >= 0; i--) {
                const d = new Date(today);
                d.setDate(d.getDate() - i * 7);
                datePoints.push(getStartOfWeek(d));
            }
            datePoints = [...new Map(datePoints.map(d => [d.getTime(), d])).values()].sort((a, b) => a.getTime() - b.getTime());
            timeLabels = datePoints.map(w => {
                const day = w.getDate();
                const month = w.getMonth() + 1;
                return `${day < 10 ? '0' + day : day}/${month < 10 ? '0' + month : month}`;
            });
        } else if (timePeriod === 'monthly') {
            xAxisTitle = 'Mes';
            for (let i = 11; i >= 0; i--) {
                const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
                datePoints.push(d);
            }
            timeLabels = datePoints.map(d => d.toLocaleString('es-ES', { month: 'short', year: '2-digit' }).replace('.', ''));
        }

        // FIX: Explicitly typing sourceRafflesData to ensure correct type inference for `data` in subsequent operations.
        const sourceRafflesData: Record<string, { title: string; purchases: { purchaseDate: Date }[] }> = selectedRaffleId === 'general'
            ? dashboardData.rafflesData
            : (dashboardData.rafflesData[selectedRaffleId] ? { [selectedRaffleId]: dashboardData.rafflesData[selectedRaffleId] } : {});

        const salesByRaffle = Object.entries(sourceRafflesData).reduce((acc, [raffleId, data]) => {
            acc[raffleId] = {
                name: data.title,
                salesData: Array(datePoints.length).fill(0),
            };
            return acc;
        }, {} as Record<string, RaffleSalesData>);

        Object.entries(sourceRafflesData).forEach(([raffleId, data]) => {
            data.purchases.forEach(purchase => {
                const purchaseDate = new Date(purchase.purchaseDate);
                let pointDate;
                if (timePeriod === 'daily') pointDate = getStartOfDay(purchaseDate);
                else if (timePeriod === 'weekly') pointDate = getStartOfWeek(purchaseDate);
                else pointDate = getStartOfMonth(purchaseDate);

                const pointIndex = datePoints.findIndex(d => d.getTime() === pointDate.getTime());
                if (pointIndex !== -1 && salesByRaffle[raffleId]) {
                    salesByRaffle[raffleId].salesData[pointIndex]++;
                }
            });
        });

        const allSales = Object.values(salesByRaffle).flatMap((r: RaffleSalesData) => r.salesData);
        const maxSale = Math.max(5, ...allSales);

        return { salesByRaffle, timeLabels, maxSale, xAxisTitle };
    }, [dashboardData, timePeriod, selectedRaffleId]);

    const { salesByRaffle, timeLabels, maxSale, xAxisTitle } = chartData;
    const colors = ['#818cf8', '#34d399', '#f59e0b', '#ec4899', '#60a5fa', '#22d3ee'];
    const raffleEntries = Object.entries(salesByRaffle) as [string, RaffleSalesData][];

    const svgWidth = 800;
    const svgHeight = 400;
    const margin = { top: 20, right: 20, bottom: 70, left: 50 };
    const width = svgWidth - margin.left - margin.right;
    const height = svgHeight - margin.top - margin.bottom;

    const xScale = (index: number) => (index / (timeLabels.length > 1 ? timeLabels.length - 1 : 1)) * width;
    const yScale = (value: number) => height - (value / maxSale) * height;
    
    const yAxisLabels = [];
    const tickCount = 5;
    for (let i = 0; i <= tickCount; i++) {
        const value = Math.round((maxSale / tickCount) * i);
        const y = yScale(value);
        yAxisLabels.push({ value, y });
    }

    return (
        <div className="space-y-8">
            <div className="bg-gray-700/50 p-4 rounded-lg flex items-center space-x-4">
                <div className="bg-indigo-500/20 p-3 rounded-full"><ClipboardListIcon className="h-6 w-6 text-indigo-400"/></div>
                <div>
                    <p className="text-sm text-gray-400">Rifas Activas</p>
                    <p className="text-2xl font-bold text-white">{dashboardData.activeRafflesCount}</p>
                </div>
            </div>

            <div className="border-b border-gray-700">
                <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
                    <button
                        onClick={() => setSelectedRaffleId('general')}
                        className={`whitespace-nowrap shrink-0 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                            selectedRaffleId === 'general'
                                ? 'border-indigo-500 text-indigo-400'
                                : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
                        }`}
                    >
                        General
                    </button>
                    {raffles.map(raffle => (
                        <button
                            key={raffle.id}
                            onClick={() => setSelectedRaffleId(raffle.id)}
                            className={`whitespace-nowrap shrink-0 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                                selectedRaffleId === raffle.id
                                    ? 'border-indigo-500 text-indigo-400'
                                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
                            }`}
                        >
                            {raffle.title}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gray-700/50 p-4 rounded-lg flex items-center space-x-4">
                        <div className="bg-green-500/20 p-3 rounded-full"><TicketIcon className="h-6 w-6 text-green-400"/></div>
                        <div>
                            <p className="text-sm text-gray-400">Boletos Vendidos</p>
                            <p className="text-2xl font-bold text-white">{displayData.totalTicketsSold}</p>
                        </div>
                    </div>
                    <div className="bg-gray-700/50 p-4 rounded-lg flex items-center space-x-4">
                        <div className="bg-yellow-500/20 p-3 rounded-full"><CurrencyDollarIcon className="h-6 w-6 text-yellow-400"/></div>
                        <div>
                            <p className="text-sm text-gray-400">Ingresos Totales</p>
                            <p className="text-2xl font-bold text-white">${displayData.totalRevenue.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
                
                <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Comisiones por Nivel</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-gray-700/50 p-4 rounded-lg flex items-center space-x-4">
                            <div className="bg-blue-500/20 p-3 rounded-full"><GiftIcon className="h-6 w-6 text-blue-400"/></div>
                            <div>
                                <p className="text-sm text-gray-400">Nivel 1 (20%)</p>
                                <p className="text-2xl font-bold text-white">${displayData.commissionTotals.level1.toFixed(2)}</p>
                            </div>
                        </div>
                        <div className="bg-gray-700/50 p-4 rounded-lg flex items-center space-x-4">
                            <div className="bg-purple-500/20 p-3 rounded-full"><GiftIcon className="h-6 w-6 text-purple-400"/></div>
                            <div>
                                <p className="text-sm text-gray-400">Nivel 2 (10%)</p>
                                <p className="text-2xl font-bold text-white">${displayData.commissionTotals.level2.toFixed(2)}</p>
                            </div>
                        </div>
                        <div className="bg-gray-700/50 p-4 rounded-lg flex items-center space-x-4">
                            <div className="bg-pink-500/20 p-3 rounded-full"><GiftIcon className="h-6 w-6 text-pink-400"/></div>
                            <div>
                                <p className="text-sm text-gray-400">Nivel 3 (5%)</p>
                                <p className="text-2xl font-bold text-white">${displayData.commissionTotals.level3.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <div className="flex flex-wrap gap-4 justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-white">Ventas por Rifa</h3>
                        <div className="flex items-center gap-4">
                            <select 
                                value={timePeriod}
                                onChange={(e) => setTimePeriod(e.target.value)}
                                className="bg-gray-900 border border-gray-600 rounded-md py-1.5 px-3 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                aria-label="Seleccionar período de tiempo para el gráfico"
                            >
                                <option value="daily">Diario</option>
                                <option value="weekly">Semanal</option>
                                <option value="monthly">Mensual</option>
                            </select>
                             <button
                                onClick={() => setIsReportModalOpen(true)}
                                className="flex items-center bg-gray-600 text-white font-bold py-1.5 px-4 rounded-md hover:bg-gray-500 transition-colors duration-300 text-sm"
                            >
                                <DocumentChartBarIcon className="h-5 w-5 mr-2" />
                                Generar Reporte
                            </button>
                        </div>
                    </div>
                    <div className="bg-gray-700/50 p-6 rounded-lg">
                        {raffleEntries.length > 0 ? (
                            <>
                                <svg width="100%" viewBox={`0 0 ${svgWidth} ${svgHeight}`} aria-label="Gráfico de ventas de boletos por rifa">
                                    <g transform={`translate(${margin.left}, ${margin.top})`}>
                                        {yAxisLabels.map(({ value, y }) => (
                                            <g key={`y-axis-${value}`} className="text-gray-400 text-xs">
                                                <line x1={0} x2={width} y1={y} y2={y} stroke="currentColor" strokeDasharray="2,5" strokeOpacity="0.3" />
                                                <text x={-10} y={y + 4} textAnchor="end" fill="currentColor" aria-hidden="true">{value}</text>
                                            </g>
                                        ))}
                                        <text transform={`translate(${-margin.left + 15}, ${height / 2}) rotate(-90)`} textAnchor="middle" fill="currentColor" className="text-sm font-medium text-gray-300">Boletos Vendidos</text>

                                        {timeLabels.map((label, index) => (
                                            <g key={`x-axis-${label}-${index}`} transform={`translate(${xScale(index)}, ${height})`} className="text-gray-400 text-xs">
                                                <text x={0} y={20} textAnchor="middle" fill="currentColor" aria-hidden="true">{label}</text>
                                            </g>
                                        ))}
                                        <text x={width / 2} y={height + margin.bottom - 25} textAnchor="middle" fill="currentColor" className="text-sm font-medium text-gray-300">{xAxisTitle}</text>

                                        {raffleEntries.map(([raffleId, raffleData], raffleIndex) => {
                                            const pathData = raffleData.salesData.length < 2 ? '' : raffleData.salesData.map((value, weekIndex) => {
                                                const x = xScale(weekIndex);
                                                const y = yScale(value);
                                                return `${weekIndex === 0 ? 'M' : 'L'} ${x},${y}`;
                                            }).join(' ');
                                            
                                            return (
                                                <g key={raffleId}>
                                                    <path d={pathData} fill="none" stroke={colors[raffleIndex % colors.length]} strokeWidth="2.5" />
                                                    {raffleData.salesData.map((value, weekIndex) => (
                                                        <circle key={`${raffleId}-point-${weekIndex}`} cx={xScale(weekIndex)} cy={yScale(value)} r="4" fill={colors[raffleIndex % colors.length]} stroke="#374151" strokeWidth="2">
                                                            <title>{`${raffleData.name}\n${timePeriod === 'weekly' ? 'Semana del' : ''} ${timeLabels[weekIndex]}\nVentas: ${value} boletos`}</title>
                                                        </circle>
                                                    ))}
                                                </g>
                                            );
                                        })}
                                    </g>
                                </svg>
                                <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 mt-4 text-sm">
                                    {raffleEntries.map(([_, raffleData], raffleIndex) => (
                                        <div key={`legend-${raffleData.name}`} className="flex items-center">
                                            <span className="h-3 w-3 rounded-full mr-2" style={{ backgroundColor: colors[raffleIndex % colors.length] }}></span>
                                            <span className="text-gray-300">{raffleData.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <p className="text-center text-gray-400 py-16">No hay datos de ventas para mostrar en el período y filtro seleccionados.</p>
                        )}
                    </div>
                </div>
            </div>
            {isReportModalOpen && (
                <ReportModal
                    isOpen={isReportModalOpen}
                    onClose={() => setIsReportModalOpen(false)}
                    raffles={raffles}
                    tickets={tickets}
                    commissions={commissions}
                    users={users}
                />
            )}
        </div>
    );
};

interface UserManagementProps { 
    users: User[]; 
    onUpdateUser: (user: User) => void;
    onAddNotification: (notification: Omit<Notification, 'id' | 'date' | 'read'>) => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, onUpdateUser, onAddNotification }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({ name: '', email: '', role: UserRole.USER });
  
    // Message Modal State
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [messageRecipient, setMessageRecipient] = useState<User | null>(null);
    const [isBroadcast, setIsBroadcast] = useState(false);
    const [messageSubject, setMessageSubject] = useState('');
    const [messageBody, setMessageBody] = useState('');
    const [messageStatus, setMessageStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

    const handleEditClick = (user: User) => {
      setEditingUser(user);
      setFormData({ name: user.name, email: user.email, role: user.role });
      setIsModalOpen(true);
    };
  
    const handleCloseModal = () => {
      setIsModalOpen(false);
      setEditingUser(null);
    };
  
    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value as UserRole }));
    };
  
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (editingUser) {
        onUpdateUser({ ...editingUser, ...formData });
        handleCloseModal();
      }
    };

    const handleResetPassword = (user: User) => {
      if (window.confirm(`¿Estás seguro de restablecer la contraseña de "${user.name}" a "rifaraiz2026"?`)) {
        onUpdateUser({ ...user, password: 'rifaraiz2026' });
        // Notify the user internally
        onAddNotification({
            userId: user.id,
            title: 'Contraseña Restablecida',
            message: 'Tu contraseña ha sido restablecida temporalmente a "rifaraiz2026" por un administrador. Por favor, cámbiala tan pronto inicies sesión.'
        });
      }
    };

    const handleOpenMessageModal = (user: User) => {
        setIsBroadcast(false);
        setMessageRecipient(user);
        setMessageSubject('');
        setMessageBody('');
        setMessageStatus('idle');
        setIsMessageModalOpen(true);
    };

    const handleOpenBroadcastModal = () => {
        setIsBroadcast(true);
        setMessageRecipient(null);
        setMessageSubject('');
        setMessageBody('');
        setMessageStatus('idle');
        setIsMessageModalOpen(true);
    };

    const handleCloseMessageModal = () => {
        setIsMessageModalOpen(false);
        setMessageRecipient(null);
        setIsBroadcast(false);
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        setMessageStatus('sending');
        
        setTimeout(() => {
            if (isBroadcast) {
                 users.forEach(user => {
                    if (user.role !== UserRole.INACTIVE) {
                         onAddNotification({
                            userId: user.id,
                            title: messageSubject,
                            message: messageBody,
                        });
                    }
                });
                console.log(`Mensaje masivo enviado a los usuarios.`);
            } else if (messageRecipient) {
                onAddNotification({
                    userId: messageRecipient.id,
                    title: messageSubject,
                    message: messageBody,
                });
                console.log(`Mensaje enviado a ${messageRecipient.email}:`, { subject: messageSubject, body: messageBody });
            }

            setMessageStatus('sent');
            setTimeout(() => {
                handleCloseMessageModal();
            }, 1500);
        }, 1000);
    };
  
    return (
      <div>
         <div className="flex justify-end mb-4">
            <button 
                onClick={handleOpenBroadcastModal}
                className="flex items-center bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-300 text-sm shadow-md"
            >
                <MailIcon className="h-5 w-5 mr-2" />
                Enviar Mensaje a Todos
            </button>
         </div>

        <div className="overflow-x-auto bg-gray-900/50 rounded-md border border-gray-700">
          <table className="w-full text-sm text-left text-gray-300">
            <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
              <tr>
                <th scope="col" className="px-6 py-3">Nombre</th>
                <th scope="col" className="px-6 py-3">Correo Electrónico</th>
                <th scope="col" className="px-6 py-3">Rol</th>
                <th scope="col" className="px-6 py-3">Cód. Referido</th>
                <th scope="col" className="px-6 py-3"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              {users.filter(Boolean).map(user => (
                <tr key={user?.id} className="border-b border-gray-700 hover:bg-gray-700/30">
                  <td className="px-6 py-4 font-medium text-white">{user?.name || ''}</td>
                  <td className="px-6 py-4">{user?.email || ''}</td>
                  <td className="px-6 py-4">
                    <span className={`capitalize px-2 py-1 text-xs rounded-full ${
                      user?.role === UserRole.ADMIN ? 'bg-indigo-500/30 text-indigo-300'
                      : user?.role === UserRole.INACTIVE ? 'bg-red-500/30 text-red-300'
                      : 'bg-gray-600/30 text-gray-300'
                    }`}>
                      {user?.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono">{user?.referralCode || ''}</td>
                  <td className="px-6 py-4 text-right flex justify-end space-x-2">
                    <button 
                        onClick={() => handleResetPassword(user)} 
                        className="p-1 text-yellow-500 hover:text-yellow-400"
                        title="Restablecer contraseña a 'rifaraiz2026'"
                    >
                        <LockClosedIcon className="h-5 w-5" />
                    </button>
                    <button 
                        onClick={() => handleOpenMessageModal(user)} 
                        className="p-1 text-blue-400 hover:text-blue-300"
                        title="Enviar Mensaje"
                    >
                        <MailIcon className="h-5 w-5" />
                    </button>
                    <button 
                        onClick={() => handleEditClick(user)} 
                        className="p-1 text-indigo-400 hover:text-indigo-300"
                        title="Editar Usuario"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
  
        {/* Edit User Modal */}
        {isModalOpen && editingUser && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md relative animate-fade-in">
              <button onClick={handleCloseModal} className="absolute top-3 right-3 text-gray-400 hover:text-white">
                <XIcon className="h-6 w-6" />
              </button>
              <form onSubmit={handleSubmit} className="p-6">
                <h3 className="text-xl font-bold text-indigo-400 mb-4">Editar Usuario</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-300">Nombre</label>
                    <input type="text" id="name" name="name" value={formData.name} onChange={handleFormChange} className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300">Correo Electrónico</label>
                    <input type="email" id="email" name="email" value={formData.email} onChange={handleFormChange} className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                  </div>
                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-300">Rol</label>
                    <select id="role" name="role" value={formData.role} onChange={handleFormChange} className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500">
                      <option value={UserRole.USER}>Usuario</option>
                      <option value={UserRole.ADMIN}>Administrador</option>
                      <option value={UserRole.INACTIVE}>Inactivo</option>
                    </select>
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600">Cancelar</button>
                  <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">Guardar Cambios</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Send Message Modal */}
        {isMessageModalOpen && (messageRecipient || isBroadcast) && (
             <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg relative animate-fade-in">
                    <button onClick={handleCloseMessageModal} className="absolute top-3 right-3 text-gray-400 hover:text-white">
                        <XIcon className="h-6 w-6" />
                    </button>
                    <form onSubmit={handleSendMessage} className="p-6">
                        <div className="flex items-center mb-4">
                             <div className="p-2 bg-blue-500/20 rounded-full mr-3">
                                <MailIcon className="h-6 w-6 text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">
                                    {isBroadcast ? 'Enviar Mensaje a Todos' : 'Enviar Mensaje'}
                                </h3>
                                <p className="text-sm text-gray-400">Para: <span className="text-white font-medium">
                                    {isBroadcast ? 'Todos los usuarios activos' : `${messageRecipient?.name} (${messageRecipient?.email})`}
                                </span></p>
                            </div>
                        </div>
                       
                        {messageStatus === 'sent' ? (
                            <div className="py-8 text-center animate-fade-in">
                                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-500/20 mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-green-500">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                    </svg>
                                </div>
                                <h4 className="text-lg font-bold text-white">¡Mensaje Enviado!</h4>
                                <p className="text-gray-400 mt-2">
                                    {isBroadcast ? 'Los usuarios recibirán la notificación pronto.' : 'El usuario recibirá la notificación pronto.'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="msgSubject" className="block text-sm font-medium text-gray-300">Asunto</label>
                                    <input 
                                        type="text" 
                                        id="msgSubject" 
                                        value={messageSubject} 
                                        onChange={(e) => setMessageSubject(e.target.value)} 
                                        required
                                        className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" 
                                        placeholder="Ej: Información sobre tu rifa"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="msgBody" className="block text-sm font-medium text-gray-300">Mensaje</label>
                                    <textarea 
                                        id="msgBody" 
                                        value={messageBody} 
                                        onChange={(e) => setMessageBody(e.target.value)} 
                                        required
                                        rows={5}
                                        className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" 
                                        placeholder="Escribe tu mensaje aquí..."
                                    ></textarea>
                                </div>
                                <div className="mt-6 flex justify-end space-x-3">
                                    <button 
                                        type="button" 
                                        onClick={handleCloseMessageModal} 
                                        disabled={messageStatus === 'sending'}
                                        className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 disabled:opacity-50"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={messageStatus === 'sending'}
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {messageStatus === 'sending' ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Enviando...
                                            </>
                                        ) : (
                                            <>
                                                <PaperAirplaneIcon className="h-4 w-4 mr-2 transform rotate-90" />
                                                Enviar
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        )}
      </div>
    );
  };

const ReferralNetworkStats: React.FC<{ users: User[], tickets: Ticket[], raffles: Raffle[] }> = ({ users, tickets, raffles }) => {
    const networkStats = useMemo(() => {
        const rafflePriceMap = raffles.reduce((acc, r) => {
            acc[r.id] = r.ticketPrice;
            return acc;
        }, {} as Record<string, number>);

        return users.filter(Boolean).map(user => {
            const downline = users.filter(u => u && u.upline?.includes(user.id));
            const directReferrals = users.filter(u => u && u.referredBy === user.id);
            const downlineIds = downline.map(u => u?.id).filter(Boolean) as string[];

            const networkTickets = tickets.filter(t => downlineIds.includes(t.userId));
            
            const totalNetworkSales = networkTickets.reduce((sum, ticket) => {
                return sum + (rafflePriceMap[ticket.raffleId] || 0);
            }, 0);
            
            return {
                userId: user.id,
                name: user.name,
                referralCode: user.referralCode,
                directReferralsCount: directReferrals.length,
                totalNetworkSize: downline.length,
                totalNetworkSales,
            };
        });
    }, [users, tickets, raffles]);

    return (
      <div className="overflow-x-auto bg-gray-900/50 rounded-md border border-gray-700">
        <table className="w-full text-sm text-left text-gray-300">
          <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
            <tr>
              <th scope="col" className="px-6 py-3">Usuario</th>
              <th scope="col" className="px-6 py-3">Cód. Referido</th>
              <th scope="col" className="px-6 py-3 text-center">Referidos Directos</th>
              <th scope="col" className="px-6 py-3 text-center">Tamaño Total de Red</th>
              <th scope="col" className="px-6 py-3 text-right">Ventas Totales de Red ($)</th>
            </tr>
          </thead>
          <tbody>
            {networkStats.map(stat => (
              <tr key={stat.userId} className="border-b border-gray-700 hover:bg-gray-700/30">
                <td className="px-6 py-4 font-medium text-white">{stat.name}</td>
                <td className="px-6 py-4 font-mono">{stat.referralCode}</td>
                <td className="px-6 py-4 text-center">{stat.directReferralsCount}</td>
                <td className="px-6 py-4 text-center">{stat.totalNetworkSize}</td>
                <td className="px-6 py-4 text-right font-semibold text-green-400">${stat.totalNetworkSales.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
};

const ManageRafflesList: React.FC<{ raffles: Raffle[], onEdit: (raffle: Raffle) => void }> = ({ raffles, onEdit }) => (
    <div>
        <h3 className="text-lg font-semibold text-white mb-4">Selecciona una rifa para administrar</h3>
        <div className="space-y-3">
            {raffles.map(raffle => (
                <div key={raffle.id} className="bg-gray-700/50 p-4 rounded-md flex justify-between items-center">
                    <div>
                        <p className="font-bold text-white">{raffle.title}</p>
                        <p className="text-sm text-gray-400">{raffle.prizeInfo}</p>
                    </div>
                    <button onClick={() => onEdit(raffle)} className="flex items-center bg-indigo-600 text-white font-bold py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors duration-300">
                        <PencilIcon className="h-5 w-5 mr-2" />
                        Gestionar
                    </button>
                </div>
            ))}
        </div>
    </div>
);


const AdminPanel: React.FC<AdminPanelProps> = ({ onAddRaffle, raffles, tickets, commissions, users, onUpdateUser, onUpdateRaffle, currentUser, onAddNotification }) => {
    const [activeTab, setActiveTab] = useState('stats');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [raffleToEdit, setRaffleToEdit] = useState<Raffle | null>(null);

    const handleEditRaffle = (raffle: Raffle) => {
        setRaffleToEdit(raffle);
        setIsEditModalOpen(true);
    }

    const handleUpdateRaffleAndClose = (updatedRaffle: Raffle) => {
        onUpdateRaffle(updatedRaffle);
        setIsEditModalOpen(false);
        setRaffleToEdit(null);
    }

    const getTabClass = (tabName: string) => {
        return `flex items-center py-2 px-4 text-lg font-semibold transition-colors duration-300 ${
            activeTab === tabName 
            ? 'text-indigo-400 border-b-2 border-indigo-400' 
            : 'text-gray-400 hover:text-white'
        }`;
    }

    return (
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex border-b-2 border-gray-700 mb-6 overflow-x-auto">
                <button onClick={() => setActiveTab('stats')} className={getTabClass('stats')}>
                    Estadísticas
                </button>
                 <button onClick={() => setActiveTab('network')} className={getTabClass('network')}>
                    <ShareIcon className="h-5 w-5 mr-2" />
                    Red de Referidos
                </button>
                <button onClick={() => setActiveTab('leaderboards')} className={getTabClass('leaderboards')}>
                    <TrophyIcon className="h-5 w-5 mr-2" />
                    Leaderboards
                </button>
                <button onClick={() => setActiveTab('users')} className={getTabClass('users')}>
                    Administrar Usuarios
                </button>
                <button onClick={() => setActiveTab('manage')} className={getTabClass('manage')}>
                    Administrar Rifas
                </button>
                <button onClick={() => setActiveTab('create')} className={getTabClass('create')}>
                    Crear Rifa
                </button>
            </div>
            
            {activeTab === 'create' && <CreateRaffleForm onAddRaffle={onAddRaffle} />}
            {activeTab === 'stats' && <StatsDashboard raffles={raffles} tickets={tickets} commissions={commissions} users={users} />}
            {activeTab === 'users' && <UserManagement users={users} onUpdateUser={onUpdateUser} onAddNotification={onAddNotification} />}
            {activeTab === 'network' && <ReferralNetworkStats users={users} tickets={tickets} raffles={raffles}/>}
            {activeTab === 'manage' && <ManageRafflesList raffles={raffles} onEdit={handleEditRaffle} />}
            {activeTab === 'leaderboards' && (
                <LeaderboardsPage
                    users={users}
                    tickets={tickets}
                    raffles={raffles}
                    currentUser={currentUser}
                />
            )}
            
            {isEditModalOpen && raffleToEdit && (
                <EditRaffleModal
                    raffle={raffleToEdit}
                    onClose={() => setIsEditModalOpen(false)}
                    onUpdateRaffle={handleUpdateRaffleAndClose}
                    users={users}
                />
            )}
        </div>
    );
};

export default AdminPanel;
