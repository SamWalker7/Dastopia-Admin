import React from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TablePagination,
} from "@mui/material";

export default function ReferralTable({
    referrals = [],
    page = 0,
    rowsPerPage = 10,
    totalCount = 0,
    onPageChange,
    onRowsPerPageChange,
}) {
    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Referral ID</TableCell>
                        <TableCell>Referred User ID</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Commission (ETB)</TableCell>
                        <TableCell align="center">Commission Status</TableCell>
                    </TableRow>
                </TableHead>

                <TableBody>
                    {referrals.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} align="center">
                                No referral records found
                            </TableCell>
                        </TableRow>
                    ) : (
                        referrals.map((row) => (
                            <TableRow key={row.id}>
                                <TableCell>{row.id}</TableCell>
                                <TableCell>{row.referredUserId}</TableCell>
                                <TableCell sx={{ textTransform: "capitalize" }}>
                                    {row.status}
                                </TableCell>
                                <TableCell align="right">
                                    {Number(row.commissionAmount || 0).toFixed(2)}
                                </TableCell>
                                <TableCell
                                    align="center"
                                    sx={{
                                        textTransform: "capitalize",
                                        color:
                                            row.commissionStatus === "paid"
                                                ? "green"
                                                : "orange",
                                    }}
                                >
                                    {row.commissionStatus}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>

            <TablePagination
                component="div"
                count={totalCount}
                page={page}
                rowsPerPage={rowsPerPage}
                onPageChange={(_, newPage) => onPageChange(newPage)}
                onRowsPerPageChange={(e) =>
                    onRowsPerPageChange(parseInt(e.target.value, 10))
                }
                rowsPerPageOptions={[5, 10, 25, 50]}
            />
        </TableContainer>
    );
}
