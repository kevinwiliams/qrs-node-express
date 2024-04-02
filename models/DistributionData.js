class DistributionData {
    constructor(
        AccountID,
        DistributionTypeID,
        PublicationDate,
        DistributionAmount,
        ReturnDate,
        ReturnAmount,
        ConfirmDate,
        ConfirmedAmount,
        DisputeAmount,
        ConfirmReturn,
        Status,
        RetailerName,
        Company,
        RetailerAddress,
        EmailAddress,
        PhoneNumber,
        CellNumber,
        IsDisputed,
        RetailerNote
    ) {
        this.AccountID = AccountID;
        this.DistributionTypeID = DistributionTypeID;
        this.PublicationDate = PublicationDate;
        this.DistributionAmount = DistributionAmount;
        this.ReturnDate = ReturnDate;
        this.ReturnAmount = ReturnAmount;
        this.ConfirmDate = ConfirmDate;
        this.ConfirmedAmount = ConfirmedAmount;
        this.DisputeAmount = DisputeAmount;
        this.ConfirmReturn = ConfirmReturn;
        this.Status = Status;
        this.RetailerName = RetailerName;
        this.Company = Company;
        this.RetailerAddress = RetailerAddress;
        this.EmailAddress = EmailAddress;
        this.PhoneNumber = PhoneNumber;
        this.CellNumber = CellNumber;
        this.IsDisputed = IsDisputed;
        this.RetailerNote = RetailerNote;
    }
}

module.exports = DistributionData;