// Article model

const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const Schema = mongoose.Schema;

const ArticleSchema = new Schema({
  title: String,
  url: String,
  text: String
});

// ArticleSchema.virtual('date')
// //   .get(() => this._id.getTimestamp());
ArticleSchema.plugin(mongoosePaginate);
mongoose.model('Article', ArticleSchema);

