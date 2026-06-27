using { NorthWind as external } from './external/NorthWind';

service CatalogService {

    @readonly
    entity Products as projection on external.Products {
        key ID,
        Name,
        Description,
        ReleaseDate,
        DiscontinuedDate,
        Rating,
        Price
    };

}