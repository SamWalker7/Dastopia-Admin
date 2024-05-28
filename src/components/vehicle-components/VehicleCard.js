import React, { useState } from "react";

// imported packages
import Card from "@mui/material/Card";
import CardMedia from "@mui/material/CardMedia";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import CardActions from "@mui/material/CardActions";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useInView } from 'react-intersection-observer';

// Imported components
import VehicleImageSlider from "./VehicleImageSlider";
import VehicleStatus from "./VehicleStatus";
import VehicleDetails from "./VehicleDetails";

const VehicleCard = ({ row, index, handleClick, handleClose, toggleListing, anchorEl, selectedIndex, setAnchorEl }) => {
    const [showDetails, setShowDetails] = useState(false);
    const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

    const handleToggleDetails = () => {
        setShowDetails(!showDetails);
    };

    return (
        <Card ref={ref}>
            {inView && (
                row.imageLoading ? (
                    <CardMedia
                        component="img"
                        height="140"
                        image="https://via.placeholder.com/300"
                        alt="Loading..."
                        loading="lazy"
                    />
                ) : (
                    Array.isArray(row?.images) && row?.images?.length > 0 ? (
                        <VehicleImageSlider images={row.images} />
                    ) : (
                        <CardMedia
                            component="img"
                            height="140"
                            image="https://via.placeholder.com/300"
                            alt={row.name}
                            loading="lazy"
                        />
                    )
                )
            )}
            <CardContent>
                <Typography variant="h5" component="div">
                    {`${row.make} ${row.model}`}
                </Typography>
                <VehicleStatus
                    status={row.status}
                    onClick={(event) => handleClick(event, index)}
                />
                <Menu
                    id="simple-menu"
                    anchorEl={anchorEl}
                    keepMounted
                    open={Boolean(anchorEl)}
                    onClose={() => setAnchorEl(null)}
                >
                    {row.status !== "Approved" && (
                        <MenuItem onClick={() => handleClose("Approved")}>
                            Approve
                        </MenuItem>
                    )}
                    {row.status !== "Declined" && (
                        <MenuItem onClick={() => handleClose("Declined")}>
                            Decline
                        </MenuItem>
                    )}
                </Menu>
            </CardContent>
            <CardActions>
                <Button
                    variant="contained"
                    color={row.enabled ? "secondary" : "success"}
                    onClick={() => toggleListing(index)}
                >
                    {row.enabled ? "Disable" : "Enable"} Listing
                </Button>
                <IconButton color="primary" onClick={handleToggleDetails}>
                    <VisibilityIcon />
                </IconButton>
                <IconButton
                    color="black"
                    onClick={() => {
                        window.location.href = `/edit-vehicle?id=${row.id}`;
                    }}
                >
                    <EditIcon />
                </IconButton>
                <IconButton
                    color="error"
                    onClick={() => {
                        /* Delete action */
                    }}
                >
                    <DeleteIcon />
                </IconButton>
            </CardActions>
            <CardContent>
                {showDetails && <VehicleDetails row={row} />}
            </CardContent>
        </Card>
    );
};

export default VehicleCard;