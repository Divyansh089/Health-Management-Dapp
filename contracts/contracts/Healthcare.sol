// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract HealthcareLite {
    // --- Roles ---
    struct Doctor {
        uint256 id;
        string ipfs;          // profile JSON
        address account;
        bool approved;
        uint256 appointments; // simple stats
        uint256 successes;
    }

    struct Patient {
        uint256 id;
        string ipfs;          // profile JSON
        address account;
    }

    // --- Domain ---
    struct Medicine {
        uint256 id;
        string ipfs;          // metadata JSON
        uint256 priceWei;     // price per unit
        uint256 stock;        // units available
        bool active;
    }

    struct Appointment {
        uint256 id;
        uint256 patientId;
        uint256 doctorId;
        uint256 startAt;      // unix timestamp
        bool open;
    }

    struct Prescription {
        uint256 id;
        uint256 medicineId;
        uint256 patientId;
        uint256 doctorId;
        uint256 date;         // unix timestamp
    }

    // --- Storage ---
    address payable public admin;

    uint256 public doctorRegFeeWei = 0.0025 ether;
    uint256 public patientRegFeeWei = 0.00025 ether;
    uint256 public appointmentFeeWei = 0.0025 ether;

    uint256 public doctorCount;
    uint256 public patientCount;
    uint256 public medicineCount;
    uint256 public appointmentCount;
    uint256 public prescriptionCount;

    mapping(uint256 => Doctor) public doctors;
    mapping(uint256 => Patient) public patients;
    mapping(uint256 => Medicine) public medicines;
    mapping(uint256 => Appointment) public appointments;
    mapping(uint256 => Prescription) public prescriptions;

    mapping(address => uint256) public doctorIdByAddress;  // 0 if none
    mapping(address => uint256) public patientIdByAddress; // 0 if none

    // --- Events ---
    event DoctorRegistered(uint256 id, address account);
    event DoctorApproved(uint256 id, bool approved);
    event PatientRegistered(uint256 id, address account);

    event MedicineAdded(uint256 id, uint256 priceWei, uint256 stock);
    event MedicinePrice(uint256 id, uint256 priceWei);
    event MedicineStock(uint256 id, uint256 stock);
    event MedicineActive(uint256 id, bool active);

    event AppointmentBooked(uint256 id, uint256 patientId, uint256 doctorId, uint256 startAt);
    event AppointmentCompleted(uint256 id);

    event MedicinePrescribed(uint256 id, uint256 medicineId, uint256 patientId, uint256 doctorId);
    event MedicineBought(uint256 patientId, uint256 medicineId, uint256 qty, uint256 paidWei);

    event FeesUpdated(uint256 doctorReg, uint256 patientReg, uint256 apptFee);
    event AdminUpdated(address newAdmin);

    // --- Modifiers ---
    modifier onlyAdmin() {
        require(msg.sender == admin, "ADMIN_ONLY");
        _;
    }

    modifier onlyRegisteredDoctor() {
        require(doctorIdByAddress[msg.sender] != 0, "DOCTOR_ONLY");
        _;
    }

    modifier onlyApprovedDoctor() {
        uint256 id = doctorIdByAddress[msg.sender];
        require(id != 0 && doctors[id].approved, "APPROVED_DOCTOR_ONLY");
        _;
    }

    // simple reentrancy guard
    bool private _locked;
    modifier nonReentrant() {
        require(!_locked, "REENTRANCY");
        _locked = true;
        _;
        _locked = false;
    }

    constructor() {
        admin = payable(msg.sender);
    }

    // --- Admin: fees, admin, medicines, approvals ---
    function setFees(
        uint256 _doctorRegFeeWei,
        uint256 _patientRegFeeWei,
        uint256 _appointmentFeeWei
    ) external onlyAdmin {
        doctorRegFeeWei = _doctorRegFeeWei;
        patientRegFeeWei = _patientRegFeeWei;
        appointmentFeeWei = _appointmentFeeWei;
        emit FeesUpdated(_doctorRegFeeWei, _patientRegFeeWei, _appointmentFeeWei);
    }

    function setAdmin(address payable _new) external onlyAdmin {
        require(_new != address(0), "BAD_ADDR");
        admin = _new;
        emit AdminUpdated(_new);
    }

    function addMedicine(string calldata ipfs, uint256 priceWei, uint256 stock) external onlyAdmin {
        require(priceWei > 0, "PRICE_ZERO");
        medicineCount++;
        medicines[medicineCount] = Medicine(medicineCount, ipfs, priceWei, stock, true);
        emit MedicineAdded(medicineCount, priceWei, stock);
    }

    function setMedicinePrice(uint256 id, uint256 priceWei) external onlyAdmin {
        require(id > 0 && id <= medicineCount, "NO_MED");
        require(priceWei > 0, "PRICE_ZERO");
        medicines[id].priceWei = priceWei;
        emit MedicinePrice(id, priceWei);
    }

    function setMedicineStock(uint256 id, uint256 stock) external onlyAdmin {
        require(id > 0 && id <= medicineCount, "NO_MED");
        medicines[id].stock = stock;
        emit MedicineStock(id, stock);
    }

    function toggleMedicine(uint256 id) external onlyAdmin {
        require(id > 0 && id <= medicineCount, "NO_MED");
        medicines[id].active = !medicines[id].active;
        emit MedicineActive(id, medicines[id].active);
    }

    function approveDoctor(uint256 id, bool value) external onlyAdmin {
        require(id > 0 && id <= doctorCount, "NO_DOC");
        doctors[id].approved = value;
        emit DoctorApproved(id, value);
    }

    // --- Registration ---
    function registerDoctor(string calldata ipfs) external payable nonReentrant {
        require(msg.value == doctorRegFeeWei, "BAD_FEE");
        require(doctorIdByAddress[msg.sender] == 0, "DOC_EXISTS");

        doctorCount++;
        doctors[doctorCount] = Doctor({
            id: doctorCount,
            ipfs: ipfs,
            account: msg.sender,
            approved: false,
            appointments: 0,
            successes: 0
        });
        doctorIdByAddress[msg.sender] = doctorCount;

        admin.transfer(msg.value);
        emit DoctorRegistered(doctorCount, msg.sender);
    }

    function registerPatient(string calldata ipfs) external payable nonReentrant {
        require(msg.value == patientRegFeeWei, "BAD_FEE");
        require(patientIdByAddress[msg.sender] == 0, "PAT_EXISTS");

        patientCount++;
        patients[patientCount] = Patient({ id: patientCount, ipfs: ipfs, account: msg.sender });
        patientIdByAddress[msg.sender] = patientCount;

        admin.transfer(msg.value);
        emit PatientRegistered(patientCount, msg.sender);
    }

    // --- Appointments ---
    function bookAppointment(uint256 patientId, uint256 doctorId, uint256 startAt)
        external
        payable
        nonReentrant
    {
        require(patientIdByAddress[msg.sender] == patientId && patientId != 0, "NOT_PATIENT");
        require(doctorId > 0 && doctorId <= doctorCount, "NO_DOC");
        require(doctors[doctorId].approved, "DOC_NOT_APPROVED");
        require(msg.value == appointmentFeeWei, "BAD_FEE");
        require(startAt > block.timestamp, "PAST_TIME");

        appointmentCount++;
        appointments[appointmentCount] = Appointment({
            id: appointmentCount,
            patientId: patientId,
            doctorId: doctorId,
            startAt: startAt,
            open: true
        });

        // 10% admin, 90% doctor
        uint256 adminShare = msg.value / 10;
        uint256 doctorShare = msg.value - adminShare;
        admin.transfer(adminShare);
        payable(doctors[doctorId].account).transfer(doctorShare);

        doctors[doctorId].appointments += 1;

        emit AppointmentBooked(appointmentCount, patientId, doctorId, startAt);
    }

    function completeAppointment(uint256 appointmentId) external onlyRegisteredDoctor {
        require(appointmentId > 0 && appointmentId <= appointmentCount, "NO_APPT");
        Appointment storage ap = appointments[appointmentId];
        require(ap.open, "CLOSED");
        require(doctors[ap.doctorId].account == msg.sender, "NOT_ASSIGNED");

        ap.open = false;
        doctors[ap.doctorId].successes += 1;

        emit AppointmentCompleted(appointmentId);
    }

    // --- Prescriptions (approved doctors only) ---
    function prescribe(uint256 patientId, uint256 medicineId) external onlyApprovedDoctor {
        require(patientId > 0 && patientId <= patientCount, "NO_PAT");
        require(medicineId > 0 && medicineId <= medicineCount, "NO_MED");

        prescriptionCount++;
        prescriptions[prescriptionCount] = Prescription({
            id: prescriptionCount,
            medicineId: medicineId,
            patientId: patientId,
            doctorId: doctorIdByAddress[msg.sender],
            date: block.timestamp
        });

        emit MedicinePrescribed(prescriptionCount, medicineId, patientId, doctorIdByAddress[msg.sender]);
    }

    // --- Commerce ---
    function buyMedicine(uint256 patientId, uint256 medicineId, uint256 qty)
        external
        payable
        nonReentrant
    {
        require(patientIdByAddress[msg.sender] == patientId && patientId != 0, "NOT_PATIENT");
        require(medicineId > 0 && medicineId <= medicineCount, "NO_MED");
        require(qty > 0, "QTY_ZERO");

        Medicine storage m = medicines[medicineId];
        require(m.active, "INACTIVE");
        require(m.stock >= qty, "NO_STOCK");

        uint256 total = m.priceWei * qty;
        require(msg.value == total, "BAD_PAYMENT");

        m.stock -= qty;
        admin.transfer(msg.value); // simple sink to admin

        emit MedicineBought(patientId, medicineId, qty, msg.value);
    }

    // --- Minimal views ---
    function getDoctorId(address account) external view returns (uint256) {
        return doctorIdByAddress[account];
    }

    function getPatientId(address account) external view returns (uint256) {
        return patientIdByAddress[account];
    }

    function getAppointmentsByPatient(uint256 patientId) external view returns (Appointment[] memory) {
        uint256 count;
        for (uint256 i = 1; i <= appointmentCount; i++) {
            if (appointments[i].patientId == patientId) count++;
        }
        Appointment[] memory list = new Appointment[](count);
        uint256 idx;
        for (uint256 i = 1; i <= appointmentCount; i++) {
            if (appointments[i].patientId == patientId) list[idx++] = appointments[i];
        }
        return list;
    }

    function getAppointmentsByDoctor(uint256 doctorId) external view returns (Appointment[] memory) {
        uint256 count;
        for (uint256 i = 1; i <= appointmentCount; i++) {
            if (appointments[i].doctorId == doctorId) count++;
        }
        Appointment[] memory list = new Appointment[](count);
        uint256 idx;
        for (uint256 i = 1; i <= appointmentCount; i++) {
            if (appointments[i].doctorId == doctorId) list[idx++] = appointments[i];
        }
        return list;
    }
}
