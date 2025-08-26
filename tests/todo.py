diff --git a//dev/null b/todo.py
index 0000000000000000000000000000000000000000..3dfc29394230ffe7fe97288c2848ca94277435dd 100644
--- a//dev/null
+++ b/todo.py
@@ -0,0 +1,57 @@
+import json
+from dataclasses import dataclass, asdict
+from typing import List
+
+
+@dataclass
+class Task:
+    id: int
+    text: str
+    done: bool = False
+
+
+class TodoList:
+    """Simple TODO list with JSON file persistence."""
+
+    def __init__(self, path: str = "todo.json") -> None:
+        self.path = path
+        self.tasks: List[Task] = []
+        self._load()
+
+    def _load(self) -> None:
+        try:
+            with open(self.path, "r", encoding="utf-8") as f:
+                data = json.load(f)
+            self.tasks = [Task(**t) for t in data]
+        except FileNotFoundError:
+            self.tasks = []
+
+    def _save(self) -> None:
+        with open(self.path, "w", encoding="utf-8") as f:
+            json.dump([asdict(t) for t in self.tasks], f, indent=2)
+
+    def add(self, text: str) -> Task:
+        new_id = max([t.id for t in self.tasks], default=0) + 1
+        task = Task(new_id, text)
+        self.tasks.append(task)
+        self._save()
+        return task
+
+    def list(self) -> List[Task]:
+        return list(self.tasks)
+
+    def complete(self, task_id: int) -> bool:
+        for task in self.tasks:
+            if task.id == task_id:
+                task.done = True
+                self._save()
+                return True
+        return False
+
+    def remove(self, task_id: int) -> bool:
+        for i, task in enumerate(self.tasks):
+            if task.id == task_id:
+                del self.tasks[i]
+                self._save()
+                return True
+        return False
