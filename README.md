# Git-DAG

Have you ever wanted to visualize your Git repo? Well, now you can.

![](/images/dag.png?raw=true)

Right click a commit object to view the tree. Hovering your mouse over objects shows details about the object.

![](/images/see-tree.jpg?raw=true)

Note: This project is still in its early stages but should work.

## Setup

- clone the repo
- update `config.json` with the path to your `bash.exe` (assuming your a Windows user)
- open a terminal, `cd` to the cloned repo directory and call `python view_dag.py` (this will start a local http server).
