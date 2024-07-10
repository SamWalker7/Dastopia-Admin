import React, { useState, useEffect } from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import IconButton from "@mui/material/IconButton";
import CardMedia from "@mui/material/CardMedia";
import FormHelperText from "@mui/material/FormHelperText";
import CircularProgress from "@mui/material/CircularProgress";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import DeleteIcon from "@mui/icons-material/Delete";
import UploadIcon from "@mui/icons-material/Upload";
import {
  getVehicleById,
  getDownloadUrl,
  updateVehicle,
  getPreSignedURL,
  getPreSignedURLAdmin,
  uplaodVehicleImagesToS3,
} from "../api";
import {
  cities,
  fuelType,
  categories,
  carColors,
  transmissionType,
} from "../config/constants";
import { resizeImage } from "../config/helpers";
import carModel from "../api/models.json";
import carMake from "../api/makes.json";

const EditVehicle = ({ match }) => {
  const queryParams = new URLSearchParams(window.location.search);
  const vehicleId = queryParams.get("id");
  const years = Array.from(
    { length: new Date().getFullYear() - 2001 + 1 },
    (_, i) => 2001 + i
  );
  const [tab, setTab] = useState(0);
  const [modelList, setModelList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [makeList, setMakeList] = useState([]);
  const [documents, setDocuments] = useState({
    front: "",
    back: "",
    left: "",
    right: "",
    plateNumber: "",
    registration: "",
    frontDriversLicense: "",
    backDriversLicense: "",
    powerOfAttorney: "",
    insurance: "",
  });
  const [images, setImages] = useState([]);
  const [formValues, setFormValues] = useState({
    city: "",
    category: "",
    make: "",
    model: "",
    year: "",
    vehicleNumber: "",
    doors: "",
    fuelType: "",
    seats: "",
    color: "",
    transmission: "",
    modelSpecification: "",
    id: vehicleId,
    isPostedByOwner: "",
    ownerId: "",
    ownerGivenName: "",
    ownerMiddleName: "",
    ownerSurName: "",
    ownerPhone: "",
    ownerEmail: "",
    representativeFirstName: "",
    representativeLastName: "",
    representativePhone: "",
    representativeEmail: "",
    vehicleImageKeys: [],
    adminDocumentKeys: [],
  });
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isOwner, setIsOwner] = useState(null);

  const handleOwnerChange = (event) => {
    setIsOwner(event.target.value === "yes");
  };

  useEffect(() => {
    fetchVehicleDetails();
    setMakeList(carMake?.Makes.map((make) => make.make_display));
  }, []);

  const fetchVehicleDetails = async () => {
    setIsLoading(true);
    const { body } = await getVehicleById(vehicleId);

    const vehicleData = {
      ...body,
      // images: [], // Initially, set images to an empty array
      // imageLoading: true // Flag to indicate images are loading
    };

    const newDocuments = { ...documents };
    if (body?.adminDocumentKeys?.length > 0) {
      body.adminDocumentKeys.forEach(({ key, url }) => {
        const documentType = key.split("/").pop().split("-")[0].trim(); // Extract documentType from key
        console.log("documentType: ", documentType);
        if (newDocuments.hasOwnProperty(documentType)) {
          newDocuments[documentType] = url;
        }
      });
    }
    console.log("newDocuments: ", newDocuments);
    setFormValues(vehicleData);
    setIsLoading(false);

    // Fetch images after setting vehicle data
    if (body?.vehicleImageKeys?.length > 0) {
      let urls = [];
      for (const image of body.vehicleImageKeys) {
        const url = await getDownloadUrl(image.key);
        urls.push(url.body || "https://via.placeholder.com/300");
      }
      setImages(urls);
      // vehicleData.images = urls;
      // vehicleData.imageLoading = false; // Set image loading flag to false
      setFormValues({ ...vehicleData }); // Update state with new images
    }
    setDocuments(newDocuments);
  };

  console.log(formValues);

  const handleNext = () => {
    if (tab < 2) {
      setTab(tab + 1);
    }
  };

  const handleImageChange = async (e) => {
    if (e.target.files.length > 25) {
      alert("You can only upload up to 25 images.");
      return;
    }
    setIsUploadingImages(true);
    const files = Array.from(e.target.files);
    const processedImages = [];

    for (const file of files) {
      const resizedImage = await resizeImage(file);
      processedImages.push(resizedImage);
    }
    setImages([...images, ...processedImages]);
    setIsUploadingImages(false);
  };

  const handleImageDelete = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleDocumentImageChange = async (e, type) => {
    setIsUploadingImages(true);
    const files = Array.from(e.target.files);

    for (const file of files) {
      const resizedImage = await resizeImage(file);
      setDocuments((prevImages) => ({ ...prevImages, [type]: resizedImage }));
    }
    setIsUploadingImages(false);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name === "make") {
      let newModel = carModel.filter((model) => {
        if (Object.keys(model)[0] === value) {
          return Object.values(model);
        }
        return false;
      });
      newModel = [...newModel[0][value]];
      setModelList(newModel);
    }
    setFormValues({ ...formValues, [name]: value });
  };

  const submitForm = async () => {
    setIsUploadingImages(true);
    await handleUpload();
    console.log(formValues);
    await updateVehicle(formValues);
    setIsUploadingImages(false);
    window.location.href = "/rent-a-car";
  };

  const uploadImageToS3Admin = async (documentType, image) => {
    try {
      const extension = image.name.split(".").pop().toLowerCase();
      if (!extension) {
        throw new Error("Invalid file extension");
      }
      const res = await getPreSignedURLAdmin(
        formValues.id,
        `image/${extension}`,
        `${documentType}`
      );
      const { url, key } = res.body;
      await uplaodVehicleImagesToS3(url, image);
      return { key, url };
    } catch (error) {
      console.error(`Failed to upload admin document ${documentType}:`, error);
      throw error;
    }
  };

  const uploadImageToS3 = async (image, index) => {
    try {
      const extension = image.name.split(".").pop().toLowerCase();
      if (!extension) {
        throw new Error("Invalid file extension");
      }
      const res = await getPreSignedURL(
        formValues.id,
        `image/${extension}`,
        `image-${index}`
      );
      const { url, key } = res.body;
      await uplaodVehicleImagesToS3(url, image);
      return { key, url };
    } catch (error) {
      console.error(`Failed to upload image ${index}:`, error);
      throw error;
    }
  };

  const handleUpload = async () => {
    const errors = [];
    const imageKeys = [];
    const adminKeys = [];

    try {
      for (const [documentType, image] of Object.entries(documents)) {
        if (image) {
          try {
            const { key, url } = await uploadImageToS3Admin(
              documentType,
              image
            );
            adminKeys.push({ key, url });
          } catch (error) {
            errors.push(`Error uploading ${documentType}: ${error.message}`);
          }
        }
      }

      for (const [index, image] of images.entries()) {
        try {
          const { key, url } = await uploadImageToS3(image, index);
          imageKeys.push({ key, url });
        } catch (error) {
          errors.push(
            `Error uploading image at index ${index}: ${error.message}`
          );
        }
      }

      if (errors.length > 0) {
        console.error("Upload errors:", errors);
        return false;
      }

      setFormValues({
        ...formValues,
        vehicleImageKeys: imageKeys,
        adminDocumentKeys: adminKeys,
      });
    } catch (error) {
      console.error("Unexpected error:", error);
      return false;
    }
    return true;
  };

  const thirdStepperFormValidation = () =>
    Object.values(documents).some((field) => field === "") ||
    firstStepperFormValidation();

  const secondStepperFormValidation = () =>
    Object.entries(documents).some(
      ([key, field]) => key !== "powerOfAttorney" && field === ""
    );

  const firstStepperFormValidation = () =>
    !formValues.model ||
    !formValues.make ||
    !formValues.year ||
    !formValues.category ||
    !formValues.doors ||
    !formValues.fuelType ||
    !formValues.color ||
    !formValues.transmission ||
    !formValues.city ||
    images.length < 1;

  return (
    <Box sx={{ width: "100%" }}>
      <Tabs value={tab} onChange={(event, newValue) => setTab(newValue)}>
        <Tab label="Fill Car Information" />
        <Tab label="Upload Car Documents" />
        <Tab label="Finalize" />
      </Tabs>
      {isLoading ? (
        <CircularProgress />
      ) : (
        <>
          {tab === 0 && (
            <Box component="form" noValidate autoComplete="off" sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                {images.length > 0 &&
                  images.map((image, index) => (
                    <Grid item xs={4} key={index}>
                      <div style={{ position: "relative" }}>
                        <CardMedia
                          component="img"
                          height="140"
                          image={image}
                          alt={index}
                          loading="lazy"
                        />
                        {/* <img
                                                src={image}
                                                alt={`Vehicle ${index + 1}`}
                                                style={{ width: '100%', height: 'auto' }}
                                            /> */}
                        <IconButton
                          style={{
                            position: "absolute",
                            top: "-5%",
                            right: "-5%",
                            background: "white",
                            color: "#0052cc",
                          }}
                          onClick={() => handleImageDelete(index)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </div>
                    </Grid>
                  ))}
              </Grid>
              <FormControl fullWidth margin="normal">
                <Button variant="contained" component="label">
                  <UploadIcon />
                  Upload Vehicle Images (Up to 25 Images)
                  <input
                    type="file"
                    required
                    hidden
                    multiple
                    accept=".png, .jpg, .jpeg"
                    onChange={handleImageChange}
                  />
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
                  required
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
                  required
                >
                  {makeList?.map((make) => (
                    <MenuItem key={make} value={make}>
                      {make}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth margin="normal">
                <InputLabel id="model-select-label">Model</InputLabel>
                <Select
                  labelId="model-select-label"
                  value={formValues.model}
                  label="Model"
                  name="model"
                  onChange={handleChange}
                  disabled={!formValues.make || formValues.make === ""}
                >
                  {modelList?.length > 0 &&
                    modelList?.map((model) => (
                      <MenuItem key={model} value={model}>
                        {model}
                      </MenuItem>
                    ))}
                </Select>
                {(!formValues.make || formValues.make === "") && (
                  <FormHelperText
                    className="helperText"
                    style={{ color: "#1976d2" }}
                  >
                    Please select vehicle make and year
                  </FormHelperText>
                )}
              </FormControl>
              <FormControl fullWidth margin="normal">
                <TextField
                  id="model-spec-input"
                  label="Model Specification (Optional)"
                  placeholder="Optional"
                  name="modelSpecification"
                  value={formValues.modelSpecification}
                  onChange={handleChange}
                />
              </FormControl>
              <FormControl fullWidth margin="normal">
                <InputLabel id="year-select-label">Year</InputLabel>
                <Select
                  labelId="year-select-label"
                  value={formValues.year}
                  label="Year"
                  name="year"
                  onChange={handleChange}
                  required
                >
                  {years.map((year) => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
                {(!formValues.make || formValues.make === "") && (
                  <FormHelperText>Please select vehicle make</FormHelperText>
                )}
              </FormControl>
              <FormControl fullWidth margin="normal">
                <InputLabel id="category-select-label">Category</InputLabel>
                <Select
                  labelId="category-select-label"
                  value={formValues.category}
                  name="category"
                  label="Category"
                  onChange={handleChange}
                >
                  {categories?.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
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
                <InputLabel id="category-select-label">
                  Fuel Type / Engine
                </InputLabel>
                <Select
                  labelId="fuel-type-select-label"
                  value={formValues.fuelType}
                  label="Fuel Type / Enginer"
                  name="fuelType"
                  onChange={handleChange}
                >
                  {fuelType?.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth margin="normal">
                <TextField
                  id="seats-input"
                  label="Number of Seats"
                  name="seats"
                  value={formValues.seats}
                  onChange={handleChange}
                />
              </FormControl>
              <FormControl fullWidth margin="normal">
                <InputLabel id="category-select-label">Color</InputLabel>
                <Select
                  labelId="color-select-label"
                  value={formValues.color}
                  label="Color"
                  name="color"
                  onChange={handleChange}
                >
                  {carColors.sort().map((color) => (
                    <MenuItem key={color} value={color}>
                      {color}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth margin="normal">
                <InputLabel id="category-select-label">Transmission</InputLabel>
                <Select
                  labelId="transmission-select-label"
                  value={formValues.transmission}
                  label="Transmission"
                  name="transmission"
                  onChange={handleChange}
                >
                  {transmissionType.sort().map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="contained"
                onClick={handleNext}
                sx={{ mt: 2 }}
                disabled={firstStepperFormValidation()}
              >
                Next
              </Button>
              {firstStepperFormValidation() && (
                <Typography style={{ color: "red" }} variant="subtitle1">
                  Please fill in the required fields and upload at least one
                  picture
                </Typography>
              )}
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
                {[
                  "front",
                  "back",
                  "left",
                  "right",
                  "plateNumber",
                  "registration",
                ].map((side) => (
                  <Grid item xs={6} sm={3} key={side}>
                    <Card>
                      <CardActionArea>
                        <input
                          accept="image/png, image/jpeg, image/jpg"
                          type="file"
                          id={`${side}-upload`}
                          style={{ display: "none" }}
                          onChange={(event) =>
                            handleDocumentImageChange(event, side)
                          }
                        />
                        <label htmlFor={`${side}-upload`}>
                          <IconButton component="span">
                            <CameraAltIcon />
                          </IconButton>
                        </label>
                        {documents[side] ? (
                          <>
                            <CardMedia
                              component="img"
                              height="140"
                              image={documents[side]}
                              alt={`${side} of the vehicle`}
                            />
                          </>
                        ) : (
                          <CardMedia
                            component="img"
                            height="140"
                            image="/static/images/cards/placeholder.jpg"
                            alt="Upload an image"
                          />
                        )}
                      </CardActionArea>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
                Vehicle Tag/Plate Number
              </Typography>
              <Typography variant="body2">
                Vehicle Tag or Plate Number
              </Typography>
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12} sm={12}>
                  <Card>
                    <CardActionArea>
                      <input
                        accept="image/png, image/jpeg"
                        type="file"
                        id="plateNumber-upload"
                        style={{ display: "none" }}
                        onChange={(event) =>
                          handleDocumentImageChange(event, "plateNumber")
                        }
                      />
                      <label htmlFor="plateNumber-upload">
                        <IconButton component="span">
                          <CameraAltIcon />
                        </IconButton>
                      </label>
                      {documents["plateNumber"] ? (
                        <CardMedia
                          component="img"
                          height="140"
                          image={documents["plateNumber"]}
                          alt={"Plate Number of the vehicle"}
                        />
                      ) : (
                        <CardMedia
                          component="img"
                          height="140"
                          alt="Upload an image"
                          image=""
                        />
                      )}
                    </CardActionArea>
                  </Card>
                </Grid>
              </Grid>
              <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
                Driver's License
              </Typography>
              <Typography variant="body2">
                Front and Back Driver's License
              </Typography>
              <Grid container spacing={2} sx={{ mt: 2 }}>
                {["frontDriversLicense", "backDriversLicense"].map((side) => (
                  <Grid item xs={6} sm={6} key={side}>
                    <Card>
                      <CardActionArea>
                        <input
                          accept="image/png, image/jpeg"
                          type="file"
                          id={`${side}-upload`}
                          style={{ display: "none" }}
                          onChange={(event) =>
                            handleDocumentImageChange(event, side)
                          }
                        />
                        <label htmlFor={`${side}-upload`}>
                          <IconButton component="span">
                            <CameraAltIcon />
                          </IconButton>
                        </label>
                        {documents[side] ? (
                          <CardMedia
                            component="img"
                            height="140"
                            image={documents[side]}
                            alt={`${side}`}
                          />
                        ) : (
                          <CardMedia
                            component="img"
                            height="140"
                            alt="Upload an image"
                            image=""
                          />
                        )}
                      </CardActionArea>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
                Insurance Card
              </Typography>
              <Typography variant="body2">Insurance Card</Typography>
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12} sm={12}>
                  <Card>
                    <CardActionArea>
                      <input
                        accept="image/png, image/jpeg"
                        type="file"
                        id="insurance-upload"
                        style={{ display: "none" }}
                        onChange={(event) =>
                          handleDocumentImageChange(event, "insurance")
                        }
                      />
                      <label htmlFor="insurance-upload">
                        <IconButton component="span">
                          <CameraAltIcon />
                        </IconButton>
                      </label>
                      {documents["insurance"] ? (
                        <CardMedia
                          component="img"
                          height="140"
                          image={documents["insurance"]}
                          alt={"insurance of the vehicle"}
                        />
                      ) : (
                        <CardMedia
                          component="img"
                          height="140"
                          alt="Upload an image"
                          image=""
                        />
                      )}
                    </CardActionArea>
                  </Card>
                </Grid>
              </Grid>
              <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
                Libre / Registration Certificate
              </Typography>
              <Typography variant="body2">
                Original Copy of Vehicle Registration Certificate
              </Typography>
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12} sm={12}>
                  <Card>
                    <CardActionArea>
                      <input
                        accept="image/png, image/jpeg"
                        type="file"
                        id="registration-upload"
                        style={{ display: "none" }}
                        onChange={(event) =>
                          handleDocumentImageChange(event, "registration")
                        }
                      />
                      <label htmlFor="registration-upload">
                        <IconButton component="span">
                          <CameraAltIcon />
                        </IconButton>
                      </label>
                      {documents["registration"] ? (
                        <CardMedia
                          component="img"
                          height="140"
                          image={documents["registration"]}
                          alt={"registration of the vehicle"}
                        />
                      ) : (
                        <CardMedia
                          component="img"
                          height="140"
                          alt="Upload an image"
                          image=""
                        />
                      )}
                    </CardActionArea>
                  </Card>
                </Grid>
              </Grid>
              <Button
                variant="contained"
                onClick={handleNext}
                sx={{ mt: 2 }}
                disabled={secondStepperFormValidation()}
              >
                Next
              </Button>
              {secondStepperFormValidation() && (
                <Typography style={{ color: "red" }} variant="subtitle1">
                  Please upload all documents
                </Typography>
              )}
            </Box>
          )}
          {tab === 2 && (
            <Box sx={{ p: 3 }}>
              {isUploadingImages ? (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    margin: "auto",
                  }}
                >
                  <CircularProgress size="10%" />
                </Box>
              ) : (
                <>
                  <div>
                    <h2>Are you the owner of the car?</h2>
                    <form>
                      <label>
                        <input
                          type="radio"
                          name="ownerStatus"
                          value="yes"
                          onChange={handleOwnerChange}
                        />{" "}
                        Yes
                      </label>
                      <label>
                        <input
                          type="radio"
                          name="ownerStatus"
                          value="no"
                          onChange={handleOwnerChange}
                        />{" "}
                        No
                      </label>
                    </form>
                  </div>
                  {isOwner !== null ? (
                    isOwner ? (
                      <div>
                        <h2>Owner Information Form</h2>
                        <form>
                          <TextField
                            required
                            id="ownerFirstName"
                            name="ownerFirstName"
                            label="Owner First Name"
                            value={formValues.ownerGivenName}
                            onChange={handleChange}
                            style={{
                              marginRight: "30px",
                            }}
                          />

                          <TextField
                            required
                            id="ownerLastName"
                            name="ownerLastName"
                            label="Owner Last Name"
                            value={formValues.ownerSurName}
                            onChange={handleChange}
                            style={{
                              marginRight: "30px",
                            }}
                          />

                          <TextField
                            required
                            id="ownerPhone"
                            name="ownerPhone"
                            label="Owner Phone"
                            value={formValues.ownerPhone}
                            onChange={handleChange}
                            style={{
                              marginRight: "30px",
                            }}
                          />

                          <TextField
                            required
                            id="ownerEmail"
                            name="ownerEmail"
                            label="Owner Email"
                            value={formValues.ownerEmail}
                            onChange={handleChange}
                            style={{
                              marginRight: "30px",
                            }}
                          />
                        </form>{" "}
                        <Button
                          variant="contained"
                          color="primary"
                          sx={{ mt: 2 }}
                          onClick={submitForm}
                          disabled={thirdStepperFormValidation()}
                        >
                          Submit
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <h2>Representative Information Form</h2>
                        <form>
                          <TextField
                            required
                            id="representativeFirstName"
                            name="representativeFirstName"
                            label="Representative FirstName"
                            value={formValues.representativeFirstName}
                            onChange={handleChange}
                            style={{
                              marginRight: "30px",
                            }}
                          />

                          <TextField
                            required
                            id="representativeLastName"
                            name="representativeLastName"
                            label="Representative LastName"
                            value={formValues.representativeLastName}
                            onChange={handleChange}
                            style={{
                              marginRight: "30px",
                            }}
                          />

                          <TextField
                            required
                            id="representativePhone"
                            name="representativePhone"
                            label="Representative Phone"
                            value={formValues.representativePhone}
                            onChange={handleChange}
                            style={{
                              marginRight: "30px",
                            }}
                          />

                          <TextField
                            required
                            id="representativeEmail"
                            name="representativeEmail"
                            label="Representative Email"
                            value={formValues.representativeEmail}
                            onChange={handleChange}
                            style={{
                              marginRight: "30px",
                            }}
                          />
                        </form>
                        <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
                          Power of Attorney
                        </Typography>
                        <Typography variant="body2">
                          Original Copy of Power of Attorney
                        </Typography>
                        <Grid container spacing={2} sx={{ mt: 2 }}>
                          <Grid item xs={12} sm={12}>
                            <Card>
                              <CardActionArea>
                                <input
                                  accept="image/png, image/jpeg"
                                  type="file"
                                  id="powerOfAttorney-upload"
                                  style={{ display: "none" }}
                                  onChange={(event) =>
                                    handleDocumentImageChange(
                                      event,
                                      "powerOfAttorney"
                                    )
                                  }
                                  required
                                />
                                <label htmlFor="powerOfAttorney-upload">
                                  <IconButton component="span">
                                    <CameraAltIcon />
                                  </IconButton>
                                </label>
                                {/* Display uploaded image or placeholder */}
                                {documents["powerOfAttorney"] ? (
                                  <CardMedia
                                    component="img"
                                    height="350"
                                    width="auto"
                                    image={documents["powerOfAttorney"]}
                                    alt={"Power of Attorney for the vehicle"}
                                  />
                                ) : (
                                  <CardMedia
                                    component="img"
                                    height="250"
                                    alt="Upload an image"
                                    image=""
                                  />
                                )}
                              </CardActionArea>
                            </Card>
                          </Grid>
                        </Grid>
                        <Button
                          variant="contained"
                          color="primary"
                          sx={{ mt: 2 }}
                          onClick={submitForm}
                          disabled={thirdStepperFormValidation()}
                        >
                          Submit
                        </Button>
                      </div>
                    )
                  ) : (
                    <></>
                  )}
                </>
              )}
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default EditVehicle;
