'use babel';

import {CompositeDisposable} from 'atom'
import _ from 'lodash'
import $ from 'jquery'
import pathUtil from 'path'

export default class OpenFilesPaneView {
	constructor() {
    this.entries = []
		this.activeEntry = null
		this.paneSub = new CompositeDisposable
    this.untitledCounter = 1

    // Hierarchy of a panel:
    // <div class="open-files"> -> created in open-files-view.js as this.element
    //   <ul class="list-tree has-collapsable-children"> -> this.panelRootList
    //     <li class="list-nested-item expanded"> -> panelHeaderFileEntry
    //       <div class="open-files-title"> -> header
    //         <span> -> headerSpan
    //           <strong> -> headerSpanStyle
    //             OPEN FILES
    //           </strong>
    //         </span>
    //       </div>
    //       <ol class="list-tree"> -> this.entriesList
    //          <li class="file list-item open-files-item" is="tree-view-file"> -> fileEntry
    //            <button class="close-open-file"></button> -> closeButton
    //            <span class="name icon icon-file-text" data-path="/Users/..." data-name="open-file-view.js"> -> fileEntryName
    //              open-files-view.js
    //            </span>
    //          </li>
    //          ...
    //       </ol>
    //     </li>
    //   </ul>
    // </div>

		this.panelRootList = document.createElement('ul')
		this.panelRootList.classList.add('list-tree', 'has-collapsable-children')
		let panelHeaderFileEntry = document.createElement('li')
		panelHeaderFileEntry.classList.add('list-nested-item', 'expanded')
		this.entriesList = document.createElement('ol')
		this.entriesList.classList.add('list-tree')
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
		panelHeaderFileEntry.appendChild(header)
		panelHeaderFileEntry.appendChild(this.entriesList)
		this.panelRootList.appendChild(panelHeaderFileEntry)

		$(this.panelRootList).on('click', '.list-nested-item > .list-item', function() {
			panelHeaderFileEntry = $(this).closest('.list-nested-item')
			panelHeaderFileEntry.toggleClass('expanded')
			return panelHeaderFileEntry.toggleClass('collapsed')
		})

    let self = this
		$(this.panelRootList).on('click', '.list-item[is=tree-view-file]', function() {
			let tempScrollTop = $('.tree-view-scroller').scrollTop();
			self.pane.activateItem(self.entryForElement(this).item)
			$('.tree-view-scroller').scrollTop(tempScrollTop);
		})
	}

