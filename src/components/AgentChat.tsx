import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, Send, Sparkles, Upload, RefreshCw, Download, Check, 
  Landmark, Camera, Minimize, Maximize, User, AlertTriangle, CheckCircle, 
  Box, Eye, Image as ImageIcon, RotateCcw, ShieldAlert, ArrowRight, UserCheck,
  Home
} from 'lucide-react';
import { 
  RoomAnalysis, TableAnalysis, ViewParam, ResolutionParam, AspectRatioParam, 
  ModelGenderParam, ModelAgeParam, VirtualRoom 
} from '../types';
import { virtualRooms } from '../data/virtualRooms';
import ImageUploader from './ImageUploader';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text?: string;
  timestamp: string;
  type?: 'text' | 'room_selection' | 'room_upload' | 'room_result' | 'table_upload' | 'table_result' | 'param_selection' | 'loading' | 'generation_result' | 'error';
  data?: any;
}

interface AgentChatProps {
  roomImage: string | null;
  setRoomImage: (val: string | null) => void;
  roomMimeType: string | null;
  setRoomMimeType: (val: string | null) => void;
  roomAnalysis: RoomAnalysis | null;
  setRoomAnalysis: (val: RoomAnalysis | null) => void;
  
  tableImage: string | null;
  setTableImage: (val: string | null) => void;
  tableMimeType: string | null;
  setTableMimeType: (val: string | null) => void;
  tableAnalysis: TableAnalysis | null;
  setTableAnalysis: (val: TableAnalysis | null) => void;

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

  generatedImage: string | null;
  setGeneratedImage: (val: string | null) => void;
  isGenerating: boolean;
  setIsGenerating: (val: boolean) => void;

  onBeforeAnalyze?: () => Promise<boolean>;
  onGenerateMockup: (overrideParams?: any) => Promise<string | null>;
  onResetAll: () => void;
  
  userId: string | null;
  userIntegral: number | null;
  requiredIntegral: number | null;
  customInstructions: string;
  setCustomInstructions: (val: string) => void;
}

