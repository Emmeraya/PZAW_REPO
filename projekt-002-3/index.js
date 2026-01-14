import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import pics from "./galleri/pics.js";
import settings from "./galleri/settings.js";

const port = 8000;

const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded());
app.use(morgan("dev"));
app.use(cookieParser());

const settingsRouter = express.Router();
settingsRouter.use("/toggle-theme", settings.themeToggle);
app.use("/settings", settingsRouter);

function settingsLocals(req, res, next) {
  res.locals.app = settings.getSettings(req);
  res.locals.page = req.path;
  next();
}
app.use(settingsLocals);

function log_request(req, res, next) {
  console.log(`Request ${req.method} ${req.path}`);
  next();
}
app.use(log_request);

app.get("/", (req, res) => {
  var last_viewed_categories = null;
  if (res.locals.app.cookie_consent && req.cookies[LAST_VIEWED_COOKIE]) {
    let last_viewed = req.cookies[LAST_VIEWED_COOKIE]?.split(",") || [];
    last_viewed_categories = last_viewed
      .map((x) => parseInt(x, 10))
      .filter((x) => !isNaN(x))
      .map((id) => pics.getCategorySummary(id));
  }
  res.render("categories", {
    title: "Kategorie",
    categories: pics.getCategorySummaries(),
    last_viewed_categories,
  });
});

app.get("/kitties/:category_id", (req, res) => {
  const category = pics.getCategory(req.params.category_id);
  if (category != null) {
     if (res.locals.app.cookie_consent) {
      let last_viewed_dirty = req.cookies[LAST_VIEWED_COOKIE]?.split(",") || [];
      let last_viewed = [
        category.category_id,
        ...last_viewed_dirty
          .map((x) => parseInt(x, 10))
          .filter((x) => !isNaN(x) && x !== category.category_id)
          .slice(0, 2),
      ];
      res.cookie(LAST_VIEWED_COOKIE, last_viewed.join(","));
    }
    res.render("category", {
      title: category.name,
      category,
    });
  } else {
    res.sendStatus(404);
  }
});



app.post("/kitties/add_kitty/:category_id", (req, res) => {
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
      res.render("new_kitty", {
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


app.get("/new_category", (req, res) => {
  res.render("category_new", {
    title: "Nowa kategoria",
  });
});

app.post("/new_category", (req, res) => {
  const category_name = req.body.name;
  var category_id = null;
  var errors = pics.validateCategoryName(category_name);
  if (errors.length == 0) {
    category_id = pics.generateCategoryId(category_name);
    if (pics.hasCategory(category_id)) {
      errors.push("Category id is already taken");
    }
  }

  if (errors.length == 0) {
    pics.addCategory(category_id, category_name);
    res.redirect(`/${category_id}`);
  } else {
    res.status(400);
    res.render("category_new", {
      errors,
      title: "Nowa kategoria",
      name: category_name,
    });
  }
});

app.get("/kitties/edit/:category_id", (req, res) => {
  const category_id = req.params.category_id;
  const errors = [];
  var category = pics.getCategory(category_id);
  if (category != null) {
    res.render("category_edit", {
      errors,
      title: "Edycja kategorii",
      category,
    });
  } else {
    res.sendStatus(404);
  }
});

app.post("/kitties/edit/:category_id", (req, res) => {
  const category_id = req.params.category_id;
  if (pics.hasCategory(category_id)) {
    const category_name = req.body.name;
    var new_category_id = null;
    const errors = pics.validateCategoryName(category_name);
    if (errors.length == 0) {
      new_category_id = pics.generateCategoryId(category_name);
      if (
        new_category_id !== category_id &&
        pics.hasCategory(new_category_id)
      ) {
        errors.push("Category id is already taken");
      }
    }
    if (errors.length == 0) {
      const category = pics.updateCategory(
        category_id,
        new_category_id,
        category_name
      );
      if (category != null) {
        res.redirect("/kitties/" + category.id);
      } else {
        res.write("Unexpected error while updating category");
        res.sendStatus(500);
      }
    } else {
      const category = pics.getCategory(category_id);
      res.render("category_edit", {
        errors,
        title: "Edycja kategorii",
        category,
      });
    }
  } else {
    res.sendStatus(404);
  }
});

app.post("/kitties/edit/:category_id/:kitty_id", (req, res) => {
  const category_id = req.params.category_id;
  const kitty_id = req.params.kitty_id;
  if (!pics.hasCategory(category_id) || !pics.hasKitty(kitty_id)) {
    res.sendStatus(404);
  } else {
    const kitty = {
      ascii_art: req.body.ascii_art,
      id: kitty_id,
    };
    const errors = pics.validateKittyData(kitty);
    if (errors.length == 0) {
      pics.updateKitty(kitty);
      res.redirect(`/kitties/edit/${category_id}`);
    } else {
      let category = pics.getCategory(category_id);
      res.render("category_edit", {
        errors,
        title: "Edycja kategorii",
        category,
      });
    }
  }
});

app.post("/kitties/delete/:category_id/:kitty_id", (req, res) => {
  const category_id = req.params.category_id;
  const kitty_id = req.params.kitty_id;
  if (!pics.hasCategory(category_id) || !pics.hasKitty(kitty_id)) {
    res.sendStatus(404);
  } else {
    pics.deleteKittyById(kitty_id);
    res.redirect(`/kitties/edit/${category_id}`);
  }
});



app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});