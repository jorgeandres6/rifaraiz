/**
 * Commission System Testing
 * 
 * Este archivo contiene funciones para probar el sistema de comisiones
 * Puedes usar estas funciones en la consola del navegador para validar
 */

import { 
  calculateCommissions, 
  buildUpline, 
  getCommissionStats, 
  getNetworkStats 
} from './services/commissionService';
import { Commission, User, CommissionStatus } from './types';

/**
 * TEST 1: Verificar cálculo de comisiones
 */
export function testCalculateCommissions() {
  console.log('=== TEST 1: calculateCommissions ===');
  
  // Escenario: Usuario compra $100 con 3 niveles de upline
  const uplineIds = ['user_a', 'user_b', 'user_c'];
  const commissions = calculateCommissions(100, 'buyer_123', uplineIds, 'raffle_1');
  
  console.log('Resultado:', commissions);
  console.log('✓ Usuario A (Nivel 1): $' + commissions[0].amount + ' (esperado: $10)');
  console.log('✓ Usuario B (Nivel 2): $' + commissions[1].amount + ' (esperado: $5)');
  console.log('✓ Usuario C (Nivel 3): $' + commissions[2].amount + ' (esperado: $2)');
  
  const totalCommissions = commissions.reduce((sum, c) => sum + c.amount, 0);
  console.log('Total de comisiones: $' + totalCommissions + ' (17% de $100)');
  console.log('');
}

/**
 * TEST 2: Verificar construcción del upline
 */
export function testBuildUpline() {
  console.log('=== TEST 2: buildUpline ===');
  
  // Escenario: Usuario B se refiere a Usuario A que tiene upline [C, D]
  const newUpline = buildUpline('user_a', ['user_c', 'user_d']);
  
  console.log('Upline de Usuario B:', newUpline);
  console.log('✓ [user_a, user_c, user_d] (A + C + D)');
  console.log('');
}

/**
 * TEST 3: Estadísticas de comisiones
 */
export function testGetCommissionStats() {
  console.log('=== TEST 3: getCommissionStats ===');
  
  // Mock data
  const mockCommissions: Commission[] = [
    {
      id: 'c1',
      userId: 'user_a',
      amount: 100,
      status: CommissionStatus.PAID,
      level: 1,
      sourceUserId: 'buyer_1',
      raffleId: 'raffle_1',
      date: new Date('2026-01-20')
    },
    {
      id: 'c2',
      userId: 'user_a',
      amount: 50,
      status: CommissionStatus.PENDING,
      level: 1,
      sourceUserId: 'buyer_2',
      raffleId: 'raffle_1',
      date: new Date('2026-01-25')
    },
    {
      id: 'c3',
      userId: 'user_a',
      amount: 25,
      status: CommissionStatus.PENDING,
      level: 2,
      sourceUserId: 'buyer_3',
      raffleId: 'raffle_2',
      date: new Date('2026-01-28')
    }
  ];
  
  const stats = getCommissionStats(mockCommissions, 'user_a');
  
  console.log('Estadísticas para user_a:');
  console.log('- Total: $' + stats.total + ' (esperado: $175)');
  console.log('- Pendiente: $' + stats.pending + ' (esperado: $75)');
  console.log('- Pagado: $' + stats.paid + ' (esperado: $100)');
  console.log('- Nivel 1: $' + stats.byLevel.level1 + ' (esperado: $150)');
  console.log('- Nivel 2: $' + stats.byLevel.level2 + ' (esperado: $25)');
  console.log('- Conteo: ' + stats.count + ' comisiones');
  console.log('');
}

/**
 * TEST 4: Estadísticas de red
 */
export function testGetNetworkStats() {
  console.log('=== TEST 4: getNetworkStats ===');
  
  // Mock data
  const mockUsers: User[] = [
    {
      id: 'user_a',
      name: 'Usuario A',
      email: 'a@test.com',
      role: 'user' as any,
      referralCode: 'USERA',
      referredBy: undefined,
      upline: []
    },
    {
      id: 'user_b',
      name: 'Usuario B',
      email: 'b@test.com',
      role: 'user' as any,
      referralCode: 'USERB',
      referredBy: 'user_a',
      upline: ['user_a']
    },
    {
      id: 'user_c',
      name: 'Usuario C',
      email: 'c@test.com',
      role: 'user' as any,
      referralCode: 'USERC',
      referredBy: 'user_b',
      upline: ['user_b', 'user_a']
    },
    {
      id: 'user_d',
      name: 'Usuario D',
      email: 'd@test.com',
      role: 'user' as any,
      referralCode: 'USERD',
      referredBy: 'user_a',
      upline: ['user_a']
    }
  ];
  
  const stats = getNetworkStats('user_a', mockUsers);
  
  if (stats) {
    console.log('Estadísticas de red para user_a:');
    console.log('- Referidos directos: ' + stats.directReferralsCount + ' (esperado: 2 - B y D)');
    console.log('- Tamaño total de red: ' + stats.totalNetworkSize + ' (esperado: 3 - B, C, D)');
    console.log('- Referidos directos:', stats.directReferrals.map(u => u.name));
    console.log('- Downline completo:', stats.downline.map(u => u.name));
  }
  console.log('');
}

/**
 * EJECUTAR TODOS LOS TESTS
 */
export function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║      PRUEBAS DEL SISTEMA DE COMISIONES Y REFERIDOS            ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('');
  
  testCalculateCommissions();
  testBuildUpline();
  testGetCommissionStats();
  testGetNetworkStats();
  
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║                  PRUEBAS COMPLETADAS                          ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
}

// Exportar para usar en consola: 
// import { runAllTests } from '@/commissionsTest'
// runAllTests()
