import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([{ role: "model", text: "Hi! Ask me about phones, prices, delivery or returns." }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, open]);

  async function send(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    const next = [...msgs, { role: "user", text }];
    setMsgs(next); setInput(""); setBusy(true);
    try {
      // The greeting is UI-only; the API wants the conversation to start with the customer.
      const { reply } = await api.post("/chat", { messages: next.slice(1).slice(-10) });
      setMsgs([...next, { role: "model", text: reply }]);
    } catch {
      setMsgs([...next, { role: "model", text: "Sorry, I can't answer right now. Please message us on WhatsApp." }]);
    } finally { setBusy(false); }
  }

  return (
    <>
      {open && (
        <div className="tc-chat" role="dialog" aria-label="Chat with us">
          <div className="tc-chat-h">Ask us</div>
          <div className="tc-chat-b">
            {msgs.map((m, i) => <div key={i} className={m.role === "user" ? "me" : ""}>{m.text}</div>)}
            {busy && <div>…</div>}
            <span ref={end} />
          </div>
          <form onSubmit={send}>
            <label className="tc-vh" htmlFor="tc-chat-in">Your question</label>
            <input id="tc-chat-in" value={input} onChange={(e) => setInput(e.target.value)} maxLength={500} placeholder="Type your question" />
            <button className="tc-btn tc-btn-lime tc-btn-sm" disabled={busy}>Send</button>
          </form>
        </div>
      )}
      <button onClick={() => setOpen((o) => !o)} className="tc-btn tc-btn-lime tc-chat-btn">{open ? "Close" : "Chat"}</button>
    </>
  );
}
