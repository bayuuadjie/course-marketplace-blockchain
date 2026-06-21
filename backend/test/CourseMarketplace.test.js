const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CourseMarketplace", function () {
  let contract;
  let instructor, student, other;

  beforeEach(async function () {
    [instructor, student, other] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("CourseMarketplace");
    contract = await Factory.deploy();
    await contract.waitForDeployment();
  });

  async function buatCourseContoh() {
    await contract
      .connect(instructor)
      .createCourse(
        "Belajar Solidity",
        "Kursus dasar Solidity",
        "ipfs://materi",
        "ipfs://thumbnail",
        "Programming",
        ethers.parseEther("0.1")
      );
  }

  it("berhasil membuat course baru", async function () {
    await buatCourseContoh();
    const course = await contract.getCourse(1);
    expect(course.title).to.equal("Belajar Solidity");
    expect(course.category).to.equal("Programming");
    expect(course.price).to.equal(ethers.parseEther("0.1"));
    expect(course.instructor).to.equal(instructor.address);
  });

  it("student bisa membeli course dengan harga yang sesuai", async function () {
    await buatCourseContoh();
    await contract.connect(student).buyCourse(1, { value: ethers.parseEther("0.1") });
    expect(await contract.hasPurchased(1, student.address)).to.equal(true);
  });

  it("gagal membeli jika ETH yang dikirim tidak sesuai harga", async function () {
    await buatCourseContoh();
    await expect(
      contract.connect(student).buyCourse(1, { value: ethers.parseEther("0.01") })
    ).to.be.revertedWith("Jumlah ETH tidak sesuai harga course");
  });

  it("hanya pembeli yang bisa memberi rating, satu kali", async function () {
    await buatCourseContoh();
    await contract.connect(student).buyCourse(1, { value: ethers.parseEther("0.1") });

    await expect(contract.connect(other).rateCourse(1, 5)).to.be.revertedWith(
      "Anda harus membeli course ini sebelum memberi rating"
    );

    await contract.connect(student).rateCourse(1, 5);
    const course = await contract.getCourse(1);
    expect(course.ratingTotal).to.equal(5);
    expect(course.ratingCount).to.equal(1);

    await expect(contract.connect(student).rateCourse(1, 4)).to.be.revertedWith(
      "Anda sudah memberi rating untuk course ini"
    );
  });

  it("pembeli bisa menerbitkan sertifikat satu kali per course", async function () {
    await buatCourseContoh();
    await contract.connect(student).buyCourse(1, { value: ethers.parseEther("0.1") });

    await contract.connect(student).issueCertificate(1);
    const certId = await contract.getCertificateId(1, student.address);
    expect(certId).to.equal(1);

    const cert = await contract.getCertificate(certId);
    expect(cert.student).to.equal(student.address);
    expect(cert.courseId).to.equal(1);

    await expect(contract.connect(student).issueCertificate(1)).to.be.revertedWith(
      "Sertifikat untuk course ini sudah pernah diterbitkan"
    );
  });

  it("instructor bisa menarik (withdraw) hasil penjualan", async function () {
    await buatCourseContoh();
    await contract.connect(student).buyCourse(1, { value: ethers.parseEther("0.1") });

    const balanceSebelum = await ethers.provider.getBalance(instructor.address);
    const tx = await contract.connect(instructor).withdraw();
    const receipt = await tx.wait();
    const gasUsed = receipt.gasUsed * receipt.gasPrice;
    const balanceSesudah = await ethers.provider.getBalance(instructor.address);

    expect(balanceSesudah).to.equal(balanceSebelum + ethers.parseEther("0.1") - gasUsed);
  });
});
