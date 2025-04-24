import React, { useState, useCallback, useEffect } from "react";
import Step1 from "./Step1";
import Step2 from "./Step2";
import Step3 from "./Step3";
import Step4 from "./Step4";
import Step5 from "./Step5";
import useVehicleFormStore from "../../store/useVehicleFormStore";
import { v4 as uuidv4 } from "uuid"; // Import UUID generator

const AddCar = () => {
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

  return (
    <>
      <div className="bg-[#F8F8FF] scale-90  ">
        {step === 1 && <Step1 nextStep={nextStep} />}
        {step === 2 && (
          <Step2
            nextStep={nextStep}
            prevStep={prevStep}
            vehicleId={vehicleId}
          />
        )}
        {step === 3 && <Step3 nextStep={nextStep} prevStep={prevStep} />}
        {step === 4 && <Step4 nextStep={nextStep} prevStep={prevStep} />}
        {step === 5 && <Step5 prevStep={prevStep} />}
      </div>
    </>
  );
};

export default AddCar;
