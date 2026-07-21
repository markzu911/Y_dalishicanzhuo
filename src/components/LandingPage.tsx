import { Bot, Sliders, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface LandingPageProps {
  onSelectMode: (mode: 'agent' | 'expert') => void;
  userIntegral: number | null;
}

export default function LandingPage({ onSelectMode, userIntegral }: LandingPageProps) {
  return (
    <div className="flex-1 flex flex-col justify-between py-12 md:py-20 px-4 max-w-5xl mx-auto w-full select-none" id="landing-page-container">


      {/* Main Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-6 mb-12 md:mb-16">
        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl md:text-5xl font-extrabold text-[#1a1c18] tracking-tight leading-tight font-display"
        >
          开启您的 <span className="bg-gradient-to-r from-gold-600 via-amber-700 to-amber-900 bg-clip-text text-transparent">大理石餐桌智能试摆</span> 之旅
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-sm md:text-base text-gray-500 leading-relaxed max-w-2xl mx-auto"
        >
          无论是您希望得到贴心的智能设计助理引导，还是渴望在全功能专业面板上精细调校，我们都为您提供了专属的使用方案。
        </motion.p>
      </div>

      {/* Dual Cards */}
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full mb-12">
        {/* Agent Mode Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white rounded-3xl p-8 border border-[#e5e2da] shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between h-[360px] group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-gold-500/5 to-transparent rounded-bl-full pointer-events-none" />
          
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#faf9f6] border border-[#e5e2da] flex items-center justify-center text-gold-600 group-hover:bg-gold-500 group-hover:text-white transition-all duration-300 shadow-sm">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-gray-800 font-display">智能体模式</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100">
                  推荐新手
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1 font-mono uppercase tracking-wider">AI AGENT MODE</p>
            </div>
            <p className="text-xs md:text-sm text-gray-500 leading-relaxed">
              对话式交互，像和专业设计师聊天一样。AI 将一步步引导您选择背景、餐桌照片，直接在聊天框内返回生成效果。
            </p>
          </div>

          <button
            onClick={() => onSelectMode('agent')}
            className="w-full py-3.5 px-6 rounded-2xl bg-[#5f6350] hover:bg-[#4d5140] text-white text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 shadow-md shadow-[#5f6350]/10 hover:shadow-lg active:scale-[0.98]"
          >
            <Bot className="w-4 h-4" />
            开启智能对话引导
          </button>
        </motion.div>

        {/* Expert Mode Card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white rounded-3xl p-8 border border-[#e5e2da] shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between h-[360px] group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-500/5 to-transparent rounded-bl-full pointer-events-none" />

          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#faf9f6] border border-[#e5e2da] flex items-center justify-center text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition-all duration-300 shadow-sm">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-gray-800 font-display">专家工作台</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 border border-blue-100">
                  高阶微调
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1 font-mono uppercase tracking-wider">EXPERT WORKBENCH</p>
            </div>
            <p className="text-xs md:text-sm text-gray-500 leading-relaxed">
              经典分步流程。提供高可控性的输出设置、画面比例调节，支持高清效果图渲染、多历史版本追溯与一键重新编辑。
            </p>
          </div>

          <button
            onClick={() => onSelectMode('expert')}
            className="w-full py-3.5 px-6 rounded-2xl bg-[#f0f2f5] hover:bg-[#e4e7ec] text-gray-700 text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 border border-gray-200 hover:border-gray-300 active:scale-[0.98]"
          >
            <Sliders className="w-4 h-4" />
            进入工程师工作台
          </button>
        </motion.div>
      </div>

      {/* Footer copyright */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="text-center text-[10px] text-gray-400 font-mono tracking-widest uppercase mt-8 border-t border-[#e5e2da]/40 pt-6"
      >
        © 2026 AI MARBLE PLACEMENT SYSTEM &nbsp;|&nbsp; DESIGN PRECISION: 100% &nbsp;|&nbsp; RENDERING ENGINE: V4.0
      </motion.div>
    </div>
  );
}
