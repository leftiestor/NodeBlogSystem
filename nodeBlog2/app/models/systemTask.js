// systemTask model

const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const Schema = mongoose.Schema;

/*
 *系统管理员待处理任务和已处理任务
 * */

const systemTaskSchema = new Schema({
	content:{ type: String, required: false },  //任务内容
	desc : { type: String, required: false },  //任务描述
	type: { type: String, required: false },    //任务类型
	launchUser:{ type:Schema.Types.ObjectId, ref: 'User'},  //任务发起者
	taskUser:{ type:Schema.Types.ObjectId, ref: 'SysAdmin'},  //任务执行者
	status : { type: String, default: false },   //任务处理状态，默认未处理
	created : {type: Date },                      //任务发起时间
	finished : {type: Date } 					//任务完成时间
	 
});
systemTaskSchema.plugin(mongoosePaginate);
mongoose.model('SystemTask', systemTaskSchema);