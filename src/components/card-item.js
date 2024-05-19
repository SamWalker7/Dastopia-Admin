// components/CardItem.js
import React from 'react';
import { Box, Typography, Avatar } from '@mui/material';

const CardItem = ({ icon, title, count, period }) => {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                backgroundColor: 'background.paper',
                borderRadius: '12px',
                padding: '24px',
                margin: '8px',
                flexGrow: 1,
                boxShadow: 3,
                minWidth: '150px',
            }}
        >
            <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56, mb: 2 }}>
                {icon}
            </Avatar>
            <Typography variant="h6" gutterBottom>
                {title}
            </Typography>
            <Typography variant="h4" fontWeight="bold">
                {count}
            </Typography>
            <Typography variant="body2" color="textSecondary">
                {period}
            </Typography>
        </Box>
    );
};

export default CardItem;
