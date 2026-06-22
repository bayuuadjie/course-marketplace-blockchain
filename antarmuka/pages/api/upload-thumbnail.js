import formidable from "formidable";
import fs from "fs";
import axios from "axios";
import FormData from "form-data";

export const config = {
  api: {
    bodyParser: false, // Wajib false untuk memproses file upload
  },
};

// Masukkan JWT Token yang kamu salin dari Pinata di sini
const PINATA_JWT = process.env.JWT_KEY;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const form = formidable({
    maxFileSize: 5 * 1024 * 1024, // Batasan file 5MB
  });

  try {
    const [fields, files] = await form.parse(req);
    const file = files.file?.[0];

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // 1. Membaca file dari storage lokal sementara
    const fileStream = fs.createReadStream(file.filepath);

    // 2. Mempersiapkan Form Data untuk dikirim ke API Pinata
    const formData = new FormData();
    formData.append("file", fileStream, file.originalFilename || "thumbnail.png");

    // 3. Melakukan POST Request ke server Pinata menggunakan JWT Token
    const pinataResponse = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${PINATA_JWT}`,
        },
      }
    );

    // 4. Mengambil CID dari respons Pinata
    const cid = pinataResponse.data.IpfsHash;
    const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${cid}`;

    // Kembalikan URL IPFS ke frontend agar bisa disimpan ke MetaMask/Hardhat
    res.status(200).json({ ipfsUrl, cid });
  } catch (error) {
    console.error("Upload error:", error.response?.data || error.message);
    res.status(500).json({ 
      error: "Failed to upload file", 
      detail: error.response?.data || error.message 
    });
  }
}