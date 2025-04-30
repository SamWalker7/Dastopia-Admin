import React, { useState, useEffect } from "react"; // Import useEffect
import { HiMiniArrowsUpDown } from "react-icons/hi2";
import {
  IoChatboxOutline,
  IoLocationOutline,
  IoPersonOutline,
} from "react-icons/io5";
import { MdOutlineLocalPhone, MdOutlineMail } from "react-icons/md";
// Assuming './avatar.png' exists relative to where Account.jsx will be placed
import image from "./avatar.png";

// Updated Account Component to use the selectedUser prop
const Account = ({ selectedUser }) => { // Accept selectedUser as a prop
  // --- Mock Data for Rental History (Keeping as is per discussion scope) ---
  const [rentals, setRentals] = useState([
    {
      startDate: "23/3/2022",
      endDate: "24/3/2022",
      carName: "Bekele Mamo",
      carOwner: "Bekele Mamo",
      phone: "+251 93432124",
      status: "Completed",
    },
    {
      startDate: "24/3/2022",
      endDate: "23/3/2022",
      carName: "Addis Ababa",
      carOwner: "Bekele Mamo",
      phone: "+251 93432124",
      status: "Active",
    },
    {
      startDate: "25/3/2022",
      endDate: "22/3/2022",
      carName: "Zeina Haile",
      carOwner: "Bekele Mamo",
      phone: "+251 93432124",
      status: "Canceled",
    },
    {
      startDate: "26/3/2022",
      endDate: "NA",
      carName: "Teddy Worku",
      carOwner: "Bekele Mamo",
      phone: "+251 93432124",
      status: "Completed",
    },
    {
      startDate: "27/3/2022",
      endDate: "21/3/2022",
      carName: "Biruk Tadesse",
      carOwner: "Bekele Mamo",
      phone: "+251 93432124",
      status: "Completed",
    },
  ]);

  // Filter, pagination, and sorting logic for the mock rentals in Account component
  const [filters, setFilters] = useState({
    search: "",
    role: "",
    status: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3; // Note: This pagination is not currently used in the render output

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });

  const statusColors = {
    Completed: "bg-blue-950 text-white",
    Active: "bg-green-100 text-green-700",
    Canceled: "bg-red-100 text-red-600",
    // Added statuses from UserManagement for completeness in filters/display
    Invited: "bg-[#F6DE95] text-[#816204] font-bold",
    Inactive: "bg-[#FEE2E2] text-[#991B1B] font-bold",
    CONFIRMED: "bg-[#A0E6BA] text-[#136C34] font-bold", // Added from UserManagement
    UNCONFIRMED: "bg-[#F6DE95] text-[#816204] font-bold", // Added from UserManagement
  };

  const sortedRentals = [...rentals].sort((a, b) => {
    if (sortConfig.key) {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Convert dates to Date objects for comparison if sorting by date
      if (sortConfig.key === "startDate" || sortConfig.key === "endDate") {
          const parseDate = (dateStr) => {
              if (!dateStr || dateStr === "NA") return (sortConfig.direction === "ascending" ? new Date('0001-01-01') : new Date('9999-12-31'));
              const parts = dateStr.split('/');
              if (parts.length === 3) {
                  const [day, month, year] = parts.map(Number);
                  if (!isNaN(day) && !isNaN(month) && !isNaN(year) && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
                      return new Date(year, month - 1, day); // Month is 0-indexed
                  }
              }
              return (sortConfig.direction === "ascending" ? new Date('0001-01-01') : new Date('9999-12-31'));
          };
          aValue = parseDate(aValue);
          bValue = parseDate(bValue);
      } else if (typeof aValue === 'string') {
          // Case-insensitive string comparison
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
      } else if (typeof aValue === 'number') {
          return (sortConfig.direction === "ascending") ? aValue - bValue : bValue - aValue;
      }


      if (aValue === bValue) return 0;

      if (sortConfig.direction === "ascending") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    }
    return 0;
  });

  const handleSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  // Ensure selectedUser data is available before rendering details
  if (!selectedUser) {
    return <div>Loading user details...</div>; // Display a loading state
  }

  // Extract user details from the prop
  const userName = `${selectedUser.given_name || ''} ${selectedUser.family_name || ''}`.trim() || 'N/A';
  const userPhoneNumber = selectedUser.phone_number || 'N/A';
  const userEmail = selectedUser.email || 'N/A';
  const userAddress = selectedUser.address || 'N/A'; // Use 'address' if available
  const userStatus = selectedUser.status || 'N/A'; // Use 'status'
  const userRegistrationDate = selectedUser.created ? new Date(selectedUser.created).toLocaleString() : 'N/A'; // Use 'created' and format
  const userRole = selectedUser['custom:role'] || 'N/A'; // Use 'custom:role' if available

  // Note: The profile image key is available in selectedUser (custom:profile_picture_key)
  // You would need logic to fetch and display the image from a URL based on this key.
  // For now, we'll keep the static avatar image.

  return (
    <div className=" flex flex-col">
      <div className="flex gap-10">
        {" "}
        {/* Rentee Details - NOW USES selectedUser PROP */}
        <section className="h-fit bg-white p-6 space-y-6 w-fit px-10 rounded-xl drop-shadow-sm shadow-sm">
          <div className=" items-center flex gap-8">
             {/* Use the actual profile picture if available, fallback to static */}
            <img
              src={selectedUser['custom:profile_picture_key'] ? `YOUR_IMAGE_BASE_URL/${selectedUser['custom:profile_picture_key']}` : image} // Replace YOUR_IMAGE_BASE_URL
              alt="User Profile"
              className="w-32 h-32 rounded-full object-cover" // Added object-cover for better image display
            />
            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-semibold text-[#00113D] mb-2">
                User Details
              </h2>
              <h3 className="flex gap-4 text-sm text-[#38393D]">
                <IoPersonOutline size={18} /> {userName} {/* Display actual user name */}
              </h3>
              <div className="flex items-center gap-4 text-sm text-[#38393D] mt-1">
                <MdOutlineLocalPhone size={18} />
                <p>{userPhoneNumber}</p> {/* Display actual phone number */}
              </div>
              <div className="flex items-center gap-4 text-sm text-[#38393D] mt-1">
                <MdOutlineMail size={18} />
                <p>{userEmail}</p> {/* Display actual email */}
              </div>
              {/* Display address if available */}
              {userAddress !== 'N/A' && (
                <div className="flex items-center gap-4 text-sm text-[#38393D] mt-1">
                  <IoLocationOutline size={18} />
                  <p>{userAddress}</p> {/* Display actual address */}
                </div>
              )}
              {/* Chat button - Keep as is or add logic */}
              <div className="flex items-center justify-center gap-2 mt-4 px-16 py-2 text-sm border rounded-full border-[#00113D] text-[#00113D] bg-white">
                <IoChatboxOutline size={16} />
                <button>Chat With User</button> {/* Changed text from Renter to User */}
              </div>
            </div>
          </div>
        </section>
        {/* Account Details - NOW USES selectedUser PROP */}
        <section className="w-fit bg-white p-6 rounded-xl drop-shadow-sm shadow-sm">
          <h2 className="text-lg font-semibold text-[#00113D] mb-4">
            Account Details
          </h2>
          <div className="flex flex-col text-sm text-[#38393D]">
            <div className="flex items-start gap-2">
              <div>
                <p className="flex items-center ">
                  <span className="pr-4">Status</span>
                  <span
                    className={`px-4 font-semibold ${
                      statusColors[userStatus] || 'text-gray-700'
                    }`}
                  >
                    {userStatus} {/* Display actual status */}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div>
                <p className="flex items-center ">
                  <span className="pr-4">Registration Date</span>
                  <span className="px-4 font-semibold text-sky-950">
                    {userRegistrationDate} {/* Display actual registration date */}
                  </span>
                </p>
              </div>
            </div>
            {/* Display role if available */}
            {userRole !== 'N/A' && (
              <div className="flex items-start gap-2">
                <div>
                  <p className="flex items-center ">
                    <span className="px-r">Role</span>
                    <span className="px-4 font-semibold text-sky-950">
                      {userRole} {/* Display actual role */}
                    </span>
                  </p>
                </div>
              </div>
            )}
             {/* You can add other account-specific details from selectedUser here */}
          </div>
        </section>
      </div>
      {/* Rental History Table - STILL SHOWS MOCK DATA */}
      <div className=" bg-white mt-8 w-full drop-shadow-sm shadow-sm rounded-lg">
        <div className="p-6 rounded-lg ">
          <h2 className="text-lg font-semibold pl-2 my-8">Rental History</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-x-0 border-t-0 border-gray-100 rounded-lg">
              <thead>
                <tr className="bg-gray-50 font-semibold">
                  <th
                    className="px-6 text-left text-sm font-semibold py-4 text-gray-600 cursor-pointer"
                    onClick={() => handleSort("startDate")}
                  >
                    Rent start date{" "}
                    <HiMiniArrowsUpDown className="inline ml-1" />
                  </th>
                  <th
                    className="px-6 text-left text-sm font-semibold py-4 text-gray-600 cursor-pointer"
                    onClick={() => handleSort("endDate")}
                  >
                    Rent end date{" "}
                    <HiMiniArrowsUpDown className="inline ml-1" />
                  </th>
                  <th
                    className="px-6 text-left text-sm font-semibold py-4 text-gray-600 cursor-pointer"
                    onClick={() => handleSort("carName")}
                  >
                    Car Name{" "}
                    <HiMiniArrowsUpDown className="inline ml-1" />
                  </th>
                  <th className="px-6 text-left text-sm font-semibold py-4 text-gray-600">
                    Car Owner
                  </th>
                  <th className="px-6 text-left text-sm font-semibold py-4 text-gray-600">
                    Phone Number
                  </th>
                  <th className="px-6 text-left text-sm font-semibold py-4 text-gray-600">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* This maps over the mock 'sortedRentals' state */}
                {sortedRentals.map((rental, index) => (
                  <tr key={index} className="border-t border-gray-200">
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {rental.startDate}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {rental.endDate}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {rental.carName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {rental.carOwner}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {rental.phone}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-2 rounded-xl text-sm ${
                          statusColors[rental.status] || 'text-gray-700'
                        }`}
                      >
                        {rental.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;