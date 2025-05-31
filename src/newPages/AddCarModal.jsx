// AddCarModal.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Modal,
  Box,
  Typography,
  CircularProgress,
  Button, // Added Button for modal actions
} from "@mui/material";
import { IoMdClose } from "react-icons/io"; // Close icon
import Step1 from "./Add Car/Step1"; // Adjust path if necessary
import Step2 from "./Add Car/Step2"; // Adjust path if necessary
import Step3 from "./Add Car/Step3"; // Adjust path if necessary
import Step4 from "./Add Car/Step4"; // Adjust path if necessary
import Step5 from "./Add Car/Step5"; // Adjust path if necessary
import { v4 as uuidv4 } from "uuid"; // Import UUID generator

import useVehicleFormStore from "../store/useVehicleFormStore"; // Adjust path as needed
import AddCar from "./Add Car/AddCar";

// Style for the main modal box
const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 900, // Adjust width as needed
  bgcolor: "#f9f9ff", // Changed background to match your step components
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
  maxHeight: "95vh", // Allow more height
  overflowY: "auto", // Add scrolling
  outline: "none", // Remove default modal outline
  // Added some padding on mobile if needed
  "@media (max-width: 600px)": {
    width: "95%", // Make modal full width on small screens
    p: 2, // Reduce padding
  },
};

const AddCarModal = ({ open, onClose }) => {
  const [step, setStep] = useState(1);
  const [vehicleId, setVehicleId] = useState(null);
  const { vehicleData, updateVehicleData } = useVehicleFormStore();

  useEffect(() => {
    console.log("AddCar mounted - Setting vehicleId...");
    const tempVehicleId = uuidv4(); // Replace with actual vehicleId from API response
    setVehicleId(tempVehicleId);
    updateVehicleData({ id: tempVehicleId }); // Update only once on mount
  }, []); // Empty dependency array ensures it runs only once when mounted

  const handleVehicleCreationSuccess = useCallback((newVehicleId) => {
    console.log(
      "AddCar: handleVehicleCreationSuccess - Received vehicleId:",
      newVehicleId
    );
    setVehicleId(newVehicleId);
  }, []);

  const nextStep = () => {
    if (step === 1) {
      console.log("AddCar: Simulating vehicle creation after Step 1...");
      setTimeout(() => {
        const tempVehicleId = "vehicle-id-from-step1-123"; // Replace with actual vehicleId from API
        handleVehicleCreationSuccess(tempVehicleId);
        setStep(2);
      }, 1000);
    } else {
      setStep((prev) => Math.min(prev + 1, 5));
    }
  };

  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  // Access store actions for submission and reset
  const { submitVehicleListing, resetStore } = useVehicleFormStore();

  // Local state for managing submission loading and errors (for the final submit)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Effect to manage modal open/close and state reset
  useEffect(() => {
    // When the modal opens
    if (open) {
      console.log(
        "Modal opening, resetting store state and setting step to 1."
      );
      resetStore(); // Reset the store's vehicle form state
      setStep(1); // Start from Step 1
      setError(null); // Clear any previous errors
    } else {
      // When the modal closes (optional: could also reset on open)
      console.log("Modal closing, resetting store state.");
      resetStore(); // Ensure state is clean after closing
      setStep(1); // Reset step for the next time the modal opens
      setError(null); // Clear errors on close
    }
  }, [open, resetStore]); // Depend on the 'open' prop and resetStore action

  // Handler to move to the next step
  const handleNextStep = useCallback(() => {
    setStep((prev) => Math.min(prev + 1, 5)); // Assuming a maximum of 5 steps
  }, []); // Memoize the callback

  // Handler to move to the previous step
  const handlePrevStep = useCallback(() => {
    setStep((prev) => Math.max(prev - 1, 1)); // Assuming a minimum of 1 step
  }, []); // Memoize the callback

  // Handler for the final submission (will be passed to Step5)
  const handleFinalSubmit = async () => {
    setError(null); // Clear previous errors
    setIsSubmitting(true); // Indicate submission is in progress
    console.log("Attempting to submit vehicle listing from modal...");

    try {
      // Call the store's submitVehicleListing action
      await submitVehicleListing();
      console.log("Vehicle listing submitted successfully via modal.");

      // If submission is successful, close the modal
      // The store's submitVehicleListing is expected to call resetStore on success
      onClose();

      // Optional: Show a success message to the user in the parent component
      // This would require passing a success callback prop from VehicleManagement.
    } catch (err) {
      console.error("Vehicle listing submission failed:", err);
      // Display a user-friendly error message
      setError(
        `Submission failed: ${
          err.message || "Unknown error"
        }. Please check your inputs.`
      );
    } finally {
      setIsSubmitting(false); // End submission process
    }
  };

  // Render the current step component based on the 'step' state
  const renderStep = () => {
    switch (step) {
      case 1:
        return <Step1 nextStep={handleNextStep} />;
      case 2:
        // Assuming Step2 reads vehicleId from the store (vehicleData.id) and doesn't need a prop
        return (
          <Step2
            nextStep={handleNextStep}
            prevStep={handlePrevStep}
            vehicleId={vehicleId}
          />
        );
      case 3:
        return <Step3 nextStep={handleNextStep} prevStep={handlePrevStep} />;
      case 4:
        // IMPORTANT: In Step4, change the "Submit Listing" button to "Continue"
        // and make it call nextStep={handleNextStep} instead of submitting directly.
        return <Step4 nextStep={handleNextStep} prevStep={handlePrevStep} />;
      case 5:
        // Pass the final submission handler and loading state to Step5
        return (
          <Step5
            prevStep={handlePrevStep}
            onSubmitListing={handleFinalSubmit}
            isSubmitting={isSubmitting}
          />
        );
      default:
        return <Typography color="error">Invalid Step</Typography>;
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose} // Use the onClose prop to close the modal
      aria-labelledby="add-car-modal-title"
      aria-describedby="add-car-modal-description"
      className="flex items-center justify-center" // Center the modal
    >
      <Box sx={modalStyle}>
        {/* Close Button */}
        <Button
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
          aria-label="close"
        >
          <IoMdClose size={24} />
        </Button>
        <AddCar />
      </Box>
    </Modal>
  );
};

export default AddCarModal;
