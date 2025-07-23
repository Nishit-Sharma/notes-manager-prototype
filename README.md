# Notes Manager Prototype

A simple web application for managing client activities and notes, built with React and Firebase. This prototype allows users to log activities, manage clients, and view activity history in a user-friendly interface.

## Features
- User authentication (login/register)
- Dashboard overview
- Client management (add, edit, view clients)
- Activity logging (add, filter, and view activities)
- Responsive UI with Tailwind CSS

## Tech Stack
- React
- Firebase Authentication & Firestore
- Tailwind CSS
- Vite

## Getting Started

### Prerequisites
- Node.js (v16 or higher recommended)
- npm or yarn

### Installation
1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd notes-manager-prototype
   ```
2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```
3. Set up Firebase:
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/).
   - Enable Authentication (Email/Password) and Firestore Database.
   - Copy your Firebase config and update `src/firebaseConfig.js` or use a `.env` file.

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) to view the app.

## Folder Structure
```
notes-manager-prototype/
  src/
    components/      # Reusable React components
    constants/       # App-wide constants
    contexts/        # React context providers
    hooks/           # Custom React hooks
    pages/           # Page-level components
    utils/           # Utility functions
    index.css        # Global styles
    firebaseConfig.js# Firebase setup
  public/            # Static assets
  package.json       # Project metadata and scripts
  README.md          # Project documentation
```

## Scripts
- `npm run dev` — Start development server
- `npm run build` — Build for production
- `npm run preview` — Preview production build

## License
This project is for prototyping and demonstration purposes only. 