import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Smile,
  Paperclip,
  X,
  Image,
  File,
  Mic,
  MicOff,
} from 'lucide-react';
import { chatUtils } from '../../services/chatService';

interface MessageInputProps {
  onSendMessage: (content: string, replyTo?: string) => Promise<void> | void;
  placeholder?: string;
  disabled?: boolean;
  replyTo?: {
    id: string;
    content: string;
    sender: string;
  };
  onCancelReply?: () => void;
}

const EMOJI_LIST = [
  '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂',
  '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛',
  '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏',
  '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫',
  '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳',
  '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭',
  '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧',
  '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢',
  '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹',
  '👍', '👎', '👏', '🙌', '👌', '✌️', '🤞', '🤟', '🤘', '🤙',
  '❤️', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️',
  '💯', '💫', '⭐', '🌟', '✨', '💥', '🔥', '⚡', '💎', '💰',
];

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  placeholder = 'Type a message...',
  disabled = false,
  replyTo,
  onCancelReply,
}) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const maxLength = 1000;

  useEffect(() => {
    setCharCount(message.length);
  }, [message]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [message]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSend = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled || isSending) return;

    const validation = chatUtils.validateMessageContent(trimmedMessage);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid message content');
      setTimeout(() => setError(null), 3000);
      return;
    }

    setIsSending(true);
    setError(null);
    
    try {
      await onSendMessage(trimmedMessage, replyTo?.id);
      
      setMessage('');
      setCharCount(0);
      
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.focus();
      }
    } catch (error: any) {
      console.error('Error in message input:', error);
      
      if (error?.message?.includes('Message blocked:')) {
        setError(error.message);
      } else if (error?.message?.includes('Edit blocked:')) {
        setError(error.message);
      } else {
        setError('Failed to send message. Please try again.');
      }
      
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newMessage = message.substring(0, start) + emoji + message.substring(end);
      
      if (newMessage.length <= maxLength) {
        setMessage(newMessage);
        
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
          textarea.focus();
        }, 0);
      }
    }
    setShowEmojiPicker(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      console.log('File selected:', files[0]);
    }
    setShowAttachmentMenu(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      console.log('Image selected:', files[0]);
    }
    setShowAttachmentMenu(false);
  };

  const startRecording = () => {
    setIsRecording(true);
  };

  const stopRecording = () => {
    setIsRecording(false);
  };

  return (
    <div className="relative">
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute -top-2 left-0 right-0 z-10 transform -translate-y-full"
          >
            <div className="mx-3 mb-2 p-3 bg-red-50 border border-red-200 rounded-lg shadow-sm">
              <p className="text-sm text-red-600 leading-relaxed">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative">  
        <AnimatePresence>
          {replyTo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3"
            >
              <div className="bg-blue-50/50 border-l-4 border-blue-400 p-3 rounded-r-xl backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-blue-700">
                      Replying to {replyTo.sender}
                    </p>
                    <p className="text-sm text-blue-600 truncate">
                      {replyTo.content}
                    </p>
                  </div>
                  {onCancelReply && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={onCancelReply}
                      className="ml-2 p-1.5 rounded-full hover:bg-blue-100/50 transition-colors"
                    >
                      <X size={16} className="text-blue-500" />
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-end space-x-2 p-3">
          <div className="flex-1 relative">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={placeholder}
                disabled={disabled || isSending}
                maxLength={maxLength}
                rows={1}
                className={`w-full px-4 py-3 pr-12 bg-white/90 backdrop-blur-sm border border-gray-200/60 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 placeholder:text-gray-400 text-sm shadow-sm ${
                  disabled || isSending ? 'opacity-50 cursor-not-allowed' : ''
                } ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500/50' : ''}`}
                style={{
                  minHeight: '44px',
                  maxHeight: '88px',
                  overflow: 'hidden'
                }}
              />
              
              <div className="absolute bottom-2 right-3 text-xs text-gray-400">
                {charCount}/{maxLength}
              </div>
            </div>

            <AnimatePresence>
              {showEmojiPicker && (
                <div ref={emojiPickerRef} className="absolute bottom-full left-0 mb-2 z-50">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="w-64 h-40 bg-white/95 backdrop-blur-lg border border-gray-200/50 rounded-xl shadow-xl overflow-hidden"
                  >
                    <div className="p-2 border-b border-gray-100">
                      <h4 className="text-xs font-medium text-gray-700">Emojis</h4>
                    </div>
                    <div className="p-2 h-32 overflow-y-auto">
                      <div className="grid grid-cols-8 gap-1">
                        {EMOJI_LIST.map((emoji, index) => (
                          <motion.button
                            key={index}
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleEmojiSelect(emoji)}
                            className="w-6 h-6 flex items-center justify-center text-sm rounded-lg hover:bg-gray-100/50 transition-colors"
                          >
                            {emoji}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-end space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              disabled={disabled}
              className={`p-3 rounded-2xl transition-all duration-200 shadow-sm ${
                showEmojiPicker 
                  ? 'bg-blue-100 text-blue-600 border border-blue-200' 
                  : 'bg-white/90 text-gray-500 hover:bg-gray-50 hover:text-gray-700 border border-gray-200/60'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              style={{ minHeight: '44px', minWidth: '44px' }}
            >
              <Smile size={18} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSend}
              disabled={!message.trim() || disabled || isSending}
              className={`p-3 rounded-2xl transition-all duration-200 shadow-sm ${
                message.trim() && !disabled && !isSending
                  ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-md hover:shadow-blue-500/25 border border-blue-500'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-200'
              }`}
              style={{ minHeight: '44px', minWidth: '44px' }}
            >
              {isSending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageInput; 