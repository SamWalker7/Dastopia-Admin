import React, { useState } from "react";
import { HiMiniArrowsUpDown } from "react-icons/hi2";
import {
  IoChatboxOutline,
  IoLocationOutline,
  IoPersonOutline,
} from "react-icons/io5";
import { MdOutlineLocalPhone, MdOutlineMail } from "react-icons/md";
// Assuming './avatar.png' exists relative to where Account.jsx will be placed
import image from "./avatar.png";

// Mock Account Component (This component uses internal mock data)
// Note: It currently does NOT use the selectedUser prop passed from UserManagement.
const Account = () => {
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

  return (
    <div className=" flex flex-col">
      <div className="flex gap-10">
        {" "}
        {/* Rentee Details - STILL SHOWS MOCK DATA */}
        <section className="h-fit bg-white p-6 space-y-6 w-fit px-10 rounded-xl drop-shadow-sm shadow-sm">
          <div className=" items-center flex gap-8">
            <img
              src={image}
              alt="Renter Profile"
              className="w-32 h-32 rounded-full"
            />
            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-semibold text-[#00113D] mb-2">
                User Details
              </h2>
              <h3 className="flex gap-4 text-sm text-[#38393D]">
                <IoPersonOutline size={18} /> Steven Gerard {/* Mock Data */}
              </h3>
              <div className="flex items-center gap-4 text-sm text-[#38393D] mt-1">
                <MdOutlineLocalPhone size={18} />
                <p>+251 9243212</p> {/* Mock Data */}
              </div>
              <div className="flex items-center gap-4 text-sm text-[#38393D] mt-1">
                <MdOutlineMail size={18} />
                <p>jandoe@gmail.com</p> {/* Mock Data */}
              </div>
              <div className="flex items-center gap-4 text-sm text-[#38393D] mt-1">
                <IoLocationOutline size={18} />
                <p>Addis Ababa, Ethiopia</p> {/* Mock Data */}
              </div>
              <div className="flex items-center justify-center gap-2 mt-4 px-16 py-2 text-sm border rounded-full border-[#00113D] text-[#00113D] bg-white">
                <IoChatboxOutline size={16} />
                <button>Chat With Renter</button>
              </div>
            </div>
          </div>
        </section>
        {/* Account Details - STILL SHOWS MOCK DATA */}
        <section className="w-fit bg-white p-6 rounded-xl drop-shadow-sm shadow-sm">
          <h2 className="text-lg font-semibold text-[#00113D] mb-4">
            Account Details
          </h2>
          <div className="flex flex-col text-sm text-[#38393D]">
            <div className="flex items-start gap-2">
              <div>
                <p className="flex items-center ">
                  <span className="pr-4">Status</span>
                  <span className="px-4 font-semibold text-sky-950">
                    Active {/* Mock Data */}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div>
                <p className="flex items-center ">
                  <span className="pr-4">Registration Date</span>
                  <span className="px-4 font-semibold text-sky-950">
                    12/11/2025 | 12:05 am {/* Mock Data */}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div>
                <p className="flex items-center ">
                  <span className="px-r">Role</span>
                  <span className="px-4 font-semibold text-sky-950">
                    Car Owner {/* Mock Data */}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
      {/* Table - STILL SHOWS MOCK DATA */}
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