'use babel';

import { requirePackages } from 'atom-utils'
import OpenFilesView from './open-files-view'

let addIconToElement;

export default {
  openFilesView: null,
	config: {
		collapsable: {
			title: 'Collapsable',
			description: 'If selected, the open files panel becomes collapsable, i.e., it can be collapsed with a click on the header',
			type: 'boolean',
			default: true
		},
		scrollable: {
			title: 'Fixed Height',
			description: 'If selected, the \'Open Files\' panel height is fixed to \'Height\'% of the window',
			type: 'boolean',
			default: false
		},
		height: {
			title: 'Height',
			description: 'Percentage of height used by the \'Open Files\' panel if fixed height is selected',
			type: 'integer',
			default: 20
		},
		sortOrder: {
			title: 'Sort Order',
			description: 'Indicate the order of the criteria for the sorting of the open files list, separated by commas. Options: base (filename), ext (extension), dir (directory)',
			type: 'string',
			default: 'base, ext, dir'
		},
    delay: {
      title: 'Delay',
      description: 'Apply a delay after opening a file before it appears in the \'Open Files\' panel in order to allow for double clicking of the file before it appears in the panel and the whole tree view slides down (in ms, i.e., 1000 = 1 second)',
      type: 'integer',
      default: 1000
    },
    animationDuration: {
      title: 'Animation Duration',
      description: 'Indicate the duration of the slide down animation for new elements in the \'Open Files\' panel (in ms, i.e., 1000 = 1 second)',
      type: 'integer',
      default: 300
    }
	},

  activate(state) {
		requirePackages('tree-view').then(([treeView]) => {
			this.openFilesView = new OpenFilesView(addIconToElement)

			if (treeView) {
				this.openFilesView.createOpenFiles(treeView)
			}
		})
	},

  deactivate() {
    return this.openFilesView.destroy();
  },

  serialize() {},

  consumeElementIcons(func) {
    addIconToElement = func;
  }
}
