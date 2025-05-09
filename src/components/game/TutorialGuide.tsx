import { motion } from "framer-motion";
import { X, ArrowRight } from "lucide-react";

type TutorialGuideProps = {
  step: number;
  onNextStep: () => void;
  onClose: () => void;
};

export default function TutorialGuide({ step, onNextStep, onClose }: TutorialGuideProps) {
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            <h3 className="text-lg font-medium mb-2 text-emerald-800 lowercase">welcome to neighborville</h3>
            <p className="text-gray-700 mb-4 lowercase">
              build and manage your own neighborhood by strategically placing buildings and keeping your residents happy
            </p>
            <div className="bg-emerald-50 p-3 rounded-lg mb-3">
              <h4 className="text-sm font-medium mb-1 text-emerald-700 lowercase">basics</h4>
              <ul className="text-sm space-y-1 text-gray-700 lowercase">
                <li>• select buildings from the menu and place them on the grid</li>
                <li>• each building costs coins but increases happiness</li>
                <li>• end each day to collect income from your buildings</li>
              </ul>
            </div>
          </>
        );
      case 2:
        return (
          <>
            <h3 className="text-lg font-medium mb-2 text-emerald-800 lowercase">resources & happiness</h3>
            <p className="text-gray-700 mb-2 lowercase">
              balance your coins and happiness to create the perfect neighborhood
            </p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-emerald-50 p-3 rounded-lg">
                <h4 className="text-sm font-medium mb-1 text-emerald-700 lowercase flex items-center">
                  <span className="mr-1">💰</span> coins
                </h4>
                <p className="text-xs text-gray-700">
                  used to build structures. earn more by ending each day
                </p>
              </div>
              <div className="bg-emerald-50 p-3 rounded-lg">
                <h4 className="text-sm font-medium mb-1 text-emerald-700 lowercase flex items-center">
                  <span className="mr-1">😊</span> happiness
                </h4>
                <p className="text-xs text-gray-700">
                  increases with certain buildings and good community decisions
                </p>
              </div>
            </div>
          </>
        );
      case 3:
        return (
          <>
            <h3 className="text-lg font-medium mb-2 text-emerald-800 lowercase">progression & events</h3>
            <p className="text-gray-700 mb-3 lowercase">
              your neighborhood will evolve over time through various systems
            </p>
            <div className="space-y-2 mb-4">
              <div className="bg-emerald-50 p-2 rounded-lg">
                <h4 className="text-sm font-medium text-emerald-700 lowercase">level system</h4>
                <p className="text-xs text-gray-700">gain experience and level up for rewards</p>
              </div>
              <div className="bg-emerald-50 p-2 rounded-lg">
                <h4 className="text-sm font-medium text-emerald-700 lowercase">achievements</h4>
                <p className="text-xs text-gray-700">complete special goals for bonus experience</p>
              </div>
              <div className="bg-emerald-50 p-2 rounded-lg">
                <h4 className="text-sm font-medium text-emerald-700 lowercase">events</h4>
                <p className="text-xs text-gray-700">respond to random neighborhood situations</p>
              </div>
            </div>
          </>
        );
      case 4:
        return (
          <>
            <h3 className="text-lg font-medium mb-2 text-emerald-800 lowercase">ready to build</h3>
            <p className="text-gray-700 mb-4 lowercase">
              you're all set to begin creating your perfect neighborhood
            </p>
            <div className="bg-emerald-50 p-3 rounded-lg mb-4">
              <h4 className="text-sm font-medium mb-1 text-emerald-700 lowercase">tips</h4>
              <ul className="text-sm space-y-1 text-gray-700 lowercase">
                <li>• start with income-generating buildings</li>
                <li>• balance between happiness and income</li>
                <li>• interact with neighbors to learn their preferences</li>
                <li>• save your game regularly using the save button</li>
              </ul>
            </div>
          </>
        );
      default:
        return null;
    }
  };

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
        className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl mx-4 relative"
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={18} />
        </button>
        
        <div className="mb-2 flex">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full mx-0.5 ${
                s <= step ? 'bg-emerald-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        
        {renderStepContent()}
        
        <div className="flex justify-end mt-4">
          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: "#059669" }}
            whileTap={{ scale: 0.95 }}
            onClick={onNextStep}
            className="flex items-center bg-emerald-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-emerald-700 transition-colors lowercase shadow-sm"
          >
            {step < 4 ? (
              <>
                next <ArrowRight size={16} className="ml-1" />
              </>
            ) : (
              'start playing'
            )}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}