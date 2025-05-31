import React, { useState, useRef, useEffect } from "react"; // Import useEffect
import { motion } from "framer-motion";
import { CheckCircleIcon, XCircleIcon } from "lucide-react/dist/cjs/lucide-react"; // lucide icons
// Import MUI components, including Button
import { Typography, CircularProgress, Snackbar, Alert, Box, Button } from "@mui/material";
// Removed react-router-dom imports as component is now modal content
// import { Link, useNavigate, useLocation } from "react-router-dom";

// Assume API base URL is available or passed as prop
const API_BASE_URL = "https://oy0bs62jx8.execute-api.us-east-1.amazonaws.com/Prod";

// NEW COMPONENT: Adapted OTP logic for modal content
// Accepts initial data (like phone_number) and callbacks
const OtpContent = ({ initialData, onVerificationSuccess, onVerificationFailure, adminToken }) => {
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [isOtpCorrect, setIsOtpCorrect] = useState(null); // null, true, or false
  const [isLoading, setIsLoading] = useState(false); // Loading for OTP verification
  const inputsRef = useRef([]);
  // Get phone_number from initialData prop instead of location state
  const phone_number = initialData?.phone_number;

    // Internal state for displaying messages within this component (e.g., for resend or specific OTP errors)
    const [internalMessage, setInternalMessage] = useState(null); // { type: 'error' | 'success', text: '...' }

    // Effect to focus the first input when the component mounts or otp changes
    useEffect(() => {
        // Use a small delay to ensure inputs are rendered before focusing
        const timeoutId = setTimeout(() => {
              if (inputsRef.current[0]) {
                  inputsRef.current[0].focus();
              }
        }, 0); // Timeout of 0ms pushes the focus to the next tick

        // Clean up the timeout if component unmounts or otp changes before timeout
        return () => clearTimeout(timeoutId);
    }, [otp]); // Dependency on otp state ensures re-focus after clearing inputs

    // Effect to clear internal messages after a delay
    useEffect(() => {
        if (internalMessage) {
            const timeout = setTimeout(() => {
                setInternalMessage(null);
            }, 5000); // Clear message after 5 seconds
            return () => clearTimeout(timeout);
        }
    }, [internalMessage]);


  const handleChange = (element, index) => {
    const value = element.value.replace(/[^0-9]/g, "");
    // Allow deleting the last digit in a field by setting value to ""
    // If value is empty string and the input was not just cleared, allow it
    if (!value && element.value !== "") {
       const newOtp = [...otp];
       newOtp[index] = ""; // Ensure the state is updated to empty string
       setOtp(newOtp);
       setIsOtpCorrect(null); // Clear status when typing/deleting
        // Move focus back if deleting
          if (index > 0) {
              requestAnimationFrame(() => {
                  inputsRef.current[index - 1]?.focus();
              });
          }
       return; // Stop further processing
    }

    // If a digit was entered (value is not empty)
    if (value) {
        const newOtp = [...otp];
 newOtp[index] = value; // Set the digit
 setOtp(newOtp);
 setIsOtpCorrect(null); // Clear status when typing

 // Move focus to the next input if a digit was entered
 if (index < otp.length - 1) {
  requestAnimationFrame(() => {
    inputsRef.current[index + 1]?.focus();
  });
 }
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      const newOtp = [...otp];
      if (newOtp[index] !== "") {
 newOtp[index] = "";
 setOtp(newOtp);
          setIsOtpCorrect(null); // Clear status when deleting
      } else if (index > 0) {
 requestAnimationFrame(() => {
  inputsRef.current[index - 1]?.focus();
 });
      }
      e.preventDefault(); // Prevent default backspace behavior
    }
      // Optionally add handlers for arrow keys for better navigation
  };


  const handleFocus = (index) => {
    // Select the content on focus
    inputsRef.current[index]?.select();
      setIsOtpCorrect(null); // Clear status on focus
      setInternalMessage(null); // Clear messages on focus
  };

  const handleSubmit = async () => {
    if (otp.includes("") || !phone_number) { // Check if all digits are entered and phone_number is available
      setIsOtpCorrect(false); // Indicate validation failure (will show "Invalid OTP")
      setInternalMessage({ type: 'error', text: 'Please enter all digits.' }); // More specific message
      return;
    }
    setIsLoading(true); // Start loading for OTP verification
    setIsOtpCorrect(null); // Reset previous status
    setInternalMessage(null); // Clear previous internal messages


    const enteredOtp = otp.join("");
    console.log("Attempting to verify OTP:", enteredOtp, "for phone:", phone_number);

    try {
      const response = await fetch(
 `${API_BASE_URL}/v1/auth/confirm_account`, // Use the confirmation endpoint
 {
  headers: {
               "Content-Type": "application/json",
               // Include Authorization header if confirm_account requires it
               // Assuming adminToken is passed from parent AddOwnerModal
               ...(adminToken && { 'Authorization': `Bearer ${adminToken}` }),
           },
  method: "POST",
  body: JSON.stringify({
    otp: enteredOtp,
    phone_number, // Use phone_number from props
  }),
 }
      );

      if (response.ok) {
 setIsOtpCorrect(true);
 console.log("OTP Verified Successfully");
 // --- MODIFIED: Call parent callback instead of navigating ---
 if (onVerificationSuccess) {
             // Note: The original API might not return JSON on success, handle empty response
             const responseData = response.status === 204 ? {} : await response.json().catch(() => ({}));
    onVerificationSuccess(responseData); // Pass response data if needed
 }
      } else {
 setIsOtpCorrect(false); // This triggers the "Invalid OTP" message in JSX
 setOtp(new Array(6).fill("")); // Clear the input fields on failure
 requestAnimationFrame(() => {
  inputsRef.current[0]?.focus(); // Focus on the first input
 });
 const json = await response.json().catch(() => ({})); // Safely parse error JSON
 console.error("API Error (OTP Verify): ", json); // Use console.error
        // --- MODIFIED: Call parent callback on failure ---
        if (onVerificationFailure) {
              onVerificationFailure(json.message || "OTP verification failed.");
        }
        // Optionally set an internal message for specific API errors if needed
        setInternalMessage({ type: 'error', text: json.message || "Invalid OTP." });
      }
    } catch (error) {
      console.error("Fetch Error (OTP Verify): ", error); // Handle network or other fetch errors
      setIsOtpCorrect(false); // Assume verification failed (triggers "Invalid OTP")
      setOtp(new Array(6).fill("")); // Clear inputs and focus on fetch error as well
      requestAnimationFrame(() => {
 inputsRef.current[0]?.focus();
      });
       // --- MODIFIED: Call parent callback on error ---
       if (onVerificationFailure) {
           onVerificationFailure(error.message || "Network error during OTP verification.");
       }
       setInternalMessage({ type: 'error', text: error.message || "Network error. Please try again." });
    } finally {
      setIsLoading(false); // Always stop loading regardless of success or failure
    }
  };

    // Don't render if phone_number is missing from props
    if (!phone_number) {
        console.error("Phone number not provided for OTP verification.");
        // Display a message or handle this case explicitly in the parent
        return (
            <div className="text-center py-8 text-red-600">
                Configuration Error: Phone number missing for OTP verification.
            </div>
        );
    }


  return (
    // --- MODIFIED: Removed full-page styling. Keep inner container styles ---
    // The modal component in AddOwnerModal provides the outer wrapper and overlay
    <div className="w-full p-8 flex flex-col items-center"> {/* Adjusted padding for modal content */}
      <h1 className="text-3xl font-bold mb-4 text-[#00113D]">Account Verification</h1> {/* Adjusted font size */}
        <Typography variant="body2" color="textSecondary" sx={{ mb: 4, textAlign: 'center' }}>
            Please enter the 6-digit code sent to your phone number: <span className="font-semibold">{phone_number}</span>
        </Typography>


      {/* Progress Indicator/Section info - Keep or remove based on modal design */}
        {/* Keeping for structure, adjust styling as needed */}
      <div className="flex items-center justify-center mb-6 w-full"> {/* Adjusted width */}
 <div className="w-1/2 border-b-4 border-blue-200"></div>
 <div className="w-1/2 border-b-4 border-sky-950"></div> {/* Highlight current step */}
      </div>

      <div className="flex justify-between w-full mb-8 px-4"> {/* Adjusted width and padding */}
 <div className="flex flex-col items-start w-1/2">
  <span className="text-sm flex font-semibold text-white bg-gray-500 rounded-full justify-center items-center w-6 h-6">
    1
  </span>
  <p className="text-sm text-gray-500 font-medium"> {/* Adjusted text color */}
    Basic Information
  </p>
 </div>
 <div className="flex flex-col items-end w-1/2">
  <span className="text-sm flex font-semibold text-white bg-sky-950 rounded-full justify-center items-center w-6 h-6">
    2
  </span>
  <p className="text-sm text-gray-800 font-medium">Mobile OTP</p>
 </div>
      </div>

 {/* OTP Input Form */}
 <form onSubmit={(e) => e.preventDefault()} className="w-full flex flex-col items-center"> {/* Ensure form takes full width and centers content */}
  {/* Input fields container */}
  <div className="flex justify-center gap-3 mb-8 w-auto"> {/* Adjusted gap */}
    {otp.map((_, index) => (
      <motion.input
 key={index}
 ref={(el) => (inputsRef.current[index] = el)}
 type="text"
 maxLength="1"
 value={otp[index]}
 onChange={(e) => handleChange(e.target, index)}
 onKeyDown={(e) => handleKeyDown(e, index)}
 onFocus={() => handleFocus(index)}
 disabled={isOtpCorrect === true || isLoading} // Disable inputs if correct or loading
 // Input field styling
 className="w-10 h-12 border-2 border-gray-300 rounded-md bg-white text-center text-lg font-semibold focus:outline-none focus:ring-1 focus:ring-[#FB913C] transition duration-150" // Adjusted size slightly
 initial={{ scale: 1 }}
 whileFocus={{ scale: 1.1 }}
 whileHover={{ scale: 1.05 }}
      />
    ))}
  </div>

  {/* Success & Error Messages */}
  {isOtpCorrect === true && (
    <motion.div
      className="flex items-center p-2 mb-4 bg-green-100 border border-green-500 rounded-sm text-green-700 text-sm w-full max-w-xs" // Adjusted width
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
      OTP Verified Successfully!
    </motion.div>
  )}

  {isOtpCorrect === false && ( // This state is used for incorrect OTP or validation failure
    <motion.div
      className="flex items-center p-2 mb-4 bg-red-100 border border-red-500 rounded-sm text-red-700 text-sm w-full max-w-xs" // Adjusted width
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <XCircleIcon className="h-5 w-5 text-red-500 mr-2" />
      Invalid OTP. Please try again. {/* Default message */}
    </motion.div>
  )}
          {/* Display internal messages (e.g., from API error response text) */}
            {internalMessage && internalMessage.type === 'error' && isOtpCorrect !== false && ( // Don't show if generic invalid OTP is already shown
                  <Typography color="error" variant="body2" sx={{ mb: 2, textAlign: 'center', width: '100%', maxWidth: 'xs' }}>
                      {internalMessage.text}
                  </Typography>
            )}
            {internalMessage && internalMessage.type === 'success' && isOtpCorrect !== true && ( // Don't show if generic success is already shown
                  <Typography color="success" variant="body2" sx={{ mb: 2, textAlign: 'center', width: '100%', maxWidth: 'xs' }}>
                      {internalMessage.text}
                  </Typography>
            )}


  {/* Submit Button */}
  <button
    type="button"
    onClick={handleSubmit}
    disabled={isOtpCorrect === true || otp.includes("") || isLoading || !phone_number} // Disable if correct, empty, loading, or no phone
    className={`w-full max-w-xs text-white text-lg rounded-full py-3 transition flex items-center justify-center ${ // Adjusted width, added flex/center
      isOtpCorrect === true || otp.includes("") || isLoading || !phone_number
    ? "bg-gray-400 cursor-not-allowed"
 : "bg-blue-900 hover:bg-blue-900"
    }`}
  >
    {isLoading ? (
      <CircularProgress size={20} color="inherit" />
    ) : (
      "Submit"
    )}
  </button>

          {/* Optional: Resend OTP Button - Add logic for this */}
          {isOtpCorrect !== true && !isLoading && phone_number && (
                  <Button
                     onClick={() => { /* Add resend logic here */ console.log("Resend OTP clicked"); setInternalMessage({ type: 'info', text: 'Resending OTP...' }); /* Call an API? */ }}
                     size="small"
                     sx={{ mt: 2, textTransform: 'none' }}
                  >
                      Resend OTP
                  </Button>
            )}

 </form>

 {/* Terms and Conditions */}
 <p className="text-center text-gray-500 text-xs mt-6 w-full max-w-xs"> {/* Adjusted width */}
  By creating an account or signing up you agree to our{" "}
  <a href="/terms" className="text-blue-600 underline">
    Terms and Conditions
  </a>
 </p>
      </div>
  );
};

export default OtpContent;