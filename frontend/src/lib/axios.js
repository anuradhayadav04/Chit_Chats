import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.MODE === "development" ? "https://chit-chats-1.onrender.com/api" : "/api",
  withCredentials: true,
});