export default function AgentChat({
  roomImage,
  setRoomImage,
  roomMimeType,
  setRoomMimeType,
  roomAnalysis,
  setRoomAnalysis,
  tableImage,
  setTableImage,
  tableMimeType,
  setTableMimeType,
  tableAnalysis,
  setTableAnalysis,
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
  generatedImage,
  setGeneratedImage,
  isGenerating,
  setIsGenerating,
  onBeforeAnalyze,
  onGenerateMockup,
  onResetAll,
  userId,
  userIntegral,
  requiredIntegral,
  customInstructions,
  setCustomInstructions
}: AgentChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [analyzingRoom, setAnalyzingRoom] = useState(false);
  const [analyzingTable, setAnalyzingTable] = useState(false);
  const [activeStepId, setActiveStepId] = useState<'room' | 'table' | 'params' | 'complete'>('room');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Smooth auto-scroll helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, analyzingRoom, analyzingTable, isGenerating]);

  // Seed initial welcome messages or adapt based on current synchronized state
  useEffect(() => {
    // If messages are already initialized, do not reseed
    if (messages.length > 0) return;

    const initialMessages: ChatMessage[] = [];
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Scenario A: Result already exists
    if (generatedImage) {
      initialMessages.push({
        id: 'welcome',
        sender: 'ai',
        text: '您好！检测到您已经成功生成了智能试摆图。您可以在下方直接查看结果、调整参数或换个房间重新体验：',
        timestamp: now
      });
      initialMessages.push({
        id: 'result-card',
        sender: 'ai',
        type: 'generation_result',
        data: { image: generatedImage },
        timestamp: now
      });
      setActiveStepId('complete');
    }
    // Scenario B: Table and Room are both analyzed, but no mockup generated yet
    else if (roomImage && roomAnalysis && tableImage && tableAnalysis) {
      initialMessages.push({
        id: 'welcome',
        sender: 'ai',
        text: '欢迎回来！检测到您已经上传并完成了空间与餐桌的分析。✨\n下面您可以快速配置渲染视角、清晰度及人物模特，然后点击开始渲染摆放效果：',
        timestamp: now
      });
      initialMessages.push({
        id: 'param-selector',
        sender: 'ai',
        type: 'param_selection',
        timestamp: now
      });
      setActiveStepId('params');
    }
    // Scenario C: Only Room is analyzed
    else if (roomImage && roomAnalysis) {
      initialMessages.push({
        id: 'welcome',
        sender: 'ai',
        text: `已为您恢复了空间设置：您选用了风格为 ${roomAnalysis.style.split('（')[0]} 的餐厅背景。🌅\n\n现在，请上传您想要模拟摆放的大理石餐桌照片 📸：`,
        timestamp: now
      });
      initialMessages.push({
        id: 'table-uploader-msg',
        sender: 'ai',
        type: 'table_upload',
        timestamp: now
      });
      setActiveStepId('table');
    }
    // Scenario D: Brand new start
    else {
      initialMessages.push({
        id: 'welcome-1',
        sender: 'ai',
        text: '您好！我是您的 大理石餐桌智能试摆 AI 助手。我可以帮您快速将选定的大理石餐桌，无缝摆放到各种精美客餐厅空间中，并利用 AI 物理追踪算法合成光影逼真、反射质感满分的效果图！✨',
        timestamp: now
      });
      initialMessages.push({
        id: 'welcome-2',
        sender: 'ai',
        text: '首先，我们需要选择一张餐厅空间背景。请直接在下方点击选择一个推荐的高级样板间风格，或者上传您自己的房屋照片：',
        timestamp: now
      });
      initialMessages.push({
        id: 'room-selector',
        sender: 'ai',
        type: 'room_selection',
        timestamp: now
      });
      setActiveStepId('room');
    }

    setMessages(initialMessages);
  }, []);

  // Points verification checking helper
  const verifyPoints = async (): Promise<boolean> => {
    if (onBeforeAnalyze) {
      return await onBeforeAnalyze();
    }
    return true;
  };

  // Add error block in chat
  const appendErrorMsg = (errText: string) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, {
      id: `err-${Date.now()}`,
      sender: 'ai',
      type: 'error',
      text: errText,
      timestamp: now
    }]);
  };

  // Handle template room selection
  const handleRoomSelect = async (room: VirtualRoom) => {
    const isAllowed = await verifyPoints();
    if (!isAllowed) {
      appendErrorMsg('❌ 积分不足，无法执行该操作。请联系管理员获取积分。');
      return;
    }

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Set Parent State
    setRoomImage(room.image);
    setRoomMimeType('image/jpeg');
    setRoomAnalysis(room.analysis);
    
    // Add messages to chat flow
    setMessages(prev => [
      ...prev,
      {
        id: `user-sel-${Date.now()}`,
        sender: 'user',
        text: `我选择使用 “${room.name}” 风格样板间。`,
        timestamp: now
      },
      {
        id: `ai-confirm-${Date.now()}`,
        sender: 'ai',
        text: `好的，已选用 ${room.name} 背景空间！该空间为：${room.analysis.style.split('（')[0]}。🌅\n\n现在，请上传您想试摆的大理石餐桌照片 📸：`,
        timestamp: now
      },
      {
        id: `table-uploader-msg-${Date.now()}`,
        sender: 'ai',
        type: 'table_upload',
        timestamp: now
      }
    ]);
    setActiveStepId('table');
  };

  // Handle choose custom room upload option
  const handleChooseCustomRoom = () => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [
      ...prev,
      {
        id: `user-opt-${Date.now()}`,
        sender: 'user',
        text: '我想上传自己的真实房屋空间照片。',
        timestamp: now
      },
      {
        id: `ai-uploader-${Date.now()}`,
        sender: 'ai',
        type: 'room_upload',
        text: '请在下方上传您的餐厅、客餐厅空余位置实拍照片。建议采光良好，避免摆放其他杂乱桌椅遮挡试摆区域。',
        timestamp: now
      }
    ]);
  };

  // Handle custom room image uploaded
  const handleRoomImageUploaded = async (base64: string, mime: string) => {
    const isAllowed = await verifyPoints();
    if (!isAllowed) {
      appendErrorMsg('❌ 积分不足，无法执行该操作。请联系管理员。');
      return;
    }

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    setRoomImage(base64);
    setRoomMimeType(mime);
    setRoomAnalysis(null);
    setAnalyzingRoom(true);

    // Append upload visual feedback
    setMessages(prev => [
      ...prev,
      {
        id: `user-up-${Date.now()}`,
        sender: 'user',
        text: '[图片] 已上传空间背景图，等待深度解析',
        timestamp: now
      }
    ]);

    try {
      const response = await fetch('/api/analyze-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mimeType: mime }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || '分析失败');
      }

      const data: RoomAnalysis = await response.json();
      setRoomAnalysis(data);

      setMessages(prev => [
        ...prev,
        {
          id: `ai-anal-room-res-${Date.now()}`,
          sender: 'ai',
          type: 'room_result',
          data: { analysis: data },
          timestamp: now
        },
        {
          id: `ai-table-prompt-${Date.now()}`,
          sender: 'ai',
          text: '🎉 空间采光及视准线已锚定完毕！接下来，请上传您需要试摆的大理石餐桌正面照 📸：',
          timestamp: now
        },
        {
          id: `table-uploader-msg-${Date.now()}`,
          sender: 'ai',
          type: 'table_upload',
          timestamp: now
        }
      ]);
      setActiveStepId('table');
    } catch (err: any) {
      console.error(err);
      appendErrorMsg(`❌ 房间分析失败：${err.message || '网络连接超时'}`);
    } finally {
      setAnalyzingRoom(false);
    }
  };

  // Handle table image uploaded
  const handleTableImageUploaded = async (base64: string, mime: string) => {
    const isAllowed = await verifyPoints();
    if (!isAllowed) {
      appendErrorMsg('❌ 积分不足，无法执行该操作。请联系管理员。');
      return;
    }

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    setTableImage(base64);
    setTableMimeType(mime);
    setTableAnalysis(null);
    setAnalyzingTable(true);

    // Append table upload feedback
    setMessages(prev => [
      ...prev,
      {
        id: `user-tup-${Date.now()}`,
        sender: 'user',
        text: '[图片] 已上传餐桌款式图，等待识别',
        timestamp: now
      }
    ]);

    try {
      const response = await fetch('/api/analyze-table', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mimeType: mime }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || '分析失败');
      }

      const data: TableAnalysis = await response.json();
      setTableAnalysis(data);

      setMessages(prev => [
        ...prev,
        {
          id: `ai-anal-table-res-${Date.now()}`,
          sender: 'ai',
          type: 'table_result',
          data: { analysis: data },
          timestamp: now
        },
        {
          id: `ai-param-prompt-${Date.now()}`,
          sender: 'ai',
          text: '👍 餐桌大理石材质和几何外形特征提取成功！\n现在，我们来配置一下渲染参数。确认无误后即可一键生成效果图：',
          timestamp: now
        },
        {
          id: `param-selector-${Date.now()}`,
          sender: 'ai',
          type: 'param_selection',
          timestamp: now
        }
      ]);
      setActiveStepId('params');
    } catch (err: any) {
      console.error(err);
      appendErrorMsg(`❌ 餐桌智能识别失败：${err.message || '网络连接超时'}`);
    } finally {
      setAnalyzingTable(false);
    }
  };

  // Trigger actual AI composite generation
  const handleStartGeneration = async (overrideParams?: {
    viewParam?: ViewParam;
    resolution?: ResolutionParam;
    aspectRatio?: AspectRatioParam;
    addModel?: boolean;
    modelGender?: ModelGenderParam;
    modelAgeGroup?: ModelAgeParam;
    customInstructions?: string;
  }) => {
    const isAllowed = await verifyPoints();
    if (!isAllowed) {
      appendErrorMsg('❌ 积分不足，无法执行该操作。请补充积分额度。');
      return;
    }

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Resolve parameters to use
    const activeView = overrideParams?.viewParam ?? viewParam;
    const activeRatio = overrideParams?.aspectRatio ?? aspectRatio;
    const activeRes = overrideParams?.resolution ?? resolution;
    const activeAddModel = overrideParams?.addModel ?? addModel;
    const activeGender = overrideParams?.modelGender ?? modelGender;
    const activeAge = overrideParams?.modelAgeGroup ?? modelAgeGroup;
    const activeCustomInstructions = overrideParams?.customInstructions ?? customInstructions;

    setMessages(prev => [
      ...prev,
      {
        id: `user-gen-${Date.now()}`,
        sender: 'user',
        text: `开始 AI 摆放渲染。配置：${activeView}视角、${activeRatio}图片、${activeRes}精度、${activeAddModel ? `添加人物模特(${activeGender}${activeAge})` : '不添加模特'}${activeCustomInstructions ? `、个性化要求(${activeCustomInstructions})` : ''}`,
        timestamp: now
      }
    ]);

    setIsGenerating(true);

    try {
      const finalOverrides = {
        viewParam: activeView,
        resolution: activeRes,
        aspectRatio: activeRatio,
        addModel: activeAddModel,
        modelGender: activeGender,
        modelAgeGroup: activeAge,
        customInstructions: activeCustomInstructions
      };

      const finalUrl = await onGenerateMockup(finalOverrides);
      if (finalUrl) {
        setMessages(prev => [
          ...prev,
          {
            id: `ai-render-done-${Date.now()}`,
            sender: 'ai',
            text: '🎉 效果图渲染合成完毕！已融合房间全局环境采光和大理石奢石物理贴图，摆放效果精细还原如下：',
            timestamp: now
          },
          {
            id: `ai-gen-result-${Date.now()}`,
            sender: 'ai',
            type: 'generation_result',
            data: { image: finalUrl },
            timestamp: now
          }
        ]);
        setActiveStepId('complete');
      } else {
        throw new Error('合成结果为空');
      }
    } catch (err: any) {
      console.error(err);
      appendErrorMsg(`❌ 效果图摆放合成失败：${err.message || '未知服务器错误'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper to trigger download from base64
  const handleDownloadImage = (imgUrl: string) => {
    try {
      const link = document.createElement('a');
      link.href = imgUrl;
      link.download = `大理石餐桌智能试摆_${aspectRatio.replace(':', 'x')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      window.open(imgUrl, '_blank');
    }
  };

  const handleReset = () => {
    onResetAll();
    setMessages([]);
    setActiveStepId('room');
    
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'ai',
        text: '已为您清除当前设置，让我们重新开始！✨\n请选择餐厅背景空间样板间或者上传您自己的房屋空间：',
        timestamp: now
      },
      {
        id: `room-selector-${Date.now()}`,
        sender: 'ai',
        type: 'room_selection',
        timestamp: now
      }
    ]);
  };

  // Handle manual typing input
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue.trim();
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setInputValue('');
    
    // Append user message
    setMessages(prev => [...prev, {
      id: `user-msg-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: now
    }]);

    // Check point limits for message
    const isAllowed = await verifyPoints();
    if (!isAllowed) {
      appendErrorMsg('❌ 积分不足，无法回答。请联系管理员进行额度充值。');
      return;
    }

    // AI responsive simulation with real intent parsing
    setTimeout(async () => {
      let aiText = '';
      let matchedChanges: string[] = [];
      
      // 1. Parse View Param
      let newViewParam: ViewParam | null = null;
      if (userText.includes('近景') || userText.includes('特写') || userText.includes('近一点') || userText.includes('细节') || userText.includes('微距')) {
        newViewParam = '近景';
        matchedChanges.push('渲染视角 ➔ 近景');
      } else if (userText.includes('中近景') || userText.includes('中景') || userText.includes('中焦')) {
        newViewParam = '中近景';
        matchedChanges.push('渲染视角 ➔ 中近景');
      } else if (userText.includes('远景') || userText.includes('全景') || userText.includes('拉远') || userText.includes('远一点') || userText.includes('全貌') || userText.includes('整个房间')) {
        newViewParam = '远景';
        matchedChanges.push('渲染视角 ➔ 远景');
      }

      // 2. Parse Resolution
      let newResolution: ResolutionParam | null = null;
      if (userText.toLowerCase().includes('4k') || userText.includes('超高清') || userText.includes('超清')) {
        newResolution = '4k';
        matchedChanges.push('渲染精度 ➔ 4K 超清');
      } else if (userText.toLowerCase().includes('2k') || userText.includes('高清') || userText.includes('2k清晰') || userText.includes('二k')) {
        newResolution = '2k';
        matchedChanges.push('渲染精度 ➔ 2K 高清');
      } else if (userText.toLowerCase().includes('1k') || userText.includes('标清') || userText.includes('1k清晰') || userText.includes('一k')) {
        newResolution = '1k';
        matchedChanges.push('渲染精度 ➔ 1K 标清');
      }

      // 3. Parse Aspect Ratio
      let newAspectRatio: AspectRatioParam | null = null;
      if (userText.includes('1:1') || userText.includes('正方形') || userText.includes('一比一')) {
        newAspectRatio = '1:1';
        matchedChanges.push('画面比例 ➔ 1:1 正方形');
      } else if (userText.includes('9:16') || userText.includes('手机屏') || userText.includes('九比十六') || userText.includes('竖屏')) {
        newAspectRatio = '9:16';
        matchedChanges.push('画面比例 ➔ 9:16 竖屏');
      } else if (userText.includes('16:9') || userText.includes('电脑屏') || userText.includes('宽屏') || userText.includes('十六比九') || userText.includes('横屏')) {
        newAspectRatio = '16:9';
        matchedChanges.push('画面比例 ➔ 16:9 横屏');
      } else if (userText.includes('3:4') || userText.includes('三分之四') || userText.includes('竖版3:4')) {
        newAspectRatio = '3:4';
        matchedChanges.push('画面比例 ➔ 3:4 竖版');
      } else if (userText.includes('4:3') || userText.includes('四分之三') || userText.includes('横版4:3')) {
        newAspectRatio = '4:3';
        matchedChanges.push('画面比例 ➔ 4:3 横版');
      }

      // 4. Parse Model
      let newAddModel: boolean | null = null;
      let newModelGender: ModelGenderParam | null = null;
      let newModelAgeGroup: ModelAgeParam | null = null;

      if (userText.includes('不加模特') || userText.includes('去掉模特') || userText.includes('不要模特') || userText.includes('没有模特') || userText.includes('无模特') || userText.includes('去掉人物') || userText.includes('不添加人物') || userText.includes('不加人物')) {
        newAddModel = false;
        matchedChanges.push('模特配置 ➔ 不添加模特');
      } else if (userText.includes('加模特') || userText.includes('添加模特') || userText.includes('放个模特') || userText.includes('配个模特') || userText.includes('加上模特') || userText.includes('加个模特') || userText.includes('带模特') || userText.includes('加上人物') || userText.includes('放个人物') || userText.includes('带人物')) {
        newAddModel = true;
        matchedChanges.push('模特配置 ➔ 添加人物模特');
      }

      if (userText.includes('男模特') || userText.includes('男的') || userText.includes('男性') || userText.includes('男士')) {
        newAddModel = true;
        newModelGender = '男';
        matchedChanges.push('模特性别 ➔ 男');
      } else if (userText.includes('女模特') || userText.includes('女的') || userText.includes('女性') || userText.includes('女士') || userText.includes('美女')) {
        newAddModel = true;
        newModelGender = '女';
        matchedChanges.push('模特性别 ➔ 女');
      }

      if (userText.includes('青年') || userText.includes('年轻') || userText.includes('小伙') || userText.includes('姑娘') || userText.includes('帅哥')) {
        newAddModel = true;
        newModelAgeGroup = '青年';
        matchedChanges.push('模特年龄 ➔ 青年');
      } else if (userText.includes('中年') || userText.includes('成熟') || userText.includes('阿姨') || userText.includes('叔叔')) {
        newAddModel = true;
        newModelAgeGroup = '中年';
        matchedChanges.push('模特年龄 ➔ 中年');
      } else if (userText.includes('老年') || userText.includes('老人') || userText.includes('老年人') || userText.includes('大爷') || userText.includes('大妈')) {
        newAddModel = true;
        newModelAgeGroup = '老年';
        matchedChanges.push('模特年龄 ➔ 老年');
      }

      // Check for specific room styles
      let selectedRoom: any = null;
      if (userText.includes('极简') || userText.includes('现代极简')) {
        selectedRoom = virtualRooms.find(r => r.id === 'minimalism');
      } else if (userText.includes('田园') || userText.includes('法式田园') || userText.includes('温馨田园')) {
        selectedRoom = virtualRooms.find(r => r.id === 'pastoral');
      } else if (userText.includes('北欧') || userText.includes('温馨北欧')) {
        selectedRoom = virtualRooms.find(r => r.id === 'nordic');
      } else if (userText.includes('中式') || userText.includes('新中式')) {
        selectedRoom = virtualRooms.find(r => r.id === 'oriental');
      } else if (userText.includes('奶油') || userText.includes('温馨奶油')) {
        selectedRoom = virtualRooms.find(r => r.id === 'creamy');
      } else if (userText.includes('侘寂') || userText.includes('寂宅')) {
        selectedRoom = virtualRooms.find(r => r.id === 'wabisabi');
      }

      // Detect non-predefined custom room styles (e.g. "工业风", "美式风", "地中海风", "意式风格")
      let customStyleName: string | null = null;
      if (!selectedRoom) {
        const styleRegex = /([^\s,，。！!？?、；;“”"()（）]{2,10}(?:风|风格|主义))/g;
        const styleMatches = userText.match(styleRegex);
        if (styleMatches && styleMatches.length > 0) {
          customStyleName = styleMatches[0];
        }
      }

      // Reset request
      if (userText.includes('重新开始') || userText.includes('重置') || userText.includes('清空')) {
        handleReset();
        return;
      }

      // Switch room step back
      if (userText.includes('换个房间') || userText.includes('重新选房间') || userText.includes('换个背景') || userText.includes('换背景') || userText.includes('重新选背景')) {
        setRoomImage(null);
        setRoomAnalysis(null);
        setActiveStepId('room');
        setMessages(prev => [
          ...prev,
          {
            id: `ai-reply-${Date.now()}`,
            sender: 'ai',
            text: '好的，已经为您重置了空间背景。请在下方点击选择一个推荐的高级样板间风格，或者上传您自己的房屋照片：',
            timestamp: now
          },
          {
            id: `room-selector-${Date.now()}`,
            sender: 'ai',
            type: 'room_selection',
            timestamp: now
          }
        ]);
        return;
      }

      // Switch table step back
      if (userText.includes('换个餐桌') || userText.includes('重新选餐桌') || userText.includes('重新上传餐桌') || userText.includes('换餐桌') || userText.includes('换桌子')) {
        setTableImage(null);
        setTableAnalysis(null);
        setActiveStepId('table');
        setMessages(prev => [
          ...prev,
          {
            id: `ai-reply-${Date.now()}`,
            sender: 'ai',
            text: '好的，已经为您重置了试摆餐桌图。请在下方上传您的大理石餐桌高清切图照片：',
            timestamp: now
          },
          {
            id: `table-uploader-msg-${Date.now()}`,
            sender: 'ai',
            type: 'table_upload',
            timestamp: now
          }
        ]);
        return;
      }

      // Process Room Selection via chat
      if (selectedRoom) {
        setRoomImage(selectedRoom.image);
        setRoomMimeType('image/jpeg');
        setRoomAnalysis(selectedRoom.analysis);
        
        aiText = `✨ 好的，我已为您将空间背景切换为 “${selectedRoom.name}”！`;
        
        if (tableImage && tableAnalysis) {
          setMessages(prev => [...prev, {
            id: `ai-reply-${Date.now()}`,
            sender: 'ai',
            text: `${aiText}\n\n检测到您已有锁定的餐桌切图，正在为您重新渲染最新的摆放效果图，请稍候...`,
            timestamp: now
          }]);
          
          await handleStartGeneration({
            viewParam,
            resolution,
            aspectRatio,
            addModel,
            modelGender,
            modelAgeGroup,
            customInstructions: customInstructions
          });
        } else {
          setMessages(prev => [...prev, 
            {
              id: `ai-reply-${Date.now()}`,
              sender: 'ai',
              text: `${aiText}\n\n接下来，请上传您需要试摆的大理石餐桌正面照 📸：`,
              timestamp: now
            },
            {
              id: `table-uploader-msg-${Date.now()}`,
              sender: 'ai',
              type: 'table_upload',
              timestamp: now
            }
          ]);
          setActiveStepId('table');
        }
        return;
      }

      // Process Custom Room Selection via chat
      if (customStyleName) {
        const cleanedStyle = customStyleName.replace(/(风格|风)$/, '') + '风格';
        setRoomImage('virtual_custom_style');
        setRoomMimeType('image/jpeg');
        const generatedRoomAnalysis = {
          style: cleanedStyle,
          furniture: `High-end dining furniture, luxury sideboards, windows, and decorative elements custom-tailored to a perfect ${cleanedStyle} space`,
          spaceAndLight: `Exquisite ambient architectural lighting that captures the warm and upscale vibe of a high-end ${cleanedStyle} room`,
          suggestedLocation: "Center of the dining area"
        };
        setRoomAnalysis(generatedRoomAnalysis);

        aiText = `✨ 好的，已为您将空间背景切换为自定义风格：“${cleanedStyle}”！`;

        if (tableImage && tableAnalysis) {
          setMessages(prev => [...prev, {
            id: `ai-reply-${Date.now()}`,
            sender: 'ai',
            text: `${aiText}\n\n检测到您已有锁定的餐桌切图，正在为您重新渲染最新的摆放效果图，请稍候...`,
            timestamp: now
          }]);

          await handleStartGeneration({
            viewParam,
            resolution,
            aspectRatio,
            addModel,
            modelGender,
            modelAgeGroup,
            customInstructions: customInstructions
          });
        } else {
          setMessages(prev => [...prev, 
            {
              id: `ai-reply-${Date.now()}`,
              sender: 'ai',
              text: `${aiText}\n\n接下来，请上传您需要试摆的大理石餐桌正面照 📸：`,
              timestamp: now
            },
            {
              id: `table-uploader-msg-${Date.now()}`,
              sender: 'ai',
              type: 'table_upload',
              timestamp: now
            }
          ]);
          setActiveStepId('table');
        }
        return;
      }

      // Extract custom instruction words (excluding parsed parameters and commands)
      let customInstructionPart = userText;
      // Remove known view keywords
      customInstructionPart = customInstructionPart.replace(/(中近景|中景|中焦|拉远|拉近|近景|特写|近一点|细节|微距|远景|全景|远一点|全貌|整个房间|换成)/gi, '');
      // Remove resolution keywords
      customInstructionPart = customInstructionPart.replace(/(4k|超高清|超清|2k清晰|2k|高清|二k|1k|标清|1k清晰|一k)/gi, '');
      // Remove aspect ratio keywords
      customInstructionPart = customInstructionPart.replace(/(1:1|正方形|一比一|9:16|手机屏|九比十六|竖屏|16:9|电脑屏|宽屏|十六比九|横屏|3:4|三分之四|竖版3:4|4:3|四分之三|横版4:3|比例)/gi, '');
      // Remove model keywords
      customInstructionPart = customInstructionPart.replace(/(不加模特|去掉模特|不要模特|没有模特|无模特|去掉人物|不添加人物|不加人物|加模特|添加模特|放个模特|配个模特|加上模特|加个模特|带模特|加上人物|放个人物|带人物|男模特|男的|男性|男士|女模特|女的|女性|女士|美女|青年|年轻|小伙|姑娘|帅哥|中年|成熟|阿姨|叔叔|老年|老人|老年人|大爷|大妈)/gi, '');
      // Remove step-back keywords
      customInstructionPart = customInstructionPart.replace(/(换个房间|重新选房间|换个背景|换背景|重新选背景|换个餐桌|重新选餐桌|重新上传餐桌|换餐桌|换桌子|重新开始|重置|清空)/gi, '');
      // Clean up punctuation or transition words
      customInstructionPart = customInstructionPart.replace(/^[，。, .！!？?、\s；;：:且并且及以及换成]+|[，。, .！!？?、\s；;：:且并且及以及换成]+$/g, '').trim();

      const isStatusQuery = userText.includes('积分') || userText.includes('额度') || userText.includes('钱');
      const hasCustomPart = customInstructionPart.length >= 2 && !isStatusQuery;

      // Process Parameter Changes
      if (matchedChanges.length > 0) {
        let activeCustomInstructions = customInstructions;
        if (hasCustomPart) {
          activeCustomInstructions = customInstructions 
            ? `${customInstructions}, ${customInstructionPart}`
            : customInstructionPart;
          setCustomInstructions(activeCustomInstructions);
        }

        aiText = `✨ 收到！我已为您调整了以下渲染参数：\n${matchedChanges.map(c => `• ${c}`).join('\n')}\n`;
        if (hasCustomPart) {
          aiText += `• 附加定制要求 ➔ “${customInstructionPart}”\n\n`;
        } else {
          aiText += `\n`;
        }
        
        // Update local state React bindings
        if (newViewParam) setViewParam(newViewParam);
        if (newResolution) setResolution(newResolution);
        if (newAspectRatio) setAspectRatio(newAspectRatio);
        if (newAddModel !== null) setAddModel(newAddModel);
        if (newModelGender) setModelGender(newModelGender);
        if (newModelAgeGroup) setModelAgeGroup(newModelAgeGroup);

        // Auto re-generate if we are ready
        if (roomImage && roomAnalysis && tableImage && tableAnalysis) {
          setMessages(prev => [...prev, {
            id: `ai-reply-${Date.now()}`,
            sender: 'ai',
            text: `${aiText}正在使用最新参数及定制要求为您重新渲染摆放效果图，请稍候...`,
            timestamp: now
          }]);
          
          await handleStartGeneration({
            viewParam: newViewParam ?? viewParam,
            resolution: newResolution ?? resolution,
            aspectRatio: newAspectRatio ?? aspectRatio,
            addModel: newAddModel !== null ? newAddModel : addModel,
            modelGender: newModelGender ?? modelGender,
            modelAgeGroup: newModelAgeGroup ?? modelAgeGroup,
            customInstructions: activeCustomInstructions
          });
        } else {
          aiText += `（由于背景图或餐桌切图尚未完成，修改的参数已为您暂存，在后续渲染时将自动生效。）`;
          if (!roomImage) {
            aiText += `\n\n请在下方点击选择一个餐厅空间样板间，或者上传您的真实房屋照片：`;
          } else {
            aiText += `\n\n请上传您需要试摆的大理石餐桌照片 📸：`;
          }
          setMessages(prev => [...prev, {
            id: `ai-reply-${Date.now()}`,
            sender: 'ai',
            text: aiText,
            timestamp: now
          }]);
        }
        return;
      }

      // Process Standalone Custom Instructions
      if (hasCustomPart && !selectedRoom && !customStyleName) {
        const nextCustomInstructions = customInstructions 
          ? `${customInstructions}, ${customInstructionPart}`
          : customInstructionPart;
        
        setCustomInstructions(nextCustomInstructions);

        aiText = `✨ 收到个性化定制要求：“${customInstructionPart}”\n`;
        if (customInstructions) {
          aiText += `（已累积之前的要求，当前累计要求为: “${nextCustomInstructions}”）\n\n`;
        } else {
          aiText += `\n`;
        }

        if (roomImage && roomAnalysis && tableImage && tableAnalysis) {
          setMessages(prev => [...prev, {
            id: `ai-reply-${Date.now()}`,
            sender: 'ai',
            text: `${aiText}正在为您重新生成，请稍候...`,
            timestamp: now
          }]);

          await handleStartGeneration({
            viewParam,
            resolution,
            aspectRatio,
            addModel,
            modelGender,
            modelAgeGroup,
            customInstructions: nextCustomInstructions
          });
        } else {
          aiText += `（由于背景图或餐桌切图尚未完成，定制要求已为您暂存，在后续渲染时将自动生效。）`;
          if (!roomImage) {
            aiText += `\n\n请在下方点击选择一个餐厅空间样板间，或者上传您的真实房屋照片：`;
          } else {
            aiText += `\n\n请上传您需要试摆的大理石餐桌照片 📸：`;
          }
          setMessages(prev => [...prev, {
            id: `ai-reply-${Date.now()}`,
            sender: 'ai',
            text: aiText,
            timestamp: now
          }]);
        }
        return;
      }

      // Default contextual responses
      if (userText.includes('积分') || userText.includes('额度') || userText.includes('钱')) {
        aiText = `💡 您的当前账户状态：\n• 用户名：${userId ? '企业认证用户' : '访客体验者'}\n• 我的可用积分：${userIntegral !== null ? `${userIntegral} 积分` : '暂未接入'}\n• 单词渲染扣除：${requiredIntegral || 1} 积分\n大理石餐桌智能试摆服务正全力为您护航！`;
      } else if (activeStepId === 'room') {
        aiText = '如果您想上传自己的餐厅实拍图，请在上方选项卡中点击 “上传我的真实房屋”，或直接点击预设的高端样板间，AI 会立刻分析视角和阴影落差。🏠';
      } else if (activeStepId === 'table') {
        aiText = '当前阶段为餐桌款式识别阶段。请在上面的上传框中上传您的大理石餐桌高清切图照片，我来帮您分析它的底座和石纹，然后摆进刚才选定的房间。📸';
      } else if (activeStepId === 'params') {
        aiText = '背景和餐桌已经分析妥当了！您可以通过上面的设置面板选择渲染视角（远、中、近）、清晰度（1K/2K/4K）及比例，点击 “开始 AI 智能渲染摆放” 按钮启动光线合成！✨';
      } else {
        aiText = '您好！我是您的智能试摆 AI 助手，已为您准备好生成成果。您可以对我说“换成近景”、“换成4K”、“添加青年女模特”或“画面比例改成16:9”来实时调整并重新生成试摆效果！';
      }

      setMessages(prev => [...prev, {
        id: `ai-reply-${Date.now()}`,
        sender: 'ai',
        text: aiText,
        timestamp: now
      }]);
    }, 800);
  };

  // Rendering loading statuses
  const renderingStatuses = [
    '正在校准房间透视与地平面网格 (Calibrating perspective grids)...',
    '正在计算房间主光源位置与阴影衰减 (Computing environment lightings)...',
    '正在融合大理石表面的环境折射与漫反射 (Solving PBR material shaders)...',
    '正在计算餐桌底座与地面的接触阴影 (Generating contact ambient occlusion)...',
    '效果图最后微调润色中，即将呈现场景 (Final touch polishing)...'
  ];

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col h-[650px] md:h-[750px] bg-white border border-[#e5e2da] rounded-3xl shadow-2xl overflow-hidden font-sans" id="agent-chat-layout">
      {/* Chat header info bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#faf9f6] to-[#f4f2e9] border-b border-[#e5e2da] shrink-0" id="agent-chat-header">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-gold-500 to-amber-600 shadow-sm shadow-gold-500/10">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-sm text-gray-900 tracking-wide flex items-center gap-1.5">
              试摆 AI 智能体助手
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-gold-100 text-gold-700 font-bold tracking-widest font-mono uppercase">Agent v1.2</span>
            </h3>
            <p className="text-[10px] text-gray-500 font-mono tracking-wider">MARBLE PLACEMENT SMART CHATBOT</p>
          </div>
        </div>

        {/* Sync state info chips */}
        <div className="flex items-center gap-3 hidden sm:flex">
          {roomImage && (
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-amber-50 border border-amber-200 text-[10px] text-amber-700 font-medium">
              <Landmark className="w-3 h-3" />
              <span>空间已锁定</span>
            </div>
          )}
          {tableImage && (
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-50 border border-emerald-200 text-[10px] text-emerald-700 font-medium">
              <Box className="w-3 h-3" />
              <span>餐桌已定位</span>
            </div>
          )}
        </div>
      </div>

      {/* Message Scroller */}
      <div className="flex-1 overflow-y-auto p-6 bg-[#fafcfb] space-y-6 custom-scrollbar" id="chat-messages-container">
        {messages.map((msg) => {
          const isAI = msg.sender === 'ai';
          return (
            <div 
              key={msg.id} 
              className={`flex gap-3 max-w-full ${isAI ? 'justify-start' : 'justify-end'}`}
              id={`msg-bubble-${msg.id}`}
            >
              {isAI && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-400 to-amber-600 flex items-center justify-center shrink-0 shadow-sm text-white font-bold text-xs font-display">
                  AI
                </div>
              )}

              <div className="space-y-1.5 max-w-[85%] md:max-w-[78%]">
                {/* Bubble card box */}
                {msg.text && (
                  <div 
                    className={`rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-xs border transition-all ${
                      isAI 
                        ? 'bg-white border-[#e5e2da] text-gray-800 rounded-tl-xs' 
                        : 'bg-gradient-to-r from-gold-500 to-amber-600 border-amber-600 text-white rounded-tr-xs shadow-md shadow-gold-500/5'
                    }`}
                  >
                    <p className="whitespace-pre-line text-[13px]">{msg.text}</p>
                  </div>
                )}

                {/* CUSTOM RICH INTERACTIVE CHAT WIDGETS */}

                {/* 1. ROOM TEMPLATES SELECTION */}
                {isAI && msg.type === 'room_selection' && (
                  <div className="mt-2 bg-white rounded-2xl border border-[#e5e2da] p-4 shadow-xs space-y-4 w-full">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">选择推荐客餐厅样板间：</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {virtualRooms.map((room) => (
                        <button
                          key={room.id}
                          onClick={() => handleRoomSelect(room)}
                          className="flex items-center gap-3 p-2.5 rounded-xl border border-gray-100 hover:border-gold-500 hover:bg-gold-50/40 text-left transition-all group"
                        >
                          <div className="w-12 h-12 rounded-lg bg-[#f0eee6] border border-[#e5e2da] flex items-center justify-center shrink-0 group-hover:bg-gold-500 group-hover:border-gold-500 group-hover:text-white transition-all text-gold-600 duration-300 shadow-inner">
                            <Home className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-gray-800 group-hover:text-gold-600 transition-colors font-display">{room.name}</h4>
                            <p className="text-[9px] text-gray-400 mt-0.5 truncate">{room.style} / 3D物理定位</p>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gold-500 transition-colors" />
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-center pt-2 border-t border-dashed border-[#e5e2da]">
                      <button
                        onClick={handleChooseCustomRoom}
                        className="flex items-center gap-1.5 px-4 py-2 mt-2 rounded-xl bg-gray-50 border border-gray-200 hover:border-gold-500 hover:bg-white text-xs font-semibold text-gray-600 hover:text-gold-600 transition-all"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        上传我的真实房屋空间照片
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. ROOM CUSTOM UPLOADER */}
                {isAI && msg.type === 'room_upload' && !roomImage && (
                  <div className="mt-2 w-full" id="inline-room-uploader">
                    <ImageUploader
                      onUpload={handleRoomImageUploaded}
                      label="点击或拖拽上传餐厅照片"
                      description="支持常见图片格式（如 JPG, PNG, WebP），最大支持 20MB（通过前端压缩上传）。"
                      icon={<Landmark className="w-8 h-8 text-gray-300" />}
                      className="h-[180px] min-h-[180px]"
                    />
                  </div>
                )}

                  {/* 3. ROOM ANALYSIS RESULT */}
                  {isAI && msg.type === 'room_result' && msg.data?.analysis && (
                    <div className="mt-2 bg-white rounded-2xl border border-[#e5e2da] p-4 shadow-xs space-y-3 w-full" id="chat-room-result">
                      <div className="flex gap-3 items-center p-2 rounded-xl bg-[#faf9f6] border border-gray-100">
                        <img 
                          src={roomImage!} 
                          alt="Room Custom" 
                          className="w-16 h-16 rounded-lg object-cover" 
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <p className="text-xs font-bold text-gray-900">识别定位：我的专属背景空间</p>
                          <p className="text-[10px] text-gray-500 mt-1">风格特征：{msg.data.analysis.style}</p>
                        </div>
                      </div>

                      <div className="p-3 bg-[#faf9f6] rounded-xl border border-gray-100 space-y-2 text-xs">
                        <p className="text-gray-700 leading-relaxed"><strong className="text-gray-800">🛋️ 空间家具：</strong>{msg.data.analysis.furniture}</p>
                        <p className="text-gray-700 leading-relaxed"><strong className="text-gray-800">☀️ 采光透视：</strong>{msg.data.analysis.spaceAndLight}</p>
                      </div>
                    </div>
                  )}

                  {/* 4. TABLE CUSTOM UPLOADER */}
                  {isAI && msg.type === 'table_upload' && !tableImage && (
                    <div className="mt-2 w-full" id="inline-table-uploader">
                      <ImageUploader
                        onUpload={handleTableImageUploaded}
                        label="点击或拖拽上传大理石餐桌高清照片"
                        description="支持常见图片格式（如 JPG, PNG, WebP），最大支持 20MB（通过前端压缩上传）。"
                        icon={<Box className="w-8 h-8 text-gray-300" />}
                        className="h-[180px] min-h-[180px]"
                      />
                    </div>
                  )}

                  {/* 5. TABLE ANALYSIS RESULT */}
                  {isAI && msg.type === 'table_result' && msg.data?.analysis && (
                    <div className="mt-2 bg-white rounded-2xl border border-[#e5e2da] p-4 shadow-xs space-y-3 w-full" id="chat-table-result">
                      <div className="flex gap-3 items-center p-2 rounded-xl bg-[#faf9f6] border border-gray-100">
                        <img 
                          src={tableImage!} 
                          alt="Table Custom" 
                          className="w-16 h-16 rounded-lg object-cover" 
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <p className="text-xs font-bold text-gray-900">餐桌款式识别：{msg.data.analysis.shape}</p>
                          <p className="text-[10px] text-gray-500 mt-1">底座特征：{msg.data.analysis.vibe}</p>
                        </div>
                      </div>

                      <div className="p-3 bg-[#faf9f6] rounded-xl border border-gray-100 space-y-2 text-xs">
                        <p className="text-gray-700 leading-relaxed"><strong className="text-gray-800">💎 石质纹路：</strong>{msg.data.analysis.marbleDetails}</p>
                        <p className="text-gray-700 leading-relaxed"><strong className="text-gray-800">🦵 桌腿结构：</strong>{msg.data.analysis.legsAndBase}</p>
                      </div>
                    </div>
                  )}

                  {/* 6. SIMPLIFIED PARAMETER SELECTOR */}
                  {isAI && msg.type === 'param_selection' && (
                    <div className="mt-2 bg-white rounded-2xl border border-[#e5e2da] p-4 shadow-xs space-y-4 w-full" id="chat-param-selector">
                      {/* Summary previews */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-2 p-1.5 bg-[#faf9f6] border border-gray-100 rounded-lg">
                          {roomImage!.startsWith('http') ? (
                            <div className="w-7 h-7 bg-gold-50 border border-gold-100 flex items-center justify-center rounded text-gold-600 shrink-0">
                              <Home className="w-4 h-4" />
                            </div>
                          ) : (
                            <img src={roomImage!} alt="Room" className="w-7 h-7 rounded object-cover" referrerPolicy="no-referrer" />
                          )}
                          <span className="text-[10px] text-gray-500 font-medium truncate">空间背景已装载</span>
                        </div>
                        <div className="flex items-center gap-2 p-1.5 bg-[#faf9f6] border border-gray-100 rounded-lg">
                          <img src={tableImage!} alt="Table" className="w-7 h-7 rounded object-cover" referrerPolicy="no-referrer" />
                          <span className="text-[10px] text-gray-500 font-medium truncate">大理石餐桌已装载</span>
                        </div>
                      </div>

                      {/* Perspective view choice */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block flex items-center gap-1">
                          <Camera className="w-3 h-3 text-gold-500" /> 1. 试摆视角 (View Perspective)
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {(['远景', '中近景', '近景'] as ViewParam[]).map((v) => {
                            const isSelected = viewParam === v;
                            return (
                              <button
                                key={v}
                                onClick={() => setViewParam(v)}
                                className={`py-1.5 px-1 text-center rounded-lg border text-xs font-semibold transition-all ${
                                  isSelected 
                                    ? 'bg-gold-500 border-gold-500 text-white shadow-xs' 
                                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                                }`}
                              >
                                {v}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Aspect ratios and Resolution details in a compact grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block flex items-center gap-1">
                            <Maximize className="w-3 h-3 text-gold-500" /> 2. 图像比例 (Ratio)
                          </label>
                          <select
                            value={aspectRatio}
                            onChange={(e) => setAspectRatio(e.target.value as AspectRatioParam)}
                            className="w-full text-xs bg-white border border-gray-200 rounded-lg p-1.5 text-gray-700 outline-none hover:border-gray-300"
                          >
                            <option value="1:1">1:1 正方形 (画册)</option>
                            <option value="3:4">3:4 竖图 (手机)</option>
                            <option value="4:3">4:3 横图 (电脑)</option>
                            <option value="9:16">9:16 竖高屏 (满屏)</option>
                            <option value="16:9">16:9 宽画幅 (电视)</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-gold-500" /> 3. 渲染精度 (Resolution)
                          </label>
                          <select
                            value={resolution}
                            onChange={(e) => setResolution(e.target.value as ResolutionParam)}
                            className="w-full text-xs bg-white border border-gray-200 rounded-lg p-1.5 text-gray-700 outline-none hover:border-gray-300"
                          >
                            <option value="1k">1K 速度极快 (1024px)</option>
                            <option value="2k">2K 高端写实 (2048px)</option>
                            <option value="4k">4K 印刷奢石 (4096px)</option>
                          </select>
                        </div>
                      </div>

                      {/* Advanced options: Model */}
                      <div className="p-3 bg-[#faf9f6] rounded-xl border border-gray-100 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-gold-500" />
                            添加配景模特 (Human Model Option)
                          </span>
                          <input
                            type="checkbox"
                            checked={addModel}
                            onChange={(e) => setAddModel(e.target.checked)}
                            className="rounded text-gold-500 focus:ring-gold-500 w-4 h-4"
                          />
                        </div>

                        {addModel && (
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-dashed border-[#e5e2da] animate-in fade-in duration-200">
                            <div className="space-y-1">
                              <span className="text-[9px] text-gray-400 font-bold uppercase block">模特性别</span>
                              <div className="flex gap-1">
                                {(['女', '男'] as ModelGenderParam[]).map((g) => (
                                  <button
                                    key={g}
                                    type="button"
                                    onClick={() => setModelGender(g)}
                                    className={`flex-1 py-1 text-center rounded text-[10px] font-bold border transition-colors ${
                                      modelGender === g ? 'bg-gold-500 text-white border-gold-500' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                    }`}
                                  >
                                    {g}性
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[9px] text-gray-400 font-bold uppercase block">模特年龄段</span>
                              <select
                                value={modelAgeGroup}
                                onChange={(e) => setModelAgeGroup(e.target.value as ModelAgeParam)}
                                className="w-full text-[10px] bg-white border border-gray-200 rounded p-1 text-gray-700 outline-none"
                              >
                                <option value="青年">青年 (Youth)</option>
                                <option value="中年">中年 (Middle Age)</option>
                                <option value="老年">老年 (Senior)</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Mega action button */}
                      <button
                        onClick={handleStartGeneration}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-gold-500 via-amber-500 to-yellow-500 hover:brightness-110 active:brightness-95 text-white font-bold text-xs font-display tracking-widest shadow-md transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
                      >
                        <Sparkles className="w-4 h-4 animate-pulse" />
                        立即生成摆放效果图 (AI RENDER)
                      </button>
                    </div>
                  )}

                  {/* 7. FINAL IMAGE RESULT CARDS */}
                  {isAI && msg.type === 'generation_result' && msg.data?.image && (
                    <div className="mt-2 bg-white rounded-2xl border border-[#e5e2da] p-4 shadow-xs space-y-4 w-full" id="chat-generation-result">
                      <div className="relative rounded-xl overflow-hidden border border-gray-100 bg-gray-50 shadow-sm flex items-center justify-center min-h-[220px]" id="chat-result-img-box">
                        <img 
                          src={msg.data.image} 
                          alt="AI Rendered result" 
                          className="max-w-full max-h-[360px] object-contain rounded-lg"
                        />
                        <div className="absolute top-2.5 right-2.5 px-1.5 py-0.5 rounded bg-black/60 text-[8px] font-bold text-white tracking-widest font-mono uppercase">
                          Render Success
                        </div>
                      </div>

                      {/* Action buttons inside bubble */}
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => handleDownloadImage(msg.data.image)}
                          className="flex items-center justify-center gap-1 py-2 px-1 rounded-lg bg-gold-500 hover:bg-gold-600 text-white font-bold text-[10px] transition-colors"
                        >
                          <Download className="w-3 h-3" />
                          下载效果图
                        </button>
                        <button
                          onClick={() => window.open(msg.data.image, '_blank')}
                          className="flex items-center justify-center gap-1 py-2 px-1 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold text-[10px] transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          查看大图
                        </button>
                        <button
                          onClick={handleReset}
                          className="flex items-center justify-center gap-1 py-2 px-1 rounded-lg bg-gray-900 hover:bg-black text-gold-400 font-bold text-[10px] transition-colors"
                        >
                          <RotateCcw className="w-3 h-3 text-gold-500" />
                          换个房间
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 8. ERROR MESSAGE RENDERING */}
                  {isAI && msg.type === 'error' && (
                    <div className="mt-2 flex items-start gap-2 text-rose-600 font-semibold bg-rose-50 border border-rose-100 p-3 rounded-xl w-full">
                      <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <div className="text-xs space-y-1">
                        <p>{msg.text || '操作未执行'}</p>
                        <p className="text-[10px] font-normal text-rose-500/80">您的可用额度余额不足或校验未通过，请检查您的积分明细后重试。</p>
                      </div>
                    </div>
                  )}

                {/* Timestamp & Name */}
                <div className={`text-[10px] text-gray-400 font-mono flex items-center gap-1.5 ${isAI ? 'justify-start pl-1' : 'justify-end pr-1'}`}>
                  <span>{isAI ? '智能助手' : '我的选择'}</span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </div>
              </div>
            </div>
          );
        })}

        {/* LOADING INDICATOR BUBBLE (FOR RUNNING API CALLS) */}
        {(analyzingRoom || analyzingTable || isGenerating) && (
          <div className="flex gap-3 justify-start animate-pulse" id="chat-loading-bubble">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-400 to-amber-600 flex items-center justify-center shrink-0 shadow-sm text-white font-bold text-xs font-display">
              AI
            </div>
            <div className="space-y-1 max-w-[85%] md:max-w-[70%]">
              <div className="rounded-2xl px-5 py-4 bg-white border border-[#e5e2da] rounded-tl-xs shadow-xs space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="relative w-5 h-5 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-2 border-gold-500/20" />
                    <div className="absolute inset-0 rounded-full border-2 border-t-gold-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                  </div>
                  <span className="text-xs font-semibold text-gray-700">
                    {analyzingRoom && 'AI 空间深度分析中...'}
                    {analyzingTable && 'AI 大理石餐桌材质与结构计算中...'}
                    {isGenerating && 'AI 智能光线追踪及拼图合成中...'}
                  </span>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] text-gold-600 font-mono font-medium animate-pulse">
                    {analyzingRoom && 'Analyzing room perspectives, lighting directions, and aesthetics...'}
                    {analyzingTable && 'Extracting stone veins, base structures, reflection coefficients...'}
                    {isGenerating && 'Synthesizing PBR shaders, shadows, details. Please wait half a minute...'}
                  </p>
                  <div className="w-full bg-gray-100 rounded-full h-1 overflow-hidden">
                    <div className="bg-gradient-to-r from-gold-500 to-amber-500 h-1 rounded-full animate-progress w-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Footer Text Input area */}
      <div className="p-4 bg-[#faf9f6] border-t border-[#e5e2da] shrink-0" id="chat-input-bar-container">
        <form onSubmit={handleSendMessage} className="flex gap-2.5 max-w-4xl mx-auto items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="对 AI 助手输入疑问或需求（如“奶油风是什么”）..."
            className="flex-1 bg-white border border-[#e5e2da] focus:border-gold-500 focus:ring-2 focus:ring-gold-500/10 rounded-2xl px-4 py-3 text-xs outline-none transition-all placeholder:text-gray-400"
            disabled={analyzingRoom || analyzingTable || isGenerating}
            id="chat-input-field"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || analyzingRoom || analyzingTable || isGenerating}
            className="flex items-center justify-center p-3 rounded-xl bg-gold-500 hover:bg-gold-600 active:bg-amber-700 text-white disabled:opacity-40 disabled:hover:bg-gold-500 transition-all shadow-md shrink-0 cursor-pointer"
            id="chat-send-btn"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        {/* Small tips footer */}
        <div className="max-w-4xl mx-auto flex justify-between items-center mt-2 px-1 text-[9px] text-gray-400 font-mono">
          <p className="flex items-center gap-1">💡 提示：点击上方的样板间或上传按钮，AI 会带您一步步进行摆放！</p>
        </div>
      </div>
    </div>
  );
}
