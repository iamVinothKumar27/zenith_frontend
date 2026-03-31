import React, { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Hero from "./Hero/Hero";
import Services from "./Services/Services";
import MockTestPromo from "./MockTestPromo";
import PracticePromo from "./PracticePromo";
import Banner from "./Banner/Banner";
import Subscribe from "./Subscribe/Subscribe";
import Banner2 from "./Banner/Banner2";
function Home() {
  const location = useLocation();

  // ✅ allow navigation to "/#courses" from other pages
  useEffect(() => {
    const id = location.hash?.replace("#", "");
    if (!id) return;
    if (id === "courses" || id === "mock-tests" || id === "practice-tests") {
      const el = document.getElementById(id);
      if (el) {
        // small delay so layout is painted
        setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
      }
    }
  }, [location.hash]);

  return (
    <div>
        <main className="overflow-x-hidden bg-[var(--bg)] text-[var(--text)]">
      <Hero />
      <Services />
      <MockTestPromo />
      <PracticePromo />
      <Banner />
      <Subscribe />
      <Banner2 />
      
    </main>
    </div>
  )
}

export default Home