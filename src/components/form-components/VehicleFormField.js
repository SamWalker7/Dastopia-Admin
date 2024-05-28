import React, { useState, useEffect } from "react";
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import FormHelperText from '@mui/material/FormHelperText';

const VehicleFormFields = ({ formValues, handleChange, makeList, modelList, cities, years, categories, fuelType, carColors, transmissionType }) => (
    <>
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
        <InputLabel id="fuel-type-select-label">Fuel Type / Engine</InputLabel>
        <Select
          labelId="fuel-type-select-label"
          value={formValues.fuelType}
          label="Fuel Type / Engine"
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
        <InputLabel id="color-select-label">Color</InputLabel>
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
        <InputLabel id="transmission-select-label">Transmission</InputLabel>
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
    </>
  );
  
  export default VehicleFormFields;
  