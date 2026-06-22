const cds = require('@sap/cds');

module.exports = cds.service.impl(function () {

  this.after('READ', 'Products', (results) => {
    const rows = Array.isArray(results) ? results : [results];

    for (const p of rows) {
      if (!p) continue;

      if (p.stock === 0) p.stockCriticality = 1;
      else if (p.stock < 10) p.stockCriticality = 2;
      else p.stockCriticality = 3;
    }
  });

  this.on('restock', 'Products', async (req) => {
    const { ID } = req.params[0];
    const { quantity } = req.data;

    await UPDATE('inventory.Products')
      .set({ stock: { '+=': quantity } })
      .where({ ID });

    return `Stock increased by ${quantity}`;
  });

  this.on('markDiscontinued', 'Products', async (req) => {
    const { ID } = req.params[0];

    await UPDATE('inventory.Products')
      .set({ status: 'Discontinued' })
      .where({ ID });

    return 'Product marked as discontinued';
  });

});