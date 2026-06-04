using com.epm as epm from './schema';

entity ProductCatalog as select from epm.Products {
    ID,
    name,
    price,
    currency,
    supplier.name as supplierName,
    category.name as categoryName,

    case
        when stock <= minStock then 'LOW STOCK'
        else 'IN STOCK'
    end as stockStatus : String(20)
};

entity OrderReport as select from epm.SalesOrders {
    ID,
    orderNumber,
    customer.name as customerName,
    totalAmount,
    orderDate,
    status
};

entity LowStockAlert as select from epm.Products {
    ID,
    name,
    stock,
    minStock,
    supplier.name as supplierName,
    supplier.contact as supplierContact,
    supplier.email as supplierEmail
}
where stock <= minStock;