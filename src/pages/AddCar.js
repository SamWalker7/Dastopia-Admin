import React, { useState, useEffect } from "react";
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import IconButton from '@mui/material/IconButton';
import CardMedia from '@mui/material/CardMedia';
import FormHelperText from '@mui/material/FormHelperText';
import CircularProgress from '@mui/material/CircularProgress';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import DeleteIcon from '@mui/icons-material/Delete';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormLabel from '@mui/material/FormLabel';
import FormControlLabel from '@mui/material/FormControlLabel';
import UploadIcon from '@mui/icons-material/Upload';
import AddIcon from '@mui/icons-material/Add';
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
	const [isOwner, setIsOwner] = useState(true);
	const [documents, setDocuments] = useState({
		front: '',
		back: '',
		left: '',
		right: '',
		plateNumber: '',
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
		otherMake: '',
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
		if (tab < 2) {
			setTab(tab + 1);
		} else {
			// Navigate to next page or perform submission
		}
	};

	const handleOwnerChange = (event) => {
		setIsOwner(event.target.value === 'owner');
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
		window.location.href = "/rent-a-car";
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
			return { key, url };
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
						const { key, url } = await uploadImageToS3Admin(documentType, image);
						adminKeys.push({ key, url });
					} catch (error) {
						errors.push(`Error uploading ${documentType}: ${error.message}`);
					}
				}
			}

			// Synchronously upload images
			for (const [index, image] of images.entries()) {
				try {
					const { key, url } = await uploadImageToS3(image, index);
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
				createdAt: new Date().toUTCString(),
				vehicleImageKeys: imageKeys,
				adminDocumentKeys: adminKeys,
				make: formValues.otherMake !== '' ? formValues.otherMake : formValues.make
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

	const thirdStepperFormValidation = () => Object.values(documents).some(field => field === '') || firstStepperFormValidation();

	const secondStepperFormValidation = () => Object.entries(documents).some(([key, field]) => key === "powerOfAttorney" ? false : field === '');

	const firstStepperFormValidation = () => (
		!formValues.model ||
		!formValues.make ||
		!formValues.year ||
		!formValues.category ||
		!formValues.doors ||
		!formValues.fuelType ||
		!formValues.color ||
		!formValues.transmission ||
		!formValues.city ||
		images.length < 1 ||
		!documents.front ||
		!documents.back ||
		!documents.left ||
		!documents.right
	);
	return (
		<Box sx={{ width: "100%" }}>
			<Tabs value={tab} onChange={(event, newValue) => setTab(newValue)}>
				<Tab label="Fill Out Vehicle Information" />
				<Tab label="Upload Vehicle Documents" />
				<Tab label="Finalize" />
			</Tabs>
			{tab === 0 && (
				/***
				 * TO DO
				 * Make a formsControl varibale and map through it
				 * Ex: 
				 * const formControls = [
						{
							label: 'Make',
							name: 'make',
							options: makeList,
							isTextField: formValues.make === 'Other',
							placeholder: 'Please specify the make of the vehicle',
							otherName: 'otherMake',
						},
						{
							label: 'Model',
							name: 'model',
							options: modelList,
							isTextField: formValues.make === 'Other',
							placeholder: 'Please specify the model of the vehicle',
							disabled: !formValues.make || formValues.make === '',
							helperText: 'Please select vehicle make and year',
						},
						{
							label: 'Model Specification (Optional)',
							name: 'modelSpecification',
							isTextField: true,
							placeholder: 'Optional',
						},
						{
							label: 'Year',
							name: 'year',
							options: yearList, // Assuming you have a yearList variable
						},
					];
				* {tab === 0 && (
					<Grid container spacing={2}>
						{formControls.map(({ label, name, options }) => (
							<Grid item xs={12} sm={3} key={name}>
								<FormControl fullWidth margin="normal">
									<InputLabel id={`${name}-select-label`}>{label}</InputLabel>
									<Select
										labelId={`${name}-select-label`}
										value={formValues[name]}
										name={name}
										label={label}
										onChange={handleChange}
										required
									>
										{options.map((option) => (
											<MenuItem key={option} value={option}>
												{option}
											</MenuItem>
										))}
									</Select>
								</FormControl>
							</Grid>
						))}
					</Grid>
				)}
				 */
				<Box component="form" noValidate autoComplete="off" sx={{ mt: 2 }}>
					<Typography variant="h6" gutterBottom>
						Upload Images
					</Typography>
					<Typography variant="body1">
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

					<Grid container spacing={2} style={{ marginTop: '1em' }}>
						{images.length > 0 && images.map((image, index) => (
							<Grid item xs={4} key={index}>
								<div style={{ position: 'relative' }}>
									<img
										src={URL.createObjectURL(image)}
										alt={`Vehicle ${index + 1}`}
										// height="140"
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
						<Box
							component="label"
							sx={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								height: 200,
								border: '2px dashed grey',
								borderRadius: 1
							}}
						>
							<IconButton component="span">
								<AddIcon fontSize="large" />
							</IconButton>
							Upload Vehicle Images
							<input
								type="file"
								required
								hidden
								multiple
								accept=".png, .jpg, .jpeg"
								onChange={handleImageChange}
							/>
						</Box>
					</FormControl>
					<Grid container spacing={2}>
						<Grid item xs={12} sm={3}>
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
						</Grid>
						<Grid item xs={12} sm={3}>
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
						</Grid>
						{formValues.make === 'Other' &&
							<Grid item xs={12} sm={3}>
								<FormControl fullWidth margin="normal">
									<TextField
										id="other-make-input"
										label="Enter Make"
										placeholder="Please specify the make of the vehicle"
										name="otherMake"
										value={formValues.otherMake}
										onChange={handleChange}
									/>
								</FormControl>
							</Grid>
						}
						<Grid item xs={12} sm={3}>
							<FormControl fullWidth margin="normal">
								{formValues.make === 'Other' ?
									<>
										<TextField
											id="other-model-input"
											label="Enter Model"
											placeholder="Please specify the model of the vehicle"
											name="model"
											value={formValues.model}
											onChange={handleChange}
										/>
									</> :
									<>
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
									</>
								}
							</FormControl>
						</Grid>
						<Grid item xs={12} sm={3}>
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
						</Grid>
						<Grid item xs={12} sm={3}>
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
						</Grid>
						<Grid item xs={12} sm={3}>
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
						</Grid>
						<Grid item xs={12} sm={3}>
							<FormControl fullWidth margin="normal">
								<TextField
									id="doors-input"
									label="Doors"
									name="doors"
									value={formValues.doors}
									onChange={handleChange}
								/>
							</FormControl>
						</Grid>
						<Grid item xs={12} sm={3}>
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
						</Grid>
						<Grid item xs={12} sm={3}>
							<FormControl fullWidth margin="normal">
								<TextField
									id="seats-input"
									label="Number of Seats"
									name="seats"
									value={formValues.seats}
									onChange={handleChange}
								/>
							</FormControl>
						</Grid>
						<Grid item xs={12} sm={3}>
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
						</Grid>
						<Grid item xs={12} sm={3}>
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
						</Grid>
					</Grid>
					<Button
						variant="contained"
						onClick={handleNext}
						sx={{ mt: 2 }}
						disabled={firstStepperFormValidation()}
					>
						Next
					</Button>
					{firstStepperFormValidation() && <Typography style={{ color: 'red' }} variant="subtitle1">Please fill in the required fields and upload at least one picture</Typography>}
				</Box>
			)
			}
			{
				tab === 1 && (
					<Box component="form" noValidate autoComplete="off" sx={{ mt: 2 }}>
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
											style={{ display: 'none' }}
											onChange={(event) => handleDocumentImageChange(event, 'plateNumber')}
										/>
										<label htmlFor="plateNumber-upload">
											<IconButton component="span">
												<CameraAltIcon />
											</IconButton>
										</label>
										{documents['plateNumber'] ? (
											<CardMedia
												component="img"
												height="140"
												image={URL.createObjectURL(documents['plateNumber'])}
												alt={'Plate Number of the vehicle'}
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
						<Button variant="contained" onClick={handleNext} sx={{ mt: 2 }} disabled={secondStepperFormValidation()}>
							Next
						</Button>
						{secondStepperFormValidation() && <Typography style={{ color: 'red' }} variant="subtitle1">Please upload all documents</Typography>}
					</Box>
				)
			}
			{
				tab === 2 && (
					<Box sx={{ mt: 2 }} noValidate autoComplete="off">
						{isUploadingImages ?
							<Box sx={{ display: 'flex' }} justifyContent="center" alignItems="center" margin="auto">
								<CircularProgress size="10%" />
							</Box>
							:
							<>
								<FormControl component="fieldset">
									<FormLabel component="legend">Are you the owner?</FormLabel>
									<RadioGroup
										aria-label="owner"
										name="owner"
										value={isOwner ? 'owner' : 'representative'}
										onChange={handleOwnerChange}
									>
										<FormControlLabel value="owner" control={<Radio />} label="Yes" />
										<FormControlLabel value="representative" control={<Radio />} label="No" />
									</RadioGroup>
								</FormControl>
								{/* Text fields for Owner and Representative will go here */}
								{isOwner !== null && (
									isOwner ? (
										<Grid container spacing={2}>
											<Grid item xs={12} sm={3}>
												<FormControl fullWidth margin="normal">
													<TextField
														required
														fullWidth
														id="ownerFirstName"
														name="ownerFirstName"
														label="Owner First Name"
														value={formValues.ownerFirstName}
														onChange={handleChange}
													/>
												</FormControl>
											</Grid>
											<Grid item xs={12} sm={3}>
												<FormControl fullWidth margin="normal">
													<TextField
														required
														id="ownerLastName"
														name="ownerLastName"
														label="Owner Last Name"
														value={formValues.ownerLastName}
														onChange={handleChange}
													/>
												</FormControl>
											</Grid>
											<Grid item xs={12} sm={3}>
												<FormControl fullWidth margin="normal">
													<TextField
														required
														id="ownerPhone"
														name="ownerPhone"
														label="Owner Phone"
														value={formValues.ownerPhone}
														onChange={handleChange}
													/>
												</FormControl>
											</Grid>
											<Grid item xs={12} sm={3}>
												<FormControl fullWidth margin="normal">
													<TextField
														required
														id="ownerEmail"
														name="ownerEmail"
														label="Owner Email"
														value={formValues.ownerEmail}
														onChange={handleChange}
													/>
												</FormControl>
											</Grid>
										</Grid>
									) : (
										<>
											<Grid container spacing={2}>
												<Grid item xs={12} sm={3}>
													<FormControl fullWidth margin="normal">
														<TextField
															required
															id="representativeFirstName"
															name="representativeFirstName"
															label="Representative First Name"
															value={formValues.representativeFirstName}
															onChange={handleChange}
														/>
													</FormControl>
												</Grid>
												<Grid item xs={12} sm={3}>
													<FormControl fullWidth margin="normal">
														<TextField
															required
															id="representativeLastName"
															name="representativeLastName"
															label="Representative Last Name"
															value={formValues.representativeLastName}
															onChange={handleChange}
														/>
													</FormControl>
												</Grid>
												<Grid item xs={12} sm={3}>
													<FormControl fullWidth margin="normal">
														<TextField
															required
															id="representativePhone"
															name="representativePhone"
															label="Representative Phone"
															value={formValues.representativePhone}
															onChange={handleChange}
														/>
													</FormControl>
												</Grid>
												<Grid item xs={12} sm={3}>
													<FormControl fullWidth margin="normal">
														<TextField
															required
															id="representativeEmail"
															name="representativeEmail"
															label="Representative Email"
															value={formValues.representativeEmail}
															onChange={handleChange}
														/>
													</FormControl>
												</Grid>
											</Grid>
											<Grid container spacing={2}>
												<Grid item xs={12} sm={12}>
													<Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
														Power of Attorney
													</Typography>
												</Grid>
												<Grid item xs={12} sm={3}>
													<Typography variant="body2">
														Original Copy of Power of Attorney
													</Typography>
												</Grid>
												<Grid container spacing={2} sx={{ m: 1, mt: 1 }}>
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
											</Grid>
										</>
									)
								)}
								{/* <Typography variant="h6" gutterBottom>
								Enable Listing
							</Typography>
							<Typography variant="body2">
								Click the button below to enable your car listing.
							</Typography> */}
								<Button
									variant="contained"
									color="primary"
									sx={{ mt: 2 }}
									onClick={submitForm}
									disabled={thirdStepperFormValidation()}
								>
									Submit
								</Button>
							</>
						}
					</Box>
				)
			}
			{/* Implement other tabs as needed */}
		</Box >
	);
};

export default AddCar;
