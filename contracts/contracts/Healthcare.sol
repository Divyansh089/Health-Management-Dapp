// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Healthcare {
    // --- Domain data --------------------------------------------------------------
    struct Doctor {
        uint256 id;
        string ipfs; // profile metadata CID / URL
        address account;
        bool approved;
        uint256 appointments;
        uint256 successes;
    }

    struct Patient {
        uint256 id;
        string ipfs;
        address account;
    }

    struct Medicine {
        uint256 id;
        string ipfs;
        uint256 priceWei;
        uint256 stock;
        bool active;
    }

    struct Appointment {
        uint256 id;
        uint256 patientId;
        uint256 doctorId;
        uint256 startAt;
        bool open;
        uint256 chatId; // optional chat session created for this appointment
    }

    struct Prescription {
        uint256 id;
        uint256 medicineId;
        uint256 patientId;
        uint256 doctorId;
        uint256 date;
        uint16 durationDays;
        uint256 chatId;
        string notesCid;
    }

    struct ChatSession {
        uint256 id;
        uint256 appointmentId;
        uint256 patientId;
        uint256 doctorId;
        uint256 createdAt;
        uint256 lastMessageAt;
        bool closed;
        string metadataCid;
    }

    struct MedicineRequest {
        uint256 id;
        uint256 doctorId;
        string metadataCid;
        uint256 createdAt;
        bool processed;
    }

    struct RevenuePoint {
        uint256 day;
        uint256 amountWei;
    }

    // --- Storage ---------------------------------------------------------------------
    address payable public admin;

    uint256 public doctorRegFeeWei = 0.0025 ether;
    uint256 public patientRegFeeWei = 0.00025 ether;
    uint256 public appointmentFeeWei = 0.0025 ether;

    uint256 public doctorCount;
    uint256 public patientCount;
    uint256 public medicineCount;
    uint256 public appointmentCount;
    uint256 public prescriptionCount;
    uint256 public chatCount;
    uint256 public medicineRequestCount;
    uint256 public totalRevenueWei;

    mapping(uint256 => Doctor) public doctors;
    mapping(uint256 => Patient) public patients;
    mapping(uint256 => Medicine) public medicines;
    mapping(uint256 => Appointment) public appointments;
    mapping(uint256 => Prescription) public prescriptions;
    mapping(uint256 => ChatSession) public chats;
    mapping(uint256 => MedicineRequest) public medicineRequests;

    mapping(address => uint256) public doctorIdByAddress;
    mapping(address => uint256) public patientIdByAddress;
    mapping(uint256 => uint256) public chatIdByAppointment;

    mapping(uint256 => uint256) private _revenueByDay;
    mapping(uint256 => bool) private _revenueDaySeen;
    uint256[] private _revenueDays;

    // --- Activity enum ---------------------------------------------------------------
    uint8 private constant ACTIVITY_DOCTOR_REGISTERED = 1;
    uint8 private constant ACTIVITY_PATIENT_REGISTERED = 2;
    uint8 private constant ACTIVITY_APPOINTMENT_BOOKED = 3;
    uint8 private constant ACTIVITY_APPOINTMENT_COMPLETED = 4;
    uint8 private constant ACTIVITY_MEDICINE_ADDED = 5;
    uint8 private constant ACTIVITY_MEDICINE_UPDATED = 6;
    uint8 private constant ACTIVITY_MEDICINE_PURCHASED = 7;
    uint8 private constant ACTIVITY_CHAT_STARTED = 8;
    uint8 private constant ACTIVITY_CHAT_MESSAGE = 9;
    uint8 private constant ACTIVITY_CHAT_CLOSED = 10;
    uint8 private constant ACTIVITY_PRESCRIPTION_CREATED = 11;
    uint8 private constant ACTIVITY_MEDICINE_REQUEST_CREATED = 12;
    uint8 private constant ACTIVITY_MEDICINE_REQUEST_STATUS = 13;
    uint8 private constant ACTIVITY_PLATFORM_UPDATED = 14;

    // --- Events (backwards compatible) -----------------------------------------------
    event DoctorRegistered(uint256 id, address account);
    event DoctorApproved(uint256 id, bool approved);
    event PatientRegistered(uint256 id, address account);

    event MedicineAdded(uint256 id, uint256 priceWei, uint256 stock);
    event MedicinePrice(uint256 id, uint256 priceWei);
    event MedicineStock(uint256 id, uint256 stock);
    event MedicineActive(uint256 id, bool active);

    event AppointmentBooked(
        uint256 id,
        uint256 patientId,
        uint256 doctorId,
        uint256 startAt
    );
    event AppointmentCompleted(uint256 id);

    event MedicinePrescribed(
        uint256 id,
        uint256 medicineId,
        uint256 patientId,
        uint256 doctorId
    );
    event MedicineBought(
        uint256 patientId,
        uint256 medicineId,
        uint256 qty,
        uint256 paidWei
    );

    event FeesUpdated(uint256 doctorReg, uint256 patientReg, uint256 apptFee);
    event AdminUpdated(address newAdmin);

    // New analytic / notification events
    event RevenueRecorded(
        uint256 indexed day,
        uint256 amountWei,
        uint256 cumulativeDailyWei,
        uint256 totalRevenueWei
    );
    event SystemActivity(
        uint8 indexed kind,
        uint256 indexed refId,
        address indexed actor,
        uint256 patientId,
        uint256 doctorId,
        uint256 amountWei,
        string data
    );

    event ChatStarted(
        uint256 indexed chatId,
        uint256 indexed appointmentId,
        uint256 patientId,
        uint256 doctorId,
        string metadataCid
    );
    event ChatMessageLogged(
        uint256 indexed chatId,
        address indexed sender,
        string messageCid,
        uint256 timestamp
    );
    event ChatClosed(
        uint256 indexed chatId,
        address indexed actor,
        uint256 closedAt
    );
    event ChatMetadataUpdated(uint256 indexed chatId, string metadataCid);

    event MedicineRequestCreated(
        uint256 indexed id,
        uint256 indexed doctorId,
        string metadataCid,
        address doctorAccount
    );
    event MedicineRequestStatusUpdated(
        uint256 indexed id,
        bool processed,
        uint256 timestamp
    );

    // --- Modifiers -------------------------------------------------------------------
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

    // Simple reentrancy guard
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

    // --- Internal helpers ------------------------------------------------------------
    function _emitActivity(
        uint8 kind,
        uint256 refId,
        address actor,
        uint256 patientId,
        uint256 doctorId,
        uint256 amountWei,
        string memory data
    ) internal {
        emit SystemActivity(
            kind,
            refId,
            actor,
            patientId,
            doctorId,
            amountWei,
            data
        );
    }

    function _recordRevenue(uint256 amountWei) internal {
        if (amountWei == 0) {
            return;
        }
        totalRevenueWei += amountWei;
        uint256 day = block.timestamp / 1 days;
        uint256 nextDaily = _revenueByDay[day] + amountWei;
        _revenueByDay[day] = nextDaily;
        if (!_revenueDaySeen[day]) {
            _revenueDaySeen[day] = true;
            _revenueDays.push(day);
        }
        emit RevenueRecorded(day, amountWei, nextDaily, totalRevenueWei);
    }

    function _isDoctor(address account, uint256 doctorId) internal view returns (bool) {
        if (doctorId == 0) return false;
        return doctors[doctorId].account == account;
    }

    function _isPatient(address account, uint256 patientId) internal view returns (bool) {
        if (patientId == 0) return false;
        return patients[patientId].account == account;
    }

    // --- Admin configuration ---------------------------------------------------------
    function setFees(
        uint256 _doctorRegFeeWei,
        uint256 _patientRegFeeWei,
        uint256 _appointmentFeeWei
    ) external onlyAdmin {
        doctorRegFeeWei = _doctorRegFeeWei;
        patientRegFeeWei = _patientRegFeeWei;
        appointmentFeeWei = _appointmentFeeWei;
        emit FeesUpdated(_doctorRegFeeWei, _patientRegFeeWei, _appointmentFeeWei);
        _emitActivity(
            ACTIVITY_PLATFORM_UPDATED,
            0,
            msg.sender,
            0,
            0,
            0,
            "fees"
        );
    }

    function setAdmin(address payable _new) external onlyAdmin {
        require(_new != address(0), "BAD_ADDR");
        admin = _new;
        emit AdminUpdated(_new);
    }

    // --- Medicine management ---------------------------------------------------------
    function addMedicine(
        string calldata ipfs,
        uint256 priceWei,
        uint256 stock
    ) external onlyAdmin {
        require(bytes(ipfs).length != 0, "IPFS_REQUIRED");
        require(priceWei > 0, "PRICE_ZERO");

        medicineCount++;
        medicines[medicineCount] = Medicine({
            id: medicineCount,
            ipfs: ipfs,
            priceWei: priceWei,
            stock: stock,
            active: true
        });

        emit MedicineAdded(medicineCount, priceWei, stock);
        _emitActivity(
            ACTIVITY_MEDICINE_ADDED,
            medicineCount,
            msg.sender,
            0,
            0,
            0,
            ipfs
        );
    }

    function setMedicinePrice(uint256 id, uint256 priceWei) external onlyAdmin {
        require(id > 0 && id <= medicineCount, "NO_MED");
        require(priceWei > 0, "PRICE_ZERO");
        medicines[id].priceWei = priceWei;
        emit MedicinePrice(id, priceWei);
        _emitActivity(
            ACTIVITY_MEDICINE_UPDATED,
            id,
            msg.sender,
            0,
            0,
            0,
            "price"
        );
    }

    function setMedicineStock(uint256 id, uint256 stock) external onlyAdmin {
        require(id > 0 && id <= medicineCount, "NO_MED");
        medicines[id].stock = stock;
        emit MedicineStock(id, stock);
        _emitActivity(
            ACTIVITY_MEDICINE_UPDATED,
            id,
            msg.sender,
            0,
            0,
            0,
            "stock"
        );
    }

    function toggleMedicine(uint256 id) external onlyAdmin {
        require(id > 0 && id <= medicineCount, "NO_MED");
        medicines[id].active = !medicines[id].active;
        emit MedicineActive(id, medicines[id].active);
        _emitActivity(
            ACTIVITY_MEDICINE_UPDATED,
            id,
            msg.sender,
            0,
            0,
            0,
            medicines[id].active ? "active" : "inactive"
        );
    }

    // --- Doctor approval -------------------------------------------------------------
    function approveDoctor(uint256 id, bool value) external onlyAdmin {
        require(id > 0 && id <= doctorCount, "NO_DOC");
        doctors[id].approved = value;
        emit DoctorApproved(id, value);
    }

    // --- Registration ---------------------------------------------------------------
    function registerDoctor(
        string calldata ipfs,
        address doctorAddress
    ) external payable nonReentrant {
        address targetAddress;

        if (doctorAddress != address(0)) {
            require(msg.sender == admin, "ADMIN_ONLY");
            require(msg.value == 0, "NO_FEE_FOR_ADMIN");
            targetAddress = doctorAddress;
        } else {
            require(msg.value == doctorRegFeeWei, "BAD_FEE");
            targetAddress = msg.sender;
        }

        require(doctorIdByAddress[targetAddress] == 0, "DOC_EXISTS");

        doctorCount++;
        doctors[doctorCount] = Doctor({
            id: doctorCount,
            ipfs: ipfs,
            account: targetAddress,
            approved: false,
            appointments: 0,
            successes: 0
        });
        doctorIdByAddress[targetAddress] = doctorCount;

        if (doctorAddress == address(0)) {
            _recordRevenue(msg.value);
            admin.transfer(msg.value);
        }

        emit DoctorRegistered(doctorCount, targetAddress);
        _emitActivity(
            ACTIVITY_DOCTOR_REGISTERED,
            doctorCount,
            targetAddress,
            0,
            doctorCount,
            msg.value,
            ipfs
        );
    }

    function registerPatient(
        string calldata ipfs,
        address patientAddress
    ) external payable nonReentrant {
        address targetAddress;

        if (patientAddress != address(0)) {
            require(msg.sender == admin, "ADMIN_ONLY");
            require(msg.value == 0, "NO_FEE_FOR_ADMIN");
            targetAddress = patientAddress;
        } else {
            require(msg.value == patientRegFeeWei, "BAD_FEE");
            targetAddress = msg.sender;
        }

        require(patientIdByAddress[targetAddress] == 0, "PAT_EXISTS");

        patientCount++;
        patients[patientCount] = Patient({
            id: patientCount,
            ipfs: ipfs,
            account: targetAddress
        });
        patientIdByAddress[targetAddress] = patientCount;

        if (patientAddress == address(0)) {
            _recordRevenue(msg.value);
            admin.transfer(msg.value);
        }

        emit PatientRegistered(patientCount, targetAddress);
        _emitActivity(
            ACTIVITY_PATIENT_REGISTERED,
            patientCount,
            targetAddress,
            patientCount,
            0,
            msg.value,
            ipfs
        );
    }

    // --- Appointments ----------------------------------------------------------------
    function bookAppointment(
        uint256 patientId,
        uint256 doctorId,
        uint256 startAt
    ) external payable nonReentrant {
        require(
            patientIdByAddress[msg.sender] == patientId && patientId != 0,
            "NOT_PATIENT"
        );
        require(doctorId > 0 && doctorId <= doctorCount, "NO_DOCTOR");
        require(doctors[doctorId].approved, "DOCTOR_NOT_APPROVED");
        require(msg.value == appointmentFeeWei, "BAD_PAYMENT");
        require(startAt > block.timestamp, "TIME_PAST");

        appointmentCount++;
        appointments[appointmentCount] = Appointment({
            id: appointmentCount,
            patientId: patientId,
            doctorId: doctorId,
            startAt: startAt,
            open: true,
            chatId: 0
        });

        uint256 adminShare = msg.value / 10;
        uint256 doctorShare = msg.value - adminShare;
        if (adminShare > 0) {
            _recordRevenue(adminShare);
            admin.transfer(adminShare);
        } else {
            // If rounding made admin share 0, still record zero to keep totals untouched.
        }
        payable(doctors[doctorId].account).transfer(doctorShare);

        doctors[doctorId].appointments += 1;

        emit AppointmentBooked(appointmentCount, patientId, doctorId, startAt);
        _emitActivity(
            ACTIVITY_APPOINTMENT_BOOKED,
            appointmentCount,
            msg.sender,
            patientId,
            doctorId,
            msg.value,
            ""
        );
    }

    function completeAppointment(
        uint256 appointmentId
    ) external onlyRegisteredDoctor {
        require(appointmentId > 0 && appointmentId <= appointmentCount, "NO_APPT");
        Appointment storage ap = appointments[appointmentId];
        require(ap.open, "CLOSED");
        require(doctors[ap.doctorId].account == msg.sender, "NOT_ASSIGNED");

        ap.open = false;
        doctors[ap.doctorId].successes += 1;

        emit AppointmentCompleted(appointmentId);
        _emitActivity(
            ACTIVITY_APPOINTMENT_COMPLETED,
            appointmentId,
            msg.sender,
            ap.patientId,
            ap.doctorId,
            0,
            ""
        );
    }

    // --- Chat management -------------------------------------------------------------
    function startChat(
        uint256 appointmentId,
        string calldata metadataCid
    ) external onlyRegisteredDoctor returns (uint256) {
        require(
            appointmentId > 0 && appointmentId <= appointmentCount,
            "NO_APPT"
        );
        Appointment storage ap = appointments[appointmentId];
        require(
            doctors[ap.doctorId].account == msg.sender,
            "NOT_ASSIGNED"
        );

        uint256 existingChatId = chatIdByAppointment[appointmentId];
        if (existingChatId != 0) {
            ChatSession storage existing = chats[existingChatId];
            require(existing.closed, "CHAT_OPEN");
        }

        chatCount++;
        chats[chatCount] = ChatSession({
            id: chatCount,
            appointmentId: appointmentId,
            patientId: ap.patientId,
            doctorId: ap.doctorId,
            createdAt: block.timestamp,
            lastMessageAt: block.timestamp,
            closed: false,
            metadataCid: metadataCid
        });
        chatIdByAppointment[appointmentId] = chatCount;
        appointments[appointmentId].chatId = chatCount;

        emit ChatStarted(
            chatCount,
            appointmentId,
            ap.patientId,
            ap.doctorId,
            metadataCid
        );
        if (bytes(metadataCid).length != 0) {
            emit ChatMetadataUpdated(chatCount, metadataCid);
        }
        _emitActivity(
            ACTIVITY_CHAT_STARTED,
            chatCount,
            msg.sender,
            ap.patientId,
            ap.doctorId,
            0,
            metadataCid
        );

        return chatCount;
    }

    function updateChatMetadata(
        uint256 chatId,
        string calldata metadataCid
    ) external {
        require(chatId > 0 && chatId <= chatCount, "NO_CHAT");
        ChatSession storage session = chats[chatId];
        require(!session.closed, "CHAT_CLOSED");
        address sender = msg.sender;
        require(
            _isDoctor(sender, session.doctorId) ||
                _isPatient(sender, session.patientId),
            "NOT_PARTICIPANT"
        );

        session.metadataCid = metadataCid;
        session.lastMessageAt = block.timestamp;
        emit ChatMetadataUpdated(chatId, metadataCid);
        _emitActivity(
            ACTIVITY_CHAT_MESSAGE,
            chatId,
            sender,
            session.patientId,
            session.doctorId,
            0,
            metadataCid
        );
    }

    function postChatMessage(
        uint256 chatId,
        string calldata messageCid
    ) external {
        require(chatId > 0 && chatId <= chatCount, "NO_CHAT");
        ChatSession storage session = chats[chatId];
        require(!session.closed, "CHAT_CLOSED");
        address sender = msg.sender;
        require(bytes(messageCid).length != 0, "CID_REQUIRED");
        require(
            _isDoctor(sender, session.doctorId) ||
                _isPatient(sender, session.patientId),
            "NOT_PARTICIPANT"
        );

        session.lastMessageAt = block.timestamp;

        emit ChatMessageLogged(chatId, sender, messageCid, block.timestamp);
        _emitActivity(
            ACTIVITY_CHAT_MESSAGE,
            chatId,
            sender,
            session.patientId,
            session.doctorId,
            0,
            messageCid
        );
    }

    function closeChat(uint256 chatId) external {
        require(chatId > 0 && chatId <= chatCount, "NO_CHAT");
        ChatSession storage session = chats[chatId];
        require(!session.closed, "CHAT_CLOSED");
        address sender = msg.sender;
        require(
            _isDoctor(sender, session.doctorId) ||
                _isPatient(sender, session.patientId) ||
                sender == admin,
            "NOT_AUTHORIZED"
        );

        session.closed = true;
        session.lastMessageAt = block.timestamp;
        emit ChatClosed(chatId, sender, block.timestamp);
        _emitActivity(
            ACTIVITY_CHAT_CLOSED,
            chatId,
            sender,
            session.patientId,
            session.doctorId,
            0,
            ""
        );
    }

    // --- Prescriptions ---------------------------------------------------------------
    function prescribe(
        uint256 patientId,
        uint256 medicineId,
        uint16 durationDays,
        string calldata notesCid,
        uint256 chatId
    ) external onlyApprovedDoctor {
        require(patientId > 0 && patientId <= patientCount, "NO_PAT");
        require(medicineId > 0 && medicineId <= medicineCount, "NO_MED");
        require(durationDays >= 3, "DURATION_TOO_SHORT");

        uint256 doctorId = doctorIdByAddress[msg.sender];

        if (chatId != 0) {
            require(chatId <= chatCount, "NO_CHAT");
            ChatSession storage session = chats[chatId];
            require(session.patientId == patientId, "CHAT_PATIENT_MISMATCH");
            require(session.doctorId == doctorId, "CHAT_DOCTOR_MISMATCH");
            require(session.closed, "CHAT_OPEN");
        }

        prescriptionCount++;
        prescriptions[prescriptionCount] = Prescription({
            id: prescriptionCount,
            medicineId: medicineId,
            patientId: patientId,
            doctorId: doctorId,
            date: block.timestamp,
            durationDays: durationDays,
            chatId: chatId,
            notesCid: notesCid
        });

        emit MedicinePrescribed(
            prescriptionCount,
            medicineId,
            patientId,
            doctorId
        );
        _emitActivity(
            ACTIVITY_PRESCRIPTION_CREATED,
            prescriptionCount,
            msg.sender,
            patientId,
            doctorId,
            0,
            notesCid
        );
    }

    // --- Commerce --------------------------------------------------------------------
    function buyMedicine(
        uint256 patientId,
        uint256 medicineId,
        uint256 qty
    ) external payable nonReentrant {
        require(
            patientIdByAddress[msg.sender] == patientId && patientId != 0,
            "NOT_PATIENT"
        );
        require(medicineId > 0 && medicineId <= medicineCount, "NO_MED");
        require(qty > 0, "QTY_ZERO");

        Medicine storage m = medicines[medicineId];
        require(m.active, "INACTIVE");
        require(m.stock >= qty, "NO_STOCK");

        uint256 total = m.priceWei * qty;
        require(msg.value == total, "BAD_PAYMENT");

        m.stock -= qty;
        _recordRevenue(msg.value);
        admin.transfer(msg.value);

        emit MedicineBought(patientId, medicineId, qty, msg.value);
        _emitActivity(
            ACTIVITY_MEDICINE_PURCHASED,
            medicineId,
            msg.sender,
            patientId,
            0,
            msg.value,
            ""
        );
    }

    // --- Medicine requests -----------------------------------------------------------
    function submitMedicineRequest(
        string calldata metadataCid
    ) external onlyApprovedDoctor returns (uint256) {
        require(bytes(metadataCid).length != 0, "CID_REQUIRED");
        uint256 doctorId = doctorIdByAddress[msg.sender];

        medicineRequestCount++;
        medicineRequests[medicineRequestCount] = MedicineRequest({
            id: medicineRequestCount,
            doctorId: doctorId,
            metadataCid: metadataCid,
            createdAt: block.timestamp,
            processed: false
        });

        emit MedicineRequestCreated(
            medicineRequestCount,
            doctorId,
            metadataCid,
            msg.sender
        );
        _emitActivity(
            ACTIVITY_MEDICINE_REQUEST_CREATED,
            medicineRequestCount,
            msg.sender,
            0,
            doctorId,
            0,
            metadataCid
        );

        return medicineRequestCount;
    }

    function setMedicineRequestStatus(
        uint256 requestId,
        bool processed
    ) external onlyAdmin {
        require(
            requestId > 0 && requestId <= medicineRequestCount,
            "NO_REQUEST"
        );
        medicineRequests[requestId].processed = processed;
        emit MedicineRequestStatusUpdated(requestId, processed, block.timestamp);
        _emitActivity(
            ACTIVITY_MEDICINE_REQUEST_STATUS,
            requestId,
            msg.sender,
            0,
            medicineRequests[requestId].doctorId,
            0,
            processed ? "processed" : "pending"
        );
    }

    // --- Views -----------------------------------------------------------------------
    function getDoctorId(address account) external view returns (uint256) {
        return doctorIdByAddress[account];
    }

    function getPatientId(address account) external view returns (uint256) {
        return patientIdByAddress[account];
    }

    function getAppointmentsByPatient(
        uint256 patientId
    ) external view returns (Appointment[] memory) {
        uint256 count;
        for (uint256 i = 1; i <= appointmentCount; i++) {
            if (appointments[i].patientId == patientId) count++;
        }
        Appointment[] memory list = new Appointment[](count);
        uint256 idx;
        for (uint256 i = 1; i <= appointmentCount; i++) {
            if (appointments[i].patientId == patientId) {
                list[idx++] = appointments[i];
            }
        }
        return list;
    }

    function getAppointmentsByDoctor(
        uint256 doctorId
    ) external view returns (Appointment[] memory) {
        uint256 count;
        for (uint256 i = 1; i <= appointmentCount; i++) {
            if (appointments[i].doctorId == doctorId) count++;
        }
        Appointment[] memory list = new Appointment[](count);
        uint256 idx;
        for (uint256 i = 1; i <= appointmentCount; i++) {
            if (appointments[i].doctorId == doctorId) {
                list[idx++] = appointments[i];
            }
        }
        return list;
    }

    function getChatsByDoctor(
        uint256 doctorId
    ) external view returns (ChatSession[] memory) {
        uint256 count;
        for (uint256 i = 1; i <= chatCount; i++) {
            if (chats[i].doctorId == doctorId) count++;
        }
        ChatSession[] memory list = new ChatSession[](count);
        uint256 idx;
        for (uint256 i = 1; i <= chatCount; i++) {
            if (chats[i].doctorId == doctorId) {
                list[idx++] = chats[i];
            }
        }
        return list;
    }

    function getChatsByPatient(
        uint256 patientId
    ) external view returns (ChatSession[] memory) {
        uint256 count;
        for (uint256 i = 1; i <= chatCount; i++) {
            if (chats[i].patientId == patientId) count++;
        }
        ChatSession[] memory list = new ChatSession[](count);
        uint256 idx;
        for (uint256 i = 1; i <= chatCount; i++) {
            if (chats[i].patientId == patientId) {
                list[idx++] = chats[i];
            }
        }
        return list;
    }

    function getMedicineRequestsAll()
        external
        view
        returns (MedicineRequest[] memory)
    {
        MedicineRequest[] memory list = new MedicineRequest[](
            medicineRequestCount
        );
        for (uint256 i = 0; i < medicineRequestCount; i++) {
            list[i] = medicineRequests[i + 1];
        }
        return list;
    }

    function getRevenueHistory(
        uint256 limit
    ) external view returns (RevenuePoint[] memory) {
        uint256 len = _revenueDays.length;
        if (limit == 0 || limit > len) {
            limit = len;
        }
        RevenuePoint[] memory points = new RevenuePoint[](limit);
        for (uint256 i = 0; i < limit; i++) {
            uint256 day = _revenueDays[len - limit + i];
            points[i] = RevenuePoint({day: day, amountWei: _revenueByDay[day]});
        }
        return points;
    }

    function getRevenueDayCount() external view returns (uint256) {
        return _revenueDays.length;
    }

    function getRevenueForDay(uint256 day) external view returns (uint256) {
        return _revenueByDay[day];
    }
}
