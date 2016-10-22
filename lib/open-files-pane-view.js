'use babel';

import {CompositeDisposable} from 'atom'
import _ from 'lodash'
import $ from 'jquery'
import pathUtil from 'path'

export default class OpenFilesPaneView {
	constructor() {
		this.items = []
		this.itemsList = []
		this.activeEntry = null
		this.paneSub = new CompositeDisposable

		this.element = document.createElement('ul')
		this.element.classList.add('list-tree', 'has-collapsable-children')
		let nested = document.createElement('li')
		nested.classList.add('list-nested-item', 'expanded')
		this.container = document.createElement('ul')
		this.container.classList.add('list-tree', 'tree-view')
		let header = document.createElement('div')

		atom.config.observe('open-files.collapsable', collapsable => {
			if (collapsable) {
				header.classList.add('list-item')
				header.style.height = '24px'
				header.style.paddingTop = '0px'
				header.style.marginTop = '-5px'
				header.style.paddingBottom = '10px'
				header.style.marginBottom = '1px'
			} else {
				header.classList.remove('list-item')
				header.style.height = '21px'
				header.style.paddingTop = '5px'
				header.style.marginTop = '0px'
				header.style.paddingBottom = '0px'
			}
		})

		let headerSpan = document.createElement('span')
		let headerSpanStyle = document.createElement('strong')
		headerSpanStyle.innerText = 'OPEN FILES'
		// headerSpan.style.height = '25px'
		header.style.paddingLeft = '5px'

		headerSpan.appendChild(headerSpanStyle)
		header.appendChild(headerSpan)
		nested.appendChild(header)
		nested.appendChild(this.container)
		this.element.appendChild(nested)

		$(this.element).on('click', '.list-nested-item > .list-item', function() {
			nested = $(this).closest('.list-nested-item')
			nested.toggleClass('expanded')
			return nested.toggleClass('collapsed')
		})
		let self = this
		$(this.element).on('click', '.list-item[is=tree-view-file]', function() {
			let tempScrollTop = $('.tree-view-scroller').scrollTop();
			self.pane.activateItem(self.entryForElement(this).item)
			$('.tree-view-scroller').scrollTop(tempScrollTop);
		})
	}

