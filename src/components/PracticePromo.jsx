import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, Puzzle, Code2, Sparkles, Database } from "lucide-react";
import { PromoGridSection } from "./MockTestPromo.jsx";

export default function PracticePromo() {
  const navigate = useNavigate();

  const cards = useMemo(
    () => [
      {
        key: "general",
        label: "General Practice",
        desc: "Pick a topic + difficulty (Quant/Logical/Verbal)",
        icon: Brain,
      },
      {
        key: "tech",
        label: "Tech Practice",
        desc: "Pick a topic (OOP/OS/CN/DBMS/DSA basics)",
        icon: Puzzle,
      },
      {
        key: "dsa",
        label: "DSA Practice",
        desc: "Topic-wise coding problems with hidden tests",
        icon: Code2,
      },
      {
        key: "sql",
        label: "SQL Practice",
        desc: "Choose a SQL topic like joins, group by, subqueries",
        icon: Database,
      },
      {
        key: "mixed",
        label: "Mixed Practice",
        desc: "General + Tech + DSA + SQL with topic-wise controls",
        icon: Sparkles,
      },
    ],
    []
  );

  return (
    <PromoGridSection
      id="practice-tests"
      title="Practice"
      subtitle="Topic-wise practice drills — choose pattern + difficulty and keep iterating."
      cards={cards}
      onCardClick={(c) =>
        navigate(`/start-practice-test?section=${encodeURIComponent(c.key)}`)
      }
    />
  );
}