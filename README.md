# open-files-extended package

This package adds an 'open files' pane above Atom's tree-view, mimicking the functionality of Sublime Text.

![open-files-extended package screenshot](https://cloud.githubusercontent.com/assets/6955013/19407323/80f193f2-9264-11e6-9efa-9782dcd03e48.png)

This package is a fork of [open-files]|(https://atom.io/packages/open-files) by [oriolmirosa](https://github.com/oriolmirosa) which is basically a fork of the [tree-view-open-files](https://atom.io/packages/tree-view-open-files) by [postcasio](https://github.com/postcasio), so most of the credit should go to him. The fork ports the package from coffeescript to ES6, and makes a number of modifications to make the 'open files' pane look similar to Sublime Text:

* The pane appears as part of the tree-view, sitting above it. It resizes automatically to show all open files, and it shares the same scroller as the tree-view.
* The 'open files' panel is collapseable when clicking on the label. An option in the settings tab makes it possible to make the panel uncollapseable.
* The 'open files' and 'folders' sections of the panel are clearly and elegantly labeled.
* The file list can be ordered alphabetically using multiple (cascading) criteria: filename (base), extension (ext) and directory (dir). The order of these criteria can be indicated as a (comma-separated) string in the settings. Default is: base, ext, dir. This is the same functionality that can be found in the [tab-smart-sort](https://atom.io/packages/tab-smart-sort) package.
* The cross to close a file only appears when the mouse hovers over the entry (while the 'edited' marker is always visible).
* Support for file-icons package

## TODO

* Right now, when there are several panes in the editor, each one has its own 'open files' section in the tree-view, but they are all labeled 'open files'. The goal is for them to have a more descriptive label.
* Configuration. Ideas and suggestions for further configuration options are welcome.
