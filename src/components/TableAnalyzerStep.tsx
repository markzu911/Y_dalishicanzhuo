import { useState, useEffect } from 'react';
import { Table, Compass, Eye, Sparkles, RefreshCw, Box } from 'lucide-react';
import ImageUploader from './ImageUploader';
import { TableAnalysis } from '../types';

interface TableAnalyzerStepProps {
  image: string | null;
  setImage: (img: string | null) => void;
  mimeType: string | null;
  setMimeType: (mime: string | null) => void;
  analysis: TableAnalysis | null;
  setAnalysis: (res: TableAnalysis | null) => void;
  onNext: () => void;
  onPrev: () => void;
  onBeforeAnalyze?: () => Promise<boolean>;
}

export default function TableAnalyzerStep({
  image,
  setImage,
  mimeType,
  setMimeType,
  analysis,
  setAnalysis,
  onNext,
  onPrev,
  onBeforeAnalyze,
}: TableAnalyzerStepProps) {
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [error, setError] = useState<string | null>(null);

  // High-end furniture designer loading statuses
  const statuses = [
    '正在加载大理石餐桌高清图片数据...',
    '正在运用 Gemini 3.5 视觉模型进行多维特征识别...',
    '正在提取餐桌主体轮廓形状与尺寸比例...',
    '正在分析大理石纹路走向、抛光面光泽及主基色...',
    '正在评估桌腿与支承结构材质及现代/轻奢调性...'
  ];

  useEffect(() => {
    if (!loading) return;
    let index = 0;
    setLoadingStatus(statuses[0]);
    const interval = setInterval(() => {
      index = (index + 1) % statuses.length;
      setLoadingStatus(statuses[index]);
    }, 2500);

    return () => clearInterval(interval);
  }, [loading]);

  const handleUpload = (base64: string, mime: string) => {
    setImage(base64);
    setMimeType(mime);
    setAnalysis(null);
    setError(null);
  };

  const startAnalysis = async () => {
    if (!image) return;
    
    if (onBeforeAnalyze) {
      const isAllowed = await onBeforeAnalyze();
      if (!isAllowed) return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze-table', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image,
          mimeType,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || '分析失败');
      }

      const data = await response.json();
      setAnalysis(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || '由于连接超时或 API 密钥问题，AI 餐桌识别失败，请稍后重试。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4" id="table-analyzer-container">
      {/* Step Info */}
      <div className="text-center max-w-xl mx-auto space-y-1">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold bg-gold-100 text-gold-600 border border-gold-200 font-display">
          STAGE 02
        </span>
        <h2 className="text-xl font-semibold font-display tracking-tight text-gray-900">
          上传大理石餐桌款式
        </h2>
        <p className="text-xs text-gray-500">
          第二步：上传您想要模拟摆放的大理石餐桌照片。AI 将精确提取它的外形、质地及支撑结构。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Upload and Preview Column */}
        <div className="lg:col-span-6">
          {!image ? (
            <ImageUploader
              onUpload={handleUpload}
              label="点击或拖拽上传大理石餐桌照片"
              description="建议背景干净，清晰露出桌面细节与桌腿底座。"
              icon={<Table className="w-10 h-10 text-gray-300 group-hover:text-gold-500 transition-colors duration-300" />}
              className="h-[400px] lg:h-[480px]"
            />
          ) : (
            <div className="relative rounded-2xl overflow-hidden border border-[#e5e2da] bg-gray-50 group shadow-md" id="table-preview-card">
              <img
                src={image}
                alt="Uploaded Marble Table"
                className="w-full h-[400px] lg:h-[480px] object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                referrerPolicy="no-referrer"
              />

              {/* Scanning Overlay Animation */}
              {loading && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
                  <div className="relative w-20 h-20 mb-6">
                    <div className="absolute inset-0 rounded-full border-4 border-gold-500/20 animate-ping" />
                    <div className="absolute inset-0 rounded-full border-4 border-t-gold-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                    <div className="absolute inset-2 bg-gold-500/10 rounded-full flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-gold-500 animate-pulse" />
                    </div>
                  </div>
                  <div className="space-y-2 max-w-xs">
                    <p className="text-white font-semibold font-display text-lg tracking-wide drop-shadow-md">
                      {loadingStatus}
                    </p>
                    <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-gold-500 animate-progress w-full" />
                    </div>
                    <p className="text-white/70 text-[10px] font-medium tracking-tight">
                      正在精确提取材质纹路与结构特征...
                    </p>
                  </div>
                  
                  {/* Moving scanner line */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="w-full h-1 bg-gold-500/50 blur-[2px] absolute top-0 animate-scanner-down" />
                  </div>
                </div>
              )}

              <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-6 transition-opacity duration-300 ${loading ? 'opacity-100 z-10' : 'opacity-0 group-hover:opacity-100'}`}>
                <button
                  onClick={() => {
                    setImage(null);
                    setAnalysis(null);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/90 hover:bg-white border border-gray-200 text-xs font-medium text-gray-700 transition-all duration-200 shadow-md"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  重新上传餐桌图
                </button>
              </div>
            </div>
          )}

          {/* Action Trigger */}
          {image && !analysis && !loading && (
            <button
              onClick={startAnalysis}
              className="w-full flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl bg-gradient-to-r from-gold-500 to-amber-600 text-white font-semibold font-display tracking-wider hover:brightness-110 active:brightness-95 transition-all duration-300 shadow-lg shadow-gold-500/10"
            >
              <Table className="w-5 h-5 animate-pulse" />
              识别餐桌形状纹路特征
            </button>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-900/30 text-rose-300 text-sm space-y-2">
              <p className="font-semibold">发生错误：</p>
              <p className="text-xs text-rose-400">{error}</p>
              <button
                onClick={startAnalysis}
                className="mt-2 text-xs font-semibold text-gold-500 hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> 重试分析
              </button>
            </div>
          )}
        </div>

        {/* Table Analysis Results Column */}
        <div className="lg:col-span-6">
          {analysis ? (
            <div className="h-[400px] lg:h-[480px]" id="analysis-results-card">
              <div className="p-6 rounded-2xl border border-[#e5e2da] bg-white shadow-sm h-full flex flex-col">
                <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100 flex-shrink-0">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                    <Box className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 tracking-wide font-display">
                      餐桌材质结构画像
                    </h3>
                    <p className="text-[10px] text-gray-400 font-mono tracking-wider">
                      TABLE MATERIAL & STRUCTURE IDENTIFIED
                    </p>
                  </div>
                </div>

                {/* Grid of details - scrollable interior */}
                <div className="space-y-3 overflow-y-auto pr-1.5 flex-1 custom-scrollbar mt-4">
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs text-gold-600 font-semibold font-display">
                      <Sparkles className="w-3.5 h-3.5" />
                      形状轮廓 / Table Shape
                    </div>
                    <p className="text-sm text-gray-800 leading-relaxed pl-5">
                      {analysis.shape}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 font-semibold font-display">
                      <Eye className="w-3.5 h-3.5" />
                      大理石材质与纹路 / Marble Pattern
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed pl-5">
                      {analysis.marbleDetails}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 font-semibold font-display">
                      <Table className="w-3.5 h-3.5" />
                      桌腿与底座承重 / Legs & Base
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed pl-5">
                      {analysis.legsAndBase}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold font-display">
                      <Compass className="w-3.5 h-3.5" />
                      整体格调属性 / Style Vibe
                    </div>
                    <p className="text-sm text-gray-800 leading-relaxed pl-5">
                      {analysis.vibe}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl border border-[#e5e2da] bg-gray-50/50 text-center flex flex-col items-center justify-center h-[400px] lg:h-[480px] text-gray-400">
              <Box className="w-12 h-12 text-gray-200 mb-4" />
              <p className="text-sm font-semibold text-gray-500 font-display">
                等待上传并识别大理石餐桌
              </p>
              <p className="text-xs text-gray-400 mt-2 max-w-xs leading-relaxed">
                请在左侧上传您打算试摆的高清餐桌照片。AI 材质分析器会将它的每一个纹路、底座和反光属性转化为精准的设计语言。
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Centered Navigation Buttons below the cards */}
      <div className="flex justify-center gap-4 mt-6 animate-in fade-in duration-300 w-full max-w-lg mx-auto">
        <button
          onClick={onPrev}
          className="flex-1 px-6 py-3.5 rounded-xl border border-[#e5e2da] bg-white hover:bg-gray-50 text-xs font-semibold tracking-wider font-display transition-colors text-gray-600 shadow-sm"
        >
          返回上一步
        </button>
        {analysis && (
          <button
            onClick={onNext}
            className="flex-[2] flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold tracking-wider font-display transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 shadow-lg shadow-emerald-600/10"
          >
            进入下一步：设置生成参数
          </button>
        )}
      </div>
    </div>
  );
}
