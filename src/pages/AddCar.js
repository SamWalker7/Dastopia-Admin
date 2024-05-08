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
import { getMakes, getModelByMake, addVehicle, getPreSignedURL } from "../api";
import carModel from '../api/models.json';
import carMake from '../api/makes.json';
import { cities, fuelType, categories, carColors, transmissionType } from '../config/constants';
import { v4 as uuidv4 } from 'uuid';

const AddCar = () => {
	const years = Array.from({ length: new Date().getFullYear() - 2001 + 1 }, (_, i) => 2001 + i);

	const [tab, setTab] = useState(0);
	const [modelList, setModelList] = useState([]);
	const [makeList, setMakeList] = useState([]);
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
		transmission: '',
		modelSpecification: '',
		id: uuidv4()
	});
	const [images, setImages] = useState({
		front: '',
		back: '',
		left: '',
		right: '',
		licenseFront: '',
		licenseBack: '',
		registration: '',
	})

	useEffect(() => {
		setMakeList(carMake?.Makes.map(make => make.make_display));
	}, []);

	const handleNext = () => {
		console.log(formValues);
		if (tab < 2) {
			setTab(tab + 1);
		} else {
			// Navigate to next page or perform submission
		}
	};

	async function uploadImage(file) {
		// Fetch the pre-signed URL from your backend
		const response = await fetch('https://your-api.com/get-presigned-url', {
			method: 'POST',
			body: JSON.stringify({
				filename: file.name,
				contentType: file.type
			}),
			headers: {
				'Content-Type': 'application/json'
			}
		});
		const { url, key } = await response.json();

		// Upload the file using the pre-signed URL
		const result = await fetch(url, {
			method: 'PUT',
			body: file,
			headers: {
				'Content-Type': file.type
			}
		});

		if (result.ok) {
			console.log('Uploaded successfully!');
			return key; // Return the S3 key for storing in DynamoDB
		} else {
			throw new Error('Failed to upload');
		}
	}

	const handleImageChange = (event, type) => {
		const file = event.target.files[0];
		if (file && (file.type === "image/png" || file.type === "image/jpeg" || file.type === "image/jpg")) {
			const reader = new FileReader();
			reader.onloadend = () => {
				setImages(prevImages => ({ ...prevImages, [type]: reader.result }));
			};
			reader.readAsDataURL(file);
		} else {
			alert('Only PNG, JPG and JPEG formats are allowed.');
		}
	};

	const handleChange = (event) => {
		const { name, value } = event.target;
		console.log(name, value);
		if (name === 'make') {
			let newModel = carModel.filter(model => {
				if (Object.keys(model)[0] === value) {
					console.log('mode: ', ...Object.values(model))
					return Object.values(model)
				} else return false
				// return Object.keys(model)[0] === value
			});
			newModel = [...newModel[0][value]];
			console.log('models', newModel);
			setModelList(newModel);
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
		// const response = await addVehicle(formData);
		console.log(formValues);
		window.location.href = "/rent-a-car";
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
					{/* <FormControl fullWidth margin="normal">
						<Button variant="contained" component="label">
							Upload upto 25 Vehicle Image
							<input type="file" required hidden onChange={handleImageChange} />
						</Button>
					</FormControl> */}
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
							disabled={!formValues.make || formValues.make === ''}
						>
							{modelList?.map((model) => (
								<MenuItem key={model} value={model}>
									{model}
								</MenuItem>
							))}
						</Select>
						{(!formValues.make || formValues.make === '') && (
							<FormHelperText className='helperText' style={{ color: '#1976d2' }}>Please select vehicle make and year</FormHelperText>
						)}
					</FormControl>
					<FormControl fullWidth margin="normal">
						<TextField
							id="model-spec-input"
							label="Model Specification"
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
						{(!formValues.make || formValues.make === '') && (
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
						<InputLabel id="category-select-label">Fuel Type / Engine</InputLabel>
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
					<Button onClick={handleNext} sx={{ mt: 2 }}>
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
						{['front', 'back', 'left', 'right'].map((side) => (
							<Grid item xs={6} sm={3} key={side}>
								<Card>
									<CardActionArea>
										<input
											accept="image/png, image/jpeg" // Only accept JPG, JPEG, PNG
											type="file"
											id={`${side}-upload`}
											style={{ display: 'none' }}
											onChange={(event) => handleImageChange(event, side)}
										/>
										<label htmlFor={`${side}-upload`}>
											<IconButton component="span">
												<CameraAltIcon />
											</IconButton>
										</label>
										{images[side] ? (
											<CardMedia
												component="img"
												height="140"
												image={images[side]}
												alt={`${side} of the vehicle`}
											/>
										) : (
											<CardMedia
												component="img"
												height="140"
												image="/static/images/cards/placeholder.jpg" // Placeholder image
												alt="Upload an image"
											/>
										)}
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
						{['licenseFront', 'licenseBack'].map((side) => (
							<Grid item xs={6} sm={6} key={side}>
								<Card>
									<CardActionArea>
										<input
											accept="image/*"
											type="file"
											id={`license-${side}-upload`}
											style={{ display: 'none' }}
											onChange={(event) => handleImageChange(event, side)}
										/>
										<label htmlFor={`license-${side}-upload`}>
											<IconButton component="span">
												<CameraAltIcon />
											</IconButton>
										</label>
										{images[side] ? (
											<CardMedia
												component="img"
												height="140"
												image={images[side]}
												alt={`${side} of the vehicle`}
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
										onChange={(event) => handleImageChange(event, 'registration')}
									/>
									<label htmlFor="registration-upload">
										<IconButton component="span">
											<CameraAltIcon />
										</IconButton>
									</label>
									{images['registration'] ? (
										<CardMedia
											component="img"
											height="140"
											image={images['registration']}
											alt={'registration of the vehicle'}
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
