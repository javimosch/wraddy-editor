Vue.component('treeNode', {
	props: ['node','opened','mainNode'],
	template: `<div v-show="!!node && !!node.text">
		<div ref="style"></div>
		
		<label  @click="textClick()">
			<i :class="node.icon"></i>
			<span v-html="node.text"></span>
		</label>
		
		<div class="nodeChild"  v-for="node in node.nodes" v-show="isOpened">
			<tree-node :node="node" :opened="false" @nodeClick="nodeClick"></tree-node>
		</div>
		
	</div>`,
	data() {
		return {
			isOpened: this.opened===undefined?true:false,
			style: `
		.nodeChild{
			margin-left: 5px;	
		}`
		};
	},
	methods:{
		nodeClick(node){
			this.$emit('nodeClick', node);
		},
		textClick(){
			this.isOpened=!this.isOpened;
			this.$emit('nodeClick', this.node);
		}
	},
	computed:{
		isMainNode:function(){
			return this.mainNode===undefined?false:this.mainNode;
		}	
	},
	watch:{
		node(){
			
		}
	},
	created() {
	},
	mounted() {
		const styl = document.createElement('style')
		styl.setAttribute('scoped', '');
		const txtNode = document.createTextNode(this.style)
		styl.append(txtNode)
		this.$refs.style.replaceWith(styl)

	}
});

Vue.component('tree', {
	template: `<div>
		<tree-node :node="mainNode" :mainNode="true" @nodeClick="nodeClick"></tree-node>		
	</div>`,
	data() {
		return {
			mainNode: {}
		};
	},
	methods:{
		nodeClick(node){
			this.$emit('nodeclick',node);
		}
	},
	created() {
		ba.fs.custom({
			type: 'tree',
			path: 'misitioba'
		}).then(res => {
			if (!res.err) {
				this.mainNode = res.result[0];
			}
		});
	},
	mounted() {

	}
});