import React, { useState } from 'react';
import { MailIcon, LockClosedIcon, UserCircleIcon, PhoneIcon, MapPinIcon } from './icons';

interface SignupFormProps {
    onSignup: (name: string, email: string, pass: string, phone: string, city: string, referralCode?: string, country?: string) => Promise<{ success: boolean; message?: string }>;
    toggleView: () => void;
    initialReferral?: string;
}

const SignupForm: React.FC<SignupFormProps> = ({ onSignup, toggleView, initialReferral }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [city, setCity] = useState('');
    const [referralCode, setReferralCode] = useState(initialReferral || '');
    const [country, setCountry] = useState('');

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Prefill referral if provided via deeplink
    React.useEffect(() => {
        if (initialReferral) setReferralCode(initialReferral);
    }, [initialReferral]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        setLoading(true);
        try {
            const result = await onSignup(name, email, password, phone, city, referralCode, country);
            if (!result.success) {
                setError(result.message || 'No se pudo crear la cuenta.');
            }
        } catch (err) {
            setError('Error al crear la cuenta. Por favor intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="name-signup" className="block text-sm font-medium text-gray-300">Nombre Completo</label>
                <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <UserCircleIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input type="text" id="name-signup" value={name} onChange={(e) => setName(e.target.value)} required className="block w-full bg-gray-900 border border-gray-600 rounded-md p-3 pl-10 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Juan Pérez" />
                </div>
            </div>
            <div>
                <label htmlFor="email-signup" className="block text-sm font-medium text-gray-300">Correo Electrónico</label>
                <div className="mt-1 relative">
                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MailIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input type="email" id="email-signup" value={email} onChange={(e) => setEmail(e.target.value)} required className="block w-full bg-gray-900 border border-gray-600 rounded-md p-3 pl-10 focus:ring-indigo-500 focus:border-indigo-500" placeholder="tu@email.com" />
                </div>
            </div>
            <div>
                <label htmlFor="password-signup" className="block text-sm font-medium text-gray-300">Contraseña</label>
                 <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <LockClosedIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input type="password" id="password-signup" value={password} onChange={(e) => setPassword(e.target.value)} required className="block w-full bg-gray-900 border border-gray-600 rounded-md p-3 pl-10 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Mínimo 6 caracteres" />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <label htmlFor="phone-signup" className="block text-sm font-medium text-gray-300">Teléfono</label>
                  <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <PhoneIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input type="tel" id="phone-signup" value={phone} onChange={(e) => setPhone(e.target.value)} required className="block w-full bg-gray-900 border border-gray-600 rounded-md p-3 pl-10 focus:ring-indigo-500 focus:border-indigo-500" placeholder="+573001234567" />
                  </div>
              </div>
              <div>
                  <label htmlFor="city-signup" className="block text-sm font-medium text-gray-300">Ciudad</label>
                  <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <MapPinIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input type="text" id="city-signup" value={city} onChange={(e) => setCity(e.target.value)} required className="block w-full bg-gray-900 border border-gray-600 rounded-md p-3 pl-10 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Quito" />
                  </div>
              </div>
            </div>

            <div>
                <label htmlFor="country-signup" className="block text-sm font-medium text-gray-300">País</label>
                <input type="text" id="country-signup" value={country} onChange={(e) => setCountry(e.target.value)} className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md p-3 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Ecuador" />
            </div>

            <div>
                <label htmlFor="referral-signup" className="block text-sm font-medium text-gray-300">Código de Referido (Opcional)</label>
                <input type="text" id="referral-signup" value={referralCode} onChange={(e) => setReferralCode(e.target.value)} className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md p-3 focus:ring-indigo-500 focus:border-indigo-500" placeholder="CÓDIGO123" />
            </div>
            
            {error && <p className="text-sm text-red-400">{error}</p>}

            <button type="submit" disabled={loading} className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${loading ? 'bg-indigo-500 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-800`}>
                {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </button>

            <p className="text-sm text-center text-gray-400">
                ¿Ya tienes una cuenta?{' '}
                <button type="button" onClick={toggleView} className="font-medium text-indigo-400 hover:text-indigo-300">
                    Inicia sesión
                </button>
            </p>
        </form>
    );
};

export default SignupForm;