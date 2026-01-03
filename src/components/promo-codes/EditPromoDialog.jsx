import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Alert,
    CircularProgress,
} from "@mui/material";
import { LocalizationProvider, DateTimePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { updatePromoApi } from "./promoCode.api";

export default function EditPromoDialog({ promo, onClose, onSuccess }) {
    const [form, setForm] = useState(null);
    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (promo) {
            setForm({
                code: promo.code,
                discountPercentage: promo.discountPercentage,
                startDateTime: promo.startDateTime ? dayjs(promo.startDateTime) : null,
                endDateTime: promo.endDateTime ? dayjs(promo.endDateTime) : null,
                globalMaxUses: promo.globalMaxUses,
                perUserMaxUses: promo.perUserMaxUses,
            });
            setErrors({});
            setApiError("");
        }
    }, [promo]);

    if (!promo || !form) return null;

    const validate = () => {
        const newErrors = {};

        if (form.discountPercentage < 0 || form.discountPercentage > 100) {
            newErrors.discountPercentage = "Discount must be between 0 and 100";
        }

        if (!form.startDateTime) {
            newErrors.startDateTime = "Start date is required";
        }

        if (!form.endDateTime) {
            newErrors.endDateTime = "End date is required";
        } else if (form.startDateTime && form.endDateTime.isBefore(form.startDateTime)) {
            newErrors.endDateTime = "End date must be after start date";
        }

        if (form.globalMaxUses <= 0) {
            newErrors.globalMaxUses = "Global max uses must be greater than 0";
        }

        if (form.perUserMaxUses <= 0) {
            newErrors.perUserMaxUses = "Per user max uses must be greater than 0";
        } else if (form.perUserMaxUses > form.globalMaxUses) {
            newErrors.perUserMaxUses = "Per user max uses cannot exceed global max uses";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        setApiError("");

        try {
            await updatePromoApi(promo.id, {
                discountPercentage: form.discountPercentage,
                startDateTime: form.startDateTime?.toISOString(),
                endDateTime: form.endDateTime?.toISOString(),
                globalMaxUses: form.globalMaxUses,
                perUserMaxUses: form.perUserMaxUses,
            });

            onClose();
            onSuccess();
        } catch (err) {
            setApiError(err?.response?.data?.message || err?.message || "Something went wrong");
            setErrors(apiError);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={!!promo} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: "bold", fontSize: 22 }}>Edit Promo Code</DialogTitle>
            <DialogContent>
                <Box display="flex" flexDirection="column" gap={3} mt={1}>
                    {(Object.keys(errors).length > 0 || apiError) && (
                        <Alert severity="error">
                            {apiError && <div>{apiError}</div>}
                            {Object.values(errors).map((msg, i) => (
                                <div key={i}>{msg}</div>
                            ))}
                        </Alert>
                    )}

                    <TextField
                        label="Promo Code"
                        value={form.code}
                        disabled
                        fullWidth
                        size="small"
                    />

                    <TextField
                        label="Discount %"
                        type="number"
                        value={form.discountPercentage}
                        onChange={(e) => setForm({ ...form, discountPercentage: Number(e.target.value) })}
                        error={!!errors.discountPercentage}
                        helperText={errors.discountPercentage}
                        fullWidth
                        size="small"
                    />

                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DateTimePicker
                            label="Start Date"
                            value={form.startDateTime}
                            onChange={(value) => setForm({ ...form, startDateTime: value })}
                            slotProps={{
                                textField: {
                                    fullWidth: true,
                                    size: "small",
                                    error: !!errors.startDateTime,
                                    helperText: errors.startDateTime,
                                },
                            }}
                        />

                        <DateTimePicker
                            label="End Date"
                            value={form.endDateTime}
                            minDateTime={form.startDateTime || dayjs()}
                            onChange={(value) => setForm({ ...form, endDateTime: value })}
                            slotProps={{
                                textField: {
                                    fullWidth: true,
                                    size: "small",
                                    error: !!errors.endDateTime,
                                    helperText: errors.endDateTime,
                                },
                            }}
                        />
                    </LocalizationProvider>

                    <TextField
                        label="Global Max Uses"
                        type="number"
                        value={form.globalMaxUses}
                        onChange={(e) => setForm({ ...form, globalMaxUses: Number(e.target.value) })}
                        error={!!errors.globalMaxUses}
                        helperText={errors.globalMaxUses}
                        fullWidth
                        size="small"
                    />

                    <TextField
                        label="Per User Max Uses"
                        type="number"
                        value={form.perUserMaxUses}
                        onChange={(e) => setForm({ ...form, perUserMaxUses: Number(e.target.value) })}
                        error={!!errors.perUserMaxUses}
                        helperText={errors.perUserMaxUses}
                        fullWidth
                        size="small"
                    />
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                {Object.keys(errors).length > 0 && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {Object.values(errors).map((msg, index) => (
                            <div key={index}>{msg}</div>
                        ))}
                    </Alert>
                )}
                <Button onClick={onClose}>Cancel</Button>
                <Button variant="contained" onClick={handleSave} disabled={loading}>
                    {loading ? <CircularProgress size={20} /> : "Save Changes"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
