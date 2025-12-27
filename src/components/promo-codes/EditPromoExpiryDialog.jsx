import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
} from "@mui/material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { updatePromoExpiryApi } from "./promoCode.api";

export default function EditPromoExpiryDialog({ promo, onClose, onSuccess }) {
    if (!promo) return null;

    const handleSave = async (newDate) => {
        await updatePromoExpiryApi(promo.id, newDate.toISOString());
        onClose();
        onSuccess();
    };

    return (
        <Dialog open={!!promo} onClose={onClose}>
            <DialogTitle>Edit Expiry Date</DialogTitle>

            <DialogContent>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                        label="End Date"
                        defaultValue={dayjs(promo.endDateTime)}
                        onChange={handleSave}
                    />
                </LocalizationProvider>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
            </DialogActions>
        </Dialog>
    );
}