	setPane(pane, addIconToElement, moreThanOnePanel) {
		this.pane = pane
    let that = this

		this.paneSub.add(pane.observeItems(item => {
      let delay = atom.config.get('open-files.delay')
      if (moreThanOnePanel & this.entries.length === 0) delay = 0
      setTimeout(function() {
  			let fileEntry = document.createElement('li');
  			fileEntry.classList.add('file', 'list-item', 'open-files-item');
  			fileEntry.setAttribute('is', 'tree-view-file');
  			let closeButton = document.createElement('button');
  			closeButton.classList.add('close-open-file');
  			$(closeButton).on('click', () => {
  				let tempScrollTop = $('.tree-view').scrollTop();
          setTimeout(() => {
            that.removeEntry(item)
          }, delay);
  				$('.tree-view').scrollTop(tempScrollTop);
  			});
  			fileEntry.appendChild(closeButton);
  			let fileEntryName = document.createElement('span');
  			fileEntryName.classList.add('name', 'icon', 'icon-file-text');
        var entryPath
  			if (typeof item.getPath == 'function') {
          entryPath = item.getPath()
        }
        if (entryPath == null) {
          entryPath = ''
        }
  			fileEntryName.setAttribute('data-path', entryPath);
        if (addIconToElement) {
          let iconSubstitutionsFileIcons = {
            'Settings': 'tools',
            'Deprecation Cop': 'alert',
            'Timecop': 'dashboard',
            'Project Find Results': 'search',
            'About': 'info'
          }
          if (entryPath === '') {
            for (key in iconSubstitutionsFileIcons) {
              if (item.getTitle() === key) {
                fileEntryName.classList.remove('default-icon');
                fileEntryName.classList.add('icon-' + iconSubstitutionsFileIcons[key]);
              }
            }
          } else {
            fileEntryName.classList.remove('icon-file-text');
            let pathForIcon
            if (entryPath === '') {
              pathForIcon = item.getTitle()
            } else {
              pathForIcon = entryPath
            }
            that.iconDisposable = addIconToElement(fileEntryName, pathForIcon);
          }
        }

        // Hack to get icons of special Atom views to appear in open file panel
        // TODO: icons should get the same color as in the tabs
        let iconSubstitutionsSetiIcons = {
          'Settings': 'settings',
          'Deprecation Cop': 'deprecation-cop',
          'Timecop': 'time-cop',
          'Project Find Results': 'search',
          'About': 'info',
          'untitled': 'new-file'
        }

        if (item.getTitle().split(' ')[1] == 'Preview') {
          fileEntryName.classList.remove('icon-file-text');
          // TODO: For some reason this doesn't work
          fileEntryName.classList.add('icon-markdown');
        } else {
          if (entryPath === '') {
            for (key in iconSubstitutionsSetiIcons) {
              if (item.getTitle() === key) {
                fileEntryName.classList.remove('icon-file-text');
                fileEntryName.classList.add('icon-' + iconSubstitutionsSetiIcons[key]);
              }
            }
          }
        }
        let instances = 1
        let entryTitle = item.getTitle()
        if (that.entries.length > 1) {
          for (let i = 0; i < that.entries.length; i++) {
            if (typeof that.entries[i].item.getPath == 'function') {
              if (that.entries[i].item.getTitle() === entryTitle & that.entries[i].item.getPath() == undefined) {
                instances += 1
                that.untitledCounter += 1
                if (instances > 1) {
                  entryTitle = entryTitle + that.untitledCounter
                }
              }
            }
          }
        }

  			let entryDir = pathUtil.dirname(entryPath)
  			let entryExt = pathUtil.extname(entryPath)
  			let entryPathName = entryDir + '/' + entryTitle
  			fileEntryName.setAttribute('data-name', entryTitle);
  			fileEntry.appendChild(fileEntryName)

  			that.entries.push({
  				name: entryTitle,
  				dir: entryDir,
  				ext: entryExt,
  				pathName: entryPathName,
          item: item,
          element: null
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
          let index
    			if (that.entries.length > 0) {
    				that.entries.sort(function (a, b) {
    					let ret1 = compareFunctions[sortOrderNumber[0]](a, b)
    					if (ret1 != null) return ret1
    					let ret2 = compareFunctions[sortOrderNumber[1]](a, b)
    					if (ret2 != null) return ret2
    					let ret3 = compareFunctions[sortOrderNumber[2]](a, b)
    					if (ret3 != null) return ret3
    				})

    				index = that.entries.findIndex(x => x.pathName === entryPathName)
    				if (index === 0) {
    					that.entriesList.insertBefore(fileEntry, that.entriesList.firstChild);
              $(fileEntry).hide().slideDown(animationDuration);
    				} else {
    					let itemsTemp = that.entriesList.querySelectorAll('.list-item')
    					that.entriesList.insertBefore(fileEntry, itemsTemp[index-1].nextSibling)
              $(fileEntry).hide().slideDown(animationDuration);
    				}
    			} else {
            index = 0
    				that.entriesList.appendChild(fileEntry);
            $(fileEntry).hide().slideDown(animationDuration);
    			}

          that.entries[index].element = fileEntry;
    			that.updateTitle(item);

    			if (item.onDidChangeTitle != null) {
    				let titleSub = item.onDidChangeTitle(() => {
              let index = that.entries.findIndex(x => x.pathName === entryPathName)
              let modifiedElement = that.updateTitle(item)
              let newTitle = $(modifiedElement).find('.name').text()

              if (typeof item.getPath == 'function') {
                newEntryPath = item.getPath()
              }
              if (newEntryPath == null) {
                newEntryPath = ''
              }

              entryDir = pathUtil.dirname(newEntryPath)
        			let newEntryPathName = entryDir + '/' + newTitle
              that.entries[index].name = newTitle
              that.entries[index].pathName = newEntryPathName


              // let newFileEntryName = modifiedElement.childNodes[1]
              let newFileEntryName = document.createElement('span');
        			newFileEntryName.classList.add('name', 'icon', 'icon-file-text');
              newFileEntryName.setAttribute('data-path', newEntryPathName)
              newFileEntryName.setAttribute('data-name', newTitle)
              newFileEntryName.innerHTML = newTitle
              if (addIconToElement) {
                let newPathForIcon
                if (newEntryPath === '') {
                  newPathForIcon = item.getTitle()
                } else {
                  newPathForIcon = newEntryPath
                }
                this.iconDisposable = addIconToElement(newFileEntryName, newPathForIcon);
              }

              modifiedElement.childNodes[1].outerHTML = newFileEntryName.outerHTML
              that.entries[index].element = modifiedElement

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

              let sortOrderConfig = atom.config.get('open-files.sortOrder')
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
              if (that.entries.length > 0) {
        				that.entries.sort(function (a, b) {
        					let ret1 = compareFunctions[sortOrderNumber[0]](a, b)
        					if (ret1 != null) return ret1
        					let ret2 = compareFunctions[sortOrderNumber[1]](a, b)
        					if (ret2 != null) return ret2
        					let ret3 = compareFunctions[sortOrderNumber[2]](a, b)
        					if (ret3 != null) return ret3
        				})
        				let newIndex = that.entries.findIndex(x => x.pathName === newEntryPathName)
                if (newIndex !== index) {
                  $(that.entriesList.childNodes[index]).slideUp(animationDuration, () => {
                    if (newIndex === 0) {
            					that.entriesList.insertBefore(modifiedElement, that.entriesList.firstChild);
                      $(modifiedElement).hide().slideDown(animationDuration);
            				} else {
            					let itemsTemp = that.entriesList.querySelectorAll('.list-item')
                      if (newIndex < index) {
                        that.entriesList.insertBefore(modifiedElement, itemsTemp[newIndex-1].nextSibling)
                        $(modifiedElement).hide().slideDown(animationDuration);
                      } else {
                        that.entriesList.insertBefore(modifiedElement, itemsTemp[newIndex].nextSibling)
                        $(modifiedElement).hide().slideDown(animationDuration);
                      }
            				}
                  })
                }
        			}
              entryPathName = newEntryPathName
    					return newTitle
    				});
    				that.paneSub.add(titleSub);
    			}

    			if (item.onDidChangeModified != null) {
    				item.onDidChangeModified(modified => {
    					return that.updateModifiedState(item, modified);
    				});
    			}
        })
      }, delay)
    }))

    that.paneSub.add(pane.observeActiveItem(item => {
      return that.setActiveEntry(item);
    }));

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
			for (let i = 0; i < this.entries.length; i++) {
				var entry = this.entries[i];
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
			$(entry.element).find('.name').text(title);
      return entry.element
		}
	}

	updateModifiedState(item, modified) {
		let entry = this.entryForItem(item);
    if (entry) {
      entry.element.classList.toggle('modified', modified);
    }
	}

	entryForItem(item) {
		return _.find(this.entries, entry => entry.item === item);
	}

	entryForElement(element) {
		return _.find(this.entries, entry => entry.element === element);
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
    let index = _.findIndex(this.entries, entry => entry.item === item);
    if (index >= 0) {
      let el = this.entriesList.childNodes[index]
      let animationDuration = atom.config.get('open-files.animationDuration')
      let that = this
      $(el).slideUp(animationDuration, () => {
        $(el).remove()
        that.pane.destroyItem(item);
        that.entries.splice(index, 1);
        return that.entries.map((entry) => that.updateTitle(entry.item));
      })
    }
  }

	// Returns an object that can be retrieved when package is activated
	serialize() {}

	// Tear down any state and detach
	destroy() {
		this.panelRootList.remove();
		return this.paneSub.dispose();
	}
}
