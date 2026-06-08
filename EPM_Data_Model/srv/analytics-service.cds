using { com.epm as db } from '../db/schema';

type ReportResponse {
    reportId : UUID;
    status   : String(20);
    message  : String(200);
}

type HealthResponse {
    status    : String(10);
    timestamp : Timestamp;
    version   : String(20);
}

service AnalyticsService @(path:'/analytics') {

    action GenerateReport(
        reportType : String(20),
        startDate  : Date,
        endDate    : Date
    ) returns ReportResponse;

    action PingHealth() returns HealthResponse;
}