import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import { Grid, Stack, CircularProgress } from "@mui/material";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip, // Import Tooltip for Pie Chart
} from "recharts";
import { BarChart } from "@mui/x-charts";
import { LineChart } from "@mui/x-charts/LineChart";
// Keep DatePicker/etc. if you plan to implement interactive date filtering later
// import { DatePicker } from "@mui/x-date-pickers/DatePicker";
// import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
// import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import TextField from "@mui/material/TextField"; // Keep if needed for filtering later
import Button from "@mui/material/Button";
import dayjs from "dayjs";

// Define the API URL
const API_URL =
  "https://oy0bs62jx8.execute-api.us-east-1.amazonaws.com/Prod/v1/admin/vehicles";

// Updated chart settings for larger charts
const chartSetting = {
  xAxis: [
    {
      label: "Number of Vehicles", // Changed label for clarity
    },
  ],
  width: 600, // Increased width
  height: 350, // Increased height
};

const lineChartSetting = {
  margin: { left: 80, right: 20, top: 40, bottom: 50 }, // Added top margin for title space
  width: 600, // Increased width
  height: 350, // Increased height
};

const pieChartSetting = {
  width: 350, // Increased width
  height: 250, // Increased height
};

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === "dark" ? "#1A2027" : "#fff",
  ...theme.typography.body2,
  padding: theme.spacing(2),
  textAlign: "center",
  color: theme.palette.text.secondary,
  borderRadius: "10px",
  boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
}));

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#A280F8",
  "#FF6F8E",
  "#8DD1E1",
  "#83A6ED",
]; // More colors

// Moved renderCustomizedLabel outside the component
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  index,
  name, // Added name to display it in the label
}) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos((-midAngle * Math.PI) / 180);
  const y = cy + radius * Math.sin((-midAngle * Math.PI) / 180);

  // Only render label if percentage is significant, avoids crowding small slices
  if (percent > 0.05) {
    // Show label if slice is larger than 5%
    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
      >
        {`${name}: ${(percent * 100).toFixed(0)}%`} // Display name and
        percentage
      </text>
    );
  }
  return null; // Don't render label for very small slices
};

// Static placeholder data for metrics/charts not available in the vehicle API
const staticMetricsData = [
  { name: "Total Users", value: "1,200", percentage: "+11.02%" },
  { name: "Total Bookings", value: "27,801", percentage: "+11.02%" },
  // Total Vehicles and Pending Approvals will be replaced by API data
  { name: "Visits", value: "27,801", percentage: "+11.02%" }, // Assuming visits is separate
];

const staticUserDemographicsData = [
  { name: "Male", value: 55 },
  { name: "Female", value: 45 },
];

// We'll replace the User Growth Line Chart data with Vehicle Creation data

