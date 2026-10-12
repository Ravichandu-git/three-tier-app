
import { useCallback, useEffect, useState } from "react";

const API = "/api/tasks";

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const loadTasks = useCallback(async () => {
    try {
      const response = await fetch(API);
      if (!response.ok) throw new Error("Unable to load tasks");
      setTasks(await response.json());
      setError("");
    } catch {
      setError("Cannot connect to the application. Please retry.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  async function addTask(event) {
    event.preventDefault();
    if (!title.trim() || busy) return;

    setBusy(true);
    setError("");

    try {
      const response = await fetch(API, {
        method: "POST",

