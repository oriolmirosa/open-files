# open-files package

 If you enjoy the package, please consider supporting my work with a donation (via PayPal)

 [![Donate](https://www.paypalobjects.com/en_US/i/btn/btn_donate_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=E3F3UUCGY65RC&lc=US&item_name=%27Open%20Files%27%20Atom%20package&currency_code=USD&bn=PP%2dDonationsBF%3abtn_donate_LG%2egif%3aNonHosted)

<br>
This package adds an 'open files' pane above Atom's tree-view, mimicking the functionality of Sublime Text.

![open-files package screenshot](https://cloud.githubusercontent.com/assets/6955013/19407323/80f193f2-9264-11e6-9efa-9782dcd03e48.png)

This package is basically a fork of the [tree-view-open-files](https://atom.io/packages/tree-view-open-files) by [postcasio](https://github.com/postcasio), so most of the credit should go to him. The fork ports the package from coffeescript to ES6, and makes a number of modifications to make the 'open files' pane look similar to Sublime Text:

* The pane appears as part of the tree-view, sitting above it. It resizes automatically to show all open files, and it shares the same scroller as the tree-view.
* The 'open files' panel is collapseable when clicking on the label. An option in the settings tab makes it possible to make the panel uncollapseable.
* The 'open files' and 'folders' sections of the panel are clearly and elegantly labeled.
* The file list can be ordered alphabetically using multiple (cascading) criteria: filename (base), extension (ext) and directory (dir). The order of these criteria can be indicated as a (comma-separated) string in the settings. Default is: base, ext, dir. This is the same functionality that can be found in the [tab-smart-sort](https://atom.io/packages/tab-smart-sort) package.
* The cross to close a file only appears when the mouse hovers over the entry (while the 'edited' marker is always visible).
* NEW in 0.6.0: In order to prevent the fast sliding down of the tree view when a file is added, there is a delay before the file appears in the 'open files' panel. The delay is configurable in the package's settings (default is 1000 ms, i.e., 1 second).
* NEW in 0.6.0: Files added and removed from the 'open files' panel are animated. The animation has a default duration of 300 ms, but this is configurable in the package's settings (default is 300 ms).
* NEW in 0.7.0: When several panels are open, the title for the 'open files' panels now includes PANEL #, with the number showing the order in which the panels were opened. When panels are closed, the numbers of the panels are re-calculated so that they reflect the panels present in the workspace

## TODO

* Make the files in the 'open files' panel draggable, and keep the tab order in sync with the 'open files' order.
* Configuration. Ideas and suggestions for further configuration options are welcome.
