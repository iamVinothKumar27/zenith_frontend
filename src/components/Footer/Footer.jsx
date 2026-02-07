import React, { useState } from "react";
import { FaFacebook, FaInstagram, FaWhatsapp, FaYoutube } from "react-icons/fa";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const Footer = () => {
  const navigate = useNavigate();
  const [footerEmail, setFooterEmail] = useState("");

  const goCourses = () => navigate("/#courses");
  const go = (path) => navigate(path);

  const onEmailSubmit = (e) => {
    e.preventDefault();
    const email = (footerEmail || "").trim();
    if (email) {
      navigate(`/contact?email=${encodeURIComponent(email)}`);
    } else {
      navigate("/contact");
    }
  };

  return (
    <footer className="py-20 bg-[var(--footer)] border-t border-[var(--border)]">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        className="container"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-14 md:gap-4">
          {/* first section */}
          <div className="space-y-4 max-w-[300px]">
            <h1 className="text-2xl font-bold text-[var(--text)]">Zenith</h1>
            <p className="text-[var(--muted)]">
              Zenith is a platform dedicated to empowering aspiring developers.
              From beginner tutorials to advanced programming concepts, we
              provide a comprehensive learning experience designed to help you
              master coding skills, build projects, and launch your tech career.
            </p>
          </div>

          {/* second section */}
          <div className="grid grid-cols-2 gap-10">
            <div className="space-y-4">
              <h1
                className="text-2xl font-bold text-[var(--text)] cursor-pointer hover:text-[var(--accent)] duration-200"
                onClick={goCourses}
              >
                Courses
              </h1>
              <div className="text-[var(--muted)]">
                <ul className="space-y-2 text-lg">
                  <li
                    className="cursor-pointer hover:text-[var(--accent)] duration-200"
                    onClick={goCourses}
                  >
                    Web Development
                  </li>
                  <li
                    className="cursor-pointer hover:text-[var(--accent)] duration-200"
                    onClick={goCourses}
                  >
                    Software Development
                  </li>
                  <li
                    className="cursor-pointer hover:text-[var(--accent)] duration-200"
                    onClick={goCourses}
                  >
                    Apps Development
                  </li>
                  <li
                    className="cursor-pointer hover:text-[var(--accent)] duration-200"
                    onClick={goCourses}
                  >
                    E-learning
                  </li>
                </ul>
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-2xl font-bold text-[var(--text)]">Links</h1>
              <div className="text-[var(--muted)]">
                <ul className="space-y-2 text-lg">
                  <li
                    className="cursor-pointer hover:text-[var(--accent)] duration-200"
                    onClick={() => go("/")}
                  >
                    Home
                  </li>
                  <li
                    className="cursor-pointer hover:text-[var(--accent)] duration-200"
                    onClick={() => go("/services")}
                  >
                    Services
                  </li>
                  <li
                    className="cursor-pointer hover:text-[var(--accent)] duration-200"
                    onClick={() => go("/notes")}
                  >
                    Notes
                  </li>
                  <li
                    className="cursor-pointer hover:text-[var(--accent)] duration-200"
                    onClick={() => go("/contact")}
                  >
                    Contact
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* third section */}
          <div className="space-y-4 max-w-[300px]">
            <h1 className="text-2xl font-bold text-[var(--text)]">Get In Touch</h1>

            <form onSubmit={onEmailSubmit} className="flex items-center">
              <input
                type="email"
                value={footerEmail}
                onChange={(e) => setFooterEmail(e.target.value)}
                placeholder="Enter your email"
                className="p-3 rounded-s-xl bg-[var(--bg)] border border-[var(--border)] w-full py-4 focus:ring-0 focus:outline-none placeholder:text-[var(--muted)] text-[var(--text)]"
              />
              <button
                type="submit"
                className="bg-[var(--accent)] hover:bg-[var(--accent-2)] text-white font-semibold py-4 px-6 rounded-e-xl"
              >
                Go
              </button>
            </form>

            {/* social icons */}
            <div className="flex space-x-6 py-3">
              <a href="https://chat.whatsapp.com/" target="_blank" rel="noreferrer">
                <FaWhatsapp className="cursor-pointer hover:text-[var(--accent)] hover:scale-105 duration-200" />
              </a>
              <a href="https://www.instagram.com/" target="_blank" rel="noreferrer">
                <FaInstagram className="cursor-pointer hover:text-[var(--accent)] hover:scale-105 duration-200" />
              </a>
              <a href="https://www.facebook.com/" target="_blank" rel="noreferrer">
                <FaFacebook className="cursor-pointer hover:text-[var(--accent)] hover:scale-105 duration-200" />
              </a>
              <a href="https://www.youtube.com/" target="_blank" rel="noreferrer">
                <FaYoutube className="cursor-pointer hover:text-[var(--accent)] hover:scale-105 duration-200" />
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </footer>
  );
};

export default Footer;
