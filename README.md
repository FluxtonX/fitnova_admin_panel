# FitNova Admin Panel

A React + Vite administrative dashboard for the FitNova fitness and lifestyle application.

## Tech Stack
- **Framework**: React 18
- **Build Tool**: Vite
- **Database / Backend**: Firebase (Firestore, Auth)
- **Styling / Icons**: React Icons, Phosphor Icons
- **Charts / Visualizations**: Recharts
- **Form Management**: React Hook Form & Yup

## Setup & Running Locally
1. Install dependencies:
   ```bash
   npm install
   ```
2. Set up environment variables in `.env`:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Build for production:
   ```bash
   npm run build
   ```
