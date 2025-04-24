import React, { useState, useEffect } from "react";
import {
  FaCalendarAlt,
  FaCogs,
  FaGasPump,
  FaTag,
  FaUserFriends,
} from "react-icons/fa";
import { IoLocationOutline } from "react-icons/io5";
import useVehicleFormStore from "../../store/useVehicleFormStore";

const Step5 = ({ prevStep }) => {
  const { vehicleData, uploadedPhotos, resetStore } = useVehicleFormStore(); // Include resetStore action
  // Get all uploaded images
  const getAllImages = () => {
    const mainImages = [
      uploadedPhotos.front,
      uploadedPhotos.back,
      uploadedPhotos.left,
      uploadedPhotos.right,
      uploadedPhotos.interior,
    ].filter((img) => img !== null);

    return [...mainImages, ...uploadedPhotos.additional];
  };

  const allImages = getAllImages();
  const [selectedImage, setSelectedImage] = useState(
    allImages[0]?.base64 || "/default-car.jpg" // Use base64 here, default image path is fine
  );

  // Helper function to format dates
  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    const date = new Date(dateString);
    return isNaN(date) ? "Invalid date" : date.toLocaleDateString();
  };
  useEffect(() => {
    return () => {
      console.log("Step5 unmounting, resetting store...");
      resetStore();
    };
  }, [resetStore]); // Dependency array includes resetStore
  // Parse calendar data
  const calendarDates = vehicleData.calendar
    ? JSON.parse(vehicleData.calendar)
    : [];

  return (
    <div className="flex bg-[#F8F8FF] md:flex-row flex-col gap-10">
      <div className="mx-auto md:p-16 p-6 w-full h-fit md:w-9/12 bg-white rounded-2xl shadow-sm text-sm">
        <div className="flex items-center justify-center">
          <div className="w-full border-b-4 border-[#00113D] mr-2"></div>
        </div>
        <div className="flex justify-between w-full">
          <div className="flex flex-col w-1/2 items-start">
            <p className="text-xl text-gray-800 my-4 font-medium text-center mb-4">
              Steps 5 of 5
            </p>
          </div>
        </div>
        <h1 className="text-3xl font-semibold mt-8">Summary</h1>
        <div className="flex md:flex-row flex-col w-full items-center">
          <div className="w-fit pr-8">
            <img
              src={selectedImage}
              alt={vehicleData.make}
              className="w-[350px] h-[300px] object-cover rounded-lg mb-4"
            />
            <div className="flex justify-start space-x-2 items-center mt-6">
              {allImages.map((img, index) => (
                <img
                  key={index}
                  // Use img.base64 here instead of img.url
                  src={img.base64}
                  alt={`Thumbnail ${index + 1}`}
                  onClick={() => setSelectedImage(img.base64)} // Update selected image with base64
                  className="w-20 h-20 cursor-pointer object-cover rounded-lg"
                />
              ))}
            </div>
          </div>
          <div className="w-1/2">
            <div className="flex items-center">
              <h3 className="text-lg font-semibold mb-4">
                {vehicleData.make} {vehicleData.model}
              </h3>
            </div>
            <div className="flex justify-between space-x-6 items-center mb-8 w-fit text-gray-800 text-sm">
              <div className="bg-blue-100 flex items-center text-blue-700 py-2 px-3 rounded-lg text-center">
                <FaTag size={12} className="mx-2" /> {vehicleData.price}
              </div>
              <div className="flex items-center space-x-2">
                <FaGasPump size={12} />
                <span>{vehicleData.fuelType || "Unknown"}</span>
              </div>
              <div className="flex items-center space-x-2">
                <FaCogs size={12} />
                <span>{vehicleData.transmission || "Unknown"}</span>
              </div>
              <div className="flex items-center w-28 space-x-2">
                <FaUserFriends size={13} />
                <span>{vehicleData.seats || "Unknown"} People</span>
              </div>
            </div>

            <h4 className="mt-8 text-lg font-semibold">Car Specification</h4>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <span className="text-gray-500">Car Brand</span>
                <p>{vehicleData.make}</p>
              </div>
              <div>
                <span className="text-gray-500">Car Model</span>
                <p>{vehicleData.model}</p>
              </div>
              <div>
                <span className="text-gray-500">Manufacture Year</span>
                <p>{vehicleData.year}</p>
              </div>
            </div>
            <div className="text-[#000000]">
              <section className="my-8">
                <h2 className="font-semibold text-lg mb-4">Features</h2>
                <div className="flex flex-wrap gap-2">
                  {vehicleData.carFeatures?.map((feature, index) => (
                    <span
                      key={index}
                      className="border border-gray-400 text-sm px-3 py-1 rounded-xl"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col w-[350px] gap-4">
        <div className="mx-auto p-8 h-fit w-full bg-white rounded-xl shadow-sm">
          <div className="flex items-center gap-20 text-sm">
            Booking
            <span className="text-gray-700 px-4 py-1 rounded-xl text-sm border border-gray-300">
              {vehicleData.instantBooking ? "Instant" : "Scheduled"}
            </span>
          </div>
          <div className="flex items-center my-4 gap-4 text-sm">
            Notice Period
            <span className="text-gray-700 px-4 py-1 rounded-xl text-sm border border-gray-300">
              {vehicleData.advanceNoticePeriod || "Not specified"}
            </span>
          </div>
        </div>
        <div className="mx-auto p-8 h-fit w-full bg-white rounded-xl shadow-sm">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Pick up Locations
            </h3>
            <ul className="text-sm space-y-6 text-gray-700">
              {vehicleData.pickUp?.map((location, index) => (
                <li key={index} className="flex items-center gap-4">
                  <IoLocationOutline size={16} />
                  {location.address || location.name || `Location ${index + 1}`}
                </li>
              ))}
            </ul>
          </div>
          <div className="my-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Drop off Locations
            </h3>
            <ul className="text-sm space-y-6 text-gray-700">
              {vehicleData.dropOff?.map((location, index) => (
                <li key={index} className="flex items-center gap-4">
                  <IoLocationOutline size={16} />
                  {location.address || location.name || `Location ${index + 1}`}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mx-auto p-4 h-fit bg-white w-full text-sm space-y-6 rounded-xl shadow-sm">
          {calendarDates.map((range, index) => (
            <div key={index} className="flex gap-4 items-center">
              <FaCalendarAlt size={16} />
              {formatDate(range.start)} - {formatDate(range.end)}
            </div>
          ))}
          {calendarDates.length === 0 && (
            <div className="text-gray-500">No availability dates set</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Step5;
