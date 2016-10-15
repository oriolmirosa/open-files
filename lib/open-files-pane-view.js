'use babel';

import {CompositeDisposable} from 'atom'
import _ from 'lodash'
import $ from 'jquery'

export default class OpenFilesPaneView {
	constructor() {
		this.items = []
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
				listItemName.setAttribute('data-path', item.getPath());
			}
			catch (e) {
				console.log(`Error when a page with no path, like 'settings', is open: ${e}`)
				console.log(`This error is ignored and thus the 'settings' page is now in the open-files list`)
			}
			listItemName.setAttribute('data-name', item.getTitle());
			listItem.appendChild(listItemName);
			if (this.items.length > 0) {
				let tempListNames = []
				for (let i = 0; i < this.items.length; i++) {
					tempListNames[i] = this.items[i].element.innerText
				}
				tempListNames.push(listItemName.dataset.name)
				tempListNames.sort(function (a, b) {
    			return a.toLowerCase().localeCompare(b.toLowerCase());
				})
				let index = tempListNames.indexOf(listItemName.dataset.name)
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
