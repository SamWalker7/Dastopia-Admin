import React, { useState, useEffect } from "react";
import { HiMiniArrowsUpDown } from "react-icons/hi2";
import {
    IoChatboxOutline,
    IoLocationOutline,
    IoPersonOutline,
} from "react-icons/io5";
import { MdOutlineLocalPhone, MdOutlineMail } from "react-icons/md";
import image from "./avatar.png"; // Static fallback image

// Add API_BASE_URL here (or ensure it's available globally)
const API_BASE_URL = "https://oy0bs62jx8.execute-api.us-east-1.amazonaws.com/Prod";

// Helper function to format dates from API (assuming ISO string) to DD/MM/YYYY
const formatDate = (dateString) => {
    if (!dateString || dateString === 'NA') return 'NA';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
             return 'Invalid Date';
        }
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    } catch (error) {
        console.error("Error formatting date:", dateString, error);
        return 'Error';
    }
};

// Helper function to safely extract and format names (still useful for owner)
const formatUserName = (userObject) => {
    if (!userObject) return 'N/A';
    // *** ADJUST these keys based on your ACTUAL API response for the OWNER object ***
    const firstName = userObject.given_name || '';
    const lastName = userObject.family_name || '';
    return `${firstName} ${lastName}`.trim() || 'N/A';
};


