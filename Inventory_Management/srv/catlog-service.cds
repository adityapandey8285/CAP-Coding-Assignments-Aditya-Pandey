using inventory from '../db/schema';

service CatalogService {

  entity Products as projection on inventory.Products {
    *,
    virtual stockCriticality : Integer @Core.Computed
  } actions {
    action restock(quantity: Integer) returns String;
    action markDiscontinued() returns String;
  };

}