const Dashboard = () => {
  const [date, setDate] = useState(dayjs()); // State for date filtering (logic not implemented with API yet)
  const [activeButton, setActiveButton] = useState("All Time"); // Changed default button
  const [adminToken, setAdminToken] = useState(null); // State to hold the admin token

  // State for fetched and processed data
  const [allVehicles, setAllVehicles] = useState([]); // To hold all vehicles fetched across all pages
  const [totalVehiclesCount, setTotalVehiclesCount] = useState(0); // To hold the total count from the API
  const [isLoading, setIsLoading] = useState(true); // Loading state for the overall fetch process
  const [error, setError] = useState(null); // Error state for fetch errors

  // State for processed data derived from allVehicles (filtered or all)
  const [displayedVehicles, setDisplayedVehicles] = useState([]); // Vehicles currently displayed/filtered by date range
  const [dashboardMetrics, setDashboardMetrics] = useState(staticMetricsData);
  const [vehiclesByMakeData, setVehiclesByMakeData] = useState([]);
  const [vehicleApprovalStatusData, setVehicleApprovalStatusData] = useState(
    []
  );
  const [vehiclesCreatedOverTimeData, setVehiclesCreatedOverTimeData] =
    useState([]);
  const [vehiclesByTransmissionData, setVehiclesByTransmissionData] = useState(
    []
  );

  // Function to fetch all pages of vehicles recursively
  const fetchAllVehicles = useCallback(
    async (token, key = null, accumulatedData = []) => {
      // Defensive check: if somehow called without a token
      if (!token) {
        console.log("Admin token not available during fetch attempt.");
        setIsLoading(false); // Stop loading if fetch wasn't possible
        setAllVehicles([]); // Clear any previous data
        setTotalVehiclesCount(0); // Reset total count
        return;
      }

      try {
        const url = new URL(API_URL);
        // Add lastEvaluatedKey parameter if a key is provided
        if (key) {
          url.searchParams.append("lastEvaluatedKey", key);
        }
        // console.log(`Fetching vehicles with token and key=${key || "null"}:`, url.toString()); // Log less for cleaner console

        const response = await fetch(url.toString(), {
          headers: {
            Authorization: `Bearer ${token}`, // Include the Bearer token
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            console.error(
              "Authentication failed. Token might be expired or invalid. Clearing token."
            );
            setAdminToken(null); // Clear token state on auth failure
            // Stop loading and clear data if auth fails
            setIsLoading(false);
            setAllVehicles([]);
            setTotalVehiclesCount(0);
          }
          // Throw error to be caught by the outer try/catch or the catch block below
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        // console.log("Fetched vehicle data:", data); // Log less

        if (data && Array.isArray(data.body)) {
          const newAccumulatedData = [...accumulatedData, ...data.body];

          // Update the total count from the first response (assuming it's consistent)
          if (key === null && data.totalCount !== undefined) {
            setTotalVehiclesCount(data.totalCount);
          }

          // Check if there is a next page
          if (data.lastEvaluatedKey) {
            // Recursively call fetchAllVehicles with the new key and accumulated data
            fetchAllVehicles(token, data.lastEvaluatedKey, newAccumulatedData);
          } else {
            // No more pages, all data fetched
            setAllVehicles(newAccumulatedData); // Set the complete list
            setIsLoading(false); // Stop overall loading
          }
        } else {
          console.warn(
            "API response did not contain an array body or expected structure:",
            data
          );
          // Stop loading and clear data if response format is bad after first page
          if (key === null) {
            setAllVehicles([]);
            setTotalVehiclesCount(0);
            setIsLoading(false);
          } // If subsequent pages have bad format, the loading indicator might stay on
          // which is acceptable behavior - indicates a problem fetching all data.
        }
      } catch (fetchError) {
        console.error("Error fetching vehicles:", fetchError);
        setError(fetchError); // Set the error state
        setIsLoading(false); // Stop loading on error
        // Keep partially fetched data if any, or clear if it was an initial error
        if (key === null) {
          setAllVehicles([]);
          setTotalVehiclesCount(0);
        }
      }
    },
    []
  ); // useCallback dependencies: none needed if API_URL and state setters are stable

  // Effect to get admin token from localStorage AND trigger the initial fetch
  useEffect(() => {
    setIsLoading(true); // Start loading when component mounts

    const storedAdminJson = localStorage.getItem("admin");
    let token = null;

    if (storedAdminJson) {
      try {
        const adminData = JSON.parse(storedAdminJson);
        if (adminData && adminData.AccessToken) {
          token = adminData.AccessToken;
          setAdminToken(token); // Update state
        } else {
          console.warn(
            "localStorage 'admin' found, but AccessToken property is missing."
          );
        }
      } catch (error) {
        console.error("Failed to parse admin data from localStorage:", error);
      }
    } else {
      console.warn("No 'admin' data found in localStorage.");
    }

    // Now, if we successfully found a token, trigger the initial data fetch (first page)
    if (token) {
      console.log("Admin token found, initiating full vehicle data fetch...");
      fetchAllVehicles(token, null, []); // Start fetching from the beginning with an empty accumulator
    } else {
      // If no token was found, we can't fetch. Stop loading and reflect empty state.
      console.log("No admin token found, cannot fetch vehicle data.");
      setIsLoading(false); // Stop loading
      setAllVehicles([]); // Ensure list is empty
      setTotalVehiclesCount(0); // Ensure total count is 0
      setError(new Error("Authentication token not found.")); // Set an authentication error
    }

    // This effect should run only once on mount. Its dependency array needs fetchAllVehicles.
  }, [fetchAllVehicles]); // Dependency on fetchAllVehicles

  // Effect to filter vehicles based on the selected date range button
  useEffect(() => {
    let filtered = allVehicles;
    const now = dayjs();

    // Implement filtering logic based on `activeButton` and `createdAt`
    if (activeButton === "Today") {
      filtered = allVehicles.filter((vehicle) => {
        const createdAt = dayjs(vehicle.createdAt);
        return createdAt.isSame(now, "day");
      });
    } else if (activeButton === "Last Week") {
      const lastWeekStart = now.subtract(1, "week").startOf("day");
      const todayEnd = now.endOf("day");
      filtered = allVehicles.filter((vehicle) => {
        const createdAt = dayjs(vehicle.createdAt);
        // Check if createdAt is within the last 7 days including today
        return (
          createdAt.isAfter(lastWeekStart) &&
          createdAt.isBefore(todayEnd.add(1, "day"))
        );
      });
    } else if (activeButton === "Last Month") {
      const lastMonthStart = now.subtract(1, "month").startOf("day");
      const todayEnd = now.endOf("day");
      filtered = allVehicles.filter((vehicle) => {
        const createdAt = dayjs(vehicle.createdAt);
        // Check if createdAt is within the last 30 days including today
        return (
          createdAt.isAfter(lastMonthStart) &&
          createdAt.isBefore(todayEnd.add(1, "day"))
        );
      });
    }
    // If activeButton is 'All Time', `filtered` remains `allVehicles`

    setDisplayedVehicles(filtered);
  }, [activeButton, allVehicles]); // Re-run filter when button changes or allVehicles finish loading

  // Effect to process the cumulative data (or filtered data) once it's available
  useEffect(() => {
    if (!isLoading && !error) {
      // Process only when loading is false and no error

      // --- Process Metrics ---
      // Total Vehicles Listed metric now reflects the *total count* from the API
      // Pending Approvals and other metrics are based on the *currently displayed* (filtered) vehicles
      const pendingApprovals = displayedVehicles.filter(
        (v) => v.isApproved === "pending"
      ).length;
      const activeVehicles = displayedVehicles.filter(
        (v) => v.isApproved === "approved"
      ).length; // Assuming 'active' status corresponds to 'approved' approval
      const deniedVehicles = displayedVehicles.filter(
        (v) => v.isApproved === "denied"
      ).length;
      const totalDisplayedVehicles = displayedVehicles.length;

      // Update the metrics array - Note: percentages are static placeholders unless calculated
      const updatedMetrics = [
        {
          name: `Vehicles Listed (${activeButton})`,
          value: totalDisplayedVehicles.toLocaleString(),
          percentage: "",
        }, // Based on filtered data
        {
          name: "Pending Approvals",
          value: pendingApprovals.toLocaleString(),
          percentage: "",
        }, // Based on filtered data
        // Add Active and Denied metrics based on filtered data
        {
          name: "Active Vehicles",
          value: activeVehicles.toLocaleString(),
          percentage: "",
        },
        {
          name: "Denied Vehicles",
          value: deniedVehicles.toLocaleString(),
          percentage: "",
        },
      ];
      setDashboardMetrics(updatedMetrics);

      // --- Process Bar Chart Data (Vehicles by Make) ---
      const makeCounts = displayedVehicles.reduce((acc, vehicle) => {
        // Use || "Unknown Make" to handle null/undefined makes
        const make =
          vehicle.make && vehicle.make !== "string" && vehicle.make !== "Unkown"
            ? vehicle.make
            : "Unknown Make";
        acc[make] = (acc[make] || 0) + 1;
        return acc;
      }, {});

      const barData = Object.keys(makeCounts)
        .map((make) => ({
          name: make,
          value: makeCounts[make],
        }))
        .sort((a, b) => b.value - a.value); // Optional: Sort by count descending

      setVehiclesByMakeData(barData);

      // --- Process Pie Chart Data (Vehicle Approval Status) ---
      const approvalStatusCounts = displayedVehicles.reduce((acc, vehicle) => {
        const status = vehicle.isApproved || "unknown"; // Handle potential missing status
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      const pieStatusData = Object.keys(approvalStatusCounts).map((status) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1), // Capitalize status names
        value: approvalStatusCounts[status],
      }));

      setVehicleApprovalStatusData(pieStatusData);

      // --- Process Pie Chart Data (Vehicles by Transmission) ---
      const transmissionCounts = displayedVehicles.reduce((acc, vehicle) => {
        const transmission =
          vehicle.transmission &&
          vehicle.transmission !== "string" &&
          vehicle.transmission !== "Unkown"
            ? vehicle.transmission
            : "Unknown Transmission";
        acc[transmission] = (acc[transmission] || 0) + 1;
        return acc;
      }, {});

      const pieTransmissionData = Object.keys(transmissionCounts).map(
        (transmission) => ({
          name: transmission,
          value: transmissionCounts[transmission],
        })
      );

      setVehiclesByTransmissionData(pieTransmissionData);

      // --- Process Line Chart Data (Vehicles Created Over Time) ---
      const creationCounts = displayedVehicles.reduce((acc, vehicle) => {
        try {
          // Attempt to parse the creation date
          const createdAt = dayjs(vehicle.createdAt);
          if (createdAt.isValid()) {
            // Format by Month-Year, e.g., "2024-09"
            const monthYear = createdAt.format("YYYY-MM");
            acc[monthYear] = (acc[monthYear] || 0) + 1;
          } else {
            // Handle invalid dates
            console.warn("Invalid createdAt date:", vehicle.createdAt);
          }
        } catch (e) {
          console.error("Error parsing date:", vehicle.createdAt, e);
        }
        return acc;
      }, {});

      // Convert object to array and sort by date
      const lineData = Object.keys(creationCounts)
        .map((dateKey) => ({
          date: dateKey,
          count: creationCounts[dateKey],
          // Format for display, e.g., "Sep 2024"
          formattedDate: dayjs(dateKey).format("MMM YYYY"),
        }))
        .sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf()); // Sort by date timestamp

      setVehiclesCreatedOverTimeData(lineData);
    } else if (!isLoading && !error && allVehicles.length === 0) {
      // If not loading, no error, but no vehicles fetched
      const updatedMetrics = staticMetricsData.map((m) =>
        m.name === "Total Vehicles Listed" || m.name === "Pending Approvals"
          ? { ...m, value: "0" }
          : m
      );
      // Also reset added metrics to 0
      updatedMetrics.splice(2, 0, {
        name: "Active Vehicles",
        value: "0",
        percentage: "",
      }); // Insert at index 2
      updatedMetrics.splice(3, 0, {
        name: "Denied Vehicles",
        value: "0",
        percentage: "",
      }); // Insert at index 3 (after the new Active)
      setDashboardMetrics(updatedMetrics);

      setVehiclesByMakeData([]);
      setVehicleApprovalStatusData([]);
      setVehiclesByTransmissionData([]);
      setVehiclesCreatedOverTimeData([]);
    }
  }, [displayedVehicles, isLoading, error, totalVehiclesCount, allVehicles]); // Effect runs when filtered data or loading/error status changes

  const handleButtonClick = (buttonName) => {
    setActiveButton(buttonName);
    // The filtering logic is now handled in the useEffect that watches `activeButton` and `allVehicles`
  };

  // Render loading, error, or the dashboard
  if (isLoading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
        sx={{ flexGrow: 1, p: 3 }}
      >
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading dashboard data...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ flexGrow: 1, p: 3, color: "error.main" }}>
        Error loading data: {error.message}
      </Box>
    );
  }

  // If loading is false, no error, but no vehicles were fetched (e.g., no token or empty response)
  if (
    !isLoading &&
    !error &&
    allVehicles.length === 0 &&
    totalVehiclesCount === 0
  ) {
    return <Box sx={{ flexGrow: 1, p: 3 }}>No vehicle data available.</Box>;
  }

  return (
    <Box sx={{ flexGrow: 1, p: 1, backgroundColor: "#ffffff" }}>
      <Box pb={4} pt={0}>
        <span className="text-2xl">Dashboard</span>
      </Box>
      {/* Date filtering buttons */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-start",
          ml: -1,
          mb: 4,
        }}
      >
        {/* Buttons trigger filter change */}
        <Button
          className="border"
          style={{
            backgroundColor:
              activeButton === "All Time" ? "#314B7D" : "#F7F8FF",
            borderRadius: "10px",
            paddingTop: "5px",
            paddingBottom: "5px",
            paddingLeft: "20px",
            paddingRight: "20px",
            marginInline: "10px",
            color: activeButton === "All Time" ? "white" : "black",
          }}
          onClick={() => handleButtonClick("All Time")}
        >
          All Time
        </Button>
        <Button
          className="border"
          style={{
            backgroundColor: activeButton === "Today" ? "#314B7D" : "#F7F8FF",
            borderRadius: "10px",
            paddingTop: "5px",
            paddingBottom: "5px",
            paddingLeft: "20px",
            paddingRight: "20px",
            marginInline: "10px",
            color: activeButton === "Today" ? "white" : "black",
          }}
          onClick={() => handleButtonClick("Today")}
        >
          Today
        </Button>
        <Button
          className="border"
          style={{
            backgroundColor:
              activeButton === "Last Week" ? "#314B7D" : "#F7F8FF",
            borderRadius: "10px",
            paddingTop: "5px",
            paddingBottom: "5px",
            paddingLeft: "20px",
            paddingRight: "20px",
            marginInline: "10px",
            color: activeButton === "Last Week" ? "white" : "black",
          }}
          onClick={() => handleButtonClick("Last Week")}
        >
          Last Week
        </Button>
        <Button
          className="border"
          style={{
            backgroundColor:
              activeButton === "Last Month" ? "#314B7D" : "#F7F8FF",
            borderRadius: "10px",
            paddingTop: "5px",
            paddingBottom: "5px",
            paddingLeft: "20px",
            paddingRight: "20px",
            marginInline: "10px",
            color: activeButton === "Last Month" ? "white" : "black",
          }}
          onClick={() => handleButtonClick("Last Month")}
        >
          Last Month
        </Button>
      </Box>

      <Grid container spacing={2}>
        {/* Metric Cards */}
        {dashboardMetrics.map((item) => (
          <Grid item xs={12} sm={6} md={2} key={item.name}>
            {" "}
            {/* Adjusted grid size */}
            <div className="bg-[#F7F8FF] shadow-xs flex flex-col shadow-blue-100 rounded-2xl p-4">
              <Typography variant="h10">{item.name}</Typography>
              <Typography variant="h6">{item.value}</Typography>
              {/* Only show percentage if available (static data has it, API data does not) */}
              {item.percentage && (
                <Typography variant="body8" color="green">
                  {item.percentage}
                </Typography>
              )}
            </div>
          </Grid>
        ))}

        {/* Vehicle Listings by Car Make Bar Chart */}
        <Grid item xs={12} md={6}>
          {" "}
          {/* Use responsive grid */}
          <div className="bg-white shadow-[#dee2fe] drop-shadow-md p-4 px-8 rounded-2xl">
            <div className="w-full text-gray-800 font-semibold text-start">
              Vehicle Listings by Car Make ({activeButton})
            </div>
            <div className="w-full  text-xl font-semibold text-start">
              {displayedVehicles.length.toLocaleString()} cars
            </div>
            {/* Ensure bar chart has data before rendering */}
            {vehiclesByMakeData.length > 0 ? (
              <BarChart
                dataset={vehiclesByMakeData}
                yAxis={[
                  {
                    scaleType: "band",
                    dataKey: "name",
                    categoryGapRatio: 0.05,
                    tickSize: 0,
                  },
                ]}
                xAxis={[
                  {
                    label: "Number Of Vehicles",
                    tickSize: 0,
                    tickLabelStyle: {
                      fontSize: 12,
                      fill: "#666",
                    },
                  },
                ]}
                series={[
                  {
                    dataKey: "value",
                    color: "#28457D",
                    barWidth: 30, // Adjust bar width if needed
                  },
                ]}
                grid={{
                  horizontal: true,
                  vertical: true,
                  stroke: "#ddd",
                  strokeWidth: 1,
                }}
                layout="horizontal"
                {...chartSetting} // Use spread operator for chart settings
              />
            ) : (
              <Typography variant="body2" sx={{ mt: 4 }}>
                No make data available for this period.
              </Typography>
            )}
          </div>
        </Grid>

        {/* NEW CHART: Vehicles Created Over Time Line Chart */}
        <Grid item xs={12} md={6}>
          {" "}
          {/* Use responsive grid */}
          <div className="bg-white shadow-[#dee2fe] drop-shadow-md p-4 px-8 rounded-2xl">
            <div className="w-full text-gray-800 font-semibold text-start">
              Vehicles Created Over Time
            </div>
            {/* Optional: Display total count for this chart */}
            <div className="w-full  text-xl font-semibold text-start">
              {vehiclesCreatedOverTimeData
                .reduce((sum, item) => sum + item.count, 0)
                .toLocaleString()}{" "}
              vehicles
            </div>
            <div
              className="font-medium text-gray-700"
              style={{
                position: "absolute",
                left: lineChartSetting.margin.left / 2, // Position label based on margin
                top: "50%",
                transform: "translateY(-50%) rotate(-90deg)",
                transformOrigin: "center",
                whiteSpace: "nowrap",
              }}
            >
              Count
            </div>
            {vehiclesCreatedOverTimeData.length > 0 ? (
              <LineChart
                dataset={vehiclesCreatedOverTimeData}
                xAxis={[
                  {
                    dataKey: "formattedDate", // Use formatted date for labels
                    scaleType: "point",
                    label: "Month & Year",
                    labelStyle: { fontSize: 14, fill: "#333" },
                    tickLabelStyle: { fontSize: 12, fill: "#8A8A8A" },
                    tickSize: 0,
                    tickPadding: 20,
                  },
                ]}
                yAxis={[
                  {
                    dataKey: "count", // Use count for values
                    tickLabelStyle: { fontSize: 12, fill: "#8A8A8A" },
                    axisLine: { stroke: "#0000FF", strokeWidth: 1 },
                    tickSize: 0,
                    tickPadding: 20,
                  },
                ]}
                series={[
                  {
                    dataKey: "count",
                    label: "Vehicles Created", // Label for tooltip
                    area: true,
                    curve: "linear",
                    color: "#B2C8FF", // Use your design color
                    showMark: false,
                  },
                ]}
                grid={{
                  horizontal: true,
                  vertical: true,
                  stroke: "#ddd",
                  strokeWidth: 1,
                }}
                {...lineChartSetting}
              >
                {/* Add Tooltip to show values on hover */}
                <Tooltip
                  formatter={(value, name, props) => [
                    value,
                    "Vehicles Created",
                  ]}
                />
              </LineChart>
            ) : (
              <Typography variant="body2" sx={{ mt: 4 }}>
                No vehicle creation data for this period.
              </Typography>
            )}
          </div>
        </Grid>

        {/* Vehicle Approval Status Pie Chart */}
        <Grid item xs={12} sm={6} md={4}>
          {" "}
          {/* Use responsive grid */}
          <Item>
            {/* Updated title to reflect data */}
            <Typography variant="h6">
              Vehicle Approval Status ({activeButton})
            </Typography>
            {/* Ensure pie chart has data before rendering */}
            {vehicleApprovalStatusData.length > 0 ? (
              <PieChart {...pieChartSetting}>
                <Pie
                  data={vehicleApprovalStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel} // Use the updated label renderer
                  outerRadius={80} // Adjust size as needed
                  fill="#8884d8"
                  dataKey="value"
                >
                  {vehicleApprovalStatusData.map((entry, index) => (
                    <Cell
                      key={`cell-${entry.name}`} // Use name for a more unique key
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip /> {/* Add Tooltip */}
              </PieChart>
            ) : (
              <Typography variant="body2" sx={{ mt: 4 }}>
                No approval status data available for this period.
              </Typography>
            )}
          </Item>
        </Grid>

        {/* NEW CHART: Vehicles by Transmission Pie Chart */}
        <Grid item xs={12} sm={6} md={4}>
          {" "}
          {/* Use responsive grid */}
          <Item>
            <Typography variant="h6">
              Vehicles by Transmission ({activeButton})
            </Typography>
            {vehiclesByTransmissionData.length > 0 ? (
              <PieChart {...pieChartSetting}>
                <Pie
                  data={vehiclesByTransmissionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {vehiclesByTransmissionData.map((entry, index) => (
                    <Cell
                      key={`cell-${entry.name}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip /> {/* Add Tooltip */}
              </PieChart>
            ) : (
              <Typography variant="body2" sx={{ mt: 4 }}>
                No transmission data available for this period.
              </Typography>
            )}
          </Item>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
