import React, { useState } from 'react';
import LoginForm from '../components/LoginForm';
import SignupForm from '../components/SignupForm';
import logoRR from '../src/img/logoRR.png';

interface AuthPageProps {
    onLogin: (email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
    onSignup: (name: string, email: string, pass: string, phone: string, city: string, referralCode?: string, country?: string) => Promise<{ success: boolean; message?: string }>;
    onGoogle?: () => Promise<{ success: boolean; message?: string }>;
    onPasswordReset?: (email: string) => Promise<{ success: boolean; message?: string }>;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin, onSignup, onGoogle, onPasswordReset }) => {
    const [isLoginView, setIsLoginView] = useState(true);
    const [initialReferral, setInitialReferral] = useState<string | undefined>(undefined);

    const toggleView = () => setIsLoginView(!isLoginView);

    React.useEffect(() => {
        try {
            const params = new URLSearchParams(window.location.search);
            const ref = params.get('ref');
            if (ref) {
                setIsLoginView(false); // show signup directly
                setInitialReferral(ref);
            }
        } catch (e) {
            // ignore (server-side or older browsers)
        }
    }, []);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <img src={logoRR} alt="RifaRaiz Logo" className="mx-auto h-auto w-full max-w-xs" />
                    <p className="text-gray-400 mt-6">
                        {isLoginView ? 'Inicia sesión para continuar' : 'Crea una cuenta para empezar'}
                    </p>
                </div>

                <div className="bg-gray-800 rounded-lg shadow-xl p-8">
                    {isLoginView ? (
                        <LoginForm onLogin={onLogin} onGoogle={onGoogle} toggleView={toggleView} onPasswordReset={onPasswordReset} />
                    ) : (
                        <SignupForm onSignup={onSignup} toggleView={toggleView} initialReferral={initialReferral} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuthPage;