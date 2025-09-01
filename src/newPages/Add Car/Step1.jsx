import React, { useEffect, useState } from "react";
import makesData from "../../api/makes.json";
import modelsData from "../../api/models.json";
import useVehicleFormStore from "../../store/useVehicleFormStore";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";

// Options for the Select components
const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 70 }, (_, i) => {
  const year = currentYear - i;
  return { value: year.toString(), label: year.toString() };
});

const plateRegionOptions = [
  { value: "Addis Ababa", label: "Addis Ababa" },
  { value: "Oromia", label: "Oromia" },
  { value: "Amhara", label: "Amhara" },
  { value: "Tigray", label: "Tigray" },
  { value: "SNNPR", label: "SNNPR" },
  { value: "Sidama", label: "Sidama" },
  { value: "Somali", label: "Somali" },
  { value: "Benishangul-Gumuz", label: "Benishangul-Gumuz" },
  { value: "Afar", label: "Afar" },
  { value: "Gambela", label: "Gambela" },
  { value: "Harari", label: "Harari" },
  { value: "Dire Dawa", label: "Dire Dawa" },
  { value: "Other", label: "Other/Not Specified" },
];

const seatOptions = [
  { value: "2", label: "2 Seats" },
  { value: "4", label: "4 Seats" },
  { value: "5", label: "5 Seats" },
  { value: "6", label: "6 Seats" },
  { value: "7", label: "7 Seats" },
  { value: "8+", label: "8+ Seats" },
];

const mileageRangeOptions = [
  { value: "0-20000", label: "0 - 20,000 km" },
  { value: "20001-50000", label: "20,001 - 50,000 km" },
  { value: "50001-100000", label: "50,001 - 100,000 km" },
  { value: "100001-150000", label: "100,001 - 150,000 km" },
  { value: "150001-200000", label: "150,001 - 200,000 km" },
  { value: "200001-250000", label: "200,001 - 250,000 km" },
  { value: "250000+", label: "Over 250,000 km" },
];

