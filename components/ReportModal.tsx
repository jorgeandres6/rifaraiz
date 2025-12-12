import React, { useState } from 'react';
import { Raffle, Ticket, Commission, User } from '../types';
import { XIcon, ArrowDownTrayIcon } from './icons';

// Declaring the jspdf global variable from the script loaded in index.html
declare const jspdf: any;

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  raffles: Raffle[];
  tickets: Ticket[];
  commissions: Commission[];
  users: User[];
}

interface ReportData {
  totalTickets: number;
  totalRevenue: number;
  totalCommissions: number;
  tickets: Ticket[];
  commissions: Commission[];
  period: { start: string, end: string };
  raffleName: string;
}

const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, raffles, tickets, commissions, users }) => {
  const [raffleFilter, setRaffleFilter] = useState('general');
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [report, setReport] = useState<ReportData | null>(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;
  
  const getUserName = (userId: string) => users.find(u => u.id === userId)?.name || 'N/A';
  const getRaffleName = (raffleId: string) => raffles.find(r => r.id === raffleId)?.title || 'N/A';

  const handleGenerateReport = () => {
    setError('');
    if (!startDate || !endDate) {
      setError('Por favor, selecciona un período de tiempo válido.');
      return;
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Include the whole end day

    if (start > end) {
      setError('La fecha de inicio no puede ser posterior a la fecha de fin.');
      return;
    }

    const filteredTickets = tickets.filter(t => {
      const matchRaffle = raffleFilter === 'general' || t.raffleId === raffleFilter;
      const matchDate = t.purchaseDate >= start && t.purchaseDate <= end;
      return matchRaffle && matchDate;
    });

    const filteredCommissions = commissions.filter(c => {
      const matchRaffle = raffleFilter === 'general' || c.raffleId === raffleFilter;
      const matchDate = c.date >= start && c.date <= end;
      return matchRaffle && matchDate;
    });
    
    const totalRevenue = filteredTickets.reduce((sum, ticket) => {
        const raffle = raffles.find(r => r.id === ticket.raffleId);
        return sum + (raffle?.ticketPrice || 0);
    }, 0);

    const totalCommissions = filteredCommissions.reduce((sum, c) => sum + c.amount, 0);
    const selectedRaffle = raffles.find(r => r.id === raffleFilter);

    setReport({
      totalTickets: filteredTickets.length,
      totalRevenue,
      totalCommissions,
      tickets: filteredTickets,
      commissions: filteredCommissions,
      period: { start: start.toLocaleDateString('es-ES'), end: end.toLocaleDateString('es-ES') },
      raffleName: raffleFilter === 'general' ? 'Todas las Rifas' : selectedRaffle?.title || 'Desconocida'
    });
  };
  
  const handleDownloadPdf = () => {
    if (!report) return;

    const { jsPDF } = jspdf;
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
    let finalY = 0;

    // 1. Header
    doc.setFontSize(18);
    doc.text("Reporte de Actividad - RifaRaiz", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Rifa: ${report.raffleName}`, 14, 30);
    doc.text(`Período: ${report.period.start} - ${report.period.end}`, 14, 36);

    // 2. Summary Stats
    doc.setFontSize(10);
    doc.text(`Boletos Vendidos: ${report.totalTickets}`, 14, 50);
    doc.text(`Ingresos Totales: $${report.totalRevenue.toLocaleString('es-CO')}`, 70, 50);
    doc.text(`Comisiones Generadas: $${report.totalCommissions.toFixed(2)}`, 140, 50);

    // 3. Tickets Table
    if (report.tickets.length > 0) {
        const ticketHead = [['# Boleto', 'Comprador', 'Fecha', 'Rifa']];
        const ticketBody = report.tickets.map(t => [
            t.ticketNumber,
            getUserName(t.originalUserId),
            t.purchaseDate.toLocaleDateString('es-ES'),
            getRaffleName(t.raffleId)
        ]);

        doc.autoTable({
            startY: 60,
            head: ticketHead,
            body: ticketBody,
            headStyles: { fillColor: [74, 85, 104] }, // Tailwind gray-600
            didDrawPage: (data: any) => {
                doc.setFontSize(14);
                doc.text("Detalle de Boletos Vendidos", data.settings.margin.left, 58);
            }
        });
        finalY = (doc as any).lastAutoTable.finalY;
    } else {
        doc.text("No se vendieron boletos en este período.", 14, 65);
        finalY = 65;
    }


    // 4. Commissions Table
    if (report.commissions.length > 0) {
        const commissionHead = [['Beneficiario', 'Monto', 'Nivel', 'Origen (Comprador)', 'Fecha']];
        const commissionBody = report.commissions.map(c => [
            getUserName(c.userId),
            `$${c.amount.toFixed(2)}`,
            c.level.toString(),
            getUserName(c.sourceUserId),
            c.date.toLocaleDateString('es-ES')
        ]);
        
        const startYCommissions = finalY + 15;
        // Check if there's enough space for the new table
        if (startYCommissions > pageHeight - 40) { // 40 is an arbitrary margin
            doc.addPage();
            finalY = 0; // Reset Y position for new page
        }

        doc.autoTable({
            startY: finalY + 15,
            head: commissionHead,
            body: commissionBody,
            headStyles: { fillColor: [74, 85, 104] },
            didDrawPage: (data: any) => {
                doc.setFontSize(14);
                doc.text("Detalle de Comisiones Generadas", data.settings.margin.left, finalY + 13);
            }
        });
    } else {
        doc.text("No se generaron comisiones en este período.", 14, finalY + 15);
    }

    // 5. Save the file
    const filename = `Reporte_RifaRaiz_${report.raffleName.replace(/\s/g, '_')}_${startDate}_a_${endDate}.pdf`;
    doc.save(filename);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl relative transform transition-all max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
            <XIcon className="h-6 w-6" />
          </button>
          <h2 className="text-2xl font-bold text-indigo-400">Generar Reporte</h2>
          <p className="text-gray-400 mt-1">Selecciona los filtros para tu reporte de ventas y comisiones.</p>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label htmlFor="raffleFilter" className="block text-sm font-medium text-gray-300">Rifa</label>
                        <select id="raffleFilter" value={raffleFilter} onChange={(e) => setRaffleFilter(e.target.value)} className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500">
                            <option value="general">General</option>
                            {raffles.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2 md:col-span-2">
                        <div>
                            <label htmlFor="startDate" className="block text-sm font-medium text-gray-300">Desde</label>
                            <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"/>
                        </div>
                        <div>
                            <label htmlFor="endDate" className="block text-sm font-medium text-gray-300">Hasta</label>
                            <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"/>
                        </div>
                    </div>
                </div>
                {error && <p className="text-sm text-red-400 text-center">{error}</p>}
                <button onClick={handleGenerateReport} className="w-full flex items-center justify-center bg-indigo-600 text-white font-bold py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors duration-300">
                    Generar
                </button>
            </div>

            {report && (
                <div className="border-t border-gray-700 mt-6 pt-6 animate-fade-in">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-bold text-white">Reporte para: <span className="text-indigo-400">{report.raffleName}</span></h3>
                            <p className="text-sm text-gray-400">Período: {report.period.start} - {report.period.end}</p>
                        </div>
                        <button onClick={handleDownloadPdf} className="flex items-center bg-gray-600 text-white font-bold py-1.5 px-4 rounded-md hover:bg-gray-500 transition-colors duration-300 text-sm">
                            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                            Descargar PDF
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
                        <div className="bg-gray-700/50 p-4 rounded-lg text-center"><p className="text-sm text-gray-400">Boletos Vendidos</p><p className="text-2xl font-bold text-white">{report.totalTickets}</p></div>
                        <div className="bg-gray-700/50 p-4 rounded-lg text-center"><p className="text-sm text-gray-400">Ingresos Totales</p><p className="text-2xl font-bold text-white">${report.totalRevenue.toLocaleString()}</p></div>
                        <div className="bg-gray-700/50 p-4 rounded-lg text-center"><p className="text-sm text-gray-400">Comisiones Generadas</p><p className="text-2xl font-bold text-white">${report.totalCommissions.toFixed(2)}</p></div>
                    </div>

                    <div>
                        <h4 className="font-semibold text-white mb-2">Detalle de Boletos Vendidos</h4>
                        <div className="overflow-x-auto max-h-60 bg-gray-900/50 rounded-md border border-gray-700">
                           <table className="w-full text-sm text-left text-gray-300">
                                <thead className="text-xs text-gray-400 uppercase bg-gray-700/50 sticky top-0">
                                    <tr>
                                        <th scope="col" className="px-4 py-3"># Boleto</th>
                                        <th scope="col" className="px-4 py-3">Comprador</th>
                                        <th scope="col" className="px-4 py-3">Fecha</th>
                                        <th scope="col" className="px-4 py-3">Rifa</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {report.tickets.length > 0 ? report.tickets.map(ticket => (
                                        <tr key={ticket.id} className="border-b border-gray-700 hover:bg-gray-700/30">
                                            <td className="px-4 py-2 font-mono">{ticket.ticketNumber}</td>
                                            <td className="px-4 py-2">{getUserName(ticket.originalUserId)}</td>
                                            <td className="px-4 py-2">{ticket.purchaseDate.toLocaleDateString()}</td>
                                            <td className="px-4 py-2">{getRaffleName(ticket.raffleId)}</td>
                                        </tr>
                                    )) : <tr><td colSpan={4} className="text-center py-4 text-gray-500">No se vendieron boletos en este período.</td></tr>}
                                </tbody>
                           </table>
                        </div>
                    </div>
                    
                    <div className="mt-6">
                        <h4 className="font-semibold text-white mb-2">Detalle de Comisiones Generadas</h4>
                         <div className="overflow-x-auto max-h-60 bg-gray-900/50 rounded-md border border-gray-700">
                           <table className="w-full text-sm text-left text-gray-300">
                                <thead className="text-xs text-gray-400 uppercase bg-gray-700/50 sticky top-0">
                                    <tr>
                                        <th scope="col" className="px-4 py-3">Beneficiario</th>
                                        <th scope="col" className="px-4 py-3">Monto</th>
                                        <th scope="col" className="px-4 py-3">Nivel</th>
                                        <th scope="col" className="px-4 py-3">Origen (Comprador)</th>
                                        <th scope="col" className="px-4 py-3">Fecha</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {report.commissions.length > 0 ? report.commissions.map(c => (
                                        <tr key={c.id} className="border-b border-gray-700 hover:bg-gray-700/30">
                                            <td className="px-4 py-2">{getUserName(c.userId)}</td>
                                            <td className="px-4 py-2 text-green-400">${c.amount.toFixed(2)}</td>
                                            <td className="px-4 py-2 text-center">{c.level}</td>
                                            <td className="px-4 py-2">{getUserName(c.sourceUserId)}</td>
                                            <td className="px-4 py-2">{c.date.toLocaleDateString()}</td>
                                        </tr>
                                    )) : <tr><td colSpan={5} className="text-center py-4 text-gray-500">No se generaron comisiones en este período.</td></tr>}
                                </tbody>
                           </table>
                        </div>
                    </div>
                </div>
            )}

        </div>
        <div className="p-4 bg-gray-800 border-t border-gray-700 mt-auto">
            <button onClick={onClose} className="w-full px-4 py-2 text-sm font-medium text-white bg-gray-700 rounded-md hover:bg-gray-600 transition-colors">
                Cerrar
            </button>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;