import React from 'react';
import { Sparkles, Home, Table, Sliders, CheckCircle2, Bot } from 'lucide-react';
import { FlowStep } from '../types';

interface HeaderProps {
  currentStep: FlowStep;
  appMode: 'landing' | 'agent' | 'expert';
  setAppMode: (mode: 'landing' | 'agent' | 'expert') => void;
  userId?: string | null;
  userName?: string | null;
  userIntegral?: number | null;
}

export default function Header({ currentStep, appMode, setAppMode, userId, userName, userIntegral }: HeaderProps) {
  const steps = [
    { id: 'UPLOAD_ROOM', label: '空间分析', subtitle: 'Room Space', icon: Home },
    { id: 'UPLOAD_TABLE', label: '餐桌识别', subtitle: 'Table Shape', icon: Table },
    { id: 'CONFIGURE_PARAMS', label: '效果配置', subtitle: 'Params Config', icon: Sliders },
    { id: 'GENERATED_RESULT', label: 'AI 试摆呈现', subtitle: 'Smart Render', icon: Sparkles },
  ];

  const getStepIndex = (step: FlowStep) => {
    if (step === 'UPLOAD_ROOM') return 0;
    if (step === 'UPLOAD_TABLE') return 1;
    if (step === 'CONFIGURE_PARAMS') return 2;
    return 3;
  };

  const currentIndex = getStepIndex(currentStep);

  return (
    <header className="border-b border-[#e5e2da] bg-white/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4" id="header-container">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        {/* Brand Title and User Points */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between md:justify-start gap-4">
          <div className="flex items-center gap-3 cursor-pointer select-none group" onClick={() => setAppMode('landing')} title="返回欢迎首页">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-gold-500 to-amber-600 shadow-md shadow-gold-500/10 transition-transform duration-300 group-hover:scale-105">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-display font-semibold text-xl tracking-wide bg-gradient-to-r from-gray-900 via-gray-800 to-[#b58c3d] bg-clip-text text-transparent transition-colors">
                大理石餐桌智能试摆图生成器
              </h1>
              <p className="text-xs text-gray-500 font-mono tracking-widest mt-0.5 uppercase">
                Marble Table AI Placement Studio
              </p>
            </div>
          </div>

          {userId && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 shadow-sm shrink-0 sm:ml-4 w-fit">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-amber-700 font-mono">
                {userIntegral !== null ? `${userIntegral} 积分` : '加载中...'}
              </span>
            </div>
          )}
        </div>

        {/* Dual Mode Switcher */}
        {appMode !== 'landing' && (
          <div className="flex items-center gap-1 bg-[#f0eee6]/80 p-1 rounded-2xl border border-[#e5e2da] shadow-inner shrink-0 self-center md:self-auto">
            <button
              onClick={() => setAppMode('agent')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                appMode === 'agent'
                  ? 'bg-gradient-to-r from-gold-500 to-amber-600 text-white shadow-md shadow-gold-500/10'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Bot className="w-4 h-4" />
              智能体模式
            </button>
            <button
              onClick={() => setAppMode('expert')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                appMode === 'expert'
                  ? 'bg-gradient-to-r from-gold-500 to-amber-600 text-white shadow-md shadow-gold-500/10'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Sliders className="w-4 h-4" />
              专家模式
            </button>
          </div>
        )}

        {/* Dynamic Context Right Panel */}
        {appMode !== 'landing' && (
          appMode === 'agent' ? (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold-500/5 border border-gold-500/20 text-gold-700 shadow-sm shrink-0 self-center md:self-auto">
              <div className="w-2.5 h-2.5 rounded-full bg-gold-500 animate-pulse" />
              <span className="text-xs font-bold font-display tracking-wide">AI 智能对话引导已就绪</span>
            </div>
          ) : (
            <nav className="flex items-center gap-1.5 md:gap-4 overflow-x-auto pb-2 md:pb-0 scrollbar-none" id="nav-steps">
              {steps.map((step, idx) => {
                const Icon = step.icon;
                const isCompleted = idx < currentIndex;
                const isActive = idx === currentIndex;
                
                return (
                  <React.Fragment key={step.id}>
                    <div 
                      className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-all duration-300 shrink-0 ${
                        isActive 
                          ? 'bg-gold-500/10 border border-gold-500/30 text-gold-600' 
                          : isCompleted 
                            ? 'text-emerald-600' 
                            : 'text-gray-400'
                      }`}
                    >
                      <div className={`p-1.5 rounded-md ${
                        isActive 
                          ? 'bg-gold-500 text-white' 
                          : isCompleted 
                            ? 'bg-emerald-50 text-emerald-600' 
                            : 'bg-gray-100 text-gray-400'
                      }`}>
                        {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-medium leading-none font-display">{step.label}</p>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5 leading-none">{step.subtitle}</p>
                      </div>
                    </div>
                    {idx < steps.length - 1 && (
                      <div className={`h-[1px] w-4 md:w-8 shrink-0 ${
                        idx < currentIndex ? 'bg-emerald-200' : 'bg-gray-200'
                      }`} />
                    )}
                  </React.Fragment>
                );
              })}
            </nav>
          )
        )}
      </div>
    </header>
  );
}
