import type { EventOption, GameEvent } from "../../types/game";

type EventModalProps = {
  event: GameEvent;
  onOptionSelect: (option: EventOption) => void;
};

export default function EventModal({ event, onOptionSelect }: EventModalProps) {
  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h2 className="text-xl font-bold mb-3 font-game text-indigo-800">{event.title}</h2>
        <p className="mb-6 font-game">{event.description}</p>
        
        <div className="space-y-3">
          {event.options.map((option, index) => (
            <button
              key={index}
              onClick={() => onOptionSelect(option)}
              className="w-full text-left px-4 py-3 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors font-game"
            >
              {option.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}