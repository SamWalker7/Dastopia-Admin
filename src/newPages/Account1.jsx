// Account.js (Assuming this is in the same directory as YourTableComponent)
import React, { useState, useEffect } from "react";
import image from "./avatar.png"; // Replace with your actual image path
import {
  IoPersonOutline,
  IoLocationOutline,
  IoChatboxOutline,
} from "react-icons/io5";
import { MdOutlineLocalPhone, MdOutlineMail } from "react-icons/md";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import GridViewIcon from "@mui/icons-material/GridView";
import { FaStar, FaSpinner } from "react-icons/fa";
import { getDownloadUrl } from "../api"; // Assuming your api.js is one level up

const Account = ({ vehicleId }) => {
  const [vehicleDetails, setVehicleDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ownerProfile, setOwnerProfile] = useState(null);
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [rentalRating, setRentalRating] = useState(0); // New state for rental rating

  const fetchRentalRating = async (carID) => {
    try {
      // Replace this with your actual API endpoint and request structure to fetch rental ratings for an owner
      const response = await fetch(
        "https://xo55y7ogyj.execute-api.us-east-1.amazonaws.com/prod/add_vehicle", // Placeholder URL - ADJUST THIS
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            operation: "getRatingsbyID", // Or a more appropriate operation name
            carId: carID,
          }),
        }
      );
      const data = await response.json();
      if (data.statusCode === 200 && data.body.success && data.body.data) {
        return data.body.data.averageRating || 0; // Adjust based on your API response
      } else {
        console.error("Failed to fetch rental rating:", data);
        return 0;
      }
    } catch (error) {
      console.error("Error fetching rental rating:", error);
      return 0;
    }
  };

  useEffect(() => {
    const fetchVehicleDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `https://oy0bs62jx8.execute-api.us-east-1.amazonaws.com/Prod/v1/vehicle/${vehicleId}`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setVehicleDetails(data.body);
      } catch (error) {
        setError(error);
        console.error("Error fetching vehicle details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicleDetails();
  }, [vehicleId]);

  useEffect(() => {
    const fetchOwnerProfileAndRating = async () => {
      if (vehicleDetails?.ownerId) {
        setIsImageLoading(true);
        try {
          const profileResponse = await fetch(
            `https://oy0bs62jx8.execute-api.us-east-1.amazonaws.com/Prod/v1/account/profile/${vehicleDetails.ownerId}` // Assuming this endpoint exists
          );
          if (!profileResponse.ok) {
            console.error(
              `HTTP error fetching owner profile! status: ${profileResponse.status}`
            );
            setProfileImageUrl("https://via.placeholder.com/150"); // Placeholder if fetch fails
          } else {
            const profileData = await profileResponse.json();
            setOwnerProfile(profileData?.body); // Adjust based on your API response structure
            if (profileData?.body?.profilePicture) {
              const imageUrlResponse = await getDownloadUrl(
                profileData.body.profilePicture
              );
              setProfileImageUrl(
                imageUrlResponse?.body || "https://via.placeholder.com/150"
              );
            } else {
              setProfileImageUrl("https://via.placeholder.com/150"); // Placeholder if no profile picture key
            }
          }

          // Fetch rental rating
          const rating = await fetchRentalRating(vehicleDetails.id);
          setRentalRating(rating);
        } catch (error) {
          console.error("Error fetching owner profile and rating:", error);
          setProfileImageUrl("https://via.placeholder.com/150"); // Placeholder on error
        } finally {
          setIsImageLoading(false);
        }
      } else {
        setProfileImageUrl("https://via.placeholder.com/150"); // Default placeholder if no ownerId
        setIsImageLoading(false);
      }
    };

    if (vehicleDetails) {
      fetchOwnerProfileAndRating();
    }
  }, [vehicleDetails]);

  if (loading || !vehicleDetails) {
    return <div>Loading vehicle details...</div>;
  }

  if (error) {
    return <div>Error loading vehicle details: {error.message}</div>;
  }

  return (
    <div className=" flex flex-col mt-8">
      {" "}
      {/* Added some margin top for separation */}
      <div className="flex w-full   gap-4">
        {/* Rentee Details (Adjust based on your actual data) */}
        <section className="h-fit bg-white p-6 space-y-6 w-fit px-10 shadow-blue-100   rounded-xl drop-shadow-xs shadow-xs">
          <div className=" items-center flex gap-8">
            {isImageLoading ? (
              <div className="w-32 h-32 rounded-full flex items-center justify-center bg-gray-100">
                <FaSpinner className="animate-spin text-2xl text-gray-400" />
              </div>
            ) : (
              <img
                src={profileImageUrl || image} // Use fetched URL or fallback image
                alt="Renter Profile"
                className="w-32 h-32 rounded-full object-cover"
              />
            )}
            <div className="flex flex-col gap-2">
              <h2 className="text-lg   font-semibold text-[#00113D] mb-2">
                User Details
              </h2>
              <h3 className="flex gap-4 text-sm   text-[#38393D]">
                <IoPersonOutline size={18} /> {vehicleDetails.ownerGivenName}{" "}
                {vehicleDetails.ownerSurName}
              </h3>
              <div className="flex items-center gap-4 text-sm text-[#38393D] mt-1">
                <MdOutlineLocalPhone size={18} />
                <p>{vehicleDetails.ownerPhone}</p>
              </div>
              <div className="flex items-center gap-4 text-sm text-[#38393D] mt-1">
                <MdOutlineMail size={18} />
                <p>{vehicleDetails.ownerEmail}</p>
              </div>
              {vehicleDetails.pickUp && vehicleDetails.pickUp[0] && (
                <div className="flex items-center gap-4 text-sm text-[#38393D] mt-1">
                  <IoLocationOutline size={18} />
                  <p>{vehicleDetails.city}, Ethiopia</p>{" "}
                  {/* Adjust as needed */}
                </div>
              )}
              <div className="flex items-center justify-center gap-2 mt-4 px-4 py-2 text-sm   border rounded-full border-[#00113D] text-[#00113D] bg-white">
                <IoChatboxOutline size={16} />
                <button>Chat With Renter</button>
              </div>
            </div>
          </div>
        </section>
        {/* Rental Details */}
        <section className="w-fit bg-white p-6   shadow-blue-100   rounded-xl drop-shadow-xs shadow-xs">
          <h2 className="text-lg font-semibold text-[#00113D] mb-4">
            Account Details
          </h2>
          <div className="flex flex-col   text-sm text-[#38393D]">
            <div className="flex items-start gap-2">
              <div>
                <p className="flex items-center ">
                  <span className="pr-4">Status</span>
                  <span className="px-4 font-semibold text-sky-950">
                    {vehicleDetails.isActive}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div>
                <p className="flex items-center ">
                  <span className="pr-4">Registration Date</span>
                  <span className="px-4 font-semibold text-sky-950">
                    {new Date(vehicleDetails.createdAt).toLocaleDateString()} |{" "}
                    {new Date(vehicleDetails.createdAt).toLocaleTimeString()}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div>
                <p className="flex items-center ">
                  <span className="px-r">Rent Amount</span>
                  <span className="px-4 font-semibold text-sky-950">
                    {vehicleDetails.price} Birr/Day
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 mt-20 px-4 py-2 text-sm   border rounded-full border-[#00113D] text-[#00113D] bg-white">
              <CalendarMonthOutlinedIcon fontSize="small" />
              <button>Available Dates</button>
            </div>
          </div>
        </section>
        <div className="flex flex-col w-1/3 gap-6">
          <div className=" bg-white p-6 flex justify-between items-center w-full gap-24 shadow-blue-200   rounded-xl drop-shadow-xs shadow-xs">
            <h2 className="text-base font-semibold text-[#00113D] ">
              Total Rent
            </h2>
            <span className="px-4 text-gray-600 text-base">12</span>{" "}
            {/* Replace with actual data if available */}
          </div>{" "}
          <div className=" bg-white p-6 flex justify-between items-center w-full gap-24 shadow-blue-200   rounded-xl drop-shadow-xs shadow-xs">
            <h2 className="text-base font-semibold text-[#00113D] ">
              Rental Earnings
            </h2>
            <span className="pr-4 text-gray-600 text-base">1,273</span>{" "}
            {/* Replace with actual data if available */}
          </div>{" "}
          <div className=" bg-white p-6 flex justify-between items-center w-full gap-24 shadow-blue-200   rounded-xl drop-shadow-xs shadow-xs">
            <h2 className="text-base font-semibold text-[#00113D] ">
              Rental Ratings
            </h2>
            <div className="pr-4 gap-x-2 flex  text-lg items-center">
                  <FaStar color="gold" size={24} />
              <span className="ml-2">{rentalRating?.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>
      {/* Table */}
      <div className="p-10 bg-white w-full flex flex-col   drop-shadow-sm shadow-blue-200 shadow mt-8 rounded-lg">
        <div className=" text-xl font-semibold mb-8">Vehicle Overview</div>
        <div className="grid grid-cols-1 sm:grid-cols-4   p-4 gap-4 ">
          <div className="flex items-center">
            Vehicle Type
            <span className="mx-2 bg-blue-100 rounded-md p-2 ">
              {vehicleDetails.category}
            </span>
          </div>
          <div className="flex items-center">
            Vehicle Make
            <span className="mx-2 bg-blue-100 rounded-md p-2 ">
              {vehicleDetails.make}
            </span>
          </div>
          <div className="flex items-center">
            License Plate Number
            <span className="mx-2 bg-blue-100 rounded-md p-2 ">
              {vehicleDetails.vehicleNumber}
            </span>{" "}
            {/* Assuming vehicleNumber is the plate */}
          </div>{" "}
          <div className="flex items-center">
            Year of Manufacture
            <span className="mx-2 bg-blue-100 rounded-md p-2 ">
              {vehicleDetails.year}
            </span>
          </div>{" "}
          <div className="flex items-center">
            Mileage
            <span className="mx-2 bg-blue-100 rounded-md p-2 ">
              {vehicleDetails.mileage} KM
            </span>
          </div>{" "}
          <div className="flex items-center">
            Vehicle Model
            <span className="mx-2 bg-blue-100 rounded-md p-2 ">
              {vehicleDetails.model}
            </span>
          </div>{" "}
          <div className="flex items-center">
            Fuel Type
            <span className="mx-2 bg-blue-100 rounded-md p-2 ">
              {vehicleDetails.fuelType}
            </span>
          </div>
          <div className="flex items-center">
            Transmission Type
            <span className="mx-2 bg-blue-100 rounded-md p-2 ">
              {vehicleDetails.transmission}
            </span>
          </div>
          <div className="flex items-center">
            Vehicle ID
            <span className="mx-2 bg-blue-100 rounded-md p-2 ">
              {vehicleDetails.id}
            </span>
          </div>
        </div>
      </div>
      <div className="flex gap-8">
        <div className="p-10 bg-white w-1/2 flex flex-col mt-4 drop-shadow-sm shadow-blue-200 shadow rounded-lg">
          <div className=" text-xl font-semibold mb-8">
            Documents and Compliance
          </div>
          <div className=" w-full   justify-between   flex ">
            <div className="flex flex-col items-center">
              Libre Document
              {vehicleDetails.adminDocumentKeys &&
                vehicleDetails.adminDocumentKeys[0] && (
                  <span className="my-2 bg-blue-100 underline rounded-md   p-2 ">
                    {" "}
                    <AttachFileIcon />
                    {vehicleDetails.adminDocumentKeys[0]}{" "}
                    {/* Adjust as needed */}
                  </span>
                )}
            </div>
            <div className="flex flex-col items-center">
              Insurance Document
              {/* You might need a specific field for insurance document key */}
              <span className="my-2 bg-blue-100 underline rounded-md p-2 ">
                <AttachFileIcon />
                Insurance Document
              </span>
            </div>
          </div>
        </div>

        <div className="p-10 bg-white w-1/2 flex flex-col mt-4 drop-shadow-sm shadow-blue-200 shadow rounded-lg">
          <div className=" text-xl font-semibold mb-8">Photos and Media</div>
          <div className=" w-full   justify-between   flex ">
            <div className=" w-full   justify-between   flex ">
              <div className="flex flex-col items-center">
                Vehicle Photos
                {vehicleDetails.vehicleImageKeys &&
                  vehicleDetails.vehicleImageKeys[0] && (
                    <span className="my-2 bg-blue-100 underline rounded-md   p-2 ">
                      {" "}
                      <GridViewIcon /> View Photos{" "}
                    </span>
                  )}
              </div>
              <div className="flex flex-col items-center">
                Insurance Document
                <span className="my-2 bg-blue-100 underline rounded-md p-2 ">
                  <AttachFileIcon />
                  Insurance Document
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;
