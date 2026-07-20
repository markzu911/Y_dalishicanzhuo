export interface RoomAnalysis {
  style: string;
  furniture: string;
  spaceAndLight: string;
  suggestedLocation: string;
}

export interface TableAnalysis {
  shape: string;
  marbleDetails: string;
  legsAndBase: string;
  vibe: string;
}

export type ViewParam = '远景' | '中近景' | '近景';
export type ResolutionParam = '1k' | '2k' | '4k';
export type AspectRatioParam = '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
export type ModelGenderParam = '男' | '女';
export type ModelAgeParam = '青年' | '中年' | '老年';

export interface VirtualRoom {
  id: string;
  name: string;
  englishName: string;
  style: string;
  image: string;
  analysis: RoomAnalysis;
}

export type FlowStep = 'UPLOAD_ROOM' | 'UPLOAD_TABLE' | 'CONFIGURE_PARAMS' | 'GENERATED_RESULT';

export interface HistoryItem {
  id: string;
  image: string;
  viewParam: ViewParam;
  resolution: ResolutionParam;
  aspectRatio: AspectRatioParam;
  addModel: boolean;
  modelGender?: ModelGenderParam;
  modelAgeGroup?: ModelAgeParam;
  timestamp: string;
}

