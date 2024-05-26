// src/components/VehicleStatus.js
import React from "react";
import Typography from "@mui/material/Typography";

const statusColors = {
    Pending: "#FFEB3B", // Yellow
    Approved: "#4CAF50", // Green
    Declined: "#F44336", // Red
};

const VehicleStatus = ({ status, onClick }) => (
    <Typography
        onClick={onClick}
        sx={{
            cursor: "pointer",
            bgcolor: statusColors[status],
            color: "#ffffff",
            display: "inline-block",
            padding: "0.5em",
            borderRadius: "0.25em",
        }}
    >
        {status}
    </Typography>
);

export default VehicleStatus;
