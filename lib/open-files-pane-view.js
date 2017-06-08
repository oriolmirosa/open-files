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
		this.container = document.createElement('ol')
		this.container.classList.add('list-tree')
		let header = document.createElement('div')
    header.classList.add('open-files-title')

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

	setPane(pane, addIconToElement) {
		this.pane = pane
    let that = this

		this.paneSub.add(pane.observeItems(item => {
      let delay = atom.config.get('open-files.delay')
      setTimeout(function() {
  			let listItem = document.createElement('li');
  			listItem.classList.add('file', 'list-item', 'open-files-item');
  			listItem.setAttribute('is', 'tree-view-file');
  			let closer = document.createElement('button');
  			closer.classList.add('close-open-file');
  			$(closer).on('click', () => {
  				let tempScrollTop = $('.tree-view').scrollTop();
          setTimeout(() => {
            that.removeEntry(item)
          }, delay);
  				$('.tree-view').scrollTop(tempScrollTop);
  			});
  			listItem.appendChild(closer);
  			let listItemName = document.createElement('span');
  			listItemName.classList.add('name', 'icon', 'icon-file-text');
        var itemPath
  			try {
  				itemPath = item.getPath()
  				listItemName.setAttribute('data-path', itemPath);
          if (addIconToElement) {
            listItemName.classList.remove('icon-file-text');
            this.iconDisposable = addIconToElement(listItemName, itemPath);
          }
  			}
  			catch (e) {
  				console.log(`Error when a page with no path, like 'settings', is open: ${e}`)
  				console.log(`This error is ignored and thus the 'settings' page is now in the open-files list`)
          itemPath = ''
  			}
  			let itemTitle = item.getTitle()
  			let itemDir = pathUtil.dirname(itemPath)
  			let itemExt = pathUtil.extname(itemPath)
  			let pathName = itemDir + '/' + itemTitle
  			listItemName.setAttribute('data-name', itemTitle);
  			listItem.appendChild(listItemName)

  			that.itemsList.push({
  				name: itemTitle,
  				dir: itemDir,
  				ext: itemExt,
  				pathName: pathName
  			})

  			const compareNames = function (a, b) {
  				if (a['name'] !== b['name']) {
  					return a.name.toLowerCase().localeCompare(b.name.toLowerCase())
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

  			const compareFunctions = [compareNames, compareExt, compareDir]

  			let getSortOrder = function (sortOrder) {
  				let sortOrderArray = sortOrder.split(/[\s,;:-]+/)
  				let newSortOrderArray = sortOrderArray.map(term => term.replace(/[^a-zA-Z]/g, ''))
  				return newSortOrderArray
  			}

        atom.config.observe('open-files.sortOrder', sortOrderConfig => {
          let sortOrder = getSortOrder(sortOrderConfig)

          let sortOrderNumber = []
    			for (let i = 0; i < 3; i++) {
    				switch (sortOrder[i]) {
    					case 'base':
    						sortOrderNumber.push(0)
    						break

    					case 'ext':
    						sortOrderNumber.push(1)
    						break

    					case 'dir':
    						sortOrderNumber.push(2)
    						break

    					default:
    						sortOrderNumber.push(0)
    				}
    			}

          let animationDuration = atom.config.get('open-files.animationDuration')

    			if (that.itemsList.length > 0) {
    				that.itemsList.sort(function (a, b) {
    					let ret1 = compareFunctions[sortOrderNumber[0]](a, b)
    					if (ret1 != null) return ret1
    					let ret2 = compareFunctions[sortOrderNumber[1]](a, b)
    					if (ret2 != null) return ret2
    					let ret3 = compareFunctions[sortOrderNumber[2]](a, b)
    					if (ret3 != null) return ret3
    				})

    				let index = that.itemsList.findIndex(x => x.pathName === pathName)
    				if (index === 0) {
    					that.container.insertBefore(listItem, that.container.firstChild);
              $(listItem).hide().slideDown(animationDuration);
    				} else {
    					let itemsTemp = that.container.querySelectorAll('.list-item')
    					that.container.insertBefore(listItem, itemsTemp[index-1].nextSibling)
              $(listItem).hide().slideDown(animationDuration);
    				}
    			} else {
    				that.container.appendChild(listItem);
            $(listItem).hide().slideDown(animationDuration);
    			}

    			if (item.onDidChangeTitle != null) {
    				let titleSub = item.onDidChangeTitle(() => {
    					return that.updateTitle(item);
    				});
    				that.paneSub.add(titleSub);
    			}

    			if (item.onDidChangeModified != null) {
    				item.onDidChangeModified(modified => {
    					return that.updateModifiedState(item, modified);
    				});
    			}

    			that.items.push({item, element: listItem});
    			that.updateTitle(item);
        })

        that.paneSub.add(pane.observeActiveItem(item => {
    			return that.setActiveEntry(item);
    		}));
      }, delay)
    }))

		this.paneSub.add(pane.onDidRemoveItem(({item}) => {
        setTimeout(() => {
          that.removeEntry(item)
        }, 1000);
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
    if (entry) {
      entry.element.classList.toggle('modified', modified);
    }
	}

	entryForItem(item) {
		return _.find(this.items, entry => entry.item === item);
	}

	entryForElement(item) {
		return _.find(this.items, entry => entry.element === item);
	}

	setActiveEntry(item) {
		if (item) {
			let entry = this.entryForItem(item);
			this.activeEntry ? this.activeEntry.classList.remove('selected') : undefined;
			if (entry) {
        this.activeEntry = entry.element;
				entry.element.classList.add('selected');
			}
		}
	}

  removeEntry(item) {
    let index = _.findIndex(this.items, entry => entry.item === item);
    if (index >= 0) {
      let el = this.items[index].element
      let animationDuration = atom.config.get('open-files.animationDuration')
      let that = this
      $(el).slideUp(animationDuration, () => {
        $(el).remove()
        that.pane.destroyItem(item);
        if (this.iconDisposable) {
          this.iconDisposable.dispose();
        }
        that.items.splice(index, 1);
        let itemFullPath
        try {
          itemFullPath = item.getPath()
        }
        catch (e) {
          console.log('no path for settings tab');
        }
        if (itemFullPath == null) {
          itemFullPath = './' + item.getTitle()
        }
        let indexTitleList = that.itemsList.findIndex(x => x.pathName === itemFullPath)
        if (indexTitleList > -1) {
          that.itemsList.splice(indexTitleList, 1)
        }
        return that.items.map((entry) => that.updateTitle(entry.item));
      })
    }
  }

	// Returns an object that can be retrieved when package is activated
	serialize() {}

	// Tear down any state and detach
	destroy() {
		this.element.remove();
		return this.paneSub.dispose();
	}
}
