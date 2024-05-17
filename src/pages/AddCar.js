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
	CircularProgress,
} from "@mui/material";
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import DeleteIcon from '@mui/icons-material/Delete';
import { addVehicle, getPreSignedURL, getPreSignedURLAdmin, uplaodVehicleImagesToS3 } from "../api";
import carModel from '../api/models.json';
import carMake from '../api/makes.json';
import { cities, fuelType, categories, carColors, transmissionType } from '../config/constants';
import { resizeImage } from "../config/helpers";
import { v4 as uuidv4 } from 'uuid';

const AddCar = () => {
	const years = Array.from({ length: new Date().getFullYear() - 2001 + 1 }, (_, i) => 2001 + i);
	const random = uuidv4();
	const [tab, setTab] = useState(0);
	const [modelList, setModelList] = useState([]);
	const [makeList, setMakeList] = useState([]);
	const [documents, setDocuments] = useState({
		front: '',
		back: '',
		left: '',
		right: '',
		frontPlateNumber: '',
		backPlateNumber: '',
		registration: '',
		frontDriversLicense: '',
		backDriversLicense: '',
		powerOfAttorney: '',
		insurance: ''
	})
	const [images, setImages] = useState([]);
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
		id: random,
		isPostedByOwner: '',
		ownerId: '',
		ownerGivenName: '',
		ownerMiddleName: '',
		ownerSurName: '',
		ownerPhone: '',
		ownerEmail: '',
		representativeFirstName: '',
		representativeLastName: '',
		representativePhone: '',
		representativeEmail: '',
		vehicleImageKeys: [],
		adminDocumentKeys: [],
	});
	const [isUploadingImages, setIsUploadingImages] = useState(false);

	useEffect(() => {
		setMakeList(carMake?.Makes.map(make => make.make_display));
	}, []);

	const handleNext = () => {
		const requiredFields = ['city', 'make', 'model', 'year', 'category', 'doors', 'fuelType', 'seats', 'color', 'transmission'];
		for (let field of requiredFields) {
			if (!formValues[field]) {
				alert(`Please fill the ${field} field.`);
				return;
			}
		}
		if (tab < 2) {
			setTab(tab + 1);
		} else {
			// Navigate to next page or perform submission
		}
	};

	const handleImageChange = async (e) => {
		if (e.target.files.length > 25) {
			alert('You can only upload up to 25 images.');
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
			setDocuments(prevImages => ({ ...prevImages, [type]: resizedImage }));
		}
		setIsUploadingImages(false);
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
			setModelList(newModel);
		}
		setFormValues({ ...formValues, [name]: value });
	};

	const submitForm = async () => {
		setIsUploadingImages(true);
		await handleUpload();
		console.log(formValues);
		setIsUploadingImages(false);
		// window.location.href = "/rent-a-car";
	}

	const uploadImageToS3Admin = async (documentType, image) => {
		// Get the file extension
		try {
			const extension = image.name.split('.').pop().toLowerCase();
			if (!extension) {
				throw new Error('Invalid file extension');
			}
			const res = await getPreSignedURLAdmin(formValues.id, `image/${extension}`, `${documentType}`);
			const { url, key } = res.body;
			// Get the pre-signed URL from your server
			// Upload the image to the S3 bucket using the pre-signed URL
			await uplaodVehicleImagesToS3(url, image);
			return  {key, url };
		} catch (error) {
			console.error(`Failed to upload admin document ${documentType}:`, error);
			throw error;
		};
	}

	const uploadImageToS3 = async (image, index) => {
		try {
			const extension = image.name.split('.').pop().toLowerCase();
			if (!extension) {
				throw new Error('Invalid file extension');
			}

			const res = await getPreSignedURL(formValues.id, `image/${extension}`, `image-${index}`);
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
			// Synchronously upload admin documents
			for (const [documentType, image] of Object.entries(documents)) {
				if (image) {
					try {
						const {key, url} = await uploadImageToS3Admin(documentType, image);
						adminKeys.push({ key, url });
					} catch (error) {
						errors.push(`Error uploading ${documentType}: ${error.message}`);
					}
				}
			}

			// Synchronously upload images
			for (const [index, image] of images.entries()) {
				try {
					const {key, url} = await uploadImageToS3(image, index);
					imageKeys.push({ key, url });
				} catch (error) {
					errors.push(`Error uploading image at index ${index}: ${error.message}`);
				}
			}

			if (errors.length > 0) {
				console.error('Upload errors:', errors);
				return false;
			}

			const data = {
				...formValues,
				vehicleImageKeys: imageKeys,
				adminDocumentKeys: adminKeys,
			};

			setFormValues(data);
			const vehicleData = await addVehicle(data);
			console.log('vehicle data: ', vehicleData);
		} catch (error) {
			console.error('Unexpected error:', error);
			return false;
		}
		return true;
	};

	return (
		<Box sx={{ width: "100%" }}>
			<Tabs value={tab} onChange={(event, newValue) => setTab(newValue)}>
				<Tab label="Fill Car Information" />
				<Tab label="Upload Car Documents" />
				<Tab label="Finalize" />
			</Tabs>
			{tab === 0 && (
				<Box component="form" noValidate autoComplete="off" sx={{ mt: 2 }}>
					<Grid container spacing={2}>
						{images.length > 0 && images.map((image, index) => (
							<Grid item xs={4} key={index}>
								<div style={{ position: 'relative' }}>
									<img
										src={URL.createObjectURL(image)}
										alt={`Vehicle ${index + 1}`}
										style={{ width: '100%', height: 'auto' }}
									/>
									<IconButton
										style={{
											position: 'absolute',
											top: '-5%',
											right: '-5%',
											background: 'white',
											color: '#0052cc'
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
							Upload upto 25 Vehicle Image
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
					<Button
						variant="contained"
						onClick={handleNext}
						sx={{ mt: 2 }}
						disabled={
							!formValues.model ||
							!formValues.make ||
							!formValues.year ||
							!formValues.category ||
							!formValues.doors ||
							!formValues.fuelType ||
							!formValues.color ||
							!formValues.transmission ||
							!formValues.city ||
							images.length < 1
						}
					>
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
											accept="image/png, image/jpeg, image/jpg" // Only accept JPG, JPEG, PNG
											type="file"
											id={`${side}-upload`}
											style={{ display: 'none' }}
											onChange={(event) => handleDocumentImageChange(event, side)}
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
												image={URL.createObjectURL(documents[side])}
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
						License Plate Number
					</Typography>
					<Typography variant="body2">
						Front and Back License Plate
					</Typography>
					<Grid container spacing={2} sx={{ mt: 2 }}>
						{['frontPlateNumber', 'backPlateNumber'].map((side) => (
							<Grid item xs={6} sm={6} key={side}>
								<Card>
									<CardActionArea>
										<input
											accept="image/png, image/jpeg"
											type="file"
											id={`license-${side}-upload`}
											style={{ display: 'none' }}
											onChange={(event) => handleDocumentImageChange(event, side)}
										/>
										<label htmlFor={`license-${side}-upload`}>
											<IconButton component="span">
												<CameraAltIcon />
											</IconButton>
										</label>
										{documents[side] ? (
											<CardMedia
												component="img"
												height="140"
												image={URL.createObjectURL(documents[side])}
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
						Driver's License
					</Typography>
					<Typography variant="body2">
						Front and Back Driver's License
					</Typography>
					<Grid container spacing={2} sx={{ mt: 2 }}>
						{['frontDriversLicense', 'backDriversLicense'].map((side) => (
							<Grid item xs={6} sm={6} key={side}>
								<Card>
									<CardActionArea>
										<input
											accept="image/png, image/jpeg"
											type="file"
											id={`${side}-upload`}
											style={{ display: 'none' }}
											onChange={(event) => handleDocumentImageChange(event, side)}
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
												image={URL.createObjectURL(documents[side])}
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
					<Typography variant="body2">
						Insurance Card
					</Typography>
					<Grid container spacing={2} sx={{ mt: 2 }}>
						<Grid item xs={12} sm={12}>
							<Card>
								<CardActionArea>
									<input
										accept="image/png, image/jpeg"
										type="file"
										id="insurance-upload"
										style={{ display: 'none' }}
										onChange={(event) => handleDocumentImageChange(event, 'insurance')}
									/>
									<label htmlFor="insurance-upload">
										<IconButton component="span">
											<CameraAltIcon />
										</IconButton>
									</label>
									{documents['insurance'] ? (
										<CardMedia
											component="img"
											height="140"
											image={URL.createObjectURL(documents['insurance'])}
											alt={'insurance of the vehicle'}
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
										style={{ display: 'none' }}
										onChange={(event) => handleDocumentImageChange(event, 'registration')}
									/>
									<label htmlFor="registration-upload">
										<IconButton component="span">
											<CameraAltIcon />
										</IconButton>
									</label>
									{documents['registration'] ? (
										<CardMedia
											component="img"
											height="140"
											image={URL.createObjectURL(documents['registration'])}
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
				<Box
					sx={{
						'& .MuiTextField-root': { m: 1, width: '25ch' },
					}}
					noValidate
					autoComplete="off"
				>
					{isUploadingImages ?
						<Box sx={{ display: 'flex' }} justifyContent="center" alignItems="center" margin="auto">
							<CircularProgress size="10%" />
						</Box>
						:
						<>
							{/* Text fields for Owner and Representative will go here */}
							< TextField
								required
								id="ownerFirstName"
								name="ownerFirstName"
								label="Owner First Name"
								value={formValues.ownerFirstName}
								onChange={handleChange}
							/>

							<TextField
								required
								id="ownerLastName"
								name="ownerLastName"
								label="Owner Last Name"
								value={formValues.ownerLastName}
								onChange={handleChange}
							/>

							<TextField
								required
								id="ownerPhone"
								name="ownerPhone"
								label="Owner Phone"
								value={formValues.ownerPhone}
								onChange={handleChange}
							/>

							<TextField
								required
								id="ownerEmail"
								name="ownerEmail"
								label="Owner Email"
								value={formValues.ownerEmail}
								onChange={handleChange}
							/>

							<TextField
								required
								id="representativeFirstName"
								name="representativeFirstName"
								label="Representative First Name"
								value={formValues.representativeFirstName}
								onChange={handleChange}
							/>

							<TextField
								required
								id="representativeLastName"
								name="representativeLastName"
								label="Representative Last Name"
								value={formValues.representativeLastName}
								onChange={handleChange}
							/>

							<TextField
								required
								id="representativePhone"
								name="representativePhone"
								label="Representative Phone"
								value={formValues.representativePhone}
								onChange={handleChange}
							/>

							<TextField
								required
								id="representativeEmail"
								name="representativeEmail"
								label="Representative Email"
								value={formValues.representativeEmail}
								onChange={handleChange}
							/>
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
												style={{ display: 'none' }}
												onChange={(event) => handleDocumentImageChange(event, 'powerOfAttorney')}
											/>
											<label htmlFor="powerOfAttorney-upload">
												<IconButton component="span">
													<CameraAltIcon />
												</IconButton>
											</label>
											{documents['powerOfAttorney'] ? (
												<CardMedia
													component="img"
													height="350"
													width="auto"
													image={URL.createObjectURL(documents['powerOfAttorney'])}
													alt={'Power of Attorney for the vehicle'}
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
						</>
					}
				</Box>
			)}
			{/* Implement other tabs as needed */}
		</Box>
	);
};

export default AddCar;
