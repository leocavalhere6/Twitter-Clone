exports.up = (pgm) => {
  pgm.addColumns("users", {
    role: {
      type: "varchar(32)",
      notNull: true,
      default: "user",
    },
    features: {
      type: "text[]",
      notNull: true,
      default: pgm.func("ARRAY['create:session', 'read:session']::text[]"),
    },
  });

  pgm.createTable("sessions", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    token: {
      type: "varchar(96)",
      notNull: true,
      unique: true,
    },
    user_id: {
      type: "uuid",
      notNull: true,
      references: "users(id)",
      onDelete: "cascade",
    },
    expires_at: {
      type: "timestamptz",
      notNull: true,
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },
  });

  pgm.createIndex("sessions", "user_id");
  pgm.createIndex("sessions", "expires_at");
};

exports.down = false;
