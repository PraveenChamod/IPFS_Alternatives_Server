import express, { Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import cors from 'cors';
import axios from 'axios';
import FormData from 'form-data';
import multer from 'multer';
import dotenv from 'dotenv';
import constants from './constants';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const DOLPIN_API_URL: string = constants.DOLPIN_API_URL || '';
const CLOUDINARY_API_URL: string = constants.CLOUDINARY_API_URL || '';
const PINATA_API_URL: string = constants.PINATA_API_URL || '';
const STARTON_BASE_URL: string = constants.STARTON_BASE_URL || '';
const STARTON_URL: string = constants.STARTON_URL || '';
type CloudinaryConfig = {
    cloud_name: string;
    api_key: string;
    api_secret: string;
};
const CLOUDINARY_CONFIG: CloudinaryConfig = {
    cloud_name: process.env.CLOUDINARY_CONFIG_CLOUD_NAME || '',
    api_key: process.env.CLOUDINARY_CONFIG_API_KEY || '',
    api_secret: process.env.CLOUDINARY_CONFIG_API_SECRET || '',
};
const PINATA_JWT: string = process.env.PINATA_JWT || '';
const STARTON_API_KEY: string = process.env.STARTON_API_KEY || '';

cloudinary.config(CLOUDINARY_CONFIG);

interface FileUploadConfig {
    apiUrl: string;
    handleFile: (formData: FormData, req: Request) => Promise<void>;
}

const handleFileUpload = async (config: FileUploadConfig, req: Request, res: Response) => {
    try {
        const formData = new FormData();
        formData.append('file', (req.file as any).buffer, {
            filename: (req.file as any).originalname,
            contentType: (req.file as any).mimetype,
        });
        await config.handleFile(formData, req);
        res.json();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const dolpinConfig: FileUploadConfig = {
    apiUrl: DOLPIN_API_URL,
    handleFile: async (formData: FormData) => {
        formData.append('name', 'file name');
        await axios.post(DOLPIN_API_URL, formData, { headers: { ...formData.getHeaders() } });
    },
};

const cloudinaryConfig: FileUploadConfig = {
    apiUrl: CLOUDINARY_API_URL,
    handleFile: async (formData: FormData) => {
        const timestamp = Math.floor(Date.now() / 1000);
        const signature = cloudinary.utils.api_sign_request(
            { timestamp },
            CLOUDINARY_CONFIG.api_secret
        );
        formData.append('api_key', CLOUDINARY_CONFIG.api_key);
        formData.append('timestamp', timestamp);
        formData.append('signature', signature);
        await axios.post(CLOUDINARY_API_URL, formData);
    },
};

const pinataConfig: FileUploadConfig = {
    apiUrl: PINATA_API_URL,
    handleFile: async (formData: FormData) => {
        const pinataMetadata = JSON.stringify({ name: 'File name' });
        const pinataOptions = JSON.stringify({ cidVersion: 0 });
        formData.append('pinataMetadata', pinataMetadata);
        formData.append('pinataOptions', pinataOptions);
        await axios.post(PINATA_API_URL, formData, {
            maxBodyLength: Infinity,
            headers: { ...formData.getHeaders(), Authorization: PINATA_JWT },
        });
    },
};

const startonConfig: FileUploadConfig = {
    apiUrl: STARTON_URL,
    handleFile: async (formData: FormData) => {
        const startonApi = axios.create({
            baseURL: STARTON_BASE_URL,
            headers: { 'x-api-key': STARTON_API_KEY },
        });
        await startonApi.post(STARTON_URL, formData, { headers: { ...formData.getHeaders() } });
    },
};

app.post('/upload/file', upload.single('file'), async (req: Request, res: Response) => {
    const body = JSON.parse(JSON.stringify(req.body));
    const selectedStorages = JSON.parse(body.selectedStorages);

    const storageConfigs = [
        { value: "Dolpin", config: dolpinConfig },
        { value: "Cloudinary", config: cloudinaryConfig },
        { value: "Pinata", config: pinataConfig },
        { value: "Starton", config: startonConfig }
    ];

    for (const storage of storageConfigs) {
        if (selectedStorages.some((s: { value: string; }) => s.value === storage.value)) {
            await handleFileUpload(storage.config, req, res);
        }
    }
});

const PORT: number = 3001;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});