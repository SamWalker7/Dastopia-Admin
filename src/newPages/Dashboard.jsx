import * as React from "react";
import { useState } from "react";
import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import { Grid, Stack } from "@mui/material";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { BarChart } from "@mui/x-charts";
import { LineChart } from "@mui/x-charts/LineChart";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import dayjs from "dayjs";
const chartSetting = {
  xAxis: [
    {
      label: "Number of Cars",
    },
  ],
  width: 500,
  height: 310,
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

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

const pieData = [
  { name: "Rented", value: 55 },
  { name: "Not Rented", value: 45 },
];

const pieData2 = [
  { name: "Male", value: 55 },
  { name: "Female", value: 45 },
];

const barChartData = [
  { name: "SUV", value: 800 },
  { name: "Trucks", value: 600 },
  { name: "SUVs", value: 700 },
  { name: "Vans", value: 500 },
  { name: "ars", value: 800 },
  { name: "rucks", value: 600 },
  { name: "SUV", value: 700 },
  { name: "Vns", value: 500 },
];

const data = [4000, 3000, 2000, null, 1890, 2390, 3490];
const xData = [
  "Page A",
  "Page B",
  "Page C",
  "Page D",
  "Page E",
  "Page F",
  "Page G",
];
const lineChartData = [
  { name: "Jan", Users: 0 },
  { name: "Feb", Users: 100 },
  { name: "Mar", Users: 200 },
  { name: "Apr", Users: 400 },
  { name: "May", Users: 500 },
  { name: "Jun", Users: 400 },
  { name: "Ja", Users: 500 },
  { name: "Fb", Users: 500 },
  { name: "ar", Users: 700 },
];

const Dashboard = () => {
  const [date, setDate] = useState(dayjs());
  const [activeButton, setActiveButton] = useState("Today");

  const handleButtonClick = (buttonName) => {
    setActiveButton(buttonName);
    // Implement date filtering logic here based on buttonName
  };

  const data = [
    { name: "Total Users", value: "1,200", percentage: "+11.02%" },
    { name: "Total Bookings", value: "27,801", percentage: "+11.02%" },
    { name: "Total Vehicles Listed", value: "27,801", percentage: "+11.02%" },
    { name: "Pending Approvals", value: "27,801", percentage: "+11.02%" },
    { name: "Visits", value: "27,801", percentage: "+11.02%" },
  ];

  return (
    <Box sx={{ flexGrow: 1, p: 1, backgroundColor: "#ffffff" }}>
      <Box pb={4} pt={0}>
        <span className="text-2xl">Dashboard</span>
      </Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-start",
          ml: -1,
          mb: 4,
        }}
      >
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
        {data.map((item) => (
          <Grid item xs={2.4} key={item.name}>
            <div className="bg-[#F7F8FF] shadow-xs flex flex-col shadow-blue-100 rounded-2xl p-4">
              <Typography variant="h10">{item.name}</Typography>
              <Typography variant="h6">{item.value}</Typography>
              <Typography variant="body8" color="green">
                {item.percentage}
              </Typography>
            </div>
          </Grid>
        ))}
        <Grid item xs={6}>
          <div className="bg-white shadow-[#dee2fe] drop-shadow-md p-4 px-8 rounded-2xl">
            <div className="w-full text-gray-800 font-semibold text-start">
              Vehicle Listings by Car Make
            </div>
            <div className="w-full  text-xl font-semibold text-start">
              1,400 cars
            </div>
            <div className="w-full flex items-center text-gray-800 mt-4 -mb-10 text-xs  text-start">
              <div className="rounded-full w-2 h-2 mr-2 bg-[#28457D]"></div>{" "}
              Cars
            </div>

            <BarChart
              dataset={barChartData}
              yAxis={[
                {
                  scaleType: "band",
                  dataKey: "name",

                  categoryGapRatio: 0.05,
                  tickSize: 0, // Length of the ticks
                },
              ]}
              xAxis={[
                {
                  label: "Number Of Cars",
                  tickSize: 0, // Set tick size for x-axis
                  tickLabelStyle: {
                    fontSize: 12, // Customize tick label font size
                    fill: "#666", // Customize tick label color
                  },
                  tickSize: 0, // Length of the ticks
                },
              ]} // Added barGapRatio
              series={[
                {
                  dataKey: "value",

                  color: "#28457D",
                  barWidth: 30,
                },
              ]}
              grid={{
                horizontal: true, // Enable horizontal grid lines
                vertical: true, // Enable vertical grid lines
                stroke: "#ddd", // Color of grid lines
                strokeWidth: 1, // Thickness of grid lines
              }}
              layout="horizontal"
              {...chartSetting}
            ></BarChart>
          </div>
        </Grid>
        <Grid item xs={6}>
          <div className="bg-white shadow-[#dee2fe] drop-shadow-md p-4 px-8 rounded-2xl">
            <div className="w-full text-gray-800 font-semibold text-start">
              User Growth
            </div>
            <div className="w-full  text-xl font-semibold text-start">
              3,459 cars
            </div>{" "}
            <div
              className="font-medium text-gray-700"
              style={{
                position: "absolute",
                left: "40px", // Adjust position to align with y-axis
                top: "50%",
                transform: "translateY(-50%) rotate(-90deg)",
                transformOrigin: "center",
                whiteSpace: "nowrap",
              }}
            >
              Users
            </div>
            <LineChart
              xAxis={[
                {
                  data: lineChartData.map((item) => item.name), // Map months for x-axis
                  scaleType: "point",
                  label: "Months",
                  labelStyle: {
                    fontSize: 14, // Label font size
                    fill: "#333", // Label text color
                  },
                  tickLabelStyle: {
                    fontSize: 12, // Tick label font size
                    fill: "#8A8A8A", // Tick label text color
                  },
                  tickSize: 0, // Length of the ticks
                  tickPadding: 20, // Space between ticks and labels
                },
              ]}
              yAxis={[
                {
                  tickLabelStyle: {
                    fontSize: 12, // Tick label font size
                    fill: "#8A8A8A", // Tick label text color
                  },
                  axisLine: {
                    stroke: "#0000FF", // Blue color
                    strokeWidth: 1,
                  },

                  tickSize: 0, // Length of the ticks
                  tickPadding: 20, // Space between ticks and labels
                },
              ]}
              series={[
                {
                  data: lineChartData.map((item) => item.Users), // Map users for y-axis
                  area: true, // Enable area fill
                  curve: "linear", // Add smooth curve
                  color: "#B2C8FF", // Use your design color
                  showMark: false, // Hide data point markers
                },
              ]}
              grid={{
                horizontal: true, // Enable horizontal grid lines
                vertical: true, // Enable vertical grid lines
                stroke: "#ddd", // Color of grid lines
                strokeWidth: 1, // Thickness of grid lines
              }}
              margin={{ left: 80, right: 20, top: 20, bottom: 50 }}
              width={500}
              height={300}
            />
          </div>
        </Grid>

        <Grid item xs={4}></Grid>

        <Grid item xs={4}>
          <Item>
            <Typography variant="h6">Vehicle Availability</Typography>
            <PieChart width={300} height={200}>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
            </PieChart>
          </Item>
        </Grid>

        <Grid item xs={4}>
          <Item>
            <Typography variant="h6">User Demographics</Typography>
            <PieChart width={300} height={200}>
              <Pie
                data={pieData2}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData2.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
            </PieChart>
          </Item>
        </Grid>
      </Grid>
    </Box>
  );
};

const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  index,
}) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos((-midAngle * Math.PI) / 180);
  const y = cy + radius * Math.sin(-midAngle / 180);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default Dashboard;
