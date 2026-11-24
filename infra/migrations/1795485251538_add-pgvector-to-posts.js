exports.up = (pgm) => {
  pgm.sql("CREATE EXTENSION IF NOT EXISTS vector;");
  pgm.sql("ALTER TABLE posts ADD COLUMN IF NOT EXISTS embedding vector(768);");
  pgm.sql("DROP INDEX IF EXISTS posts_embedding_idx;");
  pgm.sql(
    "CREATE INDEX IF NOT EXISTS posts_embedding_hnsw_idx ON posts USING hnsw (embedding vector_cosine_ops);",
  );
};

exports.down = false;
