let DragAndDropHandler;
import path from 'path';
import fs from 'fs';
import { $ } from 'atom';

import DirectoryView from './directory-view';
import FileView from './file-view';

export default
(DragAndDropHandler = (function() {
  DragAndDropHandler = class DragAndDropHandler {
    static initClass() {
      this.prototype.startPosition = null;
      this.prototype.draggedView = null;
      this.prototype.highlightedDirectory = null;
      this.prototype.expandTimer = null;
      this.prototype.dragging = false;
    }
    constructor(treeView) {
      this.onEntryMousedown = this.onEntryMousedown.bind(this);
      this.dragStopped = this.dragStopped.bind(this);
      this.drag = this.drag.bind(this);
      this.updateDraggingViewPosition = this.updateDraggingViewPosition.bind(this);
      this.highlightDirectory = this.highlightDirectory.bind(this);
      this.treeView = treeView;
      this.treeView.on('mousedown', '.entry', this.onEntryMousedown);
    }

    // Private: Starts dragging an entry
    //
    // Returns noop
    onEntryMousedown(e) {
      if (e.which !== 1) { return; }

      this.startPosition = { x: e.pageX, y: e.pageY };
      $(document.body).on('mousemove', this.drag);
      $(document.body).on('mouseup', this.dragStopped);

      let entry = $(e.currentTarget);
      this.draggedView = entry.data('view');
      return this.draggedView.removeClass('selected');
    }

    // Private: Stops dragging an entry
    //
    // Returns noop
    dragStopped(e) {
      if (this.dragging) {
        this.dragging = false;

        this.draggingView.remove();
        this.draggingView = null;

        this.treeView.off('mouseover', '.directory', this.highlightDirectory);

        if (this.highlightedDirectory != null) {
          this.performDragAndDrop();
        }

        if (this.expandTimer != null) {
          clearTimeout(this.expandTimer);
          this.expandTimer = null;
        }
      }

      $(document.body).off('mousemove', this.drag);
      return $(document.body).off('mouseup', this.dragStopped);
    }

    // Private: Moves the current entry, highlights hovered entry
    //
    // Returns noop
    drag(e) {
      let currentPosition = { x: e.pageX, y: e.pageY };
      let distX = Math.abs(currentPosition.x - this.startPosition.x);
      let distY = Math.abs(currentPosition.y - this.startPosition.y);

      // Calculate distance between current point and starting point, start
      // the actual dragging when distance is large enough
      if ((Math.sqrt(Math.pow(distY, 2) + Math.pow(distX, 2)) > 5) &&
        !this.dragging) {
          return this.startDragging(e);
      } else if (this.dragging) {
        return this.updateDraggingViewPosition(e);
      }
    }

    // Private: Actually starts the dragging process. Duplicates the view, listens
    // for mouseover events on directory entries and updates the dragged
    // view position
    //
    // Returns noop
    startDragging(e) {
      this.dragging = true;

      this.draggingView = this.draggedView.clone();
      this.draggingView.addClass('dragging');
      this.treeView.list.append(this.draggingView);

      this.treeView.on('mouseover', '.directory', this.highlightDirectory);

      return this.updateDraggingViewPosition(e);
    }

    // Private: Updates the position of the currently dragged element
    //
    // Returns noop
    updateDraggingViewPosition(e) {
      let {scroller} = this.treeView;
      return this.draggingView.css({
        left: e.pageX + scroller.scrollLeft(),
        top: e.pageY + scroller.scrollTop()
      });
    }

    // Private: Highlights the currently hovered directory
    //
    // Returns noop
    highlightDirectory(e) {
      let directory = $(e.currentTarget);
      let view = directory.view();

      // Ignore hovering the original view
      if (view === this.draggedView) { return; }
      // This happens when we hover the original dragging view
      if (view == null) { return; }

      e.stopPropagation();

      this.treeView.find('.directory').removeClass('selected');
      view.addClass('selected');

      this.highlightedDirectory = view.directory;

      if (this.expandTimer != null) {
        clearTimeout(this.expandTimer);
        this.expandTimer = null;
      }
      return this.expandTimer = setTimeout(() => {
        return this.expandDirectory();
      }
      , 1000);
    }

    // Private: Moves the currently dragged file / directory to the highlighted
    // directory
    //
    // Returns noop
    performDragAndDrop(callback) {
      let entryType, sourcePath;
      let destinationPath = this.highlightedDirectory.path;
      if (this.draggedView instanceof DirectoryView) {
        sourcePath = this.draggedView.directory.path;
        entryType = "directory";
      } else if (this.draggedView instanceof FileView) {
        sourcePath = this.draggedView.file.path;
        entryType = "file";
      }

      // Build full destination path
      let baseName = path.basename(sourcePath);
      destinationPath = path.resolve(destinationPath, baseName);

      if (destinationPath === sourcePath) { return; }

      // Make sure that path does not exist already
      return fs.stat(destinationPath, (err, stat) => {
        if ((err != null) && (err.code !== "ENOENT")) { throw err; }

        if (stat != null) {
          return alert(`Failed to move ${entryType}: File already exists.`);
        }

        // Move the file
        return fs.rename(sourcePath, destinationPath, err => {
          if (err != null) { throw err; }
        });
      });
    }
  };
  DragAndDropHandler.initClass();
  return DragAndDropHandler;
})());
