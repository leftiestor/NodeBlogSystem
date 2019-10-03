// user model

const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    name: { type: String, required: true },
    password:{ type: String, required: true },
    email: { type: String, required: false },
    img:{type: String, required: false },
    phone:{type: String, required: false },
    fans:[ Schema.Types.ObjectId ],
    cared:[ Schema.Types.ObjectId ],
    created: { type: Date }
});
UserSchema.plugin(mongoosePaginate);
/*UserSchema.methods.verifyPassword = function (password){
	let isMath = password === this.password;
	console.log("passport.local.verifyPassword",password,this.password,isMath);
	return isMath;
}*/
mongoose.model('User', UserSchema);

