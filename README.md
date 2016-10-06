# open-files package

This package adds an 'open files' pane above Atom's tree-view, mimicking the functionality of Sublime Text.

![open-files package screenshot](https://cloud.githubusercontent.com/assets/6955013/19172003/46242f58-8be5-11e6-856e-152defeb59af.png)

This package is basically a fork of the [tree-view-open-files](https://atom.io/packages/tree-view-open-files) by [postcasio](https://github.com/postcasio), so most of the credit should go to him. The fork ports the package from coffeescript to ES6, and makes a number of modifications to make the 'open files' pane look similar to Sublime Text:

* The pane appears as part of the tree-view, sitting above it. It resizes automatically to show all open files, and it shares the same scroller as the tree-view.
* The 'open files' and 'folders' sections of the panel are clearly and elegantly labeled.
* The files are ordered alphabetically. You can get the same order in tabs by using the [tab-smart-sort](https://atom.io/packages/tab-smart-sort) package.
* The cross to close a file only appears when the mouse hovers over the entry (while the 'edited' marker is always visible).

## TODO

* Right now, when there are several panes in the editor, each one has its own 'open files' section in the tree-view, but they are all labelled 'open files'. The goal is for them to have a more descriptive label.
* Configuration. At this point, the package is not configurable, but I am considering possible configuration options (ideas and suggestions are welcome).
