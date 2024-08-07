import React, { useState, useEffect } from "react";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import AddIcon from "@mui/icons-material/Add";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import { useNavigate } from "react-router-dom";
import { getAllVehicles, getDownloadUrl } from "../api";
import VehicleCard from "../components/vehicle-components/VehicleCard";

import makesData from "../api/makes.json";
import modelData from "../api/models.json"; // Import the model data
import "./page-styles.css";
import { useDispatch, useSelector } from "react-redux";
import { fetchImages, fetchVehicles } from "../store/slices/vehicleSlice";


const RentACarPage = () => {

  const dispatch = useDispatch();

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    make: "",
    model: "",
    year: "",
    search: "",
  });
  const [modelList, setModelList] = useState([]); // State for model list
  const navigate = useNavigate();

  const toggleListing = (index) => {
    const newRows = [...rows];
    newRows[index].enabled = !newRows[index].enabled;
    // setRows(newRows);
  };

  const handleAddCar = () => {
    navigate("/add-car");
  };

  const handleClick = (event, index) => {
    setAnchorEl(event.currentTarget);
    setSelectedIndex(index);
  };

  const handleClose = (status) => {
    const newRows = [...rows];
    newRows[selectedIndex].status = status;
    // setRows(newRows);
    setAnchorEl(null);
  };

  const rows = useSelector((state) => state.vehicles.vehicles)
  const loading = useSelector((state) => state.vehicles.loading)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const response = await dispatch(fetchVehicles())
    if (fetchVehicles.fulfilled.match(response)) {
      const vehicles = response.payload;
      vehicles.map(async (vehicle) => {
        await dispatch(fetchImages(vehicle))
      })
    }
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    if (name === "make") {
      let newModel = modelData.filter((model) => {
        if (Object.keys(model)[0] === value) {
          console.log("model: ", ...Object.values(model));
          return Object.values(model);
        } else return false;
      });
      newModel = [...newModel[0][value]];
      setModelList(newModel);
      setFilters({ ...filters, make: value, model: "" });
    } else {
      setFilters({ ...filters, [name]: value });
    }
  };

  const filteredRows = rows.filter((row) => {
    return (
      (filters.make === "" || row.make === filters.make) &&
      (filters.model === "" || row.model === filters.model) &&
      (filters.year === "" || row.year === filters.year) &&
      (filters.search === "" ||
        (row.model &&
          row.model.toLowerCase().includes(filters.search.toLowerCase())))
    );
  });

  const getModelOptions = () => {
    return modelList.map((model) => (
      <MenuItem key={model} value={model}>
        {model}
      </MenuItem>
    ));
  };


  if (rows.length < 1) {
    loadData();
  }

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

      <Grid item xs={12}>
        <Grid container spacing={2}>
          <Grid item xs={3}>
            <TextField
              select
              label="Make"
              name="make"
              value={filters.make}
              onChange={handleFilterChange}
              fullWidth
            >
              <MenuItem value="">All</MenuItem>
              {makesData.Makes.map((make) => (
                <MenuItem key={make.make_id} value={make.make_display}>
                  {make.make_display}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={3}>
            <TextField
              select
              label="Model"
              name="model"
              value={filters.model}
              onChange={handleFilterChange}
              fullWidth
              disabled={!filters.make}
            >
              <MenuItem value="">All</MenuItem>
              {getModelOptions()}
            </TextField>
          </Grid>
          <Grid item xs={3}>
            <TextField
              label="Year"
              name="year"
              value={filters.year}
              onChange={handleFilterChange}
              fullWidth
            />
          </Grid>
          <Grid item xs={3}>
            <TextField
              label="Search by model"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              fullWidth
            />
          </Grid>
        </Grid>
      </Grid>
      {isLoading ? (
        <CircularProgress />
      ) : (
        <>
          {filteredRows.length > 0 ? (
            filteredRows.map((row, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <VehicleCard
                  row={row}
                  index={index}
                  handleClick={handleClick}
                  handleClose={handleClose}
                  toggleListing={toggleListing}
                  anchorEl={anchorEl}
                  selectedIndex={selectedIndex}
                  setAnchorEl={setAnchorEl}
                />
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <p>No Data Found</p>
            </Grid>
          )}
        </>
      )}
      {loading ? (
        <CircularProgress />
      ) : (
        rows.map((row, index) => {
          return (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <VehicleCard
                row={row}
                index={index}
                handleClick={handleClick}
                handleClose={handleClose}
                toggleListing={toggleListing}
                anchorEl={anchorEl}
                selectedIndex={selectedIndex}
                setAnchorEl={setAnchorEl}
              />
            </Grid>
          )
        })
      )}
    </Grid>
  );
};

export default RentACarPage;
