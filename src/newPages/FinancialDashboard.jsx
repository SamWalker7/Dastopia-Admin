import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import { Grid, CircularProgress, Typography, Button } from "@mui/material";
import Paper from "@mui/material/Paper";

// For PieChart from recharts
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";

// For BarChart and LineChart from @mui/x-charts
import { BarChart } from "@mui/x-charts/BarChart";
import { LineChart } from "@mui/x-charts/LineChart";

// Date handling
import dayjs from "dayjs";

// (DatePicker imports are kept commented out as in your original if you plan to use them later)
// import { DatePicker } from "@mui/x-date-pickers/DatePicker";
// import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
// import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";

// Define the API URL for transactions
const API_BASE_URL =
  "https://oy0bs62jx8.execute-api.us-east-1.amazonaws.com/Prod/v1";
const TRANSACTIONS_API_URL = `${API_BASE_URL}/admin/transactions`;

// Chart settings (can be fine-tuned)
const lineChartSettings = {
  margin: { left: 70, right: 30, top: 30, bottom: 50 }, // Adjusted for labels
  height: 350, // Height for the chart area itself
};

const barChartSettings = {
  height: 350,
};

const pieChartSettings = {
  height: 280, // Adjusted for potentially smaller pie charts in a grid
};

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === "dark" ? "#1A2027" : "#fff",
  ...theme.typography.body2,
  padding: theme.spacing(2),
  textAlign: "center",
  color: theme.palette.text.secondary,
  borderRadius: "12px", // Slightly more rounded
  boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.08)", // Softer shadow
  height: "100%", // Make items fill grid cell height
  display: "flex",
  flexDirection: "column",
  // justifyContent: 'space-between' // Let content flow naturally, title at top
}));

const CHART_COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#A280F8",
  "#FF6F8E",
  "#8DD1E1",
  "#83A6ED",
  "#FFD700",
  "#ADFF2F",
  "#FF69B4",
  "#7FFFD4", // Expanded color palette
];

const renderCustomizedPieLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  name,
}) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.6; // Adjust label position
  const x = cx + radius * Math.cos((-midAngle * Math.PI) / 180);
  const y = cy + radius * Math.sin((-midAngle * Math.PI) / 180);

  if (percent < 0.04) return null; // Don't render for very small slices

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fontSize="11px"
      fontWeight="bold"
    >
      {`${name}: ${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const FinancialDashboard = () => {
  const [activeButton, setActiveButton] = useState("All Time");
  const [adminToken, setAdminToken] = useState(null);

  const [allTransactions, setAllTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [displayedTransactions, setDisplayedTransactions] = useState([]);
  const [dashboardMetrics, setDashboardMetrics] = useState([]);
  const [revenueOverTimeData, setRevenueOverTimeData] = useState([]);
  const [transactionStatusData, setTransactionStatusData] = useState([]);
  const [revenueByPaymentMethodData, setRevenueByPaymentMethodData] = useState(
    []
  );
  const [
    transactionCountByPaymentMethodData,
    setTransactionCountByPaymentMethodData,
  ] = useState([]);
  const [revenueByTransactionTypeData, setRevenueByTransactionTypeData] =
    useState([]);

  const fetchAllTransactions = useCallback(
    async (token, pageNumber = 1, accumulatedData = []) => {
      if (!token) {
        console.warn("Admin token not available for fetching transactions.");
        // Only set loading to false if it's the initial call without a token
        if (pageNumber === 1) {
          setIsLoading(false);
          setError(new Error("Authentication token not found."));
          setAllTransactions([]);
        }
        return;
      }
      if (pageNumber === 1) setIsLoading(true); // Main loading for the first page

      try {
        const url = new URL(TRANSACTIONS_API_URL);
        url.searchParams.append("page", pageNumber.toString());

        const response = await fetch(url.toString(), {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          if (response.status === 401) {
            console.error(
              "Authentication failed. Token might be expired or invalid."
            );
            // setAdminToken(null);
            // localStorage.removeItem("admin");
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (
          result.status === "success" &&
          result.data &&
          Array.isArray(result.data.transactions)
        ) {
          const newAccumulatedData = [
            ...accumulatedData,
            ...result.data.transactions,
          ];

          const nextPageUrlString = result.data.pagination?.next_page_url;
          if (nextPageUrlString) {
            // Extract page number from Chapa's next_page_url
            // This assumes your backend passes Chapa's URL structure
            let nextPage = null;
            try {
              const chapaUrl = new URL(nextPageUrlString);
              const pageParam = chapaUrl.searchParams.get("page");
              if (pageParam) nextPage = parseInt(pageParam);
            } catch (e) {
              console.warn(
                "Could not parse next_page_url from Chapa, attempting to increment page number",
                e
              );
              // Fallback or specific logic if URL is relative or different
              // For now, if parsing fails, we assume pagination ends or backend handles it differently
            }

            if (nextPage) {
              fetchAllTransactions(token, nextPage, newAccumulatedData);
            } else {
              // No valid 'page' param in next_page_url, assume pagination ended
              setAllTransactions(newAccumulatedData);
              if (pageNumber === 1 && newAccumulatedData.length === 0) {
                // If first page returns empty, it's still a "no data" scenario not an error
              }
              setIsLoading(false);
            }
          } else {
            setAllTransactions(newAccumulatedData);
            setIsLoading(false);
          }
        } else {
          console.warn(
            "API response did not contain expected transaction data structure:",
            result
          );
          throw new Error("Invalid data structure in API response.");
        }
      } catch (fetchError) {
        console.error("Error fetching transactions:", fetchError);
        setError(fetchError);
        setIsLoading(false);
        if (pageNumber === 1) setAllTransactions([]);
      }
    },
    []
  );

  useEffect(() => {
    const storedAdminJson = localStorage.getItem("admin");
    let token = null;
    if (storedAdminJson) {
      try {
        const adminData = JSON.parse(storedAdminJson);
        if (adminData && adminData.AccessToken) {
          token = adminData.AccessToken;
          setAdminToken(token);
        }
      } catch (e) {
        console.error("Failed to parse admin data:", e);
      }
    }

    if (token) {
      fetchAllTransactions(token);
    } else {
      console.warn("Admin token not found. Cannot fetch transactions.");
      setIsLoading(false);
      setError(new Error("Authentication token not found. Please log in."));
    }
  }, [fetchAllTransactions]);

  useEffect(() => {
    let filtered = allTransactions;
    const now = dayjs();

    if (activeButton === "Today") {
      filtered = allTransactions.filter((t) =>
        dayjs(t.created_at).isSame(now, "day")
      );
    } else if (activeButton === "Last Week") {
      const lastWeekStart = now.subtract(1, "week").startOf("day");
      filtered = allTransactions.filter((t) => {
        const createdAt = dayjs(t.created_at);
        return (
          createdAt.isAfter(lastWeekStart) &&
          createdAt.isSameOrBefore(now.endOf("day"))
        );
      });
    } else if (activeButton === "Last Month") {
      const lastMonthStart = now.subtract(1, "month").startOf("day");
      filtered = allTransactions.filter((t) => {
        const createdAt = dayjs(t.created_at);
        return (
          createdAt.isAfter(lastMonthStart) &&
          createdAt.isSameOrBefore(now.endOf("day"))
        );
      });
    }
    setDisplayedTransactions(filtered);
  }, [activeButton, allTransactions]);

  useEffect(() => {
    const defaultMetrics = [
      { name: "Total Revenue", value: "ETB 0.00" },
      { name: "Total Transactions", value: "0" },
      { name: "Successful Transactions", value: "0" },
      { name: "Avg. Transaction Value", value: "ETB 0.00" },
      { name: "Total Chapa Fees", value: "ETB 0.00" },
    ];

    if (isLoading && allTransactions.length === 0) {
      // Still loading initial data
      setDashboardMetrics(defaultMetrics); // Show placeholders while loading
      // Clear chart data as well
      setRevenueOverTimeData([]);
      setTransactionStatusData([]);
      setRevenueByPaymentMethodData([]);
      setTransactionCountByPaymentMethodData([]);
      setRevenueByTransactionTypeData([]);
      return;
    }
    if (error) {
      // An error occurred during fetch
      setDashboardMetrics(defaultMetrics);
      // Clear chart data
      setRevenueOverTimeData([]);
      setTransactionStatusData([]);
      setRevenueByPaymentMethodData([]);
      setTransactionCountByPaymentMethodData([]);
      setRevenueByTransactionTypeData([]);
      return;
    }
    if (!isLoading && allTransactions.length === 0 && !error) {
      // Loaded, no error, but no data
      setDashboardMetrics(defaultMetrics);
      // Clear chart data
      setRevenueOverTimeData([]);
      setTransactionStatusData([]);
      setRevenueByPaymentMethodData([]);
      setTransactionCountByPaymentMethodData([]);
      setRevenueByTransactionTypeData([]);
      return;
    }

    const successfulTransactions = displayedTransactions.filter(
      (t) => t.status === "success"
    );

    const totalRevenue = successfulTransactions.reduce(
      (sum, t) => sum + parseFloat(t.amount || 0),
      0
    );
    const totalFees = successfulTransactions.reduce(
      (sum, t) => sum + parseFloat(t.charge || 0),
      0
    );
    const successfulCount = successfulTransactions.length;
    const atv = successfulCount > 0 ? totalRevenue / successfulCount : 0;

    setDashboardMetrics([
      {
        name: "Total Revenue",
        value: `ETB ${totalRevenue.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
      },
      {
        name: "Total Transactions",
        value: displayedTransactions.length.toLocaleString(),
      },
      {
        name: "Successful Transactions",
        value: successfulCount.toLocaleString(),
      },
      {
        name: "Avg. Transaction Value",
        value: `ETB ${atv.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
      },
      {
        name: "Total Chapa Fees",
        value: `ETB ${totalFees.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
      },
    ]);

    const revenueByDate = successfulTransactions.reduce((acc, t) => {
      const dateKey = dayjs(t.created_at).format(
        activeButton === "Today" ? "HH:00" : "YYYY-MM-DD"
      );
      acc[dateKey] = (acc[dateKey] || 0) + parseFloat(t.amount || 0);
      return acc;
    }, {});
    const revenueTimeline = Object.keys(revenueByDate)
      .map((dateKey) => ({
        date: dateKey,
        value: revenueByDate[dateKey],
        formattedDate:
          activeButton === "Today" ? dateKey : dayjs(dateKey).format("MMM DD"),
      }))
      .sort((a, b) =>
        activeButton === "Today"
          ? a.date.localeCompare(b.date)
          : dayjs(a.date).valueOf() - dayjs(b.date).valueOf()
      );
    setRevenueOverTimeData(revenueTimeline);

    const statusCounts = displayedTransactions.reduce((acc, t) => {
      const status = t.status || "unknown";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    setTransactionStatusData(
      Object.keys(statusCounts)
        .map((status) => ({
          name: status.charAt(0).toUpperCase() + status.slice(1),
          value: statusCounts[status],
        }))
        .sort((a, b) => b.value - a.value)
    );

    const revenueByMethod = successfulTransactions.reduce((acc, t) => {
      const method = t.payment_method || "Unknown";
      acc[method] = (acc[method] || 0) + parseFloat(t.amount || 0);
      return acc;
    }, {});
    setRevenueByPaymentMethodData(
      Object.keys(revenueByMethod)
        .map((method) => ({
          name: method.charAt(0).toUpperCase() + method.slice(1),
          value: revenueByMethod[method],
        }))
        .sort((a, b) => b.value - a.value)
    );

    const countByMethod = successfulTransactions.reduce((acc, t) => {
      const method = t.payment_method || "Unknown";
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {});
    setTransactionCountByPaymentMethodData(
      Object.keys(countByMethod)
        .map((method) => ({
          name: method.charAt(0).toUpperCase() + method.slice(1),
          value: countByMethod[method],
        }))
        .sort((a, b) => b.value - a.value)
    );

    const revenueByType = successfulTransactions.reduce((acc, t) => {
      const type = t.type || "Unknown";
      acc[type] = (acc[type] || 0) + parseFloat(t.amount || 0);
      return acc;
    }, {});
    setRevenueByTransactionTypeData(
      Object.keys(revenueByType)
        .map((type) => ({
          name: type,
          value: revenueByType[type],
        }))
        .sort((a, b) => b.value - a.value)
    );
  }, [
    displayedTransactions,
    isLoading,
    error,
    allTransactions.length,
    activeButton,
  ]);

  const handleButtonClick = (buttonName) => setActiveButton(buttonName);

  if (isLoading && allTransactions.length === 0) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
      >
        <CircularProgress />{" "}
        <Typography sx={{ mt: 2 }}>Loading financial data...</Typography>
      </Box>
    );
  }

  if (error && allTransactions.length === 0) {
    return (
      <Box sx={{ flexGrow: 1, p: 3, color: "error.main", textAlign: "center" }}>
        <Typography variant="h5">Error Loading Data</Typography>
        <Typography>{error.message}</Typography>
        {error.message.includes("Authentication") && (
          <Typography>Please try logging in again.</Typography>
        )}
      </Box>
    );
  }

  // This covers the case where loading is done, no error, but API returned no transactions (or token was bad from start)
  if (!isLoading && !error && allTransactions.length === 0) {
    return (
      <Box sx={{ flexGrow: 1, p: 3, textAlign: "center" }}>
        <Typography>No transaction data available.</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        flexGrow: 1,
        p: { xs: 1, sm: 2, md: 3 },
        backgroundColor: "#F4F6F8",
      }}
    >
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
        flexWrap="wrap"
      >
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
          Financial Dashboard
        </Typography>
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-start",
            flexWrap: "wrap",
          }}
        >
          {["All Time", "Today", "Last Week", "Last Month"].map(
            (buttonName) => (
              <Button
                key={buttonName}
                variant={activeButton === buttonName ? "contained" : "outlined"}
                onClick={() => handleButtonClick(buttonName)}
                sx={{
                  mr: 1,
                  mb: 1,
                  borderRadius: "20px",
                  textTransform: "none",
                  whiteSpace: "nowrap",
                }}
              >
                {buttonName}
              </Button>
            )
          )}
        </Box>
      </Box>

      <Grid container spacing={3} mb={3}>
        {dashboardMetrics.map((item) => (
          <Grid
            item
            xs={12}
            sm={6}
            md={true}
            key={item.name}
            flexGrow={1}
            sx={{ minWidth: { sm: "180px" } }}
          >
            <Item sx={{ p: { xs: 1.5, sm: 2.5 } }}>
              <Typography
                variant="subtitle1"
                color="text.secondary"
                gutterBottom
                noWrap
              >
                {item.name}
              </Typography>
              <Typography variant="h5" fontWeight="medium" noWrap>
                {item.value}
              </Typography>
            </Item>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={7}>
          <Item>
            <Typography variant="h6" align="left" gutterBottom sx={{ pl: 1 }}>
              Revenue Over Time ({activeButton})
            </Typography>
            {revenueOverTimeData.length > 0 ? (
              <ResponsiveContainer
                width="100%"
                height={lineChartSettings.height}
              >
                <LineChart
                  dataset={revenueOverTimeData}
                  margin={lineChartSettings.margin}
                  xAxis={[
                    {
                      dataKey: "formattedDate",
                      scaleType: "point",
                      label: activeButton === "Today" ? "Time of Day" : "Date",
                    },
                  ]}
                  yAxis={[
                    {
                      label: "Revenue (ETB)",
                      valueFormatter: (value) => value.toLocaleString(),
                    },
                  ]}
                  series={[
                    {
                      dataKey: "value",
                      label: "Revenue",
                      area: true,
                      color: CHART_COLORS[0],
                    },
                  ]}
                  grid={{ horizontal: true }}
                />
              </ResponsiveContainer>
            ) : (
              <Typography sx={{ py: 5 }}>
                No revenue data for this period.
              </Typography>
            )}
          </Item>
        </Grid>

        <Grid item xs={12} md={6} lg={5}>
          <Item>
            <Typography variant="h6" align="left" gutterBottom sx={{ pl: 1 }}>
              Transaction Status ({activeButton})
            </Typography>
            {transactionStatusData.length > 0 ? (
              <ResponsiveContainer
                width="100%"
                height={pieChartSettings.height}
              >
                <RechartsPieChart>
                  <RechartsTooltip
                    formatter={(value, name) => [
                      `${value.toLocaleString()} transactions`,
                      name,
                    ]}
                  />
                  <Pie
                    data={transactionStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedPieLabel}
                    outerRadius={85}
                    dataKey="value"
                  >
                    {transactionStatusData.map((entry, index) => (
                      <Cell
                        key={`cell-status-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <Typography sx={{ py: 5 }}>No status data available.</Typography>
            )}
          </Item>
        </Grid>

        <Grid item xs={12} lg={7}>
          <Item>
            <Typography variant="h6" align="left" gutterBottom sx={{ pl: 1 }}>
              Revenue by Payment Method ({activeButton})
            </Typography>
            {revenueByPaymentMethodData.length > 0 ? (
              <ResponsiveContainer
                width="100%"
                height={barChartSettings.height}
              >
                <BarChart
                  dataset={revenueByPaymentMethodData}
                  yAxis={[{ scaleType: "band", dataKey: "name" }]}
                  xAxis={[
                    {
                      label: "Revenue (ETB)",
                      valueFormatter: (value) => value.toLocaleString(),
                    },
                  ]}
                  series={[
                    {
                      dataKey: "value",
                      label: "Revenue",
                      color: CHART_COLORS[1],
                    },
                  ]}
                  layout="horizontal"
                  grid={{ vertical: true }}
                  slotProps={{ legend: { hidden: true } }}
                />
              </ResponsiveContainer>
            ) : (
              <Typography sx={{ py: 5 }}>
                No revenue data by payment method.
              </Typography>
            )}
          </Item>
        </Grid>

        <Grid item xs={12} md={6} lg={5}>
          <Item>
            <Typography variant="h6" align="left" gutterBottom sx={{ pl: 1 }}>
              Transactions by Payment Method ({activeButton})
            </Typography>
            {transactionCountByPaymentMethodData.length > 0 ? (
              <ResponsiveContainer
                width="100%"
                height={pieChartSettings.height}
              >
                <RechartsPieChart>
                  <RechartsTooltip
                    formatter={(value, name) => [
                      `${value.toLocaleString()} transactions`,
                      name,
                    ]}
                  />
                  <Pie
                    data={transactionCountByPaymentMethodData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedPieLabel}
                    outerRadius={85}
                    dataKey="value"
                  >
                    {transactionCountByPaymentMethodData.map((entry, index) => (
                      <Cell
                        key={`cell-count-method-${index}`}
                        fill={CHART_COLORS[(index + 2) % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <Typography sx={{ py: 5 }}>
                No transaction count by payment method.
              </Typography>
            )}
          </Item>
        </Grid>

        <Grid item xs={12} md={6} lg={5}>
          <Item>
            <Typography variant="h6" align="left" gutterBottom sx={{ pl: 1 }}>
              Revenue by Transaction Type ({activeButton})
            </Typography>
            {revenueByTransactionTypeData.length > 0 ? (
              <ResponsiveContainer
                width="100%"
                height={pieChartSettings.height}
              >
                <RechartsPieChart>
                  <RechartsTooltip
                    formatter={(value, name) => [
                      `ETB ${parseFloat(value).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`,
                      name,
                    ]}
                  />
                  <Pie
                    data={revenueByTransactionTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedPieLabel}
                    outerRadius={85}
                    dataKey="value"
                  >
                    {revenueByTransactionTypeData.map((entry, index) => (
                      <Cell
                        key={`cell-revenue-type-${index}`}
                        fill={CHART_COLORS[(index + 3) % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <Typography sx={{ py: 5 }}>
                No revenue data by transaction type.
              </Typography>
            )}
          </Item>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FinancialDashboard;
