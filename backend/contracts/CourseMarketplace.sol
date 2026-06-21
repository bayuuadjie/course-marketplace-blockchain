// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title CourseMarketplace
/// @notice Smart contract marketplace kursus online: jual-beli akses kursus,
/// rating, dan penerbitan e-sertifikat — semuanya tercatat on-chain.
contract CourseMarketplace {
    struct Course {
        uint256 id;
        string title;
        string description;
        string contentURI;   // link materi (IPFS/URL), hanya untuk pembeli
        string thumbnailURI; // gambar thumbnail (URL atau base64 data URI)
        string category;     // kategori kursus, untuk filter di frontend
        uint256 price;       // harga dalam wei
        address payable instructor;
        bool isActive;
        uint256 ratingTotal; // akumulasi total bintang
        uint256 ratingCount; // jumlah orang yang memberi rating
    }

    struct Certificate {
        uint256 id;
        uint256 courseId;
        address student;
        uint256 issuedAt;
    }

    uint256 public courseCount;
    uint256 public certificateCount;

    mapping(uint256 => Course) public courses;
    mapping(uint256 => mapping(address => bool)) public purchases;
    mapping(uint256 => mapping(address => bool)) public hasRated;
    mapping(address => uint256) public earnings;

    mapping(uint256 => Certificate) public certificates; // certId => Certificate
    // courseId => student => certId (0 berarti belum punya sertifikat)
    mapping(uint256 => mapping(address => uint256)) public certificateOf;

    event CourseCreated(uint256 indexed id, address indexed instructor, string title, uint256 price);
    event CoursePurchased(uint256 indexed id, address indexed student, uint256 price);
    event CourseUpdated(uint256 indexed id, uint256 newPrice, bool isActive);
    event CourseRated(uint256 indexed id, address indexed student, uint8 stars);
    event Withdrawn(address indexed instructor, uint256 amount);
    event CertificateIssued(uint256 indexed certId, uint256 indexed courseId, address indexed student, uint256 issuedAt);

    modifier onlyInstructor(uint256 _id) {
        require(courses[_id].instructor == msg.sender, "Bukan pemilik course ini");
        _;
    }

    function createCourse(
        string memory _title,
        string memory _description,
        string memory _contentURI,
        string memory _thumbnailURI,
        string memory _category,
        uint256 _price
    ) external {
        require(bytes(_title).length > 0, "Judul tidak boleh kosong");
        require(_price > 0, "Harga harus lebih dari 0");

        courseCount++;
        courses[courseCount] = Course(
            courseCount,
            _title,
            _description,
            _contentURI,
            _thumbnailURI,
            _category,
            _price,
            payable(msg.sender),
            true,
            0,
            0
        );

        emit CourseCreated(courseCount, msg.sender, _title, _price);
    }

    function buyCourse(uint256 _id) external payable {
        Course memory c = courses[_id];
        require(c.id != 0, "Course tidak ditemukan");
        require(c.isActive, "Course sedang tidak aktif");
        require(!purchases[_id][msg.sender], "Anda sudah membeli course ini");
        require(msg.sender != c.instructor, "Instructor tidak bisa membeli course sendiri");
        require(msg.value == c.price, "Jumlah ETH tidak sesuai harga course");

        purchases[_id][msg.sender] = true;
        earnings[c.instructor] += msg.value;

        emit CoursePurchased(_id, msg.sender, msg.value);
    }

    /// @notice Memberi rating 1-5 bintang, hanya untuk yang sudah membeli course
    function rateCourse(uint256 _id, uint8 _stars) external {
        require(courses[_id].id != 0, "Course tidak ditemukan");
        require(purchases[_id][msg.sender], "Anda harus membeli course ini sebelum memberi rating");
        require(!hasRated[_id][msg.sender], "Anda sudah memberi rating untuk course ini");
        require(_stars >= 1 && _stars <= 5, "Rating harus antara 1-5");

        courses[_id].ratingTotal += _stars;
        courses[_id].ratingCount += 1;
        hasRated[_id][msg.sender] = true;

        emit CourseRated(_id, msg.sender, _stars);
    }

    /// @notice Menerbitkan e-sertifikat on-chain untuk student yang sudah membeli course
    function issueCertificate(uint256 _id) external returns (uint256) {
        require(courses[_id].id != 0, "Course tidak ditemukan");
        require(purchases[_id][msg.sender], "Anda harus membeli course ini untuk mendapat sertifikat");
        require(certificateOf[_id][msg.sender] == 0, "Sertifikat untuk course ini sudah pernah diterbitkan");

        certificateCount++;
        certificates[certificateCount] = Certificate(certificateCount, _id, msg.sender, block.timestamp);
        certificateOf[_id][msg.sender] = certificateCount;

        emit CertificateIssued(certificateCount, _id, msg.sender, block.timestamp);
        return certificateCount;
    }

    function withdraw() external {
        uint256 amount = earnings[msg.sender];
        require(amount > 0, "Tidak ada saldo untuk ditarik");

        earnings[msg.sender] = 0;
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Penarikan dana gagal");

        emit Withdrawn(msg.sender, amount);
    }

    function updateCourse(uint256 _id, uint256 _newPrice, bool _isActive) external onlyInstructor(_id) {
        require(_newPrice > 0, "Harga harus lebih dari 0");
        courses[_id].price = _newPrice;
        courses[_id].isActive = _isActive;
        emit CourseUpdated(_id, _newPrice, _isActive);
    }

    function hasPurchased(uint256 _id, address _student) external view returns (bool) {
        return purchases[_id][_student];
    }

    function getCourse(uint256 _id) external view returns (Course memory) {
        return courses[_id];
    }

    function getAllCourses() external view returns (Course[] memory) {
        Course[] memory result = new Course[](courseCount);
        for (uint256 i = 1; i <= courseCount; i++) {
            result[i - 1] = courses[i];
        }
        return result;
    }

    function getCertificate(uint256 _certId) external view returns (Certificate memory) {
        return certificates[_certId];
    }

    function getCertificateId(uint256 _courseId, address _student) external view returns (uint256) {
        return certificateOf[_courseId][_student];
    }
}
