using lib.management from '../db/schema';

service LibraryService @(path: '/library') {
  // Full CRUD:
  entity Books      as projection on management.Books;
  entity Authors    as projection on management.Authors;
  entity Genres     as projection on management.Genres;
  entity Members    as projection on management.Members;
  entity Borrowings as projection on management.Borrowings;
  entity Reviews    as projection on management.Reviews;
  entity PurchaseOrders as projection on management.PurchaseOrders;
}