const Step1 = ({ nextStep, userId, setUserId }) => {
  const [makeDisplayArray, setMakeDisplayArray] = useState([]);
  const [modelOptions, setModelOptions] = useState([]);
  const { vehicleData, updateVehicleData } = useVehicleFormStore();

  useEffect(() => {
    const makeOptions = makesData.Makes.map((make) => make.make_display);
    setMakeDisplayArray(makeOptions);
  }, []);

  useEffect(() => {
    const selectedMake = vehicleData.make;
    if (selectedMake && selectedMake !== "Other") {
      const selectedMakeModels = modelsData.find(
        (model) => Object.keys(model)[0] === selectedMake
      );
      setModelOptions(
        selectedMakeModels ? selectedMakeModels[selectedMake] : []
      );
    } else {
      setModelOptions([]);
    }
  }, [vehicleData.make]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    updateVehicleData({ [name]: value });
  };

  const handleMakeChange = (event) => {
    const newMake = event.target.value;
    // When make changes, reset the model and otherMake fields
    updateVehicleData({ make: newMake, model: "", otherMake: "" });
  };

  // Form validation logic updated for "Other" make option
  const isFormValid =
    userId.trim() !== "" &&
    vehicleData.city.trim() !== "" &&
    vehicleData.fuelType !== "" &&
    vehicleData.seats !== "" &&
    vehicleData.vehicleNumber.trim() !== "" &&
    vehicleData.mileage !== "" &&
    vehicleData.year !== "" &&
    vehicleData.plateRegion !== "" &&
    vehicleData.category !== "" &&
    vehicleData.make !== "" &&
    (vehicleData.make === "Other"
      ? vehicleData.otherMake.trim() !== "" && vehicleData.model.trim() !== ""
      : vehicleData.model !== "") &&
    vehicleData.transmission !== "";

  return (
    <div className="flex flex-col lg:flex-row gap-10 h-fit">
      <div className="bg-white rounded-2xl shadow-sm p-6 md:p-10 w-full lg:w-2/3">
        {/* Progress Bar */}
        <div className="flex items-center">
          <div className="w-1/5 border-b-4 border-[#00113D]"></div>
          <div className="w-4/5 border-b-4 border-gray-200"></div>
        </div>
        <Typography variant="body1" className="text-gray-800 my-4 font-medium">
          Step 1 of 5
        </Typography>

        {/* Heading */}
        <Typography
          variant="h4"
          component="h1"
          className="font-semibold my-8 !text-2xl md:!text-3xl"
        >
          List Vehicle For User
        </Typography>

        {/* Form Fields */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* User ID Field */}
          <TextField
            label="User ID"
            variant="outlined"
            name="userId"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            size="small"
            fullWidth
            required
            helperText="The ID of the user you are listing for."
          />

          {/* City Field */}
          <TextField
            label="City"
            variant="outlined"
            name="city"
            value={vehicleData.city || ""}
            onChange={handleChange}
            size="small"
            fullWidth
            required
            helperText="City where the vehicle is located."
          />

          <FormControl fullWidth required size="small">
            <InputLabel>Fuel Type</InputLabel>
            <Select
              label="Fuel Type"
              name="fuelType"
              value={vehicleData.fuelType || ""}
              onChange={handleChange}
            >
              <MenuItem value="Petrol">Petrol (Benzene)</MenuItem>
              <MenuItem value="Diesel">Diesel (Nafta)</MenuItem>
              <MenuItem value="Electric">Electric</MenuItem>
              <MenuItem value="Hybrid">Hybrid</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth required size="small">
            <InputLabel>Number of Seats</InputLabel>
            <Select
              label="Number of Seats"
              name="seats"
              value={vehicleData.seats || ""}
              onChange={handleChange}
            >
              {seatOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Plate Number"
            variant="outlined"
            name="vehicleNumber"
            value={vehicleData.vehicleNumber || ""}
            onChange={handleChange}
            size="small"
            fullWidth
            required
          />

          <FormControl fullWidth required size="small">
            <InputLabel>Mileage</InputLabel>
            <Select
              label="Mileage"
              name="mileage"
              value={vehicleData.mileage || ""}
              onChange={handleChange}
            >
              {mileageRangeOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth required size="small">
            <InputLabel>Manufactured Year</InputLabel>
            <Select
              label="Manufactured Year"
              name="year"
              value={vehicleData.year || ""}
              onChange={handleChange}
            >
              {yearOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth required size="small">
            <InputLabel>Plate Region</InputLabel>
            <Select
              label="Plate Region"
              name="plateRegion"
              value={vehicleData.plateRegion || ""}
              onChange={handleChange}
            >
              {plateRegionOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth required size="small">
            <InputLabel>Car Type</InputLabel>
            <Select
              label="Car Type"
              name="category"
              value={vehicleData.category || ""}
              onChange={handleChange}
            >
              <MenuItem value="Hatchback">Hatchback</MenuItem>
              <MenuItem value="Sedan">Sedan</MenuItem>
              <MenuItem value="SUV">SUV</MenuItem>
              <MenuItem value="MUV">MUV</MenuItem>
              <MenuItem value="Coupe">Coupe</MenuItem>
              <MenuItem value="Convertible">Convertible</MenuItem>
              <MenuItem value="Pickup Truck">Pickup Truck</MenuItem>
              <MenuItem value="Minivan">Minivan</MenuItem>
              <MenuItem value="Van">Van</MenuItem>
            </Select>
          </FormControl>

          {/* Car Make Dropdown - Spans full width */}
          <FormControl variant="outlined" fullWidth size="small" required>
            <InputLabel id="car-make-label">Car Make</InputLabel>
            <Select
              labelId="car-make-label"
              label="Car Make"
              name="make"
              value={vehicleData.make || ""}
              onChange={handleMakeChange}
            >
              {makeDisplayArray.map((make) => (
                <MenuItem key={make} value={make}>
                  {make}
                </MenuItem>
              ))}
              <MenuItem value="Other">Other</MenuItem>
            </Select>
          </FormControl>

          {/* --- NEW: Conditional Fields for Make/Model --- */}
          {vehicleData.make === "Other" ? (
            <>
              <TextField
                label="Custom Car Make"
                variant="outlined"
                name="otherMake"
                value={vehicleData.otherMake || ""}
                onChange={handleChange}
                size="small"
                fullWidth
                required
                helperText="Please specify the vehicle make."
              />
              <TextField
                label="Custom Car Model"
                variant="outlined"
                name="model"
                value={vehicleData.model || ""}
                onChange={handleChange}
                size="small"
                fullWidth
                required
                helperText="Please specify the vehicle model."
              />
            </>
          ) : (
            // Original Car Model Dropdown - now occupies a full grid cell
            <FormControl
              variant="outlined"
              fullWidth
              size="small"
              required
              disabled={!vehicleData.make || modelOptions.length === 0}
            >
              <InputLabel id="car-model-label">Car Model</InputLabel>
              <Select
                labelId="car-model-label"
                label="Car Model"
                name="model"
                value={vehicleData.model || ""}
                onChange={handleChange}
              >
                {modelOptions.map((model) => (
                  <MenuItem key={model} value={model}>
                    {model}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <FormControl fullWidth required size="small">
            <InputLabel>Transmission Type</InputLabel>
            <Select
              label="Transmission Type"
              name="transmission"
              value={vehicleData.transmission || ""}
              onChange={handleChange}
            >
              <MenuItem value="Manual">Manual</MenuItem>
              <MenuItem value="Automatic">Automatic</MenuItem>
            </Select>
          </FormControl>
        </div>

        {/* Action Button */}
        <div className="w-full flex justify-end mt-8">
          <button
            onClick={nextStep}
            className={`md:w-fit cursor-pointer w-full items-center justify-center flex text-white text-xs rounded-full px-8 py-3 mt-8  transition bg-[#00113D] hover:bg-blue-900"
            ${
              isFormValid
                ? "bg-[#00113D] hover:bg-blue-900 cursor-pointer"
                : "bg-[#454545] cursor-not-allowed opacity-70"
            }`}
            disabled={!isFormValid}
          >
            Continue
          </button>
        </div>
      </div>

      <div className="p-6 w-full lg:w-1/4 bg-blue-100 rounded-lg md:flex hidden flex-col h-fit">
        <Typography variant="h6" className="font-semibold mb-2">
          Admin Instructions
        </Typography>
        <Typography variant="body2" className="text-gray-700">
          Enter the User's ID and provide the vehicle's core details to begin
          the listing process. All fields on this page are required.
        </Typography>
      </div>
    </div>
  );
};

export default Step1;
