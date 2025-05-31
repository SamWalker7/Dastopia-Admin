import React, { useState } from "react";
import {
  TextField,
  Button,
  Box,
  Modal,
  Typography,
  IconButton,
  InputAdornment,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import image from "./avatar.png"; // Keep image if used in step 1 form
// Import the adapted Otp content component
import OtpContent from "./Otp"; // Assuming you'll save the adapted OTP code here

// Assume API base URL is available or passed as prop if different
const API_BASE_URL = "https://oy0bs62jx8.execute-api.us-east-1.amazonaws.com/Prod";

// AddOwnerModal now manages steps and renders OtpContent
const AddOwnerModal = ({ open, handleClose, adminToken, onUserAdded }) => {
  // State to manage the current step: 'details' or 'otp'
  const [currentStep, setCurrentStep] = useState('details');

  // State for the form fields in the 'details' step
  const [detailsFormData, setDetailsFormData] = useState({
first_name: "",
last_name: "",
phone_number: "",
email: "",
password: "",
  });

  // State to hold data passed from step 1 to step 2 (e.g., phone number)
  const [userDataForOtp, setUserDataForOtp] = useState(null);

  // State for loading and error handling in the *overall modal* (primarily for step 1 submit)
  const [isLoading, setIsLoading] = useState(false); // Represents loading for step 1 submit
  const [error, setError] = useState(null); // Represents error for step 1 submit or general modal error
  const [success, setSuccess] = useState(false); // Overall success state for Snackbar


  // State to toggle password visibility (for details step)
  const [showPassword, setShowPassword] = useState(false);

  // --- Handlers for Step 1 (Details Form) ---
  const handleDetailsInputChange = (e) => {
const { name, value } = e.target;
setDetailsFormData({
  ...detailsFormData,
  [name]: value,
});
// Clear specific field error on change if implementing field-level validation
setError(null); // Clear overall error when user starts typing again
  };

  const handleTogglePasswordVisibility = () => {
setShowPassword(!showPassword);
  };

  const handleSendOtpSubmit = async () => {
// Basic validation check for Step 1 fields
for (const key in detailsFormData) {
  if (detailsFormData[key] === "") {
setError(`Please fill out the '${key.replace('_', ' ')}' field.`);
return;
  }
}

// Check if adminToken is available before Step 1 API call
if (!adminToken) {
setError("Authentication token is missing. Cannot send OTP/create user.");
console.error("Admin token missing in AddOwnerModal (Step 1 Submit)");
return;
}

setError(null); // Clear previous errors
setIsLoading(true); // Start loading indicator for Step 1 submit

console.log("Attempting to submit user details for OTP:", detailsFormData);

try {
  // --- API call for Step 1 (Send OTP / Initial User Creation) ---
  // ASSUMPTION: This API call creates an unconfirmed user and sends the OTP,
  // and the response includes data needed for the OTP confirmation step (like phone_number)
  const response = await fetch(`${API_BASE_URL}/v1/user`, { // Using the create user endpoint
method: 'POST',
headers: {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${adminToken}`,
},
body: JSON.stringify(detailsFormData),
  });

  const responseData = await response.json();

  if (!response.ok) {
const errorMessage = responseData.message || responseData.error || `HTTP error! status: ${response.status}`;
console.error('API Error (Send OTP):', responseData);
throw new Error(errorMessage);
  }

  console.log('OTP Sent Successfully:', responseData);
  // Store data needed for Step 2 (assuming phone_number from form is sufficient,
  // or use responseData if it contains an ID or other relevant info)
  setUserDataForOtp({ phone_number: detailsFormData.phone_number });
  setCurrentStep('otp'); // Move to the OTP step
  // Clear form data here if you don't want it persistent when going back
  // setDetailsFormData({ first_name: "", last_name: "", phone_number: "", email: "", password: "" });

} catch (err) {
  console.error('Error sending OTP:', err.message);
  setError(err.message || 'Failed to send OTP.'); // Set error state for Step 1
} finally {
  setIsLoading(false); // Stop loading indicator
}
  };

  // --- Handlers for Step 2 (OTP Verification) ---
  // This handler is called by the OtpContent component on successful verification
  const handleOtpSuccess = () => {
console.log("OTP Verification Successful!");
setSuccess(true); // Set overall success state for Snackbar
setError(null); // Clear any pending errors
// Trigger parent's callback to refresh list (UserManagment's refetchUsers)
if (onUserAdded) {
// Use a slight delay to allow Snackbar to show before closing modal
setTimeout(() => {
 onUserAdded(); // Trigger refresh
 handleModalClose(); // Close the modal
}, 500); // Adjust delay as needed
} else {
 // If no onUserAdded callback, just close and reset
 setTimeout(() => {
 handleModalClose();
 }, 500);
}
  };

  // This handler is called by the OtpContent component on failed verification
  const handleOtpFailure = (errorMessage) => {
  console.error("OTP Verification Failed:", errorMessage);
  // OtpContent handles showing "Invalid OTP" message internally based on isOtpCorrect state.
  // We could optionally set a more general error message here in the parent if needed.
  // setError(errorMessage || "OTP verification failed.");
  // Keep the modal open and on the OTP step, OtpContent clears its inputs on failure.
  };


  // --- General Modal Handlers ---
// Handle closing the modal, reset steps and form data
const handleModalClose = () => {
if (!isLoading) { // Prevent closing while loading/submitting step 1
setCurrentStep('details'); // Reset step on close
setDetailsFormData({ first_name: "", last_name: "", phone_number: "", email: "", password: "" }); // Reset form
setUserDataForOtp(null); // Clear step 2 data
setError(null); // Clear errors
setSuccess(false); // Clear success state
setShowPassword(false); // Reset password visibility
// Call the parent's actual close handler
handleClose();
}
};

const handleCloseSnackbar = () => {
setError(null);
setSuccess(false);
};


  return (
<>
  {/* MODAL: Controlled by parent's open/handleClose */}
  <Modal
className="flex items-center justify-center"
open={open}
onClose={handleModalClose} // Use the internal handler that resets state
aria-labelledby="add-user-modal-title"
aria-describedby="add-user-modal-description"
disableEscapeKeyDown={isLoading} // Disable closing with Escape while loading step 1 submit
  >
<div className="bg-white w-[600px] items-center justify-center flex flex-col rounded-lg overflow-hidden">

  {/* Modal Header */}
  <div className=" bg-[#00173C] w-full text-white px-8 py-3 flex justify-between items-center">
<Typography variant="h6" component="h2" id="add-user-modal-title">
  {currentStep === 'details' ? 'Add Owner' : 'Verify Mobile OTP'} {/* Dynamic Title */}
</Typography>
{/* Close button - uses the internal handler */}
<IconButton onClick={handleModalClose} color="inherit" sx={{ p: 0, minWidth: 0 }} disabled={isLoading}>
  <CloseIcon />
</IconButton>
  </div>

  {/* Modal Body - Conditionally Render Step 1 Form or Step 2 OTP */}
  {currentStep === 'details' ? (
// Step 1: User Details Form
<>
  {/* <img
src={image}
alt="User Profile"
className="w-24 h-24 mt-8 rounded-full object-cover"
  /> */}
  <Box className="w-full px-8 pt-4">
<span className="text-xl font-semibold text-[#00113D]">User Details</span>
  </Box>
  <div className="p-4 px-8 w-full grid gap-4 mb-6 grid-cols-2"> {/* Adjusted mb */}
{/* First Name */}
<TextField
  fullWidth
  label="First Name"
  variant="outlined"
  margin="normal"
  size="small"
  name="first_name"
  value={detailsFormData.first_name}
  onChange={handleDetailsInputChange}
  required
/>
{/* Last Name */}
<TextField
  fullWidth
  label="Last Name"
  variant="outlined"
  margin="normal"
  size="small"
  name="last_name"
  value={detailsFormData.last_name}
  onChange={handleDetailsInputChange}
  required
/>
{/* Email */}
<TextField
  fullWidth
  label="Email"
  variant="outlined"
  margin="normal"
  type="email"
  size="small"
  name="email"
  value={detailsFormData.email}
  onChange={handleDetailsInputChange}
  required
  sx={{ gridColumn: 'span 2' }}
/>
{/* Phone Number */}
<TextField
  label="Phone Number"
  type="tel"
  variant="outlined"
  margin="normal"
  fullWidth
  size="small"
  name="phone_number"
  value={detailsFormData.phone_number}
  onChange={handleDetailsInputChange}
  required
  sx={{ gridColumn: 'span 2' }}
/>
{/* Password */}
<TextField
  fullWidth
  label="Password"
  variant="outlined"
  margin="normal"
  type={showPassword ? "text" : "password"}
  size="small"
  name="password"
  value={detailsFormData.password}
  onChange={handleDetailsInputChange}
  required
  sx={{ gridColumn: 'span 2' }}
  InputProps={{
endAdornment: (
  <InputAdornment position="end">
<IconButton
  onClick={handleTogglePasswordVisibility}
   edge="end"
  size="small"
>
  {showPassword ? <VisibilityOff /> : <Visibility />}
</IconButton>
  </InputAdornment>
),
  }}
/>
  </div>
</>
  ) : (
// Step 2: OTP Verification Form (Render the imported component)
// Pass necessary data and callbacks to OtpContent
<OtpContent
initialData={userDataForOtp} // Data from Step 1 (e.g., phone_number)
onVerificationSuccess={handleOtpSuccess} // Callback for success
onVerificationFailure={handleOtpFailure} // Callback for failure
adminToken={adminToken} // Pass adminToken if OTP confirmation needs it
 />
  )}


  {/* Modal Actions (Buttons) */}
  <Box className="flex pb-8 gap-4 w-full px-10 mt-4">
 {/* Back button for OTP step */}
 {currentStep === 'otp' && (
 <button
 type="button"
 onClick={() => {
 setCurrentStep('details'); // Go back to details step
 setError(null); // Clear any pending errors
 // Note: OtpContent internally clears its OTP inputs on failure,
 // but form data in Step 1 is preserved by default.
 }}
 className="flex-1 py-2 text-sm rounded-full bg-gray-200 text-gray-800 border border-gray-400 hover:bg-gray-300 transition"
 disabled={isLoading} // Disable if Step 1 submit was loading (unlikely to be here, but safe)
 >
 Back
 </button>
 )}

{/* Action Button (Changes text based on step) */}
{currentStep === 'details' && ( // Button only visible on details step
<button
type="button"
onClick={handleSendOtpSubmit} // Call the handler for Step 1 submit
className={`flex-1 text-sm py-2 rounded-full bg-[#00113D] text-white flex items-center justify-center hover:bg-blue-900 transition ${isLoading || !adminToken ? 'opacity-50 cursor-not-allowed' : ''}`}
disabled={isLoading || !adminToken} // Disable while loading or no token
>
{isLoading ? <CircularProgress size={20} color="inherit" /> : 'Send OTP'} {/* Button text for Step 1 */}
</button>
)}

{/* Cancel button (only visible on details step) */}
 {currentStep === 'details' && (
 <button
type="button"
onClick={handleModalClose} // Call the internal handler
className="flex-1 py-2 text-sm rounded-full bg-[#FDEAEA] text-red-700 border border-red-700 hover:bg-red-50 transition"
disabled={isLoading} // Disable while loading
 >
Cancel
 </button>
 )}
 {/* Note: The 'Submit' button for OTP step is *inside* OtpContent */}

  </Box>
   {/* Display Modal-level Error Message (primarily for Step 1 submit) */}
   {error && currentStep === 'details' && ( // Only show error for step 1 submit if on details step
<Typography color="error" sx={{ mb: 2, px: 8, textAlign: 'center', width: '100%' }}>
{error}
</Typography>
   )}

</div>
  </Modal>

  {/* Snackbar for overall success messages (triggered by handleOtpSuccess) */}
  <Snackbar open={success} autoHideDuration={6000} onClose={handleCloseSnackbar}>
<Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
  User added and verified successfully!
</Alert>
  </Snackbar>
   {/* Optional: Snackbar for overall error messages (can be used for step 1 errors too) */}
   {/* {error && (
   <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseSnackbar}>
   <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
   {error}
   </Alert>
   </Snackbar>
   )} */}
</>
  );
};

export default AddOwnerModal;