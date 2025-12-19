import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCNDHrwsvQ7RpzT-grrmlUwGq8AypnqlSM",
  authDomain: "roblox-new-a1d51.firebaseapp.com",
  databaseURL: "https://roblox-new-a1d51-default-rtdb.firebaseio.com",
  projectId: "roblox-new-a1d51",
  storageBucket: "roblox-new-a1d51.firebasestorage.app",
  messagingSenderId: "344764820248",
  appId: "1:344764820248:web:a1a3b9286f7acf2e290c6d",
  measurementId: "G-2K5GHCNPZ7"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const analytics = getAnalytics(app);