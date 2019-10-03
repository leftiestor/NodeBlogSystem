// category model

const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const Schema = mongoose.Schema;

const CategorySchema = new Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true},
  creator: { type:Schema.Types.ObjectId },  //创建者
  created: {type: Date }
});

CategorySchema.plugin(mongoosePaginate);
mongoose.model('Category', CategorySchema);

