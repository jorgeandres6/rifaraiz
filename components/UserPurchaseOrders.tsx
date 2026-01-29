import React, { useState, useMemo } from 'react';
import { PurchaseOrder, Raffle, PurchaseOrderStatus } from '../types';
import { DocumentTextIcon, CheckCircleIcon, ExclamationTriangleIcon, ClockIcon } from './icons';

interface UserPurchaseOrdersProps {
  purchaseOrders: PurchaseOrder[];
  raffles: Raffle[];
  userId: string;
}

const UserPurchaseOrders: React.FC<UserPurchaseOrdersProps> = ({
  purchaseOrders,
  raffles,
  userId,
}) => {
  const [filterStatus, setFilterStatus] = useState<PurchaseOrderStatus | 'ALL'>('ALL');

  const userOrders = useMemo(
    () => {
      const filtered = purchaseOrders.filter(order => order.userId === userId);
      console.log('🔍 UserPurchaseOrders - Conteo:', {
        totalPurchaseOrders: purchaseOrders.length,
        userId,
        userOrdersCount: filtered.length,
        userOrders: filtered,
      });
      return filtered;
    },
    [purchaseOrders, userId]
  );

  const filteredOrders = useMemo(
    () => filterStatus === 'ALL' 
      ? userOrders 
      : userOrders.filter(order => order.status === filterStatus),
    [userOrders, filterStatus]
  );

  const statusCounts = useMemo(() => {
    return {
      ALL: userOrders.length,
      PENDING: userOrders.filter(o => o.status === 'PENDING').length,
      PAID: userOrders.filter(o => o.status === 'PAID').length,
      VERIFIED: userOrders.filter(o => o.status === 'VERIFIED').length,
      REJECTED: userOrders.filter(o => o.status === 'REJECTED').length,
      CANCELLED: userOrders.filter(o => o.status === 'CANCELLED').length,
    };
  }, [userOrders]);

  const getRaffleName = (raffleId: string) => {
    return raffles.find(r => r.id === raffleId)?.title || 'Rifa desconocida';
  };

  const getStatusBadgeColor = (status: PurchaseOrderStatus) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'PAID':
        return 'bg-blue-100 text-blue-800';
      case 'VERIFIED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: PurchaseOrderStatus) => {
    switch (status) {
      case 'PENDING':
        return <ClockIcon className="w-5 h-5" />;
      case 'PAID':
        return <DocumentTextIcon className="w-5 h-5" />;
      case 'VERIFIED':
        return <CheckCircleIcon className="w-5 h-5" />;
      case 'REJECTED':
        return <ExclamationTriangleIcon className="w-5 h-5" />;
      case 'CANCELLED':
        return <ExclamationTriangleIcon className="w-5 h-5" />;
      default:
        return <DocumentTextIcon className="w-5 h-5" />;
    }
  };

  const getStatusLabel = (status: PurchaseOrderStatus) => {
    const labels: Record<PurchaseOrderStatus, string> = {
      PENDING: 'Por Pagar',
      PAID: 'Pagado',
      VERIFIED: 'Verificado',
      REJECTED: 'Rechazado',
      CANCELLED: 'Cancelado',
    };
    return labels[status];
  };

  const getStatusDescription = (order: PurchaseOrder) => {
    switch (order.status) {
      case 'PENDING':
        return 'Esperando recibir tu pago para procesar la orden';
      case 'PAID':
        return 'Pago recibido. Esperando verificación del administrador';
      case 'VERIFIED':
        return `Orden verificada. ${order.quantity} boleto(s) asignado(s) a tu cuenta`;
      case 'REJECTED':
        return `Orden rechazada: ${order.rejectionReason}`;
      case 'CANCELLED':
        return 'Orden cancelada';
      default:
        return 'Estado desconocido';
    }
  };

  if (userOrders.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <DocumentTextIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-bold text-gray-900 mb-2">Sin Órdenes de Compra</h3>
        <p className="text-gray-600">
          Aún no has realizado ninguna compra de boletos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <DocumentTextIcon className="w-6 h-6 text-purple-600" />
        <h3 className="text-lg font-extrabold text-purple-600">
          Mis Órdenes de Compra ({filteredOrders.length} de {userOrders.length})
        </h3>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <button
          onClick={() => setFilterStatus('ALL')}
          className={`px-4 py-2 rounded-full font-semibold text-sm transition ${
            filterStatus === 'ALL'
              ? 'bg-purple-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:border-purple-400'
          }`}
        >
          Todas ({statusCounts.ALL})
        </button>
        <button
          onClick={() => setFilterStatus('PENDING')}
          className={`px-4 py-2 rounded-full font-semibold text-sm transition flex items-center gap-2 ${
            filterStatus === 'PENDING'
              ? 'bg-yellow-400 text-white'
              : 'bg-white text-yellow-700 border border-yellow-300 hover:bg-yellow-50'
          }`}
        >
          <ClockIcon className="w-4 h-4" />
          Por Pagar ({statusCounts.PENDING})
        </button>
        <button
          onClick={() => setFilterStatus('PAID')}
          className={`px-4 py-2 rounded-full font-semibold text-sm transition flex items-center gap-2 ${
            filterStatus === 'PAID'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-blue-700 border border-blue-300 hover:bg-blue-50'
          }`}
        >
          <DocumentTextIcon className="w-4 h-4" />
          Pagado ({statusCounts.PAID})
        </button>
        <button
          onClick={() => setFilterStatus('VERIFIED')}
          className={`px-4 py-2 rounded-full font-semibold text-sm transition flex items-center gap-2 ${
            filterStatus === 'VERIFIED'
              ? 'bg-green-600 text-white'
              : 'bg-white text-green-700 border border-green-300 hover:bg-green-50'
          }`}
        >
          <CheckCircleIcon className="w-4 h-4" />
          Verificado ({statusCounts.VERIFIED})
        </button>
        <button
          onClick={() => setFilterStatus('REJECTED')}
          className={`px-4 py-2 rounded-full font-semibold text-sm transition flex items-center gap-2 ${
            filterStatus === 'REJECTED'
              ? 'bg-red-600 text-white'
              : 'bg-white text-red-700 border border-red-300 hover:bg-red-50'
          }`}
        >
          <ExclamationTriangleIcon className="w-4 h-4" />
          Rechazado ({statusCounts.REJECTED})
        </button>
        <button
          onClick={() => setFilterStatus('CANCELLED')}
          className={`px-4 py-2 rounded-full font-semibold text-sm transition flex items-center gap-2 ${
            filterStatus === 'CANCELLED'
              ? 'bg-gray-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          <ExclamationTriangleIcon className="w-4 h-4" />
          Cancelado ({statusCounts.CANCELLED})
        </button>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <DocumentTextIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">Sin Órdenes</h3>
          <p className="text-gray-600">
            No hay órdenes con el estado seleccionado.
          </p>
        </div>
      ) : (
        filteredOrders.map(order => (
        <div
          key={order.id}
          className={`bg-white rounded-lg border-2 transition p-5 ${
            order.status === 'VERIFIED'
              ? 'border-green-200 bg-green-50'
              : order.status === 'REJECTED'
              ? 'border-red-200 bg-red-50'
              : 'border-gray-200 hover:border-purple-300'
          }`}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h4 className="font-bold text-gray-900">
                  {getRaffleName(order.raffleId)}
                </h4>
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadgeColor(
                    order.status
                  )}`}
                >
                  {getStatusIcon(order.status)}
                  {getStatusLabel(order.status)}
                </span>
              </div>
              <p className="text-sm text-gray-600 font-mono text-indigo-600 font-bold">
                {order.orderCode}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600">
                ${order.totalPrice.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">
                {order.createdAt ? new Date(order.createdAt).toLocaleDateString('es-ES') : 'N/A'}
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="bg-white rounded-lg p-4 mb-4 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Cantidad de Boletos</p>
                <p className="text-lg font-bold text-gray-900">{order.quantity}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Precio Unitario</p>
                <p className="text-lg font-bold text-gray-900">
                  ${(order.totalPrice / order.quantity).toFixed(2)}
                </p>
              </div>
            </div>

            {order.status === 'VERIFIED' && order.ticketIds && order.ticketIds.length > 0 && (
              <div className="border-t pt-3">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-2">
                  IDs de Boletos Asignados
                </p>
                <div className="bg-gray-50 p-3 rounded border border-gray-200 max-h-48 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-2">
                    {order.ticketIds.map((ticketId, idx) => (
                      <div
                        key={idx}
                        className="bg-white p-2 rounded border border-green-200 text-center"
                      >
                        <p className="text-xs font-mono text-green-700 font-bold truncate">
                          {ticketId}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Status Timeline */}
          <div className="space-y-2 mb-4">
            <p className="text-sm text-gray-700 font-semibold">Estado:</p>
            <p className="text-gray-700">
              {getStatusDescription(order)}
            </p>

            {/* Timeline */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    order.createdAt ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
                <div>
                  <p className="text-xs font-semibold text-gray-600">Orden Creada</p>
                  <p className="text-sm text-gray-700">
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    }) : 'N/A'}
                  </p>
                </div>
              </div>

              {order.paidAt && (
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <div>
                    <p className="text-xs font-semibold text-gray-600">Pago Recibido</p>
                    <p className="text-sm text-gray-700">
                      {order.paidAt ? new Date(order.paidAt).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      }) : 'N/A'}
                    </p>
                  </div>
                </div>
              )}

              {order.verifiedAt && (
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-600" />
                  <div>
                    <p className="text-xs font-semibold text-gray-600">Verificado y Asignado</p>
                    <p className="text-sm text-gray-700">
                      {order.verifiedAt ? new Date(order.verifiedAt).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      }) : 'N/A'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Messages */}
          {order.status === 'PENDING' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                ⏳ Por favor, completa tu pago para procesar esta orden. Después de recibir tu
                pago, un administrador la verificará y te asignará los boletos.
              </p>
            </div>
          )}

          {order.status === 'PAID' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                ✓ Pago recibido exitosamente. Un administrador está revisando tu orden y pronto
                te asignará los boletos.
              </p>
            </div>
          )}

          {order.status === 'REJECTED' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800 font-semibold mb-1">Razón del rechazo:</p>
              <p className="text-sm text-red-700">{order.rejectionReason}</p>
              <p className="text-xs text-red-600 mt-2">
                Por favor, contacta a soporte para más información.
              </p>
            </div>
          )}
        </div>
        ))
      )}
    </div>
  );
};

export default UserPurchaseOrders;
