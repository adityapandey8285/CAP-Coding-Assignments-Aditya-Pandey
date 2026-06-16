using { com.epm as db } from '../db/schema';

service PurchasingService @(path: '/purchasing') {

 @odata.draft.enabled
entity PurchaseOrders as projection on db.PurchaseOrders {
  *,
  
  supplier,
  currency,

  virtual statusCriticality : Integer,
  virtual progressValue     : Integer,

  virtual submitHidden      : Boolean,
  virtual approveHidden     : Boolean,
  virtual rejectHidden      : Boolean,
  virtual poFieldControl    : Integer,

  items
} actions {
  action submit() returns {
    status  : String;
    message : String;
  };

  action approve(comment : String(500)) returns {
    status     : String;
    message    : String;
    approvedAt : DateTime;
  };

  action reject(reason : String(500)) returns {
    status  : String;
    message : String;
  };

  action receive(
    receivedQty : Integer,
    notes       : String(500)
  ) returns {
    status  : String;
    message : String;
  };

  function getSummary() returns {
    poNumber    : String;
    supplier    : String;
    itemCount   : Integer;
    totalAmount : Decimal;
    status      : String;
    daysOpen    : Integer;
  };
};
entity PurchaseOrderItems as projection on db.PurchaseOrderItems {
  *,
  product
};

  @readonly
  entity Suppliers as projection on db.Suppliers;

  @readonly
  entity Products as projection on db.Products;

  function getPurchasingDashboard() returns {
    totalPOs        : Integer;
    draftCount      : Integer;
    pendingApproval : Integer;
    approvedCount   : Integer;
    totalSpend      : Decimal;
  };

  event POSubmitted {
    poId         : UUID;
    poNumber     : String;
    supplierName : String;
    totalAmount  : Decimal;
    submittedBy  : String;
  }

  event POApproved {
    poId       : UUID;
    poNumber   : String;
    approvedBy : String;
    comment    : String;
  }

  event POrejected {
    poId       : UUID;
    poNumber   : String;
    rejectedBy : String;
    reason     : String;
  }
}

using from '../app/purchase/annotations';