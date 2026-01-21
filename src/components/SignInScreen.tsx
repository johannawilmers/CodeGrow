import React, { useEffect, useRef } from 'react';
import * as firebaseui from 'firebaseui';
import 'firebaseui/dist/firebaseui.css'; 
import firebase from 'firebase/compat/app'; 
import 'firebase/compat/auth';           
import { auth } from '../firebase'; 

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

      ],
      // Optional callback for custom logic on successful sign-in
      callbacks: {
        signInSuccessWithAuthResult: onSignInSuccessWithAuthResult,
      },

    };

    if (uiRef.current) {
      ui.start(uiRef.current, uiConfig);
    } else {
      console.error('FirebaseUI container not found');
    }
    return () => {
      if (ui) {
        ui.reset();
      }
    };
  }, [onSignInSuccessWithAuthResult, signInSuccessUrl]); 

  return (
    <div className="signin-page-container" >
      <div ref={uiRef} id="firebaseui-auth-container"><h2>Sign In to CodeGrow</h2></div>
    </div>
  );
};

export default SignInScreen;
