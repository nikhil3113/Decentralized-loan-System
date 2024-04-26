// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract LoanSystem {
    struct Loan {
        uint256 loanId;
        uint256 amount;
        uint256 repayDate;
        uint256 interest;
        address borrower;
        bool repaid;
    }

    mapping(address => Loan[]) public loans;
    mapping(uint256 => Loan) public loansByRandomId; // New mapping to access loan by random ID

    event LoanCreated(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 amount,
        uint256 repayDate,
        uint256 randomId
    );
    event LoanRepaid(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 amountPaid
    );

    function createLoan(
        uint256 _amount,
        uint256 _repayDate,
        uint256 _interest
    ) external {
        require(_amount > 0, "Amount must be greater than zero");
        require(
            _repayDate > block.timestamp,
            "Repay date must be in the future"
        );

        bool hasActiveLoan = false;
        for (uint256 i = 0; i < loans[msg.sender].length; i++) {
            if (
                !loans[msg.sender][i].repaid &&
                loans[msg.sender][i].repayDate > block.timestamp
            ) {
                hasActiveLoan = true;
                break;
            }
        }
        require(!hasActiveLoan, "You already have an active loan");

        // Generate a unique loan ID using timestamp and a nonce
        uint256 loanId = uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp,
                    msg.sender,
                    loans[msg.sender].length
                )
            )
        );

        // Generate a random 4-digit ID
        uint256 randomId = uint256(
            keccak256(
                abi.encodePacked(block.timestamp, block.prevrandao, msg.sender)
            )
        ) % 10000;

        Loan memory newLoan = Loan(
            loanId,
            _amount,
            _repayDate,
            _interest,
            msg.sender,
            false
        );
        loans[msg.sender].push(newLoan);

        // Store loan details in loansByRandomId mapping
        loansByRandomId[randomId] = newLoan;

        emit LoanCreated(loanId, msg.sender, _amount, _repayDate, randomId);
    }

    function IsActiveLoan() public view returns (bool) {
        for (uint256 i = 0; i < loans[msg.sender].length; i++) {
            if (
                !loans[msg.sender][i].repaid &&
                loans[msg.sender][i].repayDate > block.timestamp
            ) {
                return true;
            }
        }
        return false;
    }

    function getLoanDetails(
        uint256 _randomId
    )
        external
        view
        returns (uint256, uint256, uint256, uint256, address, bool)
    {
        Loan memory loan = loansByRandomId[_randomId];
        require(loan.borrower != address(0), "Invalid random ID");

        return (
            loan.loanId,
            loan.amount,
            loan.repayDate,
            loan.interest,
            loan.borrower,
            loan.repaid
        );
    }

    function payLoan(uint256 _randomId) external payable {
        // Find the loan associated with the random ID
        Loan storage loan = loansByRandomId[_randomId];
        require(
            loan.borrower == msg.sender,
            "You are not the borrower of this loan"
        );
        require(!loan.repaid, "Loan has already been repaid");

        uint256 totalAmountToPay = loan.amount + loan.interest;
        require(msg.value >= totalAmountToPay, "Insufficient funds sent");

        // Transfer the loan amount to the lender
        payable(loan.borrower).transfer(loan.amount);

        // Emit an event indicating loan repayment
        emit LoanRepaid(loan.loanId, msg.sender, totalAmountToPay);

        // Refund any excess amount sent by the borrower
        if (msg.value > totalAmountToPay) {
            payable(msg.sender).transfer(msg.value - totalAmountToPay);
        }

        // Mark the loan as repaid
        loan.repaid = true;

        // Update repayment status in the loans array
        for (uint256 i = 0; i < loans[msg.sender].length; i++) {
            if (loans[msg.sender][i].loanId == loan.loanId) {
                loans[msg.sender][i].repaid = true;
                break;
            }
        }
    }
}
