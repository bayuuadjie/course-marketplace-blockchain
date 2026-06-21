/**
 * courseService.js
 * -----------------------------------------------------------
 * Kumpulan fungsi siap pakai untuk fitur marketplace kursus:
 * membuat course, membeli, rating, sertifikat, dan withdraw.
 * Dipanggil dari "antarmuka" (frontend) tanpa perlu tahu detail ethers.js.
 * -----------------------------------------------------------
 */

import { getContract, ethToWei, weiToEth } from "./web3Connector";

function formatCourse(c) {
  const ratingCount = Number(c.ratingCount);
  const ratingTotal = Number(c.ratingTotal);
  return {
    id: c.id.toString(),
    title: c.title,
    description: c.description,
    contentURI: c.contentURI,
    thumbnailURI: c.thumbnailURI,
    category: c.category || "Umum",
    priceEth: weiToEth(c.price),
    priceWei: c.price,
    instructor: c.instructor,
    isActive: c.isActive,
    ratingCount,
    averageRating: ratingCount > 0 ? ratingTotal / ratingCount : 0
  };
}

/** Mengambil seluruh daftar course dari blockchain */
export async function fetchAllCourses() {
  const contract = await getContract(false);
  const rawCourses = await contract.getAllCourses();
  return rawCourses.filter((c) => c.id.toString() !== "0").map(formatCourse);
}

/** Membuat course baru (transaksi - butuh signer/MetaMask) */
export async function createCourse({ title, description, contentURI, thumbnailURI, category, priceInEth }) {
  const contract = await getContract(true);
  const tx = await contract.createCourse(
    title,
    description,
    contentURI || "",
    thumbnailURI || "",
    category || "Umum",
    ethToWei(priceInEth)
  );
  await tx.wait();
  return tx.hash;
}

/** Membeli course (mengirim ETH sebesar harga course) */
export async function buyCourse(courseId, priceWei) {
  const contract = await getContract(true);
  const tx = await contract.buyCourse(courseId, { value: priceWei });
  await tx.wait();
  return tx.hash;
}

/** Memberi rating 1-5 bintang untuk course yang sudah dibeli */
export async function rateCourse(courseId, stars) {
  const contract = await getContract(true);
  const tx = await contract.rateCourse(courseId, stars);
  await tx.wait();
  return tx.hash;
}

/** Mengecek apakah address tertentu sudah memberi rating untuk course tertentu */
export async function hasRatedCourse(courseId, address) {
  const contract = await getContract(false);
  return await contract.hasRated(courseId, address);
}

/** Mengecek apakah address tertentu sudah membeli course tertentu */
export async function hasPurchasedCourse(courseId, address) {
  const contract = await getContract(false);
  return await contract.hasPurchased(courseId, address);
}

/** Mengambil saldo (earnings) instructor yang belum ditarik */
export async function getInstructorEarnings(address) {
  const contract = await getContract(false);
  const earnings = await contract.earnings(address);
  return weiToEth(earnings);
}

/** Instructor menarik dana hasil penjualan course */
export async function withdrawEarnings() {
  const contract = await getContract(true);
  const tx = await contract.withdraw();
  await tx.wait();
  return tx.hash;
}

/** Menerbitkan e-sertifikat on-chain untuk course yang sudah dibeli */
export async function issueCertificate(courseId) {
  const contract = await getContract(true);
  const tx = await contract.issueCertificate(courseId);
  await tx.wait();
  return tx.hash;
}

/** Mengambil id sertifikat milik student untuk course tertentu (0 = belum punya) */
export async function getCertificateId(courseId, address) {
  const contract = await getContract(false);
  const id = await contract.getCertificateId(courseId, address);
  return id.toString();
}

/** Mengambil detail sertifikat berdasarkan id-nya */
export async function getCertificateDetail(certId) {
  const contract = await getContract(false);
  const cert = await contract.getCertificate(certId);
  const course = await contract.getCourse(cert.courseId);

  return {
    id: cert.id.toString(),
    courseId: cert.courseId.toString(),
    student: cert.student,
    issuedAt: new Date(Number(cert.issuedAt) * 1000),
    courseTitle: course.title,
    instructor: course.instructor
  };
}
