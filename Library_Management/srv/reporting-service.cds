using { lib.views as views } from '../db/views';

service ReportingService @(path: '/reports') {

  @readonly entity AvailableBooks as projection on views.AvailableBooks;
  @readonly entity OverdueBorrowings as projection on views.OverdueBorrowings;
  @readonly entity BookPricing as projection on views.BookPricing;
  @readonly entity MemberActivity as projection on views.MemberActivity;

}