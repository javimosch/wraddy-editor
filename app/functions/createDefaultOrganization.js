module.exports = app => async (user) => {
	user = await app.mongoose.model('cloud_user').findById(user._id).exec()
	if (user.organizations.length === 0) {

		var org = await createUniqueOrganization();
		org.users.push(user._id);
		org.userRights={
			[user._id]: 'owner'
		};
		await org.save();
		user.organizations.push(org);
		await user.save();
	} else {
		console.log('TRACE [user already has organization]', user.organizations)
	}

	function createUniqueOrganization() {
		var faker = app.require('faker');
		return new Promise(async (resolve, reject) => {
			var times = 100;
			create(null);
			function create(err) {
				var timeout = 0;
				if (err && err.stack.indexOf('E11000') !== -1) {
					times--;
					timeout = 500;
				}
				setTimeout(() => {
					var name = faker.company.companyName().trim()
					.split(' ').join('-')
					.split(',').join('-')
					.split('_').join('-')
					.split('--').join('-')
					.split('--').join('-')
					.split('--').join('-')
					.substring(0,15);
					app.mongoose.model('organization').create({
						name,
						users: []
					}).catch(create).then(resolve);
				}, timeout);
			}
			return;
			await app.mongoose.model('organization').remove({
				name: "noname"
			});
		});
	}
}