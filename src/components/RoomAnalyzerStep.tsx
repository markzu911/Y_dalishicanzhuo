import { useState, useEffect } from 'react';
import { Home, Compass, Eye, Sparkles, RefreshCw, Layers, LayoutGrid, Upload } from 'lucide-react';
import ImageUploader from './ImageUploader';
import VirtualRoomSelector from './VirtualRoomSelector';
import { RoomAnalysis, VirtualRoom } from '../types';

interface RoomAnalyzerStepProps {
  image: string | null;
  setImage: (img: string | null) => void;
  mimeType: string | null;
  setMimeType: (mime: string | null) => void;
  analysis: RoomAnalysis | null;
  setAnalysis: (res: RoomAnalysis | null) => void;
  onNext: () => void;
  onBeforeAnalyze?: () => Promise<boolean>;
}

export default function RoomAnalyzerStep({
  image,
  setImage,
  mimeType,
  setMimeType,
  analysis,
  setAnalysis,
  onNext,
  onBeforeAnalyze,
}: RoomAnalyzerStepProps) {
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'virtual'>('upload');
  const [selectedVirtualId, setSelectedVirtualId] = useState<string | null>(null);

  // Elegant mock statuses for the interior designer loading experience
  const statuses = [
    '正在加载餐厅空间图像数据...',
    '正在运用 Gemini 3.5 视觉引擎识别装修风格...',
    '正在智能检测已有家具及摆放位置...',
    '正在测算自然采光与整体环境色相色温...',
    '正在规划大理石餐桌的最佳融入区域...'
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
    setSelectedVirtualId(null);
  };

  const handleVirtualSelect = (room: VirtualRoom) => {
    setImage(room.image);
    setMimeType('image/jpeg'); // Unsplash images are usually jpeg
    setAnalysis(room.analysis);
    setSelectedVirtualId(room.id);
    setError(null);
    onNext();
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
      const response = await fetch('/api/analyze-room', {
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
      setError(err.message || '由于连接超时或 API 密钥问题，AI 空间分析失败，请稍后重试。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4" id="room-analyzer-container">
      {/* Step Info */}
      <div className="text-center max-w-xl mx-auto space-y-1">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold bg-gold-100 text-gold-600 border border-gold-200 font-display">
          STAGE 01
        </span>
        <h2 className="text-xl font-semibold font-display tracking-tight text-gray-900">
          上传或选择房间空间
        </h2>
        <p className="text-xs text-gray-500">
          第一步：上传您的真实餐厅照片，或者选择预设的虚拟餐厅样板间进行效果展示。
        </p>
      </div>

      {!image && (
        <div className="flex justify-center mb-2">
          <div className="inline-flex p-1 bg-gray-100 rounded-xl border border-gray-200 shadow-inner">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-bold font-display tracking-wider transition-all ${
                activeTab === 'upload' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              上传我的真实房间
            </button>
            <button
              onClick={() => setActiveTab('virtual')}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-bold font-display tracking-wider transition-all ${
                activeTab === 'virtual' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              使用虚拟样板间
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Upload and Preview Column */}
        <div className="lg:col-span-6">
          {!image ? (
            activeTab === 'upload' ? (
              <ImageUploader
                onUpload={handleUpload}
                label="点击或拖拽上传餐厅照片"
                description="建议展示较完整的地面与摆放区域。"
                icon={<Home className="w-10 h-10 text-gray-300 group-hover:text-gold-500 transition-colors duration-300" />}
                className="h-[400px] lg:h-[480px]"
              />
            ) : (
              <div className="p-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50/30">
                <VirtualRoomSelector 
                  selectedId={selectedVirtualId}
                  onSelect={handleVirtualSelect}
                />
              </div>
            )
          ) : (
            image.startsWith('http') ? (
              <div className="relative rounded-2xl overflow-hidden border border-gold-200 bg-gradient-to-tr from-amber-50 to-gold-50/50 flex flex-col items-center justify-center p-8 text-center h-[400px] lg:h-[480px] shadow-inner" id="room-preview-card">
                <div className="p-4 bg-gold-500/10 rounded-full text-gold-600 mb-4 border border-gold-200/50">
                  <Home className="w-10 h-10 animate-pulse" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">已载入推荐场景</h3>
                <p className="text-sm text-gold-700 font-medium mt-1">
                  {analysis?.style.split('（')[0] || '预设样板间空间'}
                </p>
                <p className="text-xs text-gray-400 mt-4 max-w-xs leading-relaxed">
                  您选用了预设智能空间模型进行渲染。我们将根据该空间的几何参数、贴图材质与光源布置为您高精呈现试摆效果。
                </p>
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-6 opacity-0 hover:opacity-100 transition-opacity duration-300">
                  <button
                    onClick={() => {
                      setImage(null);
                      setAnalysis(null);
                      setSelectedVirtualId(null);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/90 hover:bg-white border border-gray-200 text-xs font-medium text-gray-700 transition-all duration-200 shadow-md"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    重新选择/上传空间图
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-[#e5e2da] bg-gray-50 group shadow-md" id="room-preview-card">
                <img
                  src={image}
                  alt="Uploaded Room Environment"
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
                        正在深度解析空间风格与环境光影...
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
                      setSelectedVirtualId(null);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/90 hover:bg-white border border-gray-200 text-xs font-medium text-gray-700 transition-all duration-200 shadow-md"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    重新选择/上传空间图
                  </button>
                </div>
              </div>
            )
          )}

          {/* Action Trigger */}
          {image && !analysis && !loading && (
            <button
              onClick={startAnalysis}
              className="w-full flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl bg-gradient-to-r from-gold-500 to-amber-600 text-white font-semibold font-display tracking-wider hover:brightness-110 active:brightness-95 transition-all duration-300 shadow-lg shadow-gold-500/10"
            >
              <Compass className="w-5 h-5 animate-pulse" />
              开始智能分析空间布局
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

        {/* Room Analysis Results Column */}
        <div className="lg:col-span-6">
          {analysis ? (
            <div className="h-[400px] lg:h-[480px]" id="analysis-results-card">
              <div className="p-6 rounded-2xl border border-[#e5e2da] bg-white shadow-sm h-full flex flex-col">
                <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                    <Eye className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 tracking-wide font-display">
                      AI 空间诊断报告已生成
                    </h3>
                    <p className="text-[10px] text-gray-400 font-mono tracking-wider">
                      SPACE DIAGNOSTIC REPORT READY
                    </p>
                  </div>
                </div>

                {/* Grid of details */}
                <div className="space-y-3 overflow-y-auto pr-1.5 flex-1 custom-scrollbar mt-4">
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs text-gold-600 font-semibold font-display">
                      <Sparkles className="w-3.5 h-3.5" />
                      装修风格 / Visual Style
                    </div>
                    <p className="text-sm text-gray-800 leading-relaxed pl-5">
                      {analysis.style}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 font-semibold font-display">
                      <Layers className="w-3.5 h-3.5" />
                      已有家具及布局 / Layout
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed pl-5">
                      {analysis.furniture}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 font-semibold font-display">
                      <Compass className="w-3.5 h-3.5" />
                      光线、色调与空间 / Atmosphere
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed pl-5">
                      {analysis.spaceAndLight}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold font-display">
                      <Home className="w-3.5 h-3.5" />
                      最佳摆放位置推荐 / Placement Recommendation
                    </div>
                    <p className="text-sm text-gray-800 leading-relaxed pl-5">
                      {analysis.suggestedLocation}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl border border-[#e5e2da] bg-gray-50/50 text-center flex flex-col items-center justify-center h-[400px] lg:h-[480px] text-gray-400">
              <Compass className="w-12 h-12 text-gray-200 mb-4 animate-spin-slow" />
              <p className="text-sm font-semibold text-gray-500 font-display">
                等待上传并分析餐厅空间
              </p>
              <p className="text-xs text-gray-400 mt-2 max-w-xs leading-relaxed">
                上传您的房间照片并点击“智能分析”，AI 空间引擎将在此输出深度风格、色调、光源与位置建议，以便后续精细合成。
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Centered Next Step button below the cards */}
      {analysis && (
        <div className="flex justify-center mt-6 animate-in fade-in duration-300">
          <button
            onClick={onNext}
            className="w-full max-w-md flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold tracking-wider font-display transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 shadow-lg shadow-emerald-600/10"
          >
            已确认空间环境，进入下一步：上传餐桌
          </button>
        </div>
      )}
    </div>
  );
}
