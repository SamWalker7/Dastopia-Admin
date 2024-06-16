// components/CardItem.js
import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import Icon from '@mui/material/Icon';

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
            <Typography variant="h4" fontWeight="bold">
                {count}
            </Typography>
            <Typography variant="h6" gutterBottom>
                {title > 0 ? <>
                    <TrendingUpIcon color="success"/>
                    {title}%
                </> : title !== '' ?
                    <>
                        <TrendingDownIcon color="error"/>
                        {title}%
                    </> : <></>
                }
            </Typography>
            <Typography variant="body2" color="textSecondary">
                {period}
            </Typography>
        </Box>
    );
};

export default CardItem;
