import { DatabaseSync } from "node:sqlite";

const db_path = "./db.sqlite";
const db = new DatabaseSync(db_path);

console.log("Creating database tables");
db.exec(
  `CREATE TABLE IF NOT EXISTS pc_categs (
    category_id   INTEGER PRIMARY KEY,
    id            TEXT UNIQUE NOT NULL,
    name          TEXT NOT NULL
  ) STRICT;
  CREATE TABLE IF NOT EXISTS pc_kitties (
    id            INTEGER PRIMARY KEY,
    category_id   INTEGER NOT NULL REFERENCES pc_categs(category_id) ON DELETE NO ACTION,
    ascii_art         TEXT NOT NULL
  ) STRICT;`
);

const db_ops = {
  insert_category: db.prepare(
    `INSERT INTO pc_categs (id, name)
        VALUES (?, ?) RETURNING category_id, id, name;`
  ),
  update_category_by_id: db.prepare(
    "UPDATE pc_categs SET id = $new_category_id, name = $name WHERE id = $category_id RETURNING category_id, id, name;"
  ),
  insert_kitty: db.prepare(
    `INSERT INTO pc_kitties (category_id, ascii_art) 
        VALUES (?, ?) RETURNING id, ascii_art;`
  ),
  insert_kitty_by_id: db.prepare(
    `INSERT INTO pc_kitties (category_id, ascii_art) VALUES (
      (SELECT category_id FROM pc_categs WHERE id = ?),
      ?
    ) 
    RETURNING id, ascii_art;`
  ),
  get_categories: db.prepare("SELECT id, name FROM pc_categs;"),
  get_category_by_id: db.prepare(
    "SELECT category_id, id, name FROM pc_categs WHERE id = ?;"
  ),
  get_kitty_by_id: db.prepare(
    "SELECT id, ascii_art FROM pc_kitties WHERE id = ?;"
  ),
  get_kitty_by_category_id: db.prepare(
    "SELECT id, ascii_art FROM pc_kitties WHERE category_id = ?;"
  ),
  update_kitty_by_id: db.prepare(
    "UPDATE pc_kitties SET ascii_art = ? WHERE id = ? RETURNING id, ascii_art;"
  ),
  delete_kitty_by_id: db.prepare("DELETE FROM pc_kitties WHERE id = ?;"),
  get_kitties_by_category_id: db.prepare(
    "SELECT id, ascii_art FROM pc_kitties WHERE category_id = ?;"
  ),
};


if (process.env.POPULATE_DB) {
  console.log("Populating db...");
  Object.entries(art_categories).map(([id, data]) => {
    let category = db_ops.insert_category.get(id, data.name);
    console.log("Created category:", category);
    for (let kitty of data.kitties) {
      let c = db_ops.insert_kitty.get(
        category.category_id,
        kitty.ascii_art
      );
      console.log("Created katt:", c);
    }
  });
}

export function getCategorySummaries() {
  var categories = db_ops.get_categories.all();
  return categories;
}

export function hasCategory(categoryId) {
  let category = db_ops.get_category_by_id.get(categoryId);
  return category != null;
}

export function hasKitty(kittyId) {
  let category = db_ops.get_kitty_by_id.get(kittyId);
  return category != null;
}

export function getCategory(categoryId) {
  let category = db_ops.get_category_by_id.get(categoryId);
  if (category != null) {
    category.kitties = db_ops.get_kitty_by_category_id.all(category.category_id);
    return category;
  }
  return null;
}

export function addKitty(categoryId, kitty) {
  return db_ops.insert_kitty_by_id.get(categoryId, kitty.ascii_art);
}


export function updateKitty(kitty) {
  return db_ops.update_kitty_by_id.get(kitty.ascii_art, kitty.id);
}

export function deleteKittyById(kittyId) {
  return db_ops.delete_kitty_by_id.run(kittyId);
}

export function addCategory(categoryId, name) {
  return db_ops.insert_category.get(categoryId, name);
}

export function updateCategory(categoryId, newCategoryId, name) {
  return db_ops.update_category_by_id.get({
    $category_id: categoryId,
    $new_category_id: newCategoryId,
    $name: name,
  });
}


export function validateKittyData(kitty) {
  var errors = [];
  var fields = ["ascii_art"];
  for (let field of fields) {
    if (!kitty.hasOwnProperty(field)) errors.push(`Missing field '${field}'`);
    else {
      if (typeof kitty[field] != "string")
        errors.push(`'${field}' expected to be string`);
      else {
        if (kitty[field].length < 1 || kitty[field].length > 500)
          errors.push(`'${field}' expected length: 1-500`);
      }
    }
  }
  return errors;
}

export function validateCategoryName(name) {
  var errors = [];
  if (typeof name != "string") {
    errors.push("Category name should be a string");
  } else {
    if (name.length < 3 || name.length > 100) {
      errors.push("Category name should have 3-100 characters");
    }
  }

  return errors;
}

export function generateCategoryId(name) {
  const categoryId = name
    .toLowerCase()
    .replace(/(\s|[.-])+/g, "-")
    .replace(/[^a-z0-9.-]/g, "");

  return categoryId;
}

export default {
  getCategorySummaries,
  hasCategory,
  getCategory,
  hasKitty,
  addKitty,
  updateKitty,
  deleteKittyById,
  addCategory,
  updateCategory,
  validateKittyData,
  validateCategoryName,
  generateCategoryId,
};
