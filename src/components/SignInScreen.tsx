// src/components/SignInScreen.tsx
import React, { useEffect, useRef } from 'react';
import * as firebaseui from 'firebaseui';

// Import the 'firebase' namespace for accessing providers and types
import firebase from 'firebase/compat/app'; // <--- CRUCIAL ADDITION
import 'firebase/compat/auth';             // <--- CRUCIAL ADDITION
                                          //      This ensures 'firebase.auth' namespace is available

import { auth } from '../firebase'; // Import your initialized auth instance (this is the service instance)

interface SignInScreenProps {
  onSignInSuccessWithAuthResult?: (authResult: firebase.auth.UserCredential) => boolean;
  signInSuccessUrl?: string;
}

const SignInScreen: React.FC<SignInScreenProps> = ({
  onSignInSuccessWithAuthResult,
  signInSuccessUrl = '/', // Default redirect URL
}) => {
  const uiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Get or create a FirebaseUI instance.
    // We use getInstance() to avoid re-initializing if it's already active.
    const ui = firebaseui.auth.AuthUI.getInstance() || new firebaseui.auth.AuthUI(auth);

    const uiConfig: firebaseui.auth.Config = {
      signInFlow: 'popup', // Or 'redirect'
      signInSuccessUrl: signInSuccessUrl,
      signInOptions: [
        // Email/Password provider: Access EmailAuthProvider from the 'firebase.auth' namespace
        {
          provider: firebase.auth.EmailAuthProvider.PROVIDER_ID, // <-- CORRECTED
          requireDisplayName: true,
        },
        // Google provider: Access GoogleAuthProvider from the 'firebase.auth' namespace
        firebase.auth.GoogleAuthProvider.PROVIDER_ID, // <-- CORRECTED
        // Add other providers as configured in your Firebase project
        // For example, if you enabled Phone authentication:
        // firebase.auth.PhoneAuthProvider.PROVIDER_ID,
      ],
      // Optional callback for custom logic on successful sign-in
      callbacks: {
        signInSuccessWithAuthResult: onSignInSuccessWithAuthResult,
      },
      // Optional: Terms of Service URL.
      // tosUrl: '<your-tos-url>',
      // Optional: Privacy Policy URL.
      // privacyPolicyUrl: '<your-privacy-policy-url>',
    };

    // Start FirebaseUI if the DOM element is available
    if (uiRef.current) {
      ui.start(uiRef.current, uiConfig);
    } else {
      console.error('FirebaseUI container not found');
    }

    // Cleanup FirebaseUI on component unmount to prevent memory leaks
    return () => {
      // Check if ui instance exists before resetting
      if (ui) {
        ui.reset();
      }
    };
  }, [onSignInSuccessWithAuthResult, signInSuccessUrl]); // Re-run effect if these props change

  return (
    <div>
      <h2>Sign In to CodeGrow</h2>
      <div ref={uiRef} id="firebaseui-auth-container"></div>
    </div>
  );
};

export default SignInScreen;
