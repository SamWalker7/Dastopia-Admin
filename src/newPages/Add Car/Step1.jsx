import Dropdown from "./Dropdown";
import makesData from "../../api/makes.json";
import modelsData from "../../api/models.json";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useVehicleFormStore from "../../store/useVehicleFormStore";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
const Step1 = ({ nextStep }) => {
  const [carMake, setCarMake] = useState("");
  const [carModel, setCarModel] = useState("");
  const [makeDisplayArray, setMakeDisplayArray] = useState([]);
  const [modelOptions, setModelOptions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const makeOptions = makesData.Makes.map((make) => make.make_display);
    setMakeDisplayArray(makeOptions);
  }, []);

  // Update model options based on selected car make
  useEffect(() => {
    if (carMake) {
      // Find the models for the selected make in modelsData
      const selectedMakeModels = modelsData.find(
        (model) => Object.keys(model)[0] === carMake
      );
      setModelOptions(selectedMakeModels ? selectedMakeModels[carMake] : []);
    } else {
      setModelOptions([]); // Clear models if no make is selected
    }
  }, [carMake]);

  const [millage, setMillage] = useState("");
  const [seats, setSeats] = useState("");
  const [manufacturedYear, setManufacturedYear] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [carType, setCarType] = useState("");
  const [transmissionType, setTransmissionType] = useState("");
  const handleNext = async () => {
    navigate("/Step2", {
      state: {
        millage,
        seats,
        manufacturedYear,
        fuelType,
        carType,
        transmissionType,
      },
    });
  };
  const { vehicleData, updateVehicleData } = useVehicleFormStore();

  const handleChange = (e) => {
    updateVehicleData({ [e.target.name]: e.target.value });
    console.log(vehicleData);
  };

  return (
    <div className="flex gap-10">
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
        <div className="grid grid-cols-1  gap-4 md:grid-cols-2">
          {/* <div className="relative inline-block my-3 text-xl w-full">
            <label className="absolute -top-2 left-3 text-lg bg-white px-1 text-gray-500">
              Total Mileage
            </label>
            <div className="border border-gray-400 items-center rounded-md flex bg-white">
              <input
                type="text"
                placeholder="Enter total distance in kilometers"
                value={millage}
                onChange={(e) => setMillage(e.target.value)}
                className="flex justify-between w-full p-3 py-6 bg-white text-gray-500 rounded-md focus:outline focus:outline-1 focus:outline-blue-400"
              />
            </div>
          </div> */}
          {/* <Dropdown
            label="Fuel Type"
            options={["Diesel", "Petrol"]}
            selectedOption={fuelType}
            onSelect={(option) => setFuelType(option)}
          /> */}
          <FormControl fullWidth>
            <InputLabel size="small">Fuel Type</InputLabel>
            <Select
              label="Fuel Type"
              name="fuelType"
              value={vehicleData.fuelType}
              onChange={handleChange}
              size="small"
            >
              <MenuItem value="Petrol">Petrol(Benzene)</MenuItem>
              <MenuItem value="Diesel">Diesel(Nafta)</MenuItem>
              <MenuItem value="Electric">Electric</MenuItem>
              <MenuItem value="Hybrid">Hybrid</MenuItem>
            </Select>
          </FormControl>
          {/* <div className="relative inline-block my-3 text-xl w-full">
            <label className="absolute -top-2 left-3 text-lg bg-white px-1 text-gray-500">
              Number of Seats
            </label>
            <div className="border border-gray-400 items-center rounded-md flex bg-white">
              <input
                type="text"
                placeholder="Enter number of seats"
                value={seats}
                onChange={(e) => setSeats(e.target.value)}
                className="flex justify-between w-full p-3 py-6 bg-white text-gray-500 rounded-md focus:outline focus:outline-1 focus:outline-blue-400"
              />
            </div>
          </div> */}
          <TextField
            label="Number of Seats"
            variant="outlined"
            name="seats"
            value={vehicleData.seats}
            onChange={handleChange}
            type="number"
            size="small"
            fullWidth
          />{" "}
          <TextField
            label="Plate Number"
            variant="outlined"
            name="vehicleNumber"
            value={vehicleData.vehicleNumber}
            onChange={handleChange}
            size="small"
            fullWidth
          />{" "}
          <TextField
            label="Mileage"
            variant="outlined"
            name="mileage"
            value={vehicleData.mileage}
            onChange={handleChange}
            type="number"
            size="small"
            fullWidth
          />{" "}
          <TextField
            label="Manufactured Year"
            variant="outlined"
            name="year"
            value={vehicleData.year}
            onChange={handleChange}
            type="number"
            size="small"
            fullWidth
          />
          {/* <Dropdown
            label="Car Type"
            options={[
              "Hatchback",
              "Sedan",
              "SUV",
              "MUV",
              "Coupe",
              "Convertible",
              "Pickup Truck",
            ]}
            selectedOption={carType}
            onSelect={(option) => setCarType(option)}
          /> */}
          <FormControl fullWidth>
            <InputLabel size="small">Car Type</InputLabel>
            <Select
              label="Car Type"
              name="category"
              value={vehicleData.category}
              onChange={handleChange}
              size="small"
            >
              <MenuItem value="Hatchback">Hatchback</MenuItem>
              <MenuItem value="Sedan">Sedan</MenuItem>
              <MenuItem value="MUV">MUV</MenuItem>
              <MenuItem value="Coupe">Coupe</MenuItem>
              <MenuItem value="SUV">SUV</MenuItem>
              <MenuItem value="Convertible">Convertible</MenuItem>
              <MenuItem value="Pickup Truck">Pickup Truck</MenuItem>
            </Select>
          </FormControl>{" "}
          <div className="flex gap-8">
            {/* Car Make Dropdown */}
            <FormControl variant="outlined" fullWidth size="small">
              <InputLabel id="car-make-label">Car Make</InputLabel>
              <Select
                labelId="car-make-label"
                name="make"
                value={vehicleData.make}
                onChange={(event) => {
                  setCarMake(event.target.value);
                  setCarModel(""); // Reset car model when make changes
                  handleChange(event);
                }}
                label="Car Make"
              >
                {makeDisplayArray.map((make) => (
                  <MenuItem key={make} value={make}>
                    {make}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Car Model Dropdown */}
            <FormControl
              variant="outlined"
              fullWidth
              size="small"
              disabled={!vehicleData.make}
            >
              <InputLabel id="car-model-label">Car Model</InputLabel>
              <Select
                labelId="car-model-label"
                name="model"
                value={vehicleData.model}
                onChange={handleChange}
                label="Car Model"
              >
                {modelOptions.map((model) => (
                  <MenuItem key={model} value={model}>
                    {model}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>{" "}
          <FormControl fullWidth>
            <InputLabel size="small">Transmission Type</InputLabel>
            <Select
              label="Transmission Type"
              name="transmission"
              value={vehicleData.transmission}
              onChange={handleChange}
              size="small"
            >
              <MenuItem value="Manual">Manual</MenuItem>
              <MenuItem value="Automatic">Automatic</MenuItem>
            </Select>
          </FormControl>
          <div className="flex gap-8">
            {/* <Dropdown
              label="Transmission Type"
              options={["Manual", "Automatic"]}
              selectedOption={transmissionType}
              onSelect={(option) => setTransmissionType(option)}
            /> */}
            {/* <div className="relative inline-block my-3 text-xl w-full">
              <label className="absolute -top-2 left-3 text-lg bg-white px-1 text-gray-500">
                Manufactured Year
              </label>
              <div className="border border-gray-400 items-center rounded-md flex bg-white">
                <input
                  type="text"
                  placeholder="YYYY"
                  value={manufacturedYear}
                  onChange={(e) => setManufacturedYear(e.target.value)}
                  className="flex justify-between w-full p-3 py-6 bg-white text-gray-500 rounded-md focus:outline focus:outline-1 focus:outline-blue-400"
                />
              </div>
            </div> */}
          </div>{" "}
          {/* <div className="flex gap-8">
            <Dropdown
              label="Car Make"
              options={makeDisplayArray}
              selectedOption={carMake}
              onSelect={(option) => {
                setCarMake(option);
                setCarModel(""); // Reset car model when make changes
              }}
            />

            <Dropdown
              label="Car Model"
              options={modelOptions}
              selectedOption={carModel}
              onSelect={(option) => setCarModel(option)}
              disabled={!carMake} // Disable if no make is selected
            />
          </div> */}
        </div>

        {/* Submit Button */}
        <div className="w-full justify-end items-end flex">
          <div
            onClick={nextStep}
            className="md:w-fit cursor-pointer w-full items-center justify-center flex text-white text-xs rounded-full px-8 py-3 mt-8  transition bg-[#00113D] hover:bg-blue-900"
          >
            Upload Picture
          </div>
        </div>
      </div>

      <div className="p-4 w-1/4 bg-blue-200 py-6 md:flex hidden font-light h-fit">
        Provide details about your car to get started.
      </div>
    </div>
  );
};

export default Step1;
