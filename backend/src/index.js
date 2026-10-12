
const express = require("express");
const { pool, initializeDatabase } = require("./db");

const app = express();
const PORT = Number(process.env.PORT || 5000);

app.use(express.json({ limit: "20kb" }));

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch (error) {
    console.error("Health check failed:", error.message);
    res.status(503).json({ status: "error", database: "unavailable" });
  }
});

app.get("/api/tasks", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, title, completed, created_at FROM tasks ORDER BY id DESC"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Fetch tasks failed:", error.message);
    res.status(500).json({ error: "Unable to fetch tasks" });
  }
});

app.post("/api/tasks", async (req, res) => {
  const title =
    typeof req.body.title === "string" ? req.body.title.trim() : "";

  if (!title || title.length > 200) {
    return res.status(400).json({
      error: "Title must contain between 1 and 200 characters"
    });
  }

  try {
    const result = await pool.query(
      "INSERT INTO tasks (title) VALUES ($1) RETURNING *",
      [title]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Create task failed:", error.message);
    res.status(500).json({ error: "Unable to create task" });
  }
});

app.patch("/api/tasks/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isSafeInteger(id) || id < 1) {
    return res.status(400).json({ error: "Invalid task ID" });
  }

  if (typeof req.body.completed !== "boolean") {
    return res.status(400).json({
      error: "completed must be a boolean"
    });
  }

  try {
    const result = await pool.query(
      `UPDATE tasks SET completed = $1
       WHERE id = $2 RETURNING *`,
      [req.body.completed, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Update task failed:", error.message);
    res.status(500).json({ error: "Unable to update task" });
  }
});

app.delete("/api/tasks/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isSafeInteger(id) || id < 1) {
    return res.status(400).json({ error: "Invalid task ID" });
  }

  try {
    const result = await pool.query(
      "DELETE FROM tasks WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.status(204).end();
  } catch (error) {
    console.error("Delete task failed:", error.message);
    res.status(500).json({ error: "Unable to delete task" });
  }
});

async function start() {
  try {
    await initializeDatabase();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Backend listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("Backend startup failed:", error.message);
    process.exit(1);
  }
}

start();

async function shutdown() {
  await pool.end();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

