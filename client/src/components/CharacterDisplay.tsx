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
import fiqahIdle from "@assets/generated_images/fiqah_-_zakat_and_asset_expert_idle.png";
import fiqahTalking from "@assets/generated_images/fiqah_-_zakat_and_asset_expert_talking.png";

interface CharacterDisplayProps {
  isTalking: boolean;
}

export function CharacterDisplay({ isTalking }: CharacterDisplayProps) {
  const [selectedChar, setSelectedChar] = useState<"sahabat" | "fiqah">("sahabat");

  const currentIdle = selectedChar === "sahabat" ? idleImage : fiqahIdle;
  const currentTalking = selectedChar === "sahabat" ? talkingImage : fiqahTalking;

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col items-center gap-2">
      <div className="md:w-64 md:h-64 w-40 h-40 relative pointer-events-none">
        <AnimatePresence mode="wait">
          {isTalking ? (
            <motion.img
              key={`talking-${selectedChar}`}
              src={currentTalking}
              alt="Character Talking"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 w-full h-full object-contain object-bottom character-glow"
            />
          ) : (
            <motion.img
              key={`idle-${selectedChar}`}
              src={currentIdle}
              alt="Character Idle"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 w-full h-full object-contain object-bottom drop-shadow-lg"
            />
          )}
        </AnimatePresence>
      </div>
      
      {/* Character Selection Dropdown positioned above the character for better visibility */}
      <div className="w-56 pointer-events-auto bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-secondary/20 p-1.5 ring-1 ring-black/5">
         <Select 
            value={selectedChar} 
            onValueChange={(val) => setSelectedChar(val as "sahabat" | "fiqah")}
         >
          <SelectTrigger className="w-full h-10 text-[11px] font-semibold bg-transparent border-none shadow-none focus:ring-0 text-secondary-foreground">
            <SelectValue placeholder="Select Specialization" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-secondary/20 bg-white/95 backdrop-blur-md">
            <SelectItem value="sahabat" className="text-xs focus:bg-primary/10 focus:text-primary">SahabatFiqh (General)</SelectItem>
            <SelectItem value="fiqah" className="text-xs focus:bg-primary/10 focus:text-primary">Fiqah (Zakat & Asset Expert)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
