import {
  TextField,
  OutlinedInput,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Button,
  Typography,
  Box,
} from "@mui/material";
import { styled } from "@mui/system";

import myImage from "../assets/myImage.png";
import React, { useEffect, useState } from "react";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { useDispatch, useSelector } from "react-redux";
import { login } from "../store/auth/authThunks";

// Styled Box component for consistent styling
const StyledBox = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  height: "100%",
  width: "100%",
}));

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [phone_number, setphoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate(); // Initialize useNavigate
  const dispatch = useDispatch();
  const { loading, error, isAuthenticated } = useSelector(
    (state) => state.auth
  );
  const [errors, setErrors] = useState({});
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError(""); // Clear previous login error
    setErrors({}); // Clear previous validation errors

    // Basic client-side validation
    const validationErrors = {};
    if (!phone_number) {
      validationErrors.phone_number = "Phone number is required";
    }
    if (!password) {
      validationErrors.password = "Password is required";
    }
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      const resultAction = await dispatch(login(phone_number, password)); // Corrected dispatch syntax
      const result = await resultAction.unwrap();

      console.log("Login successful:", result);
    } catch (rejectedValueOrSerializedError) {
      console.error("Login failed:", rejectedValueOrSerializedError);
      if (rejectedValueOrSerializedError) {
        setLoginError(
          "Phone number or password is incorrect. Please try again."
        );
      } else {
        setLoginError("An error occurred during login. Please try again.");
      }
    }
  };

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const handleMouseUpPassword = (event) => {
    event.preventDefault();
  };

  return (
    <>
      {/* whole page */}
      <Box sx={{ display: "flex", height: "100vh", width: "100vw" }}>
        {/* left */}
        <StyledBox sx={{ width: "50%", backgroundColor: "#e0f2f7" }}>
          <Box sx={{ textAlign: "center" }}>
            <Typography
              variant="h4"
              sx={{ whiteSpace: "nowrap", fontWeight: "extrabold" }}
            >
              Welcome to Guzo Rentals
            </Typography>
          </Box>
          <Box
            sx={{
              px: 16,
              mt: 4,
              textAlign: "center",
              overflowWrap: "break-word",
              flexDirection: "row",
              flexWrap: "wrap",
            }}
          >
            <Typography variant="body2" sx={{ color: "rgba(0, 0, 0, 0.87)" }}>
              Welcome to the admin page.
            </Typography>
          </Box>
        </StyledBox>
        {/* right */}
        <Box
          sx={{
            width: "50%",
            height: "100vh",
            backgroundImage: `url(${myImage})`,
            backgroundSize: "contain",
            backgroundPosition: "center",
            backgroundColor: "#0d47a1",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {/* center */}
          <StyledBox
            sx={{
              width: 300,
              height: 320,
              gap: 5,
              borderRadius: "8px",
              opacity: 0.85,
              backgroundColor: "white",
              p: 3,
            }}
          >
            {/* form */}
            <Box sx={{ width: "100%" }}>
              <Typography variant="h4" align="left" sx={{ pb: 6, pr: 12 }}>
                Login
              </Typography>
              <TextField
                className="outlined-basic text-xs font-extralight "
                size="small"
                label="PhoneNumber"
                variant="outlined"
                value={phone_number}
                onChange={(e) => setphoneNumber(e.target.value)}
                sx={{ fontSize: "0.75rem", fontWeight: 300 }}
              />
            </Box>
            <Box sx={{ width: "100%" }}>
              <FormControl variant="outlined" size="small">
                <InputLabel
                  htmlFor="outlined-adornment-password"
                  variant="outlined"
                  sx={{ fontSize: "0.95rem", fontWeight: 300 }}
                >
                  Password
                </InputLabel>{" "}
                {/* Approximate of outlined-basic text-xs font-extralight */}
                <OutlinedInput
                  id="outlined-adornment-password"
                  type={showPassword ? "text" : "password"}
                  endAdornment={
                    <InputAdornment position="start">
                      <IconButton
                        aria-label={
                          showPassword
                            ? "hide the password"
                            : "display the password"
                        }
                        onClick={handleClickShowPassword}
                        onMouseDown={handleMouseDownPassword}
                        onMouseUp={handleMouseUpPassword}
                        edge="start"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  }
                  label="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  sx={{ fontSize: "0.75rem", fontWeight: 300 }}
                />
              </FormControl>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  mt: 2,
                  mb: 2,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ textDecoration: "underline", fontSize: "0.75rem" }}
                >
                  <a
                    href="#"
                    style={{ color: "inherit", textDecoration: "inherit" }}
                  >
                    Forgot Password?
                  </a>
                </Typography>
              </Box>
              <Button
                variant="contained"
                sx={{
                  backgroundColor: "#000080",
                  borderRadius: 10,
                  width: "100%",
                }}
                size="small"
                onClick={handleSubmit}
              >
                Login
              </Button>
            </Box>
          </StyledBox>
        </Box>
      </Box>
    </>
  );
}

export default Login;
