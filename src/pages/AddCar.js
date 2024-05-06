import React, { useState, useEffect } from "react";
import {
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tab,
  Tabs,
  Box,
  Typography,
  Grid,
  Card,
  CardActionArea,
  IconButton,
  CardMedia,
  FormHelperText,
  CircularProgress
} from "@mui/material";
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import { getMakes, getModelByMake, addVehicle } from "../api";
import carData from '../api/cars.json';
// import { getList } from 'list-of-cars';
// import Papa from 'papaparse';


const AddCar = () => {
  const years = Array.from({ length: new Date().getFullYear() - 2001 + 1 }, (_, i) => 2001 + i);

  const [tab, setTab] = useState(0);
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [modelList, setModelList] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedMake, setSelectedMake] = useState("");
  const [makeList, setMakeList] = useState([]);
  const [yearRange, setYearRange] = useState(years);
  const [isFileUploading, setIsFileUploading] = useState(false);
  const [formValues, setFormValues] = useState({
    city: '',
    category: '',
    make: '',
    model: '',
    year: '',
    vehicleNumber: '',
    doors: '',
    fuelType: '',
    seats: '',
    color: '',
    transmission: ''
  });

  const cities = ['Addis Ababa', 'Awassa', 'Dire Dewa', 'Bahir Dar']

  useEffect(() => {
    // getList().then(res => console.log('res: ', res))
    setMakeList(carData.map(make => make.make_display));
  }, []);


  const handleNext = () => {
    if (tab < 2) {
      setTab(tab + 1);
    } else {
      // Navigate to next page or perform submission
    }
  };

  const handleImageChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      // setVehicleImage(event.target.files[0]);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    console.log(name, value);
    if (name === 'year') {
      fetchModels(formValues.make, value);
    }
    setFormValues({ ...formValues, [name]: value });
  };

  const fetchModels = async (make, year) => {
    const url = 'https://www.carqueryapi.com/api/0.3/?callback=?&cmd=getModels&make=toyota&year=2021'
    const headers = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'PostmanRuntime/7.38.0'
      }
    }

    try {
      const data = await fetch(url, headers)

      const items = await data.text()

      console.log(JSON.parse(items.slice(2, -2)))
    } catch (err) {
      console.log(err)
    }
  }

  const submitForm = async () => {
    const formData = {
      "make": "Toyota",
      "model": "Camry",
      "gas_type": "Gasoline",
      "transmission": "Manual",
      "id": "2",
      "year": "2001"
    }
    const response = await addVehicle(formData);
    console.log(response);
    // window.location.href = "/rent-a-car";
  }


  return (
    <Box sx={{ width: "100%" }}>
      <Tabs value={tab} onChange={(event, newValue) => setTab(newValue)}>
        <Tab label="Fill Car Information" />
        <Tab label="Upload Car Documents" />
        <Tab label="Finalize" />
      </Tabs>
      {tab === 0 && (
        <Box component="form" noValidate autoComplete="off" sx={{ mt: 2 }}>
          {/* {isFileUploading ? <CircularProgress size={40}
            thickness={4} variant="determinate" value={100} /> :
            <FormControl fullWidth margin="normal">
              <Button variant="contained" component="label">
                Upload CSV file
                <input
                  type="file"
                  name="upload"
                  accept=".csv"
                  style={{ display: 'none', marginTop: '2em' }}
                  onChange={handleImport}
                />
              </Button>
            </FormControl>
          } */}
          <FormControl fullWidth margin="normal">
            <Button variant="contained" component="label">
              Upload Vehicle Image
              <input type="file" required hidden onChange={handleImageChange} />
            </Button>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel id="city-select-label">City</InputLabel>
            <Select
              labelId="city-select-label"
              value={formValues.city}
              name="city"
              label="City"
              onChange={handleChange}
            >
              {cities.map((cityName) => (
                <MenuItem key={cityName} value={cityName}>
                  {cityName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel id="make-select-label">Make</InputLabel>
            <Select
              labelId="make-select-label"
              value={formValues.make}
              name="make"
              label="Make"
              onChange={handleChange}
            >
              {makeList?.map((make) => (
                <MenuItem key={make} value={make}>
                  {make}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel id="year-select-label">Year</InputLabel>
            <Select
              labelId="year-select-label"
              value={formValues.year}
              label="Year"
              name="year"
              onChange={handleChange}
              disabled={!formValues.make || formValues.make === ''}
            >
              {years.map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
            {(!formValues.make || formValues.make === '') && (
              <FormHelperText>Please select vehicle make</FormHelperText>
            )}
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel id="model-select-label">Model</InputLabel>
            <Select
              labelId="model-select-label"
              value={selectedModel}
              label="Model"
              name="model"
              onChange={handleChange}
              disabled={!formValues.make || formValues.make === '' || formValues.year === '' || !formValues.year}
            >
              {modelList?.map((model) => (
                <MenuItem key={model} value={model}>
                  {model}
                </MenuItem>
              ))}
            </Select>
            {(!formValues.make || formValues.make === '' || formValues.year === '' || !formValues.year) && (
              <FormHelperText>Please select vehicle make and year</FormHelperText>
            )}
          </FormControl>
          {/* <FormControl fullWidth margin="normal">
            <InputLabel id="category-select-label">Category</InputLabel>
            <Select
              labelId="category-select-label"
              value={category}
              label="Category"
              onChange={(event) => setCategory(event.target.value)}
            >
              {categories[city]?.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl> */}
          <FormControl fullWidth margin="normal">
            <InputLabel id="year-select-label">Year</InputLabel>
            <Select
              labelId="year-select-label"
              value={formValues.year}
              label="Year"
              name="year"
              onChange={handleChange}
            >
              {years.map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <TextField
              id="vehicleNumber-input"
              label="Vehicle Number"
              value={formValues.vehicleNumber}
              name="vehicleNumber"
              onChange={handleChange}
            />
          </FormControl>
          <FormControl fullWidth margin="normal">
            <TextField
              id="doors-input"
              label="Doors"
              name="doors"
              value={formValues.doors}
              onChange={handleChange}
            />
          </FormControl>
          <FormControl fullWidth margin="normal">
            <TextField
              id="fuelType-input"
              label="Fuel Type"
              name="fuelType"
              value={formValues.fuelType}
              onChange={handleChange}
            />
          </FormControl>
          <FormControl fullWidth margin="normal">
            <TextField
              id="seats-input"
              label="Seats"
              name="seats"
              value={formValues.seats}
              onChange={handleChange}
            />
          </FormControl>
          <FormControl fullWidth margin="normal">
            <TextField
              id="color-input"
              label="Color"
              name="color"
              value={formValues.color}
              onChange={handleChange}
            />
          </FormControl>
          <FormControl fullWidth margin="normal">
            <TextField
              id="transmission-input"
              label="Transmission"
              name="transmission"
              value={formValues.transmission}
              onChange={handleChange}
            />
          </FormControl>
          <Button onClick={submitForm} sx={{ mt: 2 }}>
            Next
          </Button>
        </Box>
      )}
      {tab === 1 && (
        <Box component="form" noValidate autoComplete="off" sx={{ mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Vehicle Images
          </Typography>
          <Typography variant="body2">
            Please upload images of all 4 sides (Front/Back/Left/Right)
          </Typography>
          <Grid container spacing={2} sx={{ mt: 2 }}>
            {['Front', 'Back', 'Left', 'Right'].map((side) => (
              <Grid item xs={6} sm={3} key={side}>
                <Card>
                  <CardActionArea>
                    <input
                      accept="image/*"
                      type="file"
                      id={`${side}-upload`}
                      style={{ display: 'none' }}
                      onChange={handleImageChange}
                    />
                    <label htmlFor={`${side}-upload`}>
                      <IconButton component="span">
                        <CameraAltIcon />
                      </IconButton>
                    </label>
                    <CardMedia
                      component="img"
                      height="140"
                      image="/static/images/cards/contemplative-reptile.jpg" // Replace with actual image
                      alt="Contemplative Reptile"
                    />
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
            License Plate
          </Typography>
          <Typography variant="body2">
            Front and Back License Plate
          </Typography>
          <Grid container spacing={2} sx={{ mt: 2 }}>
            {['Front', 'Back'].map((side) => (
              <Grid item xs={6} sm={6} key={side}>
                <Card>
                  <CardActionArea>
                    <input
                      accept="image/*"
                      type="file"
                      id={`license-${side}-upload`}
                      style={{ display: 'none' }}
                      onChange={handleImageChange}
                    />
                    <label htmlFor={`license-${side}-upload`}>
                      <IconButton component="span">
                        <CameraAltIcon />
                      </IconButton>
                    </label>
                    <CardMedia
                      component="img"
                      height="140"
                      image="/static/images/cards/contemplative-reptile.jpg" // Replace with actual image
                      alt="Contemplative Reptile"
                    />
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
            Registration Certificate
          </Typography>
          <Typography variant="body2">
            Original Copy of Vehicle Registration Certificate
          </Typography>
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12} sm={12}>
              <Card>
                <CardActionArea>
                  <input
                    accept="image/*"
                    type="file"
                    id="registration-upload"
                    style={{ display: 'none' }}
                    onChange={handleImageChange}
                  />
                  <label htmlFor="registration-upload">
                    <IconButton component="span">
                      <CameraAltIcon />
                    </IconButton>
                  </label>
                  <CardMedia
                    component="img"
                    height="140"
                    image="/static/images/cards/contemplative-reptile.jpg" // Replace with actual image
                    alt="Contemplative Reptile"
                  />
                </CardActionArea>
              </Card>
            </Grid>
          </Grid>

          <Button onClick={handleNext} sx={{ mt: 2 }}>
            Next
          </Button>
        </Box>
      )}
      {tab === 2 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Enable Listing
          </Typography>
          <Typography variant="body2">
            Click the button below to enable your car listing.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
            onClick={submitForm} >
            Enable Listing
          </Button>
        </Box>
      )}
      {/* Implement other tabs as needed */}
    </Box>
  );
};

export default AddCar;
