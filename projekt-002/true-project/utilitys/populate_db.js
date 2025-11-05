import pics from "../galleri/pics.js";

const art_categories = {
  "complex-cats": {
    name: "complex kitties",
    kittys: [
      { ascii_art:":3" },
      { ascii_art:":3" },
      { ascii_art:":3" },
      { ascii_art:":3" },
      { ascii_art:":3" },
    ],
  },
  "emoji": {
    name: "emoji",
    kittys: [
      { ascii_art:":3" },
      { ascii_art:";3" },
      { ascii_art:">:3" },
      { ascii_art:"3:" },
      { ascii_art:"3:<" },
    ],
  },
};

console.log("Populating db...");

Object.entries(art_categories).map(([id, data]) => {
  let category = pics.addCategory(id, data.name);
  console.log("Created category:", category);
  for (let kitty of data.kittys) {
    let c = pics.addKitty(category.id, kitty);
    console.log("Created katt:", c);
  }
});