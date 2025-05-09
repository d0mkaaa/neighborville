import type { EventOption, GameEvent } from "../../types/game";
import { motion } from "framer-motion";

type EventModalProps = {
  event: GameEvent;
  onOptionSelect: (option: EventOption) => void;
};

export default function EventModal({ event, onOptionSelect }: EventModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.3)" }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 20 }}
        className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl mx-4"
      >
        <h2 className="text-xl font-medium mb-3 lowercase text-emerald-800">{event.title}</h2>
        <p className="mb-6 lowercase">{event.description}</p>
        
        <div className="space-y-3">
          {event.options.map((option, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.02, backgroundColor: "#f0fdf4" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onOptionSelect(option)}
              className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-emerald-50 rounded-lg transition-colors lowercase"
            >
              {option.text.toLowerCase()}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}