	setPane(pane) {
		this.pane = pane

		this.paneSub.add(pane.observeItems(item => {
			const time = Date.now()
			let listItem = document.createElement('li');
			listItem.classList.add('file', 'list-item');
			listItem.setAttribute('is', 'tree-view-file');
			let closer = document.createElement('button');
			closer.classList.add('close-open-file');
			$(closer).on('click', () => {
				let tempScrollTop = $('.tree-view-scroller').scrollTop();
				pane.destroyItem(this.entryForElement(listItem).item);
				$('.tree-view-scroller').scrollTop(tempScrollTop);
			});
			listItem.appendChild(closer);
			let listItemName = document.createElement('span');
			listItemName.classList.add('name', 'icon', 'icon-file-text');
			try {
				var itemPath = item.getPath() || ''
				listItemName.setAttribute('data-path', itemPath);
			}
			catch (e) {
				console.log(`Error when a page with no path, like 'settings', is open: ${e}`)
				console.log(`This error is ignored and thus the 'settings' page is now in the open-files list`)
			}
			let itemTitle = item.getTitle()
			// console.log(`title: ${itemTitle} - time: ${time} - ext: ${pathUtil.extname(itemPath)}`)
			listItemName.setAttribute('data-name', itemTitle);
			listItem.appendChild(listItemName)

			this.itemsList.push({
				name: itemTitle,
				time: time,
				dir: pathUtil.dirname(itemPath),
				ext: pathUtil.extname(itemPath)
			})

			const compareNames = function (a, b) {
				if (a['name'] !== b['name']) {
					return a.name.toLowerCase().localeCompare(b.name.toLowerCase())
				}
			}
			const compareTime = function (a, b) {
				if (a['time'] !== b['time']) {
					return a.time - b.time
				}
			}
			const compareExt = function (a, b) {
				if (a['ext'] !== b['ext']) {
					return a.ext.toLowerCase().localeCompare(b.ext.toLowerCase())
				}
			}
			const compareDir = function (a, b) {
				if (a['dir'] !== b['dir']) {
					return a.dir.toLowerCase().localeCompare(b.dir.toLowerCase())
				}
			}

			const compareFunctions = [compareNames, compareTime, compareExt, compareDir]

			let itemsList = this.itemsList

			let getSortOrder = function (sortOrder) {
				let sortOrderArray = sortOrder.split(/[\s,;:-]+/)
				let newSortOrderArray = sortOrderArray.map(term => term.replace(/[^a-zA-Z]/g, ''))
				return newSortOrderArray
			}

    	let sortOrder = getSortOrder(atom.config.get('open-files.sortOrder'))

			let sortOrderNumber = []
			for (let i = 0; i < 4; i++) {
				switch (sortOrder[i]) {
					case 'base':
						sortOrderNumber.push(0)
						break

					case 'time':
						sortOrderNumber.push(1)
						break

					case 'ext':
						sortOrderNumber.push(2)
						break

					case 'dir':
						sortOrderNumber.push(3)
						break

					default:
						sortOrderNumber.push(0)
				}
			}

			if (itemsList.length > 0) {
				itemsList.sort(function (a, b) {
					let ret1 = compareFunctions[sortOrderNumber[0]](a, b)
					if (ret1 != null) return ret1
					let ret2 = compareFunctions[sortOrderNumber[1]](a, b)
					if (ret2 != null) return ret2
					let ret3 = compareFunctions[sortOrderNumber[2]](a, b)
					if (ret3 != null) return ret3
					let ret4 = compareFunctions[sortOrderNumber[3]](a, b)
					if (ret4 != null) return ret4
				})

				let index = itemsList.findIndex(x => x.name === itemTitle)
				if (index === 0) {
					this.container.insertBefore(listItem, this.container.firstChild);
				} else {
					let itemsTemp = this.container.querySelectorAll('.list-item')
					this.container.insertBefore(listItem, itemsTemp[index-1].nextSibling)
				}
			} else {
				this.container.appendChild(listItem);
			}

			if (item.onDidChangeTitle != null) {
				let titleSub = item.onDidChangeTitle(() => {
					return this.updateTitle(item);
				});
				this.paneSub.add(titleSub);
			}
			if (item.onDidChangeModified != null) {
				this.paneSub.add(item.onDidChangeModified(modified => {
					return this.updateModifiedState(item, modified);
				}));
			}

			this.items.push({item, element: listItem});
			this.updateTitle(item);
		}));

		this.paneSub.add(pane.observeActiveItem(item => {
			return this.setActiveEntry(item);
		}));

		this.paneSub.add(pane.onDidRemoveItem(({item}) => {
			return this.removeEntry(item);
		}));

		return this.paneSub.add(pane.onDidDestroy(() => this.paneSub.dispose()));
	}

	updateTitle(item, siblings=true, useLongTitle=false) {
		var entry;
		let title = item.getTitle();

		if (siblings) {
			for (let i = 0; i < this.items.length; i++) {
				var entry = this.items[i];
				if (entry.item !== item && entry.item.getTitle() === title) {
					useLongTitle = true;
					this.updateTitle(entry.item, false, true);
				}
			}
		}


		if (useLongTitle && (item.getLongTitle != null)) {
			title = item.getLongTitle();
		}

		if (entry = this.entryForItem(item)) {
			return $(entry.element).find('.name').text(title);
		}
	}

	updateModifiedState(item, modified) {
		let entry = this.entryForItem(item);

		return entry.element.classList.toggle('modified', modified);
	}

	entryForItem(item) {
		return _.find(this.items, entry => entry.item === item);
	}

	entryForElement(item) {
		return _.find(this.items, entry => entry.element === item);
	}

	setActiveEntry(item) {
		if (item) {
			let entry;
			this.activeEntry ? this.activeEntry.classList.remove('selected') : undefined;
			if (entry = this.entryForItem(item)) {
				entry.element.classList.add('selected');
				this.activeEntry = entry.element;
			}
		}
	}

	removeEntry(item) {
		let index = _.findIndex(this.items, entry => entry.item === item);

		if (index >= 0) {
			this.items[index].element.remove();
			this.items.splice(index, 1);
		}

		return this.items.map((entry) => this.updateTitle(entry.item));
	}

	// Returns an object that can be retrieved when package is activated
	serialize() {}

	// Tear down any state and detach
	destroy() {
		this.element.remove();
		return this.paneSub.dispose();
	}
}
