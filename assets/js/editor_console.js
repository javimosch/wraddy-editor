window.showConsole = showConsole

function showConsole() {
	if (window.ConsoleWindow) {
		showw()
		/*
		try {
		    window.ConsoleWindow.$destroy();
		    $('#ConsoleWindow').remove();
		} catch (err) {}
		*/
	} else {
		console.warn('ASD')
		$('body').prepend($('<div id="ConsoleWindow"></div>').html(window.atob(window.server.consoleTemplate)))
	}
	window.ConsoleWindow = new Vue({
		name:'console',
		el: "#ConsoleWindow",
		data() {
			return {
				text:'',
				show:true
			}
		},
		mounted() {
			var vm = this

			window.showw = ()=>{
				vm.show = true
				vm.$forceUpdate()
			}
			window.addToConsole = (str)=> {
				vm.text = vm.text + '&#13;&#10;'+str;
				console.log('adding to console')
			}

			$(document).on('keyup', function(e) {
				if (e.keyCode === 27) {
					vm.show=false
				}
			});
		}
	})
}