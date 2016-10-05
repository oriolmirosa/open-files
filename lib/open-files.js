'use babel';

import { requirePackages } from 'atom-utils'
import OpenFilesView from './open-files-view'

export default {
  openFilesView: null,
	config: {
		maxHeight: {
			type: 'integer',
			default: 400,
			min: 0,
			description: 'Maximum height of the list before scrolling is required. Set to 0 to disable scrolling.'
		}
	},

  activate(state) {
		return requirePackages('tree-view').then(([treeView]) => {
			this.openFilesView = new OpenFilesView

			if (treeView.treeView) {
				this.openFilesView.show()
			}
			atom.commands.add('atom-workspace', 'tree-view:toggle', () => {
				if (treeView.treeView.is(':visible')) {
					return this.openFilesView.show()
				} else {
					return this.openFilesView.hide()
				}
			})

			return atom.commands.add('atom-workspace', 'tree-view:show', () => {
				return this.openFilesView.show()
			})
		})
	},

  deactivate() {
    return this.openFilesView.destroy();
  },

  serialize() {}
}
