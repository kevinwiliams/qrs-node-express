class TransactionData {
    constructor(PeriodNumber, TotalDistributionAmount, TotalReturnAmount, TotalConfirmedAmount, PeriodText) {
        this.PeriodNumber = PeriodNumber;
        this.TotalDistributionAmount = TotalDistributionAmount;
        this.TotalReturnAmount = TotalReturnAmount;
        this.TotalConfirmedAmount = TotalConfirmedAmount;
        this.PeriodText = PeriodText;
    }
}

class TransactionDataViewModel {
    constructor(WeeklyData, MonthlyData, DailyData, ActivityLogs) {
        this.WeeklyData = WeeklyData;
        this.MonthlyData = MonthlyData;
        this.DailyData = DailyData;
        this.ActivityLogs = ActivityLogs;
    }
}

module.exports = TransactionData;