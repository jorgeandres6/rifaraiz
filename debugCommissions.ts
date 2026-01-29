/**
 * Debug Tool for Commission System
 * Use this in console to verify commissions are being created correctly
 */

import { calculateCommissions } from './services/commissionService';

/**
 * Test commission calculation for all levels
 */
export function debugCommissions() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║         DEBUG: Sistema de Comisiones                      ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');

  // Scenario 1: User with 1-level upline (solo nivel 1)
  console.log('📊 ESCENARIO 1: Usuario con 1 nivel de upline');
  console.log('Upline: [user_a]');
  const commissions1 = calculateCommissions(100, 'buyer', ['user_a'], 'raffle_1');
  console.log('Comisiones creadas:', commissions1.length);
  commissions1.forEach((c, idx) => {
    console.log(`  ${idx + 1}. Usuario: ${c.userId}, Nivel: ${c.level}, Monto: $${c.amount.toFixed(2)}`);
  });
  console.log('✓ Esperado: 1 comisión (Nivel 1: $10.00)');
  console.log('');

  // Scenario 2: User with 2-level upline (niveles 1 y 2)
  console.log('📊 ESCENARIO 2: Usuario con 2 niveles de upline');
  console.log('Upline: [user_b, user_a]');
  const commissions2 = calculateCommissions(100, 'buyer', ['user_b', 'user_a'], 'raffle_1');
  console.log('Comisiones creadas:', commissions2.length);
  commissions2.forEach((c, idx) => {
    console.log(`  ${idx + 1}. Usuario: ${c.userId}, Nivel: ${c.level}, Monto: $${c.amount.toFixed(2)}`);
  });
  console.log('✓ Esperado: 2 comisiones (Nivel 1: $10.00, Nivel 2: $5.00)');
  console.log('');

  // Scenario 3: User with 3-level upline (todos los niveles)
  console.log('📊 ESCENARIO 3: Usuario con 3 niveles de upline');
  console.log('Upline: [user_c, user_b, user_a]');
  const commissions3 = calculateCommissions(100, 'buyer', ['user_c', 'user_b', 'user_a'], 'raffle_1');
  console.log('Comisiones creadas:', commissions3.length);
  commissions3.forEach((c, idx) => {
    console.log(`  ${idx + 1}. Usuario: ${c.userId}, Nivel: ${c.level}, Monto: $${c.amount.toFixed(2)}`);
  });
  console.log('✓ Esperado: 3 comisiones (Nivel 1: $10.00, Nivel 2: $5.00, Nivel 3: $2.00)');
  console.log('');

  // Scenario 4: User with 4-level upline (excede el límite)
  console.log('📊 ESCENARIO 4: Usuario con 4 niveles de upline (más del límite)');
  console.log('Upline: [user_d, user_c, user_b, user_a]');
  const commissions4 = calculateCommissions(100, 'buyer', ['user_d', 'user_c', 'user_b', 'user_a'], 'raffle_1');
  console.log('Comisiones creadas:', commissions4.length);
  commissions4.forEach((c, idx) => {
    console.log(`  ${idx + 1}. Usuario: ${c.userId}, Nivel: ${c.level}, Monto: $${c.amount.toFixed(2)}`);
  });
  console.log('✓ Esperado: 3 comisiones (solo hasta nivel 3)');
  console.log('');

  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║                 PRUEBAS COMPLETADAS                       ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
}

/**
 * Check upline structure of current user
 */
export function debugUserUpline(userId: string, users: any[]) {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║         DEBUG: Estructura de Upline                      ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');

  const user = users.find(u => u.id === userId);
  
  if (!user) {
    console.error('❌ Usuario no encontrado:', userId);
    return;
  }

  console.log('👤 Usuario:', user.name || user.email);
  console.log('📧 Email:', user.email);
  console.log('🔑 ID:', user.id);
  console.log('🎫 Código de Referido:', user.referralCode);
  console.log('');

  if (user.referredBy) {
    console.log('👆 Referido por:', user.referredBy);
    const referrer = users.find(u => u.id === user.referredBy);
    if (referrer) {
      console.log('   Nombre:', referrer.name || referrer.email);
    } else {
      console.warn('   ⚠️ No se encontró el usuario referidor en la lista');
    }
  } else {
    console.log('👆 Referido por: Nadie (usuario raíz)');
  }
  console.log('');

  if (user.upline && user.upline.length > 0) {
    console.log('📊 Upline (cadena de referidos):');
    user.upline.forEach((uplineUserId: string, index: number) => {
      const uplineUser = users.find(u => u.id === uplineUserId);
      const level = index + 1;
      if (uplineUser) {
        console.log(`   Nivel ${level}: ${uplineUser.name || uplineUser.email} (${uplineUser.referralCode})`);
      } else {
        console.warn(`   Nivel ${level}: ${uplineUserId} ⚠️ No encontrado en la lista`);
      }
    });
    console.log('');
    console.log(`✓ Total de niveles en upline: ${user.upline.length}`);
    
    if (user.upline.length < 3) {
      console.log(`ℹ️ Este usuario solo generará comisiones para ${user.upline.length} nivel(es)`);
    } else {
      console.log('✓ Este usuario generará comisiones para los 3 niveles completos');
    }
  } else {
    console.log('📊 Upline: Vacío (no genera comisiones para nadie)');
  }
  console.log('');
  console.log('╚═══════════════════════════════════════════════════════════╝');
}

