const mongoose = require('mongoose');
const lifecycle = require('mongoose-lifecycle');
const Comment = require('./commentsModel');
const ObjectId = mongoose.Schema.Types.ObjectId;

const blogPostSchema = mongoose.Schema({
    author: { type: String, trim: true, default: "John", index: true },
    text: { type: String },
    created: { type: Date, default: Date.now },
    photo: {
        type: String,
        trim: true,
        default:
            'http://res.cloudinary.com/durrhbfml/image/upload/v1532162181/sample.jpg'
    },
    photoId: { type: String, trim: true, default: 'sample' }
}, { versionKey: false });

blogPostSchema.statics.findComments = function (id, callback) {
    return Comment.find({ post: id }, callback);
};

blogPostSchema.plugin(lifecycle);

module.exports = mongoose.model('Post', blogPostSchema);
module.exports.createBlogPost = (newBlogPost, callback) => {
    newBlogPost.save(callback);
};