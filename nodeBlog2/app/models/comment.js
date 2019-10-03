// comment model

const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const Schema = mongoose.Schema;

const CommentSchema = new Schema({
    content: { type: String, required: true },  //评论内容
    user:{ type: Schema.Types.ObjectId, required: true },
    userName: { type: String, required: true },
    belong: {type: Schema.Types.ObjectId, required: true },
    meta:{ type: Schema.Types.Mixed },   // likes支持 dislikes反对
    created: { type: Date }
});
CommentSchema.plugin(mongoosePaginate);
mongoose.model('Comment', CommentSchema);