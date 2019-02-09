// Require packages
const inquirer = require("inquirer");
const mysql = require("mysql");

// Set environment variables
require("dotenv").config();

// TEST
// Create connection
const connection = mysql.createConnection({
  host: "localhost",
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: "bamazon"
})

connection.connect();

// Create inquirer prompt
inquirer
  .prompt([
    // Prompt user for product ID
    {
      type: "input",
      name: "productId",
      message: "Please enter the ID of the product you would like to purchase:"
    }
  ])
  .then(answers => {
    // Query database for product using user-inputted id
    connection.query("SELECT * FROM `products` WHERE `item_id` = ?", [answers.productId], (err, results) =>{
      if (err) throw err;
      if (results.length === 0) {
        // Print error message if ID does not exist
        console.log("Item not found.");
      } else {
        const perItemPrice = results[0].price;
        const availableQuantity = results[0].stock_quantity;

        // Print product information
        console.log("Selected product:", results[0].product_name);
        console.log("Price:", perItemPrice);
        console.log("Quantity in stock:", availableQuantity);

        // Create second prompt asking user for the quantity they wish to purchase
        inquirer
          .prompt([
            {
              type: "input",
              name: "quantityPurchased",
              message: "Please enter the quantity of this item you'd like to purchase:"
            }
          ])
          .then(answers => {
            // Check if there are enough items in stock to fulfill request
            if (answers.quantityPurchased > availableQuantity) {
              // Print error message if stock is insufficient
              console.log("Insufficient quantity in stock.");
            } else {
              // Store total price, rounded to two decimal places
              const totalPrice = (perItemPrice * answers.quantityPurchased).toFixed(2);
              // Subtract purchased stock from the item's stock quantity in the database
              connection.query("UPDATE `products` SET `stock_quantity` = ? WHERE item_id = ?", 
                                [availableQuantity - answers.quantityPurchased, results[0].item_id],
                                (err) => {
                                  if (err) throw err;
                                  // Print total price
                                  console.log(`TOTAL: $${perItemPrice} x ${answers.quantityPurchased} = $${totalPrice}`);
                                });
            }
          })
      }
    })
  });