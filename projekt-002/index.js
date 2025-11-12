import express from "express";
import morgan from "morgan";
import pics from "./galleri/pics.js";

const port = 8000;

const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded());
app.use(morgan("dev"));

function log_request(req, res, next) {
  console.log(`Request ${req.method} ${req.path}`);
  next();
}
app.use(log_request);

app.get("/kitties", (req, res) => {
  res.render("categories", {
    title: "Kategorie",
    categories: pics.getCategorySummaries(),
  });
});

app.get("/kitties/:category_id", (req, res) => {
  const category = pics.getCategory(req.params.category_id);
  if (category != null) {
    res.render("category", {
      title: category.name,
      category,
    });
  } else {
    res.sendStatus(404);
  }
});



app.post("/kitties/:category_id/new", (req, res) => {
  const category_id = req.params.category_id;
  if (!pics.hasCategory(category_id)) {
    res.sendStatus(404);
  } else {
    let katt_data = {
      ascii_art: req.body.ascii_art
    };
    var errors = pics.validateKittyData(katt_data);
    if (errors.length == 0) {
      pics.addKitty(category_id, katt_data);
      res.redirect(`/kitties/${category_id}`);
    } else {
      res.status(400);
      res.render("new_katt", {
        errors,
        title: "Nowy kot",
        ascii_art: req.ascii_art,
        category: {
          id: category_id,
        },
      });
    }
  }
});




app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});