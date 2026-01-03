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
import { useState } from "react";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { createPromoCodeApi } from "./promoCode.api";
dayjs.extend(isSameOrBefore);

export default function CreatePromoCodeDialog({ open, onClose, onSuccess }) {
    const [form, setForm] = useState({
        code: "",
        discountPercentage: 0,
        startDateTime: dayjs(),
        endDateTime: null,
        globalMaxUses: 1000,
        perUserMaxUses: 2,
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState(null);


    const validate = () => {
        const now = dayjs();
        const newErrors = {};

        // START DATE
        if (!form.startDateTime) {
            newErrors.startDateTime = "Start date is required";
        } else if (dayjs(form.startDateTime).isBefore(now)) {
            newErrors.startDateTime = "Start date cannot be in the past";
        }

        // END DATE
        if (!form.endDateTime) {
            newErrors.endDateTime = "End date is required";
        } else if (
            form.startDateTime &&
            dayjs(form.endDateTime).isSameOrBefore(dayjs(form.startDateTime))
        ) {
            newErrors.endDateTime = "End date must be after start date";
        }

        // GLOBAL MAX USES
        if (!form.globalMaxUses || form.globalMaxUses < 1) {
            newErrors.globalMaxUses = "Global max uses must be at least 1";
        }

        // PER USER MAX USES
        if (!form.perUserMaxUses || form.perUserMaxUses < 1) {
            newErrors.perUserMaxUses = "Per user max uses must be at least 1";
        } else if (form.perUserMaxUses > form.globalMaxUses) {
            newErrors.perUserMaxUses = "Per user max uses cannot exceed global max uses";
        }

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };



    const handleCreate = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        let res;
        try {

            res = await createPromoCodeApi({
                ...form,
                code: form.code.trim().toUpperCase(),
            });

            onSuccess();

        } catch (error) {
            if (res.status === 403) {
                setApiError("You do not have permission to perform this action.")
            } else {
                setApiError(error.message || "Something went wrong");
            }
        }
    };


    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: "bold", fontSize: 22 }}>Create Promo Code</DialogTitle>
            <DialogContent>
                <Box display="flex" flexDirection="column" gap={3} mt={1}>
                    <TextField
                        label="Code"
                        variant="outlined"
                        fullWidth
                        size="small"
                        value={form.code}
                        onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    />
                    <TextField
                        label="Discount %"
                        type="number"
                        variant="outlined"
                        fullWidth
                        size="small"
                        value={form.discountPercentage}
                        onChange={(e) => {
                            let value = Number(e.target.value);
                            if (value < 0) value = 0;
                            if (value > 100) value = 100;

                            setForm({ ...form, discountPercentage: value });
                        }}
                    />

                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DateTimePicker
                            label="Start Date"
                            value={form.startDateTime}
                            minDateTime={dayjs()} // now or future
                            onChange={(value) =>
                                setForm({ ...form, startDateTime: value })
                            }
                            slotProps={{
                                textField: {
                                    fullWidth: true,
                                    size: "small",
                                    error: !!errors.startDateTime, //  convert to boolean
                                    helperText: errors.startDateTime || "", //  use string
                                },
                            }}
                        />


                        <DateTimePicker
                            label="End Date"
                            value={form.endDateTime}
                            minDateTime={form.startDateTime || dayjs()}
                            onChange={(value) =>
                                setForm({ ...form, endDateTime: value })
                            }
                            slotProps={{
                                textField: {
                                    fullWidth: true,
                                    size: "small",
                                    error: !!errors.endDateTime,
                                    helperText: errors.endDateTime || "",
                                },
                            }}
                        />
                    </LocalizationProvider>


                    <TextField
                        label="Global Max Uses"
                        type="number"
                        inputProps={{ min: 1 }}
                        variant="outlined"
                        fullWidth
                        size="small"
                        value={form.globalMaxUses}
                        onChange={(e) => setForm({ ...form, globalMaxUses: Number(e.target.value) })}
                    />
                    <TextField
                        label="Per User Max Uses"
                        type="number"
                        inputProps={{ min: 1 }}
                        variant="outlined"
                        fullWidth
                        size="small"
                        value={form.perUserMaxUses}
                        onChange={(e) => setForm({ ...form, perUserMaxUses: Number(e.target.value) })}
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
                <Button
                    variant="contained"
                    onClick={handleCreate}
                    disabled={loading}
                >
                    {loading ? <CircularProgress size={20} /> : "Create"}
                </Button>

            </DialogActions>
        </Dialog>
    );
}
