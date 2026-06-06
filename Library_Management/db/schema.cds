namespace lib.management;

// ─── REUSABLE TYPES ─────────────────────────────
type Name    : String(100);
type Email   : String(255);
type Phone   : String(20);
type Amount  : Decimal(8,2);

type BorrowStatus : String(20) enum {
  Borrowed;
  Returned;
  Overdue;
}

// ─── AUTHORS ─────────────────────────────────────
entity Authors {
  key ID        : UUID;
  firstName     : String(50);
  lastName      : String(50);
  nationality   : String(50);
  birthDate     : Date;
  biography     : String(1000);
  email         : Email;
  isActive      : Boolean;
  // One author can write MANY books:
  books         : Association to many Books on books.author = $self;
}

// ─── GENRES ──────────────────────────────────────
entity Genres {
  key code      : String(20);
  name          : String(50);
  description   : String(200);
  isActive      : Boolean;
}

// ─── BOOKS ───────────────────────────────────────
entity Books {
  key ID          : UUID;
  title           : String(200);
  isbn            : String(13);
  pages           : Integer;
  price           : Amount;
  publishedDate   : Date;
  language        : String(30);
  edition         : Integer;
  totalCopies     : Integer;
  availableCopies : Integer;
  summary         : String(2000);
  // Managed associations:
  author          : Association to Authors;       // Many books → one author
  genre           : Association to Genres;        // Many books → one genre
  // One book can have MANY reviews:
  reviews         : Association to many Reviews on reviews.book = $self;
}

// ─── MEMBERS ─────────────────────────────────────
entity Members {
  key ID          : UUID;
  memberNumber    : String(10);
  firstName       : String(50);
  lastName        : String(50);
  email           : Email;
  phone           : Phone;
  address         : String(200);
  joinDate        : Date;
  memberType      : String(20);
  maxBooks        : Integer;
  isActive        : Boolean;
  // One member can have MANY borrowings:
  borrowings      : Association to many Borrowings on borrowings.member = $self;
}

// ─── REVIEWS ─────────────────────────────────────
entity Reviews {
  key ID        : UUID;
  book          : Association to Books;       // This review is for WHICH book
  member        : Association to Members;     // WHO wrote this review
  rating        : Integer;
  comment       : String(500);
  reviewDate    : Date;
}

// ─── BORROWINGS ──────────────────────────────────
entity Borrowings {
  key ID          : UUID;
  member          : Association to Members;   // WHO borrowed
  book            : Association to Books;     // WHAT was borrowed
  borrowDate      : Date;
  dueDate         : Date;
  returnDate      : Date;
  status          : BorrowStatus;
  fineAmount      : Amount;
}

// ─── PURCHASE ORDERS ────────────────────────────
entity PurchaseOrders {
  key ID            : UUID;
  poNumber          : String(20);
  vendorName        : String(100);
  vendorEmail       : Email;
  orderDate         : Date;
  expectedDate      : Date;
  totalAmount       : Amount;
  status            : String(20);

  // One Purchase Order can have many items
  items             : Composition of many PurchaseOrderItems
                        on items.purchaseOrder = $self;
}

// ─── PURCHASE ORDER ITEMS ───────────────────────
entity PurchaseOrderItems {
  key ID            : UUID;

  purchaseOrder     : Association to PurchaseOrders;
  book              : Association to Books;

  quantity          : Integer;
  unitPrice         : Amount;
  lineAmount        : Amount;
}