import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, Play, Home, Table, Info, Bot, Sliders } from 'lucide-react';

import Header from './components/Header';
import RoomAnalyzerStep from './components/RoomAnalyzerStep';
import TableAnalyzerStep from './components/TableAnalyzerStep';
import ParamsConfiguratorStep from './components/ParamsConfiguratorStep';
import MockupResultStep from './components/MockupResultStep';
import AgentChat from './components/AgentChat';
import LandingPage from './components/LandingPage';

import { FlowStep, RoomAnalysis, TableAnalysis, ViewParam, ResolutionParam, AspectRatioParam, HistoryItem, ModelGenderParam, ModelAgeParam } from './types';

// Helper function to convert base64 image data to a standard Blob
async function base64ToBlob(base64Data: string, contentType = 'image/png') {
  const sliceSize = 1024;
  let base64 = base64Data;
  if (base64Data.startsWith('data:')) {
    const parts = base64Data.split(',');
    base64 = parts[1] || parts[0];
    const match = base64Data.match(/^data:([^;]+);/);
    if (match) contentType = match[1];
  }
  
  const byteCharacters = atob(base64);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  return new Blob(byteArrays, { type: contentType });
}

export default function App() {
  const [step, setStep] = useState<FlowStep>('UPLOAD_ROOM');
  const [appMode, setAppMode] = useState<'landing' | 'agent' | 'expert'>('landing');

  // SaaS Integration state
  const [userId, setUserId] = useState<string | null>(null);
  const [toolId, setToolId] = useState<string | null>(null);
  const [userIntegral, setUserIntegral] = useState<number | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [requiredIntegral, setRequiredIntegral] = useState<number | null>(null);

  // Step 1 Room states
  const [roomImage, setRoomImage] = useState<string | null>(null);
  const [roomMimeType, setRoomMimeType] = useState<string | null>(null);
  const [roomAnalysis, setRoomAnalysis] = useState<RoomAnalysis | null>(null);

  // Step 2 Table states
  const [tableImage, setTableImage] = useState<string | null>(null);
  const [tableMimeType, setTableMimeType] = useState<string | null>(null);
  const [tableAnalysis, setTableAnalysis] = useState<TableAnalysis | null>(null);

  // Step 3 Param states
  const [viewParam, setViewParam] = useState<ViewParam>('中近景');
  const [resolution, setResolution] = useState<ResolutionParam>('1k');
  const [aspectRatio, setAspectRatio] = useState<AspectRatioParam>('1:1');
  const [addModel, setAddModel] = useState<boolean>(false);
  const [modelGender, setModelGender] = useState<ModelGenderParam>('女');
  const [modelAgeGroup, setModelAgeGroup] = useState<ModelAgeParam>('青年');
  const [customInstructions, setCustomInstructions] = useState<string>('');

  // Step 4 Generated Result states
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Loaded history state (transient, resets on refresh)
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Initialize SaaS parameters from URL or postMessage (SAAS_INIT)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlUserId = params.get('userId') || params.get('user_id');
    const urlToolId = params.get('toolId') || params.get('tool_id');
    
    if (urlUserId) setUserId(urlUserId);
    if (urlToolId) setToolId(urlToolId);

    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SAAS_INIT') {
        const { userId: msgUserId, toolId: msgToolId } = event.data;
        if (msgUserId) setUserId(msgUserId);
        if (msgToolId) setToolId(msgToolId);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Fetch initial SaaS info (Launch phase)
  useEffect(() => {
    if (!userId || !toolId) return;

    const fetchLaunchData = async () => {
      try {
        const response = await fetch('/api/tool/launch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId, toolId }),
        });
        if (response.ok) {
          const resData = await response.json();
          if (resData.success && resData.data) {
            setUserIntegral(resData.data.user?.integral ?? null);
            setUserName(resData.data.user?.name ?? null);
            setRequiredIntegral(resData.data.tool?.integral ?? null);
          }
        }
      } catch (err) {
        console.error('[launch] Failed to launch tool data:', err);
      }
    };

    fetchLaunchData();
  }, [userId, toolId]);

  // Points verification (Verify phase) - Can be run before any generation or image analysis
  const handleBeforeAnalyze = async (): Promise<boolean> => {
    if (!userId || !toolId) return true; // Non-SaaS mode allows execution
    try {
      const response = await fetch('/api/tool/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, toolId }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        alert(data.message || '您的账户积分不足，无法开始生图流程，请联系管理员充值。');
        return false;
      }
      // Sync fresh points from check
      if (data.data && typeof data.data.currentIntegral === 'number') {
        setUserIntegral(data.data.currentIntegral);
      }
      return true;
    } catch (err: any) {
      console.error('[verify] Points verification failed:', err);
      alert('积分账户状态校验失败，请检查您的网络连接并重试。');
      return false;
    }
  };

  // Generate mockup mockup synthesis
  const handleGenerateMockup = async (overrideParams?: { 
    viewParam: ViewParam; 
    resolution: ResolutionParam; 
    aspectRatio: AspectRatioParam;
    addModel?: boolean;
    modelGender?: ModelGenderParam;
    modelAgeGroup?: ModelAgeParam;
    customInstructions?: string;
  }, preventStepChange = false): Promise<string | null> => {
    if (!roomAnalysis || !tableAnalysis) return null;
    setIsGenerating(true);
    setError(null);
    if (!preventStepChange) {
      setStep('CONFIGURE_PARAMS'); // Stay on parameter page but show rendering loading
    }

    const isOverrideValid = overrideParams && typeof overrideParams === 'object' && 'viewParam' in overrideParams;
    const activeView = isOverrideValid ? overrideParams.viewParam : viewParam;
    const activeRes = isOverrideValid ? overrideParams.resolution : resolution;
    const activeRatio = isOverrideValid ? overrideParams.aspectRatio : aspectRatio;
    const activeAddModel = isOverrideValid ? (overrideParams.addModel ?? false) : addModel;
    const activeModelGender = isOverrideValid ? (overrideParams.modelGender ?? '女') : modelGender;
    const activeModelAgeGroup = isOverrideValid ? (overrideParams.modelAgeGroup ?? '青年') : modelAgeGroup;
    const activeCustomInstructions = (overrideParams && 'customInstructions' in overrideParams) ? overrideParams.customInstructions : customInstructions;

    if (isOverrideValid) {
      setViewParam(overrideParams.viewParam);
      setResolution(overrideParams.resolution);
      setAspectRatio(overrideParams.aspectRatio);
      setAddModel(overrideParams.addModel ?? false);
      if (overrideParams.modelGender) setModelGender(overrideParams.modelGender);
      if (overrideParams.modelAgeGroup) setModelAgeGroup(overrideParams.modelAgeGroup);
      if (overrideParams.customInstructions !== undefined) setCustomInstructions(overrideParams.customInstructions);
    }

    // Double check points before generation
    if (userId && toolId) {
      const isAllowed = await handleBeforeAnalyze();
      if (!isAllowed) {
         setIsGenerating(false);
        return null;
      }
    }

    try {
      const response = await fetch('/api/generate-mockup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomAnalysis,
          tableAnalysis,
          roomImage,
          roomMimeType,
          tableImage,
          tableMimeType,
          viewParam: activeView,
          resolution: activeRes,
          aspectRatio: activeRatio,
          addModel: activeAddModel,
          modelGender: activeAddModel ? activeModelGender : undefined,
          modelAgeGroup: activeAddModel ? activeModelAgeGroup : undefined,
          isVirtual: roomImage ? (roomImage.startsWith('http') || roomImage === 'virtual_custom_style') : false,
          customInstructions: activeCustomInstructions,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || '合成效果图失败');
      }

      const data = await response.json();
      let finalImageUrl = data.image;

      // Deduct points (Consume phase)
      if (userId && toolId) {
        try {
          const consumeRes = await fetch('/api/tool/consume', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, toolId }),
          });
          if (consumeRes.ok) {
            const consumeData = await consumeRes.json();
            if (consumeData.success && consumeData.data) {
              setUserIntegral(consumeData.data.currentIntegral);
            }
          }
        } catch (consumeErr) {
          console.error('[consume] Point consumption failed:', consumeErr);
        }

        // Upload results to SaaS (Direct-token + PUT + Commit)
        try {
          console.log('[upload] Starting image upload pipeline...');
          const resultBlob = await base64ToBlob(data.image);
          const fileName = `result_${Date.now()}.png`;
          const fileSize = resultBlob.size;
          const mimeType = 'image/png';

          // 1) Direct upload token
          const tokenRes = await fetch('/api/upload/direct-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              toolId,
              source: 'result',
              fileName,
              mimeType,
              fileSize
            })
          });
          
          if (tokenRes.ok) {
            const tokenData = await tokenRes.json();
            if (tokenData.success) {
              // 2) PUT upload
              const uploadRes = await fetch(tokenData.uploadUrl, {
                method: tokenData.method || 'PUT',
                headers: {
                  ...tokenData.headers,
                  'Content-Type': mimeType
                },
                body: resultBlob
              });

              if (uploadRes.ok) {
                // 3) Commit image record
                const commitRes = await fetch('/api/upload/commit', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    userId,
                    toolId,
                    source: 'result',
                    objectKey: tokenData.objectKey,
                    fileSize
                  })
                });

                if (commitRes.ok) {
                  const commitData = await commitRes.json();
                  if (commitData.success && commitData.savedToRecords && commitData.url) {
                    finalImageUrl = commitData.url;
                    console.log('[upload] Image uploaded and committed successfully:', finalImageUrl);
                  }
                }
              }
            }
          }
        } catch (uploadErr) {
          console.error('[upload] Upload pipeline failed, using local fallback:', uploadErr);
        }
      }

      setGeneratedImage(finalImageUrl);

      // Add to history
      const newHistoryItem: HistoryItem = {
        id: Date.now().toString(),
        image: finalImageUrl,
        viewParam: activeView,
        resolution: activeRes,
        aspectRatio: activeRatio,
        addModel: activeAddModel,
        modelGender: activeAddModel ? activeModelGender : undefined,
        modelAgeGroup: activeAddModel ? activeModelAgeGroup : undefined,
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      };

      setHistory(prev => {
        const updated = [newHistoryItem, ...prev].slice(0, 6); // Save last 6 items
        return updated;
      });

      if (!preventStepChange) {
        setStep('GENERATED_RESULT');
      }
      return finalImageUrl;
    } catch (err: any) {
      console.error(err);
      setError(err.message || '大理石餐桌摆放图生成失败，请确认您的网络连接或稍后重试。');
      setIsGenerating(false);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyHistoryParams = (item: HistoryItem, autoRegenerate = false) => {
    if (autoRegenerate) {
      handleGenerateMockup({
        viewParam: item.viewParam,
        resolution: item.resolution,
        aspectRatio: item.aspectRatio,
        addModel: item.addModel,
        modelGender: item.modelGender,
        modelAgeGroup: item.modelAgeGroup,
      });
    } else {
      setViewParam(item.viewParam);
      setResolution(item.resolution);
      setAspectRatio(item.aspectRatio);
      setAddModel(item.addModel);
      if (item.modelGender) setModelGender(item.modelGender);
      if (item.modelAgeGroup) setModelAgeGroup(item.modelAgeGroup);
      setStep('CONFIGURE_PARAMS');
    }
  };

  const handleClearHistory = () => {
    if (window.confirm("确定要清除您所有的历史生成记录吗？")) {
      setHistory([]);
    }
  };

  const handleResetAll = () => {
    setRoomImage(null);
    setRoomMimeType(null);
    setRoomAnalysis(null);
    setTableImage(null);
    setTableMimeType(null);
    setTableAnalysis(null);
    setGeneratedImage(null);
    setStep('UPLOAD_ROOM');
  };

  return (
    <div className="h-screen bg-[#fdfcfb] flex flex-col selection:bg-gold-500 selection:text-white overflow-hidden" id="app-root">
      {/* Premium Header with Step Indicators */}
      <Header currentStep={step} appMode={appMode} setAppMode={setAppMode} userId={userId} userName={userName} userIntegral={userIntegral} />

      {/* Main Container */}
      <main className="flex-1 max-w-screen-2xl w-full mx-auto px-6 py-4 overflow-y-auto custom-scrollbar flex flex-col items-stretch">
        <AnimatePresence mode="wait">
          {appMode === 'landing' ? (
            <motion.div
              key="landing-mode"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              className="flex-1 flex flex-col"
            >
              <LandingPage
                onSelectMode={(mode) => setAppMode(mode)}
                userIntegral={userIntegral}
              />
            </motion.div>
          ) : appMode === 'agent' ? (
            <motion.div
              key="agent-mode"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              className="flex-1 min-h-0 flex flex-col"
            >
              <AgentChat
                roomImage={roomImage}
                setRoomImage={setRoomImage}
                roomMimeType={roomMimeType}
                setRoomMimeType={setRoomMimeType}
                roomAnalysis={roomAnalysis}
                setRoomAnalysis={setRoomAnalysis}
                tableImage={tableImage}
                setTableImage={setTableImage}
                tableMimeType={tableMimeType}
                setTableMimeType={setTableMimeType}
                tableAnalysis={tableAnalysis}
                setTableAnalysis={setTableAnalysis}
                viewParam={viewParam}
                setViewParam={setViewParam}
                resolution={resolution}
                setResolution={setResolution}
                aspectRatio={aspectRatio}
                setAspectRatio={setAspectRatio}
                addModel={addModel}
                setAddModel={setAddModel}
                modelGender={modelGender}
                setModelGender={setModelGender}
                modelAgeGroup={modelAgeGroup}
                setModelAgeGroup={setModelAgeGroup}
                generatedImage={generatedImage}
                setGeneratedImage={setGeneratedImage}
                isGenerating={isGenerating}
                setIsGenerating={setIsGenerating}
                onBeforeAnalyze={handleBeforeAnalyze}
                onGenerateMockup={(params) => handleGenerateMockup(params, true)}
                onResetAll={handleResetAll}
                userId={userId}
                userIntegral={userIntegral}
                requiredIntegral={requiredIntegral}
                customInstructions={customInstructions}
                setCustomInstructions={setCustomInstructions}
              />
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col">
              <AnimatePresence mode="wait">
                {step === 'UPLOAD_ROOM' && (
                  <motion.div
                    key="room-step"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-12"
                  >
                    <RoomAnalyzerStep
                      image={roomImage}
                      setImage={setRoomImage}
                      mimeType={roomMimeType}
                      setMimeType={setRoomMimeType}
                      analysis={roomAnalysis}
                      setAnalysis={setRoomAnalysis}
                      onNext={() => setStep('UPLOAD_TABLE')}
                      onBeforeAnalyze={handleBeforeAnalyze}
                    />
                  </motion.div>
                )}

                {step === 'UPLOAD_TABLE' && (
                  <motion.div
                    key="table-step"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-12"
                  >
                    <TableAnalyzerStep
                      image={tableImage}
                      setImage={setTableImage}
                      mimeType={tableMimeType}
                      setMimeType={setTableMimeType}
                      analysis={tableAnalysis}
                      setAnalysis={setTableAnalysis}
                      onNext={() => setStep('CONFIGURE_PARAMS')}
                      onPrev={() => setStep('UPLOAD_ROOM')}
                      onBeforeAnalyze={handleBeforeAnalyze}
                    />
                  </motion.div>
                )}

                {step === 'CONFIGURE_PARAMS' && (
                  <motion.div
                    key="params-step"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ParamsConfiguratorStep
                      roomImage={roomImage!}
                      tableImage={tableImage!}
                      roomAnalysis={roomAnalysis!}
                      tableAnalysis={tableAnalysis!}
                      viewParam={viewParam}
                      setViewParam={setViewParam}
                      resolution={resolution}
                      setResolution={setResolution}
                      aspectRatio={aspectRatio}
                      setAspectRatio={setAspectRatio}
                      addModel={addModel}
                      setAddModel={setAddModel}
                      modelGender={modelGender}
                      setModelGender={setModelGender}
                      modelAgeGroup={modelAgeGroup}
                      setModelAgeGroup={setModelAgeGroup}
                      onSubmit={handleGenerateMockup}
                      onPrev={() => setStep('UPLOAD_TABLE')}
                      isGenerating={isGenerating}
                    />

                    {error && (
                      <div className="max-w-2xl mx-auto mt-6 p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-sm space-y-2">
                        <p className="font-semibold">试摆图渲染失败：</p>
                        <p className="text-xs text-rose-700">{error}</p>
                      </div>
                    )}
                  </motion.div>
                )}

                {step === 'GENERATED_RESULT' && (
                  <motion.div
                    key="result-step"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.4 }}
                  >
                    <MockupResultStep
                      generatedImage={generatedImage!}
                      roomAnalysis={roomAnalysis!}
                      tableAnalysis={tableAnalysis!}
                      viewParam={viewParam}
                      resolution={resolution}
                      aspectRatio={aspectRatio}
                      onAdjustParams={() => setStep('CONFIGURE_PARAMS')}
                      onResetAll={handleResetAll}
                      history={history}
                      onApplyHistoryParams={handleApplyHistoryParams}
                      onClearHistory={handleClearHistory}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* Minimal Footer */}
      <footer className="py-2 px-6 text-center text-[10px] text-gray-400 bg-white border-t border-[#f0eee6]" id="footer-container">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-4 font-mono">
          <p>© 2026 大理石餐桌智能试摆图生成器</p>
          <p className="flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5 text-gold-600 animate-pulse" /> Gemini AI Powered
          </p>
        </div>
      </footer>
    </div>
  );
}
