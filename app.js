const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
var format = require("date-fns/format");
var parse = require("date-fns/parse");
var isValid = require("date-fns/isValid");

app.use(express.json());

let db;

//initialize
let initialize = async () => {
  let dbPath = path.join(__dirname, "todoApplication.db");

  db = await open({ filename: dbPath, driver: sqlite3.Database });

  app.listen(3000, () => console.log("Server is Online"));
};

initialize();

//validation
function validation(request, response, next) {
  const {
    status = "",
    priority = "",
    category = "",
    search_q = "",
    dueDate = "",
  } = request.query;

  if (status !== "") {
    let given = ["TO DO", "IN PROGRESS", "DONE"];
    if (!given.includes(status)) {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  }

  if (priority !== "") {
    let given = ["HIGH", "MEDIUM", "LOW"];
    if (!given.includes(priority)) {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  }

  if (category !== "") {
    let given = ["WORK", "HOME", "LEARNING"];
    if (!given.includes(category)) {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  }

  if (dueDate !== "") {
    try {
      let date = parse(dueDate, "yyyy-MM-dd", new Date(2021 - 12 - 12));

      if (!isValid(date)) {
        response.status(400);
        response.send("Invalid Due Date");
      }
    } catch {
      response.status(400);
      response.send("Invalid Due Date");
    }
  }

  next();
}

//body validation
function bvalidation(request, response, next) {
  const {
    status = "",
    priority = "",
    category = "",
    dueDate = "",
  } = request.body;

  if (status !== "") {
    let given = ["TO DO", "IN PROGRESS", "DONE"];
    if (!given.includes(status)) {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  }

  if (priority !== "") {
    let given = ["HIGH", "MEDIUM", "LOW"];
    if (!given.includes(priority)) {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  }

  if (category !== "") {
    let given = ["WORK", "HOME", "LEARNING"];
    if (!given.includes(category)) {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  }

  if (dueDate !== "") {
    try {
      let date = parse(dueDate, "yyyy-MM-dd", new Date(2021 - 12 - 12));

      if (!isValid(date)) {
        response.status(400);
        response.send("Invalid Due Date");
      }
    } catch {
      response.status(400);
      response.send("Invalid Due Date");
    }
  }

  next();
}

//convertor
function convertor(obj) {
  return {
    id: obj.id,
    todo: obj.todo,
    priority: obj.priority,
    status: obj.status,
    category: obj.category,
    dueDate: obj.due_date,
  };
}

//API 1
app.get("/todos/", validation, async (request, response) => {
  const {
    status = "",
    priority = "",
    category = "",
    search_q = "",
  } = request.query;
  let query = `SELECT * FROM todo WHERE 
    status LIKE '%${status}%' AND
    todo LIKE '%${search_q}%' AND
    category LIKE '%${category}%' AND
    priority LIKE '%${priority}%'; `;

  let result = await db.all(query);

  response.send(result.map((obj) => convertor(obj)));
});

//API 2
app.get("/todos/:todoId", validation, async (request, response) => {
  const { todoId } = request.params;

  let query = `SELECT * FROM todo WHERE id = ${todoId}; `;

  let result = await db.get(query);

  response.send(convertor(result));
});

//API 3
app.get("/agenda/", async (request, response) => {
  let { date = "" } = request.query;

  if (date !== "") {
    try {
      date = parse(date, "yyyy-MM-dd", new Date(2021 - 12 - 12));

      if (isValid(date)) {
        date = format(date, "yyyy-MM-dd");

        let query = `SELECT * FROM todo WHERE 
      due_date LIKE "${date}"; `;

        let result = await db.all(query);

        response.send(result.map((obj) => convertor(obj)));
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
    } catch {
      response.status(400);
      response.send("Invalid Due Date");
    }
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//API 4
app.post("/todos/", bvalidation, async (request, response) => {
  const { id, todo, status, priority, category, dueDate } = request.body;
  let query = `INSERT INTO todo
  (id,todo,priority,status,category,due_date)
  VALUES (${id},'${todo}','${priority}','${status}','${category}', '${dueDate}'); `;

  await db.run(query);

  response.send("Todo Successfully Added");
});

//API 5
app.put("/todos/:todoId", bvalidation, async (request, response) => {
  const { todoId } = request.params;

  let obj = await db.get(`SELECT * FROM todo WHERE id = ${todoId}`);

  let {
    status = obj.status,
    priority = obj.priority,
    category = obj.category,
    todo = obj.todo,
    dueDate = obj.due_date,
  } = request.body;

  let value;

  switch (true) {
    case status !== obj.status:
      value = "Status";
      break;
    case priority !== obj.priority:
      value = "Priority";
      break;
    case category !== obj.category:
      value = "Category";
      break;
    case todo !== obj.todo:
      value = "Todo";
      break;
    case dueDate !== obj.due_date:
      value = "Due Date";
      break;
  }

  let query = `UPDATE todo SET 
    status = '${status}',
    priority = '${priority}',
    category = '${category}',
    todo = '${todo}',
    due_date = '${dueDate}'
    WHERE id = ${todoId} ;`;

  await db.run(query);

  if (value !== undefined) {
    response.send(`${value} Updated`);
  }
});

//API 6
app.delete("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;

  let result = await db.run(`DELETE FROM todo WHERE id = ${todoId}`);

  if (result.changes !== 0) {
    response.send("Todo Deleted");
  }
});

//module exports
module.exports = app;
