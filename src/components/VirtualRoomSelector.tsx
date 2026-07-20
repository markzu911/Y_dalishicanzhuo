import { Check, Sparkles } from 'lucide-react';
import { virtualRooms } from '../data/virtualRooms';
import { VirtualRoom } from '../types';

interface VirtualRoomSelectorProps {
  selectedId: string | null;
  onSelect: (room: VirtualRoom) => void;
}

export default function VirtualRoomSelector({ selectedId, onSelect }: VirtualRoomSelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" id="virtual-room-grid">
      {virtualRooms.map((room) => {
        const isSelected = selectedId === room.id;
        return (
          <button
            key={room.id}
            onClick={() => onSelect(room)}
            className={`group relative flex flex-col text-left p-5 rounded-xl border transition-all duration-300 ${
              isSelected 
                ? 'border-gold-500 bg-white shadow-md ring-2 ring-gold-500/10' 
                : 'border-gray-100 bg-white hover:border-gold-200 hover:shadow-sm'
            }`}
          >
            {/* Selection indicator */}
            {isSelected && (
              <div className="absolute top-3 right-3 z-20 p-1 bg-gold-500 rounded-full text-white shadow-sm">
                <Check className="w-3 h-3" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-gray-900 truncate font-display">
                {room.name}
              </h4>
              <p className="text-[10px] text-gray-500 font-medium truncate uppercase tracking-wider mt-0.5">
                {room.englishName}
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className={`text-[10px] px-2 py-0.5 rounded font-medium border ${
                isSelected ? 'bg-gold-50 text-gold-600 border-gold-100' : 'bg-gray-50 text-gray-400 border-gray-100'
              }`}>
                {room.style}
              </span>
              {isSelected && (
                <span className="text-[10px] text-gold-600 font-bold tracking-tighter">SELECTED</span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
