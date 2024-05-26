// src/components/VehicleImageSlider.js
import React from "react";
import Slider from "react-slick";
import CardMedia from "@mui/material/CardMedia";

const VehicleImageSlider = ({ images }) => {
    const settings = {
        dots: true,
        infinite: false,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: true,
    };

    return (
        <div className="image-slider-container">
            <Slider {...settings}>
                {images.map((url, index) => (
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
        </div>
    );
};

export default VehicleImageSlider;
