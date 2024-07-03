// components/CardItem.js
import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import Icon from '@mui/material/Icon';

const CardItem = ({ icon, title, count, period }) => {
    const [percentageChange, setPercentageChange] = useState(null);
    useEffect(() => {
        let num = typeof title === 'string' ? parseFloat(title) : title;
        setPercentageChange(Math.round((num + Number.EPSILON) * 100) / 100);
    }, [title]);


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
            <Typography variant="h4" fontWeight="bold">
                {count}
            </Typography>
            <Typography variant="body2" color="textSecondary">
                {period}
            </Typography>
            <Typography variant="h5" gutterBottom color="gray">
                {title > 0 ? <>
                    <TrendingUpIcon fontSize="large" color="success" />
                    {percentageChange || title}%
                </> : title !== '' ?
                    <>
                        <TrendingDownIcon fontSize="large" color="error" />
                        {percentageChange || title}%
                    </> : <></>
                }
            </Typography>
            {/* <Typography variant="body2" color="textSecondary">
                {period} vs it's previous {period}
            </Typography> */}
        </Box>
    );
};

export default CardItem;
