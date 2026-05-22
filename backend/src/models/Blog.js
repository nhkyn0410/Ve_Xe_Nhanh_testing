const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Tiêu đề bài viết là bắt buộc'],
      trim: true,
      maxlength: [200, 'Tiêu đề không được quá 200 ký tự'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    excerpt: {
      type: String,
      required: [true, 'Tóm tắt bài viết là bắt buộc'],
      trim: true,
      maxlength: [500, 'Tóm tắt không được quá 500 ký tự'],
    },
    content: {
      type: String,
      required: [true, 'Nội dung bài viết là bắt buộc'],
    },
    featuredImage: {
      type: String,
      required: [true, 'Ảnh đại diện là bắt buộc'],
    },
    category: {
      type: String,
      enum: ['news', 'guide', 'promotion', 'travel_tips', 'company', 'other'],
      default: 'news',
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
    },
    publishedAt: {
      type: Date,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    likeCount: {
      type: Number,
      default: 0,
    },
    // SEO fields
    metaTitle: {
      type: String,
      trim: true,
      maxlength: [60, 'Meta title không được quá 60 ký tự'],
    },
    metaDescription: {
      type: String,
      trim: true,
      maxlength: [160, 'Meta description không được quá 160 ký tự'],
    },
    metaKeywords: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        const sanitizedRet = { ...ret };
        Reflect.deleteProperty(sanitizedRet, '__v');
        return sanitizedRet;
      },
    },
    toObject: { virtuals: true },
  }
);

// Indexes (slug already has unique: true in schema, which creates an index)
blogSchema.index({ status: 1, publishedAt: -1 });
blogSchema.index({ category: 1 });
blogSchema.index({ tags: 1 });
blogSchema.index({ author: 1 });
blogSchema.index({ title: 'text', excerpt: 'text', content: 'text' });

// Auto-generate slug from title before saving
blogSchema.pre('save', function (next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  // Set publishedAt when status changes to published
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = Date.now();
  }

  next();
});

// Instance method - increment view count
blogSchema.methods.incrementView = function () {
  this.viewCount += 1;
  return this.save({ validateBeforeSave: false });
};

// Instance method - increment like count
blogSchema.methods.incrementLike = function () {
  this.likeCount += 1;
  return this.save({ validateBeforeSave: false });
};

// Instance method - decrement like count
blogSchema.methods.decrementLike = function () {
  if (this.likeCount > 0) {
    this.likeCount -= 1;
    return this.save({ validateBeforeSave: false });
  }
};

// Static method - get published blogs
blogSchema.statics.getPublished = function (filters = {}) {
  return this.find({
    status: 'published',
    publishedAt: { $lte: Date.now() },
    ...filters,
  }).sort({ publishedAt: -1 });
};

const Blog = mongoose.model('Blog', blogSchema);

module.exports = Blog;
