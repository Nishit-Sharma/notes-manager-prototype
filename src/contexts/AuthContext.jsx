import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebaseConfig';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true); // To handle initial auth state check
  const [userData, setUserData] = useState(null); // To store user profile from Firestore

  const register = async (email, password, userName) => {
    const authUser = await createUserWithEmailAndPassword(auth, email, password);
    // Create a user document in Firestore
    await setDoc(doc(db, "users", authUser.user.uid), {
      userId: authUser.user.uid,
      userName: userName,
      userEmail: email,
      role: "Staff", // Default role
      createdAt: serverTimestamp()
    });
    return authUser;
  };

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    setUserData(null);
    return signOut(auth);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Fetch user profile from Firestore
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUserData({ uid: user.uid, ...userDocSnap.data() });
        } else {
          // This case might happen if user was created in Auth but not in Firestore, or data inconsistency
          console.warn("User document not found in Firestore for UID:", user.uid);
          setUserData({ uid: user.uid, email: user.email }); // Basic data
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe; // Cleanup subscription on unmount
  }, []);

  const value = {
    currentUser,
    userData,
    register,
    login,
    logout,
    loading // Expose loading state
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children} {/* Don't render children until auth state is determined */}
    </AuthContext.Provider>
  );
}; 