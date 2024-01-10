"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cloudinary_1 = require("cloudinary");
const cors_1 = __importDefault(require("cors"));
const axios_1 = __importDefault(require("axios"));
const form_data_1 = __importDefault(require("form-data"));
const multer_1 = __importDefault(require("multer"));
const dotenv_1 = __importDefault(require("dotenv"));
const constants_1 = __importDefault(require("./constants"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({ storage: storage });
const DOLPIN_API_URL = constants_1.default.DOLPIN_API_URL || '';
const CLOUDINARY_API_URL = constants_1.default.CLOUDINARY_API_URL || '';
const PINATA_API_URL = constants_1.default.PINATA_API_URL || '';
const STARTON_BASE_URL = constants_1.default.STARTON_BASE_URL || '';
const STARTON_URL = constants_1.default.STARTON_URL || '';
const CLOUDINARY_CONFIG = {
    cloud_name: process.env.CLOUDINARY_CONFIG_CLOUD_NAME || '',
    api_key: process.env.CLOUDINARY_CONFIG_API_KEY || '',
    api_secret: process.env.CLOUDINARY_CONFIG_API_SECRET || '',
};
const PINATA_JWT = process.env.PINATA_JWT || '';
const STARTON_API_KEY = process.env.STARTON_API_KEY || '';
cloudinary_1.v2.config(CLOUDINARY_CONFIG);
const handleFileUpload = (config, req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const formData = new form_data_1.default();
        formData.append('file', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype,
        });
        yield config.handleFile(formData, req);
        res.json();
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
const dolpinConfig = {
    apiUrl: DOLPIN_API_URL,
    handleFile: (formData) => __awaiter(void 0, void 0, void 0, function* () {
        formData.append('name', 'file name');
        yield axios_1.default.post(DOLPIN_API_URL, formData, { headers: Object.assign({}, formData.getHeaders()) });
    }),
};
const cloudinaryConfig = {
    apiUrl: CLOUDINARY_API_URL,
    handleFile: (formData) => __awaiter(void 0, void 0, void 0, function* () {
        const timestamp = Math.floor(Date.now() / 1000);
        const signature = cloudinary_1.v2.utils.api_sign_request({ timestamp }, CLOUDINARY_CONFIG.api_secret);
        formData.append('api_key', CLOUDINARY_CONFIG.api_key);
        formData.append('timestamp', timestamp);
        formData.append('signature', signature);
        yield axios_1.default.post(CLOUDINARY_API_URL, formData);
    }),
};
const pinataConfig = {
    apiUrl: PINATA_API_URL,
    handleFile: (formData) => __awaiter(void 0, void 0, void 0, function* () {
        const pinataMetadata = JSON.stringify({ name: 'File name' });
        const pinataOptions = JSON.stringify({ cidVersion: 0 });
        formData.append('pinataMetadata', pinataMetadata);
        formData.append('pinataOptions', pinataOptions);
        yield axios_1.default.post(PINATA_API_URL, formData, {
            maxBodyLength: Infinity,
            headers: Object.assign(Object.assign({}, formData.getHeaders()), { Authorization: PINATA_JWT }),
        });
    }),
};
const startonConfig = {
    apiUrl: STARTON_URL,
    handleFile: (formData) => __awaiter(void 0, void 0, void 0, function* () {
        const startonApi = axios_1.default.create({
            baseURL: STARTON_BASE_URL,
            headers: { 'x-api-key': STARTON_API_KEY },
        });
        yield startonApi.post(STARTON_URL, formData, { headers: Object.assign({}, formData.getHeaders()) });
    }),
};
app.post('/upload/file', upload.single('file'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = JSON.parse(JSON.stringify(req.body));
    const selectedStorages = JSON.parse(body.selectedStorages);
    const storageConfigs = [
        { value: "Dolpin", config: dolpinConfig },
        { value: "Cloudinary", config: cloudinaryConfig },
        { value: "Pinata", config: pinataConfig },
        { value: "Starton", config: startonConfig }
    ];
    for (const storage of storageConfigs) {
        if (selectedStorages.some((s) => s.value === storage.value)) {
            yield handleFileUpload(storage.config, req, res);
        }
    }
}));
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
