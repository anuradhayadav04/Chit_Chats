import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import { encryptMessage, decryptMessage } from "../lib/crypto";

// Simple local cache for user public keys
const publicKeyCache = {};

async function getPeerPublicKey(userId) {
  if (publicKeyCache[userId]) return publicKeyCache[userId];
  try {
    const res = await axiosInstance.get(`/keys/${userId}`);
    if (res.data?.publicKey) {
      publicKeyCache[userId] = res.data.publicKey;
      return res.data.publicKey;
    }
  } catch (err) {
    console.error(`Failed to fetch public key for user ${userId}:`, err);
  }
  return null;
}

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      const rawMessages = res.data;

      // Decrypt messages asynchronously
      const decryptedMessages = await Promise.all(
        rawMessages.map(async (msg) => {
          if (msg.encryptedMessage && msg.nonce) {
            const peerId = msg.senderId === userId ? userId : msg.receiverId;
            const peerPublicKey = await getPeerPublicKey(peerId);
            if (peerPublicKey) {
              const text = await decryptMessage(msg.encryptedMessage, msg.nonce, peerPublicKey);
              return { ...msg, text };
            }
          }
          return msg;
        })
      );

      set({ messages: decryptedMessages });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      let payload = { ...messageData };

      // Perform E2EE if sending text
      if (messageData.text) {
        const peerPublicKey = await getPeerPublicKey(selectedUser._id);
        if (peerPublicKey) {
          const { ciphertext, nonce } = await encryptMessage(messageData.text, peerPublicKey);
          payload.encryptedMessage = ciphertext;
          payload.nonce = nonce;
          delete payload.text; // Ensure plaintext NEVER leaves the browser to the backend
        }
      }

      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, payload);
      // Ensure local message state displays plain text for the sender UI
      const localMsg = { ...res.data, text: messageData.text };
      set({ messages: [...messages, localMsg] });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", async (newMessage) => {
      const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;

      let msgToAppend = newMessage;
      if (newMessage.encryptedMessage && newMessage.nonce) {
        const peerPublicKey = await getPeerPublicKey(selectedUser._id);
        if (peerPublicKey) {
          const text = await decryptMessage(newMessage.encryptedMessage, newMessage.nonce, peerPublicKey);
          msgToAppend = { ...newMessage, text };
        }
      }

      set({
        messages: [...get().messages, msgToAppend],
      });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
