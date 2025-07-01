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
} from "@mui/material";

// Options for the new Select components
const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 70 }, (_, i) => {
  // Years for the last 70 years
  const year = currentYear - i;
  return { value: year.toString(), label: year.toString() };
});

const plateRegionOptions = [
  { value: "AA", label: "Addis Ababa" },
  { value: "OR", label: "Oromia" },
  { value: "AM", label: "Amhara" },
  { value: "TG", label: "Tigray" },
  { value: "SN", label: "SNNPR" },
  { value: "SD", label: "Sidama" },
  { value: "SM", label: "Somali" },
  { value: "BG", label: "Benishangul-Gumuz" },
  { value: "AF", label: "Afar" },
  { value: "GM", label: "Gambela" },
  { value: "HR", label: "Harari" },
  { value: "DR", label: "Dire Dawa" },
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

const Step1 = ({ nextStep }) => {
  const [makeDisplayArray, setMakeDisplayArray] = useState([]);
  const [modelOptions, setModelOptions] = useState([]);

  const { vehicleData, updateVehicleData } = useVehicleFormStore();

  useEffect(() => {
    const makeOptions = makesData.Makes.map((make) => make.make_display);
    setMakeDisplayArray(makeOptions);
  }, []);

  useEffect(() => {
    const selectedMake = vehicleData.make;
    if (selectedMake) {
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

  // Updated validation logic for new Select fields
  const isFormValid =
    vehicleData.fuelType !== "" &&
    vehicleData.seats !== "" && // Changed from number check to string check
    vehicleData.vehicleNumber !== "" &&
    vehicleData.mileage !== "" && // Changed from number check to string check
    vehicleData.year !== "" && // Changed from number check to string check
    vehicleData.plateRegion !== "" && // Was okay, but now it's definitely a select
    vehicleData.category !== "" &&
    vehicleData.make !== "" &&
    vehicleData.model !== "" &&
    vehicleData.transmission !== "";

  const handleContinueClick = () => {
    if (isFormValid) {
      nextStep();
    } else {
      console.log("Form is invalid. Please fill all required fields.");
      // You might want to show a user-friendly message or highlight errors
    }
  };

  return (
    <div className="flex gap-10 h-fit">
      <div className="bg-white rounded-2xl shadow-sm p-10 w-full md:w-2/3">
        {/* Progress Bar */}
        <div className="flex items-center justify-center">
          <div className="w-1/5 border-b-4 border-[#00113D] mr-2"></div>
          <div className="w-4/5 border-b-4 border-blue-200"></div>
        </div>

        {/* Heading */}
        <div className="flex justify-between w-full">
          <div className="flex flex-col w-1/2 items-start">
            <p className="text-xl text-gray-800 my-4 font-medium text-center mb-4">
              Steps 1 of 5
            </p>
          </div>
        </div>
        <h1 className="text-3xl font-semibold my-8">Car Details</h1>

        {/* Form Fields */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormControl fullWidth required size="small">
            <InputLabel>Fuel Type</InputLabel>
            <Select
              label="Fuel Type" // Note: MUI recommends label prop match InputLabel
              name="fuelType"
              value={vehicleData.fuelType || ""}
              onChange={handleChange}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              <MenuItem value="Petrol">Petrol (Benzene)</MenuItem>
              <MenuItem value="Diesel">Diesel (Nafta)</MenuItem>
              <MenuItem value="Electric">Electric</MenuItem>
              <MenuItem value="Hybrid">Hybrid</MenuItem>
            </Select>
          </FormControl>

          {/* Number of Seats - Changed to Select */}
          <FormControl fullWidth required size="small">
            <InputLabel>Number of Seats</InputLabel>
            <Select
              label="Number of Seats"
              name="seats"
              value={vehicleData.seats || ""}
              onChange={handleChange}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
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

          {/* Mileage - Changed to Select */}
          <FormControl fullWidth required size="small">
            <InputLabel>Mileage</InputLabel>
            <Select
              label="Mileage"
              name="mileage"
              value={vehicleData.mileage || ""}
              onChange={handleChange}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {mileageRangeOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Manufactured Year - Changed to Select */}
          <FormControl fullWidth required size="small">
            <InputLabel>Manufactured Year</InputLabel>
            <Select
              label="Manufactured Year"
              name="year"
              value={vehicleData.year || ""}
              onChange={handleChange}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {yearOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Plate Region - Changed to Select */}
          <FormControl fullWidth required size="small">
            <InputLabel>Plate Region</InputLabel>
            <Select
              label="Plate Region"
              name="plateRegion"
              value={vehicleData.plateRegion || ""}
              onChange={handleChange}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
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
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              <MenuItem value="Hatchback">Hatchback</MenuItem>
              <MenuItem value="Sedan">Sedan</MenuItem>
              <MenuItem value="MUV">MUV/SUV</MenuItem>{" "}
              {/* Combined for simplicity or keep separate */}
              <MenuItem value="SUV">SUV</MenuItem>
              <MenuItem value="Coupe">Coupe</MenuItem>
              <MenuItem value="Convertible">Convertible</MenuItem>
              <MenuItem value="Pickup Truck">Pickup Truck</MenuItem>
              <MenuItem value="Minivan">Minivan</MenuItem>
              <MenuItem value="Van">Van</MenuItem>
            </Select>
          </FormControl>

          <div className="flex gap-6">
            <FormControl variant="outlined" fullWidth size="small" required>
              <InputLabel id="car-make-label">Car Make</InputLabel>
              <Select
                labelId="car-make-label"
                label="Car Make"
                name="make"
                value={vehicleData.make || ""}
                onChange={(event) => {
                  updateVehicleData({ make: event.target.value, model: "" });
                }}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {makeDisplayArray.map((make) => (
                  <MenuItem key={make} value={make}>
                    {make}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

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
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {vehicleData.make &&
                  modelOptions.map((model) => (
                    <MenuItem key={model} value={model}>
                      {model}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </div>

          <FormControl fullWidth required size="small">
            <InputLabel>Transmission Type</InputLabel>
            <Select
              label="Transmission Type"
              name="transmission"
              value={vehicleData.transmission || ""}
              onChange={handleChange}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              <MenuItem value="Manual">Manual</MenuItem>
              <MenuItem value="Automatic">Automatic</MenuItem>
            </Select>
          </FormControl>
        </div>

        {/* Submit Button */}
        <div className="w-full justify-end items-end flex">
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

      <div className="p-4 w-1/4 bg-blue-200 py-6 md:flex hidden font-light h-fit">
        Provide details about your car to get started.
      </div>
    </div>
  );
};

export default Step1;
