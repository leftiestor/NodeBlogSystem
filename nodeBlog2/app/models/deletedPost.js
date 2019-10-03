// deletedpost model

const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const Schema = mongoose.Schema;

const deletedPostSchema = new Schema({
  title: { type: String, required: true },
  content: { type: String },
  slug: { type: String },
  category: { type:Schema.Types.ObjectId, ref: 'Category'},
  tag : [ String ],
  author: { type:Schema.Types.ObjectId, ref: 'User'},
  published: { type:Boolean, default: false},   //是否发布，默认不发布
  meta : { type: Schema.Types.Mixed },   //clicks点击量 favorites喜欢 dislikes不喜欢
  comments: [ Schema.Types.ObjectId ],
  recycled:{ type:Boolean, default: false},   //是否被回收，默认没有被回收
  created : {type: Date },
  updated: {type: Date }     //最近一次修改时间
});
deletedPostSchema.plugin(mongoosePaginate);
mongoose.model('DeletedPost', deletedPostSchema);