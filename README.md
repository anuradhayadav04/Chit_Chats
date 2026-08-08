# 💬 ChitChat – Real-Time End-to-End Encrypted Chat Application

ChitChat is a full-stack, real-time messaging web application featuring **Real End-to-End Encryption (E2EE)**. Inspired by Signal and WhatsApp, ChitChat implements a zero-trust architecture where messages are encrypted client-side using browser-native Web Crypto APIs. The server acts purely as a message broker, storing and transmitting only ciphertext.

---

## 🔐 End-to-End Encryption (E2EE) Architecture

```
[ Alice Client ]                                  [ Server ]                                 [ Bob Client ]
---------------                                   ----------                                 ------------
Private Key (IndexedDB)                                                                     Private Key (IndexedDB)
Public Key (Exported) ----> POST /api/keys ----> Stores Public Key                           Public Key (Exported)
                                                                                                      |
Writes "Hello"                                                                                        |
Encrypts with Bob's Public Key (ECDH + AES-GCM)                                                      |
      |                                                                                               |
Sends Ciphertext (e.g. 4ad82931bc...) -----------> Stores Ciphertext Only                             |
                                                   |                                                  |
                                                   +----------------------------------------------> Downloads Ciphertext
                                                                                                     Decrypts with Bob's Private Key
                                                                                                     Yields "Hello"
```

### Key Security Highlights:
- **Asymmetric Key Exchange**: Uses ECDH (`P-256`) key pairs generated locally via browser `window.crypto.subtle`.
- **Zero-Knowledge Storage**: MongoDB stores `encryptedMessage` and `nonce` (Initialization Vector) only. Plaintext text/images never touch the server network.
- **Secure Local Storage**: Private keys are saved locally in client **IndexedDB** storage and are non-extractable across sessions.
- **AES-GCM Encryption**: Dynamic 256-bit symmetric session keys derived per chat conversation.

---

## ✨ Features

- 🔐 **Real End-to-End Encryption (E2EE)**: Complete user privacy guaranteed.
- ⚡ **Real-Time Messaging**: Built on WebSockets via Socket.io.
- 👤 **User Authentication**: Secure JWT-based signup, login, and session persistence.
- 🎨 **Modern UI/UX**: Styled with Tailwind CSS & DaisyUI featuring custom themes and visual E2EE status indicators.
- 📷 **Profile Customization**: Image upload handling integrated with Cloudinary.
- 🟢 **Online Status**: Real-time presence detection for active users.

---

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, DaisyUI, Zustand, Lucide Icons, Web Crypto API, IndexedDB.
- **Backend**: Node.js, Express.js, MongoDB (Mongoose), Socket.io, Cloudinary, JSON Web Tokens (JWT).

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas Cloud)

### 1. Clone the repository
```bash
git clone https://github.com/anuradhayadav04/Chit_Chats.git
cd Chit_Chats
```

### 2. Configure Environment Variables
Create a `.env` file inside the `backend/` directory:
```env
PORT=5001
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/chitchat
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NODE_ENV=development
```

### 3. Install Dependencies & Run

#### Backend
```bash
cd backend
npm install
npm run dev
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in two browser windows to test E2EE chat between users!
