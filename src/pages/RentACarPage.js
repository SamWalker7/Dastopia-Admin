import React, { useState, useEffect } from "react";
import { Button, IconButton, Typography, Menu, MenuItem, CircularProgress } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardMedia from "@mui/material/CardMedia";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import AddIcon from "@mui/icons-material/Add";
import { useNavigate } from "react-router-dom";
import { getAllVehicles, getDownloadUrl } from "../api";
import Slider from 'react-slick';

// const initialRows = [
//   createData(
//     "https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
//     "Audi A3",
//     "Pending"
//   ),
//   createData(
//     "https://images.pexels.com/photos/38637/car-audi-auto-automotive-38637.jpeg",
//     "BMW M3",
//     "Approved",
//     false
//   ), // Set enabled to false
//   createData(
//     "https://images.pexels.com/photos/6692306/pexels-photo-6692306.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
//     "Mercedes Benz C Class",
//     "Declined"
//   ),
// ];

const RentACarPage = () => {
  const [rows, setRows] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    fetchVehicles();
  }, [])

  const createData = (image, name, status, enabled = true) => ({
    image,
    name,
    status,
    enabled,
  });

  const fetchVehicles = async () => {
    const { body } = await getAllVehicles();
    let data = [];
    for (const vehicle of body) {
      let urls = []
      console.log('count1: ')
      if (vehicle?.vehicleImageKeys?.length > 0) {
        console.log('count2: ' + vehicle?.vehicleImageKeys)
        for (const image of vehicle?.vehicleImageKeys) {
          const url = await getDownloadUrl(image.key);
          // console.log('url: ' + url.body);
          if(url.body) {
            urls.push(url.body);
          } else {
            urls.push("https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1");
          }
        }
      }
      data.push({ ...vehicle, 'images': urls });
    }

    const display = data.map((vehicle) => ({
      name: vehicle.make + ' ' + vehicle.model,
      status: vehicle?.isEnabled ? 'Approved' : vehicle?.isEnabled === false ? 'Declined' : 'Pending',
      image: vehicle?.images.length > 0 ? vehicle.images
        : "https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
      // image: 'https://dastopia-cars.s3.us-east-1.amazonaws.com/356bdbe7-d579-4011-acd2-30d51c78efef/images/image-0-811?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIA5FTZBAD2QCVURHHH%2F20240517%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20240517T064311Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEGcaCXVzLWVhc3QtMSJHMEUCICK6NdNAj%2FSq1bOwUErvDcpiBH6mz224Lb%2FqY03H%2FOihAiEAv1ar4%2F3w2aLDwiKFvw%2Fq7uHXPL19XkH5y8c7jalwEogq8wII0P%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARAAGgw5MDU0MTgxNzg4MDUiDP9KwNQjNtXa6M%2F4XSrHAvq077QFmcu%2B69EOm38Amoi6Yuaax5WwBW%2FkQxbhZx5IP1rzVrtfqRTMruYZr8kFFRwbr7UPC89TrfhlSzeDVznqGvjChjkM147TtLdKk8xzYGZRtp7b4U%2BcYopprTIUG7kCXa9eH4vhXExU6iO1Ap8cM8o8jXsHTnMFZXApV%2BENKbq1E%2BB6txdiHHS6wb4n47013aa4ftn%2BUTzPmt0U4SnsE795Pr5WwME%2F%2Bi7lCUTyn4haReqqP6kh6C4e4bwDgJyttieFb1Hr%2Fk%2BnTmh5WjCyB17dzUJdBQcff87AGkxpNEbQv4l5M4kWNJkDX%2FMbFCf5FIqlnmFF%2FYt5TBND3tMPGutmoEx1SKfmFsNTn7zw%2B0EKdvfVoSKklVfwINITKGBLfa8gIBOFqpswupgst7YqyYXjlRMLZycKt6kmLs4tTbsm%2BtBRWDD%2B%2BJuyBjqeAYsZm3Fzwl07UmJ%2FCID%2BJa1oVR2Br9oAUyF7jsWbB8cbLeKv1f8yLXr4chtfMg5GOfo6BxCvWIpHgFwjOdGsONZh91E7hjoFxxQnW5zf1WefsFSAkP03YXZVqSZq3TVyGK4Kncujp8dnGfYbgGDCpdL5KHYMBy5szmUDpeZF40ISR%2FYH3UvpaHWVbAopQysumQmUWFC8sCmruW33F0Tw&X-Amz-Signature=c0d0ac68439c1e1f639976729df8e297b58c0da4f7c0839d7c56448f1802deb5&X-Amz-SignedHeaders=host&x-id=GetObject',
      enabled: true
    }));
    setRows(display);
    setIsLoading(false);
  }

  const statusColors = {
    Pending: "#FFEB3B", // Yellow
    Approved: "#4CAF50", // Green
    Declined: "#F44336", // Red
  };

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1
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
      {isLoading ? <CircularProgress /> :
        <>
          {rows.map((row, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card>
                {Array.isArray(row?.image) && row?.image?.length > 0 ?
                  <Slider {...settings}>
                    {row?.image?.map((url, index) => (
                      <div key={index}>
                        <CardMedia
                          component="img"
                          height="300"
                          image={url}
                          alt={`Vehicle Image ${index}`}
                        />
                      </div>
                    ))}
                  </Slider>
                  :
                  <CardMedia
                    component="img"
                    height="140"
                    image={row.image}
                    alt={row.name}
                  />
                }
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
        </>
      }
    </Grid>
  );
};

export default RentACarPage;
