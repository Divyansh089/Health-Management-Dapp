// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title Healthcare
 * @notice Basic on-chain patient record registry. Demonstrative only – NOT production secure.
 */
contract Healthcare {
    struct Record {
        string cid; // IPFS/Arweave content ID referencing encrypted data off-chain
        uint256 timestamp;
        address addedBy;
    }

    // patient => list of record entries
    mapping(address => Record[]) private _records;

    // authorized writer roles (e.g., doctors) besides the patient themselves
    mapping(address => bool) public authorizedWriters;

    event RecordAdded(
        address indexed patient,
        uint256 index,
        string cid,
        address addedBy
    );
    event WriterAuthorized(address indexed writer, bool enabled);

    modifier onlyAuthorized(address patient) {
        require(
            msg.sender == patient || authorizedWriters[msg.sender],
            "Not authorized"
        );
        _;
    }

    function setWriter(address writer, bool enabled) external {
        // Simple open access for demo purposes; in production restrict to admin/governance
        authorizedWriters[writer] = enabled;
        emit WriterAuthorized(writer, enabled);
    }

    function addRecord(
        address patient,
        string calldata cid
    ) external onlyAuthorized(patient) {
        _records[patient].push(
            Record({cid: cid, timestamp: block.timestamp, addedBy: msg.sender})
        );
        emit RecordAdded(
            patient,
            _records[patient].length - 1,
            cid,
            msg.sender
        );
    }

    function recordCount(address patient) external view returns (uint256) {
        return _records[patient].length;
    }

    function getRecord(
        address patient,
        uint256 index
    ) external view returns (Record memory) {
        require(index < _records[patient].length, "Index out of bounds");
        return _records[patient][index];
    }

    function getAllRecords(
        address patient
    ) external view returns (Record[] memory) {
        return _records[patient];
    }
}
