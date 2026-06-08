const cds = require('@sap/cds');

module.exports = function () {

  this.on('submit', 'PurchaseOrders', async (req) => {
    const { ID } = req.params[0];
    const { PurchaseOrders, PurchaseOrderItems, Suppliers } = cds.entities;

    const po = await SELECT.one.from(PurchaseOrders).where({ ID });
    if (!po) req.reject(404, 'Purchase Order not found');

    if (po.status !== 'Draft') {
      req.reject(400, `Cannot submit: PO is in "${po.status}" status. Only Draft POs can be submitted.`);
    }

    const items = await SELECT.from(PurchaseOrderItems)
      .where({ order_ID: ID });

    if (items.length === 0) {
      req.reject(400, 'Cannot submit: PO has no items.');
    }

    const total = items.reduce(
      (sum, item) => sum + (item.quantity * item.unitPrice),
      0
    );

    await UPDATE(PurchaseOrders)
      .set({
        status: 'Submitted',
        totalAmount: +total.toFixed(2)
      })
      .where({ ID });

    const supplier = await SELECT.one
      .from(Suppliers)
      .where({ ID: po.supplier_ID });

    await this.emit('POSubmitted', {
      poId: ID,
      poNumber: po.poNumber,
      supplierName: supplier?.name || 'Unknown',
      totalAmount: +total.toFixed(2),
      submittedBy: req.user.id
    });

    return {
      status: 'Submitted',
      message: `PO ${po.poNumber} submitted successfully`
    };
  });

  this.on('approve', 'PurchaseOrders', async (req) => {
    const { ID } = req.params[0];
    const { comment } = req.data;
    const { PurchaseOrders } = cds.entities;

    const po = await SELECT.one.from(PurchaseOrders).where({ ID });
    if (!po) req.reject(404, 'Purchase Order not found');

    if (po.status !== 'Submitted') {
      req.reject(400, `Cannot approve: Current status is "${po.status}"`);
    }

    await UPDATE(PurchaseOrders)
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
    const { PurchaseOrders } = cds.entities;

    const po = await SELECT.one.from(PurchaseOrders).where({ ID });
    if (!po) req.reject(404, 'Purchase Order not found');

    if (po.status !== 'Submitted') {
      req.reject(400, `Cannot reject: Current status is "${po.status}"`);
    }

    if (!reason) {
      req.reject(400, 'Reason is required');
    }

    await UPDATE(PurchaseOrders)
      .set({ status: 'Rejected' })
      .where({ ID });

    await this.emit('PORejected', {
      poId: ID,
      poNumber: po.poNumber,
      rejectedBy: req.user.id,
      reason
    });

    return {
      status: 'Rejected',
      message: `PO ${po.poNumber} rejected`
    };
  });

  this.on('receive', 'PurchaseOrders', async (req) => {
    const { ID } = req.params[0];
    const { notes } = req.data;
    const { PurchaseOrders, PurchaseOrderItems, Products } = cds.entities;

    const po = await SELECT.one.from(PurchaseOrders).where({ ID });
    if (!po) req.reject(404, 'Purchase Order not found');

    if (po.status !== 'Approved') {
      req.reject(400, `Cannot receive: Current status is "${po.status}"`);
    }

    const items = await SELECT.from(PurchaseOrderItems)
      .where({ order_ID: ID });

    for (const item of items) {
      const product = await SELECT.one
        .from(Products)
        .where({ ID: item.product_ID });

      if (product) {
        await UPDATE(Products)
          .set({
            stock: product.stock + item.quantity
          })
          .where({ ID: item.product_ID });
      }
    }

    await UPDATE(PurchaseOrders)
      .set({ status: 'Received' })
      .where({ ID });

    return {
      status: 'Received',
      message: `PO ${po.poNumber} received. ${notes || ''}`
    };
  });

  this.on('getSummary', 'PurchaseOrders', async (req) => {
    const { ID } = req.params[0];
    const { PurchaseOrders, PurchaseOrderItems, Suppliers } = cds.entities;

    const po = await SELECT.one.from(PurchaseOrders).where({ ID });
    if (!po) req.reject(404, 'Purchase Order not found');

    const items = await SELECT.from(PurchaseOrderItems)
      .where({ order_ID: ID });

    const supplier = await SELECT.one
      .from(Suppliers)
      .where({ ID: po.supplier_ID });

    const totalAmount = items.reduce(
      (sum, item) => sum + (item.quantity * item.unitPrice),
      0
    );

    return {
      poNumber: po.poNumber,
      supplier: supplier?.name || 'Unknown',
      itemCount: items.length,
      totalAmount: +totalAmount.toFixed(2),
      status: po.status,
      daysOpen: 0
    };
  });

  this.on('getPurchasingDashboard', async () => {
    const { PurchaseOrders } = cds.entities;

    const allPOs = await SELECT.from(PurchaseOrders);

    return {
      totalPOs: allPOs.length,
      draftCount: allPOs.filter(p => p.status === 'Draft').length,
      pendingApproval: allPOs.filter(p => p.status === 'Submitted').length,
      approvedCount: allPOs.filter(p => p.status === 'Approved').length,
      totalSpend: +allPOs
        .filter(p => ['Approved', 'Received'].includes(p.status))
        .reduce((sum, p) => sum + (p.totalAmount || 0), 0)
        .toFixed(2)
    };
  });

};