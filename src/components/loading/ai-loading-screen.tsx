import React, { useState, useEffect } from 'react';
import { Sparkles, Brain } from 'lucide-react';
import Logo from '../generics/logo';

const AILoadingScreen = () => {
    const [messageIndex, setMessageIndex] = useState(0);

    const loadingMessages = [
        "L'intelligenza artificiale sta creando il tuo percorso...",
        "Analizzando le tue preferenze...",
        "Selezionando i luoghi più amati...",
        "Aggiungendo un tocco di magia al tuo itinerario...",
        "Quasi tutto pronto..."
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [loadingMessages.length]);

    return (
        <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 z-[9999]">
            {/* Background Glows */}
            <Logo className="absolute top-1/5 " />
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-600/20 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[150px] animate-pulse delay-700"></div>

            <div className="relative flex flex-col items-center max-w-md w-full text-center space-y-12">

                {/* Animated Central Icon Container */}
                <div className="relative group">
                    {/* Rotating Rings */}
                    <div className="absolute inset-0 scale-150 border-2 border-dashed border-purple-500/20 rounded-full animate-[spin_10s_linear_infinite]"></div>
                    <div className="absolute inset-0 scale-[2] border border-slate-800 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>

                    {/* Hexagon/Circle Container */}
                    <div className="relative w-32 h-32 bg-slate-900 border border-slate-700 rounded-3xl flex items-center justify-center shadow-2xl shadow-purple-500/20 animate-bounce-slow">
                        <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/10 to-transparent rounded-3xl"></div>

                        {/* Dynamic Icons */}
                        <div className="relative">
                            <Brain className="w-14 h-14 text-purple-400 animate-pulse" />
                            <div className="absolute -top-2 -right-2 bg-slate-950 p-1.5 rounded-lg border border-slate-700">
                                <Sparkles className="w-4 h-4 text-yellow-400 animate-spin-slow" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Text and Progress */}
                <div className="space-y-6 w-full mt-8">
                    <div className="space-y-2">
                        <h2 className="text-2xl font-extrabold text-white tracking-tight">
                            Stiamo preparando la magia
                        </h2>
                        <div className="h-8">
                            <p
                                key={messageIndex}
                                className="text-slate-400 font-medium text-sm animate-in slide-in-from-bottom-4 duration-500"
                            >
                                {loadingMessages[messageIndex]}
                            </p>
                        </div>
                    </div>

                    {/* Progress Bar Container */}
                    <div className="relative h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                        {/* Animated Progress */}
                        <div
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-600 to-blue-500 rounded-full animate-progress-indeterminate"
                            style={{ width: '40%' }}
                        >
                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                        </div>
                    </div>


                </div>
            </div>

            {/* CSS For Indeterminate Progress & Animations */}
            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes progress-indeterminate {
          0% { left: -40%; width: 40%; }
          50% { left: 40%; width: 60%; }
          100% { left: 100%; width: 40%; }
        }
        .animate-progress-indeterminate {
          animation: progress-indeterminate 2.5s infinite ease-in-out;
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 4s ease-in-out infinite;
        }
      `}} />
        </div>
    );
};

export default AILoadingScreen;