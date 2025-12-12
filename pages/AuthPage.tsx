import React, { useState } from 'react';
import LoginForm from '../components/LoginForm';
import SignupForm from '../components/SignupForm';

interface AuthPageProps {
    onLogin: (email: string, pass: string) => { success: boolean; message?: string };
    onSignup: (name: string, email: string, pass: string, phone: string, city: string, referralCode?: string) => { success: boolean; message?: string };
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin, onSignup }) => {
    const [isLoginView, setIsLoginView] = useState(true);

    const toggleView = () => setIsLoginView(!isLoginView);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <img src="src/img/logoRR.png" alt="RifaRaiz Logo" className="mx-auto h-auto w-full max-w-xs" />
                    <p className="text-gray-400 mt-6">
                        {isLoginView ? 'Inicia sesión para continuar' : 'Crea una cuenta para empezar'}
                    </p>
                </div>

                <div className="bg-gray-800 rounded-lg shadow-xl p-8">
                    {isLoginView ? (
                        <LoginForm onLogin={onLogin} toggleView={toggleView} />
                    ) : (
                        <SignupForm onSignup={onSignup} toggleView={toggleView} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuthPage;