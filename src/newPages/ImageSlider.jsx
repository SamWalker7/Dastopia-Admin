// ImageSlider.js
import React, { useState } from "react";
import { Box, IconButton, Typography } from "@mui/material";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

const ImageSlider = ({ imageUrls }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!imageUrls || imageUrls.length === 0) {
    return <Typography color="textSecondary">No images to display.</Typography>;
  }

  const goToPrevious = () => {
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? imageUrls.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const goToNext = () => {
    const isLastSlide = currentIndex === imageUrls.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        maxWidth: "800px", // Max width for the slider container
        height: "100%", // Take available height in the dialog content
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden", // Hide parts of image outside the box
      }}
    >
      <img
        src={imageUrls[currentIndex]}
        alt={`Slide ${currentIndex}`}
        style={{
          maxWidth: "100%",
          maxHeight: "100%",
          objectFit: "contain", // Ensure image is visible without cropping
        }}
      />

      {imageUrls.length > 1 && ( // Only show navigation if more than one image
        <>
          <IconButton
            onClick={goToPrevious}
            sx={{
              position: "absolute",
              top: "50%",
              left: 16,
              transform: "translateY(-50%)",
              backgroundColor: "rgba(255, 255, 255, 0.5)",
              "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.8)" },
              zIndex: 1,
            }}
          >
            <ArrowBackIosIcon />
          </IconButton>
          <IconButton
            onClick={goToNext}
            sx={{
              position: "absolute",
              top: "50%",
              right: 16,
              transform: "translateY(-50%)",
              backgroundColor: "rgba(255, 255, 255, 0.5)",
              "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.8)" },
              zIndex: 1,
            }}
          >
            <ArrowForwardIosIcon />
          </IconButton>
        </>
      )}
    </Box>
  );
};

export default ImageSlider;
