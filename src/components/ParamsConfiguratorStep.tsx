import { useState, useEffect } from 'react';
import { Sliders, Camera, Minimize, Maximize, Landmark, Sparkles, HelpCircle, Check, ArrowLeft, User, Users } from 'lucide-react';
import { RoomAnalysis, TableAnalysis, ViewParam, ResolutionParam, AspectRatioParam, ModelGenderParam, ModelAgeParam } from '../types';

interface ParamsConfiguratorStepProps {
  roomImage: string;
  tableImage: string;
  roomAnalysis: RoomAnalysis;
  tableAnalysis: TableAnalysis;
  viewParam: ViewParam;
  setViewParam: (val: ViewParam) => void;
  resolution: ResolutionParam;
  setResolution: (val: ResolutionParam) => void;
  aspectRatio: AspectRatioParam;
  setAspectRatio: (val: AspectRatioParam) => void;
  addModel: boolean;
  setAddModel: (val: boolean) => void;
  modelGender: ModelGenderParam;
  setModelGender: (val: ModelGenderParam) => void;
  modelAgeGroup: ModelAgeParam;
  setModelAgeGroup: (val: ModelAgeParam) => void;
  onSubmit: () => void;
  onPrev: () => void;
  isGenerating: boolean;
}

export default function ParamsConfiguratorStep({
  roomImage,
  tableImage,
  roomAnalysis,
  tableAnalysis,
  viewParam,
  setViewParam,
  resolution,
  setResolution,
  aspectRatio,
  setAspectRatio,
  addModel,
  setAddModel,
  modelGender,
  setModelGender,
  modelAgeGroup,
  setModelAgeGroup,
  onSubmit,
  onPrev,
  isGenerating,
}: ParamsConfiguratorStepProps) {
  const [loadingStatus, setLoadingStatus] = useState('');

  // Luxury high-end AI photorealistic composition statuses
  const renderingStatuses = [
    '正在校准房间透视与地平面网格 (Calibrating perspective grids)...',
    '正在计算房间主光源位置与阴影衰减 (Computing environment lightings)...',
    '正在融合大理石表面的环境折射与漫反射 (Solving PBR material shaders)...',
    '正在计算餐桌底座与地面的接触阴影 (Generating contact ambient occlusion)...',
    '正在利用超分辨率重建算法拼图 (Enhancing canvas details)...',
    '效果图最后微调润色中，即将呈现场景 (Final touch polishing)...'
  ];

  useEffect(() => {
    if (!isGenerating) return;
    let index = 0;
    setLoadingStatus(renderingStatuses[0]);
    const interval = setInterval(() => {
      index = (index + 1) % renderingStatuses.length;
      setLoadingStatus(renderingStatuses[index]);
    }, 3000);

    return () => clearInterval(interval);
  }, [isGenerating]);

  // View perspectives definitions
  const views: { id: ViewParam; name: string; desc: string; icon: any }[] = [
    { id: '远景', name: '45°俯视全局远景 (Wide Shot)', desc: '从45°优雅俯视视角展示餐桌椅融入客餐厅空间的全景，凸显大理石台面纹理、空间采光与软装格调。', icon: Landmark },
    { id: '中近景', name: '45°斜角立体中景 (Medium Shot)', desc: '45°黄金仰俯斜角，完美展示大理石桌面高光反射、配套桌椅细节与温馨用餐场景。', icon: Camera },
    { id: '近景', name: '奢雅高光俯视特写 (Close Up)', desc: '高空俯视对角线视角。聚焦高光大理石奢石石纹与镜面反射，搭配优雅暖色皮革餐椅，以及托盘红酒、金色干枝等杂志级精致陈设。', icon: Minimize },
  ];

  // Resolutions definitions
  const resolutions: { id: ResolutionParam; name: string; desc: string }[] = [
    { id: '1k', name: '1K 标清 (1024px)', desc: '生成速度极快，适合快速浏览摆放格局' },
    { id: '2k', name: '2K 高清 (2048px)', desc: '细节分明，质感细腻，适合方案演示与汇报' },
    { id: '4k', name: '4K 超清 (4096px)', desc: '超高质地纹路，印刷级奢石脉络，极致写实' },
  ];

  // Aspect ratio definitions with visual boxes
  const aspectRatios: { id: AspectRatioParam; label: string; desc: string; boxClass: string }[] = [
    { id: '1:1', label: '1:1', desc: '社交画册 / 正方形', boxClass: 'w-8 h-8' },
    { id: '3:4', label: '3:4', desc: '竖图画册 / 艺术小报', boxClass: 'w-6 h-8' },
    { id: '4:3', label: '4:3', desc: '传统画幅 / 电脑演示', boxClass: 'w-8 h-6' },
    { id: '9:16', label: '9:16', desc: '手机全面屏 / 移动展示', boxClass: 'w-4 h-8' },
    { id: '16:9', label: '16:9', desc: '宽屏全景 / 现代电视', boxClass: 'w-8 h-4.5' },
  ];

  return (
    <div className={isGenerating ? "min-h-[65vh] flex flex-col items-center justify-center w-full py-8" : "space-y-4"} id="params-configurator-container">
      {isGenerating ? (
        /* Mega Elegant Rendering Loading Screen */
        <div className="max-w-2xl mx-auto p-8 rounded-3xl border border-[#e5e2da] bg-white shadow-2xl text-center space-y-6" id="render-loading-screen">
          <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
            {/* Spinning orbit rings */}
            <div className="absolute inset-0 rounded-full border border-gold-500/20 animate-pulse" />
            <div className="absolute inset-2 rounded-full border-2 border-t-gold-500 border-r-transparent border-b-gold-500 border-l-transparent animate-spin" />
            <div className="absolute inset-4 rounded-full border border-dashed border-gray-200 animate-spin-reverse" />
            <Sparkles className="w-6 h-6 text-gold-500 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h3 className="font-display font-semibold text-lg text-gray-900">AI 智能光影追踪融合中</h3>
            <p className="text-[10px] text-gold-600 font-mono tracking-wider animate-pulse uppercase px-4">
              {loadingStatus}
            </p>
          </div>

          <div className="w-full bg-gray-100 rounded-full h-1 overflow-hidden">
            <div className="bg-gradient-to-r from-gold-500 to-amber-500 h-1 rounded-full animate-progress w-full" />
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-left text-xs text-gray-500 leading-relaxed max-w-lg mx-auto space-y-1">
            <span className="font-bold text-gray-600">渲染说明：</span>
            <p>由于我们正在为您合成超写实 3D 光追图像，对大理石花纹进行漫射、法线、反光计算，需要稍长运算时间。请勿刷新此页面，精彩即将为您呈现！</p>
          </div>
        </div>
      ) : (
        /* Normal Parameters Settings Screen */
        <>
          {/* Step Info */}
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gold-100 text-gold-600 border border-gold-200 font-display">
              STAGE 03
            </span>
            <h2 className="text-2xl font-semibold font-display tracking-tight text-gray-900">
              配置渲染摆放参数
            </h2>
            <p className="text-sm text-gray-600">
              第三步：自由定制您的试摆视角、输出分辨率及照片尺寸。高级 3D 渲染引擎将运用这些物理参数无缝合成完美的作品。
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left Column: Input Summaries Preview */}
            <div className="lg:col-span-4 space-y-4">
              <div className="p-4 rounded-2xl border border-[#e5e2da] bg-white shadow-sm space-y-3">
                <h3 className="text-xs font-bold font-mono tracking-widest text-gray-400 uppercase">
                  合成素材摘要
                </h3>

                {/* Room card */}
                <div className="flex gap-3 items-center p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                  <img
                    src={roomImage}
                    alt="Room environment"
                    className="w-12 h-12 object-cover rounded-lg"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-800">目标房间风格</p>
                    <p className="text-[11px] text-gray-500 truncate mt-0.5">{roomAnalysis.style}</p>
                  </div>
                </div>

                {/* Table card */}
                <div className="flex gap-3 items-center p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                  <img
                    src={tableImage}
                    alt="Marble table"
                    className="w-12 h-12 object-cover rounded-lg"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-800">选用餐桌款式</p>
                    <p className="text-[11px] text-gray-500 truncate mt-0.5">{tableAnalysis.shape} / {tableAnalysis.vibe}</p>
                  </div>
                </div>
              </div>

              {/* Composition Note info */}
              <div className="p-4 rounded-xl bg-gold-50 border border-gold-100 text-xs text-gray-500 leading-relaxed space-y-2">
                <div className="flex items-center gap-1.5 text-gold-600 font-semibold font-display">
                  <Sparkles className="w-3.5 h-3.5" />
                  AI 物理材质与光影追踪技术
                </div>
                <p>
                  通过提取您上传的空间环境（包括采光角度、暖冷色调、遮挡关系）以及餐桌的（3D轮廓、大理石法线反射贴图），高级图像引擎将对其重构并还原完美的高级阴影，杜绝“悬浮感”与“假拼贴”。
                </p>
              </div>
            </div>

            {/* Right Column: Configuration Selectors */}
            <div className="lg:col-span-8 space-y-6">
              {/* Perspective selection */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2 font-display">
                  <Camera className="w-4.5 h-4.5 text-gold-600" />
                  1. 视角选择 / Perspective View
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {views.map((v) => {
                    const Icon = v.icon;
                    const isSelected = viewParam === v.id;
                    return (
                      <button
                        key={v.id}
                        onClick={() => setViewParam(v.id)}
                        className={`text-left p-4 rounded-xl border transition-all duration-300 ${
                          isSelected
                            ? 'border-gold-500 bg-gold-50 text-gray-900 ring-1 ring-gold-500/20 shadow-sm'
                            : 'border-gray-200 bg-white text-gray-500 hover:border-gray-400 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className={`p-2 rounded-lg ${isSelected ? 'bg-gold-500 text-white' : 'bg-gray-100'}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-gold-600" />}
                        </div>
                        <h4 className="text-xs font-bold font-display">{v.name}</h4>
                        <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">{v.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Resolution selection */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2 font-display">
                  <Sliders className="w-4.5 h-4.5 text-gold-600" />
                  2. 清晰度设置 / Resolution
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {resolutions.map((r) => {
                    const isSelected = resolution === r.id;
                    return (
                      <button
                        key={r.id}
                        onClick={() => setResolution(r.id)}
                        className={`text-left p-4 rounded-xl border transition-all duration-300 ${
                          isSelected
                            ? 'border-gold-500 bg-gold-50 text-gray-900 ring-1 ring-gold-500/20 shadow-sm'
                            : 'border-gray-200 bg-white text-gray-500 hover:border-gray-400 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                            isSelected ? 'bg-gold-500 text-white' : 'bg-gray-100 text-gray-400'
                          }`}>
                            {r.id.toUpperCase()}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-gold-600" />}
                        </div>
                        <h4 className="text-xs font-bold font-display">{r.name}</h4>
                        <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">{r.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Aspect ratio selection with boxes */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2 font-display">
                  <Sparkles className="w-4.5 h-4.5 text-gold-600" />
                  3. 图片尺寸 / Aspect Ratio
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {aspectRatios.map((ar) => {
                    const isSelected = aspectRatio === ar.id;
                    return (
                      <button
                        key={ar.id}
                        onClick={() => setAspectRatio(ar.id)}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-300 text-center ${
                          isSelected
                            ? 'border-gold-500 bg-gold-50 text-gray-900 ring-1 ring-gold-500/20 shadow-sm'
                            : 'border-gray-200 bg-white text-gray-500 hover:border-gray-400 hover:shadow-sm'
                        }`}
                      >
                        {/* Visual Ratio Box */}
                        <div className="h-10 flex items-center justify-center mb-3">
                          <div className={`border-2 rounded transition-colors ${
                            isSelected ? 'border-gold-500 bg-gold-100' : 'border-gray-200 bg-gray-50'
                          } ${ar.boxClass}`} />
                        </div>
                        <span className="text-xs font-bold font-mono leading-none">{ar.label}</span>
                        <span className="text-[8px] text-gray-400 mt-1 truncate max-w-full leading-none">{ar.desc.split(" / ")[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Add Human Model selection */}
              <div className="space-y-4 p-5 rounded-2xl border border-[#e5e2da] bg-[#faf9f6]/40" id="human-model-config-panel">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2 font-display">
                    <User className="w-4.5 h-4.5 text-gold-600" />
                    4. 模特配置 / Human Model Option
                  </h3>
                  <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-[#e5e2da] self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setAddModel(false)}
                      className={`px-3 py-1 text-xs rounded font-medium transition-all ${
                        !addModel
                          ? 'bg-gray-900 text-white shadow-sm'
                          : 'text-gray-500 hover:text-gray-800'
                      }`}
                      id="btn-no-model"
                    >
                      不添加模特
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddModel(true)}
                      className={`px-3 py-1 text-xs rounded font-medium transition-all flex items-center gap-1 ${
                        addModel
                          ? 'bg-gold-500 text-white shadow-sm'
                          : 'text-gray-500 hover:text-gray-800'
                      }`}
                      id="btn-add-model"
                    >
                      <Sparkles className="w-3 h-3" />
                      添加人物模特
                    </button>
                  </div>
                </div>

                {addModel && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-dashed border-[#e5e2da]" id="model-sub-options">
                    {/* Gender select */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">模特性别 / Model Gender</label>
                      <div className="grid grid-cols-2 gap-2">
                        {(['女', '男'] as ModelGenderParam[]).map((gender) => {
                          const isSelected = modelGender === gender;
                          return (
                            <button
                              key={gender}
                              type="button"
                              onClick={() => setModelGender(gender)}
                              className={`py-2 px-4 rounded-xl border text-xs font-semibold transition-all ${
                                isSelected
                                  ? 'border-gold-500 bg-gold-50 text-gray-900 ring-1 ring-gold-500/20 shadow-sm'
                                  : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:shadow-sm'
                              }`}
                              id={`gender-opt-${gender}`}
                            >
                              {gender === '女' ? '👩 女性模特 (Female)' : '👨 男性模特 (Male)'}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Age group select */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">模特年龄段 / Model Age Group</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['青年', '中年', '老年'] as ModelAgeParam[]).map((age) => {
                          const isSelected = modelAgeGroup === age;
                          return (
                            <button
                              key={age}
                              type="button"
                              onClick={() => setModelAgeGroup(age)}
                              className={`py-2 px-1 rounded-xl border text-xs font-semibold text-center transition-all ${
                                isSelected
                                  ? 'border-gold-500 bg-gold-50 text-gray-900 ring-1 ring-gold-500/20 shadow-sm'
                                  : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:shadow-sm'
                              }`}
                              id={`age-opt-${age}`}
                            >
                              {age}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Back / Create Action buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  onClick={onPrev}
                  className="flex-1 px-4 py-4 rounded-xl border border-[#e5e2da] hover:bg-gray-50 text-xs text-gray-500 font-semibold tracking-wider font-display transition-colors flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  返回上一步
                </button>
                <button
                  onClick={() => onSubmit()}
                  className="flex-[2.5] flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-gold-500 via-amber-500 to-yellow-500 hover:brightness-110 active:brightness-95 text-white font-bold tracking-widest font-display transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 shadow-lg shadow-gold-500/20"
                >
                  <Sparkles className="w-5 h-5" />
                  立即生成摆放效果图 (AI RENDER)
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
