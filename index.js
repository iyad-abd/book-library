import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: ".look@z*",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs"); // Set the view engine to EJS

let currentUserId = 1;

let users = [
  { id: 1, name: "Angela", color: "teal" },
  { id: 2, name: "Jack", color: "powderblue" },
];

// Function to fetch all users from the database
async function fetchUsers() {
  const result = await db.query("SELECT * FROM users");
  return result.rows;
}

// Fetch visited countries for the current user
async function checkVisited() {
  const result = await db.query(
    "SELECT country_code FROM visited_countries WHERE user_id = $1",
    [currentUserId]
  );
  return result.rows.map(country => country.country_code);
}

// Home route
app.get("/", async (req, res) => {
  const countries = await checkVisited();
  users = await fetchUsers(); // Fetch users from the database
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: "teal",
  });
});

// Handle adding a new country
app.post("/add", async (req, res) => {
  const input = req.body["country"];
  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );
    const data = result.rows[0];
    const countryCode = data.country_code;

    await db.query(
      "INSERT INTO visited_countries (country_code, user_id) VALUES ($1, $2)",
      [countryCode, currentUserId]
    );

    res.redirect("/");
  } catch (err) {
    console.log(err);
    res.redirect("/");
  }
});

// Change current user
app.post("/user", async (req, res) => {

  
  const selectedUserId = req.body.user;
  currentUserId = selectedUserId;
  res.redirect("/");
});

// Handle adding a new user
app.post("/new", async (req, res) => {
  const { name, color } = req.body;

  try {
    const result = await db.query(
      "INSERT INTO users (name, color) VALUES ($1, $2) RETURNING id",
      [name, color]
    );

    const newUserId = result.rows[0].id; // This retrieves the new user's ID
    currentUserId = newUserId; // Optionally, update the current user ID

    // Redirect to the homepage to see the updated list
    res.redirect("/user");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error"); // Handle the error properly
  }
});

// Route to display new user form
app.get("/new", (req, res) => {
  res.render("new.ejs");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
