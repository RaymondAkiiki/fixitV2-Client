import React, { useState, useEffect } from "react";
import MessageThread from "../../components/MessageThread";
import * as messageService from "../../services/messageService";
import { useAuth } from "../../contexts/AuthContext";

const MessagePage = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // For demo, fetch all messages for the user; in production, filter by conversation
  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const res = await messageService.getMessages();
        setMessages(res.data);
      } catch {
        // handle error as needed
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, []);

  const sendMessage = async e => {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    try {
      const res = await messageService.sendMessage({ content: input });
      setMessages(msgs => [...msgs, res.data]);
      setInput("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <h2>Messages</h2>
      <MessageThread messages={messages} userId={user?._id} />
      <form onSubmit={sendMessage} style={{ marginTop: "1rem", display: "flex", gap: "1rem" }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          style={{ flex: 1, padding: 10 }}
          placeholder="Type your message..."
        />
        <button type="submit" disabled={loading} style={{ padding: "10px 20px" }}>
          Send
        </button>
      </form>
    </div>
  );
};

export default MessagePage;