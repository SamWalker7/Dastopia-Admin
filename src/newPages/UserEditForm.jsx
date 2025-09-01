// UserEditForm.js
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  Box,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

// --- API Service for updating the user ---
const API_BASE_URL =
  "https://oy0bs62jx8.execute-api.us-east-1.amazonaws.com/Prod";

const updateUser = async (userId, adminToken, updateData) => {
  if (!userId || !adminToken) {
    throw new Error("User ID or Admin Token is missing.");
  }

  if (Object.keys(updateData).length === 0) {
    return; // Nothing to update
  }

  const response = await fetch(`${API_BASE_URL}/v1/admin/users/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify(updateData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message =
      errorData?.body?.message || errorData.message || "Failed to update user.";
    throw new Error(message);
  }

  return await response.json();
};
// --- END API Service ---

const UserEditForm = ({ user, open, onClose, onUserUpdated }) => {
  // State for form fields
  const [formData, setFormData] = React.useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    email: "",
  });

  // State for ONLY the verification fields that exist in the schema
  const [idVerified, setIdVerified] = React.useState(false);

  const [accountStatus, setAccountStatus] = React.useState({
    enabled: true,
  });

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  // Effect to populate form when the user data changes
  React.useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.given_name || "",
        last_name: user.family_name || "",
        phone_number: user.phone_number || "",
        email: user.email || "",
      });
      // Only set state for attributes that exist
      setIdVerified(user["custom:id_verified"] === "1");
      setAccountStatus({
        enabled: user.enabled === true,
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    if (name === "enabled") {
      setAccountStatus({ enabled: checked });
    } else if (name === "custom_id_verified") {
      setIdVerified(checked);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const adminToken = JSON.parse(localStorage.getItem("admin"))?.AccessToken;

    // Combine all form data into one object for the request
    const updateData = {
      ...formData,
      custom_id_verified: idVerified ? "1" : "0", // Convert boolean to string "1" or "0"
      ...accountStatus,
    };

    // If the email field is empty, remove it from the payload.
    if (!updateData.email) {
      delete updateData.email;
    }

    try {
      await updateUser(user.id, adminToken, updateData);
      onUserUpdated(); // This will close the dialog and refresh the user data in the parent
    } catch (err) {
      setError(err.message.replace(/\\n/g, " ")); // Clean up error message for display
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        Edit User: {user?.given_name} {user?.family_name}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          {/* Personal Information */}
          <Typography variant="h6" gutterBottom>
            Personal Information
          </Typography>
          <TextField
            name="first_name"
            label="First Name"
            value={formData.first_name}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
          />
          <TextField
            name="last_name"
            label="Last Name"
            value={formData.last_name}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
          />
          <TextField
            name="phone_number"
            label="Phone Number"
            value={formData.phone_number}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
          />
          <TextField
            name="email"
            label="Email (Optional)"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
          />

          {/* Verification Status */}
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            Verification Status
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={idVerified}
                onChange={handleSwitchChange}
                name="custom_id_verified"
              />
            }
            label="ID Verified"
          />

          {/* Phone and Email verification switches are removed as they are not in the backend schema */}

          {/* Account Status */}
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            Account Status
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={accountStatus.enabled}
                onChange={handleSwitchChange}
                name="enabled"
              />
            }
            label="Account Enabled"
          />

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary" disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={isLoading}
        >
          {isLoading ? <CircularProgress size={24} /> : "Update User"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserEditForm;
