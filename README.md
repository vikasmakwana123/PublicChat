Website Live Demo :- [Public Chat App](https://publicchatapp.netlify.app/)

# PublicChat - Real-time Chat Application

A modern, real-time chat application featuring public and private rooms with end-to-end encryption for private conversations.

## 🚀 Features

- **User Authentication**: Secure Login and Registration system.
- **Real-time Messaging**: Instant communication powered by Socket.io.
- **Dynamic Rooms**:
  - **Public Rooms**: Open for everyone to join and chat.
  - **Private Rooms**: Password-protected rooms that generate a unique joining key.
- **End-to-End Encryption**: 
  - Messages in private rooms are encrypted on the client-side using **AES (CryptoJS)** before being sent.
  - Only users with the correct joining key can decrypt and read the messages.
- **Tabular Dashboard**: All available public chat rooms are listed in a clean, professional tabular format.
- **Message Persistence**: Chat history is saved in MongoDB.

## 🛠️ Tech Stack

- **Frontend**: React.js, Vite, React Router, Lucide React (Icons), Axios, Socket.io-client, CryptoJS.
- **Backend**: Node.js, Express, Socket.io, Mongoose (MongoDB), JWT, Bcrypt, Dotenv.
- **Database**: MongoDB (Atlas/Local).

## 📋 Prerequisites

- Node.js installed on your machine.
- A MongoDB connection string (Atlas or Local).

## ⚙️ Setup Instructions

### 1. Clone or Extract the Project
Ensure you have the `backend` and `frontend` folders in your workspace.

### 2. Backend Configuration
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend` directory and add your credentials:
   ```env
   PORT=5000
   MONGO_URL=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   ```
4. Start the backend server:
   ```bash
   node index.js
   ```

### 3. Frontend Configuration
1. Open a new terminal and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser and go to `http://localhost:5173`.

## 🔒 Security Note
Private room messages are encrypted using the **Joining Key** as the encryption secret. Even if the database is compromised, the content of private messages remains unreadable without that specific room's key.

## 👨‍💻 Author
Vikas Makwana
