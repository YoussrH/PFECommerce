'use client';

import React, { useState, useRef, useEffect } from 'react';
import useChatStore from '@/hooks/chatStore';
import styles from '@/Styles/ChatInterface.module.css';

const ChatInterface = () => {
  const [input, setInput] = useState('');
  const [image, setImage] = useState(null);
  const messages = useChatStore((state) => state.messages);
  const addMessage = useChatStore((state) => state.addMessage);
  const isLoading = useChatStore((state) => state.isLoading);
  const setLoading = useChatStore((state) => state.setLoading);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() && !image) return;

    const userMessage = { role: 'user', content: input, image };
    addMessage(userMessage);
    setLoading(true);
    setInput('');
    setImage(null);
    fileInputRef.current.value = '';

    const formData = new FormData();
    formData.append('message', input);
    if (image) {
      formData.append('image', image);
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/handleChat`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to get response from server');

      const { response: aiResponse } = await response.json();
      addMessage({ role: 'assistant', content: aiResponse });
    } catch (error) {
      addMessage({ role: 'assistant', content: 'Sorry, something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
    }
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.messages}>
        {messages.map((msg, index) => (
          <div key={index} className={`${styles.message} ${styles[msg.role]}`}>
            {msg.image && (
              <img
                src={URL.createObjectURL(msg.image)}
                alt="Uploaded"
                className={styles.uploadedImage}
              />
            )}
            <p>{msg.content}</p>
          </div>
        ))}
        {isLoading && <div className={styles.loading}>Loading...</div>}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className={styles.inputForm}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about a product or upload an image..."
          className={styles.input}
        />
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          ref={fileInputRef}
          className={styles.fileInput}
        />
        <button type="submit" disabled={isLoading} className={styles.sendButton}>
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatInterface;