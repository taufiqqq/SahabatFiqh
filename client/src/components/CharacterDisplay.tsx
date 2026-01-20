import { motion, AnimatePresence } from "framer-motion";
import idleImage from "@assets/generated_images/muslim_cartoon_character_idle.png";
import talkingImage from "@assets/generated_images/muslim_cartoon_character_talking.png";

interface CharacterDisplayProps {
  isTalking: boolean;
}

export function CharacterDisplay({ isTalking }: CharacterDisplayProps) {
  return (
    <div className="fixed bottom-0 left-0 z-40 pointer-events-none md:w-64 md:h-64 w-40 h-40">
      <div className="relative w-full h-full">
        <AnimatePresence mode="wait">
          {isTalking ? (
            <motion.img
              key="talking"
              src={talkingImage}
              alt="Character Talking"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-0 left-4 w-full h-full object-contain object-bottom character-glow"
            />
          ) : (
            <motion.img
              key="idle"
              src={idleImage}
              alt="Character Idle"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-0 left-4 w-full h-full object-contain object-bottom drop-shadow-lg"
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
