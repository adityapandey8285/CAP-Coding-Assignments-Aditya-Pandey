// using CatalogService from '../../srv/catalog-service';

annotate CatalogService.Products with @UI: {

  SelectionFields: [
    productName,
    price,
    stock
  ],

  LineItem: [
    { Value: productName, Label: 'Product' },
    { Value: stock, Label: 'Stock', Criticality: stockCriticality },
    { Value: price, Label: 'Price' }
  ],

  HeaderInfo: {
    TypeName: 'Product',
    TypeNamePlural: 'Products',
    Title: { Value: productName }
  },

  HeaderFacets: [
    { $Type: 'UI.ReferenceFacet', Target: '@UI.DataPoint#Stock' },
    { $Type: 'UI.ReferenceFacet', Target: '@UI.DataPoint#Price' }
  ],

  DataPoint#Stock: {
    Value: stock,
    Title: 'Current Stock',
    Criticality: stockCriticality
  },

  DataPoint#Price: {
    Value: price,
    Title: 'Price'
  },

  Facets: [
    {
      $Type: 'UI.ReferenceFacet',
      Target: '@UI.FieldGroup#GeneralInfo',
      Label: 'General Information'
    },
    {
      $Type: 'UI.ReferenceFacet',
      Target: '@UI.FieldGroup#StockPricing',
      Label: 'Stock & Pricing'
    },
    {
      $Type: 'UI.ReferenceFacet',
      Target: '@UI.FieldGroup#Admin',
      Label: 'Administration'
    }
  ],

  FieldGroup#GeneralInfo: {
    Data: [
      { Value: productName, Label: 'Product Name' }
    ]
  },

  FieldGroup#StockPricing: {
    Data: [
      { Value: stock, Label: 'Current Stock', Criticality: stockCriticality },
      { Value: price, Label: 'Price' }
    ]
  },

  FieldGroup#Admin: {
    Data: [
      { Value: createdAt, Label: 'Created On' },
      { Value: createdBy, Label: 'Created By' },
      { Value: modifiedAt, Label: 'Last Modified' },
      { Value: modifiedBy, Label: 'Modified By' }
    ]
  }
};

annotate CatalogService.Products with {
  productName @title: 'Product Name';
  stock       @title: 'Stock Quantity';
  price       @title: 'Unit Price';
  ID          @UI.Hidden;
};