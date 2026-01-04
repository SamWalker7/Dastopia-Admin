import React, { useEffect, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TablePagination,
    Typography,
    CircularProgress,
} from "@mui/material";

const statusColors = {
    pending: "#F59E0B",
    completed: "#10B981",
    expired: "#EF4444",
};

export default function PromoCodeAnalytics() {
    const [promoCodes, setPromoCodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [lastKey, setLastKey] = useState("");

    const fetchPromoCodes = async (limit = 10, lastKeyParam = "") => {
        setLoading(true);
        try {
            const token = JSON.parse(localStorage.getItem("admin"))?.AccessToken;
            if (!token) throw new Error("No access token found");

            let url = `https://oy0bs62jx8.execute-api.us-east-1.amazonaws.com/Prod/v1/admin/promo-codes?status=all&limit=${limit}`;
            if (lastKeyParam) url += `&lastKey=${lastKeyParam}`;

            const res = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) throw new Error("Failed to fetch promo codes");

            const data = await res.json();

            setPromoCodes(data.data.promoCodes);
            setTotalCount(data.data.totalCount || data.data.promoCodes.length);
            setLastKey(data.data.lastKey || "");
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPromoCodes(rowsPerPage, "");
    }, [rowsPerPage]);

    const handleChangePage = (event, newPage) => {
        // If navigating forward and there’s a lastKey, fetch next page
        if (newPage > page && lastKey) {
            fetchPromoCodes(rowsPerPage, lastKey);
        }
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <CircularProgress />
            </div>
        );
    }

    if (!promoCodes.length) {
        return (
            <Typography variant="body1" align="center" sx={{ mt: 4 }}>
                No referral data available.
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
                            <TableRow key={promo.id}>
                                <TableCell>{promo.code}</TableCell>

                                <TableCell>
                                    {promo.discountPercentage}%
                                </TableCell>

                                <TableCell>
                                    {promo.perUserMaxUses ?? "∞"}
                                </TableCell>

                                <TableCell>
                                    {promo.globalMaxUses ?? "∞"}
                                </TableCell>

                                <TableCell>
                                    {promo.currentGlobalUses ?? 0}
                                </TableCell>

                                <TableCell
                                    sx={{
                                        color: promo.isActive && promo.isExpired !== "true"
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

                                <TableCell>
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
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />
        </Paper>
    );
}
