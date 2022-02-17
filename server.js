const { Sequelize } = require("sequelize");
const express = require("express");
const app = express();
const db = new Sequelize("postgres://localhost/sequelize_dealers_choice");
const morgan = require("morgan");
const html = require("html-template-tag");
const methodOverride = require("method-override");
app.use(methodOverride("_method"));
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: false }));
//EXPRESS
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`listening on Port ${port}`));

//SEQUELIZE
const ShoppingList = db.define("shoppinglist", {
  name: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
    },
  },
});

const Category = db.define("category", {
  name: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
});

//creates a foreign key: categoryId in ShoppingList
ShoppingList.belongsTo(Category);

const start = async () => {
  try {
    await db.sync({ force: true });
    const [
      avocado,
      wine,
      cheese,
      steak,
      lobster,
      chocolate,
      refrigerator,
      oven,
      grill,
      chandelier,
      sofa,
    ] = await Promise.all(
      [
        "avocado",
        "wine",
        "cheese",
        "steak",
        "lobster",
        "chocolate",
        "refrigerator",
        "oven",
        "grill",
        "chandelier",
        "sofa",
      ].map((item) => ShoppingList.create({ name: `${item}` }))
    );

    const [groceries, appliances] = await Promise.all(
      ["groceries", "appliances"].map((category) =>
        Category.create({ name: `${category}` })
      )
    );

    await avocado.setCategory(groceries);
    await wine.setCategory(groceries);
    await cheese.setCategory(groceries);
    await steak.setCategory(groceries);
    await lobster.setCategory(groceries);
    await chocolate.setCategory(groceries);
    await refrigerator.setCategory(appliances);
    await oven.setCategory(appliances);
    await grill.setCategory(appliances);
    await chandelier.setCategory(appliances);
    await sofa.setCategory(appliances);
  } catch (err) {
    console.log(err);
  }
};
start();

app.get("/", (req, res) => res.redirect("/shoppinglist"));
app.get("/shoppinglist", async (req, res, next) => {
  try {
    const shoppinglist = await ShoppingList.findAll({ include: [Category] });
    const categories = await Category.findAll();
    const lists = shoppinglist
      .map((list) => {
        return html`<html>
          <body>
            <div>
              ITEM: ${list.name.toUpperCase()} => CATEGORY:
              <a href="/categories/${list.category.id}">
                ${list.category.name.toUpperCase()}
              </a>
            </div>
          </body>
        </html>`;
      })
      .join("");

    res.send(`<html>
      <head>
        <title>Shopping List</title>
      </head>
      <body>
        <h1>Shopping List</h1>
        <div>${lists} </div>
        <form method="POST">
          <input name='name' placeholder = 'Add an item' />
          <select name='categoryId'>
            ${categories
              .map((category) => {
                return `<option value=${category.id}> ${category.name} </option>`;
              })
              .join()}
              </select>
              <button>Create</button>
        </form>
      </body>
    </html>`);
  } catch (err) {
    console.log(err);
  }
});

app.post("/shoppinglist", async (req, res, next) => {
  try {
    const newItem = await ShoppingList.create(req.body);
    res.redirect("/shoppinglist");
    // res.redirect(`/categories/${newItem.categoryId}`);
  } catch (err) {
    next(err);
  }
});

app.delete("/shoppinglist/:id", async (req, res, next) => {
  try {
    const employeeId = req.params.id;
    const item = await ShoppingList.findByPk(employeeId);
    await item.destroy();
    res.redirect(`/categories/${item.categoryId}`);
  } catch (err) {
    next(err);
  }
});
app.get("/categories/:categoryId", async (req, res, next) => {
  try {
    const selectedCategory = req.params.categoryId;
    const categories = await Category.findByPk(selectedCategory);
    const listPerCategory = await ShoppingList.findAll({
      include: [{ model: Category, where: { id: selectedCategory } }],
    });
    const hello = listPerCategory
      .map((list) => {
        return `<html>
          <body>
            <div>
              <form method='POST' action='/shoppinglist/${
                list.id
              }?_method=delete'>
              <button>X</button>
              ITEM: ${list.name.toUpperCase()}
            </form>
            </div>
          </body>
        </html>`;
      })
      .join("");

    res.send(`<html>
        <head>
          <title>Shopping List</title>
        </head>
        <body>
          <h1>${categories.name.toUpperCase()}</h1>
          <h2><a href='/shoppinglist'> <<= BACK </a></h2>
          <div>${hello} </div>
        </body>
      </html>`);
  } catch (err) {
    next(err);
  }
});
