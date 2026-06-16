const cds = require('@sap/cds');

module.exports = function () {

  const setUIFields = (po) => {
    if (!po) return;

    switch (po.status) {
      case 'Draft':
        po.statusCriticality = 0;
        po.progressValue = 10;
        po.submitHidden = false;
        po.approveHidden = true;
        po.rejectHidden = true;
        po.poFieldControl = 7;
        break;

      case 'Pending':
        po.statusCriticality = 2;
        po.progressValue = 50;
        po.submitHidden = true;
        po.approveHidden = false;
        po.rejectHidden = false;
        po.poFieldControl = 0;
        break;

      case 'Approved':
        po.statusCriticality = 3;
        po.progressValue = 100;
        po.submitHidden = true;
        po.approveHidden = true;
        po.rejectHidden = true;
        po.poFieldControl = 0 ;
        break;

      case 'Rejected':
        po.statusCriticality = 1;
        po.progressValue = 0;
        po.submitHidden = true;
        po.approveHidden = true;
        po.rejectHidden = true;
        po.poFieldControl = 0 ;
        break;

      case 'Received':
        po.statusCriticality = 3;
        po.progressValue = 100;
        po.submitHidden = true;
        po.approveHidden = true;
        po.rejectHidden = true;
        po.poFieldControl = 0 ;
        break;

      default:
        po.statusCriticality = 0;
        po.progressValue = 0;
        po.submitHidden = true;
        po.approveHidden = true;
        po.rejectHidden = true;
        po.poFieldControl = 1 ;
    }
  };

  this.after('READ', 'PurchaseOrders', (data) => {
    const rows = Array.isArray(data) ? data : [data];
    rows.forEach(setUIFields);
  });

  this.after('READ', 'PurchaseOrderItems', (data) => {
  const rows = Array.isArray(data) ? data : [data];

  rows.forEach(item => {
    if (!item) return;

    if (!item.totalPrice && item.quantity && item.unitPrice) {
      item.totalPrice = +(Number(item.quantity) * Number(item.unitPrice)).toFixed(2);
    }
  });
});

  this.before('UPDATE', 'PurchaseOrders', async (req) => {
  const { ID } = req.data;

  const old = await SELECT.one.from('com.epm.PurchaseOrders').where({ ID });

  if (old && old.status !== 'Draft') {
    const allowed = ['status', 'modifiedAt', 'modifiedBy'];

    const changedFields = Object.keys(req.data).filter(
      key => !allowed.includes(key)
    );

    if (changedFields.length > 0) {
      req.reject(400, 'Purchase Order cannot be edited after submission or approval');
    }
  }
});
  this.before(['CREATE', 'UPDATE'], 'PurchaseOrders', (req) => {
    if (!req.data.status) req.data.status = 'Draft';
    if (!req.data.currency_code) req.data.currency_code = 'INR';

    if (req.event === 'CREATE') {
      if (!req.data.poNumber) req.error(400, 'PO Number is required', 'poNumber');
      if (!req.data.supplier_ID) req.error(400, 'Supplier is required', 'supplier_ID');
      if (!req.data.orderDate) req.error(400, 'Order Date is required', 'orderDate');
    }
  });

this.before(['CREATE', 'UPDATE'], 'PurchaseOrderItems', async (req) => {
  let quantity = req.data.quantity;
  let unitPrice = req.data.unitPrice;

  if (quantity !== undefined && quantity <= 0) {
    req.error(400, 'Quantity must be greater than 0', 'quantity');
  }

  if (unitPrice !== undefined && unitPrice <= 0) {
    req.error(400, 'Unit Price must be greater than 0', 'unitPrice');
  }

  if (req.event === 'UPDATE') {
    const old = await SELECT.one.from('com.epm.PurchaseOrderItems')
      .where({ ID: req.data.ID || req.params?.[0]?.ID });

    quantity = quantity ?? old?.quantity;
    unitPrice = unitPrice ?? old?.unitPrice;
  }

  if (quantity !== undefined && unitPrice !== undefined) {
    req.data.totalPrice = +(Number(quantity) * Number(unitPrice)).toFixed(2);
  }
});



  async function recalculatePO(orderId) {
    if (!orderId) return;

    const items = await SELECT.from('com.epm.PurchaseOrderItems')
      .where({ order_ID: orderId });

    const net = items.reduce((sum, item) => {
      const lineTotal = item.totalPrice || (item.quantity || 0) * (item.unitPrice || 0);
      return sum + Number(lineTotal || 0);
    }, 0);

    const tax = +(net * 0.18).toFixed(2);
    const total = +(net + tax).toFixed(2);

    await UPDATE('com.epm.PurchaseOrders')
      .set({
        netAmount: net,
        taxAmount: tax,
        totalAmount: total
      })
      .where({ ID: orderId });
  }

 this.after(['CREATE', 'UPDATE'], 'PurchaseOrderItems', async (data, req) => {
  const orderId = req.data.order_ID || data?.order_ID;

  if (orderId) {
    await recalculatePO(orderId);
  }
});

  this.on('submit', 'PurchaseOrders', async (req) => {
    const { ID } = req.params[0];

    const po = await SELECT.one.from('com.epm.PurchaseOrders').where({ ID });
    if (!po) req.reject(404, 'Purchase Order not found');

    if (po.status !== 'Draft') {
      req.reject(400, `Only Draft POs can be submitted. Current status: ${po.status}`);
    }

    const items = await SELECT.from('com.epm.PurchaseOrderItems').where({ order_ID: ID });
    if (items.length === 0) {
      req.reject(400, 'PO must have at least one item');
    }

    await recalculatePO(ID);

    await UPDATE('com.epm.PurchaseOrders')
      .set({ status: 'Pending' })
      .where({ ID });

    const supplier = await SELECT.one.from('com.epm.Suppliers').where({ ID: po.supplier_ID });

    await this.emit('POSubmitted', {
      poId: ID,
      poNumber: po.poNumber,
      supplierName: supplier?.name || 'Unknown',
      totalAmount: po.totalAmount || 0,
      submittedBy: req.user.id
    });

    return {
      status: 'Pending',
      message: `PO ${po.poNumber} submitted for approval`
    };
  });

  this.on('approve', 'PurchaseOrders', async (req) => {
    const { ID } = req.params[0];
    const { comment } = req.data;

    const po = await SELECT.one.from('com.epm.PurchaseOrders').where({ ID });
    if (!po) req.reject(404, 'Purchase Order not found');

    if (po.status !== 'Pending') {
      req.reject(400, `Only Pending POs can be approved. Current status: ${po.status}`);
    }

    await UPDATE('com.epm.PurchaseOrders')
      .set({ status: 'Approved' })
      .where({ ID });

    await this.emit('POApproved', {
      poId: ID,
      poNumber: po.poNumber,
      approvedBy: req.user.id,
      comment: comment || ''
    });

    return {
      status: 'Approved',
      message: `PO ${po.poNumber} approved`,
      approvedAt: new Date().toISOString()
    };
  });

  this.on('reject', 'PurchaseOrders', async (req) => {
    const { ID } = req.params[0];
    const { reason } = req.data;

    if (!reason || reason.trim() === '') {
      req.reject(400, 'Rejection reason is required');
    }

    const po = await SELECT.one.from('com.epm.PurchaseOrders').where({ ID });
    if (!po) req.reject(404, 'Purchase Order not found');

    if (po.status !== 'Pending') {
      req.reject(400, `Only Pending POs can be rejected. Current status: ${po.status}`);
    }

    await UPDATE('com.epm.PurchaseOrders')
      .set({ status: 'Rejected' })
      .where({ ID });

    await this.emit('POrejected', {
      poId: ID,
      poNumber: po.poNumber,
      rejectedBy: req.user.id,
      reason
    });

    return {
      status: 'Rejected',
      message: `PO ${po.poNumber} rejected. Reason: ${reason}`
    };
  });

  this.on('receive', 'PurchaseOrders', async (req) => {
    const { ID } = req.params[0];
    const { notes } = req.data;

    const po = await SELECT.one.from('com.epm.PurchaseOrders').where({ ID });
    if (!po) req.reject(404, 'Purchase Order not found');

    if (po.status !== 'Approved') {
      req.reject(400, `Only Approved POs can be received. Current status: ${po.status}`);
    }

    const items = await SELECT.from('com.epm.PurchaseOrderItems').where({ order_ID: ID });

    for (const item of items) {
      const product = await SELECT.one.from('com.epm.Products').where({ ID: item.product_ID });

      if (product) {
        await UPDATE('com.epm.Products')
          .set({ stock: Number(product.stock || 0) + Number(item.quantity || 0) })
          .where({ ID: item.product_ID });
      }
    }

    await UPDATE('com.epm.PurchaseOrders')
      .set({ status: 'Received' })
      .where({ ID });

    return {
      status: 'Received',
      message: `PO ${po.poNumber} received. Stock updated for ${items.length} products.${notes ? ' Notes: ' + notes : ''}`
    };
  });

  this.on('getSummary', 'PurchaseOrders', async (req) => {
    const { ID } = req.params[0];

    const po = await SELECT.one.from('com.epm.PurchaseOrders').where({ ID });
    if (!po) req.reject(404, 'Purchase Order not found');

    const items = await SELECT.from('com.epm.PurchaseOrderItems').where({ order_ID: ID });
    const supplier = await SELECT.one.from('com.epm.Suppliers').where({ ID: po.supplier_ID });

    const createdDate = new Date(po.createdAt || po.orderDate);
    const today = new Date();
    const daysOpen = Math.floor((today - createdDate) / (1000 * 60 * 60 * 24));

    const totalAmount = items.reduce((sum, item) => {
      const lineTotal = item.totalPrice || (item.quantity || 0) * (item.unitPrice || 0);
      return sum + Number(lineTotal || 0);
    }, 0);

    return {
      poNumber: po.poNumber,
      supplier: supplier?.name || 'Unknown',
      itemCount: items.length,
      totalAmount: +totalAmount.toFixed(2),
      status: po.status,
      daysOpen
    };
  });

  this.on('getPurchasingDashboard', async () => {
    const allPOs = await SELECT.from('com.epm.PurchaseOrders');

    return {
      totalPOs: allPOs.length,
      draftCount: allPOs.filter(p => p.status === 'Draft').length,
      pendingApproval: allPOs.filter(p => p.status === 'Pending').length,
      approvedCount: allPOs.filter(p => p.status === 'Approved').length,
      totalSpend: +allPOs
        .filter(p => ['Approved', 'Received'].includes(p.status))
        .reduce((sum, p) => sum + Number(p.totalAmount || 0), 0)
        .toFixed(2)
    };
  });

  this.on('POSubmitted', (msg) => {
    const { poNumber, supplierName, totalAmount, submittedBy } = msg.data;
    console.log(`PO SUBMITTED: ${poNumber}, Supplier: ${supplierName}, Amount: ${totalAmount}, By: ${submittedBy}`);
  });

  this.on('POApproved', (msg) => {
    const { poNumber, approvedBy, comment } = msg.data;
    console.log(`PO APPROVED: ${poNumber}, By: ${approvedBy}, Comment: ${comment}`);
  });

  this.on('POrejected', (msg) => {
    const { poNumber, rejectedBy, reason } = msg.data;
    console.log(`PO REJECTED: ${poNumber}, By: ${rejectedBy}, Reason: ${reason}`);
  });

};