using { com.epm as db } from '../db/schema';

service PurchasingService @(path:'/purchasing') {

  entity PurchaseOrders as projection on db.PurchaseOrders
    actions {

      // Bound Actions
      action submit() returns {
        status  : String;
        message : String;
      };

      action approve(comment : String(500)) returns {
        status     : String;
        message    : String;
        approvedAt : Timestamp;
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

      // Bound Function
      function getSummary() returns {
        poNumber    : String;
        supplier    : String;
        itemCount   : Integer;
        totalAmount : Decimal(12,2);
        status      : String;
        daysOpen    : Integer;
      };
    };

  entity PurchaseOrderItems as projection on db.PurchaseOrderItems;

  @readonly
  entity Suppliers as projection on db.Suppliers;

  @readonly
  entity Products as projection on db.Products;

  // Unbound Function
  function getPurchasingDashboard() returns {
    totalPOs        : Integer;
    draftCount      : Integer;
    pendingApproval : Integer;
    approvedCount   : Integer;
    totalSpend      : Decimal(12,2);
  };

  // Events
  event POSubmitted {
    poId         : UUID;
    poNumber     : String;
    supplierName : String;
    totalAmount  : Decimal(12,2);
    submittedBy  : String;
  }

  event POApproved {
    poId       : UUID;
    poNumber   : String;
    approvedBy : String;
    comment    : String;
  }

  event PORejected {
    poId       : UUID;
    poNumber   : String;
    rejectedBy : String;
    reason     : String;
  }

}