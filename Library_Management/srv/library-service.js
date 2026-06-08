const cds = require('@sap/cds');

module.exports = function () {

  // ==================================================
  // BOOKS - CREATE VALIDATION
  // ==================================================

  this.before('CREATE', 'Books', async (req) => {

    const {
      title,
      isbn,
      pages,
      price,
      totalCopies,
      availableCopies,
      author_ID,
      genre_code
    } = req.data;

    console.log('Creating Book:', req.data);

    if (!title || title.trim() === '') {
      req.error(400, 'Title is required', 'title');
    }

    if (!isbn || isbn.length !== 13) {
      req.error(400, 'ISBN must be exactly 13 characters', 'isbn');
    }

    if (pages <= 0) {
      req.error(400, 'Pages must be greater than 0', 'pages');
    }

    if (price <= 0) {
      req.error(400, 'Price must be greater than 0', 'price');
    }

    if (totalCopies < 0) {
      req.error(400, 'Total copies cannot be negative', 'totalCopies');
    }

    if (availableCopies < 0) {
      req.error(400, 'Available copies cannot be negative', 'availableCopies');
    }

    if (availableCopies > totalCopies) {
      req.error(
        400,
        'Available copies cannot exceed total copies',
        'availableCopies'
      );
    }

    // Validate Author
    if (author_ID) {

      const author = await cds.run(
        SELECT.one
          .from('lib.management.Authors')
          .where({ ID: author_ID })
      );

      console.log('Author Found:', author);

      if (!author) {
        req.error(404, 'Author not found', 'author_ID');
      }
    }

    // Validate Genre
    if (genre_code) {

      const genre = await cds.run(
        SELECT.one
          .from('lib.management.Genres')
          .where({ code: genre_code })
      );

      console.log('Genre Found:', genre);

      if (!genre) {
        req.error(404, 'Genre not found', 'genre_code');
      }
    }

    req.data.title = title.trim();
  });

  // ==================================================
  // BOOKS - UPDATE VALIDATION
  // ==================================================

  this.before('UPDATE', 'Books', (req) => {

    const {
      price,
      availableCopies,
      totalCopies
    } = req.data;

    console.log('Updating Book:', req.data);

    if (price !== undefined && price <= 0) {
      req.error(400, 'Price must be greater than 0', 'price');
    }

    if (availableCopies !== undefined && availableCopies < 0) {
      req.error(
        400,
        'Available copies cannot be negative',
        'availableCopies'
      );
    }

    if (
      availableCopies !== undefined &&
      totalCopies !== undefined &&
      availableCopies > totalCopies
    ) {
      req.error(
        400,
        'Available copies cannot exceed total copies',
        'availableCopies'
      );
    }
  });

  // ==================================================
  // BOOKS - AFTER READ
  // ==================================================

  this.after('READ', 'Books', (results) => {

    const books = Array.isArray(results)
      ? results
      : [results];

    for (const book of books) {

      if (!book) continue;

      book.priceWithGST =
        book.price
          ? +(book.price * 1.18).toFixed(2)
          : 0;

      if (book.availableCopies > 10) {
        book.availability = 'Available';
      }
      else if (book.availableCopies > 0) {
        book.availability = 'Limited';
      }
      else {
        book.availability = 'Out of Stock';
      }
    }
  });

  // ==================================================
  // BOOKS - DELETE
  // ==================================================

  this.before('DELETE', 'Books', async (req) => {

    const ID = req.params[0]?.ID || req.params[0];

    console.log('Deleting Book:', ID);
  });

  // ==================================================
  // AUTHORS - CREATE VALIDATION
  // ==================================================

  this.before('CREATE', 'Authors', (req) => {

    const {
      firstName,
      lastName,
      email
    } = req.data;

    if (!firstName || firstName.trim() === '') {
      req.error(400, 'First name is required', 'firstName');
    }

    if (!lastName || lastName.trim() === '') {
      req.error(400, 'Last name is required', 'lastName');
    }

    if (
      email &&
      !email.includes('@')
    ) {
      req.error(
        400,
        'Please provide a valid email address',
        'email'
      );
    }
  });

  // ==================================================
  // AUTHORS - DELETE CHECK
  // ==================================================

  this.before('DELETE', 'Authors', async (req) => {

    const ID = req.params[0]?.ID || req.params[0];

    const books = await cds.run(
      SELECT.from('lib.management.Books')
        .where({ author_ID: ID })
    );

    if (books.length > 0) {

      req.reject(
        409,
        `Cannot delete author. ${books.length} book(s) are linked to this author.`
      );
    }
  });

};