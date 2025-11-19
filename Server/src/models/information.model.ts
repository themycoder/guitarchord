import mongoose, { Schema, Document, Model } from "mongoose";

/** ---------------------------------------------
 * Block types (frontend renders these)
 * ----------------------------------------------*/
export type BlockType =
  | "heading"
  | "paragraph"
  | "list"
  | "image"
  | "chord"
  | "code"
  | "callout"
  | "quote"
  | "divider"
  | "columns";

/** Base block (flexible `props` to keep UI extensible) */
export interface IBlock {
  type: BlockType;
  // Keep it generic; the Admin builder is responsible for validating shape
  props?: Record<string, any>;
  id?: string; // optional stable id to help client diff
}

/** ---------------------------------------------
 * Theory Article
 * ----------------------------------------------*/
export interface ITheoryArticle extends Document {
  title: string;
  slug: string;
  excerpt?: string;
  cover?: string;
  tags: string[];
  status: "draft" | "published" | "archived";
  authorId?: string; // your user _id or external id
  blocks: IBlock[];
  // SEO / meta
  meta?: {
    description?: string;
    keywords?: string[];
  };
  // housekeeping
  createdAt: Date;
  updatedAt: Date;
}

const BlockSchema = new Schema<IBlock>(
  {
    type: {
      type: String,
      required: true,
      enum: [
        "heading",
        "paragraph",
        "list",
        "image",
        "chord",
        "code",
        "callout",
        "quote",
        "divider",
        "columns",
      ],
      index: true,
    },
    props: { type: Schema.Types.Mixed }, // flexible, supports any block props
    id: { type: String },
  },
  { _id: false } // blocks are embedded; no separate ObjectId needed
);

const TheoryArticleSchema = new Schema<ITheoryArticle>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    excerpt: { type: String, maxlength: 500 },
    cover: { type: String },
    tags: { type: [String], default: [], index: true },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      index: true,
    },
    authorId: { type: String },
    blocks: { type: [BlockSchema], default: [] },
    meta: {
      description: { type: String, maxlength: 300 },
      keywords: { type: [String], default: [] },
    },
  },
  {
    timestamps: true, // adds createdAt, updatedAt
    versionKey: false,
  }
);

/** ---------------------------------------------
 * Helpers: slugify + pre-save
 * ----------------------------------------------*/
function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-9\s-]/g, "") // keep safe chars
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 80);
}

TheoryArticleSchema.pre("validate", function (next) {
  if (!this.slug && this.title) {
    this.slug = slugify(this.title);
  }
  next();
});

/** Optional: prevent duplicate slugs on title clashes by appending suffix */
TheoryArticleSchema.pre("save", async function (next) {
  if (!this.isModified("slug")) return next();

  const Model = mongoose.model<ITheoryArticle>("TheoryArticle");
  let base = this.slug;
  let candidate = base;
  let i = 2;

  while (await Model.exists({ slug: candidate, _id: { $ne: this._id } })) {
    candidate = `${base}-${i++}`;
  }
  this.slug = candidate;
  next();
});

export const TheoryArticle: Model<ITheoryArticle> =
  mongoose.models.TheoryArticle ||
  mongoose.model<ITheoryArticle>("TheoryArticle", TheoryArticleSchema);
