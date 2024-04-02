class Retailer {
    constructor(accountID, distributionID, retailerName, emailAddress, company, retailerAddress, phoneNumber, cellNumber) {
        this.accountID = accountID;
        this.distributionID = distributionID;
        this.retailerName = retailerName;
        this.emailAddress = emailAddress;
        this.company = company;
        this.retailerAddress = retailerAddress;
        this.phoneNumber = phoneNumber;
        this.cellNumber = cellNumber;
    }
}

module.exports = Retailer;
