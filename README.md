# Git-DAG

Note: This project is still in its early stages.

## What is This?

At its core Git is a content addressable database. Git-DAG allows you to view this database as a 3d model.

![pretty-view](docs/pretty-image.png)

Right clicking a commit node expands the model, displaying the tree. You can also right click references, trees and blobs, which will display the objects content (runs git cat-file).

![demo](docs/demo.gif)

![view_content](docs/object_content.gif)

You can also use the tool to visualize what various git commands are doing.

![](docs/git_command.gif)

## Setup

- clone
- open a terminal, `cd` to the cloned repo directory, run `mkdir data` and call `python view_dag.py` (this will start a local http server).
