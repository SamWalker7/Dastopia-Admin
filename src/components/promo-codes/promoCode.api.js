const BASE_URL =
    "https://oy0bs62jx8.execute-api.us-east-1.amazonaws.com/Prod/v1/admin/promo-codes";

const getToken = () =>
    JSON.parse(localStorage.getItem("admin"))?.AccessToken;

export const fetchPromoCodesApi = async ({ limit, lastKey }) => {
    const token = getToken();

    let url = `${BASE_URL}?status=all&limit=${limit}`;
    if (lastKey) url += `&lastKey=${lastKey}`;

    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("Failed to fetch promo codes");
    return res.json();
};

export const createPromoCodeApi = async (payload) => {
    const token = getToken();

    const res = await fetch(BASE_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });

    // if (!res.ok) throw new Error(res.body.message);
    return res;
};

export const updatePromoExpiryApi = async (id, endDateTime) => {
    const token = getToken();

    const res = await fetch(`${BASE_URL}/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            endDateTime,
        }),
    });

    if (!res.ok) throw new Error("Failed to update expiry date");
};
