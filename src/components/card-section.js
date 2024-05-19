// components/CardSection.js
import React from 'react';
import { Box, Typography } from '@mui/material';
import CardItem from './card-item';

const CardSection = ({ title, items }) => {
    return (
        <Box sx={{ marginBottom: '32px' }}>
            <Typography variant="h5" gutterBottom>
                {title}
            </Typography>
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-around',
                    flexWrap: 'wrap',
                    gap: '16px',
                }}
            >
                {items.map((item, index) => (
                    <CardItem key={index} {...item} />
                ))}
            </Box>
        </Box>
    );
};

export default CardSection;
