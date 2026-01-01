import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
} from "@mui/material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useState } from "react";
import dayjs from "dayjs";
import { createPromoCodeApi } from "./promoCode.api";

export default function CreatePromoCodeDialog({ open, onClose, onSuccess }) {
    const [form, setForm] = useState({
        code: "",
        discountPercentage: 0,
        startDateTime: dayjs(),
        endDateTime: null,
        globalMaxUses: 1000,
        perUserMaxUses: 2,
    });

    const handleCreate = async () => {

        let res;
        try {
            const startIso = form.startDateTime ? form.startDateTime.toISOString() : null;
            const endIso = form.endDateTime ? form.endDateTime.toISOString() : null;

             res = await createPromoCodeApi({
                ...form,
                startDateTime: startIso,
                endDateTime: endIso,
             });

            onSuccess();

        } catch (error) {
            // Check if the error response exists and contains the forbidden message
            const message =
                // res.body?.message ||
                error?.message ||
                "Something went wrong. Please try again.";

            if (res.status === 403) {
                alert("You do not have permission to perform this action.");
            } else {
                alert(message); // fallback for other errors
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
                        onChange={(e) => setForm({ ...form, code: e.target.value })}
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
                        <DatePicker
                            label="Start Date"
                            value={form.startDateTime}
                            onChange={(newValue) => setForm({ ...form, startDateTime: newValue })}
                            slotProps={{ textField: { fullWidth: true, size: "small", variant: "outlined" } }}
                        />
                        <DatePicker
                            label="End Date"
                            value={form.endDateTime}
                            onChange={(newValue) => setForm({ ...form, endDateTime: newValue })}
                            slotProps={{ textField: { fullWidth: true, size: "small", variant: "outlined" } }}
                        />
                    </LocalizationProvider>

                    <TextField
                        label="Global Max Uses"
                        type="number"
                        variant="outlined"
                        fullWidth
                        size="small"
                        value={form.globalMaxUses}
                        onChange={(e) => setForm({ ...form, globalMaxUses: Number(e.target.value) })}
                    />
                    <TextField
                        label="Per User Max Uses"
                        type="number"
                        variant="outlined"
                        fullWidth
                        size="small"
                        value={form.perUserMaxUses}
                        onChange={(e) => setForm({ ...form, perUserMaxUses: Number(e.target.value) })}
                    />
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose}>Cancel</Button>
                <Button variant="contained" onClick={handleCreate}>
                    Create
                </Button>
            </DialogActions>
        </Dialog>
    );
}
