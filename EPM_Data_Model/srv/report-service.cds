using {
    ProductCatalog,
    OrderReport,
    LowStockAlert
} from '../db/views';

service ReportService @(path:'/reports') {

    @readonly
    entity ProductCatalogView
        as projection on ProductCatalog;

    @readonly
    entity OrderReportView
        as projection on OrderReport;

    @readonly
    entity LowStockAlertView
        as projection on LowStockAlert;
}