import React from "react";
import { IoIosArrowRoundForward } from "react-icons/io";
import heroPng from "../../assets/hero.png";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider"; // ✅ adjust path if needed

// Named export used by Banner and other sections
export const FadeUp = (delay) => ({
  initial: { opacity: 0, y: 50 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      duration: 0.5,
      delay,
      ease: "easeInOut",
    },
  },
});

const Hero = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // ✅ logged-in user

  const handleGetStarted = () => {
    if (user) {
      navigate("/#courses");     // ✅ home page courses section/page
    } else {
      navigate("/login");       // ✅ redirect to login
    }
  };

  return (
    <section className="bg-[var(--bg)] text-[var(--text)]">
      <div className="container grid grid-cols-1 md:grid-cols-2 min-h-[650px] relative">

        {/* Brand Info */}
        <div className="flex flex-col justify-center py-14 md:py-0 relative z-10">
          <div className="text-center md:text-left space-y-10 lg:max-w-[520px]">

            <motion.h1
              variants={FadeUp(0.6)}
              initial="initial"
              animate="animate"
              className="text-5xl lg:text-6xl font-bold leading-tight"
            >
              Let's Learn to
              <span className="text-[var(--accent)]"> Become a Developer</span>
              <span className="text-[var(--text)]"> and Enhance your code</span>
            </motion.h1>

            <motion.div
              variants={FadeUp(1.0)}
              initial="initial"
              animate="animate"
              className="flex justify-center md:justify-start"
            >
              <button
                onClick={handleGetStarted}
                className="primary-btn flex items-center gap-2 group"
              >
                Get Started
                <IoIosArrowRoundForward className="text-2xl group-hover:translate-x-2 group-hover:-rotate-45 duration-300" />
              </button>
            </motion.div>

          </div>
        </div>

        {/* Hero Image */}
        <div className="flex justify-center items-center">
          <motion.img
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeInOut" }}
            src={heroPng}
            alt="hero"
            className="w-full max-w-[400px] xl:max-w-[600px] relative z-10 drop-shadow"
          />
        </div>

      </div>
    </section>
  );
};

export default Hero;
