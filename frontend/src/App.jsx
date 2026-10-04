import { useState, useRef, useEffect } from "react";

const LEVELS = [
  { name: "Nudge", note: "A question to redirect your thinking" },
  { name: "Hint", note: "A concept or technique worth revisiting" },
  { name: "Strong hint", note: "Narrows down where the bug lives" },
];

const SAMPLE = `def two_sum(nums, target):
    seen = {}
    for i, x in enumerate(nums):
        if target - x in seen:
            return [seen[x], i]
        seen[x] = i
    return []`;

const CHIPS = ["Is my complexity okay?", "Just give me the solution"];

export default function App() {
  const [problem, setProblem] = useState(
    "Given an array of integers and a target, return the indices of the two numbers that add up to the target."
  );
  const [code, setCode] = useState(SAMPLE);
  const [lang, setLang] = useState("Python");
  const [level, setLevel] = useState(0);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [msgs, setMsgs] = useState([
    {
      role: "mentor",
      text: "Paste your problem and your attempt on the left. I'll ask questions until you spot the bug yourself. What's going wrong?",
    },
  ]);
  const end = useRef(null);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, busy]);

  async function send(text) {
    const t = text.trim();
    if (!t || busy) return;
    
    setInput("");
    
    // 1. Add user message to UI immediately
    const updatedMsgs = [...msgs, { role: "you", text: t }];
    setMsgs(updatedMsgs);
    setBusy(true);

    try {
      // 2. Format the message history to match your FastAPI contract
      const backendMessages = updatedMsgs.map((m) => ({
        role: m.role === "you" ? "user" : "assistant",
        content: m.text
      }));

      // 3. Call the LangGraph backend
      const response = await fetch("https://algo-whisperer-backend.onrender.com/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem_description: problem,
          user_code: code,
          messages: backendMessages,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // 4. Add the AI's response to the UI
      setMsgs((m) => [...m, { role: "mentor", text: data.reply, level }]);
    } catch (error) {
      console.error("Backend connection error:", error);
      setMsgs((m) => [...m, { role: "mentor", text: "⚠️ Error: Could not reach the FastAPI backend. Make sure Uvicorn is running.", level }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen lg:h-screen flex flex-col bg-[#eef1f6] text-[#1b2340]">
      <header className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 border-b border-[#d5dbe8] bg-white">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#4f46c8] font-bold text-white">?</div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">Socrates</h1>
            <p className="text-xs text-[#5b6485]">A mentor that asks, never tells</p>
          </div>
        </div>
        <div className="flex gap-2 text-xs text-[#5b6485]">
          <span className="rounded-full border border-[#d5dbe8] px-3 py-1">Gemma 2 + LangGraph</span>
          <span className="rounded-full border border-[#d5dbe8] px-3 py-1">Hacktoberfest 2026</span>
        </div>
      </header>

      <main className="grid flex-1 gap-4 p-4 lg:min-h-0 lg:grid-cols-2">
        {/* Workspace */}
        <section className="flex flex-col gap-3 rounded-xl border border-[#d5dbe8] bg-white p-4 lg:min-h-0">
          <label className="text-sm font-medium" htmlFor="problem">Problem statement</label>
          <textarea
            id="problem"
            rows={3}
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            className="resize-none rounded-lg border border-[#d5dbe8] bg-[#f7f8fb] p-3 text-sm outline-none focus:border-[#4f46c8] focus:ring-2 focus:ring-[#4f46c8]/20"
          />
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium" htmlFor="code">Your attempt</label>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="rounded-md border border-[#d5dbe8] bg-white px-2 py-1 text-xs"
            >
              {["Python", "C++", "Java", "JavaScript"].map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </div>
          <textarea
            id="code"
            spellCheck={false}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="min-h-[220px] flex-1 resize-none rounded-lg border border-[#d5dbe8] bg-[#f7f8fb] p-3 font-mono text-[13px] leading-6 outline-none focus:border-[#4f46c8] focus:ring-2 focus:ring-[#4f46c8]/20"
          />

          {/* Hint ladder: the memorable part. Step 4 never unlocks. */}
          <div>
            <p className="mb-2 text-sm font-medium">How much help?</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {LEVELS.map((l, i) => (
                <button
                  key={l.name}
                  onClick={() => setLevel(i)}
                  aria-pressed={level === i}
                  className={`rounded-lg border px-3 py-2 text-left text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46c8] ${
                    level === i
                      ? "border-[#4f46c8] bg-[#4f46c8] text-white"
                      : "border-[#d5dbe8] bg-white hover:border-[#4f46c8]"
                  }`}
                >
                  {l.name}
                </button>
              ))}
              <div
                title="Full solutions are never given"
                className="flex items-center gap-1.5 rounded-lg border border-dashed border-[#b9c1d6] bg-[#f1f3f8] px-3 py-2 text-sm text-[#8790ab]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="4" y="11" width="16" height="10" rx="2" />
                  <path d="M8 11V7a4 4 0 018 0v4" />
                </svg>
                Solution
              </div>
            </div>
            <p className="mt-2 text-xs text-[#5b6485]">{LEVELS[level].note}. The full solution stays locked.</p>
          </div>
        </section>

        {/* Conversation */}
        <section className="flex min-h-[420px] flex-col rounded-xl border border-[#d5dbe8] bg-white lg:min-h-0">
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === "you" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    m.role === "you"
                      ? "rounded-br-sm bg-[#1b2340] text-white"
                      : "rounded-bl-sm border border-[#d9d6f5] bg-[#f1f0fc]"
                  }`}
                >
                  {m.role === "mentor" && m.level !== undefined && (
                    <p className="mb-1 text-xs font-medium text-[#4f46c8]">{LEVELS[m.level].name}</p>
                  )}
                  {m.text}
                </div>
              </div>
            ))}
            {busy && (
              <p className="text-sm text-[#5b6485]" aria-live="polite">Socrates is thinking of a good question…</p>
            )}
            <div ref={end} />
          </div>

          <div className="border-t border-[#d5dbe8] p-3">
            <div className="mb-2 flex flex-wrap gap-2">
              {CHIPS.map((c) => (
                <button
                  key={c}
                  onClick={() => send(c)}
                  className="rounded-full border border-[#d5dbe8] px-3 py-1 text-xs text-[#5b6485] hover:border-[#4f46c8] hover:text-[#4f46c8]"
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send(input)}
                placeholder="Describe what you've tried or where you're stuck"
                className="flex-1 rounded-lg border border-[#d5dbe8] bg-[#f7f8fb] px-3 py-2 text-sm outline-none focus:border-[#4f46c8] focus:ring-2 focus:ring-[#4f46c8]/20"
              />
              <button
                onClick={() => send(input)}
                disabled={busy || !input.trim()}
                className="rounded-lg bg-[#4f46c8] px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
              >
                Ask
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}