require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// Connect to MongoDB database
// mongoose.connect('mongodb://127.0.0.1:27017/todolistDB', {useNewUrlParser: true, useUnifiedTopology: true})
mongoose.set('strictQuery', false);
mongoose
  .connect(
    process.env.MONGO_URI,
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => {
    console.log('Connected to DB');
    // Start the server
    app.listen(3000, function() {
      console.log('Server started on port 3000');
    });
  })
  .catch(error => {
    console.error('Error connecting to DB:', error);
  });

// Define the schema for items
const itemsSchema = {
  name: String  
};
// Create the Item model
const Item = mongoose.model("Item", itemsSchema);
    // Create default items
    const item1 = new Item({
      name: "Welcome to your task list!"
    });
    const item2 = new Item({
      name: "Click + to add item"
    });
    const item3 = new Item({
      name: "Click - to delete item"
    });
    const defaultItems = [item1, item2, item3];
// create Schema for list
const listSchema = {
  name: String,
  items: [itemsSchema]
};
// create model for list
const List = mongoose.model("list", listSchema);

app.get("/:customListName", async function(req, res) {
  const customListName = _.capitalize(req.params.customListName);
  try {
    const foundList = await List.findOne({ name: customListName });
    if (!foundList) {
      const list = new List({
        name: customListName,
        items: defaultItems
      });
      try {
        await list.save();
      } catch (error) {
        console.log('Error saving list:', error);
      }
      res.redirect('/'+customListName);
    } else {
      res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
    }
  } catch (error) {
    console.log('Error:', error);
  }
});

app.get("/", async function(req, res) {
  try {
    const foundItems = await Item.find({});
    if (foundItems.length === 0) {
    res.redirect('/');
    // Insert default items into the database
    Item.insertMany(defaultItems);
    }
    res.render("list", {listTitle: "Today", newListItems: foundItems});
  } catch (error) {
    console.log("Error finding items:", error);
  }
});

app.post("/", async function(req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  });
  if (listName === "Today") {
    await item.save();
    res.redirect('/');
  } else {
    try {
      const foundList = await List.findOne({ name: listName });
      foundList.items.push(item);
      await foundList.save();
      res.redirect('/' + listName);
    } catch (error) {
      console.log("Error:", error);
    }
  }
});

  app.post("/delete", async function(req, res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;
    if (listName === "Today") {
      try {
        await Item.findByIdAndRemove(checkedItemId);
        console.log("Item deleted!");
      } catch (error) {
        console.log("Error deleting item:", error);
      }
      res.redirect("/");
    } else {
      try {
        await List.findOneAndUpdate(
          { name: listName },
          { $pull: { items: { _id: checkedItemId } } }
        );
        res.redirect("/" + listName);
      } catch (error) {
        console.log("Error updating list:", error);
      }
    }
  });

app.get("/about", function(req, res){
  res.render("about");
});
