const cds = require('@sap/cds');

module.exports = cds.service.impl(async function () {

    const { Products } = this.entities;

    const service = await cds.connect.to('NorthWind');

    this.on('READ', Products, req => {
        return service.tx(req).run(req.query);
    });

});