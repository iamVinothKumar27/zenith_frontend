import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaFacebook, FaInstagram, FaWhatsapp, FaYoutube, FaTwitter, FaLinkedin } from "react-icons/fa";
import { Mail, MapPin, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const COURSES = ["Web Development", "Mobile Development", "Data Structures", "Machine Learning", "OOP Concepts", "Artificial Intelligence"];
const LINKS = [
  { label: "Home", path: "/" },
  { label: "Services", path: "/services" },
  { label: "My Courses", path: "/my-courses" },
  { label: "Notes", path: "/notes" },
  { label: "Contact", path: "/contact" },
  { label: "Profile", path: "/profile" },
];
const SOCIALS = [
  { icon: FaWhatsapp, href: "https://chat.whatsapp.com/", label: "WhatsApp", color: "hover:text-green-400" },
  { icon: FaInstagram, href: "https://www.instagram.com/", label: "Instagram", color: "hover:text-pink-400" },
  { icon: FaFacebook, href: "https://www.facebook.com/", label: "Facebook", color: "hover:text-blue-400" },
  { icon: FaYoutube, href: "https://www.youtube.com/", label: "YouTube", color: "hover:text-red-400" },
  { icon: FaTwitter, href: "https://twitter.com/", label: "Twitter", color: "hover:text-sky-400" },
  { icon: FaLinkedin, href: "https://linkedin.com/", label: "LinkedIn", color: "hover:text-blue-300" },
];

const Footer = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  const onSubmit = (e) => {
    e.preventDefault();
    const val = email.trim();
    navigate(val ? `/contact?email=${encodeURIComponent(val)}` : "/contact");
  };

  return (
    <footer style={{ background: "#0B0F1A", color: "#CBD5E1" }}>
      {/* Main Footer */}
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl grid place-items-center text-white text-sm font-bold"
                style={{ background: "var(--grad)" }}>Z</div>
              <span className="text-xl font-bold text-white">Zenith</span>
            </Link>
            <p className="text-sm leading-relaxed text-slate-400 mb-6">
              Zenith is a premium e-learning platform dedicated to empowering developers — from first line of code to career launch.
            </p>
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
              <Mail className="w-4 h-4 text-indigo-400" />
              <a href="mailto:support@zenithlearning.site" className="hover:text-white transition-colors">
                support@zenithlearning.site
              </a>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <MapPin className="w-4 h-4 text-indigo-400" />
              <span>Global · Remote First</span>
            </div>
          </div>

          {/* Courses */}
          <div>
            <h4 className="text-white font-semibold mb-5 text-sm uppercase tracking-wider">Courses</h4>
            <ul className="space-y-2.5">
              {COURSES.map((c) => (
                <li key={c}>
                  <button
                    onClick={() => navigate(`/course/${c}/form`, { state: { title: c } })}
                    className="text-sm text-slate-400 hover:text-indigo-400 transition-colors flex items-center gap-1.5 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-slate-600 group-hover:bg-indigo-400 transition-colors" />
                    {c}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-5 text-sm uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2.5">
              {LINKS.map((l) => (
                <li key={l.path}>
                  <Link
                    to={l.path}
                    className="text-sm text-slate-400 hover:text-indigo-400 transition-colors flex items-center gap-1.5 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-slate-600 group-hover:bg-indigo-400 transition-colors" />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-white font-semibold mb-5 text-sm uppercase tracking-wider">Stay Updated</h4>
            <p className="text-sm text-slate-400 mb-4">
              Get the latest courses and updates delivered to your inbox.
            </p>
            <form onSubmit={onSubmit} className="flex gap-0 mb-6">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 px-4 py-2.5 text-sm bg-white/5 border border-white/10 rounded-l-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:bg-white/8 transition-all"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-r-xl text-white text-sm font-semibold hover:brightness-110 transition-all"
                style={{ background: "var(--grad)" }}
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Social Icons */}
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Follow Us</p>
              <div className="flex gap-3 flex-wrap">
                {SOCIALS.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className={`w-9 h-9 rounded-xl bg-white/5 border border-white/10 grid place-items-center text-slate-400 ${s.color} hover:border-white/20 hover:bg-white/10 transition-all duration-200`}
                  >
                    <s.icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="container py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} Zenith Learning. All rights reserved.
          </p>
          <div className="flex gap-4 text-xs text-slate-500">
            <Link to="/" className="hover:text-indigo-400 transition-colors">Privacy Policy</Link>
            <Link to="/" className="hover:text-indigo-400 transition-colors">Terms of Service</Link>
            <Link to="/contact" className="hover:text-indigo-400 transition-colors">Support</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
