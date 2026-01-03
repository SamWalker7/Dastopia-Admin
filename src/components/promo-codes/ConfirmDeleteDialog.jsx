import { useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    CircularProgress,
    Alert,
    Box,
    Typography,
} from "@mui/material";
import { handleConfirmDelete } from "./promoCode.api";

function ConfirmDeleteDialog({ open, onClose, promo, onDeleted }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleDelete = async () => {
        setLoading(true);
        setError("");
        setSuccess(false);

        try {
            await handleConfirmDelete(promo.id);
            setSuccess(true);

            // give user a moment to see success message
            setTimeout(() => {
                onDeleted();
                onClose();
                setSuccess(false);
            }, 1000);
        } catch (err) {
            console.error(err);
            setError("Failed to delete promo code. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            setError("");
            setSuccess(false);
            onClose();
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
            <DialogTitle>Delete Promo Code</DialogTitle>

            <DialogContent>
                {/* LOADING */}
                {loading && (
                    <Box display="flex" alignItems="center" gap={2}>
                        <CircularProgress size={20} />
                        <Typography>Deleting promo code...</Typography>
                    </Box>
                )}

                {/* ERROR */}
                {!loading && error && (
                    <Alert severity="error">{error}</Alert>
                )}

                {/* SUCCESS */}
                {!loading && success && (
                    <Alert severity="success">
                        Promo code deleted successfully
                    </Alert>
                )}

                {/* DEFAULT CONFIRMATION */}
                {!loading && !error && !success && (
                    <Typography>
                        Are you sure you want to delete this promo code?
                    </Typography>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={handleClose} disabled={loading}>
                    Cancel
                </Button>
                <Button
                    onClick={handleDelete}
                    color="error"
                    disabled={loading}
                >
                    Delete
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default ConfirmDeleteDialog;
