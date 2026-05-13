import { useEffect, useState } from "react";
import { MessageSquareText, Send, ShieldAlert } from "lucide-react";
import axios from "../../api/axios";

function ConvenorMessages() {
  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [activeThread, setActiveThread] = useState(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadThreads = async (preferredId = null) => {
    try {
      const response = await axios.get("/support/convenor/threads");
      const rows = response.data || [];
      setThreads(rows);

      const id = preferredId || activeThreadId || rows[0]?.id;
      if (id) {
        await loadThread(id);
      } else {
        setActiveThreadId(null);
        setActiveThread(null);
      }
    } catch (loadError) {
      setError(loadError.response?.data?.message || "Failed to load message threads");
    }
  };

  const loadThread = async (threadId) => {
    try {
      const response = await axios.get(`/support/convenor/threads/${threadId}/messages`);
      setActiveThread(response.data || null);
      setActiveThreadId(threadId);
      await axios.post("/support/convenor/notifications/read");
    } catch (loadError) {
      setError(loadError.response?.data?.message || "Failed to load chat messages");
    }
  };

  useEffect(() => {
    loadThreads();
  }, []);

  const submitQuestion = async (event) => {
    event.preventDefault();
    if (!message.trim()) {
      setError("Please enter your question message");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await axios.post("/support/convenor/questions", {
        subject: subject.trim(),
        message: message.trim(),
      });
      setSubject("");
      setMessage("");
      await loadThreads();
    } catch (submitError) {
      setError(submitError.response?.data?.message || "Failed to send question");
    } finally {
      setLoading(false);
    }
  };

  const submitReply = async (event) => {
    event.preventDefault();
    if (!activeThreadId || !reply.trim()) return;

    try {
      setLoading(true);
      setError("");
      await axios.post(`/support/convenor/threads/${activeThreadId}/messages`, {
        message: reply.trim(),
      });
      setReply("");
      await loadThread(activeThreadId);
      await loadThreads(activeThreadId);
    } catch (replyError) {
      setError(replyError.response?.data?.message || "Failed to send reply");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="conv-page">
      <section className="conv-card">
        <div className="conv-panel-header">
          <div>
            <p className="conv-kicker">Message Admin</p>
            <h1 className="conv-panel-title">Support Chat</h1>
            <p className="conv-panel-subtitle">Ask questions and follow admin responses.</p>
          </div>
          <span className="conv-chip">
            <MessageSquareText className="h-3.5 w-3.5" />
            Live Threads
          </span>
        </div>

        {error && (
          <p className="rounded-xl border border-[#f2d4d8] bg-[#fff5f7] px-3 py-2 text-sm text-[#af4d5e]">
            <ShieldAlert className="mr-1 inline h-3.5 w-3.5" /> {error}
          </p>
        )}

        <div className="conv-two-col">
          <article className="conv-card">
            <h2 className="conv-panel-title small">Create New Question</h2>
            <form onSubmit={submitQuestion} className="conv-stack">
              <label className="conv-field">
                <span className="conv-label">Subject (optional)</span>
                <input
                  className="conv-input"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder="Example: Group contribution mismatch"
                />
              </label>

              <label className="conv-field">
                <span className="conv-label">Message</span>
                <textarea
                  className="conv-textarea"
                  rows={5}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Describe your question here..."
                />
              </label>

              <button className="conv-btn primary" type="submit" disabled={loading}>
                <Send className="h-4 w-4" /> {loading ? "Sending..." : "Submit Question"}
              </button>
            </form>
          </article>

          <article className="conv-card">
            <h2 className="conv-panel-title small">Message Threads</h2>
            <div className="conv-stack" style={{ maxHeight: 380, overflowY: "auto" }}>
              {threads.length === 0 && (
                <p className="conv-empty subtle">No threads yet.</p>
              )}
              {threads.map((thread) => (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => loadThread(thread.id)}
                  className="conv-modal-item"
                  style={{
                    textAlign: "left",
                    borderColor:
                      thread.id === activeThreadId ? "#94b5df" : "#dce6f5",
                    background: thread.id === activeThreadId ? "#eef5ff" : "#ffffff",
                  }}
                >
                  <h3>{thread.subject}</h3>
                  <p>Status: {thread.status} · Unread: {thread.unreadCount || 0}</p>
                </button>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="conv-card">
        <div className="conv-panel-header compact">
          <div>
            <p className="conv-kicker">Conversation</p>
            <h2 className="conv-panel-title small">{activeThread?.subject || "Select a thread"}</h2>
          </div>
        </div>

        {!activeThread && <p className="conv-empty subtle">Select a thread to view messages.</p>}

        {activeThread && (
          <>
            <div className="conv-stack" style={{ maxHeight: 360, overflowY: "auto" }}>
              {(activeThread.messages || []).map((entry) => (
                <article key={entry.id} className="conv-modal-item">
                  <h3>{entry.senderName} ({entry.senderRole})</h3>
                  <p>{entry.message}</p>
                  <p>{new Date(entry.createdAt).toLocaleString("en-GB")}</p>
                </article>
              ))}
            </div>

            <form onSubmit={submitReply} className="conv-stack" style={{ marginTop: "0.7rem" }}>
              <label className="conv-field">
                <span className="conv-label">Reply</span>
                <textarea
                  className="conv-textarea"
                  rows={3}
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  placeholder="Write your follow-up..."
                />
              </label>
              <button className="conv-btn primary" type="submit" disabled={loading || !reply.trim()}>
                <Send className="h-4 w-4" /> Send Reply
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}

export default ConvenorMessages;
