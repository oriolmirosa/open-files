'use babel';

import { requirePackages } from 'atom-utils'
import WorkingFilesView from './working-files-view'


let addIconToElement;

export default {
  workingFilesView: null,
	config: {
		collapsable: {
			title: 'Collapsable',
			description: 'If selected, the open files panel becomes collapsable, i.e., it can be collapsed with a click on the header',
			type: 'boolean',
			default: true
		},
		sortOrder: {
			title: 'Sort Order',
			description: 'Indicate the order of the criteria for the sorting of the open files list, separated by commas. Options: base (filename), ext (extension), dir (directory)',
			type: 'string',
			default: 'base, ext, dir'
		}
	},

  consumeElementIcons(func) {
    addIconToElement = func;
  },

  activate(state) {
		return requirePackages('tree-view').then(([treeView]) => {
			this.workingFilesView = new WorkingFilesView(addIconToElement);

			if (treeView.treeView) {
				this.workingFilesView.show()
			}
			atom.commands.add('atom-workspace', 'tree-view:toggle', () => {
				if (treeView.treeView.is(':visible')) {
					return this.workingFilesView.show()
				} else {
					return this.workingFilesView.hide()
				}
			})

			return atom.commands.add('atom-workspace', 'tree-view:show', () => {
				return this.workingFilesView.show()
			})
		})
	},

  deactivate() {
    return this.workingFilesView.destroy();
  },

  serialize() {}
}
