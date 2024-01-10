"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DOLPIN_API_URL = 'https://gateway.dolpin.io/api/v1/documents/upload-in-cluster-with-api?api_token=82b8e6565bdf47d2afb43728f16128f0';
const CLOUDINARY_API_URL = 'https://api.cloudinary.com/v1_1/dmpjlpdrw/image/upload';
const PINATA_API_URL = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
const STARTON_BASE_URL = 'https://api.starton.com';
const STARTON_URL = '/v3/ipfs/file';
const constants = {
    DOLPIN_API_URL,
    CLOUDINARY_API_URL,
    PINATA_API_URL,
    STARTON_BASE_URL,
    STARTON_URL,
};
exports.default = constants;
