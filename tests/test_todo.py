 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a//dev/null b/tests/test_todo.py
index 0000000000000000000000000000000000000000..4dfbc7cc13c89777500bc76f8156b1d2601eb7cd 100644
--- a//dev/null
+++ b/tests/test_todo.py
@@ -0,0 +1,37 @@
+import pathlib
+import sys
+
+# Ensure the parent directory (project root) is on the import path
+sys.path.append(str(pathlib.Path(__file__).resolve().parents[1]))
+
+from todo import TodoList
+
+
+def test_add_and_list_tasks(tmp_path):
+    path = tmp_path / "todo.json"
+    todo = TodoList(str(path))
+    todo.add("task one")
+    todo.add("task two")
+    tasks = todo.list()
+    assert len(tasks) == 2
+    assert tasks[0].text == "task one"
+    assert not tasks[0].done
+
+
+def test_complete_task(tmp_path):
+    path = tmp_path / "todo.json"
+    todo = TodoList(str(path))
+    task = todo.add("task")
+    assert todo.complete(task.id)
+    assert todo.list()[0].done
+
+
+def test_remove_task(tmp_path):
+    path = tmp_path / "todo.json"
+    todo = TodoList(str(path))
+    task1 = todo.add("task1")
+    task2 = todo.add("task2")
+    assert todo.remove(task1.id)
+    tasks = todo.list()
+    assert len(tasks) == 1
+    assert tasks[0].id == task2.id
 
EOF
)
