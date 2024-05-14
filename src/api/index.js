import axios from "axios"
import { carQueryAPI, dastopiaAPI } from "../config/constants";

const url = (path) => (dastopiaAPI + path);

export const getMakes = async () => {
    try {
        const response = await axios({
            method: "GET",
            url: url('cmd=getMakes&year=2015'),
            headers: {
                'Content-Type': 'application/json',
                'Accept': '*/*',
                'Accept-Encoding': 'gzip ' + 'deflate',
                'User-Agent': 'runscope/0.1',
                'Connection': 'keep-alive',
            },
        });
        return response.data;
    } catch (e) {
        console.error(e);
    }
}

export const getModelByMake = async (make, year) => {
    try {
        const response = await axios({
            method: "GET",
            url: url(`cmd=getModels&make=${make}&year=${year}`),
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Headers': '*',
            },
        });
        console.log('res: ' + response.data);
        return response.data;
    } catch (e) {
        console.error(e);
    }
}

export const addVehicle = async (data) => {
    try {
        const response = await axios.post(url('add_vehicle'), {
            "operation": "create",
            "vehicleData": data,
        });
        return response.data;
    } catch (err) {
        console.error(err);
    }
}

export const getPreSignedURL = async (id, fileType, filename) => {
    try {
        const response = await axios.post(url('add_vehicle'), {
            "operation": "getPresignedUrl",
            'vehicleId': id,
			"contentType": fileType,
            filename
        });
        return response.data;
    } catch (err) {
        console.error(err);
    }
}

export const uplaodVehicleImagesToS3 = async(url, image) => {
    try {
        const response = await axios.put(url, image);
        return response;
    } catch (error) {
        console.error(error);
    }
}

export const getAllVehicles = async () => {
    try {
        const response = await axios.get(url('get_vehicles'));
        return response.data;
    } catch (err) {
        console.error(err);
    }
}