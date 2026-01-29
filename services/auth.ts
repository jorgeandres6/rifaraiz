import { auth, db } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as firebaseSignOut, updateProfile, onAuthStateChanged, User as FirebaseUser, sendEmailVerification, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName?: string | null;
  emailVerified?: boolean;
}

export function sanitizeEmail(email: string) {
  if (!email) return '';
  return encodeURIComponent(email.toLowerCase());
}

// Listen to the Firestore user document in real-time and return an unsubscribe function
// The `identifier` can be either a sanitized id, a raw email, or a uid (for backward compatibility)
export function listenToUser(identifier: string, cb: (data: any | null) => void) {
  let id = identifier || '';
  if (id.includes('@')) {
    id = sanitizeEmail(id);
  }
  const docRef = doc(db, 'users', id);
  const unsub = onSnapshot(docRef, (snap) => {
    if (!snap.exists()) return cb(null);
    cb(snap.data());
  }, (err) => {
    console.error('listenToUser error', err);
    cb(null);
  });
  return unsub;
}

export async function signupWithEmail({ name, email, password, phone, city, referralCode, country }: { name: string; email: string; password: string; phone?: string; city?: string; referralCode?: string; country?: string }) {
  const userCred = await createUserWithEmailAndPassword(auth, email, password);
  const fbUser = userCred.user;

  // set display name
  await updateProfile(fbUser, { displayName: name });

  // send verification email
  try {
    await sendEmailVerification(fbUser);
  } catch (err) {
    // ignore for now, we'll return message
    console.warn('Failed sending verification email', err);
  }

  // build a referral code
  const generatedReferralCode = (name || 'user').toUpperCase().substring(0, 4) + String(Date.now()).slice(-3);

  // Save user metadata in Firestore (document id = sanitized email). Keep firebase uid for reference
  const docId = sanitizeEmail(fbUser.email || fbUser.uid);
  const userDocRef = doc(db, 'users', docId);
  const userData = {
    id: docId,
    firebaseUid: fbUser.uid,
    name,
    email,
    phone: phone || null,
    city: city || null,
    country: country || null,
    referralCode: generatedReferralCode,
    referredBy: null,
    role: 'user',
    createdAt: new Date().toISOString(),
  } as any;

  // Link referral if provided
  if (referralCode) {
    const q = query(collection(db, 'users'), where('referralCode', '==', referralCode));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const refDoc = snap.docs[0];
      userData.referredBy = refDoc.id;
    }
  }

  await setDoc(userDocRef, userData);

  return { success: true, message: 'Verification email sent', user: { uid: fbUser.uid, email: fbUser.email, displayName: fbUser.displayName, emailVerified: fbUser.emailVerified } as AuthUser };
}

export async function loginWithEmail(email: string, password: string) {
  const userCred = await signInWithEmailAndPassword(auth, email, password);
  const fbUser = userCred.user;
  if (!fbUser.emailVerified) {
    // Not verified
    return { success: false, message: 'Por favor verifica tu correo antes de iniciar sesión.' };
  }
  return { success: true, user: { uid: fbUser.uid, email: fbUser.email, displayName: fbUser.displayName, emailVerified: fbUser.emailVerified } as AuthUser };
}

export async function signInWithGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    const res = await signInWithPopup(auth, provider);
    const fbUser = res.user;

    // Ensure user doc exists in Firestore (document id = sanitized email)
    const docId = sanitizeEmail(fbUser.email || fbUser.uid);
    const userDocRef = doc(db, 'users', docId);
    const existing = await getDoc(userDocRef);
    if (!existing.exists()) {
      const generatedReferralCode = (fbUser.displayName || 'user').toUpperCase().substring(0, 4) + String(Date.now()).slice(-3);
      const userData = {
        id: docId,
        firebaseUid: fbUser.uid,
        name: fbUser.displayName || '',
        email: fbUser.email,
        phone: null,
        city: null,
        referralCode: generatedReferralCode,
        referredBy: null,
        role: 'user',
        createdAt: new Date().toISOString(),
      } as any;
      await setDoc(userDocRef, userData);
    }

    return { success: true, user: { uid: fbUser.uid, email: fbUser.email, displayName: fbUser.displayName, emailVerified: fbUser.emailVerified } as AuthUser };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Error iniciando sesión con Google' };
  }
}

export async function resendVerificationEmail() {
  const user = auth.currentUser;
  if (!user) return { success: false, message: 'No user signed in' };
  try {
    await sendEmailVerification(user);
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err?.message || 'No se pudo reenviar el correo de verificación.' };
  }
}

export async function sendPasswordReset(email: string) {
  if (!email) return { success: false, message: 'Ingrese un correo válido.' };
  try {
    await import('firebase/auth').then(({ sendPasswordResetEmail }) => sendPasswordResetEmail(auth, email));
    return { success: true, message: 'Correo de recuperación enviado. Revisa tu bandeja.' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'No se pudo enviar el correo de recuperación.' };
  }
}

export async function logout() {
  await firebaseSignOut(auth);
}

export function onAuthState(cb: (user: AuthUser | null) => void) {
  return onAuthStateChanged(auth, (fbUser: FirebaseUser | null) => {
    if (!fbUser) return cb(null);
    cb({ uid: fbUser.uid, email: fbUser.email, displayName: fbUser.displayName, emailVerified: fbUser.emailVerified });
  });
}

export async function getUserDoc(identifier: string) {
  if (!identifier) return null;
  let id = identifier;
  if (identifier.includes('@')) id = sanitizeEmail(identifier);
  const d = await getDoc(doc(db, 'users', id));
  return d.exists() ? d.data() : null;
}