diff --git a//dev/null b/app.py
index 0000000000000000000000000000000000000000..a436b1163ec27f5e7da2c0bac476663856dade28 100644
--- a//dev/null
+++ b/app.py
@@ -0,0 +1,45 @@
+import argparse
+from todo import TodoList
+
+
+def main() -> None:
+    parser = argparse.ArgumentParser(description="Simple TODO app")
+    subparsers = parser.add_subparsers(dest="command")
+
+    add_parser = subparsers.add_parser("add", help="Add a task")
+    add_parser.add_argument("text")
+
+    list_parser = subparsers.add_parser("list", help="List tasks")
+
+    complete_parser = subparsers.add_parser("complete", help="Mark a task as done")
+    complete_parser.add_argument("id", type=int)
+
+    remove_parser = subparsers.add_parser("remove", help="Remove a task")
+    remove_parser.add_argument("id", type=int)
+
+    args = parser.parse_args()
+    todo = TodoList()
+
+    if args.command == "add":
+        task = todo.add(args.text)
+        print(f"Added task {task.id}: {task.text}")
+    elif args.command == "list":
+        for task in todo.list():
+            status = "\u2713" if task.done else " "
+            print(f"[{status}] {task.id}: {task.text}")
+    elif args.command == "complete":
+        if todo.complete(args.id):
+            print("Completed")
+        else:
+            print("Task not found")
+    elif args.command == "remove":
+        if todo.remove(args.id):
+            print("Removed")
+        else:
+            print("Task not found")
+    else:
+        parser.print_help()
+
+
+if __name__ == "__main__":
+    main()
