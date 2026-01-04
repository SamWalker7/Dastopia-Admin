import React, { useState } from "react";
import {
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Typography,
    IconButton,
} from "@mui/material";
import { Trash2, EditIcon } from "lucide-react";
import ConfirmDeleteDialog from "./ConfirmDeleteDialog";

export default function PromoCodeTable({
    promoCodes = [],
    page,
    rowsPerPage,
    totalCount,
    onPageChange,
    onRowsPerPageChange,
    onEditPromo,
    onDeletePromo
}) {
    const [promoToDelete, setPromoToDelete] = useState(null);

    if (promoCodes.length === 0) {
        return (
            <Typography align="center" sx={{ mt: 4 }}>
                No promo codes available
            </Typography>
        );
    }

    return (
        <>
            <Paper sx={{ width: "100%", overflow: "hidden", mt: 2 }}>
                <TableContainer sx={{ maxHeight: 600 }}>
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell>Code</TableCell>
                                <TableCell>Discount (%)</TableCell>
                                <TableCell>Per User Max Uses</TableCell>
                                <TableCell>Global Max Uses</TableCell>
                                <TableCell>Current Uses</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Start Date</TableCell>
                                <TableCell>End Date</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {promoCodes.map((promo) => (
                                <TableRow
                                    key={promo.id}
                                    hover
                                    sx={{ cursor: "pointer" }}
                                    onClick={() => onEditPromo?.(promo)}
                                >
                                    <TableCell>{promo.code}</TableCell>
                                    <TableCell>{promo.discountPercentage}%</TableCell>
                                    <TableCell>{promo.perUserMaxUses ?? "∞"}</TableCell>
                                    <TableCell>{promo.globalMaxUses ?? "∞"}</TableCell>
                                    <TableCell>{promo.currentGlobalUses ?? 0}</TableCell>
                                    <TableCell
                                        sx={{
                                            color: promo.isActive && promo.isExpired !== "true" ? "#10B981" : "#EF4444",
                                            fontWeight: 500,
                                        }}
                                    >
                                        {promo.isActive && promo.isExpired !== "true" ? "Active" : "Inactive"}
                                    </TableCell>
                                    <TableCell>{new Date(promo.startDateTime).toLocaleDateString()}</TableCell>
                                    <TableCell>{new Date(promo.endDateTime).toLocaleDateString()}</TableCell>

                                    {/* Action Buttons */}
                                    <TableCell>
                                        <IconButton
                                            color="error"
                                            onClick={(e) => {
                                                e.stopPropagation(); // STOP row click from firing
                                                setPromoToDelete(promo); // OPEN dialog
                                            }}
                                        >
                                            <Trash2 size={15}/>
                                        </IconButton>

                                        <IconButton
                                            color="primary"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEditPromo?.(promo);
                                            }}
                                        >
                                            <EditIcon size={15}/>
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={totalCount}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(e, newPage) => onPageChange(newPage)}
                    onRowsPerPageChange={(e) =>
                        onRowsPerPageChange(parseInt(e.target.value, 10))
                    }
                />
            </Paper>

            {/* Confirm Delete Dialog */}
            <ConfirmDeleteDialog
                open={!!promoToDelete} // make sure dialog uses open prop
                promo={promoToDelete}
                onClose={() => setPromoToDelete(null)}
                onDeleted={() => {
                    onDeletePromo?.(promoToDelete);
                    setPromoToDelete(null);
                }}
            />
        </>
    );
}
