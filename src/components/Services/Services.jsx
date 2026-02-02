import React from "react";
import { useNavigate } from "react-router-dom"; 
import { RiComputerLine, RiComputerFill } from "react-icons/ri";
import { CiMobile3 } from "react-icons/ci";
import { TbWorldWww } from "react-icons/tb";
import { IoPulseOutline } from "react-icons/io5";
import { GrCloudComputer } from "react-icons/gr";
import { motion } from "framer-motion";

const ServicesData = [
  { id: 1, title: "Web Development", icon: <TbWorldWww />, blog: "https://www.geeksforgeeks.org/web-tech/web-technology/" },
  { id: 2, title: "Mobile Development", icon: <CiMobile3 />, blog:"https://www.geeksforgeeks.org/android/android-tutorial/" },
  { id: 3, title: "Data Structures", icon: <RiComputerLine />, blog:"https://www.geeksforgeeks.org/dsa/dsa-tutorial-learn-data-structures-and-algorithms/" },
  { id: 4, title: "Machine Learning", icon: <GrCloudComputer />, blog:"https://www.geeksforgeeks.org/machine-learning/machine-learning/" },
  { id: 5, title: "Object Oriented Programming", icon: <IoPulseOutline />, blog:"https://www.geeksforgeeks.org/dsa/introduction-of-object-oriented-programming/" },
  { id: 6, title: "Artificial Intelligence", icon: <RiComputerFill />, blog:"https://www.geeksforgeeks.org/artificial-intelligence/artificial-intelligence/" },
  { id: 7, title: "Other Domains", icon: <RiComputerFill /> },
];

const SlideLeft = (delay) => ({
  initial: { opacity: 0, x: 50 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3, delay, ease: "easeInOut" } },
});

const Services = () => {
  const navigate = useNavigate();

  return (
    <section id="courses" className="bg-[var(--bg)] text-[var(--text)]">
      <div className="container pb-14 pt-16">
        <h1 className="text-4xl font-bold text-left pb-10 text-[var(--text)]">Courses we provide</h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-8">
          {ServicesData.map((service, i) => (
            <motion.div
              key={service.id}
              variants={SlideLeft(i * 0.1)}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              onClick={() => navigate(`/course/${service.title}/form`, { state: { title: service.title } })}
              className="cursor-pointer bg-[var(--card)] border border-[var(--border)] rounded-2xl flex flex-col gap-4 items-center justify-center p-4 py-7 hover:scale-110 duration-300 hover:shadow-2xl"
            >
              <div className="text-4xl mb-4 text-[var(--text)]">{service.icon}</div>
              <h1 className="text-lg font-semibold text-center px-3">{service.title}</h1>
              {service.blog && (
                <a
                  href={service.blog}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="bg-[var(--accent)] text-white px-4 py-2 rounded-lg hover:bg-[var(--accent-2)] transition"
                >
                  Refer blog
                </a>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
