new Vue({
	el: "#app",
	data: function() {
		return {
			filter: '',
			items: [],
			clipboard: `This is a clipboard
		||`,
			item: {
				_id: null,
				type: 'vueComponent',
				name: '',
				path: '',
				code: ''
			}
		}
	},
	methods: {
		toggleLeftSidebar(){
			if($(this.$refs.leftSidebar).hasClass('active')){
				$(this.$refs.leftSidebar).removeClass('active');
			}else{
				$(this.$refs.leftSidebar).addClass('active');
			}
		},
		toggleRightSidebar(){
			if($(this.$refs.rightSidebar).hasClass('active')){
				$(this.$refs.rightSidebar).removeClass('active');
			}else{
				$(this.$refs.rightSidebar).addClass('active');
			}
		},
		newItem(msg) {
			var self = this;
			Object.keys(this.item).forEach(k => self.item[k] = '');
			this.item.type = 'vueComponent'
			this.editor.setValue(this.item.code);
			new Noty({
				type: 'warning',
				timeout: 1000,
				text: typeof msg==='string'?msg:'Blank file!',
				killer: false,
				layout: "bottomLeft"
			}).show();
		},
		loadClipBoard() {
			this.clipboard = window.localStorage.getItem('simback_clipboard') || '||';
		},
		saveClipboard() {
			window.localStorage.setItem('simback_clipboard', this.clipboard);
		},
		saveAndNewItem() {
			var self = this;
			if (this.item._id) {
				return this.save().then(() => {
					self.newItem();
				});
			} else {
				self.newItem()
			}
		},
		select(item) {
			var self = this;
			if (this.item._id && this.item.code!=self.lastLoadedCode) {
				return this.save().then(() => {
					self.newItem();
					self.select(item);
				});
			}
			Object.assign(this.item, item);
			this.editor.setValue(this.item.code);
			self.lastLoadedCode= this.item.code;
			this.closeSearchModal();
		},
		save() {
			return new Promise((resolve, reject) => {
				var self = this;
				httpPost('/rpc/save-file', this.item).then(r => {
					self.updateItems();

					new Noty({
						type: 'info',
						timeout: 2000,
						text: this.item.name + ' saved',
						killer: true,
						layout: "bottomRight"
					}).show();
					resolve();
					console.info(r);
				}).catch(err => {

					console.warn(err);
					new Noty({
						type: 'warning',
						timeout: 2000,
						text: this.item.name + ' not saved',
						killer: true,
						layout: "bottomRight"
					}).show();
					reject();

				});
			})
		},
		updateItems() {
			var self = this;
			httpPost('/rpc/fetch/', {
				type: ['vueComponent', 'javascript']
			}).then(data => {
				self.items = data;
			}).catch(console.warn);
		},
		closeSearchModal() {
			$(this.$refs.searchModal).removeClass('active');
		},
		onEscapeCloseSearch(e) {
			if (e.keyCode == 27) {
				this.closeSearchModal();
			}
		},
		bindOnEscapeCloseSearch() {
			$(document).on('keyup',this.onEscapeCloseSearch.bind(this));
		},
		onEscapeCloseSidebars(e){
			if (e.keyCode == 27) {
				if($(this.$refs.leftSidebar).hasClass('active')){
					$(this.$refs.leftSidebar).removeClass('active')
				}
				if($(this.$refs.rightSidebar).hasClass('active')){
					$(this.$refs.rightSidebar).removeClass('active')
				}
			}
		},
		bindOnEscapeCloseSidebars(){
			$(document).on('keyup',this.onEscapeCloseSidebars.bind(this));	
		}
	},
	destroyed() {
		$(document).off('keyup', this.onEscapeCloseSearch);
		$(document).off('keyup', this.onEscapeCloseSidebars);
	},
	computed: {
		filteredItems() {
			if(!this.filter){
				return this.items;
			}else{
				var byName = !!this.filter ? this.items.filter(i => i.name.indexOf(this.filter) !== -1) : this.items;
				var byType = !!this.filter ? this.items.filter(i => i.type.indexOf(this.filter) !== -1) : this.items;
				return _.uniqBy([].concat(byName).concat(byType), function (e) {
				  return e.name;
				});
			}
		},
		resourceUrl() {
			return `https://simback.herokuapp.com/resource/${this.item.type}/${this.item.name}?ext=js`
		},
		canSave() {
			return !!this.item.name && !!this.item.code && !!this.item.type
		}
	},
	mounted() {
		var self = this;
		self.bindOnEscapeCloseSearch();
		self.bindOnEscapeCloseSidebars();
		editor = self.editor = ace.edit("editor");
		editor.setTheme("ace/theme/monokai");
		editor.session.setMode('ace/mode/javascript');
		editor.session.setOptions({
			wrap: true,
			tabSize: 4,
			useSoftTabs: false
		});
		editor.setOptions({
			enableLiveAutocompletion: true,
			fontSize: "10pt",
			showPrintMargin: false
		});

		editor.commands.addCommand({
			name: 'open',
			bindKey: {
				win: 'Alt-Shift-O',
				mac: 'Command-Shift-O'
			},
			exec: function(editor) {
				$(self.$refs.searchModal).addClass('active');
				self.$refs.searchInput.focus();
				self.updateItems();
			},
			readOnly: false
		});
		
		editor.commands.addCommand({
			name: 'toggleRightSidebar',
			bindKey: {
				win: 'Alt-Shift-P',
				mac: 'Command-Shift-P'
			},
			exec: function(editor) {
				self.toggleRightSidebar();
			},
			readOnly: false
		});
		editor.commands.addCommand({
			name: 'toggleLeftSidebar',
			bindKey: {
				win: 'Alt-Shift-L',
				mac: 'Command-Shift-L'
			},
			exec: function(editor) {
				self.toggleLeftSidebar();
			},
			readOnly: false
		});
		editor.commands.addCommand({
			name: 'new',
			bindKey: {
				win: 'Alt-Shift-K',
				mac: 'Command-Shift-K'
			},
			exec: function(editor) {
				self.saveAndNewItem();
			},
			readOnly: false
		});
		editor.commands.addCommand({
			name: 'cancel',
			bindKey: {
				win: 'Alt-Shift-X',
				mac: 'Command-Shift-X'
			},
			exec: function(editor) {
				self.newItem(self.item._id?'Cancel!':undefined);
			},
			readOnly: false
		});
		editor.commands.addCommand({
			name: 'save',
			bindKey: {
				win: 'Alt-Shift-S',
				mac: 'Command-Shift-S'
			},
			exec: function(editor) {
				if (self.canSave) {
					self.save();
				}
			},
			readOnly: false
		});
		editor.commands.addCommand({
			name: 'beautify',
			bindKey: {
				win: 'Ctrl-B',
				mac: 'Command-B'
			},
			exec: function(editor) {
				beautifyAceEditor(editor)
			},
			readOnly: false
		});
		editor.on("change", data => self.item.code = editor.getValue())
		self.updateItems();
		self.loadClipBoard();
	}
});