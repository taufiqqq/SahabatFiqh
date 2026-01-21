import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import idleImage from "@assets/generated_images/muslim_cartoon_character_idle.png";
import talkingImage from "@assets/generated_images/muslim_cartoon_character_talking.png";
import fiqahIdle from "@assets/generated_images/muslim_girl_cartoon_character_idle.png";
import fiqahTalking from "@assets/generated_images/muslim_girl_cartoon_character_talking.png";

interface CharacterDisplayProps {
  isTalking: boolean;
}

export function CharacterDisplay({ isTalking }: CharacterDisplayProps) {
  const [selectedChar, setSelectedChar] = useState<"sahabat" | "fiqah">(
    "sahabat",
  );

  const currentIdle = selectedChar === "sahabat" ? idleImage : fiqahIdle;
  const currentTalking =
    selectedChar === "sahabat" ? talkingImage : fiqahTalking;

  return (
    <div className="fixed bottom-0 left-0 z-40 md:w-64 md:h-64 w-40 h-40 flex flex-col items-center">
      <div className="relative w-full h-full pointer-events-none">
        <AnimatePresence mode="wait">
          {isTalking ? (
            <motion.img
              key={`talking-${selectedChar}`}
              src={currentTalking}
              alt="Character Talking"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-0 left-4 w-full h-full object-contain object-bottom character-glow"
            />
          ) : (
            <motion.img
              key={`idle-${selectedChar}`}
              src={currentIdle}
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

      {/* Dropdown for Character Selection */}
      <div className="absolute -bottom-10 left-4 w-48 pointer-events-auto bg-white/90 backdrop-blur rounded-md shadow-md border border-border p-1">
        <Select
          value={selectedChar}
          onValueChange={(val) => setSelectedChar(val as "sahabat" | "fiqah")}
        >
          <SelectTrigger className="w-full h-8 text-xs">
            <SelectValue placeholder="Select Character" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sahabat">SahabatFiqh (General)</SelectItem>
            <SelectItem value="fiqah">Fiqah (Finance Expert)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
