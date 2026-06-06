namespace lib.views;
using lib.management from './schema';

// ─── VIEW 1: Available Books (for library kiosk) ───
entity AvailableBooks as select from management.Books {
  ID,
  title,
  isbn,
  price,
  availableCopies,
  author.firstName || ' ' || author.lastName as authorName : String(101),
  genre.name as genreName
} where availableCopies > 0;

// ─── VIEW 2: Overdue Borrowings (for staff) ────────
entity OverdueBorrowings as select from management.Borrowings {
  ID,
  borrowDate,
  dueDate,
  fineAmount,
  book.title       as bookTitle,
  member.firstName || ' ' || member.lastName as memberName : String(101),
  member.email     as memberEmail,
  member.phone     as memberPhone
} where status = 'Overdue';

// ─── VIEW 3: Book Summary with pricing ─────────────
entity BookPricing as select from management.Books {
  ID,
  title,
  price,
  (price * 0.9)  as memberPrice  : Decimal(8,2),
  (price * 0.18) as gstAmount    : Decimal(8,2),
  (price * 1.18) as priceWithGST : Decimal(8,2),
  case
    when price > 500 then 'Premium'
    when price > 300 then 'Standard'
    else 'Budget'
  end as priceCategory : String(20)
};

// ─── VIEW 4: Member Activity ───────────────────────
entity MemberActivity as select from management.Members {
  ID,
  memberNumber,
  firstName || ' ' || lastName as fullName : String(101),
  email,
  memberType,
  maxBooks,
  isActive
};