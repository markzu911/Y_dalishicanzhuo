import { useState } from 'react';
import { Download, ExternalLink, RefreshCw, Layers, Sparkles, Check, Home, Table, History, Eye, X, Trash2 } from 'lucide-react';
import { RoomAnalysis, TableAnalysis, ViewParam, ResolutionParam, AspectRatioParam, HistoryItem } from '../types';

interface MockupResultStepProps {
  generatedImage: string;
  roomAnalysis: RoomAnalysis;
  tableAnalysis: TableAnalysis;
  viewParam: ViewParam;
  resolution: ResolutionParam;
  aspectRatio: AspectRatioParam;
  onAdjustParams: () => void;
  onResetAll: () => void;
  history: HistoryItem[];
  onApplyHistoryParams: (item: HistoryItem, autoRegenerate?: boolean) => void;
  onClearHistory: () => void;
}

export default function MockupResultStep({
  generatedImage,
  roomAnalysis,
  tableAnalysis,
  viewParam,
  resolution,
  aspectRatio,
  onAdjustParams,
  onResetAll,
  history,
  onApplyHistoryParams,
  onClearHistory,
}: MockupResultStepProps) {
  const [activePreviewItem, setActivePreviewItem] = useState<HistoryItem | null>(null);

  // Function to download the image file from base64 safely
  const handleDownload = () => {
    try {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = `大理石餐桌智能摆放效果图_${aspectRatio.replace(':', 'x')}_${resolution}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Failed to download:", err);
      // Fallback: open in new tab
      window.open(generatedImage, '_blank');
    }
  };

  const handleOpenNewTab = () => {
    const newTab = window.open();
    if (newTab) {
      newTab.document.write(`<img src="${generatedImage}" style="max-width:100%; max-height:100%; display:block; margin:auto;" />`);
      newTab.document.title = "大理石餐桌智能试摆大图";
    }
  };

  return (
    <div className="space-y-4 animate-fade-in" id="mockup-result-container">
      {/* Step Info */}
      <div className="text-center max-w-xl mx-auto space-y-1">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100 font-display">
          COMPLETED
        </span>
        <h2 className="text-xl font-semibold font-display tracking-tight text-gray-900">
          智能摆放效果图已呈现
        </h2>
        <p className="text-xs text-gray-500">
          极写实 AI 光影追踪引擎已成功将指定的大理石餐桌，无缝融入您的房间空间。
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Main Content: Preview and Actions */}
        <div className="w-full max-w-4xl mx-auto flex flex-col">
          <div className="p-3 rounded-2xl border border-[#e5e2da] bg-white shadow-sm space-y-4 flex-1 flex flex-col">
            <div className="relative rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center flex-1 min-h-[400px] lg:min-h-[520px]" id="result-image-box">
              <img
                src={generatedImage}
                alt="AI Generated Placement Mockup"
                className="max-w-full max-h-[700px] lg:max-h-[780px] object-contain shadow-xl"
                referrerPolicy="no-referrer"
              />
              
              {/* Badge Overlay */}
              <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-white/90 backdrop-blur border border-gold-500/30 text-[9px] font-bold text-gold-600 tracking-wider font-mono uppercase shadow-sm">
                Rendered by Gemini 3.1
              </div>
            </div>

            {/* Actions Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={handleDownload}
                className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 px-4 py-3 rounded-lg bg-gold-500 hover:bg-gold-600 text-white font-bold text-[10px] font-display tracking-wider transition-colors shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                下载效果图
              </button>
              <button
                onClick={handleOpenNewTab}
                className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 px-4 py-3 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 font-semibold text-[10px] font-display tracking-wider transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                查看高清大图
              </button>
              
              <button
                onClick={onAdjustParams}
                className="col-span-2 sm:col-span-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-[#e5e2da] bg-white hover:bg-gray-50 text-[10px] text-gray-600 font-bold font-display tracking-wider transition-all shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                调整参数
              </button>
              <button
                onClick={onResetAll}
                className="col-span-2 sm:col-span-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gray-900 hover:bg-black text-[10px] text-gold-500 font-bold font-display tracking-wider transition-all shadow-md"
              >
                <Sparkles className="w-3.5 h-3.5 text-gold-500 animate-pulse" />
                换个房间
              </button>
            </div>

            {/* Historical Generations Panel */}
            {history.length > 0 && (
              <div className="border-t border-[#f0eee6] pt-4 animate-fade-in font-sans" id="history-section">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-[10px] font-bold font-mono tracking-widest text-gray-400 uppercase flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-gold-600" />
                    历史生成对比 / GEN HISTORIES ({history.length})
                  </h4>
                  <button
                    onClick={onClearHistory}
                    className="text-[9px] text-gray-400 hover:text-rose-500 font-medium transition-colors flex items-center gap-0.5"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                    清除全部
                  </button>
                </div>
                
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="group relative aspect-square rounded-lg overflow-hidden border border-gray-200/80 bg-gray-50 hover:border-gold-500 hover:shadow-md transition-all cursor-pointer flex flex-col"
                    >
                      <img
                        src={item.image}
                        alt="Historical Thumbnail"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onClick={() => setActivePreviewItem(item)}
                      />
                      
                      {/* Perspective overlay label */}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-[1px] py-0.5 px-1 text-[8px] text-white text-center font-medium truncate">
                        {item.viewParam} ({item.aspectRatio})
                      </div>
                      
                      {/* Actions overlay hover bar */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 pointer-events-none">
                        <span 
                          className="p-1 rounded bg-white text-gray-700 pointer-events-auto hover:bg-gold-500 hover:text-white transition-colors" 
                          title="放大预览" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActivePreviewItem(item);
                          }}
                        >
                          <Eye className="w-3 h-3" />
                        </span>
                        <span 
                          className="p-1 rounded bg-white text-gray-700 pointer-events-auto hover:bg-gold-500 hover:text-white transition-colors" 
                          title="应用此视角参数" 
                          onClick={(e) => {
                            e.stopPropagation();
                            onApplyHistoryParams(item, false);
                          }}
                        >
                          <RefreshCw className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* History Lightbox Modal - Simplified to show only image */}
      {activePreviewItem && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in cursor-zoom-out"
          onClick={() => setActivePreviewItem(null)}
        >
          <div className="relative max-w-5xl w-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setActivePreviewItem(null)}
              className="absolute -top-12 right-0 md:-right-12 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all z-10"
            >
              <X className="w-6 h-6" />
            </button>
            
            <img
              src={activePreviewItem.image}
              alt="Historical Generation Preview"
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl animate-scale-in"
            />
            
            {/* Quick Action Floating Bar */}
            <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex gap-3">
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = activePreviewItem.image;
                  link.download = `大理石餐桌试摆_${activePreviewItem.timestamp}.png`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="flex items-center gap-2 px-6 py-2.5 bg-white rounded-full text-gray-900 text-xs font-bold shadow-xl hover:bg-gray-100 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                下载图片
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