/**
 * Verify that commissions are being saved correctly
 */
export function debugCommissionsInFirestore(commissions: any[], userId: string) {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║         DEBUG: Comisiones en Firestore                   ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');

  const userCommissions = commissions.filter(c => c.userId === userId);
  
  if (userCommissions.length === 0) {
    console.warn('⚠️ No se encontraron comisiones para el usuario:', userId);
    console.log('');
    console.log('Posibles causas:');
    console.log('1. El usuario no tiene referidos que hayan comprado');
    console.log('2. Las comisiones no se están guardando en Firebase');
    console.log('3. El listener de comisiones no está funcionando');
    return;
  }

  console.log(`✓ Total de comisiones encontradas: ${userCommissions.length}`);
  console.log('');

  // Group by level
  const byLevel = {
    level1: userCommissions.filter(c => c.level === 1),
    level2: userCommissions.filter(c => c.level === 2),
    level3: userCommissions.filter(c => c.level === 3),
  };

  console.log('📊 Comisiones por Nivel:');
  console.log(`   Nivel 1: ${byLevel.level1.length} comisiones - $${byLevel.level1.reduce((sum, c) => sum + c.amount, 0).toFixed(2)}`);
  console.log(`   Nivel 2: ${byLevel.level2.length} comisiones - $${byLevel.level2.reduce((sum, c) => sum + c.amount, 0).toFixed(2)}`);
  console.log(`   Nivel 3: ${byLevel.level3.length} comisiones - $${byLevel.level3.reduce((sum, c) => sum + c.amount, 0).toFixed(2)}`);
  console.log('');

  // Group by status
  const byStatus = {
    pending: userCommissions.filter(c => c.status === 'PENDING'),
    paid: userCommissions.filter(c => c.status === 'PAID'),
  };

  console.log('💰 Comisiones por Estado:');
  console.log(`   PENDING: ${byStatus.pending.length} comisiones - $${byStatus.pending.reduce((sum, c) => sum + c.amount, 0).toFixed(2)}`);
  console.log(`   PAID: ${byStatus.paid.length} comisiones - $${byStatus.paid.reduce((sum, c) => sum + c.amount, 0).toFixed(2)}`);
  console.log('');

  // Show details
  console.log('📋 Detalle de Comisiones:');
  userCommissions.forEach((c, idx) => {
    console.log(`   ${idx + 1}. Nivel ${c.level} | $${c.amount.toFixed(2)} | ${c.status} | De: ${c.sourceUserId}`);
  });
  console.log('');
  console.log('╚═══════════════════════════════════════════════════════════╝');
}

/**
 * Full system check
 */
export function debugFullSystem(currentUser: any, users: any[], commissions: any[]) {
  console.clear();
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  DEBUG COMPLETO: Sistema de Comisiones y Referidos');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  if (!currentUser) {
    console.error('❌ No hay usuario actual. Inicia sesión primero.');
    return;
  }

  // 1. Test calculation logic
  debugCommissions();
  console.log('');
  console.log('─────────────────────────────────────────────────────────────');
  console.log('');

  // 2. Check current user's upline
  debugUserUpline(currentUser.id, users);
  console.log('');
  console.log('─────────────────────────────────────────────────────────────');
  console.log('');

  // 3. Check commissions in Firebase
  debugCommissionsInFirestore(commissions, currentUser.id);
  console.log('');

  console.log('═══════════════════════════════════════════════════════════');
  console.log('  FIN DEL DEBUG');
  console.log('═══════════════════════════════════════════════════════════');
}

// Export for use in console
if (typeof window !== 'undefined') {
  (window as any).debugCommissions = debugCommissions;
  (window as any).debugUserUpline = debugUserUpline;
  (window as any).debugCommissionsInFirestore = debugCommissionsInFirestore;
  (window as any).debugFullSystem = debugFullSystem;
}
