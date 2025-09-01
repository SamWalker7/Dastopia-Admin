import React, { useState, useEffect } from "react";
import Step1 from "./Step1";
import Step2 from "./Step2";
import Step3 from "./Step3";
import Step4 from "./Step4";
import Step5 from "./Step5";
import useVehicleFormStore from "../../store/useVehicleFormStore";
import { v4 as uuidv4 } from "uuid";
import { useNavigate } from "react-router-dom"; // Or your navigation library

const AddCar = () => {
  const [step, setStep] = useState(1);
  const {
    vehicleData,
    updateVehicleData,
    adminListVehicleForUser,
    resetStore,
  } = useVehicleFormStore();
  const navigate = useNavigate();

  // State for admin-specific fields
  const [userId, setUserId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // On component mount, generate a temporary unique ID for the vehicle form session.
  // This is used for associating uploads (like images) before the final vehicle record is created in the database.
  useEffect(() => {
    // Check if an ID already exists from a persisted session
    if (!vehicleData.id) {
      const tempVehicleId = uuidv4();
      updateVehicleData({ id: tempVehicleId });
    }
  }, [updateVehicleData, vehicleData.id]);

  const nextStep = () => {
    setStep((prev) => Math.min(prev + 1, 5));
  };

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  // Final submission handler
  const handleSubmit = async () => {
    if (!userId) {
      setError("User ID is required to list a vehicle for a user.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await adminListVehicleForUser(userId);
      console.log("Vehicle listed successfully:", response);

      // On success: show a success message, clear the form, and navigate away.
      alert("Vehicle has been successfully listed for the user!"); // Replace with a better UI notification
      resetStore();
      navigate("/admin/dashboard"); // Navigate to a relevant page after success
    } catch (err) {
      console.error("Failed to list vehicle:", err);
      setError(
        err.message || "An unexpected error occurred. Please try again."
      );
      // Keep user on the form to correct any issues.
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#F8F8FF] p-4 md:p-8">
      {/* Display submission error messages */}
      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {step === 1 && (
        <Step1 nextStep={nextStep} userId={userId} setUserId={setUserId} />
      )}
      {step === 2 && (
        <Step2
          nextStep={nextStep}
          prevStep={prevStep}
          vehicleId={vehicleData.id} // Pass the temporary ID for uploads
        />
      )}
      {step === 3 && <Step3 nextStep={nextStep} prevStep={prevStep} />}
      {step === 4 && <Step4 nextStep={nextStep} prevStep={prevStep} />}
      {step === 5 && (
        <Step5
          prevStep={prevStep}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

export default AddCar;
