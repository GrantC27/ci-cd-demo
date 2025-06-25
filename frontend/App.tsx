
import React, { useState, useCallback, useEffect, FormEvent, useRef } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CVInput } from './components/CVInput';
import { JobDescriptionInput } from './components/JobDescriptionInput';
import { TransformedCVDisplay } from './components/TransformedCVDisplay';
import { Button as StyledButton } from './components/Button';
import { LoadingSpinner } from './components/LoadingSpinner';
import { Alert } from './components/Alert';
import { AlertType } from './types';
import { transformCvWithGemini, simulateAtsScreeningWithGemini } from './services/geminiService';
import { InfoIcon, LightBulbIcon, MagnifyingGlassCircleIcon, UserCircleIcon, ExclamationIcon } from './components/Icons';
import { AtsReportDisplay } from './components/AtsReportDisplay';
import { AuthModal } from './components/AuthModal';
import { BuyCreditsModal } from './components/BuyCreditsModal';
import {
  LOCAL_STORAGE_USER_KEY,
  INITIAL_SIGNUP_CREDITS,
  CREDIT_COST_OPTIMIZE,
  CREDIT_COST_SIMULATE,
  LAMBDA_SIGNUP_ENDPOINT,
  LAMBDA_GET_PROFILE_ENDPOINT
} from './constants';

import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { auth as firebaseAuth } from './firebase';


let pdfjsLib: any = null;
let mammoth: any = null;

interface CurrentUser {
  userId: string; 
  email: string;
  credits: number;
}

interface EmailVerificationStatus {
  pending: boolean;
  message: string | null;
  showResendButtonForUser: firebase.User | null;
}

