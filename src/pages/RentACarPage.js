import React, { useState } from "react";
import { Button, IconButton, Typography, Menu, MenuItem } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardMedia from "@mui/material/CardMedia";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import AddIcon from "@mui/icons-material/Add";
import { useNavigate } from "react-router-dom";

const createData = (image, name, status, enabled = true) => ({
  image,
  name,
  status,
  enabled,
});

const initialRows = [
  createData(
    "https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    "Audi A3",
    "Pending"
  ),
  createData(
    "https://images.pexels.com/photos/38637/car-audi-auto-automotive-38637.jpeg",
    "BMW M3",
    "Approved",
    false
  ), // Set enabled to false
  createData(
    "https://images.pexels.com/photos/6692306/pexels-photo-6692306.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    "Mercedes Benz C Class",
    "Declined"
  ),
];

const RentACarPage = () => {
  const [rows, setRows] = useState(initialRows);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const navigate = useNavigate();

  const toggleListing = (index) => {
    const newRows = [...rows];
    newRows[index].enabled = !newRows[index].enabled;
    setRows(newRows);
  };

  const handleAddCar = () => {
    navigate("/add-car"); // Changed from history.push
  };

  const handleClick = (event, index) => {
    setAnchorEl(event.currentTarget);
    setSelectedIndex(index);
  };

  const handleClose = (status) => {
    const newRows = [...rows];
    newRows[selectedIndex].status = status;
    setRows(newRows);
    setAnchorEl(null);
  };

  const statusColors = {
    Pending: "#FFEB3B", // Yellow
    Approved: "#4CAF50", // Green
    Declined: "#F44336", // Red
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddCar}
          sx={{ marginBottom: "1em" }}
        >
          Add New Listing
        </Button>
      </Grid>
      {rows.map((row, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <Card>
            <CardMedia
              component="img"
              height="140"
              image={row.image}
              alt={row.name}
            />
            <CardContent>
              <Typography variant="h5" component="div">
                {row.name}
              </Typography>
              <Typography
                onClick={(event) => handleClick(event, index)}
                sx={{
                  cursor: "pointer",
                  bgcolor: statusColors[row.status],
                  color: "#ffffff",
                  display: "inline-block",
                  padding: "0.5em",
                  borderRadius: "0.25em",
                }}
              >
                {row.status}
              </Typography>
              <Menu
                id="simple-menu"
                anchorEl={anchorEl}
                keepMounted
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
              >
                {rows[selectedIndex]?.status !== "Approved" && (
                  <MenuItem onClick={() => handleClose("Approved")}>
                    Approve
                  </MenuItem>
                )}
                {rows[selectedIndex]?.status !== "Declined" && (
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
              <IconButton
                color="primary"
                onClick={() => {
                  /* Edit action */
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
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default RentACarPage;
