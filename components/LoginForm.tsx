
import React, { useState } from 'react';
import { MailIcon, LockClosedIcon } from './icons';

interface LoginFormProps {
    onLogin: (email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
    onGoogle?: () => Promise<{ success: boolean; message?: string }>;
    toggleView: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, onGoogle, toggleView }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const result = await onLogin(email, password);
            if (!result.success) {
                setError(result.message || 'Credenciales inválidas. Por favor, inténtalo de nuevo.');
            }
        } catch (err) {
            setError('Error al iniciar sesión. Por favor intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogle = async () => {
        if (!onGoogle) return;
        setError('');
        setGoogleLoading(true);
        try {
            const res = await onGoogle();
            if (!res.success) setError(res.message || 'Error al iniciar con Google.');
        } catch (err) {
            setError('Error al iniciar con Google.');
        } finally {
            setGoogleLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
            <div>
                <label htmlFor="email-login" className="block text-sm font-medium text-gray-300">Correo Electrónico</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MailIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input type="email" id="email-login" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="off" className="block w-full bg-gray-900 border border-gray-600 rounded-md p-3 pl-10 focus:ring-indigo-500 focus:border-indigo-500" placeholder="tu@email.com" />
                </div>
            </div>
            <div>
                <label htmlFor="password-login" className="block text-sm font-medium text-gray-300">Contraseña</label>
                 <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <LockClosedIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input type="password" id="password-login" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="off" className="block w-full bg-gray-900 border border-gray-600 rounded-md p-3 pl-10 focus:ring-indigo-500 focus:border-indigo-500" placeholder="••••••••" />
                </div>
            </div>
            
            {error && <p className="text-sm text-red-400">{error}</p>}

            <button type="submit" disabled={loading} className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${loading ? 'bg-indigo-500 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-800`}>
                {loading ? 'Iniciando...' : 'Iniciar Sesión'}
            </button>

            <div className="space-y-3">
                <button type="button" onClick={handleGoogle} disabled={googleLoading} className={`w-full flex items-center justify-center gap-3 py-2 px-4 border border-gray-600 rounded-md text-sm font-medium text-white ${googleLoading ? 'bg-gray-700 cursor-wait' : 'bg-white/6 hover:bg-white/10'}`}>
                    <img src="/src/img/google-icon.svg" alt="Google" className="h-5 w-5" />
                    <span>{googleLoading ? 'Iniciando con Google...' : 'Continuar con Google'}</span>
                </button>

                <p className="text-sm text-center text-gray-400">
                    ¿No tienes una cuenta?{' '}
                    <button type="button" onClick={toggleView} className="font-medium text-indigo-400 hover:text-indigo-300">
                        Regístrate aquí
                    </button>
                </p>
            </div>
        </form>
    );
};

export default LoginForm;
