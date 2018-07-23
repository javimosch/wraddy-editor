new Vue({
	el: "#app",
	data: function() {
		return {
			filter: '',
			items: [],
			saveModal:false,
			clipboard: `This is a clipboard
		||`,
			clipboardEnabled:false,
			item: {
				_id: null,
				type: 'javascript',
				name: '',
				path: '',
				code: '',
				tags:''
			},
			project:'',
			treeInit:false,
			projectSelector:'',
			rawLogs:'',
			logsModal:false
		}
	},
	watch:{
		"project": function(v){
			if(v){
				window.localStorage.setItem('project', v)
			}
		}
	},
	methods: {
		async openLogsModal(){
			this.logsModal = true
			await httpPost(DROPLET_ADMIN_URI+'rpc/enableProjectLogs', {
					project: this.project
			},{
				withCredentials: false
			})
		},
		async mountTree(){
			let tree = await httpPost('/rpc/getTree', {
				project: this.project
			})
			let treeEl = $(this.$refs.tree)
			treeEl.off("changed.jstree").on("changed.jstree", async(e, data) =>{
				if(data.action === 'deselect_all'){
					return;
				}
				console.log(data)
				let f = await httpPost('/rpc/getFile', {
					_id: data.node.id
				})
				this.select(f)
			});
			console.log('MOUNTING TREE', this.project)
			if(!this.treeInit){
				treeEl.jstree({
					'core': {
						'data': [
							this.mapDirectoryTreeToJsTreeNode(tree)
						]
					}
				});
				this.treeInit=true
			}else{
				treeEl.jstree(true).settings.core.data = this.mapDirectoryTreeToJsTreeNode(tree);
				treeEl.jstree(true).refresh();
			}
			
		},
		async loadProjectFromCache(){
			var pr = window.localStorage.getItem('project')
			if(pr){
				this.project = pr
				await this.mountTree()
				this.projectSelector = this.project
			}
		},
		mapDirectoryTreeToJsTreeNode(item, index) {
			return {
				id: item._id,
				text: item.name,
				data: {
					name: item.name,
				},
				icon: item.type === 'file' ? "far fa-file-word" : undefined,
				state: {
					opened: item.opened ? item.opened : false,
					selected: false
				},
				children: (item.children || []).map((v,i)=>this.mapDirectoryTreeToJsTreeNode(v,i))
			}
		},
		async projectSelect(evt){
			var v = evt.target.value
			if(v === 'new'){
				window.location.href="/create-project"
			}
			if(v===''){
				return;
			}else{
				this.project = v
			}
			await this.mountTree()
		},
		togglePreview(){
			var htmlString=`<body>
				<script>
					${this.item.code}
				</script>
			</body>`.split(' ').join('')
			.replace(new RegExp(' ', 'g'), '')
			.replace(/(?:\r\n|\r|\n)/g, '')
			.replace(new RegExp(' ', 'g'), '')
			.split(' ').join('')
			var myIFrame = this.$refs.previewIframe
			myIFrame.src="javascript:'"+htmlString+"'";
		},
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
		openClipboard(){

		},
		newItem(msg) {
			var self = this;
			Object.keys(this.item).forEach(k => self.item[k] = '');
			this.item.type = 'javascript'
			this.editor.setValue(this.item.code, -1);
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
			this.filter = ''
			var self = this;
			if (this.item._id && this.item.code!=self.lastLoadedCode) {
				return this.save().then(() => {
					self.newItem();
					self.select(item);
				});
			}
			Object.assign(this.item, item);
			this.editor.setValue(this.item.code, -1);
			self.lastLoadedCode= this.item.code;
			this.closeSearchModal();
		},
		save() {
			return new Promise((resolve, reject) => {
				var self = this;
				var data = Object.assign({}, this.item)
				if(this.project){
					data.project=this.project
				}
				data.tags = data.tags instanceof Array ? data.tags : data.tags.trim().split(',')
				data.tags = data.tags.map(t=>t.trim())
				httpPost('/rpc/save-file', data).then(async r => {
					self.updateItems();
					await self.afterSave()
					new Noty({
						type: 'info',
						timeout: 2000,
						text: this.item.name + ' saved',
						killer: true,
						layout: "bottomRight"
					}).show();
					resolve();
					self.saveModal = false
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
		async afterSave(){
			await this.mountTree()
		},
		updateItems() {
			var self = this;
			httpPost('/rpc/fetch/', {
				type: ['vueComponent', 'javascript','route','middleware','view','markdown']
			}).then(data => {
				self.items = data;
			}).catch(console.warn);
		},
		closeSearchModal() {
			$(this.$refs.searchModal).removeClass('active');
			$(this.$refs.searchModal).toggle(false)
		},
		onEscapeCloseSearch(e) {
			if (e.keyCode == 27) {
				//this.closeSearchModal();
			}
		},
		onEscapeCloseModals(e){
			if (e.keyCode == 27) {
				//this.saveModal = false
			}	
		},
		bindOnEscapeCloseModals(){
			$(document).on('keyup',this.onEscapeCloseModals.bind(this));
		},
		bindOnEscapeCloseSearch() {
			$(document).on('keyup',this.onEscapeCloseSearch.bind(this));
		},
		onEscapeCloseSidebars(e){
			if (e.keyCode == 27) {

				if(this.logsModal){
					return this.logsModal =false
				}

				if($(this.$refs.searchModal).hasClass('active')){
					return this.closeSearchModal()
				}

				if(this.clipboardEnabled){
					return this.clipboardEnabled=false
				}

				if(this.saveModal){
					this.saveModal = false
					return;
				}

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
		$(document).off('keyup', this.onEscapeCloseModals);
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
			return `https://editor.wedev.org/resource/${this.item.type}/${this.item.name}?ext=js`
		},
		canSave() {
			return !!this.item.name && !!this.item.code && !!this.item.type
		}
	},
	mounted() {
		var self = this;
		self.bindOnEscapeCloseModals()
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
				$(self.$refs.searchModal).toggle(true).addClass('active');
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
					if(!self.saveModal){
						return self.saveModal = true;
					}
					self.save();
				}else{
					if(!self.item.name){
						self.saveModal = true;	
						self.$refs.name.focus()
					}else{
						self.saveModal = true;	
					}
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
		self.loadProjectFromCache()
	}
});