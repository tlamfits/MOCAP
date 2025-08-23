diff --git a/README.md b/README.md
index 102d17264d6f47d38b4a6486e582b5b3dba39fa5..a98c9235220816e2ac0ad99cb8e13591d876c255 100644
--- a/README.md
+++ b/README.md
@@ -1 +1,26 @@
-# MOCAP
+# MOCAP
+
+A simple Trello-like TODO list application written in pure Python. It manages boards, lists and cards without external dependencies.
+
+## Features
+
+- Multiple boards
+- Lists within boards
+- Cards with descriptions, due dates and labels
+- Checklist items and comments on cards
+- JSON file persistence
+
+## Usage
+
+```bash
+python app.py board-add "Work"
+python app.py list-add Work "Todo"
+python app.py card-add Work Todo "Write tests" --description "ensure quality" --due 2024-01-01 --labels urgent,backend
+python app.py show Work
+```
+
+## Running Tests
+
+```bash
+python -m unittest
+```
