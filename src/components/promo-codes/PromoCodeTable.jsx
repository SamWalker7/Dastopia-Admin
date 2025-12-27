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
} from "@mui/material";

export default function PromoCodeTable({
    promoCodes = [], // default to empty array
    page,
    rowsPerPage,
    totalCount,
    onPageChange,
    onRowsPerPageChange,
    onEditEndDate, 
}) {


    if (promoCodes.length === 0) {
        return (
            <Typography align="center" sx={{ mt: 4 }}>
                No promo codes available
            </Typography>
        );
    }

    return (
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
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {promoCodes.map((promo) => (
                            <TableRow key={promo.id} hover>
                                <TableCell>{promo.code}</TableCell>
                                <TableCell>{promo.discountPercentage}%</TableCell>
                                <TableCell>{promo.perUserMaxUses ?? "∞"}</TableCell>
                                <TableCell>{promo.globalMaxUses ?? "∞"}</TableCell>
                                <TableCell>{promo.currentGlobalUses ?? 0}</TableCell>
                                <TableCell
                                    sx={{
                                        color:
                                            promo.isActive && promo.isExpired !== "true"
                                                ? "#10B981"
                                                : "#EF4444",
                                        fontWeight: 500,
                                    }}
                                >
                                    {promo.isActive && promo.isExpired !== "true"
                                        ? "Active"
                                        : "Inactive"}
                                </TableCell>
                                <TableCell>
                                    {new Date(promo.startDateTime).toLocaleDateString()}
                                </TableCell>
                                <TableCell
                                    sx={{
                                        cursor: onEditEndDate ? "pointer" : "default",
                                        color: onEditEndDate ? "#2563EB" : "inherit",
                                    }}
                                    onClick={() => onEditEndDate?.(promo)}
                                >
                                    {new Date(promo.endDateTime).toLocaleDateString()}
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
    );
}
