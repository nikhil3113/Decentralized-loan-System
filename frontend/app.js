// app.js
// import LoanAbi from "./contracts/LoanSystem.json";


document.addEventListener('DOMContentLoaded', async () => {
    if (window.ethereum) {
        window.web3 = new Web3(window.ethereum);
        try {
            // Request account access if needed
            await window.ethereum.enable();
            // Acccounts now exposed
            const accounts = await window.web3.eth.getAccounts();
            console.log(accounts);
        } catch (error) {
            console.error(error);
        }
    } else if (window.web3) {
        window.web3 = new Web3(window.web3.currentProvider);
    } else {
        console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
    }

    const repayDateInput = document.getElementById('repayDate');
    repayDateInput.min = new Date().toISOString().split('T')[0];
    
    const contractAddress = ''; // Replace with your contract address
    const contractABI =  []// Replace with your contract ABI
    // console.log(contractABI)

    const contract = new window.web3.eth.Contract(contractABI, contractAddress);

    const loanForm = document.getElementById('loanForm');
    const loanDetails = document.getElementById('loanDetails');
    const loanList = document.getElementById('loanList');

    loanForm.addEventListener('submit', async (e) => {
      e.preventDefault();
  
      const amount = e.target.amount.value;
      const repayDate = new Date(e.target.repayDate.value).getTime() / 1000; // Convert to Unix timestamp
      const interest = e.target.interest.value;
  
      try {
          // Convert amount to Wei (1 Ether = 10^18 Wei)
          const amountWei = window.web3.utils.toWei(amount, 'ether');
  
          // Check if the user has an active loan
          const hasActiveLoan = await checkActiveLoan();
          if (hasActiveLoan) {
              alert('You already have an active loan.');
              return;
          }
  
          // Call the createLoan function
          const result = await contract.methods.createLoan(amountWei, repayDate, interest).send({ from: window.ethereum.selectedAddress, value: '0' });
  
          console.log(result);
          const randomId = result.events.LoanCreated.returnValues.randomId;
          
          alert(`Loan created successfully! ${randomId}`);
      } catch (error) {
          console.error(error);
          alert('Failed to create loan. Please try again.');
      }
  });
  
  
// Function to check if the user has an active loan
async function checkActiveLoan() {
  try {
      const hasActiveLoan = await contract.methods.IsActiveLoan().call({ from: window.ethereum.selectedAddress });
      return hasActiveLoan;
  } catch (error) {
      console.error("Error fetching active loan status:", error);
      return false; // Assume an error means the user doesn't have an active loan
  }
}


  
    loanDetails.addEventListener('submit', async (e) => {
      e.preventDefault();

      try {
        const randomId = e.target.randomId.value;
        const result = await contract.methods.getLoanDetails(randomId).call();
        const amountEther = window.web3.utils.fromWei(result[1], 'ether');

        // if(randomId !== result[0].toString()) {
        //   alert('Loan does not exist!');
        //   return; 
        // }
        // console.log(result);
        loanList.innerHTML = `<p>Amount: ${amountEther + result[3]} </p>
                                     <p>Repay Date: ${new Date(result[2] * 1000).toLocaleDateString()}</p>
                                     <p>Interest: ${result[3]}</p>
                                     <p>Borrower: ${result[4]}</p>
                                     <p>Repaid: ${result[5]}</p>`;
                                     
      } catch (error) {
        alert(`Failed to retrieve loan details! check if loan id is correct`);
        console.log(error);
      }
    })
    

    //!Pay
    const payLoanForm = document.getElementById('payLoanForm');

    payLoanForm.addEventListener('submit', async (e) => {
      e.preventDefault();
  
      try {
          // Retrieve the loan details using the provided randomId
          const randomId = e.target.payRandomId.value;
          const loanDetails = await contract.methods.getLoanDetails(randomId).call();
          const loanAmount = loanDetails[1]; // Assuming loan amount is at index 1
          const loanInterest = loanDetails[3]; // Assuming interest is at index 3
  
          // Calculate the total amount to repay (loan amount + interest)
          const totalAmountToRepay = parseInt(loanAmount) + parseInt(loanInterest);

          // if(loanDetails[4] !== window.ethereum.selectedAddress) {
          //     alert('You are not the borrower of this loan!');
          //     return;
          // }

          // if(loanDetails[5]) {
          //     alert('Loan has already been repaid!');
          //     return;
          // }
  
          // Call the payLoan function with the randomId and the total amount to repay
          const result = await contract.methods.payLoan(randomId).send({ from: ethereum.selectedAddress, value: totalAmountToRepay });
          console.log(result);
          alert('Loan repaid successfully!');
      } catch (error) {
          console.error(error);
          alert('Failed to repay loan. Please try again. Or check your loan id');
          console.log(error);
      }
  });

});
