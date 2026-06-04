using com.epm as epm from '../db/schema';

service SalesService @(path:'/sales') {

    entity Customers
        as projection on epm.Customers;

    entity Products
        as projection on epm.Products {
            ID,
            name,
            description,
            stock,
            rating,
            category
        };

    entity SalesOrders
        as projection on epm.SalesOrders;
}