const App: React.FC = () => {
  const [firebaseUser, setFirebaseUser] = useState<firebase.User | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isFirebaseLoading, setIsFirebaseLoading] = useState(true);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<'login' | 'signup' | null>(null);
  const [cvText, setCvText] = useState<string>('');
  const [selectedCvFile, setSelectedCvFile] = useState<File | null>(null);
  const [jobDescriptionText, setJobDescriptionText] = useState<string>('');
  const [transformedCvText, setTransformedCvText] = useState<string>('');
  
  const [authActionMessage, setAuthActionMessage] = useState<string | null>(null);
  const [isOptimizingCv, setIsOptimizingCv] = useState<boolean>(false);
  const [optimizingCvMessage, setOptimizingCvMessage] = useState<string>('');
  
  const [showBuyCreditsModal, setShowBuyCreditsModal] = useState<boolean>(false);
  const [isSimulatingAts, setIsSimulatingAts] = useState<boolean>(false);
  const [atsSimulationMessage, setAtsSimulationMessage] = useState<string>('');
  const [atsSimulationResults, setAtsSimulationResults] = useState<{ original?: string; transformed?: string } | null>(null);

  const [showTips, setShowTips] = useState<boolean>(true);

  const [emailVerificationStatus, setEmailVerificationStatus] = useState<EmailVerificationStatus>({ pending: false, message: null, showResendButtonForUser: null });
  const [isResendingVerification, setIsResendingVerification] = useState<boolean>(false);

  const currentUserRef = useRef(currentUser);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  const firebaseUserRef = useRef(firebaseUser);
   useEffect(() => {
    firebaseUserRef.current = firebaseUser;
  }, [firebaseUser]);


  const updateUserAndStorage = (user: CurrentUser | null) => {
    setCurrentUser(user);
    if (user) {
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    }
  };

  const fetchAndStoreUserProfile = async (user: firebase.User) => {
    try {
      const idToken = await user.getIdToken();
      const profileResponse = await fetch(LAMBDA_GET_PROFILE_ENDPOINT, {
        headers: { Authorization: `Bearer ${idToken}` },
      });

      if (profileResponse.status === 404) {
        const signupResponse = await fetch(LAMBDA_SIGNUP_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            userId: user.uid,
            email: user.email,
            name: user.displayName || user.email?.split('@')[0],
          }),
        });
        if (!signupResponse.ok) {
           const errorData = await signupResponse.json().catch(() => ({}));
           throw new Error(errorData.message || "Profile creation failed after signup.");
        }
        const profile = await signupResponse.json();
        updateUserAndStorage(profile);
      } else if (profileResponse.ok) {
        const profile = await profileResponse.json();
        updateUserAndStorage(profile);
      } else {
        const errorData = await profileResponse.json().catch(() => ({}));
        throw new Error(errorData.message || "Unexpected error while fetching profile.");
      }
    } catch (err: any) {
      console.error("Profile error in fetchAndStoreUserProfile:", err);
      setGeneralError(`Profile operation failed: ${err.message}. Some features might be unavailable or profile data may be incomplete.`);
      if (currentUserRef.current?.userId === user.uid) { 
        updateUserAndStorage(null);
      }
    }
  };


  useEffect(() => {
    const unsubscribe = firebaseAuth.onAuthStateChanged(async (fbAuthUser) => {
      setIsFirebaseLoading(true);
      setGeneralError(null);
      setAuthActionMessage(null); 

      if (fbAuthUser) {
        setFirebaseUser(fbAuthUser); 
        const isVerified = fbAuthUser.emailVerified;
        const prevPendingStatus = emailVerificationStatus.pending; 
        
        console.log(
          `%cON_AUTH_STATE_CHANGED%c: User %c${fbAuthUser.email}%c, Firebase Verified: %c${isVerified}%c, App's Previous Pending State: %c${prevPendingStatus}`,
          'color: blue; font-weight: bold;', 'color: black;',
          'color: green; font-weight: bold;', 'color: black;',
          'color: green; font-weight: bold;', 'color: black;',
          'color: green; font-weight: bold;'
        );

        if (!isVerified) {
          setEmailVerificationStatus({ 
            pending: true, 
            message: "Your email address is not yet verified. To access all features, please click the verification link sent to your email. If you haven't received it, you can resend the email.",
            showResendButtonForUser: fbAuthUser 
          });
        } else { // User is verified according to Firebase
          setEmailVerificationStatus({ pending: false, message: null, showResendButtonForUser: null });
          if (prevPendingStatus && isVerified) { 
             setAuthActionMessage("Email successfully verified! You now have full access.");
             setTimeout(() => setAuthActionMessage(null), 4000);
          }
        }
        
        await fetchAndStoreUserProfile(fbAuthUser);

      } else { // No user logged in
        console.log("%cON_AUTH_STATE_CHANGED%c: No user logged in.", 'color: blue; font-weight: bold;', 'color: black;');
        setFirebaseUser(null);
        updateUserAndStorage(null);
        setEmailVerificationStatus({ pending: false, message: null, showResendButtonForUser: null });
      }
      setIsFirebaseLoading(false);
    });
    return () => unsubscribe();
  }, []); 

  const handleAuthAttempt = async (email: string, mode: 'login' | 'signup', password?: string): Promise<{ success: boolean; message?: string; requiresVerification?: boolean; user?: firebase.User | null}> => {
    setGeneralError(null);
    setAuthActionMessage(null);
    try {
      if (mode === 'signup') {
        const userCredential = await firebaseAuth.createUserWithEmailAndPassword(email, password!);
        if (userCredential.user) {
          await userCredential.user.sendEmailVerification();
          return { 
            success: true, 
            message: "Signup successful! A verification email has been sent to your address. Please check your inbox (and spam folder) to verify your email.",
            requiresVerification: true,
            user: userCredential.user
          };
        }
        throw new Error("User creation failed unexpectedly.");
      } else { // Login mode
        const userCredential = await firebaseAuth.signInWithEmailAndPassword(email, password!);
        if (userCredential.user) {
          if (!userCredential.user.emailVerified) {
            return { 
              success: false, 
              message: "Login successful, but your email address is not verified. Please check your inbox for the verification email or use the 'Resend Verification Email' option from the main screen after closing this.",
              requiresVerification: true,
              user: userCredential.user 
            };
          }
          return { success: true, user: userCredential.user };
        }
        throw new Error("Login failed unexpectedly.");
      }
    } catch (err: any) {
      console.error("Auth error in handleAuthAttempt:", err);
      throw err; 
    }
  };

  const handleLogout = async () => {
    try {
      await firebaseAuth.signOut();
      setAuthActionMessage("You have been logged out.");
      setTimeout(() => setAuthActionMessage(null), 3000);
    } catch (err: any) {
      console.error("Logout error", err);
      setGeneralError(err.message || "Logout failed");
    }
  };

  const handleResendVerificationEmail = async () => {
    const userToVerify = firebaseUserRef.current; 
    if (userToVerify && !userToVerify.emailVerified) {
      setIsResendingVerification(true);
      setGeneralError(null);
      setAuthActionMessage(null);
      try {
        await userToVerify.sendEmailVerification();
        setAuthActionMessage("A new verification email has been sent. Please check your inbox (and spam folder).");
        setTimeout(() => setAuthActionMessage(null), 5000);
      } catch (err: any) {
        console.error("Resend verification email error:", err);
        setGeneralError(err.message || "Failed to resend verification email. Please try again later.");
      } finally {
        setIsResendingVerification(false);
      }
    } else if (emailVerificationStatus.showResendButtonForUser && !emailVerificationStatus.showResendButtonForUser.emailVerified) {
        setIsResendingVerification(true);
        setGeneralError(null);
        setAuthActionMessage(null);
        try {
          await emailVerificationStatus.showResendButtonForUser.sendEmailVerification();
          setAuthActionMessage("A new verification email has been sent. Please check your inbox (and spam folder).");
          setTimeout(() => setAuthActionMessage(null), 5000);
        } catch (err: any) {
            console.error("Resend verification email error (fallback):", err);
            setGeneralError(err.message || "Failed to resend verification email. Please try again later.");
        } finally {
            setIsResendingVerification(false);
        }
    }
  };

  // This function is now effectively a placeholder or for manual credit adjustments if ever needed.
  // Actual credit purchases will be handled by Stripe webhooks updating the backend.
  // The UI will reflect changes when currentUser is updated (e.g., after re-fetching profile).
  const handleSimulatedCreditsAdded = (amount: number) => {
    const currentAppUser = currentUserRef.current;
    if (currentAppUser) {
      console.log(`Simulating ${amount} credits added for user ${currentAppUser.userId} after a successful purchase.`);
      const updatedUser = { ...currentAppUser, credits: currentAppUser.credits + amount };
      updateUserAndStorage(updatedUser);
      setAuthActionMessage(`${amount} credits added! Your balance has been updated.`);
      setShowBuyCreditsModal(false); // Close modal after successful redirection and (simulated) webhook processing
      setTimeout(() => setAuthActionMessage(null), 4000);
    }
  };


  const parseCvFile = async (file: File): Promise<string> => {
    const fileName = file.name.toLowerCase();
    const arrayBuffer = await file.arrayBuffer();

    if (fileName.endsWith('.pdf')) {
      if (!pdfjsLib) throw new Error('PDF parsing library not loaded yet.');
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let textContent = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const text = await page.getTextContent();
        textContent += text.items.map((s: any) => (s.str ? s.str.trim() : '')).join(' ') + '\n';
      }
      return textContent.trim();
    } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
      if (!mammoth) throw new Error('DOC/DOCX parsing library not loaded yet.');
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value.trim();
    } else {
      throw new Error('Unsupported file type. Please upload a PDF, DOC, or DOCX file.');
    }
  };


  const handleCvFileChange = useCallback(async (file: File | null) => {
    setSelectedCvFile(file);
    setCvText('');
    setGeneralError(null);
    setTransformedCvText('');
    setAtsSimulationResults(null);

    if (file) {
      setIsOptimizingCv(true); 
      setOptimizingCvMessage('Parsing CV file...');
      try {
        if (!pdfjsLib && file.name.toLowerCase().endsWith('.pdf')) {
          await import('pdfjs-dist/legacy/build/pdf.min.mjs').then(pdf => {
            pdfjsLib = pdf;
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs';
          });
        }
        if (!mammoth && (file.name.toLowerCase().endsWith('.doc') || file.name.toLowerCase().endsWith('.docx'))) {
          await import('mammoth').then(m => { mammoth = m; });
        }

        const parsedText = await parseCvFile(file);
        setCvText(parsedText);
        if (!parsedText.trim()) {
          setGeneralError("The CV file appears to be empty or could not be fully parsed. Please check the file.");
          setSelectedCvFile(null); 
        }
      } catch (parseError: any) {
        console.error("Error parsing file:", parseError);
        setGeneralError(parseError.message || "Failed to parse the CV file.");
        setSelectedCvFile(null); 
      } finally {
        setIsOptimizingCv(false); 
        setOptimizingCvMessage('');
      }
    }
  }, []);


  const checkCreditsAndProceed = (cost: number, actionName: string, action: () => Promise<void>) => {
    setGeneralError(null); 
    setAuthActionMessage(null); 

    const currentFbUser = firebaseUserRef.current; 
    if (!currentFbUser) {
      setAuthActionMessage('Please log in or sign up to perform this action.');
      setShowAuthModal('login');
      return;
    }

    if (!currentFbUser.emailVerified) {
      setGeneralError(`Action unavailable: Your email is not verified. Please verify your email to ${actionName.toLowerCase()}.`);
      return;
    }
    
    const currentAppUser = currentUserRef.current; 
    if (!currentAppUser) {
        setGeneralError("User profile not loaded. Cannot perform action. Please try logging out and back in.");
        return;
    }

    if (currentAppUser.credits < cost) {
      setAuthActionMessage(`Insufficient credits. This action requires ${cost} credit(s). You have ${currentAppUser.credits}.`);
      setShowBuyCreditsModal(true);
      return;
    }

    action().then(() => {
      const appUserAfterAction = currentUserRef.current; 
      if (appUserAfterAction) { 
        const updatedUser = { ...appUserAfterAction, credits: appUserAfterAction.credits - cost };
        updateUserAndStorage(updatedUser);
        console.log(`${cost} credit(s) used for ${actionName}. Remaining: ${updatedUser.credits}. (Simulated backend update)`);
      }
    }).catch(err => {
      console.error(`Error after credit check during ${actionName}:`, err);
      setGeneralError(err.message || `An unexpected error occurred while ${actionName.toLowerCase()}.`);
    });
  };


  const handleTransformCv = useCallback(async () => {
    if (!cvText.trim() || !jobDescriptionText.trim()) {
      setGeneralError('Please provide both your CV (by uploading a file) and the job description.');
      return;
    }

    checkCreditsAndProceed(CREDIT_COST_OPTIMIZE, "Optimize CV", async () => {
      setGeneralError(null);
      setIsOptimizingCv(true);
      setOptimizingCvMessage('Optimizing CV...');
      setTransformedCvText('');
      setAtsSimulationResults(null); 

      try {
        const result = await transformCvWithGemini(cvText, jobDescriptionText);
        setTransformedCvText(result);
      } catch (err) {
        console.error("Error transforming CV:", err);
        throw err; 
      } finally {
        setIsOptimizingCv(false);
        setOptimizingCvMessage('');
      }
    });
  }, [cvText, jobDescriptionText]); 

  const handleSimulateAtsScreening = useCallback(async () => {
    if (!cvText.trim() || !jobDescriptionText.trim()) {
      setGeneralError('Please upload your CV and provide the job description before simulating ATS screening.');
      return;
    }

    checkCreditsAndProceed(CREDIT_COST_SIMULATE, "Simulate ATS Screening", async () => {
      setGeneralError(null);
      setIsSimulatingAts(true);
      setAtsSimulationResults(null); 
      let originalCvReport: string | undefined = undefined;
      let transformedCvReport: string | undefined = undefined;

      try {
        setAtsSimulationMessage('Analyzing Original CV with ATS...');
        originalCvReport = await simulateAtsScreeningWithGemini(cvText, jobDescriptionText);

        if (transformedCvText.trim()) {
          setAtsSimulationMessage('Analyzing Transformed CV with ATS...');
          transformedCvReport = await simulateAtsScreeningWithGemini(transformedCvText, jobDescriptionText);
        }
        setAtsSimulationResults({ original: originalCvReport, transformed: transformedCvReport });
      } catch (err) {
        console.error("Error during ATS simulation:", err);
        throw err; 
      } finally {
        setIsSimulatingAts(false);
        setAtsSimulationMessage('');
      }
    });
  }, [cvText, jobDescriptionText, transformedCvText]); 

  const globalMainActionsLoading = isOptimizingCv || isSimulatingAts || isResendingVerification;
  const canPerformActions = firebaseUser?.emailVerified && currentUser && cvText.trim() && jobDescriptionText.trim();


  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-neutral-light to-gray-200 text-neutral-darker">
      <Header
        currentUser={currentUser} 
        onLoginClick={() => { setAuthActionMessage(null); setGeneralError(null); setShowAuthModal('login');}}
        onSignupClick={() => { setAuthActionMessage(null); setGeneralError(null); setShowAuthModal('signup');}}
        onLogoutClick={handleLogout} 
        onBuyCreditsClick={() => {
          if (!firebaseUser?.emailVerified) {
            setGeneralError("Please verify your email before purchasing credits.");
            return;
          }
           if (!firebaseUser) {
            setGeneralError("Please log in to purchase credits.");
            setShowAuthModal('login');
            return;
          }
          setShowBuyCreditsModal(true);
        }}
        isEmailVerified={firebaseUser?.emailVerified ?? false}
        isFirebaseLoading={isFirebaseLoading}
      />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto bg-white shadow-2xl rounded-lg p-6 md:p-10">

          {emailVerificationStatus.pending && emailVerificationStatus.message && firebaseUser && !firebaseUser.emailVerified && (
            <Alert 
              type={AlertType.Warning} 
              message={emailVerificationStatus.message}
            >
              <button 
                onClick={handleResendVerificationEmail}
                disabled={isResendingVerification}
                className="mt-2 ml-auto text-sm font-semibold text-primary hover:text-primary-dark underline disabled:opacity-50 disabled:cursor-wait"
              >
                {isResendingVerification ? (
                  <> <LoadingSpinner className="inline h-4 w-4 mr-1" /> Resending...</>
                ) : (
                  "Resend Verification Email"
                )}
              </button>
            </Alert>
          )}

          {authActionMessage && (
            <Alert 
              type={authActionMessage.toLowerCase().includes("error") || authActionMessage.toLowerCase().includes("failed") || authActionMessage.toLowerCase().includes("issue") ? AlertType.Error : AlertType.Info} 
              message={authActionMessage} 
              onClose={() => setAuthActionMessage(null)} 
            />
          )}
          {generalError && ( 
            <Alert type={AlertType.Error} message={generalError} onClose={() => setGeneralError(null)} />
          )}

          {showTips && (
            <div className="mb-8 p-4 border border-primary-light bg-primary-light/10 rounded-lg shadow">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <LightBulbIcon className="h-6 w-6 text-primary mr-2" />
                  <h3 className="text-xl font-semibold text-primary-dark">Pro Tips for Best Results</h3>
                </div>
                <button
                  onClick={() => setShowTips(false)}
                  className="text-primary-dark hover:text-primary-dark/70 text-2xl"
                  aria-label="Hide tips"
                >
                  &times;
                </button>
              </div>
              <ul className="list-disc list-inside space-y-1 text-neutral-dark text-sm md:text-base">
                <li>Upload your CV as a PDF, DOC, or DOCX file. Ensure the text is selectable and not an image.</li>
                <li>Provide the full job description for the most accurate tailoring.</li>
                <li>Review all AI-generated content carefully. The AI is a tool to assist, not replace, your judgment.</li>
                <li>Use the "Simulate ATS Screening" feature to understand how your CV might be perceived by automated systems.</li>
                <li>Login or Sign Up to use the Optimizer and Simulator. New users get free credits on profile creation! Remember to verify your email.</li>
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <CVInput selectedFile={selectedCvFile} onFileChange={handleCvFileChange} disabled={globalMainActionsLoading } />
            <JobDescriptionInput value={jobDescriptionText} onChange={setJobDescriptionText} disabled={globalMainActionsLoading } />
          </div>

          {!firebaseUser && !isFirebaseLoading && !globalMainActionsLoading  && !showAuthModal && ( 
            <div className="mb-6 p-4 bg-accent/10 border border-accent rounded-md text-center">
              <UserCircleIcon className="h-8 w-8 text-accent mx-auto mb-2" />
              <p className="font-semibold text-accent-dark">Want to optimize or simulate?</p>
              <p className="text-sm text-neutral-dark mb-2">Please login or sign up to continue. New users get free credits!</p>
              <div className="flex justify-center space-x-3">
                <StyledButton onClick={() => { setAuthActionMessage(null); setGeneralError(null); setShowAuthModal('login');}} className="!py-2 !px-4 bg-primary hover:bg-primary-dark">Login</StyledButton>
                <StyledButton onClick={() => { setAuthActionMessage(null); setGeneralError(null); setShowAuthModal('signup');}} className="!py-2 !px-4 bg-secondary hover:bg-secondary/80 text-primary-darker">Sign Up</StyledButton>
              </div>
            </div>
          )}


          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-8">
            <StyledButton
              onClick={handleTransformCv}
              disabled={globalMainActionsLoading || !canPerformActions || (currentUser && currentUser.credits < CREDIT_COST_OPTIMIZE) || (firebaseUser && !firebaseUser.emailVerified)}
              aria-label="Optimize your CV based on the job description"
              title={
                !firebaseUser ? "Login to optimize" 
                : !firebaseUser.emailVerified ? "Verify email to optimize"
                : (currentUser && currentUser.credits < CREDIT_COST_OPTIMIZE ? `Needs ${CREDIT_COST_OPTIMIZE} credit(s)` 
                : "Optimize My CV")}
            >
              {isOptimizingCv && optimizingCvMessage.includes('Optimizing') ? (
                <>
                  <LoadingSpinner /> {optimizingCvMessage}
                </>
              ) : (
                'Optimize My CV'
              )}
            </StyledButton>
            <StyledButton
              onClick={handleSimulateAtsScreening}
              disabled={globalMainActionsLoading  || !canPerformActions || (currentUser && currentUser.credits < CREDIT_COST_SIMULATE) || (firebaseUser && !firebaseUser.emailVerified)}
              className="bg-accent hover:bg-accent/80 focus:ring-accent"
              aria-label="Simulate ATS screening for your CV and job description"
              title={
                !firebaseUser ? "Login to simulate" 
                : !firebaseUser.emailVerified ? "Verify email to simulate"
                : (currentUser && currentUser.credits < CREDIT_COST_SIMULATE ? `Needs ${CREDIT_COST_SIMULATE} credit(s)` 
                : "Simulate ATS Screening")}
            >
              {isSimulatingAts ? (
                <>
                  <LoadingSpinner /> {atsSimulationMessage || 'Simulating ATS...'}
                </>
              ) : (
                <>
                  <MagnifyingGlassCircleIcon className="h-5 w-5 mr-2" /> Simulate ATS Screening
                </>
              )}
            </StyledButton>
          </div>
          {(!cvText.trim() || !jobDescriptionText.trim()) && firebaseUser && !globalMainActionsLoading && <p className="text-xs text-neutral-dark mt-2 text-center">Upload CV and enter Job Description to enable actions.</p>}
          {firebaseUser && !firebaseUser.emailVerified && !isFirebaseLoading && !globalMainActionsLoading && (
            <p className="text-xs text-red-600 font-semibold mt-2 text-center flex items-center justify-center">
              <ExclamationIcon className="h-4 w-4 mr-1 text-red-500" /> Actions disabled until email is verified.
            </p>
          )}


          {(isOptimizingCv || isSimulatingAts) && (optimizingCvMessage || atsSimulationMessage) && (
            <div className="text-center py-10">
              <LoadingSpinner className="h-12 w-12 mx-auto mb-4 text-primary" />
              <p className="text-lg text-primary-dark">{isOptimizingCv ? optimizingCvMessage : atsSimulationMessage}</p>
              {(isOptimizingCv && optimizingCvMessage === 'Optimizing CV...') && <p className="text-sm text-neutral-dark">Analyzing inputs and crafting your optimized CV. This uses {CREDIT_COST_OPTIMIZE} credit.</p>}
              {(isOptimizingCv && optimizingCvMessage === 'Parsing CV file...') && <p className="text-sm text-neutral-dark">Extracting text from your CV file.</p>}
              {(isSimulatingAts) && <p className="text-sm text-neutral-dark">The AI is evaluating the CV against the job description. This uses {CREDIT_COST_SIMULATE} credit.</p>}
            </div>
          )}

          {transformedCvText && !isOptimizingCv && !isSimulatingAts && (
            <TransformedCVDisplay cvText={transformedCvText} />
          )}

          {atsSimulationResults && !isSimulatingAts && (
            <div className="mt-10">
              <h2 className="text-2xl font-semibold text-primary-dark mb-4 text-center">ATS Simulation Reports</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {atsSimulationResults.original && (
                  <AtsReportDisplay title="Original CV - ATS Report" reportText={atsSimulationResults.original} />
                )}
                {atsSimulationResults.transformed && (
                  <AtsReportDisplay title="Transformed CV - ATS Report" reportText={atsSimulationResults.transformed} />
                )}
              </div>
            </div>
          )}

          {!globalMainActionsLoading  && !transformedCvText && !atsSimulationResults && !generalError && !authActionMessage && (!emailVerificationStatus.pending || (firebaseUser && firebaseUser.emailVerified)) && ( 
            <div className="mt-12 p-6 border-2 border-dashed border-neutral rounded-lg text-center">
              <InfoIcon className="h-12 w-12 text-neutral-dark mx-auto mb-3" />
              <p className="text-xl font-medium text-neutral-dark">Your Optimized CV & ATS Reports Will Appear Here</p>
              <p className="text-sm text-neutral-dark">
                {currentUser
                  ? 'Upload your CV, fill in the job description, then click "Optimize My CV" or "Simulate ATS Screening".'
                  : 'Please login or sign up to get started.'
                }
                 {firebaseUser && !firebaseUser.emailVerified && ' (Remember to verify your email to enable actions!)'}
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
      {showAuthModal && (
        <AuthModal
          mode={showAuthModal}
          isOpen={!!showAuthModal}
          onClose={() => {
            setShowAuthModal(null);
          }}
          onAuthAttempt={handleAuthAttempt} 
          switchMode={(newMode) => {
            setShowAuthModal(newMode);
          }}
        />
      )}
      {showBuyCreditsModal && currentUser && firebaseUser && ( // Ensure firebaseUser is available
        <BuyCreditsModal
          isOpen={showBuyCreditsModal}
          onClose={() => setShowBuyCreditsModal(false)}
          currentCredits={currentUser.credits}
          firebaseUser={firebaseUser} // Pass firebaseUser
          // onPurchase is no longer directly used here for Stripe flow, credit updates rely on backend via webhook
          // For now, we can remove onPurchase or repurpose it if needed for other flows.
          // For this example, we'll keep it simple and rely on profile re-fetch for credit updates.
        />
      )}
    </div>
  );
};

export default App;
