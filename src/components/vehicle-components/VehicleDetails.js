// src/components/VehicleDetails.js
import React from "react";
import Typography from "@mui/material/Typography";
import { formatCamelCaseToReadableWords } from "../../config/helpers";

const VehicleDetails = ({ row }) => {
    const filteredVehicleData = Object.entries(row).filter(
        ([key]) => (
            key !== "vehicleImageKeys" && 
            key !== "adminDocumentKeys" && 
            key !== "images" &&
            key !== "imageLoading"
        )
    );

    return (
        <div>
            {filteredVehicleData.map(([key, value]) => (
                <Typography variant="body2" key={key}>
                    <strong>{formatCamelCaseToReadableWords(key)}:</strong> {value}
                </Typography>
            ))}
        </div>
    );
};

export default VehicleDetails;
