import { AnimatePresence, motion } from "framer-motion"

export default function PoeticText({ text }) {
  return (
    <div className="poetic-text-overlay">
      <AnimatePresence mode="wait">
        <motion.div
          key={text}
          initial={{
            opacity: 0,
            filter: "blur(16px)",
            scale: 0.9,
            y: 10,
          }}
          animate={{
            opacity: 1,
            filter: "blur(0px)",
            scale: 1,
            y: 0,
          }}
          exit={{
            opacity: 0,
            filter: "blur(20px)",
            scale: 1.1,
            y: -10,
          }}
          transition={{
            duration: 1.2,
            ease: [0.16, 1, 0.3, 1],
          }}
          style={{
            fontFamily: '"Cinzel", "Playfair Display", "Noto Serif SC", serif',
            fontSize: "2.2rem",
            fontWeight: 500,
            letterSpacing: "0.15em",
            lineHeight: 1.65,
            textAlign: "center",
            whiteSpace: "pre-line",
            background: "linear-gradient(135deg, #fff0f5 0%, #ffd1dc 40%, #fbe7c6 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textShadow: "0 0 15px rgba(255, 192, 203, 0.6), 0 0 30px rgba(251, 231, 198, 0.4)",
            filter: "drop-shadow(0 0 8px rgba(255, 182, 193, 0.5))",
          }}
        >
          {text}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
