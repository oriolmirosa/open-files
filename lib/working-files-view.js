'use babel';

import {requirePackages} from 'atom-utils'
import {CompositeDisposable} from 'atom'
import _ from 'lodash'
import WorkingFilesPaneView from './working-files-pane-view'

export default class WorkingFilesView {

  constructor(addIconToElement) {
    // Create root element
    this.element = document.createElement('div');
    this.element.classList.add('working-files', 'working-files-menu'); //, 'tree-view-scroller');
		this.groups = []
    this.addIconToElement = addIconToElement;
		this.paneSub = new CompositeDisposable
		this.paneSub.add(atom.workspace.observePanes(pane => {
			this.addTabGroup(pane)
			let destroySub = pane.onDidDestroy(() => {
				destroySub.dispose()
				return this.removeTabGroup(pane)
			})
			return this.paneSub.add(destroySub)
		}))

		atom.config.observe('working-files.maxHeight', maxHeight => {
			this.element.style.maxHeight = maxHeight;
		});

		atom.config.observe('working-files.sortOrder', val => {
			// this.sortOrder = getSortOrder(val)
			let panes = atom.workspace.getPanes()
			panes.map(pane => {
				this.removeTabGroup(pane)
				this.addTabGroup(pane)
			})
		})
  }

	addTabGroup(pane) {
		let group = new WorkingFilesPaneView
		group.setPane(pane, this.addIconToElement)
		this.groups.push(group)

    if (this.groups.length > 1) {
      for (var i = 0; i < this.groups.length; i++) {
        this.groups[i].headerTitle.innerText = "Pane "+(i + 1);
      }
    }

		return this.element.appendChild(group.element)
	}

	removeTabGroup (pane) {
		let group = _.findIndex(this.groups, group => group.pane === pane)
		this.groups[group].destroy()
		let ret = this.groups.splice(group, 1)

    if (this.groups.length > 1) {
      for (var i = 0; i < this.groups.length; i++) {
        this.groups[i].headerTitle.innerText = "Pane "+(i + 1);
      }
    }
    else if (this.groups.length == 1){
      this.groups[0].headerTitle.innerText = "Working Files";
    }

    return ret;
	}
  // Returns an object that can be retrieved when package is activated
  serialize() {}

  // Tear down any state and detach
  destroy() {
    this.element.remove()
		this.paneSub.dispose()
		return this.configSub.dispose()
  }

	toggle() {
		if (this.element.parentElement != null) {
			return this.hide();
		} else {
			return this.show();
		}
	}

	hide() {
		return this.element.remove()
	}

	show() {
		return requirePackages('tree-view').then(([treeView]) => {
			treeView.treeView.find('.tree-view-scroller').css('background',
				treeView.treeView.find('.tree-view').css('background'))
			let treeViewHeader = document.createElement('div')
			let treeViewHeaderSpan = document.createElement('span')
			let treeViewHeaderSpanStyle = document.createElement('strong')
			treeViewHeaderSpanStyle.innerText = 'FOLDERS'
			treeViewHeaderSpan.appendChild(treeViewHeaderSpanStyle)
			// treeViewHeader.appendChild(treeViewHeaderSpan)
			treeViewHeader.style.paddingLeft = '10px'
			// treeViewHeader.style.marginTop = '5px'
			treeViewHeader.style.marginBottom = '3px'
			// treeView.treeView.scroller.prepend(treeViewHeader)
			// treeView.treeView.scroller.prepend(this.element)
			// treeView.treeView.scrollTop
      // treeView.treeView.prepend(treeViewHeader)
			treeView.treeView.prepend(this.element)
		})
	}
}
