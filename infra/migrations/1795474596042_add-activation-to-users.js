exports.up = (pgm) => {
  pgm.alterColumn("users", "password", {
    type: "text",
  });

  pgm.addColumns("users", {
    active: {
      type: "boolean",
      notNull: true,
      default: false,
    },
    activation_token: {
      type: "varchar(255)",
      unique: true,
    },
  });
};

exports.down = false;
