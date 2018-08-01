const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;

const symbols = 250;
const validateText = str => {
    return str.length < symbols;
};

const commentPostSchema = mongoose.Schema({
    author: { type: String, trim: true, default: "Bob", index: true },
    text: { type: String },
    created: { type: Date, default: Date.now },
    post: { type: ObjectId, index: true },
    photo: {
        type: String,
        trim: true,
        default:
            'http://res.cloudinary.com/durrhbfml/image/upload/v1532162181/sample.jpg'
    },
    photoId: { type: String, trim: true, default: 'sample' },
}, { versionKey: false });

//commentPostSchema.set('autoIndex', false);    <-в production мы отключаем создание авто индекса
module.exports = mongoose.model('Comment', commentPostSchema);
module.exports.createCommentPost = (newCommentPost, callback) => {
    newCommentPost.save(callback);
};