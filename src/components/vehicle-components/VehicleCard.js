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
import Dialog from '@mui/material/Dialog';
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useInView } from 'react-intersection-observer';
import { useNavigate } from "react-router-dom";

// Imported components
import VehicleImageSlider from "./VehicleImageSlider";
import VehicleStatus from "./VehicleStatus";
import VehicleDetails from "./VehicleDetails";

// Imported API
import { deleteVehicleById } from "../../api";

const VehicleCard = ({ row, index, handleClick, handleClose, toggleListing, anchorEl, selectedIndex, setAnchorEl }) => {
    const [showDetails, setShowDetails] = useState(false);
    const [open, setOpen] = useState(false);
    const [status, setStatus] = useState(`ID: ${row.id}`);
    const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });
    const navigate = useNavigate();

    const handleToggleDetails = () => {
        setShowDetails(!showDetails);
    };

    const handleModalOpen = () => {
        setOpen(true);
    };

    const handleModalClose = () => {
        setOpen(false);
        setStatus(`ID: ${row.id}`);
    };

    const handleDelete = async () => {
        try {
            // await deleteVehicleById(row.id); // Assuming vehicleId is available
            setStatus('Success');
            window.location.href = '/rent-a-car';
        } catch (error) {
            setStatus('Try again');
        }
    };

    return (
        <>
            <Dialog
                open={open}
                onClose={handleModalClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">{`Delete ${row.make} ${row.model} ${row.year}?`}</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        {status}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    {status === 'Success' ?
                        <Button onClick={handleModalClose} color="primary" autoFocus>
                            Done
                        </Button> :
                        status === 'Try again' ?
                            <>
                                <Button onClick={handleModalClose} color="primary">
                                    Close
                                </Button>
                                <Button onClick={handleDelete} color="primary" autoFocus>
                                    Try Again
                                </Button>
                            </> :
                            <>
                                <Button onClick={handleModalClose} color="primary">
                                    No
                                </Button>
                                <Button onClick={handleDelete} color="primary" autoFocus>
                                    Yes
                                </Button>
                            </>
                    }
                </DialogActions>
            </Dialog>
            <Card ref={ref} data-id={row?.id}>
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
                        {`${row.make} ${row.model} ${row.year}`}
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
                        onClick={handleModalOpen}
                    >
                        <DeleteIcon />
                    </IconButton>
                </CardActions>
                <CardContent>
                    {showDetails && <VehicleDetails row={row} />}
                </CardContent>
            </Card>
        </>
    );
};

export default VehicleCard;