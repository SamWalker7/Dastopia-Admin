import React, { useEffect, useState } from "react";
import { Paper, CircularProgress, Button, Box } from "@mui/material";
import PromoCodeTable from "./PromoCodeTable";
import CreatePromoCodeDialog from "./CreatePromoCodeDialog";
import EditPromoDialog from "./EditPromoDialog";
import { fetchPromoCodesApi } from "./promoCode.api";
import ConfirmDeleteDialog from "./ConfirmDeleteDialog";

export default function PromoCodeAnalytics() {
    const [promoCodes, setPromoCodes] = useState([]);
    const [loading, setLoading] = useState(true);

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    const [pageKeys, setPageKeys] = useState({ 0: null });

    const [openCreate, setOpenCreate] = useState(false);
    const [selectedPromo, setSelectedPromo] = useState(null);
    const [promoToDelete, setPromoToDelete] = useState(null);

    const loadPromoCodes = async (limit, pageIndex) => {
        setLoading(true);
        try {
            const res = await fetchPromoCodesApi({
                limit,
                lastKey: pageKeys[pageIndex],
            });

            setPromoCodes(res?.data?.promoCodes ?? []);
            setTotalCount(res?.data?.totalCount ?? 0);

            if (res?.data?.lastKey) {
                setPageKeys((prev) => ({
                    ...prev,
                    [pageIndex + 1]: res.data.lastKey,
                }));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setPage(0);
        setPageKeys({ 0: null });
        loadPromoCodes(rowsPerPage, 0);
    }, [rowsPerPage]);

    const handleChangePage = (_, newPage) => {
        setPage(newPage);
        loadPromoCodes(rowsPerPage, newPage);
    };

    return (
        <>
            <Button
                variant="contained"
                sx={{ mb: 2 }}
                onClick={() => setOpenCreate(true)}
            >
                Create Promo Code
            </Button>

            <Paper>
                {loading ? (
                    <Box
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                        height={256}
                    >
                        <CircularProgress />
                    </Box>
                ) : (
                    <PromoCodeTable
                        promoCodes={promoCodes}
                        page={page}
                        rowsPerPage={rowsPerPage}
                        totalCount={totalCount}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={setRowsPerPage}
                        onEditPromo={setSelectedPromo}
                        onDeletePromo={() => loadPromoCodes(rowsPerPage, page)}
                    />
                )}
            </Paper>


            <CreatePromoCodeDialog
                open={openCreate}
                onClose={() => setOpenCreate(false)}
                onSuccess={() => {
                    setOpenCreate(false);
                    setPage(0);
                    setPageKeys({ 0: null });
                    loadPromoCodes(rowsPerPage, 0);
                }}
            />

            <EditPromoDialog
                promo={selectedPromo}
                onClose={() => setSelectedPromo(null)}
                onSuccess={() => loadPromoCodes(rowsPerPage, page)}
            />


        </>
    );
}
