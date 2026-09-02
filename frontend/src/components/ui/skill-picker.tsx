"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Command, Sparkles, Plus, X } from "lucide-react";

// Reusable across all modules (users, projects, etc.). Skills are stored as
// normalized lowercase strings so the same tag is reused everywhere.
export const SUGGESTED_SKILLS = [
  "javascript",
  "typescript",
  "react",
  "next.js",
  "node.js",
  "express",
  "python",
  "django",
  "java",
  "go",
  "rust",
  "sql",
  "postgresql",
  "mysql",
  "mongodb",
  "redis",
  "aws",
  "azure",
  "gcp",
  "docker",
  "kubernetes",
  "graphql",
  "rest api",
  "html",
  "css",
  "tailwindcss",
  "framer motion",
  "c++",
  "flutter",
  "react native",
  "vue",
  "angular",
  "sass",
  "figma",
  "ci/cd",
  "git",
  "testing",
  "machine learning",
  "tensorflow",
  "communication",
  "leadership",
];

export function normalizeSkill(skill: string): string {
  return skill.trim().toLowerCase().replace(/\s+/g, " ");
}

interface SkillPickerProps {
  value: string[];
  onChange: (skills: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function SkillPicker({
  value,
  onChange,
  placeholder = "type a skill then Enter…",
  className,
}: SkillPickerProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [debounced, setDebounced] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(() => new Set(value.map(normalizeSkill)), [value]);

  // Debounce the query (fake "load skills" latency, no backend round-trip).
  useEffect(() => {
    const id = setTimeout(() => {
      setDebounced(query);
      setActiveIndex(0);
    }, 250);
    return () => clearTimeout(id);
  }, [query]);

  const filtered = useMemo(() => {
    const q = normalizeSkill(debounced);
    if (!q) return SUGGESTED_SKILLS.slice(0, 8);
    return SUGGESTED_SKILLS.filter(
      (s) => !selected.has(s) && s.includes(q)
    ).slice(0, 8);
  }, [debounced, selected]);

  const canCreate =
    normalizeSkill(query).length > 0 &&
    !selected.has(normalizeSkill(query)) &&
    !filtered.some((s) => s === normalizeSkill(query));

  const add = (raw: string) => {
    const skill = normalizeSkill(raw);
    if (!skill || selected.has(skill)) return;
    onChange([...value, skill]);
    setQuery("");
    setOpen(false);
  };

  const remove = (skill: string) =>
    onChange(value.filter((s) => normalizeSkill(s) !== skill));

  const suggestions = canCreate
    ? [normalizeSkill(query), ...filtered]
    : filtered;

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-1.5">
        {value.map((skill) => (
          <span
            key={skill}
            className="inline-flex items-center gap-1 rounded-full border border-brand/30 bg-brand/5 px-2.5 py-1 text-[11px] font-medium text-text-primary"
          >
            {skill}
            <button
              type="button"
              aria-label={`Remove ${skill}`}
              onClick={() => remove(skill)}
              className="text-text-tertiary transition-colors hover:text-error"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>

      <div className="relative mt-1.5">
        <Command className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary" />
        <Input
          ref={inputRef}
          className="h-8 pl-8 text-[11px]"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              const pick = suggestions[activeIndex];
              if (pick) add(pick);
            } else if (e.key === "ArrowDown") {
              e.preventDefault();
              setActiveIndex((i) => Math.min(suggestions.length - 1, i + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActiveIndex((i) => Math.max(0, i - 1));
            } else if (e.key === "Backspace" && !query && value.length) {
              remove(value[value.length - 1]);
            }
          }}
        />

        <AnimatePresence>
          {open && suggestions.length > 0 && (
            <motion.ul
              initial={{ opacity: 0, y: 4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.98 }}
              transition={{ duration: 0.14, ease: [0.4, 0, 0.2, 1] }}
              className="absolute z-30 mt-1 w-full overflow-hidden rounded-md border border-border-base bg-surface shadow-lg"
            >
              {suggestions.map((skill, idx) => {
                const isCreate = idx === 0 && canCreate;
                return (
                  <li key={`${skill}-${idx}`}>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        add(skill);
                      }}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-[11px] transition-colors ${
                        idx === activeIndex ? "bg-brand/10 text-text-primary" : "text-text-secondary"
                      }`}
                    >
                      {isCreate ? (
                        <>
                          <Plus className="h-3 w-3 text-brand" />
                          Create &quot;{skill}&quot;
                        </>
                      ) : (
                        <Sparkles className="h-3 w-3 text-brand/60" />
                      )}
                      <span className="truncate">{skill}</span>
                    </button>
                  </li>
                );
              })}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}