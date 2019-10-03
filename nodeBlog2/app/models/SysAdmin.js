// sysAdmin model

const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const Schema = mongoose.Schema;

const SysAdminSchema = new Schema({
    name: { type: String, required: true },
    password:{ type: String, required: true },
    email: { type: String, required: false },
    img:{type: String, required: false },
    created: { type: Date }
});
SysAdminSchema.plugin(mongoosePaginate);
mongoose.model('Sysadmin', SysAdminSchema);