// Updated Account Component - Simplified for Rentee History Only
const Account = ({ selectedUser,paginatedUsers }) => {
    // State for fetched rental history data
    const [rentals, setRentals] = useState([]); // Will hold data transformed for the table
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [historyError, setHistoryError] = useState(null);

    // --- Sorting State ---
    const [sortConfig, setSortConfig] = useState({ key: 'startDate', direction: "descending" }); // Default sort by start date descending
    const foundUser = paginatedUsers.find(user => user.sub === selectedUser.id); // Find the user in paginatedUsers
     console.log("Selected user:", selectedUser); // Debug log
     console.log("Found user in paginatedUsers:", paginatedUsers); // Debug log
    // --- Status Colors ---
    const statusColors = {
        Completed: "bg-blue-950 text-white",
        Active: "bg-green-100 text-green-700",
        Canceled: "bg-red-100 text-red-600",
        Invited: "bg-[#F6DE95] text-[#816204] font-bold",
        Inactive: "bg-[#FEE2E2] text-[#991B1B] font-bold",
        CONFIRMED: "bg-[#A0E6BA] text-[#136C34] font-bold",
        UNCONFIRMED: "bg-[#F6DE95] text-[#816204] font-bold",
        // Add any other API statuses returned by the rentee history endpoint
    };

    // --- Function to fetch Rentee History ONLY ---
    const fetchRenteeHistory = async (AccessToken, userId) => {
        if (!AccessToken) throw new Error("Access token is missing for rentee history");
        if (!userId) throw new Error("User ID is missing for rentee history");

        console.log(`Fetching rentee history for user ID: ${userId} with token: ${AccessToken ? 'Present' : 'Missing'}`); // Debug log

        try {
            const response = await fetch(`${API_BASE_URL}/v1/admin/booking/history/${userId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${AccessToken}`, // Use the passed AccessToken
                },
            });

            console.log('Fetch response status:', response.status); // Debug log

            if (!response.ok) {
                let errorData = { message: `HTTP error! status: ${response.status}` };
                try {
                    errorData = await response.json(); // Try to parse error details
                } catch (e) {
                     console.error("Could not parse error response JSON:", e);
                }
                console.error('Failed response data:', errorData); // Debug log
                throw new Error(`Failed to fetch rentee history: ${errorData.message || response.statusText}`);
            }

            const data = await response.json();
            console.log('Successfully fetched data:', data); // Debug log

            // Assuming API returns an object with a 'bookings' array
            if (data && Array.isArray(data.bookings)) {
                return data.bookings;
            } else if (Array.isArray(data)) { // Fallback if API returns array directly
                 console.warn("API response was directly an array, expected { bookings: [...] } structure.");
                 return data;
            }
            else {
                 console.warn("API response did not contain a 'bookings' array:", data);
                 return []; // Return empty array if expected data structure not found
            }
        } catch (error) {
            console.error('Error fetching rentee history:', error); // Keep detailed log
            throw error; // Re-throw to be caught by useEffect catch block
        }
    };


    // --- Helper function to transform API booking object to the required table row format ---
    // *** CRITICAL: Adjust keys based on the ACTUAL structure returned by /v1/admin/booking/history/:userId ***
    const transformBookingToRental = (booking) => {
         const startDate = formatDate(booking.startTime); // Assuming booking object has 'startTime'
         const endDate = formatDate(booking.endTime);     // Assuming booking object has 'endTime'
         const carName = booking.car?.name || 'N/A';      // Assuming booking has 'car' object with 'name'
         const status = booking.status || 'N/A';          // Assuming booking has 'status'

         // Since this is rentee history, the 'owner' object in the booking should contain car owner details
         const ownerDetails = booking.owner; // Example: { given_name: 'Jane', family_name: 'Smith', phone_number: '555-...' }

         const carOwner = formatUserName(ownerDetails); // Use helper to format name
         // *** VERY IMPORTANT: Verify 'phone_number' is the correct key in the owner object ***
         const phone = ownerDetails?.phone_number || 'N/A';

         // *** END OF CRITICAL SECTION - ADJUST KEYS ABOVE ***

         return {
             startDate,
             endDate,
             carName,
             carOwner, // The name of the person who owns the car
             phone,    // The phone number of the car owner
             status,
             // Ensure a unique bookingId exists in the booking object from the API
             bookingId: booking.bookingId || `fallback-${Math.random().toString(36).substring(7)}`,
         };
    };


    // --- Effect to fetch history when selectedUser changes ---
    useEffect(() => {
        const loadHistory = async () => {
            setIsLoadingHistory(true);
            setHistoryError(null);
            setRentals([]); // Clear previous data

            // It's often safer to read from localStorage directly inside the effect
            // unless the admin object itself is expected to change and trigger re-renders.
            const adminData = JSON.parse(localStorage.getItem("admin"));
            const adminToken = adminData?.AccessToken;

            if (!adminToken) {
                setHistoryError("Admin token not found. Cannot fetch history.");
                setIsLoadingHistory(false);
                console.error("Admin token is missing from localStorage");
                return;
            }

            const userId = selectedUser?.sub; // !!! ASSUMING 'sub' is the user ID, adjust if needed !!!
            if (!userId) {
                // This case might happen briefly if selectedUser is cleared, it's not necessarily an error,
                // but we shouldn't proceed.
                // setHistoryError("User ID not available to fetch history."); // Maybe too noisy
                setIsLoadingHistory(false);
                console.log("Selected user or user ID is missing, skipping history fetch.");
                return;
            }

            try {
                // Fetch ONLY rentee history
                const renteeHistoryData = await fetchRenteeHistory(adminToken, userId);

                // Transform the fetched data
                const transformedHistory = renteeHistoryData.map(transformBookingToRental);

                setRentals(transformedHistory); // Update state with fetched and transformed data

            } catch (err) {
                // Error message is already logged in fetchRenteeHistory
                setHistoryError(err.message || "An unknown error occurred while fetching history.");
                setRentals([]); // Clear data on error
            } finally {
                setIsLoadingHistory(false);
            }
        };

        // Only fetch if selectedUser and their ID is available
        if (selectedUser?.sub) { // !!! Use the correct ID property here as well !!!
            loadHistory();
        } else {
            // Clear history if selectedUser becomes null or lacks an ID
            setRentals([]);
            setHistoryError(null);
            setIsLoadingHistory(false); // Ensure loading is false if no user selected
        }

        // Dependency: Re-run effect only when selectedUser changes.
        // Accessing localStorage inside doesn't require adding adminToken here.
    }, [selectedUser]);


    // --- Sorting Logic (applied to the 'rentals' state) ---
    const sortedRentals = [...rentals].sort((a, b) => {
        if (!sortConfig.key) return 0;

        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        // Date sorting
        if (sortConfig.key === "startDate" || sortConfig.key === "endDate") {
            const dateA = new Date(aValue?.split('/').reverse().join('-'));
            const dateB = new Date(bValue?.split('/').reverse().join('-'));
            const invalidDateA = !aValue || aValue === 'NA' || aValue === 'Error' || aValue === 'Invalid Date' || isNaN(dateA?.getTime());
            const invalidDateB = !bValue || bValue === 'NA' || bValue === 'Error' || bValue === 'Invalid Date' || isNaN(dateB?.getTime());

            if (invalidDateA && invalidDateB) return 0;
            if (invalidDateA) return sortConfig.direction === "ascending" ? -1 : 1;
            if (invalidDateB) return sortConfig.direction === "ascending" ? 1 : -1;

            return sortConfig.direction === "ascending" ? dateA - dateB : dateB - dateA;
        }
        // String sorting (for carName, carOwner, status)
        else if (typeof aValue === 'string' && typeof bValue === 'string') {
            // Handle 'N/A' consistently (e.g., treat as lowest or highest)
            const valA = aValue === 'N/A' ? '' : aValue.toLowerCase(); // Treat N/A as empty string for comparison
            const valB = bValue === 'N/A' ? '' : bValue.toLowerCase();

            if (valA === valB) return 0;

            // Use localeCompare for robust string comparison
            return sortConfig.direction === "ascending" ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        // Fallback (numbers or other types - not expected for current columns)
        else {
            if (aValue < bValue) return sortConfig.direction === "ascending" ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === "ascending" ? 1 : -1;
            return 0;
        }
    });

    const handleSort = (key) => {
        let direction = "ascending";
        // If clicking the same key, toggle direction
        if (sortConfig.key === key && sortConfig.direction === "ascending") {
            direction = "descending";
        }
        // Otherwise, set new key and default to ascending (or keep descending if preferred)
        // Let's default to ascending when changing columns
        // if (sortConfig.key !== key) { direction = 'ascending'; }

        setSortConfig({ key, direction });
    };

    // --- JSX Render ---

    // Render loading/placeholder if no user is selected
    if (!selectedUser) {
        return <div className="text-center py-8 text-gray-600">Select a user to view details.</div>;
    }

    // Extract user details from the prop for rendering the top sections
    // (Keep this part as it was)
    const userName = `${selectedUser.given_name || ''} ${selectedUser.family_name || ''}`.trim() || 'N/A';
    const userPhoneNumber = selectedUser.phone_number || 'N/A';
    const userEmail = selectedUser.email || 'N/A';
    const userAddress = selectedUser.address || 'N/A';
    const userStatus = selectedUser.status || selectedUser.UserStatus || 'N/A';
    const userRegistrationDate = selectedUser.UserCreateDate ? new Date(selectedUser.UserCreateDate).toLocaleString() : (selectedUser.created ? new Date(selectedUser.created).toLocaleString() : 'N/A');
    const userRole = selectedUser['custom:role'] || 'N/A';
    // IMPORTANT: Replace YOUR_IMAGE_BASE_URL or implement logic to get signed URLs if using S3 keys
    const profileImageUrl = selectedUser['custom:profile_picture_key'] ? `YOUR_IMAGE_BASE_URL/${selectedUser['custom:profile_picture_key']}` : image;


    return (
        <div className=" flex flex-col">
            {/* --- User Details & Account Details Sections (Unchanged) --- */}
            <div className="flex flex-wrap gap-6 mb-8"> {/* Use flex-wrap for responsiveness */}
                 <section className="flex-grow bg-white p-6 space-y-6 min-w-[300px] rounded-xl drop-shadow-sm shadow-sm"> {/* Added flex-grow and min-width */}
                     {/* ... User Details content ... */}
                     <div className=" items-center flex flex-wrap gap-8"> {/* Added flex-wrap */}
                        <img src={profileImageUrl} alt="User Profile" className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover flex-shrink-0"/> {/* Responsive size */}
                        <div className="flex flex-col gap-2 flex-grow"> {/* Added flex-grow */}
                            <h2 className="text-lg font-semibold text-[#00113D] mb-2">User Details</h2>
                            <h3 className="flex gap-4 text-sm text-[#38393D] items-center"><IoPersonOutline size={18} /> {userName}</h3>
                            <div className="flex items-center gap-4 text-sm text-[#38393D] mt-1"><MdOutlineLocalPhone size={18} /><p>{userPhoneNumber}</p></div>
                            <div className="flex items-center gap-4 text-sm text-[#38393D] mt-1"><MdOutlineMail size={18} /><p className="break-all">{userEmail}</p></div> {/* Added break-all for long emails */}
                            {userAddress !== 'N/A' && (<div className="flex items-center gap-4 text-sm text-[#38393D] mt-1"><IoLocationOutline size={18} /><p>{userAddress}</p></div>)}
                            <div className="flex items-center justify-center gap-2 mt-4 px-4 py-2 text-sm border rounded-full border-[#00113D] text-[#00113D] bg-white w-full sm:w-auto"> {/* Responsive width */}
                               <IoChatboxOutline size={16} /><button>Chat With User</button>
                            </div>
                        </div>
                     </div>
                 </section>
                 <section className="flex-grow bg-white p-6 rounded-xl drop-shadow-sm shadow-sm min-w-[250px]"> {/* Added flex-grow and min-width */}
                     {/* ... Account Details content ... */}
                     <h2 className="text-lg font-semibold text-[#00113D] mb-4">Account Details</h2>
                     <div className="space-y-2 text-sm text-[#38393D]"> {/* Use space-y for spacing */}
                        <p className="flex items-center">
                          <span className="w-32 flex-shrink-0">Status</span> {/* Fixed width for label */}
                          <span className={`px-3 py-1 rounded font-semibold ${statusColors[userStatus] || 'text-gray-700 bg-gray-200'}`}>{userStatus}</span>
                        </p>
                        <p className="flex items-center">
                          <span className="w-32 flex-shrink-0">Registered</span> {/* Fixed width & shorter label */}
                          <span className="font-semibold text-sky-950">{foundUser?.created ? new Date(foundUser.created).toLocaleDateString() : "N/A"}</span>
                        </p>
                        {userRole !== 'N/A' && (
                          <p className="flex items-center">
                            <span className="w-32 flex-shrink-0">Role</span> {/* Fixed width */}
                            <span className="font-semibold text-sky-950">{userRole}</span>
                          </p>
                        )}
                     </div>
                 </section>
            </div>

            {/* --- Rental History Table (Updated for specific columns) --- */}
            <div className=" bg-white mt-8 w-full drop-shadow-sm shadow-sm rounded-lg">
                <div className="p-4 md:p-6 rounded-lg "> {/* Responsive padding */}
                    <h2 className="text-lg font-semibold pl-2 my-4 md:my-6">Rental History (Cars Rented)</h2> {/* Updated Title */}

                    {isLoadingHistory ? (
                        <div className="text-center py-8 text-gray-600">Loading rental history...</div>
                    ) : historyError ? (
                        <div className="text-center py-8 text-red-600 px-4">Error loading history: {historyError}</div>
                    ) : sortedRentals.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">No rental history found for this user.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white border-collapse"> {/* Use border-collapse */}
                                <thead>
                                    <tr className="bg-gray-50 font-semibold border-b border-gray-200">
                                        {/* --- Updated Table Headers --- */}
                                        <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider cursor-pointer" onClick={() => handleSort("startDate")}>
                                            Rent Start <HiMiniArrowsUpDown className="inline ml-1" />
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider cursor-pointer" onClick={() => handleSort("endDate")}>
                                            Rent End <HiMiniArrowsUpDown className="inline ml-1" />
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider cursor-pointer" onClick={() => handleSort("carName")}>
                                            Car Name <HiMiniArrowsUpDown className="inline ml-1" />
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider cursor-pointer" onClick={() => handleSort("carOwner")}>
                                            Car Owner <HiMiniArrowsUpDown className="inline ml-1" />
                                        </th>
                                        {/* Phone number - not sortable by default based on requirement */}
                                        <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">
                                            Owner Phone
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider cursor-pointer" onClick={() => handleSort("status")}>
                                            Status <HiMiniArrowsUpDown className="inline ml-1" />
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200"> {/* Use divide-y for row separation */}
                                    {/* --- Updated Row Rendering --- */}
                                    {sortedRentals.map((rental) => (
                                        <tr key={rental.bookingId} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                                                {rental.startDate}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                                                {rental.endDate}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900 font-medium"> {/* Slightly bolder car name */}
                                                {rental.carName}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                {rental.carOwner}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                                                {rental.phone}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    statusColors[rental.status] || 'bg-gray-200 text-gray-800' // Default fallback style
                                                }`}>
                                                    {rental.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Account;